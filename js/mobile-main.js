/**
 * 灵剑 - 移动端入口
 * 复用 PC 端核心模块，添加触屏控制
 */

import { GameEngine } from './engine.js';
import { initAvatar } from './assets.js';
import { SKILLS, ROLES, SVG_LIB } from './data.js';

// ========== 移动端游戏引擎扩展 ==========
class MobileGameEngine extends GameEngine {
    constructor() {
        super();
        
        // 触屏控制状态
        this.touch = {
            active: false,
            startX: 0,
            startY: 0,
            dx: 0,
            dy: 0
        };
        
        // 双指缩放
        this.pinch = {
            active: false,
            startDist: 0,
            startZoom: 1
        };
        this.gameZoom = 1;
        
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
                this.touch.startX = e.touches[0].clientX;
                this.touch.startY = e.touches[0].clientY;
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
                const dx = touch.clientX - this.touch.startX;
                const dy = touch.clientY - this.touch.startY;
                
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
                this.touch.startX = e.touches[0].clientX;
                this.touch.startY = e.touches[0].clientY;
            }
        };
        
        canvas.addEventListener('touchend', resetTouch);
        canvas.addEventListener('touchcancel', resetTouch);
    }
    
    // 重写 start 方法，处理移动端 UI
    start(stageIdx = 0, roleId = 'sword') {
        super.start(stageIdx, roleId);
        
        // 移动端 UI
        document.getElementById('m-overlay').classList.add('m-hidden');
        document.getElementById('m-start-menu').classList.add('m-hidden');
        document.getElementById('mobile-hud').style.display = 'flex';
        document.getElementById('m-pause-btn').classList.add('show');
        document.getElementById('touch-hint').style.display = 'block';
        
        // 3秒后隐藏触控提示
        setTimeout(() => {
            document.getElementById('touch-hint').style.display = 'none';
        }, 3000);
        
        this.updateMobileUI();
    }
    
    // 移动端 UI 更新
    updateMobileUI() {
        if (!this.player) return;
        
        const hpPct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        const expPct = Math.min(100, (this.player.exp / this.player.maxExp) * 100);
        
        document.getElementById('m-hp-bar').style.width = hpPct + '%';
        document.getElementById('m-exp-bar').style.width = expPct + '%';
        document.getElementById('m-kills').textContent = this.score;
        
        const mins = Math.floor(this.playTime / 60);
        const secs = Math.floor(this.playTime % 60);
        document.getElementById('m-timer').textContent = 
            String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        
        // 境界显示
        const ranks = ['练气期','筑基期','金丹期','元婴期','化神期','炼虚期','合体期','大乘期','渡劫期'];
        const rankIdx = Math.min(Math.floor(this.player.lvl / 3), ranks.length - 1);
        const subLvl = (this.player.lvl % 3) + 1;
        document.getElementById('m-rank-name').textContent = ranks[rankIdx];
        document.getElementById('m-rank-lvl').textContent = subLvl + '层';
    }
    
    // 重写 updateUI，同时更新移动端 UI
    updateUI() {
        super.updateUI();
        this.updateMobileUI();
    }
    
    // 重写 gameOver
    gameOver() {
        this.state = 'OVER';
        document.getElementById('mobile-hud').style.display = 'none';
        document.getElementById('m-pause-btn').classList.remove('show');
        document.getElementById('m-overlay').classList.remove('m-hidden');
        document.getElementById('m-gameover-menu').classList.remove('m-hidden');
        
        const mins = Math.floor(this.playTime / 60);
        const secs = Math.floor(this.playTime % 60);
        document.getElementById('m-final-score').innerHTML = `
            存活: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}<br>
            斩妖: ${this.score}
        `;
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
        
        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
            dt = 0;
        }

        if (this.state === 'PLAY') {
            this.update(dt);
            this.draw();
        } else if (this.state === 'PAUSE') {
            this.draw(); // 暂停时仍然绘制画面
        }
        
        requestAnimationFrame(t => this.loop(t));
    }
}

// ========== 移动端 Touch 输入注入到 Player ==========
// 修改 Player 的移动逻辑，支持触屏输入
const originalPlayerUpdate = window.Game ? null : true; // placeholder

// ========== 初始化 ==========
window.Game = new MobileGameEngine();
window.currentRole = 'sword';
window.currentStage = 0;

// 注入触屏输入到 keys 对象（让 entities.js 可以使用）
window.Game.touchJoystick = window.Game.touch;

// ========== UI 初始化 ==========
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

// 场景选择
document.querySelectorAll('.m-stage-btn').forEach(btn => {
    btn.onclick = () => {
        window.currentStage = parseInt(btn.dataset.stage);
        window.Game.start(window.currentStage, window.currentRole);
    };
});

// 开始按钮
document.getElementById('m-start-btn').onclick = () => {
    window.Game.start(window.currentStage, window.currentRole);
};

// 暂停按钮
document.getElementById('m-pause-btn').onclick = () => {
    window.Game.pause();
    document.getElementById('m-overlay').classList.remove('m-hidden');
    document.getElementById('m-pause-menu').classList.remove('m-hidden');
};

// 继续按钮
document.getElementById('m-resume-btn').onclick = () => {
    document.getElementById('m-overlay').classList.add('m-hidden');
    document.getElementById('m-pause-menu').classList.add('m-hidden');
    window.Game.resume();
};

// 退出按钮
document.getElementById('m-quit-btn').onclick = () => {
    location.reload();
};

// 重新开始
document.getElementById('m-restart-btn').onclick = () => {
    location.reload();
};

// 升级菜单
window.showUpgradeMenu = function() {
    window.Game.pause();
    
    const container = document.getElementById('m-card-list');
    container.innerHTML = '';
    
    document.getElementById('m-overlay').classList.remove('m-hidden');
    document.getElementById('m-levelup-menu').classList.remove('m-hidden');
    
    // 构建技能池
    const roleId = window.Game.player.role.id;
    const pool = [...SKILLS.common, ...(SKILLS[roleId] || [])];
    
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
            sk.effect(window.Game.player.stats);
            document.getElementById('m-overlay').classList.add('m-hidden');
            document.getElementById('m-levelup-menu').classList.add('m-hidden');
            window.Game.resume();
        };
        
        container.appendChild(card);
    });
};

// 初始化
setTimeout(() => {
    initMobileAvatar('player_' + window.currentRole);
    initMobileRoleSelection();
}, 200);

// 进入血色秘境
window.enterBloodArena = function() {
    localStorage.setItem('arenaRole', window.currentRole);
    window.location.href = 'arena-mobile.html';
};

