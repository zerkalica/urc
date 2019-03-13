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

function action_defer<Host, Value>(
    obj: Host,
    name: string,
    descr: TypedPropertyDescriptor<(...args: any[]) => Value>
) {
    return action_decorator(obj, name, descr, false, true)
}

interface ActionMethod {
    (...args: any[]): any
    t?: object | void
}

function action_decorator<Host, Value>(
    obj: Host,
    name: string,
    descr: TypedPropertyDescriptor<(...args: any[]) => Value>,
    sync?: boolean,
    defered?: boolean
) {
    const calculate = descr.value

    function handler(slave: MolReactAtom<any> | void, ...args: any[]) {
        const master = new $mol_fiber()
        master.calculate = calculate.bind(this, ...args)
        master[Symbol.toStringTag] = `${this}.${name}()`

        try {
            if (slave) {
                slave.sync_begin()
                master.get()
            } else {
                // @see https://medium.com/trabe/react-syntheticevent-reuse-889cd52981b6
                const event = args[0]
                // To prevent react warning - persist event
                // Event may be called in next fiber tick
                if (
                    event &&
                    event instanceof Object &&
                    typeof event.persist === 'function'
                )
                    event.persist()

                if ($mol_fiber.current) {
                    // if action called from fiber - wait
                    master.get()
                } else {
                    // if action called from event - fork
                    master.schedule()
                }
            }
        } finally {
            if (slave) slave.sync_end()
        }
    }
    Object.defineProperty(handler, 'name', {value: `@action ${name}`})

    const binds: WeakMap<Object, ActionMethod> = new WeakMap()

    function get() {
        const current =
            sync && $mol_fiber.current instanceof MolReactAtom
                ? $mol_fiber.current
                : undefined
        const key = current || this

        let binded = binds.get(key)
        if (binded === undefined) {
            binded = handler.bind(this, current)
            binded.t = this
            binds.set(key, binded)
        } else if (current && binded.t !== this) {
            throw new Error(`Second intance of ${this} called from ${current}`)
        }

        return binded
    }

    return {
        enumerable: descr.enumerable,
        configurable: true,
        get
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
