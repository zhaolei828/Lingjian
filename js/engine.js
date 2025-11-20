import { STAGES } from './data.js';
import { loadAssets } from './assets.js';
import { Player, Enemy, FloatText, Chest } from './entities.js';
import { generateStagePattern } from './map.js';

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
        this.enemies = []; this.bullets = []; this.particles = []; this.orbs = []; this.texts = []; this.chests = [];
        this.camera = { x: 0, y: 0 };
        this.bgPattern = null;
        this.shake = 0; 
        this.keys = {};
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        this.resize();
        loadAssets();
        requestAnimationFrame(t => this.loop(t));
    }
    
    resize() { this.width=this.canvas.width=window.innerWidth; this.height=this.canvas.height=window.innerHeight; }
    
    start() {
        this.player = new Player();
        this.enemies=[]; this.bullets=[]; this.particles=[]; this.orbs=[]; this.texts=[]; this.chests=[];
        this.score=0; this.playTime=0; this.stageIdx=0; this.eliteTimer=0; this.state='PLAY';
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('gameover-menu').classList.add('hidden');
        this.updateUI();
        this.bgPattern = this.ctx.createPattern(generateStagePattern(0), 'repeat');
        this.showStageTitle(STAGES[0].name);
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
        
        document.getElementById('timer').innerText = this.formatTime(this.playTime);
    }
    
    draw() {
        const ctx = this.ctx;
        const stage = STAGES[this.stageIdx];

        ctx.save();
        // 应用相机震动
        let sx = (Math.random() - 0.5) * this.shake * 10;
        let sy = (Math.random() - 0.5) * this.shake * 10;
        ctx.translate(-this.camera.x + sx, -this.camera.y + sy);

        // Background Pattern
        if (this.bgPattern) {
            ctx.fillStyle = this.bgPattern;
            ctx.fillRect(this.camera.x, this.camera.y, this.width, this.height);
        } else {
            ctx.fillStyle = stage.bg;
            ctx.fillRect(this.camera.x, this.camera.y, this.width, this.height);
        }
        
        // Grid overlay
        ctx.strokeStyle = stage.grid; ctx.lineWidth = 2; ctx.globalAlpha = 0.3;
        const G = 100;
        const sx_grid = Math.floor(this.camera.x/G)*G;
        const sy_grid = Math.floor(this.camera.y/G)*G;
        ctx.beginPath();
        for(let x=sx_grid; x<this.camera.x+this.width; x+=G) { ctx.moveTo(x, this.camera.y); ctx.lineTo(x, this.camera.y+this.height); }
        for(let y=sy_grid; y<this.camera.y+this.height; y+=G) { ctx.moveTo(this.camera.x, y); ctx.lineTo(this.camera.x+this.width, y); }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        
        this.orbs.forEach(o => o.draw(ctx));
        this.chests.forEach(c => c.draw(ctx));
        this.enemies.forEach(e => e.draw(ctx));
        this.player.draw(ctx);
        
        // 叠加模式让特效更亮
        ctx.globalCompositeOperation = 'lighter';
        this.bullets.forEach(b => b.draw(ctx));
        this.particles.forEach(p => p.draw(ctx));
        ctx.globalCompositeOperation = 'source-over';
        
        this.texts.forEach(t => t.draw(ctx));
        ctx.restore();

        // Low HP Vignette (Screen Space)
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
        const a = Math.random() * Math.PI * 2;
        const r = Math.max(this.width, this.height)/2 + 100;
        const x = this.player.x + Math.cos(a)*r;
        const y = this.player.y + Math.sin(a)*r;
        
        const stage = STAGES[this.stageIdx];
        const type = stage.mobs[Math.floor(Math.random() * stage.mobs.length)];
        
        this.enemies.push(new Enemy(type, x, y, diff));
    }

    spawnElite(diff) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.max(this.width, this.height)/2 + 100;
        const x = this.player.x + Math.cos(a)*r;
        const y = this.player.y + Math.sin(a)*r;
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
