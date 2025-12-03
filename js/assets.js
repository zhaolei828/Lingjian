import { SVG_LIB } from './data.js';

export const Assets = {};

// ============================================
// 【配置开关】角色素材模式
// true  = 使用 PNG 图片（精美素材）
// false = 使用 SVG 矢量图（Q版手绘）
// ============================================
const USE_PNG_PLAYERS = true;

// PNG 角色图片映射
const PNG_PLAYERS = {
    'player_sword': 'img/player/sword.png',
    'player_mage': 'img/player/mage.png',
    'player_body': 'img/player/body.png',
    'player_ghost': 'img/player/ghost.png',
    'player_formation': 'img/player/formation.png'
};

export function loadAssets() {
    const promises = [];
    
    if (USE_PNG_PLAYERS) {
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
        if (USE_PNG_PLAYERS && PNG_PLAYERS[key]) continue;
        
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(SVG_LIB[key])));
        Assets[key] = img;
    }
    
    return Promise.all(promises);
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

