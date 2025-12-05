// ========== 游戏 UI 实现 ==========
// 血色秘境所有界面：开始菜单、HUD、升级、结算等

import { Platform } from './platform.js';
import { UIManager, Panel, Button, Label, ProgressBar, Card } from './canvas-ui.js';
import { VirtualJoystick } from './joystick.js';
import { ROLES, ARENA_CONFIG, SKILLS, STAGES } from './data.js';
import { GAME_MODES } from './arena-unified.js';

// ========== 游戏 UI 控制器 ==========
export class GameUI {
    constructor(canvas, engine, width, height) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = engine;
        
        // 使用逻辑尺寸（而非 canvas.width/height 像素尺寸）
        const systemInfo = Platform.getSystemInfo();
        this.width = width || systemInfo.windowWidth;
        this.height = height || systemInfo.windowHeight;
        
        // UI 管理器（传入逻辑尺寸）
        this.ui = new UIManager(canvas, this.width, this.height);
        
        // 虚拟摇杆
        this.joystick = null;
        
        // 当前显示的界面
        this.currentScreen = 'start'; // start, playing, levelup, skill, victory, defeat
        
        // 缓存的 UI 组件
        this.components = {};
        
        // HUD 数据
        this.hudData = {
            hp: 100,
            maxHp: 100,
            exp: 0,
            maxExp: 100,
            wave: 1,
            maxWave: 10,
            enemyCount: 0,
            gold: 0,
            rankName: '练气期',
            rankLevel: 1,
            // 关卡模式专用
            stageName: '幽暗密林',
            playTime: 0
        };
        
        // 选择的角色
        this.selectedRole = 'sword';
        
        // 游戏模式
        this.selectedMode = GAME_MODES.ARENA;
        this.selectedStageIdx = 0;
        
        // 初始化
        this.init();
    }
    
    init() {
        // 从存储读取角色选择
        const savedRole = Platform.getStorage('arenaRole');
        if (savedRole && ROLES.find(r => r.id === savedRole)) {
            this.selectedRole = savedRole;
        }
        
        // 初始化触摸事件（Web环境）
        if (Platform.isWeb) {
            Platform.initWebTouchEvents(this.canvas);
        }
        
        // 添加道具卡槽触摸事件
        this.setupItemSlotTouch();
        
        // 创建开始菜单
        this.createStartMenu();
    }
    
    // 设置道具卡槽触摸事件（只绑定一次）
    _itemSlotTouchBound = false;
    setupItemSlotTouch() {
        if (this._itemSlotTouchBound) return;
        this._itemSlotTouchBound = true;
        
        Platform.onTouchStart((e) => {
            if (this.currentScreen !== 'playing') return;
            if (!this.engine || !this.engine.itemCards) return;
            
            const touch = e.touches[0] || e.changedTouches[0];
            if (!touch) return;
            
            // 获取屏幕坐标转换为逻辑坐标
            let x, y;
            if (Platform.isWeb && this.canvas.getBoundingClientRect) {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.width / rect.width;
                const scaleY = this.height / rect.height;
                x = (touch.clientX - rect.left) * scaleX;
                y = (touch.clientY - rect.top) * scaleY;
            } else {
                // 小游戏环境直接使用 clientX/clientY
                x = touch.clientX;
                y = touch.clientY;
            }
            
            // 检查是否点击了道具卡槽
            this.engine.itemCards.handleTouch(x, y, this.width, this.height);
        });
    }
    
    // 调整大小
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.ui.resize(width, height);
        
        // 重新创建当前界面
        if (this.currentScreen === 'start') {
            this.createStartMenu();
        } else if (this.currentScreen === 'playing') {
            this.createHUD();
        }
    }
    
    // ========== 开始菜单 ==========
    createStartMenu() {
        console.log('[GameUI] createStartMenu called');
        this.ui.clearAll();
        this.currentScreen = 'start';
        
        const cx = this.width / 2;
        const cy = this.height / 2;
        const panelWidth = Math.min(380, this.width - 40);
        const panelHeight = Math.min(580, this.height - 60);
        
        // 背景面板
        const panel = new Panel(
            cx - panelWidth / 2,
            cy - panelHeight / 2,
            panelWidth,
            panelHeight,
            {
                bgColor: 'rgba(20, 10, 10, 0.95)',
                borderColor: '#5a2020',
                borderRadius: 20
            }
        );
        this.ui.add(panel, 'overlay');
        console.log('[GameUI] Panel added, interactive components:', this.ui.getInteractiveComponents().length);
        
        // 标题
        const title = new Label(panelWidth / 2, 28, '灵剑 • 绝世仙缘', {
            fontSize: 28,
            color: '#c0392b',
            align: 'center',
            shadow: { color: '#000', blur: 10 }
        });
        panel.addChild(title);
        
        // 副标题
        const subtitle = new Label(panelWidth / 2, 52, '移动版', {
            fontSize: 14,
            color: '#888',
            align: 'center'
        });
        panel.addChild(subtitle);
        
        // ========== 模式选择标签页 ==========
        const tabY = 75;
        const tabWidth = (panelWidth - 40) / 2;
        
        // 关卡模式按钮
        const stageTabBtn = new Button(
            15, tabY, tabWidth, 35,
            '🗺️ 关卡模式',
            {
                fontSize: 14,
                bgColor: this.selectedMode === GAME_MODES.STAGE ? 'rgba(52, 152, 219, 0.8)' : 'rgba(60, 60, 60, 0.6)',
                borderColor: this.selectedMode === GAME_MODES.STAGE ? '#3498db' : '#555',
                borderRadius: 10,
                onClick: () => { this.selectedMode = GAME_MODES.STAGE; this.createStartMenu(); }
            }
        );
        panel.addChild(stageTabBtn);
        
        // 秘境模式按钮
        const arenaTabBtn = new Button(
            panelWidth / 2 + 5, tabY, tabWidth, 35,
            '⚔️ 血色秘境',
            {
                fontSize: 14,
                bgColor: this.selectedMode === GAME_MODES.ARENA ? 'rgba(192, 57, 43, 0.8)' : 'rgba(60, 60, 60, 0.6)',
                borderColor: this.selectedMode === GAME_MODES.ARENA ? '#c0392b' : '#555',
                borderRadius: 10,
                onClick: () => { this.selectedMode = GAME_MODES.ARENA; this.createStartMenu(); }
            }
        );
        panel.addChild(arenaTabBtn);
        
        // ========== 根据模式显示不同内容 ==========
        const contentY = 125;
        
        if (this.selectedMode === GAME_MODES.ARENA) {
            // 秘境模式说明
            const descItems = [
                '📜 十波妖潮，层层递进',
                '🕷️ 第五波：小BOSS 赤玉蛛王',
                '🦂 第十波：大BOSS 炎煞蝎皇',
                '💎 击败怪物获取道具卡牌'
            ];
            descItems.forEach((text, i) => {
                const label = new Label(20, contentY + i * 22, text, {
                    fontSize: 12,
                    color: '#aaa',
                    align: 'left'
                });
                panel.addChild(label);
            });
        } else {
            // 关卡模式 - 3x2 网格卡片布局
            const stageIcons = ['🌲', '💀', '🔥', '❄️', '⚔️', '✨'];
            const stageColors = [
                { normal: '#2e7d32', selected: '#4caf50' },
                { normal: '#5d4037', selected: '#8d6e63' },
                { normal: '#bf360c', selected: '#ff5722' },
                { normal: '#0288d1', selected: '#03a9f4' },
                { normal: '#8d6e63', selected: '#d4a574' },
                { normal: '#f1c40f', selected: '#ffd54f' }
            ];
            
            const stageStartY = contentY;
            const cols = 3;
            const cardWidth = (panelWidth - 50) / cols;
            const cardHeight = 75;
            const gapX = 5;
            const gapY = 8;
            const visibleStages = STAGES.slice(0, 6);
            
            visibleStages.forEach((stage, i) => {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const isSelected = i === this.selectedStageIdx;
                const color = stageColors[i] || stageColors[0];
                
                const cardX = 15 + col * (cardWidth + gapX);
                const cardY = stageStartY + row * (cardHeight + gapY);
                
                const stageCard = new Button(
                    cardX, cardY,
                    cardWidth, cardHeight,
                    '',  // 不使用文字，我们自己绘制内容
                    {
                        fontSize: 11,
                        bgColor: isSelected ? `rgba(52, 152, 219, 0.3)` : 'rgba(30, 30, 30, 0.8)',
                        borderColor: isSelected ? color.selected : color.normal,
                        borderRadius: 10,
                        onClick: () => { this.selectedStageIdx = i; this.createStartMenu(); }
                    }
                );
                panel.addChild(stageCard);
                
                // 关卡图标
                const iconLabel = new Label(cardX + cardWidth / 2, cardY + 22, stageIcons[i] || '🗺️', {
                    fontSize: 24,
                    color: '#fff',
                    align: 'center'
                });
                panel.addChild(iconLabel);
                
                // 关卡名称
                const nameLabel = new Label(cardX + cardWidth / 2, cardY + 48, stage.name.slice(0, 4), {
                    fontSize: 11,
                    color: isSelected ? '#fff' : '#ccc',
                    align: 'center'
                });
                panel.addChild(nameLabel);
                
                // 选中指示器
                if (isSelected) {
                    const indicator = new Label(cardX + cardWidth / 2, cardY + 65, '●', {
                        fontSize: 8,
                        color: color.selected,
                        align: 'center'
                    });
                    panel.addChild(indicator);
                }
            });
        }
        
        // ========== 角色选择 ==========
        // 秘境模式: 105px 描述文字下方 | 关卡模式: 175px (2行卡片 * 83px)
        const roleY = this.selectedMode === GAME_MODES.ARENA ? contentY + 105 : contentY + 175;
        
        const roleLabel = new Label(panelWidth / 2, roleY, '选择角色', {
            fontSize: 12,
            color: '#888',
            align: 'center'
        });
        panel.addChild(roleLabel);
        
        const role = ROLES.find(r => r.id === this.selectedRole) || ROLES[0];
        const roleName = new Label(panelWidth / 2, roleY + 22, role.name, {
            fontSize: 20,
            color: this.selectedMode === GAME_MODES.ARENA ? '#c0392b' : '#3498db',
            align: 'center',
            shadow: { color: '#000', blur: 5 }
        });
        panel.addChild(roleName);
        
        // 角色选择按钮
        const roleButtonY = roleY + 50;
        const roleButtonWidth = (panelWidth - 50) / ROLES.length;
        ROLES.forEach((r, i) => {
            const btn = new Button(
                15 + i * roleButtonWidth + 3,
                roleButtonY,
                roleButtonWidth - 6,
                32,
                r.name.slice(0, 2),
                {
                    fontSize: 11,
                    bgColor: r.id === this.selectedRole ? 'rgba(192, 57, 43, 0.8)' : 'rgba(60, 30, 30, 0.7)',
                    borderColor: r.id === this.selectedRole ? '#ff6b6b' : '#5a2020',
                    borderRadius: 8,
                    onClick: () => this.selectRole(r.id)
                }
            );
            panel.addChild(btn);
        });
        
        // ========== 进入按钮 ==========
        const enterText = this.selectedMode === GAME_MODES.ARENA ? '⚔️ 进入秘境 ⚔️' : '🗺️ 开始冒险 🗺️';
        const enterColor = this.selectedMode === GAME_MODES.ARENA ? 'rgba(139, 0, 0, 0.9)' : 'rgba(41, 128, 185, 0.9)';
        const enterBorder = this.selectedMode === GAME_MODES.ARENA ? '#ff6b6b' : '#5dade2';
        
        const enterBtn = new Button(
            30,
            panelHeight - 100,
            panelWidth - 60,
            45,
            enterText,
            {
                fontSize: 18,
                bgColor: enterColor,
                borderColor: enterBorder,
                borderRadius: 22,
                onClick: () => this.startGame()
            }
        );
        panel.addChild(enterBtn);
        
        // 返回按钮
        const backBtn = new Button(
            30,
            panelHeight - 48,
            panelWidth - 60,
            32,
            '返回山门',
            {
                fontSize: 13,
                bgColor: 'rgba(80, 40, 40, 0.8)',
                borderColor: '#5a2020',
                borderRadius: 12,
                onClick: () => this.backToMain()
            }
        );
        panel.addChild(backBtn);
    }
    
    // 格式化时间
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
    
    // 选择角色
    selectRole(roleId) {
        this.selectedRole = roleId;
        Platform.setStorage('arenaRole', roleId);
        this.createStartMenu(); // 刷新界面
    }
    
    // 开始游戏
    startGame() {
        this.ui.clearAll();
        this.currentScreen = 'playing';
        
        // 创建 HUD
        this.createHUD();
        
        // 创建虚拟摇杆
        this.createJoystick();
        
        // 通知引擎开始 - 传递模式和关卡参数
        if (this.engine && this.engine.start) {
            this.engine.start(this.selectedRole, this.selectedMode, this.selectedStageIdx);
        }
    }
    
    // 返回主界面
    backToMain() {
        // 在小游戏环境下可能需要不同处理
        if (Platform.isWeb) {
            window.location.href = Platform.getSystemInfo().isMobile ? 'mobile.html' : 'pc.html';
        } else {
            // 小游戏环境下重新显示开始菜单或跳转场景
            this.createStartMenu();
        }
    }
    
    // ========== HUD ==========
    createHUD() {
        // 顶部 HUD 容器
        const hudTop = {
            x: 10,
            y: 10,
            visible: true,
            draw: (ctx) => this.drawHUD(ctx)
        };
        this.ui.add(hudTop, 'hud');
        
        // BOSS 血条（初始隐藏）
        this.bossHud = {
            visible: false,
            name: '',
            hp: 0,
            maxHp: 0
        };
    }
    
    // 绘制 HUD
    drawHUD(ctx) {
        const d = this.hudData;
        const padding = 10;
        const isMobile = Platform.getSystemInfo().isMobile;
        
        // ========== 左上角：头像 + 血条 + 经验 ==========
        // 头像框
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(35, 35, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // TODO: 绘制角色头像（需要加载图片）
        ctx.fillStyle = '#c0392b';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const role = ROLES.find(r => r.id === this.selectedRole);
        ctx.fillText(role ? role.name[0] : '剑', 35, 35);
        
        // 境界信息
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${d.rankName} ${d.rankLevel}层`, 65, 18);
        
        // 血条
        const barX = 65;
        const barWidth = isMobile ? 100 : 150;
        const barHeight = 12;
        
        // 血条背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.drawRoundRect(ctx, barX, 28, barWidth, barHeight, 4);
        ctx.fill();
        
        // 血条填充
        const hpRatio = d.maxHp > 0 ? d.hp / d.maxHp : 0;
        ctx.fillStyle = hpRatio < 0.3 ? '#e74c3c' : '#27ae60';
        this.drawRoundRect(ctx, barX, 28, barWidth * hpRatio, barHeight, 4);
        ctx.fill();
        
        // 血条文字
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('气血', barX + barWidth / 2, 36);
        
        // 经验条
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.drawRoundRect(ctx, barX, 44, barWidth, barHeight, 4);
        ctx.fill();
        
        const expRatio = d.maxExp > 0 ? d.exp / d.maxExp : 0;
        ctx.fillStyle = '#3498db';
        this.drawRoundRect(ctx, barX, 44, barWidth * expRatio, barHeight, 4);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.fillText('修为', barX + barWidth / 2, 52);
        
        // ========== 顶部中间：波次/关卡信息 ==========
        const cx = this.width / 2;
        const gameMode = this.engine?.gameMode || GAME_MODES.ARENA;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.drawRoundRect(ctx, cx - 60, 8, 120, 48, 10);
        ctx.fill();
        
        ctx.strokeStyle = gameMode === GAME_MODES.ARENA ? '#8b0000' : '#2980b9';
        ctx.lineWidth = 1;
        this.drawRoundRect(ctx, cx - 60, 8, 120, 48, 10);
        ctx.stroke();
        
        if (gameMode === GAME_MODES.ARENA) {
            // 秘境模式：显示波次
            ctx.fillStyle = '#fff';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('第', cx - 25, 25);
            
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 24px Arial';
            ctx.fillText(d.wave, cx, 32);
            
            ctx.fillStyle = '#fff';
            ctx.font = '11px Arial';
            ctx.fillText(`/${d.maxWave} 波`, cx + 25, 25);
            
            ctx.fillStyle = '#aaa';
            ctx.font = '11px Arial';
            ctx.fillText(`剩余: ${d.enemyCount}`, cx, 50);
        } else {
            // 关卡模式：显示时间和关卡名
            ctx.fillStyle = '#3498db';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(d.stageName, cx, 22);
            
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(this.formatTime(d.playTime), cx, 42);
            
            ctx.fillStyle = '#aaa';
            ctx.font = '10px Arial';
            ctx.fillText(`敌人: ${d.enemyCount}`, cx, 54);
        }
        
        // ========== 右上角：金币 ==========
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.drawRoundRect(ctx, this.width - 90, 8, 80, 30, 8);
        ctx.fill();
        
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('💰', this.width - 85, 28);
        
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(d.gold, this.width - 60, 28);
        
        // ========== 道具卡槽（屏幕右下角） ==========
        this.drawItemSlots(ctx);
        
        // ========== BOSS 血条 ==========
        if (this.bossHud.visible) {
            const bossY = this.height - 100;
            const bossBarWidth = this.width * 0.7;
            const bossBarX = (this.width - bossBarWidth) / 2;
            
            // BOSS 名字
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 5;
            ctx.fillText(this.bossHud.name, this.width / 2, bossY - 15);
            ctx.shadowBlur = 0;
            
            // BOSS 血条背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.drawRoundRect(ctx, bossBarX, bossY, bossBarWidth, 20, 6);
            ctx.fill();
            
            // BOSS 血条填充
            const bossHpRatio = this.bossHud.maxHp > 0 ? this.bossHud.hp / this.bossHud.maxHp : 0;
            const gradient = ctx.createLinearGradient(bossBarX, 0, bossBarX + bossBarWidth, 0);
            gradient.addColorStop(0, '#8b0000');
            gradient.addColorStop(1, '#ff4444');
            ctx.fillStyle = gradient;
            this.drawRoundRect(ctx, bossBarX, bossY, bossBarWidth * bossHpRatio, 20, 6);
            ctx.fill();
            
            // 边框
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            this.drawRoundRect(ctx, bossBarX, bossY, bossBarWidth, 20, 6);
            ctx.stroke();
        }
    }
    
    // 绘制道具卡槽
    drawItemSlots(ctx) {
        if (!this.engine || !this.engine.itemCards) return;
        
        const slots = this.engine.itemCards.slots;
        const slotSize = 40;
        const spacing = 5;
        const startX = this.width - (slotSize + spacing) * 6 - 10;
        const startY = this.height - slotSize - 80;
        
        for (let i = 0; i < 6; i++) {
            const x = startX + (slotSize + spacing) * i;
            const y = startY;
            const card = slots[i];
            
            // 槽位背景
            ctx.fillStyle = card ? 'rgba(139, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)';
            this.drawRoundRect(ctx, x, y, slotSize, slotSize, 6);
            ctx.fill();
            
            // 边框
            ctx.strokeStyle = card ? '#c0392b' : '#444';
            ctx.lineWidth = 2;
            this.drawRoundRect(ctx, x, y, slotSize, slotSize, 6);
            ctx.stroke();
            
            if (card) {
                // 卡牌图标
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#fff';
                ctx.fillText(card.icon || '🃏', x + slotSize / 2, y + slotSize / 2);
                
                // 数量
                if (card.count > 1) {
                    ctx.font = 'bold 12px Arial';
                    ctx.fillStyle = '#f1c40f';
                    ctx.textAlign = 'right';
                    ctx.fillText(`×${card.count}`, x + slotSize - 3, y + slotSize - 5);
                }
            } else {
                // 空槽位显示快捷键提示
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#666';
                ctx.fillText(i + 1, x + slotSize / 2, y + slotSize / 2);
            }
        }
    }
    
    drawRoundRect(ctx, x, y, w, h, r) {
        r = Math.min(r, h / 2, w / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
    
    // ========== 虚拟摇杆 ==========
    createJoystick() {
        const info = Platform.getSystemInfo();
        
        // 摇杆触发区域（屏幕左半部分下方）
        this.joystick = new VirtualJoystick({
            zone: {
                x: 0,
                y: this.height * 0.4,
                width: this.width * 0.5,
                height: this.height * 0.5
            },
            baseRadius: info.isMobile ? 60 : 50,
            knobRadius: info.isMobile ? 25 : 20,
            dynamic: true,
            onMove: (dx, dy, force, angle) => {
                // 传递给引擎
                if (this.engine) {
                    this.engine.setJoystickInput(dx, dy, force > 0.1);
                }
            }
        });
    }
    
    // ========== 升级界面 ==========
    showLevelUpMenu(cards, callback) {
        this.currentScreen = 'levelup';
        this.ui.clearLayer('overlay');
        
        const cx = this.width / 2;
        const cy = this.height / 2;
        
        // 半透明背景
        const bg = {
            x: 0, y: 0,
            visible: true,
            draw: (ctx) => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, this.width, this.height);
            }
        };
        this.ui.add(bg, 'overlay');
        
        // 标题
        const title = new Label(cx, 50, '顿悟机缘', {
            fontSize: 32,
            color: '#f1c40f',
            align: 'center',
            shadow: { color: '#000', blur: 10 }
        });
        this.ui.add(title, 'overlay');
        
        // 卡片
        const cardWidth = Math.min(120, (this.width - 80) / 3);
        const cardHeight = 160;
        const totalWidth = cardWidth * cards.length + 20 * (cards.length - 1);
        const startX = cx - totalWidth / 2;
        
        cards.forEach((cardData, i) => {
            const card = new Card(
                startX + i * (cardWidth + 20),
                cy - cardHeight / 2,
                cardWidth,
                cardHeight,
                {
                    icon: cardData.icon || '⚔️',
                    title: cardData.name,
                    description: cardData.desc,
                    onClick: () => {
                        this.hideLevelUpMenu();
                        if (callback) callback(cardData);
                    }
                }
            );
            this.ui.add(card, 'overlay');
        });
    }
    
    hideLevelUpMenu() {
        this.ui.clearLayer('overlay');
        this.currentScreen = 'playing';
    }
    
    // ========== 技能选择界面 ==========
    showSkillMenu(skills, callback) {
        this.currentScreen = 'skill';
        this.ui.clearLayer('overlay');
        
        const cx = this.width / 2;
        const cy = this.height / 2;
        
        // 半透明背景
        const bg = {
            x: 0, y: 0,
            visible: true,
            draw: (ctx) => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, 0, this.width, this.height);
            }
        };
        this.ui.add(bg, 'overlay');
        
        // 标题
        const title = new Label(cx, 40, '⚔️ 波次通过 · 选择功法 ⚔️', {
            fontSize: 24,
            color: '#f1c40f',
            align: 'center',
            shadow: { color: '#000', blur: 10 }
        });
        this.ui.add(title, 'overlay');
        
        // 技能卡片
        const cardWidth = Math.min(150, (this.width - 60) / skills.length);
        const cardHeight = 180;
        const totalWidth = cardWidth * skills.length + 15 * (skills.length - 1);
        const startX = cx - totalWidth / 2;
        
        skills.forEach((skill, i) => {
            const card = new Card(
                startX + i * (cardWidth + 15),
                cy - cardHeight / 2,
                cardWidth,
                cardHeight,
                {
                    icon: skill.icon || '✨',
                    title: skill.name,
                    description: skill.desc,
                    bgColor: 'rgba(40, 20, 50, 0.95)',
                    borderColor: '#9c27b0',
                    borderColorHover: '#e040fb',
                    onClick: () => {
                        this.hideSkillMenu();
                        if (callback) callback(skill);
                    }
                }
            );
            this.ui.add(card, 'overlay');
        });
    }
    
    hideSkillMenu() {
        this.ui.clearLayer('overlay');
        this.currentScreen = 'playing';
    }
    
    // ========== 胜利界面 ==========
    showVictoryMenu(stats) {
        this.currentScreen = 'victory';
        this.ui.clearLayer('overlay');
        this.destroyJoystick();
        
        const cx = this.width / 2;
        const cy = this.height / 2;
        const panelWidth = Math.min(320, this.width - 40);
        const panelHeight = 350;
        
        // 面板
        const panel = new Panel(
            cx - panelWidth / 2,
            cy - panelHeight / 2,
            panelWidth,
            panelHeight,
            {
                bgColor: 'rgba(20, 30, 20, 0.95)',
                borderColor: '#27ae60',
                title: '✨ 血色秘境 · 通关 ✨',
                titleColor: '#f1c40f',
                titleFontSize: 24
            }
        );
        this.ui.add(panel, 'overlay');
        
        // 统计信息
        const statY = 70;
        const statItems = [
            { label: '击杀妖兽:', value: stats.kills, unit: '只' },
            { label: '获得金币:', value: stats.gold, unit: '💰', color: '#f1c40f' },
            { label: '通关用时:', value: stats.time, unit: '' },
            { label: '评价:', value: stats.stars, unit: '', color: '#f1c40f' }
        ];
        
        statItems.forEach((item, i) => {
            const label = new Label(30, statY + i * 35, item.label, {
                fontSize: 14,
                color: '#aaa',
                align: 'left'
            });
            panel.addChild(label);
            
            const value = new Label(panelWidth - 30, statY + i * 35, `${item.value} ${item.unit}`, {
                fontSize: 16,
                color: item.color || '#fff',
                align: 'right'
            });
            panel.addChild(value);
        });
        
        // 再次挑战按钮
        const retryBtn = new Button(
            30,
            panelHeight - 100,
            panelWidth - 60,
            40,
            '再次挑战',
            {
                fontSize: 16,
                bgColor: 'rgba(39, 174, 96, 0.9)',
                borderColor: '#2ecc71',
                onClick: () => this.restartGame()
            }
        );
        panel.addChild(retryBtn);
        
        // 返回按钮
        const backBtn = new Button(
            30,
            panelHeight - 50,
            panelWidth - 60,
            35,
            '返回山门',
            {
                fontSize: 14,
                bgColor: 'rgba(80, 80, 80, 0.8)',
                borderColor: '#666',
                onClick: () => this.backToMain()
            }
        );
        panel.addChild(backBtn);
    }
    
    // ========== 失败界面 ==========
    showDefeatMenu(stats) {
        this.currentScreen = 'defeat';
        this.ui.clearLayer('overlay');
        this.destroyJoystick();
        
        const cx = this.width / 2;
        const cy = this.height / 2;
        const panelWidth = Math.min(320, this.width - 40);
        const panelHeight = 320;
        
        // 面板
        const panel = new Panel(
            cx - panelWidth / 2,
            cy - panelHeight / 2,
            panelWidth,
            panelHeight,
            {
                bgColor: 'rgba(30, 15, 15, 0.95)',
                borderColor: '#8b0000',
                title: '💀 试炼失败 💀',
                titleColor: '#e74c3c',
                titleFontSize: 24
            }
        );
        this.ui.add(panel, 'overlay');
        
        // 统计信息
        const statY = 70;
        const statItems = [
            { label: '坚持到:', value: `第 ${stats.wave} 波`, unit: '' },
            { label: '击杀妖兽:', value: stats.kills, unit: '只' },
            { label: '获得金币:', value: Math.floor(stats.gold * 0.5), unit: '💰 (保留50%)', color: '#f1c40f' }
        ];
        
        statItems.forEach((item, i) => {
            const label = new Label(30, statY + i * 35, item.label, {
                fontSize: 14,
                color: '#aaa',
                align: 'left'
            });
            panel.addChild(label);
            
            const value = new Label(panelWidth - 30, statY + i * 35, `${item.value} ${item.unit}`, {
                fontSize: 16,
                color: item.color || '#fff',
                align: 'right'
            });
            panel.addChild(value);
        });
        
        // 引用
        const quote = new Label(panelWidth / 2, statY + 120, '"修为尚浅，来日再战"', {
            fontSize: 14,
            color: '#888',
            align: 'center'
        });
        panel.addChild(quote);
        
        // 再次挑战按钮
        const retryBtn = new Button(
            30,
            panelHeight - 100,
            panelWidth - 60,
            40,
            '再次挑战',
            {
                fontSize: 16,
                bgColor: 'rgba(139, 0, 0, 0.9)',
                borderColor: '#ff6b6b',
                onClick: () => this.restartGame()
            }
        );
        panel.addChild(retryBtn);
        
        // 返回按钮
        const backBtn = new Button(
            30,
            panelHeight - 50,
            panelWidth - 60,
            35,
            '返回山门',
            {
                fontSize: 14,
                bgColor: 'rgba(80, 80, 80, 0.8)',
                borderColor: '#666',
                onClick: () => this.backToMain()
            }
        );
        panel.addChild(backBtn);
    }
    
    // 重新开始游戏
    restartGame() {
        this.ui.clearAll();
        this.startGame();
    }
    
    // 销毁摇杆
    destroyJoystick() {
        if (this.joystick) {
            this.joystick.destroy();
            this.joystick = null;
        }
    }
    
    // ========== 倒计时界面 ==========
    showCountdown(number, text, callback) {
        this.ui.clearLayer('popup');
        
        const cx = this.width / 2;
        const cy = this.height / 2;
        
        // 数字
        const numLabel = new Label(cx, cy - 30, String(number), {
            fontSize: 120,
            color: '#ff4444',
            align: 'center',
            shadow: { color: '#000', blur: 20 }
        });
        this.ui.add(numLabel, 'popup');
        
        // 文字
        const textLabel = new Label(cx, cy + 60, text, {
            fontSize: 24,
            color: '#ffcc00',
            align: 'center'
        });
        this.ui.add(textLabel, 'popup');
        
        // 1秒后自动关闭
        setTimeout(() => {
            this.ui.clearLayer('popup');
            if (callback) callback();
        }, 1000);
    }
    
    // ========== 更新方法 ==========
    
    // 更新 HUD 数据
    updateHUD(data) {
        Object.assign(this.hudData, data);
    }
    
    // 显示/隐藏 BOSS 血条
    showBossHUD(name, hp, maxHp) {
        this.bossHud.visible = true;
        this.bossHud.name = name;
        this.bossHud.hp = hp;
        this.bossHud.maxHp = maxHp;
    }
    
    hideBossHUD() {
        this.bossHud.visible = false;
    }
    
    updateBossHP(hp) {
        this.bossHud.hp = hp;
    }
    
    // 更新
    update(dt) {
        this.ui.update(dt);
        
        if (this.joystick) {
            this.joystick.update(dt);
        }
    }
    
    // 绘制
    draw() {
        // 绘制 UI 组件
        this.ui.draw();
        
        // 绘制摇杆（在游戏中）
        if (this.joystick && this.currentScreen === 'playing') {
            this.joystick.draw(this.ctx);
        }
    }
    
    // 获取摇杆方向
    getJoystickDirection() {
        if (this.joystick) {
            return this.joystick.getDirection();
        }
        return { x: 0, y: 0, force: 0, active: false };
    }
}

export default GameUI;

