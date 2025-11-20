import { SVG_LIB } from './data.js';

export const Assets = {};

export function loadAssets() {
    for (let key in SVG_LIB) {
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(SVG_LIB[key])));
        Assets[key] = img;
    }
    // Player avatar loaded later or inserted into DOM, logic was:
    // setTimeout(() => document.getElementById('avatar-container').appendChild(Assets['player'].cloneNode()), 100);
    // We can export a init function
}

export function initAvatar() {
    const container = document.getElementById('avatar-container');
    if(container && Assets['player']) {
        container.appendChild(Assets['player'].cloneNode());
    }
}

