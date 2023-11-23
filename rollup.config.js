import resolve from '@rollup/plugin-node-resolve';

export default {
	input: 'src/main.js',
	output: {
		file: 'build/js/bundle.js',
		format: 'cjs', //cjs, iife
	},
	plugins: [resolve()]
};

