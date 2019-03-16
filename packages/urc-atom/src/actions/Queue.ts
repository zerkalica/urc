import {mem, fail, defer} from '../decorators'

import $ from 'mol_atom2_all'

function createFiber(calculate: () => void): $.$mol_fiber {
    const fiber = new $.$mol_fiber()
    fiber.calculate = calculate
    fiber[Symbol.toStringTag] = calculate.name

    return fiber
}
export interface Refreshable {
    refresh: () => void
}

const refreshKey = Symbol('$mol_queue.refresh')
function setRefresh(error: Error, refreshable: Refreshable) {
    if (error[refreshKey]) return

    error[refreshKey] = refreshable
}

export function getRefresh(error: Error): Refreshable | void {
    return error[refreshKey]
}

export class Queue extends $.$mol_object2 implements Refreshable {
    protected tasks: $.$mol_fiber[] = []

    /**
        PromiseLike if pending, undefined if complete, if Error error
     */
    @mem locked: Error | PromiseLike<any> | void

    constructor(id?: string) {
        super()
        this[Symbol.toStringTag] = id || this.constructor.name
        this.processing = this.processing.bind(this)
        this.refresh = this.refresh.bind(this)
        Object.defineProperty(this.processing, 'name', {value: this[Symbol.toStringTag] + '.processing'})
    }

    run(calculate: () => void): void {
        const current = $.$mol_fiber.current
        if (!calculate.name && current)
            Object.defineProperty(calculate, 'name', {
                value: current[Symbol.toStringTag] + '#task'
            })

        this.tasks.push(createFiber(calculate))
        this.refresh()
    }

    get pending(): boolean {
        const {locked} = this
        return locked && !(locked instanceof Error)
    }

    get error(): Error | undefined {
        const {locked} = this
        return locked instanceof Error ? locked : undefined
    }

    get complete(): boolean {
        return !this.locked
    }

    protected scheduled = false

    refresh() {
        if (this.tasks.length === 0) return
        if (this.scheduled) return
        this.scheduled = true

        // Recreate completed fiber if refresh called from error
        this.tasks[0] = createFiber(this.tasks[0].calculate)
        defer(this.processing)
    }

    processing(): void {
        if (this.tasks.length === 0) return
        const task = this.tasks[0]

        try {
            task.get()
            this.tasks = this.tasks.slice(1)
            if (this.tasks.length === 0) this.locked = undefined
            this.scheduled = false
            this.refresh()
        } catch (error) {
            if (task.cursor === $.$mol_fiber_status.actual) {
                this.scheduled = false
                setRefresh(error, this)
            }
            this.locked = error
            fail(error)
        }
    }

    destructor() {
        const {tasks} = this
        super.destructor()
        for (let task of tasks) task.destructor()
        this.tasks = []
        this.scheduled = false
    }
}
