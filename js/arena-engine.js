import { ARENA_CONFIG, ARENA_MOBS, ARENA_BOSSES, ITEM_CARDS, SVG_LIB } from './data.js';
import { loadAssets, Assets as ASSETS } from './assets.js';
import { Player, Enemy, FloatText, Particle } from './entities.js';
import { generateBloodArenaPattern } from './map.js';
import { Coin } from './coin.js';
import { ItemCardManager } from './item-card.js';

// 血煞秘境专属敌人类
class ArenaEnemy extends Enemy {
    constructor(type, x, y, levelMult, playerLevel) {
        // 计算实际属性
        const mobData = ARENA_MOBS[type] || ARENA_BOSSES[type];
        const baseHp = mobData?.hp || 50;
        const baseDmg = mobData?.dmg || 10;
        const level = Math.max(1, Math.floor(playerLevel * levelMult));
        
        super(type, x, y, level);
        
        // 覆盖属性
        this.hp = baseHp * (1 + level * 0.2);
        this.maxHp = this.hp;
        this.dmg = baseDmg * (1 + level * 0.1);
        this.goldDrop = mobData?.goldDrop || [1, 2];
        this.isBoss = !!ARENA_BOSSES[type];
        this.bossSize = mobData?.size || 1.0;
        this.name = mobData?.name || type;
        
        if (this.isBoss) {
            this.hp *= 10; // BOSS血量倍率
            this.maxHp = this.hp;
            this.dmg *= 2;
        }
    }
    
    // 覆盖 takeDamage，使用血煞秘境的击杀逻辑
    takeDamage(v, kx, ky, type, knockback) {
        if (this.dead) return;
        
        this.hp -= v;
        this.x += (kx || 0) * 10 * (knockback || 1);
        this.y += (ky || 0) * 10 * (knockback || 1);
        
        // 伤害数字
        window.Game.texts.push(new FloatText(this.x, this.y - 30, Math.floor(v), '#ff5252'));
        
        // 击中粒子
        for (let i = 0; i < 5; i++) {
            window.Game.particles.push(new Particle(this.x, this.y, '#ff5252', 0.3, 4));
        }
        
        if (this.hp <= 0 && !this.dead) {
            // 调用 ArenaEngine 的击杀处理
            window.Game.onEnemyKilled(this);
        }
    }
    
    draw(ctx, assets) {
        if (this.dead) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // BOSS 放大
        if (this.isBoss) {
            ctx.scale(this.bossSize, this.bossSize);
        }
        
        const img = assets[this.type];
        if (img) {
            const size = this.isBoss ? 64 : 32;
            ctx.drawImage(img, -size/2, -size/2, size, size);
        } else {
            // 后备绘制
            ctx.fillStyle = this.isBoss ? '#c0392b' : '#8b0000';
            ctx.beginPath();
            ctx.arc(0, 0, this.isBoss ? 40 : 20, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

export class ArenaEngine {
    constructor() {
        // 设置全局引用，让 Player.update 能访问 keys
        window.Game = this;
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.state = 'MENU';
        this.lastTime = 0;
        this.playTime = 0;
        
        // 血煞秘境专属
        this.currentWave = 0;
        this.waveEnemies = [];
        this.waveCleared = false;
        this.bossCountdown = 0;
        this.showingBossIntro = false;
        this.currentBoss = null;
        
        // 统计
        this.totalKills = 0;
        this.totalGold = 0;
        
        // 实体
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.texts = [];
        this.coins = [];
        this.orbs = [];       // 兼容 Enemy.takeDamage
        this.chests = [];     // 兼容 Enemy.takeDamage
        this.score = 0;       // 兼容 Enemy.takeDamage
        this.footprints = []; // 兼容 Player.update
        this.stageIdx = 0;    // 兼容各种检查
        
        // 触屏控制（供 Player.update 使用）
        this.touch = { active: false, dx: 0, dy: 0 };
        
        // 道具卡系统
        this.itemCards = new ItemCardManager(this);
        
        // 相机
        this.camera = { x: 0, y: 0 };
        this.bgPattern = null;
        this.shake = 0;
        
        // 输入
        this.keys = {};
        
        // 冻结效果
        this.freezeTimer = 0;
        this.hitStopCooldown = 0;
        
        // 事件监听
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            // 道具卡快捷键 1-6
            if (e.code >= 'Digit1' && e.code <= 'Digit6') {
                const slot = parseInt(e.code.replace('Digit', '')) - 1;
                this.itemCards.useCard(slot);
            }
        });
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        
        this.resize();
        loadAssets();
        requestAnimationFrame(t => this.loop(t));
    }
    
    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }
    
    start(roleId = 'sword') {
        this.player = new Player(roleId);
        this.player.x = 0;
        this.player.y = 0;
        
        // 重置状态
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.texts = [];
        this.coins = [];
        this.currentWave = 0;
        this.waveCleared = true; // 触发第一波
        this.totalKills = 0;
        this.totalGold = 0;
        this.playTime = 0;
        this.showingBossIntro = false;
        this.bossCountdown = 0;
        this.currentBoss = null;
        
        this.itemCards.reset();
        
        this.state = 'PLAY';
        
        // 隐藏菜单
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('start-menu').classList.add('hidden');
        
        // 生成地图
        this.bgPattern = this.ctx.createPattern(generateBloodArenaPattern(), 'repeat');
        
        this.updateUI();
        this.showWaveTitle('血煞秘境', '妖兽试炼开始');
        
        // 延迟开始第一波
        setTimeout(() => this.startNextWave(), 2000);
    }
    
    loop(now) {
        let dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        
        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
            dt = 0;
        }
        
        if (this.state === 'PLAY') {
            this.update(dt);
        }
        
        this.draw();
        requestAnimationFrame(t => this.loop(t));
    }
    
    update(dt) {
        if (this.showingBossIntro) {
            this.updateBossCountdown(dt);
            return;
        }
        
        this.playTime += dt;
        if (this.shake > 0) this.shake -= dt * 10;
        if (this.hitStopCooldown > 0) this.hitStopCooldown -= dt;
        
        // 更新玩家
        this.player.update(dt);
        
        // 限制玩家在场地内
        const R = 550;
        const d = Math.hypot(this.player.x, this.player.y);
        if (d > R) {
            const a = Math.atan2(this.player.y, this.player.x);
            this.player.x = Math.cos(a) * R;
            this.player.y = Math.sin(a) * R;
        }
        
        // 相机跟随
        const tx = this.player.x - this.width / 2;
        const ty = this.player.y - this.height * 0.4;
        this.camera.x += (tx - this.camera.x) * 5 * dt;
        this.camera.y += (ty - this.camera.y) * 5 * dt;
        
        // 更新敌人
        this.enemies.forEach(e => e.update(dt, this.player));
        
        // 更新子弹
        this.bullets.forEach(b => b.update(dt));
        
        // 更新粒子
        this.particles.forEach(p => p.update(dt));
        
        // 更新文字
        this.texts.forEach(t => t.update(dt));
        
        // 更新金币
        this.coins.forEach(c => c.update(dt, this.player));
        
        // 碰撞检测
        this.checkCollisions();
        
        // 清理死亡实体
        this.enemies = this.enemies.filter(e => !e.dead);
        this.bullets = this.bullets.filter(b => !b.dead);
        this.particles = this.particles.filter(p => !p.dead);
        this.texts = this.texts.filter(t => !t.dead);
        this.coins = this.coins.filter(c => !c.dead);
        
        // 检查波次完成
        this.checkWaveComplete();
        
        // 更新UI
        this.updateUI();
        
        // 检查玩家死亡
        if (this.player.hp <= 0) {
            this.gameOver(false);
        }
    }
    
    checkCollisions() {
        // 子弹碰撞由 Bullet.update() 自动处理
        // ArenaEnemy.takeDamage() 会调用 onEnemyKilled()
        
        // 敌人碰玩家
        this.enemies.forEach(e => {
            if (e.dead) return;
            const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
            const hitRadius = e.isBoss ? 60 : 30;
            if (dist < hitRadius) {
                // 伤害玩家
                if (!this.player.invincible) {
                    this.player.hp -= e.dmg * 0.016; // 每帧伤害
                    this.player.hp = Math.max(0, this.player.hp);
                }
            }
        });
        
        // 金币收集
        this.coins.forEach(c => {
            if (c.dead || c.collected) return;
            const dist = Math.hypot(c.x - this.player.x, c.y - this.player.y);
            if (dist < 100) {
                c.attractTo(this.player);
            }
            if (dist < 30) {
                c.collect();
                this.totalGold += c.value;
                this.flyGoldToCounter(c.x, c.y);
            }
        });
    }
    
    onEnemyKilled(enemy) {
        enemy.dead = true;
        this.totalKills++;
        
        // 掉落金币
        const [minGold, maxGold] = enemy.goldDrop || [1, 3];
        const goldCount = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;
        
        for (let i = 0; i < goldCount; i++) {
            const offsetX = (Math.random() - 0.5) * 60;
            const offsetY = (Math.random() - 0.5) * 60;
            this.coins.push(new Coin(enemy.x + offsetX, enemy.y + offsetY));
        }
        
        // 掉落道具卡（概率）
        if (Math.random() < 0.15 || enemy.isBoss) {
            const cardCount = enemy.isBoss ? (ARENA_BOSSES[enemy.type]?.cardDrop || 1) : 1;
            for (let i = 0; i < cardCount; i++) {
                this.dropItemCard(enemy.x, enemy.y);
            }
        }
        
        // 击杀粒子
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(
                enemy.x,
                enemy.y,
                enemy.isBoss ? '#ff5252' : '#8b0000',
                0.5,
                enemy.isBoss ? 8 : 4
            ));
        }
        
        // BOSS击杀
        if (enemy.isBoss) {
            this.currentBoss = null;
            this.hideBossHUD();
            this.shake = 2;
            this.showWaveTitle('BOSS 击败！', `${enemy.name || ''}已被消灭`);
        }
    }
    
    dropItemCard(x, y) {
        // 随机选择一张卡
        const totalWeight = ITEM_CARDS.reduce((sum, c) => sum + c.dropRate, 0);
        let rand = Math.random() * totalWeight;
        let selectedCard = ITEM_CARDS[0];
        
        for (const card of ITEM_CARDS) {
            rand -= card.dropRate;
            if (rand <= 0) {
                selectedCard = card;
                break;
            }
        }
        
        // 添加到卡槽
        this.itemCards.addCard(selectedCard);
        
        // 显示获得提示
        this.texts.push(new FloatText(x, y - 50, `获得 ${selectedCard.icon} ${selectedCard.name}`, '#f1c40f'));
    }
    
    startNextWave() {
        this.currentWave++;
        
        if (this.currentWave > ARENA_CONFIG.totalWaves) {
            // 通关！
            this.gameOver(true);
            return;
        }
        
        const waveData = ARENA_CONFIG.waves[this.currentWave - 1];
        
        // BOSS波需要倒计时
        if (waveData.isBoss) {
            this.startBossCountdown(waveData);
            return;
        }
        
        // 普通波直接刷怪
        this.spawnWave(waveData);
        this.waveCleared = false;
        this.updateUI();
    }
    
    startBossCountdown(waveData) {
        this.showingBossIntro = true;
        this.bossCountdown = 3;
        this.pendingWaveData = waveData;
        
        // 显示倒计时UI
        document.getElementById('boss-countdown').classList.remove('hidden');
        document.getElementById('countdown-text').textContent = waveData.bossName + ' 来袭！';
        
        // 震屏
        document.body.classList.add('shake');
    }
    
    updateBossCountdown(dt) {
        this.bossCountdown -= dt;
        
        const num = Math.ceil(this.bossCountdown);
        document.getElementById('countdown-num').textContent = num > 0 ? num : '!';
        
        if (this.bossCountdown <= 0) {
            this.showingBossIntro = false;
            document.getElementById('boss-countdown').classList.add('hidden');
            document.body.classList.remove('shake');
            
            // 刷BOSS
            this.spawnWave(this.pendingWaveData);
            this.waveCleared = false;
            this.updateUI();
        }
    }
    
    spawnWave(waveData) {
        const count = waveData.count;
        const mobs = waveData.mobs;
        
        for (let i = 0; i < count; i++) {
            // 在边缘随机位置生成
            const angle = Math.random() * Math.PI * 2;
            const r = 450 + Math.random() * 100;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            
            const mobType = mobs[Math.floor(Math.random() * mobs.length)];
            const enemy = new ArenaEnemy(mobType, x, y, waveData.levelMult, this.player.lvl);
            
            this.enemies.push(enemy);
            
            // 生成粒子
            for (let j = 0; j < 5; j++) {
                this.particles.push(new Particle(x, y, '#8b0000', 0.5, 5));
            }
            
            // BOSS特殊处理
            if (enemy.isBoss) {
                this.currentBoss = enemy;
                this.showBossHUD(enemy);
            }
        }
        
        // 显示波次标题
        if (!waveData.isBoss) {
            this.showWaveTitle(`第 ${this.currentWave} 波`, `${count} 只妖兽来袭`);
        }
    }
    
    checkWaveComplete() {
        if (this.waveCleared) return;
        if (this.showingBossIntro) return;
        
        if (this.enemies.length === 0) {
            this.waveCleared = true;
            
            // 延迟开始下一波
            setTimeout(() => this.startNextWave(), 1000);
        }
    }
    
    showBossHUD(boss) {
        const hud = document.getElementById('boss-hud');
        const nameEl = document.getElementById('boss-name');
        if (hud && nameEl) {
            hud.classList.remove('hidden');
            nameEl.textContent = boss.name || 'BOSS';
        }
    }
    
    hideBossHUD() {
        const hud = document.getElementById('boss-hud');
        if (hud) {
            hud.classList.add('hidden');
        }
    }
    
    updateBossHUD() {
        if (!this.currentBoss) return;
        const hpBar = document.getElementById('boss-hp-bar');
        if (hpBar) {
            const percent = Math.max(0, (this.currentBoss.hp / this.currentBoss.maxHp) * 100);
            hpBar.style.width = percent + '%';
        }
    }
    
    showWaveTitle(title, subtitle) {
        // 创建临时标题
        const div = document.createElement('div');
        div.className = 'wave-title-popup';
        div.innerHTML = `
            <div class="wave-title-main">${title}</div>
            <div class="wave-title-sub">${subtitle}</div>
        `;
        div.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 100;
            pointer-events: none;
            animation: waveTitleAnim 2s ease-out forwards;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes waveTitleAnim {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                30% { transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
            }
            .wave-title-main {
                font-size: 48px;
                color: #c0392b;
                text-shadow: 0 0 20px #8b0000, 0 0 40px #5c0000;
                font-family: 'Ma Shan Zheng', serif;
            }
            .wave-title-sub {
                font-size: 24px;
                color: #ff5252;
                margin-top: 10px;
                font-family: 'Ma Shan Zheng', serif;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(div);
        
        setTimeout(() => {
            div.remove();
            style.remove();
        }, 2000);
    }
    
    flyGoldToCounter(fromX, fromY) {
        // 创建飞行金币
        const coin = document.createElement('div');
        coin.className = 'flying-coin';
        coin.textContent = '💰';
        
        // 计算屏幕坐标
        const screenX = fromX - this.camera.x;
        const screenY = fromY - this.camera.y;
        
        coin.style.left = screenX + 'px';
        coin.style.top = screenY + 'px';
        
        // 目标位置（金币计数器）
        const counter = document.getElementById('gold-count');
        if (counter) {
            const rect = counter.getBoundingClientRect();
            const targetX = rect.left + rect.width / 2;
            const targetY = rect.top + rect.height / 2;
            
            coin.style.setProperty('--target-x', (targetX - screenX) + 'px');
            coin.style.setProperty('--target-y', (targetY - screenY) + 'px');
        }
        
        document.getElementById('flying-coins').appendChild(coin);
        
        setTimeout(() => coin.remove(), 800);
    }
    
    gameOver(victory = false) {
        this.state = victory ? 'VICTORY' : 'DEFEAT';
        
        if (victory) {
            document.getElementById('victory-menu').classList.remove('hidden');
            document.getElementById('result-kills').textContent = this.totalKills;
            document.getElementById('result-gold').textContent = this.totalGold;
            document.getElementById('result-time').textContent = this.formatTime(this.playTime);
            
            // 评价
            let stars = '⭐';
            if (this.playTime < 180) stars = '⭐⭐⭐';
            else if (this.playTime < 300) stars = '⭐⭐';
            document.getElementById('result-stars').textContent = stars;
        } else {
            document.getElementById('defeat-menu').classList.remove('hidden');
            document.getElementById('defeat-wave').textContent = this.currentWave;
            document.getElementById('defeat-kills').textContent = this.totalKills;
            document.getElementById('defeat-gold').textContent = Math.floor(this.totalGold * 0.5);
        }
        
        document.getElementById('overlay').classList.remove('hidden');
    }
    
    updateUI() {
        // 血条
        const hpBar = document.getElementById('hp-bar');
        if (hpBar) {
            hpBar.style.width = Math.max(0, (this.player.hp / this.player.maxHp) * 100) + '%';
        }
        
        // 经验条
        const expBar = document.getElementById('exp-bar');
        if (expBar) {
            expBar.style.width = Math.max(0, (this.player.exp / this.player.maxExp) * 100) + '%';
        }
        
        // 波次
        const waveNum = document.getElementById('wave-num');
        if (waveNum) {
            waveNum.textContent = this.currentWave;
        }
        
        // 敌人数量
        const enemyCount = document.getElementById('enemy-count');
        if (enemyCount) {
            enemyCount.textContent = this.enemies.length;
        }
        
        // 金币
        const goldCount = document.getElementById('gold-count');
        if (goldCount) {
            goldCount.textContent = this.totalGold;
        }
        
        // BOSS血条
        this.updateBossHUD();
        
        // 道具卡
        this.itemCards.updateUI();
    }
    
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
        
        // 绘制血雾效果（屏幕空间）
        this.drawBloodMist(ctx);
    }
    
    drawBackground(ctx) {
        // 天空渐变
        const skyGrad = ctx.createLinearGradient(0, -600, 0, 200);
        skyGrad.addColorStop(0, '#0a0000');
        skyGrad.addColorStop(0.5, '#1a0505');
        skyGrad.addColorStop(1, '#2a0a0a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(this.camera.x - 100, this.camera.y - 100, this.width + 200, this.height + 200);
        
        // 血月
        const moonX = this.camera.x + this.width * 0.8;
        const moonY = this.camera.y + 100;
        
        // 月亮光晕
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 150);
        moonGlow.addColorStop(0, 'rgba(139, 0, 0, 0.3)');
        moonGlow.addColorStop(0.5, 'rgba(139, 0, 0, 0.1)');
        moonGlow.addColorStop(1, 'rgba(139, 0, 0, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 150, 0, Math.PI * 2);
        ctx.fill();
        
        // 月亮
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // 月亮高光
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(moonX - 15, moonY - 15, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // 地面
        if (this.bgPattern) {
            ctx.fillStyle = this.bgPattern;
            ctx.fillRect(-700, -700, 1400, 1400);
        }
    }
    
    drawArenaEdge(ctx) {
        const R = 580;
        
        // 边缘迷雾
        ctx.save();
        for (let i = 0; i < 60; i++) {
            const angle = (i / 60) * Math.PI * 2;
            const r = R + Math.sin(this.playTime * 2 + i) * 20;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
            gradient.addColorStop(0, 'rgba(139, 0, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 80, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        // 边界线
        ctx.strokeStyle = '#5c0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    drawBullets(ctx) {
        this.bullets.forEach(b => {
            ctx.save();
            ctx.translate(b.x, b.y);
            
            // 剑气效果
            const angle = Math.atan2(b.vy, b.vx);
            ctx.rotate(angle);
            
            // 光晕
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
            glow.addColorStop(0, 'rgba(192, 57, 43, 0.8)');
            glow.addColorStop(1, 'rgba(192, 57, 43, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // 核心
            ctx.fillStyle = '#ff5252';
            ctx.beginPath();
            ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    drawBloodMist(ctx) {
        // 屏幕边缘血雾
        const gradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.3,
            this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.7
        );
        gradient.addColorStop(0, 'rgba(139, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(139, 0, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }
    
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    hitStop(duration) {
        if (this.hitStopCooldown <= 0) {
            this.freezeTimer = duration;
            this.hitStopCooldown = 0.1;
        }
    }
    
    screenShake(intensity) {
        this.shake = Math.max(this.shake, intensity);
    }
    
    pause() {
        this.state = 'PAUSED';
    }
    
    resume() {
        this.state = 'PLAY';
    }
}

