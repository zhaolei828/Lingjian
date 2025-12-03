// ========== 微信/抖音小游戏入口 ==========
// 灵剑 · 血色秘境

import './js/libs/weapp-adapter.js';  // 适配层（如需要）
import { Platform } from './js/platform.js';
import { GameUI } from './js/game-ui.js';
import { UnifiedArenaEngine } from './js/arena-unified.js';

// 获取画布
const canvas = Platform.getMainCanvas();
const ctx = canvas.getContext('2d');

// 获取系统信息
const systemInfo = Platform.getSystemInfo();

// 设置画布大小
canvas.width = systemInfo.windowWidth * systemInfo.pixelRatio;
canvas.height = systemInfo.windowHeight * systemInfo.pixelRatio;

// 缩放画布以适配设备像素比
ctx.scale(systemInfo.pixelRatio, systemInfo.pixelRatio);

// 逻辑尺寸
const width = systemInfo.windowWidth;
const height = systemInfo.windowHeight;

Platform.log(`游戏初始化: ${width}x${height}, pixelRatio: ${systemInfo.pixelRatio}`);

// 创建游戏引擎
const engine = new UnifiedArenaEngine(canvas, width, height);

// 创建游戏 UI（传入逻辑尺寸）
const gameUI = new GameUI(canvas, engine, width, height);

// 连接引擎和 UI
engine.setUI(gameUI);

// 游戏主循环
let lastTime = Platform.now();

function gameLoop() {
    const currentTime = Platform.now();
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // 限制最大 dt
    lastTime = currentTime;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 更新引擎
    engine.update(dt);
    
    // 更新 UI
    gameUI.update(dt);
    
    // 绘制引擎（游戏内容）
    engine.draw();
    
    // 绘制 UI（覆盖在游戏上层）
    gameUI.draw();
    
    // 下一帧
    Platform.requestAnimationFrame(gameLoop);
}

// 启动游戏循环
Platform.requestAnimationFrame(gameLoop);

// 全局错误处理
if (typeof wx !== 'undefined') {
    wx.onError((err) => {
        Platform.error('游戏错误:', err);
    });
}

Platform.log('灵剑 · 血色秘境 启动完成');

