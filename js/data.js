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
    chest: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="24" width="40" height="28" rx="4" fill="#f39c12" stroke="#e67e22" stroke-width="2"/><path d="M12 24 L20 12 L44 12 L52 24" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/><rect x="28" y="32" width="8" height="10" fill="#e74c3c" rx="1"/><circle cx="32" cy="37" r="2" fill="#f1c40f"/></svg>`
};

export const STAGES = [
    { name: '幽暗密林', time: 0, bg: '#0f1519', grid: '#1c262b', mobs: ['bat'] },
    { name: '埋骨之地', time: 60, bg: '#202020', grid: '#333333', mobs: ['bat', 'ghost'] },
    { name: '熔岩炼狱', time: 120, bg: '#1a0505', grid: '#3d0e0e', mobs: ['bat_fire', 'rock'] },
    { name: '极寒冰原', time: 180, bg: '#050a1a', grid: '#0e1e3d', mobs: ['ghost_ice', 'rock'] },
    { name: '天外虚空', time: 300, bg: '#000000', grid: '#222', mobs: ['bat_fire', 'ghost_ice', 'rock'] }
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

