import $ from 'mol_atom2_all'
const {
    $mol_fiber,
    $mol_fiber_sync,
    $mol_atom2_field,
    $mol_atom2_dict,
    $mol_fail_hidden
} = $
export const dict = $mol_atom2_dict
export const mem = $mol_atom2_field
export const fail = $mol_fail_hidden
import {MolReactAtom} from '../MolReactAtom'

export function action_sync<Host, Value>(
    obj: Host,
    name: string,
    descr: TypedPropertyDescriptor<(...args: any[]) => Value>,
) {
    return action(obj, name, descr, true)
}

export function action<Host, Value>(
    obj: Host,
    name: string,
    descr: TypedPropertyDescriptor<(...args: any[]) => Value>,
    sync?: boolean
) {
    const calculate = descr.value

    function $mol_fiber_action_wrapper(current: $.$mol_atom2 | void, ...args: any[]) {
        const master = new $mol_fiber()
        
        master.calculate = calculate.bind(this, ...args)
        master[Symbol.toStringTag] = `${this}.${name}()`

        const slave: MolReactAtom<any> | void = sync && current instanceof MolReactAtom ? current : undefined

        try {
            if (slave !== undefined) slave.sync_begin()
            return master.get()
        } finally {
            if (slave !== undefined) slave.sync_end()
        }
    }

    const binds: WeakMap<Object, (...args: any[]) => any> = new WeakMap()

    const get: () => ((...args: any[]) => any) = function() {
        const current = $mol_fiber.current
        let binded = binds.get(current)
        if (binded === undefined) {
            binded = $mol_fiber_action_wrapper.bind(this, current)
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

/**
 * Add fiber cache to fetch-like function.
 */
export function fiberize<
    Res,
    Result,
    RequestInfo,
    Init extends {signal?: AbortSignal}
>(
    fetchFn: (url: RequestInfo, init?: Init) => Promise<Res>,
    normalize: (r: Res) => Promise<Result>
): (url: RequestInfo, init?: Init) => Result {
    return $mol_fiber_sync(function fiberizedFetch(
        url: RequestInfo,
        init: Init = {} as Init
    ) {
        const controller = new AbortController()
        init.signal = controller.signal
        $mol_fiber.current.abort = controller.abort.bind(controller)
        return fetchFn(url, init).then(normalize)
    })
}
