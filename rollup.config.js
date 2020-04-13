import typescript from 'rollup-plugin-typescript2';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    input: './src/index.ts',
    plugins: [
        nodeResolve(),
        commonjs(),
        typescript({
            tsconfigOverride: {
                compilerOptions: { module: 'esnext' }
            }
        })
    ],
    output: [{
        file: 'dist/movie.cjs.js',
        format: 'cjs',
        sourcemap: true
    }, {
        file: 'dist/movie.es.js',
        format: 'es',
        sourcemap: true
    }, {
        file: 'dist/movie.js',
        format: 'iife',
        name: 'CodeMirrorMovie',
        sourcemap: true
    }]
};
