import { Assets } from './assets.js';
import { ROLES, ARTIFACTS, ARENA_MOBS, ARENA_BOSSES } from './data.js';
import { collisionManager } from './spatial-hash.js';

export class Entity { 
    constructor(x,y) { this.x=x; this.y=y; this.dead=false; } 
    dist(o){ return Math.hypot(this.x-o.x, this.y-o.y); } 
}

export class Player extends Entity {
    constructor(roleId = 'sword') {
        super(0,0);
        const role = ROLES.find(r => r.id === roleId) || ROLES[0];
        this.role = role;
        
        // 基础属性 - 从角色数据读取
        this.hp = role.hp; 
        this.maxHp = role.hp; 
        this.speed = role.speed;
        
        this.exp=0; this.maxExp=10; this.lvl=1;
        
        // 战斗属性 - 从角色数据读取
        this.stats = { 
            dmg: role.dmg,                          // 基础伤害
            area: role.area || 150,                 // 攻击范围
            range: role.range || 400,               // 攻击距离
            count: role.count || 1,                 // 攻击数量
            cd: role.cd,                            // 攻击间隔
            spd: role.bulletSpeed || 500,           // 子弹速度
            element: role.element || 'sword',       // 元素类型
            pierce: 0,                              // 穿透
            thunderProb: 0,                         // 雷电触发几率
            knockback: 1.0,                         // 击退
            bulletSpeed: role.bulletSpeed || 500,   // 子弹速度
            bulletLife: 2.0,                        // 子弹生存时间
            stun: false                             // 眩晕
        }; 
        
        // 角色特殊属性调整
        if (roleId === 'ghost') { 
            this.stats.bulletLife = 4.0;  // 幽冥涧召唤物存在更久
        }
        if (roleId === 'formation') { 
            this.stats.pierce = 99;       // 天机阁阵法无限穿透
        }
        if (roleId === 'body') {
            this.stats.knockback = 1.8;   // 荒古门击退更强
        }
        
        this.cdTimer=0; this.facing=1; this.lvlUpFx=0;
        this.dashCd = 0; this.dashMaxCd = 2.0; this.dashTime = 0;
        this.footprintTimer = 0;
        this.invulnTimer = 0; // Invulnerability Timer
    }
    update(dt) {
        if (this.invulnTimer > 0) this.invulnTimer -= dt;
        this.dashCd -= dt;
        this.dashTime -= dt;

        let dx=0, dy=0;
        // 键盘输入
        if(window.Game.keys['KeyW']||window.Game.keys['ArrowUp']) dy=-1;
        if(window.Game.keys['KeyS']||window.Game.keys['ArrowDown']) dy=1;
        if(window.Game.keys['KeyA']||window.Game.keys['ArrowLeft']) dx=-1;
        if(window.Game.keys['KeyD']||window.Game.keys['ArrowRight']) dx=1;
        
        // 触屏输入（移动端）
        if (window.Game.touch && window.Game.touch.active) {
            dx = window.Game.touch.dx;
            dy = window.Game.touch.dy;
        }
        
        if (window.Game.keys['Space'] && this.dashCd <= 0 && (dx!==0 || dy!==0)) {
            this.dashCd = this.dashMaxCd;
            this.dashTime = 0.25; 
            window.Game.texts.push(new FloatText(this.x, this.y - 40, "神行!", "#3498db", true));
            for(let i=0; i<5; i++) window.Game.particles.push(new Particle(this.x, this.y, '#fff', 0.5, 3));
        }

        if(dx||dy) {
            const l = Math.hypot(dx,dy);
            let moveSpeed = this.speed;
            if (this.dashTime > 0) moveSpeed *= 3.0; 

            // 保存移动速度（用于伪3D效果）
            this.vx = (dx/l)*moveSpeed;
            this.vy = (dy/l)*moveSpeed;
            
            this.x += this.vx*dt; this.y += this.vy*dt;
            if(dx) this.facing = dx > 0 ? 1 : -1;
            
            // 地图边界检测 - 限制在岛屿范围内（半径580）
            const MAP_RADIUS = 580;
            const distFromCenter = Math.hypot(this.x, this.y);
            if (distFromCenter > MAP_RADIUS) {
                // 将玩家推回边界内
                const angle = Math.atan2(this.y, this.x);
                this.x = Math.cos(angle) * MAP_RADIUS;
                this.y = Math.sin(angle) * MAP_RADIUS;
            }
            
            // Footprints
            this.footprintTimer -= dt;
            if(this.footprintTimer <= 0) {
                if ([0,1,3].includes(window.Game.stageIdx)) {
                    window.Game.footprints.push(new Footprint(this.x, this.y + 20, Math.atan2(dy, dx)));
                    this.footprintTimer = 0.2;
                }
            }
        } else {
            // 不移动时逐渐归零（平滑过渡）
            this.vx = (this.vx || 0) * 0.85;
            this.vy = (this.vy || 0) * 0.85;
        }
        this.cdTimer-=dt;
        if(this.cdTimer<=0) {
            const t = this.findTarget();
            if(t) { 
                this.fire(t); 
                this.cdTimer = this.stats.cd; 
            }
        }
    }
    findTarget() {
        // 【优化】使用空间哈希快速查找最近敌人
        const target = collisionManager.findNearestEnemy(this.x, this.y, 600);
        return target;
    }
    fire(t) {
        if (this.role.id === 'body') {
             const range = this.stats.area; 
             window.Game.particles.push(new Particle(this.x, this.y, '#795548', 0.5, range/2)); 
             window.Game.screenShake(0.1);
             for(let e of window.Game.enemies) {
                 if(this.dist(e) < range) {
                     const a = Math.atan2(e.y - this.y, e.x - this.x);
                     e.takeDamage(this.stats.dmg, Math.cos(a), Math.sin(a), 'earth', this.stats.knockback);
                 }
             }
             return;
        }

        // 幽冥涧召唤逻辑
        if (this.role.id === 'ghost') {
            // 检查当前傀儡数量
            const currentPuppets = window.Game.minions.filter(m => m instanceof Puppet && m.owner === this).length;
            const maxPuppets = this.stats.count || 1;
            
            if (currentPuppets < maxPuppets) {
                window.Game.minions.push(new Puppet(this.x + (Math.random()-0.5)*40, this.y + (Math.random()-0.5)*40, this, this.stats));
            } else {
                // 傀儡满时，给傀儡回血或强化？或者发射普通子弹？
                // 暂时发射普通幽灵弹
                window.Game.bullets.push(new Bullet(this.x, this.y, t, this.stats));
            }
            return;
        }

        for(let i=0; i<this.stats.count; i++) {
            setTimeout(() => {
                if (this.stats.thunderProb > 0 && Math.random() < this.stats.thunderProb) {
                     window.Game.particles.push(new Lightning(this.x, this.y, t.x, t.y));
                     t.takeDamage(this.stats.dmg * 1.5, 0, 0, 'thunder'); 
                }

                if (this.stats.element === 'thunder') {
                    if (t.dead) return;
                    window.Game.particles.push(new Lightning(this.x, this.y, t.x, t.y));
                    const a = Math.atan2(t.y - this.y, t.x - this.x);
                    t.takeDamage(this.stats.dmg, Math.cos(a), Math.sin(a), 'thunder');
                    for(let k=0; k<5; k++) window.Game.particles.push(new Particle(t.x, t.y, '#ffeb3b', 0.3, 4));
                } else {
                    window.Game.bullets.push(new Bullet(this.x, this.y, t, this.stats));
                }
            }, i * (this.stats.element === 'thunder' ? 50 : 100)); 
        }
    }
    draw(ctx) {
        if (this.invulnTimer > 0 && Math.floor(window.Game.playTime * 15) % 2 === 0) return; // Blink effect

        const t = window.Game.playTime;
        
        // 计算移动方向的倾斜度（用于伪3D效果）
        const moveX = this.vx || 0;
        const moveY = this.vy || 0;
        const tiltX = Math.max(-1, Math.min(1, moveX / 150)); // 归一化到 -1 ~ 1
        const tiltY = Math.max(-1, Math.min(1, moveY / 150));
        
        // Shadow (根据移动方向调整阴影位置)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); 
        ctx.ellipse(tiltX * 5, 10 + Math.abs(tiltY) * 3, 20 + Math.abs(tiltX) * 5, 8, 0, 0, Math.PI*2); 
        ctx.fill();
        ctx.restore();

        // 获取角色图片
        const playerImg = Assets[this.role.svg];
        const hasValidImg = playerImg && playerImg.complete && playerImg.naturalWidth > 0;
        
        if (this.dashTime > 0) {
            ctx.save(); ctx.translate(this.x, this.y);
            ctx.globalAlpha = 0.5;
            ctx.scale(this.facing, 1);
            if (hasValidImg) {
                ctx.drawImage(playerImg, -32 - (Math.random()-0.5)*10, -32, 64, 64);
            } else {
                this.drawFallbackPlayer(ctx);
            }
            ctx.restore();
        }

        ctx.save(); ctx.translate(this.x, this.y);
        let auraColor = '#f1c40f';
        if(this.stats.element === 'fire') auraColor = '#e74c3c';
        if(this.stats.element === 'thunder') auraColor = '#8e44ad';
        if(this.stats.element === 'wood') auraColor = '#2ecc71';
        if(this.stats.element === 'water') auraColor = '#3498db';
        if(this.stats.element === 'earth') auraColor = '#e67e22';
        if(this.stats.element === 'ghost') auraColor = '#4a148c';
        if(this.stats.element === 'formation') auraColor = '#607d8b';
        
        ctx.rotate(t*0.5);
        ctx.beginPath(); ctx.arc(0,0,45,0,Math.PI*2);
        ctx.strokeStyle = auraColor; ctx.globalAlpha=0.3; ctx.lineWidth=2; ctx.setLineDash([15,25]); ctx.stroke();
        ctx.restore();
        
        // 伪3D厚度效果：根据移动方向绘制多层剪影
        const thickness = 4; // 厚度层数
        const depthOffset = 3; // 每层偏移量
        
        // 绘制厚度层（在主体后面）
        if (hasValidImg && (Math.abs(tiltX) > 0.1 || Math.abs(tiltY) > 0.1)) {
            for (let i = thickness; i > 0; i--) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.translate(-tiltX * depthOffset * i, tiltY * depthOffset * i * 0.5);
                ctx.scale(this.facing, 1);
                ctx.globalAlpha = 0.15 - i * 0.03;
                ctx.drawImage(playerImg, -32, -32, 64, 64);
                ctx.restore();
            }
        }
        
        // 绘制主体（带轻微倾斜变形）
        ctx.save(); 
        ctx.translate(this.x, this.y);
        ctx.scale(this.facing, 1);
        const scaleX = 1 - Math.abs(tiltX) * 0.1;
        const skewY = tiltY * 0.05;
        ctx.transform(scaleX, skewY, 0, 1, 0, 0);
        if (hasValidImg) {
            ctx.drawImage(playerImg, -32, -32, 64, 64);
        } else {
            this.drawFallbackPlayer(ctx);
        }
        ctx.restore();
        
        if (this.dashCd > 0) {
            ctx.fillStyle = '#555';
            ctx.fillRect(this.x - 20, this.y + 40, 40, 4);
            ctx.fillStyle = '#3498db';
            ctx.fillRect(this.x - 20, this.y + 40, 40 * (1 - this.dashCd/this.dashMaxCd), 4);
        }

        if(this.lvlUpFx>0) {
            this.lvlUpFx-=0.05;
            ctx.beginPath(); ctx.arc(this.x,this.y, 40+(1-this.lvlUpFx)*150, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(255,255,255,${this.lvlUpFx})`; ctx.lineWidth=5; ctx.stroke();
        }
    }
    gainExp(v){ 
        // 聚灵阵经验加成
        const actualExp = v * (this.expBoost || 1);
        this.exp += actualExp; 
        if(this.exp>=this.maxExp) this.levelUp(); 
        window.Game.updateUI(); 
    }
    levelUp(){ this.lvl++; this.exp=0; this.maxExp=Math.floor(this.maxExp*1.4); this.hp=this.maxHp; this.lvlUpFx=1.0; window.showUpgradeMenu(); }
    hit(d, attacker = null){ 
        if(this.invulnTimer > 0) return;
        if(this.invincible) return; // 金身符无敌
        
        // 确保伤害值有效
        const damage = d || 0;
        if (isNaN(damage) || damage <= 0) return;
        
        // 玄武盾减伤效果
        let actualDamage = damage;
        if (this.damageReduction) {
            actualDamage = d * (1 - this.damageReduction);
        }
        
        this.hp -= actualDamage; 
        this.invulnTimer = 0.3; // 0.3s i-frame
        window.Game.texts.push(new FloatText(this.x, this.y, "-"+Math.floor(actualDamage), '#e74c3c', true)); 
        
        // 玄武盾反弹效果
        if (this.damageReflect && attacker && !attacker.dead) {
            const reflectDamage = damage * this.damageReflect;
            attacker.hp -= reflectDamage;
            window.Game.texts.push(new FloatText(attacker.x, attacker.y, "-"+Math.floor(reflectDamage), '#3498db'));
            window.Game.particles.push(new Particle(attacker.x, attacker.y, '#3498db', 0.3, 4));
            if (attacker.hp <= 0 && !attacker.dead) {
                if (window.Game.onEnemyKilled) {
                    window.Game.onEnemyKilled(attacker);
                } else {
                    attacker.dead = true;
                }
            }
        }
        
        window.Game.updateUI(); 
        window.Game.screenShake(0.3);
        if(this.hp<=0) window.Game.gameOver(); 
    }
    
    // 后备绘制 - 当角色图片加载失败时使用
    drawFallbackPlayer(ctx) {
        const roleColors = {
            'sword': '#3498db',   // 天剑宗 - 蓝色
            'mage': '#e74c3c',    // 玄元道 - 红色
            'body': '#f39c12',    // 荒古门 - 金色
            'ghost': '#9b59b6',   // 幽冥涧 - 紫色
            'formation': '#1abc9c' // 天机阁 - 青色
        };
        const color = roleColors[this.role.id] || '#3498db';
        
        // 身体
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 头部
        ctx.fillStyle = '#ffe0bd';
        ctx.beginPath();
        ctx.arc(0, -20, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-4, -22, 2, 0, Math.PI * 2);
        ctx.arc(4, -22, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 武器/特征
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        if (this.role.id === 'sword') {
            // 剑
            ctx.beginPath();
            ctx.moveTo(15, -10);
            ctx.lineTo(30, -25);
            ctx.stroke();
        } else if (this.role.id === 'mage') {
            // 法杖
            ctx.beginPath();
            ctx.moveTo(15, -5);
            ctx.lineTo(20, -30);
            ctx.stroke();
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(20, -32, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

export class Enemy extends Entity {
    constructor(type,x,y,diff,isElite=false) {
        super(x,y); this.type=type; this.isElite=isElite;
        // Reduced speeds for better kiting
        if(type==='bat'){ this.hp=20*diff; this.speed=130; this.dmg=5; this.exp=5; this.img='bat'; }
        else if(type==='bat_fire'){ this.hp=30*diff; this.speed=140; this.dmg=8; this.exp=8; this.img='bat_fire'; } // Nerfed from 150 to 140
        else if(type==='ghost'){ this.hp=40*diff; this.speed=90; this.dmg=10; this.exp=10; this.img='ghost'; }
        else if(type==='ghost_ice'){ this.hp=50*diff; this.speed=80; this.dmg=12; this.exp=15; this.img='ghost_ice'; }
        else if(type==='magma_rock'){ this.hp=120*diff; this.speed=50; this.dmg=25; this.exp=30; this.img='magma_rock'; }
        else if(type==='crystal'){ this.hp=150*diff; this.speed=40; this.dmg=30; this.exp=35; this.img='crystal'; }
        else { this.hp=100*diff; this.speed=60; this.dmg=20; this.exp=25; this.img='rock'; }
        
        if(isElite) {
            this.hp *= 5; this.dmg *= 1.5; this.exp *= 10;
            this.scale = 1.5;
        } else {
            this.scale = 1.0;
        }
        
        this.maxHp=this.hp; this.pushX=0; this.pushY=0;
        this.slowTimer = 0;
        this.hitFlashTimer = 0;
    }
    update(dt,p) {
        if(this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
        if(this.slowTimer>0) this.slowTimer-=dt;
        let spd = this.speed;
        if(this.slowTimer>0) spd *= 0.5; 

        // Soft collision with other enemies (optional optimization)
        // For performance, we won't check all-vs-all every frame in JS for 500 enemies.
        // But we can prevent stacking on player.
        
        const dToPlayer = this.dist(p);
        const minDist = 25 * this.scale; // Collision radius

        if (dToPlayer < minDist) {
             // Too close to player, push back slightly to avoid perfect overlap "sticking"
             // This simulates body block without hard collision
             const a = Math.atan2(this.y - p.y, this.x - p.x);
             // Stronger repulsion force to overcome forward movement
             this.pushX += Math.cos(a) * 1000 * dt; 
             this.pushY += Math.sin(a) * 1000 * dt;
        }

        const a = Math.atan2(p.y-this.y, p.x-this.x);
        
        // Only move towards player if not pushed too hard
        this.x += (Math.cos(a)*spd+this.pushX)*dt;
        this.y += (Math.sin(a)*spd+this.pushY)*dt;
        
        this.pushX*=0.9; this.pushY*=0.9;
        
        if(dToPlayer<30*this.scale) p.hit(this.dmg); // Discrete damage
    }
    takeDamage(v, kx, ky, type, knockbackMult = 1.0) {
        // 确保伤害值有效
        const dmg = v || 0;
        if (isNaN(dmg) || dmg <= 0) return;
        
        this.hp -= dmg; 
        this.hitFlashTimer = 0.1; // Flash
        
        let force = 120;
        if(type === 'earth') force = 300; 
        
        force *= knockbackMult; 
        if(this.isElite) force *= 0.2; 
        
        this.pushX=kx*force; this.pushY=ky*force;
        
        let c = '#fff';
        let crit = false;
        
        // Ensure consistent colors for damage sources (Player Attacks)
        if(type === 'fire') { c = '#ff5722'; crit = true; }
        else if(type === 'thunder') { c = '#ffeb3b'; crit = true; }
        else if(type === 'wood') c = '#2ecc71';
        else if(type === 'water') c = '#3498db';
        else if(type === 'earth') { c = '#e67e22'; crit = true; }
        else if(type === 'ghost') c = '#9c27b0';
        else if(type === 'formation') c = '#cfd8dc';
        else if(type === 'sword') c = '#ffffff'; // Explicit white for sword
        
        // Override if this is environmental damage (e.g., hazard zones) or trap damage
        // Assuming "trap" or "hazard" types might exist in future, we can color them differently.
        
        // Throttling damage numbers to reduce visual clutter
        // Check if this entity was recently hit by the same type to avoid number spam
        if (!this.lastDamageTime) this.lastDamageTime = {};
        const now = window.Game.playTime;
        // Only show text if enough time passed since last hit of this type (0.2s)
        // OR if it's a crit (always show crits)
        if (crit || !this.lastDamageTime[type] || (now - this.lastDamageTime[type] > 0.2)) {
             window.Game.texts.push(new FloatText(this.x, this.y-20*this.scale, Math.floor(dmg), c, crit));
             this.lastDamageTime[type] = now;
        }
        
        if (crit || this.hp <= 0) {
            window.Game.hitStop(0.05);
            // Debris FX - Optimized: Fewer particles for non-lethal hits
            const count = this.hp <= 0 ? 3 : 1; 
            if (Math.random() < 0.5 || this.hp <= 0) { // 50% chance for debris on crit, 100% on death
                for(let i=0; i<count; i++) {
                    const p = new Particle(this.x, this.y, this.hp<=0 ? '#555' : c, 0.4 + Math.random()*0.3, 3 + Math.random()*3, 800);
                    p.vx = (Math.random()-0.5)*300;
                    p.vy = -100 - Math.random()*200;
                    window.Game.particles.push(p);
                }
            }
        }
        
        if(type === 'water') this.slowTimer = 2.0; 

        if(this.hp<=0) {
            this.dead=true; window.Game.score++; 
            window.Game.updateUI();
            if(type==='fire') window.Game.screenShake(0.5);
            
            if(this.isElite) {
                window.Game.chests.push(new Chest(this.x, this.y));
                window.Game.screenShake(2.0);
                window.Game.texts.push(new FloatText(this.x, this.y-50, "精英击杀!", "#f1c40f", true));
            } else {
                window.Game.orbs.push(new Orb(this.x,this.y,this.exp)); 
            }
        }
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(0, 20, 20, 8, 0, 0, Math.PI*2); ctx.fill();

        if(window.Game.player.x<this.x) ctx.scale(-1,1);
        
        if(this.isElite) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 5, 25, 0, Math.PI*2); ctx.stroke();
            ctx.restore();
        }

        // 检查图片是否有效，否则使用后备绘制
        const img = Assets[this.img];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -24, -24, 48, 48);
            
            if (this.hitFlashTimer > 0) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.8;
                ctx.drawImage(img, -24, -24, 48, 48);
                ctx.restore();
            }
        } else {
            // 后备绘制 - Q版怪物
            this.drawFallback(ctx);
        }

        if(this.slowTimer>0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
            ctx.fillRect(-24,-24,48,48);
            ctx.globalCompositeOperation = 'source-over';
        }
        if(this.hp<this.maxHp) { ctx.fillStyle='red'; ctx.fillRect(-15,-30,30*(this.hp/this.maxHp),4); }
        ctx.restore();
    }
    
    // 后备绘制 - Q版怪物（当 SVG 加载失败时使用）
    drawFallback(ctx) {
        const time = Date.now() / 1000;
        const bounce = Math.sin(time * 5 + this.x) * 2;
        
        // 根据怪物类型绘制不同样式
        if (this.type.includes('bat')) {
            // 蝙蝠
            ctx.fillStyle = '#8b0000';
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
        } else if (this.type.includes('ghost')) {
            // 幽灵
            ctx.fillStyle = 'rgba(100, 100, 200, 0.7)';
            ctx.beginPath();
            ctx.ellipse(0, bounce - 5, 15, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            // 幽灵尾巴
            ctx.beginPath();
            ctx.moveTo(-12, bounce + 10);
            for (let i = 0; i < 5; i++) {
                const x = -12 + i * 6;
                const y = bounce + 10 + Math.sin(time * 3 + i) * 5;
                ctx.lineTo(x, y + 8);
            }
            ctx.lineTo(12, bounce + 10);
            ctx.fill();
        } else if (this.type.includes('rock') || this.type.includes('magma')) {
            // 岩石怪
            ctx.fillStyle = this.type.includes('magma') ? '#ff6600' : '#666';
            ctx.beginPath();
            ctx.moveTo(0, -15 + bounce);
            ctx.lineTo(15, 5 + bounce);
            ctx.lineTo(10, 15 + bounce);
            ctx.lineTo(-10, 15 + bounce);
            ctx.lineTo(-15, 5 + bounce);
            ctx.closePath();
            ctx.fill();
        } else if (this.type.includes('crystal')) {
            // 水晶兽
            ctx.fillStyle = '#00bcd4';
            ctx.beginPath();
            ctx.moveTo(0, -18 + bounce);
            ctx.lineTo(12, 0 + bounce);
            ctx.lineTo(0, 18 + bounce);
            ctx.lineTo(-12, 0 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // 默认圆形怪物
            ctx.fillStyle = this.isElite ? '#c0392b' : '#8b0000';
            ctx.beginPath();
            ctx.arc(0, bounce, 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 眼睛
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(-5, -3 + bounce, 3, 0, Math.PI * 2);
        ctx.arc(5, -3 + bounce, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ========== 秘境专属敌人类 ==========
export class ArenaEnemy extends Enemy {
    constructor(type, x, y, levelMult, playerLevel) {
        const mobData = ARENA_MOBS[type] || ARENA_BOSSES[type];
        const baseHp = mobData?.hp || 50;
        const baseDmg = mobData?.dmg || 10;
        const baseSpeed = mobData?.speed || 80;
        const level = Math.max(1, Math.floor(playerLevel * levelMult));
        
        super(type, x, y, level);
        
        this.hp = baseHp * (1 + level * 0.2);
        this.maxHp = this.hp;
        this.dmg = baseDmg * (1 + level * 0.1);
        this.speed = baseSpeed;
        this.goldDrop = mobData?.goldDrop || [1, 2];
        this.isBoss = !!ARENA_BOSSES[type];
        this.bossSize = mobData?.size || 1.0;
        this.name = mobData?.name || type;
        this.scale = this.isBoss ? this.bossSize : 1.0;
        
        if (this.isBoss) {
            this.hp *= 10;
            this.maxHp = this.hp;
            this.dmg *= 2;
        }
    }
    
    takeDamage(v, kx, ky, type, knockback) {
        if (this.dead) return;
        
        const dmg = v || 0;
        if (isNaN(dmg) || dmg <= 0) return;
        
        this.hp -= dmg;
        this.hitFlashTimer = 0.1;
        
        // 击退
        const force = (this.isBoss ? 5 : 10) * (knockback || 1);
        this.pushX = (kx || 0) * force;
        this.pushY = (ky || 0) * force;
        
        // 伤害数字
        window.Game.texts.push(new FloatText(this.x, this.y - 30, Math.floor(dmg), '#ff5252'));
        
        // 粒子效果
        for (let i = 0; i < 3; i++) {
            if (window.Game.pool) {
                window.Game.particles.push(window.Game.pool.get('particle', Particle, this.x, this.y, '#ff5252', 0.3, 4));
            } else {
                window.Game.particles.push(new Particle(this.x, this.y, '#ff5252', 0.3, 4));
            }
        }
        
        // 死亡处理 - 先设置 dead 标志，防止重复处理
        if (this.hp <= 0 && !this.dead) {
            this.dead = true;  // 立即标记死亡
            if (window.Game && window.Game.onEnemyKilled) {
                window.Game.onEnemyKilled(this);
            }
        }
    }
    
    draw(ctx, assets) {
        if (this.dead) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const shouldFlip = window.Game.player && window.Game.player.x < this.x;
        if (shouldFlip) ctx.scale(-1, 1);
        
        // 受击闪烁
        if (this.hitFlashTimer > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
        }
        
        // 绘制怪物
        this.drawArenaMob(ctx);
        
        ctx.restore();
        
        // 名字和血条（不受缩放影响）
        this.drawArenaUI(ctx);
    }
    
    drawArenaMob(ctx) {
        const time = Date.now() / 1000;
        const bounce = Math.sin(time * 5 + this.x) * 2;
        
        // 简化的怪物绘制
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
    
    drawArenaUI(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 名字
        const mobData = ARENA_MOBS[this.type] || ARENA_BOSSES[this.type];
        ctx.fillStyle = this.isBoss ? '#ffcc00' : '#fff';
        ctx.font = this.isBoss ? 'bold 14px Arial' : '11px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(mobData?.name || this.type, 0, -30 * this.scale);
        ctx.shadowBlur = 0;
        
        // 血条（非 BOSS）
        if (!this.isBoss && this.hp < this.maxHp) {
            const barWidth = 40;
            const barHeight = 5;
            const hpRatio = Math.max(0, this.hp / this.maxHp);
            const barY = -35 * this.scale;
            
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(-barWidth/2 - 1, barY - 1, barWidth + 2, barHeight + 2);
            
            ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
            ctx.fillRect(-barWidth/2, barY, barWidth * hpRatio, barHeight);
        }
        
        ctx.restore();
    }
}

export class Bullet extends Entity {
    constructor(x, y, t, s) {
        super(x, y);
        this.reset(x, y, t, s);
    }
    
    /**
     * 重置子弹状态（供对象池复用）
     */
    reset(x, y, t, s) {
        this.x = x;
        this.y = y;
        this.dead = false;
        
        this.type = s.element; 
        const a = Math.atan2(t.y-y, t.x-x) + (Math.random()-0.5)*0.1;
        
        let spd = s.spd;
        if(s.element === 'beast') spd = s.bulletSpeed;
        
        this.vx = Math.cos(a)*spd; this.vy = Math.sin(a)*spd;
        this.life = 2.0; 
        if(s.element === 'beast') this.life = s.bulletLife;
        
        this.dmg = s.dmg; this.angle = a;
        this.pierce = s.pierce || 0; 
        this.hitList = []; 
        this.stun = s.stun || false; 
        this.target = t; 
        
        this.bornTime = 0;
        this.originVX = this.vx;
        this.originVY = this.vy;
        this.currentSpeed = spd;
        this.area = s.area || 0;
        this.knockback = s.knockback || 1.0;
        
        if(this.type === 'earth') { this.life = 3.0; this.dmg *= 1.5; }
        
        // Formation (Trap) Init
        if (this.type === 'formation') {
             this.destX = t.x;
             this.destY = t.y;
             this.maxLife = 3.0; // Trap duration
             this.life = 3.0; 
             this.pierce = 999; // Don't die on hit
             this.deployed = false;
             this.trapInterval = 0.3;
             this.trapTimer = 0;
             this.scale = 0.1; // Grow in
        }
        
        // Ghost (Wobble) Init
        if (this.type === 'ghost') {
             this.wobblePhase = Math.random() * Math.PI * 2;
        }
    }
    update(dt) {
        // Sword Acceleration
        if (this.type === 'sword') {
            this.currentSpeed += 800 * dt;
            const currentMag = Math.hypot(this.vx, this.vy);
            if (currentMag > 0) {
                 this.vx = (this.vx / currentMag) * this.currentSpeed;
                 this.vy = (this.vy / currentMag) * this.currentSpeed;
            }
        }

        // Formation Logic
        if (this.type === 'formation') {
             if (!this.deployed) {
                 // Move towards dest
                 const d = Math.hypot(this.destX - this.x, this.destY - this.y);
                 if (d < 20) {
                     this.deployed = true;
                     this.vx = 0; this.vy = 0;
                     this.life = this.maxLife; // Reset life for duration
                 } else {
                     const a = Math.atan2(this.destY - this.y, this.destX - this.x);
                     this.vx = Math.cos(a) * this.currentSpeed;
                     this.vy = Math.sin(a) * this.currentSpeed;
                     this.x += this.vx * dt;
                     this.y += this.vy * dt;
                     this.angle = a;
                 }
             } else {
                 // Trap Logic
                 if (this.scale < 1.0) this.scale += dt * 5;
                 this.trapTimer -= dt;
                 if (this.trapTimer <= 0) {
                     this.trapTimer = this.trapInterval;
                     // Visual Pulse
                     window.Game.particles.push(new Particle(this.x, this.y, '#cfd8dc', 0.5, this.area*0.5 || 50));
                     
                     // 【优化】阵法 AOE 使用空间哈希
                     const trapRange = this.area || 80;
                     const nearbyEnemies = collisionManager.findEnemiesInRange(this.x, this.y, trapRange);
                     for (let e of nearbyEnemies) {
                         if (this.dist(e) < trapRange) {
                             this.hit(e);
                         }
                     }
                 }
                 this.life -= dt;
                 if (this.life <= 0) this.dead = true;
                 return;
             }
        }

        if (this.type !== 'formation') {
            this.life-=dt; if(this.life<=0) this.dead=true;
        }
        this.bornTime += dt;
        
        if (this.type === 'ghost') {
             // Wobbly Homing
             if (!this.target.dead) {
                 const d = this.dist(this.target);
                 if (d > 10) {
                     const a = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                     
                     // Add Wobble
                     const wobble = Math.sin(this.bornTime * 10 + this.wobblePhase) * 0.5;
                     
                     const turnSpeed = 5.0 * dt;
                     const speed = Math.hypot(this.vx, this.vy);
                     
                     // Blend straight homing with wobble
                     this.vx += (Math.cos(a + wobble) * speed - this.vx) * turnSpeed;
                     this.vy += (Math.sin(a + wobble) * speed - this.vy) * turnSpeed;
                     
                     const newSpeed = Math.hypot(this.vx, this.vy);
                     this.vx = (this.vx / newSpeed) * speed;
                     this.vy = (this.vy / newSpeed) * speed;
                     this.angle = Math.atan2(this.vy, this.vx);
                 }
             } else {
                 // Find new target - 【优化】使用空间哈希
                 const newTarget = collisionManager.findNearestEnemy(this.x, this.y, 400);
                 if(newTarget) this.target = newTarget;
             }
             this.x += this.vx * dt;
             this.y += this.vy * dt;
             
        } else if (this.type !== 'formation') {
             this.x+=this.vx*dt; this.y+=this.vy*dt;
        }
        
        if(this.type === 'fire') {
            if(Math.random()>0.2) window.Game.particles.push(new Particle(this.x,this.y,'#ff5722',0.5, 5));
        } else if (this.type === 'water') {
             if(Math.random()>0.5) window.Game.particles.push(new Particle(this.x,this.y,'#e1f5fe',0.3, 3));
        } else if (this.type === 'thunder') {
             window.Game.particles.push(new Particle(this.x,this.y,'#fff',0.2, 2));
        } else if (this.type === 'ghost') {
             if(Math.random()>0.7) window.Game.particles.push(new Particle(this.x,this.y,'#4a148c',0.3, 3));
        } else if (this.type === 'formation') {
             // Pulse particle handled in trap logic
        } else {
            if(Math.random()>0.5) window.Game.particles.push(new Particle(this.x,this.y,'#00bcd4',0.3, 3));
        }

        // 【优化】使用空间哈希只检测附近敌人
        // 秘境模式下跳过此碰撞检测（由 arena-unified.js 处理）
        if (!this.skipCollision) {
            const nearbyEnemies = collisionManager.findEnemiesInRange(this.x, this.y, 80);
            for(let e of nearbyEnemies) {
                if(this.dist(e)<35 && !this.hitList.includes(e)) {
                    this.hit(e);
                    this.hitList.push(e);
                    if(this.pierce > 0) {
                        this.pierce--;
                    } else {
                        this.dead = true;
                        break;
                    }
                }
            }
        }
    }
    hit(e) {
        e.takeDamage(this.dmg, Math.cos(this.angle), Math.sin(this.angle), this.type);
        if (this.stun) e.slowTimer = 1.0; 
        
        // Mage AOE Explosion - 【优化】使用空间哈希
        if(this.type === 'fire') {
            const aoeRange = this.area || 120;
            const nearbyEnemies = collisionManager.findEnemiesInRange(this.x, this.y, aoeRange);
            for(let other of nearbyEnemies) {
                 if (other !== e && this.dist(other) < aoeRange) {
                     // Reduced damage for splash
                     other.takeDamage(this.dmg * 0.5, 0, 0, 'fire');
                 }
             }
             // Big Boom Visual
             window.Game.particles.push(new Particle(this.x, this.y, '#ff5722', 0.6, this.area || 100));
             for(let i=0; i<10; i++) window.Game.particles.push(new Particle(this.x,this.y,'#ff9800', 0.6, 8));
             return; // Skip standard small particles
        }

        if(this.type === 'water') {
            for(let i=0; i<5; i++) window.Game.particles.push(new Particle(this.x,this.y,'#b3e5fc', 0.4, 5));
        } else if(this.type === 'earth') {
             window.Game.screenShake(0.2);
             for(let i=0; i<8; i++) window.Game.particles.push(new Particle(this.x,this.y,'#795548', 0.5, 6));
        } else if(this.type === 'ghost') {
             for(let i=0; i<5; i++) window.Game.particles.push(new Particle(this.x,this.y,'#9c27b0', 0.4, 5));
        } else if(this.type === 'formation') {
             for(let i=0; i<6; i++) window.Game.particles.push(new Particle(this.x,this.y,'#cfd8dc', 0.5, 6));
        } else {
            window.Game.particles.push(new Particle(this.x,this.y,'#fff',0.2, 6));
        }
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        
        if (this.type === 'formation') {
            // Formation Rune Drawing
             if (this.deployed) {
                 ctx.scale(this.scale, this.scale);
                 ctx.rotate(window.Game.playTime * 2); // Spin
                 ctx.beginPath();
                 ctx.arc(0,0, this.area || 80, 0, Math.PI*2);
                 ctx.strokeStyle = `rgba(207, 216, 220, ${0.3 + Math.sin(window.Game.playTime*10)*0.2})`;
                 ctx.lineWidth = 2;
                 ctx.stroke();
                 
                 // Inner rune
                 ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 3;
                 ctx.beginPath(); ctx.moveTo(0,-20); ctx.lineTo(16,10); ctx.lineTo(-16,10); ctx.closePath(); ctx.stroke();
             } else {
                 // Flying Rune
                 ctx.rotate(this.angle + Math.PI/2);
                 ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2;
                 ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(8,5); ctx.lineTo(-8,5); ctx.closePath(); ctx.stroke();
             }
             ctx.restore();
             return;
        }

        ctx.rotate(this.angle + Math.PI/2);
        if(this.type === 'fire') {
            ctx.rotate(window.Game.playTime * 10);
            this.drawBulletIcon(ctx, 'fire', '#e74c3c', 16);
        } else if(this.type === 'wood') {
             ctx.rotate(window.Game.playTime * 5);
             this.drawBulletIcon(ctx, 'leaf', '#2ecc71', 12);
        } else if(this.type === 'water') {
            this.drawBulletIcon(ctx, 'ice', '#3498db', 16);
        } else if(this.type === 'earth') {
            ctx.rotate(window.Game.playTime * 2);
            this.drawBulletIcon(ctx, 'rock_b', '#e67e22', 20);
        } else if(this.type === 'ghost') {
             ctx.rotate(-Math.PI/2); 
             if (this.vx < 0) ctx.scale(1, -1); 
             ctx.fillStyle = '#7b1fa2'; 
             ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
             ctx.fillStyle = '#e1bee7';
             ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill();
        } else {
            this.drawBulletIcon(ctx, 'sword', '#fff', 10);
        }
        ctx.restore();
    }
    
    // 绘制子弹图标（带后备绘制）
    drawBulletIcon(ctx, type, color, size) {
        const img = Assets[type];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -size, -size, size * 2, size * 2);
        } else {
            // 后备绘制
            ctx.fillStyle = color;
            if (type === 'fire') {
                // 火焰
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.quadraticCurveTo(size, -size/2, size/2, size);
                ctx.quadraticCurveTo(0, size/2, -size/2, size);
                ctx.quadraticCurveTo(-size, -size/2, 0, -size);
                ctx.fill();
            } else if (type === 'leaf') {
                // 叶子
                ctx.beginPath();
                ctx.ellipse(0, 0, size/2, size, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#27ae60';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(0, size);
                ctx.stroke();
            } else if (type === 'ice') {
                // 冰晶
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const x = Math.cos(angle) * size;
                    const y = Math.sin(angle) * size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
            } else if (type === 'rock_b') {
                // 岩石
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size, 0);
                ctx.lineTo(size/2, size);
                ctx.lineTo(-size/2, size);
                ctx.lineTo(-size, 0);
                ctx.closePath();
                ctx.fill();
            } else {
                // 剑气
                ctx.beginPath();
                ctx.moveTo(0, -size * 2);
                ctx.lineTo(size/2, size);
                ctx.lineTo(-size/2, size);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
}

export class Artifact extends Entity {
    constructor(id) {
        super(0, 0);
        this.id = id;
        this.data = ARTIFACTS.find(a => a.id === id) || ARTIFACTS[0];
        this.cd = 0;
        this.maxCd = this.data.cd;
        this.angle = 0;
        
        // 保存玩家引用，供各方法使用
        this.player = null;
        
        // 诛仙剑阵专用
        this.swordAngles = [0, Math.PI/2, Math.PI, Math.PI*1.5];
        this.swordTargets = [null, null, null, null];
        this.swordCooldowns = [0, 0, 0, 0];
        
        // 风火轮专用
        this.fireTrailTimer = 0;
        this.fireTrails = [];
        
        // 乾坤圈专用
        this.knockbackTimer = 0;
        
        // 被动效果是否已应用
        this.passiveApplied = false;
    }
    
    update(dt, player) {
        this.x = player.x;
        this.y = player.y;
        this.player = player; // 保存引用
        
        // 应用被动效果（只执行一次）
        if (!this.passiveApplied) {
            this.applyPassiveEffects(player);
            this.passiveApplied = true;
        }
        
        // 主动CD效果
        if (this.maxCd > 0) {
            this.cd -= dt;
            if (this.cd <= 0) {
                this.trigger(player);
                this.cd = this.maxCd;
            }
        }
        
        // 根据法宝类型执行特殊逻辑
        switch (this.id) {
            case 'zhuxian_array':
                this.updateZhuxianArray(dt, player);
                break;
            case 'mirror':
                this.updateMirror(dt, player);
                break;
            case 'qiankun_quan':
                this.updateQiankunQuan(dt, player);
                break;
            case 'fenghuo_lun':
                this.updateFenghuoLun(dt, player);
                break;
            case 'dinghai_zhu':
                this.updateDinghaiZhu(dt, player);
                break;
        }
    }
    
    // ========== 被动效果应用 ==========
    applyPassiveEffects(player) {
        switch (this.id) {
            case 'jinjiao_jian':
                // 金蛟剪 - 穿透+2，伤害+20%
                player.stats.pierce = (player.stats.pierce || 0) + 2;
                player.stats.dmg *= 1.2;
                window.Game.texts.push(new FloatText(player.x, player.y - 60, "金蛟剪·穿透强化!", "#f1c40f"));
                break;
                
            case 'xuanwu_dun':
                // 玄武盾 - 减伤30%（通过标记实现，在Player.hit中处理）
                player.damageReduction = 0.3;
                player.damageReflect = 0.1;
                window.Game.texts.push(new FloatText(player.x, player.y - 60, "玄武盾·防御强化!", "#3498db"));
                break;
                
            case 'fenghuo_lun':
                // 风火轮 - 移速+50%
                player.speed *= 1.5;
                window.Game.texts.push(new FloatText(player.x, player.y - 60, "风火轮·移速强化!", "#e74c3c"));
                break;
                
            case 'jubao_pen':
                // 聚宝盆 - 掉落+50%，拾取范围+100%
                player.dropBonus = 1.5;
                player.stats.area *= 2;
                window.Game.texts.push(new FloatText(player.x, player.y - 60, "聚宝盆·财运加持!", "#f1c40f"));
                break;
        }
    }
    
    // ========== 诛仙剑阵 - 4剑环绕自动攻击 ==========
    updateZhuxianArray(dt, player) {
        // 4把剑环绕
        for (let i = 0; i < 4; i++) {
            this.swordAngles[i] += dt * 2; // 旋转速度
            this.swordCooldowns[i] -= dt;
            
            // 寻找并攻击目标
            if (this.swordCooldowns[i] <= 0) {
                const swordX = this.x + Math.cos(this.swordAngles[i]) * 60;
                const swordY = this.y + Math.sin(this.swordAngles[i]) * 60;
                
                // 找最近的敌人
                let nearest = null;
                let minDist = 150;
                for (const e of window.Game.enemies) {
                    if (e.dead) continue;
                    const d = Math.hypot(e.x - swordX, e.y - swordY);
                    if (d < minDist) {
                        minDist = d;
                        nearest = e;
                    }
                }
                
                if (nearest) {
                    // 剑气攻击 - 伤害为玩家伤害的 30%
                    const dmg = Math.floor((player.stats?.dmg || 10) * 0.3);
                    nearest.takeDamage(dmg, 0, 0, 'sword');
                    window.Game.particles.push(new Particle(nearest.x, nearest.y, '#00bcd4', 0.3, 4));
                    this.swordCooldowns[i] = 0.5; // 攻击间隔
                }
            }
        }
    }
    
    // ========== 乾蓝冰焰 - 前方烧伤，后方冻结 ==========
    updateMirror(dt, player) {
        this.angle += dt * 2; 
        const baseDmg = player.stats?.dmg || 10;
        
        for (let e of window.Game.enemies) {
            const d = this.dist(e);
            if (d < 150) { 
                const angToEnemy = Math.atan2(e.y - this.y, e.x - this.x);
                let diff = angToEnemy - this.angle;
                while (diff > Math.PI) diff -= Math.PI*2;
                while (diff < -Math.PI) diff += Math.PI*2;
                
                if (Math.abs(diff) < Math.PI/2) {
                    // 前方 - 火焰灼烧（伤害为玩家伤害的 50%）
                    if (!e.burnTick) e.burnTick = 0;
                    e.burnTick -= dt;
                    if (e.burnTick <= 0) {
                        const fireDmg = Math.floor(baseDmg * 0.5);
                        e.takeDamage(fireDmg, 0, 0, 'fire');
                        window.Game.particles.push(new Particle(e.x, e.y, '#e74c3c', 0.3, 2));
                        e.burnTick = 0.2;
                    }
                } else {
                    // 后方 - 冰霜减速
                    e.slowTimer = 0.2;
                    if (Math.random() < dt * 5) {
                        window.Game.particles.push(new Particle(e.x, e.y, '#3498db', 0.3, 2));
                    }
                }
            }
        }
    }
    
    // ========== 乾坤圈 - 结界击退敌人 ==========
    updateQiankunQuan(dt, player) {
        this.knockbackTimer -= dt;
        this.angle += dt * 3;
        
        if (this.knockbackTimer <= 0) {
            this.knockbackTimer = 0.5;
            
            // 击退靠近的敌人
            for (const e of window.Game.enemies) {
                if (e.dead) continue;
                const d = this.dist(e);
                if (d < 80) {
                    const angle = Math.atan2(e.y - this.y, e.x - this.x);
                    const force = 200;
                    e.pushX = Math.cos(angle) * force;
                    e.pushY = Math.sin(angle) * force;
                    
                    // 击退粒子
                    window.Game.particles.push(new Particle(e.x, e.y, '#f1c40f', 0.3, 4));
                }
            }
        }
    }
    
    // ========== 风火轮 - 移动留下火焰轨迹 ==========
    updateFenghuoLun(dt, player) {
        this.fireTrailTimer -= dt;
        const baseDmg = player.stats?.dmg || 10;
        
        // 清理过期火焰
        this.fireTrails = this.fireTrails.filter(t => t.life > 0);
        this.fireTrails.forEach(t => {
            t.life -= dt;
            // 火焰伤害（伤害为玩家伤害的 20%）
            t.dmgTimer -= dt;
            if (t.dmgTimer <= 0) {
                t.dmgTimer = 0.3;
                const trailDmg = Math.floor(baseDmg * 0.2);
                for (const e of window.Game.enemies) {
                    if (e.dead) continue;
                    const d = Math.hypot(e.x - t.x, e.y - t.y);
                    if (d < 30) {
                        e.takeDamage(trailDmg, 0, 0, 'fire');
                    }
                }
            }
        });
        
        // 移动时留下火焰
        const isMoving = Math.abs(player.vx || 0) > 10 || Math.abs(player.vy || 0) > 10;
        if (isMoving && this.fireTrailTimer <= 0) {
            this.fireTrailTimer = 0.1;
            this.fireTrails.push({
                x: player.x,
                y: player.y + 20,
                life: 2.0,
                dmgTimer: 0
            });
        }
    }
    
    // ========== 定海神珠 - 敌人减速光环 ==========
    updateDinghaiZhu(dt, player) {
        const slowRadius = 120; // 与绘制范围保持一致
        
        for (const e of window.Game.enemies) {
            if (e.dead) continue;
            const d = this.dist(e);
            if (d < slowRadius) {
                e.slowTimer = 0.2;
                // 偶尔显示减速粒子（降低频率）
                if (Math.random() < dt) {
                    window.Game.particles.push(new Particle(e.x, e.y, '#2196f3', 0.2, 2));
                }
            }
        }
    }
    
    // ========== 主动触发效果 ==========
    trigger(player) {
        const baseDmg = player.stats?.dmg || 10;
        
        switch (this.id) {
            case 'fantian':
                // 虚天鼎 - 震晕全场（伤害为玩家伤害的 200%）
                window.Game.screenShake(2.0);
                const dingDmg = Math.floor(baseDmg * 2);
                window.Game.enemies.forEach(e => {
                    e.takeDamage(dingDmg, 0, 0, 'earth', 2.0);
                    e.slowTimer = 3.0; 
                });
                window.Game.texts.push(new FloatText(player.x, player.y - 100, "虚天鼎!", "#f1c40f", true));
                break;
                
            case 'gourd':
                // 玄天斩灵 - 斩杀精英（伤害为玩家伤害的 1500%）
                const elites = window.Game.enemies.filter(e => e.isElite || e.isBoss);
                const target = elites.length > 0 ? elites[0] : null;
                if (target) {
                    window.Game.texts.push(new FloatText(player.x, player.y - 80, "玄天斩灵!", "#fff", true));
                    window.Game.particles.push(new Beam(player.x, player.y, target.x, target.y));
                    const gourdDmg = Math.floor(baseDmg * 15);
                    target.takeDamage(gourdDmg, 0, 0, 'sword'); 
                } else {
                    this.cd = 1.0; // 没有目标时缩短CD
                }
                break;
        }
    }
    
    // ========== 绘制 ==========
    draw(ctx) {
        const img = Assets[this.data.svg];
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        switch (this.id) {
            case 'zhuxian_array':
                this.drawZhuxianArray(ctx);
                break;
                
            case 'mirror':
                this.drawMirror(ctx, img);
                break;
                
            case 'qiankun_quan':
                this.drawQiankunQuan(ctx, img);
                break;
                
            case 'fenghuo_lun':
                this.drawFenghuoLun(ctx, img);
                break;
                
            case 'dinghai_zhu':
                this.drawDinghaiZhu(ctx, img);
                break;
                
            case 'fantian':
                // 虚天鼎 - 显示CD进度
                this.drawFantian(ctx, img);
                break;
                
            case 'gourd':
                // 玄天斩灵 - 显示CD进度
                this.drawGourd(ctx, img);
                break;
                
            default:
                // 被动型法宝也显示悬浮图标
                this.drawPassiveArtifact(ctx, img);
                break;
        }
        
        ctx.restore();
    }
    
    // 诛仙剑阵绘制
    drawZhuxianArray(ctx) {
        // 4把环绕的剑
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate(this.swordAngles[i]);
            ctx.translate(60, 0);
            ctx.rotate(Math.PI / 2);
            
            // 剑身
            ctx.fillStyle = '#00bcd4';
            ctx.fillRect(-3, -20, 6, 40);
            ctx.fillStyle = '#e1f5fe';
            ctx.fillRect(-1, -18, 2, 36);
            
            // 剑光
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#00bcd4';
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            ctx.restore();
        }
        
        // 中心阵法
        ctx.strokeStyle = '#00bcd4';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    
    // 乾蓝冰焰绘制
    drawMirror(ctx, img) {
        ctx.rotate(this.angle);
        ctx.translate(60, 0); 
        
        // 前方火焰区域
        ctx.fillStyle = 'rgba(255, 87, 34, 0.15)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 100, -Math.PI/2, Math.PI/2);
        ctx.fill();
        
        // 后方冰霜区域
        ctx.fillStyle = 'rgba(33, 150, 243, 0.15)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 100, Math.PI/2, 3*Math.PI/2);
        ctx.fill();
        
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -20, -20, 40, 40);
        } else {
            // 后备绘制 - 镜子
            ctx.fillStyle = '#e0e0e0';
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#9e9e9e';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    // 乾坤圈绘制
    drawQiankunQuan(ctx, img) {
        // 旋转的金圈
        ctx.rotate(this.angle);
        
        // 外圈
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 70, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内圈光晕
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, 65, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // 法宝图标
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -15, -15, 30, 30);
        } else {
            // 后备绘制 - 金圈
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('圈', 0, 0);
        }
    }
    
    // 风火轮绘制
    drawFenghuoLun(ctx, img) {
        // 绘制火焰轨迹
        this.fireTrails.forEach(t => {
            if (t.life <= 0) return; // 跳过已消失的轨迹
            ctx.save();
            ctx.translate(t.x - this.x, t.y - this.y);
            const lifeRatio = Math.max(0, t.life / 2.0);
            ctx.globalAlpha = lifeRatio;
            ctx.fillStyle = '#ff5722';
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(1, 15 * lifeRatio), 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(1, 8 * lifeRatio), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // 脚下的风火轮
        ctx.translate(0, 30);
        ctx.rotate(window.Game.playTime * 10);
        
        // 轮子
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        // 火焰
        for (let i = 0; i < 8; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 4);
            ctx.fillStyle = i % 2 === 0 ? '#ff5722' : '#ffeb3b';
            ctx.beginPath();
            ctx.moveTo(20, -5);
            ctx.lineTo(35, 0);
            ctx.lineTo(20, 5);
            ctx.fill();
            ctx.restore();
        }
    }
    
    // 定海神珠绘制
    drawDinghaiZhu(ctx, img) {
        const radius = 120; // 光环半径（从200减小到120）
        
        // 减速光环
        ctx.globalAlpha = 0.08 + Math.sin(window.Game.playTime * 3) * 0.03;
        ctx.fillStyle = '#2196f3';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        
        // 悬浮的神珠（移到角色旁边）
        const hover = Math.sin(window.Game.playTime * 2) * 6;
        ctx.translate(45, -50 + hover);
        
        // 珠子光晕
        ctx.fillStyle = '#2196f3';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // 珠子
        const grad = ctx.createRadialGradient(-3, -3, 0, 0, 0, 14);
        grad.addColorStop(0, '#e1f5fe');
        grad.addColorStop(0.5, '#2196f3');
        grad.addColorStop(1, '#0d47a1');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(-4, -4, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 虚天鼎绘制 - 显示CD进度环
    drawFantian(ctx, img) {
        const hover = Math.sin(window.Game.playTime * 2) * 8;
        ctx.translate(45, -55 + hover);
        
        // CD进度环
        if (this.maxCd > 0) {
            const progress = 1 - (this.cd / this.maxCd);
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 22, -Math.PI/2, -Math.PI/2 + progress * Math.PI * 2);
            ctx.stroke();
        }
        
        // 鼎图标
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -18, -18, 36, 36);
        } else {
            // 后备绘制 - 鼎
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.moveTo(-12, 10);
            ctx.lineTo(-15, 0);
            ctx.lineTo(-10, -10);
            ctx.lineTo(10, -10);
            ctx.lineTo(15, 0);
            ctx.lineTo(12, 10);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(-3, -15, 6, 6);
        }
    }
    
    // 玄天斩灵绘制 - 葫芦带CD
    drawGourd(ctx, img) {
        const hover = Math.sin(window.Game.playTime * 2) * 8;
        ctx.translate(45, -55 + hover);
        
        // CD进度环
        if (this.maxCd > 0) {
            const progress = 1 - (this.cd / this.maxCd);
            ctx.strokeStyle = '#9c27b0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 22, -Math.PI/2, -Math.PI/2 + progress * Math.PI * 2);
            ctx.stroke();
        }
        
        // 葫芦图标
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -15, -20, 30, 40);
        } else {
            // 后备绘制 - 葫芦
            ctx.fillStyle = '#9c27b0';
            ctx.beginPath();
            ctx.arc(0, 8, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, -5, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#7b1fa2';
            ctx.fillRect(-2, -15, 4, 8);
        }
    }
    
    // 被动型法宝绘制 - 半透明悬浮图标
    drawPassiveArtifact(ctx, img) {
        const hover = Math.sin(window.Game.playTime * 2) * 6;
        ctx.translate(45, -50 + hover);
        
        // 半透明效果表示被动
        ctx.globalAlpha = 0.7;
        
        // 光晕
        ctx.fillStyle = this.getArtifactColor();
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.7;
        
        // 图标
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -18, -18, 36, 36);
        } else {
            // 后备绘制 - 通用法宝图标
            const color = this.getArtifactColor();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('宝', 0, 0);
        }
        
        ctx.globalAlpha = 1;
    }
    
    // 获取法宝主题色
    getArtifactColor() {
        switch (this.id) {
            case 'jinjiao_jian': return '#f1c40f';  // 金色
            case 'xuanwu_dun': return '#4caf50';    // 绿色
            case 'jubao_pen': return '#f39c12';     // 橙金色
            default: return '#fff';
        }
    }
}

export class Beam extends Entity {
    constructor(x1, y1, x2, y2) {
        super(x1, y1);
        this.x2 = x2; this.y2 = y2;
        this.life = 0.5;
    }
    update(dt) { this.life -= dt; if (this.life <= 0) this.dead = true; }
    draw(ctx) {
        const w = this.life * 20;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.life*2})`;
        ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x2, this.y2); ctx.stroke();
        ctx.strokeStyle = `rgba(200, 240, 255, ${this.life})`;
        ctx.lineWidth = w * 2;
        ctx.stroke();
        ctx.restore();
    }
}

export class Puppet extends Entity {
    constructor(x, y, owner, stats) {
        super(x, y);
        this.owner = owner;
        this.stats = stats;
        this.life = (stats.bulletLife || 5) * 2; // 存在时间比子弹长
        this.speed = (stats.bulletSpeed || 150) * 0.5; // 移动速度
        this.dmg = stats.dmg || 10;
        this.dead = false;
        this.target = null;
        this.attackTimer = 0;
        this.attackInterval = 0.5; // 攻击间隔
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.dead = true;
            return;
        }

        // 寻找目标
        if (!this.target || this.target.dead || this.dist(this.target) > 400) {
            this.target = collisionManager.findNearestEnemy(this.x, this.y, 400);
        }

        if (this.target) {
            // 追击
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;

            // 攻击
            if (this.dist(this.target) < 30) {
                if (this.attackTimer <= 0) {
                    this.target.takeDamage(this.dmg, Math.cos(angle), Math.sin(angle), 'ghost');
                    this.attackTimer = this.attackInterval;
                    // 攻击特效
                    window.Game.particles.push(new Particle(this.target.x, this.target.y, '#4a148c', 0.5, 5));
                }
            }
        } else {
            // 跟随主人
            const distToOwner = this.dist(this.owner);
            if (distToOwner > 80) {
                const angle = Math.atan2(this.owner.y - this.y, this.owner.x - this.x);
                this.x += Math.cos(angle) * this.speed * 1.5 * dt;
                this.y += Math.sin(angle) * this.speed * 1.5 * dt;
            }
        }

        if (this.attackTimer > 0) this.attackTimer -= dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 幽灵浮动效果
        const floatY = Math.sin(window.Game.playTime * 5) * 5;
        ctx.translate(0, floatY);

        // 绘制幽灵
        ctx.globalAlpha = 0.7;
        
        // 身体
        ctx.fillStyle = '#4a148c';
        ctx.beginPath();
        ctx.arc(0, 0, 10, Math.PI, 0); // 上半圆
        ctx.lineTo(10, 15);
        ctx.lineTo(5, 10);
        ctx.lineTo(0, 15);
        ctx.lineTo(-5, 10);
        ctx.lineTo(-10, 15);
        ctx.closePath();
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        ctx.arc(4, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        // 光环
        ctx.strokeStyle = '#7c43bd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 15 + Math.sin(window.Game.playTime * 10) * 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

export class Lightning extends Entity {
    constructor(x1, y1, x2, y2) {
        this.path = [];
        this.life = 0.2; 
        this.maxLife = 0.2;
        this.generate(x1, y1, x2, y2);
        this.dead = false;
    }
    generate(x1, y1, x2, y2) {
        const d = Math.hypot(x2-x1, y2-y1);
        const steps = Math.max(3, Math.floor(d / 20)); 
        this.path.push({x:x1, y:y1});
        const nx = -(y2-y1)/d;
        const ny = (x2-x1)/d;
        for(let i=1; i<steps; i++) {
            const t = i/steps;
            const jitter = (Math.random()-0.5) * 40; 
            this.path.push({
                x: x1 + (x2-x1)*t + nx*jitter,
                y: y1 + (y2-y1)*t + ny*jitter
            });
        }
        this.path.push({x:x2, y:y2});
    }
    update(dt) {
        this.life -= dt;
        if(this.life <= 0) this.dead = true;
    }
    draw(ctx) {
        if(this.dead) return;
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#bf55ec'; ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for(let i=1; i<this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`; ctx.lineWidth = 3; ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(224, 176, 255, ${alpha})`; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
    }
}

export class Particle {
    constructor(x,y,c,l,s, g=0) { 
        this.reset(x,y,c,l,s,g);
    }
    
    /**
     * 重置粒子状态（供对象池复用）
     */
    reset(x,y,c,l,s, g=0) {
        this.x=x; this.y=y; this.c=c; this.life=l; this.maxL=l; this.size=s; this.g=g;
        this.dead = false;
        const ang = Math.random()*Math.PI*2; const spd = Math.random()*100;
        this.vx=Math.cos(ang)*spd; this.vy=Math.sin(ang)*spd; 
    }
    
    update(dt) { 
        this.life-=dt; if(this.life<=0) this.dead=true; 
        this.vy += this.g * dt;
        this.x+=this.vx*dt; this.y+=this.vy*dt; 
    }
    draw(ctx) { ctx.globalAlpha=this.life/this.maxL; ctx.fillStyle=this.c; ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
}

export class Orb extends Entity {
    constructor(x,y,v) { super(x,y); this.val=v; }
    update(dt,p) {
        const d=this.dist(p);
        
        // Magnetism (Drift)
        if(d < 200) {
            const a=Math.atan2(p.y-this.y, p.x-this.x);
            this.x+=Math.cos(a)*150*dt; 
            this.y+=Math.sin(a)*150*dt;
        }

        // Pickup (Snap)
        if(d<p.stats.area) {
            const s=400+(500/(d+1)); const a=Math.atan2(p.y-this.y, p.x-this.x);
            this.x+=Math.cos(a)*s*dt; this.y+=Math.sin(a)*s*dt;
            if(d<20) { this.dead=true; p.gainExp(this.val); }
        }
    }
    draw(ctx) { ctx.save(); ctx.translate(this.x,this.y); const s=1+Math.sin(window.Game.playTime*10)*0.3; ctx.scale(s,s); ctx.fillStyle='#2ecc71'; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill(); ctx.restore(); }
}

export class Chest extends Entity {
    constructor(x, y) { super(x, y); }
    update(dt, p) {
        if (this.dist(p) < 50) { 
            this.dead = true;
            window.Game.openChest(this.x, this.y);
        }
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        const s = 1 + Math.sin(window.Game.playTime * 5) * 0.1;
        ctx.scale(s, s);
        
        const img = Assets['chest'];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -24, -24, 48, 48);
        } else {
            // 后备绘制 - 宝箱
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(-18, -12, 36, 24);
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(-15, -10, 30, 20);
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-3, -5, 6, 10);
        }
        
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor='#f1c40f'; ctx.shadowBlur=20;
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(window.Game.playTime*10)*0.2})`;
        ctx.beginPath(); ctx.arc(0,0,35,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }
}

export class FloatText extends Entity {
    constructor(x,y,t,c, crit=false) { 
        super(x,y); this.txt=t; this.c=c; this.life=0.8; this.crit=crit;
        this.vy = -100; 
        this.scale = 0.5;
        if(crit) { this.vy = -200; this.life = 1.2; }
    }
    update(dt) { 
        this.y += this.vy * dt; 
        this.vy += 500 * dt; // Gravity
        this.life-=dt; if(this.life<=0) this.dead=true; 
        
        if (this.life > 0.6) this.scale += dt * 5; // Pop up
        else this.scale -= dt; // Shrink
    }
    draw(ctx) { 
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha=Math.min(1, this.life*2); 
        ctx.fillStyle=this.c; 
        ctx.font= this.crit ? "bold 40px Arial" : "bold 24px Arial"; 
        if(this.crit) {
            ctx.shadowColor = this.c;
            ctx.shadowBlur = 10;
        }
        ctx.strokeStyle='black';
        ctx.lineWidth=2;
        ctx.strokeText(this.txt, 0, 0);
        ctx.fillText(this.txt, 0, 0); 
        ctx.restore();
    }
}

export class Footprint extends Entity {
    constructor(x, y, angle) {
        super(x, y);
        this.rotation = angle;
        this.life = 3.0;
        this.maxLife = 3.0;
    }
    update(dt) { this.life -= dt; if(this.life<=0) this.dead=true; }
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
}

export class StaticObject extends Entity {
    constructor(x, y, type) {
        super(x, y);
        this.type = type;
        this.img = type;
    }
    update(dt, p) {
        // Static visual only
    }
    draw(ctx) {
        const img = Assets[this.img];
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Simple shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(0, 20, 15, 8, 0, 0, Math.PI*2); ctx.fill();
        
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -img.width/2, -img.height/2);
        } else {
            // 后备绘制 - 静态物体
            this.drawFallback(ctx);
        }
        ctx.restore();
    }
    
    // 后备绘制
    drawFallback(ctx) {
        if (this.img.includes('tree')) {
            // 树
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(-5, -30, 10, 50);
            ctx.fillStyle = '#2e7d32';
            ctx.beginPath();
            ctx.arc(0, -40, 25, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.img.includes('rock') || this.img.includes('stone')) {
            // 石头
            ctx.fillStyle = '#757575';
            ctx.beginPath();
            ctx.moveTo(-15, 10);
            ctx.lineTo(-20, -5);
            ctx.lineTo(-10, -15);
            ctx.lineTo(10, -15);
            ctx.lineTo(20, -5);
            ctx.lineTo(15, 10);
            ctx.closePath();
            ctx.fill();
        } else if (this.img.includes('stele')) {
            // 石碑
            ctx.fillStyle = '#616161';
            ctx.fillRect(-10, -40, 20, 50);
            ctx.fillStyle = '#9e9e9e';
            ctx.fillRect(-8, -38, 16, 45);
        } else {
            // 默认方块
            ctx.fillStyle = '#795548';
            ctx.fillRect(-15, -20, 30, 30);
        }
    }
}
