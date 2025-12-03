(function () {
    'use strict';

    // ========== 微信小游戏适配层 ==========
    // 提供基础的 DOM API 模拟，让现有代码能在小游戏环境运行

    // 如果是小游戏环境
    if (typeof wx !== 'undefined' || typeof tt !== 'undefined') {
        const api = typeof wx !== 'undefined' ? wx : tt;
        
        // 【重要】首先创建主画布（第一个创建的是屏幕画布）
        const mainCanvas = api.createCanvas();
        GameGlobal.canvas = mainCanvas;
        GameGlobal.__bindedCanvas = mainCanvas; // 标记为已绑定的主画布
        
        // 模拟 window 对象（如果不存在）
        if (typeof window === 'undefined') {
            GameGlobal.window = GameGlobal;
        }
        
        // 模拟 document 对象（基础功能）
        if (typeof document === 'undefined') {
            GameGlobal.document = {
                createElement: (tagName) => {
                    if (tagName === 'canvas') {
                        // 返回新的离屏画布（非主画布）
                        return api.createCanvas();
                    }
                    if (tagName === 'img' || tagName === 'image') {
                        return api.createImage();
                    }
                    // 其他元素返回空对象
                    return {};
                },
                getElementById: () => null,
                querySelector: () => null,
                querySelectorAll: () => [],
                addEventListener: () => {},
                removeEventListener: () => {},
                body: {
                    appendChild: () => {},
                    removeChild: () => {},
                    style: {}
                },
                documentElement: {
                    style: {}
                }
            };
        }
        
        // 模拟 Image 构造函数
        if (typeof Image === 'undefined') {
            GameGlobal.Image = function() {
                return api.createImage();
            };
        }
        
        // 模拟 HTMLCanvasElement（延迟获取，避免过早创建 canvas）
        if (typeof HTMLCanvasElement === 'undefined') {
            // 使用空函数占位，实际类型检查时不常用
            GameGlobal.HTMLCanvasElement = function() {};
        }
        
        // 模拟 HTMLImageElement（延迟获取）
        if (typeof HTMLImageElement === 'undefined') {
            GameGlobal.HTMLImageElement = function() {};
        }
        
        // 模拟 localStorage（基于小游戏存储）
        if (typeof localStorage === 'undefined') {
            GameGlobal.localStorage = {
                getItem: (key) => {
                    try {
                        return api.getStorageSync(key);
                    } catch (e) {
                        return null;
                    }
                },
                setItem: (key, value) => {
                    try {
                        api.setStorageSync(key, value);
                    } catch (e) {}
                },
                removeItem: (key) => {
                    try {
                        api.removeStorageSync(key);
                    } catch (e) {}
                },
                clear: () => {
                    try {
                        api.clearStorageSync();
                    } catch (e) {}
                }
            };
        }
        
        // 模拟 requestAnimationFrame
        if (typeof requestAnimationFrame === 'undefined') {
            GameGlobal.requestAnimationFrame = (callback) => {
                return api.requestAnimationFrame ? api.requestAnimationFrame(callback) : setTimeout(callback, 16);
            };
        }
        
        // 模拟 cancelAnimationFrame
        if (typeof cancelAnimationFrame === 'undefined') {
            GameGlobal.cancelAnimationFrame = (id) => {
                return api.cancelAnimationFrame ? api.cancelAnimationFrame(id) : clearTimeout(id);
            };
        }
        
        // 模拟 performance
        if (typeof performance === 'undefined') {
            GameGlobal.performance = {
                now: () => Date.now()
            };
        }
        
        // 模拟 navigator
        if (typeof navigator === 'undefined') {
            const systemInfo = api.getSystemInfoSync();
            GameGlobal.navigator = {
                userAgent: `MiniGame/${systemInfo.platform}`,
                platform: systemInfo.platform,
                language: systemInfo.language,
                vibrate: () => {
                    try {
                        api.vibrateShort({ type: 'light' });
                        return true;
                    } catch (e) {
                        return false;
                    }
                }
            };
        }
        
        // 模拟 console（小游戏通常已有）
        if (typeof console === 'undefined') {
            GameGlobal.console = {
                log: () => {},
                warn: () => {},
                error: () => {},
                info: () => {},
                debug: () => {}
            };
        }
        
        // 模拟 btoa 和 atob
        if (typeof btoa === 'undefined') {
            GameGlobal.btoa = (str) => {
                const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
                let result = '';
                let i = 0;
                
                while (i < str.length) {
                    const a = str.charCodeAt(i++) || 0;
                    const b = str.charCodeAt(i++) || 0;
                    const c = str.charCodeAt(i++) || 0;
                    
                    const b1 = a >> 2;
                    const b2 = ((a & 3) << 4) | (b >> 4);
                    const b3 = ((b & 15) << 2) | (c >> 6);
                    const b4 = c & 63;
                    
                    result += base64Chars[b1] + base64Chars[b2];
                    result += i - 2 < str.length ? base64Chars[b3] : '=';
                    result += i - 1 < str.length ? base64Chars[b4] : '=';
                }
                
                return result;
            };
        }
        
        if (typeof atob === 'undefined') {
            GameGlobal.atob = (base64) => {
                const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
                let result = '';
                let i = 0;
                
                base64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');
                
                while (i < base64.length) {
                    const b1 = base64Chars.indexOf(base64[i++]);
                    const b2 = base64Chars.indexOf(base64[i++]);
                    const b3 = base64Chars.indexOf(base64[i++]);
                    const b4 = base64Chars.indexOf(base64[i++]);
                    
                    const a = (b1 << 2) | (b2 >> 4);
                    const b = ((b2 & 15) << 4) | (b3 >> 2);
                    const c = ((b3 & 3) << 6) | b4;
                    
                    result += String.fromCharCode(a);
                    if (b3 !== 64) result += String.fromCharCode(b);
                    if (b4 !== 64) result += String.fromCharCode(c);
                }
                
                return result;
            };
        }
        
        // 模拟 unescape（SVG 编码需要）
        if (typeof unescape === 'undefined') {
            GameGlobal.unescape = (str) => {
                return str.replace(/%([0-9A-Fa-f]{2})/g, (match, hex) => {
                    return String.fromCharCode(parseInt(hex, 16));
                });
            };
        }
        
        console.log('[weapp-adapter] 小游戏适配层加载完成');
    }

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
    let systemInfo$1 = null;

    // ========== 导出的平台 API ==========
    const Platform = {
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
            if (systemInfo$1) return systemInfo$1;
            
            if (isWeb) {
                systemInfo$1 = {
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
                    systemInfo$1 = {
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
                    systemInfo$1 = {
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
            return systemInfo$1;
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
            if (isWeb) ; else {
                console.log('[Platform] Calling nativeAPI.onTouchStart...');
                nativeAPI.onTouchStart(handler);
            }
        },
        
        // 注册触摸移动事件
        onTouchMove(handler) {
            this._touchMoveHandlers.push(handler);
            if (isWeb) ; else {
                nativeAPI.onTouchMove(handler);
            }
        },
        
        // 注册触摸结束事件
        onTouchEnd(handler) {
            this._touchEndHandlers.push(handler);
            if (isWeb) ; else {
                nativeAPI.onTouchEnd(handler);
            }
        },
        
        // 注册触摸取消事件
        onTouchCancel(handler) {
            this._touchCancelHandlers.push(handler);
            if (isWeb) ; else {
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

    const SVG_LIB = {
        // ... existing SVGs ...
        player: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="g"><feGaussianBlur stdDeviation="2"/></filter></defs><ellipse cx="64" cy="110" rx="30" ry="10" fill="rgba(0,0,0,0.5)"/><path d="M30 80 Q10 90 20 110" stroke="#3498db" stroke-width="4" fill="none"/><path d="M98 80 Q118 90 108 110" stroke="#3498db" stroke-width="4" fill="none"/><path d="M44 70 Q64 120 84 70 L 84 50 L 44 50 Z" fill="#ecf0f1"/><rect x="44" y="50" width="40" height="30" fill="#ecf0f1"/><path d="M44 50 L44 100 L64 90 L84 100 L84 50" fill="none" stroke="#2c3e50" stroke-width="2"/><path d="M64 50 L64 100" stroke="#3498db" stroke-width="4"/><circle cx="64" cy="40" r="22" fill="#ffe0b2"/><path d="M40 30 Q64 10 88 30 Q90 50 86 60 Q64 65 42 60 Q38 50 40 30" fill="#2c3e50"/><circle cx="64" cy="15" r="10" fill="#2c3e50"/><rect x="59" y="10" width="10" height="5" fill="#f1c40f"/><circle cx="56" cy="42" r="2" fill="#000"/><circle cx="72" cy="42" r="2" fill="#000"/></svg>`,
        
        // New Role SVGs
        player_sword: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <!-- 阴影 -->
        <ellipse cx="64" cy="120" rx="25" ry="8" fill="rgba(0,0,0,0.3)"/>
        <!-- 背后的剑 -->
        <rect x="85" y="25" width="6" height="70" rx="2" fill="#b0bec5" transform="rotate(15 88 60)"/>
        <path d="M88 20 L85 30 L91 30 Z" fill="#eceff1" transform="rotate(15 88 25)"/>
        <rect x="83" y="90" width="10" height="12" rx="2" fill="#5d4037" transform="rotate(15 88 96)"/>
        <!-- 身体/道袍 -->
        <path d="M44 75 Q44 120 64 115 Q84 120 84 75 L80 65 L48 65 Z" fill="#e3f2fd" stroke="#90caf9" stroke-width="1"/>
        <!-- 道袍领口 -->
        <path d="M52 65 L64 80 L76 65" fill="none" stroke="#1976d2" stroke-width="2"/>
        <!-- 腰带 -->
        <rect x="48" y="85" width="32" height="6" rx="2" fill="#1976d2"/>
        <!-- 小手 -->
        <circle cx="40" cy="85" r="8" fill="#ffcc80"/>
        <circle cx="88" cy="85" r="8" fill="#ffcc80"/>
        <!-- 袖子 -->
        <path d="M48 65 Q35 75 40 85" fill="#bbdefb" stroke="#90caf9"/>
        <path d="M80 65 Q93 75 88 85" fill="#bbdefb" stroke="#90caf9"/>
        <!-- 大头 -->
        <circle cx="64" cy="40" r="28" fill="#ffe0b2"/>
        <!-- 头发 -->
        <path d="M36 35 Q40 10 64 8 Q88 10 92 35 Q90 45 85 50 L80 35 Q64 40 48 35 L43 50 Q38 45 36 35" fill="#2c3e50"/>
        <!-- 发髻 -->
        <ellipse cx="64" cy="8" rx="10" ry="8" fill="#2c3e50"/>
        <rect x="62" y="2" width="4" height="12" fill="#f1c40f"/>
        <!-- 眼睛 -->
        <ellipse cx="54" cy="42" rx="5" ry="6" fill="#fff"/>
        <ellipse cx="74" cy="42" rx="5" ry="6" fill="#fff"/>
        <circle cx="55" cy="43" r="3" fill="#1a237e"/>
        <circle cx="75" cy="43" r="3" fill="#1a237e"/>
        <circle cx="56" cy="42" r="1" fill="#fff"/>
        <circle cx="76" cy="42" r="1" fill="#fff"/>
        <!-- 眉毛 -->
        <path d="M48 36 L60 38" stroke="#2c3e50" stroke-width="2" stroke-linecap="round"/>
        <path d="M68 38 L80 36" stroke="#2c3e50" stroke-width="2" stroke-linecap="round"/>
        <!-- 小嘴 -->
        <path d="M60 52 Q64 55 68 52" fill="none" stroke="#d7ccc8" stroke-width="2" stroke-linecap="round"/>
        <!-- 腮红 -->
        <ellipse cx="45" cy="48" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>
        <ellipse cx="83" cy="48" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>
    </svg>`,
        player_mage: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <!-- 阴影 -->
        <ellipse cx="64" cy="120" rx="25" ry="8" fill="rgba(0,0,0,0.3)"/>
        <!-- 身体/道袍 -->
        <path d="M42 75 Q40 120 64 115 Q88 120 86 75 L82 65 L46 65 Z" fill="#fff3e0" stroke="#ffb74d" stroke-width="1"/>
        <!-- 道袍火焰纹 -->
        <path d="M50 100 Q55 90 50 85 Q55 80 52 75" fill="none" stroke="#ff5722" stroke-width="2" opacity="0.6"/>
        <path d="M78 100 Q73 90 78 85 Q73 80 76 75" fill="none" stroke="#ff5722" stroke-width="2" opacity="0.6"/>
        <!-- 道袍领口 -->
        <path d="M52 65 L64 78 L76 65" fill="none" stroke="#e65100" stroke-width="2"/>
        <!-- 腰带 -->
        <rect x="46" y="85" width="36" height="6" rx="2" fill="#e65100"/>
        <circle cx="64" cy="88" r="4" fill="#ffc107"/>
        <!-- 小手 -->
        <circle cx="38" cy="82" r="8" fill="#ffcc80"/>
        <circle cx="90" cy="82" r="8" fill="#ffcc80"/>
        <!-- 袖子 -->
        <path d="M46 65 Q30 72 38 82" fill="#ffe0b2" stroke="#ffb74d"/>
        <path d="M82 65 Q98 72 90 82" fill="#ffe0b2" stroke="#ffb74d"/>
        <!-- 法印光效 -->
        <circle cx="38" cy="82" r="12" fill="none" stroke="#ff9800" stroke-width="2" opacity="0.5"/>
        <!-- 大头 -->
        <circle cx="64" cy="40" r="28" fill="#ffe0b2"/>
        <!-- 道冠 -->
        <path d="M40 30 Q64 5 88 30 L85 38 Q64 28 43 38 Z" fill="#bf360c"/>
        <ellipse cx="64" cy="18" rx="12" ry="8" fill="#d84315"/>
        <circle cx="64" cy="12" r="6" fill="#ffc107"/>
        <!-- 眼睛 -->
        <ellipse cx="54" cy="42" rx="5" ry="6" fill="#fff"/>
        <ellipse cx="74" cy="42" rx="5" ry="6" fill="#fff"/>
        <circle cx="55" cy="43" r="3" fill="#4a148c"/>
        <circle cx="75" cy="43" r="3" fill="#4a148c"/>
        <circle cx="56" cy="42" r="1" fill="#fff"/>
        <circle cx="76" cy="42" r="1" fill="#fff"/>
        <!-- 眉毛 -->
        <path d="M48 36 L60 37" stroke="#5d4037" stroke-width="2" stroke-linecap="round"/>
        <path d="M68 37 L80 36" stroke="#5d4037" stroke-width="2" stroke-linecap="round"/>
        <!-- 小嘴 -->
        <ellipse cx="64" cy="54" rx="3" ry="2" fill="#d7ccc8"/>
        <!-- 腮红 -->
        <ellipse cx="45" cy="48" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>
        <ellipse cx="83" cy="48" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>
        <!-- 胡须 -->
        <path d="M58 56 Q54 65 50 70" fill="none" stroke="#8d6e63" stroke-width="1" opacity="0.6"/>
        <path d="M70 56 Q74 65 78 70" fill="none" stroke="#8d6e63" stroke-width="1" opacity="0.6"/>
    </svg>`,
        player_body: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <!-- 阴影 -->
        <ellipse cx="64" cy="120" rx="28" ry="8" fill="rgba(0,0,0,0.3)"/>
        <!-- 身体/短打 -->
        <path d="M38 70 Q35 120 64 115 Q93 120 90 70 L85 62 L43 62 Z" fill="#5d4037" stroke="#3e2723" stroke-width="1"/>
        <!-- 腰带 -->
        <rect x="42" y="82" width="44" height="8" rx="2" fill="#ffb300"/>
        <rect x="58" y="80" width="12" height="12" rx="2" fill="#ff8f00"/>
        <!-- 胸肌纹理 -->
        <path d="M50 70 Q64 75 78 70" fill="none" stroke="#4e342e" stroke-width="2" opacity="0.5"/>
        <!-- 大手臂 -->
        <ellipse cx="32" cy="80" rx="14" ry="18" fill="#ffcc80"/>
        <ellipse cx="96" cy="80" rx="14" ry="18" fill="#ffcc80"/>
        <!-- 拳头 -->
        <circle cx="28" cy="95" r="12" fill="#ffcc80" stroke="#ffb74d" stroke-width="1"/>
        <circle cx="100" cy="95" r="12" fill="#ffcc80" stroke="#ffb74d" stroke-width="1"/>
        <!-- 袖口 -->
        <ellipse cx="35" cy="65" rx="12" ry="8" fill="#4e342e"/>
        <ellipse cx="93" cy="65" rx="12" ry="8" fill="#4e342e"/>
        <!-- 大头 -->
        <circle cx="64" cy="38" r="30" fill="#ffcc80"/>
        <!-- 头发（光头+鬓角） -->
        <path d="M34 30 Q64 15 94 30 Q95 25 64 18 Q33 25 34 30" fill="#3e2723"/>
        <!-- 粗眉 -->
        <path d="M42 30 L58 32" stroke="#3e2723" stroke-width="4" stroke-linecap="round"/>
        <path d="M70 32 L86 30" stroke="#3e2723" stroke-width="4" stroke-linecap="round"/>
        <!-- 眼睛（凶悍） -->
        <ellipse cx="52" cy="40" rx="6" ry="5" fill="#fff"/>
        <ellipse cx="76" cy="40" rx="6" ry="5" fill="#fff"/>
        <circle cx="53" cy="41" r="3" fill="#4e342e"/>
        <circle cx="77" cy="41" r="3" fill="#4e342e"/>
        <circle cx="54" cy="40" r="1" fill="#fff"/>
        <circle cx="78" cy="40" r="1" fill="#fff"/>
        <!-- 鼻子 -->
        <ellipse cx="64" cy="48" rx="4" ry="3" fill="#ffb74d"/>
        <!-- 大嘴 -->
        <path d="M54 56 Q64 62 74 56" fill="none" stroke="#5d4037" stroke-width="3" stroke-linecap="round"/>
        <!-- 胡茬 -->
        <rect x="55" y="58" width="18" height="6" rx="2" fill="#5d4037" opacity="0.3"/>
        <!-- 伤疤 -->
        <path d="M78 35 L85 45" stroke="#d7ccc8" stroke-width="2"/>
    </svg>`,
        
        player_ghost: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <!-- 阴影（紫色） -->
        <ellipse cx="64" cy="120" rx="25" ry="8" fill="rgba(74,20,140,0.4)"/>
        <!-- 阴气缭绕 -->
        <ellipse cx="50" cy="115" rx="15" ry="6" fill="#7b1fa2" opacity="0.3"/>
        <ellipse cx="78" cy="118" rx="12" ry="5" fill="#9c27b0" opacity="0.2"/>
        <!-- 身体/鬼袍 -->
        <path d="M40 72 Q35 125 64 118 Q93 125 88 72 L82 62 L46 62 Z" fill="#311b92" stroke="#4a148c" stroke-width="1"/>
        <!-- 袍子飘带 -->
        <path d="M40 90 Q30 100 35 115" fill="none" stroke="#7c4dff" stroke-width="2" opacity="0.6"/>
        <path d="M88 90 Q98 100 93 115" fill="none" stroke="#7c4dff" stroke-width="2" opacity="0.6"/>
        <!-- 领口 -->
        <path d="M52 62 L64 75 L76 62" fill="none" stroke="#7c4dff" stroke-width="2"/>
        <!-- 腰带 -->
        <rect x="45" y="82" width="38" height="5" rx="2" fill="#7c4dff"/>
        <!-- 幽魂小手 -->
        <circle cx="35" cy="85" r="7" fill="#e1bee7"/>
        <circle cx="93" cy="85" r="7" fill="#e1bee7"/>
        <!-- 袖子 -->
        <path d="M46 62 Q28 72 35 85" fill="#4527a0" stroke="#311b92"/>
        <path d="M82 62 Q100 72 93 85" fill="#4527a0" stroke="#311b92"/>
        <!-- 大头（苍白） -->
        <circle cx="64" cy="38" r="28" fill="#e1bee7"/>
        <!-- 长发 -->
        <path d="M36 32 Q64 8 92 32 L95 55 Q90 50 85 55 L80 45 Q64 52 48 45 L43 55 Q38 50 33 55 L36 32" fill="#212121"/>
        <!-- 发丝飘动 -->
        <path d="M33 55 Q25 70 30 85" fill="none" stroke="#212121" stroke-width="3"/>
        <path d="M95 55 Q103 70 98 85" fill="none" stroke="#212121" stroke-width="3"/>
        <!-- 眼睛（幽光） -->
        <ellipse cx="54" cy="40" rx="6" ry="7" fill="#e8eaf6"/>
        <ellipse cx="74" cy="40" rx="6" ry="7" fill="#e8eaf6"/>
        <circle cx="54" cy="41" r="4" fill="#7c4dff"/>
        <circle cx="74" cy="41" r="4" fill="#7c4dff"/>
        <circle cx="55" cy="40" r="1.5" fill="#fff"/>
        <circle cx="75" cy="40" r="1.5" fill="#fff"/>
        <!-- 眉毛 -->
        <path d="M46 33 L58 36" stroke="#37474f" stroke-width="2" stroke-linecap="round"/>
        <path d="M70 36 L82 33" stroke="#37474f" stroke-width="2" stroke-linecap="round"/>
        <!-- 小嘴（无表情） -->
        <path d="M60 52 L68 52" stroke="#9575cd" stroke-width="2" stroke-linecap="round"/>
        <!-- 阴气符文 -->
        <text x="58" y="95" font-size="12" fill="#b388ff" opacity="0.7">鬼</text>
    </svg>`,
        player_formation: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <!-- 阴影 -->
        <ellipse cx="64" cy="120" rx="25" ry="8" fill="rgba(0,0,0,0.3)"/>
        <!-- 阵法光环 -->
        <circle cx="64" cy="100" r="20" fill="none" stroke="#00bcd4" stroke-width="1" opacity="0.4"/>
        <circle cx="64" cy="100" r="28" fill="none" stroke="#00bcd4" stroke-width="1" opacity="0.2" stroke-dasharray="4,4"/>
        <!-- 身体/儒袍 -->
        <path d="M42 72 Q40 120 64 115 Q88 120 86 72 L80 62 L48 62 Z" fill="#eceff1" stroke="#b0bec5" stroke-width="1"/>
        <!-- 袍子纹理 -->
        <path d="M55 75 L55 110" stroke="#cfd8dc" stroke-width="1"/>
        <path d="M73 75 L73 110" stroke="#cfd8dc" stroke-width="1"/>
        <!-- 领口 -->
        <path d="M52 62 L64 76 L76 62" fill="none" stroke="#546e7a" stroke-width="2"/>
        <!-- 腰带 -->
        <rect x="46" y="84" width="36" height="5" rx="2" fill="#546e7a"/>
        <!-- 玉佩 -->
        <circle cx="64" cy="95" r="5" fill="#80deea" stroke="#00bcd4"/>
        <!-- 小手（持罗盘） -->
        <circle cx="38" cy="85" r="7" fill="#ffcc80"/>
        <circle cx="90" cy="85" r="7" fill="#ffcc80"/>
        <!-- 罗盘 -->
        <circle cx="38" cy="85" r="10" fill="#37474f" stroke="#546e7a"/>
        <circle cx="38" cy="85" r="6" fill="#263238"/>
        <path d="M38 79 L38 91 M32 85 L44 85" stroke="#00bcd4" stroke-width="1"/>
        <!-- 袖子 -->
        <path d="M48 62 Q32 70 38 85" fill="#cfd8dc" stroke="#b0bec5"/>
        <path d="M80 62 Q96 70 90 85" fill="#cfd8dc" stroke="#b0bec5"/>
        <!-- 大头 -->
        <circle cx="64" cy="38" r="28" fill="#ffe0b2"/>
        <!-- 头发（儒冠） -->
        <path d="M38 32 Q64 12 90 32 L88 42 Q64 35 40 42 Z" fill="#37474f"/>
        <!-- 儒冠 -->
        <rect x="52" y="8" width="24" height="18" rx="3" fill="#455a64"/>
        <rect x="56" y="5" width="16" height="6" rx="2" fill="#546e7a"/>
        <rect x="62" y="2" width="4" height="8" fill="#78909c"/>
        <!-- 眼睛（睿智） -->
        <ellipse cx="54" cy="42" rx="5" ry="6" fill="#fff"/>
        <ellipse cx="74" cy="42" rx="5" ry="6" fill="#fff"/>
        <circle cx="55" cy="43" r="3" fill="#263238"/>
        <circle cx="75" cy="43" r="3" fill="#263238"/>
        <circle cx="56" cy="42" r="1" fill="#fff"/>
        <circle cx="76" cy="42" r="1" fill="#fff"/>
        <!-- 眉毛（细长） -->
        <path d="M46 36 L60 38" stroke="#455a64" stroke-width="2" stroke-linecap="round"/>
        <path d="M68 38 L82 36" stroke="#455a64" stroke-width="2" stroke-linecap="round"/>
        <!-- 小嘴（淡定） -->
        <path d="M60 53 Q64 55 68 53" fill="none" stroke="#bcaaa4" stroke-width="2" stroke-linecap="round"/>
        <!-- 腮红 -->
        <ellipse cx="45" cy="48" rx="4" ry="2" fill="#ffcdd2" opacity="0.5"/>
        <ellipse cx="83" cy="48" rx="4" ry="2" fill="#ffcdd2" opacity="0.5"/>
    </svg>`,

        // ========== 法宝专属图标 ==========
        // 诛仙剑阵 - 四剑交叉阵法
        artifact_zhuxian: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="28" fill="none" stroke="#00bcd4" stroke-width="2" stroke-dasharray="4,2"/>
        <path d="M30 2 L30 58" stroke="#00bcd4" stroke-width="3"/>
        <path d="M2 30 L58 30" stroke="#00bcd4" stroke-width="3"/>
        <path d="M10 10 L50 50" stroke="#4dd0e1" stroke-width="2"/>
        <path d="M50 10 L10 50" stroke="#4dd0e1" stroke-width="2"/>
        <circle cx="30" cy="30" r="8" fill="#00bcd4"/>
        <circle cx="30" cy="30" r="4" fill="#e0f7fa"/>
    </svg>`,
        
        // 金蛟剪 - 金色交叉剪刀
        artifact_jinjiao: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 5 L35 30 L15 55" fill="none" stroke="#f1c40f" stroke-width="4" stroke-linecap="round"/>
        <path d="M45 5 L25 30 L45 55" fill="none" stroke="#f39c12" stroke-width="4" stroke-linecap="round"/>
        <circle cx="30" cy="30" r="6" fill="#f1c40f" stroke="#e67e22" stroke-width="2"/>
        <circle cx="15" cy="5" r="4" fill="#f1c40f"/>
        <circle cx="45" cy="5" r="4" fill="#f39c12"/>
    </svg>`,
        
        // 玄武盾 - 龟壳盾牌
        artifact_xuanwu: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 5 L55 20 L55 45 L30 58 L5 45 L5 20 Z" fill="#2e7d32" stroke="#1b5e20" stroke-width="2"/>
        <path d="M30 15 L45 25 L45 40 L30 48 L15 40 L15 25 Z" fill="#388e3c" stroke="#2e7d32" stroke-width="1"/>
        <path d="M30 25 L38 30 L38 38 L30 42 L22 38 L22 30 Z" fill="#4caf50"/>
        <circle cx="30" cy="33" r="5" fill="#81c784"/>
    </svg>`,
        
        // 乾坤圈 - 金色光环
        artifact_qiankun: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="25" fill="none" stroke="#f1c40f" stroke-width="6"/>
        <circle cx="30" cy="30" r="20" fill="none" stroke="#f39c12" stroke-width="2"/>
        <circle cx="30" cy="30" r="15" fill="none" stroke="#e67e22" stroke-width="1"/>
        <circle cx="30" cy="5" r="3" fill="#fff"/>
        <circle cx="30" cy="55" r="3" fill="#fff"/>
        <circle cx="5" cy="30" r="3" fill="#fff"/>
        <circle cx="55" cy="30" r="3" fill="#fff"/>
    </svg>`,
        
        // 风火轮 - 火焰轮子
        artifact_fenghuo: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="20" fill="none" stroke="#ff5722" stroke-width="4"/>
        <path d="M30 10 Q40 20 30 30 Q20 20 30 10" fill="#ff9800"/>
        <path d="M50 30 Q40 40 30 30 Q40 20 50 30" fill="#ff5722"/>
        <path d="M30 50 Q20 40 30 30 Q40 40 30 50" fill="#ff9800"/>
        <path d="M10 30 Q20 20 30 30 Q20 40 10 30" fill="#ff5722"/>
        <circle cx="30" cy="30" r="6" fill="#ffeb3b"/>
    </svg>`,
        
        // 定海神珠 - 蓝色神珠
        artifact_dinghai: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="pearl"><stop offset="0%" stop-color="#e3f2fd"/><stop offset="50%" stop-color="#2196f3"/><stop offset="100%" stop-color="#0d47a1"/></radialGradient></defs>
        <circle cx="30" cy="30" r="25" fill="url(#pearl)"/>
        <circle cx="22" cy="22" r="8" fill="rgba(255,255,255,0.6)"/>
        <circle cx="30" cy="30" r="28" fill="none" stroke="#64b5f6" stroke-width="2" stroke-dasharray="8,4"/>
    </svg>`,
        
        // 聚宝盆 - 金元宝盆
        artifact_jubao: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="30" cy="45" rx="25" ry="12" fill="#8d6e63" stroke="#5d4037" stroke-width="2"/>
        <path d="M5 45 Q5 25 30 20 Q55 25 55 45" fill="#a1887f" stroke="#5d4037" stroke-width="2"/>
        <ellipse cx="30" cy="20" rx="12" ry="6" fill="#f1c40f" stroke="#f39c12" stroke-width="1"/>
        <path d="M20 18 Q30 10 40 18" fill="#f1c40f" stroke="#e67e22" stroke-width="1"/>
        <ellipse cx="22" cy="35" rx="6" ry="4" fill="#f1c40f"/>
        <ellipse cx="38" cy="38" rx="5" ry="3" fill="#f39c12"/>
    </svg>`,
        
        // 虚天鼎 - 三足青铜鼎
        artifact_fantian: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 55 L20 35 L40 35 L45 55" fill="#8d6e63" stroke="#5d4037" stroke-width="2"/>
        <rect x="18" y="20" width="24" height="15" fill="#a1887f" stroke="#5d4037" stroke-width="2"/>
        <rect x="22" y="10" width="4" height="12" fill="#8d6e63"/>
        <rect x="34" y="10" width="4" height="12" fill="#8d6e63"/>
        <ellipse cx="30" cy="20" rx="12" ry="4" fill="#bcaaa4" stroke="#8d6e63"/>
        <path d="M25 27 L35 27" stroke="#5d4037" stroke-width="2"/>
        <circle cx="30" cy="5" r="4" fill="#ff5722"/>
    </svg>`,
        
        // 乾蓝冰焰 - 冰火阴阳
        artifact_mirror: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="28" fill="#fff" stroke="#bdc3c7" stroke-width="2"/>
        <path d="M30 2 A 28 28 0 0 1 30 58 A 14 14 0 0 1 30 30 A 14 14 0 0 0 30 2" fill="#2196f3"/>
        <path d="M30 2 A 28 28 0 0 0 30 58 A 14 14 0 0 0 30 30 A 14 14 0 0 1 30 2" fill="#ff5722"/>
        <circle cx="30" cy="16" r="4" fill="#ff5722"/>
        <circle cx="30" cy="44" r="4" fill="#2196f3"/>
    </svg>`,
        
        // 玄天斩灵 - 紫金葫芦
        artifact_gourd: `<svg width="60" height="70" viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 70 C12 70 5 55 12 38 C16 30 24 28 26 20" fill="#9c27b0" stroke="#7b1fa2" stroke-width="2"/>
        <path d="M30 70 C48 70 55 55 48 38 C44 30 36 28 34 20" fill="#9c27b0" stroke="#7b1fa2" stroke-width="2"/>
        <ellipse cx="30" cy="12" rx="10" ry="12" fill="#ab47bc" stroke="#7b1fa2" stroke-width="2"/>
        <rect x="28" y="0" width="4" height="6" fill="#f1c40f"/>
        <path d="M22 0 L30 3 L38 0" fill="none" stroke="#f1c40f" stroke-width="2"/>
        <ellipse cx="30" cy="45" rx="8" ry="10" fill="rgba(255,255,255,0.2)"/>
    </svg>`,
        
        // 兼容旧代码
        fantian_seal: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="44" height="44" fill="#f1c40f" stroke="#f39c12" stroke-width="3"/><path d="M8 8 L52 52 M52 8 L8 52" stroke="#e67e22" stroke-width="2"/><rect x="18" y="18" width="24" height="24" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/><circle cx="30" cy="30" r="6" fill="#f1c40f"/></svg>`,
        yinyang_mirror: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="28" fill="#fff" stroke="#bdc3c7" stroke-width="2"/><path d="M30 2 A 28 28 0 0 1 30 58 A 14 14 0 0 1 30 30 A 14 14 0 0 0 30 2" fill="#000"/><circle cx="30" cy="16" r="4" fill="#fff"/><circle cx="30" cy="44" r="4" fill="#000"/></svg>`,
        slaying_gourd: `<svg width="60" height="70" viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg"><path d="M30 70 C10 70 0 50 10 35 C15 27 25 25 25 18 L25 10 L35 10 L35 18 C35 25 45 27 50 35 C60 50 50 70 30 70" fill="#e67e22" stroke="#d35400" stroke-width="2"/><path d="M30 10 L30 2 L45 5" stroke="#f1c40f" stroke-width="3"/></svg>`,

        sword: `<svg width="64" height="128" viewBox="0 0 64 128" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#00bcd4"/></linearGradient></defs><path d="M32 0 L22 20 L28 100 L36 100 L42 20 Z" fill="url(#sg)"/><rect x="20" y="90" width="24" height="6" fill="#f1c40f"/><circle cx="32" cy="110" r="4" fill="#f1c40f"/></svg>`,
        
        fire: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="fg"><stop offset="0%" stop-color="#ffff00"/><stop offset="50%" stop-color="#ff5722"/><stop offset="100%" stop-color="rgba(255,0,0,0)"/></radialGradient></defs><circle cx="32" cy="32" r="28" fill="url(#fg)"/><path d="M32 60 Q10 40 32 10 Q54 40 32 60" fill="#ff9800" opacity="0.7"/></svg>`,
        
        wolf: `<svg width="48" height="32" viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg"><path d="M10 20 L0 10 L15 5 L30 15 L45 10 L48 20 L30 30 L10 25 Z" fill="#a1887f" stroke="#5d4037"/><circle cx="10" cy="15" r="2" fill="#fff"/></svg>`,
        note: `<svg width="32" height="48" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg"><ellipse cx="10" cy="40" rx="8" ry="6" fill="#e91e63" transform="rotate(-20 10 40)"/><rect x="16" y="5" width="4" height="35" fill="#e91e63"/><path d="M16 5 Q32 15 32 30" stroke="#e91e63" stroke-width="4" fill="none"/></svg>`,
        
        thunder: `<svg width="40" height="100" viewBox="0 0 40 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 0 L0 40 L15 40 L5 100 L35 50 L20 50 L40 10 Z" fill="#fff" stroke="#ffeb3b" stroke-width="2" stroke-linejoin="round"/></svg>`,

        leaf: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M24 46 Q4 30 4 14 Q4 2 24 2 Q44 2 44 14 Q44 30 24 46 M24 2 L24 46" fill="#2ecc71" stroke="#27ae60" stroke-width="2"/></svg>`,
        ice: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M24 0 L30 18 L48 24 L30 30 L24 48 L18 30 L0 24 L18 18 Z" fill="#e1f5fe" stroke="#03a9f4" stroke-width="2"/></svg>`,
        
        rock_b: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M10 30 L5 20 L15 5 L30 8 L35 25 L25 35 Z" fill="#795548" stroke="#5d4037" stroke-width="2"/></svg>`,

        // Q萌怪物
        bat: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 翅膀 -->
        <path d="M8 28 Q2 18 8 12 Q14 8 20 15 L24 28" fill="#8e44ad" stroke="#6c3483" stroke-width="1"/>
        <path d="M56 28 Q62 18 56 12 Q50 8 44 15 L40 28" fill="#8e44ad" stroke="#6c3483" stroke-width="1"/>
        <!-- 圆身体 -->
        <ellipse cx="32" cy="35" rx="16" ry="14" fill="#9b59b6"/>
        <!-- 大眼睛 -->
        <ellipse cx="26" cy="32" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="38" cy="32" rx="6" ry="7" fill="#fff"/>
        <circle cx="27" cy="33" r="3" fill="#2c3e50"/>
        <circle cx="39" cy="33" r="3" fill="#2c3e50"/>
        <circle cx="28" cy="32" r="1" fill="#fff"/>
        <circle cx="40" cy="32" r="1" fill="#fff"/>
        <!-- 小尖牙 -->
        <path d="M28 42 L30 46 L32 42" fill="#fff"/>
        <path d="M32 42 L34 46 L36 42" fill="#fff"/>
        <!-- 小耳朵 -->
        <path d="M22 22 L20 12 L28 20" fill="#8e44ad"/>
        <path d="M42 22 L44 12 L36 20" fill="#8e44ad"/>
        <!-- 腮红 -->
        <ellipse cx="20" cy="38" rx="4" ry="2" fill="#e91e63" opacity="0.4"/>
        <ellipse cx="44" cy="38" rx="4" ry="2" fill="#e91e63" opacity="0.4"/>
    </svg>`,
        bat_fire: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 火焰光环 -->
        <ellipse cx="32" cy="35" rx="22" ry="18" fill="#ff5722" opacity="0.3"/>
        <!-- 翅膀 -->
        <path d="M8 28 Q2 18 8 12 Q14 8 20 15 L24 28" fill="#e65100" stroke="#bf360c" stroke-width="1"/>
        <path d="M56 28 Q62 18 56 12 Q50 8 44 15 L40 28" fill="#e65100" stroke="#bf360c" stroke-width="1"/>
        <!-- 圆身体 -->
        <ellipse cx="32" cy="35" rx="16" ry="14" fill="#ff5722"/>
        <!-- 火焰纹 -->
        <path d="M24 40 Q28 35 26 30" stroke="#ffeb3b" stroke-width="2" fill="none" opacity="0.6"/>
        <path d="M40 40 Q36 35 38 30" stroke="#ffeb3b" stroke-width="2" fill="none" opacity="0.6"/>
        <!-- 大眼睛 -->
        <ellipse cx="26" cy="32" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="38" cy="32" rx="6" ry="7" fill="#fff"/>
        <circle cx="27" cy="33" r="3" fill="#c62828"/>
        <circle cx="39" cy="33" r="3" fill="#c62828"/>
        <circle cx="28" cy="32" r="1" fill="#ffeb3b"/>
        <circle cx="40" cy="32" r="1" fill="#ffeb3b"/>
        <!-- 小尖牙 -->
        <path d="M28 42 L30 46 L32 42" fill="#fff"/>
        <path d="M32 42 L34 46 L36 42" fill="#fff"/>
        <!-- 小耳朵（带火焰） -->
        <path d="M22 22 L20 10 L28 20" fill="#ff5722"/>
        <path d="M42 22 L44 10 L36 20" fill="#ff5722"/>
        <circle cx="20" cy="10" r="3" fill="#ffeb3b" opacity="0.8"/>
        <circle cx="44" cy="10" r="3" fill="#ffeb3b" opacity="0.8"/>
    </svg>`,
        ghost: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 飘动的身体 -->
        <path d="M16 25 Q16 8 32 8 Q48 8 48 25 L48 45 Q44 50 40 45 Q36 50 32 45 Q28 50 24 45 Q20 50 16 45 Z" fill="#26a69a" opacity="0.8"/>
        <!-- 内部高光 -->
        <ellipse cx="32" cy="25" rx="10" ry="8" fill="#80cbc4" opacity="0.5"/>
        <!-- 大眼睛 -->
        <ellipse cx="25" cy="25" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="39" cy="25" rx="6" ry="7" fill="#fff"/>
        <circle cx="26" cy="26" r="3" fill="#004d40"/>
        <circle cx="40" cy="26" r="3" fill="#004d40"/>
        <circle cx="27" cy="25" r="1" fill="#fff"/>
        <circle cx="41" cy="25" r="1" fill="#fff"/>
        <!-- 小嘴（惊讶） -->
        <ellipse cx="32" cy="36" rx="4" ry="3" fill="#004d40" opacity="0.6"/>
        <!-- 腮红 -->
        <ellipse cx="18" cy="30" rx="3" ry="2" fill="#e91e63" opacity="0.3"/>
        <ellipse cx="46" cy="30" rx="3" ry="2" fill="#e91e63" opacity="0.3"/>
    </svg>`,
        ghost_ice: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 冰霜光环 -->
        <ellipse cx="32" cy="30" rx="26" ry="22" fill="#e1f5fe" opacity="0.3"/>
        <!-- 飘动的身体 -->
        <path d="M16 25 Q16 8 32 8 Q48 8 48 25 L48 45 Q44 50 40 45 Q36 50 32 45 Q28 50 24 45 Q20 50 16 45 Z" fill="#4fc3f7" opacity="0.8"/>
        <!-- 冰晶纹理 -->
        <path d="M32 12 L32 20 M28 16 L36 16" stroke="#e1f5fe" stroke-width="2"/>
        <path d="M22 35 L22 40 M20 37 L24 37" stroke="#e1f5fe" stroke-width="1"/>
        <path d="M42 35 L42 40 M40 37 L44 37" stroke="#e1f5fe" stroke-width="1"/>
        <!-- 大眼睛 -->
        <ellipse cx="25" cy="25" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="39" cy="25" rx="6" ry="7" fill="#fff"/>
        <circle cx="26" cy="26" r="3" fill="#0277bd"/>
        <circle cx="40" cy="26" r="3" fill="#0277bd"/>
        <circle cx="27" cy="25" r="1" fill="#e1f5fe"/>
        <circle cx="41" cy="25" r="1" fill="#e1f5fe"/>
        <!-- 小嘴（冷） -->
        <path d="M28 36 Q32 34 36 36" fill="none" stroke="#0277bd" stroke-width="2"/>
        <!-- 腮红（冰蓝） -->
        <ellipse cx="18" cy="30" rx="3" ry="2" fill="#81d4fa" opacity="0.5"/>
        <ellipse cx="46" cy="30" rx="3" ry="2" fill="#81d4fa" opacity="0.5"/>
    </svg>`,
        rock: `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- 圆润石头身体 -->
        <ellipse cx="40" cy="45" rx="28" ry="25" fill="#795548"/>
        <ellipse cx="40" cy="42" rx="24" ry="20" fill="#8d6e63"/>
        <!-- 石纹 -->
        <path d="M25 50 Q30 45 28 40" stroke="#5d4037" stroke-width="2" fill="none"/>
        <path d="M55 50 Q50 45 52 40" stroke="#5d4037" stroke-width="2" fill="none"/>
        <!-- 大眼睛 -->
        <ellipse cx="30" cy="38" rx="8" ry="9" fill="#fff"/>
        <ellipse cx="50" cy="38" rx="8" ry="9" fill="#fff"/>
        <circle cx="32" cy="40" r="4" fill="#3e2723"/>
        <circle cx="52" cy="40" r="4" fill="#3e2723"/>
        <circle cx="33" cy="39" r="1.5" fill="#fff"/>
        <circle cx="53" cy="39" r="1.5" fill="#fff"/>
        <!-- 粗眉（凶萌） -->
        <path d="M22 30 L36 34" stroke="#3e2723" stroke-width="3" stroke-linecap="round"/>
        <path d="M58 30 L44 34" stroke="#3e2723" stroke-width="3" stroke-linecap="round"/>
        <!-- 嘴巴（呲牙） -->
        <path d="M32 52 Q40 58 48 52" fill="none" stroke="#3e2723" stroke-width="2"/>
        <rect x="36" y="52" width="4" height="5" fill="#fff" rx="1"/>
        <rect x="42" y="52" width="4" height="5" fill="#fff" rx="1"/>
    </svg>`,
        chest: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="24" width="40" height="28" rx="4" fill="#f39c12" stroke="#e67e22" stroke-width="2"/><path d="M12 24 L20 12 L44 12 L52 24" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/><rect x="28" y="32" width="8" height="10" fill="#e74c3c" rx="1"/><circle cx="32" cy="37" r="2" fill="#f1c40f"/></svg>`,
        
        pavilion: `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="M60 10 L10 40 L20 40 L15 55 L105 55 L100 40 L110 40 Z" fill="#c0392b" stroke="#a93226" stroke-width="2"/><rect x="25" y="55" width="10" height="45" fill="#8e44ad"/><rect x="85" y="55" width="10" height="45" fill="#8e44ad"/><rect x="35" y="90" width="50" height="10" fill="#d35400"/><path d="M10 100 L110 100 L100 110 L20 110 Z" fill="#bdc3c7"/></svg>`,
        gate: `<svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="10" height="100" fill="#95a5a6"/><rect x="80" y="20" width="10" height="100" fill="#95a5a6"/><rect x="5" y="30" width="90" height="10" fill="#bdc3c7"/><path d="M0 20 L50 5 L100 20 L100 30 L0 30 Z" fill="#34495e" stroke="#2c3e50"/><rect x="30" y="40" width="40" height="10" fill="#f1c40f"/></svg>`,
        pine: `<svg width="80" height="120" viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg"><path d="M40 10 L10 50 L70 50 Z" fill="#2ecc71" stroke="#27ae60"/><path d="M40 40 L5 80 L75 80 Z" fill="#27ae60" stroke="#2ecc71"/><path d="M40 70 L0 110 L80 110 Z" fill="#1e8449" stroke="#27ae60"/><rect x="35" y="110" width="10" height="10" fill="#795548"/><path d="M10 50 L20 50 L15 60 L25 60" stroke="white" fill="none" stroke-width="2" opacity="0.7"/></svg>`,
        tree_forest: `<svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><path d="M50 110 L50 50" stroke="#4e342e" stroke-width="14"/><path d="M50 50 Q20 30 10 60 Q0 30 30 10 Q10 -10 50 10 Q90 -10 70 10 Q100 30 90 60 Q80 30 50 50" fill="#1b5e20" stroke="#2e7d32" stroke-width="2"/><path d="M45 110 L30 120 M55 110 L70 120" stroke="#4e342e" stroke-width="6"/></svg>`,
        bush: `<svg width="60" height="40" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="25" r="15" fill="#2e7d32"/><circle cx="45" cy="25" r="15" fill="#2e7d32"/><circle cx="30" cy="15" r="18" fill="#388e3c"/></svg>`,
        stone_s: `<svg width="60" height="50" viewBox="0 0 60 50" xmlns="http://www.w3.org/2000/svg"><path d="M10 50 L0 30 L20 10 L40 5 L60 30 L50 50 Z" fill="#7f8c8d"/><path d="M20 10 L40 5 L50 20 L10 20 Z" fill="#fff" opacity="0.9"/></svg>`,
        
        // 装饰用岩石（无眼睛）
        magma_rock_deco: `<svg width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg"><path d="M35 5 L65 35 L50 65 L20 65 L5 35 Z" fill="#3e2723"/><path d="M35 5 L35 35 L65 35" fill="none" stroke="#ff5722" stroke-width="3"/><path d="M20 55 L35 35 L50 65" fill="none" stroke="#ff5722" stroke-width="3"/></svg>`,
        
        // 装饰用水晶（无眼睛）
        crystal_deco: `<svg width="50" height="80" viewBox="0 0 50 80" xmlns="http://www.w3.org/2000/svg"><path d="M25 0 L50 30 L25 80 L0 30 Z" fill="#4fc3f7" opacity="0.8"/><path d="M25 0 L25 80" stroke="#e1f5fe" stroke-width="2"/><path d="M0 30 L50 30" stroke="#e1f5fe" stroke-width="1" opacity="0.5"/><path d="M10 20 L20 10 L20 30" fill="#e1f5fe" opacity="0.6"/></svg>`,
        
        // Chinese Tomb Assets
        grave_mound: `<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><path d="M10 60 Q50 -20 90 60 Z" fill="#5d4037"/><path d="M20 50 Q50 0 80 50" fill="none" stroke="#795548" stroke-width="2"/><circle cx="30" cy="55" r="2" fill="#3e2723"/><circle cx="70" cy="55" r="2" fill="#3e2723"/><path d="M40 60 L40 45 L45 40 L50 45 L50 60 Z" fill="#7f8c8d" opacity="0.8"/></svg>`,
        stele_c: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M5 40 L5 15 Q20 0 35 15 L35 40 Z" fill="#757575" stroke="#424242"/><rect x="12" y="20" width="16" height="20" fill="#424242"/><path d="M15 25 L25 25 M15 35 L25 35" stroke="#9e9e9e" stroke-width="2"/></svg>`,
        paper_money_r: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8" fill="#ecf0f1" stroke="#bdc3c7"/><rect x="8" y="8" width="4" height="4" fill="#bdc3c7"/></svg>`,
        paper_money_s: `<svg width="20" height="25" viewBox="0 0 20 25" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="16" height="21" fill="#f1c40f" stroke="#f39c12"/><circle cx="10" cy="12" r="4" fill="none" stroke="#e67e22"/></svg>`,
        
        crystal: `<svg width="64" height="80" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
        <!-- 光晕 -->
        <ellipse cx="32" cy="50" rx="28" ry="24" fill="#e1f5fe" opacity="0.3"/>
        <!-- 水晶身体 -->
        <path d="M32 5 L55 35 L45 75 L19 75 L9 35 Z" fill="#4fc3f7" opacity="0.9"/>
        <path d="M32 5 L45 35 L38 75 L26 75 L19 35 Z" fill="#81d4fa" opacity="0.6"/>
        <!-- 高光 -->
        <path d="M20 30 L28 20 L28 40" fill="#e1f5fe" opacity="0.8"/>
        <!-- 大眼睛 -->
        <ellipse cx="24" cy="42" rx="7" ry="8" fill="#fff"/>
        <ellipse cx="40" cy="42" rx="7" ry="8" fill="#fff"/>
        <circle cx="25" cy="43" r="4" fill="#0288d1"/>
        <circle cx="41" cy="43" r="4" fill="#0288d1"/>
        <circle cx="26" cy="42" r="1.5" fill="#e1f5fe"/>
        <circle cx="42" cy="42" r="1.5" fill="#e1f5fe"/>
        <!-- 小嘴（微笑） -->
        <path d="M28 55 Q32 58 36 55" fill="none" stroke="#0277bd" stroke-width="2" stroke-linecap="round"/>
        <!-- 腮红 -->
        <ellipse cx="18" cy="48" rx="4" ry="2" fill="#f8bbd9" opacity="0.5"/>
        <ellipse cx="46" cy="48" rx="4" ry="2" fill="#f8bbd9" opacity="0.5"/>
        <!-- 闪光点 -->
        <circle cx="15" cy="25" r="2" fill="#fff"/>
        <circle cx="48" cy="30" r="1.5" fill="#fff"/>
    </svg>`,
        magma_rock: `<svg width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
        <!-- 岩浆光环 -->
        <ellipse cx="35" cy="40" rx="32" ry="28" fill="#ff5722" opacity="0.2"/>
        <!-- 圆润岩石身体 -->
        <ellipse cx="35" cy="42" rx="26" ry="24" fill="#3e2723"/>
        <ellipse cx="35" cy="40" rx="22" ry="20" fill="#4e342e"/>
        <!-- 岩浆裂纹 -->
        <path d="M20 35 Q25 45 22 55" stroke="#ff5722" stroke-width="3" fill="none"/>
        <path d="M50 35 Q45 45 48 55" stroke="#ff5722" stroke-width="3" fill="none"/>
        <path d="M32 25 L35 35 L38 28" stroke="#ff5722" stroke-width="2" fill="none"/>
        <!-- 大眼睛（火焰色） -->
        <ellipse cx="26" cy="38" rx="8" ry="9" fill="#fff"/>
        <ellipse cx="44" cy="38" rx="8" ry="9" fill="#fff"/>
        <circle cx="27" cy="39" r="4" fill="#d84315"/>
        <circle cx="45" cy="39" r="4" fill="#d84315"/>
        <circle cx="28" cy="38" r="1.5" fill="#ffeb3b"/>
        <circle cx="46" cy="38" r="1.5" fill="#ffeb3b"/>
        <!-- 粗眉（愤怒萌） -->
        <path d="M18 28 L32 33" stroke="#2d1b12" stroke-width="4" stroke-linecap="round"/>
        <path d="M52 28 L38 33" stroke="#2d1b12" stroke-width="4" stroke-linecap="round"/>
        <!-- 嘴巴（咆哮） -->
        <ellipse cx="35" cy="52" rx="8" ry="5" fill="#1a1a1a"/>
        <path d="M30 50 L32 54 L34 50" fill="#ff5722"/>
        <path d="M36 50 L38 54 L40 50" fill="#ff5722"/>
        <!-- 火焰头顶 -->
        <path d="M30 18 Q35 8 40 18 Q38 12 35 15 Q32 12 30 18" fill="#ff5722"/>
        <path d="M32 20 Q35 14 38 20" fill="#ffeb3b"/>
    </svg>`,
        
        dead_tree: `<svg width="80" height="100" viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg"><path d="M40 100 L40 40" stroke="#2d3436" stroke-width="8"/><path d="M40 70 L20 50 M40 60 L60 40 M40 40 L20 20 M40 45 L50 25" stroke="#2d3436" stroke-width="4" stroke-linecap="round"/></svg>`,
        broken_sword: `<svg width="60" height="100" viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="blade" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#bdc3c7"/><stop offset="50%" stop-color="#ecf0f1"/><stop offset="100%" stop-color="#95a5a6"/></linearGradient></defs><!-- 剑身 --><path d="M22 50 L38 50 L35 95 L25 95 Z" fill="url(#blade)"/><!-- 护手 --><path d="M15 50 Q30 55 45 50 L45 45 Q30 50 15 45 Z" fill="#546e7a" stroke="#37474f" stroke-width="1"/><!-- 剑柄 --><rect x="26" y="15" width="8" height="30" fill="#3e2723"/><path d="M26 20 L34 22 M26 26 L34 28 M26 32 L34 34 M26 38 L34 40" stroke="#5d4037" stroke-width="1"/><!-- 剑首 --><circle cx="30" cy="15" r="6" fill="#546e7a" stroke="#37474f" stroke-width="1"/><circle cx="30" cy="15" r="2" fill="#f1c40f"/></svg>`,
        
        broken_blade: `<svg width="60" height="80" viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg"><path d="M20 80 Q10 40 20 20 L40 20 L40 80 Z" fill="#95a5a6" stroke="#7f8c8d"/><rect x="25" y="0" width="10" height="20" fill="#5d4037"/><circle cx="30" cy="20" r="4" fill="#d7ccc8"/></svg>`,
        
        broken_spear: `<svg width="40" height="120" viewBox="0 0 40 120" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="0" width="4" height="100" fill="#5d4037"/><path d="M20 100 L10 120 L30 120 Z" fill="#95a5a6"/><path d="M15 90 L25 90" stroke="#8d6e63" stroke-width="2"/><path d="M12 85 L28 85" stroke="#a1887f" stroke-width="2"/></svg>`,
        
        shield_round: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="28" fill="#5d4037" stroke="#3e2723" stroke-width="2"/><circle cx="30" cy="30" r="10" fill="#8d6e63" stroke="#5d4037"/><path d="M30 2 L30 58 M2 30 L58 30" stroke="#3e2723" stroke-width="1" opacity="0.5"/><path d="M10 45 L20 35 M40 15 L50 25" stroke="#3e2723" opacity="0.3"/></svg>`,
        
        chariot_wreck: `<svg width="100" height="80" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg"><path d="M10 50 L90 50 L80 20 L20 20 Z" fill="#4e342e" stroke="#3e2723" stroke-width="2"/><circle cx="25" cy="50" r="20" fill="none" stroke="#3e2723" stroke-width="4"/><path d="M25 30 L25 70 M5 50 L45 50" stroke="#3e2723" stroke-width="2"/><circle cx="25" cy="50" r="4" fill="#3e2723"/><path d="M60 20 L70 0 L80 20" fill="none" stroke="#3e2723" stroke-width="3"/><rect x="50" y="30" width="40" height="15" fill="#3e2723" opacity="0.8"/><path d="M10 50 L0 70" stroke="#3e2723" stroke-width="3" stroke-dasharray="5,5"/></svg>`,
        
        ruin_pillar: `<svg width="50" height="80" viewBox="0 0 50 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="30" height="60" fill="#555"/><path d="M10 20 L40 30 L40 40 L10 30 Z" fill="#444"/><path d="M15 50 L35 50 M15 60 L35 60" stroke="#333" stroke-width="2"/></svg>`,

        // ========== 血色秘境妖兽 ==========
        
        // 赤翼蝠 - 血红色蝙蝠
        blood_bat: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 血雾光环 -->
        <ellipse cx="32" cy="35" rx="20" ry="16" fill="#8b0000" opacity="0.2"/>
        <!-- 翅膀 -->
        <path d="M8 28 Q2 18 8 12 Q14 8 20 15 L24 28" fill="#8b0000" stroke="#5c0000" stroke-width="1"/>
        <path d="M56 28 Q62 18 56 12 Q50 8 44 15 L40 28" fill="#8b0000" stroke="#5c0000" stroke-width="1"/>
        <!-- 圆身体 -->
        <ellipse cx="32" cy="35" rx="16" ry="14" fill="#b71c1c"/>
        <!-- 大眼睛 -->
        <ellipse cx="26" cy="32" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="38" cy="32" rx="6" ry="7" fill="#fff"/>
        <circle cx="27" cy="33" r="3" fill="#4a0000"/>
        <circle cx="39" cy="33" r="3" fill="#4a0000"/>
        <circle cx="28" cy="32" r="1" fill="#ff5252"/>
        <circle cx="40" cy="32" r="1" fill="#ff5252"/>
        <!-- 小尖牙 -->
        <path d="M28 42 L30 47 L32 42" fill="#fff"/>
        <path d="M32 42 L34 47 L36 42" fill="#fff"/>
        <!-- 小耳朵 -->
        <path d="M22 22 L20 12 L28 20" fill="#8b0000"/>
        <path d="M42 22 L44 12 L36 20" fill="#8b0000"/>
        <!-- 血丝 -->
        <path d="M20 38 Q18 42 20 46" stroke="#ff5252" stroke-width="1" fill="none" opacity="0.5"/>
        <path d="M44 38 Q46 42 44 46" stroke="#ff5252" stroke-width="1" fill="none" opacity="0.5"/>
    </svg>`,

        // 血丝蛛 - Q版小蜘蛛
        blood_spider: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 八条腿 -->
        <path d="M18 30 Q5 20 2 30 Q5 35 18 35" fill="none" stroke="#5c0000" stroke-width="3"/>
        <path d="M18 35 Q5 40 2 50 Q8 52 20 40" fill="none" stroke="#5c0000" stroke-width="3"/>
        <path d="M46 30 Q59 20 62 30 Q59 35 46 35" fill="none" stroke="#5c0000" stroke-width="3"/>
        <path d="M46 35 Q59 40 62 50 Q56 52 44 40" fill="none" stroke="#5c0000" stroke-width="3"/>
        <path d="M20 28 Q10 15 5 18" fill="none" stroke="#5c0000" stroke-width="2"/>
        <path d="M44 28 Q54 15 59 18" fill="none" stroke="#5c0000" stroke-width="2"/>
        <path d="M22 42 Q12 55 8 52" fill="none" stroke="#5c0000" stroke-width="2"/>
        <path d="M42 42 Q52 55 56 52" fill="none" stroke="#5c0000" stroke-width="2"/>
        <!-- 圆润身体 -->
        <ellipse cx="32" cy="35" rx="18" ry="16" fill="#8b0000"/>
        <ellipse cx="32" cy="33" rx="14" ry="12" fill="#b71c1c"/>
        <!-- 腹部花纹 -->
        <ellipse cx="32" cy="42" rx="6" ry="4" fill="#ff5252" opacity="0.5"/>
        <!-- 大眼睛（8只小眼） -->
        <circle cx="25" cy="28" r="5" fill="#fff"/>
        <circle cx="39" cy="28" r="5" fill="#fff"/>
        <circle cx="26" cy="29" r="2.5" fill="#4a0000"/>
        <circle cx="40" cy="29" r="2.5" fill="#4a0000"/>
        <circle cx="27" cy="28" r="1" fill="#ff5252"/>
        <circle cx="41" cy="28" r="1" fill="#ff5252"/>
        <!-- 额头小眼 -->
        <circle cx="29" cy="23" r="2" fill="#ffcdd2"/>
        <circle cx="35" cy="23" r="2" fill="#ffcdd2"/>
        <!-- 嘴巴（獠牙） -->
        <path d="M28 40 L30 45" stroke="#fff" stroke-width="2"/>
        <path d="M36 40 L34 45" stroke="#fff" stroke-width="2"/>
    </svg>`,

        // 赤煞狼 - Q版血狼
        blood_wolf: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 身体 -->
        <ellipse cx="32" cy="42" rx="22" ry="16" fill="#8b0000"/>
        <!-- 大头 -->
        <circle cx="32" cy="28" r="18" fill="#b71c1c"/>
        <!-- 耳朵 -->
        <path d="M18 18 L14 2 L26 14" fill="#8b0000"/>
        <path d="M46 18 L50 2 L38 14" fill="#8b0000"/>
        <path d="M20 16 L17 6 L25 14" fill="#ff5252" opacity="0.5"/>
        <path d="M44 16 L47 6 L39 14" fill="#ff5252" opacity="0.5"/>
        <!-- 大眼睛 -->
        <ellipse cx="24" cy="26" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="40" cy="26" rx="6" ry="7" fill="#fff"/>
        <circle cx="25" cy="27" r="3.5" fill="#4a0000"/>
        <circle cx="41" cy="27" r="3.5" fill="#4a0000"/>
        <circle cx="26" cy="26" r="1.5" fill="#ff5252"/>
        <circle cx="42" cy="26" r="1.5" fill="#ff5252"/>
        <!-- 凶狠眉毛 -->
        <path d="M16 20 L28 24" stroke="#4a0000" stroke-width="3" stroke-linecap="round"/>
        <path d="M48 20 L36 24" stroke="#4a0000" stroke-width="3" stroke-linecap="round"/>
        <!-- 鼻子 -->
        <ellipse cx="32" cy="34" rx="4" ry="3" fill="#4a0000"/>
        <!-- 嘴巴（露齿） -->
        <path d="M24 40 Q32 46 40 40" fill="none" stroke="#4a0000" stroke-width="2"/>
        <path d="M26 40 L28 44" stroke="#fff" stroke-width="2"/>
        <path d="M38 40 L36 44" stroke="#fff" stroke-width="2"/>
        <!-- 尾巴 -->
        <path d="M52 45 Q62 40 58 55" fill="#8b0000" stroke="#5c0000"/>
        <!-- 腮红 -->
        <ellipse cx="16" cy="32" rx="4" ry="2" fill="#ff5252" opacity="0.4"/>
        <ellipse cx="48" cy="32" rx="4" ry="2" fill="#ff5252" opacity="0.4"/>
    </svg>`,

        // 血鳞蟒 - Q版大蛇
        blood_serpent: `<svg width="80" height="64" viewBox="0 0 80 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 蛇身 -->
        <path d="M65 50 Q75 40 70 30 Q60 20 50 30 Q40 40 30 35 Q20 30 15 40" fill="none" stroke="#8b0000" stroke-width="12" stroke-linecap="round"/>
        <path d="M65 50 Q75 40 70 30 Q60 20 50 30 Q40 40 30 35 Q20 30 15 40" fill="none" stroke="#b71c1c" stroke-width="8" stroke-linecap="round"/>
        <!-- 鳞片纹 -->
        <path d="M60 35 L62 40 M50 32 L52 37 M40 36 L42 41 M30 38 L32 43" stroke="#ff5252" stroke-width="2" opacity="0.5"/>
        <!-- 大头 -->
        <ellipse cx="20" cy="32" rx="16" ry="14" fill="#b71c1c"/>
        <!-- 大眼睛 -->
        <ellipse cx="14" cy="28" rx="5" ry="6" fill="#fff"/>
        <ellipse cx="26" cy="28" rx="5" ry="6" fill="#fff"/>
        <ellipse cx="15" cy="29" r="3" fill="#4a0000"/>
        <ellipse cx="27" cy="29" r="3" fill="#4a0000"/>
        <circle cx="16" cy="28" r="1" fill="#ffeb3b"/>
        <circle cx="28" cy="28" r="1" fill="#ffeb3b"/>
        <!-- 信子 -->
        <path d="M8 38 L2 36 M8 38 L2 42" stroke="#ff5252" stroke-width="2" stroke-linecap="round"/>
        <!-- 尾巴尖 -->
        <path d="M65 50 L72 55 L70 48" fill="#ff5252"/>
        <!-- 腮红 -->
        <ellipse cx="10" cy="36" rx="3" ry="2" fill="#ff5252" opacity="0.4"/>
    </svg>`,

        // 血魂鬼 - 血红色幽灵
        blood_ghost: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 血雾 -->
        <ellipse cx="32" cy="35" rx="24" ry="20" fill="#8b0000" opacity="0.2"/>
        <!-- 飘动的身体 -->
        <path d="M16 25 Q16 8 32 8 Q48 8 48 25 L48 45 Q44 50 40 45 Q36 50 32 45 Q28 50 24 45 Q20 50 16 45 Z" fill="#b71c1c" opacity="0.85"/>
        <!-- 内部高光 -->
        <ellipse cx="32" cy="25" rx="10" ry="8" fill="#ff5252" opacity="0.3"/>
        <!-- 大眼睛 -->
        <ellipse cx="25" cy="25" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="39" cy="25" rx="6" ry="7" fill="#fff"/>
        <circle cx="26" cy="26" r="3" fill="#4a0000"/>
        <circle cx="40" cy="26" r="3" fill="#4a0000"/>
        <circle cx="27" cy="25" r="1" fill="#ff5252"/>
        <circle cx="41" cy="25" r="1" fill="#ff5252"/>
        <!-- 小嘴（惊恐） -->
        <ellipse cx="32" cy="36" rx="5" ry="4" fill="#4a0000" opacity="0.7"/>
        <!-- 血泪 -->
        <path d="M20 30 L18 38" stroke="#ff5252" stroke-width="2" opacity="0.6"/>
        <path d="M44 30 L46 38" stroke="#ff5252" stroke-width="2" opacity="0.6"/>
    </svg>`,

        // 赤甲蝎 - Q版小蝎子
        blood_scorpion: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 尾巴 -->
        <path d="M32 35 Q32 20 38 12 Q42 8 45 15" fill="none" stroke="#8b0000" stroke-width="6" stroke-linecap="round"/>
        <circle cx="45" cy="15" r="4" fill="#ff5252"/>
        <!-- 身体 -->
        <ellipse cx="32" cy="42" rx="18" ry="12" fill="#8b0000"/>
        <ellipse cx="32" cy="40" rx="14" ry="9" fill="#b71c1c"/>
        <!-- 钳子 -->
        <path d="M14 38 Q5 35 8 28 Q12 25 18 32" fill="#8b0000" stroke="#5c0000"/>
        <path d="M50 38 Q59 35 56 28 Q52 25 46 32" fill="#8b0000" stroke="#5c0000"/>
        <!-- 腿 -->
        <path d="M18 45 L8 55 M22 48 L14 58 M42 48 L50 58 M46 45 L56 55" stroke="#5c0000" stroke-width="2"/>
        <!-- 大头 -->
        <circle cx="32" cy="35" r="10" fill="#b71c1c"/>
        <!-- 大眼睛 -->
        <ellipse cx="28" cy="33" rx="4" ry="5" fill="#fff"/>
        <ellipse cx="36" cy="33" rx="4" ry="5" fill="#fff"/>
        <circle cx="29" cy="34" r="2" fill="#4a0000"/>
        <circle cx="37" cy="34" r="2" fill="#4a0000"/>
        <circle cx="29.5" cy="33" r="0.8" fill="#ff5252"/>
        <circle cx="37.5" cy="33" r="0.8" fill="#ff5252"/>
        <!-- 嘴巴 -->
        <path d="M30 40 Q32 42 34 40" fill="none" stroke="#4a0000" stroke-width="1"/>
    </svg>`,

        // ========== 血色秘境 BOSS ==========

        // 赤玉蛛王 - 小BOSS
        boss_spider: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <!-- 血雾光环 -->
        <ellipse cx="64" cy="70" rx="55" ry="45" fill="#8b0000" opacity="0.15"/>
        <!-- 八条大腿 -->
        <path d="M30 55 Q5 35 0 50 Q5 60 30 65" fill="none" stroke="#5c0000" stroke-width="6"/>
        <path d="M30 70 Q0 75 0 95 Q10 100 35 80" fill="none" stroke="#5c0000" stroke-width="6"/>
        <path d="M98 55 Q123 35 128 50 Q123 60 98 65" fill="none" stroke="#5c0000" stroke-width="6"/>
        <path d="M98 70 Q128 75 128 95 Q118 100 93 80" fill="none" stroke="#5c0000" stroke-width="6"/>
        <path d="M35 50 Q15 25 8 35" fill="none" stroke="#5c0000" stroke-width="5"/>
        <path d="M93 50 Q113 25 120 35" fill="none" stroke="#5c0000" stroke-width="5"/>
        <path d="M40 85 Q20 110 12 105" fill="none" stroke="#5c0000" stroke-width="5"/>
        <path d="M88 85 Q108 110 116 105" fill="none" stroke="#5c0000" stroke-width="5"/>
        <!-- 大身体 -->
        <ellipse cx="64" cy="70" rx="38" ry="32" fill="#8b0000"/>
        <ellipse cx="64" cy="66" rx="32" ry="26" fill="#b71c1c"/>
        <!-- 血玉晶体效果 -->
        <ellipse cx="64" cy="66" rx="28" ry="22" fill="url(#jade_gradient)" opacity="0.6"/>
        <defs>
            <radialGradient id="jade_gradient">
                <stop offset="0%" stop-color="#ff5252"/>
                <stop offset="100%" stop-color="#8b0000"/>
            </radialGradient>
        </defs>
        <!-- 背部血玉 -->
        <ellipse cx="64" cy="75" rx="12" ry="8" fill="#ff1744" opacity="0.8"/>
        <ellipse cx="50" cy="72" rx="6" ry="4" fill="#ff5252" opacity="0.6"/>
        <ellipse cx="78" cy="72" rx="6" ry="4" fill="#ff5252" opacity="0.6"/>
        <!-- 大眼睛（邪恶） -->
        <ellipse cx="50" cy="55" rx="12" ry="14" fill="#fff"/>
        <ellipse cx="78" cy="55" rx="12" ry="14" fill="#fff"/>
        <ellipse cx="52" cy="57" rx="7" ry="8" fill="#4a0000"/>
        <ellipse cx="80" cy="57" rx="7" ry="8" fill="#4a0000"/>
        <circle cx="54" cy="55" r="3" fill="#ff1744"/>
        <circle cx="82" cy="55" r="3" fill="#ff1744"/>
        <!-- 邪恶眼神（瞳孔发光） -->
        <ellipse cx="52" cy="57" rx="4" ry="5" fill="#ff1744" opacity="0.3"/>
        <ellipse cx="80" cy="57" rx="4" ry="5" fill="#ff1744" opacity="0.3"/>
        <!-- 额头小眼 -->
        <circle cx="58" cy="45" r="4" fill="#ffcdd2"/>
        <circle cx="70" cy="45" r="4" fill="#ffcdd2"/>
        <circle cx="58" cy="45" r="2" fill="#8b0000"/>
        <circle cx="70" cy="45" r="2" fill="#8b0000"/>
        <!-- 獠牙 -->
        <path d="M52 78 L48 92" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        <path d="M76 78 L80 92" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        <!-- 血滴 -->
        <ellipse cx="48" cy="95" rx="3" ry="4" fill="#ff1744"/>
        <ellipse cx="80" cy="95" rx="3" ry="4" fill="#ff1744"/>
    </svg>`,

        // 炎煞蝎皇 - 大BOSS
        boss_scorpion: `<svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <!-- 火焰光环 -->
        <ellipse cx="80" cy="100" rx="70" ry="50" fill="#ff5722" opacity="0.15"/>
        <!-- 大尾巴 -->
        <path d="M80 85 Q80 50 90 30 Q95 15 105 25 Q115 35 110 50" fill="none" stroke="#5c0000" stroke-width="12" stroke-linecap="round"/>
        <path d="M80 85 Q80 50 90 30 Q95 15 105 25 Q115 35 110 50" fill="none" stroke="#8b0000" stroke-width="8" stroke-linecap="round"/>
        <!-- 毒针（发光） -->
        <path d="M110 50 L120 35 L115 55 Z" fill="#ff5722"/>
        <ellipse cx="117" cy="42" rx="8" ry="6" fill="#ffeb3b" opacity="0.6"/>
        <!-- 大身体 -->
        <ellipse cx="80" cy="105" rx="50" ry="35" fill="#5c0000"/>
        <ellipse cx="80" cy="100" rx="45" ry="30" fill="#8b0000"/>
        <!-- 身体裂纹（岩浆效果） -->
        <path d="M50 95 Q60 105 55 115" stroke="#ff5722" stroke-width="3" fill="none"/>
        <path d="M110 95 Q100 105 105 115" stroke="#ff5722" stroke-width="3" fill="none"/>
        <path d="M75 88 L80 100 L85 90" stroke="#ff5722" stroke-width="2" fill="none"/>
        <!-- 巨钳（带火焰） -->
        <path d="M25 90 Q5 75 15 55 Q25 45 40 60 L45 80" fill="#8b0000" stroke="#5c0000" stroke-width="2"/>
        <path d="M15 55 Q10 50 18 45 M15 55 Q25 52 30 58" stroke="#5c0000" stroke-width="3"/>
        <path d="M135 90 Q155 75 145 55 Q135 45 120 60 L115 80" fill="#8b0000" stroke="#5c0000" stroke-width="2"/>
        <path d="M145 55 Q150 50 142 45 M145 55 Q135 52 130 58" stroke="#5c0000" stroke-width="3"/>
        <!-- 钳子火焰 -->
        <ellipse cx="17" cy="50" rx="8" ry="6" fill="#ff5722" opacity="0.7"/>
        <ellipse cx="143" cy="50" rx="8" ry="6" fill="#ff5722" opacity="0.7"/>
        <!-- 腿 -->
        <path d="M45 115 L25 140 M55 120 L40 145 M105 120 L120 145 M115 115 L135 140" stroke="#5c0000" stroke-width="4"/>
        <!-- 大头 -->
        <ellipse cx="80" cy="85" rx="28" ry="22" fill="#b71c1c"/>
        <!-- 护甲纹 -->
        <path d="M60 80 Q80 70 100 80" fill="none" stroke="#5c0000" stroke-width="2"/>
        <!-- 大眼睛（霸气） -->
        <ellipse cx="68" cy="80" rx="10" ry="12" fill="#fff"/>
        <ellipse cx="92" cy="80" rx="10" ry="12" fill="#fff"/>
        <ellipse cx="70" cy="82" rx="6" ry="7" fill="#4a0000"/>
        <ellipse cx="94" cy="82" rx="6" ry="7" fill="#4a0000"/>
        <circle cx="72" cy="80" r="2.5" fill="#ff5722"/>
        <circle cx="96" cy="80" r="2.5" fill="#ff5722"/>
        <!-- 瞳孔火焰 -->
        <ellipse cx="70" cy="82" rx="3" ry="4" fill="#ff5722" opacity="0.4"/>
        <ellipse cx="94" cy="82" rx="3" ry="4" fill="#ff5722" opacity="0.4"/>
        <!-- 凶狠眉毛 -->
        <path d="M54 70 L74 76" stroke="#4a0000" stroke-width="4" stroke-linecap="round"/>
        <path d="M106 70 L86 76" stroke="#4a0000" stroke-width="4" stroke-linecap="round"/>
        <!-- 嘴巴（咆哮） -->
        <ellipse cx="80" cy="98" rx="10" ry="6" fill="#1a0000"/>
        <path d="M74 96 L76 102" stroke="#ff5722" stroke-width="2"/>
        <path d="M86 96 L84 102" stroke="#ff5722" stroke-width="2"/>
        <!-- 王冠/角 -->
        <path d="M65 62 L60 50 L70 58" fill="#ff5722"/>
        <path d="M95 62 L100 50 L90 58" fill="#ff5722"/>
        <path d="M80 58 L80 45" stroke="#ffeb3b" stroke-width="3"/>
        <circle cx="80" cy="42" r="5" fill="#ffeb3b"/>
    </svg>`,

        // 金币
        gold_coin: `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#f1c40f" stroke="#d4a00a" stroke-width="2"/>
        <circle cx="16" cy="16" r="10" fill="none" stroke="#d4a00a" stroke-width="1"/>
        <text x="16" y="21" font-size="14" fill="#d4a00a" text-anchor="middle" font-weight="bold">$</text>
    </svg>`
    };

    const ROLES = [
        { id: 'sword', name: '天剑宗', hp: 100, dmg: 10, cd: 0.5, speed: 160, desc: '以身化剑，唯快不破', svg: 'player_sword' },
        { id: 'mage', name: '玄元道', hp: 80,  dmg: 25, cd: 1.0, speed: 140, desc: '通御五行，爆发轰炸', svg: 'player_mage' },
        { id: 'body', name: '荒古门', hp: 200, dmg: 15, cd: 0.8, speed: 150, desc: '肉身成圣，力破万法', svg: 'player_body' },
        { id: 'ghost', name: '幽冥涧', hp: 120, dmg: 15, cd: 1.2, speed: 150, desc: '生死无界，役使亡灵', svg: 'player_ghost' },
        { id: 'formation', name: '天机阁', hp: 90, dmg: 18, cd: 0.6, speed: 145, desc: '算尽天机，画地为牢', svg: 'player_formation' }
    ];

    const ARTIFACTS = [
        // 攻击型
        { id: 'zhuxian_array', name: '诛仙剑阵', desc: '4剑环绕自动攻击', type: 'attack', cd: 0, svg: 'artifact_zhuxian' },
        { id: 'jinjiao_jian', name: '金蛟剪', desc: '穿透+2，伤害+20%', type: 'attack', cd: 0, svg: 'artifact_jinjiao' },
        // 防御型
        { id: 'xuanwu_dun', name: '玄武盾', desc: '减伤30%，反弹10%', type: 'defense', cd: 0, svg: 'artifact_xuanwu' },
        { id: 'qiankun_quan', name: '乾坤圈', desc: '结界击退敌人', type: 'defense', cd: 0, svg: 'artifact_qiankun' },
        // 移速型
        { id: 'fenghuo_lun', name: '风火轮', desc: '移速+50%，火焰轨迹', type: 'speed', cd: 0, svg: 'artifact_fenghuo' },
        // 控制型
        { id: 'dinghai_zhu', name: '定海神珠', desc: '敌人减速30%光环', type: 'control', cd: 0, svg: 'artifact_dinghai' },
        // 收益型
        { id: 'jubao_pen', name: '聚宝盆', desc: '掉落+50%，拾取+100%', type: 'utility', cd: 0, svg: 'artifact_jubao' },
        // 特效型
        { id: 'fantian', name: '虚天鼎', desc: '每10秒震晕全场', type: 'special', cd: 10, svg: 'artifact_fantian' },
        { id: 'mirror', name: '乾蓝冰焰', desc: '前方烧后方冻', type: 'special', cd: 0, svg: 'artifact_mirror' },
        { id: 'gourd', name: '玄天斩灵', desc: '每5秒斩杀精英', type: 'special', cd: 5, svg: 'artifact_gourd' }
    ];

    const STAGES = [
        { name: '幽暗密林', time: 0, bg: '#0f1519', grid: '#1c262b', mobs: ['bat', 'rock'] },
        { name: '埋骨之地', time: 60, bg: '#202020', grid: '#333333', mobs: ['bat', 'ghost'] },
        { name: '熔岩炼狱', time: 120, bg: '#1a0505', grid: '#3d0e0e', mobs: ['bat_fire', 'magma_rock'] },
        { name: '极寒冰原', time: 180, bg: '#050a1a', grid: '#0e1e3d', mobs: ['ghost_ice', 'crystal'] },
        { name: '塞外古战场', time: 240, bg: '#5d5340', grid: '#73654d', mobs: ['ghost', 'rock'] },
        { name: '昆仑仙境', time: 360, bg: '#2c3e50', grid: '#34495e', mobs: ['bat_fire', 'ghost_ice', 'magma_rock', 'crystal'] }
    ];

    const SKILLS = {
        common: [
            { id:'dmg', name:'灵气护体', desc:'基础伤害 +15', icon:'💎', effect:s=>s.dmg+=15 },
            { id:'spd', name:'轻身术', desc:'移动速度 +20', icon:'🦶', effect:s=>s.speed=(s.speed||150)+20 }
        ],
        sword: [
            { id:'sword_mult', name:'万剑归宗', desc:'飞剑数量 +1', icon:'⚔️', effect:s=>s.count++ },
            { id:'sword_spd', name:'御剑术', desc:'攻速 +20%', icon:'🌪️', effect:s=>s.cd*=0.8 },
            { id:'sword_pierce', name:'青莲剑歌', desc:'飞剑穿透 +1', icon:'🗡️', effect:s=>s.pierce=(s.pierce||0)+1 }
        ],
        mage: [
            { id:'mage_boom', name:'红莲业火', desc:'爆炸范围 +50%', icon:'💥', effect:s=>s.area=(s.area||100)*1.5 },
            { id:'mage_cd', name:'五行流转', desc:'施法速度 +25%', icon:'📜', effect:s=>s.cd*=0.75 },
            { id:'mage_thunder', name:'九天神雷', desc:'普通攻击 20% 几率触发落雷', icon:'⚡', effect:s=>s.thunderProb=(s.thunderProb||0)+0.2 }
        ],
        body: [
            { id:'body_range', name:'法天象地', desc:'震荡范围 +30%', icon:'⛰️', effect:s=>s.area=(s.area||150)*1.3 },
            { id:'body_dmg', name:'金刚不坏', desc:'震荡伤害 +40%', icon:'💪', effect:s=>s.dmg*=1.4 },
            { id:'body_kb', name:'力拔山兮', desc:'击退效果大幅增强', icon:'👊', effect:s=>s.knockback=(s.knockback||1.0)*1.5 }
        ],
        ghost: [
            { id:'ghost_speed', name:'幽冥鬼步', desc:'召唤物移动速度 +30%', icon:'👻', effect:s=>s.bulletSpeed=(s.bulletSpeed||250)*1.3 },
            { id:'ghost_duration', name:'怨气不散', desc:'召唤物存在时间 +50%', icon:'⏳', effect:s=>s.bulletLife=(s.bulletLife||1.5)*1.5 },
            { id:'ghost_mult', name:'百鬼夜行', desc:'召唤数量 +1', icon:'💀', effect:s=>s.count++ }
        ],
        formation: [
            { id:'form_size', name:'天罗地网', desc:'阵法范围 +30%', icon:'🕸️', effect:s=>s.area=(s.area||1.0)*1.3 },
            { id:'form_pierce', name:'生门死门', desc:'阵法伤害频次增加', icon:'☯️', effect:s=>s.pierce=(s.pierce||99)+2 },
            { id:'form_stun', name:'画地为牢', desc:'阵法附带强力减速', icon:'🛑', effect:s=>s.stun=true }
        ]
    };

    // ========== 血色秘境配置 ==========

    // 波次配置
    const ARENA_CONFIG = {
        totalWaves: 10,
        waves: [
            { wave: 1, count: 8, mobs: ['blood_bat'], levelMult: 0.5 },
            { wave: 2, count: 10, mobs: ['blood_bat', 'blood_spider'], levelMult: 0.6 },
            { wave: 3, count: 12, mobs: ['blood_spider'], levelMult: 0.7 },
            { wave: 4, count: 10, mobs: ['blood_wolf'], levelMult: 0.8 },
            { wave: 5, count: 1, mobs: ['boss_spider'], levelMult: 1.2, isBoss: true, bossName: '赤玉蛛王' },
            { wave: 6, count: 12, mobs: ['blood_wolf', 'blood_serpent'], levelMult: 0.9 },
            { wave: 7, count: 10, mobs: ['blood_serpent'], levelMult: 1.0 },
            { wave: 8, count: 14, mobs: ['blood_ghost'], levelMult: 1.1 },
            { wave: 9, count: 16, mobs: ['blood_bat', 'blood_wolf', 'blood_ghost'], levelMult: 1.2 },
            { wave: 10, count: 1, mobs: ['boss_scorpion'], levelMult: 2.0, isBoss: true, bossName: '炎煞蝎皇' }
        ]
    };

    // 血色秘境妖兽属性
    const ARENA_MOBS = {
        blood_bat: { name: '赤翼蝠', hp: 30, dmg: 8, speed: 100, svg: 'blood_bat', goldDrop: [1, 3] },
        blood_spider: { name: '血丝蛛', hp: 45, dmg: 10, speed: 70, svg: 'blood_spider', goldDrop: [2, 4] },
        blood_wolf: { name: '赤煞狼', hp: 60, dmg: 15, speed: 120, svg: 'blood_wolf', goldDrop: [3, 5] },
        blood_serpent: { name: '血鳞蟒', hp: 80, dmg: 12, speed: 60, svg: 'blood_serpent', goldDrop: [3, 6] },
        blood_ghost: { name: '血魂鬼', hp: 50, dmg: 18, speed: 90, svg: 'blood_ghost', goldDrop: [2, 5] },
        blood_scorpion: { name: '赤甲蝎', hp: 40, dmg: 12, speed: 85, svg: 'blood_scorpion', goldDrop: [2, 4] }
    };

    // BOSS配置
    const ARENA_BOSSES = {
        boss_spider: {
            name: '赤玉蛛王',
            hp: 2000,
            dmg: 25,
            speed: 50,
            size: 3.0,
            svg: 'boss_spider',
            goldDrop: [15, 25],
            cardDrop: 1,
            skills: ['poison_spray', 'web_trap', 'jade_armor']
        },
        boss_scorpion: {
            name: '炎煞蝎皇',
            hp: 5000,
            dmg: 40,
            speed: 40,
            size: 4.0,
            svg: 'boss_scorpion',
            goldDrop: [50, 80],
            cardDrop: 3,
            skills: ['claw_sweep', 'tail_strike', 'summon_scorpions', 'rage_mode'],
            phases: [
                { hpPercent: 100, name: '普通' },
                { hpPercent: 50, name: '狂暴', speedMult: 1.3, dmgMult: 1.5 }
            ]
        }
    };

    // 道具卡配置
    const ITEM_CARDS = [
        // 攻击类
        { id: 'leijie_zhu', name: '雷劫珠', icon: '⚡', desc: '天雷连轰3次', effect: 'thunder_strike', value: 150, rarity: 'epic', dropRate: 0.05 },
        { id: 'fantian_yin', name: '翻天印', icon: '🔱', desc: '全场震击200伤害', effect: 'screen_damage', value: 200, rarity: 'epic', dropRate: 0.05 },
        // 控制类
        { id: 'bingpo_zhu', name: '冰魄珠', icon: '🔮', desc: '全场冻结3秒', effect: 'freeze_all', value: 3, rarity: 'rare', dropRate: 0.08 },
        { id: 'dingshen_fu', name: '定身符', icon: '📜', desc: '定住5敌人10秒', effect: 'stun_random', value: 5, rarity: 'rare', dropRate: 0.08 },
        { id: 'hundun_ling', name: '混沌铃', icon: '🔔', desc: '敌人互攻5秒', effect: 'chaos', value: 5, rarity: 'legendary', dropRate: 0.02 },
        // 陷阱类
        { id: 'jingji_zhong', name: '荆棘种', icon: '🌿', desc: '地面荆棘伤害', effect: 'thorn_trap', value: 10, rarity: 'common', dropRate: 0.15 },
        { id: 'baoyan_shi', name: '爆炎石', icon: '💎', desc: '定时炸弹', effect: 'time_bomb', value: 300, rarity: 'rare', dropRate: 0.08 },
        // 位移类
        { id: 'suodi_fu', name: '缩地符', icon: '🌀', desc: '瞬移逃命', effect: 'teleport', value: 1, rarity: 'rare', dropRate: 0.08 },
        { id: 'fenshen_fu', name: '分身符', icon: '👥', desc: '分身吸引仇恨', effect: 'decoy', value: 5, rarity: 'epic', dropRate: 0.05 },
        // 增益类
        { id: 'jifeng_fu', name: '疾风符', icon: '💨', desc: '移速x2持续10秒', effect: 'speed_boost', value: 10, rarity: 'common', dropRate: 0.15 },
        { id: 'jinshen_fu', name: '金身符', icon: '🛡️', desc: '无敌3秒', effect: 'invincible', value: 3, rarity: 'rare', dropRate: 0.08 },
        { id: 'kuangbao_dan', name: '狂暴丹', icon: '💊', desc: '攻击x2持续10秒', effect: 'damage_boost', value: 10, rarity: 'rare', dropRate: 0.08 },
        // 回复类
        { id: 'huiqi_dan', name: '回气丹', icon: '💚', desc: '回复40%血量', effect: 'heal', value: 0.4, rarity: 'common', dropRate: 0.15 },
        { id: 'juling_zhen', name: '聚灵阵', icon: '⭐', desc: '经验x2持续10秒', effect: 'exp_boost', value: 10, rarity: 'rare', dropRate: 0.08 },
        // 特殊类
        { id: 'qiankun_dai', name: '乾坤袋', icon: '👝', desc: '吸走5只怪物', effect: 'absorb_enemy', value: 5, rarity: 'legendary', dropRate: 0.02 }
    ];

    const Assets = {};

    // PNG 角色图片映射
    const PNG_PLAYERS = {
        'player_sword': 'img/player/sword.png',
        'player_mage': 'img/player/mage.png',
        'player_body': 'img/player/body.png',
        'player_ghost': 'img/player/ghost.png',
        'player_formation': 'img/player/formation.png'
    };

    function loadAssets() {
        const promises = [];
        
        {
            // 加载 PNG 角色图片
            for (let key in PNG_PLAYERS) {
                const img = new Image();
                const promise = new Promise((resolve) => {
                    img.onload = () => resolve();
                    img.onerror = () => {
                        console.warn(`PNG加载失败: ${key}, 回退到SVG`);
                        // 回退到 SVG
                        if (SVG_LIB[key]) {
                            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(SVG_LIB[key])));
                        }
                        resolve();
                    };
                });
                img.src = PNG_PLAYERS[key];
                Assets[key] = img;
                promises.push(promise);
            }
        }
        
        // 加载 SVG 资源（角色 + 其他）
        for (let key in SVG_LIB) {
            // 如果启用 PNG 模式，跳过角色 SVG
            if (PNG_PLAYERS[key]) continue;
            
            const img = new Image();
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(SVG_LIB[key])));
            Assets[key] = img;
        }
        
        return Promise.all(promises);
    }

    // ========== 空间哈希网格 - 高效碰撞检测 ==========
    // 将 O(n²) 碰撞检测优化到 O(n * k)，k 为格子内平均实体数

    class SpatialHash {
        constructor(cellSize = 64) {
            this.cellSize = cellSize;
            this.grid = new Map();
            this.entityCells = new Map(); // 记录每个实体所在的格子
        }
        
        // 计算格子键
        _getKey(x, y) {
            const cx = Math.floor(x / this.cellSize);
            const cy = Math.floor(y / this.cellSize);
            return `${cx},${cy}`;
        }
        
        // 清空网格
        clear() {
            this.grid.clear();
            this.entityCells.clear();
        }
        
        // 插入实体
        insert(entity) {
            const key = this._getKey(entity.x, entity.y);
            
            if (!this.grid.has(key)) {
                this.grid.set(key, new Set());
            }
            this.grid.get(key).add(entity);
            this.entityCells.set(entity, key);
        }
        
        // 批量插入
        insertAll(entities) {
            for (const entity of entities) {
                if (!entity.dead) {
                    this.insert(entity);
                }
            }
        }
        
        // 移除实体
        remove(entity) {
            const key = this.entityCells.get(entity);
            if (key && this.grid.has(key)) {
                this.grid.get(key).delete(entity);
            }
            this.entityCells.delete(entity);
        }
        
        // 更新实体位置（移动后调用）
        update(entity) {
            const oldKey = this.entityCells.get(entity);
            const newKey = this._getKey(entity.x, entity.y);
            
            if (oldKey !== newKey) {
                // 从旧格子移除
                if (oldKey && this.grid.has(oldKey)) {
                    this.grid.get(oldKey).delete(entity);
                }
                // 添加到新格子
                if (!this.grid.has(newKey)) {
                    this.grid.set(newKey, new Set());
                }
                this.grid.get(newKey).add(entity);
                this.entityCells.set(entity, newKey);
            }
        }
        
        // 查询点附近的实体
        queryPoint(x, y, radius = 1) {
            const results = [];
            const cx = Math.floor(x / this.cellSize);
            const cy = Math.floor(y / this.cellSize);
            
            // 检查周围格子
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    const key = `${cx + dx},${cy + dy}`;
                    const cell = this.grid.get(key);
                    if (cell) {
                        for (const entity of cell) {
                            if (!entity.dead) {
                                results.push(entity);
                            }
                        }
                    }
                }
            }
            return results;
        }
        
        // 查询圆形范围内的实体
        queryRadius(x, y, radius) {
            const cellRadius = Math.ceil(radius / this.cellSize);
            const candidates = this.queryPoint(x, y, cellRadius);
            const radiusSq = radius * radius;
            
            return candidates.filter(entity => {
                const dx = entity.x - x;
                const dy = entity.y - y;
                return dx * dx + dy * dy <= radiusSq;
            });
        }
        
        // 查询矩形范围内的实体
        queryRect(x1, y1, x2, y2) {
            const results = [];
            const cx1 = Math.floor(x1 / this.cellSize);
            const cy1 = Math.floor(y1 / this.cellSize);
            const cx2 = Math.floor(x2 / this.cellSize);
            const cy2 = Math.floor(y2 / this.cellSize);
            
            for (let cx = cx1; cx <= cx2; cx++) {
                for (let cy = cy1; cy <= cy2; cy++) {
                    const key = `${cx},${cy}`;
                    const cell = this.grid.get(key);
                    if (cell) {
                        for (const entity of cell) {
                            if (!entity.dead && 
                                entity.x >= x1 && entity.x <= x2 &&
                                entity.y >= y1 && entity.y <= y2) {
                                results.push(entity);
                            }
                        }
                    }
                }
            }
            return results;
        }
        
        // 获取统计信息
        getStats() {
            let totalEntities = 0;
            let maxInCell = 0;
            let nonEmptyCells = 0;
            
            for (const cell of this.grid.values()) {
                const size = cell.size;
                if (size > 0) {
                    nonEmptyCells++;
                    totalEntities += size;
                    maxInCell = Math.max(maxInCell, size);
                }
            }
            
            return {
                totalEntities,
                nonEmptyCells,
                maxInCell,
                avgPerCell: nonEmptyCells > 0 ? (totalEntities / nonEmptyCells).toFixed(1) : 0
            };
        }
    }

    // ========== 碰撞检测管理器 ==========
    class CollisionManager {
        constructor(cellSize = 64) {
            this.enemyGrid = new SpatialHash(cellSize);
            this.bulletGrid = new SpatialHash(cellSize);
            this.coinGrid = new SpatialHash(cellSize * 2); // 金币格子可以大一些
        }
        
        // 每帧开始时重建网格
        rebuild(enemies, bullets, coins) {
            this.enemyGrid.clear();
            this.bulletGrid.clear();
            this.coinGrid.clear();
            
            this.enemyGrid.insertAll(enemies);
            this.bulletGrid.insertAll(bullets);
            this.coinGrid.insertAll(coins);
        }
        
        // 检测玩家与敌人的碰撞
        checkPlayerEnemyCollisions(player, hitRadius = 30) {
            const nearby = this.enemyGrid.queryRadius(player.x, player.y, hitRadius + 50);
            const collisions = [];
            
            for (const enemy of nearby) {
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const combinedRadius = hitRadius + (enemy.size || 20);
                
                if (dist < combinedRadius) {
                    collisions.push(enemy);
                }
            }
            
            return collisions;
        }
        
        // 检测子弹与敌人的碰撞
        checkBulletEnemyCollisions(bullets, hitCallback) {
            let checksCount = 0;
            
            for (const bullet of bullets) {
                if (bullet.dead) continue;
                
                // 只检查子弹附近的敌人
                const nearby = this.enemyGrid.queryRadius(bullet.x, bullet.y, 80);
                checksCount += nearby.length;
                
                for (const enemy of nearby) {
                    if (enemy.dead) continue;
                    
                    const dx = bullet.x - enemy.x;
                    const dy = bullet.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < (enemy.size || 20) + 10) {
                        hitCallback(bullet, enemy);
                        if (bullet.dead) break; // 子弹已消耗
                    }
                }
            }
            
            return checksCount;
        }
        
        // 检测玩家拾取金币
        checkCoinPickup(player, pickupRadius = 150) {
            return this.coinGrid.queryRadius(player.x, player.y, pickupRadius);
        }
        
        // 查找最近的敌人（用于自动瞄准）
        findNearestEnemy(x, y, maxRange = 600) {
            const nearby = this.enemyGrid.queryRadius(x, y, maxRange);
            
            let nearest = null;
            let minDist = maxRange;
            
            for (const enemy of nearby) {
                if (enemy.dead) continue;
                const dx = enemy.x - x;
                const dy = enemy.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < minDist) {
                    minDist = dist;
                    nearest = enemy;
                }
            }
            
            return nearest;
        }
        
        // 查找范围内所有敌人（用于 AOE 技能）
        findEnemiesInRange(x, y, range) {
            return this.enemyGrid.queryRadius(x, y, range);
        }
    }

    // 全局碰撞管理器实例
    const collisionManager = new CollisionManager(64);

    class Entity { 
        constructor(x,y) { this.x=x; this.y=y; this.dead=false; } 
        dist(o){ return Math.hypot(this.x-o.x, this.y-o.y); } 
    }

    class Player extends Entity {
        constructor(roleId = 'sword') {
            super(0,0);
            const role = ROLES.find(r => r.id === roleId) || ROLES[0];
            this.role = role;
            
            this.hp = role.hp; 
            this.maxHp = role.hp; 
            this.speed = role.speed;
            
            this.exp=0; this.maxExp=10; this.lvl=1;
            this.stats = { 
                dmg: role.dmg, 
                area: 150, 
                count: 1, 
                cd: role.cd, 
                spd: 500, 
                element: 'sword', 
                pierce: 0,
                thunderProb: 0,
                knockback: 1.0,
                bulletSpeed: 500,
                bulletLife: 2.0,
                stun: false
            }; 
            
            if (roleId === 'mage') this.stats.element = 'fire';
            if (roleId === 'ghost') { this.stats.element = 'ghost'; this.stats.bulletSpeed = 300; this.stats.bulletLife = 3.0; }
            if (roleId === 'formation') { this.stats.element = 'formation'; this.stats.pierce = 99; this.stats.area = 1.0; this.stats.spd = 300; }
            
            this.cdTimer=0; this.facing=1; this.lvlUpFx=0;
            this.dashCd = 0; this.dashMaxCd = 2.0; this.dashTime = 0;
            this.footprintTimer = 0;
            this.invulnTimer = 0; // Invulnerability Timer
        }
        update(dt) {
            if (this.invulnTimer > 0) this.invulnTimer -= dt;
            this.dashCd -= dt;
            this.dashTime -= dt;

            let dx=0, dy=0;
            // 键盘输入
            if(window.Game.keys['KeyW']||window.Game.keys['ArrowUp']) dy=-1;
            if(window.Game.keys['KeyS']||window.Game.keys['ArrowDown']) dy=1;
            if(window.Game.keys['KeyA']||window.Game.keys['ArrowLeft']) dx=-1;
            if(window.Game.keys['KeyD']||window.Game.keys['ArrowRight']) dx=1;
            
            // 触屏输入（移动端）
            if (window.Game.touch && window.Game.touch.active) {
                dx = window.Game.touch.dx;
                dy = window.Game.touch.dy;
            }
            
            if (window.Game.keys['Space'] && this.dashCd <= 0 && (dx!==0 || dy!==0)) {
                this.dashCd = this.dashMaxCd;
                this.dashTime = 0.25; 
                window.Game.texts.push(new FloatText(this.x, this.y - 40, "神行!", "#3498db", true));
                for(let i=0; i<5; i++) window.Game.particles.push(new Particle(this.x, this.y, '#fff', 0.5, 3));
            }

            if(dx||dy) {
                const l = Math.hypot(dx,dy);
                let moveSpeed = this.speed;
                if (this.dashTime > 0) moveSpeed *= 3.0; 

                // 保存移动速度（用于伪3D效果）
                this.vx = (dx/l)*moveSpeed;
                this.vy = (dy/l)*moveSpeed;
                
                this.x += this.vx*dt; this.y += this.vy*dt;
                if(dx) this.facing = dx > 0 ? 1 : -1;
                
                // Footprints
                this.footprintTimer -= dt;
                if(this.footprintTimer <= 0) {
                    if ([0,1,3].includes(window.Game.stageIdx)) {
                        window.Game.footprints.push(new Footprint(this.x, this.y + 20, Math.atan2(dy, dx)));
                        this.footprintTimer = 0.2;
                    }
                }
            } else {
                // 不移动时逐渐归零（平滑过渡）
                this.vx = (this.vx || 0) * 0.85;
                this.vy = (this.vy || 0) * 0.85;
            }
            this.cdTimer-=dt;
            if(this.cdTimer<=0) {
                const t = this.findTarget();
                if(t) { 
                    this.fire(t); 
                    this.cdTimer = this.stats.cd; 
                }
            }
        }
        findTarget() {
            // 【优化】使用空间哈希快速查找最近敌人
            const target = collisionManager.findNearestEnemy(this.x, this.y, 600);
            return target;
        }
        fire(t) {
            if (this.role.id === 'body') {
                 const range = this.stats.area; 
                 window.Game.particles.push(new Particle(this.x, this.y, '#795548', 0.5, range/2)); 
                 window.Game.screenShake(0.1);
                 for(let e of window.Game.enemies) {
                     if(this.dist(e) < range) {
                         const a = Math.atan2(e.y - this.y, e.x - this.x);
                         e.takeDamage(this.stats.dmg, Math.cos(a), Math.sin(a), 'earth', this.stats.knockback);
                     }
                 }
                 return;
            }

            // 幽冥涧召唤逻辑
            if (this.role.id === 'ghost') {
                // 检查当前傀儡数量
                const currentPuppets = window.Game.minions.filter(m => m instanceof Puppet && m.owner === this).length;
                const maxPuppets = this.stats.count || 1;
                
                if (currentPuppets < maxPuppets) {
                    window.Game.minions.push(new Puppet(this.x + (Math.random()-0.5)*40, this.y + (Math.random()-0.5)*40, this, this.stats));
                } else {
                    // 傀儡满时，给傀儡回血或强化？或者发射普通子弹？
                    // 暂时发射普通幽灵弹
                    window.Game.bullets.push(new Bullet(this.x, this.y, t, this.stats));
                }
                return;
            }

            for(let i=0; i<this.stats.count; i++) {
                setTimeout(() => {
                    if (this.stats.thunderProb > 0 && Math.random() < this.stats.thunderProb) {
                         window.Game.particles.push(new Lightning(this.x, this.y, t.x, t.y));
                         t.takeDamage(this.stats.dmg * 1.5, 0, 0, 'thunder'); 
                    }

                    if (this.stats.element === 'thunder') {
                        if (t.dead) return;
                        window.Game.particles.push(new Lightning(this.x, this.y, t.x, t.y));
                        const a = Math.atan2(t.y - this.y, t.x - this.x);
                        t.takeDamage(this.stats.dmg, Math.cos(a), Math.sin(a), 'thunder');
                        for(let k=0; k<5; k++) window.Game.particles.push(new Particle(t.x, t.y, '#ffeb3b', 0.3, 4));
                    } else {
                        window.Game.bullets.push(new Bullet(this.x, this.y, t, this.stats));
                    }
                }, i * (this.stats.element === 'thunder' ? 50 : 100)); 
            }
        }
        draw(ctx) {
            if (this.invulnTimer > 0 && Math.floor(window.Game.playTime * 15) % 2 === 0) return; // Blink effect

            const t = window.Game.playTime;
            
            // 计算移动方向的倾斜度（用于伪3D效果）
            const moveX = this.vx || 0;
            const moveY = this.vy || 0;
            const tiltX = Math.max(-1, Math.min(1, moveX / 150)); // 归一化到 -1 ~ 1
            const tiltY = Math.max(-1, Math.min(1, moveY / 150));
            
            // Shadow (根据移动方向调整阴影位置)
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); 
            ctx.ellipse(tiltX * 5, 10 + Math.abs(tiltY) * 3, 20 + Math.abs(tiltX) * 5, 8, 0, 0, Math.PI*2); 
            ctx.fill();
            ctx.restore();

            if (this.dashTime > 0) {
                ctx.save(); ctx.translate(this.x, this.y);
                ctx.globalAlpha = 0.5;
                ctx.scale(this.facing, 1);
                ctx.drawImage(Assets[this.role.svg], -32 - (Math.random()-0.5)*10, -32, 64, 64);
                ctx.restore();
            }

            ctx.save(); ctx.translate(this.x, this.y);
            let auraColor = '#f1c40f';
            if(this.stats.element === 'fire') auraColor = '#e74c3c';
            if(this.stats.element === 'thunder') auraColor = '#8e44ad';
            if(this.stats.element === 'wood') auraColor = '#2ecc71';
            if(this.stats.element === 'water') auraColor = '#3498db';
            if(this.stats.element === 'earth') auraColor = '#e67e22';
            if(this.stats.element === 'ghost') auraColor = '#4a148c';
            if(this.stats.element === 'formation') auraColor = '#607d8b';
            
            ctx.rotate(t*0.5);
            ctx.beginPath(); ctx.arc(0,0,45,0,Math.PI*2);
            ctx.strokeStyle = auraColor; ctx.globalAlpha=0.3; ctx.lineWidth=2; ctx.setLineDash([15,25]); ctx.stroke();
            ctx.restore();
            
            // 伪3D厚度效果：根据移动方向绘制多层剪影
            const thickness = 4; // 厚度层数
            const depthOffset = 3; // 每层偏移量
            
            // 绘制厚度层（在主体后面）
            if (Math.abs(tiltX) > 0.1 || Math.abs(tiltY) > 0.1) {
                for (let i = thickness; i > 0; i--) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    // 根据移动方向偏移
                    ctx.translate(-tiltX * depthOffset * i, tiltY * depthOffset * i * 0.5);
                    ctx.scale(this.facing, 1);
                    // 越深的层越暗
                    ctx.globalAlpha = 0.15 - i * 0.03;
                    ctx.drawImage(Assets[this.role.svg], -32, -32, 64, 64);
                    ctx.restore();
                }
            }
            
            // 绘制主体（带轻微倾斜变形）
            ctx.save(); 
            ctx.translate(this.x, this.y);
            ctx.scale(this.facing, 1);
            // 轻微的透视变形（移动时稍微压扁/拉伸）
            const scaleX = 1 - Math.abs(tiltX) * 0.1;
            const skewY = tiltY * 0.05;
            ctx.transform(scaleX, skewY, 0, 1, 0, 0);
            ctx.drawImage(Assets[this.role.svg], -32, -32, 64, 64);
            ctx.restore();
            
            if (this.dashCd > 0) {
                ctx.fillStyle = '#555';
                ctx.fillRect(this.x - 20, this.y + 40, 40, 4);
                ctx.fillStyle = '#3498db';
                ctx.fillRect(this.x - 20, this.y + 40, 40 * (1 - this.dashCd/this.dashMaxCd), 4);
            }

            if(this.lvlUpFx>0) {
                this.lvlUpFx-=0.05;
                ctx.beginPath(); ctx.arc(this.x,this.y, 40+(1-this.lvlUpFx)*150, 0, Math.PI*2);
                ctx.strokeStyle = `rgba(255,255,255,${this.lvlUpFx})`; ctx.lineWidth=5; ctx.stroke();
            }
        }
        gainExp(v){ 
            // 聚灵阵经验加成
            const actualExp = v * (this.expBoost || 1);
            this.exp += actualExp; 
            if(this.exp>=this.maxExp) this.levelUp(); 
            window.Game.updateUI(); 
        }
        levelUp(){ this.lvl++; this.exp=0; this.maxExp=Math.floor(this.maxExp*1.4); this.hp=this.maxHp; this.lvlUpFx=1.0; window.showUpgradeMenu(); }
        hit(d, attacker = null){ 
            if(this.invulnTimer > 0) return;
            if(this.invincible) return; // 金身符无敌
            
            // 确保伤害值有效
            const damage = d || 0;
            if (isNaN(damage) || damage <= 0) return;
            
            // 玄武盾减伤效果
            let actualDamage = damage;
            if (this.damageReduction) {
                actualDamage = d * (1 - this.damageReduction);
            }
            
            this.hp -= actualDamage; 
            this.invulnTimer = 0.3; // 0.3s i-frame
            window.Game.texts.push(new FloatText(this.x, this.y, "-"+Math.floor(actualDamage), '#e74c3c', true)); 
            
            // 玄武盾反弹效果
            if (this.damageReflect && attacker && !attacker.dead) {
                const reflectDamage = damage * this.damageReflect;
                attacker.hp -= reflectDamage;
                window.Game.texts.push(new FloatText(attacker.x, attacker.y, "-"+Math.floor(reflectDamage), '#3498db'));
                window.Game.particles.push(new Particle(attacker.x, attacker.y, '#3498db', 0.3, 4));
                if (attacker.hp <= 0 && !attacker.dead) {
                    if (window.Game.onEnemyKilled) {
                        window.Game.onEnemyKilled(attacker);
                    } else {
                        attacker.dead = true;
                    }
                }
            }
            
            window.Game.updateUI(); 
            window.Game.screenShake(0.3);
            if(this.hp<=0) window.Game.gameOver(); 
        }
    }

    class Enemy extends Entity {
        constructor(type,x,y,diff,isElite=false) {
            super(x,y); this.type=type; this.isElite=isElite;
            // Reduced speeds for better kiting
            if(type==='bat'){ this.hp=20*diff; this.speed=130; this.dmg=5; this.exp=5; this.img='bat'; }
            else if(type==='bat_fire'){ this.hp=30*diff; this.speed=140; this.dmg=8; this.exp=8; this.img='bat_fire'; } // Nerfed from 150 to 140
            else if(type==='ghost'){ this.hp=40*diff; this.speed=90; this.dmg=10; this.exp=10; this.img='ghost'; }
            else if(type==='ghost_ice'){ this.hp=50*diff; this.speed=80; this.dmg=12; this.exp=15; this.img='ghost_ice'; }
            else if(type==='magma_rock'){ this.hp=120*diff; this.speed=50; this.dmg=25; this.exp=30; this.img='magma_rock'; }
            else if(type==='crystal'){ this.hp=150*diff; this.speed=40; this.dmg=30; this.exp=35; this.img='crystal'; }
            else { this.hp=100*diff; this.speed=60; this.dmg=20; this.exp=25; this.img='rock'; }
            
            if(isElite) {
                this.hp *= 5; this.dmg *= 1.5; this.exp *= 10;
                this.scale = 1.5;
            } else {
                this.scale = 1.0;
            }
            
            this.maxHp=this.hp; this.pushX=0; this.pushY=0;
            this.slowTimer = 0;
            this.hitFlashTimer = 0;
        }
        update(dt,p) {
            if(this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
            if(this.slowTimer>0) this.slowTimer-=dt;
            let spd = this.speed;
            if(this.slowTimer>0) spd *= 0.5; 

            // Soft collision with other enemies (optional optimization)
            // For performance, we won't check all-vs-all every frame in JS for 500 enemies.
            // But we can prevent stacking on player.
            
            const dToPlayer = this.dist(p);
            const minDist = 25 * this.scale; // Collision radius

            if (dToPlayer < minDist) {
                 // Too close to player, push back slightly to avoid perfect overlap "sticking"
                 // This simulates body block without hard collision
                 const a = Math.atan2(this.y - p.y, this.x - p.x);
                 // Stronger repulsion force to overcome forward movement
                 this.pushX += Math.cos(a) * 1000 * dt; 
                 this.pushY += Math.sin(a) * 1000 * dt;
            }

            const a = Math.atan2(p.y-this.y, p.x-this.x);
            
            // Only move towards player if not pushed too hard
            this.x += (Math.cos(a)*spd+this.pushX)*dt;
            this.y += (Math.sin(a)*spd+this.pushY)*dt;
            
            this.pushX*=0.9; this.pushY*=0.9;
            
            if(dToPlayer<30*this.scale) p.hit(this.dmg); // Discrete damage
        }
        takeDamage(v, kx, ky, type, knockbackMult = 1.0) {
            // 确保伤害值有效
            const dmg = v || 0;
            if (isNaN(dmg) || dmg <= 0) return;
            
            this.hp -= dmg; 
            this.hitFlashTimer = 0.1; // Flash
            
            let force = 120;
            if(type === 'earth') force = 300; 
            
            force *= knockbackMult; 
            if(this.isElite) force *= 0.2; 
            
            this.pushX=kx*force; this.pushY=ky*force;
            
            let c = '#fff';
            let crit = false;
            
            // Ensure consistent colors for damage sources (Player Attacks)
            if(type === 'fire') { c = '#ff5722'; crit = true; }
            else if(type === 'thunder') { c = '#ffeb3b'; crit = true; }
            else if(type === 'wood') c = '#2ecc71';
            else if(type === 'water') c = '#3498db';
            else if(type === 'earth') { c = '#e67e22'; crit = true; }
            else if(type === 'ghost') c = '#9c27b0';
            else if(type === 'formation') c = '#cfd8dc';
            else if(type === 'sword') c = '#ffffff'; // Explicit white for sword
            
            // Override if this is environmental damage (e.g., hazard zones) or trap damage
            // Assuming "trap" or "hazard" types might exist in future, we can color them differently.
            
            // Throttling damage numbers to reduce visual clutter
            // Check if this entity was recently hit by the same type to avoid number spam
            if (!this.lastDamageTime) this.lastDamageTime = {};
            const now = window.Game.playTime;
            // Only show text if enough time passed since last hit of this type (0.2s)
            // OR if it's a crit (always show crits)
            if (crit || !this.lastDamageTime[type] || (now - this.lastDamageTime[type] > 0.2)) {
                 window.Game.texts.push(new FloatText(this.x, this.y-20*this.scale, Math.floor(dmg), c, crit));
                 this.lastDamageTime[type] = now;
            }
            
            if (crit || this.hp <= 0) {
                window.Game.hitStop(0.05);
                // Debris FX - Optimized: Fewer particles for non-lethal hits
                const count = this.hp <= 0 ? 3 : 1; 
                if (Math.random() < 0.5 || this.hp <= 0) { // 50% chance for debris on crit, 100% on death
                    for(let i=0; i<count; i++) {
                        const p = new Particle(this.x, this.y, this.hp<=0 ? '#555' : c, 0.4 + Math.random()*0.3, 3 + Math.random()*3, 800);
                        p.vx = (Math.random()-0.5)*300;
                        p.vy = -100 - Math.random()*200;
                        window.Game.particles.push(p);
                    }
                }
            }
            
            if(type === 'water') this.slowTimer = 2.0; 

            if(this.hp<=0) {
                this.dead=true; window.Game.score++; 
                window.Game.updateUI();
                if(type==='fire') window.Game.screenShake(0.5);
                
                if(this.isElite) {
                    window.Game.chests.push(new Chest(this.x, this.y));
                    window.Game.screenShake(2.0);
                    window.Game.texts.push(new FloatText(this.x, this.y-50, "精英击杀!", "#f1c40f", true));
                } else {
                    window.Game.orbs.push(new Orb(this.x,this.y,this.exp)); 
                }
            }
        }
        draw(ctx) {
            ctx.save(); ctx.translate(this.x, this.y);
            ctx.scale(this.scale, this.scale);
            
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.ellipse(0, 20, 20, 8, 0, 0, Math.PI*2); ctx.fill();

            if(window.Game.player.x<this.x) ctx.scale(-1,1);
            
            if(this.isElite) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(0, 5, 25, 0, Math.PI*2); ctx.stroke();
                ctx.restore();
            }

            ctx.drawImage(Assets[this.img], -24, -24, 48, 48);

            if (this.hitFlashTimer > 0) {
                // Optimized Hit Flash: Use additive blending to brighten
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.8;
                ctx.drawImage(Assets[this.img], -24, -24, 48, 48);
                ctx.restore();
            }

            if(this.slowTimer>0) {
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
                ctx.fillRect(-24,-24,48,48);
                ctx.globalCompositeOperation = 'source-over';
            }
            if(this.hp<this.maxHp) { ctx.fillStyle='red'; ctx.fillRect(-15,-30,30*(this.hp/this.maxHp),4); }
            ctx.restore();
        }
    }

    class Bullet extends Entity {
        constructor(x, y, t, s) {
            super(x, y);
            this.type = s.element; 
            const a = Math.atan2(t.y-y, t.x-x) + (Math.random()-0.5)*0.1;
            
            let spd = s.spd;
            if(s.element === 'beast') spd = s.bulletSpeed;
            
            this.vx = Math.cos(a)*spd; this.vy = Math.sin(a)*spd;
            this.life = 2.0; 
            if(s.element === 'beast') this.life = s.bulletLife;
            
            this.dmg = s.dmg; this.angle = a;
            this.pierce = s.pierce || 0; 
            this.hitList = []; 
            this.stun = s.stun || false; 
            this.target = t; 
            
            this.bornTime = 0;
            this.originVX = this.vx;
            this.originVY = this.vy;
            this.currentSpeed = spd;
            this.area = s.area || 0;
            
            if(this.type === 'earth') { this.life = 3.0; this.dmg *= 1.5; }
            
            // Formation (Trap) Init
            if (this.type === 'formation') {
                 this.destX = t.x;
                 this.destY = t.y;
                 this.maxLife = 3.0; // Trap duration
                 this.life = 3.0; 
                 this.pierce = 999; // Don't die on hit
                 this.deployed = false;
                 this.trapInterval = 0.3;
                 this.trapTimer = 0;
                 this.scale = 0.1; // Grow in
            }
            
            // Ghost (Wobble) Init
            if (this.type === 'ghost') {
                 this.wobblePhase = Math.random() * Math.PI * 2;
            }
        }
        update(dt) {
            // Sword Acceleration
            if (this.type === 'sword') {
                this.currentSpeed += 800 * dt;
                const currentMag = Math.hypot(this.vx, this.vy);
                if (currentMag > 0) {
                     this.vx = (this.vx / currentMag) * this.currentSpeed;
                     this.vy = (this.vy / currentMag) * this.currentSpeed;
                }
            }

            // Formation Logic
            if (this.type === 'formation') {
                 if (!this.deployed) {
                     // Move towards dest
                     const d = Math.hypot(this.destX - this.x, this.destY - this.y);
                     if (d < 20) {
                         this.deployed = true;
                         this.vx = 0; this.vy = 0;
                         this.life = this.maxLife; // Reset life for duration
                     } else {
                         const a = Math.atan2(this.destY - this.y, this.destX - this.x);
                         this.vx = Math.cos(a) * this.currentSpeed;
                         this.vy = Math.sin(a) * this.currentSpeed;
                         this.x += this.vx * dt;
                         this.y += this.vy * dt;
                         this.angle = a;
                     }
                 } else {
                     // Trap Logic
                     if (this.scale < 1.0) this.scale += dt * 5;
                     this.trapTimer -= dt;
                     if (this.trapTimer <= 0) {
                         this.trapTimer = this.trapInterval;
                         // Visual Pulse
                         window.Game.particles.push(new Particle(this.x, this.y, '#cfd8dc', 0.5, this.area*0.5 || 50));
                         
                         // 【优化】阵法 AOE 使用空间哈希
                         const trapRange = this.area || 80;
                         const nearbyEnemies = collisionManager.findEnemiesInRange(this.x, this.y, trapRange);
                         for (let e of nearbyEnemies) {
                             if (this.dist(e) < trapRange) {
                                 this.hit(e);
                             }
                         }
                     }
                     this.life -= dt;
                     if (this.life <= 0) this.dead = true;
                     return;
                 }
            }

            if (this.type !== 'formation') {
                this.life-=dt; if(this.life<=0) this.dead=true;
            }
            this.bornTime += dt;
            
            if (this.type === 'ghost') {
                 // Wobbly Homing
                 if (!this.target.dead) {
                     const d = this.dist(this.target);
                     if (d > 10) {
                         const a = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                         
                         // Add Wobble
                         const wobble = Math.sin(this.bornTime * 10 + this.wobblePhase) * 0.5;
                         
                         const turnSpeed = 5.0 * dt;
                         const speed = Math.hypot(this.vx, this.vy);
                         
                         // Blend straight homing with wobble
                         this.vx += (Math.cos(a + wobble) * speed - this.vx) * turnSpeed;
                         this.vy += (Math.sin(a + wobble) * speed - this.vy) * turnSpeed;
                         
                         const newSpeed = Math.hypot(this.vx, this.vy);
                         this.vx = (this.vx / newSpeed) * speed;
                         this.vy = (this.vy / newSpeed) * speed;
                         this.angle = Math.atan2(this.vy, this.vx);
                     }
                 } else {
                     // Find new target - 【优化】使用空间哈希
                     const newTarget = collisionManager.findNearestEnemy(this.x, this.y, 400);
                     if(newTarget) this.target = newTarget;
                 }
                 this.x += this.vx * dt;
                 this.y += this.vy * dt;
                 
            } else if (this.type !== 'formation') {
                 this.x+=this.vx*dt; this.y+=this.vy*dt;
            }
            
            if(this.type === 'fire') {
                if(Math.random()>0.2) window.Game.particles.push(new Particle(this.x,this.y,'#ff5722',0.5, 5));
            } else if (this.type === 'water') {
                 if(Math.random()>0.5) window.Game.particles.push(new Particle(this.x,this.y,'#e1f5fe',0.3, 3));
            } else if (this.type === 'thunder') {
                 window.Game.particles.push(new Particle(this.x,this.y,'#fff',0.2, 2));
            } else if (this.type === 'ghost') {
                 if(Math.random()>0.7) window.Game.particles.push(new Particle(this.x,this.y,'#4a148c',0.3, 3));
            } else if (this.type === 'formation') ; else {
                if(Math.random()>0.5) window.Game.particles.push(new Particle(this.x,this.y,'#00bcd4',0.3, 3));
            }

            // 【优化】使用空间哈希只检测附近敌人
            const nearbyEnemies = collisionManager.findEnemiesInRange(this.x, this.y, 80);
            for(let e of nearbyEnemies) {
                if(this.dist(e)<35 && !this.hitList.includes(e)) {
                    this.hit(e);
                    this.hitList.push(e);
                    if(this.pierce > 0) {
                        this.pierce--;
                    } else {
                        this.dead = true;
                        break;
                    }
                }
            }
        }
        hit(e) {
            e.takeDamage(this.dmg, Math.cos(this.angle), Math.sin(this.angle), this.type);
            if (this.stun) e.slowTimer = 1.0; 
            
            // Mage AOE Explosion - 【优化】使用空间哈希
            if(this.type === 'fire') {
                const aoeRange = this.area || 120;
                const nearbyEnemies = collisionManager.findEnemiesInRange(this.x, this.y, aoeRange);
                for(let other of nearbyEnemies) {
                     if (other !== e && this.dist(other) < aoeRange) {
                         // Reduced damage for splash
                         other.takeDamage(this.dmg * 0.5, 0, 0, 'fire');
                     }
                 }
                 // Big Boom Visual
                 window.Game.particles.push(new Particle(this.x, this.y, '#ff5722', 0.6, this.area || 100));
                 for(let i=0; i<10; i++) window.Game.particles.push(new Particle(this.x,this.y,'#ff9800', 0.6, 8));
                 return; // Skip standard small particles
            }

            if(this.type === 'water') {
                for(let i=0; i<5; i++) window.Game.particles.push(new Particle(this.x,this.y,'#b3e5fc', 0.4, 5));
            } else if(this.type === 'earth') {
                 window.Game.screenShake(0.2);
                 for(let i=0; i<8; i++) window.Game.particles.push(new Particle(this.x,this.y,'#795548', 0.5, 6));
            } else if(this.type === 'ghost') {
                 for(let i=0; i<5; i++) window.Game.particles.push(new Particle(this.x,this.y,'#9c27b0', 0.4, 5));
            } else if(this.type === 'formation') {
                 for(let i=0; i<6; i++) window.Game.particles.push(new Particle(this.x,this.y,'#cfd8dc', 0.5, 6));
            } else {
                window.Game.particles.push(new Particle(this.x,this.y,'#fff',0.2, 6));
            }
        }
        draw(ctx) {
            ctx.save(); ctx.translate(this.x, this.y);
            
            if (this.type === 'formation') {
                // Formation Rune Drawing
                 if (this.deployed) {
                     ctx.scale(this.scale, this.scale);
                     ctx.rotate(window.Game.playTime * 2); // Spin
                     ctx.beginPath();
                     ctx.arc(0,0, this.area || 80, 0, Math.PI*2);
                     ctx.strokeStyle = `rgba(207, 216, 220, ${0.3 + Math.sin(window.Game.playTime*10)*0.2})`;
                     ctx.lineWidth = 2;
                     ctx.stroke();
                     
                     // Inner rune
                     ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 3;
                     ctx.beginPath(); ctx.moveTo(0,-20); ctx.lineTo(16,10); ctx.lineTo(-16,10); ctx.closePath(); ctx.stroke();
                 } else {
                     // Flying Rune
                     ctx.rotate(this.angle + Math.PI/2);
                     ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2;
                     ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(8,5); ctx.lineTo(-8,5); ctx.closePath(); ctx.stroke();
                 }
                 ctx.restore();
                 return;
            }

            ctx.rotate(this.angle + Math.PI/2);
            if(this.type === 'fire') {
                ctx.rotate(window.Game.playTime * 10);
                ctx.drawImage(Assets['fire'], -16, -16, 32, 32);
            } else if(this.type === 'wood') {
                 ctx.rotate(window.Game.playTime * 5);
                 ctx.drawImage(Assets['leaf'], -12, -24, 24, 48);
            } else if(this.type === 'water') {
                ctx.drawImage(Assets['ice'], -16, -16, 32, 32);
            } else if(this.type === 'earth') {
                ctx.rotate(window.Game.playTime * 2);
                ctx.drawImage(Assets['rock_b'], -20, -20, 40, 40);
            } else if(this.type === 'ghost') {
                 ctx.rotate(-Math.PI/2); 
                 if (this.vx < 0) ctx.scale(1, -1); 
                 // Ghost fire instead of wolf
                 ctx.fillStyle = '#7b1fa2'; 
                 ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
                 ctx.fillStyle = '#e1bee7';
                 ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill();
            } else {
                ctx.drawImage(Assets['sword'], -10, -20, 20, 40);
            }
            ctx.restore();
        }
    }

    class Artifact extends Entity {
        constructor(id) {
            super(0, 0);
            this.id = id;
            this.data = ARTIFACTS.find(a => a.id === id) || ARTIFACTS[0];
            this.cd = 0;
            this.maxCd = this.data.cd;
            this.angle = 0;
            
            // 诛仙剑阵专用
            this.swordAngles = [0, Math.PI/2, Math.PI, Math.PI*1.5];
            this.swordTargets = [null, null, null, null];
            this.swordCooldowns = [0, 0, 0, 0];
            
            // 风火轮专用
            this.fireTrailTimer = 0;
            this.fireTrails = [];
            
            // 乾坤圈专用
            this.knockbackTimer = 0;
            
            // 被动效果是否已应用
            this.passiveApplied = false;
        }
        
        update(dt, player) {
            this.x = player.x;
            this.y = player.y;
            
            // 应用被动效果（只执行一次）
            if (!this.passiveApplied) {
                this.applyPassiveEffects(player);
                this.passiveApplied = true;
            }
            
            // 主动CD效果
            if (this.maxCd > 0) {
                this.cd -= dt;
                if (this.cd <= 0) {
                    this.trigger(player);
                    this.cd = this.maxCd;
                }
            }
            
            // 根据法宝类型执行特殊逻辑
            switch (this.id) {
                case 'zhuxian_array':
                    this.updateZhuxianArray(dt, player);
                    break;
                case 'mirror':
                    this.updateMirror(dt, player);
                    break;
                case 'qiankun_quan':
                    this.updateQiankunQuan(dt, player);
                    break;
                case 'fenghuo_lun':
                    this.updateFenghuoLun(dt, player);
                    break;
                case 'dinghai_zhu':
                    this.updateDinghaiZhu(dt, player);
                    break;
            }
        }
        
        // ========== 被动效果应用 ==========
        applyPassiveEffects(player) {
            switch (this.id) {
                case 'jinjiao_jian':
                    // 金蛟剪 - 穿透+2，伤害+20%
                    player.stats.pierce = (player.stats.pierce || 0) + 2;
                    player.stats.dmg *= 1.2;
                    window.Game.texts.push(new FloatText(player.x, player.y - 60, "金蛟剪·穿透强化!", "#f1c40f"));
                    break;
                    
                case 'xuanwu_dun':
                    // 玄武盾 - 减伤30%（通过标记实现，在Player.hit中处理）
                    player.damageReduction = 0.3;
                    player.damageReflect = 0.1;
                    window.Game.texts.push(new FloatText(player.x, player.y - 60, "玄武盾·防御强化!", "#3498db"));
                    break;
                    
                case 'fenghuo_lun':
                    // 风火轮 - 移速+50%
                    player.speed *= 1.5;
                    window.Game.texts.push(new FloatText(player.x, player.y - 60, "风火轮·移速强化!", "#e74c3c"));
                    break;
                    
                case 'jubao_pen':
                    // 聚宝盆 - 掉落+50%，拾取范围+100%
                    player.dropBonus = 1.5;
                    player.stats.area *= 2;
                    window.Game.texts.push(new FloatText(player.x, player.y - 60, "聚宝盆·财运加持!", "#f1c40f"));
                    break;
            }
        }
        
        // ========== 诛仙剑阵 - 4剑环绕自动攻击 ==========
        updateZhuxianArray(dt, player) {
            // 4把剑环绕
            for (let i = 0; i < 4; i++) {
                this.swordAngles[i] += dt * 2; // 旋转速度
                this.swordCooldowns[i] -= dt;
                
                // 寻找并攻击目标
                if (this.swordCooldowns[i] <= 0) {
                    const swordX = this.x + Math.cos(this.swordAngles[i]) * 60;
                    const swordY = this.y + Math.sin(this.swordAngles[i]) * 60;
                    
                    // 找最近的敌人
                    let nearest = null;
                    let minDist = 150;
                    for (const e of window.Game.enemies) {
                        if (e.dead) continue;
                        const d = Math.hypot(e.x - swordX, e.y - swordY);
                        if (d < minDist) {
                            minDist = d;
                            nearest = e;
                        }
                    }
                    
                    if (nearest) {
                        // 剑气攻击
                        nearest.takeDamage(5, 0, 0, 'sword');
                        window.Game.particles.push(new Particle(nearest.x, nearest.y, '#00bcd4', 0.3, 4));
                        this.swordCooldowns[i] = 0.5; // 攻击间隔
                    }
                }
            }
        }
        
        // ========== 乾蓝冰焰 - 前方烧伤，后方冻结 ==========
        updateMirror(dt, player) {
            this.angle += dt * 2; 
            for (let e of window.Game.enemies) {
                const d = this.dist(e);
                if (d < 150) { 
                    const angToEnemy = Math.atan2(e.y - this.y, e.x - this.x);
                    let diff = angToEnemy - this.angle;
                    while (diff > Math.PI) diff -= Math.PI*2;
                    while (diff < -Math.PI) diff += Math.PI*2;
                    
                    if (Math.abs(diff) < Math.PI/2) {
                        // 前方 - 火焰灼烧
                        if (!e.burnTick) e.burnTick = 0;
                        e.burnTick -= dt;
                        if (e.burnTick <= 0) {
                            e.takeDamage(10, 0, 0, 'fire');
                            window.Game.particles.push(new Particle(e.x, e.y, '#e74c3c', 0.3, 2));
                            e.burnTick = 0.2;
                        }
                    } else {
                        // 后方 - 冰霜减速
                        e.slowTimer = 0.2;
                        if (Math.random() < dt * 5) {
                            window.Game.particles.push(new Particle(e.x, e.y, '#3498db', 0.3, 2));
                        }
                    }
                }
            }
        }
        
        // ========== 乾坤圈 - 结界击退敌人 ==========
        updateQiankunQuan(dt, player) {
            this.knockbackTimer -= dt;
            this.angle += dt * 3;
            
            if (this.knockbackTimer <= 0) {
                this.knockbackTimer = 0.5;
                
                // 击退靠近的敌人
                for (const e of window.Game.enemies) {
                    if (e.dead) continue;
                    const d = this.dist(e);
                    if (d < 80) {
                        const angle = Math.atan2(e.y - this.y, e.x - this.x);
                        const force = 200;
                        e.pushX = Math.cos(angle) * force;
                        e.pushY = Math.sin(angle) * force;
                        
                        // 击退粒子
                        window.Game.particles.push(new Particle(e.x, e.y, '#f1c40f', 0.3, 4));
                    }
                }
            }
        }
        
        // ========== 风火轮 - 移动留下火焰轨迹 ==========
        updateFenghuoLun(dt, player) {
            this.fireTrailTimer -= dt;
            
            // 清理过期火焰
            this.fireTrails = this.fireTrails.filter(t => t.life > 0);
            this.fireTrails.forEach(t => {
                t.life -= dt;
                // 火焰伤害
                t.dmgTimer -= dt;
                if (t.dmgTimer <= 0) {
                    t.dmgTimer = 0.3;
                    for (const e of window.Game.enemies) {
                        if (e.dead) continue;
                        const d = Math.hypot(e.x - t.x, e.y - t.y);
                        if (d < 30) {
                            e.takeDamage(3, 0, 0, 'fire');
                        }
                    }
                }
            });
            
            // 移动时留下火焰
            const isMoving = Math.abs(player.vx || 0) > 10 || Math.abs(player.vy || 0) > 10;
            if (isMoving && this.fireTrailTimer <= 0) {
                this.fireTrailTimer = 0.1;
                this.fireTrails.push({
                    x: player.x,
                    y: player.y + 20,
                    life: 2.0,
                    dmgTimer: 0
                });
            }
        }
        
        // ========== 定海神珠 - 敌人减速光环 ==========
        updateDinghaiZhu(dt, player) {
            const slowRadius = 120; // 与绘制范围保持一致
            
            for (const e of window.Game.enemies) {
                if (e.dead) continue;
                const d = this.dist(e);
                if (d < slowRadius) {
                    e.slowTimer = 0.2;
                    // 偶尔显示减速粒子（降低频率）
                    if (Math.random() < dt) {
                        window.Game.particles.push(new Particle(e.x, e.y, '#2196f3', 0.2, 2));
                    }
                }
            }
        }
        
        // ========== 主动触发效果 ==========
        trigger(player) {
            switch (this.id) {
                case 'fantian':
                    // 虚天鼎 - 震晕全场
                    window.Game.screenShake(2.0);
                    window.Game.enemies.forEach(e => {
                        e.takeDamage(50, 0, 0, 'earth', 2.0);
                        e.slowTimer = 3.0; 
                    });
                    window.Game.texts.push(new FloatText(player.x, player.y - 100, "虚天鼎!", "#f1c40f", true));
                    break;
                    
                case 'gourd':
                    // 玄天斩灵 - 斩杀精英
                    const elites = window.Game.enemies.filter(e => e.isElite);
                    const target = elites.length > 0 ? elites[0] : null;
                    if (target) {
                        window.Game.texts.push(new FloatText(player.x, player.y - 80, "玄天斩灵!", "#fff", true));
                        window.Game.particles.push(new Beam(player.x, player.y, target.x, target.y));
                        target.takeDamage(500, 0, 0, 'sword'); 
                    } else {
                        this.cd = 1.0; // 没有目标时缩短CD
                    }
                    break;
            }
        }
        
        // ========== 绘制 ==========
        draw(ctx) {
            const img = Assets[this.data.svg];
            
            ctx.save();
            ctx.translate(this.x, this.y);
            
            switch (this.id) {
                case 'zhuxian_array':
                    this.drawZhuxianArray(ctx);
                    break;
                    
                case 'mirror':
                    this.drawMirror(ctx, img);
                    break;
                    
                case 'qiankun_quan':
                    this.drawQiankunQuan(ctx, img);
                    break;
                    
                case 'fenghuo_lun':
                    this.drawFenghuoLun(ctx, img);
                    break;
                    
                case 'dinghai_zhu':
                    this.drawDinghaiZhu(ctx, img);
                    break;
                    
                case 'fantian':
                    // 虚天鼎 - 显示CD进度
                    this.drawFantian(ctx, img);
                    break;
                    
                case 'gourd':
                    // 玄天斩灵 - 显示CD进度
                    this.drawGourd(ctx, img);
                    break;
                    
                default:
                    // 被动型法宝也显示悬浮图标
                    this.drawPassiveArtifact(ctx, img);
                    break;
            }
            
            ctx.restore();
        }
        
        // 诛仙剑阵绘制
        drawZhuxianArray(ctx) {
            // 4把环绕的剑
            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.rotate(this.swordAngles[i]);
                ctx.translate(60, 0);
                ctx.rotate(Math.PI / 2);
                
                // 剑身
                ctx.fillStyle = '#00bcd4';
                ctx.fillRect(-3, -20, 6, 40);
                ctx.fillStyle = '#e1f5fe';
                ctx.fillRect(-1, -18, 2, 36);
                
                // 剑光
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#00bcd4';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                
                ctx.restore();
            }
            
            // 中心阵法
            ctx.strokeStyle = '#00bcd4';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, 50, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        // 乾蓝冰焰绘制
        drawMirror(ctx, img) {
            ctx.rotate(this.angle);
            ctx.translate(60, 0); 
            
            // 前方火焰区域
            ctx.fillStyle = 'rgba(255, 87, 34, 0.15)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 100, -Math.PI/2, Math.PI/2);
            ctx.fill();
            
            // 后方冰霜区域
            ctx.fillStyle = 'rgba(33, 150, 243, 0.15)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 100, Math.PI/2, 3*Math.PI/2);
            ctx.fill();
            
            if (img) {
                ctx.drawImage(img, -20, -20, 40, 40);
            }
        }
        
        // 乾坤圈绘制
        drawQiankunQuan(ctx, img) {
            // 旋转的金圈
            ctx.rotate(this.angle);
            
            // 外圈
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 70, 0, Math.PI * 2);
            ctx.stroke();
            
            // 内圈光晕
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, 0, 65, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            // 法宝图标
            if (img) {
                ctx.drawImage(img, -15, -15, 30, 30);
            }
        }
        
        // 风火轮绘制
        drawFenghuoLun(ctx, img) {
            // 绘制火焰轨迹
            this.fireTrails.forEach(t => {
                if (t.life <= 0) return; // 跳过已消失的轨迹
                ctx.save();
                ctx.translate(t.x - this.x, t.y - this.y);
                const lifeRatio = Math.max(0, t.life / 2.0);
                ctx.globalAlpha = lifeRatio;
                ctx.fillStyle = '#ff5722';
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(1, 15 * lifeRatio), 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(1, 8 * lifeRatio), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            
            // 脚下的风火轮
            ctx.translate(0, 30);
            ctx.rotate(window.Game.playTime * 10);
            
            // 轮子
            ctx.strokeStyle = '#ff5722';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.stroke();
            
            // 火焰
            for (let i = 0; i < 8; i++) {
                ctx.save();
                ctx.rotate(i * Math.PI / 4);
                ctx.fillStyle = i % 2 === 0 ? '#ff5722' : '#ffeb3b';
                ctx.beginPath();
                ctx.moveTo(20, -5);
                ctx.lineTo(35, 0);
                ctx.lineTo(20, 5);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // 定海神珠绘制
        drawDinghaiZhu(ctx, img) {
            const radius = 120; // 光环半径（从200减小到120）
            
            // 减速光环
            ctx.globalAlpha = 0.08 + Math.sin(window.Game.playTime * 3) * 0.03;
            ctx.fillStyle = '#2196f3';
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = '#2196f3';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
            
            // 悬浮的神珠（移到角色旁边）
            const hover = Math.sin(window.Game.playTime * 2) * 6;
            ctx.translate(45, -50 + hover);
            
            // 珠子光晕
            ctx.fillStyle = '#2196f3';
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            // 珠子
            const grad = ctx.createRadialGradient(-3, -3, 0, 0, 0, 14);
            grad.addColorStop(0, '#e1f5fe');
            grad.addColorStop(0.5, '#2196f3');
            grad.addColorStop(1, '#0d47a1');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // 高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(-4, -4, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 虚天鼎绘制 - 显示CD进度环
        drawFantian(ctx, img) {
            const hover = Math.sin(window.Game.playTime * 2) * 8;
            ctx.translate(45, -55 + hover);
            
            // CD进度环
            if (this.maxCd > 0) {
                const progress = 1 - (this.cd / this.maxCd);
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 22, -Math.PI/2, -Math.PI/2 + progress * Math.PI * 2);
                ctx.stroke();
            }
            
            // 鼎图标
            if (img) {
                ctx.drawImage(img, -18, -18, 36, 36);
            }
        }
        
        // 玄天斩灵绘制 - 葫芦带CD
        drawGourd(ctx, img) {
            const hover = Math.sin(window.Game.playTime * 2) * 8;
            ctx.translate(45, -55 + hover);
            
            // CD进度环
            if (this.maxCd > 0) {
                const progress = 1 - (this.cd / this.maxCd);
                ctx.strokeStyle = '#9c27b0';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 22, -Math.PI/2, -Math.PI/2 + progress * Math.PI * 2);
                ctx.stroke();
            }
            
            // 葫芦图标
            if (img) {
                ctx.drawImage(img, -15, -20, 30, 40);
            }
        }
        
        // 被动型法宝绘制 - 半透明悬浮图标
        drawPassiveArtifact(ctx, img) {
            const hover = Math.sin(window.Game.playTime * 2) * 6;
            ctx.translate(45, -50 + hover);
            
            // 半透明效果表示被动
            ctx.globalAlpha = 0.7;
            
            // 光晕
            ctx.fillStyle = this.getArtifactColor();
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.7;
            
            // 图标
            if (img) {
                ctx.drawImage(img, -18, -18, 36, 36);
            }
            
            ctx.globalAlpha = 1;
        }
        
        // 获取法宝主题色
        getArtifactColor() {
            switch (this.id) {
                case 'jinjiao_jian': return '#f1c40f';  // 金色
                case 'xuanwu_dun': return '#4caf50';    // 绿色
                case 'jubao_pen': return '#f39c12';     // 橙金色
                default: return '#fff';
            }
        }
    }

    class Beam extends Entity {
        constructor(x1, y1, x2, y2) {
            super(x1, y1);
            this.x2 = x2; this.y2 = y2;
            this.life = 0.5;
        }
        update(dt) { this.life -= dt; if (this.life <= 0) this.dead = true; }
        draw(ctx) {
            const w = this.life * 20;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.life*2})`;
            ctx.lineWidth = w;
            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x2, this.y2); ctx.stroke();
            ctx.strokeStyle = `rgba(200, 240, 255, ${this.life})`;
            ctx.lineWidth = w * 2;
            ctx.stroke();
            ctx.restore();
        }
    }

    class Puppet extends Entity {
        constructor(x, y, owner, stats) {
            super(x, y);
            this.owner = owner;
            this.stats = stats;
            this.life = (stats.bulletLife || 5) * 2; // 存在时间比子弹长
            this.speed = (stats.bulletSpeed || 150) * 0.5; // 移动速度
            this.dmg = stats.dmg || 10;
            this.dead = false;
            this.target = null;
            this.attackTimer = 0;
            this.attackInterval = 0.5; // 攻击间隔
        }

        update(dt) {
            this.life -= dt;
            if (this.life <= 0) {
                this.dead = true;
                return;
            }

            // 寻找目标
            if (!this.target || this.target.dead || this.dist(this.target) > 400) {
                this.target = collisionManager.findNearestEnemy(this.x, this.y, 400);
            }

            if (this.target) {
                // 追击
                const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                this.x += Math.cos(angle) * this.speed * dt;
                this.y += Math.sin(angle) * this.speed * dt;

                // 攻击
                if (this.dist(this.target) < 30) {
                    if (this.attackTimer <= 0) {
                        this.target.takeDamage(this.dmg, Math.cos(angle), Math.sin(angle), 'ghost');
                        this.attackTimer = this.attackInterval;
                        // 攻击特效
                        window.Game.particles.push(new Particle(this.target.x, this.target.y, '#4a148c', 0.5, 5));
                    }
                }
            } else {
                // 跟随主人
                const distToOwner = this.dist(this.owner);
                if (distToOwner > 80) {
                    const angle = Math.atan2(this.owner.y - this.y, this.owner.x - this.x);
                    this.x += Math.cos(angle) * this.speed * 1.5 * dt;
                    this.y += Math.sin(angle) * this.speed * 1.5 * dt;
                }
            }

            if (this.attackTimer > 0) this.attackTimer -= dt;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // 幽灵浮动效果
            const floatY = Math.sin(window.Game.playTime * 5) * 5;
            ctx.translate(0, floatY);

            // 绘制幽灵
            ctx.globalAlpha = 0.7;
            
            // 身体
            ctx.fillStyle = '#4a148c';
            ctx.beginPath();
            ctx.arc(0, 0, 10, Math.PI, 0); // 上半圆
            ctx.lineTo(10, 15);
            ctx.lineTo(5, 10);
            ctx.lineTo(0, 15);
            ctx.lineTo(-5, 10);
            ctx.lineTo(-10, 15);
            ctx.closePath();
            ctx.fill();

            // 眼睛
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.arc(-4, -2, 2, 0, Math.PI * 2);
            ctx.arc(4, -2, 2, 0, Math.PI * 2);
            ctx.fill();

            // 光环
            ctx.strokeStyle = '#7c43bd';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 15 + Math.sin(window.Game.playTime * 10) * 2, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }
    }

    class Lightning extends Entity {
        constructor(x1, y1, x2, y2) {
            this.path = [];
            this.life = 0.2; 
            this.maxLife = 0.2;
            this.generate(x1, y1, x2, y2);
            this.dead = false;
        }
        generate(x1, y1, x2, y2) {
            const d = Math.hypot(x2-x1, y2-y1);
            const steps = Math.max(3, Math.floor(d / 20)); 
            this.path.push({x:x1, y:y1});
            const nx = -(y2-y1)/d;
            const ny = (x2-x1)/d;
            for(let i=1; i<steps; i++) {
                const t = i/steps;
                const jitter = (Math.random()-0.5) * 40; 
                this.path.push({
                    x: x1 + (x2-x1)*t + nx*jitter,
                    y: y1 + (y2-y1)*t + ny*jitter
                });
            }
            this.path.push({x:x2, y:y2});
        }
        update(dt) {
            this.life -= dt;
            if(this.life <= 0) this.dead = true;
        }
        draw(ctx) {
            if(this.dead) return;
            const alpha = this.life / this.maxLife;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = '#bf55ec'; ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(this.path[0].x, this.path[0].y);
            for(let i=1; i<this.path.length; i++) {
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`; ctx.lineWidth = 3; ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgba(224, 176, 255, ${alpha})`; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.restore();
        }
    }

    class Particle {
        constructor(x,y,c,l,s, g=0) { 
            this.x=x; this.y=y; this.c=c; this.life=l; this.maxL=l; this.size=s; this.g=g;
            const ang = Math.random()*Math.PI*2; const spd = Math.random()*100;
            this.vx=Math.cos(ang)*spd; this.vy=Math.sin(ang)*spd; 
        }
        update(dt) { 
            this.life-=dt; if(this.life<=0) this.dead=true; 
            this.vy += this.g * dt;
            this.x+=this.vx*dt; this.y+=this.vy*dt; 
        }
        draw(ctx) { ctx.globalAlpha=this.life/this.maxL; ctx.fillStyle=this.c; ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
    }

    class Orb extends Entity {
        constructor(x,y,v) { super(x,y); this.val=v; }
        update(dt,p) {
            const d=this.dist(p);
            
            // Magnetism (Drift)
            if(d < 200) {
                const a=Math.atan2(p.y-this.y, p.x-this.x);
                this.x+=Math.cos(a)*150*dt; 
                this.y+=Math.sin(a)*150*dt;
            }

            // Pickup (Snap)
            if(d<p.stats.area) {
                const s=400+(500/(d+1)); const a=Math.atan2(p.y-this.y, p.x-this.x);
                this.x+=Math.cos(a)*s*dt; this.y+=Math.sin(a)*s*dt;
                if(d<20) { this.dead=true; p.gainExp(this.val); }
            }
        }
        draw(ctx) { ctx.save(); ctx.translate(this.x,this.y); const s=1+Math.sin(window.Game.playTime*10)*0.3; ctx.scale(s,s); ctx.fillStyle='#2ecc71'; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill(); ctx.restore(); }
    }

    class Chest extends Entity {
        constructor(x, y) { super(x, y); }
        update(dt, p) {
            if (this.dist(p) < 50) { 
                this.dead = true;
                window.Game.openChest(this.x, this.y);
            }
        }
        draw(ctx) {
            ctx.save(); ctx.translate(this.x, this.y);
            const s = 1 + Math.sin(window.Game.playTime * 5) * 0.1;
            ctx.scale(s, s);
            ctx.drawImage(Assets['chest'], -24, -24, 48, 48);
            ctx.globalCompositeOperation = 'lighter';
            ctx.shadowColor='#f1c40f'; ctx.shadowBlur=20;
            ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(window.Game.playTime*10)*0.2})`;
            ctx.beginPath(); ctx.arc(0,0,35,0,Math.PI*2); ctx.fill();
            ctx.restore();
        }
    }

    class FloatText extends Entity {
        constructor(x,y,t,c, crit=false) { 
            super(x,y); this.txt=t; this.c=c; this.life=0.8; this.crit=crit;
            this.vy = -100; 
            this.scale = 0.5;
            if(crit) { this.vy = -200; this.life = 1.2; }
        }
        update(dt) { 
            this.y += this.vy * dt; 
            this.vy += 500 * dt; // Gravity
            this.life-=dt; if(this.life<=0) this.dead=true; 
            
            if (this.life > 0.6) this.scale += dt * 5; // Pop up
            else this.scale -= dt; // Shrink
        }
        draw(ctx) { 
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.scale, this.scale);
            ctx.globalAlpha=Math.min(1, this.life*2); 
            ctx.fillStyle=this.c; 
            ctx.font= this.crit ? "bold 40px Arial" : "bold 24px Arial"; 
            if(this.crit) {
                ctx.shadowColor = this.c;
                ctx.shadowBlur = 10;
            }
            ctx.strokeStyle='black';
            ctx.lineWidth=2;
            ctx.strokeText(this.txt, 0, 0);
            ctx.fillText(this.txt, 0, 0); 
            ctx.restore();
        }
    }

    class Footprint extends Entity {
        constructor(x, y, angle) {
            super(x, y);
            this.rotation = angle;
            this.life = 3.0;
            this.maxLife = 3.0;
        }
        update(dt) { this.life -= dt; if(this.life<=0) this.dead=true; }
        draw(ctx) {
            const alpha = this.life / this.maxLife;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
    }

    class StaticObject extends Entity {
        constructor(x, y, type) {
            super(x, y);
            this.type = type;
            this.img = type;
        }
        update(dt, p) {
            // Static visual only
        }
        draw(ctx) {
            const img = Assets[this.img];
            if (img) {
                ctx.save();
                ctx.translate(this.x, this.y);
                // Simple shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath(); ctx.ellipse(0, img.height/2 - 5, img.width/3, img.height/8, 0, 0, Math.PI*2); ctx.fill();
                ctx.drawImage(img, -img.width/2, -img.height/2);
                ctx.restore();
            }
        }
    }

    function generateStagePattern(stageIdx) {
        const stage = STAGES[stageIdx % STAGES.length];
        const size = 512; // Tile size
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base
        ctx.fillStyle = stage.bg;
        ctx.fillRect(0, 0, size, size);

        switch(stageIdx) {
            case 0: // Forest
                drawForest(ctx, size);
                break;
            case 1: // Bone
                drawBone(ctx, size);
                break;
            case 2: // Magma
                drawMagma(ctx, size);
                break;
            case 3: // Ice
                drawIce(ctx, size);
                break;
            case 4: // Battlefield
                drawBattlefield(ctx, size);
                break;
            case 5: // Fairyland
                drawFairyland(ctx, size);
                break;
            default:
                drawForest(ctx, size);
        }

        return canvas;
    }

    function drawFairyland(ctx, size) {
        // Snow Drifts (Texture)
        ctx.fillStyle = 'rgba(189, 195, 199, 0.3)'; 
        for(let i=0; i<30; i++) {
             const x = Math.random() * size;
             const y = Math.random() * size;
             const w = 30 + Math.random() * 50;
             const h = 15 + Math.random() * 20;
             ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, Math.PI*2); ctx.fill();
        }
        // Ice/Crystal details
        ctx.fillStyle = '#a29bfe'; 
        for(let i=0; i<10; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
        }
    }

    function drawBattlefield(ctx, size) {
        // ===== 昏黄沙漠地形层 =====
        
        // 大型沙丘（阴影面）
        ctx.fillStyle = '#3e3626';
        ctx.globalAlpha = 0.4;
        for(let i=0; i<6; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = 80 + Math.random() * 120;
            const h = 30 + Math.random() * 40;
            ctx.beginPath();
            ctx.ellipse(x, y, w, h, Math.random() * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        
        // 沙丘高光（昏黄）
        ctx.fillStyle = '#73654d';
        ctx.globalAlpha = 0.3;
        for(let i=0; i<5; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = 60 + Math.random() * 100;
            const h = 20 + Math.random() * 30;
            ctx.beginPath();
            ctx.ellipse(x, y - 10, w * 0.8, h * 0.5, Math.random() * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        
        // 沙岭/沙脊（弧形高光线）
        ctx.strokeStyle = '#8c7b50';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        for(let i=0; i<12; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = 50 + Math.random() * 80;
            ctx.beginPath();
            ctx.arc(x, y, w, Math.PI * 0.1, Math.PI * 0.9, false);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
        
        // 沙坑（暗色凹陷）
        ctx.fillStyle = '#2e261a';
        ctx.globalAlpha = 0.35;
        for(let i=0; i<8; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 15 + Math.random() * 25;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        
        // 风沙纹理（细密波纹）
        ctx.strokeStyle = '#5d5340';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        for(let i=0; i<25; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = 30 + Math.random() * 50;
            ctx.beginPath();
            ctx.arc(x, y, w, 0, Math.PI, false);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
        
        // 散落的沙砾石子
        ctx.fillStyle = '#4a3d28';
        for(let i=0; i<50; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 1 + Math.random() * 2;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
        }
        
        // ===== 战场遗迹层 =====
        
        // 1. 插入沙中的残剑/兵器 (少量点缀)
        for(let i=0; i<3; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const angle = -Math.PI/2 + (Math.random() - 0.5) * 0.6;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            
            if(Math.random() > 0.4) {
                // 剑
                ctx.fillStyle = '#7f8c8d';
                ctx.beginPath();
                ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(2, -18); ctx.lineTo(-2, -18); ctx.fill();
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.moveTo(-6, -18); ctx.quadraticCurveTo(0, -16, 6, -18); ctx.lineTo(6, -20); ctx.quadraticCurveTo(0, -18, -6, -20); ctx.fill();
                ctx.fillStyle = '#3e2723'; ctx.fillRect(-2, -30, 4, 10);
            } else {
                // 断矛杆
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(-1.5, -35, 3, 35);
                ctx.fillStyle = '#8d6e63';
                ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(-3, -22); ctx.lineTo(3, -22); ctx.fill();
            }
            ctx.restore();
        }
        
        // 2. 散落地面的甲片 (少量)
        for(let i=0; i<2; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.random() * Math.PI * 2);
            ctx.fillStyle = '#455a64';
            ctx.fillRect(-4, -4, 8, 8);
            ctx.fillStyle = '#263238';
            ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
        
        // 3. 散落地面的断兵器（横躺，少量）
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 2;
        for(let i=0; i<2; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const angle = Math.random() * Math.PI * 2;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(8 + Math.random()*6, 0);
            ctx.stroke();
            ctx.restore();
        }
        
        // 破烂行军帐
        ctx.strokeStyle = '#5a4a30';
        ctx.fillStyle = '#7a6a50';
        ctx.lineWidth = 2;
        for(let i=0; i<2; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.save();
            ctx.translate(x, y);
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(-20, 5);
            ctx.lineTo(0, -15);
            ctx.lineTo(20, 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-15, 5);
            ctx.quadraticCurveTo(-5, -5, 5, 3);
            ctx.quadraticCurveTo(10, 8, 18, 6);
            ctx.lineTo(15, 12);
            ctx.quadraticCurveTo(0, 8, -12, 10);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }
        
        // 残破战旗
        for(let i=0; i<4; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const lean = (Math.random() - 0.5) * 0.4;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(lean);
            
            ctx.strokeStyle = '#5a4a30';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.lineTo(0, -35);
            ctx.stroke();
            
            const flagColor = Math.random() > 0.5 ? '#8b2020' : '#2a2a2a';
            ctx.fillStyle = flagColor;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(0, -35);
            ctx.lineTo(18, -30);
            ctx.lineTo(15, -25);
            ctx.lineTo(20, -20);
            ctx.lineTo(12, -18);
            ctx.lineTo(0, -22);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }
        
        // 枯骨残骸
        ctx.fillStyle = '#c0b090';
        ctx.globalAlpha = 0.6;
        for(let i=0; i<6; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.random() * Math.PI * 2);
            ctx.beginPath();
            ctx.ellipse(-8, 0, 4, 2, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillRect(-6, -1, 12, 2);
            ctx.beginPath();
            ctx.ellipse(8, 0, 4, 2, 0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
        ctx.globalAlpha = 1.0;
    }

    function drawForest(ctx, size) {
        // Bushes
        ctx.fillStyle = '#121a15'; // Slightly lighter/darker than BG
        for(let i=0; i<20; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 20 + Math.random() * 30;
            ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
        }
        // Grass tufts
        ctx.strokeStyle = '#2e8b57'; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
        for(let i=0; i<50; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.beginPath(); 
            ctx.moveTo(x,y); ctx.lineTo(x-5, y-10);
            ctx.moveTo(x,y); ctx.lineTo(x+5, y-10);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    }

    function drawBone(ctx, size) {
        // Cracks
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
        for(let i=0; i<8; i++) {
            let x = Math.random() * size;
            let y = Math.random() * size;
            ctx.beginPath(); ctx.moveTo(x,y);
            for(let j=0; j<4; j++) {
                x += (Math.random()-0.5)*80;
                y += (Math.random()-0.5)*80;
                ctx.lineTo(x,y);
            }
            ctx.stroke();
        }
        // Bones/Rocks
        ctx.fillStyle = '#444'; ctx.globalAlpha = 1.0;
        for(let i=0; i<15; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.save(); ctx.translate(x,y); ctx.rotate(Math.random()*Math.PI);
            if (Math.random() > 0.5) {
                // Bone
                ctx.fillStyle = '#666';
                ctx.fillRect(-12, -2, 24, 4);
                ctx.beginPath(); ctx.arc(-12, 0, 3, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(12, 0, 3, 0, Math.PI*2); ctx.fill();
            } else {
                // Rock
                ctx.fillStyle = '#333';
                ctx.beginPath(); ctx.arc(0, 0, 5 + Math.random()*8, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        }
    }

    function drawMagma(ctx, size) {
        // Lava rivers
        ctx.strokeStyle = '#b71c1c'; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.globalAlpha = 0.5;
        for(let i=0; i<4; i++) {
            let x = Math.random() * size;
            let y = Math.random() * size;
            ctx.beginPath(); ctx.moveTo(x,y);
            for(let j=0; j<3; j++) {
                x += (Math.random()-0.5)*150;
                y += (Math.random()-0.5)*150;
                ctx.lineTo(x,y);
            }
            ctx.stroke();
        }
        // Hot spots
        ctx.fillStyle = '#ff5722'; ctx.globalAlpha = 0.3;
        for(let i=0; i<10; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.beginPath(); ctx.arc(x,y, 10 + Math.random()*20, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    function drawIce(ctx, size) {
        // Ice sheets
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for(let i=0; i<8; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.beginPath(); ctx.moveTo(x,y);
            ctx.lineTo(x+60, y+20); ctx.lineTo(x+30, y+80); ctx.fill();
        }
        // Crystals
        ctx.fillStyle = '#81d4fa';
        for(let i=0; i<20; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4);
            ctx.fillRect(-4, -4, 8, 8);
            ctx.restore();
        }
    }

    // ========== 血色秘境地图 ==========
    function generateBloodArenaPattern() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // 基底 - 暗红色
        ctx.fillStyle = '#1a0808';
        ctx.fillRect(0, 0, size, size);

        drawBloodArena(ctx, size);

        return canvas;
    }

    function drawBloodArena(ctx, size) {
        // ===== 血色地表层 =====
        
        // 暗红色岩石地面
        ctx.fillStyle = '#2a0a0a';
        ctx.globalAlpha = 0.6;
        for(let i=0; i<15; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = 60 + Math.random() * 100;
            const h = 40 + Math.random() * 60;
            ctx.beginPath();
            ctx.ellipse(x, y, w, h, Math.random() * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // 血色纹路/裂痕
        ctx.strokeStyle = '#5c1010';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5;
        for(let i=0; i<12; i++) {
            let x = Math.random() * size;
            let y = Math.random() * size;
            ctx.beginPath();
            ctx.moveTo(x, y);
            for(let j=0; j<4; j++) {
                x += (Math.random() - 0.5) * 100;
                y += (Math.random() - 0.5) * 100;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        // 血池（发光效果）
        for(let i=0; i<6; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 20 + Math.random() * 40;
            
            // 光晕
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5);
            gradient.addColorStop(0, 'rgba(139, 0, 0, 0.4)');
            gradient.addColorStop(0.5, 'rgba(139, 0, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // 血池本体
            ctx.fillStyle = '#5c0000';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // 血色岩石块
        ctx.fillStyle = '#3d1515';
        for(let i=0; i<20; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 8 + Math.random() * 15;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            for(let j=0; j<6; j++) {
                const angle = (j / 6) * Math.PI * 2;
                const rr = r * (0.7 + Math.random() * 0.3);
                ctx.lineTo(x + Math.cos(angle) * rr, y + Math.sin(angle) * rr);
            }
            ctx.closePath();
            ctx.fill();
        }

        // ===== 装饰层 =====
        
        // 枯骨散落
        ctx.fillStyle = '#8b7355';
        ctx.globalAlpha = 0.5;
        for(let i=0; i<10; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.random() * Math.PI * 2);
            // 骨头
            ctx.fillRect(-10, -2, 20, 4);
            ctx.beginPath();
            ctx.arc(-10, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(10, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.globalAlpha = 1.0;

        // 血色植物/藤蔓
        ctx.strokeStyle = '#4a1010';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        for(let i=0; i<8; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.beginPath();
            ctx.moveTo(x, y);
            let cx = x, cy = y;
            for(let j=0; j<5; j++) {
                cx += (Math.random() - 0.5) * 30;
                cy -= 10 + Math.random() * 15;
                ctx.lineTo(cx, cy);
            }
            ctx.stroke();
            // 叶子/刺
            ctx.fillStyle = '#6b1a1a';
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // 血雾粒子
        ctx.fillStyle = '#8b0000';
        ctx.globalAlpha = 0.15;
        for(let i=0; i<30; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 15 + Math.random() * 30;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // 诡异符文（地面刻痕）
        ctx.strokeStyle = '#5c1515';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        for(let i=0; i<3; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 30 + Math.random() * 40;
            // 圆形
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
            // 内部线条
            ctx.beginPath();
            ctx.moveTo(x - r, y);
            ctx.lineTo(x + r, y);
            ctx.moveTo(x, y - r);
            ctx.lineTo(x, y + r);
            ctx.stroke();
            // 小圆
            ctx.beginPath();
            ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        // 小石子
        ctx.fillStyle = '#2d1010';
        for(let i=0; i<40; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 1 + Math.random() * 3;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 金币不需要导入 ASSETS，由调用方传入

    class Coin {
        constructor(x, y, value = 1) {
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

    // ========== 性能优化模块 ==========

    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || ('ontouchstart' in window && window.innerWidth <= 1024);

    // 性能配置
    const PerfConfig = {
        // 移动端配置
        mobile: {
            maxParticles: 80,        // 最大粒子数
            maxBullets: 150,         // 最大子弹数
            maxTexts: 15,            // 最大飘字数
            targetFPS: 60,           // 目标帧率（不再限制）
            particleLife: 0.4},
        // PC端配置
        desktop: {
            maxParticles: 200,
            maxBullets: 500,
            maxTexts: 30,
            targetFPS: 60,
            particleLife: 0.5}
    };

    // 当前配置
    const Config = isMobile ? PerfConfig.mobile : PerfConfig.desktop;

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
    new ObjectPool(
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
    new ObjectPool(
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

    // ========== 性能监控 ==========
    class PerformanceMonitor {
        constructor() {
            this.fps = 60;
            this.frameCount = 0;
            this.lastCheck = performance.now();
            this.frameTimes = []; // 用于计算实时帧率
            this.metrics = {
                particles: 0,
                bullets: 0,
                enemies: 0,
                drawCalls: 0
            };
        }
        
        tick() {
            const now = performance.now();
            this.frameCount++;
            
            // 记录最近的帧时间（保留最近30帧）
            this.frameTimes.push(now);
            if (this.frameTimes.length > 30) {
                this.frameTimes.shift();
            }
            
            // 实时计算帧率（基于最近帧的平均间隔）
            if (this.frameTimes.length >= 2) {
                const oldest = this.frameTimes[0];
                const newest = this.frameTimes[this.frameTimes.length - 1];
                const elapsed = newest - oldest;
                if (elapsed > 0) {
                    this.fps = Math.round((this.frameTimes.length - 1) / elapsed * 1000);
                }
            }
            
            // 每秒重置计数器（用于其他统计）
            if (now - this.lastCheck >= 1000) {
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

    // ========== 工具函数 ==========

    // 限制数组长度（用于粒子、子弹等）
    function limitArray(arr, max) {
        if (arr.length > max) {
            arr.splice(0, arr.length - max);
        }
    }

    // 全局性能监控实例
    const perfMonitor = new PerformanceMonitor();

    console.log(`[Performance] 运行模式: ${isMobile ? '移动端' : 'PC端'}, 目标帧率: ${Config.targetFPS}fps`);

    // ========== 辅助实体类 ==========

    // 荆棘陷阱实体
    class ThornTrap extends Entity {
        constructor(x, y, duration, damage) {
            super(x, y);
            this.duration = duration;
            this.damage = damage;
            this.tickTimer = 0;
            this.tickInterval = 0.5; // 每0.5秒伤害一次
            this.radius = 80;
        }
        
        update(dt) {
            this.duration -= dt;
            if (this.duration <= 0) {
                this.dead = true;
                return;
            }
            
            this.tickTimer -= dt;
            if (this.tickTimer <= 0) {
                this.tickTimer = this.tickInterval;
                // 对范围内敌人造成伤害
                for (const e of window.Game.enemies) {
                    if (e.dead) continue;
                    const dist = Math.hypot(e.x - this.x, e.y - this.y);
                    if (dist < this.radius) {
                        e.hp -= this.damage;
                        // 荆棘粒子
                        window.Game.particles.push(new Particle(e.x, e.y, '#2ecc71', 0.3, 4));
                        window.Game.texts.push(new FloatText(e.x, e.y - 20, Math.floor(this.damage), '#2ecc71'));
                        if (e.hp <= 0 && !e.dead) {
                            if (window.Game.onEnemyKilled) {
                                window.Game.onEnemyKilled(e);
                            } else {
                                e.dead = true;
                            }
                        }
                    }
                }
            }
        }
        
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // 荆棘圈
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.3 + Math.sin(window.Game.playTime * 5) * 0.2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 荆棘图案
            ctx.fillStyle = '#2ecc71';
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + window.Game.playTime;
                const r = this.radius * 0.6;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 10, y - 15);
                ctx.lineTo(x + 5, y);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    // 定时炸弹实体
    class TimeBomb extends Entity {
        constructor(x, y, delay, damage) {
            super(x, y);
            this.delay = delay;
            this.damage = damage;
            this.radius = 120;
        }
        
        update(dt) {
            this.delay -= dt;
            
            if (this.delay <= 0) {
                // 爆炸！
                this.explode();
                this.dead = true;
            }
        }
        
        explode() {
            // 对范围内敌人造成伤害
            for (const e of window.Game.enemies) {
                if (e.dead) continue;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < this.radius) {
                    e.hp -= this.damage;
                    window.Game.texts.push(new FloatText(e.x, e.y - 20, Math.floor(this.damage), '#ff5722'));
                    if (e.hp <= 0 && !e.dead) {
                        if (window.Game.onEnemyKilled) {
                            window.Game.onEnemyKilled(e);
                        } else {
                            e.dead = true;
                        }
                    }
                }
            }
            
            // 爆炸粒子
            for (let i = 0; i < 30; i++) {
                const p = new Particle(this.x, this.y, '#ff5722', 0.6, 8);
                p.vx = (Math.random() - 0.5) * 400;
                p.vy = (Math.random() - 0.5) * 400;
                window.Game.particles.push(p);
            }
            
            // 震屏
            window.Game.screenShake(2);
        }
        
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // 闪烁效果（越接近爆炸越快）
            const flash = Math.sin(window.Game.playTime * (10 / Math.max(0.1, this.delay))) > 0;
            
            // 炸弹主体
            ctx.fillStyle = flash ? '#ff5722' : '#c0392b';
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // 倒计时数字
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.ceil(this.delay), 0, 0);
            
            // 危险范围指示
            ctx.strokeStyle = 'rgba(255, 87, 34, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.restore();
        }
    }

    // 分身诱饵实体
    class Decoy extends Entity {
        constructor(x, y, duration, playerSvg) {
            super(x, y);
            this.duration = duration;
            this.playerSvg = playerSvg;
            this.tauntRadius = 200;
        }
        
        update(dt) {
            this.duration -= dt;
            if (this.duration <= 0) {
                this.dead = true;
                // 消失粒子
                for (let i = 0; i < 10; i++) {
                    window.Game.particles.push(new Particle(this.x, this.y, '#9b59b6', 0.5, 5));
                }
                return;
            }
            
            // 吸引范围内敌人
            for (const e of window.Game.enemies) {
                if (e.dead) continue;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < this.tauntRadius && dist > 30) {
                    // 敌人被吸引向分身
                    const angle = Math.atan2(this.y - e.y, this.x - e.x);
                    e.x += Math.cos(angle) * e.speed * 0.5 * dt;
                    e.y += Math.sin(angle) * e.speed * 0.5 * dt;
                }
            }
        }
        
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // 半透明闪烁效果
            ctx.globalAlpha = 0.5 + Math.sin(window.Game.playTime * 8) * 0.3;
            
            // 紫色光环
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();
            
            // 绘制玩家形象（如果有）
            if (window.Assets && window.Assets[this.playerSvg]) {
                ctx.drawImage(window.Assets[this.playerSvg], -32, -32, 64, 64);
            } else {
                // 后备绘制
                ctx.fillStyle = '#9b59b6';
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 嘲讽范围指示
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            ctx.arc(0, 0, this.tauntRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }

    // ========== 道具卡管理器 ==========

    class ItemCardManager {
        constructor(engine) {
            this.engine = engine;
            this.slots = [null, null, null, null, null, null]; // 6个槽位
            this.maxSlots = 6;
            
            // 特殊实体列表（陷阱、炸弹、分身等）
            this.specialEntities = [];
        }
        
        reset() {
            this.slots = [null, null, null, null, null, null];
            this.specialEntities = [];
            this.updateUI();
        }
        
        update(dt) {
            // 更新特殊实体
            this.specialEntities.forEach(e => e.update(dt));
            this.specialEntities = this.specialEntities.filter(e => !e.dead);
        }
        
        draw(ctx) {
            // 绘制特殊实体
            this.specialEntities.forEach(e => e.draw(ctx));
        }
        
        addCard(cardData) {
            // 检查是否已有相同卡片
            for (let i = 0; i < this.maxSlots; i++) {
                if (this.slots[i] && this.slots[i].id === cardData.id) {
                    // 叠加（最多5张）
                    if (this.slots[i].count < 5) {
                        this.slots[i].count++;
                        this.updateUI();
                        return true;
                    }
                }
            }
            
            // 找空槽位
            for (let i = 0; i < this.maxSlots; i++) {
                if (!this.slots[i]) {
                    this.slots[i] = {
                        ...cardData,
                        count: 1
                    };
                    this.updateUI();
                    return true;
                }
            }
            
            // 槽位满了，显示提示
            this.engine.texts.push(new FloatText(
                this.engine.player.x,
                this.engine.player.y - 50,
                '道具槽已满！',
                '#ff5252'
            ));
            return false;
        }
        
        useCard(slotIndex) {
            if (slotIndex < 0 || slotIndex >= this.maxSlots) return;
            
            const card = this.slots[slotIndex];
            if (!card) return;
            
            // 执行效果
            this.executeCardEffect(card);
            
            // 消耗
            card.count--;
            if (card.count <= 0) {
                this.slots[slotIndex] = null;
                // 自动左移：将右边的道具往左补位
                this.compactSlots();
            }
            
            this.updateUI();
        }
        
        // 自动左移道具槽
        compactSlots() {
            // 将所有非空槽位紧凑排列到左边
            const items = this.slots.filter(s => s !== null);
            this.slots = items.concat(Array(this.maxSlots - items.length).fill(null));
        }
        
        executeCardEffect(card) {
            const engine = this.engine;
            const player = engine.player;
            
            // 显示使用提示
            engine.texts.push(new FloatText(
                player.x,
                player.y - 60,
                `${card.icon} ${card.name}`,
                '#f1c40f'
            ));
            
            switch (card.effect) {
                // ========== 攻击类 ==========
                case 'thunder_strike':
                    this.effectThunderStrike(card.value);
                    break;
                    
                case 'screen_damage':
                    this.effectScreenDamage(card.value);
                    break;
                
                // ========== 控制类 ==========
                case 'freeze_all':
                    this.effectFreezeAll(card.value);
                    break;
                    
                case 'stun_random':
                    this.effectStunRandom(card.value);
                    break;
                    
                case 'chaos':
                    this.effectChaos(card.value);
                    break;
                
                // ========== 陷阱类 ==========
                case 'thorn_trap':
                    this.effectThornTrap(card.value);
                    break;
                    
                case 'time_bomb':
                    this.effectTimeBomb(card.value);
                    break;
                
                // ========== 位移类 ==========
                case 'teleport':
                    this.effectTeleport();
                    break;
                    
                case 'decoy':
                    this.effectDecoy(card.value);
                    break;
                
                // ========== 增益类 ==========
                case 'speed_boost':
                    this.effectSpeedBoost(card.value);
                    break;
                    
                case 'invincible':
                    this.effectInvincible(card.value);
                    break;
                    
                case 'damage_boost':
                    this.effectDamageBoost(card.value);
                    break;
                
                // ========== 回复类 ==========
                case 'heal':
                    this.effectHeal(card.value);
                    break;
                    
                case 'exp_boost':
                    this.effectExpBoost(card.value);
                    break;
                
                // ========== 特殊类 ==========
                case 'absorb_enemy':
                    this.effectAbsorbEnemy(card.value);
                    break;
                    
                default:
                    console.warn('未知道具效果:', card.effect);
            }
            
            // 震屏
            engine.shake = Math.max(engine.shake, 0.5);
        }
        
        // ========== 攻击类效果 ==========
        
        // 雷劫珠 - 天雷连轰3次
        effectThunderStrike(damage) {
            const engine = this.engine;
            const player = engine.player;
            
            // 连续3次雷击
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    // 随机选择目标区域
                    const targetX = player.x + (Math.random() - 0.5) * 300;
                    const targetY = player.y + (Math.random() - 0.5) * 300;
                    
                    // 对范围内敌人造成伤害
                    engine.enemies.forEach(e => {
                        if (e.dead) return;
                        const dist = Math.hypot(e.x - targetX, e.y - targetY);
                        if (dist < 100) {
                            e.hp -= damage;
                            engine.texts.push(new FloatText(e.x, e.y - 30, Math.floor(damage), '#ffeb3b'));
                            if (e.hp <= 0 && !e.dead) {
                                if (engine.onEnemyKilled) {
                                    engine.onEnemyKilled(e);
                                } else {
                                    e.dead = true;
                                }
                            }
                        }
                    });
                    
                    // 雷电粒子
                    for (let j = 0; j < 20; j++) {
                        const p = new Particle(targetX, targetY, '#ffeb3b', 0.4, 6);
                        p.vx = (Math.random() - 0.5) * 300;
                        p.vy = (Math.random() - 0.5) * 300;
                        engine.particles.push(p);
                    }
                    
                    // 震屏
                    engine.screenShake(1);
                    
                }, i * 300); // 每0.3秒一次
            }
            
            this.createFullscreenEffect('#ffeb3b', 0.3);
        }
        
        // 翻天印 - 全屏伤害
        effectScreenDamage(damage) {
            const engine = this.engine;
            
            // 对所有敌人造成伤害
            engine.enemies.forEach(e => {
                if (e.dead) return;
                e.hp -= damage;
                
                // 火焰粒子
                for (let i = 0; i < 10; i++) {
                    engine.particles.push(new Particle(
                        e.x + (Math.random() - 0.5) * 40,
                        e.y + (Math.random() - 0.5) * 40,
                        '#ff5722',
                        0.5,
                        6
                    ));
                }
                
                // 伤害数字
                engine.texts.push(new FloatText(e.x, e.y - 30, Math.floor(damage), '#ff5722'));
                
                if (e.hp <= 0 && !e.dead) {
                    if (engine.onEnemyKilled) {
                        engine.onEnemyKilled(e);
                    } else {
                        e.dead = true;
                    }
                }
            });
            
            // 全屏火焰效果
            this.createFullscreenEffect('#ff5722', 0.3);
            engine.screenShake(2);
        }
        
        // ========== 控制类效果 ==========
        
        // 冰魄珠 - 全场冻结
        effectFreezeAll(duration) {
            const engine = this.engine;
            
            // 冻结所有敌人
            engine.enemies.forEach(e => {
                if (e.dead) return;
                e.frozen = true;
                e.frozenTime = duration;
                e.originalSpeed = e.speed;
                e.speed = 0;
                
                // 冰晶粒子
                for (let i = 0; i < 8; i++) {
                    engine.particles.push(new Particle(
                        e.x + (Math.random() - 0.5) * 30,
                        e.y + (Math.random() - 0.5) * 30,
                        '#81d4fa',
                        0.5,
                        4
                    ));
                }
            });
            
            // 定时解冻
            setTimeout(() => {
                engine.enemies.forEach(e => {
                    if (e.frozen) {
                        e.frozen = false;
                        e.speed = e.originalSpeed || 50;
                    }
                });
            }, duration * 1000);
            
            this.createFullscreenEffect('#81d4fa', 0.3);
        }
        
        // 定身符 - 随机定住5个敌人
        effectStunRandom(count) {
            const engine = this.engine;
            const duration = 10; // 10秒
            
            // 随机选择敌人
            const targets = engine.enemies
                .filter(e => !e.dead && !e.frozen)
                .sort(() => Math.random() - 0.5)
                .slice(0, count);
            
            targets.forEach(e => {
                e.frozen = true;
                e.frozenTime = duration;
                e.originalSpeed = e.speed;
                e.speed = 0;
                
                // 定身符文
                engine.texts.push(new FloatText(e.x, e.y - 40, '定!', '#f1c40f', true));
                
                // 金色粒子
                for (let i = 0; i < 10; i++) {
                    engine.particles.push(new Particle(
                        e.x + (Math.random() - 0.5) * 30,
                        e.y + (Math.random() - 0.5) * 30,
                        '#f1c40f',
                        0.6,
                        5
                    ));
                }
            });
            
            // 定时解除
            setTimeout(() => {
                targets.forEach(e => {
                    if (e.frozen) {
                        e.frozen = false;
                        e.speed = e.originalSpeed || 50;
                    }
                });
            }, duration * 1000);
        }
        
        // 混沌铃 - 敌人互攻
        effectChaos(duration) {
            const engine = this.engine;
            
            // 标记所有敌人进入混乱状态
            engine.enemies.forEach(e => {
                if (e.dead) return;
                e.chaosTime = duration;
                
                // 混乱粒子
                for (let i = 0; i < 5; i++) {
                    engine.particles.push(new Particle(
                        e.x + (Math.random() - 0.5) * 20,
                        e.y - 30,
                        '#9b59b6',
                        0.5,
                        3
                    ));
                }
            });
            
            engine.texts.push(new FloatText(
                engine.player.x,
                engine.player.y - 80,
                '🔔 混乱！',
                '#9b59b6',
                true
            ));
            
            // 混乱期间敌人互相伤害
            const chaosInterval = setInterval(() => {
                let hasChaos = false;
                engine.enemies.forEach(e => {
                    if (e.dead || !e.chaosTime || e.chaosTime <= 0) return;
                    hasChaos = true;
                    
                    // 找最近的其他敌人
                    let nearest = null;
                    let minDist = 100;
                    engine.enemies.forEach(other => {
                        if (other === e || other.dead) return;
                        const dist = Math.hypot(e.x - other.x, e.y - other.y);
                        if (dist < minDist) {
                            minDist = dist;
                            nearest = other;
                        }
                    });
                    
                    // 攻击最近的敌人
                    if (nearest) {
                        nearest.hp -= e.dmg * 0.5;
                        engine.particles.push(new Particle(nearest.x, nearest.y, '#9b59b6', 0.3, 3));
                        
                        if (nearest.hp <= 0 && !nearest.dead) {
                            if (engine.onEnemyKilled) {
                                engine.onEnemyKilled(nearest);
                            } else {
                                nearest.dead = true;
                            }
                        }
                    }
                });
                
                if (!hasChaos) {
                    clearInterval(chaosInterval);
                }
            }, 500);
            
            // 定时清除混乱
            setTimeout(() => {
                clearInterval(chaosInterval);
                engine.enemies.forEach(e => {
                    e.chaosTime = 0;
                });
            }, duration * 1000);
            
            this.createFullscreenEffect('#9b59b6', 0.2);
        }
        
        // ========== 陷阱类效果 ==========
        
        // 荆棘种 - 地面荆棘
        effectThornTrap(duration) {
            const engine = this.engine;
            const player = engine.player;
            
            // 在玩家位置创建荆棘陷阱
            const trap = new ThornTrap(player.x, player.y, duration, player.stats.dmg * 0.5);
            this.specialEntities.push(trap);
            
            // 生成粒子
            for (let i = 0; i < 15; i++) {
                engine.particles.push(new Particle(
                    player.x + (Math.random() - 0.5) * 100,
                    player.y + (Math.random() - 0.5) * 100,
                    '#2ecc71',
                    0.5,
                    4
                ));
            }
        }
        
        // 爆炎石 - 定时炸弹
        effectTimeBomb(damage) {
            const engine = this.engine;
            const player = engine.player;
            
            // 在玩家位置放置炸弹
            const bomb = new TimeBomb(player.x, player.y, 3, damage);
            this.specialEntities.push(bomb);
            
            engine.texts.push(new FloatText(
                player.x,
                player.y - 40,
                '💣 3秒后爆炸!',
                '#ff5722'
            ));
        }
        
        // ========== 位移类效果 ==========
        
        // 缩地符 - 瞬移逃命
        effectTeleport() {
            const engine = this.engine;
            const player = engine.player;
            
            // 找一个安全位置
            let bestX = player.x;
            let bestY = player.y;
            let bestSafety = 0;
            
            // 尝试多个随机位置，选最安全的
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 200 + Math.random() * 200;
                const testX = player.x + Math.cos(angle) * dist;
                const testY = player.y + Math.sin(angle) * dist;
                
                // 检查是否在场地内
                if (Math.hypot(testX, testY) > 500) continue;
                
                // 计算安全度（离最近敌人的距离）
                let minEnemyDist = Infinity;
                engine.enemies.forEach(e => {
                    if (e.dead) return;
                    const d = Math.hypot(e.x - testX, e.y - testY);
                    minEnemyDist = Math.min(minEnemyDist, d);
                });
                
                if (minEnemyDist > bestSafety) {
                    bestSafety = minEnemyDist;
                    bestX = testX;
                    bestY = testY;
                }
            }
            
            // 原位置粒子
            for (let i = 0; i < 15; i++) {
                engine.particles.push(new Particle(
                    player.x + (Math.random() - 0.5) * 40,
                    player.y + (Math.random() - 0.5) * 40,
                    '#3498db',
                    0.5,
                    5
                ));
            }
            
            // 瞬移
            player.x = bestX;
            player.y = bestY;
            
            // 新位置粒子
            for (let i = 0; i < 15; i++) {
                engine.particles.push(new Particle(
                    player.x + (Math.random() - 0.5) * 40,
                    player.y + (Math.random() - 0.5) * 40,
                    '#3498db',
                    0.5,
                    5
                ));
            }
            
            // 短暂无敌
            player.invulnTimer = 0.5;
        }
        
        // 分身符 - 分身吸引仇恨
        effectDecoy(duration) {
            const engine = this.engine;
            const player = engine.player;
            
            // 在玩家旁边创建分身
            const offsetX = (Math.random() - 0.5) * 100;
            const offsetY = (Math.random() - 0.5) * 100;
            const decoy = new Decoy(
                player.x + offsetX,
                player.y + offsetY,
                duration,
                player.role.svg
            );
            this.specialEntities.push(decoy);
            
            // 生成粒子
            for (let i = 0; i < 10; i++) {
                engine.particles.push(new Particle(
                    decoy.x + (Math.random() - 0.5) * 30,
                    decoy.y + (Math.random() - 0.5) * 30,
                    '#9b59b6',
                    0.5,
                    4
                ));
            }
        }
        
        // ========== 增益类效果 ==========
        
        // 疾风符 - 移速翻倍
        effectSpeedBoost(duration) {
            const engine = this.engine;
            const player = engine.player;
            
            const originalSpeed = player.speed;
            player.speed *= 2;
            
            engine.texts.push(new FloatText(
                player.x,
                player.y - 80,
                `💨 移速x2 ${duration}秒`,
                '#3498db'
            ));
            
            // 速度粒子
            const particleInterval = setInterval(() => {
                if (engine.player) {
                    engine.particles.push(new Particle(
                        player.x + (Math.random() - 0.5) * 20,
                        player.y + 20,
                        '#3498db',
                        0.3,
                        3
                    ));
                }
            }, 100);
            
            setTimeout(() => {
                player.speed = originalSpeed;
                clearInterval(particleInterval);
                engine.texts.push(new FloatText(
                    player.x,
                    player.y - 80,
                    '速度恢复',
                    '#aaa'
                ));
            }, duration * 1000);
        }
        
        // 金身符 - 无敌
        effectInvincible(duration) {
            const engine = this.engine;
            const player = engine.player;
            
            player.invincible = true;
            
            // 金光粒子
            const particleInterval = setInterval(() => {
                if (engine.player) {
                    for (let i = 0; i < 3; i++) {
                        engine.particles.push(new Particle(
                            player.x + (Math.random() - 0.5) * 40,
                            player.y + (Math.random() - 0.5) * 40,
                            '#f1c40f',
                            0.3,
                            4
                        ));
                    }
                }
            }, 100);
            
            engine.texts.push(new FloatText(
                player.x,
                player.y - 80,
                `🛡️ 无敌 ${duration}秒`,
                '#f1c40f'
            ));
            
            setTimeout(() => {
                player.invincible = false;
                clearInterval(particleInterval);
                engine.texts.push(new FloatText(
                    player.x,
                    player.y - 80,
                    '无敌结束',
                    '#aaa'
                ));
            }, duration * 1000);
        }
        
        // 狂暴丹 - 攻击翻倍
        effectDamageBoost(duration) {
            const engine = this.engine;
            const player = engine.player;
            
            const originalDmg = player.stats.dmg;
            player.stats.dmg *= 2;
            
            engine.texts.push(new FloatText(
                player.x,
                player.y - 80,
                `💊 攻击x2 ${duration}秒`,
                '#e74c3c'
            ));
            
            // 红色光环
            const particleInterval = setInterval(() => {
                if (engine.player) {
                    const angle = Math.random() * Math.PI * 2;
                    engine.particles.push(new Particle(
                        player.x + Math.cos(angle) * 30,
                        player.y + Math.sin(angle) * 30,
                        '#e74c3c',
                        0.3,
                        3
                    ));
                }
            }, 150);
            
            setTimeout(() => {
                player.stats.dmg = originalDmg;
                clearInterval(particleInterval);
                engine.texts.push(new FloatText(
                    player.x,
                    player.y - 80,
                    '狂暴结束',
                    '#aaa'
                ));
            }, duration * 1000);
        }
        
        // ========== 回复类效果 ==========
        
        // 回气丹 - 回复血量
        effectHeal(percent) {
            const engine = this.engine;
            const player = engine.player;
            
            const healAmount = player.maxHp * percent;
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            
            // 治疗粒子
            for (let i = 0; i < 20; i++) {
                engine.particles.push(new Particle(
                    player.x + (Math.random() - 0.5) * 50,
                    player.y + (Math.random() - 0.5) * 50,
                    '#2ecc71',
                    0.5,
                    5
                ));
            }
            
            engine.texts.push(new FloatText(
                player.x,
                player.y - 50,
                `+${Math.floor(healAmount)} HP`,
                '#2ecc71'
            ));
        }
        
        // 聚灵阵 - 经验翻倍
        effectExpBoost(duration) {
            const engine = this.engine;
            const player = engine.player;
            
            // 标记经验翻倍
            player.expBoost = 2;
            
            engine.texts.push(new FloatText(
                player.x,
                player.y - 80,
                `⭐ 经验x2 ${duration}秒`,
                '#9b59b6'
            ));
            
            // 星星粒子
            const particleInterval = setInterval(() => {
                if (engine.player) {
                    engine.particles.push(new Particle(
                        player.x + (Math.random() - 0.5) * 60,
                        player.y - 30 - Math.random() * 30,
                        '#9b59b6',
                        0.4,
                        4
                    ));
                }
            }, 200);
            
            setTimeout(() => {
                player.expBoost = 1;
                clearInterval(particleInterval);
                engine.texts.push(new FloatText(
                    player.x,
                    player.y - 80,
                    '经验加成结束',
                    '#aaa'
                ));
            }, duration * 1000);
        }
        
        // ========== 特殊类效果 ==========
        
        // 乾坤袋 - 吸走怪物
        effectAbsorbEnemy(count) {
            const engine = this.engine;
            const player = engine.player;
            
            // 选择最近的非BOSS敌人
            const targets = engine.enemies
                .filter(e => !e.dead && !e.isBoss)
                .sort((a, b) => {
                    const distA = Math.hypot(a.x - player.x, a.y - player.y);
                    const distB = Math.hypot(b.x - player.x, b.y - player.y);
                    return distA - distB;
                })
                .slice(0, count);
            
            targets.forEach((e, i) => {
                // 延迟吸收动画
                setTimeout(() => {
                    if (e.dead) return;
                    
                    // 吸收动画
                    const startX = e.x;
                    const startY = e.y;
                    let progress = 0;
                    
                    const animInterval = setInterval(() => {
                        progress += 0.1;
                        if (progress >= 1) {
                            clearInterval(animInterval);
                            // 击杀敌人
                            if (engine.onEnemyKilled) {
                                engine.onEnemyKilled(e);
                            } else {
                                e.dead = true;
                            }
                            return;
                        }
                        
                        // 向玩家移动
                        e.x = startX + (player.x - startX) * progress;
                        e.y = startY + (player.y - startY) * progress;
                        
                        // 缩小
                        e.scale = (e.scale || 1) * 0.9;
                        
                        // 吸收粒子
                        engine.particles.push(new Particle(e.x, e.y, '#8e44ad', 0.3, 3));
                    }, 50);
                    
                }, i * 100);
            });
            
            engine.texts.push(new FloatText(
                player.x,
                player.y - 80,
                `👝 吸收 ${targets.length} 只妖兽`,
                '#8e44ad',
                true
            ));
            
            this.createFullscreenEffect('#8e44ad', 0.2);
        }
        
        // ========== 辅助方法 ==========
        
        createFullscreenEffect(color, alpha) {
            // 创建全屏闪烁效果
            const overlay = document.createElement('div');
            overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${color};
            opacity: ${alpha};
            pointer-events: none;
            z-index: 999;
            animation: flashOut 0.5s ease-out forwards;
        `;
            
            const style = document.createElement('style');
            style.textContent = `
            @keyframes flashOut {
                0% { opacity: ${alpha}; }
                100% { opacity: 0; }
            }
        `;
            
            document.head.appendChild(style);
            document.body.appendChild(overlay);
            
            setTimeout(() => {
                overlay.remove();
                style.remove();
            }, 500);
        }
        
        updateUI() {
            // 检查是否存在 DOM 环境
            if (typeof document === 'undefined' || !document.querySelector) {
                // Canvas 环境：UI 由 game-ui.js 绘制，这里不需要操作
                return;
            }
            
            for (let i = 0; i < this.maxSlots; i++) {
                const slotEl = document.querySelector(`.item-slot[data-slot="${i}"]`);
                if (!slotEl) continue;
                
                const contentEl = slotEl.querySelector('.slot-content');
                const card = this.slots[i];
                
                if (card) {
                    contentEl.innerHTML = `
                    ${card.icon}
                    ${card.count > 1 ? `<span class="item-count">×${card.count}</span>` : ''}
                `;
                    slotEl.classList.add('has-item');
                    slotEl.title = `${card.name}: ${card.desc}`;
                } else {
                    contentEl.innerHTML = '';
                    slotEl.classList.remove('has-item');
                    slotEl.title = '';
                }
            }
        }
        
        // 检查触摸点击是否在道具卡槽上（供 Canvas UI 使用）
        handleTouch(x, y, width, height) {
            const slotSize = 40;
            const spacing = 5;
            const startX = width - (slotSize + spacing) * 6 - 10;
            const startY = height - slotSize - 80;
            
            for (let i = 0; i < 6; i++) {
                const slotX = startX + (slotSize + spacing) * i;
                const slotY = startY;
                
                if (x >= slotX && x <= slotX + slotSize &&
                    y >= slotY && y <= slotY + slotSize) {
                    // 点击了槽位 i
                    this.useCard(i);
                    return true;
                }
            }
            
            return false;
        }
    }

    class WeatherSystem {
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
                case 0: // Forest - Spores & Fireflies
                    type = 'spore';
                    color = Math.random() > 0.7 ? '#cddc39' : '#4caf50'; // Lime or Green
                    size = 2 + Math.random() * 4;
                    vx = (Math.random() - 0.5) * 15; 
                    vy = -5 - Math.random() * 15; // Slowly float up
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

    // ========== 统一游戏引擎 ==========
    // 跨平台版本，无 DOM 依赖，支持 Web + 小游戏
    // 支持：关卡模式 (STAGES) + 秘境模式 (ARENA)


    // ========== 游戏模式常量 ==========
    const GAME_MODES = {
        STAGE: 'stage',     // 关卡模式：计时生存，6个地图
        ARENA: 'arena'      // 秘境模式：波次挑战
    };

    // ========== 关卡视觉样式 ==========
    const STAGE_STYLES = [
        { // 0: 幽暗密林
            skyTop: '#000500', skyBot: '#0f1519',
            groundBase: '#0b1013', groundSurf: '#1b5e20',
            patternColor: '#000',
            decoType: 'tree'
        },
        { // 1: 埋骨之地
            skyTop: '#1a1a1a', skyBot: '#2c3e50',
            groundBase: '#212121', groundSurf: '#424242',
            patternColor: '#000',
            decoType: 'cross'
        },
        { // 2: 熔岩炼狱
            skyTop: '#210000', skyBot: '#3e2723',
            groundBase: '#210000', groundSurf: '#3e2723',
            patternColor: '#ff5722',
            decoType: 'spike'
        },
        { // 3: 极寒冰原
            skyTop: '#0d47a1', skyBot: '#1976d2',
            groundBase: '#0d47a1', groundSurf: '#64b5f6',
            patternColor: '#e1f5fe',
            decoType: 'crystal'
        },
        { // 4: 塞外古战场
            skyTop: '#2d2318', skyBot: '#5c4a2a',
            groundBase: '#3e3626', groundSurf: '#5d5340',
            patternColor: '#2e261a',
            decoType: 'spike'
        },
        { // 5: 昆仑仙境
            skyTop: '#000000', skyBot: '#2c3e50',
            groundBase: '#37474f', groundSurf: '#ecf0f1',
            patternColor: null,
            decoType: 'pavilion'
        }
    ];

    // 血色秘境专属敌人类
    class ArenaEnemy extends Enemy {
        constructor(type, x, y, levelMult, playerLevel) {
            const mobData = ARENA_MOBS[type] || ARENA_BOSSES[type];
            const baseHp = mobData?.hp || 50;
            const baseDmg = mobData?.dmg || 10;
            const level = Math.max(1, Math.floor(playerLevel * levelMult));
            
            super(type, x, y, level);
            
            this.hp = baseHp * (1 + level * 0.2);
            this.maxHp = this.hp;
            this.dmg = baseDmg * (1 + level * 0.1);
            this.goldDrop = mobData?.goldDrop || [1, 2];
            this.isBoss = !!ARENA_BOSSES[type];
            this.bossSize = mobData?.size || 1.0;
            this.name = mobData?.name || type;
            
            if (this.isBoss) {
                this.hp *= 10;
                this.maxHp = this.hp;
                this.dmg *= 2;
            }
        }
        
        takeDamage(v, kx, ky, type, knockback) {
            if (this.dead) return;
            
            // 确保伤害值有效
            const dmg = v || 0;
            if (isNaN(dmg) || dmg <= 0) return;
            
            this.hp -= dmg;
            this.x += (kx || 0) * 10 * (knockback || 1);
            this.y += (ky || 0) * 10 * (knockback || 1);
            
            window.Game.texts.push(new FloatText(this.x, this.y - 30, Math.floor(dmg), '#ff5252'));
            
            for (let i = 0; i < 5; i++) {
                window.Game.particles.push(new Particle(this.x, this.y, '#ff5252', 0.3, 4));
            }
            
            if (this.hp <= 0 && !this.dead) {
                window.Game.onEnemyKilled(this);
            }
        }
        
        draw(ctx, assets) {
            if (this.dead) return;
            
            ctx.save();
            ctx.translate(this.x, this.y);
            
            const scale = this.isBoss ? this.bossSize : 1.0;
            ctx.scale(scale, scale);
            
            // 阴影
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(0, 20, 20, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            const shouldFlip = window.Game.player && window.Game.player.x < this.x;
            if (shouldFlip) ctx.scale(-1, 1);
            
            // 绘制怪物
            this.drawFallbackMob(ctx);
            
            ctx.restore();
            
            // 名字
            ctx.save();
            ctx.translate(this.x, this.y);
            const mobData = ARENA_MOBS[this.type] || ARENA_BOSSES[this.type];
            ctx.fillStyle = this.isBoss ? '#ffcc00' : '#fff';
            ctx.font = this.isBoss ? 'bold 14px Arial' : '11px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 3;
            ctx.fillText(mobData?.name || this.type, 0, -30 * scale);
            ctx.restore();
            
            this.drawHpBar(ctx);
        }
        
        drawFallbackMob(ctx) {
            const time = Date.now() / 1000;
            const bounce = Math.sin(time * 5 + this.x) * 2;
            
            // 简化的怪物绘制
            ctx.fillStyle = this.isBoss ? '#c0392b' : '#8b0000';
            ctx.beginPath();
            ctx.arc(0, bounce, this.isBoss ? 25 : 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(-5, -3 + bounce, 3, 0, Math.PI * 2);
            ctx.arc(5, -3 + bounce, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        drawHpBar(ctx) {
            const scale = this.isBoss ? this.bossSize : 1.0;
            if (!this.isBoss && this.hp < this.maxHp) {
                ctx.save();
                ctx.translate(this.x, this.y - 35 * scale);
                const barWidth = 40;
                const barHeight = 5;
                const hpRatio = this.hp / this.maxHp;
                
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(-barWidth/2 - 1, -1, barWidth + 2, barHeight + 2);
                
                ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
                ctx.fillRect(-barWidth/2, 0, barWidth * hpRatio, barHeight);
                
                ctx.restore();
            }
        }
    }

    // 全局升级菜单函数（供 entities.js 中的 Player.levelUp 调用）
    window.showUpgradeMenu = function() {
        if (window.Game && window.Game.showLevelUpMenu) {
            window.Game.showLevelUpMenu();
        }
    };

    // ========== 统一游戏引擎 ==========
    class UnifiedArenaEngine {
        constructor(canvas, width, height) {
            window.Game = this;
            
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.width = width;
            this.height = height;
            this.state = 'MENU';
            this.lastTime = 0;
            this.playTime = 0;
            this.gameZoom = 1;  // 支持移动端双指缩放
            
            // 游戏模式
            this.gameMode = GAME_MODES.ARENA; // 默认秘境模式
            
            // ========== 关卡模式专属 ==========
            this.stageIdx = 0;
            this.eliteTimer = 0;
            this.staticObjects = [];
            this.edgeDecorations = [];
            this.weather = new WeatherSystem();
            this.orbs = [];      // 经验球
            this.chests = [];    // 宝箱
            this.footprints = [];
            
            // ========== 秘境模式专属 ==========
            this.currentWave = 0;
            this.waveEnemies = [];
            this.waveCleared = false;
            this.bossCountdown = 0;
            this.showingBossIntro = false;
            this.bossTextShown = false;
            this.currentBoss = null;
            
            // Boss 战斗系统
            this.bossSkillTimer = 0;
            this.orbSpawnTimer = 0;
            this.powerOrbs = [];
            this.pendingAOEs = [];
            
            // 道具卡系统
            this.itemCards = new ItemCardManager(this);
            
            // 波次标题和飞行金币
            this.waveTitle = null;
            this.waveTitleTimer = 0;
            this.flyingCoins = [];
            
            // ========== 通用属性 ==========
            // 统计
            this.totalKills = 0;
            this.totalGold = 0;
            this.score = 0;
            
            // 实体
            this.player = null;
            this.artifact = null;
            this.enemies = [];
            this.bullets = [];
            this.minions = [];
            this.particles = [];
            this.texts = [];
            this.coins = [];
            
            // 技能选择
            this.pendingSkillChoice = false;
            this.availableSkills = [];
            
            // 摇杆输入
            this.touch = { active: false, dx: 0, dy: 0 };
            this.keys = {};
            
            // 相机
            this.camera = { x: 0, y: 0 };
            this.bgPattern = null;
            this.shake = 0;
            
            // 冻结效果
            this.freezeTimer = 0;
            this.hitStopCooldown = 0;
            
            // UI 引用
            this.ui = null;
            
            // 资源
            this.assets = {};
            this.loadAssets();
            
            // 绑定键盘事件（仅 Web）
            if (Platform.isWeb) {
                window.addEventListener('keydown', e => this.keys[e.code] = true);
                window.addEventListener('keyup', e => this.keys[e.code] = false);
            }
        }
        
        // 游戏主循环
        loop(now) {
            // 帧率监控
            perfMonitor.tick();
            
            let dt = Math.min((now - this.lastTime) / 1000, 0.1);
            this.lastTime = now;
            
            // MENU 状态：不绘制游戏内容（DOM 菜单显示中）
            if (this.state === 'MENU') {
                // 只是等待开始
                requestAnimationFrame(t => this.loop(t));
                return;
            }
            
            // 冻结效果（顿帧）
            if (this.freezeTimer > 0) {
                this.freezeTimer -= dt;
                dt = 0;
            }
            
            // 顿帧冷却
            if (this.hitStopCooldown > 0) {
                this.hitStopCooldown -= dt;
            }
            
            // 更新游戏状态
            if (this.state === 'PLAY' && !this.showingBossIntro) {
                this.update(dt);
            }
            
            // 更新性能监控数据
            perfMonitor.metrics.particles = this.particles.length;
            perfMonitor.metrics.bullets = this.bullets.length;
            perfMonitor.metrics.enemies = this.enemies.length;
            
            // 绘制
            this.draw();
            
            // 绘制 Canvas UI（如果有的话）
            if (this.ui) {
                this.ui.update(dt);
                this.ui.draw();
            }
            
            // 继续循环
            requestAnimationFrame(t => this.loop(t));
        }
        
        // 设置 UI 引用
        setUI(ui) {
            this.ui = ui;
        }
        
        // 设置摇杆输入
        setJoystickInput(dx, dy, active) {
            this.touch.dx = dx;
            this.touch.dy = dy;
            this.touch.active = active;
        }
        
        // 震屏效果
        screenShake(intensity = 1) {
            this.shake = Math.max(this.shake, intensity);
        }
        
        // 显示升级菜单（供全局 showUpgradeMenu 调用）
        showLevelUpMenu() {
            // 暂停游戏
            this.state = 'LEVELUP';
            
            // 随机选择3个升级选项
            const upgrades = [
                { name: '攻击强化', desc: '伤害+20%', icon: '⚔️', effect: { dmgMult: 1.2 } },
                { name: '生命强化', desc: '血量+30%', icon: '❤️', effect: { hpMult: 1.3 } },
                { name: '速度强化', desc: '移速+15%', icon: '👟', effect: { speedMult: 1.15 } },
                { name: '攻速强化', desc: '攻击间隔-15%', icon: '⚡', effect: { cdMult: 0.85 } },
                { name: '穿透强化', desc: '穿透+1', icon: '🎯', effect: { pierce: 1 } },
                { name: '范围强化', desc: '攻击范围+20%', icon: '🔮', effect: { areaMult: 1.2 } }
            ];
            
            const shuffled = [...upgrades].sort(() => Math.random() - 0.5);
            const choices = shuffled.slice(0, 3);
            
            if (this.ui) {
                this.ui.showLevelUpMenu(choices, (upgrade) => {
                    this.applyUpgrade(upgrade);
                    this.state = 'PLAY';
                });
            } else {
                // 无 UI 时自动选择第一个
                this.applyUpgrade(choices[0]);
                this.state = 'PLAY';
            }
        }
        
        // 应用升级效果
        applyUpgrade(upgrade) {
            if (!this.player || !upgrade || !upgrade.effect) return;
            
            const e = upgrade.effect;
            if (e.dmgMult) this.player.stats.dmg *= e.dmgMult;
            if (e.hpMult) {
                this.player.maxHp *= e.hpMult;
                this.player.hp = this.player.maxHp;
            }
            if (e.speedMult) this.player.speed *= e.speedMult;
            if (e.cdMult) this.player.stats.cd *= e.cdMult;
            if (e.pierce) this.player.stats.pierce += e.pierce;
            if (e.areaMult) this.player.stats.area *= e.areaMult;
            
            this.texts.push(new FloatText(this.player.x, this.player.y - 50, `✨ ${upgrade.name}`, '#f1c40f'));
        }
        
        // 加载资源
        loadAssets() {
            // 使用 assets.js 的 loadAssets 函数
            loadAssets().then(() => {
                Platform.log('资源加载完成');
            }).catch(err => {
                Platform.error('资源加载失败:', err);
            });
            
            // 同时填充本地 assets 引用
            this.assets = Assets;
        }
        
        // 调整大小
        resize(width, height) {
            this.width = width;
            this.height = height;
        }
        
        // 开始游戏 - 支持两种模式
        // mode: 'arena' (秘境模式) 或 'stage' (关卡模式)
        // stageIdx: 关卡模式的起始关卡
        start(roleId = 'sword', mode = GAME_MODES.ARENA, stageIdx = 0) {
            this.gameMode = mode;
            
            this.player = new Player(roleId);
            this.player.x = 0;
            this.player.y = 0;
            
            // 随机法宝
            const randArtifact = ARTIFACTS[Math.floor(Math.random() * ARTIFACTS.length)];
            this.artifact = new Artifact(randArtifact.id);
            
            // 重置通用状态
            this.enemies = [];
            this.bullets = [];
            this.particles = [];
            this.texts = [];
            this.coins = [];
            this.minions = [];
            this.totalKills = 0;
            this.totalGold = 0;
            this.score = 0;
            this.playTime = 0;
            this.pendingSkillChoice = false;
            this.waveTitle = null;
            this.waveTitleTimer = 0;
            this.flyingCoins = [];
            
            if (mode === GAME_MODES.ARENA) {
                // ========== 秘境模式初始化 ==========
                this.powerOrbs = [];
                this.pendingAOEs = [];
                this.currentWave = 0;
                this.waveCleared = true;
                this.showingBossIntro = false;
                this.bossTextShown = false;
                this.bossCountdown = 0;
                this.bossSkillTimer = 0;
                this.orbSpawnTimer = 0;
                this.currentBoss = null;
                
                // 重置道具卡
                this.itemCards.reset();
                
                // 生成血色秘境背景
                this.bgPattern = this.ctx.createPattern(generateBloodArenaPattern(), 'repeat');
                
                this.state = 'PLAY';
                this.updateUI();
                
                // 显示法宝信息
                const artifactName = this.artifact?.data?.name || '神秘法宝';
                this.texts.push(new FloatText(0, -100, `🔮 ${artifactName}`, '#9b59b6'));
                
                // 延迟开始第一波
                setTimeout(() => this.startNextWave(), 2500);
                
            } else {
                // ========== 关卡模式初始化 ==========
                this.stageIdx = stageIdx;
                this.eliteTimer = 0;
                this.staticObjects = [];
                this.edgeDecorations = [];
                this.orbs = [];
                this.chests = [];
                this.footprints = [];
                
                // 关卡模式有初始时间
                this.playTime = STAGES[stageIdx]?.time || 0;
                
                // 如果不是第一关，给予额外属性
                if (stageIdx > 0) {
                    this.player.lvl = stageIdx * 3 + 1;
                    this.player.stats.dmg += stageIdx * 15;
                    this.player.hp = 100 + stageIdx * 20;
                    this.player.maxHp = 100 + stageIdx * 20;
                }
                
                // 初始化地图
                this.initStageMap();
                
                // 生成关卡背景
                this.bgPattern = this.ctx.createPattern(generateStagePattern(this.stageIdx), 'repeat');
                
                this.state = 'PLAY';
                this.updateUI();
                
                // 显示关卡标题
                const stageName = STAGES[this.stageIdx]?.name || '未知之地';
                this.showWaveTitle(stageName, '探索开始');
                
                // 显示法宝信息
                const artifactName = this.artifact?.data?.name || '神秘法宝';
                this.texts.push(new FloatText(0, -100, `🔮 ${artifactName}`, '#9b59b6'));
            }
        }
        
        // ========== 关卡模式：地图初始化 ==========
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
        
        // 幽暗密林
        initForest() {
            for(let i = 0; i < 40; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = 450 + Math.random() * 150;
                this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, 'tree_forest'));
            }
            for(let i = 0; i < 30; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * 500;
                this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, Math.random() > 0.5 ? 'bush' : 'stone_s'));
            }
        }
        
        // 埋骨之地
        initBone() {
            for(let i = 0; i < 25; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = 480 + Math.random() * 120;
                const rand = Math.random();
                let type = 'stele_c';
                if(rand > 0.8) type = 'dead_tree';
                else if(rand > 0.6) type = 'spirit_banner';
                this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, type));
            }
            for(let i = 0; i < 35; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * 500;
                const x = Math.cos(a) * r;
                const y = Math.sin(a) * r;
                
                if(Math.random() < 0.3) {
                    this.staticObjects.push(new StaticObject(x, y, 'grave_mound'));
                    this.staticObjects.push(new StaticObject(x, y + 15, 'stele_c'));
                    if(Math.random() < 0.4) this.staticObjects.push(new StaticObject(x + 40, y + 10, 'spirit_banner'));
                } else {
                    let type = Math.random() < 0.4 ? 'stele_c' : (Math.random() < 0.7 ? 'grave_mound' : 'dead_tree');
                    this.staticObjects.push(new StaticObject(x, y, type));
                }
            }
        }
        
        // 熔岩炼狱
        initMagma() {
            for(let i = 0; i < 30; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = 500 + Math.random() * 100;
                this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, 'magma_rock_deco'));
            }
            for(let i = 0; i < 20; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * 500;
                this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, Math.random() > 0.5 ? 'magma_rock_deco' : 'stone_s'));
            }
        }
        
        // 极寒冰原
        initIce() {
            for(let i = 0; i < 40; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = 450 + Math.random() * 150;
                this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, 'crystal_deco'));
            }
            for(let i = 0; i < 20; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * 500;
                this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, Math.random() > 0.6 ? 'crystal_deco' : 'stone_s'));
            }
        }
        
        // 塞外古战场
        initBattlefield() {
            const wreckTypes = ['broken_sword', 'broken_blade', 'broken_spear', 'shield_round'];
            for(let i = 0; i < 10; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = 100 + Math.random() * 400;
                const type = wreckTypes[Math.floor(Math.random() * wreckTypes.length)];
                const obj = new StaticObject(Math.cos(a) * r, Math.sin(a) * r, type);
                obj.rotation = Math.random() * Math.PI * 2;
                this.staticObjects.push(obj);
            }
            
            if(Math.random() < 0.6) {
                const a = Math.random() * Math.PI * 2;
                const r = 200 + Math.random() * 250;
                const obj = new StaticObject(Math.cos(a) * r, Math.sin(a) * r, 'chariot_wreck');
                obj.rotation = Math.random() * Math.PI * 2;
                this.staticObjects.push(obj);
            }
            
            for(let i = 0; i < 30; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = 450 + Math.random() * 150;
                this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, 'stone_s'));
            }
        }
        
        // 昆仑仙境
        initFairyland() {
            this.staticObjects.push(new StaticObject(0, -100, 'pavilion'));
            this.staticObjects.push(new StaticObject(0, 250, 'gate'));
            for(let i = 0; i < 20; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = 150 + Math.random() * 350;
                this.staticObjects.push(new StaticObject(Math.cos(a) * r, Math.sin(a) * r, Math.random() > 0.6 ? 'pine' : 'stone_s'));
            }
        }
        
        // 初始化边缘装饰
        initEdgeDecorations() {
            this.edgeDecorations = [];
            const R = 600;
            const count = this.stageIdx === 0 ? 90 : 60;
            
            for(let i = 0; i < count; i++) {
                const angleBase = (i / count) * Math.PI * 2;
                const angle = angleBase + (Math.random() - 0.5) * 0.1;
                const r = R - 5 + Math.random() * 15;
                const size = 15 + Math.random() * 20;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                
                let type = 'rock';
                let color = '#555';
                
                switch(this.stageIdx) {
                    case 0: // 幽暗密林 - 灌木 + 藤蔓
                        type = 'bush';
                        color = Math.random() > 0.5 ? '#2e7d32' : '#1b5e20';
                        // 添加悬挂藤蔓
                        if(Math.random() < 0.6) { 
                            this.edgeDecorations.push({ 
                                x, y, 
                                size: size, 
                                rotation: angle, 
                                type: 'vine', 
                                color: Math.random() > 0.5 ? '#2e7d32' : '#388e3c',
                                length: 60 + Math.random() * 100,
                                width: 2 + Math.random() * 2,
                                twistFreq: 0.02 + Math.random() * 0.04,
                                twistAmp: 5 + Math.random() * 10,
                                swayOffset: Math.random() * Math.PI * 2
                            });
                        }
                        break;
                        
                    case 1: // 埋骨之地 - 岩石
                        type = 'rock';
                        color = '#424242';
                        break;
                        
                    case 2: // 熔岩炼狱 - 尖石 + 岩浆瀑布
                        if (Math.random() < 0.2) {
                            type = 'lava_fall';
                            color = '#ff5722';
                            this.edgeDecorations.push({ 
                                x, y, 
                                rotation: angle, 
                                type: 'lava_fall', 
                                width: 20 + Math.random() * 30,
                                length: 100 + Math.random() * 200,
                                speed: 50 + Math.random() * 100,
                                color: '#ff5722'
                            });
                            continue;
                        }
                        type = 'sharp';
                        color = '#3e2723';
                        break;
                        
                    case 3: // 极寒冰原 - 冰晶
                        type = 'ice';
                        color = 'rgba(225, 245, 254, 0.8)';
                        break;
                        
                    case 4: // 塞外古战场 - 沙丘
                        type = 'sand';
                        color = '#5c4a2a';
                        break;
                        
                    case 5: // 昆仑仙境 - 云朵
                        type = 'cloud';
                        color = '#cfd8dc';
                        break;
                }
                
                this.edgeDecorations.push({ x, y, size, rotation: Math.random() * Math.PI, type, color });
            }
        }
        
        // 关卡模式：生成普通敌人
        spawnEnemy(diff) {
            const a = Math.random() * Math.PI * 2;
            const r = 580;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            
            const colors = ['#1b5e20', '#7f8c8d', '#ff5722', '#4fc3f7', '#2c3e50'];
            for(let i = 0; i < 5; i++) {
                this.particles.push(new Particle(x, y, colors[this.stageIdx] || '#000', 0.5, 4));
            }
            
            const stage = STAGES[this.stageIdx];
            let type = 'rock';
            if (stage && stage.mobs && stage.mobs.length > 0) {
                type = stage.mobs[Math.floor(Math.random() * stage.mobs.length)];
            }
            
            this.enemies.push(new Enemy(type, x, y, diff));
        }
        
        // 关卡模式：生成精英怪
        spawnElite(diff) {
            const a = Math.random() * Math.PI * 2;
            const r = 550;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            
            const stage = STAGES[this.stageIdx];
            const type = stage.mobs[Math.floor(Math.random() * stage.mobs.length)];
            
            this.enemies.push(new Enemy(type, x, y, diff, true)); // isElite = true
            this.showWaveTitle('强敌出现!', '');
            this.screenShake(1.0);
        }
        
        // 关卡模式：打开宝箱
        openChest(x, y) {
            const r = Math.random();
            if(r < 0.3) {
                this.player.hp = this.player.maxHp;
                this.texts.push(new FloatText(x, y, '气血全满!', '#2ecc71'));
            } else if (r < 0.6) {
                this.enemies.forEach(e => { if(!e.isElite) e.takeDamage(9999, 0, 0, 'sword'); });
                this.screenShake(2.0);
                this.texts.push(new FloatText(x, y, '万剑归一!', '#e74c3c'));
            } else {
                this.player.gainExp(this.player.maxExp - this.player.exp);
                this.texts.push(new FloatText(x, y, '顿悟飞升!', '#f1c40f'));
            }
        }
        
        // 更新
        update(dt) {
            if (this.state !== 'PLAY') return;
            
            this.playTime += dt;
            
            // 震屏衰减
            if (this.shake > 0) {
                this.shake = Math.max(0, this.shake - dt * 5);
            }
            
            // 【重要】先重建空间哈希，再更新玩家（确保技能能找到目标）
            collisionManager.rebuild(this.enemies, this.bullets, this.orbs);
            
            // 更新玩家
            if (this.player && !this.player.dead) {
                this.player.update(dt);
                
                // 相机跟随
                this.camera.x = this.player.x - this.width / 2;
                this.camera.y = this.player.y - this.height / 2;
            }
            
            // 更新敌人
            this.enemies = this.enemies.filter(e => {
                if (e.dead) return false;
                e.update(dt, this.player);
                return true;
            });
            
            // 更新子弹
            this.bullets = this.bullets.filter(b => {
                if (b.dead) return false;
                b.update(dt);
                
                // 子弹-敌人碰撞
                for (const enemy of this.enemies) {
                    if (enemy.dead) continue;
                    const dx = b.x - enemy.x;
                    const dy = b.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const hitRadius = enemy.isBoss ? 40 : 25;
                    
                    if (dist < hitRadius) {
                        // 确保伤害值有效
                        const dmgValue = b.dmg || 10;
                        if (!isNaN(dmgValue) && dmgValue > 0) {
                            enemy.takeDamage(dmgValue, dx / dist, dy / dist, b.type, b.knockback || 1.0);
                        }
                        b.pierce--;
                        if (b.pierce <= 0) b.dead = true;
                    }
                }
                
                return !b.dead;
            });
            
            // 更新金币
            this.coins = this.coins.filter(c => {
                if (c.dead) return false;
                c.update(dt, this.player);
                
                // 金币拾取
                if (this.player) {
                    const dx = c.x - this.player.x;
                    const dy = c.y - this.player.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 30) {
                        this.totalGold += c.value;
                        c.dead = true;
                        this.updateUI();
                    }
                }
                
                return !c.dead;
            });
            
            // 更新粒子
            this.particles = this.particles.filter(p => {
                p.update(dt);
                return p.life > 0;
            });
            
            // 更新文字
            this.texts = this.texts.filter(t => {
                t.update(dt);
                return t.life > 0;
            });
            
            // 玩家-敌人碰撞（持续接触伤害，绕过无敌帧）
            if (this.player && !this.player.dead && !this.player.invincible) {
                for (const enemy of this.enemies) {
                    if (enemy.dead) continue;
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const hitRadius = enemy.isBoss ? 50 : 30;
                    
                    if (dist < hitRadius) {
                        // 每帧伤害（约 60fps，所以 * 0.016）
                        let damage = (enemy.dmg || 10) * 0.016;
                        
                        // 玄武盾减伤效果
                        if (this.player.damageReduction) {
                            damage *= (1 - this.player.damageReduction);
                        }
                        
                        this.player.hp -= damage;
                        this.player.hp = Math.max(0, this.player.hp);
                        
                        // 玄武盾反弹效果（每秒触发一次）
                        if (this.player.damageReflect) {
                            if (!enemy.lastReflectTime) enemy.lastReflectTime = 0;
                            if (this.playTime - enemy.lastReflectTime > 1.0) {
                                enemy.lastReflectTime = this.playTime;
                                const reflectDamage = (enemy.dmg || 10) * this.player.damageReflect;
                                enemy.hp -= reflectDamage;
                                this.texts.push(new FloatText(enemy.x, enemy.y, "-" + Math.floor(reflectDamage), '#3498db'));
                                if (enemy.hp <= 0 && !enemy.dead) {
                                    this.onEnemyKilled(enemy);
                                }
                            }
                        }
                        
                        this.updateUI();
                        
                        if (this.player.hp <= 0) {
                            this.player.dead = true;
                            this.gameOver(false);
                        }
                    }
                }
            }
            
            // 更新法宝
            if (this.artifact) {
                this.artifact.update(dt, this.player, this);
            }
            
            // 更新召唤物
            this.minions = this.minions.filter(m => {
                if (m.dead) return false;
                m.update(dt);
                return true;
            });
            
            // ========== 模式特定更新 ==========
            if (this.gameMode === GAME_MODES.ARENA) {
                // 秘境模式更新
                this.checkWaveComplete();
                this.itemCards.update(dt);
                this.updateBossBattle(dt);
                this.updatePowerOrbs(dt);
            } else {
                // 关卡模式更新
                this.updateStageMode(dt);
            }
            
            // 更新波次标题
            if (this.waveTitle && this.waveTitleTimer > 0) {
                this.waveTitleTimer -= dt;
                if (this.waveTitleTimer <= 0) {
                    this.waveTitle = null;
                }
            }
            
            // 更新飞行金币
            this.flyingCoins = this.flyingCoins.filter(fc => {
                fc.t += dt * 3;
                if (fc.t >= 1) return false;
                fc.x = fc.startX + (fc.endX - fc.startX) * this.easeOutQuad(fc.t);
                fc.y = fc.startY + (fc.endY - fc.startY) * this.easeOutQuad(fc.t) - Math.sin(fc.t * Math.PI) * 50;
                return true;
            });
            
            // 性能优化：限制实体数量
            limitArray(this.particles, Config.maxParticles);
            limitArray(this.bullets, Config.maxBullets);
            limitArray(this.texts, Config.maxTexts);
            limitArray(this.footprints, 50);
        }
        
        // ========== 关卡模式更新 ==========
        updateStageMode(dt) {
            this.eliteTimer += dt;
            
            // 检查关卡切换
            const nextStage = STAGES[this.stageIdx + 1];
            if (nextStage && this.playTime >= nextStage.time) {
                this.stageIdx++;
                this.showWaveTitle(STAGES[this.stageIdx].name, '新区域');
                this.bgPattern = this.ctx.createPattern(generateStagePattern(this.stageIdx), 'repeat');
                this.initStageMap();
                
                // 回复一些血量
                this.player.hp = Math.min(this.player.hp + 20, this.player.maxHp);
                this.updateUI();
            }
            
            // 生成普通敌人
            const diff = 1 + this.playTime / 60;
            if (Math.random() < dt / (1.5 / diff)) {
                this.spawnEnemy(diff);
            }
            
            // 每45秒生成精英
            if (this.eliteTimer > 45) {
                this.eliteTimer = 0;
                this.spawnElite(diff);
            }
            
            // 更新经验球
            this.orbs = this.orbs.filter(o => {
                o.update(dt, this.player);
                return !o.dead;
            });
            
            // 更新宝箱
            this.chests = this.chests.filter(c => {
                c.update(dt, this.player);
                return !c.dead;
            });
            
            // 更新脚印
            this.footprints = this.footprints.filter(f => {
                f.update(dt);
                return !f.dead;
            });
            
            // 更新天气
            this.weather.update(dt, this.stageIdx, this.camera);
            
            // 玩家死亡检测
            if (this.player && this.player.hp <= 0 && !this.player.dead) {
                this.player.dead = true;
                this.gameOver(false);
            }
        }
        
        // 缓动函数
        easeOutQuad(t) {
            return t * (2 - t);
        }
        
        // Boss 战斗更新
        updateBossBattle(dt) {
            if (!this.currentBoss || this.currentBoss.dead) {
                this.currentBoss = null;
                return;
            }
            
            // Boss 技能计时器
            this.bossSkillTimer += dt;
            
            // 每 5 秒发动一次特殊攻击
            if (this.bossSkillTimer >= 5) {
                this.bossSkillTimer = 0;
                this.bossSpecialAttack();
            }
            
            // Boss 定期生成能量球帮助玩家
            this.orbSpawnTimer += dt;
            if (this.orbSpawnTimer >= 8) {
                this.orbSpawnTimer = 0;
                this.spawnPowerOrb();
            }
        }
        
        // Boss 特殊攻击
        bossSpecialAttack() {
            if (!this.currentBoss) return;
            
            const boss = this.currentBoss;
            const attackType = Math.floor(Math.random() * 3);
            
            // 警告提示
            this.showWaveTitle('⚠️ 危险 ⚠️', '躲避攻击！');
            this.shake = 0.5;
            
            switch(attackType) {
                case 0:
                    this.bossCharge(boss);
                    break;
                case 1:
                    this.bossAOE(boss);
                    break;
                case 2:
                    this.bossSummon(boss);
                    break;
            }
        }
        
        // Boss 冲撞
        bossCharge(boss) {
            if (!this.player) return;
            
            const dx = this.player.x - boss.x;
            const dy = this.player.y - boss.y;
            const dist = Math.hypot(dx, dy) || 1;
            
            const chargeSpeed = 800;
            boss.chargeVx = (dx / dist) * chargeSpeed;
            boss.chargeVy = (dy / dist) * chargeSpeed;
            boss.isCharging = true;
            boss.chargeDuration = 0.5;
            
            for (let i = 0; i < 20; i++) {
                this.particles.push(new Particle(boss.x, boss.y, '#ff0000', 0.5, 8));
            }
        }
        
        // Boss 范围攻击
        bossAOE(boss) {
            if (!this.player) return;
            
            // 在玩家位置创建预警圈
            const aoe = {
                x: this.player.x,
                y: this.player.y,
                radius: 120,
                timer: 1.5,
                damage: boss.dmg * 2
            };
            
            this.pendingAOEs.push(aoe);
            this.texts.push(new FloatText(aoe.x, aoe.y - 50, '⚠️ 危险区域！', '#ff5252'));
        }
        
        // Boss 召唤
        bossSummon(boss) {
            const summonCount = 3 + Math.floor(Math.random() * 3);
            const mobTypes = ['gu_hun', 'xie_ying'];
            
            for (let i = 0; i < summonCount; i++) {
                const angle = (Math.PI * 2 / summonCount) * i;
                const dist = 100 + Math.random() * 50;
                const x = boss.x + Math.cos(angle) * dist;
                const y = boss.y + Math.sin(angle) * dist;
                
                const mobType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
                const enemy = new ArenaEnemy(mobType, x, y, 0.5, this.player.lvl);
                this.enemies.push(enemy);
                
                for (let j = 0; j < 10; j++) {
                    this.particles.push(new Particle(x, y, '#8b0000', 0.5, 6));
                }
            }
            
            this.texts.push(new FloatText(boss.x, boss.y - 50, '召唤!', '#ff5252'));
        }
        
        // 生成能量球
        spawnPowerOrb() {
            if (!this.player) return;
            
            const angle = Math.random() * Math.PI * 2;
            const dist = 150 + Math.random() * 100;
            const x = this.player.x + Math.cos(angle) * dist;
            const y = this.player.y + Math.sin(angle) * dist;
            
            const orbTypes = [
                { type: 'heal', color: '#4caf50', effect: '回复', value: 30 },
                { type: 'damage', color: '#f44336', effect: '攻击提升', value: 1.5, duration: 10 },
                { type: 'speed', color: '#2196f3', effect: '速度提升', value: 1.5, duration: 8 },
                { type: 'skill_reset', color: '#9c27b0', effect: '技能刷新', value: 0 }
            ];
            
            const orbData = orbTypes[Math.floor(Math.random() * orbTypes.length)];
            
            this.powerOrbs.push({
                x, y,
                type: orbData.type,
                color: orbData.color,
                effect: orbData.effect,
                value: orbData.value,
                duration: orbData.duration || 0,
                radius: 20,
                life: 15,
                pulse: 0
            });
            
            this.texts.push(new FloatText(x, y - 30, '💫 能量球!', orbData.color));
        }
        
        // 更新能量球
        updatePowerOrbs(dt) {
            // 更新 AOE 攻击
            for (let i = this.pendingAOEs.length - 1; i >= 0; i--) {
                const aoe = this.pendingAOEs[i];
                aoe.timer -= dt;
                
                if (aoe.timer <= 0) {
                    // AOE 爆炸
                    const dist = Math.hypot(this.player.x - aoe.x, this.player.y - aoe.y);
                    if (dist < aoe.radius && this.player && !this.player.invincible) {
                        this.player.hp -= aoe.damage;
                        this.shake = 1;
                        this.texts.push(new FloatText(this.player.x, this.player.y - 30, Math.floor(aoe.damage), '#ff0000'));
                    }
                    
                    for (let j = 0; j < 30; j++) {
                        this.particles.push(new Particle(aoe.x, aoe.y, '#ff5252', 0.5, 8));
                    }
                    
                    this.pendingAOEs.splice(i, 1);
                }
            }
            
            // 更新 Boss 冲撞
            for (const e of this.enemies) {
                if (e.isCharging && e.chargeDuration > 0) {
                    e.chargeDuration -= dt;
                    e.x += e.chargeVx * dt;
                    e.y += e.chargeVy * dt;
                    
                    if (Math.random() < 0.5) {
                        this.particles.push(new Particle(e.x, e.y, '#ff5252', 0.3, 5));
                    }
                    
                    if (e.chargeDuration <= 0) {
                        e.isCharging = false;
                    }
                }
            }
            
            // 更新能量球
            for (let i = this.powerOrbs.length - 1; i >= 0; i--) {
                const orb = this.powerOrbs[i];
                orb.life -= dt;
                orb.pulse += dt * 5;
                
                if (orb.life <= 0) {
                    this.powerOrbs.splice(i, 1);
                    continue;
                }
                
                // 检测玩家拾取
                if (this.player) {
                    const dist = Math.hypot(this.player.x - orb.x, this.player.y - orb.y);
                    if (dist < orb.radius + 25) {
                        this.collectPowerOrb(orb);
                        this.powerOrbs.splice(i, 1);
                    }
                }
            }
        }
        
        // 拾取能量球
        collectPowerOrb(orb) {
            switch(orb.type) {
                case 'heal':
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + orb.value);
                    this.texts.push(new FloatText(this.player.x, this.player.y - 30, '+' + orb.value + ' HP', '#4caf50'));
                    break;
                case 'damage':
                    this.player.damageBoost = (this.player.damageBoost || 1) * orb.value;
                    setTimeout(() => {
                        if (this.player) {
                            this.player.damageBoost = Math.max(1, (this.player.damageBoost || 1) / orb.value);
                        }
                    }, orb.duration * 1000);
                    this.texts.push(new FloatText(this.player.x, this.player.y - 30, '攻击提升!', '#f44336'));
                    break;
                case 'speed':
                    this.player.speedBoost = (this.player.speedBoost || 1) * orb.value;
                    setTimeout(() => {
                        if (this.player) {
                            this.player.speedBoost = Math.max(1, (this.player.speedBoost || 1) / orb.value);
                        }
                    }, orb.duration * 1000);
                    this.texts.push(new FloatText(this.player.x, this.player.y - 30, '速度提升!', '#2196f3'));
                    break;
                case 'skill_reset':
                    if (this.artifact) {
                        this.artifact.cd = 0;
                        this.texts.push(new FloatText(this.player.x, this.player.y - 30, '法宝CD重置!', '#9c27b0'));
                    }
                    break;
            }
            
            for (let i = 0; i < 15; i++) {
                this.particles.push(new Particle(orb.x, orb.y, orb.color, 0.4, 5));
            }
        }
        
        // 显示波次标题 (Canvas 版)
        showWaveTitle(title, subtitle) {
            this.waveTitle = { title, subtitle };
            this.waveTitleTimer = 2.0;
        }
        
        // 金币飞向计数器 (Canvas 版)
        flyGoldToCounter(fromX, fromY) {
            const screenX = fromX - this.camera.x;
            const screenY = fromY - this.camera.y;
            
            // 目标位置（右上角金币计数器）
            const targetX = this.width - 80;
            const targetY = 50;
            
            this.flyingCoins.push({
                startX: screenX,
                startY: screenY,
                endX: targetX,
                endY: targetY,
                x: screenX,
                y: screenY,
                t: 0
            });
        }
        
        // 绘制
        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);
            
            if (this.gameMode === GAME_MODES.ARENA) {
                this.drawArenaScene(ctx);
            } else {
                this.drawStageScene(ctx);
            }
            
            // 血雾效果（低血量时）
            this.drawBloodMist(ctx);
            
            // 波次标题（屏幕空间）
            this.drawWaveTitle(ctx);
            
            // 飞行金币（屏幕空间）
            this.drawFlyingCoins(ctx);
        }
        
        // 秘境模式场景绘制（俯视图）
        drawArenaScene(ctx) {
            ctx.save();
            
            // 震屏
            if (this.shake > 0) {
                ctx.translate(
                    (Math.random() - 0.5) * this.shake * 10,
                    (Math.random() - 0.5) * this.shake * 10
                );
            }
            
            // 相机
            ctx.translate(-this.camera.x, -this.camera.y);
            
            // 背景
            this.drawArenaBackground(ctx);
            
            // 金币
            this.coins.forEach(c => c.draw(ctx, this.assets));
            
            // 敌人
            this.enemies.forEach(e => e.draw(ctx, this.assets));
            
            // 子弹
            this.drawBullets(ctx);
            
            // 道具卡特殊实体
            this.itemCards.draw(ctx);
            
            // 玩家
            if (this.player) {
                this.player.draw(ctx, this.assets);
            }
            
            // 召唤物
            this.minions.forEach(m => m.draw(ctx));
            
            // 法宝
            if (this.artifact) {
                this.artifact.draw(ctx, this.assets);
            }
            
            // AOE 预警
            this.drawAOEWarnings(ctx);
            
            // 能量球
            this.drawPowerOrbs(ctx);
            
            // 粒子
            this.particles.forEach(p => p.draw(ctx));
            
            // 文字
            this.texts.forEach(t => t.draw(ctx));
            
            ctx.restore();
        }
        
        // 关卡模式场景绘制（伪3D倾斜视角）
        drawStageScene(ctx) {
            const tilt = 0.5;
            const zoom = 0.7 * (this.gameZoom || 1);
            const R = 600;
            const style = STAGE_STYLES[this.stageIdx] || STAGE_STYLES[0];
            
            ctx.save();
            
            // 1. 绘制天空（屏幕空间）
            const grad = ctx.createLinearGradient(0, 0, 0, this.height);
            grad.addColorStop(0, style.skyTop);
            grad.addColorStop(1, style.skyBot);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.width, this.height);
            
            // 2. 绘制远景（屏幕空间）
            this.drawStageFarground(ctx);
            
            // 3. 开始伪3D变换（地面层）
            ctx.save();
            ctx.translate(this.width/2, this.height/2);
            ctx.scale(zoom, zoom * tilt);
            ctx.translate(-this.width/2, -this.height/2);
            
            // 震屏
            let sx = (Math.random() - 0.5) * this.shake * 10;
            let sy = (Math.random() - 0.5) * this.shake * 10;
            ctx.translate(-this.camera.x + sx, -this.camera.y + sy);
            
            // 分离前后边缘装饰
            const backDecos = this.edgeDecorations.filter(d => d.y < 0);
            const frontDecos = this.edgeDecorations.filter(d => d.y >= 0);
            
            // 后景装饰
            backDecos.forEach(d => this.drawEdgeDeco(ctx, d));
            
            // 地面底色
            ctx.fillStyle = style.groundBase;
            ctx.beginPath();
            ctx.moveTo(-R, 0);
            ctx.bezierCurveTo(-R*0.4, R*2.5, R*0.4, R*2.5, R, 0);
            ctx.fill();
            
            // 阴影线
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 30;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, R*2);
            ctx.stroke();
            
            // 地面表层（圆形竞技场）
            ctx.fillStyle = style.groundSurf;
            ctx.beginPath();
            ctx.arc(0, 0, R, 0, Math.PI*2);
            ctx.fill();
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, R, 0, Math.PI*2);
            ctx.clip();
            
            // 背景纹理
            if (this.bgPattern) {
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = this.bgPattern;
                ctx.fillRect(-R, -R, R*2, R*2);
                ctx.globalAlpha = 1.0;
            }
            
            // 特殊纹理
            if (style.patternColor) {
                ctx.globalAlpha = 0.15;
                ctx.fillStyle = style.patternColor;
                for(let i=0; i<20; i++) {
                    ctx.beginPath();
                    ctx.arc((Math.random()-0.5)*R*2, (Math.random()-0.5)*R*2, 50, 0, Math.PI*2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1.0;
            }
            
            // 熔岩裂纹
            if (this.stageIdx === 2) {
                ctx.strokeStyle = '#ff5722';
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.5;
                for(let i=0; i<10; i++) {
                    ctx.beginPath();
                    ctx.moveTo((Math.random()-0.5)*R*2, (Math.random()-0.5)*R*2);
                    ctx.lineTo((Math.random()-0.5)*R*2, (Math.random()-0.5)*R*2);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1.0;
            }
            
            // 脚印
            this.footprints.forEach(f => f.draw(ctx));
            
            // 边缘高光
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(0, 0, R-5, 0, Math.PI*2);
            ctx.stroke();
            
            ctx.restore(); // 结束裁剪
            
            // 前景装饰
            frontDecos.forEach(d => this.drawEdgeDeco(ctx, d));
            
            ctx.restore(); // 结束地面层变换
            
            // 4. 实体层（需要应用伪3D Y轴缩放）
            ctx.save();
            ctx.translate(this.width/2, this.height/2);
            ctx.scale(zoom, zoom);
            ctx.translate(-this.width/2, -this.height/2 * tilt);
            ctx.translate(-this.camera.x + sx, (-this.camera.y + sy) * tilt);
            
            // 绘制带伪3D的实体
            const drawBillboard = (list) => {
                list.forEach(e => {
                    const oy = e.y;
                    e.y = e.y * tilt;
                    
                    // 特殊处理：招魂幡
                    if (e.img === 'spirit_banner') {
                        ctx.save();
                        ctx.translate(e.x, e.y);
                        ctx.strokeStyle = '#5d4037';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(0, -80);
                        ctx.stroke();
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 4;
                        const t = this.playTime * 2.0 + e.x * 0.1;
                        for(let i=0; i<3; i++) {
                            const offX = (i-1) * 5;
                            ctx.beginPath();
                            ctx.moveTo(0, -80);
                            const sway = Math.sin(t + i) * 10;
                            ctx.quadraticCurveTo(offX + sway, -60, offX + sway*1.5, -40);
                            ctx.stroke();
                        }
                        ctx.restore();
                    } else {
                        e.draw(ctx, this.assets);
                    }
                    
                    e.y = oy;
                });
            };
            
            // 按 Y 排序绘制
            this.staticObjects.sort((a,b) => a.y - b.y);
            
            drawBillboard(this.staticObjects);
            drawBillboard(this.orbs);
            drawBillboard(this.chests);
            drawBillboard(this.coins);
            drawBillboard(this.enemies);
            drawBillboard(this.minions);
            
            // 玩家
            if (this.player) {
                const py = this.player.y;
                this.player.y *= tilt;
                this.player.draw(ctx, this.assets);
                this.player.y = py;
            }
            
            // 法宝
            if (this.artifact) {
                const ay = this.artifact.y;
                this.artifact.y *= tilt;
                this.artifact.draw(ctx, this.assets);
                this.artifact.y = ay;
            }
            
            // 发光效果
            ctx.globalCompositeOperation = 'lighter';
            drawBillboard(this.bullets);
            drawBillboard(this.particles);
            ctx.globalCompositeOperation = 'source-over';
            
            // 天气
            this.weather.draw(ctx, this.camera);
            
            drawBillboard(this.texts);
            
            ctx.restore(); // 结束实体层变换
            ctx.restore(); // 结束外层保存
        }
        
        // 绘制 AOE 预警圈
        drawAOEWarnings(ctx) {
            for (const aoe of this.pendingAOEs) {
                const progress = 1 - (aoe.timer / 1.5);
                
                // 预警圈外圈
                ctx.beginPath();
                ctx.arc(aoe.x, aoe.y, aoe.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 82, 82, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
                ctx.lineWidth = 4;
                ctx.stroke();
                
                // 填充（进度）
                ctx.beginPath();
                ctx.arc(aoe.x, aoe.y, aoe.radius * progress, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fill();
                
                // 中心点
                ctx.beginPath();
                ctx.arc(aoe.x, aoe.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = '#ff5252';
                ctx.fill();
            }
        }
        
        // 绘制能量球
        drawPowerOrbs(ctx) {
            for (const orb of this.powerOrbs) {
                const pulse = Math.sin(orb.pulse) * 5;
                
                // 外圈光晕
                const gradient = ctx.createRadialGradient(
                    orb.x, orb.y, 0,
                    orb.x, orb.y, orb.radius + pulse + 10
                );
                gradient.addColorStop(0, orb.color);
                gradient.addColorStop(0.5, orb.color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
                gradient.addColorStop(1, 'transparent');
                
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.radius + pulse + 10, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // 核心
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.radius + pulse, 0, Math.PI * 2);
                ctx.fillStyle = orb.color;
                ctx.fill();
                
                // 中心高光
                ctx.beginPath();
                ctx.arc(orb.x - 5, orb.y - 5, orb.radius / 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.fill();
            }
        }
        
        // 绘制波次标题
        drawWaveTitle(ctx) {
            if (!this.waveTitle || this.waveTitleTimer <= 0) return;
            
            const alpha = Math.min(1, this.waveTitleTimer);
            const scale = 1 + (1 - Math.min(1, this.waveTitleTimer / 0.3)) * 0.2;
            
            ctx.save();
            ctx.translate(this.width / 2, this.height / 2);
            ctx.scale(scale, scale);
            ctx.globalAlpha = alpha;
            
            // 主标题
            ctx.font = 'bold 48px "Ma Shan Zheng", serif';
            ctx.fillStyle = '#c0392b';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#8b0000';
            ctx.shadowBlur = 20;
            ctx.fillText(this.waveTitle.title, 0, 0);
            
            // 副标题
            if (this.waveTitle.subtitle) {
                ctx.font = '24px "Ma Shan Zheng", serif';
                ctx.fillStyle = '#ff5252';
                ctx.shadowBlur = 10;
                ctx.fillText(this.waveTitle.subtitle, 0, 40);
            }
            
            ctx.restore();
        }
        
        // 绘制飞行金币
        drawFlyingCoins(ctx) {
            ctx.font = '20px Arial';
            for (const fc of this.flyingCoins) {
                ctx.globalAlpha = 1 - fc.t;
                ctx.fillText('💰', fc.x, fc.y);
            }
            ctx.globalAlpha = 1;
        }
        
        // 绘制背景 - 根据游戏模式选择不同渲染
        drawBackground(ctx) {
            if (this.gameMode === GAME_MODES.ARENA) {
                this.drawArenaBackground(ctx);
            }
        }
        
        // 秘境模式背景（血色风格）
        drawArenaBackground(ctx) {
            // 天空渐变
            const skyGrad = ctx.createLinearGradient(0, -600, 0, 200);
            skyGrad.addColorStop(0, '#0a0000');
            skyGrad.addColorStop(0.5, '#1a0505');
            skyGrad.addColorStop(1, '#2a0a0a');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(this.camera.x - 100, this.camera.y - 100, this.width + 200, this.height + 200);
            
            // 血月
            const moonX = this.camera.x + this.width * 0.8;
            const moonY = this.camera.y + 100;
            
            // 月亮光晕
            const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 150);
            moonGlow.addColorStop(0, 'rgba(139, 0, 0, 0.3)');
            moonGlow.addColorStop(0.5, 'rgba(139, 0, 0, 0.1)');
            moonGlow.addColorStop(1, 'rgba(139, 0, 0, 0)');
            ctx.fillStyle = moonGlow;
            ctx.beginPath();
            ctx.arc(moonX, moonY, 150, 0, Math.PI * 2);
            ctx.fill();
            
            // 月亮
            ctx.fillStyle = '#8b0000';
            ctx.beginPath();
            ctx.arc(moonX, moonY, 50, 0, Math.PI * 2);
            ctx.fill();
            
            // 月亮高光
            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.arc(moonX - 15, moonY - 15, 35, 0, Math.PI * 2);
            ctx.fill();
            
            // 地面纹理
            if (this.bgPattern) {
                ctx.fillStyle = this.bgPattern;
                ctx.fillRect(-700, -700, 1400, 1400);
            }
            
            // 竞技场边缘
            this.drawArenaEdge(ctx);
        }
        
        // 绘制远景岛屿（关卡模式）
        drawDistantIsland(ctx, bx, by, ox, oy, w, h, baseColor, topColor, decoType) {
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

            // 装饰物
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
        }
        
        // 绘制边缘装饰物（关卡模式）
        drawEdgeDeco(ctx, d) {
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
                
                // 叶子
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
                
                // 流动效果
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

                // 熔岩滴落
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
        }
        
        // 绘制关卡场景远景（天空、岛屿等）
        drawStageFarground(ctx) {
            STAGE_STYLES[this.stageIdx] || STAGE_STYLES[0];
            const w = this.width;
            const h = this.height;
            const pX = this.camera.x * 0.1; 
            const pY = this.camera.y * 0.1;
            const sX = this.camera.x * 0.02; 
            const sY = this.camera.y * 0.02;
            
            switch(this.stageIdx) {
                case 0: // 幽暗密林
                    ctx.fillStyle = '#f1f8e9'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
                    ctx.beginPath(); ctx.arc(w*0.85 - sX, h*0.15 - sY, 30, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                    this.drawDistantIsland(ctx, w*0.2, h*0.2, -pX, -pY, 120, 90, '#0b1013', '#1b5e20', 'tree');
                    this.drawDistantIsland(ctx, w*0.8, h*0.15, -pX, -pY, 180, 120, '#0b1013', '#1b5e20', 'tree');
                    // 雾气
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
                    break;
                    
                case 1: // 埋骨之地
                    this.drawDistantIsland(ctx, w*0.15, h*0.25, -pX, -pY, 100, 80, '#212121', '#424242', 'cross');
                    this.drawDistantIsland(ctx, w*0.75, h*0.15, -pX, -pY, 200, 150, '#212121', '#424242', 'cross');
                    ctx.fillStyle = '#cfd8dc'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 15;
                    ctx.beginPath(); ctx.arc(w*0.8 - sX, h*0.15 - sY, 50, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                    break;
                    
                case 2: // 熔岩炼狱
                    this.drawDistantIsland(ctx, w*0.2, h*0.15, -pX, -pY, 150, 100, '#210000', '#3e2723', 'spike');
                    this.drawDistantIsland(ctx, w*0.85, h*0.2, -pX, -pY, 120, 140, '#210000', '#3e2723', 'spike');
                    ctx.fillStyle = 'rgba(0,0,0,0.2)';
                    ctx.beginPath(); ctx.arc(w/2 - this.camera.x*0.05, h - this.camera.y*0.05, w/2, 0, Math.PI*2); ctx.fill();
                    break;
                    
                case 3: // 极寒冰原
                    this.drawDistantIsland(ctx, w*0.25, h*0.1, -pX, -pY, 140, 110, '#0d47a1', '#64b5f6', 'crystal');
                    this.drawDistantIsland(ctx, w*0.8, h*0.2, -pX, -pY, 160, 100, '#0d47a1', '#64b5f6', 'crystal');
                    break;
                    
                case 4: // 塞外古战场
                    // 长河落日圆
                    ctx.fillStyle = '#b7410e'; ctx.shadowColor = '#8b2e0b'; ctx.shadowBlur = 50;
                    ctx.beginPath(); ctx.arc(w*0.7 - sX, h*0.25 - sY, 70, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                    
                    // 大漠孤烟直
                    ctx.save();
                    const smokeX = w*0.3 - pX*0.8;
                    const smokeBaseY = h*0.4 - pY*0.5;
                    const smokeGrad = ctx.createLinearGradient(smokeX, smokeBaseY, smokeX, smokeBaseY - 300);
                    smokeGrad.addColorStop(0, 'rgba(40, 30, 20, 0.8)');
                    smokeGrad.addColorStop(1, 'rgba(80, 70, 60, 0)');
                    ctx.fillStyle = smokeGrad;
                    ctx.beginPath();
                    ctx.moveTo(smokeX - 2, smokeBaseY);
                    ctx.lineTo(smokeX + 2, smokeBaseY);
                    ctx.lineTo(smokeX + 10, smokeBaseY - 300);
                    ctx.lineTo(smokeX - 10, smokeBaseY - 300);
                    ctx.fill();
                    ctx.restore();
                    
                    // 沙丘
                    this.drawDistantIsland(ctx, w*0.1, h*0.25, -pX, -pY, 200, 120, '#2d2318', '#3e3626', 'spike');
                    this.drawDistantIsland(ctx, w*0.6, h*0.28, -pX, -pY, 250, 100, '#2d2318', '#3e3626', 'cross');
                    this.drawDistantIsland(ctx, w*0.9, h*0.22, -pX, -pY, 180, 90, '#2d2318', '#3e3626', 'spike');
                    break;
                    
                case 5: // 昆仑仙境
                    ctx.fillStyle = '#e74c3c'; ctx.shadowColor = '#c0392b'; ctx.shadowBlur = 30;
                    ctx.beginPath(); ctx.arc(w/2 - sX, h*0.15 - sY, 60, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                    this.drawDistantIsland(ctx, w*0.2, h*0.2, -pX, -pY, 120, 90, '#37474f', '#cfd8dc', 'pavilion');
                    this.drawDistantIsland(ctx, w*0.8, h*0.15, -pX, -pY, 280, 180, '#37474f', '#cfd8dc', 'pine');
                    break;
            }
        }
        
        // 绘制竞技场边缘
        drawArenaEdge(ctx) {
            const R = 580;
            
            // 边缘迷雾
            ctx.save();
            for (let i = 0; i < 60; i++) {
                const angle = (i / 60) * Math.PI * 2;
                const r = R + Math.sin(this.playTime * 2 + i) * 20;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
                gradient.addColorStop(0, 'rgba(139, 0, 0, 0.4)');
                gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, 80, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            
            // 边界线
            ctx.strokeStyle = '#5c0000';
            ctx.lineWidth = 3;
            ctx.setLineDash([20, 10]);
            ctx.beginPath();
            ctx.arc(0, 0, R, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // 绘制子弹
        drawBullets(ctx) {
            this.bullets.forEach(b => {
                ctx.save();
                ctx.translate(b.x, b.y);
                
                // 剑气效果
                const angle = Math.atan2(b.vy || 0, b.vx || 1);
                ctx.rotate(angle);
                
                // 光晕
                const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
                glow.addColorStop(0, 'rgba(192, 57, 43, 0.8)');
                glow.addColorStop(1, 'rgba(192, 57, 43, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
                
                // 核心
                ctx.fillStyle = b.color || '#ff5252';
                ctx.beginPath();
                ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            });
        }
        
        // 顿帧效果
        hitStop(duration) {
            if (this.hitStopCooldown <= 0) {
                this.freezeTimer = duration;
                this.hitStopCooldown = 0.1;
            }
        }
        
        // 暂停
        pause() {
            this.state = 'PAUSED';
        }
        
        // 恢复
        resume() {
            this.state = 'PLAY';
        }
        
        // 绘制血雾
        drawBloodMist(ctx) {
            const gradient = ctx.createRadialGradient(
                this.width / 2, this.height / 2, 0,
                this.width / 2, this.height / 2, this.width * 0.7
            );
            gradient.addColorStop(0, 'rgba(139, 0, 0, 0)');
            gradient.addColorStop(0.7, 'rgba(139, 0, 0, 0.1)');
            gradient.addColorStop(1, 'rgba(139, 0, 0, 0.3)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);
        }
        
        // 开始下一波
        startNextWave() {
            if (this.state !== 'PLAY') return;
            
            this.currentWave++;
            
            if (this.currentWave > ARENA_CONFIG.totalWaves) {
                this.gameOver(true);
                return;
            }
            
            const waveConfig = ARENA_CONFIG.waves[this.currentWave - 1];
            
            // BOSS 波特殊处理
            if (waveConfig.isBoss) {
                this.showBossIntro(waveConfig);
            } else {
                this.spawnWave(waveConfig);
            }
            
            this.waveCleared = false;
            this.updateUI();
        }
        
        // 显示 BOSS 登场
        showBossIntro(waveConfig) {
            this.showingBossIntro = true;
            this.bossCountdown = 3;
            
            // 倒计时
            const countdown = () => {
                if (this.bossCountdown > 0) {
                    if (this.ui) {
                        this.ui.showCountdown(this.bossCountdown, 'BOSS 来袭', () => {
                            this.bossCountdown--;
                            if (this.bossCountdown > 0) {
                                setTimeout(countdown, 1000);
                            } else {
                                this.showingBossIntro = false;
                                this.spawnWave(waveConfig);
                            }
                        });
                    } else {
                        this.bossCountdown--;
                        setTimeout(countdown, 1000);
                    }
                }
            };
            
            countdown();
        }
        
        // 生成敌人
        spawnWave(waveConfig) {
            const count = waveConfig.count;
            const mobs = waveConfig.mobs;
            const levelMult = waveConfig.levelMult;
            const playerLevel = this.player ? this.player.level : 1;
            
            for (let i = 0; i < count; i++) {
                const mobType = mobs[Math.floor(Math.random() * mobs.length)];
                const angle = (Math.PI * 2 / count) * i;
                const distance = waveConfig.isBoss ? 200 : 300 + Math.random() * 200;
                
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                const enemy = new ArenaEnemy(mobType, x, y, levelMult, playerLevel);
                this.enemies.push(enemy);
                
                if (enemy.isBoss) {
                    this.currentBoss = enemy;
                    if (this.ui) {
                        this.ui.showBossHUD(enemy.name, enemy.hp, enemy.maxHp);
                    }
                }
            }
            
            this.updateUI();
        }
        
        // 敌人被击杀
        onEnemyKilled(enemy) {
            enemy.dead = true;
            this.totalKills++;
            
            // 掉落金币
            const goldDrop = enemy.goldDrop || [1, 2];
            const goldCount = goldDrop[0] + Math.floor(Math.random() * (goldDrop[1] - goldDrop[0] + 1));
            for (let i = 0; i < goldCount; i++) {
                const coin = new Coin(
                    enemy.x + (Math.random() - 0.5) * 30,
                    enemy.y + (Math.random() - 0.5) * 30,
                    enemy.isBoss ? 10 : 1
                );
                this.coins.push(coin);
                
                // 金币飞行效果
                this.flyGoldToCounter(enemy.x, enemy.y);
            }
            
            // 掉落道具卡（概率）
            if (Math.random() < 0.15 || enemy.isBoss) {
                const cardCount = enemy.isBoss ? (ARENA_BOSSES[enemy.type]?.cardDrop || 1) : 1;
                for (let i = 0; i < cardCount; i++) {
                    this.dropItemCard(enemy.x, enemy.y);
                }
            }
            
            // 死亡粒子
            for (let i = 0; i < 10; i++) {
                this.particles.push(new Particle(enemy.x, enemy.y, '#8b0000', 0.5, 6));
            }
            
            // BOSS 击杀
            if (enemy.isBoss) {
                this.shake = 2;
                this.currentBoss = null;
                if (this.ui) {
                    this.ui.hideBossHUD();
                }
                
                this.showWaveTitle('BOSS 击败！', `${enemy.name || ''}已被消灭`);
                
                // 额外奖励
                for (let i = 0; i < 20; i++) {
                    const coin = new Coin(
                        enemy.x + (Math.random() - 0.5) * 100,
                        enemy.y + (Math.random() - 0.5) * 100,
                        5
                    );
                    this.coins.push(coin);
                }
            }
            
            // 经验
            if (this.player) {
                this.player.gainExp(enemy.isBoss ? 50 : 10);
            }
            
            this.updateUI();
        }
        
        // 掉落道具卡
        dropItemCard(x, y) {
            if (!ITEM_CARDS || ITEM_CARDS.length === 0) return;
            
            // 随机选择一张卡
            const totalWeight = ITEM_CARDS.reduce((sum, c) => sum + (c.dropRate || 1), 0);
            let rand = Math.random() * totalWeight;
            let selectedCard = ITEM_CARDS[0];
            
            for (const card of ITEM_CARDS) {
                rand -= (card.dropRate || 1);
                if (rand <= 0) {
                    selectedCard = card;
                    break;
                }
            }
            
            // 添加到卡槽
            this.itemCards.addCard(selectedCard);
            
            // 显示获得提示
            this.texts.push(new FloatText(x, y - 50, `获得 ${selectedCard.icon || '🃏'} ${selectedCard.name}`, '#f1c40f'));
        }
        
        // 检查波次完成
        checkWaveComplete() {
            if (this.waveCleared) return;
            
            const aliveEnemies = this.enemies.filter(e => !e.dead);
            
            // 更新 BOSS 血量
            if (this.currentBoss && !this.currentBoss.dead && this.ui) {
                this.ui.updateBossHP(this.currentBoss.hp);
            }
            
            if (aliveEnemies.length === 0) {
                this.waveCleared = true;
                
                // 显示技能选择
                if (this.currentWave < ARENA_CONFIG.totalWaves) {
                    this.showSkillChoice();
                } else {
                    // 最后一波
                    setTimeout(() => this.gameOver(true), 2000);
                }
            }
            
            this.updateUI();
        }
        
        // 显示技能选择
        showSkillChoice() {
            this.state = 'SKILL';
            
            // 随机3个技能
            const shuffled = [...SKILLS].sort(() => Math.random() - 0.5);
            const choices = shuffled.slice(0, 3);
            
            if (this.ui) {
                this.ui.showSkillMenu(choices, (skill) => {
                    this.applySkill(skill);
                    this.state = 'PLAY';
                    setTimeout(() => this.startNextWave(), 1000);
                });
            } else {
                // 无 UI 时自动选择第一个
                this.applySkill(choices[0]);
                this.state = 'PLAY';
                setTimeout(() => this.startNextWave(), 1000);
            }
        }
        
        // 应用技能
        applySkill(skill) {
            if (!this.player || !skill) return;
            
            // 根据技能效果应用
            if (skill.effect) {
                if (skill.effect.dmgMult) {
                    this.player.dmg *= skill.effect.dmgMult;
                }
                if (skill.effect.hpMult) {
                    this.player.maxHp *= skill.effect.hpMult;
                    this.player.hp = this.player.maxHp;
                }
                if (skill.effect.speedMult) {
                    this.player.speed *= skill.effect.speedMult;
                }
                if (skill.effect.cdMult) {
                    this.player.attackCd *= skill.effect.cdMult;
                }
            }
            
            this.texts.push(new FloatText(this.player.x, this.player.y - 50, `✨ ${skill.name}`, '#9b59b6'));
            this.updateUI();
        }
        
        // 游戏结束
        gameOver(victory) {
            this.state = victory ? 'VICTORY' : 'DEFEAT';
            
            const stats = {
                kills: this.totalKills,
                gold: this.totalGold,
                wave: this.currentWave,
                time: this.formatTime(this.playTime),
                stars: this.calculateStars()
            };
            
            // 保存金币
            const savedGold = Platform.getStorage('playerGold') || 0;
            const earnedGold = victory ? this.totalGold : Math.floor(this.totalGold * 0.5);
            Platform.setStorage('playerGold', savedGold + earnedGold);
            
            if (this.ui) {
                if (victory) {
                    this.ui.showVictoryMenu(stats);
                } else {
                    this.ui.showDefeatMenu(stats);
                }
            }
        }
        
        // 计算评价星级
        calculateStars() {
            let stars = 0;
            if (this.currentWave >= 5) stars++;
            if (this.currentWave >= 10) stars++;
            if (this.playTime < 300) stars++; // 5分钟内
            return '⭐'.repeat(stars) || '☆';
        }
        
        // 格式化时间
        formatTime(seconds) {
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        
        // 更新 UI
        updateUI() {
            if (!this.ui) return;
            
            const aliveEnemies = this.enemies.filter(e => !e.dead);
            
            // 计算境界名称
            const ranks = ['练气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期'];
            const playerLvl = this.player ? this.player.lvl : 1;
            const rankIdx = Math.min(Math.floor((playerLvl - 1) / 3), ranks.length - 1);
            const rankName = ranks[rankIdx];
            const rankLevel = ((playerLvl - 1) % 3) + 1;
            
            // 基础数据
            const hudData = {
                hp: this.player ? this.player.hp : 0,
                maxHp: this.player ? this.player.maxHp : 100,
                exp: this.player ? this.player.exp : 0,
                maxExp: this.player ? this.player.maxExp : 100,
                enemyCount: aliveEnemies.length,
                gold: this.totalGold,
                rankName: rankName,
                rankLevel: rankLevel
            };
            
            // 模式专属数据
            if (this.gameMode === GAME_MODES.ARENA) {
                hudData.wave = this.currentWave;
                hudData.maxWave = ARENA_CONFIG.totalWaves;
            } else {
                hudData.stageName = STAGES[this.stageIdx]?.name || '未知之地';
                hudData.playTime = this.playTime;
            }
            
            this.ui.updateHUD(hudData);
        }
    }

    // ========== 轻量级 Canvas UI 系统 ==========
    // 零依赖，跨平台，高性能
    // 支持: 按钮、标签、进度条、面板、卡片


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
    class Label extends UIComponent {
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
    class Button extends UIComponent {
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

    // ========== 面板组件 ==========
    class Panel extends UIComponent {
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
    class Card extends UIComponent {
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
    class UIManager {
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

    // ========== Canvas 虚拟摇杆 ==========
    // 零依赖，纯 Canvas 实现，跨平台
    // 特性：动态位置、平滑回弹、方向输出


    class VirtualJoystick {
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

    // ========== 游戏 UI 实现 ==========
    // 血色秘境所有界面：开始菜单、HUD、升级、结算等


    // ========== 游戏 UI 控制器 ==========
    class GameUI {
        constructor(canvas, engine, width, height) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.engine = engine;
            
            // 使用逻辑尺寸（而非 canvas.width/height 像素尺寸）
            const systemInfo = Platform.getSystemInfo();
            this.width = width || systemInfo.windowWidth;
            this.height = height || systemInfo.windowHeight;
            
            // UI 管理器（传入逻辑尺寸）
            this.ui = new UIManager(canvas, this.width, this.height);
            
            // 虚拟摇杆
            this.joystick = null;
            
            // 当前显示的界面
            this.currentScreen = 'start'; // start, playing, levelup, skill, victory, defeat
            
            // 缓存的 UI 组件
            this.components = {};
            
            // HUD 数据
            this.hudData = {
                hp: 100,
                maxHp: 100,
                exp: 0,
                maxExp: 100,
                wave: 1,
                maxWave: 10,
                enemyCount: 0,
                gold: 0,
                rankName: '练气期',
                rankLevel: 1,
                // 关卡模式专用
                stageName: '幽暗密林',
                playTime: 0
            };
            
            // 选择的角色
            this.selectedRole = 'sword';
            
            // 游戏模式
            this.selectedMode = GAME_MODES.ARENA;
            this.selectedStageIdx = 0;
            
            // 初始化
            this.init();
        }
        
        init() {
            // 从存储读取角色选择
            const savedRole = Platform.getStorage('arenaRole');
            if (savedRole && ROLES.find(r => r.id === savedRole)) {
                this.selectedRole = savedRole;
            }
            
            // 初始化触摸事件（Web环境）
            if (Platform.isWeb) {
                Platform.initWebTouchEvents(this.canvas);
            }
            
            // 添加道具卡槽触摸事件
            this.setupItemSlotTouch();
            
            // 创建开始菜单
            this.createStartMenu();
        }
        
        // 设置道具卡槽触摸事件（只绑定一次）
        _itemSlotTouchBound = false;
        setupItemSlotTouch() {
            if (this._itemSlotTouchBound) return;
            this._itemSlotTouchBound = true;
            
            Platform.onTouchStart((e) => {
                if (this.currentScreen !== 'playing') return;
                if (!this.engine || !this.engine.itemCards) return;
                
                const touch = e.touches[0] || e.changedTouches[0];
                if (!touch) return;
                
                // 获取屏幕坐标转换为逻辑坐标
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
                
                // 检查是否点击了道具卡槽
                this.engine.itemCards.handleTouch(x, y, this.width, this.height);
            });
        }
        
        // 调整大小
        resize(width, height) {
            this.width = width;
            this.height = height;
            this.ui.resize(width, height);
            
            // 重新创建当前界面
            if (this.currentScreen === 'start') {
                this.createStartMenu();
            } else if (this.currentScreen === 'playing') {
                this.createHUD();
            }
        }
        
        // ========== 开始菜单 ==========
        createStartMenu() {
            console.log('[GameUI] createStartMenu called');
            this.ui.clearAll();
            this.currentScreen = 'start';
            
            const cx = this.width / 2;
            const cy = this.height / 2;
            const panelWidth = Math.min(380, this.width - 40);
            const panelHeight = Math.min(580, this.height - 60);
            
            // 背景面板
            const panel = new Panel(
                cx - panelWidth / 2,
                cy - panelHeight / 2,
                panelWidth,
                panelHeight,
                {
                    bgColor: 'rgba(20, 10, 10, 0.95)',
                    borderColor: '#5a2020',
                    borderRadius: 20
                }
            );
            this.ui.add(panel, 'overlay');
            console.log('[GameUI] Panel added, interactive components:', this.ui.getInteractiveComponents().length);
            
            // 标题
            const title = new Label(panelWidth / 2, 28, '灵剑 • 绝世仙缘', {
                fontSize: 28,
                color: '#c0392b',
                align: 'center',
                shadow: { color: '#000', blur: 10 }
            });
            panel.addChild(title);
            
            // 副标题
            const subtitle = new Label(panelWidth / 2, 52, '移动版', {
                fontSize: 14,
                color: '#888',
                align: 'center'
            });
            panel.addChild(subtitle);
            
            // ========== 模式选择标签页 ==========
            const tabY = 75;
            const tabWidth = (panelWidth - 40) / 2;
            
            // 关卡模式按钮
            const stageTabBtn = new Button(
                15, tabY, tabWidth, 35,
                '🗺️ 关卡模式',
                {
                    fontSize: 14,
                    bgColor: this.selectedMode === GAME_MODES.STAGE ? 'rgba(52, 152, 219, 0.8)' : 'rgba(60, 60, 60, 0.6)',
                    borderColor: this.selectedMode === GAME_MODES.STAGE ? '#3498db' : '#555',
                    borderRadius: 10,
                    onClick: () => { this.selectedMode = GAME_MODES.STAGE; this.createStartMenu(); }
                }
            );
            panel.addChild(stageTabBtn);
            
            // 秘境模式按钮
            const arenaTabBtn = new Button(
                panelWidth / 2 + 5, tabY, tabWidth, 35,
                '⚔️ 血色秘境',
                {
                    fontSize: 14,
                    bgColor: this.selectedMode === GAME_MODES.ARENA ? 'rgba(192, 57, 43, 0.8)' : 'rgba(60, 60, 60, 0.6)',
                    borderColor: this.selectedMode === GAME_MODES.ARENA ? '#c0392b' : '#555',
                    borderRadius: 10,
                    onClick: () => { this.selectedMode = GAME_MODES.ARENA; this.createStartMenu(); }
                }
            );
            panel.addChild(arenaTabBtn);
            
            // ========== 根据模式显示不同内容 ==========
            const contentY = 125;
            
            if (this.selectedMode === GAME_MODES.ARENA) {
                // 秘境模式说明
                const descItems = [
                    '📜 十波妖潮，层层递进',
                    '🕷️ 第五波：小BOSS 赤玉蛛王',
                    '🦂 第十波：大BOSS 炎煞蝎皇',
                    '💎 击败怪物获取道具卡牌'
                ];
                descItems.forEach((text, i) => {
                    const label = new Label(20, contentY + i * 22, text, {
                        fontSize: 12,
                        color: '#aaa',
                        align: 'left'
                    });
                    panel.addChild(label);
                });
            } else {
                // 关卡模式说明
                const stageDesc = new Label(20, contentY, '🌍 穿越六大秘境，逐步强化角色', {
                    fontSize: 12,
                    color: '#aaa',
                    align: 'left'
                });
                panel.addChild(stageDesc);
                
                // 关卡选择
                const stageStartY = contentY + 30;
                const stageHeight = 45;
                const visibleStages = STAGES.slice(0, 6);
                
                visibleStages.forEach((stage, i) => {
                    const isSelected = i === this.selectedStageIdx;
                    const stageBtn = new Button(
                        20, stageStartY + i * stageHeight,
                        panelWidth - 40, stageHeight - 5,
                        `${i + 1}. ${stage.name}`,
                        {
                            fontSize: 13,
                            bgColor: isSelected ? 'rgba(52, 152, 219, 0.7)' : 'rgba(40, 40, 40, 0.6)',
                            borderColor: isSelected ? '#3498db' : '#444',
                            borderRadius: 8,
                            textAlign: 'left',
                            onClick: () => { this.selectedStageIdx = i; this.createStartMenu(); }
                        }
                    );
                    panel.addChild(stageBtn);
                    
                    // 关卡时间提示
                    const timeLabel = new Label(panelWidth - 50, stageStartY + i * stageHeight + 22, this.formatTime(stage.time), {
                        fontSize: 10,
                        color: '#888',
                        align: 'center'
                    });
                    panel.addChild(timeLabel);
                });
            }
            
            // ========== 角色选择 ==========
            const roleY = this.selectedMode === GAME_MODES.ARENA ? contentY + 105 : contentY + 295;
            
            const roleLabel = new Label(panelWidth / 2, roleY, '选择角色', {
                fontSize: 12,
                color: '#888',
                align: 'center'
            });
            panel.addChild(roleLabel);
            
            const role = ROLES.find(r => r.id === this.selectedRole) || ROLES[0];
            const roleName = new Label(panelWidth / 2, roleY + 22, role.name, {
                fontSize: 20,
                color: this.selectedMode === GAME_MODES.ARENA ? '#c0392b' : '#3498db',
                align: 'center',
                shadow: { color: '#000', blur: 5 }
            });
            panel.addChild(roleName);
            
            // 角色选择按钮
            const roleButtonY = roleY + 50;
            const roleButtonWidth = (panelWidth - 50) / ROLES.length;
            ROLES.forEach((r, i) => {
                const btn = new Button(
                    15 + i * roleButtonWidth + 3,
                    roleButtonY,
                    roleButtonWidth - 6,
                    32,
                    r.name.slice(0, 2),
                    {
                        fontSize: 11,
                        bgColor: r.id === this.selectedRole ? 'rgba(192, 57, 43, 0.8)' : 'rgba(60, 30, 30, 0.7)',
                        borderColor: r.id === this.selectedRole ? '#ff6b6b' : '#5a2020',
                        borderRadius: 8,
                        onClick: () => this.selectRole(r.id)
                    }
                );
                panel.addChild(btn);
            });
            
            // ========== 进入按钮 ==========
            const enterText = this.selectedMode === GAME_MODES.ARENA ? '⚔️ 进入秘境 ⚔️' : '🗺️ 开始冒险 🗺️';
            const enterColor = this.selectedMode === GAME_MODES.ARENA ? 'rgba(139, 0, 0, 0.9)' : 'rgba(41, 128, 185, 0.9)';
            const enterBorder = this.selectedMode === GAME_MODES.ARENA ? '#ff6b6b' : '#5dade2';
            
            const enterBtn = new Button(
                30,
                panelHeight - 100,
                panelWidth - 60,
                45,
                enterText,
                {
                    fontSize: 18,
                    bgColor: enterColor,
                    borderColor: enterBorder,
                    borderRadius: 22,
                    onClick: () => this.startGame()
                }
            );
            panel.addChild(enterBtn);
            
            // 返回按钮
            const backBtn = new Button(
                30,
                panelHeight - 48,
                panelWidth - 60,
                32,
                '返回山门',
                {
                    fontSize: 13,
                    bgColor: 'rgba(80, 40, 40, 0.8)',
                    borderColor: '#5a2020',
                    borderRadius: 12,
                    onClick: () => this.backToMain()
                }
            );
            panel.addChild(backBtn);
        }
        
        // 格式化时间
        formatTime(seconds) {
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
        }
        
        // 选择角色
        selectRole(roleId) {
            this.selectedRole = roleId;
            Platform.setStorage('arenaRole', roleId);
            this.createStartMenu(); // 刷新界面
        }
        
        // 开始游戏
        startGame() {
            this.ui.clearAll();
            this.currentScreen = 'playing';
            
            // 创建 HUD
            this.createHUD();
            
            // 创建虚拟摇杆
            this.createJoystick();
            
            // 通知引擎开始 - 传递模式和关卡参数
            if (this.engine && this.engine.start) {
                this.engine.start(this.selectedRole, this.selectedMode, this.selectedStageIdx);
            }
        }
        
        // 返回主界面
        backToMain() {
            // 在小游戏环境下可能需要不同处理
            if (Platform.isWeb) {
                window.location.href = Platform.getSystemInfo().isMobile ? 'mobile.html' : 'pc.html';
            } else {
                // 小游戏环境下重新显示开始菜单或跳转场景
                this.createStartMenu();
            }
        }
        
        // ========== HUD ==========
        createHUD() {
            // 顶部 HUD 容器
            const hudTop = {
                x: 10,
                y: 10,
                visible: true,
                draw: (ctx) => this.drawHUD(ctx)
            };
            this.ui.add(hudTop, 'hud');
            
            // BOSS 血条（初始隐藏）
            this.bossHud = {
                visible: false,
                name: '',
                hp: 0,
                maxHp: 0
            };
        }
        
        // 绘制 HUD
        drawHUD(ctx) {
            const d = this.hudData;
            const isMobile = Platform.getSystemInfo().isMobile;
            
            // ========== 左上角：头像 + 血条 + 经验 ==========
            // 头像框
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(35, 35, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // TODO: 绘制角色头像（需要加载图片）
            ctx.fillStyle = '#c0392b';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const role = ROLES.find(r => r.id === this.selectedRole);
            ctx.fillText(role ? role.name[0] : '剑', 35, 35);
            
            // 境界信息
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${d.rankName} ${d.rankLevel}层`, 65, 18);
            
            // 血条
            const barX = 65;
            const barWidth = isMobile ? 100 : 150;
            const barHeight = 12;
            
            // 血条背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.drawRoundRect(ctx, barX, 28, barWidth, barHeight, 4);
            ctx.fill();
            
            // 血条填充
            const hpRatio = d.maxHp > 0 ? d.hp / d.maxHp : 0;
            ctx.fillStyle = hpRatio < 0.3 ? '#e74c3c' : '#27ae60';
            this.drawRoundRect(ctx, barX, 28, barWidth * hpRatio, barHeight, 4);
            ctx.fill();
            
            // 血条文字
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('气血', barX + barWidth / 2, 36);
            
            // 经验条
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.drawRoundRect(ctx, barX, 44, barWidth, barHeight, 4);
            ctx.fill();
            
            const expRatio = d.maxExp > 0 ? d.exp / d.maxExp : 0;
            ctx.fillStyle = '#3498db';
            this.drawRoundRect(ctx, barX, 44, barWidth * expRatio, barHeight, 4);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.fillText('修为', barX + barWidth / 2, 52);
            
            // ========== 顶部中间：波次/关卡信息 ==========
            const cx = this.width / 2;
            const gameMode = this.engine?.gameMode || GAME_MODES.ARENA;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.drawRoundRect(ctx, cx - 60, 8, 120, 48, 10);
            ctx.fill();
            
            ctx.strokeStyle = gameMode === GAME_MODES.ARENA ? '#8b0000' : '#2980b9';
            ctx.lineWidth = 1;
            this.drawRoundRect(ctx, cx - 60, 8, 120, 48, 10);
            ctx.stroke();
            
            if (gameMode === GAME_MODES.ARENA) {
                // 秘境模式：显示波次
                ctx.fillStyle = '#fff';
                ctx.font = '11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('第', cx - 25, 25);
                
                ctx.fillStyle = '#f1c40f';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(d.wave, cx, 32);
                
                ctx.fillStyle = '#fff';
                ctx.font = '11px Arial';
                ctx.fillText(`/${d.maxWave} 波`, cx + 25, 25);
                
                ctx.fillStyle = '#aaa';
                ctx.font = '11px Arial';
                ctx.fillText(`剩余: ${d.enemyCount}`, cx, 50);
            } else {
                // 关卡模式：显示时间和关卡名
                ctx.fillStyle = '#3498db';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(d.stageName, cx, 22);
                
                ctx.fillStyle = '#f1c40f';
                ctx.font = 'bold 20px Arial';
                ctx.fillText(this.formatTime(d.playTime), cx, 42);
                
                ctx.fillStyle = '#aaa';
                ctx.font = '10px Arial';
                ctx.fillText(`敌人: ${d.enemyCount}`, cx, 54);
            }
            
            // ========== 右上角：金币 ==========
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.drawRoundRect(ctx, this.width - 90, 8, 80, 30, 8);
            ctx.fill();
            
            ctx.font = '16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('💰', this.width - 85, 28);
            
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(d.gold, this.width - 60, 28);
            
            // ========== 道具卡槽（屏幕右下角） ==========
            this.drawItemSlots(ctx);
            
            // ========== BOSS 血条 ==========
            if (this.bossHud.visible) {
                const bossY = this.height - 100;
                const bossBarWidth = this.width * 0.7;
                const bossBarX = (this.width - bossBarWidth) / 2;
                
                // BOSS 名字
                ctx.fillStyle = '#ffcc00';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#000';
                ctx.shadowBlur = 5;
                ctx.fillText(this.bossHud.name, this.width / 2, bossY - 15);
                ctx.shadowBlur = 0;
                
                // BOSS 血条背景
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.drawRoundRect(ctx, bossBarX, bossY, bossBarWidth, 20, 6);
                ctx.fill();
                
                // BOSS 血条填充
                const bossHpRatio = this.bossHud.maxHp > 0 ? this.bossHud.hp / this.bossHud.maxHp : 0;
                const gradient = ctx.createLinearGradient(bossBarX, 0, bossBarX + bossBarWidth, 0);
                gradient.addColorStop(0, '#8b0000');
                gradient.addColorStop(1, '#ff4444');
                ctx.fillStyle = gradient;
                this.drawRoundRect(ctx, bossBarX, bossY, bossBarWidth * bossHpRatio, 20, 6);
                ctx.fill();
                
                // 边框
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 2;
                this.drawRoundRect(ctx, bossBarX, bossY, bossBarWidth, 20, 6);
                ctx.stroke();
            }
        }
        
        // 绘制道具卡槽
        drawItemSlots(ctx) {
            if (!this.engine || !this.engine.itemCards) return;
            
            const slots = this.engine.itemCards.slots;
            const slotSize = 40;
            const spacing = 5;
            const startX = this.width - (slotSize + spacing) * 6 - 10;
            const startY = this.height - slotSize - 80;
            
            for (let i = 0; i < 6; i++) {
                const x = startX + (slotSize + spacing) * i;
                const y = startY;
                const card = slots[i];
                
                // 槽位背景
                ctx.fillStyle = card ? 'rgba(139, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)';
                this.drawRoundRect(ctx, x, y, slotSize, slotSize, 6);
                ctx.fill();
                
                // 边框
                ctx.strokeStyle = card ? '#c0392b' : '#444';
                ctx.lineWidth = 2;
                this.drawRoundRect(ctx, x, y, slotSize, slotSize, 6);
                ctx.stroke();
                
                if (card) {
                    // 卡牌图标
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#fff';
                    ctx.fillText(card.icon || '🃏', x + slotSize / 2, y + slotSize / 2);
                    
                    // 数量
                    if (card.count > 1) {
                        ctx.font = 'bold 12px Arial';
                        ctx.fillStyle = '#f1c40f';
                        ctx.textAlign = 'right';
                        ctx.fillText(`×${card.count}`, x + slotSize - 3, y + slotSize - 5);
                    }
                } else {
                    // 空槽位显示快捷键提示
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#666';
                    ctx.fillText(i + 1, x + slotSize / 2, y + slotSize / 2);
                }
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
        
        // ========== 虚拟摇杆 ==========
        createJoystick() {
            const info = Platform.getSystemInfo();
            
            // 摇杆触发区域（屏幕左半部分下方）
            this.joystick = new VirtualJoystick({
                zone: {
                    x: 0,
                    y: this.height * 0.4,
                    width: this.width * 0.5,
                    height: this.height * 0.5
                },
                baseRadius: info.isMobile ? 60 : 50,
                knobRadius: info.isMobile ? 25 : 20,
                dynamic: true,
                onMove: (dx, dy, force, angle) => {
                    // 传递给引擎
                    if (this.engine) {
                        this.engine.setJoystickInput(dx, dy, force > 0.1);
                    }
                }
            });
        }
        
        // ========== 升级界面 ==========
        showLevelUpMenu(cards, callback) {
            this.currentScreen = 'levelup';
            this.ui.clearLayer('overlay');
            
            const cx = this.width / 2;
            const cy = this.height / 2;
            
            // 半透明背景
            const bg = {
                x: 0, y: 0,
                visible: true,
                draw: (ctx) => {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(0, 0, this.width, this.height);
                }
            };
            this.ui.add(bg, 'overlay');
            
            // 标题
            const title = new Label(cx, 50, '顿悟机缘', {
                fontSize: 32,
                color: '#f1c40f',
                align: 'center',
                shadow: { color: '#000', blur: 10 }
            });
            this.ui.add(title, 'overlay');
            
            // 卡片
            const cardWidth = Math.min(120, (this.width - 80) / 3);
            const cardHeight = 160;
            const totalWidth = cardWidth * cards.length + 20 * (cards.length - 1);
            const startX = cx - totalWidth / 2;
            
            cards.forEach((cardData, i) => {
                const card = new Card(
                    startX + i * (cardWidth + 20),
                    cy - cardHeight / 2,
                    cardWidth,
                    cardHeight,
                    {
                        icon: cardData.icon || '⚔️',
                        title: cardData.name,
                        description: cardData.desc,
                        onClick: () => {
                            this.hideLevelUpMenu();
                            if (callback) callback(cardData);
                        }
                    }
                );
                this.ui.add(card, 'overlay');
            });
        }
        
        hideLevelUpMenu() {
            this.ui.clearLayer('overlay');
            this.currentScreen = 'playing';
        }
        
        // ========== 技能选择界面 ==========
        showSkillMenu(skills, callback) {
            this.currentScreen = 'skill';
            this.ui.clearLayer('overlay');
            
            const cx = this.width / 2;
            const cy = this.height / 2;
            
            // 半透明背景
            const bg = {
                x: 0, y: 0,
                visible: true,
                draw: (ctx) => {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(0, 0, this.width, this.height);
                }
            };
            this.ui.add(bg, 'overlay');
            
            // 标题
            const title = new Label(cx, 40, '⚔️ 波次通过 · 选择功法 ⚔️', {
                fontSize: 24,
                color: '#f1c40f',
                align: 'center',
                shadow: { color: '#000', blur: 10 }
            });
            this.ui.add(title, 'overlay');
            
            // 技能卡片
            const cardWidth = Math.min(150, (this.width - 60) / skills.length);
            const cardHeight = 180;
            const totalWidth = cardWidth * skills.length + 15 * (skills.length - 1);
            const startX = cx - totalWidth / 2;
            
            skills.forEach((skill, i) => {
                const card = new Card(
                    startX + i * (cardWidth + 15),
                    cy - cardHeight / 2,
                    cardWidth,
                    cardHeight,
                    {
                        icon: skill.icon || '✨',
                        title: skill.name,
                        description: skill.desc,
                        bgColor: 'rgba(40, 20, 50, 0.95)',
                        borderColor: '#9c27b0',
                        borderColorHover: '#e040fb',
                        onClick: () => {
                            this.hideSkillMenu();
                            if (callback) callback(skill);
                        }
                    }
                );
                this.ui.add(card, 'overlay');
            });
        }
        
        hideSkillMenu() {
            this.ui.clearLayer('overlay');
            this.currentScreen = 'playing';
        }
        
        // ========== 胜利界面 ==========
        showVictoryMenu(stats) {
            this.currentScreen = 'victory';
            this.ui.clearLayer('overlay');
            this.destroyJoystick();
            
            const cx = this.width / 2;
            const cy = this.height / 2;
            const panelWidth = Math.min(320, this.width - 40);
            const panelHeight = 350;
            
            // 面板
            const panel = new Panel(
                cx - panelWidth / 2,
                cy - panelHeight / 2,
                panelWidth,
                panelHeight,
                {
                    bgColor: 'rgba(20, 30, 20, 0.95)',
                    borderColor: '#27ae60',
                    title: '✨ 血色秘境 · 通关 ✨',
                    titleColor: '#f1c40f',
                    titleFontSize: 24
                }
            );
            this.ui.add(panel, 'overlay');
            
            // 统计信息
            const statY = 70;
            const statItems = [
                { label: '击杀妖兽:', value: stats.kills, unit: '只' },
                { label: '获得金币:', value: stats.gold, unit: '💰', color: '#f1c40f' },
                { label: '通关用时:', value: stats.time, unit: '' },
                { label: '评价:', value: stats.stars, unit: '', color: '#f1c40f' }
            ];
            
            statItems.forEach((item, i) => {
                const label = new Label(30, statY + i * 35, item.label, {
                    fontSize: 14,
                    color: '#aaa',
                    align: 'left'
                });
                panel.addChild(label);
                
                const value = new Label(panelWidth - 30, statY + i * 35, `${item.value} ${item.unit}`, {
                    fontSize: 16,
                    color: item.color || '#fff',
                    align: 'right'
                });
                panel.addChild(value);
            });
            
            // 再次挑战按钮
            const retryBtn = new Button(
                30,
                panelHeight - 100,
                panelWidth - 60,
                40,
                '再次挑战',
                {
                    fontSize: 16,
                    bgColor: 'rgba(39, 174, 96, 0.9)',
                    borderColor: '#2ecc71',
                    onClick: () => this.restartGame()
                }
            );
            panel.addChild(retryBtn);
            
            // 返回按钮
            const backBtn = new Button(
                30,
                panelHeight - 50,
                panelWidth - 60,
                35,
                '返回山门',
                {
                    fontSize: 14,
                    bgColor: 'rgba(80, 80, 80, 0.8)',
                    borderColor: '#666',
                    onClick: () => this.backToMain()
                }
            );
            panel.addChild(backBtn);
        }
        
        // ========== 失败界面 ==========
        showDefeatMenu(stats) {
            this.currentScreen = 'defeat';
            this.ui.clearLayer('overlay');
            this.destroyJoystick();
            
            const cx = this.width / 2;
            const cy = this.height / 2;
            const panelWidth = Math.min(320, this.width - 40);
            const panelHeight = 320;
            
            // 面板
            const panel = new Panel(
                cx - panelWidth / 2,
                cy - panelHeight / 2,
                panelWidth,
                panelHeight,
                {
                    bgColor: 'rgba(30, 15, 15, 0.95)',
                    borderColor: '#8b0000',
                    title: '💀 试炼失败 💀',
                    titleColor: '#e74c3c',
                    titleFontSize: 24
                }
            );
            this.ui.add(panel, 'overlay');
            
            // 统计信息
            const statY = 70;
            const statItems = [
                { label: '坚持到:', value: `第 ${stats.wave} 波`, unit: '' },
                { label: '击杀妖兽:', value: stats.kills, unit: '只' },
                { label: '获得金币:', value: Math.floor(stats.gold * 0.5), unit: '💰 (保留50%)', color: '#f1c40f' }
            ];
            
            statItems.forEach((item, i) => {
                const label = new Label(30, statY + i * 35, item.label, {
                    fontSize: 14,
                    color: '#aaa',
                    align: 'left'
                });
                panel.addChild(label);
                
                const value = new Label(panelWidth - 30, statY + i * 35, `${item.value} ${item.unit}`, {
                    fontSize: 16,
                    color: item.color || '#fff',
                    align: 'right'
                });
                panel.addChild(value);
            });
            
            // 引用
            const quote = new Label(panelWidth / 2, statY + 120, '"修为尚浅，来日再战"', {
                fontSize: 14,
                color: '#888',
                align: 'center'
            });
            panel.addChild(quote);
            
            // 再次挑战按钮
            const retryBtn = new Button(
                30,
                panelHeight - 100,
                panelWidth - 60,
                40,
                '再次挑战',
                {
                    fontSize: 16,
                    bgColor: 'rgba(139, 0, 0, 0.9)',
                    borderColor: '#ff6b6b',
                    onClick: () => this.restartGame()
                }
            );
            panel.addChild(retryBtn);
            
            // 返回按钮
            const backBtn = new Button(
                30,
                panelHeight - 50,
                panelWidth - 60,
                35,
                '返回山门',
                {
                    fontSize: 14,
                    bgColor: 'rgba(80, 80, 80, 0.8)',
                    borderColor: '#666',
                    onClick: () => this.backToMain()
                }
            );
            panel.addChild(backBtn);
        }
        
        // 重新开始游戏
        restartGame() {
            this.ui.clearAll();
            this.startGame();
        }
        
        // 销毁摇杆
        destroyJoystick() {
            if (this.joystick) {
                this.joystick.destroy();
                this.joystick = null;
            }
        }
        
        // ========== 倒计时界面 ==========
        showCountdown(number, text, callback) {
            this.ui.clearLayer('popup');
            
            const cx = this.width / 2;
            const cy = this.height / 2;
            
            // 数字
            const numLabel = new Label(cx, cy - 30, String(number), {
                fontSize: 120,
                color: '#ff4444',
                align: 'center',
                shadow: { color: '#000', blur: 20 }
            });
            this.ui.add(numLabel, 'popup');
            
            // 文字
            const textLabel = new Label(cx, cy + 60, text, {
                fontSize: 24,
                color: '#ffcc00',
                align: 'center'
            });
            this.ui.add(textLabel, 'popup');
            
            // 1秒后自动关闭
            setTimeout(() => {
                this.ui.clearLayer('popup');
                if (callback) callback();
            }, 1000);
        }
        
        // ========== 更新方法 ==========
        
        // 更新 HUD 数据
        updateHUD(data) {
            Object.assign(this.hudData, data);
        }
        
        // 显示/隐藏 BOSS 血条
        showBossHUD(name, hp, maxHp) {
            this.bossHud.visible = true;
            this.bossHud.name = name;
            this.bossHud.hp = hp;
            this.bossHud.maxHp = maxHp;
        }
        
        hideBossHUD() {
            this.bossHud.visible = false;
        }
        
        updateBossHP(hp) {
            this.bossHud.hp = hp;
        }
        
        // 更新
        update(dt) {
            this.ui.update(dt);
            
            if (this.joystick) {
                this.joystick.update(dt);
            }
        }
        
        // 绘制
        draw() {
            // 绘制 UI 组件
            this.ui.draw();
            
            // 绘制摇杆（在游戏中）
            if (this.joystick && this.currentScreen === 'playing') {
                this.joystick.draw(this.ctx);
            }
        }
        
        // 获取摇杆方向
        getJoystickDirection() {
            if (this.joystick) {
                return this.joystick.getDirection();
            }
            return { x: 0, y: 0, force: 0, active: false };
        }
    }

    // ========== 微信/抖音小游戏入口 ==========
    // 灵剑 · 血色秘境


    console.log('[game.js] 所有模块加载完成');

    // 获取小游戏 API
    const api = typeof wx !== 'undefined' ? wx : (typeof tt !== 'undefined' ? tt : null);

    // 获取系统信息
    const systemInfo = api.getSystemInfoSync();
    console.log('[game.js] 系统信息:', systemInfo);

    // 获取主画布（由 weapp-adapter 创建的第一个 canvas）
    const canvas$1 = GameGlobal.canvas || api.createCanvas();
    const ctx = canvas$1.getContext('2d');

    // 设置画布大小
    canvas$1.width = systemInfo.windowWidth;
    canvas$1.height = systemInfo.windowHeight;

    const width = systemInfo.windowWidth;
    const height = systemInfo.windowHeight;

    console.log(`[game.js] 画布: ${width}x${height}`);

    // 设置全局 canvas
    if (typeof GameGlobal !== 'undefined') {
        GameGlobal.canvas = canvas$1;
        GameGlobal.screenWidth = width;
        GameGlobal.screenHeight = height;
    }

    // 显示加载中
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f1c40f';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('灵剑 · 血色秘境', width / 2, height / 2 - 30);
    ctx.fillStyle = '#888';
    ctx.font = '16px sans-serif';
    ctx.fillText('正在初始化...', width / 2, height / 2 + 10);

    // 初始化游戏
    try {
        console.log('[game.js] 创建引擎...');
        
        // 创建游戏引擎
        const engine = new UnifiedArenaEngine(canvas$1, width, height);
        
        // 创建游戏 UI
        const gameUI = new GameUI(canvas$1, engine, width, height);
        
        // 连接引擎和 UI
        engine.setUI(gameUI);
        
        // 暴露到全局
        GameGlobal.Game = engine;
        GameGlobal.GameUI = gameUI;
        
        console.log('[game.js] 引擎创建完成，启动游戏循环...');
        
        // 游戏主循环
        let lastTime = Date.now();
        
        function gameLoop() {
            const currentTime = Date.now();
            const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
            lastTime = currentTime;
            
            // 清空画布
            ctx.fillStyle = '#1a0a0a';
            ctx.fillRect(0, 0, width, height);
            
            // 更新
            gameUI.update(dt);
            if (engine.state === 'PLAY') {
                engine.update(dt);
            }
            
            // 绘制
            if (engine.state !== 'MENU') {
                engine.draw();
            }
            gameUI.draw();
            
            // 下一帧
            requestAnimationFrame(gameLoop);
        }
        
        // 启动游戏循环
        requestAnimationFrame(gameLoop);
        
        console.log('[game.js] 灵剑 · 血色秘境 启动完成!');
        
    } catch (err) {
        console.error('[game.js] 初始化失败:', err);
        console.error(err.stack || err);
        
        // 显示错误
        ctx.fillStyle = '#1a0a0a';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ff4444';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('初始化失败', width / 2, height / 2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        const errMsg = String(err.message || err);
        ctx.fillText(errMsg.substring(0, 50), width / 2, height / 2 + 20);
    }

    // 全局错误处理
    if (api && api.onError) {
        api.onError((err) => {
            console.error('[game.js] 运行时错误:', err);
        });
    }

})();
