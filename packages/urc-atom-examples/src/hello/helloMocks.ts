import {ModelStorage} from '../common'

function getBody(body: (string | Object) | void): any {
    return typeof body === 'string' ? JSON.parse(body) : ((body || {}) as any)
}

export function helloMocks(rawStorage: Storage) {
    const storage = new ModelStorage(rawStorage, 'helloMocks.user', 'User')

    return [
        {
            method: 'GET',
            matcher: new RegExp('^/api/hello/user$'),
            response(url: string, params: RequestInit) {
                return {name: storage.get()}
            }
        },

        {
            method: 'PUT',
            matcher: new RegExp('/api/hello/user'),
            response(url: string, params: RequestInit) {
                const name = getBody(params.body).name
                storage.set(name)

                return {name}
            }
        }
    ]
}
