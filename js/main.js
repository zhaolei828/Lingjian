import { GameEngine } from './engine.js';
import { initAvatar } from './assets.js';
import { SKILLS, ROLES, SVG_LIB } from './data.js';

// Initialize Game instance globally
window.Game = new GameEngine();
window.currentRole = 'sword';

function initRoleSelection() {
    const container = document.getElementById('role-select-container');
    if (!container) return;
    container.innerHTML = '';

    ROLES.forEach(role => {
        const card = document.createElement('div');
        card.className = `role-card ${role.id === window.currentRole ? 'selected' : ''}`;
        card.dataset.id = role.id;
        card.onclick = () => window.selectRole(role.id);

        // Normalize stats for bars (approximate max values)
        const hpPct = Math.min(100, (role.hp / 200) * 100);
        const dmgPct = Math.min(100, (role.dmg / 30) * 100);
        const asPct = Math.min(100, ((1.5 - role.cd) / 1.2) * 100); // Inverse CD
        const spdPct = Math.min(100, ((role.speed - 100) / 80) * 100); // 100-180 range

        card.innerHTML = `
            <div class="role-icon">${SVG_LIB[role.svg] || SVG_LIB.player}</div>
            <h4>${role.name}</h4>
            <p>${role.desc}</p>
            <div class="stat-box">
                <div class="stat-row"><div class="stat-label">血</div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${hpPct}%; background:#e74c3c"></div></div></div>
                <div class="stat-row"><div class="stat-label">攻</div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${dmgPct}%; background:#e67e22"></div></div></div>
                <div class="stat-row"><div class="stat-label">速</div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${asPct}%; background:#f1c40f"></div></div></div>
                <div class="stat-row"><div class="stat-label">移</div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${spdPct}%; background:#3498db"></div></div></div>
            </div>
        `;
        container.appendChild(card);
    });
}

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
    initRoleSelection();
}, 100);
