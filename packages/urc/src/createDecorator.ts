import {
    IReactAtom,
    IRenderError,
    IReactAtomClass,
    IReactHost
} from './interfaces'

export interface ComponentClass<ReactNode, Props = {}, State = any> {
    new (props: Props, context?: any): Component<Props, State, ReactNode>
    // displayName: string
}

type ErrorInfo = any

export interface Component<Props, State, ReactNode> {
    props: Props
    state: State
    shouldComponentUpdate?(nextProps: Props, nextState: State, nextContext?: any): boolean
    forceUpdate(): void
    componentDidCatch?(error: Error, errorInfo: ErrorInfo): void
    componentWillUnmount?(): void
    render(): ReactNode
}

function isFunctionComponent<Props, ReactNode>(
    OrigComponent:
        | ((props: Props) => ReactNode)
        | ComponentClass<Props, any, ReactNode>
): OrigComponent is (props: Props) => ReactNode {
    return (
        !OrigComponent.prototype ||
        typeof OrigComponent.prototype.render !== 'function'
    )
}

const keyList = Object.keys

function shallowEqual<A>(a: A, b: A): boolean {
    if (a === b) return true
    if (!(a instanceof Object) || !(b instanceof Object)) return false

    const keys = keyList(a)
    const length = keys.length

    for (let i = 0; i < length; i++) if (!(keys[i] in b)) return false
    for (let i = 0; i < length; i++) if (a[keys[i]] !== b[keys[i]]) return false

    return length === keyList(b).length
}

export type ComponentDecorator<ReactNode> =
    | (<Component extends ComponentClass<ReactNode>>(
          component: Component
      ) => Component)
    | (<Component extends <Props extends {}>(props?: Props) => ReactNode>(
          component: Component
      ) => Component)

function createObserverComponent<
    ReactNode,
    Pure extends ComponentClass<ReactNode>,
    Orig extends ComponentClass<ReactNode> | ((props?: {}) => ReactNode)
>(
    ReactAtom: IReactAtomClass<ReactNode>,
    BaseComponent: Pure,
    renderError: IRenderError<ReactNode> | void,
    OrigComponent: Orig
): Orig {
    const renderFunction = isFunctionComponent(OrigComponent)
        ? OrigComponent
        : undefined

    const displayName =
        (OrigComponent as {displayName?: string}).displayName ||
        OrigComponent.name

    class Cls<Props, State> extends (renderFunction
        ? BaseComponent
        : (OrigComponent as ComponentClass<ReactNode>)) {
        static displayName = displayName
        static __urc = true

        props: Props
        state: State

        __atom: IReactAtom<ReactNode>
        __origRender: (props?: Props) => ReactNode
        __lastError: Error | void
        __lastData: ReactNode | void

        constructor(props: Props, context?: any) {
            super(props, context)
            const id =
                (props && (props as {id?: string}).id) ||
                (this.constructor as {displayName?: string}).displayName

            this[Symbol.toStringTag] = id
            this.__atom = new ReactAtom(id, this as IReactHost<ReactNode>)
            this.__origRender =
                (renderFunction as (props?: Props) => ReactNode) || super.render
            this.__lastError = undefined
            if (renderError) {
                this.__lastData = undefined
                this.__lastError = null
            }
        }

        __value() {
            return this.__origRender(this.props)
        }

        shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
            const result = super.shouldComponentUpdate
                ? super.shouldComponentUpdate(nextProps, nextState)
                : (shallowEqual(this.props, nextProps) || this.state !== nextState)

            if (result) this.__atom.reset()
            return result
        }

        componentDidCatch(error: Error, init: ErrorInfo) {
            if (super.componentDidCatch) super.componentDidCatch(error, init)
            if (this.__lastError === undefined) return
            this.__lastError = error
            this.forceUpdate()
        }

        componentWillUnmount() {
            if (super.componentWillUnmount) super.componentWillUnmount()
            if (this.__atom === undefined) return
            this.__atom.destructor()
            this.__atom = undefined
        }

        render() {
            if (this.__lastError === undefined) return this.__atom.render()

            let data: ReactNode
            try {
                if (this.__lastError) throw this.__lastError
                data = this.__atom.render()
                this.__lastData = data
            } catch (error) {
                this.__lastError = null
                data = (renderError as IRenderError<ReactNode>)({
                    ownerId: String(this.__atom),
                    error,
                    children: this.__lastData
                })
            }

            return data
        }
    }

    if (renderFunction) {
        const props = Object.getOwnPropertyNames(OrigComponent)
        for (let i = 0; i < props.length; i++) {
            const key = props[i]
            if (!(key in Cls)) Cls[key] = OrigComponent[key]
        }
    }

    return (Cls as unknown) as Orig
}

export function createDecorator<
    ReactNode,
    Pure extends ComponentClass<ReactNode>
>(
    ReactAtom: IReactAtomClass<ReactNode>,
    BaseComponent: Pure,
    renderError: IRenderError<ReactNode> | void
): ComponentDecorator<ReactNode> {
    return origComponent =>
        createObserverComponent(
            ReactAtom,
            BaseComponent,
            renderError,
            origComponent
        )
}
