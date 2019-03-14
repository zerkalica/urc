import {action, mem, defer} from 'urc-atom'
import {Todo} from './models'
import {observer, sheet, Sheet, style} from '../common'
import * as React from 'react'

const ESCAPE_KEY = 27
const ENTER_KEY = 13

class TodoItemEdit {
    @mem todoBeingEditedId: string | void
    @mem editText: string

    todo: Todo

    constructor(opts: {id: string; todo: Todo}) {
        this[Symbol.toStringTag] = opts.id
        this.todo = opts.todo
        this.editText = ''
        this.todoBeingEditedId = null
    }

    @action
    beginEdit() {
        const {todo} = this
        if (todo.updateDisabled) return
        if (this.todoBeingEditedId) return
        this.todoBeingEditedId = todo.id
        this.editText = todo.title
    }

    @action.sync
    setText({target}: React.KeyboardEvent<HTMLInputElement>) {
        this.editText = (target as any).value.trim()
    }

    @action
    setEditInputRef(el: HTMLInputElement | void) {
        if (el) el.focus()
    }

    @action
    submit() {
        if (!this.todoBeingEditedId) return
        const title = this.editText.trim()
        const {todo} = this
        if (title) {
            if (todo.title !== title) {
                todo.update({title})
                this.editText = ''
            }
        } else {
            this.remove()
        }
        this.todoBeingEditedId = null
    }

    @action.event
    submitOrRestore({which}: React.KeyboardEvent<HTMLInputElement>) {
        action(() => {
            switch (which) {
                case ESCAPE_KEY:
                    this.editText = this.todo.title
                    this.todoBeingEditedId = null
                    break
    
                case ENTER_KEY:
                    this.submit()
                    break
    
                default:
                    break
            }
        })
    }

    @action
    toggle() {
        this.todo.update({completed: !this.todo.completed})
        this.todoBeingEditedId = null
    }

    @action
    remove() {
        this.todo.remove()
        this.todoBeingEditedId = null
    }
}

class TodoItemTheme {
    css = this.getCss()

    getCss() {
        const destroy = style({
            padding: 0,
            border: 0,
            background: 'none',
            verticalAlign: 'baseline',
            display: 'none',
            position: 'absolute',
            right: '10px',
            top: 0,
            bottom: 0,
            width: '40px',
            height: '40px',
            fontSize: '30px',
            margin: 'auto 0',
            color: '#cc9a9a',
            marginBottom: '11px',
            transition: 'color 0.2s ease-out',
            $nest: {
                '&:hover': {
                    color: '#af5b5e'
                },

                '&:after': {
                    content: "'×'"
                }
            }
        })

        const viewLabelBase = {
            wordBreak: 'break-all',
            padding: '15px 15px 15px 60px',
            display: 'block',
            lineHeight: '1.2',
            transition: 'color 0.4s'
        } as Sheet

        const result = sheet({
            regular: {
                position: 'relative',
                fontSize: '24px',
                borderBottom: '1px solid #ededed',
                display: 'flex',

                $nest: {
                    '&:last-child': {
                        borderBottom: 'none'
                    },
                    [`&:hover .${destroy}`]: {
                        display: 'block'
                    }
                }
            },

            editing: {
                borderBottom: 'none',
                padding: 0,
                $nest: {
                    '&:last-child': {
                        marginBottom: '-1px'
                    }
                }
            },

            edit: {
                backgroundColor: '#F2FFAB',
                display: 'block',
                zIndex: 0,
                border: 0,
                position: 'relative',
                fontSize: '24px',
                fontFamily: 'inherit',
                fontWeight: 'inherit',
                lineHeight: '1.4em',
                padding: '12px 16px',
                margin: '0 0 0 43px'
            },

            toggle: {
                textAlign: 'center',
                width: '40px',
                /* auto, since non-WebKit browsers doesn't support input styling */
                height: 'auto',
                position: 'absolute',
                top: 0,
                bottom: 0,
                margin: 'auto 0',
                border: 'none' /* Mobile Safari */,
                '-webkit-appearance': 'none',
                appearance: 'none',
                opacity: 0,
                '& + label': {
                    /*
                        Firefox requires `#` to be escaped - https://bugzilla.mozilla.org/show_bug.cgi?id=922433
                        IE and Edge requires *everything* to be escaped to render, so we do that instead of just the `#` - https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/7157459/
                    */
                    backgroundImage: `url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23ededed%22%20stroke-width%3D%223%22/%3E%3C/svg%3E')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center left'
                },

                '&:checked + label': {
                    backgroundImage: `url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%22-10%20-18%20100%20135%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23bddad5%22%20stroke-width%3D%223%22/%3E%3Cpath%20fill%3D%22%235dc2af%22%20d%3D%22M72%2025L42%2071%2027%2056l-4%204%2020%2020%2034-52z%22/%3E%3C/svg%3E')`
                }
            },

            viewLabelRegular: viewLabelBase,

            viewLabelCompleted: {
                ...viewLabelBase,
                color: '#d9d9d9',
                textDecoration: 'line-through'
            },

            viewLabelDisabled: {
                ...viewLabelBase,
                color: '#d9d9d9'
            }
        })

        return {...result, destroy}
    }

    label(isCompleted: boolean, isDisabled: boolean) {
        const css = this.css
        if (isDisabled) return css.viewLabelDisabled
        if (isCompleted) return css.viewLabelCompleted

        return css.viewLabelRegular
    }
}

export interface TodoItemProps {
    readonly id: string
    readonly todo: Todo
}

const theme = new TodoItemTheme()

@observer
export class TodoItem extends React.PureComponent<TodoItemProps> {
    protected todoItemEdit = new TodoItemEdit({
        id: `${this.props.id}.todoItemEdit`,
        todo: this.props.todo
    })

    componentDidUpdate() {
        this.todoItemEdit.todo = this.props.todo
    }

    render() {
        const {
            todoItemEdit,
            props: {id, todo}
        } = this
        const {css} = theme

        if (todoItemEdit.todoBeingEditedId === todo.id) {
            return (
                <li id={id} className={css.editing}>
                    <input
                        id={`${id}-editing`}
                        ref={todoItemEdit.setEditInputRef}
                        className={css.edit}
                        disabled={todo.updateDisabled}
                        value={todoItemEdit.editText}
                        onBlur={todoItemEdit.submit}
                        onInput={todoItemEdit.setText}
                        onKeyDown={todoItemEdit.submitOrRestore}
                    />
                </li>
            )
        }

        const {updating} = todo

        return (
            <li id={id} className={css.regular}>
                <input
                    id={`${id}-toggle`}
                    className={css.toggle}
                    type="checkbox"
                    disabled={todo.updateDisabled}
                    checked={todo.completed}
                    onChange={todoItemEdit.toggle}
                />
                <label
                    id={`${id}-beginEdit`}
                    className={theme.label(todo.completed, todo.updateDisabled)}
                    onDoubleClick={todoItemEdit.beginEdit}
                >
                    {updating && '['}
                    {todo.title}
                    {updating && ']'}
                </label>
                <button
                    id={`${id}-destroy`}
                    className={css.destroy}
                    disabled={todo.removeDisabled}
                    onClick={todoItemEdit.remove}
                />
            </li>
        )
    }
}
