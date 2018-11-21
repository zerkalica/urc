import * as React from 'react'
import {observer} from '../common'

export interface TodoAppProps {
    id: string
    _: {}
}

@observer
export class TodoApp extends React.PureComponent<TodoAppProps> {
    render() {
        const {
            props: {id}
        } = this

        return <div id={id}>todo</div>
    }
}
