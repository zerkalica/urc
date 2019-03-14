import $ from 'mol_atom2_all'
const {$mol_fiber} = $

import {MolReactAtom} from '../MolReactAtom'
import { defer } from './reexports';

function action_sync<Host>(
    obj: Host,
    name: string,
    descr: TypedPropertyDescriptor<(...args: any[]) => void>
) {
    return action_decorator(obj, name, descr, true)
}

function action_event<Host>(
    obj: Host,
    name: string,
    descr: TypedPropertyDescriptor<(...args: any[]) => void>
) {
    return action_decorator(obj, name, descr, false, true)
}

interface ActionMethod {
    (...args: any[]): any
    t?: object | void
}

function action_decorator<Host>(
    obj: Host | (() => void),
    name: string,
    descr: TypedPropertyDescriptor<(...args: any[]) => void>,
    sync?: boolean,
    event?: boolean
) {
    if (typeof obj === 'function') {
        return defer(obj as (() => void))
    }
    const calculate = descr.value

    function handler(slave: MolReactAtom<any> | void, ...args: any[]) {
        if (slave) {
            try {
                slave.sync_begin()
                calculate.call(this, ...args)
            } finally {
                slave.sync_end()
            }
        } else if (event) {
            calculate.call(this, ...args)
        } else {
            const master = new $mol_fiber()
            master.calculate = calculate.bind(this, ...args)
            master[Symbol.toStringTag] = `${this}.${name}()`
            if ($mol_fiber.current) master.get()
            else master.schedule()
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

action_decorator.event = action_event
action_decorator.sync = action_sync

type Class<Target> = Object

export interface Action {
    <Target, Method extends ActionMethod>(
        proto: Class<Target>,
        name: string,
        descr: TypedPropertyDescriptor<Method>
    ): TypedPropertyDescriptor<Method>
    (fn: () => void): void
    event: typeof action_event
    sync: typeof action_sync
}

export const action = action_decorator as Action
