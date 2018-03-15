// @flow
import type {IReactAtom, IRenderError, IReactHost} from './interfaces'
import CatchableComponent from './CatchableComponent'
import ObserverComponent from './ObserverComponent'

function getPropertyNamesDeep(proto: Object): string[] {
    let next = proto
    const dest: string[] = []
    do {
        const src = Object.getOwnPropertyNames(next)
        for (let i = 0; i < src.length; i++) {
            const key = src[i]
            if (key !== 'constructor' && dest.indexOf(key) === -1) dest.push(key)
        }
        next = Object.getPrototypeOf(next)
    } while (next && next.constructor !== Object)
    return dest
}

export default function createConnect<Element, ComponentClass: Function>(
    {ReactAtom, renderError, BaseComponent, MixinComponent, normalizeClass}: {
        ReactAtom: Class<IReactAtom<Element>>;
        renderError?: IRenderError<Element, *>;
        BaseComponent?: Function;
        MixinComponent?: Class<IReactHost<Element>>,
        normalizeClass?: (cls: ComponentClass) => ComponentClass
    }
) {
    ObserverComponent.ReactAtom = (ReactAtom: Class<IReactAtom<any>>)

    const replacement: Object = (MixinComponent || (renderError ? CatchableComponent : ObserverComponent)).prototype
    if (renderError && !replacement._renderError) replacement._renderError = renderError
    const replacementKeys = getPropertyNamesDeep(replacement)

    return function reactConnect(
        Parent: ComponentClass
    ): ComponentClass {
        if (Parent.isConnected) throw new Error(`${Parent.displayName || Parent.name} already connected`)
        Parent.isConnected = true

        let cls: ComponentClass = Parent
        if (typeof cls.prototype.render !== 'function' && typeof Parent === 'function') {
            if (!BaseComponent) throw new Error('Setup createConnect with BaseComponent')
            cls = ((function ConnectedComponent(props, context) {
                return BaseComponent.call(this, props, context) || this
            }: any): ComponentClass)
            cls.prototype = Object.create(BaseComponent.prototype)
            cls.prototype.constructor = cls
            cls.prototype.render = Parent
            cls.displayName = Parent.displayName || Parent.name
            const props = Object.getOwnPropertyNames(Parent)
            for (let i = 0; i < props.length; i++) {
                const key = props[i]
                if (!(key in (cls: Object))) cls[key] = Parent[key]
            }
        }

        const target = cls.prototype
        for (let i = 0; i < replacementKeys.length; i++) {
            const key = replacementKeys[i]
            if (key in target) target['__' + key] = target[key]
            target[key] = replacement[key]
        }

        return ((normalizeClass ? normalizeClass(cls) : cls): any)
    }
}
