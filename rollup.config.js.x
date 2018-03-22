import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'
import {minify} from 'uglify-es'

import fs from 'fs'
import path from 'path'

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')))

const babelrc = JSON.parse(fs.readFileSync(path.join(__dirname, '.babelrc')))

const magic = 'commonjs'
babelrc.babelrc = false
babelrc.plugins = babelrc.plugins.map(
    plugin => (Array.isArray(plugin) ? (plugin[0] || ''): plugin).indexOf(magic) >= 0 ? null : plugin
).filter(Boolean)
babelrc.runtimeHelpers = true

const uglifyOpts = {
    warnings: true,
    compress: {
        dead_code: true,
        unused: true,
        toplevel: true,
        warnings: true
    },
    mangle: {
        properties: false,
        toplevel: true
    }
}
function getOutput(name) {
    return [
        {xxxx: true, file: `dist/${name}.es.js`, format: 'es'},
        {xxxx: true, file: `dist/${name}.js`, format: 'cjs'},
        {xxxx: true, file: `dist/${name}.umd.js`, format: 'umd', name: name}
    ]
}

const plugins = [
    babel(babelrc)
].concat(process.env.UGLIFY === '1' ? [uglify(uglifyOpts, minify)] : [])

export default [
    {
        input: 'src/index.js',
        plugins,
        output: getOutput(pkg.name)
    },
    {
        input: 'src/createMobxAtom.js',
        plugins,
        output: getOutput('createMobxAtom')
    }
]
