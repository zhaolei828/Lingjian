// ========== 统一游戏引擎 ==========
// 跨平台版本，无 DOM 依赖，支持 Web + 小游戏
// 支持：关卡模式 (STAGES) + 秘境模式 (ARENA)

import { Platform } from './platform.js';
import { STAGES, ARENA_CONFIG, ARENA_MOBS, ARENA_BOSSES, ARTIFACTS, SKILLS, ROLES, SVG_LIB, ITEM_CARDS } from './data.js';
import { Player, Enemy, FloatText, Particle, Artifact, StaticObject, Chest, Footprint, Bullet } from './entities.js';
import { Assets, loadAssets } from './assets.js';
import { generateBloodArenaPattern, generateStagePattern } from './map.js';
import { Coin } from './coin.js';
import { Config, isMobile, limitArray, isInView, perfMonitor } from './performance.js';
import { collisionManager } from './spatial-hash.js';
import { ItemCardManager } from './item-card.js';
import { WeatherSystem } from './weather.js';
import { Pool } from './pool.js';

// ========== 游戏模式常量 ==========
export const GAME_MODES = {
    STAGE: 'stage',     // 关卡模式：计时生存，6个地图
    ARENA: 'arena'      // 秘境模式：波次挑战
};

// ========== 关卡视觉样式 ==========
const STAGE_STYLES = [
    { // 0: 幽暗密林
        skyTop: '#000500', skyBot: '#0f1519',
        groundBase: '#0b1013', groundSurf: '#1b5e20',
        patternColor: '#000',
        decoType: 'tree'
    },
    { // 1: 埋骨之地
        skyTop: '#1a1a1a', skyBot: '#2c3e50',
        groundBase: '#212121', groundSurf: '#424242',
        patternColor: '#000',
        decoType: 'cross'
    },
    { // 2: 熔岩炼狱
        skyTop: '#210000', skyBot: '#3e2723',
        groundBase: '#210000', groundSurf: '#3e2723',
        patternColor: '#ff5722',
        decoType: 'spike'
    },
    { // 3: 极寒冰原
        skyTop: '#0d47a1', skyBot: '#1976d2',
        groundBase: '#0d47a1', groundSurf: '#64b5f6',
        patternColor: '#e1f5fe',
        decoType: 'crystal'
    },
    { // 4: 塞外古战场
        skyTop: '#2d2318', skyBot: '#5c4a2a',
        groundBase: '#3e3626', groundSurf: '#5d5340',
        patternColor: '#2e261a',
        decoType: 'spike'
    },
    { // 5: 昆仑仙境
        skyTop: '#000000', skyBot: '#2c3e50',
        groundBase: '#37474f', groundSurf: '#ecf0f1',
        patternColor: null,
        decoType: 'pavilion'
    }
];

// 血色秘境专属敌人类
class ArenaEnemy extends Enemy {
    constructor(type, x, y, levelMult, playerLevel) {
        const mobData = ARENA_MOBS[type] || ARENA_BOSSES[type];
        const baseHp = mobData?.hp || 50;
        const baseDmg = mobData?.dmg || 10;
        const level = Math.max(1, Math.floor(playerLevel * levelMult));
        
        super(type, x, y, level);
        
        this.hp = baseHp * (1 + level * 0.2);
        this.maxHp = this.hp;
        this.dmg = baseDmg * (1 + level * 0.1);
        this.goldDrop = mobData?.goldDrop || [1, 2];
        this.isBoss = !!ARENA_BOSSES[type];
        this.bossSize = mobData?.size || 1.0;
        this.name = mobData?.name || type;
        
        if (this.isBoss) {
            this.hp *= 10;
            this.maxHp = this.hp;
            this.dmg *= 2;
        }
    }
    
    takeDamage(v, kx, ky, type, knockback) {
        if (this.dead) return;
        
        // 确保伤害值有效
        const dmg = v || 0;
        if (isNaN(dmg) || dmg <= 0) return;
        
        this.hp -= dmg;
        this.x += (kx || 0) * 10 * (knockback || 1);
        this.y += (ky || 0) * 10 * (knockback || 1);
        
        window.Game.texts.push(new FloatText(this.x, this.y - 30, Math.floor(dmg), '#ff5252'));
        
        for (let i = 0; i < 5; i++) {
            window.Game.particles.push(window.Game.pool.get('particle', Particle, this.x, this.y, '#ff5252', 0.3, 4));
        }
        
        if (this.hp <= 0 && !this.dead) {
            window.Game.onEnemyKilled(this);
        }
    }
    
    draw(ctx, assets) {
        if (this.dead) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const scale = this.isBoss ? this.bossSize : 1.0;
        ctx.scale(scale, scale);
        
        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const shouldFlip = window.Game.player && window.Game.player.x < this.x;
        if (shouldFlip) ctx.scale(-1, 1);
        
        // 绘制怪物
        this.drawFallbackMob(ctx);
        
        ctx.restore();
        
        // 名字
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
        
        this.drawHpBar(ctx);
    }
    
    drawFallbackMob(ctx) {
        const time = Date.now() / 1000;
        const bounce = Math.sin(time * 5 + this.x) * 2;
        
        // 简化的怪物绘制
        ctx.fillStyle = this.isBoss ? '#c0392b' : '#8b0000';
        ctx.beginPath();
        ctx.arc(0, bounce, this.isBoss ? 25 : 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(-5, -3 + bounce, 3, 0, Math.PI * 2);
        ctx.arc(5, -3 + bounce, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawHpBar(ctx) {
        const scale = this.isBoss ? this.bossSize : 1.0;
        if (!this.isBoss && this.hp < this.maxHp) {
            ctx.save();
            ctx.translate(this.x, this.y - 35 * scale);
            const barWidth = 40;
            const barHeight = 5;
            const hpRatio = this.hp / this.maxHp;
            
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(-barWidth/2 - 1, -1, barWidth + 2, barHeight + 2);
            
            ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
            ctx.fillRect(-barWidth/2, 0, barWidth * hpRatio, barHeight);
            
            ctx.restore();
        }
    }
}

// 全局升级菜单函数（供 entities.js 中的 Player.levelUp 调用）
window.showUpgradeMenu = function() {
    if (window.Game && window.Game.showLevelUpMenu) {
        window.Game.showLevelUpMenu();
    }
};

// ========== 统一游戏引擎 ==========
export class UnifiedArenaEngine {
    constructor(canvas, width, height) {
        window.Game = this;
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.state = 'MENU';
        this.lastTime = 0;
        this.playTime = 0;
        this.gameZoom = 1;  // 支持移动端双指缩放
        
        // 游戏模式
        this.gameMode = GAME_MODES.ARENA; // 默认秘境模式
        
        // ========== 关卡模式专属 ==========
        this.stageIdx = 0;
        this.eliteTimer = 0;
        this.staticObjects = [];
        this.edgeDecorations = [];
        this.weather = new WeatherSystem();
        this.orbs = [];      // 经验球
        this.chests = [];    // 宝箱
        this.footprints = [];
        
        // ========== 秘境模式专属 ==========
        this.currentWave = 0;
        this.waveEnemies = [];
        this.waveCleared = false;
        this.bossCountdown = 0;
        this.showingBossIntro = false;
        this.bossTextShown = false;
        this.currentBoss = null;
        
        // Boss 战斗系统
        this.bossSkillTimer = 0;
        this.orbSpawnTimer = 0;
        this.powerOrbs = [];
        this.pendingAOEs = [];
        
        // 道具卡系统
        this.itemCards = new ItemCardManager(this);
        
        // 波次标题和飞行金币
        this.waveTitle = null;
        this.waveTitleTimer = 0;
        this.flyingCoins = [];
        
        // ========== 通用属性 ==========
        // 统计
        this.totalKills = 0;
        this.totalGold = 0;
        this.score = 0;
        
        // 实体
        this.player = null;
        this.artifact = null;
        this.enemies = [];
        this.bullets = [];
        this.minions = [];
        this.particles = [];
        this.texts = [];
        this.coins = [];
        
        // 技能选择
        this.pendingSkillChoice = false;
        this.availableSkills = [];
        
        // 摇杆输入
        this.touch = { active: false, dx: 0, dy: 0 };
        this.keys = {};
        
        // 相机
        this.camera = { x: 0, y: 0 };
        this.bgPattern = null;
        this.shake = 0;
        
        // 冻结效果
        this.freezeTimer = 0;
        this.hitStopCooldown = 0;
        
        // UI 引用
        this.ui = null;
        
        // 对象池（优化性能，减少 GC）
        this.pool = new Pool();
        
        // 资源
        this.assets = {};
        this.loadAssets();
        
        // 绑定键盘事件（仅 Web）
        if (Platform.isWeb) {
            window.addEventListener('keydown', e => this.keys[e.code] = true);
            window.addEventListener('keyup', e => this.keys[e.code] = false);
        }
    }
    
    // 游戏主循环
    loop(now) {
        // 帧率监控
        perfMonitor.tick();
        
        let dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        
        // MENU 状态：不绘制游戏内容（DOM 菜单显示中）
        if (this.state === 'MENU') {
            // 只是等待开始
            requestAnimationFrame(t => this.loop(t));
            return;
        }
        
        // 冻结效果（顿帧）
        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
            dt = 0;
        }
        
        // 顿帧冷却
        if (this.hitStopCooldown > 0) {
            this.hitStopCooldown -= dt;
        }
        
        // 更新游戏状态
        if (this.state === 'PLAY' && !this.showingBossIntro) {
            this.update(dt);
        }
        
        // 更新性能监控数据
        perfMonitor.metrics.particles = this.particles.length;
        perfMonitor.metrics.bullets = this.bullets.length;
        perfMonitor.metrics.enemies = this.enemies.length;
        
        // 绘制
        this.draw();
        
        // 绘制 Canvas UI（如果有的话）
        if (this.ui) {
            this.ui.update(dt);
            this.ui.draw();
        }
        
        // 继续循环
        requestAnimationFrame(t => this.loop(t));
    }
    
    // 设置 UI 引用
    setUI(ui) {
        this.ui = ui;
    }
    
    // 设置摇杆输入
    setJoystickInput(dx, dy, active) {
        this.touch.dx = dx;
        this.touch.dy = dy;
        this.touch.active = active;
    }
    
    // 震屏效果
    screenShake(intensity = 1) {
        this.shake = Math.max(this.shake, intensity);
    }
    
    // 显示升级菜单（供全局 showUpgradeMenu 调用）
    showLevelUpMenu() {
        // 暂停游戏
        this.state = 'LEVELUP';
        
        // 随机选择3个升级选项
        const upgrades = [
            { name: '攻击强化', desc: '伤害+20%', icon: '⚔️', effect: { dmgMult: 1.2 } },
            { name: '生命强化', desc: '血量+30%', icon: '❤️', effect: { hpMult: 1.3 } },
            { name: '速度强化', desc: '移速+15%', icon: '👟', effect: { speedMult: 1.15 } },
            { name: '攻速强化', desc: '攻击间隔-15%', icon: '⚡', effect: { cdMult: 0.85 } },
            { name: '穿透强化', desc: '穿透+1', icon: '🎯', effect: { pierce: 1 } },
            { name: '范围强化', desc: '攻击范围+20%', icon: '🔮', effect: { areaMult: 1.2 } }
        ];
        
        const shuffled = [...upgrades].sort(() => Math.random() - 0.5);
        const choices = shuffled.slice(0, 3);
        
        if (this.ui) {
            this.ui.showLevelUpMenu(choices, (upgrade) => {
                this.applyUpgrade(upgrade);
                this.state = 'PLAY';
            });
        } else {
            // 无 UI 时自动选择第一个
            this.applyUpgrade(choices[0]);
            this.state = 'PLAY';
        }
    }
    
    // 应用升级效果
    applyUpgrade(upgrade) {
        if (!this.player || !upgrade || !upgrade.effect) return;
        
        const e = upgrade.effect;
        if (e.dmgMult) this.player.stats.dmg *= e.dmgMult;
        if (e.hpMult) {
            this.player.maxHp *= e.hpMult;
            this.player.hp = this.player.maxHp;
        }
        if (e.speedMult) this.player.speed *= e.speedMult;
        if (e.cdMult) this.player.stats.cd *= e.cdMult;
        if (e.pierce) this.player.stats.pierce += e.pierce;
        if (e.areaMult) this.player.stats.area *= e.areaMult;
        
        this.texts.push(new FloatText(this.player.x, this.player.y - 50, `✨ ${upgrade.name}`, '#f1c40f'));
    }
    
    // 加载资源
    loadAssets() {
        // 使用 assets.js 的 loadAssets 函数
        loadAssets().then(() => {
            Platform.log('资源加载完成');
        }).catch(err => {
            Platform.error('资源加载失败:', err);
        });
        
        // 同时填充本地 assets 引用
        this.assets = Assets;
    }
    
    // 调整大小
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    // 开始游戏 - 支持两种模式
    // mode: 'arena' (秘境模式) 或 'stage' (关卡模式)
    // stageIdx: 关卡模式的起始关卡
    start(roleId = 'sword', mode = GAME_MODES.ARENA, stageIdx = 0) {
        this.gameMode = mode;
        
        this.player = new Player(roleId);
        this.player.x = 0;
        this.player.y = 0;
        
        // 随机法宝
        const randArtifact = ARTIFACTS[Math.floor(Math.random() * ARTIFACTS.length)];
        this.artifact = new Artifact(randArtifact.id);
        
        // 重置通用状态
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.texts = [];
        this.coins = [];
        this.minions = [];
        this.pool.clear(); // 清空对象池
        this.totalKills = 0;
        this.totalGold = 0;
        this.score = 0;
        this.playTime = 0;
        this.pendingSkillChoice = false;
        this.waveTitle = null;
        this.waveTitleTimer = 0;
        this.flyingCoins = [];
        
        if (mode === GAME_MODES.ARENA) {
            // ========== 秘境模式初始化 ==========
            this.powerOrbs = [];
            this.pendingAOEs = [];
            this.currentWave = 0;
            this.waveCleared = true;
            this.showingBossIntro = false;
            this.bossTextShown = false;
            this.bossCountdown = 0;
            this.bossSkillTimer = 0;
            this.orbSpawnTimer = 0;
            this.currentBoss = null;
            
            // 重置道具卡
            this.itemCards.reset();
            
            // 生成秘境不规则边缘（血色风格）
            this.generateArenaIrregularEdge();
            
            // 生成血色秘境背景
            this.bgPattern = this.ctx.createPattern(generateBloodArenaPattern(), 'repeat');
            
            this.state = 'PLAY';
            this.updateUI();
            
            // 显示法宝信息
            const artifactName = this.artifact?.data?.name || '神秘法宝';
            this.texts.push(new FloatText(0, -100, `🔮 ${artifactName}`, '#9b59b6'));
            
            // 延迟开始第一波
            setTimeout(() => this.startNextWave(), 2500);
            
        } else {
            // ========== 关卡模式初始化 ==========
            this.stageIdx = stageIdx;
            this.eliteTimer = 0;
            this.staticObjects = [];
            this.edgeDecorations = [];
            this.orbs = [];
            this.chests = [];
            this.footprints = [];
            
            // 关卡模式有初始时间
            this.playTime = STAGES[stageIdx]?.time || 0;
            
            // 如果不是第一关，给予额外属性
            if (stageIdx > 0) {
                this.player.lvl = stageIdx * 3 + 1;
                this.player.stats.dmg += stageIdx * 15;
                this.player.hp = 100 + stageIdx * 20;
                this.player.maxHp = 100 + stageIdx * 20;
            }
            
            // 初始化地图
            this.initStageMap();
            
            // 生成关卡背景
            this.bgPattern = this.ctx.createPattern(generateStagePattern(this.stageIdx), 'repeat');
            
            this.state = 'PLAY';
            this.updateUI();
            
            // 显示关卡标题
            const stageName = STAGES[this.stageIdx]?.name || '未知之地';
            this.showWaveTitle(stageName, '探索开始');
            
            // 显示法宝信息
            const artifactName = this.artifact?.data?.name || '神秘法宝';
            this.texts.push(new FloatText(0, -100, `🔮 ${artifactName}`, '#9b59b6'));
        }
    }
    
    // ========== 关卡模式：地图初始化 ==========
    initStageMap() {
        this.staticObjects = [];
        this.initEdgeDecorations();
        
        switch(this.stageIdx) {
            case 0: this.initForest(); break;
            case 1: this.initBone(); break;
            case 2: this.initMagma(); break;
            case 3: this.initIce(); break;
            case 4: this.initBattlefield(); break;
            case 5: this.initFairyland(); break;
        }
    }
    
    // 幽暗密林
    initForest() {
        for(let i = 0; i < 40; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 450 + Math.random() * 150;
            this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, 'tree_forest'));
        }
        for(let i = 0; i < 30; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * 500;
            this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, Math.random() > 0.5 ? 'bush' : 'stone_s'));
        }
    }
    
    // 埋骨之地
    initBone() {
        for(let i = 0; i < 25; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 480 + Math.random() * 120;
            const rand = Math.random();
            let type = 'stele_c';
            if(rand > 0.8) type = 'dead_tree';
            else if(rand > 0.6) type = 'spirit_banner';
            this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, type));
        }
        for(let i = 0; i < 35; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * 500;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            
            if(Math.random() < 0.3) {
                this.staticObjects.push(new StaticObject(x, y, 'grave_mound'));
                this.staticObjects.push(new StaticObject(x, y + 15, 'stele_c'));
                if(Math.random() < 0.4) this.staticObjects.push(new StaticObject(x + 40, y + 10, 'spirit_banner'));
            } else {
                let type = Math.random() < 0.4 ? 'stele_c' : (Math.random() < 0.7 ? 'grave_mound' : 'dead_tree');
                this.staticObjects.push(new StaticObject(x, y, type));
            }
        }
    }
    
    // 熔岩炼狱
    initMagma() {
        for(let i = 0; i < 30; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 500 + Math.random() * 100;
            this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, 'magma_rock_deco'));
        }
        for(let i = 0; i < 20; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * 500;
            this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, Math.random() > 0.5 ? 'magma_rock_deco' : 'stone_s'));
        }
    }
    
    // 极寒冰原
    initIce() {
        for(let i = 0; i < 40; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 450 + Math.random() * 150;
            this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, 'crystal_deco'));
        }
        for(let i = 0; i < 20; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * 500;
            this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, Math.random() > 0.6 ? 'crystal_deco' : 'stone_s'));
        }
    }
    
    // 塞外古战场
    initBattlefield() {
        const wreckTypes = ['broken_sword', 'broken_blade', 'broken_spear', 'shield_round'];
        for(let i = 0; i < 10; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 100 + Math.random() * 400;
            const type = wreckTypes[Math.floor(Math.random() * wreckTypes.length)];
            const obj = new StaticObject(Math.cos(a) * r, Math.sin(a) * r, type);
            obj.rotation = Math.random() * Math.PI * 2;
            this.staticObjects.push(obj);
        }
        
        if(Math.random() < 0.6) {
            const a = Math.random() * Math.PI * 2;
            const r = 200 + Math.random() * 250;
            const obj = new StaticObject(Math.cos(a) * r, Math.sin(a) * r, 'chariot_wreck');
            obj.rotation = Math.random() * Math.PI * 2;
            this.staticObjects.push(obj);
        }
        
        for(let i = 0; i < 30; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 450 + Math.random() * 150;
            this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, 'stone_s'));
        }
    }
    
    // 昆仑仙境
    initFairyland() {
        this.staticObjects.push(new StaticObject(0, -100, 'pavilion'));
        this.staticObjects.push(new StaticObject(0, 250, 'gate'));
        for(let i = 0; i < 20; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 150 + Math.random() * 350;
            this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, Math.random() > 0.6 ? 'pine' : 'stone_s'));
        }
    }
    
    /**
     * 生成不规则边缘路径
     * 用于替代完美圆形，创造更自然的岛屿边缘
     */
    generateIrregularEdgePath() {
        const R = 600;
        const pointCount = 120; // 边缘点数量
        this.irregularEdgePath = [];
        
        // 根据关卡类型设置不同的"参差不齐"程度
        let jitter = 20;     // 随机偏移量
        let waveAmp = 15;    // 波浪振幅
        let waveFreq = 3;    // 波浪频率
        
        switch (this.stageIdx) {
            case 0: // 幽暗密林 - 较多凹凸（树根、灌木）
                jitter = 25;
                waveAmp = 20;
                waveFreq = 5;
                break;
            case 1: // 埋骨之地 - 中等凹凸（碎石）
                jitter = 20;
                waveAmp = 15;
                waveFreq = 4;
                break;
            case 2: // 熔岩炼狱 - 锯齿状（熔岩冷却）
                jitter = 30;
                waveAmp = 25;
                waveFreq = 8;
                break;
            case 3: // 极寒冰原 - 平滑但有冰块突起
                jitter = 15;
                waveAmp = 30;
                waveFreq = 2;
                break;
            case 4: // 塞外古战场 - 沙丘起伏
                jitter = 18;
                waveAmp = 20;
                waveFreq = 3;
                break;
            case 5: // 昆仑仙境 - 较平滑（仙气飘渺）
                jitter = 10;
                waveAmp = 12;
                waveFreq = 2;
                break;
        }
        
        // 生成随机种子（每次初始化地图时变化）
        const seed = Math.random() * 1000;
        
        for (let i = 0; i < pointCount; i++) {
            const angle = (i / pointCount) * Math.PI * 2;
            
            // 多层噪声叠加，创造更自然的边缘
            const noise1 = Math.sin(angle * waveFreq + seed) * waveAmp;
            const noise2 = Math.sin(angle * waveFreq * 2.3 + seed * 1.7) * (waveAmp * 0.5);
            const noise3 = (Math.random() - 0.5) * jitter;
            
            const r = R + noise1 + noise2 + noise3;
            
            this.irregularEdgePath.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r,
                angle: angle,
                radius: r
            });
        }
    }
    
    /**
     * 创建不规则边缘路径（不执行绑定操作）
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} scale - 缩放比例（默认1.0）
     */
    createIrregularEdgePath(ctx, scale = 1.0) {
        if (!this.irregularEdgePath || this.irregularEdgePath.length === 0) {
            // 如果没有生成不规则路径，则使用圆形作为后备
            ctx.arc(0, 0, 600 * scale, 0, Math.PI * 2);
            return;
        }
        
        const path = this.irregularEdgePath;
        const startX = path[0].x * scale;
        const startY = path[0].y * scale;
        ctx.moveTo(startX, startY);
        
        // 使用贝塞尔曲线连接各点，使边缘更平滑
        for (let i = 0; i < path.length; i++) {
            const p0 = path[i];
            const p1 = path[(i + 1) % path.length];
            
            // 控制点
            const cx = ((p0.x + p1.x) / 2) * scale;
            const cy = ((p0.y + p1.y) / 2) * scale;
            
            ctx.quadraticCurveTo(p0.x * scale, p0.y * scale, cx, cy);
        }
        
        ctx.closePath();
    }
    
    /**
     * 绘制不规则边缘（填充）
     * @param {CanvasRenderingContext2D} ctx 
     * @param {string} fillStyle - 填充颜色
     * @param {number} scale - 缩放比例
     */
    fillIrregularEdge(ctx, fillStyle, scale = 1.0) {
        ctx.beginPath();
        this.createIrregularEdgePath(ctx, scale);
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    
    /**
     * 绘制不规则边缘（描边）
     * @param {CanvasRenderingContext2D} ctx 
     * @param {string} strokeStyle - 描边颜色
     * @param {number} lineWidth - 线宽
     * @param {number} scale - 缩放比例
     */
    strokeIrregularEdge(ctx, strokeStyle, lineWidth, scale = 1.0) {
        ctx.beginPath();
        this.createIrregularEdgePath(ctx, scale);
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
    
    /**
     * 使用不规则边缘作为裁剪区域
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} scale - 缩放比例
     */
    clipIrregularEdge(ctx, scale = 1.0) {
        ctx.beginPath();
        this.createIrregularEdgePath(ctx, scale);
        ctx.clip();
    }
    
    // 初始化边缘装饰
    initEdgeDecorations() {
        // 先生成不规则边缘路径
        this.generateIrregularEdgePath();
        
        this.edgeDecorations = [];
        const count = this.stageIdx === 0 ? 90 : 60;
        
        for(let i = 0; i < count; i++) {
            // 使用不规则边缘路径上的点
            const pathIdx = Math.floor((i / count) * this.irregularEdgePath.length);
            const pathPoint = this.irregularEdgePath[pathIdx];
            
            const angle = pathPoint.angle + (Math.random() - 0.5) * 0.1;
            const r = pathPoint.radius - 5 + Math.random() * 15;
            const size = 15 + Math.random() * 20;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            
            let type = 'rock';
            let color = '#555';
            
            switch(this.stageIdx) {
                case 0: // 幽暗密林 - 灌木 + 藤蔓
                    type = 'bush';
                    color = Math.random() > 0.5 ? '#2e7d32' : '#1b5e20';
                    // 添加悬挂藤蔓
                    if(Math.random() < 0.6) { 
                        this.edgeDecorations.push({ 
                            x, y, 
                            size: size, 
                            rotation: angle, 
                            type: 'vine', 
                            color: Math.random() > 0.5 ? '#2e7d32' : '#388e3c',
                            length: 60 + Math.random() * 100,
                            width: 2 + Math.random() * 2,
                            twistFreq: 0.02 + Math.random() * 0.04,
                            twistAmp: 5 + Math.random() * 10,
                            swayOffset: Math.random() * Math.PI * 2
                        });
                    }
                    break;
                    
                case 1: // 埋骨之地 - 岩石
                    type = 'rock';
                    color = '#424242';
                    break;
                    
                case 2: // 熔岩炼狱 - 尖石 + 岩浆瀑布
                    if (Math.random() < 0.2) {
                        type = 'lava_fall';
                        color = '#ff5722';
                        this.edgeDecorations.push({ 
                            x, y, 
                            rotation: angle, 
                            type: 'lava_fall', 
                            width: 20 + Math.random() * 30,
                            length: 100 + Math.random() * 200,
                            speed: 50 + Math.random() * 100,
                            color: '#ff5722'
                        });
                        continue;
                    }
                    type = 'sharp';
                    color = '#3e2723';
                    break;
                    
                case 3: // 极寒冰原 - 冰晶
                    type = 'ice';
                    color = 'rgba(225, 245, 254, 0.8)';
                    break;
                    
                case 4: // 塞外古战场 - 沙丘
                    type = 'sand';
                    color = '#5c4a2a';
                    break;
                    
                case 5: // 昆仑仙境 - 云朵
                    type = 'cloud';
                    color = '#cfd8dc';
                    break;
            }
            
            this.edgeDecorations.push({ x, y, size, rotation: Math.random() * Math.PI, type, color });
        }
    }
    
    // 关卡模式：生成普通敌人
    spawnEnemy(diff) {
        const a = Math.random() * Math.PI * 2;
        const r = 580;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        
        const colors = ['#1b5e20', '#7f8c8d', '#ff5722', '#4fc3f7', '#2c3e50'];
        for(let i = 0; i < 5; i++) {
            this.particles.push(this.pool.get('particle', Particle, x, y, colors[this.stageIdx] || '#000', 0.5, 4));
        }
        
        const stage = STAGES[this.stageIdx];
        let type = 'rock';
        if (stage && stage.mobs && stage.mobs.length > 0) {
            type = stage.mobs[Math.floor(Math.random() * stage.mobs.length)];
        }
        
        this.enemies.push(new Enemy(type, x, y, diff));
    }
    
    // 关卡模式：生成精英怪
    spawnElite(diff) {
        const a = Math.random() * Math.PI * 2;
        const r = 550;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        
        const stage = STAGES[this.stageIdx];
        const type = stage.mobs[Math.floor(Math.random() * stage.mobs.length)];
        
        this.enemies.push(new Enemy(type, x, y, diff, true)); // isElite = true
        this.showWaveTitle('强敌出现!', '');
        this.screenShake(1.0);
    }
    
    // 关卡模式：打开宝箱
    openChest(x, y) {
        const r = Math.random();
        if(r < 0.3) {
            this.player.hp = this.player.maxHp;
            this.texts.push(new FloatText(x, y, '气血全满!', '#2ecc71'));
        } else if (r < 0.6) {
            this.enemies.forEach(e => { if(!e.isElite) e.takeDamage(9999, 0, 0, 'sword'); });
            this.screenShake(2.0);
            this.texts.push(new FloatText(x, y, '万剑归一!', '#e74c3c'));
        } else {
            this.player.gainExp(this.player.maxExp - this.player.exp);
            this.texts.push(new FloatText(x, y, '顿悟飞升!', '#f1c40f'));
        }
    }
    
    // 更新
    update(dt) {
        if (this.state !== 'PLAY') return;
        
        this.playTime += dt;
        
        // 震屏衰减
        if (this.shake > 0) {
            this.shake = Math.max(0, this.shake - dt * 5);
        }
        
        // 【重要】先重建空间哈希，再更新玩家（确保技能能找到目标）
        collisionManager.rebuild(this.enemies, this.bullets, this.orbs);
        
        // 更新玩家
        if (this.player && !this.player.dead) {
            this.player.update(dt);
            
            // 相机跟随
            this.camera.x = this.player.x - this.width / 2;
            this.camera.y = this.player.y - this.height / 2;
        }
        
        // 更新敌人
        this.enemies = this.enemies.filter(e => {
            if (e.dead) return false;
            e.update(dt, this.player);
            return true;
        });
        
        // 更新子弹
        this.bullets = this.bullets.filter(b => {
            if (b.dead) return false;
            b.update(dt);
            
            // 子弹-敌人碰撞
            for (const enemy of this.enemies) {
                if (enemy.dead) continue;
                const dx = b.x - enemy.x;
                const dy = b.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const hitRadius = enemy.isBoss ? 40 : 25;
                
                if (dist < hitRadius) {
                    // 确保伤害值有效
                    const dmgValue = b.dmg || 10;
                    if (!isNaN(dmgValue) && dmgValue > 0) {
                        enemy.takeDamage(dmgValue, dx / dist, dy / dist, b.type, b.knockback || 1.0);
                    }
                    b.pierce--;
                    if (b.pierce <= 0) b.dead = true;
                }
            }
            
            return !b.dead;
        });
        
        // 更新金币
        // 更新金币（使用对象池回收）
        const aliveCoins = [];
        for (const c of this.coins) {
            if (c.dead) {
                this.pool.recycle('coin', c);
                continue;
            }
            c.update(dt, this.player);
            
            // 金币拾取
            if (this.player) {
                const dx = c.x - this.player.x;
                const dy = c.y - this.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < 30) {
                    this.totalGold += c.value;
                    c.dead = true;
                    this.pool.recycle('coin', c);
                    this.updateUI();
                    continue;
                }
            }
            
            aliveCoins.push(c);
        }
        this.coins = aliveCoins;
        
        // 更新粒子（使用对象池回收）
        const aliveParticles = [];
        for (const p of this.particles) {
            p.update(dt);
            if (p.life > 0) {
                aliveParticles.push(p);
            } else {
                this.pool.recycle('particle', p);
            }
        }
        this.particles = aliveParticles;
        
        // 更新文字
        this.texts = this.texts.filter(t => {
            t.update(dt);
            return t.life > 0;
        });
        
        // 玩家-敌人碰撞（持续接触伤害，绕过无敌帧）
        if (this.player && !this.player.dead && !this.player.invincible) {
            for (const enemy of this.enemies) {
                if (enemy.dead) continue;
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const hitRadius = enemy.isBoss ? 50 : 30;
                
                if (dist < hitRadius) {
                    // 每帧伤害（约 60fps，所以 * 0.016）
                    let damage = (enemy.dmg || 10) * 0.016;
                    
                    // 玄武盾减伤效果
                    if (this.player.damageReduction) {
                        damage *= (1 - this.player.damageReduction);
                    }
                    
                    this.player.hp -= damage;
                    this.player.hp = Math.max(0, this.player.hp);
                    
                    // 玄武盾反弹效果（每秒触发一次）
                    if (this.player.damageReflect) {
                        if (!enemy.lastReflectTime) enemy.lastReflectTime = 0;
                        if (this.playTime - enemy.lastReflectTime > 1.0) {
                            enemy.lastReflectTime = this.playTime;
                            const reflectDamage = (enemy.dmg || 10) * this.player.damageReflect;
                            enemy.hp -= reflectDamage;
                            this.texts.push(new FloatText(enemy.x, enemy.y, "-" + Math.floor(reflectDamage), '#3498db'));
                            if (enemy.hp <= 0 && !enemy.dead) {
                                this.onEnemyKilled(enemy);
                            }
                        }
                    }
                    
                    this.updateUI();
                    
                    if (this.player.hp <= 0) {
                        this.player.dead = true;
                        this.gameOver(false);
                    }
                }
            }
        }
        
        // 更新法宝
        if (this.artifact) {
            this.artifact.update(dt, this.player, this);
        }
        
        // 更新召唤物
        this.minions = this.minions.filter(m => {
            if (m.dead) return false;
            m.update(dt);
            return true;
        });
        
        // ========== 模式特定更新 ==========
        if (this.gameMode === GAME_MODES.ARENA) {
            // 秘境模式更新
            this.checkWaveComplete();
            this.itemCards.update(dt);
            this.updateBossBattle(dt);
            this.updatePowerOrbs(dt);
        } else {
            // 关卡模式更新
            this.updateStageMode(dt);
        }
        
        // 更新波次标题
        if (this.waveTitle && this.waveTitleTimer > 0) {
            this.waveTitleTimer -= dt;
            if (this.waveTitleTimer <= 0) {
                this.waveTitle = null;
            }
        }
        
        // 更新飞行金币
        this.flyingCoins = this.flyingCoins.filter(fc => {
            fc.t += dt * 3;
            if (fc.t >= 1) return false;
            fc.x = fc.startX + (fc.endX - fc.startX) * this.easeOutQuad(fc.t);
            fc.y = fc.startY + (fc.endY - fc.startY) * this.easeOutQuad(fc.t) - Math.sin(fc.t * Math.PI) * 50;
            return true;
        });
        
        // 性能优化：限制实体数量
        limitArray(this.particles, Config.maxParticles);
        limitArray(this.bullets, Config.maxBullets);
        limitArray(this.texts, Config.maxTexts);
        limitArray(this.footprints, 50);
    }
    
    // ========== 关卡模式更新 ==========
    updateStageMode(dt) {
        this.eliteTimer += dt;
        
        // 检查关卡切换
        const nextStage = STAGES[this.stageIdx + 1];
        if (nextStage && this.playTime >= nextStage.time) {
            this.stageIdx++;
            this.showWaveTitle(STAGES[this.stageIdx].name, '新区域');
            this.bgPattern = this.ctx.createPattern(generateStagePattern(this.stageIdx), 'repeat');
            this.initStageMap();
            
            // 回复一些血量
            this.player.hp = Math.min(this.player.hp + 20, this.player.maxHp);
            this.updateUI();
        }
        
        // 生成普通敌人
        const diff = 1 + this.playTime / 60;
        if (Math.random() < dt / (1.5 / diff)) {
            this.spawnEnemy(diff);
        }
        
        // 每45秒生成精英
        if (this.eliteTimer > 45) {
            this.eliteTimer = 0;
            this.spawnElite(diff);
        }
        
        // 更新经验球
        this.orbs = this.orbs.filter(o => {
            o.update(dt, this.player);
            return !o.dead;
        });
        
        // 更新宝箱
        this.chests = this.chests.filter(c => {
            c.update(dt, this.player);
            return !c.dead;
        });
        
        // 更新脚印
        this.footprints = this.footprints.filter(f => {
            f.update(dt);
            return !f.dead;
        });
        
        // 更新天气
        this.weather.update(dt, this.stageIdx, this.camera);
        
        // 玩家死亡检测
        if (this.player && this.player.hp <= 0 && !this.player.dead) {
            this.player.dead = true;
            this.gameOver(false);
        }
    }
    
    // 缓动函数
    easeOutQuad(t) {
        return t * (2 - t);
    }
    
    // Boss 战斗更新
    updateBossBattle(dt) {
        if (!this.currentBoss || this.currentBoss.dead) {
            this.currentBoss = null;
            return;
        }
        
        // Boss 技能计时器
        this.bossSkillTimer += dt;
        
        // 每 5 秒发动一次特殊攻击
        if (this.bossSkillTimer >= 5) {
            this.bossSkillTimer = 0;
            this.bossSpecialAttack();
        }
        
        // Boss 定期生成能量球帮助玩家
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
                this.bossCharge(boss);
                break;
            case 1:
                this.bossAOE(boss);
                break;
            case 2:
                this.bossSummon(boss);
                break;
        }
    }
    
    // Boss 冲撞
    bossCharge(boss) {
        if (!this.player) return;
        
        const dx = this.player.x - boss.x;
        const dy = this.player.y - boss.y;
        const dist = Math.hypot(dx, dy) || 1;
        
        const chargeSpeed = 800;
        boss.chargeVx = (dx / dist) * chargeSpeed;
        boss.chargeVy = (dy / dist) * chargeSpeed;
        boss.isCharging = true;
        boss.chargeDuration = 0.5;
        
        for (let i = 0; i < 20; i++) {
            this.particles.push(this.pool.get('particle', Particle, boss.x, boss.y, '#ff0000', 0.5, 8));
        }
    }
    
    // Boss 范围攻击
    bossAOE(boss) {
        if (!this.player) return;
        
        // 在玩家位置创建预警圈
        const aoe = {
            x: this.player.x,
            y: this.player.y,
            radius: 120,
            timer: 1.5,
            damage: boss.dmg * 2
        };
        
        this.pendingAOEs.push(aoe);
        this.texts.push(new FloatText(aoe.x, aoe.y - 50, '⚠️ 危险区域！', '#ff5252'));
    }
    
    // Boss 召唤
    bossSummon(boss) {
        const summonCount = 3 + Math.floor(Math.random() * 3);
        const mobTypes = ['gu_hun', 'xie_ying'];
        
        for (let i = 0; i < summonCount; i++) {
            const angle = (Math.PI * 2 / summonCount) * i;
            const dist = 100 + Math.random() * 50;
            const x = boss.x + Math.cos(angle) * dist;
            const y = boss.y + Math.sin(angle) * dist;
            
            const mobType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
            const enemy = new ArenaEnemy(mobType, x, y, 0.5, this.player.lvl);
            this.enemies.push(enemy);
            
            for (let j = 0; j < 10; j++) {
                this.particles.push(this.pool.get('particle', Particle, x, y, '#8b0000', 0.5, 6));
            }
        }
        
        this.texts.push(new FloatText(boss.x, boss.y - 50, '召唤!', '#ff5252'));
    }
    
    // 生成能量球
    spawnPowerOrb() {
        if (!this.player) return;
        
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
        
        this.powerOrbs.push({
            x, y,
            type: orbData.type,
            color: orbData.color,
            effect: orbData.effect,
            value: orbData.value,
            duration: orbData.duration || 0,
            radius: 20,
            life: 15,
            pulse: 0
        });
        
        this.texts.push(new FloatText(x, y - 30, '💫 能量球!', orbData.color));
    }
    
    // 更新能量球
    updatePowerOrbs(dt) {
        // 更新 AOE 攻击
        for (let i = this.pendingAOEs.length - 1; i >= 0; i--) {
            const aoe = this.pendingAOEs[i];
            aoe.timer -= dt;
            
            if (aoe.timer <= 0) {
                // AOE 爆炸
                const dist = Math.hypot(this.player.x - aoe.x, this.player.y - aoe.y);
                if (dist < aoe.radius && this.player && !this.player.invincible) {
                    this.player.hp -= aoe.damage;
                    this.shake = 1;
                    this.texts.push(new FloatText(this.player.x, this.player.y - 30, Math.floor(aoe.damage), '#ff0000'));
                }
                
                for (let j = 0; j < 30; j++) {
                    this.particles.push(this.pool.get('particle', Particle, aoe.x, aoe.y, '#ff5252', 0.5, 8));
                }
                
                this.pendingAOEs.splice(i, 1);
            }
        }
        
        // 更新 Boss 冲撞
        for (const e of this.enemies) {
            if (e.isCharging && e.chargeDuration > 0) {
                e.chargeDuration -= dt;
                e.x += e.chargeVx * dt;
                e.y += e.chargeVy * dt;
                
                if (Math.random() < 0.5) {
                    this.particles.push(this.pool.get('particle', Particle, e.x, e.y, '#ff5252', 0.3, 5));
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
            if (this.player) {
                const dist = Math.hypot(this.player.x - orb.x, this.player.y - orb.y);
                if (dist < orb.radius + 25) {
                    this.collectPowerOrb(orb);
                    this.powerOrbs.splice(i, 1);
                }
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
                    if (this.player) {
                        this.player.damageBoost = Math.max(1, (this.player.damageBoost || 1) / orb.value);
                    }
                }, orb.duration * 1000);
                this.texts.push(new FloatText(this.player.x, this.player.y - 30, '攻击提升!', '#f44336'));
                break;
            case 'speed':
                this.player.speedBoost = (this.player.speedBoost || 1) * orb.value;
                setTimeout(() => {
                    if (this.player) {
                        this.player.speedBoost = Math.max(1, (this.player.speedBoost || 1) / orb.value);
                    }
                }, orb.duration * 1000);
                this.texts.push(new FloatText(this.player.x, this.player.y - 30, '速度提升!', '#2196f3'));
                break;
            case 'skill_reset':
                if (this.artifact) {
                    this.artifact.cd = 0;
                    this.texts.push(new FloatText(this.player.x, this.player.y - 30, '法宝CD重置!', '#9c27b0'));
                }
                break;
        }
        
        for (let i = 0; i < 15; i++) {
            this.particles.push(this.pool.get('particle', Particle, orb.x, orb.y, orb.color, 0.4, 5));
        }
    }
    
    // 显示波次标题 (Canvas 版)
    showWaveTitle(title, subtitle) {
        this.waveTitle = { title, subtitle };
        this.waveTitleTimer = 2.0;
    }
    
    // 金币飞向计数器 (Canvas 版)
    flyGoldToCounter(fromX, fromY) {
        const screenX = fromX - this.camera.x;
        const screenY = fromY - this.camera.y;
        
        // 目标位置（右上角金币计数器）
        const targetX = this.width - 80;
        const targetY = 50;
        
        this.flyingCoins.push({
            startX: screenX,
            startY: screenY,
            endX: targetX,
            endY: targetY,
            x: screenX,
            y: screenY,
            t: 0
        });
    }
    
    // 绘制
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        
        if (this.gameMode === GAME_MODES.ARENA) {
            this.drawArenaScene(ctx);
        } else {
            this.drawStageScene(ctx);
        }
        
        // 血雾效果（低血量时）
        this.drawBloodMist(ctx);
        
        // 波次标题（屏幕空间）
        this.drawWaveTitle(ctx);
        
        // 飞行金币（屏幕空间）
        this.drawFlyingCoins(ctx);
    }
    
    // 秘境模式场景绘制（俯视图）
    drawArenaScene(ctx) {
        ctx.save();
        
        // 震屏
        if (this.shake > 0) {
            ctx.translate(
                (Math.random() - 0.5) * this.shake * 10,
                (Math.random() - 0.5) * this.shake * 10
            );
        }
        
        // 相机
        ctx.translate(-this.camera.x, -this.camera.y);
        
        // 背景
        this.drawArenaBackground(ctx);
        
        // 金币
        this.coins.forEach(c => c.draw(ctx, this.assets));
        
        // 敌人
        this.enemies.forEach(e => e.draw(ctx, this.assets));
        
        // 子弹
        this.drawBullets(ctx);
        
        // 道具卡特殊实体
        this.itemCards.draw(ctx);
        
        // 玩家
        if (this.player) {
            this.player.draw(ctx, this.assets);
        }
        
        // 召唤物
        this.minions.forEach(m => m.draw(ctx));
        
        // 法宝
        if (this.artifact) {
            this.artifact.draw(ctx, this.assets);
        }
        
        // AOE 预警
        this.drawAOEWarnings(ctx);
        
        // 能量球
        this.drawPowerOrbs(ctx);
        
        // 粒子
        this.particles.forEach(p => p.draw(ctx));
        
        // 文字
        this.texts.forEach(t => t.draw(ctx));
        
        ctx.restore();
    }
    
    // 关卡模式场景绘制（伪3D倾斜视角）
    drawStageScene(ctx) {
        const tilt = 0.5;
        const zoom = 0.7 * (this.gameZoom || 1);
        const R = 600;
        const style = STAGE_STYLES[this.stageIdx] || STAGE_STYLES[0];
        
        ctx.save();
        
        // 1. 绘制天空（屏幕空间）
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, style.skyTop);
        grad.addColorStop(1, style.skyBot);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 2. 绘制远景（屏幕空间）
        this.drawStageFarground(ctx);
        
        // 3. 开始伪3D变换（地面层）
        ctx.save();
        ctx.translate(this.width/2, this.height/2);
        ctx.scale(zoom, zoom * tilt);
        ctx.translate(-this.width/2, -this.height/2);
        
        // 震屏
        let sx = (Math.random() - 0.5) * this.shake * 10;
        let sy = (Math.random() - 0.5) * this.shake * 10;
        ctx.translate(-this.camera.x + sx, -this.camera.y + sy);
        
        // 分离前后边缘装饰
        const backDecos = this.edgeDecorations.filter(d => d.y < 0);
        const frontDecos = this.edgeDecorations.filter(d => d.y >= 0);
        
        // 后景装饰
        backDecos.forEach(d => this.drawEdgeDeco(ctx, d));
        
        // 地面底色
        ctx.fillStyle = style.groundBase;
        ctx.beginPath();
        ctx.moveTo(-R, 0);
        ctx.bezierCurveTo(-R*0.4, R*2.5, R*0.4, R*2.5, R, 0);
        ctx.fill();
        
        // 阴影线
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 30;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, R*2);
        ctx.stroke();
        
        // 地面表层（不规则边缘）
        this.fillIrregularEdge(ctx, style.groundSurf);
        
        ctx.save();
        this.clipIrregularEdge(ctx);
        
        // 背景纹理
        if (this.bgPattern) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.bgPattern;
            ctx.fillRect(-R, -R, R*2, R*2);
            ctx.globalAlpha = 1.0;
        }
        
        // 特殊纹理
        if (style.patternColor) {
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = style.patternColor;
            for(let i=0; i<20; i++) {
                ctx.beginPath();
                ctx.arc((Math.random()-0.5)*R*2, (Math.random()-0.5)*R*2, 50, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }
        
        // 熔岩裂纹
        if (this.stageIdx === 2) {
            ctx.strokeStyle = '#ff5722';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5;
            for(let i=0; i<10; i++) {
                ctx.beginPath();
                ctx.moveTo((Math.random()-0.5)*R*2, (Math.random()-0.5)*R*2);
                ctx.lineTo((Math.random()-0.5)*R*2, (Math.random()-0.5)*R*2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
        }
        
        // 脚印
        this.footprints.forEach(f => f.draw(ctx));
        
        // 边缘高光（使用不规则边缘）
        this.strokeIrregularEdge(ctx, 'rgba(255,255,255,0.1)', 10, 0.99);
        
        ctx.restore(); // 结束裁剪
        
        // 前景装饰
        frontDecos.forEach(d => this.drawEdgeDeco(ctx, d));
        
        ctx.restore(); // 结束地面层变换
        
        // 4. 实体层（需要应用伪3D Y轴缩放）
        ctx.save();
        ctx.translate(this.width/2, this.height/2);
        ctx.scale(zoom, zoom);
        ctx.translate(-this.width/2, -this.height/2 * tilt);
        ctx.translate(-this.camera.x + sx, (-this.camera.y + sy) * tilt);
        
        // 绘制带伪3D的实体
        const drawBillboard = (list) => {
            list.forEach(e => {
                const oy = e.y;
                e.y = e.y * tilt;
                
                // 特殊处理：招魂幡
                if (e.img === 'spirit_banner') {
                    ctx.save();
                    ctx.translate(e.x, e.y);
                    ctx.strokeStyle = '#5d4037';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, -80);
                    ctx.stroke();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 4;
                    const t = this.playTime * 2.0 + e.x * 0.1;
                    for(let i=0; i<3; i++) {
                        const offX = (i-1) * 5;
                        ctx.beginPath();
                        ctx.moveTo(0, -80);
                        const sway = Math.sin(t + i) * 10;
                        ctx.quadraticCurveTo(offX + sway, -60, offX + sway*1.5, -40);
                        ctx.stroke();
                    }
                    ctx.restore();
                } else {
                    e.draw(ctx, this.assets);
                }
                
                e.y = oy;
            });
        };
        
        // 按 Y 排序绘制
        this.staticObjects.sort((a,b) => a.y - b.y);
        
        drawBillboard(this.staticObjects);
        drawBillboard(this.orbs);
        drawBillboard(this.chests);
        drawBillboard(this.coins);
        drawBillboard(this.enemies);
        drawBillboard(this.minions);
        
        // 玩家
        if (this.player) {
            const py = this.player.y;
            this.player.y *= tilt;
            this.player.draw(ctx, this.assets);
            this.player.y = py;
        }
        
        // 法宝
        if (this.artifact) {
            const ay = this.artifact.y;
            this.artifact.y *= tilt;
            this.artifact.draw(ctx, this.assets);
            this.artifact.y = ay;
        }
        
        // 发光效果
        ctx.globalCompositeOperation = 'lighter';
        drawBillboard(this.bullets);
        drawBillboard(this.particles);
        ctx.globalCompositeOperation = 'source-over';
        
        // 天气
        this.weather.draw(ctx, this.camera);
        
        drawBillboard(this.texts);
        
        ctx.restore(); // 结束实体层变换
        ctx.restore(); // 结束外层保存
    }
    
    // 绘制 AOE 预警圈
    drawAOEWarnings(ctx) {
        for (const aoe of this.pendingAOEs) {
            const progress = 1 - (aoe.timer / 1.5);
            
            // 预警圈外圈
            ctx.beginPath();
            ctx.arc(aoe.x, aoe.y, aoe.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 82, 82, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // 填充（进度）
            ctx.beginPath();
            ctx.arc(aoe.x, aoe.y, aoe.radius * progress, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fill();
            
            // 中心点
            ctx.beginPath();
            ctx.arc(aoe.x, aoe.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ff5252';
            ctx.fill();
        }
    }
    
    // 绘制能量球
    drawPowerOrbs(ctx) {
        for (const orb of this.powerOrbs) {
            const pulse = Math.sin(orb.pulse) * 5;
            
            // 外圈光晕
            const gradient = ctx.createRadialGradient(
                orb.x, orb.y, 0,
                orb.x, orb.y, orb.radius + pulse + 10
            );
            gradient.addColorStop(0, orb.color);
            gradient.addColorStop(0.5, orb.color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius + pulse + 10, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 核心
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius + pulse, 0, Math.PI * 2);
            ctx.fillStyle = orb.color;
            ctx.fill();
            
            // 中心高光
            ctx.beginPath();
            ctx.arc(orb.x - 5, orb.y - 5, orb.radius / 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        }
    }
    
    // 绘制波次标题
    drawWaveTitle(ctx) {
        if (!this.waveTitle || this.waveTitleTimer <= 0) return;
        
        const alpha = Math.min(1, this.waveTitleTimer);
        const scale = 1 + (1 - Math.min(1, this.waveTitleTimer / 0.3)) * 0.2;
        
        ctx.save();
        ctx.translate(this.width / 2, this.height / 2);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        
        // 主标题
        ctx.font = 'bold 48px "Ma Shan Zheng", serif';
        ctx.fillStyle = '#c0392b';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#8b0000';
        ctx.shadowBlur = 20;
        ctx.fillText(this.waveTitle.title, 0, 0);
        
        // 副标题
        if (this.waveTitle.subtitle) {
            ctx.font = '24px "Ma Shan Zheng", serif';
            ctx.fillStyle = '#ff5252';
            ctx.shadowBlur = 10;
            ctx.fillText(this.waveTitle.subtitle, 0, 40);
        }
        
        ctx.restore();
    }
    
    // 绘制飞行金币
    drawFlyingCoins(ctx) {
        ctx.font = '20px Arial';
        for (const fc of this.flyingCoins) {
            ctx.globalAlpha = 1 - fc.t;
            ctx.fillText('💰', fc.x, fc.y);
        }
        ctx.globalAlpha = 1;
    }
    
    // 绘制背景 - 根据游戏模式选择不同渲染
    drawBackground(ctx) {
        if (this.gameMode === GAME_MODES.ARENA) {
            this.drawArenaBackground(ctx);
        } else {
            // 关卡模式：天空和远景在 drawStageScene 中绘制
            // 这里只需要基础填充，真正的绘制在 draw() 中
        }
    }
    
    // 秘境模式背景（血色风格）
    drawArenaBackground(ctx) {
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
        
        // 地面纹理
        if (this.bgPattern) {
            ctx.fillStyle = this.bgPattern;
            ctx.fillRect(-700, -700, 1400, 1400);
        }
        
        // 竞技场边缘
        this.drawArenaEdge(ctx);
    }
    
    // 绘制远景岛屿（关卡模式）
    drawDistantIsland(ctx, bx, by, ox, oy, w, h, baseColor, topColor, decoType) {
        const cx = bx + ox;
        const cy = by + oy;

        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(cx - w/2, cy);
        ctx.bezierCurveTo(cx - w/4, cy + h, cx + w/4, cy + h, cx + w/2, cy);
        ctx.fill();
        
        ctx.fillStyle = topColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy, w/2, h/6, 0, 0, Math.PI*2);
        ctx.fill();

        // 装饰物
        ctx.fillStyle = baseColor;
        const getRand = (s) => { let t = Math.sin(s)*10000; return t - Math.floor(t); };
        const count = 3 + Math.floor(w / 50);
        for(let i=0; i<count; i++) {
            const seed = bx * 1.1 + by * 2.2 + i * 13.5;
            const r1 = getRand(seed);
            const r2 = getRand(seed + 100);

            const dx = cx - w/3 + r1 * w/1.5;
            const dy = cy + (r2-0.5) * h/10;
            
            if (decoType === 'tree') {
                ctx.fillRect(dx-1, dy-10, 2, 10);
                ctx.beginPath(); ctx.arc(dx, dy-12, 5, 0, Math.PI*2); ctx.fill();
            } else if (decoType === 'cross') {
                ctx.fillRect(dx-1, dy-10, 2, 10);
                ctx.fillRect(dx-4, dy-8, 8, 2);
            } else if (decoType === 'spike') {
                ctx.beginPath(); ctx.moveTo(dx-3, dy); ctx.lineTo(dx, dy-15); ctx.lineTo(dx+3, dy); ctx.fill();
            } else if (decoType === 'crystal') {
                ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx-4, dy-12); ctx.lineTo(dx, dy-20); ctx.lineTo(dx+4, dy-12); ctx.fill();
            } else if (decoType === 'pavilion') {
                ctx.fillRect(dx-4, dy-8, 8, 8);
                ctx.beginPath(); ctx.moveTo(dx-6, dy-8); ctx.lineTo(dx, dy-14); ctx.lineTo(dx+6, dy-8); ctx.fill();
            } else if (decoType === 'pine') {
                ctx.beginPath(); ctx.moveTo(dx-5, dy); ctx.lineTo(dx, dy-15); ctx.lineTo(dx+5, dy); ctx.fill();
            }
        }
    }
    
    // 绘制边缘装饰物（关卡模式）
    drawEdgeDeco(ctx, d) {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.fillStyle = d.color;
        
        if(d.type === 'bush') {
            ctx.beginPath(); ctx.arc(0,0, d.size/2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(5,5, d.size/3, 0, Math.PI*2); ctx.fill();
        } else if (d.type === 'vine') {
            ctx.strokeStyle = d.color; 
            ctx.lineWidth = d.width || 3;
            ctx.lineCap = 'round';
            ctx.beginPath(); 
            ctx.moveTo(0,0); 
            
            const len = d.length || 100;
            const freq = d.twistFreq || 0.03;
            const amp = d.twistAmp || 10;
            const sway = Math.sin(this.playTime * 1.0 + (d.swayOffset||0)) * 15; 
            
            for(let i=0; i<=len; i+=5) {
                const progress = i / len;
                const twist = Math.sin(i * freq) * amp;
                const wind = sway * Math.pow(progress, 2); 
                ctx.lineTo(twist + wind, i);
            }
            ctx.stroke();
            
            // 叶子
            ctx.fillStyle = d.color;
            const leaves = Math.floor(len / 15);
            for(let l=1; l<leaves; l++) {
                const i = l * 15;
                const progress = i / len;
                const twist = Math.sin(i * freq) * amp;
                const wind = sway * Math.pow(progress, 2);
                const side = (l % 2 === 0) ? 1 : -1;
                ctx.beginPath(); 
                ctx.ellipse(twist + wind + side*4, i, 4, 2, Math.PI/4 * side, 0, Math.PI*2);
                ctx.fill();
            }
        } else if (d.type === 'ice') {
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(10, -10); ctx.lineTo(20, 0); ctx.lineTo(10, 10); ctx.fill();
        } else if (d.type === 'sharp') {
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(5, -15); ctx.lineTo(15, 0); ctx.fill();
        } else if (d.type === 'lava_fall') {
            ctx.fillStyle = '#ff5722';
            ctx.beginPath(); ctx.ellipse(0, 0, d.width/2, 5, 0, 0, Math.PI*2); ctx.fill();
            
            const grad = ctx.createLinearGradient(0, 0, 0, d.length);
            grad.addColorStop(0, '#ff9800');
            grad.addColorStop(0.5, '#ff5722');
            grad.addColorStop(1, 'rgba(62, 39, 35, 0)'); 
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(-d.width/2, 0);
            ctx.lineTo(-d.width/3, d.length);
            ctx.lineTo(d.width/3, d.length);
            ctx.lineTo(d.width/2, 0);
            ctx.fill();
            
            // 流动效果
            ctx.strokeStyle = '#ffeb3b'; ctx.globalAlpha = 0.7;
            ctx.beginPath();
            const t = this.playTime * d.speed;
            const dash = 20;
            ctx.setLineDash([dash, 30]);
            ctx.lineDashOffset = -t;
            ctx.lineWidth = d.width/3;
            ctx.moveTo(0, 0); ctx.lineTo(0, d.length);
            ctx.stroke();
            ctx.setLineDash([]); ctx.globalAlpha = 1.0;

            // 熔岩滴落
            const numDrops = 5;
            const dropSpeed = d.speed * 2;
            for(let i=0; i<numDrops; i++) {
                const dropT = (this.playTime * dropSpeed + i * (d.length/numDrops*1.5)) % (d.length * 1.8);
                const dropAlpha = 1.0 - Math.max(0, (dropT - d.length) / (d.length * 0.8)); 
                
                if(dropAlpha > 0) {
                    ctx.fillStyle = `rgba(255, 235, 59, ${dropAlpha})`; 
                    if(dropT > d.length) ctx.fillStyle = `rgba(255, 87, 34, ${dropAlpha})`; 
                    
                    const dy = dropT;
                    const dx = Math.sin(this.playTime * 10 + i) * (d.width/4); 
                    
                    const sz = 3 + Math.random();
                    ctx.beginPath(); 
                    ctx.arc(dx, dy, sz, 0, Math.PI*2); 
                    ctx.fill();
                }
            }
        } else {
            ctx.beginPath(); ctx.ellipse(0,0, d.size, d.size/1.5, 0, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    }
    
    // 绘制关卡场景远景（天空、岛屿等）
    drawStageFarground(ctx) {
        const style = STAGE_STYLES[this.stageIdx] || STAGE_STYLES[0];
        const w = this.width;
        const h = this.height;
        const pX = this.camera.x * 0.1; 
        const pY = this.camera.y * 0.1;
        const sX = this.camera.x * 0.02; 
        const sY = this.camera.y * 0.02;
        
        switch(this.stageIdx) {
            case 0: // 幽暗密林
                ctx.fillStyle = '#f1f8e9'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.arc(w*0.85 - sX, h*0.15 - sY, 30, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                this.drawDistantIsland(ctx, w*0.2, h*0.2, -pX, -pY, 120, 90, '#0b1013', '#1b5e20', 'tree');
                this.drawDistantIsland(ctx, w*0.8, h*0.15, -pX, -pY, 180, 120, '#0b1013', '#1b5e20', 'tree');
                // 雾气
                ctx.save();
                ctx.filter = 'blur(20px)';
                ctx.fillStyle = 'rgba(200, 230, 200, 0.15)';
                const t = this.playTime * 20;
                for(let i=0; i<5; i++) {
                    const fx = (i*300 + t) % (w+400) - 200;
                    const fy = h - 100 + Math.sin(t*0.01 + i)*50 - pY*0.5;
                    ctx.beginPath(); ctx.ellipse(fx, fy, 200, 60, 0, 0, Math.PI*2); ctx.fill();
                }
                ctx.restore();
                break;
                
            case 1: // 埋骨之地
                this.drawDistantIsland(ctx, w*0.15, h*0.25, -pX, -pY, 100, 80, '#212121', '#424242', 'cross');
                this.drawDistantIsland(ctx, w*0.75, h*0.15, -pX, -pY, 200, 150, '#212121', '#424242', 'cross');
                ctx.fillStyle = '#cfd8dc'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 15;
                ctx.beginPath(); ctx.arc(w*0.8 - sX, h*0.15 - sY, 50, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                break;
                
            case 2: // 熔岩炼狱
                this.drawDistantIsland(ctx, w*0.2, h*0.15, -pX, -pY, 150, 100, '#210000', '#3e2723', 'spike');
                this.drawDistantIsland(ctx, w*0.85, h*0.2, -pX, -pY, 120, 140, '#210000', '#3e2723', 'spike');
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath(); ctx.arc(w/2 - this.camera.x*0.05, h - this.camera.y*0.05, w/2, 0, Math.PI*2); ctx.fill();
                break;
                
            case 3: // 极寒冰原
                this.drawDistantIsland(ctx, w*0.25, h*0.1, -pX, -pY, 140, 110, '#0d47a1', '#64b5f6', 'crystal');
                this.drawDistantIsland(ctx, w*0.8, h*0.2, -pX, -pY, 160, 100, '#0d47a1', '#64b5f6', 'crystal');
                break;
                
            case 4: // 塞外古战场
                // 长河落日圆
                ctx.fillStyle = '#b7410e'; ctx.shadowColor = '#8b2e0b'; ctx.shadowBlur = 50;
                ctx.beginPath(); ctx.arc(w*0.7 - sX, h*0.25 - sY, 70, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                
                // 大漠孤烟直
                ctx.save();
                const smokeX = w*0.3 - pX*0.8;
                const smokeBaseY = h*0.4 - pY*0.5;
                const smokeGrad = ctx.createLinearGradient(smokeX, smokeBaseY, smokeX, smokeBaseY - 300);
                smokeGrad.addColorStop(0, 'rgba(40, 30, 20, 0.8)');
                smokeGrad.addColorStop(1, 'rgba(80, 70, 60, 0)');
                ctx.fillStyle = smokeGrad;
                ctx.beginPath();
                ctx.moveTo(smokeX - 2, smokeBaseY);
                ctx.lineTo(smokeX + 2, smokeBaseY);
                ctx.lineTo(smokeX + 10, smokeBaseY - 300);
                ctx.lineTo(smokeX - 10, smokeBaseY - 300);
                ctx.fill();
                ctx.restore();
                
                // 沙丘
                this.drawDistantIsland(ctx, w*0.1, h*0.25, -pX, -pY, 200, 120, '#2d2318', '#3e3626', 'spike');
                this.drawDistantIsland(ctx, w*0.6, h*0.28, -pX, -pY, 250, 100, '#2d2318', '#3e3626', 'cross');
                this.drawDistantIsland(ctx, w*0.9, h*0.22, -pX, -pY, 180, 90, '#2d2318', '#3e3626', 'spike');
                break;
                
            case 5: // 昆仑仙境
                ctx.fillStyle = '#e74c3c'; ctx.shadowColor = '#c0392b'; ctx.shadowBlur = 30;
                ctx.beginPath(); ctx.arc(w/2 - sX, h*0.15 - sY, 60, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                this.drawDistantIsland(ctx, w*0.2, h*0.2, -pX, -pY, 120, 90, '#37474f', '#cfd8dc', 'pavilion');
                this.drawDistantIsland(ctx, w*0.8, h*0.15, -pX, -pY, 280, 180, '#37474f', '#cfd8dc', 'pine');
                break;
        }
    }
    
    /**
     * 生成秘境模式不规则边缘（血色风格）
     */
    generateArenaIrregularEdge() {
        const R = 580;
        const pointCount = 100;
        this.arenaEdgePath = [];
        
        // 秘境模式：锯齿状、血腥风格
        const jitter = 25;
        const waveAmp = 20;
        const waveFreq = 6;
        const seed = Math.random() * 1000;
        
        for (let i = 0; i < pointCount; i++) {
            const angle = (i / pointCount) * Math.PI * 2;
            
            // 多层噪声叠加
            const noise1 = Math.sin(angle * waveFreq + seed) * waveAmp;
            const noise2 = Math.sin(angle * waveFreq * 2.5 + seed * 1.3) * (waveAmp * 0.6);
            const noise3 = (Math.random() - 0.5) * jitter;
            
            const r = R + noise1 + noise2 + noise3;
            
            this.arenaEdgePath.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r,
                angle: angle,
                radius: r
            });
        }
    }
    
    /**
     * 创建秘境边缘路径
     */
    createArenaEdgePath(ctx, scale = 1.0) {
        if (!this.arenaEdgePath || this.arenaEdgePath.length === 0) {
            ctx.arc(0, 0, 580 * scale, 0, Math.PI * 2);
            return;
        }
        
        const path = this.arenaEdgePath;
        ctx.moveTo(path[0].x * scale, path[0].y * scale);
        
        for (let i = 0; i < path.length; i++) {
            const p0 = path[i];
            const p1 = path[(i + 1) % path.length];
            
            const cx = ((p0.x + p1.x) / 2) * scale;
            const cy = ((p0.y + p1.y) / 2) * scale;
            
            ctx.quadraticCurveTo(p0.x * scale, p0.y * scale, cx, cy);
        }
        
        ctx.closePath();
    }
    
    // 绘制竞技场边缘
    drawArenaEdge(ctx) {
        // 边缘迷雾（使用不规则路径上的点）
        ctx.save();
        const path = this.arenaEdgePath || [];
        const mistCount = Math.min(60, path.length);
        
        for (let i = 0; i < mistCount; i++) {
            const idx = Math.floor((i / mistCount) * path.length);
            const point = path[idx] || { x: Math.cos((i / mistCount) * Math.PI * 2) * 580, y: Math.sin((i / mistCount) * Math.PI * 2) * 580 };
            
            const wobble = Math.sin(this.playTime * 2 + i) * 20;
            const x = point.x + Math.cos(point.angle || 0) * wobble;
            const y = point.y + Math.sin(point.angle || 0) * wobble;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
            gradient.addColorStop(0, 'rgba(139, 0, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 80, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        // 边界线（使用不规则路径）
        ctx.strokeStyle = '#5c0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 10]);
        ctx.beginPath();
        this.createArenaEdgePath(ctx);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // 绘制子弹
    drawBullets(ctx) {
        this.bullets.forEach(b => {
            ctx.save();
            ctx.translate(b.x, b.y);
            
            // 剑气效果
            const angle = Math.atan2(b.vy || 0, b.vx || 1);
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
            ctx.fillStyle = b.color || '#ff5252';
            ctx.beginPath();
            ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    // 顿帧效果
    hitStop(duration) {
        if (this.hitStopCooldown <= 0) {
            this.freezeTimer = duration;
            this.hitStopCooldown = 0.1;
        }
    }
    
    // 暂停
    pause() {
        this.state = 'PAUSED';
    }
    
    // 恢复
    resume() {
        this.state = 'PLAY';
    }
    
    // 绘制血雾
    drawBloodMist(ctx) {
        const gradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(139, 0, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(139, 0, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(139, 0, 0, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // 开始下一波
    startNextWave() {
        if (this.state !== 'PLAY') return;
        
        this.currentWave++;
        
        if (this.currentWave > ARENA_CONFIG.totalWaves) {
            this.gameOver(true);
            return;
        }
        
        const waveConfig = ARENA_CONFIG.waves[this.currentWave - 1];
        
        // BOSS 波特殊处理
        if (waveConfig.isBoss) {
            this.showBossIntro(waveConfig);
        } else {
            this.spawnWave(waveConfig);
        }
        
        this.waveCleared = false;
        this.updateUI();
    }
    
    // 显示 BOSS 登场
    showBossIntro(waveConfig) {
        this.showingBossIntro = true;
        this.bossCountdown = 3;
        
        // 倒计时
        const countdown = () => {
            if (this.bossCountdown > 0) {
                if (this.ui) {
                    this.ui.showCountdown(this.bossCountdown, 'BOSS 来袭', () => {
                        this.bossCountdown--;
                        if (this.bossCountdown > 0) {
                            setTimeout(countdown, 1000);
                        } else {
                            this.showingBossIntro = false;
                            this.spawnWave(waveConfig);
                        }
                    });
                } else {
                    this.bossCountdown--;
                    setTimeout(countdown, 1000);
                }
            }
        };
        
        countdown();
    }
    
    // 生成敌人
    spawnWave(waveConfig) {
        const count = waveConfig.count;
        const mobs = waveConfig.mobs;
        const levelMult = waveConfig.levelMult;
        const playerLevel = this.player ? this.player.level : 1;
        
        for (let i = 0; i < count; i++) {
            const mobType = mobs[Math.floor(Math.random() * mobs.length)];
            const angle = (Math.PI * 2 / count) * i;
            const distance = waveConfig.isBoss ? 200 : 300 + Math.random() * 200;
            
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            const enemy = new ArenaEnemy(mobType, x, y, levelMult, playerLevel);
            this.enemies.push(enemy);
            
            if (enemy.isBoss) {
                this.currentBoss = enemy;
                if (this.ui) {
                    this.ui.showBossHUD(enemy.name, enemy.hp, enemy.maxHp);
                }
            }
        }
        
        this.updateUI();
    }
    
    // 敌人被击杀
    onEnemyKilled(enemy) {
        enemy.dead = true;
        this.totalKills++;
        
        // 掉落金币
        const goldDrop = enemy.goldDrop || [1, 2];
        const goldCount = goldDrop[0] + Math.floor(Math.random() * (goldDrop[1] - goldDrop[0] + 1));
        for (let i = 0; i < goldCount; i++) {
            const coin = this.pool.get('coin', Coin,
                enemy.x + (Math.random() - 0.5) * 30,
                enemy.y + (Math.random() - 0.5) * 30,
                enemy.isBoss ? 10 : 1
            );
            this.coins.push(coin);
            
            // 金币飞行效果
            this.flyGoldToCounter(enemy.x, enemy.y);
        }
        
        // 掉落道具卡（概率）
        if (Math.random() < 0.15 || enemy.isBoss) {
            const cardCount = enemy.isBoss ? (ARENA_BOSSES[enemy.type]?.cardDrop || 1) : 1;
            for (let i = 0; i < cardCount; i++) {
                this.dropItemCard(enemy.x, enemy.y);
            }
        }
        
        // 死亡粒子
        for (let i = 0; i < 10; i++) {
            this.particles.push(this.pool.get('particle', Particle, enemy.x, enemy.y, '#8b0000', 0.5, 6));
        }
        
        // BOSS 击杀
        if (enemy.isBoss) {
            this.shake = 2;
            this.currentBoss = null;
            if (this.ui) {
                this.ui.hideBossHUD();
            }
            
            this.showWaveTitle('BOSS 击败！', `${enemy.name || ''}已被消灭`);
            
            // 额外奖励
            for (let i = 0; i < 20; i++) {
                const coin = this.pool.get('coin', Coin,
                    enemy.x + (Math.random() - 0.5) * 100,
                    enemy.y + (Math.random() - 0.5) * 100,
                    5
                );
                this.coins.push(coin);
            }
        }
        
        // 经验
        if (this.player) {
            this.player.gainExp(enemy.isBoss ? 50 : 10);
        }
        
        this.updateUI();
    }
    
    // 掉落道具卡
    dropItemCard(x, y) {
        if (!ITEM_CARDS || ITEM_CARDS.length === 0) return;
        
        // 随机选择一张卡
        const totalWeight = ITEM_CARDS.reduce((sum, c) => sum + (c.dropRate || 1), 0);
        let rand = Math.random() * totalWeight;
        let selectedCard = ITEM_CARDS[0];
        
        for (const card of ITEM_CARDS) {
            rand -= (card.dropRate || 1);
            if (rand <= 0) {
                selectedCard = card;
                break;
            }
        }
        
        // 添加到卡槽
        this.itemCards.addCard(selectedCard);
        
        // 显示获得提示
        this.texts.push(new FloatText(x, y - 50, `获得 ${selectedCard.icon || '🃏'} ${selectedCard.name}`, '#f1c40f'));
    }
    
    // 检查波次完成
    checkWaveComplete() {
        if (this.waveCleared) return;
        
        const aliveEnemies = this.enemies.filter(e => !e.dead);
        
        // 更新 BOSS 血量
        if (this.currentBoss && !this.currentBoss.dead && this.ui) {
            this.ui.updateBossHP(this.currentBoss.hp);
        }
        
        if (aliveEnemies.length === 0) {
            this.waveCleared = true;
            
            // 显示技能选择
            if (this.currentWave < ARENA_CONFIG.totalWaves) {
                this.showSkillChoice();
            } else {
                // 最后一波
                setTimeout(() => this.gameOver(true), 2000);
            }
        }
        
        this.updateUI();
    }
    
    // 显示技能选择
    showSkillChoice() {
        this.state = 'SKILL';
        
        // 随机3个技能
        const shuffled = [...SKILLS].sort(() => Math.random() - 0.5);
        const choices = shuffled.slice(0, 3);
        
        if (this.ui) {
            this.ui.showSkillMenu(choices, (skill) => {
                this.applySkill(skill);
                this.state = 'PLAY';
                setTimeout(() => this.startNextWave(), 1000);
            });
        } else {
            // 无 UI 时自动选择第一个
            this.applySkill(choices[0]);
            this.state = 'PLAY';
            setTimeout(() => this.startNextWave(), 1000);
        }
    }
    
    // 应用技能
    applySkill(skill) {
        if (!this.player || !skill) return;
        
        // 根据技能效果应用
        if (skill.effect) {
            if (skill.effect.dmgMult) {
                this.player.dmg *= skill.effect.dmgMult;
            }
            if (skill.effect.hpMult) {
                this.player.maxHp *= skill.effect.hpMult;
                this.player.hp = this.player.maxHp;
            }
            if (skill.effect.speedMult) {
                this.player.speed *= skill.effect.speedMult;
            }
            if (skill.effect.cdMult) {
                this.player.attackCd *= skill.effect.cdMult;
            }
        }
        
        this.texts.push(new FloatText(this.player.x, this.player.y - 50, `✨ ${skill.name}`, '#9b59b6'));
        this.updateUI();
    }
    
    // 游戏结束
    gameOver(victory) {
        this.state = victory ? 'VICTORY' : 'DEFEAT';
        
        const stats = {
            kills: this.totalKills,
            gold: this.totalGold,
            wave: this.currentWave,
            time: this.formatTime(this.playTime),
            stars: this.calculateStars()
        };
        
        // 保存金币
        const savedGold = Platform.getStorage('playerGold') || 0;
        const earnedGold = victory ? this.totalGold : Math.floor(this.totalGold * 0.5);
        Platform.setStorage('playerGold', savedGold + earnedGold);
        
        if (this.ui) {
            if (victory) {
                this.ui.showVictoryMenu(stats);
            } else {
                this.ui.showDefeatMenu(stats);
            }
        }
    }
    
    // 计算评价星级
    calculateStars() {
        let stars = 0;
        if (this.currentWave >= 5) stars++;
        if (this.currentWave >= 10) stars++;
        if (this.playTime < 300) stars++; // 5分钟内
        return '⭐'.repeat(stars) || '☆';
    }
    
    // 格式化时间
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    // 更新 UI
    updateUI() {
        if (!this.ui) return;
        
        const aliveEnemies = this.enemies.filter(e => !e.dead);
        
        // 计算境界名称
        const ranks = ['练气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期'];
        const playerLvl = this.player ? this.player.lvl : 1;
        const rankIdx = Math.min(Math.floor((playerLvl - 1) / 3), ranks.length - 1);
        const rankName = ranks[rankIdx];
        const rankLevel = ((playerLvl - 1) % 3) + 1;
        
        // 基础数据
        const hudData = {
            hp: this.player ? this.player.hp : 0,
            maxHp: this.player ? this.player.maxHp : 100,
            exp: this.player ? this.player.exp : 0,
            maxExp: this.player ? this.player.maxExp : 100,
            enemyCount: aliveEnemies.length,
            gold: this.totalGold,
            rankName: rankName,
            rankLevel: rankLevel
        };
        
        // 模式专属数据
        if (this.gameMode === GAME_MODES.ARENA) {
            hudData.wave = this.currentWave;
            hudData.maxWave = ARENA_CONFIG.totalWaves;
        } else {
            hudData.stageName = STAGES[this.stageIdx]?.name || '未知之地';
            hudData.playTime = this.playTime;
        }
        
        this.ui.updateHUD(hudData);
    }
}

export default UnifiedArenaEngine;

