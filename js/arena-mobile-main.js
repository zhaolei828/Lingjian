// 移动端血色秘境入口 - 使用统一引擎
import { UnifiedArenaEngine, GAME_MODES } from './arena-unified.js';
import { ROLES, SVG_LIB } from './data.js';
import { initAvatar, loadAssets } from './assets.js';
import { Platform } from './platform.js';

// 移动端血色秘境引擎 - 继承统一引擎，添加 Nipple.js 虚拟摇杆
class MobileArenaEngine extends UnifiedArenaEngine {
    constructor(canvas, width, height) {
        super(canvas, width, height);
        
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
    
    // 开始游戏 - 秘境模式
    start(roleId) {
        // 调用父类的 start（秘境模式）
        super.start(roleId, GAME_MODES.ARENA, 0);
        
        // 初始化摇杆
        this.initJoystick();
        
        // 隐藏操作提示
        const hint = document.getElementById('control-hint');
        if (hint) hint.style.display = 'none';
        
        // 显示摇杆区域
        const zone = document.getElementById('joystick-zone');
        if (zone) zone.style.display = 'block';
        
        // 隐藏菜单
        document.getElementById('overlay')?.classList.add('hidden');
        document.getElementById('start-menu')?.classList.add('hidden');
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
    
    // 更新 - 将摇杆输入传递给父类
    update(dt) {
        // 将摇杆输入传递给 touch 状态供 Player.update 使用
        this.touch.active = this.joystickInput.active;
        this.touch.dx = this.joystickInput.dx;
        this.touch.dy = this.joystickInput.dy;
        
        // 调用父类更新
        super.update(dt);
    }
}

// 全局引擎实例
let engine = null;
let currentRole = 'sword';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 获取画布
    const canvas = document.getElementById('gameCanvas');
    
    // 设置画布尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // 创建移动端秘境引擎
    engine = new MobileArenaEngine(canvas, width, height);
    
    // 暴露给全局
    window.engine = engine;
    window.Game = engine;
    
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
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engine.resize(canvas.width, canvas.height);
    });
    
    // 启动游戏循环
    requestAnimationFrame(t => engine.loop(t));
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
    document.getElementById('overlay')?.classList.add('hidden');
    document.getElementById('victory-menu')?.classList.add('hidden');
    document.getElementById('defeat-menu')?.classList.add('hidden');
    
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
