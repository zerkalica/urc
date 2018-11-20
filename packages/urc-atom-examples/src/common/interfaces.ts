export type Deps<C> = C extends (props: {_: infer Context}, context?: any) => any
        ? Context
        : C extends (new (props: {_: infer Context}, ...args: any[]) => any)
            ? Context
            : C extends (new (props: infer Context, ...args: any[]) => any)
                ? Context
                : never

export type Omit<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] }
