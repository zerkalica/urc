import * as React from 'react'
import {observer} from '../common'

export interface HelloProps {
    id: string
    _: {}
}

@observer
export class Hello extends React.PureComponent<HelloProps> {
    render() {
        const {
            props: {id}
        } = this

        return <div id={id}>test</div>
    }
}
