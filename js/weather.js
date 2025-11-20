export class WeatherSystem {
    constructor() {
        this.particles = [];
    }

    update(dt, stageIdx, camera) {
        // Clean up
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.type === 'leaf' || p.type === 'ember') {
                p.rotation += p.rotSpeed * dt;
            }
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Spawn new
        if (this.particles.length < 150) { 
            // Higher spawn rate for dense atmosphere
            if (Math.random() < 0.5) { 
                this.spawn(stageIdx, camera);
            }
        }
    }

    spawn(stageIdx, camera) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        // Spawn in a large area around camera to cover screen
        const x = camera.x + (Math.random() - 0.5) * w * 1.5;
        const y = camera.y + (Math.random() - 0.5) * h * 1.5;
        
        let type = 'dust';
        let life = 4 + Math.random() * 3;
        let size = 2 + Math.random() * 2;
        let color = 'rgba(255,255,255,0.5)';
        let vx = (Math.random() - 0.5) * 20;
        let vy = (Math.random() - 0.5) * 20;
        let rotSpeed = 0;

        switch (stageIdx % 5) {
            case 0: // Forest - Leaves
                type = 'leaf';
                color = Math.random() > 0.5 ? '#27ae60' : '#f39c12';
                size = 6 + Math.random() * 4;
                vx = 50 + Math.random() * 50; // Wind blowing right
                vy = 20 + Math.random() * 20; // Falling
                rotSpeed = (Math.random()-0.5)*5;
                break;
            case 1: // Bone - Dust/Fog
                type = 'dust';
                color = 'rgba(189, 195, 199, 0.3)';
                size = 4 + Math.random() * 10; // Big dust clumps
                vx = (Math.random() - 0.5) * 10;
                vy = (Math.random() - 0.5) * 10;
                break;
            case 2: // Magma - Ember
                type = 'ember';
                color = Math.random() > 0.3 ? 'rgba(255, 87, 34, 0.8)' : 'rgba(255, 235, 59, 0.8)';
                size = 2 + Math.random() * 3;
                vy = -40 - Math.random() * 60; // Rising fast
                vx = (Math.random() - 0.5) * 30;
                rotSpeed = (Math.random()-0.5)*10;
                life = 2 + Math.random(); // Short life
                break;
            case 3: // Ice - Snow
                type = 'snow';
                color = 'rgba(255, 255, 255, 0.9)';
                vx = -150 - Math.random() * 100; // Strong wind left
                vy = 80 + Math.random() * 80; // Falling fast
                size = 2 + Math.random() * 2;
                break;
            case 4: // Fairyland - Gentle Snow
                type = 'snow';
                color = 'rgba(255, 255, 255, 0.8)';
                vx = -20 - Math.random() * 20; // Gentle wind
                vy = 30 + Math.random() * 30; // Gentle fall
                size = 3 + Math.random() * 2;
                if(Math.random()<0.2) color = '#a29bfe'; // Magic sparkle
                break;
        }

        this.particles.push({ x, y, vx, vy, life, maxLife: life, size, color, type, rotation: Math.random()*6, rotSpeed });
    }

    draw(ctx, camera) {
        ctx.save();
        // Use standard camera transform for now, acting as "Overlay" layer
        ctx.translate(-camera.x, -camera.y);

        for (let p of this.particles) {
            ctx.globalAlpha = p.life / p.maxLife; // Fade out
            ctx.fillStyle = p.color;
            
            ctx.save();
            ctx.translate(p.x, p.y);
            if (p.type === 'leaf' || p.type === 'ember' || p.type === 'debris') {
                ctx.rotate(p.rotation);
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            } else {
                ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        }
        
        ctx.restore();
    }
}

