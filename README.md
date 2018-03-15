# Universal react connect

Helpers for creating tools like react-redux, mobx-react with minimal boilerplate.

## Mobx simple example

```js
import {createConnect} from 'urc'
import createMobxAtom from 'urc/createMobxAtom'
import {observable, Reaction} from 'mobx'
import React from 'react'

const connect = createConnect({
    ReactAtom: createMobxAtom(Reaction),
    BaseComponent: React.Component
})

class Store {
    @observable name = 'test'
}

const store = new Store()

const MyPureComponent = connect(() =>
    <div>
        {store.name}
        <br/>
        <input value={store.name} onInput={({target}) => store.name = target.value}/>
    </div>
)
// or

@connect class MyComponent extends React.Component {
    render() {
        // ...
    }
}
```

## Error handling example

Connected component calls renderError if exception throwed in render.

```js
// ...
function renderError({error, children}) {
    return <div>
        <pre>{error.stack.toString()}</pre>
    </div>
}

const connect = createConnect({
    ReactAtom: createMobxAtom(Reaction),
    BaseComponent: React.Component,
    renderError
})

const MyPureComponent = connect(() => {
    throw new Error('test')
})
```

## Custom component mixin

```js
import {ObserverComponent, createConnect} from 'urc'

class MyObserverComponent<Props, State, Context, Element> extends ObserverComponent<Props, State, Context, Element> {
    static instance: number

    componentWillMount() {
        super.componentWillMount()
        const cns: Function = this.constructor
        if (cns.instance === undefined) cns.instance = 0

        cns.instance++
    }

    componentWillUnmount() {
        this.constructor.instance--
        super.componentWillUnmount()
    }

    __value(isPropsChanged: boolean) {
        const value = super.__value(isPropsChanged)
        return value
    }

    _getContext(key: Function, propsChanged: boolean): Context {
        return this.context
    }
}

const connect = createConnect({
    ReactAtom: createMobxAtom(Reaction),
    BaseComponent: React.Component,
    MixinComponent: MyObserverComponent
})

const MyPureComponent = connect(() => {
    // ...
})
```

## lom_atom example

```js
import {createConnect} from 'urc'
import {mem, ReactAtom} from 'lom_atom'
import React from 'react'

const connect = createConnect({
    ReactAtom,
    BaseComponent: React.Component
})

class Store {
    @mem name = 'test'
}

const store = new Store()

const MyPureComponent = connect(() =>
    <div>
        {store.name}
        <br/>
        <input value={store.name} onInput={({target}) => store.name = target.value}/>
    </div>
)
```
