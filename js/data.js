export const SVG_LIB = {
    // ... existing SVGs ...
    player: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="g"><feGaussianBlur stdDeviation="2"/></filter></defs><ellipse cx="64" cy="110" rx="30" ry="10" fill="rgba(0,0,0,0.5)"/><path d="M30 80 Q10 90 20 110" stroke="#3498db" stroke-width="4" fill="none"/><path d="M98 80 Q118 90 108 110" stroke="#3498db" stroke-width="4" fill="none"/><path d="M44 70 Q64 120 84 70 L 84 50 L 44 50 Z" fill="#ecf0f1"/><rect x="44" y="50" width="40" height="30" fill="#ecf0f1"/><path d="M44 50 L44 100 L64 90 L84 100 L84 50" fill="none" stroke="#2c3e50" stroke-width="2"/><path d="M64 50 L64 100" stroke="#3498db" stroke-width="4"/><circle cx="64" cy="40" r="22" fill="#ffe0b2"/><path d="M40 30 Q64 10 88 30 Q90 50 86 60 Q64 65 42 60 Q38 50 40 30" fill="#2c3e50"/><circle cx="64" cy="15" r="10" fill="#2c3e50"/><rect x="59" y="10" width="10" height="5" fill="#f1c40f"/><circle cx="56" cy="42" r="2" fill="#000"/><circle cx="72" cy="42" r="2" fill="#000"/></svg>`,
    
    // New Role SVGs
    player_sword: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <!-- 阴影 -->
        <ellipse cx="64" cy="120" rx="25" ry="8" fill="rgba(0,0,0,0.3)"/>
        <!-- 背后的剑 -->
        <rect x="85" y="25" width="6" height="70" rx="2" fill="#b0bec5" transform="rotate(15 88 60)"/>
        <path d="M88 20 L85 30 L91 30 Z" fill="#eceff1" transform="rotate(15 88 25)"/>
        <rect x="83" y="90" width="10" height="12" rx="2" fill="#5d4037" transform="rotate(15 88 96)"/>
        <!-- 身体/道袍 -->
        <path d="M44 75 Q44 120 64 115 Q84 120 84 75 L80 65 L48 65 Z" fill="#e3f2fd" stroke="#90caf9" stroke-width="1"/>
        <!-- 道袍领口 -->
        <path d="M52 65 L64 80 L76 65" fill="none" stroke="#1976d2" stroke-width="2"/>
        <!-- 腰带 -->
        <rect x="48" y="85" width="32" height="6" rx="2" fill="#1976d2"/>
        <!-- 小手 -->
        <circle cx="40" cy="85" r="8" fill="#ffcc80"/>
        <circle cx="88" cy="85" r="8" fill="#ffcc80"/>
        <!-- 袖子 -->
        <path d="M48 65 Q35 75 40 85" fill="#bbdefb" stroke="#90caf9"/>
        <path d="M80 65 Q93 75 88 85" fill="#bbdefb" stroke="#90caf9"/>
        <!-- 大头 -->
        <circle cx="64" cy="40" r="28" fill="#ffe0b2"/>
        <!-- 头发 -->
        <path d="M36 35 Q40 10 64 8 Q88 10 92 35 Q90 45 85 50 L80 35 Q64 40 48 35 L43 50 Q38 45 36 35" fill="#2c3e50"/>
        <!-- 发髻 -->
        <ellipse cx="64" cy="8" rx="10" ry="8" fill="#2c3e50"/>
        <rect x="62" y="2" width="4" height="12" fill="#f1c40f"/>
        <!-- 眼睛 -->
        <ellipse cx="54" cy="42" rx="5" ry="6" fill="#fff"/>
        <ellipse cx="74" cy="42" rx="5" ry="6" fill="#fff"/>
        <circle cx="55" cy="43" r="3" fill="#1a237e"/>
        <circle cx="75" cy="43" r="3" fill="#1a237e"/>
        <circle cx="56" cy="42" r="1" fill="#fff"/>
        <circle cx="76" cy="42" r="1" fill="#fff"/>
        <!-- 眉毛 -->
        <path d="M48 36 L60 38" stroke="#2c3e50" stroke-width="2" stroke-linecap="round"/>
        <path d="M68 38 L80 36" stroke="#2c3e50" stroke-width="2" stroke-linecap="round"/>
        <!-- 小嘴 -->
        <path d="M60 52 Q64 55 68 52" fill="none" stroke="#d7ccc8" stroke-width="2" stroke-linecap="round"/>
        <!-- 腮红 -->
        <ellipse cx="45" cy="48" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>
        <ellipse cx="83" cy="48" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>
    </svg>`,
    player_mage: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <!-- 阴影 -->
        <ellipse cx="64" cy="120" rx="25" ry="8" fill="rgba(0,0,0,0.3)"/>
        <!-- 身体/道袍 -->
        <path d="M42 75 Q40 120 64 115 Q88 120 86 75 L82 65 L46 65 Z" fill="#fff3e0" stroke="#ffb74d" stroke-width="1"/>
        <!-- 道袍火焰纹 -->
        <path d="M50 100 Q55 90 50 85 Q55 80 52 75" fill="none" stroke="#ff5722" stroke-width="2" opacity="0.6"/>
        <path d="M78 100 Q73 90 78 85 Q73 80 76 75" fill="none" stroke="#ff5722" stroke-width="2" opacity="0.6"/>
        <!-- 道袍领口 -->
        <path d="M52 65 L64 78 L76 65" fill="none" stroke="#e65100" stroke-width="2"/>
        <!-- 腰带 -->
        <rect x="46" y="85" width="36" height="6" rx="2" fill="#e65100"/>
        <circle cx="64" cy="88" r="4" fill="#ffc107"/>
        <!-- 小手 -->
        <circle cx="38" cy="82" r="8" fill="#ffcc80"/>
        <circle cx="90" cy="82" r="8" fill="#ffcc80"/>
        <!-- 袖子 -->
        <path d="M46 65 Q30 72 38 82" fill="#ffe0b2" stroke="#ffb74d"/>
        <path d="M82 65 Q98 72 90 82" fill="#ffe0b2" stroke="#ffb74d"/>
        <!-- 法印光效 -->
        <circle cx="38" cy="82" r="12" fill="none" stroke="#ff9800" stroke-width="2" opacity="0.5"/>
        <!-- 大头 -->
        <circle cx="64" cy="40" r="28" fill="#ffe0b2"/>
        <!-- 道冠 -->
        <path d="M40 30 Q64 5 88 30 L85 38 Q64 28 43 38 Z" fill="#bf360c"/>
        <ellipse cx="64" cy="18" rx="12" ry="8" fill="#d84315"/>
        <circle cx="64" cy="12" r="6" fill="#ffc107"/>
        <!-- 眼睛 -->
        <ellipse cx="54" cy="42" rx="5" ry="6" fill="#fff"/>
        <ellipse cx="74" cy="42" rx="5" ry="6" fill="#fff"/>
        <circle cx="55" cy="43" r="3" fill="#4a148c"/>
        <circle cx="75" cy="43" r="3" fill="#4a148c"/>
        <circle cx="56" cy="42" r="1" fill="#fff"/>
        <circle cx="76" cy="42" r="1" fill="#fff"/>
        <!-- 眉毛 -->
        <path d="M48 36 L60 37" stroke="#5d4037" stroke-width="2" stroke-linecap="round"/>
        <path d="M68 37 L80 36" stroke="#5d4037" stroke-width="2" stroke-linecap="round"/>
        <!-- 小嘴 -->
        <ellipse cx="64" cy="54" rx="3" ry="2" fill="#d7ccc8"/>
        <!-- 腮红 -->
        <ellipse cx="45" cy="48" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>
        <ellipse cx="83" cy="48" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>
        <!-- 胡须 -->
        <path d="M58 56 Q54 65 50 70" fill="none" stroke="#8d6e63" stroke-width="1" opacity="0.6"/>
        <path d="M70 56 Q74 65 78 70" fill="none" stroke="#8d6e63" stroke-width="1" opacity="0.6"/>
    </svg>`,
    player_body: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <!-- 阴影 -->
        <ellipse cx="64" cy="120" rx="28" ry="8" fill="rgba(0,0,0,0.3)"/>
        <!-- 身体/短打 -->
        <path d="M38 70 Q35 120 64 115 Q93 120 90 70 L85 62 L43 62 Z" fill="#5d4037" stroke="#3e2723" stroke-width="1"/>
        <!-- 腰带 -->
        <rect x="42" y="82" width="44" height="8" rx="2" fill="#ffb300"/>
        <rect x="58" y="80" width="12" height="12" rx="2" fill="#ff8f00"/>
        <!-- 胸肌纹理 -->
        <path d="M50 70 Q64 75 78 70" fill="none" stroke="#4e342e" stroke-width="2" opacity="0.5"/>
        <!-- 大手臂 -->
        <ellipse cx="32" cy="80" rx="14" ry="18" fill="#ffcc80"/>
        <ellipse cx="96" cy="80" rx="14" ry="18" fill="#ffcc80"/>
        <!-- 拳头 -->
        <circle cx="28" cy="95" r="12" fill="#ffcc80" stroke="#ffb74d" stroke-width="1"/>
        <circle cx="100" cy="95" r="12" fill="#ffcc80" stroke="#ffb74d" stroke-width="1"/>
        <!-- 袖口 -->
        <ellipse cx="35" cy="65" rx="12" ry="8" fill="#4e342e"/>
        <ellipse cx="93" cy="65" rx="12" ry="8" fill="#4e342e"/>
        <!-- 大头 -->
        <circle cx="64" cy="38" r="30" fill="#ffcc80"/>
        <!-- 头发（光头+鬓角） -->
        <path d="M34 30 Q64 15 94 30 Q95 25 64 18 Q33 25 34 30" fill="#3e2723"/>
        <!-- 粗眉 -->
        <path d="M42 30 L58 32" stroke="#3e2723" stroke-width="4" stroke-linecap="round"/>
        <path d="M70 32 L86 30" stroke="#3e2723" stroke-width="4" stroke-linecap="round"/>
        <!-- 眼睛（凶悍） -->
        <ellipse cx="52" cy="40" rx="6" ry="5" fill="#fff"/>
        <ellipse cx="76" cy="40" rx="6" ry="5" fill="#fff"/>
        <circle cx="53" cy="41" r="3" fill="#4e342e"/>
        <circle cx="77" cy="41" r="3" fill="#4e342e"/>
        <circle cx="54" cy="40" r="1" fill="#fff"/>
        <circle cx="78" cy="40" r="1" fill="#fff"/>
        <!-- 鼻子 -->
        <ellipse cx="64" cy="48" rx="4" ry="3" fill="#ffb74d"/>
        <!-- 大嘴 -->
        <path d="M54 56 Q64 62 74 56" fill="none" stroke="#5d4037" stroke-width="3" stroke-linecap="round"/>
        <!-- 胡茬 -->
        <rect x="55" y="58" width="18" height="6" rx="2" fill="#5d4037" opacity="0.3"/>
        <!-- 伤疤 -->
        <path d="M78 35 L85 45" stroke="#d7ccc8" stroke-width="2"/>
    </svg>`,
    
    player_ghost: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <!-- 阴影（紫色） -->
        <ellipse cx="64" cy="120" rx="25" ry="8" fill="rgba(74,20,140,0.4)"/>
        <!-- 阴气缭绕 -->
        <ellipse cx="50" cy="115" rx="15" ry="6" fill="#7b1fa2" opacity="0.3"/>
        <ellipse cx="78" cy="118" rx="12" ry="5" fill="#9c27b0" opacity="0.2"/>
        <!-- 身体/鬼袍 -->
        <path d="M40 72 Q35 125 64 118 Q93 125 88 72 L82 62 L46 62 Z" fill="#311b92" stroke="#4a148c" stroke-width="1"/>
        <!-- 袍子飘带 -->
        <path d="M40 90 Q30 100 35 115" fill="none" stroke="#7c4dff" stroke-width="2" opacity="0.6"/>
        <path d="M88 90 Q98 100 93 115" fill="none" stroke="#7c4dff" stroke-width="2" opacity="0.6"/>
        <!-- 领口 -->
        <path d="M52 62 L64 75 L76 62" fill="none" stroke="#7c4dff" stroke-width="2"/>
        <!-- 腰带 -->
        <rect x="45" y="82" width="38" height="5" rx="2" fill="#7c4dff"/>
        <!-- 幽魂小手 -->
        <circle cx="35" cy="85" r="7" fill="#e1bee7"/>
        <circle cx="93" cy="85" r="7" fill="#e1bee7"/>
        <!-- 袖子 -->
        <path d="M46 62 Q28 72 35 85" fill="#4527a0" stroke="#311b92"/>
        <path d="M82 62 Q100 72 93 85" fill="#4527a0" stroke="#311b92"/>
        <!-- 大头（苍白） -->
        <circle cx="64" cy="38" r="28" fill="#e1bee7"/>
        <!-- 长发 -->
        <path d="M36 32 Q64 8 92 32 L95 55 Q90 50 85 55 L80 45 Q64 52 48 45 L43 55 Q38 50 33 55 L36 32" fill="#212121"/>
        <!-- 发丝飘动 -->
        <path d="M33 55 Q25 70 30 85" fill="none" stroke="#212121" stroke-width="3"/>
        <path d="M95 55 Q103 70 98 85" fill="none" stroke="#212121" stroke-width="3"/>
        <!-- 眼睛（幽光） -->
        <ellipse cx="54" cy="40" rx="6" ry="7" fill="#e8eaf6"/>
        <ellipse cx="74" cy="40" rx="6" ry="7" fill="#e8eaf6"/>
        <circle cx="54" cy="41" r="4" fill="#7c4dff"/>
        <circle cx="74" cy="41" r="4" fill="#7c4dff"/>
        <circle cx="55" cy="40" r="1.5" fill="#fff"/>
        <circle cx="75" cy="40" r="1.5" fill="#fff"/>
        <!-- 眉毛 -->
        <path d="M46 33 L58 36" stroke="#37474f" stroke-width="2" stroke-linecap="round"/>
        <path d="M70 36 L82 33" stroke="#37474f" stroke-width="2" stroke-linecap="round"/>
        <!-- 小嘴（无表情） -->
        <path d="M60 52 L68 52" stroke="#9575cd" stroke-width="2" stroke-linecap="round"/>
        <!-- 阴气符文 -->
        <text x="58" y="95" font-size="12" fill="#b388ff" opacity="0.7">鬼</text>
    </svg>`,
    player_formation: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <!-- 阴影 -->
        <ellipse cx="64" cy="120" rx="25" ry="8" fill="rgba(0,0,0,0.3)"/>
        <!-- 阵法光环 -->
        <circle cx="64" cy="100" r="20" fill="none" stroke="#00bcd4" stroke-width="1" opacity="0.4"/>
        <circle cx="64" cy="100" r="28" fill="none" stroke="#00bcd4" stroke-width="1" opacity="0.2" stroke-dasharray="4,4"/>
        <!-- 身体/儒袍 -->
        <path d="M42 72 Q40 120 64 115 Q88 120 86 72 L80 62 L48 62 Z" fill="#eceff1" stroke="#b0bec5" stroke-width="1"/>
        <!-- 袍子纹理 -->
        <path d="M55 75 L55 110" stroke="#cfd8dc" stroke-width="1"/>
        <path d="M73 75 L73 110" stroke="#cfd8dc" stroke-width="1"/>
        <!-- 领口 -->
        <path d="M52 62 L64 76 L76 62" fill="none" stroke="#546e7a" stroke-width="2"/>
        <!-- 腰带 -->
        <rect x="46" y="84" width="36" height="5" rx="2" fill="#546e7a"/>
        <!-- 玉佩 -->
        <circle cx="64" cy="95" r="5" fill="#80deea" stroke="#00bcd4"/>
        <!-- 小手（持罗盘） -->
        <circle cx="38" cy="85" r="7" fill="#ffcc80"/>
        <circle cx="90" cy="85" r="7" fill="#ffcc80"/>
        <!-- 罗盘 -->
        <circle cx="38" cy="85" r="10" fill="#37474f" stroke="#546e7a"/>
        <circle cx="38" cy="85" r="6" fill="#263238"/>
        <path d="M38 79 L38 91 M32 85 L44 85" stroke="#00bcd4" stroke-width="1"/>
        <!-- 袖子 -->
        <path d="M48 62 Q32 70 38 85" fill="#cfd8dc" stroke="#b0bec5"/>
        <path d="M80 62 Q96 70 90 85" fill="#cfd8dc" stroke="#b0bec5"/>
        <!-- 大头 -->
        <circle cx="64" cy="38" r="28" fill="#ffe0b2"/>
        <!-- 头发（儒冠） -->
        <path d="M38 32 Q64 12 90 32 L88 42 Q64 35 40 42 Z" fill="#37474f"/>
        <!-- 儒冠 -->
        <rect x="52" y="8" width="24" height="18" rx="3" fill="#455a64"/>
        <rect x="56" y="5" width="16" height="6" rx="2" fill="#546e7a"/>
        <rect x="62" y="2" width="4" height="8" fill="#78909c"/>
        <!-- 眼睛（睿智） -->
        <ellipse cx="54" cy="42" rx="5" ry="6" fill="#fff"/>
        <ellipse cx="74" cy="42" rx="5" ry="6" fill="#fff"/>
        <circle cx="55" cy="43" r="3" fill="#263238"/>
        <circle cx="75" cy="43" r="3" fill="#263238"/>
        <circle cx="56" cy="42" r="1" fill="#fff"/>
        <circle cx="76" cy="42" r="1" fill="#fff"/>
        <!-- 眉毛（细长） -->
        <path d="M46 36 L60 38" stroke="#455a64" stroke-width="2" stroke-linecap="round"/>
        <path d="M68 38 L82 36" stroke="#455a64" stroke-width="2" stroke-linecap="round"/>
        <!-- 小嘴（淡定） -->
        <path d="M60 53 Q64 55 68 53" fill="none" stroke="#bcaaa4" stroke-width="2" stroke-linecap="round"/>
        <!-- 腮红 -->
        <ellipse cx="45" cy="48" rx="4" ry="2" fill="#ffcdd2" opacity="0.5"/>
        <ellipse cx="83" cy="48" rx="4" ry="2" fill="#ffcdd2" opacity="0.5"/>
    </svg>`,

    // ========== 法宝专属图标 ==========
    // 诛仙剑阵 - 四剑交叉阵法
    artifact_zhuxian: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="28" fill="none" stroke="#00bcd4" stroke-width="2" stroke-dasharray="4,2"/>
        <path d="M30 2 L30 58" stroke="#00bcd4" stroke-width="3"/>
        <path d="M2 30 L58 30" stroke="#00bcd4" stroke-width="3"/>
        <path d="M10 10 L50 50" stroke="#4dd0e1" stroke-width="2"/>
        <path d="M50 10 L10 50" stroke="#4dd0e1" stroke-width="2"/>
        <circle cx="30" cy="30" r="8" fill="#00bcd4"/>
        <circle cx="30" cy="30" r="4" fill="#e0f7fa"/>
    </svg>`,
    
    // 金蛟剪 - 金色交叉剪刀
    artifact_jinjiao: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 5 L35 30 L15 55" fill="none" stroke="#f1c40f" stroke-width="4" stroke-linecap="round"/>
        <path d="M45 5 L25 30 L45 55" fill="none" stroke="#f39c12" stroke-width="4" stroke-linecap="round"/>
        <circle cx="30" cy="30" r="6" fill="#f1c40f" stroke="#e67e22" stroke-width="2"/>
        <circle cx="15" cy="5" r="4" fill="#f1c40f"/>
        <circle cx="45" cy="5" r="4" fill="#f39c12"/>
    </svg>`,
    
    // 玄武盾 - 龟壳盾牌
    artifact_xuanwu: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 5 L55 20 L55 45 L30 58 L5 45 L5 20 Z" fill="#2e7d32" stroke="#1b5e20" stroke-width="2"/>
        <path d="M30 15 L45 25 L45 40 L30 48 L15 40 L15 25 Z" fill="#388e3c" stroke="#2e7d32" stroke-width="1"/>
        <path d="M30 25 L38 30 L38 38 L30 42 L22 38 L22 30 Z" fill="#4caf50"/>
        <circle cx="30" cy="33" r="5" fill="#81c784"/>
    </svg>`,
    
    // 乾坤圈 - 金色光环
    artifact_qiankun: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="25" fill="none" stroke="#f1c40f" stroke-width="6"/>
        <circle cx="30" cy="30" r="20" fill="none" stroke="#f39c12" stroke-width="2"/>
        <circle cx="30" cy="30" r="15" fill="none" stroke="#e67e22" stroke-width="1"/>
        <circle cx="30" cy="5" r="3" fill="#fff"/>
        <circle cx="30" cy="55" r="3" fill="#fff"/>
        <circle cx="5" cy="30" r="3" fill="#fff"/>
        <circle cx="55" cy="30" r="3" fill="#fff"/>
    </svg>`,
    
    // 风火轮 - 火焰轮子
    artifact_fenghuo: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="20" fill="none" stroke="#ff5722" stroke-width="4"/>
        <path d="M30 10 Q40 20 30 30 Q20 20 30 10" fill="#ff9800"/>
        <path d="M50 30 Q40 40 30 30 Q40 20 50 30" fill="#ff5722"/>
        <path d="M30 50 Q20 40 30 30 Q40 40 30 50" fill="#ff9800"/>
        <path d="M10 30 Q20 20 30 30 Q20 40 10 30" fill="#ff5722"/>
        <circle cx="30" cy="30" r="6" fill="#ffeb3b"/>
    </svg>`,
    
    // 定海神珠 - 蓝色神珠
    artifact_dinghai: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="pearl"><stop offset="0%" stop-color="#e3f2fd"/><stop offset="50%" stop-color="#2196f3"/><stop offset="100%" stop-color="#0d47a1"/></radialGradient></defs>
        <circle cx="30" cy="30" r="25" fill="url(#pearl)"/>
        <circle cx="22" cy="22" r="8" fill="rgba(255,255,255,0.6)"/>
        <circle cx="30" cy="30" r="28" fill="none" stroke="#64b5f6" stroke-width="2" stroke-dasharray="8,4"/>
    </svg>`,
    
    // 聚宝盆 - 金元宝盆
    artifact_jubao: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="30" cy="45" rx="25" ry="12" fill="#8d6e63" stroke="#5d4037" stroke-width="2"/>
        <path d="M5 45 Q5 25 30 20 Q55 25 55 45" fill="#a1887f" stroke="#5d4037" stroke-width="2"/>
        <ellipse cx="30" cy="20" rx="12" ry="6" fill="#f1c40f" stroke="#f39c12" stroke-width="1"/>
        <path d="M20 18 Q30 10 40 18" fill="#f1c40f" stroke="#e67e22" stroke-width="1"/>
        <ellipse cx="22" cy="35" rx="6" ry="4" fill="#f1c40f"/>
        <ellipse cx="38" cy="38" rx="5" ry="3" fill="#f39c12"/>
    </svg>`,
    
    // 虚天鼎 - 三足青铜鼎
    artifact_fantian: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 55 L20 35 L40 35 L45 55" fill="#8d6e63" stroke="#5d4037" stroke-width="2"/>
        <rect x="18" y="20" width="24" height="15" fill="#a1887f" stroke="#5d4037" stroke-width="2"/>
        <rect x="22" y="10" width="4" height="12" fill="#8d6e63"/>
        <rect x="34" y="10" width="4" height="12" fill="#8d6e63"/>
        <ellipse cx="30" cy="20" rx="12" ry="4" fill="#bcaaa4" stroke="#8d6e63"/>
        <path d="M25 27 L35 27" stroke="#5d4037" stroke-width="2"/>
        <circle cx="30" cy="5" r="4" fill="#ff5722"/>
    </svg>`,
    
    // 乾蓝冰焰 - 冰火阴阳
    artifact_mirror: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="28" fill="#fff" stroke="#bdc3c7" stroke-width="2"/>
        <path d="M30 2 A 28 28 0 0 1 30 58 A 14 14 0 0 1 30 30 A 14 14 0 0 0 30 2" fill="#2196f3"/>
        <path d="M30 2 A 28 28 0 0 0 30 58 A 14 14 0 0 0 30 30 A 14 14 0 0 1 30 2" fill="#ff5722"/>
        <circle cx="30" cy="16" r="4" fill="#ff5722"/>
        <circle cx="30" cy="44" r="4" fill="#2196f3"/>
    </svg>`,
    
    // 玄天斩灵 - 紫金葫芦
    artifact_gourd: `<svg width="60" height="70" viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 70 C12 70 5 55 12 38 C16 30 24 28 26 20" fill="#9c27b0" stroke="#7b1fa2" stroke-width="2"/>
        <path d="M30 70 C48 70 55 55 48 38 C44 30 36 28 34 20" fill="#9c27b0" stroke="#7b1fa2" stroke-width="2"/>
        <ellipse cx="30" cy="12" rx="10" ry="12" fill="#ab47bc" stroke="#7b1fa2" stroke-width="2"/>
        <rect x="28" y="0" width="4" height="6" fill="#f1c40f"/>
        <path d="M22 0 L30 3 L38 0" fill="none" stroke="#f1c40f" stroke-width="2"/>
        <ellipse cx="30" cy="45" rx="8" ry="10" fill="rgba(255,255,255,0.2)"/>
    </svg>`,
    
    // 兼容旧代码
    fantian_seal: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="44" height="44" fill="#f1c40f" stroke="#f39c12" stroke-width="3"/><path d="M8 8 L52 52 M52 8 L8 52" stroke="#e67e22" stroke-width="2"/><rect x="18" y="18" width="24" height="24" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/><circle cx="30" cy="30" r="6" fill="#f1c40f"/></svg>`,
    yinyang_mirror: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="28" fill="#fff" stroke="#bdc3c7" stroke-width="2"/><path d="M30 2 A 28 28 0 0 1 30 58 A 14 14 0 0 1 30 30 A 14 14 0 0 0 30 2" fill="#000"/><circle cx="30" cy="16" r="4" fill="#fff"/><circle cx="30" cy="44" r="4" fill="#000"/></svg>`,
    slaying_gourd: `<svg width="60" height="70" viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg"><path d="M30 70 C10 70 0 50 10 35 C15 27 25 25 25 18 L25 10 L35 10 L35 18 C35 25 45 27 50 35 C60 50 50 70 30 70" fill="#e67e22" stroke="#d35400" stroke-width="2"/><path d="M30 10 L30 2 L45 5" stroke="#f1c40f" stroke-width="3"/></svg>`,

    sword: `<svg width="64" height="128" viewBox="0 0 64 128" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#00bcd4"/></linearGradient></defs><path d="M32 0 L22 20 L28 100 L36 100 L42 20 Z" fill="url(#sg)"/><rect x="20" y="90" width="24" height="6" fill="#f1c40f"/><circle cx="32" cy="110" r="4" fill="#f1c40f"/></svg>`,
    
    fire: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="fg"><stop offset="0%" stop-color="#ffff00"/><stop offset="50%" stop-color="#ff5722"/><stop offset="100%" stop-color="rgba(255,0,0,0)"/></radialGradient></defs><circle cx="32" cy="32" r="28" fill="url(#fg)"/><path d="M32 60 Q10 40 32 10 Q54 40 32 60" fill="#ff9800" opacity="0.7"/></svg>`,
    
    wolf: `<svg width="48" height="32" viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg"><path d="M10 20 L0 10 L15 5 L30 15 L45 10 L48 20 L30 30 L10 25 Z" fill="#a1887f" stroke="#5d4037"/><circle cx="10" cy="15" r="2" fill="#fff"/></svg>`,
    note: `<svg width="32" height="48" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg"><ellipse cx="10" cy="40" rx="8" ry="6" fill="#e91e63" transform="rotate(-20 10 40)"/><rect x="16" y="5" width="4" height="35" fill="#e91e63"/><path d="M16 5 Q32 15 32 30" stroke="#e91e63" stroke-width="4" fill="none"/></svg>`,
    
    thunder: `<svg width="40" height="100" viewBox="0 0 40 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 0 L0 40 L15 40 L5 100 L35 50 L20 50 L40 10 Z" fill="#fff" stroke="#ffeb3b" stroke-width="2" stroke-linejoin="round"/></svg>`,

    leaf: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M24 46 Q4 30 4 14 Q4 2 24 2 Q44 2 44 14 Q44 30 24 46 M24 2 L24 46" fill="#2ecc71" stroke="#27ae60" stroke-width="2"/></svg>`,
    ice: `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M24 0 L30 18 L48 24 L30 30 L24 48 L18 30 L0 24 L18 18 Z" fill="#e1f5fe" stroke="#03a9f4" stroke-width="2"/></svg>`,
    
    rock_b: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M10 30 L5 20 L15 5 L30 8 L35 25 L25 35 Z" fill="#795548" stroke="#5d4037" stroke-width="2"/></svg>`,

    // Q萌怪物
    bat: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 翅膀 -->
        <path d="M8 28 Q2 18 8 12 Q14 8 20 15 L24 28" fill="#8e44ad" stroke="#6c3483" stroke-width="1"/>
        <path d="M56 28 Q62 18 56 12 Q50 8 44 15 L40 28" fill="#8e44ad" stroke="#6c3483" stroke-width="1"/>
        <!-- 圆身体 -->
        <ellipse cx="32" cy="35" rx="16" ry="14" fill="#9b59b6"/>
        <!-- 大眼睛 -->
        <ellipse cx="26" cy="32" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="38" cy="32" rx="6" ry="7" fill="#fff"/>
        <circle cx="27" cy="33" r="3" fill="#2c3e50"/>
        <circle cx="39" cy="33" r="3" fill="#2c3e50"/>
        <circle cx="28" cy="32" r="1" fill="#fff"/>
        <circle cx="40" cy="32" r="1" fill="#fff"/>
        <!-- 小尖牙 -->
        <path d="M28 42 L30 46 L32 42" fill="#fff"/>
        <path d="M32 42 L34 46 L36 42" fill="#fff"/>
        <!-- 小耳朵 -->
        <path d="M22 22 L20 12 L28 20" fill="#8e44ad"/>
        <path d="M42 22 L44 12 L36 20" fill="#8e44ad"/>
        <!-- 腮红 -->
        <ellipse cx="20" cy="38" rx="4" ry="2" fill="#e91e63" opacity="0.4"/>
        <ellipse cx="44" cy="38" rx="4" ry="2" fill="#e91e63" opacity="0.4"/>
    </svg>`,
    bat_fire: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 火焰光环 -->
        <ellipse cx="32" cy="35" rx="22" ry="18" fill="#ff5722" opacity="0.3"/>
        <!-- 翅膀 -->
        <path d="M8 28 Q2 18 8 12 Q14 8 20 15 L24 28" fill="#e65100" stroke="#bf360c" stroke-width="1"/>
        <path d="M56 28 Q62 18 56 12 Q50 8 44 15 L40 28" fill="#e65100" stroke="#bf360c" stroke-width="1"/>
        <!-- 圆身体 -->
        <ellipse cx="32" cy="35" rx="16" ry="14" fill="#ff5722"/>
        <!-- 火焰纹 -->
        <path d="M24 40 Q28 35 26 30" stroke="#ffeb3b" stroke-width="2" fill="none" opacity="0.6"/>
        <path d="M40 40 Q36 35 38 30" stroke="#ffeb3b" stroke-width="2" fill="none" opacity="0.6"/>
        <!-- 大眼睛 -->
        <ellipse cx="26" cy="32" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="38" cy="32" rx="6" ry="7" fill="#fff"/>
        <circle cx="27" cy="33" r="3" fill="#c62828"/>
        <circle cx="39" cy="33" r="3" fill="#c62828"/>
        <circle cx="28" cy="32" r="1" fill="#ffeb3b"/>
        <circle cx="40" cy="32" r="1" fill="#ffeb3b"/>
        <!-- 小尖牙 -->
        <path d="M28 42 L30 46 L32 42" fill="#fff"/>
        <path d="M32 42 L34 46 L36 42" fill="#fff"/>
        <!-- 小耳朵（带火焰） -->
        <path d="M22 22 L20 10 L28 20" fill="#ff5722"/>
        <path d="M42 22 L44 10 L36 20" fill="#ff5722"/>
        <circle cx="20" cy="10" r="3" fill="#ffeb3b" opacity="0.8"/>
        <circle cx="44" cy="10" r="3" fill="#ffeb3b" opacity="0.8"/>
    </svg>`,
    ghost: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 飘动的身体 -->
        <path d="M16 25 Q16 8 32 8 Q48 8 48 25 L48 45 Q44 50 40 45 Q36 50 32 45 Q28 50 24 45 Q20 50 16 45 Z" fill="#26a69a" opacity="0.8"/>
        <!-- 内部高光 -->
        <ellipse cx="32" cy="25" rx="10" ry="8" fill="#80cbc4" opacity="0.5"/>
        <!-- 大眼睛 -->
        <ellipse cx="25" cy="25" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="39" cy="25" rx="6" ry="7" fill="#fff"/>
        <circle cx="26" cy="26" r="3" fill="#004d40"/>
        <circle cx="40" cy="26" r="3" fill="#004d40"/>
        <circle cx="27" cy="25" r="1" fill="#fff"/>
        <circle cx="41" cy="25" r="1" fill="#fff"/>
        <!-- 小嘴（惊讶） -->
        <ellipse cx="32" cy="36" rx="4" ry="3" fill="#004d40" opacity="0.6"/>
        <!-- 腮红 -->
        <ellipse cx="18" cy="30" rx="3" ry="2" fill="#e91e63" opacity="0.3"/>
        <ellipse cx="46" cy="30" rx="3" ry="2" fill="#e91e63" opacity="0.3"/>
    </svg>`,
    ghost_ice: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 冰霜光环 -->
        <ellipse cx="32" cy="30" rx="26" ry="22" fill="#e1f5fe" opacity="0.3"/>
        <!-- 飘动的身体 -->
        <path d="M16 25 Q16 8 32 8 Q48 8 48 25 L48 45 Q44 50 40 45 Q36 50 32 45 Q28 50 24 45 Q20 50 16 45 Z" fill="#4fc3f7" opacity="0.8"/>
        <!-- 冰晶纹理 -->
        <path d="M32 12 L32 20 M28 16 L36 16" stroke="#e1f5fe" stroke-width="2"/>
        <path d="M22 35 L22 40 M20 37 L24 37" stroke="#e1f5fe" stroke-width="1"/>
        <path d="M42 35 L42 40 M40 37 L44 37" stroke="#e1f5fe" stroke-width="1"/>
        <!-- 大眼睛 -->
        <ellipse cx="25" cy="25" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="39" cy="25" rx="6" ry="7" fill="#fff"/>
        <circle cx="26" cy="26" r="3" fill="#0277bd"/>
        <circle cx="40" cy="26" r="3" fill="#0277bd"/>
        <circle cx="27" cy="25" r="1" fill="#e1f5fe"/>
        <circle cx="41" cy="25" r="1" fill="#e1f5fe"/>
        <!-- 小嘴（冷） -->
        <path d="M28 36 Q32 34 36 36" fill="none" stroke="#0277bd" stroke-width="2"/>
        <!-- 腮红（冰蓝） -->
        <ellipse cx="18" cy="30" rx="3" ry="2" fill="#81d4fa" opacity="0.5"/>
        <ellipse cx="46" cy="30" rx="3" ry="2" fill="#81d4fa" opacity="0.5"/>
    </svg>`,
    rock: `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- 圆润石头身体 -->
        <ellipse cx="40" cy="45" rx="28" ry="25" fill="#795548"/>
        <ellipse cx="40" cy="42" rx="24" ry="20" fill="#8d6e63"/>
        <!-- 石纹 -->
        <path d="M25 50 Q30 45 28 40" stroke="#5d4037" stroke-width="2" fill="none"/>
        <path d="M55 50 Q50 45 52 40" stroke="#5d4037" stroke-width="2" fill="none"/>
        <!-- 大眼睛 -->
        <ellipse cx="30" cy="38" rx="8" ry="9" fill="#fff"/>
        <ellipse cx="50" cy="38" rx="8" ry="9" fill="#fff"/>
        <circle cx="32" cy="40" r="4" fill="#3e2723"/>
        <circle cx="52" cy="40" r="4" fill="#3e2723"/>
        <circle cx="33" cy="39" r="1.5" fill="#fff"/>
        <circle cx="53" cy="39" r="1.5" fill="#fff"/>
        <!-- 粗眉（凶萌） -->
        <path d="M22 30 L36 34" stroke="#3e2723" stroke-width="3" stroke-linecap="round"/>
        <path d="M58 30 L44 34" stroke="#3e2723" stroke-width="3" stroke-linecap="round"/>
        <!-- 嘴巴（呲牙） -->
        <path d="M32 52 Q40 58 48 52" fill="none" stroke="#3e2723" stroke-width="2"/>
        <rect x="36" y="52" width="4" height="5" fill="#fff" rx="1"/>
        <rect x="42" y="52" width="4" height="5" fill="#fff" rx="1"/>
    </svg>`,
    chest: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="24" width="40" height="28" rx="4" fill="#f39c12" stroke="#e67e22" stroke-width="2"/><path d="M12 24 L20 12 L44 12 L52 24" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/><rect x="28" y="32" width="8" height="10" fill="#e74c3c" rx="1"/><circle cx="32" cy="37" r="2" fill="#f1c40f"/></svg>`,
    
    pavilion: `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="M60 10 L10 40 L20 40 L15 55 L105 55 L100 40 L110 40 Z" fill="#c0392b" stroke="#a93226" stroke-width="2"/><rect x="25" y="55" width="10" height="45" fill="#8e44ad"/><rect x="85" y="55" width="10" height="45" fill="#8e44ad"/><rect x="35" y="90" width="50" height="10" fill="#d35400"/><path d="M10 100 L110 100 L100 110 L20 110 Z" fill="#bdc3c7"/></svg>`,
    gate: `<svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="10" height="100" fill="#95a5a6"/><rect x="80" y="20" width="10" height="100" fill="#95a5a6"/><rect x="5" y="30" width="90" height="10" fill="#bdc3c7"/><path d="M0 20 L50 5 L100 20 L100 30 L0 30 Z" fill="#34495e" stroke="#2c3e50"/><rect x="30" y="40" width="40" height="10" fill="#f1c40f"/></svg>`,
    pine: `<svg width="80" height="120" viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg"><path d="M40 10 L10 50 L70 50 Z" fill="#2ecc71" stroke="#27ae60"/><path d="M40 40 L5 80 L75 80 Z" fill="#27ae60" stroke="#2ecc71"/><path d="M40 70 L0 110 L80 110 Z" fill="#1e8449" stroke="#27ae60"/><rect x="35" y="110" width="10" height="10" fill="#795548"/><path d="M10 50 L20 50 L15 60 L25 60" stroke="white" fill="none" stroke-width="2" opacity="0.7"/></svg>`,
    tree_forest: `<svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><path d="M50 110 L50 50" stroke="#4e342e" stroke-width="14"/><path d="M50 50 Q20 30 10 60 Q0 30 30 10 Q10 -10 50 10 Q90 -10 70 10 Q100 30 90 60 Q80 30 50 50" fill="#1b5e20" stroke="#2e7d32" stroke-width="2"/><path d="M45 110 L30 120 M55 110 L70 120" stroke="#4e342e" stroke-width="6"/></svg>`,
    bush: `<svg width="60" height="40" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="25" r="15" fill="#2e7d32"/><circle cx="45" cy="25" r="15" fill="#2e7d32"/><circle cx="30" cy="15" r="18" fill="#388e3c"/></svg>`,
    stone_s: `<svg width="60" height="50" viewBox="0 0 60 50" xmlns="http://www.w3.org/2000/svg"><path d="M10 50 L0 30 L20 10 L40 5 L60 30 L50 50 Z" fill="#7f8c8d"/><path d="M20 10 L40 5 L50 20 L10 20 Z" fill="#fff" opacity="0.9"/></svg>`,
    
    // 装饰用岩石（无眼睛）
    magma_rock_deco: `<svg width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg"><path d="M35 5 L65 35 L50 65 L20 65 L5 35 Z" fill="#3e2723"/><path d="M35 5 L35 35 L65 35" fill="none" stroke="#ff5722" stroke-width="3"/><path d="M20 55 L35 35 L50 65" fill="none" stroke="#ff5722" stroke-width="3"/></svg>`,
    
    // 装饰用水晶（无眼睛）
    crystal_deco: `<svg width="50" height="80" viewBox="0 0 50 80" xmlns="http://www.w3.org/2000/svg"><path d="M25 0 L50 30 L25 80 L0 30 Z" fill="#4fc3f7" opacity="0.8"/><path d="M25 0 L25 80" stroke="#e1f5fe" stroke-width="2"/><path d="M0 30 L50 30" stroke="#e1f5fe" stroke-width="1" opacity="0.5"/><path d="M10 20 L20 10 L20 30" fill="#e1f5fe" opacity="0.6"/></svg>`,
    
    // Chinese Tomb Assets
    grave_mound: `<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><path d="M10 60 Q50 -20 90 60 Z" fill="#5d4037"/><path d="M20 50 Q50 0 80 50" fill="none" stroke="#795548" stroke-width="2"/><circle cx="30" cy="55" r="2" fill="#3e2723"/><circle cx="70" cy="55" r="2" fill="#3e2723"/><path d="M40 60 L40 45 L45 40 L50 45 L50 60 Z" fill="#7f8c8d" opacity="0.8"/></svg>`,
    stele_c: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M5 40 L5 15 Q20 0 35 15 L35 40 Z" fill="#757575" stroke="#424242"/><rect x="12" y="20" width="16" height="20" fill="#424242"/><path d="M15 25 L25 25 M15 35 L25 35" stroke="#9e9e9e" stroke-width="2"/></svg>`,
    paper_money_r: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8" fill="#ecf0f1" stroke="#bdc3c7"/><rect x="8" y="8" width="4" height="4" fill="#bdc3c7"/></svg>`,
    paper_money_s: `<svg width="20" height="25" viewBox="0 0 20 25" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="16" height="21" fill="#f1c40f" stroke="#f39c12"/><circle cx="10" cy="12" r="4" fill="none" stroke="#e67e22"/></svg>`,
    
    crystal: `<svg width="64" height="80" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
        <!-- 光晕 -->
        <ellipse cx="32" cy="50" rx="28" ry="24" fill="#e1f5fe" opacity="0.3"/>
        <!-- 水晶身体 -->
        <path d="M32 5 L55 35 L45 75 L19 75 L9 35 Z" fill="#4fc3f7" opacity="0.9"/>
        <path d="M32 5 L45 35 L38 75 L26 75 L19 35 Z" fill="#81d4fa" opacity="0.6"/>
        <!-- 高光 -->
        <path d="M20 30 L28 20 L28 40" fill="#e1f5fe" opacity="0.8"/>
        <!-- 大眼睛 -->
        <ellipse cx="24" cy="42" rx="7" ry="8" fill="#fff"/>
        <ellipse cx="40" cy="42" rx="7" ry="8" fill="#fff"/>
        <circle cx="25" cy="43" r="4" fill="#0288d1"/>
        <circle cx="41" cy="43" r="4" fill="#0288d1"/>
        <circle cx="26" cy="42" r="1.5" fill="#e1f5fe"/>
        <circle cx="42" cy="42" r="1.5" fill="#e1f5fe"/>
        <!-- 小嘴（微笑） -->
        <path d="M28 55 Q32 58 36 55" fill="none" stroke="#0277bd" stroke-width="2" stroke-linecap="round"/>
        <!-- 腮红 -->
        <ellipse cx="18" cy="48" rx="4" ry="2" fill="#f8bbd9" opacity="0.5"/>
        <ellipse cx="46" cy="48" rx="4" ry="2" fill="#f8bbd9" opacity="0.5"/>
        <!-- 闪光点 -->
        <circle cx="15" cy="25" r="2" fill="#fff"/>
        <circle cx="48" cy="30" r="1.5" fill="#fff"/>
    </svg>`,
    magma_rock: `<svg width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
        <!-- 岩浆光环 -->
        <ellipse cx="35" cy="40" rx="32" ry="28" fill="#ff5722" opacity="0.2"/>
        <!-- 圆润岩石身体 -->
        <ellipse cx="35" cy="42" rx="26" ry="24" fill="#3e2723"/>
        <ellipse cx="35" cy="40" rx="22" ry="20" fill="#4e342e"/>
        <!-- 岩浆裂纹 -->
        <path d="M20 35 Q25 45 22 55" stroke="#ff5722" stroke-width="3" fill="none"/>
        <path d="M50 35 Q45 45 48 55" stroke="#ff5722" stroke-width="3" fill="none"/>
        <path d="M32 25 L35 35 L38 28" stroke="#ff5722" stroke-width="2" fill="none"/>
        <!-- 大眼睛（火焰色） -->
        <ellipse cx="26" cy="38" rx="8" ry="9" fill="#fff"/>
        <ellipse cx="44" cy="38" rx="8" ry="9" fill="#fff"/>
        <circle cx="27" cy="39" r="4" fill="#d84315"/>
        <circle cx="45" cy="39" r="4" fill="#d84315"/>
        <circle cx="28" cy="38" r="1.5" fill="#ffeb3b"/>
        <circle cx="46" cy="38" r="1.5" fill="#ffeb3b"/>
        <!-- 粗眉（愤怒萌） -->
        <path d="M18 28 L32 33" stroke="#2d1b12" stroke-width="4" stroke-linecap="round"/>
        <path d="M52 28 L38 33" stroke="#2d1b12" stroke-width="4" stroke-linecap="round"/>
        <!-- 嘴巴（咆哮） -->
        <ellipse cx="35" cy="52" rx="8" ry="5" fill="#1a1a1a"/>
        <path d="M30 50 L32 54 L34 50" fill="#ff5722"/>
        <path d="M36 50 L38 54 L40 50" fill="#ff5722"/>
        <!-- 火焰头顶 -->
        <path d="M30 18 Q35 8 40 18 Q38 12 35 15 Q32 12 30 18" fill="#ff5722"/>
        <path d="M32 20 Q35 14 38 20" fill="#ffeb3b"/>
    </svg>`,
    
    dead_tree: `<svg width="80" height="100" viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg"><path d="M40 100 L40 40" stroke="#2d3436" stroke-width="8"/><path d="M40 70 L20 50 M40 60 L60 40 M40 40 L20 20 M40 45 L50 25" stroke="#2d3436" stroke-width="4" stroke-linecap="round"/></svg>`,
    broken_sword: `<svg width="60" height="100" viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="blade" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#bdc3c7"/><stop offset="50%" stop-color="#ecf0f1"/><stop offset="100%" stop-color="#95a5a6"/></linearGradient></defs><!-- 剑身 --><path d="M22 50 L38 50 L35 95 L25 95 Z" fill="url(#blade)"/><!-- 护手 --><path d="M15 50 Q30 55 45 50 L45 45 Q30 50 15 45 Z" fill="#546e7a" stroke="#37474f" stroke-width="1"/><!-- 剑柄 --><rect x="26" y="15" width="8" height="30" fill="#3e2723"/><path d="M26 20 L34 22 M26 26 L34 28 M26 32 L34 34 M26 38 L34 40" stroke="#5d4037" stroke-width="1"/><!-- 剑首 --><circle cx="30" cy="15" r="6" fill="#546e7a" stroke="#37474f" stroke-width="1"/><circle cx="30" cy="15" r="2" fill="#f1c40f"/></svg>`,
    
    broken_blade: `<svg width="60" height="80" viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg"><path d="M20 80 Q10 40 20 20 L40 20 L40 80 Z" fill="#95a5a6" stroke="#7f8c8d"/><rect x="25" y="0" width="10" height="20" fill="#5d4037"/><circle cx="30" cy="20" r="4" fill="#d7ccc8"/></svg>`,
    
    broken_spear: `<svg width="40" height="120" viewBox="0 0 40 120" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="0" width="4" height="100" fill="#5d4037"/><path d="M20 100 L10 120 L30 120 Z" fill="#95a5a6"/><path d="M15 90 L25 90" stroke="#8d6e63" stroke-width="2"/><path d="M12 85 L28 85" stroke="#a1887f" stroke-width="2"/></svg>`,
    
    shield_round: `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="28" fill="#5d4037" stroke="#3e2723" stroke-width="2"/><circle cx="30" cy="30" r="10" fill="#8d6e63" stroke="#5d4037"/><path d="M30 2 L30 58 M2 30 L58 30" stroke="#3e2723" stroke-width="1" opacity="0.5"/><path d="M10 45 L20 35 M40 15 L50 25" stroke="#3e2723" opacity="0.3"/></svg>`,
    
    chariot_wreck: `<svg width="100" height="80" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg"><path d="M10 50 L90 50 L80 20 L20 20 Z" fill="#4e342e" stroke="#3e2723" stroke-width="2"/><circle cx="25" cy="50" r="20" fill="none" stroke="#3e2723" stroke-width="4"/><path d="M25 30 L25 70 M5 50 L45 50" stroke="#3e2723" stroke-width="2"/><circle cx="25" cy="50" r="4" fill="#3e2723"/><path d="M60 20 L70 0 L80 20" fill="none" stroke="#3e2723" stroke-width="3"/><rect x="50" y="30" width="40" height="15" fill="#3e2723" opacity="0.8"/><path d="M10 50 L0 70" stroke="#3e2723" stroke-width="3" stroke-dasharray="5,5"/></svg>`,
    
    ruin_pillar: `<svg width="50" height="80" viewBox="0 0 50 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="30" height="60" fill="#555"/><path d="M10 20 L40 30 L40 40 L10 30 Z" fill="#444"/><path d="M15 50 L35 50 M15 60 L35 60" stroke="#333" stroke-width="2"/></svg>`,

    // ========== 血煞秘境妖兽 ==========
    
    // 赤翼蝠 - 血红色蝙蝠
    blood_bat: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 血雾光环 -->
        <ellipse cx="32" cy="35" rx="20" ry="16" fill="#8b0000" opacity="0.2"/>
        <!-- 翅膀 -->
        <path d="M8 28 Q2 18 8 12 Q14 8 20 15 L24 28" fill="#8b0000" stroke="#5c0000" stroke-width="1"/>
        <path d="M56 28 Q62 18 56 12 Q50 8 44 15 L40 28" fill="#8b0000" stroke="#5c0000" stroke-width="1"/>
        <!-- 圆身体 -->
        <ellipse cx="32" cy="35" rx="16" ry="14" fill="#b71c1c"/>
        <!-- 大眼睛 -->
        <ellipse cx="26" cy="32" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="38" cy="32" rx="6" ry="7" fill="#fff"/>
        <circle cx="27" cy="33" r="3" fill="#4a0000"/>
        <circle cx="39" cy="33" r="3" fill="#4a0000"/>
        <circle cx="28" cy="32" r="1" fill="#ff5252"/>
        <circle cx="40" cy="32" r="1" fill="#ff5252"/>
        <!-- 小尖牙 -->
        <path d="M28 42 L30 47 L32 42" fill="#fff"/>
        <path d="M32 42 L34 47 L36 42" fill="#fff"/>
        <!-- 小耳朵 -->
        <path d="M22 22 L20 12 L28 20" fill="#8b0000"/>
        <path d="M42 22 L44 12 L36 20" fill="#8b0000"/>
        <!-- 血丝 -->
        <path d="M20 38 Q18 42 20 46" stroke="#ff5252" stroke-width="1" fill="none" opacity="0.5"/>
        <path d="M44 38 Q46 42 44 46" stroke="#ff5252" stroke-width="1" fill="none" opacity="0.5"/>
    </svg>`,

    // 血丝蛛 - Q版小蜘蛛
    blood_spider: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 八条腿 -->
        <path d="M18 30 Q5 20 2 30 Q5 35 18 35" fill="none" stroke="#5c0000" stroke-width="3"/>
        <path d="M18 35 Q5 40 2 50 Q8 52 20 40" fill="none" stroke="#5c0000" stroke-width="3"/>
        <path d="M46 30 Q59 20 62 30 Q59 35 46 35" fill="none" stroke="#5c0000" stroke-width="3"/>
        <path d="M46 35 Q59 40 62 50 Q56 52 44 40" fill="none" stroke="#5c0000" stroke-width="3"/>
        <path d="M20 28 Q10 15 5 18" fill="none" stroke="#5c0000" stroke-width="2"/>
        <path d="M44 28 Q54 15 59 18" fill="none" stroke="#5c0000" stroke-width="2"/>
        <path d="M22 42 Q12 55 8 52" fill="none" stroke="#5c0000" stroke-width="2"/>
        <path d="M42 42 Q52 55 56 52" fill="none" stroke="#5c0000" stroke-width="2"/>
        <!-- 圆润身体 -->
        <ellipse cx="32" cy="35" rx="18" ry="16" fill="#8b0000"/>
        <ellipse cx="32" cy="33" rx="14" ry="12" fill="#b71c1c"/>
        <!-- 腹部花纹 -->
        <ellipse cx="32" cy="42" rx="6" ry="4" fill="#ff5252" opacity="0.5"/>
        <!-- 大眼睛（8只小眼） -->
        <circle cx="25" cy="28" r="5" fill="#fff"/>
        <circle cx="39" cy="28" r="5" fill="#fff"/>
        <circle cx="26" cy="29" r="2.5" fill="#4a0000"/>
        <circle cx="40" cy="29" r="2.5" fill="#4a0000"/>
        <circle cx="27" cy="28" r="1" fill="#ff5252"/>
        <circle cx="41" cy="28" r="1" fill="#ff5252"/>
        <!-- 额头小眼 -->
        <circle cx="29" cy="23" r="2" fill="#ffcdd2"/>
        <circle cx="35" cy="23" r="2" fill="#ffcdd2"/>
        <!-- 嘴巴（獠牙） -->
        <path d="M28 40 L30 45" stroke="#fff" stroke-width="2"/>
        <path d="M36 40 L34 45" stroke="#fff" stroke-width="2"/>
    </svg>`,

    // 赤煞狼 - Q版血狼
    blood_wolf: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 身体 -->
        <ellipse cx="32" cy="42" rx="22" ry="16" fill="#8b0000"/>
        <!-- 大头 -->
        <circle cx="32" cy="28" r="18" fill="#b71c1c"/>
        <!-- 耳朵 -->
        <path d="M18 18 L14 2 L26 14" fill="#8b0000"/>
        <path d="M46 18 L50 2 L38 14" fill="#8b0000"/>
        <path d="M20 16 L17 6 L25 14" fill="#ff5252" opacity="0.5"/>
        <path d="M44 16 L47 6 L39 14" fill="#ff5252" opacity="0.5"/>
        <!-- 大眼睛 -->
        <ellipse cx="24" cy="26" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="40" cy="26" rx="6" ry="7" fill="#fff"/>
        <circle cx="25" cy="27" r="3.5" fill="#4a0000"/>
        <circle cx="41" cy="27" r="3.5" fill="#4a0000"/>
        <circle cx="26" cy="26" r="1.5" fill="#ff5252"/>
        <circle cx="42" cy="26" r="1.5" fill="#ff5252"/>
        <!-- 凶狠眉毛 -->
        <path d="M16 20 L28 24" stroke="#4a0000" stroke-width="3" stroke-linecap="round"/>
        <path d="M48 20 L36 24" stroke="#4a0000" stroke-width="3" stroke-linecap="round"/>
        <!-- 鼻子 -->
        <ellipse cx="32" cy="34" rx="4" ry="3" fill="#4a0000"/>
        <!-- 嘴巴（露齿） -->
        <path d="M24 40 Q32 46 40 40" fill="none" stroke="#4a0000" stroke-width="2"/>
        <path d="M26 40 L28 44" stroke="#fff" stroke-width="2"/>
        <path d="M38 40 L36 44" stroke="#fff" stroke-width="2"/>
        <!-- 尾巴 -->
        <path d="M52 45 Q62 40 58 55" fill="#8b0000" stroke="#5c0000"/>
        <!-- 腮红 -->
        <ellipse cx="16" cy="32" rx="4" ry="2" fill="#ff5252" opacity="0.4"/>
        <ellipse cx="48" cy="32" rx="4" ry="2" fill="#ff5252" opacity="0.4"/>
    </svg>`,

    // 血鳞蟒 - Q版大蛇
    blood_serpent: `<svg width="80" height="64" viewBox="0 0 80 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 蛇身 -->
        <path d="M65 50 Q75 40 70 30 Q60 20 50 30 Q40 40 30 35 Q20 30 15 40" fill="none" stroke="#8b0000" stroke-width="12" stroke-linecap="round"/>
        <path d="M65 50 Q75 40 70 30 Q60 20 50 30 Q40 40 30 35 Q20 30 15 40" fill="none" stroke="#b71c1c" stroke-width="8" stroke-linecap="round"/>
        <!-- 鳞片纹 -->
        <path d="M60 35 L62 40 M50 32 L52 37 M40 36 L42 41 M30 38 L32 43" stroke="#ff5252" stroke-width="2" opacity="0.5"/>
        <!-- 大头 -->
        <ellipse cx="20" cy="32" rx="16" ry="14" fill="#b71c1c"/>
        <!-- 大眼睛 -->
        <ellipse cx="14" cy="28" rx="5" ry="6" fill="#fff"/>
        <ellipse cx="26" cy="28" rx="5" ry="6" fill="#fff"/>
        <ellipse cx="15" cy="29" r="3" fill="#4a0000"/>
        <ellipse cx="27" cy="29" r="3" fill="#4a0000"/>
        <circle cx="16" cy="28" r="1" fill="#ffeb3b"/>
        <circle cx="28" cy="28" r="1" fill="#ffeb3b"/>
        <!-- 信子 -->
        <path d="M8 38 L2 36 M8 38 L2 42" stroke="#ff5252" stroke-width="2" stroke-linecap="round"/>
        <!-- 尾巴尖 -->
        <path d="M65 50 L72 55 L70 48" fill="#ff5252"/>
        <!-- 腮红 -->
        <ellipse cx="10" cy="36" rx="3" ry="2" fill="#ff5252" opacity="0.4"/>
    </svg>`,

    // 血魂鬼 - 血红色幽灵
    blood_ghost: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 血雾 -->
        <ellipse cx="32" cy="35" rx="24" ry="20" fill="#8b0000" opacity="0.2"/>
        <!-- 飘动的身体 -->
        <path d="M16 25 Q16 8 32 8 Q48 8 48 25 L48 45 Q44 50 40 45 Q36 50 32 45 Q28 50 24 45 Q20 50 16 45 Z" fill="#b71c1c" opacity="0.85"/>
        <!-- 内部高光 -->
        <ellipse cx="32" cy="25" rx="10" ry="8" fill="#ff5252" opacity="0.3"/>
        <!-- 大眼睛 -->
        <ellipse cx="25" cy="25" rx="6" ry="7" fill="#fff"/>
        <ellipse cx="39" cy="25" rx="6" ry="7" fill="#fff"/>
        <circle cx="26" cy="26" r="3" fill="#4a0000"/>
        <circle cx="40" cy="26" r="3" fill="#4a0000"/>
        <circle cx="27" cy="25" r="1" fill="#ff5252"/>
        <circle cx="41" cy="25" r="1" fill="#ff5252"/>
        <!-- 小嘴（惊恐） -->
        <ellipse cx="32" cy="36" rx="5" ry="4" fill="#4a0000" opacity="0.7"/>
        <!-- 血泪 -->
        <path d="M20 30 L18 38" stroke="#ff5252" stroke-width="2" opacity="0.6"/>
        <path d="M44 30 L46 38" stroke="#ff5252" stroke-width="2" opacity="0.6"/>
    </svg>`,

    // 赤甲蝎 - Q版小蝎子
    blood_scorpion: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- 尾巴 -->
        <path d="M32 35 Q32 20 38 12 Q42 8 45 15" fill="none" stroke="#8b0000" stroke-width="6" stroke-linecap="round"/>
        <circle cx="45" cy="15" r="4" fill="#ff5252"/>
        <!-- 身体 -->
        <ellipse cx="32" cy="42" rx="18" ry="12" fill="#8b0000"/>
        <ellipse cx="32" cy="40" rx="14" ry="9" fill="#b71c1c"/>
        <!-- 钳子 -->
        <path d="M14 38 Q5 35 8 28 Q12 25 18 32" fill="#8b0000" stroke="#5c0000"/>
        <path d="M50 38 Q59 35 56 28 Q52 25 46 32" fill="#8b0000" stroke="#5c0000"/>
        <!-- 腿 -->
        <path d="M18 45 L8 55 M22 48 L14 58 M42 48 L50 58 M46 45 L56 55" stroke="#5c0000" stroke-width="2"/>
        <!-- 大头 -->
        <circle cx="32" cy="35" r="10" fill="#b71c1c"/>
        <!-- 大眼睛 -->
        <ellipse cx="28" cy="33" rx="4" ry="5" fill="#fff"/>
        <ellipse cx="36" cy="33" rx="4" ry="5" fill="#fff"/>
        <circle cx="29" cy="34" r="2" fill="#4a0000"/>
        <circle cx="37" cy="34" r="2" fill="#4a0000"/>
        <circle cx="29.5" cy="33" r="0.8" fill="#ff5252"/>
        <circle cx="37.5" cy="33" r="0.8" fill="#ff5252"/>
        <!-- 嘴巴 -->
        <path d="M30 40 Q32 42 34 40" fill="none" stroke="#4a0000" stroke-width="1"/>
    </svg>`,

    // ========== 血煞秘境 BOSS ==========

    // 赤玉蛛王 - 小BOSS
    boss_spider: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <!-- 血雾光环 -->
        <ellipse cx="64" cy="70" rx="55" ry="45" fill="#8b0000" opacity="0.15"/>
        <!-- 八条大腿 -->
        <path d="M30 55 Q5 35 0 50 Q5 60 30 65" fill="none" stroke="#5c0000" stroke-width="6"/>
        <path d="M30 70 Q0 75 0 95 Q10 100 35 80" fill="none" stroke="#5c0000" stroke-width="6"/>
        <path d="M98 55 Q123 35 128 50 Q123 60 98 65" fill="none" stroke="#5c0000" stroke-width="6"/>
        <path d="M98 70 Q128 75 128 95 Q118 100 93 80" fill="none" stroke="#5c0000" stroke-width="6"/>
        <path d="M35 50 Q15 25 8 35" fill="none" stroke="#5c0000" stroke-width="5"/>
        <path d="M93 50 Q113 25 120 35" fill="none" stroke="#5c0000" stroke-width="5"/>
        <path d="M40 85 Q20 110 12 105" fill="none" stroke="#5c0000" stroke-width="5"/>
        <path d="M88 85 Q108 110 116 105" fill="none" stroke="#5c0000" stroke-width="5"/>
        <!-- 大身体 -->
        <ellipse cx="64" cy="70" rx="38" ry="32" fill="#8b0000"/>
        <ellipse cx="64" cy="66" rx="32" ry="26" fill="#b71c1c"/>
        <!-- 血玉晶体效果 -->
        <ellipse cx="64" cy="66" rx="28" ry="22" fill="url(#jade_gradient)" opacity="0.6"/>
        <defs>
            <radialGradient id="jade_gradient">
                <stop offset="0%" stop-color="#ff5252"/>
                <stop offset="100%" stop-color="#8b0000"/>
            </radialGradient>
        </defs>
        <!-- 背部血玉 -->
        <ellipse cx="64" cy="75" rx="12" ry="8" fill="#ff1744" opacity="0.8"/>
        <ellipse cx="50" cy="72" rx="6" ry="4" fill="#ff5252" opacity="0.6"/>
        <ellipse cx="78" cy="72" rx="6" ry="4" fill="#ff5252" opacity="0.6"/>
        <!-- 大眼睛（邪恶） -->
        <ellipse cx="50" cy="55" rx="12" ry="14" fill="#fff"/>
        <ellipse cx="78" cy="55" rx="12" ry="14" fill="#fff"/>
        <ellipse cx="52" cy="57" rx="7" ry="8" fill="#4a0000"/>
        <ellipse cx="80" cy="57" rx="7" ry="8" fill="#4a0000"/>
        <circle cx="54" cy="55" r="3" fill="#ff1744"/>
        <circle cx="82" cy="55" r="3" fill="#ff1744"/>
        <!-- 邪恶眼神（瞳孔发光） -->
        <ellipse cx="52" cy="57" rx="4" ry="5" fill="#ff1744" opacity="0.3"/>
        <ellipse cx="80" cy="57" rx="4" ry="5" fill="#ff1744" opacity="0.3"/>
        <!-- 额头小眼 -->
        <circle cx="58" cy="45" r="4" fill="#ffcdd2"/>
        <circle cx="70" cy="45" r="4" fill="#ffcdd2"/>
        <circle cx="58" cy="45" r="2" fill="#8b0000"/>
        <circle cx="70" cy="45" r="2" fill="#8b0000"/>
        <!-- 獠牙 -->
        <path d="M52 78 L48 92" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        <path d="M76 78 L80 92" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        <!-- 血滴 -->
        <ellipse cx="48" cy="95" rx="3" ry="4" fill="#ff1744"/>
        <ellipse cx="80" cy="95" rx="3" ry="4" fill="#ff1744"/>
    </svg>`,

    // 炎煞蝎皇 - 大BOSS
    boss_scorpion: `<svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <!-- 火焰光环 -->
        <ellipse cx="80" cy="100" rx="70" ry="50" fill="#ff5722" opacity="0.15"/>
        <!-- 大尾巴 -->
        <path d="M80 85 Q80 50 90 30 Q95 15 105 25 Q115 35 110 50" fill="none" stroke="#5c0000" stroke-width="12" stroke-linecap="round"/>
        <path d="M80 85 Q80 50 90 30 Q95 15 105 25 Q115 35 110 50" fill="none" stroke="#8b0000" stroke-width="8" stroke-linecap="round"/>
        <!-- 毒针（发光） -->
        <path d="M110 50 L120 35 L115 55 Z" fill="#ff5722"/>
        <ellipse cx="117" cy="42" rx="8" ry="6" fill="#ffeb3b" opacity="0.6"/>
        <!-- 大身体 -->
        <ellipse cx="80" cy="105" rx="50" ry="35" fill="#5c0000"/>
        <ellipse cx="80" cy="100" rx="45" ry="30" fill="#8b0000"/>
        <!-- 身体裂纹（岩浆效果） -->
        <path d="M50 95 Q60 105 55 115" stroke="#ff5722" stroke-width="3" fill="none"/>
        <path d="M110 95 Q100 105 105 115" stroke="#ff5722" stroke-width="3" fill="none"/>
        <path d="M75 88 L80 100 L85 90" stroke="#ff5722" stroke-width="2" fill="none"/>
        <!-- 巨钳（带火焰） -->
        <path d="M25 90 Q5 75 15 55 Q25 45 40 60 L45 80" fill="#8b0000" stroke="#5c0000" stroke-width="2"/>
        <path d="M15 55 Q10 50 18 45 M15 55 Q25 52 30 58" stroke="#5c0000" stroke-width="3"/>
        <path d="M135 90 Q155 75 145 55 Q135 45 120 60 L115 80" fill="#8b0000" stroke="#5c0000" stroke-width="2"/>
        <path d="M145 55 Q150 50 142 45 M145 55 Q135 52 130 58" stroke="#5c0000" stroke-width="3"/>
        <!-- 钳子火焰 -->
        <ellipse cx="17" cy="50" rx="8" ry="6" fill="#ff5722" opacity="0.7"/>
        <ellipse cx="143" cy="50" rx="8" ry="6" fill="#ff5722" opacity="0.7"/>
        <!-- 腿 -->
        <path d="M45 115 L25 140 M55 120 L40 145 M105 120 L120 145 M115 115 L135 140" stroke="#5c0000" stroke-width="4"/>
        <!-- 大头 -->
        <ellipse cx="80" cy="85" rx="28" ry="22" fill="#b71c1c"/>
        <!-- 护甲纹 -->
        <path d="M60 80 Q80 70 100 80" fill="none" stroke="#5c0000" stroke-width="2"/>
        <!-- 大眼睛（霸气） -->
        <ellipse cx="68" cy="80" rx="10" ry="12" fill="#fff"/>
        <ellipse cx="92" cy="80" rx="10" ry="12" fill="#fff"/>
        <ellipse cx="70" cy="82" rx="6" ry="7" fill="#4a0000"/>
        <ellipse cx="94" cy="82" rx="6" ry="7" fill="#4a0000"/>
        <circle cx="72" cy="80" r="2.5" fill="#ff5722"/>
        <circle cx="96" cy="80" r="2.5" fill="#ff5722"/>
        <!-- 瞳孔火焰 -->
        <ellipse cx="70" cy="82" rx="3" ry="4" fill="#ff5722" opacity="0.4"/>
        <ellipse cx="94" cy="82" rx="3" ry="4" fill="#ff5722" opacity="0.4"/>
        <!-- 凶狠眉毛 -->
        <path d="M54 70 L74 76" stroke="#4a0000" stroke-width="4" stroke-linecap="round"/>
        <path d="M106 70 L86 76" stroke="#4a0000" stroke-width="4" stroke-linecap="round"/>
        <!-- 嘴巴（咆哮） -->
        <ellipse cx="80" cy="98" rx="10" ry="6" fill="#1a0000"/>
        <path d="M74 96 L76 102" stroke="#ff5722" stroke-width="2"/>
        <path d="M86 96 L84 102" stroke="#ff5722" stroke-width="2"/>
        <!-- 王冠/角 -->
        <path d="M65 62 L60 50 L70 58" fill="#ff5722"/>
        <path d="M95 62 L100 50 L90 58" fill="#ff5722"/>
        <path d="M80 58 L80 45" stroke="#ffeb3b" stroke-width="3"/>
        <circle cx="80" cy="42" r="5" fill="#ffeb3b"/>
    </svg>`,

    // 金币
    gold_coin: `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#f1c40f" stroke="#d4a00a" stroke-width="2"/>
        <circle cx="16" cy="16" r="10" fill="none" stroke="#d4a00a" stroke-width="1"/>
        <text x="16" y="21" font-size="14" fill="#d4a00a" text-anchor="middle" font-weight="bold">$</text>
    </svg>`
};

export const ROLES = [
    { id: 'sword', name: '天剑宗', hp: 100, dmg: 10, cd: 0.5, speed: 160, desc: '以身化剑，唯快不破', svg: 'player_sword' },
    { id: 'mage', name: '玄元道', hp: 80,  dmg: 25, cd: 1.0, speed: 140, desc: '通御五行，爆发轰炸', svg: 'player_mage' },
    { id: 'body', name: '荒古门', hp: 200, dmg: 15, cd: 0.8, speed: 150, desc: '肉身成圣，力破万法', svg: 'player_body' },
    { id: 'ghost', name: '幽冥涧', hp: 120, dmg: 15, cd: 1.2, speed: 150, desc: '生死无界，役使亡灵', svg: 'player_ghost' },
    { id: 'formation', name: '天机阁', hp: 90, dmg: 18, cd: 0.6, speed: 145, desc: '算尽天机，画地为牢', svg: 'player_formation' }
];

export const ARTIFACTS = [
    // 攻击型
    { id: 'zhuxian_array', name: '诛仙剑阵', desc: '4剑环绕自动攻击', type: 'attack', cd: 0, svg: 'artifact_zhuxian' },
    { id: 'jinjiao_jian', name: '金蛟剪', desc: '穿透+2，伤害+20%', type: 'attack', cd: 0, svg: 'artifact_jinjiao' },
    // 防御型
    { id: 'xuanwu_dun', name: '玄武盾', desc: '减伤30%，反弹10%', type: 'defense', cd: 0, svg: 'artifact_xuanwu' },
    { id: 'qiankun_quan', name: '乾坤圈', desc: '结界击退敌人', type: 'defense', cd: 0, svg: 'artifact_qiankun' },
    // 移速型
    { id: 'fenghuo_lun', name: '风火轮', desc: '移速+50%，火焰轨迹', type: 'speed', cd: 0, svg: 'artifact_fenghuo' },
    // 控制型
    { id: 'dinghai_zhu', name: '定海神珠', desc: '敌人减速30%光环', type: 'control', cd: 0, svg: 'artifact_dinghai' },
    // 收益型
    { id: 'jubao_pen', name: '聚宝盆', desc: '掉落+50%，拾取+100%', type: 'utility', cd: 0, svg: 'artifact_jubao' },
    // 特效型
    { id: 'fantian', name: '虚天鼎', desc: '每10秒震晕全场', type: 'special', cd: 10, svg: 'artifact_fantian' },
    { id: 'mirror', name: '乾蓝冰焰', desc: '前方烧后方冻', type: 'special', cd: 0, svg: 'artifact_mirror' },
    { id: 'gourd', name: '玄天斩灵', desc: '每5秒斩杀精英', type: 'special', cd: 5, svg: 'artifact_gourd' }
];

export const STAGES = [
    { name: '幽暗密林', time: 0, bg: '#0f1519', grid: '#1c262b', mobs: ['bat', 'rock'] },
    { name: '埋骨之地', time: 60, bg: '#202020', grid: '#333333', mobs: ['bat', 'ghost'] },
    { name: '熔岩炼狱', time: 120, bg: '#1a0505', grid: '#3d0e0e', mobs: ['bat_fire', 'magma_rock'] },
    { name: '极寒冰原', time: 180, bg: '#050a1a', grid: '#0e1e3d', mobs: ['ghost_ice', 'crystal'] },
    { name: '塞外古战场', time: 240, bg: '#5d5340', grid: '#73654d', mobs: ['ghost', 'rock'] },
    { name: '昆仑仙境', time: 360, bg: '#2c3e50', grid: '#34495e', mobs: ['bat_fire', 'ghost_ice', 'magma_rock', 'crystal'] }
];

export const SKILLS = {
    common: [
        { id:'dmg', name:'灵气护体', desc:'基础伤害 +15', icon:'💎', effect:s=>s.dmg+=15 },
        { id:'spd', name:'轻身术', desc:'移动速度 +20', icon:'🦶', effect:s=>s.speed=(s.speed||150)+20 }
    ],
    sword: [
        { id:'sword_mult', name:'万剑归宗', desc:'飞剑数量 +1', icon:'⚔️', effect:s=>s.count++ },
        { id:'sword_spd', name:'御剑术', desc:'攻速 +20%', icon:'🌪️', effect:s=>s.cd*=0.8 },
        { id:'sword_pierce', name:'青莲剑歌', desc:'飞剑穿透 +1', icon:'🗡️', effect:s=>s.pierce=(s.pierce||0)+1 }
    ],
    mage: [
        { id:'mage_boom', name:'红莲业火', desc:'爆炸范围 +50%', icon:'💥', effect:s=>s.area=(s.area||100)*1.5 },
        { id:'mage_cd', name:'五行流转', desc:'施法速度 +25%', icon:'📜', effect:s=>s.cd*=0.75 },
        { id:'mage_thunder', name:'九天神雷', desc:'普通攻击 20% 几率触发落雷', icon:'⚡', effect:s=>s.thunderProb=(s.thunderProb||0)+0.2 }
    ],
    body: [
        { id:'body_range', name:'法天象地', desc:'震荡范围 +30%', icon:'⛰️', effect:s=>s.area=(s.area||150)*1.3 },
        { id:'body_dmg', name:'金刚不坏', desc:'震荡伤害 +40%', icon:'💪', effect:s=>s.dmg*=1.4 },
        { id:'body_kb', name:'力拔山兮', desc:'击退效果大幅增强', icon:'👊', effect:s=>s.knockback=(s.knockback||1.0)*1.5 }
    ],
    ghost: [
        { id:'ghost_speed', name:'幽冥鬼步', desc:'召唤物移动速度 +30%', icon:'👻', effect:s=>s.bulletSpeed=(s.bulletSpeed||250)*1.3 },
        { id:'ghost_duration', name:'怨气不散', desc:'召唤物存在时间 +50%', icon:'⏳', effect:s=>s.bulletLife=(s.bulletLife||1.5)*1.5 },
        { id:'ghost_mult', name:'百鬼夜行', desc:'召唤数量 +1', icon:'💀', effect:s=>s.count++ }
    ],
    formation: [
        { id:'form_size', name:'天罗地网', desc:'阵法范围 +30%', icon:'🕸️', effect:s=>s.area=(s.area||1.0)*1.3 },
        { id:'form_pierce', name:'生门死门', desc:'阵法伤害频次增加', icon:'☯️', effect:s=>s.pierce=(s.pierce||99)+2 },
        { id:'form_stun', name:'画地为牢', desc:'阵法附带强力减速', icon:'🛑', effect:s=>s.stun=true }
    ]
};

// ========== 血煞秘境配置 ==========

// 波次配置
export const ARENA_CONFIG = {
    totalWaves: 10,
    bossWaves: [5, 10], // 第5波和第10波是BOSS波
    waves: [
        { wave: 1, count: 8, mobs: ['blood_bat'], levelMult: 0.5 },
        { wave: 2, count: 10, mobs: ['blood_bat', 'blood_spider'], levelMult: 0.6 },
        { wave: 3, count: 12, mobs: ['blood_spider'], levelMult: 0.7 },
        { wave: 4, count: 10, mobs: ['blood_wolf'], levelMult: 0.8 },
        { wave: 5, count: 1, mobs: ['boss_spider'], levelMult: 1.2, isBoss: true, bossName: '赤玉蛛王' },
        { wave: 6, count: 12, mobs: ['blood_wolf', 'blood_serpent'], levelMult: 0.9 },
        { wave: 7, count: 10, mobs: ['blood_serpent'], levelMult: 1.0 },
        { wave: 8, count: 14, mobs: ['blood_ghost'], levelMult: 1.1 },
        { wave: 9, count: 16, mobs: ['blood_bat', 'blood_wolf', 'blood_ghost'], levelMult: 1.2 },
        { wave: 10, count: 1, mobs: ['boss_scorpion'], levelMult: 2.0, isBoss: true, bossName: '炎煞蝎皇' }
    ]
};

// 血煞秘境妖兽属性
export const ARENA_MOBS = {
    blood_bat: { name: '赤翼蝠', hp: 30, dmg: 8, speed: 100, svg: 'blood_bat', goldDrop: [1, 3] },
    blood_spider: { name: '血丝蛛', hp: 45, dmg: 10, speed: 70, svg: 'blood_spider', goldDrop: [2, 4] },
    blood_wolf: { name: '赤煞狼', hp: 60, dmg: 15, speed: 120, svg: 'blood_wolf', goldDrop: [3, 5] },
    blood_serpent: { name: '血鳞蟒', hp: 80, dmg: 12, speed: 60, svg: 'blood_serpent', goldDrop: [3, 6] },
    blood_ghost: { name: '血魂鬼', hp: 50, dmg: 18, speed: 90, svg: 'blood_ghost', goldDrop: [2, 5] },
    blood_scorpion: { name: '赤甲蝎', hp: 40, dmg: 12, speed: 85, svg: 'blood_scorpion', goldDrop: [2, 4] }
};

// BOSS配置
export const ARENA_BOSSES = {
    boss_spider: {
        name: '赤玉蛛王',
        hp: 2000,
        dmg: 25,
        speed: 50,
        size: 3.0,
        svg: 'boss_spider',
        goldDrop: [15, 25],
        cardDrop: 1,
        skills: ['poison_spray', 'web_trap', 'jade_armor']
    },
    boss_scorpion: {
        name: '炎煞蝎皇',
        hp: 5000,
        dmg: 40,
        speed: 40,
        size: 4.0,
        svg: 'boss_scorpion',
        goldDrop: [50, 80],
        cardDrop: 3,
        skills: ['claw_sweep', 'tail_strike', 'summon_scorpions', 'rage_mode'],
        phases: [
            { hpPercent: 100, name: '普通' },
            { hpPercent: 50, name: '狂暴', speedMult: 1.3, dmgMult: 1.5 }
        ]
    }
};

// 道具卡配置
export const ITEM_CARDS = [
    // 攻击类
    { id: 'leijie_zhu', name: '雷劫珠', icon: '⚡', desc: '天雷连轰3次', effect: 'thunder_strike', value: 150, rarity: 'epic', dropRate: 0.05 },
    { id: 'fantian_yin', name: '翻天印', icon: '🔱', desc: '全场震击200伤害', effect: 'screen_damage', value: 200, rarity: 'epic', dropRate: 0.05 },
    // 控制类
    { id: 'bingpo_zhu', name: '冰魄珠', icon: '🔮', desc: '全场冻结3秒', effect: 'freeze_all', value: 3, rarity: 'rare', dropRate: 0.08 },
    { id: 'dingshen_fu', name: '定身符', icon: '📜', desc: '定住5敌人10秒', effect: 'stun_random', value: 5, rarity: 'rare', dropRate: 0.08 },
    { id: 'hundun_ling', name: '混沌铃', icon: '🔔', desc: '敌人互攻5秒', effect: 'chaos', value: 5, rarity: 'legendary', dropRate: 0.02 },
    // 陷阱类
    { id: 'jingji_zhong', name: '荆棘种', icon: '🌿', desc: '地面荆棘伤害', effect: 'thorn_trap', value: 10, rarity: 'common', dropRate: 0.15 },
    { id: 'baoyan_shi', name: '爆炎石', icon: '💎', desc: '定时炸弹', effect: 'time_bomb', value: 300, rarity: 'rare', dropRate: 0.08 },
    // 位移类
    { id: 'suodi_fu', name: '缩地符', icon: '🌀', desc: '瞬移逃命', effect: 'teleport', value: 1, rarity: 'rare', dropRate: 0.08 },
    { id: 'fenshen_fu', name: '分身符', icon: '👥', desc: '分身吸引仇恨', effect: 'decoy', value: 5, rarity: 'epic', dropRate: 0.05 },
    // 增益类
    { id: 'jifeng_fu', name: '疾风符', icon: '💨', desc: '移速x2持续10秒', effect: 'speed_boost', value: 10, rarity: 'common', dropRate: 0.15 },
    { id: 'jinshen_fu', name: '金身符', icon: '🛡️', desc: '无敌3秒', effect: 'invincible', value: 3, rarity: 'rare', dropRate: 0.08 },
    { id: 'kuangbao_dan', name: '狂暴丹', icon: '💊', desc: '攻击x2持续10秒', effect: 'damage_boost', value: 10, rarity: 'rare', dropRate: 0.08 },
    // 回复类
    { id: 'huiqi_dan', name: '回气丹', icon: '💚', desc: '回复40%血量', effect: 'heal', value: 0.4, rarity: 'common', dropRate: 0.15 },
    { id: 'juling_zhen', name: '聚灵阵', icon: '⭐', desc: '经验x2持续10秒', effect: 'exp_boost', value: 10, rarity: 'rare', dropRate: 0.08 },
    // 特殊类
    { id: 'qiankun_dai', name: '乾坤袋', icon: '👝', desc: '吸走5只怪物', effect: 'absorb_enemy', value: 5, rarity: 'legendary', dropRate: 0.02 }
];
