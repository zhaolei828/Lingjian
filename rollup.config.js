import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';

// 生成版本号：v主版本.次版本.修订号-年月日-时分秒
const now = new Date();
const version = `v1.0.${Math.floor(now.getTime() / 1000 % 100000)}-${
    now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${
    String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

console.log(`\n🔨 构建版本: ${version}\n`);

export default {
    input: 'game.src.js',
    output: {
        file: 'dist/game.js',
        format: 'iife',
        name: 'Game'
    },
    plugins: [
        replace({
            preventAssignment: true,
            values: {
                '__BUILD_VERSION__': version,
                '__BUILD_TIME__': now.toISOString()
            }
        }),
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
