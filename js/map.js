import { STAGES } from './data.js';

export function generateStagePattern(stageIdx) {
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

function drawVoid(ctx, size) {
    // Stars
    ctx.fillStyle = '#fff';
    for(let i=0; i<80; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 1.2;
        ctx.globalAlpha = 0.3 + Math.random()*0.7;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
    // Nebula
    ctx.globalAlpha = 0.1;
    const grad = ctx.createRadialGradient(Math.random()*size, Math.random()*size, 0, size/2, size/2, size);
    grad.addColorStop(0, '#4a148c');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,size,size);
    ctx.globalAlpha = 1.0;
}

