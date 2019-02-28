import {mem, action} from 'urc-atom'
import {uuid} from '../../common'

export interface ITodoRepository {
    updating(todo: Todo): boolean
    updateDisabled(todo: Todo): boolean
    update(todo: Todo): void

    removeDisabled(todo: Todo): boolean
    remove(todo: Todo): void

    create(todo: Todo): void
}

export interface ITodo {
    readonly id: string
    readonly title: string
    readonly completed: boolean
    readonly created: Date
}

export interface ITodoInfo {
    id: string
    description: string
}

export interface TodoContext {
    todoRepository: ITodoRepository
}

export class Todo implements ITodo {
    readonly id: string = uuid()
    readonly completed: boolean = false
    readonly title: string = ''
    readonly created: Date = new Date()

    protected _: TodoContext

    constructor(props: Partial<Todo> & {_: TodoContext}) {
        Object.assign(this, props)
        this[Symbol.toStringTag] = `${this._.todoRepository}.todo(${this.id})`

        // Hide context from JSON.stringify
        Object.defineProperties(this, {
            _: {value: props._, enumerable: false}
        })
    }

    copy(data?: Partial<Todo> | void): Todo {
        return data
            ? new Todo({...(this as Partial<Todo>), ...data, _: this._})
            : this
    }

    create() {
        this._.todoRepository.create(this)
    }

    get updating(): boolean {
        return this._.todoRepository.updating(this)
    }

    get updateDisabled(): boolean {
        return this._.todoRepository.updateDisabled(this)
    }

    get removeDisabled(): boolean {
        return this._.todoRepository.removeDisabled(this)
    }

    update(data?: Partial<Todo>) {
        this._.todoRepository.update(this.copy(data))
    }

    remove() {
        this._.todoRepository.remove(this)
    }
}
