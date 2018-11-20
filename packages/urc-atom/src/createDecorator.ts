import {
    ComponentClass,
    IRenderError,
    createDecorator as createDecoratorBase
} from 'urc'
import {MolReactAtom} from './MolReactAtom'

export function createDecorator<
    ReactNode,
    Pure extends ComponentClass<ReactNode>
>(BaseComponent: Pure, renderError?: IRenderError<ReactNode> | void) {
    return createDecoratorBase(MolReactAtom, BaseComponent, renderError)
}
