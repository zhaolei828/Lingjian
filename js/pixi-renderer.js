// ========== PixiJS 高性能渲染器 ==========
// 使用 WebGL 批量渲染，性能比 Canvas 2D 提升 10-50 倍

// 检查 PixiJS 是否已加载
const checkPixiLoaded = () => typeof PIXI !== 'undefined';

// ========== 纹理管理器 ==========
class TextureManager {
    constructor() {
        this.textures = new Map();
        this.spritesheet = null;
    }
    
    // 从 SVG 字符串创建纹理
    createFromSVG(key, svgString, scale = 1) {
        if (!checkPixiLoaded()) return null;
        if (this.textures.has(key)) return this.textures.get(key);
        
        // 创建 Image 从 SVG
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const texture = PIXI.Texture.from(url);
        this.textures.set(key, texture);
        return texture;
    }
    
    // 从 Canvas 创建纹理（用于程序化图形）
    createFromCanvas(key, width, height, drawFn) {
        if (!checkPixiLoaded()) return null;
        if (this.textures.has(key)) return this.textures.get(key);
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        drawFn(ctx, width, height);
        
        const texture = PIXI.Texture.from(canvas);
        this.textures.set(key, texture);
        return texture;
    }
    
    // 创建圆形纹理（用于粒子）
    createCircle(key, radius, color) {
        return this.createFromCanvas(key, radius * 2, radius * 2, (ctx, w, h) => {
            ctx.beginPath();
            ctx.arc(w/2, h/2, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        });
    }
    
    get(key) {
        return this.textures.get(key);
    }
}

// ========== 粒子容器（超高性能）==========
class ParticlePool {
    constructor(app, maxCount = 10000) {
        if (!checkPixiLoaded()) return;
        
        this.maxCount = maxCount;
        this.count = 0;
        
        // 使用 ParticleContainer 获得最佳性能
        this.container = new PIXI.ParticleContainer(maxCount, {
            position: true,
            rotation: false,
            uvs: false,
            tint: true,
            alpha: true,
            scale: true
        });
        
        // 粒子数据（使用 TypedArray）
        this.data = {
            x: new Float32Array(maxCount),
            y: new Float32Array(maxCount),
            vx: new Float32Array(maxCount),
            vy: new Float32Array(maxCount),
            life: new Float32Array(maxCount),
            maxLife: new Float32Array(maxCount),
            size: new Float32Array(maxCount),
            active: new Uint8Array(maxCount)
        };
        
        // 预创建精灵
        this.sprites = [];
        this.freeIndices = [];
        
        app.stage.addChild(this.container);
    }
    
    // 设置纹理
    setTexture(texture) {
        this.texture = texture;
    }
    
    // 发射粒子
    emit(x, y, vx, vy, life, size, color = 0xffffff) {
        if (!checkPixiLoaded()) return;
        
        let index;
        if (this.freeIndices.length > 0) {
            index = this.freeIndices.pop();
        } else if (this.count < this.maxCount) {
            index = this.count++;
            // 创建新精灵
            const sprite = new PIXI.Sprite(this.texture);
            sprite.anchor.set(0.5);
            this.container.addChild(sprite);
            this.sprites[index] = sprite;
        } else {
            return; // 达到上限
        }
        
        const d = this.data;
        d.x[index] = x;
        d.y[index] = y;
        d.vx[index] = vx;
        d.vy[index] = vy;
        d.life[index] = life;
        d.maxLife[index] = life;
        d.size[index] = size;
        d.active[index] = 1;
        
        const sprite = this.sprites[index];
        sprite.visible = true;
        sprite.tint = color;
        sprite.position.set(x, y);
        sprite.scale.set(size / 16); // 假设基础纹理是 16x16
    }
    
    // 更新所有粒子
    update(dt) {
        if (!checkPixiLoaded()) return;
        
        const d = this.data;
        const gravity = 200;
        
        for (let i = 0; i < this.count; i++) {
            if (!d.active[i]) continue;
            
            d.life[i] -= dt;
            
            if (d.life[i] <= 0) {
                d.active[i] = 0;
                this.sprites[i].visible = false;
                this.freeIndices.push(i);
                continue;
            }
            
            // 物理更新
            d.vy[i] += gravity * dt;
            d.x[i] += d.vx[i] * dt;
            d.y[i] += d.vy[i] * dt;
            
            // 更新精灵
            const sprite = this.sprites[i];
            sprite.position.set(d.x[i], d.y[i]);
            sprite.alpha = d.life[i] / d.maxLife[i];
            sprite.scale.set((d.size[i] / 16) * (d.life[i] / d.maxLife[i]));
        }
    }
    
    // 清空
    clear() {
        for (let i = 0; i < this.count; i++) {
            this.data.active[i] = 0;
            if (this.sprites[i]) this.sprites[i].visible = false;
            this.freeIndices.push(i);
        }
    }
}

// ========== 实体精灵池 ==========
class EntitySpritePool {
    constructor(app, maxCount = 500) {
        if (!checkPixiLoaded()) return;
        
        this.maxCount = maxCount;
        this.container = new PIXI.Container();
        this.sprites = new Map(); // entity -> sprite
        this.freeSprites = [];
        
        app.stage.addChild(this.container);
    }
    
    // 获取或创建精灵
    getSprite(entity, texture) {
        if (!checkPixiLoaded()) return null;
        
        if (this.sprites.has(entity)) {
            return this.sprites.get(entity);
        }
        
        let sprite;
        if (this.freeSprites.length > 0) {
            sprite = this.freeSprites.pop();
            sprite.visible = true;
        } else {
            sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5);
            this.container.addChild(sprite);
        }
        
        this.sprites.set(entity, sprite);
        return sprite;
    }
    
    // 释放精灵
    releaseSprite(entity) {
        if (!checkPixiLoaded()) return;
        
        const sprite = this.sprites.get(entity);
        if (sprite) {
            sprite.visible = false;
            this.sprites.delete(entity);
            this.freeSprites.push(sprite);
        }
    }
    
    // 同步所有精灵位置
    sync(entities, getTexture) {
        if (!checkPixiLoaded()) return;
        
        // 标记所有现有精灵
        const toRemove = new Set(this.sprites.keys());
        
        for (const entity of entities) {
            if (entity.dead) continue;
            
            toRemove.delete(entity);
            
            const texture = getTexture(entity);
            const sprite = this.getSprite(entity, texture);
            
            sprite.position.set(entity.x, entity.y);
            sprite.scale.x = entity.facing || 1;
            
            if (entity.alpha !== undefined) {
                sprite.alpha = entity.alpha;
            }
        }
        
        // 移除死亡实体的精灵
        for (const entity of toRemove) {
            this.releaseSprite(entity);
        }
    }
}

// ========== PixiJS 游戏渲染器 ==========
export class PixiRenderer {
    constructor(canvas) {
        if (!checkPixiLoaded()) {
            console.warn('PixiJS 未加载，将使用 Canvas 2D 回退');
            this.enabled = false;
            return;
        }
        
        this.enabled = true;
        
        // 创建 Pixi 应用
        this.app = new PIXI.Application({
            view: canvas,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x0a0000,
            antialias: false, // 关闭抗锯齿提升性能
            resolution: Math.min(window.devicePixelRatio || 1, 2), // 限制最大分辨率
            autoDensity: true,
        });
        
        // 管理器
        this.textures = new TextureManager();
        
        // 图层
        this.layers = {
            background: new PIXI.Container(),
            coins: new PIXI.Container(),
            enemies: new PIXI.Container(),
            bullets: new PIXI.Container(),
            player: new PIXI.Container(),
            particles: new PIXI.Container(),
            ui: new PIXI.Container()
        };
        
        // 添加图层到舞台
        Object.values(this.layers).forEach(layer => {
            this.app.stage.addChild(layer);
        });
        
        // 粒子系统
        this.particles = null;
        
        // 实体池
        this.enemySprites = new EntitySpritePool(this.app, 500);
        this.bulletSprites = new EntitySpritePool(this.app, 1000);
        this.coinSprites = new EntitySpritePool(this.app, 200);
        
        // 相机
        this.camera = { x: 0, y: 0 };
        
        console.log('[PixiRenderer] WebGL 渲染器初始化完成');
    }
    
    // 初始化纹理
    initTextures(svgLib) {
        if (!this.enabled) return;
        
        // 创建基础圆形纹理（用于粒子）
        this.textures.createCircle('particle_white', 8, '#ffffff');
        this.textures.createCircle('particle_red', 8, '#ff5252');
        this.textures.createCircle('particle_blue', 8, '#2196f3');
        this.textures.createCircle('particle_yellow', 8, '#ffeb3b');
        
        // 从 SVG 库创建纹理
        for (const [key, svg] of Object.entries(svgLib)) {
            this.textures.createFromSVG(key, svg);
        }
        
        // 初始化粒子系统
        this.particles = new ParticlePool(this.app, 5000);
        this.particles.setTexture(this.textures.get('particle_white'));
    }
    
    // 设置相机
    setCamera(x, y) {
        this.camera.x = x;
        this.camera.y = y;
        
        // 移动整个舞台来模拟相机
        this.app.stage.position.set(-x, -y);
    }
    
    // 渲染敌人
    renderEnemies(enemies, getTexture) {
        if (!this.enabled) return;
        this.enemySprites.sync(enemies, getTexture);
    }
    
    // 渲染子弹
    renderBullets(bullets, getTexture) {
        if (!this.enabled) return;
        this.bulletSprites.sync(bullets, getTexture);
    }
    
    // 渲染金币
    renderCoins(coins, getTexture) {
        if (!this.enabled) return;
        this.coinSprites.sync(coins, getTexture);
    }
    
    // 发射粒子
    emitParticle(x, y, color = 0xffffff, life = 0.5, size = 4) {
        if (!this.enabled || !this.particles) return;
        
        const vx = (Math.random() - 0.5) * 100;
        const vy = (Math.random() - 0.5) * 100 - 50;
        this.particles.emit(x, y, vx, vy, life, size, color);
    }
    
    // 更新粒子
    updateParticles(dt) {
        if (!this.enabled || !this.particles) return;
        this.particles.update(dt);
    }
    
    // 调整大小
    resize(width, height) {
        if (!this.enabled) return;
        this.app.renderer.resize(width, height);
    }
    
    // 获取统计信息
    getStats() {
        if (!this.enabled) return null;
        
        return {
            drawCalls: this.app.renderer.gl ? 'WebGL' : 'Canvas',
            particles: this.particles ? this.particles.count : 0,
            enemies: this.enemySprites.sprites.size,
            bullets: this.bulletSprites.sprites.size
        };
    }
    
    // 销毁
    destroy() {
        if (!this.enabled) return;
        this.app.destroy(true);
    }
}

// ========== 导出检测函数 ==========
export { checkPixiLoaded };

