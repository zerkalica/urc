import {IReactAtom, IReactHost} from 'urc'
import $ from 'mol_atom2_all'
const Atom = $.$mol_atom2
const Fiber = $.$mol_fiber

function $mol_conform(a, b) { return a }

export const enum MolAtomStatus {
    READY = 0,
    PROPS_CHANGED = 1,
    FORCE_UPDATE = 2,
}

const new$ = Object.create(Atom.$)
new$.$mol_conform = $mol_conform

export class MolReactAtom<ReactNode> extends Atom<ReactNode>
    implements IReactAtom<ReactNode> {
        /**
         * Disable $mol_conform in context. Do not need to reconcile vdom node.
         * Some fields in node are read only, $mol_conform impact perfomance.
         */
        static $ = new$
        constructor(id: string, protected reactHost: IReactHost<ReactNode>) {
        super()
        this[Symbol.toStringTag] = id
        this.calculate = this.calc
        // Each react component atom - autorunned separate unit.
        this.obsolete_slaves = this.schedule
        this.doubt_slaves = this.schedule
    }

    protected status: MolAtomStatus = MolAtomStatus.PROPS_CHANGED

    /**
     * Called on componentDidUpdate. Used to detect if props or react component state changed.
     * Obsolete fiber and set propsChanged flag to prevent running forceUpdate
     * in last (after componentdidUpdate) render call.
     */
    reset(): void {
        // forceUpdate can call componentDidUpdate - this is not props or state changes, exiting.
        if (this.status === MolAtomStatus.FORCE_UPDATE) return
        this.cursor = $.$mol_fiber_status.obsolete
        this.status = MolAtomStatus.PROPS_CHANGED
    }

    calc(): ReactNode {
        return this.reactHost.__value()
    }

    protected forceUpdate<V>(value: V): V {
        // if changed via props/state do not run forceUpdate
        if (this.status === MolAtomStatus.PROPS_CHANGED) {
            this.status = MolAtomStatus.READY
            return value
        }

        try {
            this.status = MolAtomStatus.FORCE_UPDATE
            // forceUpdate can call render on any component. Disable slave -> master relations.
            Fiber.current = undefined
            this.reactHost.forceUpdate()
        } catch (error) {
            if (!this.error) super.fail(error)
        }
        this.status = MolAtomStatus.READY

        return value
    }

    get() {
        // After atom actualization forceUpdate can call render on itself. Just return state.
        if (this.status === MolAtomStatus.FORCE_UPDATE) {
            if (this.error) throw this.error

            return this.value
        }

        return super.get()
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
