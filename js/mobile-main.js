/**
 * 灵剑 - 移动端入口（统一引擎版）
 * 使用 UnifiedArenaEngine 的关卡模式，添加触屏控制
 */

import { UnifiedArenaEngine, GAME_MODES } from './arena-unified.js';
import { initAvatar } from './assets.js';
import { SKILLS, ROLES, SVG_LIB, STAGES } from './data.js';
import { Platform } from './platform.js';

// ========== 移动端游戏引擎扩展 ==========
class MobileGameEngine extends UnifiedArenaEngine {
    constructor(canvas, width, height) {
        super(canvas, width, height);
        
        // 触屏控制状态（已在父类中定义 this.touch）
        // 额外的触屏追踪
        this.touchStart = { x: 0, y: 0 };
        
        // 双指缩放
        this.pinch = {
            active: false,
            startDist: 0,
            startZoom: 1
        };
        
        // 初始化触屏控制
        this.initTouchControls();
    }
    
    initTouchControls() {
        const canvas = this.canvas;
        
        // 单指触屏移动
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1) {
                // 单指：开始移动
                this.touch.active = true;
                this.touchStart.x = e.touches[0].clientX;
                this.touchStart.y = e.touches[0].clientY;
                this.touch.dx = 0;
                this.touch.dy = 0;
            } else if (e.touches.length === 2) {
                // 双指：开始缩放
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                this.pinch.startDist = Math.hypot(dx, dy);
                this.pinch.startZoom = this.gameZoom;
                this.pinch.active = true;
                this.touch.active = false;
            }
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (this.pinch.active && e.touches.length === 2) {
                // 双指缩放
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.hypot(dx, dy);
                const scale = dist / this.pinch.startDist;
                this.gameZoom = Math.max(0.5, Math.min(2, this.pinch.startZoom * scale));
            } else if (this.touch.active && e.touches.length === 1) {
                // 单指移动
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
    
    // 开始游戏 - 关卡模式
    start(stageIdx = 0, roleId = 'sword') {
        // 调用父类的 start（关卡模式）
        super.start(roleId, GAME_MODES.STAGE, stageIdx);
        
        // 移动端 UI
        const overlay = document.getElementById('m-overlay');
        const startMenu = document.getElementById('m-start-menu');
        const hud = document.getElementById('mobile-hud');
        const pauseBtn = document.getElementById('m-pause-btn');
        const touchHint = document.getElementById('touch-hint');
        
        if (overlay) overlay.classList.add('m-hidden');
        if (startMenu) startMenu.classList.add('m-hidden');
        if (hud) hud.style.display = 'flex';
        if (pauseBtn) pauseBtn.classList.add('show');
        if (touchHint) touchHint.style.display = 'block';
        
        // 3秒后隐藏触控提示
        setTimeout(() => {
            if (touchHint) touchHint.style.display = 'none';
        }, 3000);
        
        this.updateMobileUI();
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
        if (kills) kills.textContent = this.score;
        
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
    
    // 重写 updateUI，同时更新移动端 UI
    updateUI() {
        super.updateUI();
        this.updateMobileUI();
    }
    
    // 重写 gameOver
    gameOver(victory = false) {
        this.state = victory ? 'VICTORY' : 'DEFEAT';
        
        const hud = document.getElementById('mobile-hud');
        const pauseBtn = document.getElementById('m-pause-btn');
        const overlay = document.getElementById('m-overlay');
        const gameoverMenu = document.getElementById('m-gameover-menu');
        const finalScore = document.getElementById('m-final-score');
        
        if (hud) hud.style.display = 'none';
        if (pauseBtn) pauseBtn.classList.remove('show');
        if (overlay) overlay.classList.remove('m-hidden');
        if (gameoverMenu) gameoverMenu.classList.remove('m-hidden');
        
        if (finalScore) {
            const mins = Math.floor(this.playTime / 60);
            const secs = Math.floor(this.playTime % 60);
            finalScore.innerHTML = `
                存活: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}<br>
                斩妖: ${this.totalKills}
            `;
        }
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
    
    // 重写 loop，处理暂停状态
    loop(now) {
        let dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        
        // MENU 状态不绘制
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
        } else if (this.state === 'PAUSE') {
            this.draw(); // 暂停时仍然绘制画面
        } else if (this.state === 'VICTORY' || this.state === 'DEFEAT') {
            this.draw(); // 结束状态也绘制
        }
        
        requestAnimationFrame(t => this.loop(t));
    }
}

// ========== 初始化 ==========
let engine = null;

document.addEventListener('DOMContentLoaded', () => {
    // 获取画布
    const canvas = document.getElementById('gameCanvas');
    
    // 设置画布尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 创建引擎
    engine = new MobileGameEngine(canvas, canvas.width, canvas.height);
    window.Game = engine;
    window.currentRole = 'sword';
    window.currentStage = 0;
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engine.resize(canvas.width, canvas.height);
    });
    
    // 启动游戏循环
    requestAnimationFrame(t => engine.loop(t));
    
    // 初始化 UI
    setTimeout(() => {
        initMobileAvatar('player_' + window.currentRole);
        initMobileRoleSelection();
    }, 200);
});

// ========== UI 函数 ==========
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
            document.querySelectorAll('.m-role-card').forEach(el => el.classList.remove('selected'));
            card.classList.add('selected');
            initMobileAvatar('player_' + role.id);
        };
        
        container.appendChild(card);
    });
}

function initMobileAvatar(roleId) {
    const container = document.getElementById('m-avatar');
    if (!container) return;
    
    const svgKey = roleId || 'player_sword';
    if (SVG_LIB[svgKey]) {
        container.innerHTML = SVG_LIB[svgKey];
    }
}

// 场景选择按钮
document.querySelectorAll('.m-stage-btn')?.forEach(btn => {
    btn.onclick = () => {
        window.currentStage = parseInt(btn.dataset.stage);
        window.Game.start(window.currentStage, window.currentRole);
    };
});

// 开始按钮
const startBtn = document.getElementById('m-start-btn');
if (startBtn) {
    startBtn.onclick = () => {
        window.Game.start(window.currentStage, window.currentRole);
    };
}

// 暂停按钮
const pauseBtn = document.getElementById('m-pause-btn');
if (pauseBtn) {
    pauseBtn.onclick = () => {
        window.Game.pause();
        const overlay = document.getElementById('m-overlay');
        const pauseMenu = document.getElementById('m-pause-menu');
        if (overlay) overlay.classList.remove('m-hidden');
        if (pauseMenu) pauseMenu.classList.remove('m-hidden');
    };
}

// 继续按钮
const resumeBtn = document.getElementById('m-resume-btn');
if (resumeBtn) {
    resumeBtn.onclick = () => {
        const overlay = document.getElementById('m-overlay');
        const pauseMenu = document.getElementById('m-pause-menu');
        if (overlay) overlay.classList.add('m-hidden');
        if (pauseMenu) pauseMenu.classList.add('m-hidden');
        window.Game.resume();
    };
}

// 退出按钮
const quitBtn = document.getElementById('m-quit-btn');
if (quitBtn) {
    quitBtn.onclick = () => {
        location.reload();
    };
}

// 重新开始
const restartBtn = document.getElementById('m-restart-btn');
if (restartBtn) {
    restartBtn.onclick = () => {
        location.reload();
    };
}

// 升级菜单
window.showUpgradeMenu = function() {
    window.Game.pause();
    
    const container = document.getElementById('m-card-list');
    if (!container) return;
    container.innerHTML = '';
    
    const overlay = document.getElementById('m-overlay');
    const levelupMenu = document.getElementById('m-levelup-menu');
    if (overlay) overlay.classList.remove('m-hidden');
    if (levelupMenu) levelupMenu.classList.remove('m-hidden');
    
    // 构建技能池
    const roleId = window.Game.player?.role?.id || 'sword';
    const pool = [...(SKILLS.common || []), ...(SKILLS[roleId] || [])];
    
    // 随机选择3个技能
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
            if (sk.effect && window.Game.player?.stats) {
                sk.effect(window.Game.player.stats);
            }
            if (overlay) overlay.classList.add('m-hidden');
            if (levelupMenu) levelupMenu.classList.add('m-hidden');
            window.Game.resume();
        };
        
        container.appendChild(card);
    });
};

// 进入血色秘境
window.enterBloodArena = function() {
    localStorage.setItem('arenaRole', window.currentRole);
    window.location.href = 'arena-mobile.html';
};
