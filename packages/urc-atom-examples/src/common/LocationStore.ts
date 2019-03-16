import {mem, dict, object2} from 'urc-atom'

export class LocationStore extends object2 {
    constructor(
        protected _: {
            location: Location
            history: History
        },
        id: string,
        protected ns: string = 'app'
    ) {
        super()
        this[Symbol.toStringTag] = id
    }

    protected params(): URLSearchParams {
        return new URLSearchParams(this._.location.search)
    }

    protected paramsToString(params: URLSearchParams): string {
        const result = params.toString()

        return result ? `?${result}` : ''
    }

    toUrl(newParams: {[id: string]: string} = {}, hash?: string): string {
        const params = this.params()
        const keys = Object.keys(newParams)
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            const val = newParams[key]
            if (val === null || val === undefined) {
                params.delete(key)
            } else {
                params.set(key, val)
            }
        }
        const q = this.paramsToString(params)

        return `${this._.location.origin}${q}${hash ? `#${hash}` : ''}`
    }

    protected pushState(params: URLSearchParams) {
        this._.history.pushState(null, this.ns, this.paramsToString(params))
    }

    @mem get values() {
        return dict<string, string>({
            get: key => this.params().get(key),
            set: (next, key) => {
                const params = this.params()
                params.set(key, String(next))
                this.pushState(params)
                return next
            },
            abort: key => {
                const params = this.params()
                params.delete(key)
                this.pushState(params)
            },
        })
    }

    /*
    @mem.key(LocationStore.prototype.valueDestructor)
    value<V>(key: string, value?: V): V {
        const params = this.params()
        if (value === undefined) return params.get(key) as any

        params.set(key, String(value))
        this._.history.pushState(null, this.ns, this.paramsToString(params))

        return value
    }

    values(values?: Record<string, string>): ReadonlyMap<string, string> {
        if (values) {
            Object.keys(values).forEach(key => {
                this.value(key, values[key])
            })
        }

        return mem.key.map(this.value)
    }

    protected valueDestructor(key: string) {
        const params = this.params()
        params.delete(key)
        this._.history.pushState(null, this.ns, this.paramsToString(params))
    }
    */
}
