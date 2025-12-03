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
    
    // 模拟 encodeURIComponent（如果需要）
    if (typeof encodeURIComponent === 'undefined') {
        // 小游戏通常已有此函数
    }
    
    console.log('[weapp-adapter] 小游戏适配层加载完成');
}

