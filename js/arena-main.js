// 统一版本：可切换使用 ArenaEngine 或 UnifiedArenaEngine
// import { ArenaEngine } from './arena-engine.js';
import { UnifiedArenaEngine, GAME_MODES } from './arena-unified.js';
import { ROLES, SVG_LIB } from './data.js';
import { initAvatar, loadAssets, Assets as ASSETS } from './assets.js';
import { Platform } from './platform.js';

// 全局引擎实例
let engine = null;
let currentRole = 'sword';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 获取画布
    const canvas = document.getElementById('gameCanvas');
    
    // 设置画布尺寸（重要：必须设置 canvas.width/height）
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // 使用统一引擎（不绑定 Canvas UI，使用原生 DOM 菜单）
    engine = new UnifiedArenaEngine(canvas, width, height);
    window.engine = engine;
    window.Game = engine; // 兼容 entities.js 的调用
    
    // 从 localStorage 读取主游戏选择的角色
    const savedRole = localStorage.getItem('arenaRole');
    if (savedRole && ROLES.find(r => r.id === savedRole)) {
        currentRole = savedRole;
    }
    
    // 显示当前角色信息
    displayCurrentRole();
    
    // 加载资源后初始化头像
    setTimeout(() => {
        initAvatar('player_' + currentRole);
    }, 500);
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engine.resize(canvas.width, canvas.height);
    });
    
    // 启动游戏主循环（会在 MENU 状态持续绘制背景）
    requestAnimationFrame(t => engine.loop(t));
});

// 显示当前角色
function displayCurrentRole() {
    const role = ROLES.find(r => r.id === currentRole) || ROLES[0];
    
    const iconEl = document.getElementById('current-role-icon');
    const nameEl = document.getElementById('current-role-name');
    
    if (iconEl) {
        iconEl.innerHTML = SVG_LIB['player_' + role.id] || SVG_LIB.player;
    }
    if (nameEl) {
        nameEl.textContent = role.name;
    }
}

// 进入秘境
window.enterArena = function() {
    if (engine) {
        // 隐藏菜单
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('start-menu').classList.add('hidden');
        
        // 使用秘境模式启动
        engine.start(currentRole, GAME_MODES.ARENA, 0);
    }
};

// 返回主菜单
window.backToMain = function() {
    window.location.href = 'pc.html';
};

// 再次挑战
window.restartArena = function() {
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('victory-menu').classList.add('hidden');
    document.getElementById('defeat-menu').classList.add('hidden');
    
    if (engine) {
        engine.start(currentRole);
    }
};

// 使用道具卡
window.useItemCard = function(slot) {
    if (engine && engine.itemCards) {
        engine.itemCards.useCard(slot);
    }
};

// 暴露给全局
window.engine = engine;

