import { GameEngine } from './engine.js';
import { initAvatar } from './assets.js';
import { SKILLS, ROLES } from './data.js';

// Initialize Game instance globally
window.Game = new GameEngine();
window.currentRole = 'sword';

// Define global UI functions required by HTML onclick handlers
window.showUpgradeMenu = function() { 
    window.Game.pause(); 
    const c = document.getElementById('card-container'); 
    c.innerHTML = ''; 
    document.getElementById('levelup-menu').classList.remove('hidden'); 
    
    // Build Skill Pool based on Role
    const roleId = window.Game.player.role.id;
    const pool = [...SKILLS.common, ...(SKILLS[roleId] || [])];
    
    // Randomly select 3 unique skills
    const opts = [];
    const tempPool = [...pool];
    for(let i=0; i<3; i++) {
        if(tempPool.length === 0) break;
        const idx = Math.floor(Math.random() * tempPool.length);
        opts.push(tempPool[idx]);
        tempPool.splice(idx, 1);
    }
    
    opts.forEach(sk => { 
        const d = document.createElement('div'); 
        d.className = 'card ' + (sk.rare ? `rare-${sk.rare}` : ''); 
        d.innerHTML = `<div class="card-icon">${sk.icon}</div><h3>${sk.name}</h3><p>${sk.desc}</p>`; 
        d.onclick = () => { 
            sk.effect(window.Game.player.stats); 
            document.getElementById('levelup-menu').classList.add('hidden'); 
            window.Game.resume(); 
        }; 
        c.appendChild(d); 
    }); 
};

window.showManual = function() {
    document.getElementById('start-menu').classList.add('hidden');
    document.getElementById('manual-menu').classList.remove('hidden');
};

window.hideManual = function() {
    document.getElementById('manual-menu').classList.add('hidden');
    document.getElementById('start-menu').classList.remove('hidden');
};

window.selectRole = function(roleId) {
    window.currentRole = roleId;
    // Update UI visual
    document.querySelectorAll('.role-card').forEach(el => {
        el.classList.remove('selected');
        if(el.dataset.id === roleId) el.classList.add('selected');
    });
};

window.startGame = function(stageIdx) {
    window.Game.start(stageIdx, window.currentRole);
};

// Initialize Avatar with a slight delay to ensure Assets are ready
setTimeout(() => {
    initAvatar();
}, 100);
