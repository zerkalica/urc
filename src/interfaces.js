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
}

export type ErrorProps = {error: Error, children: any}
export type IRenderError<Element, Context> = (props: ErrorProps, context: Context) => Element
