// @flow
import type {IReactAtom, IRenderError, IReactHost} from './interfaces'
import AtomizedComponent from './AtomizedComponent'

function mergeKeys(src: string[], dest: string[]): string[] {
    for (let i = 0; i < src.length; i++) {
        const key = src[i]
        if (dest.indexOf(key) === -1) dest.push(key)
    }
    return dest
}

export default function createConnect<Element>(
    {ReactAtom, renderError, BaseComponent, MixinComponent}: {
        ReactAtom: Class<IReactAtom<Element>>;
        renderError?: IRenderError<Element, *>;
        BaseComponent?: Function;
        MixinComponent?: Class<IReactHost<Element>>
    }
) {
    AtomizedComponent.ReactAtom = (ReactAtom: Class<IReactAtom<any>>)
    const replacement: Object = (MixinComponent || AtomizedComponent).prototype
    replacement._renderError = renderError
    let keys = Object.getOwnPropertyNames(AtomizedComponent.prototype)
    if (replacement !== AtomizedComponent.prototype) {
        mergeKeys(Object.getOwnPropertyNames(replacement), keys)
    }

    const replacementKeys: string[] = keys
        .filter((prop) => prop !== 'constructor')

    const names: Map<string, number> = new Map()

    return function reactConnect<ComponentClass: Function>(
        Parent: ComponentClass
    ): ComponentClass {
        if (Parent.isConnected) throw new Error(`${Parent.displayName || Parent.name} already connected`)
        Parent.isConnected = true

        let cls = Parent
        if (typeof cls.prototype.render !== 'function' && typeof Parent === 'function') {
            if (!BaseComponent) throw new Error('Setup createConnect with BaseComponent')
            cls = function ConnectedComponent(props, context) {
                return BaseComponent.call(this, props, context) || this
            }
            cls.prototype = Object.create(BaseComponent.prototype)
            cls.prototype.constructor = cls
            cls.prototype.render = Parent
            cls.displayName = Parent.displayName || Parent.name
            const props = Object.getOwnPropertyNames(Parent)
            for (let i = 0; i < props.length; i++) {
                const key = props[i]
                if (!(key in cls)) cls[key] = Parent[key]
            }
        }

        let prefix = names.get(cls.displayName)
        if (prefix !== undefined) {
            prefix++
            names.set(cls.displayName, prefix)
            cls.displayName = cls.displayName + prefix
        } else {
            names.set(cls.displayName, 0)
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
