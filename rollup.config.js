import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

export default {
    input: 'game.src.js',
    output: {
        file: 'dist/game.js',
        format: 'iife',
        name: 'Game'
    },
    plugins: [
        resolve(),
        copy({
            targets: [
                { src: 'game.json', dest: 'dist' },
                { src: 'project.config.json', dest: 'dist' },
                { src: 'js/libs/weapp-adapter.js', dest: 'dist' }
            ]
        })
    ]
};
