// @flow

export interface IReactHost<Element> {
    __value(propsChanged: boolean): Element;
    forceUpdate(): void;
}

export interface IReactAtom<Element> {
    constructor(displayName: string, owner: IReactHost<Element>): self;
    reset(): void;
    destructor(): void;
    value(): Element;
    extendContext<Src, Dest: Src>(context: Src, key: Function, propsChanged: boolean): Dest;
}

type ErrorProps = {error: Error, children: any}
export type IRenderError<Element, Context> = (props: ErrorProps, context: Context) => Element

export default function createConnect<Element>(
    {ReactAtom, renderError, BaseComponent}: {
        ReactAtom: Class<IReactAtom<Element>>;
        renderError?: IRenderError<Element, *>;
        BaseComponent?: Function;
    }
) {
    class AtomizedComponent<Props: Object, State, Context> implements IReactHost<Element> {
        static displayName: string
        props: Props
        context: Context

        __atom: IReactAtom<Element>
        _lastData: ?Element

        __componentWillMount: void | () => void
        __componentWillUnmount: void | () => void
        __shouldComponentUpdate: void | (props: Props, state: State, context: Context) => boolean
        __render: (props: Props, context: Context) => Element
        __componentDidCatch: (error: Error, init: any) => void;

        forceUpdate: () => void

        componentWillMount() {
            const props = this.props
            this._lastData = null
            this._lastError = null
            if (this.__componentWillMount) this.__componentWillMount()
            this.__atom = new ReactAtom(
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
            this._lastData = null
            this._lastError = null
        }

        _lastError: ?Error

        componentDidCatch(error: Error, init: any) {
            if (this.__componentDidCatch) this.__componentDidCatch(error, init)
            this._lastError = error
            this.forceUpdate()
        }

        __value(propsChanged: boolean): Element {
            let data: Element = (null: any)
            const context = this.context
            try {
                if (this._lastError) throw this._lastError
                data = this.__render(
                    this.props,
                    this.__atom.extendContext(this.context, this.constructor, propsChanged)
                )
                this._lastData = data
            } catch (error) {
                this._lastError = null
                if (renderError) {
                    data = renderError.call(
                        this,
                        {error, children: this._lastData, origProps: this.props},
                        this.__atom.extendContext(this.context, renderError, propsChanged)
                    )
                } else {
                    console.error(error)
                }
            }

            return data
        }

        render(): Element {
            return this.__atom.value()
        }
    }

    const replacement: Object = AtomizedComponent.prototype
    const replacementKeys: string[] = Object.getOwnPropertyNames(replacement)

    return function reactConnect<ComponentClass: Function>(
        Parent: ComponentClass
    ): ComponentClass {
        let cls = Parent
        if (cls.prototype.render === undefined && typeof Parent === 'function') {
            if (!BaseComponent) throw new Error('Setup createConnect with BaseComponent')
            cls = function(props, context) {
                return BaseComponent.call(this, props, context) || this
            }
            cls.prototype = Object.create(BaseComponent.prototype)
            cls.prototype.constructor = cls
            cls.prototype.render = Parent
            cls.displayName = Parent.displayName || Parent.name
            cls.contextTypes = Parent.contextTypes
            cls.propTypes = Parent.propTypes
            cls.defaultProps = Parent.defaultProps
        }

        const target = cls.prototype
        for (let i = 0; i < replacementKeys.length; i++) {
            const key = replacementKeys[i]
            if (key in target) target['__' + key] = target[key]
            target[key] = replacement[key]
        }

        return (cls: any)
    }
}
