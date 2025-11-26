import { ArenaEngine } from './arena-engine.js';
import { ROLES, SVG_LIB } from './data.js';
import { initAvatar, loadAssets, Assets as ASSETS } from './assets.js';

// 全局引擎实例
let engine = null;
let currentRole = 'sword';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    engine = new ArenaEngine();
    
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
        engine.start(currentRole);
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

