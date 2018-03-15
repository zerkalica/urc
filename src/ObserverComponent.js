// @flow

import type {IReactAtom, IRenderError, IReactHost} from './interfaces'

export default class ObserverComponent<Props: Object, State, Context, Element> implements IReactHost<Element> {
    static displayName: string
    props: Props
    context: Context

    __atom: IReactAtom<Element>
    _renderError: IRenderError<Element, Context>

    __componentWillMount: void | () => void
    __componentWillUnmount: void | () => void
    __shouldComponentUpdate: void | (props: Props, state: State, context: Context) => boolean
    __render: (props: Props, context: Context) => Element
    __componentDidCatch: (error: Error, init: any) => void;

    forceUpdate: () => void

    static ReactAtom: Class<IReactAtom<Element>>

    componentWillMount() {
        const props = this.props
        if (this.__componentWillMount) this.__componentWillMount()
        this.__atom = new ObserverComponent.ReactAtom(
            props && props.id
                ? props.id
                : this.constructor.displayName,
            this
        )
    }

    shouldComponentUpdate(props: Props, state: State, context: Context) {
        const oldProps = this.props
        let count = 0
        for (let k in oldProps) {
            count++
            if (oldProps[k] !== props[k]) {
                this.__atom.reset()
                return true
            }
        }
        for (let k in props) {
            count--
            if (oldProps[k] !== props[k]) {
                this.__atom.reset()
                return true
            }
        }
        if (count !== 0) {
            this.__atom.reset()
            return true
        }

        return this.__shouldComponentUpdate ? this.__shouldComponentUpdate(props, state, context) : false
    }

    componentWillUnmount() {
        if (this.__componentWillUnmount) this.__componentWillUnmount()
        this.__atom.destructor()
        this.__atom = (null: any)
    }

    _getContext(key: Function, propsChanged: boolean): Context {
        return this.context
    }

    __value(propsChanged: boolean): Element {
        return this.__render(
            this.props,
            this._getContext(this.constructor, propsChanged)
        )
    }

    render(): Element {
        return this.__atom.value()
    }
}
