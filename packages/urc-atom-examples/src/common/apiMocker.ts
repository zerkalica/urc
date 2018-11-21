import fetchMock from 'fetch-mock'

interface FetchMock {
    mock(mock: Mock): void
}

type MockResponse = (
    url: string,
    params: RequestInit,
    ...args: string[]
) => Object | any[]

interface Mock {
    method: string
    matcher: RegExp
    response: MockResponse
}

type MockCreator = (storage: Storage) => Mock[]

export const apiMockerContext: {
    errorRate: number | void
} = {
    errorRate: undefined
}

function delayed(
    mock: Mock,
    delay: number,
    errorRate: number,
    fakeErrorText: string
): (url: string, params: RequestInit) => Promise<MockResponse> {
    return function resp(url: string, params: RequestInit) {
        return new Promise(
            (
                resolve: (v: MockResponse) => void,
                reject: (e: Error) => void
            ) => {
                setTimeout(() => {
                    const globalRate: number | void = apiMockerContext.errorRate
                    const rate =
                        100 -
                        (globalRate === undefined
                            ? errorRate
                            : Number(globalRate))
                    if (Math.floor(Math.random() * 100) > rate) {
                        reject(new Error(fakeErrorText))
                    } else {
                        resolve((url: string, params: RequestInit) =>
                            mock.response(
                                url,
                                params,
                                ...(url.match(mock.matcher) || []).slice(1)
                            )
                        )
                    }
                }, delay)
            }
        )
    }
}

export function apiMocker({
    mocker = fetchMock,
    mocks,
    storage = localStorage,
    delay = 500,
    errorRate = 0,
    fakeErrorText = '500 Fake HTTP Error'
}: {
    mocker?: FetchMock
    mocks: MockCreator[]
    storage?: Storage
    delay?: number
    errorRate?: number
    fakeErrorText?: string
}): () => void {
    mocks.forEach(createMock => {
        createMock(storage).forEach(data => {
            mocker.mock({
                ...data,
                response: delayed(data, delay, errorRate, fakeErrorText)
            })
        })
    })

    return () => {
        fetchMock.restore()
    }
}
