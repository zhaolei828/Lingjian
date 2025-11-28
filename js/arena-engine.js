import { ARENA_CONFIG, ARENA_MOBS, ARENA_BOSSES, ITEM_CARDS, SVG_LIB, ARTIFACTS, SKILLS } from './data.js';
import { loadAssets, Assets as ASSETS } from './assets.js';
import { Player, Enemy, FloatText, Particle, Artifact } from './entities.js';
import { generateBloodArenaPattern } from './map.js';
import { Coin } from './coin.js';
import { ItemCardManager } from './item-card.js';
import { Config, isMobile, limitArray, isInView, perfMonitor } from './performance.js';
import { collisionManager } from './spatial-hash.js';

// 血色秘境专属敌人类
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
    
    // 覆盖 takeDamage，使用血色秘境的击杀逻辑
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
        const scale = this.isBoss ? this.bossSize : 1.0;
        ctx.scale(scale, scale);
        
        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 检测是否需要翻转（面向玩家）
        const shouldFlip = window.Game.player && window.Game.player.x < this.x;
        if (shouldFlip) {
            ctx.scale(-1, 1);
        }
        
        // 绘制怪物图像
        const svgKey = (ARENA_MOBS[this.type] || ARENA_BOSSES[this.type])?.svg || this.type;
        const img = assets[svgKey];
        if (img && img.complete && img.naturalWidth > 0) {
            const size = this.isBoss ? 80 : 48;
            ctx.drawImage(img, -size/2, -size/2 - 5, size, size);
        } else {
            // 后备绘制 - 绘制Q版怪物
            this.drawFallbackMob(ctx);
        }
        
        ctx.restore();
        
        // 名字绘制在 restore 之后，避免翻转（独立绘制）
        ctx.save();
        ctx.translate(this.x, this.y);
        const mobData = ARENA_MOBS[this.type] || ARENA_BOSSES[this.type];
        ctx.fillStyle = this.isBoss ? '#ffcc00' : '#fff';
        ctx.font = this.isBoss ? 'bold 14px Arial' : '11px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(mobData?.name || this.type, 0, -30 * scale);
        ctx.restore();
        
        // 绘制血条
        this.drawHpBar(ctx);
    }
    
    // 后备绘制 - Q版怪物
    drawFallbackMob(ctx) {
        const time = Date.now() / 1000;
        const bounce = Math.sin(time * 5 + this.x) * 2; // 弹跳效果
        
        if (this.type.includes('bat')) {
            // 蝙蝠 - 带翅膀
            ctx.fillStyle = '#8b0000';
            // 身体
            ctx.beginPath();
            ctx.ellipse(0, bounce, 12, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            // 翅膀
            const wingFlap = Math.sin(time * 15) * 20;
            ctx.fillStyle = '#5c0000';
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.quadraticCurveTo(-25, -10 + wingFlap, -20, 5);
            ctx.lineTo(-8, 5);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.quadraticCurveTo(25, -10 - wingFlap, 20, 5);
            ctx.lineTo(8, 5);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(-4, -3 + bounce, 3, 0, Math.PI * 2);
            ctx.arc(4, -3 + bounce, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type.includes('spider')) {
            // 蜘蛛 - 八条腿
            ctx.fillStyle = '#5c0000';
            // 腿
            for (let i = 0; i < 4; i++) {
                const legAngle = (i - 1.5) * 0.4;
                const legWiggle = Math.sin(time * 8 + i) * 5;
                ctx.beginPath();
                ctx.moveTo(-6, 0);
                ctx.quadraticCurveTo(-20 + legWiggle, -10 + i * 8, -25, i * 8 - 8);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#5c0000';
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(6, 0);
                ctx.quadraticCurveTo(20 - legWiggle, -10 + i * 8, 25, i * 8 - 8);
                ctx.stroke();
            }
            // 身体
            ctx.fillStyle = '#8b0000';
            ctx.beginPath();
            ctx.arc(0, bounce, 15, 0, Math.PI * 2);
            ctx.fill();
            // 眼睛 (多个)
            ctx.fillStyle = '#ff0';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(-6 + i * 4, -5 + bounce, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type.includes('wolf')) {
            // 狼 - Q版
            ctx.fillStyle = '#8b0000';
            // 身体
            ctx.beginPath();
            ctx.ellipse(0, 5 + bounce, 18, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            // 头
            ctx.fillStyle = '#b71c1c';
            ctx.beginPath();
            ctx.arc(8, -5 + bounce, 12, 0, Math.PI * 2);
            ctx.fill();
            // 耳朵
            ctx.fillStyle = '#8b0000';
            ctx.beginPath();
            ctx.moveTo(5, -15 + bounce);
            ctx.lineTo(0, -25 + bounce);
            ctx.lineTo(8, -18 + bounce);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(12, -15 + bounce);
            ctx.lineTo(18, -25 + bounce);
            ctx.lineTo(16, -18 + bounce);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(5, -6 + bounce, 3, 0, Math.PI * 2);
            ctx.arc(12, -6 + bounce, 3, 0, Math.PI * 2);
            ctx.fill();
            // 鼻子
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(16, -3 + bounce, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type.includes('serpent') || this.type.includes('snake')) {
            // 蛇
            ctx.strokeStyle = '#8b0000';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-20, 10);
            for (let i = 0; i < 5; i++) {
                const x = -20 + i * 10;
                const y = 10 + Math.sin(time * 5 + i) * 8;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            // 头
            ctx.fillStyle = '#b71c1c';
            ctx.beginPath();
            ctx.arc(20, 10 + Math.sin(time * 5 + 4) * 8, 10, 0, Math.PI * 2);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(23, 7 + Math.sin(time * 5 + 4) * 8, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type.includes('ghost')) {
            // 鬼魂
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#8b0000';
            // 身体 (波浪形底部)
            ctx.beginPath();
            ctx.moveTo(-15, -10 + bounce);
            ctx.quadraticCurveTo(-18, 15, -12, 20);
            ctx.quadraticCurveTo(-6, 15, 0, 20);
            ctx.quadraticCurveTo(6, 15, 12, 20);
            ctx.quadraticCurveTo(18, 15, 15, -10 + bounce);
            ctx.arc(0, -10 + bounce, 15, 0, Math.PI, true);
            ctx.fill();
            // 眼睛 (空洞)
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(-5, -8 + bounce, 4, 6, 0, 0, Math.PI * 2);
            ctx.ellipse(5, -8 + bounce, 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            // 眼睛光点
            ctx.fillStyle = '#f00';
            ctx.beginPath();
            ctx.arc(-5, -10 + bounce, 2, 0, Math.PI * 2);
            ctx.arc(5, -10 + bounce, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (this.type.includes('scorpion')) {
            // 蝎子
            ctx.fillStyle = '#8b0000';
            // 身体
            ctx.beginPath();
            ctx.ellipse(0, 5 + bounce, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            // 钳子
            ctx.strokeStyle = '#5c0000';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(-25, -10);
            ctx.lineTo(-30, -5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(25, -10);
            ctx.lineTo(30, -5);
            ctx.stroke();
            // 尾巴
            ctx.beginPath();
            ctx.moveTo(0, 10);
            ctx.quadraticCurveTo(-5, 25, 0, 35);
            ctx.quadraticCurveTo(5, 40, 8, 30);
            ctx.stroke();
            // 毒刺
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(8, 28, 4, 0, Math.PI * 2);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(-5, bounce, 3, 0, Math.PI * 2);
            ctx.arc(5, bounce, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 默认 - 简单圆形怪物
            ctx.fillStyle = this.isBoss ? '#c0392b' : '#8b0000';
            ctx.beginPath();
            ctx.arc(0, bounce, this.isBoss ? 25 : 15, 0, Math.PI * 2);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(-5, -3 + bounce, 3, 0, Math.PI * 2);
            ctx.arc(5, -3 + bounce, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
        
    drawHpBar(ctx) {
        const scale = this.isBoss ? this.bossSize : 1.0;
        // 血条（BOSS 在 HUD 显示，普通怪在头上）
        if (!this.isBoss && this.hp < this.maxHp) {
            ctx.save();
            ctx.translate(this.x, this.y - 35 * scale);
            const barWidth = 40;
            const barHeight = 5;
            const hpRatio = this.hp / this.maxHp;
            
            // 背景
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(-barWidth/2 - 1, -1, barWidth + 2, barHeight + 2);
            
            // 血量
            const gradient = ctx.createLinearGradient(-barWidth/2, 0, barWidth/2, 0);
            if (hpRatio > 0.5) {
                gradient.addColorStop(0, '#4caf50');
                gradient.addColorStop(1, '#8bc34a');
            } else if (hpRatio > 0.25) {
                gradient.addColorStop(0, '#ff9800');
                gradient.addColorStop(1, '#ffc107');
            } else {
                gradient.addColorStop(0, '#f44336');
                gradient.addColorStop(1, '#ff5722');
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(-barWidth/2, 0, barWidth * hpRatio, barHeight);
            
            ctx.restore();
        }
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
        
        // 血色秘境专属
        this.currentWave = 0;
        this.waveEnemies = [];
        this.waveCleared = false;
        this.bossCountdown = 0;
        this.showingBossIntro = false;
        this.bossTextShown = false;
        this.currentBoss = null;
        
        // 统计
        this.totalKills = 0;
        this.totalGold = 0;
        
        // 实体
        this.player = null;
        this.artifact = null; // 法宝
        this.enemies = [];
        this.bullets = [];
        this.minions = [];    // 召唤物
        this.particles = [];
        this.texts = [];
        this.coins = [];
        this.orbs = [];       // 兼容 Enemy.takeDamage
        this.chests = [];     // 兼容 Enemy.takeDamage
        this.score = 0;       // 兼容 Enemy.takeDamage
        this.footprints = []; // 兼容 Player.update
        this.stageIdx = 0;    // 兼容各种检查
        
        // 技能选择状态
        this.pendingSkillChoice = false;
        this.availableSkills = [];
        
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
        
        // 随机法宝
        const randArtifact = ARTIFACTS[Math.floor(Math.random() * ARTIFACTS.length)];
        this.artifact = new Artifact(randArtifact.id);
        
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
        this.bossTextShown = false;
        this.bossCountdown = 0;
        this.currentBoss = null;
        this.pendingSkillChoice = false;
        
        this.itemCards.reset();
        
        this.state = 'PLAY';
        
        // 隐藏菜单
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('start-menu').classList.add('hidden');
        
        // 生成地图
        this.bgPattern = this.ctx.createPattern(generateBloodArenaPattern(), 'repeat');
        
        this.updateUI();
        
        // 显示法宝信息
        const artifactName = this.artifact?.data?.name || '神秘法宝';
        this.showWaveTitle('血色秘境', `携带法宝：${artifactName}`);
        this.texts.push(new FloatText(0, -100, `🔮 ${artifactName}`, '#9b59b6'));
        
        // 延迟开始第一波
        setTimeout(() => this.startNextWave(), 2500);
    }
    
    loop(now) {
        // 帧率监控
        perfMonitor.tick();
        
        let dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        
        // 移动端帧率限制（可选，默认不启用以保持流畅）
        // if (isMobile && dt < 1/Config.targetFPS) return requestAnimationFrame(t => this.loop(t));
        
        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
            dt = 0;
        }
        
        if (this.state === 'PLAY') {
            this.update(dt);
        }
        
        // 更新性能监控数据
        perfMonitor.metrics.particles = this.particles.length;
        perfMonitor.metrics.bullets = this.bullets.length;
        perfMonitor.metrics.enemies = this.enemies.length;
        
        this.draw();
        requestAnimationFrame(t => this.loop(t));
    }
    
    update(dt) {
        // Boss倒计时期间暂停游戏更新
        if (this.showingBossIntro) {
            return;
        }
        
        this.playTime += dt;
        if (this.shake > 0) this.shake -= dt * 10;
        if (this.hitStopCooldown > 0) this.hitStopCooldown -= dt;
        
        // 【重要】先重建空间哈希，再更新玩家（确保技能能找到目标）
        collisionManager.rebuild(this.enemies, this.bullets, this.coins);
        
        // 更新玩家（包括自动攻击）
        this.player.update(dt);
        
        // 更新法宝
        if (this.artifact) {
            this.artifact.update(dt, this.player);
        }
        
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
        
        // 更新召唤物
        this.minions.forEach(m => m.update(dt));
        
        // 更新子弹
        this.bullets.forEach(b => b.update(dt));
        
        // 更新粒子
        this.particles.forEach(p => p.update(dt));
        
        // 更新文字
        this.texts.forEach(t => t.update(dt));
        
        // 更新金币
        this.coins.forEach(c => c.update(dt, this.player));
        
        // 更新道具卡特殊实体（陷阱、炸弹、分身等）
        this.itemCards.update(dt);
        
        // 碰撞检测（使用空间哈希优化）
        this.checkCollisions();
        
        // 清理死亡实体
        this.enemies = this.enemies.filter(e => !e.dead);
        this.minions = this.minions.filter(m => !m.dead);
        this.bullets = this.bullets.filter(b => !b.dead);
        this.particles = this.particles.filter(p => !p.dead);
        this.texts = this.texts.filter(t => !t.dead);
        this.coins = this.coins.filter(c => !c.dead);
        
        // 性能优化：限制实体数量（移动端）
        limitArray(this.particles, Config.maxParticles);
        limitArray(this.bullets, Config.maxBullets);
        limitArray(this.texts, Config.maxTexts);
        
        // 检查波次完成
        this.checkWaveComplete();
        
        // Boss 战特殊机制
        this.updateBossBattle(dt);
        
        // 更新能量球
        this.updatePowerOrbs(dt);
        
        // 更新UI
        this.updateUI();
        
        // 检查玩家死亡
        if (this.player.hp <= 0) {
            this.gameOver(false);
        }
    }
    
    // Boss 战增强机制
    updateBossBattle(dt) {
        if (!this.currentBoss || this.currentBoss.dead) {
            this.currentBoss = null;
            return;
        }
        
        // Boss 技能计时器
        if (!this.bossSkillTimer) this.bossSkillTimer = 0;
        this.bossSkillTimer += dt;
        
        // 每 5 秒发动一次特殊攻击
        if (this.bossSkillTimer >= 5) {
            this.bossSkillTimer = 0;
            this.bossSpecialAttack();
        }
        
        // Boss 定期生成能量球帮助玩家
        if (!this.orbSpawnTimer) this.orbSpawnTimer = 0;
        this.orbSpawnTimer += dt;
        
        if (this.orbSpawnTimer >= 8) {
            this.orbSpawnTimer = 0;
            this.spawnPowerOrb();
        }
    }
    
    // Boss 特殊攻击
    bossSpecialAttack() {
        if (!this.currentBoss) return;
        
        const boss = this.currentBoss;
        const attackType = Math.floor(Math.random() * 3);
        
        // 警告提示
        this.showWaveTitle('⚠️ 危险 ⚠️', '躲避攻击！');
        this.shake = 0.5;
        
        switch(attackType) {
            case 0:
                // 冲撞攻击 - Boss 向玩家冲刺
                this.bossCharge(boss);
                break;
            case 1:
                // 范围攻击 - 在玩家位置生成伤害圈
                this.bossAOE(boss);
                break;
            case 2:
                // 召唤小怪
                this.bossSummon(boss);
                break;
        }
    }
    
    // Boss 冲撞
    bossCharge(boss) {
        if (!this.player) return;
        
        // 计算冲撞方向
        const dx = this.player.x - boss.x;
        const dy = this.player.y - boss.y;
        const dist = Math.hypot(dx, dy) || 1;
        
        // 创建冲撞效果（Boss 快速移动向玩家）
        const chargeSpeed = 800;
        boss.chargeVx = (dx / dist) * chargeSpeed;
        boss.chargeVy = (dy / dist) * chargeSpeed;
        boss.isCharging = true;
        boss.chargeDuration = 0.5;
        
        // 冲撞轨迹粒子
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(boss.x, boss.y, '#ff0000', 0.5, 8));
        }
    }
    
    // Boss 范围攻击
    bossAOE(boss) {
        if (!this.player) return;
        
        // 在玩家当前位置创建警告圈
        const aoeX = this.player.x;
        const aoeY = this.player.y;
        const aoeRadius = 120;
        
        // 添加到待处理 AOE 列表
        if (!this.pendingAOEs) this.pendingAOEs = [];
        this.pendingAOEs.push({
            x: aoeX,
            y: aoeY,
            radius: aoeRadius,
            timer: 1.5, // 1.5秒后爆炸
            damage: boss.dmg * 2,
            warningColor: '#ff000033'
        });
    }
    
    // Boss 召唤小怪
    bossSummon(boss) {
        const mobTypes = ['blood_bat', 'blood_spider'];
        const summonCount = 3;
        
        for (let i = 0; i < summonCount; i++) {
            const angle = (i / summonCount) * Math.PI * 2;
            const dist = 100;
            const x = boss.x + Math.cos(angle) * dist;
            const y = boss.y + Math.sin(angle) * dist;
            
            const mobType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
            const enemy = new ArenaEnemy(mobType, x, y, 0.5, this.player.lvl);
            this.enemies.push(enemy);
            
            // 召唤粒子
            for (let j = 0; j < 10; j++) {
                this.particles.push(new Particle(x, y, '#8b0000', 0.5, 6));
            }
        }
        
        this.texts.push(new FloatText(boss.x, boss.y - 50, '召唤!', '#ff5252'));
    }
    
    // 生成能量球
    spawnPowerOrb() {
        // 在玩家附近随机位置生成
        const angle = Math.random() * Math.PI * 2;
        const dist = 150 + Math.random() * 100;
        const x = this.player.x + Math.cos(angle) * dist;
        const y = this.player.y + Math.sin(angle) * dist;
        
        const orbTypes = [
            { type: 'heal', color: '#4caf50', effect: '回复', value: 30 },
            { type: 'damage', color: '#f44336', effect: '攻击提升', value: 1.5, duration: 10 },
            { type: 'speed', color: '#2196f3', effect: '速度提升', value: 1.5, duration: 8 },
            { type: 'skill_reset', color: '#9c27b0', effect: '技能刷新', value: 0 }
        ];
        
        const orbData = orbTypes[Math.floor(Math.random() * orbTypes.length)];
        
        if (!this.powerOrbs) this.powerOrbs = [];
        this.powerOrbs.push({
            x, y,
            type: orbData.type,
            color: orbData.color,
            effect: orbData.effect,
            value: orbData.value,
            duration: orbData.duration || 0,
            radius: 20,
            life: 15, // 15秒后消失
            pulse: 0
        });
        
        // 生成提示
        this.texts.push(new FloatText(x, y - 30, '💫 能量球!', orbData.color));
    }
    
    // 更新能量球
    updatePowerOrbs(dt) {
        if (!this.powerOrbs) this.powerOrbs = [];
        
        // 更新 AOE 攻击
        if (this.pendingAOEs) {
            for (let i = this.pendingAOEs.length - 1; i >= 0; i--) {
                const aoe = this.pendingAOEs[i];
                aoe.timer -= dt;
                
                if (aoe.timer <= 0) {
                    // AOE 爆炸！
                    const dist = Math.hypot(this.player.x - aoe.x, this.player.y - aoe.y);
                    if (dist < aoe.radius && !this.player.invincible) {
                        this.player.hp -= aoe.damage;
                        this.shake = 1;
                        this.texts.push(new FloatText(this.player.x, this.player.y - 30, Math.floor(aoe.damage), '#ff0000'));
                    }
                    
                    // 爆炸粒子
                    for (let j = 0; j < 30; j++) {
                        this.particles.push(new Particle(aoe.x, aoe.y, '#ff5252', 0.5, 8));
                    }
                    
                    this.pendingAOEs.splice(i, 1);
                }
            }
        }
        
        // 更新 Boss 冲撞
        for (const e of this.enemies) {
            if (e.isCharging && e.chargeDuration > 0) {
                e.chargeDuration -= dt;
                e.x += e.chargeVx * dt;
                e.y += e.chargeVy * dt;
                
                // 冲撞轨迹
                if (Math.random() < 0.5) {
                    this.particles.push(new Particle(e.x, e.y, '#ff5252', 0.3, 5));
                }
                
                if (e.chargeDuration <= 0) {
                    e.isCharging = false;
                }
            }
        }
        
        // 更新能量球
        for (let i = this.powerOrbs.length - 1; i >= 0; i--) {
            const orb = this.powerOrbs[i];
            orb.life -= dt;
            orb.pulse += dt * 5;
            
            if (orb.life <= 0) {
                this.powerOrbs.splice(i, 1);
                continue;
            }
            
            // 检测玩家拾取
            const dist = Math.hypot(this.player.x - orb.x, this.player.y - orb.y);
            if (dist < orb.radius + 25) {
                this.collectPowerOrb(orb);
                this.powerOrbs.splice(i, 1);
            }
        }
    }
    
    // 拾取能量球
    collectPowerOrb(orb) {
        switch(orb.type) {
            case 'heal':
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + orb.value);
                this.texts.push(new FloatText(this.player.x, this.player.y - 30, '+' + orb.value + ' HP', '#4caf50'));
                break;
            case 'damage':
                this.player.damageBoost = (this.player.damageBoost || 1) * orb.value;
                setTimeout(() => {
                    this.player.damageBoost = Math.max(1, (this.player.damageBoost || 1) / orb.value);
                }, orb.duration * 1000);
                this.texts.push(new FloatText(this.player.x, this.player.y - 30, '攻击提升!', '#f44336'));
                break;
            case 'speed':
                this.player.speedBoost = (this.player.speedBoost || 1) * orb.value;
                setTimeout(() => {
                    this.player.speedBoost = Math.max(1, (this.player.speedBoost || 1) / orb.value);
                }, orb.duration * 1000);
                this.texts.push(new FloatText(this.player.x, this.player.y - 30, '速度提升!', '#2196f3'));
                break;
            case 'skill_reset':
                // 重置法宝 CD
                if (this.artifact) {
                    this.artifact.cd = 0;
                    this.texts.push(new FloatText(this.player.x, this.player.y - 30, '法宝CD重置!', '#9c27b0'));
                }
                break;
        }
        
        // 拾取粒子效果
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(orb.x, orb.y, orb.color, 0.4, 5));
        }
    }
    
    checkCollisions() {
        // 子弹碰撞由 Bullet.update() 自动处理
        // ArenaEnemy.takeDamage() 会调用 onEnemyKilled()
        
        // 【优化】敌人碰玩家 - 使用空间哈希只检测附近敌人
        const nearbyEnemies = collisionManager.checkPlayerEnemyCollisions(this.player, 30);
        
        for (const e of nearbyEnemies) {
            if (e.dead) continue;
            
            // 伤害玩家（持续接触伤害，绕过无敌帧但保留减伤）
            if (!this.player.invincible) {
                let damage = e.dmg * 0.016; // 每帧伤害
                
                // 玄武盾减伤效果
                if (this.player.damageReduction) {
                    damage *= (1 - this.player.damageReduction);
                }
                
                this.player.hp -= damage;
                this.player.hp = Math.max(0, this.player.hp);
                
                // 玄武盾反弹效果（每秒触发一次）
                if (this.player.damageReflect) {
                    if (!e.lastReflectTime) e.lastReflectTime = 0;
                    if (this.playTime - e.lastReflectTime > 1.0) {
                        e.lastReflectTime = this.playTime;
                        const reflectDamage = e.dmg * this.player.damageReflect;
                        e.hp -= reflectDamage;
                        this.texts.push(new FloatText(e.x, e.y, "-"+Math.floor(reflectDamage), '#3498db'));
                        if (e.hp <= 0 && !e.dead) {
                            this.onEnemyKilled(e);
                        }
                    }
                }
            }
        }
        
        // 【优化】金币收集 - 使用空间哈希只检测附近金币
        const nearbyCoins = collisionManager.checkCoinPickup(this.player, 150);
        
        for (const c of nearbyCoins) {
            if (c.dead || c.collected) continue;
            const dist = Math.hypot(c.x - this.player.x, c.y - this.player.y);
            if (dist < 100) {
                c.attractTo(this.player);
            }
            if (dist < 30) {
                c.collect();
                this.totalGold += c.value;
                this.flyGoldToCounter(c.x, c.y);
            }
        }
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
        this.pendingWaveData = waveData;
        
        // 判断是小Boss还是大Boss（第10波是大Boss）
        this.isFinalBoss = this.currentWave >= 10;
        
        // 用 setTimeout 序列显示倒计时，简单可靠
        this.showCountdownSequence(waveData);
    }
    
    showCountdownSequence(waveData) {
        const bossClass = this.isFinalBoss ? 'final-boss' : 'mini-boss';
        const bossName = waveData.bossName || 'BOSS';
        
        // 移除旧的遮罩
        const oldOverlay = document.getElementById('boss-countdown-overlay');
        if (oldOverlay) oldOverlay.remove();
        
        // 创建遮罩
        const overlay = document.createElement('div');
        overlay.id = 'boss-countdown-overlay';
        overlay.className = 'boss-countdown-overlay';
        document.body.appendChild(overlay);
        
        // 开始震屏
        document.body.classList.add(this.isFinalBoss ? 'shake-screen-final' : 'shake-screen');
        
        // 倒计时序列：3 -> 2 -> 1 -> BOSS来袭
        const sequence = ['3', '2', '1', bossName];
        let index = 0;
        
        const showNext = () => {
            // 清空遮罩内容
            overlay.innerHTML = '';
            
            if (index < 3) {
                // 显示数字 3, 2, 1
                const numDiv = document.createElement('div');
                numDiv.className = `boss-countdown-number ${bossClass}`;
                numDiv.textContent = sequence[index];
                overlay.appendChild(numDiv);
                this.shake = this.isFinalBoss ? 2 : 0.5;
                
                index++;
                setTimeout(showNext, 700); // 每个数字显示700ms
            } else {
                // 显示 BOSS 来袭
                const numDiv = document.createElement('div');
                numDiv.className = `boss-countdown-number ${bossClass} final`;
                numDiv.textContent = this.isFinalBoss ? '💀 ' + bossName + ' 💀' : '⚔️ ' + bossName + ' ⚔️';
                overlay.appendChild(numDiv);
                
                const textDiv = document.createElement('div');
                textDiv.className = `boss-name-text ${bossClass}`;
                textDiv.textContent = this.isFinalBoss ? '最终试炼!' : '来袭!';
                overlay.appendChild(textDiv);
                
                this.shake = this.isFinalBoss ? 5 : 2;
                
                // 1.2秒后结束倒计时
                setTimeout(() => {
                    this.showingBossIntro = false;
                    
                    // 淡出遮罩
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.3s';
                    setTimeout(() => overlay.remove(), 300);
                    
                    // 停止震屏
                    document.body.classList.remove('shake-screen', 'shake-screen-final');
                    
                    // 刷Boss
                    this.spawnWave(this.pendingWaveData);
                    this.waveCleared = false;
                    this.updateUI();
                }, 1200);
            }
        };
        
        // 开始序列
        showNext();
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
        if (this.pendingSkillChoice) return;
        
        if (this.enemies.length === 0) {
            this.waveCleared = true;
            
            // 波次完成，显示技能选择（最后一波除外）
            if (this.currentWave < ARENA_CONFIG.waves.length) {
                this.showSkillChoice();
            } else {
                // 通关
                setTimeout(() => this.gameOver(true), 1000);
            }
        }
    }
    
    // 显示技能选择界面
    showSkillChoice() {
        this.pendingSkillChoice = true;
        this.state = 'SKILL_CHOICE';
        
        // 获取可选技能（通用 + 门派专属）
        const roleId = this.player.role.id;
        const commonSkills = SKILLS.common || [];
        const roleSkills = SKILLS[roleId] || [];
        const allSkills = [...commonSkills, ...roleSkills];
        
        // 随机选3个不重复的技能
        const shuffled = allSkills.sort(() => Math.random() - 0.5);
        this.availableSkills = shuffled.slice(0, 3);
        
        // 显示UI
        this.renderSkillChoiceUI();
    }
    
    // 渲染技能选择UI
    renderSkillChoiceUI() {
        const overlay = document.getElementById('skill-overlay');
        const container = document.getElementById('skill-choices');
        
        if (!overlay || !container) {
            this.confirmSkillChoice(null);
            return;
        }
        
        container.innerHTML = '';
        
        this.availableSkills.forEach((skill, idx) => {
            const card = document.createElement('div');
            card.className = 'skill-card';
            card.innerHTML = `
                <div class="skill-icon">${skill.icon}</div>
                <div class="skill-info">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-desc">${skill.desc}</div>
                </div>
            `;
            
            // 防止重复触发
            let handled = false;
            const handleSelect = (e) => {
                if (handled) return;
                handled = true;
                e.preventDefault();
                e.stopPropagation();
                this.confirmSkillChoice(skill);
            };
            
            card.addEventListener('click', handleSelect);
            card.addEventListener('touchend', handleSelect);
            container.appendChild(card);
        });
        
        // 强制显示 overlay
        overlay.classList.remove('hidden');
        overlay.style.cssText = 'display: flex !important; opacity: 1; visibility: visible; pointer-events: auto;';
    }
    
    // 确认技能选择
    confirmSkillChoice(skill) {
        if (skill) {
            // 应用技能效果
            skill.effect(this.player.stats);
            this.texts.push(new FloatText(this.player.x, this.player.y - 50, `${skill.icon} ${skill.name}`, '#f1c40f'));
        }
        
        // 隐藏UI
        const overlay = document.getElementById('skill-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }
        
        this.pendingSkillChoice = false;
        this.state = 'PLAY';
        
        // 延迟开始下一波
        setTimeout(() => this.startNextWave(), 500);
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
        
        // 绘制道具卡特殊实体（陷阱、炸弹、分身等）
        this.itemCards.draw(ctx);
        
        // 绘制玩家
        if (this.player) {
            this.player.draw(ctx, ASSETS);
        }
        
        // 绘制傀儡（幽冥涧召唤物）
        this.minions.forEach(m => m.draw(ctx));
        
        // 绘制法宝
        if (this.artifact) {
            this.artifact.draw(ctx);
        }
        
        // 绘制 AOE 预警圈
        this.drawAOEWarnings(ctx);
        
        // 绘制能量球
        this.drawPowerOrbs(ctx);
        
        // 绘制粒子
        this.particles.forEach(p => p.draw(ctx));
        
        // 绘制文字
        this.texts.forEach(t => t.draw(ctx));
        
        ctx.restore();
        
        // 绘制血雾效果（屏幕空间）
        this.drawBloodMist(ctx);
        
        // 更新性能面板（如果存在）
        this.updatePerfPanel();
    }
    
    updatePerfPanel() {
        // 更新 perf-fps (PC端性能面板)
        const fpsEl = document.getElementById('perf-fps');
        if (fpsEl) {
            fpsEl.textContent = perfMonitor.fps;
            fpsEl.style.color = perfMonitor.fps < 30 ? '#ff5252' : perfMonitor.fps < 50 ? '#ff9800' : '#4caf50';
        }
        
        // 更新 fps-value (移动端帧率显示)
        const fpsValueEl = document.getElementById('fps-value');
        const fpsCounterEl = document.getElementById('fps-counter');
        if (fpsValueEl) {
            fpsValueEl.textContent = perfMonitor.fps;
        }
        if (fpsCounterEl) {
            fpsCounterEl.classList.remove('warning', 'critical');
            if (perfMonitor.fps < 25) {
                fpsCounterEl.classList.add('critical');
            } else if (perfMonitor.fps < 45) {
                fpsCounterEl.classList.add('warning');
            }
        }
        
        const enemiesEl = document.getElementById('perf-enemies');
        if (enemiesEl) enemiesEl.textContent = this.enemies.length;
        
        const bulletsEl = document.getElementById('perf-bullets');
        if (bulletsEl) bulletsEl.textContent = this.bullets.length;
        
        const particlesEl = document.getElementById('perf-particles');
        if (particlesEl) particlesEl.textContent = this.particles.length;
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
    
    // 绘制 AOE 预警圈
    drawAOEWarnings(ctx) {
        if (!this.pendingAOEs) return;
        
        for (const aoe of this.pendingAOEs) {
            const alpha = 0.3 + Math.sin(Date.now() / 100) * 0.2;
            
            // 外圈 - 闪烁警告
            ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(aoe.x, aoe.y, aoe.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // 填充 - 红色半透明
            const fillAlpha = 0.1 + (1 - aoe.timer / 1.5) * 0.3; // 越接近爆炸越红
            ctx.fillStyle = `rgba(255, 0, 0, ${fillAlpha})`;
            ctx.beginPath();
            ctx.arc(aoe.x, aoe.y, aoe.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 倒计时文字
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 10;
            ctx.fillText(aoe.timer.toFixed(1) + 's', aoe.x, aoe.y + 8);
            ctx.shadowBlur = 0;
        }
    }
    
    // 绘制能量球
    drawPowerOrbs(ctx) {
        if (!this.powerOrbs) return;
        
        for (const orb of this.powerOrbs) {
            const pulse = Math.sin(orb.pulse) * 5;
            const alpha = orb.life > 3 ? 1 : orb.life / 3; // 快消失时淡出
            
            // 外发光
            ctx.save();
            ctx.globalAlpha = alpha * 0.5;
            const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius + 20 + pulse);
            glow.addColorStop(0, orb.color);
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius + 20 + pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 内核
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = orb.color;
            ctx.shadowColor = orb.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius + pulse * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            // 高光
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(orb.x - 5, orb.y - 5, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // 效果文字
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(orb.effect, orb.x, orb.y + orb.radius + 20);
            ctx.restore();
        }
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

