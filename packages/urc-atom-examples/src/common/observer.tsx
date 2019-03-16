import {ErrorProps} from 'urc'
import {createDecorator} from 'urc-atom'
import {ErrorHandler} from './ErrorHandler'
import * as React from 'react'

export const observer = createDecorator(
    React.Component,
    (props: ErrorProps<React.ReactNode>) => (
        <ErrorHandler id={`${props.ownerId}.error`} error={props.error}>
            {props.children}
        </ErrorHandler>
    )
)
