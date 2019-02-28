import {action} from 'urc-atom'
import * as React from 'react'
import {TodoRepository, TODO_FILTER} from './models'
import {observer, Deps, sheet, LocationStore} from '../common'

class TodoFooterService {
    links = [
        {
            id: TODO_FILTER.ALL,
            title: 'All'
        },
        {
            id: TODO_FILTER.ACTIVE,
            title: 'Active'
        },
        {
            id: TODO_FILTER.COMPLETE,
            title: 'Completed'
        }
    ]

    constructor(
        protected _: {
            todoRepository: TodoRepository
        }
    ) {}

    @action
    clickLink(e: React.MouseEvent<HTMLAnchorElement>) {
        e.preventDefault()
        const linkid = (e.target as any).dataset.linkid
        if (!linkid) return
        this._.todoRepository.filter = linkid as TODO_FILTER
    }

    css = this.getCss()

    protected getCss() {
        const linkBase = {
            color: 'inherit',
            margin: '3px',
            padding: '3px 7px',
            textDecoration: 'none',
            border: '1px solid transparent',
            borderRadius: '3px',
            $nest: {
                '&:hover': {
                    borderColor: 'rgba(175, 47, 47, 0.1)'
                }
            }
        }

        return sheet({
            footer: {
                color: '#777',
                padding: '10px 15px',
                height: '20px',
                display: 'flex',
                borderTop: '1px solid #e6e6e6'
            },

            todoCount: {},

            filters: {
                margin: 0,
                padding: 0,
                listStyle: 'none'
            },

            filterItem: {
                display: 'inline'
            },

            linkRegular: linkBase,

            linkSelected: {
                ...linkBase,
                borderColor: 'rgba(215, 47, 47, 0.2)'
            },

            clearCompleted: {
                margin: 0,
                padding: 0,
                border: 0,
                background: 'none',
                fontSize: '100%',
                verticalAlign: 'baseline',
                lineHeight: '20px',
                textDecoration: 'none',
                cursor: 'pointer',
                $nest: {
                    '&:hover': {
                        textDecoration: 'underline'
                    }
                }
            }
        })
    }

    link(isSelected: boolean) {
        return isSelected ? this.css.linkSelected : this.css.linkRegular
    }
}

export interface TodoFooterProps {
    id: string
    _: Deps<typeof TodoFooterService> & {
        locationStore: LocationStore
        todoRepository: TodoRepository
    }
}

@observer
export class TodoFooter extends React.PureComponent<TodoFooterProps> {
    protected todoFooterService = new TodoFooterService(this.props._)

    render() {
        const {
            props: {
                id,
                _: {
                    locationStore,
                    todoRepository: {
                        completedCount,
                        activeTodoCount,
                        filter,
                        clearCompletedDisabled,
                        clearCompleted
                    }
                }
            },
            todoFooterService
        } = this

        const {links, clickLink, css} = todoFooterService
        if (activeTodoCount === 0 && completedCount === 0) return null

        return (
            <footer id={id} className={css.footer}>
                <span className={css.todoCount} id={`${id}-count`}>
                    <strong id={`${id}-number`}>{activeTodoCount}</strong>{' '}
                    item(s) left
                </span>
                <ul className={css.filters} id={`${id}-filters`}>
                    {links.map(link => (
                        <li
                            key={link.id}
                            className={css.filterItem}
                            id={`${id}-link(${link.id})-item`}
                        >
                            <a
                                id={`${id}-link(${link.id})-href`}
                                className={todoFooterService.link(
                                    filter === link.id
                                )}
                                href={locationStore.toUrl({
                                    todo_filter: link.id
                                })}
                                data-linkid={link.id}
                                onClick={clickLink}
                            >
                                {link.title}
                            </a>
                        </li>
                    ))}
                </ul>
                {completedCount !== 0 && (
                    <button
                        id={`${id}-clear`}
                        className={css.clearCompleted}
                        disabled={clearCompletedDisabled}
                        onClick={clearCompleted}
                    >
                        Clear completed
                    </button>
                )}
            </footer>
        )
    }
}
