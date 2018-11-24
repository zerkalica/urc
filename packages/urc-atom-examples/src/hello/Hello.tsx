import * as React from 'react'
import {observer, Deps} from '../common'
import {mem, action, action_sync, fail} from 'urc-atom'

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

    @mem userChanged: string

    @mem
    get user(): string {
        return this.userChanged === undefined
            ? (this.fetch('/api/hello/user') as {name: string}).name
            : this.userChanged as string
    }

    set user(name: string) {
        this.userChanged = name
    }

    @mem saving: Promise<void> | Error | void

    @action
    save() {
        const {userChanged} = this
        try {
            this.fetch('/api/hello/user', {
                method: 'PUT',
                body: JSON.stringify({name: userChanged})
            })
        } catch (e) {
            this.saving = e
            fail(e)
        }
        this.saving = undefined
        this.userChanged = undefined
    }

    @action_sync
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
            _: {
                helloModel: {user, setUser, save, saving}
            },
            props: {id}
        } = this

        return (
            <div id={id}>
                <p id={`${id}-message`}>Hello, {user}!</p>
                <input id={`${id}-input`} value={user} onChange={setUser} disabled={!!saving} />
                <button
                    id={`${id}-save`}
                    onClick={save}
                    disabled={!!saving}
                >
                    Save
                </button>
                {saving instanceof Error && (
                    <div id={`${id}-error`}>{saving}</div>
                )}
            </div>
        )
    }
}
