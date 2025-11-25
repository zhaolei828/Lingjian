import { STAGES, ARTIFACTS } from './data.js';
import { loadAssets } from './assets.js';
import { Player, Enemy, FloatText, Chest, StaticObject, Particle, Artifact, Beam, Footprint } from './entities.js';
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
        this.artifact = null;
        this.enemies = []; this.bullets = []; this.particles = []; this.orbs = []; this.texts = []; this.chests = []; this.staticObjects = [];
        this.footprints = [];
        this.edgeDecorations = [];
        this.camera = { x: 0, y: 0 };
        this.bgPattern = null;
        this.shake = 0; 
        this.keys = {};
        this.weather = new WeatherSystem();
        
        this.freezeTimer = 0; // For Hit Stop
        this.hitStopCooldown = 0; // Cooldown for Hit Stop
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        this.resize();
        loadAssets();
        requestAnimationFrame(t => this.loop(t));
    }
    
    resize() { this.width=this.canvas.width=window.innerWidth; this.height=this.canvas.height=window.innerHeight; }
    
    start(stageIdx = 0, roleId = 'sword') {
        this.player = new Player(roleId);
        const randArtifact = ARTIFACTS[Math.floor(Math.random() * ARTIFACTS.length)];
        this.artifact = new Artifact(randArtifact.id);
        
        this.enemies=[]; this.bullets=[]; this.particles=[]; this.orbs=[]; this.texts=[]; this.chests=[]; this.staticObjects=[];
        this.footprints = [];
        
        this.stageIdx = stageIdx;
        this.playTime = STAGES[stageIdx].time;
        this.score = 0; 
        this.eliteTimer = 0; 
        this.state='PLAY';
        
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
        
        this.initStageMap();
        
        this.bgPattern = this.ctx.createPattern(generateStagePattern(this.stageIdx), 'repeat');
        this.showStageTitle(STAGES[this.stageIdx].name);
    }
    
    loop(now) {
        let dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        
        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
            dt = 0; // Freeze logic for impact
        }

        if (this.state === 'PLAY') { this.update(dt); this.draw(); }
        requestAnimationFrame(t => this.loop(t));
    }
    
    hitStop(duration) {
        if (this.hitStopCooldown <= 0) {
            this.freezeTimer = duration;
            this.hitStopCooldown = 0.1; // Don't freeze again for 100ms
        }
    }

    update(dt) {
        this.playTime += dt;
        this.eliteTimer += dt;
        if(this.shake > 0) this.shake -= dt * 10;
        if(this.hitStopCooldown > 0) this.hitStopCooldown -= dt;
        
        const nextStage = STAGES[this.stageIdx + 1];
        if (nextStage && this.playTime >= nextStage.time) {
            this.stageIdx++;
            this.showStageTitle(STAGES[this.stageIdx].name);
            this.bgPattern = this.ctx.createPattern(generateStagePattern(this.stageIdx), 'repeat');
            
            this.initStageMap();

            this.player.hp = Math.min(this.player.hp + 20, this.player.maxHp);
            this.updateUI();
        }

        const diff = 1 + this.playTime/60;
        if(Math.random() < dt / (1.5/diff)) this.spawnEnemy(diff);
        
        if(this.eliteTimer > 45) {
            this.eliteTimer = 0;
            this.spawnElite(diff);
        }
        
        this.player.update(dt);
        if (this.artifact) this.artifact.update(dt, this.player);
        
        const R = 600;
        const d = Math.hypot(this.player.x, this.player.y);
        if(d > R) {
            const a = Math.atan2(this.player.y, this.player.x);
            this.player.x = Math.cos(a)*R;
            this.player.y = Math.sin(a)*R;
        }
        
        let tx = this.player.x - this.width/2;
        let ty = this.player.y - this.height * 1.2; 
        this.camera.x += (tx - this.camera.x) * 5 * dt;
        this.camera.y += (ty - this.camera.y) * 5 * dt;
        
        this.enemies.forEach(e => e.update(dt, this.player));
        this.bullets.forEach(b => b.update(dt));
        this.particles.forEach(p => p.update(dt));
        this.orbs.forEach(o => o.update(dt, this.player));
        this.texts.forEach(t => t.update(dt));
        this.chests.forEach(c => c.update(dt, this.player));
        this.footprints.forEach(f => f.update(dt));
        
        this.enemies = this.enemies.filter(e => !e.dead);
        this.bullets = this.bullets.filter(b => !b.dead);
        this.particles = this.particles.filter(p => !p.dead);
        this.orbs = this.orbs.filter(o => !o.dead);
        this.texts = this.texts.filter(t => !t.dead);
        this.chests = this.chests.filter(c => !c.dead);
        this.footprints = this.footprints.filter(f => !f.dead);
        
        this.weather.update(dt, this.stageIdx, this.camera);

        document.getElementById('timer').innerText = this.formatTime(this.playTime);
    }

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
    
    // Optimized Map Ecology: Map-specific mob pools
    spawnEnemy(diff) {
        let x, y;
        const a = Math.random() * Math.PI * 2;
        const r = 580; 
        x = Math.cos(a) * r;
        y = Math.sin(a) * r;
        
        const colors = ['#1b5e20', '#7f8c8d', '#ff5722', '#4fc3f7', '#2c3e50'];
        for(let i=0; i<5; i++) this.particles.push(new Particle(x, y, colors[this.stageIdx]||'#000', 0.5, 4));
        
        // Ecology Logic:
        // Forest (0): Bat (Wood/Poison), Rock (Earth)
        // Bone (1): Ghost (Soul), Skeleton/Rock (Bone)
        // Magma (2): Bat_Fire, Magma_Rock
        // Ice (3): Ghost_Ice, Ice_Rock
        // Fairy (4): All Elite Mix
        
        const stage = STAGES[this.stageIdx];
        // Use data-driven mob lists from STAGES
        let type = 'rock';
        if (stage && stage.mobs && stage.mobs.length > 0) {
            type = stage.mobs[Math.floor(Math.random() * stage.mobs.length)];
        }
        
        this.enemies.push(new Enemy(type, x, y, diff));
    }

    initEdgeDecorations() {
        this.edgeDecorations = [];
        const R = 600;
        const count = this.stageIdx === 0 ? 90 : 60; 
        
        for(let i=0; i<count; i++) {
            const angleBase = (i / count) * Math.PI * 2;
            const angle = angleBase + (Math.random()-0.5) * 0.1;
            const r = R - 5 + Math.random() * 15; 
            const size = 15 + Math.random() * 20;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            
            let type = 'rock'; 
            let color = '#555';
            
            switch(this.stageIdx) {
                case 0: 
                    type = 'bush';
                    color = Math.random()>0.5 ? '#2e7d32' : '#1b5e20';
                    if(Math.random() < 0.6) { 
                        this.edgeDecorations.push({ 
                            x, y, 
                            size: size, 
                            rotation: angle, 
                            type: 'vine', 
                            color: Math.random()>0.5 ? '#2e7d32' : '#388e3c',
                            length: 100 + Math.random() * 300, 
                            width: 2 + Math.random() * 6, 
                            swayOffset: Math.random() * 10,
                            twistFreq: 0.02 + Math.random() * 0.03, 
                            twistAmp: 5 + Math.random() * 10 
                        });
                    }
                    break;
                case 1: 
                    type = 'rock';
                    color = '#424242';
                    break;
                case 2: 
                    if(Math.random() < 0.2) {
                        type = 'lava_fall';
                        color = '#ff5722';
                        this.edgeDecorations.push({ 
                            x, y, 
                            rotation: angle, 
                            type: 'lava_fall', 
                            width: 20 + Math.random() * 30,
                            length: 100 + Math.random() * 200,
                            speed: 30 + Math.random() * 20 
                        });
                        continue; 
                    }
                    type = 'sharp';
                    color = '#3e2723';
                    break;
                case 3: 
                    type = 'ice';
                    color = 'rgba(225, 245, 254, 0.8)';
                    break;
                case 4: 
                    type = 'sand';
                    color = '#5c4a2a';
                    break;
                case 5: 
                    type = 'cloud';
                    color = '#cfd8dc';
                    break;
            }
            
            this.edgeDecorations.push({ x, y, size, rotation: Math.random()*Math.PI, type, color });
        }
    }
    
    initForest() {
        for(let i=0; i<40; i++) {
             const a = Math.random() * Math.PI * 2;
             const r = 450 + Math.random() * 150; 
             this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, 'tree_forest'));
        }
        for(let i=0; i<30; i++) {
             const a = Math.random() * Math.PI * 2;
             const r = Math.random() * 500;
             this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, Math.random()>0.5?'bush':'stone_s'));
        }
    }

    initBone() {
        for(let i=0; i<25; i++) {
             const a = Math.random() * Math.PI * 2;
             const r = 480 + Math.random() * 120; 
             const rand = Math.random();
             let type = 'stele_c';
             if(rand > 0.8) type = 'dead_tree';
             else if(rand > 0.6) type = 'spirit_banner';
             
             this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, type));
        }
        for(let i=0; i<40; i++) {
             const a = Math.random() * Math.PI * 2;
             const r = Math.random() * 500;
             const x = Math.cos(a)*r;
             const y = Math.sin(a)*r;
             
             if(Math.random() < 0.3) {
                 const m = new StaticObject(x, y, 'grave_mound');
                 this.staticObjects.push(m);
                 this.staticObjects.push(new StaticObject(x, y+15, 'stele_c'));
                 if(Math.random()<0.4) this.staticObjects.push(new StaticObject(x+40, y+10, 'spirit_banner'));
             } else {
                 let type = 'stele_c';
                 const rand = Math.random();
                 if(rand < 0.3) type = 'broken_sword';
                 else if(rand < 0.5) type = 'ruin_pillar';
                 else if(rand < 0.7) type = 'stele_c';
                 else type = 'grave_mound';
                 this.staticObjects.push(new StaticObject(x, y, type));
             }
        }
        for(let i=0; i<150; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * 550;
            const type = Math.random()>0.5 ? 'paper_money_r' : 'paper_money_s';
            const s = new StaticObject(Math.cos(a)*r, Math.sin(a)*r, type);
            s.rotation = Math.random() * Math.PI * 2; 
            this.staticObjects.push(s);
        }
    }

    initMagma() {
        // 边缘的熔岩石（装饰，无眼睛）
        for(let i=0; i<30; i++) {
             const a = Math.random() * Math.PI * 2;
             const r = 500 + Math.random() * 100; 
             this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, 'magma_rock_deco'));
        }
        // 场内的石头（装饰）
        for(let i=0; i<20; i++) {
             const a = Math.random() * Math.PI * 2;
             const r = Math.random() * 500;
             this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, Math.random()>0.5?'magma_rock_deco':'stone_s'));
        }
    }

    initIce() {
        // 边缘的水晶（装饰，无眼睛）
        for(let i=0; i<40; i++) {
             const a = Math.random() * Math.PI * 2;
             const r = 450 + Math.random() * 150; 
             this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, 'crystal_deco'));
        }
        // 场内的石头（装饰）
        for(let i=0; i<20; i++) {
             const a = Math.random() * Math.PI * 2;
             const r = Math.random() * 500;
             this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, Math.random()>0.6?'crystal_deco':'stone_s'));
        }
    }
    
    initBattlefield() {
        // 战场遗迹点缀 (少量)
        const wreckTypes = ['broken_sword', 'broken_blade', 'broken_spear', 'shield_round'];
        
        // 只放 8~10 件遗迹作为点缀
        for(let i=0; i<10; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 100 + Math.random() * 400;
            
            let type = wreckTypes[Math.floor(Math.random() * wreckTypes.length)];
            
            const obj = new StaticObject(Math.cos(a)*r, Math.sin(a)*r, type);
            obj.rotation = Math.random() * Math.PI * 2;
            this.staticObjects.push(obj);
        }
        
        // 1~2 辆战车残骸（稀有大件）
        if(Math.random() < 0.6) {
            const a = Math.random() * Math.PI * 2;
            const r = 200 + Math.random() * 250;
            const obj = new StaticObject(Math.cos(a)*r, Math.sin(a)*r, 'chariot_wreck');
            obj.rotation = Math.random() * Math.PI * 2;
            this.staticObjects.push(obj);
        }
        
        // 边缘的沙漠岩石
        for(let i=0; i<30; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 450 + Math.random() * 150;
            this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, 'stone_s'));
        }
        
        // 少量散落的小石块
        for(let i=0; i<12; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 80 + Math.random() * 350;
            this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, 'stone_s'));
        }
    }

    initFairyland() {
        this.staticObjects.push(new StaticObject(0, -100, 'pavilion'));
        this.staticObjects.push(new StaticObject(0, 250, 'gate'));
        for(let i=0; i<20; i++) {
            const a = Math.random()*Math.PI*2;
            const r = 150 + Math.random()*350;
            this.staticObjects.push(new StaticObject(Math.cos(a)*r, Math.sin(a)*r, Math.random()>0.6 ? 'pine' : 'stone_s'));
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.save();

        let skyTop, skyBot, groundBase, groundSurf, drawFar, patternColor;
        const tilt = 0.5;
        const zoom = 0.7;
        const R = 600;

        const drawDistantIsland = (bx, by, ox, oy, w, h, baseColor, topColor, decoType) => {
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
        };
        
        const drawEdgeDeco = (d) => {
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
        };

        switch(this.stageIdx) {
            case 0: 
                skyTop='#000500'; skyBot='#0f1519';
                groundBase='#0b1013'; groundSurf='#1b5e20';
                patternColor='#000';
                drawFar = (w, h) => {
                    const pX = this.camera.x * 0.1; const pY = this.camera.y * 0.1;
                    const sX = this.camera.x * 0.02; const sY = this.camera.y * 0.02;
                    ctx.fillStyle = '#f1f8e9'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
                    ctx.beginPath(); ctx.arc(w*0.85 - sX, h*0.15 - sY, 30, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                    drawDistantIsland(w*0.2, h*0.2, -pX, -pY, 120, 90, '#0b1013', '#1b5e20', 'tree');
                    drawDistantIsland(w*0.8, h*0.15, -pX, -pY, 180, 120, '#0b1013', '#1b5e20', 'tree');
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
                };
                break;
            case 1: 
                skyTop='#1a1a1a'; skyBot='#2c3e50';
                groundBase='#212121'; groundSurf='#424242';
                patternColor='#000';
                drawFar = (w, h) => {
                    const pX = this.camera.x * 0.1; const pY = this.camera.y * 0.1;
                    const sX = this.camera.x * 0.02; const sY = this.camera.y * 0.02;
                    drawDistantIsland(w*0.15, h*0.25, -pX, -pY, 100, 80, '#212121', '#424242', 'cross');
                    drawDistantIsland(w*0.75, h*0.15, -pX, -pY, 200, 150, '#212121', '#424242', 'cross');
                    ctx.fillStyle = '#cfd8dc'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 15;
                    ctx.beginPath(); ctx.arc(w*0.8 - sX, h*0.15 - sY, 50, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                };
                break;
            case 2: 
                skyTop='#210000'; skyBot='#3e2723';
                groundBase='#210000'; groundSurf='#3e2723';
                patternColor='#ff5722';
                drawFar = (w, h) => {
                    const pX = this.camera.x * 0.1; const pY = this.camera.y * 0.1;
                    drawDistantIsland(w*0.2, h*0.15, -pX, -pY, 150, 100, '#210000', '#3e2723', 'spike');
                    drawDistantIsland(w*0.85, h*0.2, -pX, -pY, 120, 140, '#210000', '#3e2723', 'spike');
                    ctx.fillStyle = 'rgba(0,0,0,0.2)';
                    ctx.beginPath(); ctx.arc(w/2 - this.camera.x*0.05, h - this.camera.y*0.05, w/2, 0, Math.PI*2); ctx.fill();
                };
                break;
            case 3: 
                skyTop='#0d47a1'; skyBot='#1976d2';
                groundBase='#0d47a1'; groundSurf='#64b5f6';
                patternColor='#e1f5fe';
                drawFar = (w, h) => {
                     const pX = this.camera.x * 0.1; const pY = this.camera.y * 0.1;
                     drawDistantIsland(w*0.25, h*0.1, -pX, -pY, 140, 110, '#0d47a1', '#64b5f6', 'crystal');
                     drawDistantIsland(w*0.8, h*0.2, -pX, -pY, 160, 100, '#0d47a1', '#64b5f6', 'crystal');
                };
                break;
            case 4: 
                skyTop='#2d2318'; skyBot='#5c4a2a'; // 暗沉暮色
                groundBase='#3e3626'; groundSurf='#5d5340'; // 昏黄土色
                patternColor='#2e261a';
                drawFar = (w, h) => {
                   const pX = this.camera.x * 0.1; const pY = this.camera.y * 0.1;
                   const sX = this.camera.x * 0.02; const sY = this.camera.y * 0.02;
                   
                   // 长河落日圆 (暗红圆日)
                   ctx.fillStyle = '#b7410e'; ctx.shadowColor = '#8b2e0b'; ctx.shadowBlur = 50;
                   ctx.beginPath(); ctx.arc(w*0.7 - sX, h*0.25 - sY, 70, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                   
                   // 大漠孤烟直 (笔直的烟柱)
                   ctx.save();
                   const smokeX = w*0.3 - pX*0.8;
                   const smokeBaseY = h*0.4 - pY*0.5;
                   // 烟柱主体
                   const smokeGrad = ctx.createLinearGradient(smokeX, smokeBaseY, smokeX, smokeBaseY - 300);
                   smokeGrad.addColorStop(0, 'rgba(40, 30, 20, 0.8)');
                   smokeGrad.addColorStop(1, 'rgba(80, 70, 60, 0)');
                   ctx.fillStyle = smokeGrad;
                   ctx.beginPath();
                   ctx.moveTo(smokeX - 2, smokeBaseY);
                   ctx.lineTo(smokeX + 2, smokeBaseY);
                   ctx.lineTo(smokeX + 10, smokeBaseY - 300); // 略微扩散
                   ctx.lineTo(smokeX - 10, smokeBaseY - 300);
                   ctx.fill();
                   ctx.restore();

                   // 远方的沙丘轮廓 (层峦叠嶂)
                   drawDistantIsland(w*0.1, h*0.25, -pX, -pY, 200, 120, '#2d2318', '#3e3626', 'spike');
                   drawDistantIsland(w*0.6, h*0.28, -pX, -pY, 250, 100, '#2d2318', '#3e3626', 'cross');
                   drawDistantIsland(w*0.9, h*0.22, -pX, -pY, 180, 90, '#2d2318', '#3e3626', 'spike');
                };
                break;
            case 5: 
                skyTop='#000000'; skyBot='#2c3e50';
                groundBase='#37474f'; groundSurf='#ecf0f1';
                patternColor=null; 
                drawFar = (w, h) => {
                   const pX = this.camera.x * 0.1; const pY = this.camera.y * 0.1;
                   const sX = this.camera.x * 0.02; const sY = this.camera.y * 0.02;
                   ctx.fillStyle = '#e74c3c'; ctx.shadowColor = '#c0392b'; ctx.shadowBlur = 30;
                   ctx.beginPath(); ctx.arc(w/2 - sX, h*0.15 - sY, 60, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                   drawDistantIsland(w*0.2, h*0.2, -pX, -pY, 120, 90, '#37474f', '#cfd8dc', 'pavilion');
                   drawDistantIsland(w*0.8, h*0.15, -pX, -pY, 280, 180, '#37474f', '#cfd8dc', 'pine');
                };
                break;
        }
        
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, skyTop); grad.addColorStop(1, skyBot);
        ctx.fillStyle = grad; ctx.fillRect(0, 0, this.width, this.height);

        if(drawFar) drawFar(this.width, this.height);

        ctx.save();
        ctx.translate(this.width/2, this.height/2);
        ctx.scale(zoom, zoom * tilt); 
        ctx.translate(-this.width/2, -this.height/2);

        let sx = (Math.random() - 0.5) * this.shake * 10;
        let sy = (Math.random() - 0.5) * this.shake * 10;
        ctx.translate(-this.camera.x + sx, -this.camera.y + sy);
        
        const backDecos = this.edgeDecorations.filter(d => d.y < 0);
        const frontDecos = this.edgeDecorations.filter(d => d.y >= 0);
        
        backDecos.forEach(d => drawEdgeDeco(d));
        
        ctx.fillStyle = groundBase; 
        ctx.beginPath();
        ctx.moveTo(-R, 0);
        ctx.bezierCurveTo(-R*0.4, R*2.5, R*0.4, R*2.5, R, 0);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 30;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, R*2); ctx.stroke();
        
        ctx.fillStyle = groundSurf; 
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI*2); ctx.fill();

        ctx.save(); ctx.clip();
        
        if(this.bgPattern) {
             ctx.globalAlpha = 0.3; ctx.fillStyle = this.bgPattern; ctx.fillRect(-R, -R, R*2, R*2); ctx.globalAlpha = 1.0;
        }
        
        if(patternColor) {
             ctx.globalAlpha = 0.15; ctx.fillStyle = patternColor; 
             for(let i=0;i<20;i++) { ctx.beginPath(); ctx.arc((Math.random()-0.5)*R*2, (Math.random()-0.5)*R*2, 50, 0, Math.PI*2); ctx.fill(); }
             ctx.globalAlpha = 1.0;
        }
        if(this.stageIdx === 2) {
            ctx.strokeStyle = '#ff5722'; ctx.lineWidth = 3; ctx.globalAlpha = 0.5;
            for(let i=0; i<10; i++) {
                ctx.beginPath(); ctx.moveTo((Math.random()-0.5)*R*2, (Math.random()-0.5)*R*2); 
                ctx.lineTo((Math.random()-0.5)*R*2, (Math.random()-0.5)*R*2); ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
        }
        
        // Footprints Layer
        this.footprints.forEach(f => f.draw(ctx));
        
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(0, 0, R-5, 0, Math.PI*2); ctx.stroke();
        ctx.restore(); 

        frontDecos.forEach(d => drawEdgeDeco(d));

        ctx.restore(); 
        
        ctx.save();
        ctx.translate(this.width/2, this.height/2);
        ctx.scale(zoom, zoom); 
        ctx.translate(-this.width/2, -this.height/2 * tilt); 
        
        ctx.translate(-this.camera.x + sx, (-this.camera.y + sy) * tilt);
        
        const drawBillboard = (list) => {
            list.forEach(e => {
                const oy = e.y;
                e.y = e.y * tilt; 
                
                if(e.img === 'spirit_banner') {
                    ctx.save();
                    ctx.translate(e.x, e.y);
                    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, -80); ctx.stroke();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
                    const t = this.playTime * 2.0 + e.x*0.1; 
                    for(let i=0; i<3; i++) {
                        const offX = (i-1)*5;
                        ctx.beginPath(); ctx.moveTo(0, -80); 
                        const sway = Math.sin(t + i) * 10;
                        ctx.quadraticCurveTo(offX + sway, -60, offX + sway*1.5, -40);
                        ctx.stroke();
                    }
                    ctx.restore();
                } else {
                    e.draw(ctx);
                }
                
                e.y = oy; 
            });
        };
        
        this.staticObjects.sort((a,b) => a.y - b.y);

        drawBillboard(this.staticObjects);
        drawBillboard(this.orbs);
        drawBillboard(this.chests);
        drawBillboard(this.enemies);
        
        const py = this.player.y;
        this.player.y *= tilt;
        this.player.draw(ctx);
        if (this.artifact) this.artifact.draw(ctx);
        
        this.player.y = py;
        
        ctx.globalCompositeOperation = 'lighter';
        drawBillboard(this.bullets);
        drawBillboard(this.particles); 
        ctx.globalCompositeOperation = 'source-over';
        
        this.weather.draw(ctx, this.camera);

        drawBillboard(this.texts);
        
        ctx.restore(); 

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
    
    // Optimized Map Ecology: Map-specific mob pools
    // spawnEnemy removed here as it is now defined above initEdgeDecorations to group spawn logic.
    // Wait, I inserted it above. Let's remove the duplicate old spawnEnemy below if it exists.
    
    spawnElite(diff) {
        const a = Math.random() * Math.PI * 2;
        const r = 550;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;

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
