import {TodoRepository} from './models'
import * as React from 'react'

import {TodoItem} from './TodoItem'
import {observer, sheet} from '../common'

const css = sheet({
    todoList: {
        margin: 0,
        padding: 0,
        listStyle: 'none'
    }
})

export interface TodoMainProps {
    id: string
    _: {
        todoRepository: TodoRepository
    }
}

@observer
export class TodoMain extends React.Component<TodoMainProps> {
    render() {
        const {
            props: {
                id,
                _: {
                    todoRepository: {filteredTodos}
                }
            }
        } = this

        if (!filteredTodos.length) return null

        return (
            <ul id={id} className={css.todoList}>
                {filteredTodos.map(todo => (
                    <TodoItem
                        id={`${id}-todo(${todo.id})`}
                        key={todo.id}
                        todo={todo}
                    />
                ))}
            </ul>
        )
    }
}
