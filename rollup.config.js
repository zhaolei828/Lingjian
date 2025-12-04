import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

export default {
    input: 'game.src.js',
    output: {
        file: 'dist/game.js',
        format: 'iife',  // 立即执行函数，适合小游戏
        name: 'Game'
    },
    plugins: [
        resolve(),
        copy({
            targets: [
                { src: 'game.json', dest: 'dist' },
                { src: 'project.config.json', dest: 'dist' },
                { src: 'js/libs/weapp-adapter.js', dest: 'dist' }
                // img 不打包，生产环境使用 CDN 图片
            ]
        })
    ]
};

