import { ArenaEngine } from './arena-engine.js';
import { ROLES, SVG_LIB } from './data.js';
import { initAvatar, loadAssets } from './assets.js';

// 移动端血色秘境引擎 - 使用 Nipple.js 虚拟摇杆
class MobileArenaEngine extends ArenaEngine {
    constructor() {
        super();
        
        // 摇杆状态
        this.joystickInput = {
            active: false,
            dx: 0,
            dy: 0
        };
        
        // nipple.js 实例
        this.joystick = null;
        
        // 初始化摇杆（延迟到游戏开始）
        this.joystickInitialized = false;
    }
    
    // 初始化虚拟摇杆
    initJoystick() {
        if (this.joystickInitialized) return;
        
        const zone = document.getElementById('joystick-zone');
        if (!zone || typeof nipplejs === 'undefined') {
            console.warn('摇杆区域或 nipplejs 未找到');
            return;
        }
        
        // 创建摇杆
        this.joystick = nipplejs.create({
            zone: zone,
            mode: 'dynamic',        // 动态模式：在触摸位置创建摇杆
            position: { left: '50%', top: '50%' },
            color: 'rgba(200, 50, 50, 0.6)',
            size: 120,
            threshold: 0.1,         // 死区阈值
            fadeTime: 250,          // 淡出时间
            multitouch: false,      // 单摇杆
            maxNumberOfNipples: 1,
            lockX: false,
            lockY: false,
            catchDistance: 150,     // 可激活距离
            shape: 'circle',
            dynamicPage: true,
            follow: true            // 跟随手指
        });
        
        // 摇杆移动事件
        this.joystick.on('move', (evt, data) => {
            if (data.force > 0.1) {
                this.joystickInput.active = true;
                // 使用弧度直接计算方向向量
                const angle = data.angle.radian;
                this.joystickInput.dx = Math.cos(angle);
                this.joystickInput.dy = -Math.sin(angle); // 屏幕Y轴向下，取反
            } else {
                this.joystickInput.active = false;
                this.joystickInput.dx = 0;
                this.joystickInput.dy = 0;
            }
        });
        
        // 摇杆释放事件
        this.joystick.on('end', () => {
            this.joystickInput.active = false;
            this.joystickInput.dx = 0;
            this.joystickInput.dy = 0;
        });
        
        // 自定义摇杆样式
        this.styleJoystick();
        
        this.joystickInitialized = true;
        console.log('虚拟摇杆初始化完成');
    }
    
    // 自定义摇杆外观
    styleJoystick() {
        // 等待DOM更新后添加样式
        setTimeout(() => {
            const backs = document.querySelectorAll('.back');
            const fronts = document.querySelectorAll('.front');
            
            backs.forEach(el => {
                el.classList.add('joystick-base');
            });
            
            fronts.forEach(el => {
                el.classList.add('joystick-stick');
            });
        }, 100);
    }
    
    // 销毁摇杆
    destroyJoystick() {
        if (this.joystick) {
            this.joystick.destroy();
            this.joystick = null;
            this.joystickInitialized = false;
        }
    }
    
    // 开始游戏
    start(roleId) {
        // 先调用父类的 start
        super.start(roleId);
        
        // 初始化摇杆
        this.initJoystick();
        
        // 隐藏操作提示
        const hint = document.getElementById('control-hint');
        if (hint) hint.style.display = 'none';
        
        // 显示摇杆区域
        const zone = document.getElementById('joystick-zone');
        if (zone) zone.style.display = 'block';
    }
    
    // 游戏结束
    gameOver(victory = false) {
        super.gameOver(victory);
        
        // 隐藏摇杆区域
        const zone = document.getElementById('joystick-zone');
        if (zone) zone.style.display = 'none';
        
        // 重置摇杆输入
        this.joystickInput.active = false;
        this.joystickInput.dx = 0;
        this.joystickInput.dy = 0;
    }
    
    // 更新
    update(dt) {
        // 将摇杆输入传递给 touch 状态供 Player.update 使用
        this.touch.active = this.joystickInput.active;
        this.touch.dx = this.joystickInput.dx;
        this.touch.dy = this.joystickInput.dy;
        
        // 调用父类更新
        super.update(dt);
    }
    
    // 重写绘制方法
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        
        ctx.save();
        
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
    
    // 暴露给全局
    window.engine = engine;
    
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
    
    // 阻止页面滚动和缩放
    preventDefaultBehaviors();
    
    // 初始化道具槽触摸事件
    setupItemSlotTouch();
});

// 阻止默认行为（缩放、滚动等）
function preventDefaultBehaviors() {
    // 阻止双指缩放
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());
    
    // 阻止触摸滚动（仅在游戏区域）
    document.getElementById('gameCanvas')?.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // 阻止双击缩放（但不阻止道具槽的双击）
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        // 如果是道具槽，不阻止
        if (e.target.closest('.item-slot')) return;
        
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
}

// 初始化道具槽触摸事件
function setupItemSlotTouch() {
    const slots = document.querySelectorAll('.item-slot');
    slots.forEach((slot, index) => {
        // 触摸开始时立即响应（比 click 更快）
        slot.addEventListener('touchstart', (e) => {
            e.stopPropagation(); // 阻止事件冒泡到摇杆区域
            const slotIndex = parseInt(slot.dataset.slot);
            useItemCard(slotIndex);
            
            // 视觉反馈
            slot.style.transform = 'scale(0.9)';
            setTimeout(() => {
                slot.style.transform = '';
            }, 100);
        }, { passive: true });
        
        // 阻止触摸移动冒泡
        slot.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        }, { passive: true });
    });
}

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
