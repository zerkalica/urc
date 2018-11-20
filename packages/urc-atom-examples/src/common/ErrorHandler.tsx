// @flow
import {keyframes, sheet, Sheet} from './css'
import * as React from 'react'

class SpinnerTheme {
    get css() {
        const spinner = {
            position: 'relative',
            zIndex: 1000,
            backgroundSize: '28px 28px',
            minWidth: '28px',
            minHeight: '28px'
        } as Sheet

        const spinnerMove = keyframes({
            from: {
                backgroundPosition: '0 0'
            },
            to: {
                backgroundPosition: '-28px 0'
            }
        })

        return sheet({
            recover: {
                paddingBottom: '1em'
            },
            content: {
                pointerEvents: 'none'
            },
            error: {
                padding: '0.1em 1em'
            },
            spinner: {
                ...spinner,
                $nest: {
                    '& *': {
                        opacity: 0.8
                    }
                },
                backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0, 0.05), rgba(0,0,0,0.05) 9px, rgba(255,255,255,.015) 10px, rgba(255,255,255,.015) 20px)`,
                animation: `${spinnerMove} .25s steps(6) infinite`
            },
            spinnerError: {
                ...spinner,
                backgroundImage: `repeating-linear-gradient(45deg, rgba(255,0,0, 0.1), rgba(255,0,0,0.1) 9px, rgba(255,255,255,.015) 10px, rgba(255,255,255,.015) 20px)`
            }
        })
    }
}

const css = new SpinnerTheme().css

export function ErrorHandler({
    id,
    error,
    children
}: {
    id: string
    children?: React.ReactNode | void
    error: Error | Promise<any>
}) {
    const retry: () => void = undefined

    return (
        <div
            id={id}
            className={error instanceof Error ? css.spinnerError : css.spinner}
        >
            {error instanceof Error && (
                <div id={`${id}-fail`} className={css.error}>
                    <h3 id={`${id}-title`}>{error.message}</h3>
                    {retry && (
                        <div id={`${id}-recover`} className={css.recover}>
                            <button id={`${id}-retry`} onClick={retry}>
                                Retry
                            </button>
                        </div>
                    )}
                    <pre id={`${id}-stack`}>{error.stack}</pre>
                </div>
            )}
            {!(error instanceof Error) && (
                <div id={`${id}-wait`} className={css.content}>
                    {children || null}
                </div>
            )}
        </div>
    )
}
