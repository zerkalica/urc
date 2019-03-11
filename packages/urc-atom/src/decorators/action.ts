import $ from 'mol_atom2_all'
const {$mol_fiber} = $

import {MolReactAtom} from '../MolReactAtom'

function action_sync<Host, Value>(
    obj: Host,
    name: string,
    descr: TypedPropertyDescriptor<(...args: any[]) => Value>
) {
    return action_decorator(obj, name, descr, true)
}

type ActionMethod = (...args: any[]) => any

function action_decorator<Host, Value>(
    obj: Host,
    name: string,
    descr: TypedPropertyDescriptor<(...args: any[]) => Value>,
    sync?: boolean,
) {
    const calculate = descr.value

    function handler(current: $.$mol_atom2 | void, ...args: any[]) {
        const master = new $mol_fiber()
        master.calculate = calculate.bind(this, ...args)
        master[Symbol.toStringTag] = `${this}.${name}()`

        const prev = $mol_fiber.current
        const slave: MolReactAtom<any> | void =
            sync && current instanceof MolReactAtom ? current : undefined

        // Run action in separate isolated fiber
        $mol_fiber.current = null

        try {
            if (slave) {
                slave.sync_begin()
                master.get()
            } else {
                // @see https://medium.com/trabe/react-syntheticevent-reuse-889cd52981b6
                const event = args[0]
                if (event && event instanceof Object && typeof event.persist === 'function') event.persist()
                master.schedule()
            }
        } finally {
            if (slave) slave.sync_end()
            $mol_fiber.current = prev
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
        get
    }
}

action_decorator.defer = action_decorator
action_decorator.sync = action_sync

type Class<Target> = Object

export interface Action {
    <Target, Method extends ActionMethod>(
        proto: Class<Target>,
        name: string,
        descr: TypedPropertyDescriptor<Method>
    ): TypedPropertyDescriptor<Method>
    defer: Action
    sync: typeof action_sync
}

export const action = action_decorator as Action
