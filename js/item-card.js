import { ITEM_CARDS } from './data.js';
import { Particle, FloatText, Entity } from './entities.js';

// ========== 辅助实体类 ==========

// 荆棘陷阱实体
class ThornTrap extends Entity {
    constructor(x, y, duration, damage) {
        super(x, y);
        this.duration = duration;
        this.damage = damage;
        this.tickTimer = 0;
        this.tickInterval = 0.5; // 每0.5秒伤害一次
        this.radius = 80;
    }
    
    update(dt) {
        this.duration -= dt;
        if (this.duration <= 0) {
            this.dead = true;
            return;
        }
        
        this.tickTimer -= dt;
        if (this.tickTimer <= 0) {
            this.tickTimer = this.tickInterval;
            // 对范围内敌人造成伤害
            for (const e of window.Game.enemies) {
                if (e.dead) continue;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < this.radius) {
                    e.hp -= this.damage;
                    // 荆棘粒子
                    window.Game.particles.push(new Particle(e.x, e.y, '#2ecc71', 0.3, 4));
                    window.Game.texts.push(new FloatText(e.x, e.y - 20, Math.floor(this.damage), '#2ecc71'));
                    if (e.hp <= 0 && !e.dead) {
                        if (window.Game.onEnemyKilled) {
                            window.Game.onEnemyKilled(e);
                        } else {
                            e.dead = true;
                        }
                    }
                }
            }
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 荆棘圈
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.3 + Math.sin(window.Game.playTime * 5) * 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 荆棘图案
        ctx.fillStyle = '#2ecc71';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + window.Game.playTime;
            const r = this.radius * 0.6;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 10, y - 15);
            ctx.lineTo(x + 5, y);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// 定时炸弹实体
class TimeBomb extends Entity {
    constructor(x, y, delay, damage) {
        super(x, y);
        this.delay = delay;
        this.damage = damage;
        this.radius = 120;
    }
    
    update(dt) {
        this.delay -= dt;
        
        if (this.delay <= 0) {
            // 爆炸！
            this.explode();
            this.dead = true;
        }
    }
    
    explode() {
        // 对范围内敌人造成伤害
        for (const e of window.Game.enemies) {
            if (e.dead) continue;
            const dist = Math.hypot(e.x - this.x, e.y - this.y);
            if (dist < this.radius) {
                e.hp -= this.damage;
                window.Game.texts.push(new FloatText(e.x, e.y - 20, Math.floor(this.damage), '#ff5722'));
                if (e.hp <= 0 && !e.dead) {
                    if (window.Game.onEnemyKilled) {
                        window.Game.onEnemyKilled(e);
                    } else {
                        e.dead = true;
                    }
                }
            }
        }
        
        // 爆炸粒子
        for (let i = 0; i < 30; i++) {
            const p = new Particle(this.x, this.y, '#ff5722', 0.6, 8);
            p.vx = (Math.random() - 0.5) * 400;
            p.vy = (Math.random() - 0.5) * 400;
            window.Game.particles.push(p);
        }
        
        // 震屏
        window.Game.screenShake(2);
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 闪烁效果（越接近爆炸越快）
        const flash = Math.sin(window.Game.playTime * (10 / Math.max(0.1, this.delay))) > 0;
        
        // 炸弹主体
        ctx.fillStyle = flash ? '#ff5722' : '#c0392b';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // 倒计时数字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.ceil(this.delay), 0, 0);
        
        // 危险范围指示
        ctx.strokeStyle = 'rgba(255, 87, 34, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
    }
}

// 分身诱饵实体
class Decoy extends Entity {
    constructor(x, y, duration, playerSvg) {
        super(x, y);
        this.duration = duration;
        this.playerSvg = playerSvg;
        this.tauntRadius = 200;
    }
    
    update(dt) {
        this.duration -= dt;
        if (this.duration <= 0) {
            this.dead = true;
            // 消失粒子
            for (let i = 0; i < 10; i++) {
                window.Game.particles.push(new Particle(this.x, this.y, '#9b59b6', 0.5, 5));
            }
            return;
        }
        
        // 吸引范围内敌人
        for (const e of window.Game.enemies) {
            if (e.dead) continue;
            const dist = Math.hypot(e.x - this.x, e.y - this.y);
            if (dist < this.tauntRadius && dist > 30) {
                // 敌人被吸引向分身
                const angle = Math.atan2(this.y - e.y, this.x - e.x);
                e.x += Math.cos(angle) * e.speed * 0.5 * dt;
                e.y += Math.sin(angle) * e.speed * 0.5 * dt;
            }
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 半透明闪烁效果
        ctx.globalAlpha = 0.5 + Math.sin(window.Game.playTime * 8) * 0.3;
        
        // 紫色光环
        ctx.strokeStyle = '#9b59b6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.stroke();
        
        // 绘制玩家形象（如果有）
        if (window.Assets && window.Assets[this.playerSvg]) {
            ctx.drawImage(window.Assets[this.playerSvg], -32, -32, 64, 64);
        } else {
            // 后备绘制
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 嘲讽范围指示
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(0, 0, this.tauntRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// ========== 道具卡管理器 ==========

export class ItemCardManager {
    constructor(engine) {
        this.engine = engine;
        this.slots = [null, null, null, null, null, null]; // 6个槽位
        this.maxSlots = 6;
        
        // 特殊实体列表（陷阱、炸弹、分身等）
        this.specialEntities = [];
    }
    
    reset() {
        this.slots = [null, null, null, null, null, null];
        this.specialEntities = [];
        this.updateUI();
    }
    
    update(dt) {
        // 更新特殊实体
        this.specialEntities.forEach(e => e.update(dt));
        this.specialEntities = this.specialEntities.filter(e => !e.dead);
    }
    
    draw(ctx) {
        // 绘制特殊实体
        this.specialEntities.forEach(e => e.draw(ctx));
    }
    
    addCard(cardData) {
        // 检查是否已有相同卡片
        for (let i = 0; i < this.maxSlots; i++) {
            if (this.slots[i] && this.slots[i].id === cardData.id) {
                // 叠加（最多5张）
                if (this.slots[i].count < 5) {
                    this.slots[i].count++;
                    this.updateUI();
                    return true;
                }
            }
        }
        
        // 找空槽位
        for (let i = 0; i < this.maxSlots; i++) {
            if (!this.slots[i]) {
                this.slots[i] = {
                    ...cardData,
                    count: 1
                };
                this.updateUI();
                return true;
            }
        }
        
        // 槽位满了，显示提示
        this.engine.texts.push(new FloatText(
            this.engine.player.x,
            this.engine.player.y - 50,
            '道具槽已满！',
            '#ff5252'
        ));
        return false;
    }
    
    useCard(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.maxSlots) return;
        
        const card = this.slots[slotIndex];
        if (!card) return;
        
        // 执行效果
        this.executeCardEffect(card);
        
        // 消耗
        card.count--;
        if (card.count <= 0) {
            this.slots[slotIndex] = null;
            // 自动左移：将右边的道具往左补位
            this.compactSlots();
        }
        
        this.updateUI();
    }
    
    // 自动左移道具槽
    compactSlots() {
        // 将所有非空槽位紧凑排列到左边
        const items = this.slots.filter(s => s !== null);
        this.slots = items.concat(Array(this.maxSlots - items.length).fill(null));
    }
    
    executeCardEffect(card) {
        const engine = this.engine;
        const player = engine.player;
        
        // 显示使用提示
        engine.texts.push(new FloatText(
            player.x,
            player.y - 60,
            `${card.icon} ${card.name}`,
            '#f1c40f'
        ));
        
        switch (card.effect) {
            // ========== 攻击类 ==========
            case 'thunder_strike':
                this.effectThunderStrike(card.value);
                break;
                
            case 'screen_damage':
                this.effectScreenDamage(card.value);
                break;
            
            // ========== 控制类 ==========
            case 'freeze_all':
                this.effectFreezeAll(card.value);
                break;
                
            case 'stun_random':
                this.effectStunRandom(card.value);
                break;
                
            case 'chaos':
                this.effectChaos(card.value);
                break;
            
            // ========== 陷阱类 ==========
            case 'thorn_trap':
                this.effectThornTrap(card.value);
                break;
                
            case 'time_bomb':
                this.effectTimeBomb(card.value);
                break;
            
            // ========== 位移类 ==========
            case 'teleport':
                this.effectTeleport();
                break;
                
            case 'decoy':
                this.effectDecoy(card.value);
                break;
            
            // ========== 增益类 ==========
            case 'speed_boost':
                this.effectSpeedBoost(card.value);
                break;
                
            case 'invincible':
                this.effectInvincible(card.value);
                break;
                
            case 'damage_boost':
                this.effectDamageBoost(card.value);
                break;
            
            // ========== 回复类 ==========
            case 'heal':
                this.effectHeal(card.value);
                break;
                
            case 'exp_boost':
                this.effectExpBoost(card.value);
                break;
            
            // ========== 特殊类 ==========
            case 'absorb_enemy':
                this.effectAbsorbEnemy(card.value);
                break;
                
            default:
                console.warn('未知道具效果:', card.effect);
        }
        
        // 震屏
        engine.shake = Math.max(engine.shake, 0.5);
    }
    
    // ========== 攻击类效果 ==========
    
    // 雷劫珠 - 天雷连轰3次
    effectThunderStrike(damage) {
        const engine = this.engine;
        const player = engine.player;
        
        // 连续3次雷击
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                // 随机选择目标区域
                const targetX = player.x + (Math.random() - 0.5) * 300;
                const targetY = player.y + (Math.random() - 0.5) * 300;
                
                // 对范围内敌人造成伤害
                engine.enemies.forEach(e => {
                    if (e.dead) return;
                    const dist = Math.hypot(e.x - targetX, e.y - targetY);
                    if (dist < 100) {
                        e.hp -= damage;
                        engine.texts.push(new FloatText(e.x, e.y - 30, Math.floor(damage), '#ffeb3b'));
                        if (e.hp <= 0 && !e.dead) {
                            if (engine.onEnemyKilled) {
                                engine.onEnemyKilled(e);
                            } else {
                                e.dead = true;
                            }
                        }
                    }
                });
                
                // 雷电粒子
                for (let j = 0; j < 20; j++) {
                    const p = new Particle(targetX, targetY, '#ffeb3b', 0.4, 6);
                    p.vx = (Math.random() - 0.5) * 300;
                    p.vy = (Math.random() - 0.5) * 300;
                    engine.particles.push(p);
                }
                
                // 震屏
                engine.screenShake(1);
                
            }, i * 300); // 每0.3秒一次
        }
        
        this.createFullscreenEffect('#ffeb3b', 0.3);
    }
    
    // 翻天印 - 全屏伤害
    effectScreenDamage(damage) {
        const engine = this.engine;
        
        // 对所有敌人造成伤害
        engine.enemies.forEach(e => {
            if (e.dead) return;
            e.hp -= damage;
            
            // 火焰粒子
            for (let i = 0; i < 10; i++) {
                engine.particles.push(new Particle(
                    e.x + (Math.random() - 0.5) * 40,
                    e.y + (Math.random() - 0.5) * 40,
                    '#ff5722',
                    0.5,
                    6
                ));
            }
            
            // 伤害数字
            engine.texts.push(new FloatText(e.x, e.y - 30, Math.floor(damage), '#ff5722'));
            
            if (e.hp <= 0 && !e.dead) {
                if (engine.onEnemyKilled) {
                    engine.onEnemyKilled(e);
                } else {
                    e.dead = true;
                }
            }
        });
        
        // 全屏火焰效果
        this.createFullscreenEffect('#ff5722', 0.3);
        engine.screenShake(2);
    }
    
    // ========== 控制类效果 ==========
    
    // 冰魄珠 - 全场冻结
    effectFreezeAll(duration) {
        const engine = this.engine;
        
        // 冻结所有敌人
        engine.enemies.forEach(e => {
            if (e.dead) return;
            e.frozen = true;
            e.frozenTime = duration;
            e.originalSpeed = e.speed;
            e.speed = 0;
            
            // 冰晶粒子
            for (let i = 0; i < 8; i++) {
                engine.particles.push(new Particle(
                    e.x + (Math.random() - 0.5) * 30,
                    e.y + (Math.random() - 0.5) * 30,
                    '#81d4fa',
                    0.5,
                    4
                ));
            }
        });
        
        // 定时解冻
        setTimeout(() => {
            engine.enemies.forEach(e => {
                if (e.frozen) {
                    e.frozen = false;
                    e.speed = e.originalSpeed || 50;
                }
            });
        }, duration * 1000);
        
        this.createFullscreenEffect('#81d4fa', 0.3);
    }
    
    // 定身符 - 随机定住5个敌人
    effectStunRandom(count) {
        const engine = this.engine;
        const duration = 10; // 10秒
        
        // 随机选择敌人
        const targets = engine.enemies
            .filter(e => !e.dead && !e.frozen)
            .sort(() => Math.random() - 0.5)
            .slice(0, count);
        
        targets.forEach(e => {
            e.frozen = true;
            e.frozenTime = duration;
            e.originalSpeed = e.speed;
            e.speed = 0;
            
            // 定身符文
            engine.texts.push(new FloatText(e.x, e.y - 40, '定!', '#f1c40f', true));
            
            // 金色粒子
            for (let i = 0; i < 10; i++) {
                engine.particles.push(new Particle(
                    e.x + (Math.random() - 0.5) * 30,
                    e.y + (Math.random() - 0.5) * 30,
                    '#f1c40f',
                    0.6,
                    5
                ));
            }
        });
        
        // 定时解除
        setTimeout(() => {
            targets.forEach(e => {
                if (e.frozen) {
                    e.frozen = false;
                    e.speed = e.originalSpeed || 50;
                }
            });
        }, duration * 1000);
    }
    
    // 混沌铃 - 敌人互攻
    effectChaos(duration) {
        const engine = this.engine;
        
        // 标记所有敌人进入混乱状态
        engine.enemies.forEach(e => {
            if (e.dead) return;
            e.chaosTime = duration;
            
            // 混乱粒子
            for (let i = 0; i < 5; i++) {
                engine.particles.push(new Particle(
                    e.x + (Math.random() - 0.5) * 20,
                    e.y - 30,
                    '#9b59b6',
                    0.5,
                    3
                ));
            }
        });
        
        engine.texts.push(new FloatText(
            engine.player.x,
            engine.player.y - 80,
            '🔔 混乱！',
            '#9b59b6',
            true
        ));
        
        // 混乱期间敌人互相伤害
        const chaosInterval = setInterval(() => {
            let hasChaos = false;
            engine.enemies.forEach(e => {
                if (e.dead || !e.chaosTime || e.chaosTime <= 0) return;
                hasChaos = true;
                
                // 找最近的其他敌人
                let nearest = null;
                let minDist = 100;
                engine.enemies.forEach(other => {
                    if (other === e || other.dead) return;
                    const dist = Math.hypot(e.x - other.x, e.y - other.y);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = other;
                    }
                });
                
                // 攻击最近的敌人
                if (nearest) {
                    nearest.hp -= e.dmg * 0.5;
                    engine.particles.push(new Particle(nearest.x, nearest.y, '#9b59b6', 0.3, 3));
                    
                    if (nearest.hp <= 0 && !nearest.dead) {
                        if (engine.onEnemyKilled) {
                            engine.onEnemyKilled(nearest);
                        } else {
                            nearest.dead = true;
                        }
                    }
                }
            });
            
            if (!hasChaos) {
                clearInterval(chaosInterval);
            }
        }, 500);
        
        // 定时清除混乱
        setTimeout(() => {
            clearInterval(chaosInterval);
            engine.enemies.forEach(e => {
                e.chaosTime = 0;
            });
        }, duration * 1000);
        
        this.createFullscreenEffect('#9b59b6', 0.2);
    }
    
    // ========== 陷阱类效果 ==========
    
    // 荆棘种 - 地面荆棘
    effectThornTrap(duration) {
        const engine = this.engine;
        const player = engine.player;
        
        // 在玩家位置创建荆棘陷阱
        const trap = new ThornTrap(player.x, player.y, duration, player.stats.dmg * 0.5);
        this.specialEntities.push(trap);
        
        // 生成粒子
        for (let i = 0; i < 15; i++) {
            engine.particles.push(new Particle(
                player.x + (Math.random() - 0.5) * 100,
                player.y + (Math.random() - 0.5) * 100,
                '#2ecc71',
                0.5,
                4
            ));
        }
    }
    
    // 爆炎石 - 定时炸弹
    effectTimeBomb(damage) {
        const engine = this.engine;
        const player = engine.player;
        
        // 在玩家位置放置炸弹
        const bomb = new TimeBomb(player.x, player.y, 3, damage);
        this.specialEntities.push(bomb);
        
        engine.texts.push(new FloatText(
            player.x,
            player.y - 40,
            '💣 3秒后爆炸!',
            '#ff5722'
        ));
    }
    
    // ========== 位移类效果 ==========
    
    // 缩地符 - 瞬移逃命
    effectTeleport() {
        const engine = this.engine;
        const player = engine.player;
        
        // 找一个安全位置
        let bestX = player.x;
        let bestY = player.y;
        let bestSafety = 0;
        
        // 尝试多个随机位置，选最安全的
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 200 + Math.random() * 200;
            const testX = player.x + Math.cos(angle) * dist;
            const testY = player.y + Math.sin(angle) * dist;
            
            // 检查是否在场地内
            if (Math.hypot(testX, testY) > 500) continue;
            
            // 计算安全度（离最近敌人的距离）
            let minEnemyDist = Infinity;
            engine.enemies.forEach(e => {
                if (e.dead) return;
                const d = Math.hypot(e.x - testX, e.y - testY);
                minEnemyDist = Math.min(minEnemyDist, d);
            });
            
            if (minEnemyDist > bestSafety) {
                bestSafety = minEnemyDist;
                bestX = testX;
                bestY = testY;
            }
        }
        
        // 原位置粒子
        for (let i = 0; i < 15; i++) {
            engine.particles.push(new Particle(
                player.x + (Math.random() - 0.5) * 40,
                player.y + (Math.random() - 0.5) * 40,
                '#3498db',
                0.5,
                5
            ));
        }
        
        // 瞬移
        player.x = bestX;
        player.y = bestY;
        
        // 新位置粒子
        for (let i = 0; i < 15; i++) {
            engine.particles.push(new Particle(
                player.x + (Math.random() - 0.5) * 40,
                player.y + (Math.random() - 0.5) * 40,
                '#3498db',
                0.5,
                5
            ));
        }
        
        // 短暂无敌
        player.invulnTimer = 0.5;
    }
    
    // 分身符 - 分身吸引仇恨
    effectDecoy(duration) {
        const engine = this.engine;
        const player = engine.player;
        
        // 在玩家旁边创建分身
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        const decoy = new Decoy(
            player.x + offsetX,
            player.y + offsetY,
            duration,
            player.role.svg
        );
        this.specialEntities.push(decoy);
        
        // 生成粒子
        for (let i = 0; i < 10; i++) {
            engine.particles.push(new Particle(
                decoy.x + (Math.random() - 0.5) * 30,
                decoy.y + (Math.random() - 0.5) * 30,
                '#9b59b6',
                0.5,
                4
            ));
        }
    }
    
    // ========== 增益类效果 ==========
    
    // 疾风符 - 移速翻倍
    effectSpeedBoost(duration) {
        const engine = this.engine;
        const player = engine.player;
        
        const originalSpeed = player.speed;
        player.speed *= 2;
        
        engine.texts.push(new FloatText(
            player.x,
            player.y - 80,
            `💨 移速x2 ${duration}秒`,
            '#3498db'
        ));
        
        // 速度粒子
        const particleInterval = setInterval(() => {
            if (engine.player) {
                engine.particles.push(new Particle(
                    player.x + (Math.random() - 0.5) * 20,
                    player.y + 20,
                    '#3498db',
                    0.3,
                    3
                ));
            }
        }, 100);
        
        setTimeout(() => {
            player.speed = originalSpeed;
            clearInterval(particleInterval);
            engine.texts.push(new FloatText(
                player.x,
                player.y - 80,
                '速度恢复',
                '#aaa'
            ));
        }, duration * 1000);
    }
    
    // 金身符 - 无敌
    effectInvincible(duration) {
        const engine = this.engine;
        const player = engine.player;
        
        player.invincible = true;
        
        // 金光粒子
        const particleInterval = setInterval(() => {
            if (engine.player) {
                for (let i = 0; i < 3; i++) {
                    engine.particles.push(new Particle(
                        player.x + (Math.random() - 0.5) * 40,
                        player.y + (Math.random() - 0.5) * 40,
                        '#f1c40f',
                        0.3,
                        4
                    ));
                }
            }
        }, 100);
        
        engine.texts.push(new FloatText(
            player.x,
            player.y - 80,
            `🛡️ 无敌 ${duration}秒`,
            '#f1c40f'
        ));
        
        setTimeout(() => {
            player.invincible = false;
            clearInterval(particleInterval);
            engine.texts.push(new FloatText(
                player.x,
                player.y - 80,
                '无敌结束',
                '#aaa'
            ));
        }, duration * 1000);
    }
    
    // 狂暴丹 - 攻击翻倍
    effectDamageBoost(duration) {
        const engine = this.engine;
        const player = engine.player;
        
        const originalDmg = player.stats.dmg;
        player.stats.dmg *= 2;
        
        engine.texts.push(new FloatText(
            player.x,
            player.y - 80,
            `💊 攻击x2 ${duration}秒`,
            '#e74c3c'
        ));
        
        // 红色光环
        const particleInterval = setInterval(() => {
            if (engine.player) {
                const angle = Math.random() * Math.PI * 2;
                engine.particles.push(new Particle(
                    player.x + Math.cos(angle) * 30,
                    player.y + Math.sin(angle) * 30,
                    '#e74c3c',
                    0.3,
                    3
                ));
            }
        }, 150);
        
        setTimeout(() => {
            player.stats.dmg = originalDmg;
            clearInterval(particleInterval);
            engine.texts.push(new FloatText(
                player.x,
                player.y - 80,
                '狂暴结束',
                '#aaa'
            ));
        }, duration * 1000);
    }
    
    // ========== 回复类效果 ==========
    
    // 回气丹 - 回复血量
    effectHeal(percent) {
        const engine = this.engine;
        const player = engine.player;
        
        const healAmount = player.maxHp * percent;
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
        
        // 治疗粒子
        for (let i = 0; i < 20; i++) {
            engine.particles.push(new Particle(
                player.x + (Math.random() - 0.5) * 50,
                player.y + (Math.random() - 0.5) * 50,
                '#2ecc71',
                0.5,
                5
            ));
        }
        
        engine.texts.push(new FloatText(
            player.x,
            player.y - 50,
            `+${Math.floor(healAmount)} HP`,
            '#2ecc71'
        ));
    }
    
    // 聚灵阵 - 经验翻倍
    effectExpBoost(duration) {
        const engine = this.engine;
        const player = engine.player;
        
        // 标记经验翻倍
        player.expBoost = 2;
        
        engine.texts.push(new FloatText(
            player.x,
            player.y - 80,
            `⭐ 经验x2 ${duration}秒`,
            '#9b59b6'
        ));
        
        // 星星粒子
        const particleInterval = setInterval(() => {
            if (engine.player) {
                engine.particles.push(new Particle(
                    player.x + (Math.random() - 0.5) * 60,
                    player.y - 30 - Math.random() * 30,
                    '#9b59b6',
                    0.4,
                    4
                ));
            }
        }, 200);
        
        setTimeout(() => {
            player.expBoost = 1;
            clearInterval(particleInterval);
            engine.texts.push(new FloatText(
                player.x,
                player.y - 80,
                '经验加成结束',
                '#aaa'
            ));
        }, duration * 1000);
    }
    
    // ========== 特殊类效果 ==========
    
    // 乾坤袋 - 吸走怪物
    effectAbsorbEnemy(count) {
        const engine = this.engine;
        const player = engine.player;
        
        // 选择最近的非BOSS敌人
        const targets = engine.enemies
            .filter(e => !e.dead && !e.isBoss)
            .sort((a, b) => {
                const distA = Math.hypot(a.x - player.x, a.y - player.y);
                const distB = Math.hypot(b.x - player.x, b.y - player.y);
                return distA - distB;
            })
            .slice(0, count);
        
        targets.forEach((e, i) => {
            // 延迟吸收动画
            setTimeout(() => {
                if (e.dead) return;
                
                // 吸收动画
                const startX = e.x;
                const startY = e.y;
                let progress = 0;
                
                const animInterval = setInterval(() => {
                    progress += 0.1;
                    if (progress >= 1) {
                        clearInterval(animInterval);
                        // 击杀敌人
                        if (engine.onEnemyKilled) {
                            engine.onEnemyKilled(e);
                        } else {
                            e.dead = true;
                        }
                        return;
                    }
                    
                    // 向玩家移动
                    e.x = startX + (player.x - startX) * progress;
                    e.y = startY + (player.y - startY) * progress;
                    
                    // 缩小
                    e.scale = (e.scale || 1) * 0.9;
                    
                    // 吸收粒子
                    engine.particles.push(new Particle(e.x, e.y, '#8e44ad', 0.3, 3));
                }, 50);
                
            }, i * 100);
        });
        
        engine.texts.push(new FloatText(
            player.x,
            player.y - 80,
            `👝 吸收 ${targets.length} 只妖兽`,
            '#8e44ad',
            true
        ));
        
        this.createFullscreenEffect('#8e44ad', 0.2);
    }
    
    // ========== 辅助方法 ==========
    
    createFullscreenEffect(color, alpha) {
        // 创建全屏闪烁效果
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${color};
            opacity: ${alpha};
            pointer-events: none;
            z-index: 999;
            animation: flashOut 0.5s ease-out forwards;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flashOut {
                0% { opacity: ${alpha}; }
                100% { opacity: 0; }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.remove();
            style.remove();
        }, 500);
    }
    
    updateUI() {
        // 检查是否存在 DOM 环境
        if (typeof document === 'undefined' || !document.querySelector) {
            // Canvas 环境：UI 由 game-ui.js 绘制，这里不需要操作
            return;
        }
        
        for (let i = 0; i < this.maxSlots; i++) {
            const slotEl = document.querySelector(`.item-slot[data-slot="${i}"]`);
            if (!slotEl) continue;
            
            const contentEl = slotEl.querySelector('.slot-content');
            const card = this.slots[i];
            
            if (card) {
                contentEl.innerHTML = `
                    ${card.icon}
                    ${card.count > 1 ? `<span class="item-count">×${card.count}</span>` : ''}
                `;
                slotEl.classList.add('has-item');
                slotEl.title = `${card.name}: ${card.desc}`;
            } else {
                contentEl.innerHTML = '';
                slotEl.classList.remove('has-item');
                slotEl.title = '';
            }
        }
    }
    
    // 检查触摸点击是否在道具卡槽上（供 Canvas UI 使用）
    handleTouch(x, y, width, height) {
        const slotSize = 40;
        const spacing = 5;
        const startX = width - (slotSize + spacing) * 6 - 10;
        const startY = height - slotSize - 80;
        
        for (let i = 0; i < 6; i++) {
            const slotX = startX + (slotSize + spacing) * i;
            const slotY = startY;
            
            if (x >= slotX && x <= slotX + slotSize &&
                y >= slotY && y <= slotY + slotSize) {
                // 点击了槽位 i
                this.useCard(i);
                return true;
            }
        }
        
        return false;
    }
}
