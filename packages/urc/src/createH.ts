import {ComponentDecorator} from './createDecorator'

export function createH<
    ReactNode,
    Component extends Function,
    CreateElement extends Function
>(
    createElement: CreateElement,
    decorate: ComponentDecorator<ReactNode>
): CreateElement {
    const decoratedMap: WeakMap<Component, Component> = new WeakMap()

    function h() {
        let type = arguments[0]
        let props = type
        if (type instanceof Function && type.__urc === undefined) {
            type = decoratedMap.get(props)
            if (type === undefined) {
                type = decorate(props)
                decoratedMap.set(props, type)
            }
        }
        props = arguments[1]

        switch (arguments.length) {
            case 1:
            case 2:
                return createElement(type, props)
            case 3:
                return createElement(type, props, arguments[2])
            case 4:
                return createElement(type, props, arguments[2], arguments[3])
            case 5:
                return createElement(
                    type,
                    props,
                    arguments[2],
                    arguments[3],
                    arguments[4]
                )
            case 6:
                return createElement(
                    type,
                    props,
                    arguments[2],
                    arguments[3],
                    arguments[4],
                    arguments[5]
                )
            case 7:
                return createElement(
                    type,
                    props,
                    arguments[2],
                    arguments[3],
                    arguments[4],
                    arguments[5],
                    arguments[6]
                )

            default:
                return createElement.apply(null, arguments)
        }
    }

    return (h as unknown) as CreateElement
}
