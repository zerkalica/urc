// @flow
import type {IReactAtom, IReactHost} from './interfaces'

interface IMobxReaction {
    constructor(name: string, onInvalidate: () => void): IMobxReaction;
    track(cb: () => void): void;
    dispose(): void;
}

export default function createMobxAtom(Reaction: Class<IMobxReaction>): Class<IReactAtom<any>> {
    return class MobxReactAtom<V> implements IReactAtom<V> {
        _reaction: Reaction
        _cache: V | void
        _host: IReactHost<V>
        _track: () => void
        _propsChanged: boolean

        constructor(
            name: string,
            host: IReactHost<V>
        ) {
            this._propsChanged = false
            this._cache = undefined
            this._host = host
            this._track = () => this.__track()
            this._reaction = new Reaction(name, () => this._onInvalidate())
        }

        _onInvalidate(): void {
            this._cache = undefined
            this.value()
            this._host.forceUpdate()
        }

        __track() {
            this._cache = this._host.__value(this._propsChanged)
        }

        reset() {
            this._propsChanged = true
            this._cache = undefined
        }

        value(): V {
            if (this._cache === undefined) {
                this._reaction.track(this._track)
                this._propsChanged = false
            }

            return (this._cache: any)
        }

        destructor() {
            this._reaction.dispose()
            this._reaction = (undefined: any)
            this._host = (undefined: any)
            this._cache = undefined
            this._track = (undefined: any)
        }
    }
}
