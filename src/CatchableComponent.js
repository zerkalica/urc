// @flow

import type {IReactAtom, IRenderError, IReactHost} from './interfaces'
import ObserverComponent from './ObserverComponent'

export default class CatchableComponent<Props: Object, State, Context, Element>
    extends ObserverComponent<Props, State, Context, Element> {
    _lastError: ?Error
    _lastData: ?Element
    _renderError: IRenderError<Element, Context>

    componentWillUnmount() {
        super.componentWillMount()
        this._lastData = null
        this._lastError = null
    }

    componentDidCatch(error: Error, init: mixed) {
        if (this.__componentDidCatch) {
            this.__componentDidCatch(error, init)
        } else if (this._renderError) {
            this._lastError = error
            this.forceUpdate()
        }
    }
    _getContext: (key: Function, propsChanged: boolean) => Context

    render(): Element {
        let data: Element = (null: any)
        try {
            if (this._lastError) throw this._lastError
            data = this.__atom.value().valueOf()
            this._lastData = data
        } catch (error) {
            this._lastError = null
            if (this._renderError) {
                data = this._renderError(
                    {error, children: this._lastData, origProps: this.props},
                    this._getContext(this._renderError, false)
                )
            } else {
                throw error
            }
        }

        return data
    }

}
