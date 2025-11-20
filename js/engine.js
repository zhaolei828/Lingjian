import { STAGES } from './data.js';
import { loadAssets } from './assets.js';
import { Player, Enemy, FloatText, Chest, StaticObject, Particle } from './entities.js';
import { generateStagePattern } from './map.js';
import { WeatherSystem } from './weather.js';

export class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.state = 'MENU';
        this.lastTime = 0;
        this.playTime = 0;
        this.score = 0;
        this.stageIdx = 0;
        this.eliteTimer = 0; 
        this.player = null;
        this.enemies = []; this.bullets = []; this.particles = []; this.orbs = []; this.texts = []; this.chests = []; this.staticObjects = [];
        this.camera = { x: 0, y: 0 };
        this.bgPattern = null;
        this.shake = 0; 
        this.keys = {};
        this.weather = new WeatherSystem();
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        this.resize();
        loadAssets();
        requestAnimationFrame(t => this.loop(t));
    }
    
    resize() { this.width=this.canvas.width=window.innerWidth; this.height=this.canvas.height=window.innerHeight; }
    
    start(stageIdx = 0) {
        this.player = new Player();
        this.enemies=[]; this.bullets=[]; this.particles=[]; this.orbs=[]; this.texts=[]; this.chests=[]; this.staticObjects=[];
        
        this.stageIdx = stageIdx;
        this.playTime = STAGES[stageIdx].time;
        this.score = 0; 
        this.eliteTimer = 0; 
        this.state='PLAY';
        
        // Compensate stats if skipping
        if (stageIdx > 0) {
             this.player.lvl = stageIdx * 3 + 1;
             this.player.stats.dmg += stageIdx * 15;
             this.player.hp = 100 + stageIdx * 20;
             this.player.maxHp = 100 + stageIdx * 20;
        }
        
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('gameover-menu').classList.add('hidden');
        this.updateUI();
        
        // Initialize Map Objects
        if (this.stageIdx === 0) this.initForest();
        else if (this.stageIdx === 4) this.initFairyland();
        
        this.bgPattern = this.ctx.createPattern(generateStagePattern(this.stageIdx), 'repeat');
        this.showStageTitle(STAGES[this.stageIdx].name);
    }
    
    loop(now) {
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        if (this.state === 'PLAY') { this.update(dt); this.draw(); }
        requestAnimationFrame(t => this.loop(t));
    }
    
    update(dt) {
        this.playTime += dt;
        this.eliteTimer += dt;
        if(this.shake > 0) this.shake -= dt * 10;
        
        // 关卡检测
        const nextStage = STAGES[this.stageIdx + 1];
        if (nextStage && this.playTime >= nextStage.time) {
            this.stageIdx++;
            this.showStageTitle(STAGES[this.stageIdx].name);
            this.bgPattern = this.ctx.createPattern(generateStagePattern(this.stageIdx), 'repeat');
            
            this.staticObjects = []; // Clear old objects
            if(this.stageIdx === 0) this.initForest();
            if(this.stageIdx === 4) this.initFairyland();

            // 进阶回血
            this.player.hp = Math.min(this.player.hp + 20, this.player.maxHp);
            this.updateUI();
        }

        // 刷怪
        const diff = 1 + this.playTime/60;
        if(Math.random() < dt / (1.5/diff)) this.spawnEnemy(diff);
        
        // 精英怪生成 (每45秒)
        if(this.eliteTimer > 45) {
            this.eliteTimer = 0;
            this.spawnElite(diff);
        }
        
        this.player.update(dt);
        
        // Boundary for Island Stages (0 & 4)
        if (this.stageIdx === 4 || this.stageIdx === 0) {
             const R = 600;
             const d = Math.hypot(this.player.x, this.player.y);
             if(d > R) {
                 const a = Math.atan2(this.player.y, this.player.x);
                 this.player.x = Math.cos(a)*R;
                 this.player.y = Math.sin(a)*R;
             }
        }
        
        // 相机跟随 + 震动
        let tx = this.player.x - this.width/2;
        let ty = this.player.y - this.height/2;
        this.camera.x += (tx - this.camera.x) * 5 * dt;
        this.camera.y += (ty - this.camera.y) * 5 * dt;
        
        this.enemies.forEach(e => e.update(dt, this.player));
        this.bullets.forEach(b => b.update(dt));
        this.particles.forEach(p => p.update(dt));
        this.orbs.forEach(o => o.update(dt, this.player));
        this.texts.forEach(t => t.update(dt));
        this.chests.forEach(c => c.update(dt, this.player));
        
        // 清理
        this.enemies = this.enemies.filter(e => !e.dead);
        this.bullets = this.bullets.filter(b => !b.dead);
        this.particles = this.particles.filter(p => !p.dead);
        this.orbs = this.orbs.filter(o => !o.dead);
        this.texts = this.texts.filter(t => !t.dead);
        this.chests = this.chests.filter(c => !c.dead);
        
        this.weather.update(dt, this.stageIdx, this.camera);

        document.getElementById('timer').innerText = this.formatTime(this.playTime);
    }
    
    initFairyland() {
        this.staticObjects = [];
        // Center Pavilion
        this.staticObjects.push(new StaticObject(0, -100, 'pavilion'));
        // Gate
        this.staticObjects.push(new StaticObject(0, 250, 'gate'));
        // Trees and Rocks
        for(let i=0; i<20; i++) {
            const a = Math.random()*Math.PI*2;
            const r = 150 + Math.random()*350;
            this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, Math.random()>0.6 ? 'pine' : 'stone_s'));
        }
    }

    initForest() {
        this.staticObjects = [];
        // Dense trees at edge (Forest Wall)
        for(let i=0; i<40; i++) {
             const a = Math.random() * Math.PI * 2;
             const r = 450 + Math.random() * 150; // 450-600
             this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, 'tree_forest'));
        }
        // Scattered bushes and stones inside
        for(let i=0; i<30; i++) {
             const a = Math.random() * Math.PI * 2;
             const r = Math.random() * 500;
             const type = Math.random() > 0.5 ? 'bush' : 'stone_s';
             this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, type));
        }
    }

    draw() {
        const ctx = this.ctx;
        const stage = STAGES[this.stageIdx];

        ctx.save();

        const is3D = (this.stageIdx === 0 || this.stageIdx === 4);

        if (is3D) {
             // --- 2.5D Island Scenes (Forest & Fairyland) ---
             
             let skyTop, skyBot, groundBase, groundSurf, drawFar;
             const tilt = 0.5;
             const zoom = 0.75;
             const R = 600;

             if (this.stageIdx === 4) {
                 // Fairyland Config
                 skyTop='#000000'; skyBot='#2c3e50';
                 groundBase='#37474f'; groundSurf='#ecf0f1';
                 drawFar = (w, h) => {
                    // Sun
                    ctx.fillStyle = '#e74c3c'; ctx.shadowColor = '#c0392b'; ctx.shadowBlur = 30;
                    ctx.beginPath(); ctx.arc(w/2, h*0.15, 60, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                    // Cone Islands
                    const drawCone = (cx, cy, cw, ch) => {
                        ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.moveTo(cx-cw/2, cy); ctx.bezierCurveTo(cx-cw/4, cy+ch, cx+cw/4, cy+ch, cx+cw/2, cy); ctx.fill();
                        ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.ellipse(cx, cy, cw/2, ch/5, 0, 0, Math.PI*2); ctx.fill();
                    };
                    drawCone(w*0.2, h*0.3, 120, 90); drawCone(w*0.8, h*0.25, 280, 180);
                 };
             } else {
                 // Forest Config
                 skyTop='#000500'; skyBot='#0f1519';
                 groundBase='#0b1013'; groundSurf='#1b5e20';
                 drawFar = (w, h) => {
                     // Moon maybe?
                     ctx.fillStyle = '#f1f8e9'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 20;
                     ctx.beginPath(); ctx.arc(w*0.8, h*0.15, 40, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                 };
             }
             
             // 1. Sky (Screen Space)
             const grad = ctx.createLinearGradient(0, 0, 0, this.height);
             grad.addColorStop(0, skyTop); grad.addColorStop(1, skyBot);
             ctx.fillStyle = grad; ctx.fillRect(0, 0, this.width, this.height);

             // 2. Far Objects (Screen Space)
             if(drawFar) drawFar(this.width, this.height);

             // 3. Ground Layer (Squashed)
             ctx.save();
             ctx.translate(this.width/2, this.height/2);
             ctx.scale(zoom, zoom * tilt); 
             ctx.translate(-this.width/2, -this.height/2);

             // Camera Shake
             let sx = (Math.random() - 0.5) * this.shake * 10;
             let sy = (Math.random() - 0.5) * this.shake * 10;
             ctx.translate(-this.camera.x + sx, -this.camera.y + sy);
             
             // Island Base
             ctx.fillStyle = groundBase; 
             ctx.beginPath();
             ctx.moveTo(-R, 0);
             ctx.bezierCurveTo(-R*0.4, R*2.5, R*0.4, R*2.5, R, 0);
             ctx.fill();
             
             // Base Texture
             ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 30;
             ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, R*2); ctx.stroke();
             
             // Island Surface
             ctx.fillStyle = groundSurf; 
             ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI*2); ctx.fill();

             // Pattern Clip
             ctx.save(); ctx.clip();
             if(this.bgPattern && this.stageIdx === 4) { 
                 ctx.globalAlpha = 0.5; ctx.fillStyle = this.bgPattern; ctx.fillRect(-R, -R, R*2, R*2); ctx.globalAlpha = 1.0;
             }
             // Simple Noise for Forest
             if(this.stageIdx === 0) {
                 ctx.globalAlpha = 0.1; ctx.fillStyle = '#000'; 
                 for(let i=0;i<20;i++) { ctx.beginPath(); ctx.arc((Math.random()-0.5)*R*2, (Math.random()-0.5)*R*2, 50, 0, Math.PI*2); ctx.fill(); }
                 ctx.globalAlpha = 1.0;
             }
             
             ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 10;
             ctx.beginPath(); ctx.arc(0, 0, R-5, 0, Math.PI*2); ctx.stroke();
             ctx.restore(); // End Clip
             ctx.restore(); // End Ground Transform
             
             // 4. Entity Layer (Standing Up)
             ctx.save();
             ctx.translate(this.width/2, this.height/2);
             ctx.scale(zoom, zoom); 
             ctx.translate(-this.width/2, -this.height/2 * tilt); 
             
             ctx.translate(-this.camera.x + sx, (-this.camera.y + sy) * tilt);
             
             const drawBillboard = (list) => {
                 list.forEach(e => {
                     const oy = e.y;
                     e.y = e.y * tilt; // Project Y
                     e.draw(ctx);
                     e.y = oy; // Restore
                 });
             };
             
             // Sort by Y for depth (approximated by draw order of arrays usually, but better to sort static objects)
             this.staticObjects.sort((a,b) => a.y - b.y);

             drawBillboard(this.staticObjects);
             drawBillboard(this.orbs);
             drawBillboard(this.chests);
             drawBillboard(this.enemies);
             
             const py = this.player.y;
             this.player.y *= tilt;
             this.player.draw(ctx);
             this.player.y = py;
             
             ctx.globalCompositeOperation = 'lighter';
             drawBillboard(this.bullets);
             drawBillboard(this.particles); 
             ctx.globalCompositeOperation = 'source-over';
             
             // Weather (Needs to be billboarded or just drawn on top? Weather is screen-space-ish usually but follows camera)
             // The current context is Tilted. Weather particles x/y are world coordinates.
             // If we draw them here, they will be tilted.
             // Standard 2D draw uses ctx.translate(-camera).
             // Here we have ctx.translate(-camera * tilt).
             // We should probably draw weather logic as billboards if we want them "standing up" or flat?
             // Snow/Spores are volume.
             // Let's just draw them normally in this context. They will be squashed if we don't billboard.
             // Actually, WeatherSystem.draw uses ctx.fillRect or arc.
             // Let's just call it, and maybe it looks fine being squashed (perspective).
             this.weather.draw(ctx, this.camera);

             drawBillboard(this.texts);
             
             ctx.restore(); // End Entity Transform

        } else {
            // Standard 2D Render (Stages 1, 2, 3)
            let sx = (Math.random() - 0.5) * this.shake * 10;
            let sy = (Math.random() - 0.5) * this.shake * 10;
            ctx.translate(-this.camera.x + sx, -this.camera.y + sy);

            if (this.bgPattern) {
                ctx.fillStyle = this.bgPattern;
                ctx.fillRect(this.camera.x, this.camera.y, this.width, this.height);
            } else {
                ctx.fillStyle = stage.bg;
                ctx.fillRect(this.camera.x, this.camera.y, this.width, this.height);
            }
            
            ctx.strokeStyle = stage.grid; ctx.lineWidth = 2; ctx.globalAlpha = 0.3;
            const G = 100;
            const sx_grid = Math.floor(this.camera.x/G)*G;
            const sy_grid = Math.floor(this.camera.y/G)*G;
            ctx.beginPath();
            for(let x=sx_grid; x<this.camera.x+this.width; x+=G) { ctx.moveTo(x, this.camera.y); ctx.lineTo(x, this.camera.y+this.height); }
            for(let y=sy_grid; y<this.camera.y+this.height; y+=G) { ctx.moveTo(this.camera.x, y); ctx.lineTo(this.camera.x+this.width, y); }
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            
            this.staticObjects.forEach(o => o.draw(ctx));
            this.orbs.forEach(o => o.draw(ctx));
            this.chests.forEach(c => c.draw(ctx));
            this.enemies.forEach(e => e.draw(ctx));
            this.player.draw(ctx);
            
            ctx.globalCompositeOperation = 'lighter';
            this.bullets.forEach(b => b.draw(ctx));
            this.particles.forEach(p => p.draw(ctx));
            ctx.globalCompositeOperation = 'source-over';
            
            this.weather.draw(ctx, this.camera);
            this.texts.forEach(t => t.draw(ctx));
            ctx.restore();
        }
        
        // Low HP Vignette
        if (this.player.hp / this.player.maxHp < 0.3) {
            const ratio = this.player.hp / this.player.maxHp;
            const opacity = ((1 - ratio/0.3) * 0.5) + (Math.sin(this.playTime * 10) + 1) * 0.1;
            
            ctx.save();
            const grad = ctx.createRadialGradient(this.width/2, this.height/2, this.height/3, this.width/2, this.height/2, this.height);
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(1, `rgba(255, 0, 0, ${opacity})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        }
    }
    
    spawnEnemy(diff) {
        let x, y;
        // Island Stages (0:Forest, 4:Fairyland) - Spawn on Edge
        if (this.stageIdx === 4 || this.stageIdx === 0) {
            const a = Math.random() * Math.PI * 2;
            const r = 580; 
            x = Math.cos(a) * r;
            y = Math.sin(a) * r;
            // Spawn FX
            const color = (this.stageIdx === 0) ? '#1b5e20' : '#2c3e50';
            for(let i=0; i<5; i++) this.particles.push(new Particle(x, y, color, 0.5, 4));
        } else {
            // Standard: Off-screen
            const a = Math.random() * Math.PI * 2;
            const r = Math.max(this.width, this.height)/2 + 100;
            x = this.player.x + Math.cos(a)*r;
            y = this.player.y + Math.sin(a)*r;
        }
        
        const stage = STAGES[this.stageIdx];
        const type = stage.mobs[Math.floor(Math.random() * stage.mobs.length)];
        
        this.enemies.push(new Enemy(type, x, y, diff));
    }

    spawnElite(diff) {
        let x, y;
        if (this.stageIdx === 4 || this.stageIdx === 0) {
            const a = Math.random() * Math.PI * 2;
            const r = 550;
            x = Math.cos(a) * r;
            y = Math.sin(a) * r;
        } else {
            const a = Math.random() * Math.PI * 2;
            const r = Math.max(this.width, this.height)/2 + 100;
            x = this.player.x + Math.cos(a)*r;
            y = this.player.y + Math.sin(a)*r;
        }

        const stage = STAGES[this.stageIdx];
        const type = stage.mobs[Math.floor(Math.random() * stage.mobs.length)];
        
        this.enemies.push(new Enemy(type, x, y, diff, true)); 
        this.showStageTitle("强敌出现!");
        this.screenShake(1.0);
    }

    openChest(x, y) {
        const r = Math.random();
        if(r < 0.3) {
            this.player.hp = this.player.maxHp;
            this.texts.push(new FloatText(x, y, "气血全满!", "#2ecc71"));
        } else if (r < 0.6) {
            this.enemies.forEach(e => { if(!e.isElite) e.takeDamage(9999, 0, 0, 'sword'); });
            this.screenShake(2.0);
            this.texts.push(new FloatText(x, y, "万剑归一!", "#e74c3c"));
        } else {
            this.player.gainExp(this.player.maxExp - this.player.exp);
            this.texts.push(new FloatText(x, y, "顿悟飞升!", "#f1c40f"));
        }
    }
    
    formatTime(s) { return `${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`; }
    
    showStageTitle(text) {
        const d = document.createElement('div');
        d.style.position = 'absolute'; d.style.top='30%'; d.style.left='50%'; d.style.transform='translate(-50%, -50%)';
        d.style.fontSize = '60px'; d.style.color = '#f1c40f'; d.style.textShadow = '0 0 20px black';
        d.style.pointerEvents = 'none'; d.style.animation = 'float 3s ease-out';
        d.innerText = text;
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 3000);
    }

    updateUI() {
        const p = this.player;
        document.getElementById('hp-bar').style.width = (p.hp/p.maxHp*100)+'%';
        document.getElementById('exp-bar').style.width = (p.exp/p.maxExp*100)+'%';
        document.getElementById('kills').innerText = this.score;
        const r = ['练气','筑基','金丹','元婴','化神','渡劫'];
        document.getElementById('rank-name').innerText = r[Math.min(Math.floor((p.lvl-1)/3), r.length-1)];
        document.getElementById('rank-lvl').innerText = ((p.lvl-1)%3 + 1) + '层';
    }
    
    pause() { this.state = 'PAUSE'; document.getElementById('overlay').classList.remove('hidden'); }
    resume() { this.state = 'PLAY'; document.getElementById('overlay').classList.add('hidden'); this.lastTime=performance.now(); }
    gameOver() { this.state = 'OVER'; document.getElementById('final-score').innerText=`存活: ${this.formatTime(this.playTime)} | 击杀: ${this.score}`; document.getElementById('overlay').classList.remove('hidden'); document.getElementById('gameover-menu').classList.remove('hidden'); }
    
    screenShake(amount) { this.shake = amount; }
}
