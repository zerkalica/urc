import {mem} from '../decorators'

import $ from 'mol_atom2_all'

function createFiber(calculate: () => void, index: number, prevName?: string): $.$mol_fiber {
    const fiber = new $.$mol_fiber
    const current = $.$mol_fiber.current
    fiber.calculate = calculate
    fiber[Symbol.toStringTag] = prevName || (index + ':/' + ((current && current[Symbol.toStringTag]) || calculate.name))
    
    return fiber
}

export class Queue extends $.$mol_object2 {
    @mem tasks: $.$mol_fiber[] = []

    run(calculate: () => void): void {
        this.tasks = [...this.tasks, createFiber(calculate, this.tasks.length)]
    }

    /**
        @return PromiseLike if pending, undefined if complete, if Error error
     */
    get locked(): Error | PromiseLike<any> | void {
        if (this.tasks.length === 0) return

        const task = this.tasks[0]
        try {
            task.get()
            this.tasks = this.tasks.slice(1)
        } catch (error) {
            // Recreate fiber for future retry
            if (task.error && !('then' in task.error)) this.tasks[0] = createFiber(task.calculate, 0, task[Symbol.toStringTag])
            return error
        }
    }

    destructor() {
        super.destructor()
        const {tasks} = this
        for (let task of tasks) task.destructor()
        this.tasks = []
    }
}
