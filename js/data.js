export const SVG_LIB = {
    player: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="g"><feGaussianBlur stdDeviation="2"/></filter></defs><ellipse cx="64" cy="110" rx="30" ry="10" fill="rgba(0,0,0,0.5)"/><path d="M30 80 Q10 90 20 110" stroke="#3498db" stroke-width="4" fill="none"/><path d="M98 80 Q118 90 108 110" stroke="#3498db" stroke-width="4" fill="none"/><path d="M44 70 Q64 120 84 70 L 84 50 L 44 50 Z" fill="#ecf0f1"/><rect x="44" y="50" width="40" height="30" fill="#ecf0f1"/><path d="M44 50 L44 100 L64 90 L84 100 L84 50" fill="none" stroke="#2c3e50" stroke-width="2"/><path d="M64 50 L64 100" stroke="#3498db" stroke-width="4"/><circle cx="64" cy="40" r="22" fill="#ffe0b2"/><path d="M40 30 Q64 10 88 30 Q90 50 86 60 Q64 65 42 60 Q38 50 40 30" fill="#2c3e50"/><circle cx="64" cy="15" r="10" fill="#2c3e50"/><rect x="59" y="10" width="10" height="5" fill="#f1c40f"/><circle cx="56" cy="42" r="2" fill="#000"/><circle cx="72" cy="42" r="2" fill="#000"/></svg>`,
    
    sword: `<svg width="64" height="128" viewBox="0 0 64 128" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#00bcd4"/></linearGradient></defs><path d="M32 0 L22 20 L28 100 L36 100 L42 20 Z" fill="url(#sg)"/><rect x="20" y="90" width="24" height="6" fill="#f1c40f"/><circle cx="32" cy="110" r="4" fill="#f1c40f"/></svg>`,
    
    fire: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="fg"><stop offset="0%" stop-color="#ffff00"/><stop offset="50%" stop-color="#ff5722"/><stop offset="100%" stop-color="rgba(255,0,0,0)"/></radialGradient></defs><circle cx="32" cy="32" r="28" fill="url(#fg)"/><path d="M32 60 Q10 40 32 10 Q54 40 32 60" fill="#ff9800" opacity="0.7"/></svg>`,
    
    thunder: `<svg width="40" height="100" viewBox="0 0 40 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 0 L0 40 L15 40 L5 100 L35 50 L20 50 L40 10 Z" fill="#fff" stroke="#ffeb3b" stroke-width="2" stroke-linejoin="round"/></svg>`,

    leaf: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M24 46 Q4 30 4 14 Q4 2 24 2 Q44 2 44 14 Q44 30 24 46 M24 2 L24 46" fill="#2ecc71" stroke="#27ae60" stroke-width="2"/></svg>`,
    ice: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M24 0 L30 18 L48 24 L30 30 L24 48 L18 30 L0 24 L18 18 Z" fill="#e1f5fe" stroke="#03a9f4" stroke-width="2"/></svg>`,
    
    rock_b: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M10 30 L5 20 L15 5 L30 8 L35 25 L25 35 Z" fill="#795548" stroke="#5d4037" stroke-width="2"/></svg>`,

    bat: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 40 Q60 10 60 30 L32 50 L4 30 Q4 10 32 40" fill="#c0392b"/><circle cx="25" cy="35" r="2" fill="#ffeb3b"/><circle cx="39" cy="35" r="2" fill="#ffeb3b"/></svg>`,
    bat_fire: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 40 Q60 10 60 30 L32 50 L4 30 Q4 10 32 40" fill="#ff5722"/><circle cx="25" cy="35" r="2" fill="#ffeb3b"/><circle cx="39" cy="35" r="2" fill="#ffeb3b"/></svg>`,
    ghost: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="30" r="20" fill="#009688" opacity="0.6"/><path d="M12 30 Q32 60 52 30" fill="none" stroke="#004d40" stroke-width="2"/><circle cx="25" cy="25" r="3" fill="#000"/><circle cx="39" cy="25" r="3" fill="#000"/></svg>`,
    ghost_ice: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="30" r="20" fill="#03a9f4" opacity="0.6"/><path d="M12 30 Q32 60 52 30" fill="none" stroke="#0277bd" stroke-width="2"/><circle cx="25" cy="25" r="3" fill="#000"/><circle cx="39" cy="25" r="3" fill="#000"/></svg>`,
    rock: `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><path d="M20 60 L10 40 L30 10 L60 15 L70 50 L50 70 Z" fill="#5d4037"/><rect x="25" y="35" width="10" height="10" fill="#ff5722"/></svg>`,
    chest: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="24" width="40" height="28" rx="4" fill="#f39c12" stroke="#e67e22" stroke-width="2"/><path d="M12 24 L20 12 L44 12 L52 24" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/><rect x="28" y="32" width="8" height="10" fill="#e74c3c" rx="1"/><circle cx="32" cy="37" r="2" fill="#f1c40f"/></svg>`,
    
    pavilion: `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="M60 10 L10 40 L20 40 L15 55 L105 55 L100 40 L110 40 Z" fill="#c0392b" stroke="#a93226" stroke-width="2"/><rect x="25" y="55" width="10" height="45" fill="#8e44ad"/><rect x="85" y="55" width="10" height="45" fill="#8e44ad"/><rect x="35" y="90" width="50" height="10" fill="#d35400"/><path d="M10 100 L110 100 L100 110 L20 110 Z" fill="#bdc3c7"/></svg>`,
    gate: `<svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="10" height="100" fill="#95a5a6"/><rect x="80" y="20" width="10" height="100" fill="#95a5a6"/><rect x="5" y="30" width="90" height="10" fill="#bdc3c7"/><path d="M0 20 L50 5 L100 20 L100 30 L0 30 Z" fill="#34495e" stroke="#2c3e50"/><rect x="30" y="40" width="40" height="10" fill="#f1c40f"/></svg>`,
    pine: `<svg width="80" height="120" viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg"><path d="M40 10 L10 50 L70 50 Z" fill="#2ecc71" stroke="#27ae60"/><path d="M40 40 L5 80 L75 80 Z" fill="#27ae60" stroke="#2ecc71"/><path d="M40 70 L0 110 L80 110 Z" fill="#1e8449" stroke="#27ae60"/><rect x="35" y="110" width="10" height="10" fill="#795548"/><path d="M10 50 L20 50 L15 60 L25 60" stroke="white" fill="none" stroke-width="2" opacity="0.7"/></svg>`,
    tree_forest: `<svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><path d="M50 110 L50 50" stroke="#4e342e" stroke-width="14"/><path d="M50 50 Q20 30 10 60 Q0 30 30 10 Q10 -10 50 10 Q90 -10 70 10 Q100 30 90 60 Q80 30 50 50" fill="#1b5e20" stroke="#2e7d32" stroke-width="2"/><path d="M45 110 L30 120 M55 110 L70 120" stroke="#4e342e" stroke-width="6"/></svg>`,
    bush: `<svg width="60" height="40" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="25" r="15" fill="#2e7d32"/><circle cx="45" cy="25" r="15" fill="#2e7d32"/><circle cx="30" cy="15" r="18" fill="#388e3c"/></svg>`,
    stone_s: `<svg width="60" height="50" viewBox="0 0 60 50" xmlns="http://www.w3.org/2000/svg"><path d="M10 50 L0 30 L20 10 L40 5 L60 30 L50 50 Z" fill="#7f8c8d"/><path d="M20 10 L40 5 L50 20 L10 20 Z" fill="#fff" opacity="0.9"/></svg>`,
    
    // Chinese Tomb Assets
    grave_mound: `<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><path d="M10 60 Q50 -20 90 60 Z" fill="#5d4037"/><path d="M20 50 Q50 0 80 50" fill="none" stroke="#795548" stroke-width="2"/><circle cx="30" cy="55" r="2" fill="#3e2723"/><circle cx="70" cy="55" r="2" fill="#3e2723"/><path d="M40 60 L40 45 L45 40 L50 45 L50 60 Z" fill="#7f8c8d" opacity="0.8"/></svg>`,
    stele_c: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M5 40 L5 15 Q20 0 35 15 L35 40 Z" fill="#757575" stroke="#424242"/><rect x="12" y="20" width="16" height="20" fill="#424242"/><path d="M15 25 L25 25 M15 35 L25 35" stroke="#9e9e9e" stroke-width="2"/></svg>`,
    paper_money_r: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8" fill="#ecf0f1" stroke="#bdc3c7"/><rect x="8" y="8" width="4" height="4" fill="#bdc3c7"/></svg>`,
    paper_money_s: `<svg width="20" height="25" viewBox="0 0 20 25" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="16" height="21" fill="#f1c40f" stroke="#f39c12"/><circle cx="10" cy="12" r="4" fill="none" stroke="#e67e22"/></svg>`,
    
    crystal: `<svg width="50" height="80" viewBox="0 0 50 80" xmlns="http://www.w3.org/2000/svg"><path d="M25 0 L50 30 L25 80 L0 30 Z" fill="#4fc3f7" opacity="0.8"/><path d="M25 0 L25 80" stroke="#e1f5fe" stroke-width="2"/><path d="M0 30 L50 30" stroke="#e1f5fe" stroke-width="1" opacity="0.5"/></svg>`,
    magma_rock: `<svg width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg"><path d="M35 5 L65 35 L50 65 L20 65 L5 35 Z" fill="#3e2723"/><path d="M35 5 L35 35 L65 35" fill="none" stroke="#ff5722" stroke-width="3"/><path d="M20 55 L35 35 L50 65" fill="none" stroke="#ff5722" stroke-width="3"/></svg>`,
    
    dead_tree: `<svg width="80" height="100" viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg"><path d="M40 100 L40 40" stroke="#2d3436" stroke-width="8"/><path d="M40 70 L20 50 M40 60 L60 40 M40 40 L20 20 M40 45 L50 25" stroke="#2d3436" stroke-width="4" stroke-linecap="round"/></svg>`,
    broken_sword: `<svg width="40" height="60" viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg"><path d="M20 0 L20 40" stroke="#7f8c8d" stroke-width="4"/><rect x="10" y="10" width="20" height="4" fill="#34495e"/><path d="M20 40 L15 50 L25 50 Z" fill="#7f8c8d"/></svg>`,
    ruin_pillar: `<svg width="50" height="80" viewBox="0 0 50 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="30" height="60" fill="#555"/><path d="M10 20 L40 30 L40 40 L10 30 Z" fill="#444"/><path d="M15 50 L35 50 M15 60 L35 60" stroke="#333" stroke-width="2"/></svg>`
};

export const STAGES = [
    { name: '幽暗密林', time: 0, bg: '#0f1519', grid: '#1c262b', mobs: ['bat'] },
    { name: '埋骨之地', time: 60, bg: '#202020', grid: '#333333', mobs: ['bat', 'ghost'] },
    { name: '熔岩炼狱', time: 120, bg: '#1a0505', grid: '#3d0e0e', mobs: ['bat_fire', 'rock'] },
    { name: '极寒冰原', time: 180, bg: '#050a1a', grid: '#0e1e3d', mobs: ['ghost_ice', 'rock'] },
    { name: '昆仑仙境', time: 300, bg: '#2c3e50', grid: '#34495e', mobs: ['bat_fire', 'ghost_ice', 'rock'] }
];

export const SKILLS = [
    { id:'sword_mult', name:'万剑归宗', desc:'飞剑数量 +1', icon:'⚔️', effect:s=>s.count++ },
    { id:'dmg', name:'太乙剑气', desc:'基础伤害 +20', icon:'💪', effect:s=>s.dmg+=20 },
    { id:'spd', name:'御剑术', desc:'攻速 +15%', icon:'🌪️', effect:s=>s.cd*=0.85 },
    { id:'fire', name:'红莲业火', desc:'<b>[火系]</b> 攻击转化为爆裂火球', icon:'🔥', rare:'fire', effect:s=>{s.element='fire'; s.dmg+=10; s.spd*=0.8;} },
    { id:'thunder', name:'九天神雷', desc:'<b>[雷系]</b> 攻击转化为极速闪电', icon:'⚡', rare:'thunder', effect:s=>{s.element='thunder'; s.cd*=0.7; s.dmg*=0.8;} },
    { id:'wood', name:'青帝长生', desc:'<b>[木系]</b> 攻击附带穿透效果', icon:'🍃', rare:'wood', effect:s=>{s.element='wood'; s.pierce=3; s.dmg*=0.8;} },
    { id:'water', name:'玄冥寒冰', desc:'<b>[水系]</b> 攻击造成大幅减速', icon:'❄️', rare:'water', effect:s=>{s.element='water'; s.dmg*=0.9;} },
    { id:'earth', name:'厚土泰山', desc:'<b>[土系]</b> 攻击附带巨额击退', icon:'⛰️', rare:'earth', effect:s=>{s.element='earth'; s.dmg*=1.5; s.spd*=0.6;} }
];
