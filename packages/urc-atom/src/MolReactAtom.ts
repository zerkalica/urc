import {IReactAtom, IReactHost} from 'urc'
import $ from 'mol_atom2_all'

const {
    $mol_fiber,
} = $

function $mol_conform<Target, Source>(a: Target, b: Source) { return a }

export class MolReactAtom<ReactNode> extends $.$mol_atom2<ReactNode> implements IReactAtom<ReactNode> {

    /**
     * Disable $mol_conform in context. Do not need to reconcile vdom node.
     * Some fields in node are read only, $mol_conform impact perfomance.
     */
    static $ = $.$mol_ambient({$mol_conform})

    constructor(id: string, protected reactHost: IReactHost<ReactNode>) {
        super()
        this[Symbol.toStringTag] = id
        this.calculate = this.calc
    }

    obsolete_slaves() {
        this.schedule()
    }

    protected static transaction_count = 0

    doubt_slaves() {
        if (MolReactAtom.transaction_count > 0) return
        return this.schedule()
    }

    sync_begin() {
        if (MolReactAtom.transaction_count++ > 0) return
        $mol_fiber.deadline = Number.POSITIVE_INFINITY
    }

    sync_end() {
        if (--MolReactAtom.transaction_count > 0) return

        this.forceUpdate()
        $mol_fiber.deadline = 0
    }

    protected rendering = false

    /**
     * Called on componentDidUpdate. Used to detect if props or react component state changed.
     * Obsolete fiber and set propsChanged flag to prevent running forceUpdate
     * in last (after componentdidUpdate) render call.
     */
    reset(): void {
        // forceUpdate can call componentDidUpdate - this is not props or state changes, exiting.
        if (this.rendering) return
        this.cursor = $.$mol_fiber_status.obsolete
    }

    calc(): ReactNode {
        return this.reactHost.__value()
    }

    protected forceUpdate<V>(value?: V): V {
        // if changed via props/state do not run forceUpdate
        if (this.rendering) return value

        try {
            this.rendering = true
            // forceUpdate can call render on any component. Disable slave -> master relations.
            $mol_fiber.current = undefined
            this.reactHost.forceUpdate()
        } catch (error) {
            if (!this.error) super.fail(error)
        }
        this.rendering = false

        return value
    }

    render() {
        if (this.rendering) {
            if (this.error) throw this.error
            return this.value
        }
        this.rendering = true
        try {
            return this.get()
        } finally {
            this.rendering = false
        }
    }

    push(next: ReactNode): ReactNode {
        return this.forceUpdate(super.push(next))
    }

    fail(error: Error): Error {
        return this.forceUpdate(super.fail(error))
    }

    wait(promise: PromiseLike<ReactNode>): PromiseLike<ReactNode> {
        return this.forceUpdate(super.wait(promise))
    }
}
