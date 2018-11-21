import * as React from 'react'
import {observer, Deps} from '../common'
import {mem, action} from 'urc-atom'

class HelloModel {
    protected fetch: <V>(url: string, init?: RequestInit) => V

    constructor({
        id,
        _
    }: {
        id: string
        _: {
            fetch: <V>(url: string, init?: RequestInit) => V
        }
    }) {
        this[Symbol.toStringTag] = id
        this.fetch = _.fetch
    }

    @mem userChanged: string | void = undefined

    @mem
    get user(): string {
        return this.userChanged || (this.fetch('/api/hello/user') as {name: string}).name
    }

    set user(name: string) {
        this.userChanged = name
    }

    @action
    save() {
        this.fetch('/api/hello/user', {
            method: 'PUT',
            body: JSON.stringify({name})
        })
        this.userChanged = undefined
    }

    @action
    setUser(e: React.ChangeEvent<any>) {
        this.user = e.target.value
    }
}

export interface HelloProps {
    id: string
    _: Deps<typeof HelloModel>
}

@observer
export class Hello extends React.PureComponent<HelloProps> {
    protected _ = {
        helloModel: new HelloModel({
            id: this.props.id + '.helloModel',
            _: this.props._
        })
    }

    render() {
        const {
            _: {helloModel},
            props: {id}
        } = this

        return (
            <div id={id}>
                <p id={`${id}-message`}>Hello, {helloModel.user}!</p>
                <input
                    id={`${id}-input`}
                    value={helloModel.user}
                    onChange={helloModel.setUser.bind(helloModel)}
                />
                <button
                    id={`${id}-save`}
                    onClick={helloModel.save.bind(helloModel)}
                >
                    Save
                </button>
            </div>
        )
    }
}
