export interface IReactHost<ReactNode> {
    __value(): ReactNode
    forceUpdate(): void
}

export interface IReactAtom<ReactNode = any> {
    reset(): void;
    destructor(): void
    render(): ReactNode
}

export type IReactAtomClass<ReactNode = any> = new (
    displayName: string,
    owner: IReactHost<ReactNode>
) => IReactAtom<ReactNode>

export interface ErrorProps<ReactNode> {
    error: Error
    ownerId: string
    children: ReactNode | void
}

export type IRenderError<ReactNode> = (
    props: ErrorProps<ReactNode>
) => ReactNode | null
