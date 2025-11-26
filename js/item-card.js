import { ITEM_CARDS } from './data.js';
import { Particle, FloatText } from './entities.js';

export class ItemCardManager {
    constructor(engine) {
        this.engine = engine;
        this.slots = [null, null, null, null, null, null]; // 6个槽位
        this.maxSlots = 6;
    }
    
    reset() {
        this.slots = [null, null, null, null, null, null];
        this.updateUI();
    }
    
    addCard(cardData) {
        // 检查是否已有相同卡片
        for (let i = 0; i < this.maxSlots; i++) {
            if (this.slots[i] && this.slots[i].id === cardData.id) {
                // 叠加
                if (this.slots[i].count < cardData.maxStack) {
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
        }
        
        this.updateUI();
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
            case 'screen_damage':
                // 焚天诀 - 全屏伤害
                this.effectScreenDamage(card.value);
                break;
                
            case 'chain_lightning':
                // 雷罚术 - 连锁闪电
                this.effectChainLightning(card.value);
                break;
                
            case 'invincible':
                // 金刚咒 - 无敌
                this.effectInvincible(card.value);
                break;
                
            case 'heal':
                // 回春符 - 回血
                this.effectHeal(card.value);
                break;
                
            case 'freeze_all':
                // 冰封咒 - 冻结
                this.effectFreezeAll(card.value);
                break;
                
            case 'instant_kill':
                // 诛邪符 - 秒杀普通怪
                this.effectInstantKill();
                break;
        }
        
        // 震屏
        engine.shake = 1;
    }
    
    effectScreenDamage(damage) {
        const engine = this.engine;
        
        // 对所有敌人造成伤害
        engine.enemies.forEach(e => {
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
            
            if (e.hp <= 0) {
                engine.onEnemyKilled(e);
            }
        });
        
        // 全屏火焰效果
        this.createFullscreenEffect('#ff5722', 0.3);
    }
    
    effectChainLightning(targetCount) {
        const engine = this.engine;
        const targets = engine.enemies.slice(0, targetCount);
        
        targets.forEach((e, i) => {
            setTimeout(() => {
                // 闪电伤害
                const damage = engine.player.stats.dmg * 3;
                e.hp -= damage;
                
                // 闪电粒子
                for (let j = 0; j < 15; j++) {
                    engine.particles.push(new Particle(
                        e.x + (Math.random() - 0.5) * 30,
                        e.y + (Math.random() - 0.5) * 30,
                        '#ffeb3b',
                        0.3,
                        5
                    ));
                }
                
                engine.texts.push(new FloatText(e.x, e.y - 30, Math.floor(damage), '#ffeb3b'));
                
                if (e.hp <= 0) {
                    engine.onEnemyKilled(e);
                }
            }, i * 100);
        });
        
        this.createFullscreenEffect('#ffeb3b', 0.2);
    }
    
    effectInvincible(duration) {
        const player = this.engine.player;
        player.invincible = true;
        
        // 金光粒子
        const particleInterval = setInterval(() => {
            if (this.engine.player) {
                for (let i = 0; i < 3; i++) {
                    this.engine.particles.push(new Particle(
                        player.x + (Math.random() - 0.5) * 40,
                        player.y + (Math.random() - 0.5) * 40,
                        '#f1c40f',
                        0.3,
                        4
                    ));
                }
            }
        }, 100);
        
        // 显示护盾效果
        this.engine.texts.push(new FloatText(
            player.x,
            player.y - 80,
            `无敌 ${duration}秒`,
            '#f1c40f'
        ));
        
        setTimeout(() => {
            player.invincible = false;
            clearInterval(particleInterval);
            this.engine.texts.push(new FloatText(
                player.x,
                player.y - 80,
                '无敌结束',
                '#aaa'
            ));
        }, duration * 1000);
    }
    
    effectHeal(percent) {
        const player = this.engine.player;
        const healAmount = player.maxHp * percent;
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
        
        // 治疗粒子
        for (let i = 0; i < 20; i++) {
            this.engine.particles.push(new Particle(
                player.x + (Math.random() - 0.5) * 50,
                player.y + (Math.random() - 0.5) * 50,
                '#2ecc71',
                0.5,
                5
            ));
        }
        
        this.engine.texts.push(new FloatText(
            player.x,
            player.y - 50,
            `+${Math.floor(healAmount)} HP`,
            '#2ecc71'
        ));
    }
    
    effectFreezeAll(duration) {
        const engine = this.engine;
        
        // 冻结所有敌人
        engine.enemies.forEach(e => {
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
    
    effectInstantKill() {
        const engine = this.engine;
        
        // 秒杀非BOSS敌人
        engine.enemies.forEach(e => {
            if (!e.isBoss) {
                // 死亡效果
                for (let i = 0; i < 15; i++) {
                    engine.particles.push(new Particle(
                        e.x + (Math.random() - 0.5) * 40,
                        e.y + (Math.random() - 0.5) * 40,
                        '#9b59b6',
                        0.5,
                        5
                    ));
                }
                
                engine.onEnemyKilled(e);
            }
        });
        
        this.createFullscreenEffect('#9b59b6', 0.4);
    }
    
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
}

