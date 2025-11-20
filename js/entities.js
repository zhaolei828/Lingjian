import { Assets } from './assets.js';

export class Entity { 
    constructor(x,y) { this.x=x; this.y=y; this.dead=false; } 
    dist(o){ return Math.hypot(this.x-o.x, this.y-o.y); } 
}

export class Player extends Entity {
    constructor() {
        super(0,0);
        this.hp=100; this.maxHp=100; this.speed=250;
        this.exp=0; this.maxExp=10; this.lvl=1;
        // stats包含 element: 'sword'|'fire'|'thunder'|'wood'|'water'|'earth'
        this.stats = { dmg:20, area:150, count:1, cd:0.8, spd:500, element:'sword', pierce:0 }; 
        this.cdTimer=0; this.facing=1; this.lvlUpFx=0;
        
        // Dash stats
        this.dashCd = 0;
        this.dashMaxCd = 2.0;
        this.dashTime = 0;
    }
    update(dt) {
        this.dashCd -= dt;
        this.dashTime -= dt;

        let dx=0, dy=0;
        if(window.Game.keys['KeyW']||window.Game.keys['ArrowUp']) dy=-1;
        if(window.Game.keys['KeyS']||window.Game.keys['ArrowDown']) dy=1;
        if(window.Game.keys['KeyA']||window.Game.keys['ArrowLeft']) dx=-1;
        if(window.Game.keys['KeyD']||window.Game.keys['ArrowRight']) dx=1;
        
        // Dash Activation
        if (window.Game.keys['Space'] && this.dashCd <= 0 && (dx!==0 || dy!==0)) {
            this.dashCd = this.dashMaxCd;
            this.dashTime = 0.25; // 冲刺持续时间
            // 冲刺特效文字
            window.Game.texts.push(new FloatText(this.x, this.y - 40, "神行!", "#3498db"));
            // 冲刺无敌或特效粒子
            for(let i=0; i<5; i++) window.Game.particles.push(new Particle(this.x, this.y, '#fff', 0.5, 3));
        }

        if(dx||dy) {
            const l = Math.hypot(dx,dy);
            let moveSpeed = this.speed;
            if (this.dashTime > 0) moveSpeed *= 3.0; // 3倍速度

            this.x += (dx/l)*moveSpeed*dt; this.y += (dy/l)*moveSpeed*dt;
            if(dx) this.facing = dx;
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
        for(let i=0; i<this.stats.count; i++) {
            setTimeout(() => {
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
        const t = window.Game.playTime;
        
        // Dash Trail
        if (this.dashTime > 0) {
            ctx.save(); ctx.translate(this.x, this.y);
            ctx.globalAlpha = 0.5;
            ctx.scale(this.facing, 1);
            ctx.drawImage(Assets['player'], -32 - (Math.random()-0.5)*10, -32, 64, 64);
            ctx.restore();
        }

        ctx.save(); ctx.translate(this.x, this.y);
        let auraColor = '#f1c40f';
        if(this.stats.element === 'fire') auraColor = '#e74c3c';
        if(this.stats.element === 'thunder') auraColor = '#8e44ad';
        if(this.stats.element === 'wood') auraColor = '#2ecc71';
        if(this.stats.element === 'water') auraColor = '#3498db';
        if(this.stats.element === 'earth') auraColor = '#e67e22';
        
        ctx.rotate(t*0.5);
        ctx.beginPath(); ctx.arc(0,0,45,0,Math.PI*2);
        ctx.strokeStyle = auraColor; ctx.globalAlpha=0.3; ctx.lineWidth=2; ctx.setLineDash([15,25]); ctx.stroke();
        ctx.restore();
        
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.scale(this.facing, 1);
        ctx.drawImage(Assets['player'], -32, -32, 64, 64);
        ctx.restore();
        
        // Dash Cooldown Bar
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
    hit(d){ this.hp-=d; window.Game.texts.push(new FloatText(this.x,this.y,"-"+Math.floor(d),'#e74c3c')); window.Game.updateUI(); if(this.hp<=0) window.Game.gameOver(); }
}

export class Enemy extends Entity {
    constructor(type,x,y,diff,isElite=false) {
        super(x,y); this.type=type; this.isElite=isElite;
        if(type==='bat'){ this.hp=20*diff; this.speed=150; this.dmg=5; this.exp=5; this.img='bat'; }
        else if(type==='bat_fire'){ this.hp=30*diff; this.speed=180; this.dmg=8; this.exp=8; this.img='bat_fire'; }
        else if(type==='ghost'){ this.hp=40*diff; this.speed=100; this.dmg=10; this.exp=10; this.img='ghost'; }
        else if(type==='ghost_ice'){ this.hp=50*diff; this.speed=90; this.dmg=12; this.exp=15; this.img='ghost_ice'; }
        else { this.hp=100*diff; this.speed=60; this.dmg=20; this.exp=25; this.img='rock'; }
        
        if(isElite) {
            this.hp *= 5; this.dmg *= 1.5; this.exp *= 10;
            this.scale = 1.5;
        } else {
            this.scale = 1.0;
        }
        
        this.maxHp=this.hp; this.pushX=0; this.pushY=0;
        this.slowTimer = 0;
    }
    update(dt,p) {
        if(this.slowTimer>0) this.slowTimer-=dt;
        let spd = this.speed;
        if(this.slowTimer>0) spd *= 0.5; // 减速50%

        const a = Math.atan2(p.y-this.y, p.x-this.x);
        this.x += (Math.cos(a)*spd+this.pushX)*dt;
        this.y += (Math.sin(a)*spd+this.pushY)*dt;
        this.pushX*=0.9; this.pushY*=0.9;
        if(this.dist(p)<30*this.scale) p.hit(this.dmg*dt);
    }
    takeDamage(v, kx, ky, type) {
        this.hp-=v; 
        let force = 120;
        if(type === 'earth') force = 300; // 土系强击退
        if(this.isElite) force *= 0.2; // 精英怪抗击退
        
        this.pushX=kx*force; this.pushY=ky*force;
        
        let c = '#fff';
        if(type === 'fire') c = '#ff5722';
        if(type === 'thunder') c = '#ffeb3b';
        if(type === 'wood') c = '#2ecc71';
        if(type === 'water') c = '#3498db';
        if(type === 'earth') c = '#e67e22';
        window.Game.texts.push(new FloatText(this.x,this.y-20*this.scale,Math.floor(v), c));
        
        if(type === 'water') this.slowTimer = 2.0; // 冰冻减速

        if(this.hp<=0) {
            this.dead=true; window.Game.score++; 
            window.Game.updateUI();
            if(type==='fire') window.Game.screenShake(0.5);
            
            if(this.isElite) {
                window.Game.chests.push(new Chest(this.x, this.y));
                window.Game.screenShake(2.0);
                window.Game.texts.push(new FloatText(this.x, this.y-50, "精英击杀!", "#f1c40f"));
            } else {
                window.Game.orbs.push(new Orb(this.x,this.y,this.exp)); 
            }
        }
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        if(window.Game.player.x<this.x) ctx.scale(-1,1);
        
        // 精英怪光环
        if(this.isElite) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 5, 25, 0, Math.PI*2); ctx.stroke();
            ctx.restore();
        }

        ctx.drawImage(Assets[this.img], -24, -24, 48, 48);
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
        this.vx = Math.cos(a)*s.spd; this.vy = Math.sin(a)*s.spd;
        this.life = 2.0; this.dmg = s.dmg; this.angle = a;
        this.pierce = s.pierce || 0; // 穿透次数
        this.hitList = []; 
        
        if(this.type === 'earth') { this.life = 3.0; this.dmg *= 1.5; }
    }
    update(dt) {
        this.life-=dt; if(this.life<=0) this.dead=true;
        this.x+=this.vx*dt; this.y+=this.vy*dt;
        
        if(this.type === 'fire') {
            if(Math.random()>0.2) window.Game.particles.push(new Particle(this.x,this.y,'#ff5722',0.5, 5));
        } else if (this.type === 'water') {
             if(Math.random()>0.5) window.Game.particles.push(new Particle(this.x,this.y,'#e1f5fe',0.3, 3));
        } else if (this.type === 'thunder') {
             // Keep compatible for fallback logic
             window.Game.particles.push(new Particle(this.x,this.y,'#fff',0.2, 2));
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
        
        if(this.type === 'fire') {
            for(let i=0; i<10; i++) window.Game.particles.push(new Particle(this.x,this.y,'#ff9800', 0.6, 8));
        } else if(this.type === 'water') {
            for(let i=0; i<5; i++) window.Game.particles.push(new Particle(this.x,this.y,'#b3e5fc', 0.4, 5));
        } else if(this.type === 'earth') {
             window.Game.screenShake(0.2);
             for(let i=0; i<8; i++) window.Game.particles.push(new Particle(this.x,this.y,'#795548', 0.5, 6));
        } else {
            window.Game.particles.push(new Particle(this.x,this.y,'#fff',0.2, 6));
        }
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
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
        } else {
            ctx.drawImage(Assets['sword'], -10, -20, 20, 40);
        }
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
    constructor(x,y,c,l,s) { 
        this.x=x; this.y=y; this.c=c; this.life=l; this.maxL=l; this.size=s; 
        const ang = Math.random()*Math.PI*2; const spd = Math.random()*100;
        this.vx=Math.cos(ang)*spd; this.vy=Math.sin(ang)*spd; 
    }
    update(dt) { this.life-=dt; if(this.life<=0) this.dead=true; this.x+=this.vx*dt; this.y+=this.vy*dt; }
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
    constructor(x,y,t,c) { super(x,y); this.txt=t; this.c=c; this.life=0.8; }
    update(dt) { this.y-=50*dt; this.life-=dt; if(this.life<=0) this.dead=true; }
    draw(ctx) { ctx.globalAlpha=this.life; ctx.fillStyle=this.c; ctx.font="bold 24px Arial"; ctx.fillText(this.txt,this.x,this.y); ctx.globalAlpha=1; }
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
