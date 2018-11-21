import './bootstrap'
import config from './config'
import * as ReactDOM from 'react-dom'
import * as React from 'react'
import {App} from './App'
import {Deps} from './common'
import {todoMocks} from './todomvc/models/todoMocks'
import {helloMocks} from './hello/helloMocks'
import {apiMocker} from './common/apiMocker'

apiMocker({
    mocks: [
        helloMocks,
        todoMocks
    ]
})

const _: Deps<typeof App> = {
    fetchFn: fetch,
    location: window.location,
    history: window.history
    // storage: window.localStorage
}

ReactDOM.render(
    <App id={`${config.id}-app`} _={_} />,
    document.getElementById(config.id)
)
