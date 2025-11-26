import { ArenaEngine } from './arena-engine.js';
import { ROLES, SVG_LIB } from './data.js';
import { initAvatar, loadAssets } from './assets.js';

// 移动端血煞秘境引擎
class MobileArenaEngine extends ArenaEngine {
    constructor() {
        super();
        
        // 触摸状态
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isTouching = false;
        this.touchMoveX = 0;
        this.touchMoveY = 0;
        
        // 双指缩放
        this.pinchStartDist = 0;
        this.currentZoom = 1;
        
        // 设置触摸事件
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        const canvas = this.canvas;
        
        // 触摸开始
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1) {
                // 单指 - 移动
                this.isTouching = true;
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
                this.touchMoveX = 0;
                this.touchMoveY = 0;
            } else if (e.touches.length === 2) {
                // 双指 - 缩放
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                this.pinchStartDist = Math.hypot(dx, dy);
            }
        }, { passive: false });
        
        // 触摸移动
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && this.isTouching) {
                // 单指移动
                const dx = e.touches[0].clientX - this.touchStartX;
                const dy = e.touches[0].clientY - this.touchStartY;
                
                this.touchMoveX = dx * 0.5;
                this.touchMoveY = dy * 0.5;
                
                // 更新起点实现连续移动
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // 双指缩放
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.hypot(dx, dy);
                
                if (this.pinchStartDist > 0) {
                    const scale = dist / this.pinchStartDist;
                    this.currentZoom = Math.max(0.5, Math.min(2, this.currentZoom * scale));
                }
                this.pinchStartDist = dist;
            }
        }, { passive: false });
        
        // 触摸结束
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 0) {
                this.isTouching = false;
                this.touchMoveX = 0;
                this.touchMoveY = 0;
            }
            
            if (e.touches.length < 2) {
                this.pinchStartDist = 0;
            }
        }, { passive: false });
    }
    
    update(dt) {
        // 更新 touch 状态供 Player.update 使用
        if (this.isTouching && (Math.abs(this.touchMoveX) > 0.1 || Math.abs(this.touchMoveY) > 0.1)) {
            this.touch.active = true;
            // 归一化方向
            const len = Math.hypot(this.touchMoveX, this.touchMoveY);
            if (len > 0) {
                this.touch.dx = this.touchMoveX / len;
                this.touch.dy = this.touchMoveY / len;
            }
        } else {
            this.touch.active = false;
            this.touch.dx = 0;
            this.touch.dy = 0;
        }
        
        // 衰减
        this.touchMoveX *= 0.8;
        this.touchMoveY *= 0.8;
        
        // 调用父类更新
        super.update(dt);
    }
    
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        
        ctx.save();
        
        // 应用缩放
        ctx.translate(this.width / 2, this.height / 2);
        ctx.scale(this.currentZoom, this.currentZoom);
        ctx.translate(-this.width / 2, -this.height / 2);
        
        // 震屏效果
        if (this.shake > 0) {
            ctx.translate(
                (Math.random() - 0.5) * this.shake * 10,
                (Math.random() - 0.5) * this.shake * 10
            );
        }
        
        // 相机偏移
        ctx.translate(-this.camera.x, -this.camera.y);
        
        // 绘制背景
        this.drawBackground(ctx);
        
        // 绘制边缘
        this.drawArenaEdge(ctx);
        
        // 绘制金币
        const ASSETS = {}; // 从父类获取
        this.coins.forEach(c => c.draw(ctx, ASSETS));
        
        // 绘制敌人
        this.enemies.forEach(e => e.draw(ctx, ASSETS));
        
        // 绘制子弹
        this.drawBullets(ctx);
        
        // 绘制玩家
        if (this.player) {
            this.player.draw(ctx, ASSETS);
        }
        
        // 绘制粒子
        this.particles.forEach(p => p.draw(ctx));
        
        // 绘制文字
        this.texts.forEach(t => t.draw(ctx));
        
        ctx.restore();
        
        // 绘制血雾效果
        this.drawBloodMist(ctx);
    }
}

// 全局引擎实例
let engine = null;
let currentRole = 'sword';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    engine = new MobileArenaEngine();
    
    // 从 localStorage 读取主游戏选择的角色
    const savedRole = localStorage.getItem('arenaRole');
    if (savedRole && ROLES.find(r => r.id === savedRole)) {
        currentRole = savedRole;
    }
    
    // 显示当前角色信息
    displayCurrentRole();
    
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
    window.location.href = 'mobile.html';
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

