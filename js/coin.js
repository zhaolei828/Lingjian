// 金币不需要导入 ASSETS，由调用方传入

export class Coin {
    constructor(x, y, value = 1) {
        this.reset(x, y, value);
    }
    
    /**
     * 重置金币状态（供对象池复用）
     */
    reset(x, y, value = 1) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.dead = false;
        this.collected = false;
        
        // 初始速度（散落效果）
        this.vx = (Math.random() - 0.5) * 200;
        this.vy = (Math.random() - 0.5) * 200 - 100;
        
        // 重力和摩擦
        this.gravity = 500;
        this.friction = 0.9;
        this.grounded = false;
        
        // 动画
        this.bounce = 0;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
        
        // 磁吸
        this.attracting = false;
        this.attractTarget = null;
        this.attractSpeed = 0;
        
        // 闪烁
        this.shimmerPhase = Math.random() * Math.PI * 2;
    }
    
    update(dt, player) {
        if (this.dead || this.collected) return;
        
        // 磁吸状态
        if (this.attracting && this.attractTarget) {
            this.attractSpeed += 800 * dt;
            const dx = this.attractTarget.x - this.x;
            const dy = this.attractTarget.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 5) {
                const speed = Math.min(this.attractSpeed, dist / dt);
                this.x += (dx / dist) * speed * dt;
                this.y += (dy / dist) * speed * dt;
            }
            return;
        }
        
        // 散落物理
        if (!this.grounded) {
            this.vy += this.gravity * dt;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.rotation += this.rotationSpeed * dt;
            
            // 触地检测（简单）
            if (this.vy > 0 && Math.abs(this.vy) < 50) {
                this.grounded = true;
                this.vy = 0;
                this.vx = 0;
            }
            
            // 反弹
            if (this.vy > 300) {
                this.vy *= -0.5;
                this.vx *= this.friction;
            }
        }
        
        // 闪烁
        this.shimmerPhase += dt * 5;
    }
    
    attractTo(target) {
        this.attracting = true;
        this.attractTarget = target;
    }
    
    collect() {
        this.collected = true;
        this.dead = true;
    }
    
    draw(ctx, assets) {
        if (this.dead) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 光晕
        const shimmer = 0.5 + Math.sin(this.shimmerPhase) * 0.3;
        ctx.globalAlpha = shimmer;
        
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        glow.addColorStop(0, 'rgba(241, 196, 15, 0.5)');
        glow.addColorStop(1, 'rgba(241, 196, 15, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
        
        // 金币图像
        const coinImg = assets['gold_coin'];
        if (coinImg) {
            ctx.drawImage(coinImg, -12, -12, 24, 24);
        } else {
            // 后备绘制
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#d4a00a';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#d4a00a';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 1);
        }
        
        ctx.restore();
    }
}

