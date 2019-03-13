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

function reset_props<
    Host extends object = any,
    Field extends keyof Host = any,
    Value extends Host[Field] = any
>(
    proto: Host,
    name: Field,
    descr?: TypedPropertyDescriptor<Value>
): any {
    return {
        configurable: true,
        enumerable: true,
        get(): Value {
            return this.__props
        },
        set(v: Value) {
            if (v !== this.__props && this.__atom !== undefined) this.__atom.reset()
            this.__props = v
        }
    }
}

function reset_state<
    Host extends object = any,
    Field extends keyof Host = any,
    Value extends Host[Field] = any
>(
    proto: Host,
    name: Field,
    descr?: TypedPropertyDescriptor<Value>
): any {
    return {
        configurable: true,
        enumerable: true,
        get(): Value {
            return this.__state
        },
        set(v: Value) {
            if (v !== this.__state && this.__atom !== undefined) this.__atom.reset()
            this.__state = v
        }
    }
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

    const displayName =
        (OrigComponent as {displayName?: string}).displayName ||
        OrigComponent.name

    class Cls<Props, State> extends (renderFunction
        ? BaseComponent
        : (OrigComponent as ComponentClass<ReactNode>)) {
        static displayName = displayName
        static __urc = true

        protected __props: Props
        @reset_props props: Props

        protected __state: State
        @reset_state state: State

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
            this.__atom = new ReactAtom(id, this as IReactHost<
                ReactNode
            >)
            this.__origRender = renderFunction as (props?: Props) => ReactNode || super.render
            this.__lastError = undefined
            if (renderError) {
                this.__lastData = undefined
                this.__lastError = null
            }
        }

        __value() {
            return this.__origRender(this.props)
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
