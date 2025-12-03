// ========== 跨平台适配层 ==========
// 支持: Web浏览器 / 微信小游戏 / 抖音小游戏 / QQ小游戏
// 一套代码，多端运行

// 平台检测
const isWechat = typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function';
const isDouyin = typeof tt !== 'undefined' && typeof tt.getSystemInfoSync === 'function';
const isQQ = typeof qq !== 'undefined' && typeof qq.getSystemInfoSync === 'function';
const isAlipay = typeof my !== 'undefined' && typeof my.getSystemInfoSync === 'function';
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined' && !isWechat && !isDouyin && !isQQ && !isAlipay;

// 获取原生 API 对象
const nativeAPI = isWechat ? wx : isDouyin ? tt : isQQ ? qq : isAlipay ? my : null;

// 平台名称
const platformName = isWechat ? 'wechat' : isDouyin ? 'douyin' : isQQ ? 'qq' : isAlipay ? 'alipay' : 'web';

// 系统信息缓存
let systemInfo = null;

// ========== 导出的平台 API ==========
export const Platform = {
    // 平台信息
    name: platformName,
    isWeb,
    isWechat,
    isDouyin,
    isQQ,
    isAlipay,
    isMiniGame: !isWeb,
    
    // 获取系统信息
    getSystemInfo() {
        if (systemInfo) return systemInfo;
        
        if (isWeb) {
            systemInfo = {
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                pixelRatio: window.devicePixelRatio || 1,
                platform: navigator.platform,
                language: navigator.language,
                isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            };
        } else {
            try {
                const info = nativeAPI.getSystemInfoSync();
                systemInfo = {
                    screenWidth: info.screenWidth,
                    screenHeight: info.screenHeight,
                    windowWidth: info.windowWidth,
                    windowHeight: info.windowHeight,
                    pixelRatio: info.pixelRatio,
                    platform: info.platform,
                    language: info.language,
                    isMobile: true
                };
            } catch (e) {
                console.error('获取系统信息失败:', e);
                systemInfo = {
                    screenWidth: 375,
                    screenHeight: 667,
                    windowWidth: 375,
                    windowHeight: 667,
                    pixelRatio: 2,
                    platform: 'unknown',
                    language: 'zh-CN',
                    isMobile: true
                };
            }
        }
        return systemInfo;
    },
    
    // ========== Canvas 相关 ==========
    
    // 创建 Canvas（主画布在小游戏中已存在）
    createCanvas() {
        if (isWeb) {
            return document.createElement('canvas');
        }
        return nativeAPI.createCanvas();
    },
    
    // 获取主画布
    getMainCanvas() {
        if (isWeb) {
            return document.getElementById('gameCanvas') || document.querySelector('canvas');
        }
        // 小游戏环境下，优先使用全局 canvas
        if (typeof GameGlobal !== 'undefined' && GameGlobal.canvas) {
            return GameGlobal.canvas;
        }
        if (typeof canvas !== 'undefined') {
            return canvas;
        }
        // 创建新画布（第一个创建的是屏幕画布）
        return nativeAPI.createCanvas();
    },
    
    // ========== 图片相关 ==========
    
    // 创建图片对象
    createImage() {
        if (isWeb) {
            return new Image();
        }
        return nativeAPI.createImage();
    },
    
    // 加载图片（Promise）
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = this.createImage();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = src;
        });
    },
    
    // ========== 存储相关 ==========
    
    // 获取存储
    getStorage(key) {
        if (isWeb) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : null;
            } catch (e) {
                return localStorage.getItem(key);
            }
        }
        try {
            return nativeAPI.getStorageSync(key);
        } catch (e) {
            console.error('读取存储失败:', key, e);
            return null;
        }
    },
    
    // 设置存储
    setStorage(key, value) {
        if (isWeb) {
            try {
                localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            } catch (e) {
                console.error('写入存储失败:', key, e);
            }
            return;
        }
        try {
            nativeAPI.setStorageSync(key, value);
        } catch (e) {
            console.error('写入存储失败:', key, e);
        }
    },
    
    // 删除存储
    removeStorage(key) {
        if (isWeb) {
            localStorage.removeItem(key);
            return;
        }
        try {
            nativeAPI.removeStorageSync(key);
        } catch (e) {
            console.error('删除存储失败:', key, e);
        }
    },
    
    // ========== 触摸事件 ==========
    
    // 触摸事件处理器
    _touchStartHandlers: [],
    _touchMoveHandlers: [],
    _touchEndHandlers: [],
    _touchCancelHandlers: [],
    
    // 注册触摸开始事件
    onTouchStart(handler) {
        this._touchStartHandlers.push(handler);
        console.log(`[Platform] onTouchStart registered, total: ${this._touchStartHandlers.length}, isWeb: ${isWeb}`);
        if (isWeb) {
            // Web 环境在初始化时统一绑定
        } else {
            console.log('[Platform] Calling nativeAPI.onTouchStart...');
            nativeAPI.onTouchStart(handler);
        }
    },
    
    // 注册触摸移动事件
    onTouchMove(handler) {
        this._touchMoveHandlers.push(handler);
        if (isWeb) {
            // Web 环境在初始化时统一绑定
        } else {
            nativeAPI.onTouchMove(handler);
        }
    },
    
    // 注册触摸结束事件
    onTouchEnd(handler) {
        this._touchEndHandlers.push(handler);
        if (isWeb) {
            // Web 环境在初始化时统一绑定
        } else {
            nativeAPI.onTouchEnd(handler);
        }
    },
    
    // 注册触摸取消事件
    onTouchCancel(handler) {
        this._touchCancelHandlers.push(handler);
        if (isWeb) {
            // Web 环境在初始化时统一绑定
        } else {
            nativeAPI.onTouchCancel(handler);
        }
    },
    
    // 移除触摸事件（小游戏环境）
    offTouchStart(handler) {
        const idx = this._touchStartHandlers.indexOf(handler);
        if (idx > -1) this._touchStartHandlers.splice(idx, 1);
        if (!isWeb && nativeAPI.offTouchStart) {
            nativeAPI.offTouchStart(handler);
        }
    },
    
    offTouchMove(handler) {
        const idx = this._touchMoveHandlers.indexOf(handler);
        if (idx > -1) this._touchMoveHandlers.splice(idx, 1);
        if (!isWeb && nativeAPI.offTouchMove) {
            nativeAPI.offTouchMove(handler);
        }
    },
    
    offTouchEnd(handler) {
        const idx = this._touchEndHandlers.indexOf(handler);
        if (idx > -1) this._touchEndHandlers.splice(idx, 1);
        if (!isWeb && nativeAPI.offTouchEnd) {
            nativeAPI.offTouchEnd(handler);
        }
    },
    
    offTouchCancel(handler) {
        // TouchCancel 通常可以忽略或当作 TouchEnd 处理
        if (!isWeb && nativeAPI.offTouchCancel) {
            nativeAPI.offTouchCancel(handler);
        }
    },
    
    // 初始化 Web 触摸事件
    _webTouchInitialized: false,
    initWebTouchEvents(targetElement) {
        if (!isWeb) return;
        if (this._webTouchInitialized) {
            console.log('[Platform] 触摸事件已初始化，跳过重复绑定');
            return;
        }
        this._webTouchInitialized = true;
        console.log('[Platform] 初始化 Web 触摸事件');
        
        const convertTouches = (e) => {
            return Array.from(e.changedTouches || e.touches || []).map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                pageX: t.pageX,
                pageY: t.pageY
            }));
        };
        
        targetElement.addEventListener('touchstart', (e) => {
            const touches = convertTouches(e);
            this._touchStartHandlers.forEach(h => h({ touches, changedTouches: touches }));
        }, { passive: false });
        
        targetElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touches = convertTouches(e);
            this._touchMoveHandlers.forEach(h => h({ touches, changedTouches: touches }));
        }, { passive: false });
        
        targetElement.addEventListener('touchend', (e) => {
            const touches = convertTouches(e);
            this._touchEndHandlers.forEach(h => h({ touches, changedTouches: touches }));
        });
        
        targetElement.addEventListener('touchcancel', (e) => {
            const touches = convertTouches(e);
            this._touchCancelHandlers.forEach(h => h({ touches, changedTouches: touches }));
        });
        
        // 鼠标事件模拟（用于PC调试）
        let mouseDown = false;
        targetElement.addEventListener('mousedown', (e) => {
            mouseDown = true;
            const touch = { identifier: 0, clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY };
            this._touchStartHandlers.forEach(h => h({ touches: [touch], changedTouches: [touch] }));
        });
        
        targetElement.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            const touch = { identifier: 0, clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY };
            this._touchMoveHandlers.forEach(h => h({ touches: [touch], changedTouches: [touch] }));
        });
        
        targetElement.addEventListener('mouseup', (e) => {
            if (!mouseDown) return;
            mouseDown = false;
            const touch = { identifier: 0, clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY };
            this._touchEndHandlers.forEach(h => h({ touches: [], changedTouches: [touch] }));
        });
        
        targetElement.addEventListener('mouseleave', (e) => {
            if (!mouseDown) return;
            mouseDown = false;
            const touch = { identifier: 0, clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY };
            this._touchCancelHandlers.forEach(h => h({ touches: [], changedTouches: [touch] }));
        });
    },
    
    // ========== 帧循环 ==========
    
    // 请求动画帧
    requestAnimationFrame(callback) {
        if (isWeb) {
            return window.requestAnimationFrame(callback);
        }
        return nativeAPI.requestAnimationFrame ? nativeAPI.requestAnimationFrame(callback) : setTimeout(callback, 16);
    },
    
    // 取消动画帧
    cancelAnimationFrame(id) {
        if (isWeb) {
            return window.cancelAnimationFrame(id);
        }
        return nativeAPI.cancelAnimationFrame ? nativeAPI.cancelAnimationFrame(id) : clearTimeout(id);
    },
    
    // ========== 音频相关 ==========
    
    // 创建音频上下文
    createInnerAudioContext() {
        if (isWeb) {
            // Web 环境使用 Audio API
            const audio = new Audio();
            return {
                src: '',
                loop: false,
                volume: 1,
                _audio: audio,
                play() {
                    this._audio.src = this.src;
                    this._audio.loop = this.loop;
                    this._audio.volume = this.volume;
                    this._audio.play().catch(() => {});
                },
                pause() { this._audio.pause(); },
                stop() { 
                    this._audio.pause(); 
                    this._audio.currentTime = 0; 
                },
                destroy() { 
                    this._audio.pause();
                    this._audio.src = '';
                }
            };
        }
        return nativeAPI.createInnerAudioContext();
    },
    
    // ========== 振动 ==========
    
    // 短振动
    vibrateShort() {
        if (isWeb) {
            if (navigator.vibrate) navigator.vibrate(15);
            return;
        }
        try {
            nativeAPI.vibrateShort({ type: 'light' });
        } catch (e) {}
    },
    
    // 长振动
    vibrateLong() {
        if (isWeb) {
            if (navigator.vibrate) navigator.vibrate(400);
            return;
        }
        try {
            nativeAPI.vibrateLong();
        } catch (e) {}
    },
    
    // ========== 性能相关 ==========
    
    // 获取当前时间戳（高精度）
    now() {
        if (isWeb && window.performance) {
            return performance.now();
        }
        return Date.now();
    },
    
    // ========== 调试相关 ==========
    
    // 日志
    log(...args) {
        console.log(`[${platformName}]`, ...args);
    },
    
    warn(...args) {
        console.warn(`[${platformName}]`, ...args);
    },
    
    error(...args) {
        console.error(`[${platformName}]`, ...args);
    }
};

// 导出便捷方法
export const {
    createCanvas,
    createImage,
    loadImage,
    getStorage,
    setStorage,
    removeStorage,
    requestAnimationFrame,
    cancelAnimationFrame
} = Platform;

export default Platform;

