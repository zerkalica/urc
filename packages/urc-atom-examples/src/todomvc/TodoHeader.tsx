import * as React from 'react'
import {action, mem} from 'urc-atom'
import {TodoRepository} from './models'
import {observer, sheet, Deps} from '../common'

class TodoToAdd {
    @mem title: string

    protected _: {
        todoRepository: TodoRepository
    }

    constructor(opts: {
        id: string
        _: {
            todoRepository: TodoRepository
        }
    }) {
        this[Symbol.toStringTag] = opts.id
        this._ = opts._
        this.title = ''
    }

    @action.defer
    setRef(ref: HTMLInputElement | void) {
        if (ref) ref.focus()
    }

    @action.sync
    setTitle({target}: React.ChangeEvent<HTMLInputElement>) {
        this.title = target.value
    }

    @action
    submit(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.keyCode === 13 && this.title) {
            this._.todoRepository.create({title: this.title})
            this.title = ''
        }
    }
}

const css = sheet({
    header: {
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'flex-start'
    },
    toggleAll: {
        outline: 'none',
        width: '52px',
        height: '34px',
        display: 'block',
        lineHeight: '1.4em',
        textAlign: 'center',
        cursor: 'pointer',
        marginRight: '-52px',
        marginLeft: 0,
        zIndex: 100,
        background: 'white'
    },
    newTodo: {
        width: '100%',
        fontSize: '24px',
        lineHeight: '1.4em',
        margin: 0,
        padding: '16px 16px 16px 60px',
        border: 'none',
        background: 'rgba(0, 0, 0, 0.003)',
        boxShadow: 'inset 0 -2px 1px rgba(0,0,0,0.03)',
        boxSizing: 'border-box'
    }
})

export interface TodoHeaderProps {
    id: string
    _: Deps<typeof TodoToAdd> & {
        todoRepository: TodoRepository
    }
}

@observer
export class TodoHeader extends React.PureComponent<TodoHeaderProps> {
    protected todoToAdd = new TodoToAdd({
        _: this.props._,
        id: `${this.props.id}.todoToAdd`
    })

    render() {
        const {
            todoToAdd,
            props: {
                id,
                _: {
                    todoRepository: {
                        toggleAllDisabled,
                        toggleAll,
                        activeTodoCount
                    }
                }
            }
        } = this

        return (
            <header id={id} className={css.header}>
                <input
                    id={`${id}-toggleAll`}
                    disabled={toggleAllDisabled}
                    type="checkbox"
                    onChange={toggleAll}
                    className={css.toggleAll}
                    checked={activeTodoCount === 0}
                />
                <input
                    id={`${id}-input`}
                    className={css.newTodo}
                    placeholder="What needs to be done?"
                    onInput={todoToAdd.setTitle}
                    ref={todoToAdd.setRef}
                    value={todoToAdd.title}
                    onKeyDown={todoToAdd.submit}
                />
            </header>
        )
    }
}
