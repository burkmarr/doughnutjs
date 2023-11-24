// Based on example: https://github.com/rollup/rollup-starter-lib
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'

export default {
	input: 'src/main.js',
	output: {
    name: 'doughnutjs',
		file: 'build/js/doughnutjs.umd.js',
		format: 'umd', //cjs, iife
    sourcemap: true
	},
	// sourcemap: true,
	plugins: [
	  resolve(), // so Rollup can find node libs
    commonjs(), // so Rollup can convert CommonJS modules to an ES modules
    babel({ babelHelpers: 'bundled', presets: ['@babel/preset-env'] }),
    terser()
	]
}

