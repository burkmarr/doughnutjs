// Based on example: https://github.com/rollup/rollup-starter-lib
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'

// Rollup tutorial: https://rollupjs.org/tutorial/
// Rollup plugins: https://rollupjs.org/tools/

// ### TODO ### 
// Need to add CSS in

export default {
	input: 'src/main.js',
	output: {
    name: 'doughnutjs',
		file: 'build/js/doughnutjs.umd.js',
		format: 'umd', //cjs, iife
    sourcemap: true 
	},
	plugins: [
		resolve(), // So Rollup can find node libs
		commonjs(), // So Rollup can convert CommonJS modules to an ES modules
		babel({ 
			babelHelpers: 'bundled', 
			presets: ['@babel/preset-env'],
			// sourceMaps: true,
			// inputSourceMap: true
		}),
		terser()
	]
}

