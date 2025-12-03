// ========== 轻量级 Canvas UI 系统 ==========
// 零依赖，跨平台，高性能
// 支持: 按钮、标签、进度条、面板、卡片

import { Platform } from './platform.js';

// ========== 基础 UI 组件 ==========

// UI 组件基类
class UIComponent {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.visible = true;
        this.alpha = 1;
        this.children = [];
        this.parent = null;
        this.interactive = false;
        this._dirty = true;
    }
    
    // 添加子组件
    addChild(child) {
        child.parent = this;
        this.children.push(child);
        return child;
    }
    
    // 移除子组件
    removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx > -1) {
            this.children.splice(idx, 1);
            child.parent = null;
        }
    }
    
    // 获取全局坐标
    getGlobalPos() {
        let gx = this.x;
        let gy = this.y;
        let p = this.parent;
        while (p) {
            gx += p.x;
            gy += p.y;
            p = p.parent;
        }
        return { x: gx, y: gy };
    }
    
    // 点击测试
    hitTest(px, py) {
        const { x, y } = this.getGlobalPos();
        return px >= x && px <= x + this.width && py >= y && py <= y + this.height;
    }
    
    // 更新
    update(dt) {
        this.children.forEach(c => c.update(dt));
    }
    
    // 绘制
    draw(ctx) {
        if (!this.visible) return;
        
        ctx.save();
        ctx.globalAlpha *= this.alpha;
        ctx.translate(this.x, this.y);
        
        this.render(ctx);
        this.children.forEach(c => c.draw(ctx));
        
        ctx.restore();
    }
    
    // 子类实现
    render(ctx) {}
}

// ========== 标签组件 ==========
export class Label extends UIComponent {
    constructor(x, y, text, options = {}) {
        super(x, y, 0, 0);
        this.text = text;
        this.fontSize = options.fontSize || 16;
        this.fontFamily = options.fontFamily || 'Arial, sans-serif';
        this.color = options.color || '#ffffff';
        this.align = options.align || 'left'; // left, center, right
        this.baseline = options.baseline || 'top';
        this.shadow = options.shadow || null; // { color, blur, offsetX, offsetY }
        this.stroke = options.stroke || null; // { color, width }
    }
    
    render(ctx) {
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.textAlign = this.align;
        ctx.textBaseline = this.baseline;
        
        if (this.shadow) {
            ctx.shadowColor = this.shadow.color || '#000';
            ctx.shadowBlur = this.shadow.blur || 4;
            ctx.shadowOffsetX = this.shadow.offsetX || 0;
            ctx.shadowOffsetY = this.shadow.offsetY || 2;
        }
        
        if (this.stroke) {
            ctx.strokeStyle = this.stroke.color || '#000';
            ctx.lineWidth = this.stroke.width || 2;
            ctx.strokeText(this.text, 0, 0);
        }
        
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, 0, 0);
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }
}

// ========== 按钮组件 ==========
export class Button extends UIComponent {
    constructor(x, y, width, height, text, options = {}) {
        super(x, y, width, height);
        this.text = text;
        this.interactive = true;
        
        // 样式
        this.fontSize = options.fontSize || 18;
        this.fontFamily = options.fontFamily || 'Arial, sans-serif';
        this.textColor = options.textColor || '#ffffff';
        this.bgColor = options.bgColor || 'rgba(139, 0, 0, 0.8)';
        this.bgColorHover = options.bgColorHover || 'rgba(180, 0, 0, 0.9)';
        this.bgColorPressed = options.bgColorPressed || 'rgba(100, 0, 0, 0.9)';
        this.bgColorDisabled = options.bgColorDisabled || 'rgba(80, 80, 80, 0.6)';
        this.borderColor = options.borderColor || '#ff6b6b';
        this.borderWidth = options.borderWidth || 2;
        this.borderRadius = options.borderRadius || 10;
        this.shadow = options.shadow !== false;
        
        // 状态
        this.enabled = true;
        this.pressed = false;
        this.hovered = false;
        
        // 回调
        this.onClick = options.onClick || null;
    }
    
    render(ctx) {
        // 选择背景色
        let bgColor = this.bgColor;
        if (!this.enabled) {
            bgColor = this.bgColorDisabled;
        } else if (this.pressed) {
            bgColor = this.bgColorPressed;
        } else if (this.hovered) {
            bgColor = this.bgColorHover;
        }
        
        // 阴影
        if (this.shadow && this.enabled) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 4;
        }
        
        // 背景
        ctx.fillStyle = bgColor;
        this.drawRoundRect(ctx, 0, 0, this.width, this.height, this.borderRadius);
        ctx.fill();
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // 边框
        if (this.borderWidth > 0) {
            ctx.strokeStyle = this.enabled ? this.borderColor : '#666';
            ctx.lineWidth = this.borderWidth;
            this.drawRoundRect(ctx, 0, 0, this.width, this.height, this.borderRadius);
            ctx.stroke();
        }
        
        // 文字
        ctx.fillStyle = this.enabled ? this.textColor : '#999';
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.width / 2, this.height / 2);
    }
    
    drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
    
    // 触摸处理
    onTouchStart() {
        if (!this.enabled) return;
        this.pressed = true;
        Platform.vibrateShort();
    }
    
    onTouchEnd() {
        if (!this.enabled) return;
        if (this.pressed && this.onClick) {
            this.onClick();
        }
        this.pressed = false;
    }
    
    onTouchCancel() {
        this.pressed = false;
    }
}

// ========== 进度条组件 ==========
export class ProgressBar extends UIComponent {
    constructor(x, y, width, height, options = {}) {
        super(x, y, width, height);
        
        this.value = options.value || 0; // 0-1
        this.maxValue = options.maxValue || 1;
        this.bgColor = options.bgColor || 'rgba(0, 0, 0, 0.5)';
        this.fillColor = options.fillColor || '#4caf50';
        this.fillColorLow = options.fillColorLow || '#f44336'; // 低于30%时的颜色
        this.borderColor = options.borderColor || 'rgba(255, 255, 255, 0.2)';
        this.borderWidth = options.borderWidth || 1;
        this.borderRadius = options.borderRadius || 4;
        this.showText = options.showText || false;
        this.textFormat = options.textFormat || null; // 自定义文字格式函数
    }
    
    // 设置进度
    setProgress(value, max) {
        if (max !== undefined) this.maxValue = max;
        this.value = Math.max(0, Math.min(value, this.maxValue));
    }
    
    render(ctx) {
        const ratio = this.maxValue > 0 ? this.value / this.maxValue : 0;
        
        // 背景
        ctx.fillStyle = this.bgColor;
        this.drawRoundRect(ctx, 0, 0, this.width, this.height, this.borderRadius);
        ctx.fill();
        
        // 填充
        if (ratio > 0) {
            ctx.fillStyle = ratio < 0.3 ? this.fillColorLow : this.fillColor;
            const fillWidth = Math.max(this.borderRadius * 2, this.width * ratio);
            this.drawRoundRect(ctx, 0, 0, fillWidth, this.height, this.borderRadius);
            ctx.fill();
        }
        
        // 边框
        if (this.borderWidth > 0) {
            ctx.strokeStyle = this.borderColor;
            ctx.lineWidth = this.borderWidth;
            this.drawRoundRect(ctx, 0, 0, this.width, this.height, this.borderRadius);
            ctx.stroke();
        }
        
        // 文字
        if (this.showText) {
            const text = this.textFormat 
                ? this.textFormat(this.value, this.maxValue)
                : `${Math.floor(this.value)}/${Math.floor(this.maxValue)}`;
            ctx.fillStyle = '#fff';
            ctx.font = `${Math.min(this.height - 4, 14)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, this.width / 2, this.height / 2);
        }
    }
    
    drawRoundRect(ctx, x, y, w, h, r) {
        r = Math.min(r, h / 2, w / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}

// ========== 面板组件 ==========
export class Panel extends UIComponent {
    constructor(x, y, width, height, options = {}) {
        super(x, y, width, height);
        
        this.bgColor = options.bgColor || 'rgba(20, 10, 10, 0.95)';
        this.borderColor = options.borderColor || '#5a2020';
        this.borderWidth = options.borderWidth || 2;
        this.borderRadius = options.borderRadius || 15;
        this.shadow = options.shadow !== false;
        this.title = options.title || null;
        this.titleColor = options.titleColor || '#f1c40f';
        this.titleFontSize = options.titleFontSize || 28;
    }
    
    render(ctx) {
        // 阴影
        if (this.shadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 10;
        }
        
        // 背景
        ctx.fillStyle = this.bgColor;
        this.drawRoundRect(ctx, 0, 0, this.width, this.height, this.borderRadius);
        ctx.fill();
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // 边框
        if (this.borderWidth > 0) {
            ctx.strokeStyle = this.borderColor;
            ctx.lineWidth = this.borderWidth;
            this.drawRoundRect(ctx, 0, 0, this.width, this.height, this.borderRadius);
            ctx.stroke();
        }
        
        // 标题
        if (this.title) {
            ctx.fillStyle = this.titleColor;
            ctx.font = `bold ${this.titleFontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(this.title, this.width / 2, 20);
        }
    }
    
    drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}

// ========== 卡片组件（可选择） ==========
export class Card extends UIComponent {
    constructor(x, y, width, height, options = {}) {
        super(x, y, width, height);
        this.interactive = true;
        
        this.title = options.title || '';
        this.description = options.description || '';
        this.icon = options.icon || ''; // emoji 或图片
        this.bgColor = options.bgColor || 'rgba(40, 20, 20, 0.9)';
        this.bgColorHover = options.bgColorHover || 'rgba(60, 30, 30, 0.95)';
        this.borderColor = options.borderColor || '#8b0000';
        this.borderColorHover = options.borderColorHover || '#ff6b6b';
        this.borderWidth = options.borderWidth || 2;
        this.borderRadius = options.borderRadius || 12;
        this.titleColor = options.titleColor || '#f1c40f';
        this.descColor = options.descColor || '#ccc';
        
        this.selected = false;
        this.hovered = false;
        
        this.onClick = options.onClick || null;
    }
    
    render(ctx) {
        const isActive = this.selected || this.hovered;
        
        // 背景
        ctx.fillStyle = isActive ? this.bgColorHover : this.bgColor;
        this.drawRoundRect(ctx, 0, 0, this.width, this.height, this.borderRadius);
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = isActive ? this.borderColorHover : this.borderColor;
        ctx.lineWidth = isActive ? this.borderWidth + 1 : this.borderWidth;
        this.drawRoundRect(ctx, 0, 0, this.width, this.height, this.borderRadius);
        ctx.stroke();
        
        // 图标
        if (this.icon) {
            ctx.font = '36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.icon, this.width / 2, 40);
        }
        
        // 标题
        ctx.fillStyle = this.titleColor;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.title, this.width / 2, this.icon ? 70 : 20);
        
        // 描述（自动换行）
        if (this.description) {
            ctx.fillStyle = this.descColor;
            ctx.font = '12px Arial';
            const lines = this.wrapText(ctx, this.description, this.width - 20);
            const startY = this.icon ? 95 : 45;
            lines.forEach((line, i) => {
                ctx.fillText(line, this.width / 2, startY + i * 16);
            });
        }
    }
    
    wrapText(ctx, text, maxWidth) {
        const lines = [];
        let line = '';
        for (const char of text) {
            const testLine = line + char;
            if (ctx.measureText(testLine).width > maxWidth) {
                lines.push(line);
                line = char;
            } else {
                line = testLine;
            }
        }
        if (line) lines.push(line);
        return lines;
    }
    
    drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
    
    onTouchStart() {
        this.hovered = true;
    }
    
    onTouchEnd() {
        if (this.hovered && this.onClick) {
            this.onClick();
            Platform.vibrateShort();
        }
        this.hovered = false;
    }
    
    onTouchCancel() {
        this.hovered = false;
    }
}

// ========== UI 管理器 ==========
export class UIManager {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        // 使用传入的逻辑尺寸，或从 Platform 获取
        const systemInfo = Platform.getSystemInfo();
        this.width = width || systemInfo.windowWidth;
        this.height = height || systemInfo.windowHeight;
        
        // UI 层级
        this.layers = {
            background: [],  // 最底层
            game: [],        // 游戏层
            hud: [],         // HUD 层
            overlay: [],     // 遮罩层
            popup: []        // 弹窗层（最顶层）
        };
        
        // 当前活动的触摸组件
        this.activeComponent = null;
        
        // 绑定触摸事件
        this.bindTouchEvents();
    }
    
    // 添加组件到指定层
    add(component, layer = 'game') {
        if (this.layers[layer]) {
            this.layers[layer].push(component);
        }
        return component;
    }
    
    // 移除组件
    remove(component, layer) {
        if (layer && this.layers[layer]) {
            const idx = this.layers[layer].indexOf(component);
            if (idx > -1) this.layers[layer].splice(idx, 1);
        } else {
            // 从所有层移除
            Object.values(this.layers).forEach(arr => {
                const idx = arr.indexOf(component);
                if (idx > -1) arr.splice(idx, 1);
            });
        }
    }
    
    // 清空指定层
    clearLayer(layer) {
        if (this.layers[layer]) {
            this.layers[layer] = [];
        }
    }
    
    // 清空所有层
    clearAll() {
        Object.keys(this.layers).forEach(key => {
            this.layers[key] = [];
        });
    }
    
    // 绑定触摸事件（只绑定一次）
    _touchBound = false;
    bindTouchEvents() {
        if (this._touchBound) {
            console.log('[UI] Touch events already bindled, skip');
            return;
        }
        this._touchBound = true;
        console.log('[UI] Bindng touch events...');
        Platform.onTouchStart((e) => this.handleTouchStart(e));
        Platform.onTouchMove((e) => this.handleTouchMove(e));
        Platform.onTouchEnd((e) => this.handleTouchEnd(e));
        Platform.onTouchCancel((e) => this.handleTouchCancel(e));
        console.log('[UI] Touch events bindled');
    }
    
    // 获取所有可交互组件（按层级从高到低）
    getInteractiveComponents() {
        const result = [];
        const layerOrder = ['popup', 'overlay', 'hud', 'game', 'background'];
        
        layerOrder.forEach(layer => {
            this.layers[layer].forEach(comp => {
                this.collectInteractive(comp, result);
            });
        });
        
        return result;
    }
    
    collectInteractive(comp, result) {
        if (comp.interactive && comp.visible !== false) {
            result.push(comp);
        }
        if (comp.children) {
            comp.children.forEach(c => this.collectInteractive(c, result));
        }
    }
    
    // 查找触摸点下的组件
    findComponentAt(x, y) {
        const components = this.getInteractiveComponents();
        for (const comp of components) {
            if (comp.hitTest(x, y)) {
                return comp;
            }
        }
        return null;
    }
    
    handleTouchStart(e) {
        const touch = e.touches[0];
        if (!touch) {
            console.log('[UI] handleTouchStart: no touch');
            return;
        }
        
        // 微信小游戏和 Web 都使用 clientX/clientY
        // 小游戏没有 getBoundingClientRect，直接使用坐标
        let x, y;
        if (Platform.isWeb && this.canvas.getBoundingClientRect) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;
            x = (touch.clientX - rect.left) * scaleX;
            y = (touch.clientY - rect.top) * scaleY;
        } else {
            // 小游戏环境直接使用 clientX/clientY
            x = touch.clientX;
            y = touch.clientY;
        }
        
        console.log(`[UI] Touch at (${Math.round(x)}, ${Math.round(y)}), components: ${this.getInteractiveComponents().length}`);
        
        const comp = this.findComponentAt(x, y);
        console.log(`[UI] Found component: ${comp ? comp.constructor.name : 'none'}`);
        
        if (comp && comp.onTouchStart) {
            this.activeComponent = comp;
            comp.onTouchStart(x, y);
        }
    }
    
    handleTouchMove(e) {
        // 暂不处理移动（按钮不需要）
    }
    
    handleTouchEnd(e) {
        if (this.activeComponent && this.activeComponent.onTouchEnd) {
            this.activeComponent.onTouchEnd();
        }
        this.activeComponent = null;
    }
    
    handleTouchCancel(e) {
        if (this.activeComponent && this.activeComponent.onTouchCancel) {
            this.activeComponent.onTouchCancel();
        }
        this.activeComponent = null;
    }
    
    // 更新所有组件
    update(dt) {
        Object.values(this.layers).forEach(arr => {
            arr.forEach(comp => {
                if (comp.update) comp.update(dt);
            });
        });
    }
    
    // 绘制所有组件
    draw() {
        const layerOrder = ['background', 'game', 'hud', 'overlay', 'popup'];
        
        layerOrder.forEach(layer => {
            this.layers[layer].forEach(comp => {
                if (comp.visible) {
                    comp.draw(this.ctx);
                }
            });
        });
    }
    
    // 调整大小
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
}

// ========== 工具函数 ==========

// 绘制圆角矩形
export function drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// 颜色工具
export function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default UIManager;

