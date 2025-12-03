// ========== Canvas 虚拟摇杆 ==========
// 零依赖，纯 Canvas 实现，跨平台
// 特性：动态位置、平滑回弹、方向输出

import { Platform } from './platform.js';

export class VirtualJoystick {
    constructor(options = {}) {
        // 配置
        this.zone = options.zone || { x: 0, y: 0, width: 200, height: 300 }; // 可触发区域
        this.baseRadius = options.baseRadius || 60;  // 底座半径
        this.knobRadius = options.knobRadius || 25;  // 摇杆半径
        this.threshold = options.threshold || 0.1;   // 死区阈值
        this.dynamic = options.dynamic !== false;    // 动态位置模式
        this.fadeTime = options.fadeTime || 200;     // 淡出时间(ms)
        
        // 样式
        this.baseColor = options.baseColor || 'rgba(139, 0, 0, 0.4)';
        this.baseBorderColor = options.baseBorderColor || 'rgba(200, 50, 50, 0.5)';
        this.knobColor = options.knobColor || 'rgba(200, 60, 60, 0.9)';
        this.knobBorderColor = options.knobBorderColor || 'rgba(255, 100, 100, 0.6)';
        
        // 状态
        this.active = false;
        this.touchId = null;
        this.baseX = 0;
        this.baseY = 0;
        this.knobX = 0;
        this.knobY = 0;
        this.opacity = 0;
        this.fadeStartTime = 0;
        
        // 输出
        this.dx = 0;  // -1 到 1
        this.dy = 0;  // -1 到 1
        this.force = 0; // 0 到 1
        this.angle = 0; // 弧度
        
        // 回调
        this.onMove = options.onMove || null;
        this.onStart = options.onStart || null;
        this.onEnd = options.onEnd || null;
        
        // 绑定事件
        this.bindEvents();
    }
    
    // 设置触发区域
    setZone(x, y, width, height) {
        this.zone = { x, y, width, height };
    }
    
    // 绑定触摸事件
    bindEvents() {
        this._onTouchStart = (e) => this.handleTouchStart(e);
        this._onTouchMove = (e) => this.handleTouchMove(e);
        this._onTouchEnd = (e) => this.handleTouchEnd(e);
        this._onTouchCancel = (e) => this.handleTouchEnd(e);
        
        Platform.onTouchStart(this._onTouchStart);
        Platform.onTouchMove(this._onTouchMove);
        Platform.onTouchEnd(this._onTouchEnd);
        Platform.onTouchCancel(this._onTouchCancel);
    }
    
    // 解绑事件
    destroy() {
        Platform.offTouchStart(this._onTouchStart);
        Platform.offTouchMove(this._onTouchMove);
        Platform.offTouchEnd(this._onTouchEnd);
        Platform.offTouchCancel(this._onTouchCancel);
    }
    
    // 检查点是否在区域内
    isInZone(x, y) {
        const z = this.zone;
        return x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height;
    }
    
    // 获取触摸坐标（Web 和小游戏都用 clientX/clientY）
    getTouchCoords(touch) {
        return { x: touch.clientX, y: touch.clientY };
    }
    
    handleTouchStart(e) {
        // 如果已有触摸，忽略
        if (this.active) return;
        
        for (const touch of e.changedTouches) {
            const { x, y } = this.getTouchCoords(touch);
            
            if (this.isInZone(x, y)) {
                this.active = true;
                this.touchId = touch.identifier;
                this.opacity = 1;
                
                if (this.dynamic) {
                    // 动态模式：在触摸点创建摇杆
                    this.baseX = x;
                    this.baseY = y;
                } else {
                    // 固定模式：使用预设位置
                    this.baseX = this.zone.x + this.zone.width / 2;
                    this.baseY = this.zone.y + this.zone.height / 2;
                }
                
                this.knobX = this.baseX;
                this.knobY = this.baseY;
                
                this.updateOutput(x, y);
                
                if (this.onStart) this.onStart();
                break;
            }
        }
    }
    
    handleTouchMove(e) {
        if (!this.active) return;
        
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.touchId) {
                const { x, y } = this.getTouchCoords(touch);
                this.updateOutput(x, y);
                break;
            }
        }
    }
    
    handleTouchEnd(e) {
        if (!this.active) return;
        
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.touchId) {
                this.active = false;
                this.touchId = null;
                this.fadeStartTime = Platform.now();
                
                // 重置输出
                this.dx = 0;
                this.dy = 0;
                this.force = 0;
                this.angle = 0;
                
                // 回弹摇杆
                this.knobX = this.baseX;
                this.knobY = this.baseY;
                
                if (this.onEnd) this.onEnd();
                if (this.onMove) this.onMove(0, 0, 0, 0);
                break;
            }
        }
    }
    
    updateOutput(touchX, touchY) {
        const dx = touchX - this.baseX;
        const dy = touchY - this.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 计算力度（0-1）
        this.force = Math.min(distance / this.baseRadius, 1);
        
        // 计算角度
        this.angle = Math.atan2(dy, dx);
        
        // 计算方向向量
        if (this.force > this.threshold) {
            this.dx = dx / Math.max(distance, this.baseRadius);
            this.dy = dy / Math.max(distance, this.baseRadius);
        } else {
            this.dx = 0;
            this.dy = 0;
        }
        
        // 更新摇杆位置（限制在底座范围内）
        if (distance <= this.baseRadius) {
            this.knobX = touchX;
            this.knobY = touchY;
        } else {
            this.knobX = this.baseX + Math.cos(this.angle) * this.baseRadius;
            this.knobY = this.baseY + Math.sin(this.angle) * this.baseRadius;
        }
        
        // 触发回调
        if (this.onMove) {
            this.onMove(this.dx, this.dy, this.force, this.angle);
        }
    }
    
    // 更新（用于淡出效果）
    update(dt) {
        if (!this.active && this.opacity > 0) {
            const elapsed = Platform.now() - this.fadeStartTime;
            this.opacity = Math.max(0, 1 - elapsed / this.fadeTime);
        }
    }
    
    // 绘制
    draw(ctx) {
        if (this.opacity <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // 绘制底座
        ctx.beginPath();
        ctx.arc(this.baseX, this.baseY, this.baseRadius, 0, Math.PI * 2);
        
        // 底座渐变
        const baseGrad = ctx.createRadialGradient(
            this.baseX, this.baseY, 0,
            this.baseX, this.baseY, this.baseRadius
        );
        baseGrad.addColorStop(0, 'rgba(139, 0, 0, 0.2)');
        baseGrad.addColorStop(1, this.baseColor);
        ctx.fillStyle = baseGrad;
        ctx.fill();
        
        // 底座边框
        ctx.strokeStyle = this.baseBorderColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 绘制摇杆
        ctx.beginPath();
        ctx.arc(this.knobX, this.knobY, this.knobRadius, 0, Math.PI * 2);
        
        // 摇杆渐变
        const knobGrad = ctx.createRadialGradient(
            this.knobX - 5, this.knobY - 5, 0,
            this.knobX, this.knobY, this.knobRadius
        );
        knobGrad.addColorStop(0, 'rgba(255, 150, 150, 0.9)');
        knobGrad.addColorStop(1, this.knobColor);
        ctx.fillStyle = knobGrad;
        ctx.fill();
        
        // 摇杆边框
        ctx.strokeStyle = this.knobBorderColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 高光
        ctx.beginPath();
        ctx.arc(this.knobX - 5, this.knobY - 5, this.knobRadius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        
        ctx.restore();
    }
    
    // 获取当前方向（便捷方法）
    getDirection() {
        return {
            x: this.dx,
            y: this.dy,
            force: this.force,
            angle: this.angle,
            active: this.active || this.force > 0
        };
    }
    
    // 重置
    reset() {
        this.active = false;
        this.touchId = null;
        this.dx = 0;
        this.dy = 0;
        this.force = 0;
        this.angle = 0;
        this.opacity = 0;
        this.knobX = this.baseX;
        this.knobY = this.baseY;
    }
}

// ========== 简化版摇杆（固定位置） ==========
export class FixedJoystick extends VirtualJoystick {
    constructor(x, y, options = {}) {
        super({
            ...options,
            dynamic: false,
            zone: {
                x: x - (options.baseRadius || 60) - 20,
                y: y - (options.baseRadius || 60) - 20,
                width: (options.baseRadius || 60) * 2 + 40,
                height: (options.baseRadius || 60) * 2 + 40
            }
        });
        
        this.baseX = x;
        this.baseY = y;
        this.knobX = x;
        this.knobY = y;
        this.opacity = 0.6; // 固定显示
    }
    
    update(dt) {
        // 固定摇杆不淡出，但可以调整透明度
        if (!this.active) {
            this.opacity = 0.6;
        } else {
            this.opacity = 1;
        }
    }
}

export default VirtualJoystick;

