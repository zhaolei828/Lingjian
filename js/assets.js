import { SVG_LIB } from './data.js';
import { getResource, preloadResources } from './libs/resource-cache.js';

export const Assets = {};

// ============================================
// 【配置开关】角色素材模式
// true  = 使用 PNG 图片（精美素材）
// false = 使用 SVG 矢量图（Q版手绘）
// ============================================
const USE_PNG_PLAYERS = true;

// 判断是否是小游戏生产环境
const isMinigame = typeof wx !== 'undefined';

// CDN 网络图片
const CDN_BASE = 'https://6jlife.oss-cn-shenzhen.aliyuncs.com/Lingjian/img/player/';

// 资源配置（key: 资源标识, value: CDN URL）
const PNG_PLAYERS = {
    'player_sword': CDN_BASE + '%E5%A4%A9%E5%89%91%E5%AE%97%E8%A7%92%E8%89%B2_%E9%80%8F%E6%98%8E%E5%9B%BE.png',
    'player_mage': CDN_BASE + '%E7%8E%84%E5%85%83%E9%81%93_%E9%80%8F%E6%98%8E%E5%9B%BE.png',
    'player_body': CDN_BASE + '%E8%8D%92%E5%8F%A4%E9%97%A8%E8%A7%92%E8%89%B2_%E9%80%8F%E6%98%8E%E5%9B%BE.png',
    'player_ghost': CDN_BASE + '%E5%B9%BD%E5%86%A5%E6%B6%A7%E8%A7%92%E8%89%B2_%E9%80%8F%E6%98%8E%E5%9B%BE.png',
    'player_formation': CDN_BASE + '%E5%A4%A9%E6%9C%BA%E9%98%81_%E9%80%8F%E6%98%8E%E5%9B%BE.png'
};

export async function loadAssets(onProgress) {
    const promises = [];
    const total = Object.keys(PNG_PLAYERS).length;
    let loaded = 0;
    
    if (USE_PNG_PLAYERS) {
        // 加载 PNG 角色图片
        for (let key in PNG_PLAYERS) {
            const url = PNG_PLAYERS[key];
            
            const promise = (async () => {
                try {
                    // 小游戏环境：使用缓存管理器获取资源路径
                    const resourcePath = isMinigame 
                        ? await getResource(url, key.replace('player_', '') + '.png')
                        : url;
                    
                    const img = isMinigame ? wx.createImage() : new Image();
                    
                    await new Promise((resolve) => {
                        img.onload = () => {
                            console.log(`[Assets] 加载成功: ${key}`);
                            resolve();
                        };
                        img.onerror = (e) => {
                            console.warn(`[Assets] 加载失败: ${key}`, e);
                            resolve();
                        };
                        img.src = resourcePath;
                    });
                    
                    Assets[key] = img;
                    loaded++;
                    if (onProgress) onProgress(loaded, total, key);
                } catch (e) {
                    console.warn(`[Assets] 资源获取失败: ${key}`, e);
                    loaded++;
                    if (onProgress) onProgress(loaded, total, key);
                }
            })();
            
            promises.push(promise);
        }
    }
    
    // 加载 SVG 资源（小游戏环境跳过，因为不支持 btoa 和 SVG data URL）
    if (!isMinigame) {
        for (let key in SVG_LIB) {
            // 如果启用 PNG 模式，跳过角色 SVG
            if (USE_PNG_PLAYERS && PNG_PLAYERS[key]) continue;
            
            const img = new Image();
            try {
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(SVG_LIB[key])));
                Assets[key] = img;
            } catch (e) {
                console.warn(`[Assets] SVG加载失败: ${key}`, e);
            }
        }
    }
    
    await Promise.all(promises);
    console.log(`[Assets] 资源加载完成: ${loaded}/${total}`);
}

export function initAvatar(roleId = 'player_sword') {
    const container = document.getElementById('avatar-container');
    if(container) {
        container.innerHTML = ''; // 清空
        const svgKey = 'player_' + roleId.replace('player_', '');
        const actualKey = PNG_PLAYERS[svgKey] ? svgKey : 'player_sword';
        if (Assets[actualKey]) {
            const img = Assets[actualKey].cloneNode();
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            container.appendChild(img);
        }
    }
}

