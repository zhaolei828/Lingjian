// ========== 性能优化模块 ==========

// 检测是否为移动设备
export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || ('ontouchstart' in window && window.innerWidth <= 1024);

// 性能配置
export const PerfConfig = {
    // 移动端配置
    mobile: {
        maxParticles: 50,        // 最大粒子数
        maxBullets: 100,         // 最大子弹数
        maxEnemies: 30,          // 最大敌人数（屏幕内）
        maxTexts: 10,            // 最大飘字数
        targetFPS: 30,           // 目标帧率
        enableShadows: false,    // 禁用阴影
        enableTrails: false,     // 禁用拖尾
        particleLife: 0.3,       // 粒子生命缩短
        simplifyEffects: true,   // 简化特效
    },
    // PC端配置
    desktop: {
        maxParticles: 200,
        maxBullets: 500,
        maxEnemies: 100,
        maxTexts: 30,
        targetFPS: 60,
        enableShadows: true,
        enableTrails: true,
        particleLife: 0.5,
        simplifyEffects: false,
    }
};

// 当前配置
export const Config = isMobile ? PerfConfig.mobile : PerfConfig.desktop;

// ========== 对象池 ==========
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 50) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        
        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }
    
    // 获取一个对象
    get(...args) {
        let obj = this.pool.pop();
        if (!obj) {
            obj = this.createFn();
        }
        this.resetFn(obj, ...args);
        obj.dead = false;
        this.active.push(obj);
        return obj;
    }
    
    // 回收死亡对象
    recycle() {
        for (let i = this.active.length - 1; i >= 0; i--) {
            if (this.active[i].dead) {
                this.pool.push(this.active.splice(i, 1)[0]);
            }
        }
    }
    
    // 清空
    clear() {
        this.pool.push(...this.active);
        this.active = [];
    }
    
    // 获取活动对象列表
    getActive() {
        return this.active;
    }
}

// ========== 粒子池 ==========
export const ParticlePool = new ObjectPool(
    () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '#fff', size: 0, dead: false }),
    (p, x, y, color, life, size) => {
        p.x = x;
        p.y = y;
        p.vx = (Math.random() - 0.5) * 100;
        p.vy = (Math.random() - 0.5) * 100 - 50;
        p.color = color;
        p.life = life * (isMobile ? Config.particleLife / 0.5 : 1);
        p.maxLife = p.life;
        p.size = size;
    },
    isMobile ? 50 : 200
);

// ========== 飘字池 ==========
export const TextPool = new ObjectPool(
    () => ({ x: 0, y: 0, text: '', color: '#fff', life: 0, big: false, dead: false }),
    (t, x, y, text, color, big = false) => {
        t.x = x;
        t.y = y;
        t.text = text;
        t.color = color;
        t.life = 1.0;
        t.big = big;
    },
    isMobile ? 10 : 30
);

// ========== 帧率控制 ==========
export class FrameRateLimiter {
    constructor(targetFPS = Config.targetFPS) {
        this.targetFPS = targetFPS;
        this.frameInterval = 1000 / targetFPS;
        this.lastFrameTime = 0;
    }
    
    shouldRender(currentTime) {
        const elapsed = currentTime - this.lastFrameTime;
        if (elapsed >= this.frameInterval) {
            this.lastFrameTime = currentTime - (elapsed % this.frameInterval);
            return true;
        }
        return false;
    }
}

// ========== 空间分区（四叉树简化版）==========
export class SpatialGrid {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    // 计算单元格key
    getKey(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }
    
    // 清空
    clear() {
        this.grid.clear();
    }
    
    // 插入实体
    insert(entity) {
        const key = this.getKey(entity.x, entity.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(entity);
    }
    
    // 查询附近实体
    queryNear(x, y, radius = 1) {
        const results = [];
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const key = `${cx + dx},${cy + dy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    results.push(...cell);
                }
            }
        }
        return results;
    }
}

// ========== 性能监控 ==========
export class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastCheck = performance.now();
        this.metrics = {
            particles: 0,
            bullets: 0,
            enemies: 0,
            drawCalls: 0
        };
    }
    
    tick() {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastCheck >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastCheck = now;
        }
    }
    
    // 显示性能信息（调试用）
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(10, 10, 150, 80);
        ctx.fillStyle = this.fps < 30 ? '#ff5252' : '#4caf50';
        ctx.font = '14px monospace';
        ctx.fillText(`FPS: ${this.fps}`, 20, 30);
        ctx.fillStyle = '#fff';
        ctx.fillText(`Particles: ${this.metrics.particles}`, 20, 48);
        ctx.fillText(`Bullets: ${this.metrics.bullets}`, 20, 66);
        ctx.fillText(`Enemies: ${this.metrics.enemies}`, 20, 84);
        ctx.restore();
    }
}

// ========== 渲染优化：离屏Canvas缓存 ==========
export class OffscreenCache {
    constructor() {
        this.caches = new Map();
    }
    
    // 获取或创建缓存
    getOrCreate(key, width, height, drawFn) {
        if (!this.caches.has(key)) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            drawFn(ctx, width, height);
            this.caches.set(key, canvas);
        }
        return this.caches.get(key);
    }
    
    // 清除缓存
    clear(key) {
        if (key) {
            this.caches.delete(key);
        } else {
            this.caches.clear();
        }
    }
}

// ========== 简化的粒子更新和绘制 ==========
export function updatePooledParticles(dt) {
    const active = ParticlePool.getActive();
    for (const p of active) {
        p.life -= dt;
        if (p.life <= 0) {
            p.dead = true;
            continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt; // 重力
    }
    ParticlePool.recycle();
}

export function drawPooledParticles(ctx) {
    const active = ParticlePool.getActive();
    for (const p of active) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ========== 工具函数 ==========

// 限制数组长度（用于粒子、子弹等）
export function limitArray(arr, max) {
    if (arr.length > max) {
        arr.splice(0, arr.length - max);
    }
}

// 检查是否在视野内
export function isInView(x, y, camera, width, height, margin = 100) {
    return x >= camera.x - margin 
        && x <= camera.x + width + margin 
        && y >= camera.y - margin 
        && y <= camera.y + height + margin;
}

// 全局性能监控实例
export const perfMonitor = new PerformanceMonitor();
export const offscreenCache = new OffscreenCache();

console.log(`[Performance] 运行模式: ${isMobile ? '移动端' : 'PC端'}, 目标帧率: ${Config.targetFPS}fps`);

