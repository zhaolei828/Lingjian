/**
 * 灵剑 - 移动端统一入口
 * 支持关卡模式和秘境模式，自动检测触屏/摇杆控制
 */

import { UnifiedArenaEngine, GAME_MODES } from './arena-unified.js';
import { initAvatar } from './assets.js';
import { SKILLS, ROLES, SVG_LIB, STAGES } from './data.js';
import { Platform } from './platform.js';

// ========== 移动端统一游戏引擎 ==========
export class MobileEngine extends UnifiedArenaEngine {
    constructor(canvas, width, height) {
        super(canvas, width, height);
        
        // 触屏控制状态
        this.touchStart = { x: 0, y: 0 };
        
        // 双指缩放
        this.pinch = {
            active: false,
            startDist: 0,
            startZoom: 1
        };
        
        // nipplejs 摇杆
        this.joystick = null;
        this.joystickInitialized = false;
        this.joystickInput = { active: false, dx: 0, dy: 0 };
        
        // 初始化触屏控制
        this.initTouchControls();
    }
    
    // 初始化触屏控制（拖动移动）
    initTouchControls() {
        const canvas = this.canvas;
        
        canvas.addEventListener('touchstart', (e) => {
            // 如果有摇杆，不处理触屏
            if (this.joystickInitialized) return;
            
            e.preventDefault();
            
            if (e.touches.length === 1) {
                this.touch.active = true;
                this.touchStart.x = e.touches[0].clientX;
                this.touchStart.y = e.touches[0].clientY;
                this.touch.dx = 0;
                this.touch.dy = 0;
            } else if (e.touches.length === 2) {
                // 双指缩放
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                this.pinch.startDist = Math.hypot(dx, dy);
                this.pinch.startZoom = this.gameZoom;
                this.pinch.active = true;
                this.touch.active = false;
            }
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            if (this.joystickInitialized) return;
            
            e.preventDefault();
            
            if (this.pinch.active && e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.hypot(dx, dy);
                const scale = dist / this.pinch.startDist;
                this.gameZoom = Math.max(0.5, Math.min(2, this.pinch.startZoom * scale));
            } else if (this.touch.active && e.touches.length === 1) {
                const touch = e.touches[0];
                const dx = touch.clientX - this.touchStart.x;
                const dy = touch.clientY - this.touchStart.y;
                
                const dist = Math.hypot(dx, dy);
                const deadZone = 8;
                
                if (dist > deadZone) {
                    const maxDist = 60;
                    const strength = Math.min(1, (dist - deadZone) / maxDist);
                    this.touch.dx = (dx / dist) * strength;
                    this.touch.dy = (dy / dist) * strength;
                } else {
                    this.touch.dx = 0;
                    this.touch.dy = 0;
                }
            }
        }, { passive: false });
        
        const resetTouch = (e) => {
            if (this.joystickInitialized) return;
            
            if (e.touches.length === 0) {
                this.touch.active = false;
                this.touch.dx = 0;
                this.touch.dy = 0;
                this.pinch.active = false;
            } else if (e.touches.length === 1) {
                this.pinch.active = false;
                this.touch.active = true;
                this.touchStart.x = e.touches[0].clientX;
                this.touchStart.y = e.touches[0].clientY;
            }
        };
        
        canvas.addEventListener('touchend', resetTouch);
        canvas.addEventListener('touchcancel', resetTouch);
    }
    
    // 初始化虚拟摇杆（秘境模式使用）
    initJoystick() {
        if (this.joystickInitialized) return;
        
        const zone = document.getElementById('joystick-zone');
        if (!zone || typeof nipplejs === 'undefined') {
            console.warn('摇杆区域或 nipplejs 未找到，使用触屏控制');
            return;
        }
        
        this.joystick = nipplejs.create({
            zone: zone,
            mode: 'dynamic',
            position: { left: '50%', top: '50%' },
            color: 'rgba(200, 50, 50, 0.6)',
            size: 120,
            threshold: 0.1,
            fadeTime: 250,
            multitouch: false,
            maxNumberOfNipples: 1,
            catchDistance: 150,
            shape: 'circle',
            dynamicPage: true,
            follow: true
        });
        
        this.joystick.on('move', (evt, data) => {
            if (data.force > 0.1) {
                this.joystickInput.active = true;
                const angle = data.angle.radian;
                this.joystickInput.dx = Math.cos(angle);
                this.joystickInput.dy = -Math.sin(angle);
            } else {
                this.joystickInput.active = false;
                this.joystickInput.dx = 0;
                this.joystickInput.dy = 0;
            }
        });
        
        this.joystick.on('end', () => {
            this.joystickInput.active = false;
            this.joystickInput.dx = 0;
            this.joystickInput.dy = 0;
        });
        
        // 样式
        setTimeout(() => {
            document.querySelectorAll('.back').forEach(el => el.classList.add('joystick-base'));
            document.querySelectorAll('.front').forEach(el => el.classList.add('joystick-stick'));
        }, 100);
        
        this.joystickInitialized = true;
        console.log('虚拟摇杆初始化完成');
    }
    
    // 销毁摇杆
    destroyJoystick() {
        if (this.joystick) {
            this.joystick.destroy();
            this.joystick = null;
            this.joystickInitialized = false;
        }
    }
    
    // 开始游戏 - 统一入口
    start(roleId = 'sword', mode = GAME_MODES.ARENA, stageIdx = 0) {
        super.start(roleId, mode, stageIdx);
        
        // 秘境模式初始化摇杆
        if (mode === GAME_MODES.ARENA) {
            this.initJoystick();
            
            // 隐藏操作提示
            const hint = document.getElementById('control-hint');
            if (hint) hint.style.display = 'none';
            
            // 显示摇杆区域
            const zone = document.getElementById('joystick-zone');
            if (zone) zone.style.display = 'block';
        } else {
            // 关卡模式显示触控提示
            const touchHint = document.getElementById('touch-hint');
            if (touchHint) {
                touchHint.style.display = 'block';
                setTimeout(() => { touchHint.style.display = 'none'; }, 3000);
            }
        }
        
        // 隐藏菜单
        document.getElementById('overlay')?.classList.add('hidden');
        document.getElementById('m-overlay')?.classList.add('m-hidden');
        document.getElementById('start-menu')?.classList.add('hidden');
        document.getElementById('m-start-menu')?.classList.add('m-hidden');
        
        // 显示 HUD
        const hud = document.getElementById('mobile-hud');
        const pauseBtn = document.getElementById('m-pause-btn');
        if (hud) hud.style.display = 'flex';
        if (pauseBtn) pauseBtn.classList.add('show');
        
        this.updateMobileUI();
    }
    
    // 游戏结束
    gameOver(victory = false) {
        super.gameOver(victory);
        
        // 隐藏摇杆
        const zone = document.getElementById('joystick-zone');
        if (zone) zone.style.display = 'none';
        
        // 重置输入
        this.joystickInput.active = false;
        this.joystickInput.dx = 0;
        this.joystickInput.dy = 0;
        this.touch.active = false;
        this.touch.dx = 0;
        this.touch.dy = 0;
        
        // 隐藏 HUD
        const hud = document.getElementById('mobile-hud');
        const pauseBtn = document.getElementById('m-pause-btn');
        if (hud) hud.style.display = 'none';
        if (pauseBtn) pauseBtn.classList.remove('show');
        
        // 显示结束菜单
        const overlay = document.getElementById('m-overlay') || document.getElementById('overlay');
        const victoryMenu = document.getElementById('victory-menu');
        const defeatMenu = document.getElementById('defeat-menu');
        const gameoverMenu = document.getElementById('m-gameover-menu');
        
        if (overlay) overlay.classList.remove('m-hidden', 'hidden');
        
        if (victory && victoryMenu) {
            victoryMenu.classList.remove('hidden');
        } else if (!victory && defeatMenu) {
            defeatMenu.classList.remove('hidden');
        } else if (gameoverMenu) {
            gameoverMenu.classList.remove('m-hidden');
            const finalScore = document.getElementById('m-final-score');
            if (finalScore) {
                const mins = Math.floor(this.playTime / 60);
                const secs = Math.floor(this.playTime % 60);
                finalScore.innerHTML = `存活: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}<br>斩妖: ${this.totalKills}`;
            }
        }
    }
    
    // 移动端 UI 更新
    updateMobileUI() {
        if (!this.player) return;
        
        const hpPct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        const expPct = Math.min(100, (this.player.exp / this.player.maxExp) * 100);
        
        const hpBar = document.getElementById('m-hp-bar');
        const expBar = document.getElementById('m-exp-bar');
        const kills = document.getElementById('m-kills');
        const timer = document.getElementById('m-timer');
        const rankName = document.getElementById('m-rank-name');
        const rankLvl = document.getElementById('m-rank-lvl');
        
        if (hpBar) hpBar.style.width = hpPct + '%';
        if (expBar) expBar.style.width = expPct + '%';
        if (kills) kills.textContent = this.score || this.totalKills;
        
        if (timer) {
            const mins = Math.floor(this.playTime / 60);
            const secs = Math.floor(this.playTime % 60);
            timer.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        }
        
        // 境界显示
        const ranks = ['练气期','筑基期','金丹期','元婴期','化神期','炼虚期','合体期','大乘期','渡劫期'];
        const rankIdx = Math.min(Math.floor((this.player.lvl - 1) / 3), ranks.length - 1);
        const subLvl = ((this.player.lvl - 1) % 3) + 1;
        
        if (rankName) rankName.textContent = ranks[rankIdx];
        if (rankLvl) rankLvl.textContent = subLvl + '层';
    }
    
    // 重写 updateUI
    updateUI() {
        super.updateUI();
        this.updateMobileUI();
    }
    
    // 更新 - 合并摇杆和触屏输入
    update(dt) {
        // 摇杆输入优先
        if (this.joystickInitialized && this.joystickInput.active) {
            this.touch.active = this.joystickInput.active;
            this.touch.dx = this.joystickInput.dx;
            this.touch.dy = this.joystickInput.dy;
        }
        
        super.update(dt);
    }
    
    // 暂停
    pause() {
        if (this.state === 'PLAY') {
            this.state = 'PAUSE';
        }
    }
    
    // 继续
    resume() {
        if (this.state === 'PAUSE') {
            this.state = 'PLAY';
        }
    }
    
    // 重写 loop
    loop(now) {
        let dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        
        if (this.state === 'MENU') {
            requestAnimationFrame(t => this.loop(t));
            return;
        }
        
        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
            dt = 0;
        }

        if (this.state === 'PLAY') {
            this.update(dt);
            this.draw();
        } else if (this.state === 'PAUSE' || this.state === 'VICTORY' || this.state === 'DEFEAT') {
            this.draw();
        }
        
        requestAnimationFrame(t => this.loop(t));
    }
}

// ========== 全局变量 ==========
let engine = null;
window.currentRole = 'sword';
window.currentStage = 0;
window.currentMode = GAME_MODES.STAGE; // 默认关卡模式

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    engine = new MobileEngine(canvas, canvas.width, canvas.height);
    window.Game = engine;
    window.engine = engine;
    
    // 从 URL 参数读取模式
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'stage') {
        window.currentMode = GAME_MODES.STAGE;
    }
    
    // 从 localStorage 读取角色
    const savedRole = localStorage.getItem('arenaRole');
    if (savedRole && ROLES.find(r => r.id === savedRole)) {
        window.currentRole = savedRole;
    }
    
    // 从 localStorage 读取关卡
    const savedStage = localStorage.getItem('arenaStage');
    if (savedStage !== null) {
        const stageIdx = parseInt(savedStage);
        if (!isNaN(stageIdx) && stageIdx >= 0 && stageIdx < STAGES.length) {
            window.currentStage = stageIdx;
        }
    }
    
    // 窗口大小变化
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engine.resize(canvas.width, canvas.height);
    });
    
    // 阻止默认行为
    preventDefaultBehaviors();
    
    // 初始化 UI
    setTimeout(() => {
        initMobileUI();
    }, 200);
    
    // 启动游戏循环
    requestAnimationFrame(t => engine.loop(t));
});

// 阻止默认行为
function preventDefaultBehaviors() {
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
    document.addEventListener('gestureend', e => e.preventDefault());
    
    document.getElementById('gameCanvas')?.addEventListener('touchmove', e => {
        e.preventDefault();
    }, { passive: false });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', e => {
        if (e.target.closest('.item-slot')) return;
        const now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });
}

// 初始化 UI
function initMobileUI() {
    // 角色头像
    initMobileAvatar('player_' + window.currentRole);
    
    // 角色选择（如果存在）
    initMobileRoleSelection();
    
    // 关卡选择（如果存在）
    initMobileStageSelection();
    
    // 道具槽触摸事件
    setupItemSlotTouch();
    
    // 显示当前角色（秘境菜单）
    displayCurrentRole();
}

function initMobileAvatar(roleId) {
    const container = document.getElementById('m-avatar');
    if (!container) return;
    const svgKey = roleId || 'player_sword';
    if (SVG_LIB[svgKey]) {
        container.innerHTML = SVG_LIB[svgKey];
    }
}

function initMobileRoleSelection() {
    const container = document.getElementById('m-role-grid');
    if (!container) return;
    container.innerHTML = '';
    
    ROLES.forEach(role => {
        const card = document.createElement('div');
        card.className = `m-role-card ${role.id === window.currentRole ? 'selected' : ''}`;
        card.dataset.id = role.id;
        
        card.innerHTML = `
            <div class="m-role-icon">${SVG_LIB[role.svg] || SVG_LIB.player}</div>
            <div class="m-role-name">${role.name}</div>
            <div class="m-role-desc">${role.desc.substring(0, 8)}...</div>
        `;
        
        card.onclick = () => {
            window.currentRole = role.id;
            localStorage.setItem('arenaRole', role.id);
            document.querySelectorAll('.m-role-card').forEach(el => el.classList.remove('selected'));
            card.classList.add('selected');
            initMobileAvatar('player_' + role.id);
            displayCurrentRole();
        };
        
        container.appendChild(card);
    });
}

// 关卡选择初始化（平铺卡片样式）
function initMobileStageSelection() {
    const container = document.getElementById('m-stage-grid');
    if (!container) return;
    container.innerHTML = '';
    
    // 关卡图标和描述 (去掉变体选择符FE0F)
    const stageIcons = ['🌲', '💀', '🔥', '❄', '⚔', '✨'];
    const stageDescs = ['妖兽出没', '亡灵栖息', '烈焰灼烧', '极寒之地', '古战遗址', '仙人遗府'];
    
    STAGES.forEach((stage, i) => {
        const card = document.createElement('div');
        card.className = `m-stage-card ${i === window.currentStage ? 'selected' : ''}`;
        card.dataset.stage = i;
        
        card.innerHTML = `
            <div class="m-stage-icon">${stageIcons[i] || '?'}</div>
            <div class="m-stage-name">${stage.name}</div>
            <div class="m-stage-desc">${stageDescs[i] || ''}</div>
        `;
        
        card.onclick = () => {
            window.currentStage = i;
            localStorage.setItem('arenaStage', i);
            document.querySelectorAll('.m-stage-card').forEach(el => el.classList.remove('selected'));
            card.classList.add('selected');
        };
        
        container.appendChild(card);
    });
}

function displayCurrentRole() {
    const role = ROLES.find(r => r.id === window.currentRole) || ROLES[0];
    
    const iconEl = document.getElementById('current-role-icon');
    const nameEl = document.getElementById('current-role-name');
    
    if (iconEl) iconEl.innerHTML = SVG_LIB['player_' + role.id] || SVG_LIB.player;
    if (nameEl) nameEl.textContent = role.name;
}

function setupItemSlotTouch() {
    const slots = document.querySelectorAll('.item-slot');
    slots.forEach((slot) => {
        slot.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            const slotIndex = parseInt(slot.dataset.slot);
            window.useItemCard?.(slotIndex);
            slot.style.transform = 'scale(0.9)';
            setTimeout(() => { slot.style.transform = ''; }, 100);
        }, { passive: true });
        
        slot.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });
    });
}

// ========== 全局函数 ==========

// 进入秘境
window.enterArena = function() {
    if (engine) {
        engine.start(window.currentRole, GAME_MODES.ARENA, 0);
    }
};

// 开始关卡（使用当前选中的关卡）
window.startStage = function(stageIdx) {
    // 如果没有传入参数，使用当前选中的关卡
    const stage = (stageIdx !== undefined) ? stageIdx : window.currentStage;
    if (engine) {
        engine.start(window.currentRole, GAME_MODES.STAGE, stage);
    }
};

// 初始化开始按钮事件
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('m-start-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            window.startStage(window.currentStage);
        };
    }
});

// 再次挑战
window.restartGame = window.restartArena = function() {
    document.getElementById('overlay')?.classList.add('hidden');
    document.getElementById('m-overlay')?.classList.add('m-hidden');
    document.getElementById('victory-menu')?.classList.add('hidden');
    document.getElementById('defeat-menu')?.classList.add('hidden');
    document.getElementById('m-gameover-menu')?.classList.add('m-hidden');
    
    if (engine) {
        engine.start(window.currentRole, window.currentMode, window.currentStage);
    }
};

// 返回主菜单
window.backToMain = function() {
    location.reload();
};

// 使用道具卡
window.useItemCard = function(slot) {
    if (engine && engine.itemCards) {
        engine.itemCards.useCard(slot);
    }
};

// 暂停
window.pauseGame = function() {
    if (engine) engine.pause();
    const overlay = document.getElementById('m-overlay');
    const pauseMenu = document.getElementById('m-pause-menu');
    if (overlay) overlay.classList.remove('m-hidden');
    if (pauseMenu) pauseMenu.classList.remove('m-hidden');
};

// 继续
window.resumeGame = function() {
    const overlay = document.getElementById('m-overlay');
    const pauseMenu = document.getElementById('m-pause-menu');
    if (overlay) overlay.classList.add('m-hidden');
    if (pauseMenu) pauseMenu.classList.add('m-hidden');
    if (engine) engine.resume();
};

// 升级菜单
window.showUpgradeMenu = function() {
    if (engine) engine.pause();
    
    const container = document.getElementById('m-card-list');
    if (!container) return;
    container.innerHTML = '';
    
    const overlay = document.getElementById('m-overlay');
    const levelupMenu = document.getElementById('m-levelup-menu');
    if (overlay) overlay.classList.remove('m-hidden');
    if (levelupMenu) levelupMenu.classList.remove('m-hidden');
    
    const roleId = engine?.player?.role?.id || 'sword';
    const pool = [...(SKILLS.common || []), ...(SKILLS[roleId] || [])];
    
    const opts = [];
    const tempPool = [...pool];
    for (let i = 0; i < 3; i++) {
        if (tempPool.length === 0) break;
        const idx = Math.floor(Math.random() * tempPool.length);
        opts.push(tempPool[idx]);
        tempPool.splice(idx, 1);
    }
    
    opts.forEach(sk => {
        const card = document.createElement('div');
        card.className = 'm-skill-card ' + (sk.rare ? `rare-${sk.rare}` : '');
        card.innerHTML = `
            <div class="m-skill-icon">${sk.icon}</div>
            <div class="m-skill-info">
                <div class="m-skill-name">${sk.name}</div>
                <div class="m-skill-desc">${sk.desc}</div>
            </div>
        `;
        
        card.onclick = () => {
            if (sk.effect && engine?.player?.stats) {
                sk.effect(engine.player.stats);
            }
            if (overlay) overlay.classList.add('m-hidden');
            if (levelupMenu) levelupMenu.classList.add('m-hidden');
            if (engine) engine.resume();
        };
        
        container.appendChild(card);
    });
};

// 进入关卡模式（从秘境页面跳转）
window.enterStageMode = function() {
    window.location.href = 'mobile.html?mode=stage';
};

// 进入秘境模式（从关卡页面跳转）
window.enterBloodArena = function() {
    localStorage.setItem('arenaRole', window.currentRole);
    window.location.href = 'arena-mobile.html';
};
