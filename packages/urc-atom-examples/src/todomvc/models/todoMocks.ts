import {uuid, ModelStorage} from '../../common'

type ITodo = any

function getBody(body: (string | Object) | void): any {
    return typeof body === 'string'
        ? JSON.parse(body)
        : ((body || {}) as any)
}

function sortByDate(el1: ITodo, el2: ITodo): number {
    if (!el2.created || el1.created) {
        return 0
    }

    if (String(el1.created) > String(el2.created)) {
        return 1
    }
    if (String(el1.created) < String(el2.created)) {
        return -1
    }
    return 0
}

export function todoMocks(rawStorage: Storage) {
    const defaultTodos: ITodo[] = [
        {
            id: uuid(),
            title: 'test todo #1',
            completed: false,
            created: new Date()
        },
        {
            id: uuid(),
            title: 'test todo #2',
            completed: true,
            created: new Date()
        }
    ]
    const todoStorage = new ModelStorage(rawStorage, 'TodoMocks.todos', defaultTodos)

    return [
        {
            method: 'GET',
            matcher: new RegExp('/api/todos'),
            response(url: string, params: RequestInit) {
                return todoStorage.get().sort(sortByDate)
            }
        },
        {
            method: 'PUT',
            matcher: new RegExp('/api/todos'),
            response(url: string, params: RequestInit) {
                const updates: Map<string, Partial<ITodo>> = new Map(getBody(params.body))
                const newTodos = todoStorage.get()
                    .map(todo => {
                        return {...todo, ...updates.get(todo.id)} as ITodo
                    })
                    .sort(sortByDate)
                todoStorage.set(newTodos)

                return newTodos
            }
        },
        {
            method: 'DELETE',
            matcher: new RegExp('/api/todos'),
            response(url: string, params: RequestInit) {
                const ids: string[] = getBody(params.body)
                const newTodos = todoStorage.get().filter(todo =>
                    ids.indexOf(todo.id) === -1
                )
                todoStorage.set(newTodos)

                return newTodos.map(({id}) => id)
            }
        },
        {
            method: 'DELETE',
            matcher: new RegExp('/api/todo/(.*)'),
            response(url: string, params: RequestInit, id: string) {
                const newTodos = todoStorage.get().filter(todo => todo.id !== id)
                todoStorage.set(newTodos.sort(sortByDate))

                return {id}
            }
        },
        {
            method: 'POST',
            matcher: new RegExp('/api/todo/(.*)'),
            response(url: string, params: RequestInit, id: string) {
                const newTodo = getBody(params.body)
                const newTodos = todoStorage.get().map(todo => (todo.id === id ? newTodo : todo))
                todoStorage.set(newTodos)

                return newTodo
            }
        },
        {
            method: 'PUT',
            matcher: new RegExp('/api/todo'),
            response(url: string, params: RequestInit) {
                const body = getBody(params.body)
                const id = uuid()

                const newTodo: ITodo = {
                    ...body,
                    id,
                    created: String(new Date())
                }
                todoStorage.set([...todoStorage.get(), newTodo])
                return newTodo
            }
        }
    ]
}
