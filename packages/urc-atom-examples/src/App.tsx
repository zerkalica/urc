import * as React from 'react'
import {Hello} from './hello'
import {TodoApp} from './todomvc'

import {
    observer,
    sheet,
    PageRepository,
    Deps,
    LocationStore,
    Omit,
    Sheet
} from './common'
import {fiberize} from 'urc-atom'

class AppTheme {
    get css() {
        const menuButton = {
            margin: 0,
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '5px',
            border: '1px solid #eee',
            background: 'none',
            lineHeight: '20px',
            textDecoration: 'none',
            cursor: 'pointer',
            color: 'black',
            $nest: {
                '&:hover': {
                    textDecoration: 'underline'
                }
            }
        } as Sheet

        return sheet({
            main: {
                display: 'flex',
                width: '100%',
                height: '100%',
                padding: '1em',
                font: '14px "Helvetica Neue", Helvetica, Arial, sans-serif',
                lineHeight: '1.4em',
                background: '#f5f5f5',
                color: '#4d4d4d',
                margin: '0 auto',
                fontWeight: 300
            },

            menu: {},
            menuItem: {
                marginBottom: '0.3em',
                display: 'block'
            },
            menuButton: menuButton,
            menuButtonActive: {
                ...menuButton,
                background: '#ddd'
            },

            layout: {
                margin: '0 0 1em 1em'
            },
            apps: {
                padding: '1em',
                margin: '0 0 1em 1em'
            }
        })
    }
}

const css = new AppTheme().css

export interface AppProps {
    id: string
    _: Omit<
        Deps<typeof LocationStore> &
            Deps<typeof TodoApp> &
            Deps<typeof Hello> & {fetchFn: typeof fetch},
        'fetch'
    >
}

@observer
export class App extends React.PureComponent<AppProps> {
    protected _ = {
        ...this.props._,
        locationStore: new LocationStore(
            this.props._,
            `${this.props.id}.locationStore`
        ),
        fetch: fiberize(this.props._.fetchFn, r => r.json())
    }

    protected pageRepository = new PageRepository({
        _: this._,
        id: `${this.props.id}.pageRepository`,
        pages: [
            {
                id: 'todomvc',
                title: 'Todo MVC'
            },
            {
                id: 'hello',
                title: 'Hello'
            }
        ],
        key: 'page'
    })

    render() {
        const {
            _,
            pageRepository: {setPageId, getPageUrl: gpu, pages, page},
            props: {id}
        } = this
        const getPageUrl = gpu.bind(this.pageRepository)

        const pageId = id + '-' + page.id

        return (
            <div id={id} className={css.main}>
                <ul id={`${id}-menu`} className={css.menu}>
                    {pages.map(item => (
                        <li
                            id={`${id}-item(${item.id})`}
                            key={item.id}
                            className={css.menuItem}
                        >
                            <a
                                id={`${id}-itemlink(${item.id})`}
                                href={getPageUrl(item.id)}
                                className={
                                    page === item
                                        ? css.menuButtonActive
                                        : css.menuButton
                                }
                                data-id={item.id}
                                onClick={setPageId.bind(this.pageRepository)}
                            >
                                {item.title}
                            </a>
                        </li>
                    ))}
                </ul>
                <div id={`${id}-apps`} className={css.apps}>
                    <div id={`${id}-layout`} className={css.layout}>
                        <h1 id={`${id}-title`}>{page.title}</h1>
                        {page.id === 'todomvc' && <TodoApp id={pageId} _={_} />}
                        {page.id === 'hello' && <Hello id={pageId} _={_} />}
                    </div>
                </div>
            </div>
        )
    }
}
