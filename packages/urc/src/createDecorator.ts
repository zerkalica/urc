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
    componentDidUpdate?(
        prevProps: Readonly<Props>,
        prevState: Readonly<State>,
        snapshot?: any
    ): void
    forceUpdate(): void
    componentDidCatch?(error: Error, errorInfo: ErrorInfo): void
    componentWillUnmount?(): void
    render(): ReactNode
}

function isFunctionComponent<Props, ReactNode>(
    OrigComponent:
        | ((props: Props) => ReactNode)
        | ComponentClass<Props, any, ReactNode>
): OrigComponent is ((props: Props) => ReactNode) {
    return (
        !OrigComponent.prototype ||
        typeof OrigComponent.prototype.render !== 'function'
    )
}

export type ComponentDecorator<ReactNode> =
    | (<Component extends ComponentClass<ReactNode>>(
          component: Component
      ) => Component)
    | (<Component extends (<Props extends {}>(props?: Props) => ReactNode)>(
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

    const displayName = (OrigComponent as {displayName?: string}).displayName
        || OrigComponent.name

    const Cls = class<Props, State> extends (renderFunction
        ? BaseComponent
        : (OrigComponent as ComponentClass<ReactNode>)) {
        static displayName = displayName
        props: Props

        __atom: IReactAtom<ReactNode>
        __render: (props?: Props) => ReactNode
        __lastError: Error | void
        __lastData: ReactNode | void

        constructor(props: Props, context?: any) {
            super(props, context)
            const id = (props && (props as {id?: string}).id) || (this.constructor as {displayName?: string}).displayName

            this[Symbol.toStringTag] = id
            this.__atom = new ReactAtom(
                `${id}.__atom`,
                this as IReactHost<ReactNode>
            )
            this.__render = renderFunction || super.render
            this.__lastError = undefined
            if (renderError) {
                this.__lastData = undefined
                this.__lastError = null
            }
        }

        __value() {
            return this.__render(this.props)
        }

        componentDidCatch(error: Error, init: ErrorInfo) {
            if (super.componentDidCatch) super.componentDidCatch(error, init)
            if (this.__lastError === undefined) return
            this.__lastError = error
            this.forceUpdate()
        }

        componentDidUpdate(
            prevProps: Readonly<Props>,
            prevState: Readonly<State>,
            snapshot?: any
        ): void {
            if (super.componentDidUpdate)
                super.componentDidUpdate(prevProps, prevState, snapshot)
            this.__atom.reset()
        }

        componentWillUnmount() {
            if (super.componentWillUnmount) super.componentWillUnmount()
            if (this.__atom === undefined) return
            this.__atom.destructor()
            this.__atom = undefined
        }

        render() {
            if (this.__lastError === undefined) return this.__atom.get()

            let data: ReactNode
            try {
                if (this.__lastError) throw this.__lastError
                data = this.__atom.get()
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

    return Cls as unknown as Orig
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
