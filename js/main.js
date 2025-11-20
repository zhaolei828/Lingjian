import { GameEngine } from './engine.js';
import { initAvatar } from './assets.js';
import { SKILLS } from './data.js';

// Initialize Game instance globally
window.Game = new GameEngine();

// Define global UI functions required by HTML onclick handlers
window.showUpgradeMenu = function() { 
    window.Game.pause(); 
    const c = document.getElementById('card-container'); 
    c.innerHTML = ''; 
    document.getElementById('levelup-menu').classList.remove('hidden'); 
    
    // Randomly select skills
    const opts = [...SKILLS].sort(() => Math.random() - 0.5).slice(0, 3); 
    
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

// Initialize Avatar with a slight delay to ensure Assets are ready
setTimeout(() => {
    initAvatar();
}, 100);

