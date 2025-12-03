import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'game.src.js',
    output: {
        file: 'game.js',
        format: 'iife',  // 立即执行函数，适合小游戏
        name: 'Game'
    },
    plugins: [
        resolve()
    ]
};

