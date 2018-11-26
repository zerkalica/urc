import $ from 'mol_atom2_all'
const {
    $mol_fiber
} = $

import {MolReactAtom} from '../MolReactAtom'

function action_sync<Host, Value>(
    obj: Host,
    name: string,
    descr: TypedPropertyDescriptor<(...args: any[]) => Value>,
) {
    return action_decorator(obj, name, descr, true)
}

function action_defer<Host, Value>(
    obj: Host,
    name: string,
    descr: TypedPropertyDescriptor<(...args: any[]) => Value>,
) {
    return action_decorator(obj, name, descr, false, true)
}

type ActionMethod = (...args: any[]) => any

const frame: (cb: ActionMethod) => any = typeof requestAnimationFrame === 'undefined'
    ? cb => setTimeout(cb, 0)
    : requestAnimationFrame

function action_decorator<Host, Value>(
    obj: Host,
    name: string,
    descr: TypedPropertyDescriptor<(...args: any[]) => Value>,
    sync?: boolean,
    defered?: boolean
) {
    const calculate = descr.value

    function handler(current: $.$mol_atom2 | void, ...args: any[]) {
        const master = new $mol_fiber()
        
        master.calculate = calculate.bind(this, ...args)
        master[Symbol.toStringTag] = `${this}.${name}()`

        const slave: MolReactAtom<any> | void = sync && current instanceof MolReactAtom ? current : undefined

        try {
            if (slave !== undefined) slave.sync_begin()
            return defered ? frame(master.get.bind(master)) : master.get()
        } finally {
            if (slave !== undefined) slave.sync_end()
        }
    }
    Object.defineProperty(handler, 'name', {value: `@action ${name}`})

    const binds: WeakMap<Object, ActionMethod> = new WeakMap()

    function get() {
        const current = $mol_fiber.current
        let binded = binds.get(current)
        if (binded === undefined) {
            binded = handler.bind(this, current)
            binds.set(current, binded)
        }
        return binded
    }

    return {
        enumerable: descr.enumerable,
        configurable: true,
        get,
    }
}

action_decorator.defer = action_defer
action_decorator.sync = action_sync

type Class<Target> = Object

export interface Action {
    <Target, Method extends ActionMethod>(
        proto: Class<Target>,
        name: string,
        descr: TypedPropertyDescriptor<Method>
    ): TypedPropertyDescriptor<Method>
    defer: typeof action_defer
    sync: typeof action_sync
}

export const action = action_decorator as Action
