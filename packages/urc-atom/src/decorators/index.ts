import $ from 'mol_atom2_all'
const {$mol_fiber, $mol_fiber_sync, $mol_atom2_field, $mol_atom2_dict, $mol_fiber_method} = $
export const dict = $mol_atom2_dict
export const mem = $mol_atom2_field
export const action = $mol_fiber_method

/**
 * Add fiber cache to fetch-like function.
 */
export function fiberize<Res, Result, RequestInfo, Init extends {signal?: AbortSignal}>(
    fetchFn: (url: RequestInfo, init?: Init) => Promise<Res>,
    normalize: (r: Res) => Promise<Result>
): (url: RequestInfo, init?: Init) => Result {
    return $mol_fiber_sync(function fiberizedFetch(url: RequestInfo, init: Init = {} as Init) {
        const controller = new AbortController
        init.signal = controller.signal
        $mol_fiber.current.abort = controller.abort.bind(controller)
        return fetchFn(url, init).then(normalize)
    })
}
