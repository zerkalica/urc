import {IReactAtom, IReactHost} from 'urc'
import $ from 'mol_atom2_all'
const Atom = $.$mol_atom2
const Fiber = $.$mol_fiber

export class MolReactAtom<ReactNode> extends Atom<ReactNode>
    implements IReactAtom<ReactNode> {

        constructor(id: string, protected reactHost: IReactHost<ReactNode>) {
        super()
        this.$ = {...this.$, $mol_conform(a, b) { return a} }

        this[Symbol.toStringTag] = id
        this.calculate = this.calc
        // Each react component atom - autorunned separate unit.
        this.obsolete_slaves = this.schedule
        this.doubt_slaves = this.schedule
    }

    protected propsChanged = true

    /**
     * Called on componentDidUpdate.
     * Obsolete fiber and set propsChanged flag to prevent running forceUpdate
     * in last (after componentdidUpdate) render call.
     */
    reset(): void {
        this.cursor = $.$mol_fiber_status.obsolete
        this.propsChanged = true
    }

    calc(): ReactNode {
        return this.reactHost.__value()
    }

    protected inForceUpdate: boolean = false
    protected forceUpdate<V>(value: V): V {
        const {propsChanged} = this
        this.propsChanged = false
        // if changed via componentDidUpdate do not run forceUpdate
        if (propsChanged) return value
        try {
            // forceUpdate can call render and get atom value again. If error - ignore it already stored in atom.

            // Nulling Fiber.current needed, atom value can access slave.master and obey to itself
            Fiber.current = null
            this.inForceUpdate = true
            this.reactHost.forceUpdate()
        } catch (error) {
            if (!this.error) super.fail(error)
        }
        this.inForceUpdate = false

        return value
    }

    get() {
        if (this.inForceUpdate && this.error) throw this.error

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
