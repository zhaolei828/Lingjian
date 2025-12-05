// ========== 微信/抖音小游戏入口 ==========
// 灵剑 · 血色秘境

const BUILD_VERSION = '__BUILD_VERSION__';
const BUILD_TIME = '__BUILD_TIME__';
console.log('==========================================');
console.log(`[灵剑] 版本: ${BUILD_VERSION}`);
console.log(`[构建时间] ${BUILD_TIME}`);
console.log('==========================================');

// 首先加载适配层（必须最先）
import './js/libs/weapp-adapter.js';

// 静态导入所有模块
import { Platform } from './js/platform.js';
import { UnifiedArenaEngine, GAME_MODES } from './js/arena-unified.js';
import { GameUI } from './js/game-ui.js';

console.log('[game.js] 所有模块加载完成');

// 获取小游戏 API
const api = typeof wx !== 'undefined' ? wx : (typeof tt !== 'undefined' ? tt : null);

// 获取系统信息
const systemInfo = api.getSystemInfoSync();
console.log('[game.js] 系统信息:', systemInfo);

// 获取主画布（由 weapp-adapter 创建的第一个 canvas）
const canvas = GameGlobal.canvas || api.createCanvas();
const ctx = canvas.getContext('2d');

// 设置画布大小
canvas.width = systemInfo.windowWidth;
canvas.height = systemInfo.windowHeight;

const width = systemInfo.windowWidth;
const height = systemInfo.windowHeight;

console.log(`[game.js] 画布: ${width}x${height}`);

// 设置全局 canvas
if (typeof GameGlobal !== 'undefined') {
    GameGlobal.canvas = canvas;
    GameGlobal.screenWidth = width;
    GameGlobal.screenHeight = height;
}

// 显示加载中
ctx.fillStyle = '#1a0a0a';
ctx.fillRect(0, 0, width, height);
ctx.fillStyle = '#f1c40f';
ctx.font = '24px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('灵剑 · 血色秘境', width / 2, height / 2 - 30);
ctx.fillStyle = '#888';
ctx.font = '16px sans-serif';
ctx.fillText('正在初始化...', width / 2, height / 2 + 10);

// 初始化游戏
try {
    console.log('[game.js] 创建引擎...');
    
    // 创建游戏引擎
    const engine = new UnifiedArenaEngine(canvas, width, height);
    
    // 创建游戏 UI
    const gameUI = new GameUI(canvas, engine, width, height);
    
    // 连接引擎和 UI
    engine.setUI(gameUI);
    
    // 暴露到全局
    GameGlobal.Game = engine;
    GameGlobal.GameUI = gameUI;
    
    console.log('[game.js] 引擎创建完成，启动游戏循环...');
    
    // 游戏主循环
    let lastTime = Date.now();
    
    function gameLoop() {
        const currentTime = Date.now();
        const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;
        
        // 清空画布
        ctx.fillStyle = '#1a0a0a';
        ctx.fillRect(0, 0, width, height);
        
        // 更新
        gameUI.update(dt);
        if (engine.state === 'PLAY') {
            engine.update(dt);
        }
        
        // 绘制
        if (engine.state !== 'MENU') {
            engine.draw();
        }
        gameUI.draw();
        
        // 下一帧
        requestAnimationFrame(gameLoop);
    }
    
    // 启动游戏循环
    requestAnimationFrame(gameLoop);
    
    console.log('[game.js] 灵剑 · 血色秘境 启动完成!');
    
} catch (err) {
    console.error('[game.js] 初始化失败:', err);
    console.error(err.stack || err);
    
    // 显示错误
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ff4444';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('初始化失败', width / 2, height / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    const errMsg = String(err.message || err);
    ctx.fillText(errMsg.substring(0, 50), width / 2, height / 2 + 20);
}

// 全局错误处理
if (api && api.onError) {
    api.onError((err) => {
        console.error('[game.js] 运行时错误:', err);
    });
}
