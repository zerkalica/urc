import {style, stylesheet as sheet, keyframes} from 'typestyle'
import {NestedCSSProperties} from 'typestyle/lib/types'

export type Sheet = Record<string, NestedCSSProperties>

export {sheet, style, keyframes}
