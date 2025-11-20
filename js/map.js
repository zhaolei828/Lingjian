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
        case 4: // Fairyland
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

