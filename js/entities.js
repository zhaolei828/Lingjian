import { Assets } from './assets.js';
import { ROLES, ARTIFACTS } from './data.js';

export class Entity { 
    constructor(x,y) { this.x=x; this.y=y; this.dead=false; } 
    dist(o){ return Math.hypot(this.x-o.x, this.y-o.y); } 
}

export class Player extends Entity {
    constructor(roleId = 'sword') {
        super(0,0);
        const role = ROLES.find(r => r.id === roleId) || ROLES[0];
        this.role = role;
        
        this.hp = role.hp; 
        this.maxHp = role.hp; 
        this.speed = role.speed;
        
        this.exp=0; this.maxExp=10; this.lvl=1;
        this.stats = { 
            dmg: role.dmg, 
            area: 150, 
            count: 1, 
            cd: role.cd, 
            spd: 500, 
            element: 'sword', 
            pierce: 0,
            thunderProb: 0,
            knockback: 1.0,
            bulletSpeed: 500,
            bulletLife: 2.0,
            stun: false
        }; 
        
        if (roleId === 'mage') this.stats.element = 'fire';
        if (roleId === 'ghost') { this.stats.element = 'ghost'; this.stats.bulletSpeed = 300; this.stats.bulletLife = 3.0; }
        if (roleId === 'formation') { this.stats.element = 'formation'; this.stats.pierce = 99; this.stats.area = 1.0; this.stats.spd = 300; }
        
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

            this.x += (dx/l)*moveSpeed*dt; this.y += (dy/l)*moveSpeed*dt;
            if(dx) this.facing = dx;
            
            // Footprints
            this.footprintTimer -= dt;
            if(this.footprintTimer <= 0) {
                if ([0,1,3].includes(window.Game.stageIdx)) {
                    window.Game.footprints.push(new Footprint(this.x, this.y + 20, Math.atan2(dy, dx)));
                    this.footprintTimer = 0.2;
                }
            }
        }
        this.cdTimer-=dt;
        if(this.cdTimer<=0) {
            const t = this.findTarget();
            if(t) { this.fire(t); this.cdTimer = this.stats.cd; }
        }
    }
    findTarget() {
        let near=null, minD=600;
        for(let e of window.Game.enemies) { const d=this.dist(e); if(d<minD){minD=d; near=e;} }
        return near;
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
        
        // Shadow
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(0, 10, 20, 8, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        if (this.dashTime > 0) {
            ctx.save(); ctx.translate(this.x, this.y);
            ctx.globalAlpha = 0.5;
            ctx.scale(this.facing, 1);
            ctx.drawImage(Assets[this.role.svg], -32 - (Math.random()-0.5)*10, -32, 64, 64);
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
        
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.scale(this.facing, 1);
        ctx.drawImage(Assets[this.role.svg], -32, -32, 64, 64);
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
    gainExp(v){ this.exp+=v; if(this.exp>=this.maxExp) this.levelUp(); window.Game.updateUI(); }
    levelUp(){ this.lvl++; this.exp=0; this.maxExp=Math.floor(this.maxExp*1.4); this.hp=this.maxHp; this.lvlUpFx=1.0; window.showUpgradeMenu(); }
    hit(d){ 
        if(this.invulnTimer > 0) return;
        this.hp-=d; 
        this.invulnTimer = 0.3; // 0.3s i-frame
        window.Game.texts.push(new FloatText(this.x,this.y,"-"+Math.floor(d),'#e74c3c', true)); 
        window.Game.updateUI(); 
        window.Game.screenShake(0.3);
        if(this.hp<=0) window.Game.gameOver(); 
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
        this.hp-=v; 
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
             window.Game.texts.push(new FloatText(this.x, this.y-20*this.scale, Math.floor(v), c, crit));
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

        ctx.drawImage(Assets[this.img], -24, -24, 48, 48);

        if (this.hitFlashTimer > 0) {
            // Optimized Hit Flash: Use additive blending to brighten
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.8;
            ctx.drawImage(Assets[this.img], -24, -24, 48, 48);
            ctx.restore();
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
}

export class Bullet extends Entity {
    constructor(x, y, t, s) {
        super(x, y);
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
                     
                     for (let e of window.Game.enemies) {
                         if (this.dist(e) < (this.area || 80)) { // Slightly larger effective range
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
                 // Find new target
                  let near=null, minD=400;
                  for(let e of window.Game.enemies) { const d=this.dist(e); if(d<minD){minD=d; near=e;} }
                  if(near) this.target = near;
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

        for(let e of window.Game.enemies) {
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
    hit(e) {
        e.takeDamage(this.dmg, Math.cos(this.angle), Math.sin(this.angle), this.type);
        if (this.stun) e.slowTimer = 1.0; 
        
        // Mage AOE Explosion
        if(this.type === 'fire') {
            for(let other of window.Game.enemies) {
                 if (other !== e && this.dist(other) < (this.area || 120)) {
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
            ctx.drawImage(Assets['fire'], -16, -16, 32, 32);
        } else if(this.type === 'wood') {
             ctx.rotate(window.Game.playTime * 5);
             ctx.drawImage(Assets['leaf'], -12, -24, 24, 48);
        } else if(this.type === 'water') {
            ctx.drawImage(Assets['ice'], -16, -16, 32, 32);
        } else if(this.type === 'earth') {
            ctx.rotate(window.Game.playTime * 2);
            ctx.drawImage(Assets['rock_b'], -20, -20, 40, 40);
        } else if(this.type === 'ghost') {
             ctx.rotate(-Math.PI/2); 
             if (this.vx < 0) ctx.scale(1, -1); 
             // Ghost fire instead of wolf
             ctx.fillStyle = '#7b1fa2'; 
             ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
             ctx.fillStyle = '#e1bee7';
             ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill();
        } else {
            ctx.drawImage(Assets['sword'], -10, -20, 20, 40);
        }
        ctx.restore();
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
    }
    update(dt, player) {
        this.x = player.x;
        this.y = player.y;
        
        if (this.maxCd > 0) {
            this.cd -= dt;
            if (this.cd <= 0) {
                this.trigger(player);
                this.cd = this.maxCd;
            }
        }
        
        if (this.id === 'mirror') {
            this.angle += dt * 2; 
            for (let e of window.Game.enemies) {
                const d = this.dist(e);
                if (d < 150) { 
                    const angToEnemy = Math.atan2(e.y - this.y, e.x - this.x);
                    let diff = angToEnemy - this.angle;
                    while (diff > Math.PI) diff -= Math.PI*2;
                    while (diff < -Math.PI) diff += Math.PI*2;
                    
                    if (Math.abs(diff) < Math.PI/2) {
                        // Continuous damage logic improved:
                        // Instead of random tiny damage, use a timer to tick damage
                        // Fire Aura (Front)
                        if (!e.burnTick) e.burnTick = 0;
                        e.burnTick -= dt;
                        if (e.burnTick <= 0) {
                             e.takeDamage(10, 0, 0, 'fire'); // Fixed integer damage
                             window.Game.particles.push(new Particle(e.x, e.y, '#e74c3c', 0.3, 2));
                             e.burnTick = 0.2; // 5 ticks per second
                        }
                    } else {
                        // Ice Aura (Back) - Slow
                        e.slowTimer = 0.2;
                        if (Math.random() < dt * 5) { // Visuals can be random
                            window.Game.particles.push(new Particle(e.x, e.y, '#3498db', 0.3, 2));
                        }
                        // Also deal some small ice damage occasionally?
                        // Let's keep it just slow for now as per description, or small damage
                    }
                }
            }
        }
    }
    trigger(player) {
        if (this.id === 'fantian') {
            window.Game.screenShake(2.0);
            window.Game.enemies.forEach(e => {
                e.takeDamage(50, 0, 0, 'earth', 2.0);
                e.slowTimer = 3.0; 
            });
            window.Game.texts.push(new FloatText(player.x, player.y - 100, "翻天印!", "#f1c40f", true));
        } else if (this.id === 'gourd') {
            const elites = window.Game.enemies.filter(e => e.isElite);
            const target = elites.length > 0 ? elites[0] : null;
            if (target) {
                window.Game.texts.push(new FloatText(player.x, player.y - 80, "请宝贝转身!", "#fff", true));
                window.Game.particles.push(new Beam(player.x, player.y, target.x, target.y));
                target.takeDamage(500, 0, 0, 'sword'); 
            } else {
                this.cd = 1.0;
            }
        }
    }
    draw(ctx) {
        const img = Assets[this.data.svg];
        if (!img) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.id === 'mirror') {
            ctx.rotate(this.angle);
            ctx.translate(60, 0); 
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0, 100, -Math.PI/2, Math.PI/2); ctx.fill();
            ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
            ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0, 100, Math.PI/2, 3*Math.PI/2); ctx.fill();
        } else {
            const hover = Math.sin(window.Game.playTime * 2) * 10;
            ctx.translate(40, -60 + hover);
        }
        
        ctx.drawImage(img, -20, -20, 40, 40);
        ctx.restore();
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

export class Lightning {
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
        this.x=x; this.y=y; this.c=c; this.life=l; this.maxL=l; this.size=s; this.g=g;
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
        ctx.drawImage(Assets['chest'], -24, -24, 48, 48);
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
        if (img) {
            ctx.save();
            ctx.translate(this.x, this.y);
            // Simple shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.ellipse(0, img.height/2 - 5, img.width/3, img.height/8, 0, 0, Math.PI*2); ctx.fill();
            ctx.drawImage(img, -img.width/2, -img.height/2);
            ctx.restore();
        }
    }
}
