// ============================================
// 平衡性评估系统 - Balance Analysis System
// ============================================

import { ROLES, STAGES, ARTIFACTS, SKILLS, ARENA_MOBS, ARENA_BOSSES, ARENA_CONFIG } from './data.js';

// 基础怪物数据（从游戏设计推断）
const ENEMIES = [
    { id: 'bat', name: '蝙蝠', hp: 50, dmg: 5, spd: 120 },
    { id: 'rock', name: '石头怪', hp: 100, dmg: 10, spd: 60 },
    { id: 'ghost', name: '幽灵', hp: 80, dmg: 8, spd: 100 },
    { id: 'bat_fire', name: '火焰蝙蝠', hp: 60, dmg: 8, spd: 130 },
    { id: 'magma_rock', name: '岩浆怪', hp: 150, dmg: 15, spd: 50 },
    { id: 'ghost_ice', name: '冰霜幽灵', hp: 100, dmg: 10, spd: 90 },
    { id: 'crystal', name: '水晶兽', hp: 120, dmg: 12, spd: 70 }
];

// ============================================
// 配置常量
// ============================================
const BALANCE_CONFIG = {
    // 权重配置（用于计算综合评分）
    WEIGHTS: {
        dps: 0.30,           // DPS权重
        survival: 0.25,      // 生存能力权重
        aoe: 0.15,           // 范围清场权重
        mobility: 0.10,      // 机动性权重
        skillPotential: 0.10,// 技能潜力权重
        artifactSynergy: 0.10// 法宝契合度权重
    },
    
    // 平衡阈值
    THRESHOLDS: {
        balanced: 1.3,       // 最强/最弱 < 1.3 为平衡
        warning: 1.5,        // 1.3-1.5 为警告
        critical: 2.0        // > 1.5 为严重失衡
    },
    
    // 模拟参数
    SIMULATION: {
        duration: 60,        // 模拟战斗时长（秒）
        iterations: 100,     // 蒙特卡洛迭代次数
        sampleRate: 10       // 每秒采样次数
    }
};

// ============================================
// 角色评估器
// ============================================
export class RoleAnalyzer {
    constructor() {
        this.roleStats = {};
        this.analyzeAllRoles();
    }
    
    /**
     * 分析所有角色
     */
    analyzeAllRoles() {
        for (const role of ROLES) {
            this.roleStats[role.id] = this.analyzeRole(role);
        }
        this.calculateRelativeScores();
    }
    
    /**
     * 分析单个角色
     */
    analyzeRole(role) {
        // 计算技能潜力
        const skillAnalysis = this.analyzeSkills(role);
        
        // 计算法宝契合度
        const artifactAnalysis = this.analyzeArtifactSynergy(role);
        
        const stats = {
            id: role.id,
            name: role.name,
            faction: role.faction,
            
            // 基础属性（兼容 spd 和 speed 字段）
            hp: role.hp,
            dmg: role.dmg,
            speed: role.speed || role.spd || 150,
            range: role.range || 400,
            
            // 计算指标
            dps: this.calculateDPS(role),
            survival: this.calculateSurvival(role),
            aoe: this.calculateAoE(role),
            mobility: this.calculateMobility(role),
            
            // 技能分析
            skillPotential: skillAnalysis.potential,
            skillDetails: skillAnalysis.details,
            
            // 法宝契合度
            artifactSynergy: artifactAnalysis.synergy,
            bestArtifacts: artifactAnalysis.bestArtifacts,
            
            // 综合评分（初始化，后续计算）
            score: 0,
            normalizedScore: 0
        };
        
        // 计算原始综合评分（加入技能和法宝权重）
        stats.rawScore = 
            stats.dps * BALANCE_CONFIG.WEIGHTS.dps +
            stats.survival * BALANCE_CONFIG.WEIGHTS.survival +
            stats.aoe * BALANCE_CONFIG.WEIGHTS.aoe +
            stats.mobility * BALANCE_CONFIG.WEIGHTS.mobility +
            stats.skillPotential * BALANCE_CONFIG.WEIGHTS.skillPotential +
            stats.artifactSynergy * BALANCE_CONFIG.WEIGHTS.artifactSynergy;
            
        return stats;
    }
    
    /**
     * 计算 DPS（每秒伤害）
     */
    calculateDPS(role) {
        const baseDmg = role.dmg;
        const attackSpeed = role.cd ? (1 / role.cd) : 2; // 默认每秒攻击2次
        const pierce = role.pierce || 1;
        const projectiles = role.count || 1;
        
        // 基础 DPS = 伤害 × 攻速 × 子弹数
        let dps = baseDmg * attackSpeed * projectiles;
        
        // 穿透加成（假设平均命中2个敌人）
        if (pierce > 1) {
            dps *= Math.min(pierce, 2);
        }
        
        // 特殊角色调整
        if (role.id === 'mage') {
            dps *= 1.2; // 火焰伤害加成
        }
        if (role.id === 'ghost') {
            dps *= 1.5; // 傀儡额外伤害
        }
        if (role.id === 'formation') {
            dps *= 1.3; // 阵法穿透加成
        }
        
        return Math.round(dps);
    }
    
    /**
     * 计算生存能力
     */
    calculateSurvival(role) {
        const hp = role.hp || 100;
        const speed = role.speed || role.spd || 150;
        
        // 生存指数 = 血量 × 速度加成
        // 速度越快，躲避能力越强
        const speedBonus = 1 + (speed - 150) / 300; // 150为基准速度
        
        let survival = hp * speedBonus;
        
        // 特殊角色调整
        if (role.id === 'body') {
            survival *= 1.5; // 荒古门肉盾加成
        }
        if (role.id === 'ghost') {
            survival *= 1.2; // 傀儡分担伤害
        }
        
        return Math.round(survival);
    }
    
    /**
     * 计算范围清场能力
     */
    calculateAoE(role) {
        const area = role.area || 1;
        const pierce = role.pierce || 1;
        const count = role.count || 1;
        
        // AOE 指数 = 范围 × 穿透 × 子弹数
        let aoe = area * pierce * count * 10;
        
        // 特殊角色调整
        if (role.id === 'mage') {
            aoe *= 1.5; // 火焰范围伤害
        }
        if (role.id === 'formation') {
            aoe *= 2.0; // 阵法大范围
        }
        
        return Math.round(aoe);
    }
    
    /**
     * 计算机动性
     */
    calculateMobility(role) {
        const speed = role.speed || role.spd || 150;
        
        // 机动性 = 移动速度（归一化到100为基准）
        let mobility = (speed / 150) * 100;
        
        // 特殊角色调整
        if (role.id === 'body') {
            mobility *= 0.9; // 肉盾稍慢
        }
        
        return Math.round(mobility);
    }
    
    /**
     * 分析角色可用技能（深度分析）
     */
    analyzeSkills(role) {
        const result = {
            potential: 50, // 基础潜力值
            details: []
        };
        
        // 通用技能分析
        const commonSkills = SKILLS?.common || [];
        const roleSkills = SKILLS?.[role.id] || [];
        const allSkills = [...commonSkills, ...roleSkills];
        
        if (allSkills.length === 0) {
            return result;
        }
        
        // 分析每个技能的价值
        let totalValue = 0;
        
        for (const skill of allSkills) {
            const value = this.evaluateSkillValue(skill, role);
            totalValue += value;
            result.details.push({
                name: skill.name,
                desc: skill.desc,
                value: Math.round(value)
            });
        }
        
        // 技能潜力 = 基础值 + 技能总价值
        result.potential = 50 + totalValue;
        
        // 排序：最有价值的技能在前
        result.details.sort((a, b) => b.value - a.value);
        
        return result;
    }
    
    /**
     * 评估单个技能的价值
     */
    evaluateSkillValue(skill, role) {
        let value = 10; // 基础价值
        
        const desc = skill.desc.toLowerCase();
        
        // DPS 相关技能
        if (desc.includes('伤害') || desc.includes('攻击')) {
            value += 15;
            // 对低伤害角色更有价值
            if (role.dmg < 15) value += 5;
        }
        
        // 数量/穿透技能（AOE 提升）
        if (desc.includes('数量') || desc.includes('穿透')) {
            value += 20;
            // 对 AOE 型角色更有价值
            if (role.id === 'formation' || role.id === 'mage') value += 10;
        }
        
        // 攻速技能
        if (desc.includes('攻速') || desc.includes('施法速度')) {
            value += 15;
        }
        
        // 范围技能
        if (desc.includes('范围') || desc.includes('阵法')) {
            value += 12;
        }
        
        // 移速技能
        if (desc.includes('移动速度') || desc.includes('移速')) {
            value += 8;
            // 对慢速角色更有价值
            if ((role.speed || role.spd || 150) < 150) value += 5;
        }
        
        // 召唤物相关（幽冥涧专属）
        if (desc.includes('召唤') || desc.includes('存在时间')) {
            value += 18;
            if (role.id === 'ghost') value += 10;
        }
        
        // 控制技能
        if (desc.includes('减速') || desc.includes('击退') || desc.includes('眩晕')) {
            value += 10;
        }
        
        // 特殊效果
        if (desc.includes('%') && desc.includes('几率')) {
            value += 12; // 概率触发效果
        }
        
        return value;
    }
    
    /**
     * 分析角色与法宝的契合度
     */
    analyzeArtifactSynergy(role) {
        const result = {
            synergy: 50, // 基础契合度
            bestArtifacts: [],
            allSynergies: []
        };
        
        if (!ARTIFACTS || ARTIFACTS.length === 0) {
            return result;
        }
        
        // 分析每个法宝与角色的契合度
        for (const artifact of ARTIFACTS) {
            const synergy = this.calculateArtifactSynergy(artifact, role);
            result.allSynergies.push({
                id: artifact.id,
                name: artifact.name,
                type: artifact.type,
                synergy: synergy,
                reason: this.getSynergyReason(artifact, role)
            });
        }
        
        // 排序找出最佳法宝
        result.allSynergies.sort((a, b) => b.synergy - a.synergy);
        result.bestArtifacts = result.allSynergies.slice(0, 3);
        
        // 计算平均契合度（取最佳3个的平均值作为角色的法宝潜力）
        const topSynergies = result.allSynergies.slice(0, 3);
        result.synergy = topSynergies.reduce((sum, a) => sum + a.synergy, 0) / topSynergies.length;
        
        return result;
    }
    
    /**
     * 计算单个法宝与角色的契合度
     */
    calculateArtifactSynergy(artifact, role) {
        let synergy = 50; // 基础契合度
        
        // 根据法宝类型和角色特点计算契合度
        switch (artifact.type) {
            case 'attack':
                // 攻击型法宝 - 与低伤害角色更契合
                if (role.dmg < 15) synergy += 20;
                if (role.id === 'sword') synergy += 15; // 天剑宗 + 攻击
                if (artifact.id === 'jinjiao_jian' && role.id === 'formation') synergy += 25; // 穿透加成
                break;
                
            case 'defense':
                // 防御型法宝 - 与低血量角色更契合
                if (role.hp < 100) synergy += 25;
                if (role.id === 'mage') synergy += 20; // 玄元道脆皮需要防御
                if (role.id === 'body') synergy -= 10; // 荒古门已经很肉
                break;
                
            case 'speed':
                // 移速型法宝 - 与慢速角色更契合
                const speed = role.speed || role.spd || 150;
                if (speed < 150) synergy += 20;
                if (role.id === 'body') synergy += 15; // 荒古门需要机动性
                break;
                
            case 'control':
                // 控制型法宝 - 与 AOE 角色更契合
                if (role.id === 'mage' || role.id === 'formation') synergy += 20;
                break;
                
            case 'utility':
                // 收益型法宝 - 通用契合
                synergy += 10;
                break;
                
            case 'special':
                // 特效型法宝 - 根据具体效果判断
                if (artifact.id === 'fantian') {
                    // 虚天鼎 - 与近战角色更契合
                    if (role.id === 'body') synergy += 25;
                }
                if (artifact.id === 'gourd') {
                    // 玄天斩灵 - 通用
                    synergy += 15;
                }
                if (artifact.id === 'mirror') {
                    // 乾蓝冰焰 - 与远程角色更契合
                    if (role.id === 'mage' || role.id === 'formation') synergy += 20;
                }
                break;
        }
        
        // 特殊组合加成
        // 幽冥涧 + 诛仙剑阵 = 双重召唤
        if (role.id === 'ghost' && artifact.id === 'zhuxian_array') {
            synergy += 30;
        }
        
        // 天机阁 + 定海神珠 = 控制叠加
        if (role.id === 'formation' && artifact.id === 'dinghai_zhu') {
            synergy += 25;
        }
        
        return Math.min(100, Math.max(0, synergy));
    }
    
    /**
     * 获取契合度原因说明
     */
    getSynergyReason(artifact, role) {
        const reasons = [];
        
        if (artifact.type === 'attack' && role.dmg < 15) {
            reasons.push('弥补伤害不足');
        }
        if (artifact.type === 'defense' && role.hp < 100) {
            reasons.push('提升生存能力');
        }
        if (artifact.type === 'speed' && (role.speed || role.spd || 150) < 150) {
            reasons.push('提升机动性');
        }
        if (role.id === 'ghost' && artifact.id === 'zhuxian_array') {
            reasons.push('双重召唤流');
        }
        if (role.id === 'formation' && artifact.id === 'dinghai_zhu') {
            reasons.push('控制叠加');
        }
        
        return reasons.length > 0 ? reasons.join('，') : '通用搭配';
    }
    
    /**
     * 计算相对评分（归一化）
     */
    calculateRelativeScores() {
        const scores = Object.values(this.roleStats).map(r => r.rawScore);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        
        for (const id in this.roleStats) {
            const stats = this.roleStats[id];
            // 归一化到 0-100
            stats.normalizedScore = Math.round(
                ((stats.rawScore - minScore) / (maxScore - minScore)) * 100
            );
            stats.score = Math.round(stats.rawScore);
        }
        
        // 计算平衡度
        this.balanceRatio = maxScore / minScore;
        this.isBalanced = this.balanceRatio < BALANCE_CONFIG.THRESHOLDS.balanced;
    }
    
    /**
     * 获取角色排名
     */
    getRanking() {
        return Object.values(this.roleStats)
            .sort((a, b) => b.score - a.score)
            .map((r, i) => ({
                rank: i + 1,
                ...r
            }));
    }
    
    /**
     * 获取平衡性报告
     */
    getBalanceReport() {
        const ranking = this.getRanking();
        const strongest = ranking[0];
        const weakest = ranking[ranking.length - 1];
        
        let status = '良好';
        let statusColor = 'green';
        
        if (this.balanceRatio >= BALANCE_CONFIG.THRESHOLDS.critical) {
            status = '严重失衡';
            statusColor = 'red';
        } else if (this.balanceRatio >= BALANCE_CONFIG.THRESHOLDS.warning) {
            status = '需要关注';
            statusColor = 'orange';
        }
        
        return {
            status,
            statusColor,
            balanceRatio: Math.round(this.balanceRatio * 100) / 100,
            strongest: strongest.name,
            weakest: weakest.name,
            ranking,
            suggestions: this.generateSuggestions(ranking)
        };
    }
    
    /**
     * 生成平衡性建议
     */
    generateSuggestions(ranking) {
        const suggestions = [];
        
        // 检查最强和最弱角色
        const strongest = ranking[0];
        const weakest = ranking[ranking.length - 1];
        const avgScore = ranking.reduce((a, r) => a + r.score, 0) / ranking.length;
        
        // 检查过强角色
        for (const role of ranking) {
            if (role.score > avgScore * 1.3) {
                suggestions.push({
                    type: 'warning',
                    target: role.name,
                    issue: '该角色过强',
                    detail: `评分 ${role.score} 超过平均值 ${Math.round(avgScore)} 的 30%`,
                    recommendation: this.getWeakenSuggestion(role)
                });
            }
            if (role.score < avgScore * 0.7) {
                suggestions.push({
                    type: 'warning',
                    target: role.name,
                    issue: '该角色过弱',
                    detail: `评分 ${role.score} 低于平均值 ${Math.round(avgScore)} 的 30%`,
                    recommendation: this.getStrengthenSuggestion(role)
                });
            }
        }
        
        return suggestions;
    }
    
    /**
     * 获取削弱建议
     */
    getWeakenSuggestion(role) {
        const suggestions = [];
        
        if (role.dps > 100) {
            suggestions.push(`降低攻击力 ${Math.round(role.dps * 0.1)}`);
        }
        if (role.aoe > 50) {
            suggestions.push(`减少穿透或范围`);
        }
        
        return suggestions.length > 0 ? suggestions.join('，或') : '轻微调整属性';
    }
    
    /**
     * 获取增强建议
     */
    getStrengthenSuggestion(role) {
        const suggestions = [];
        
        if (role.dps < 50) {
            suggestions.push(`提高攻击力或攻速`);
        }
        if (role.survival < 100) {
            suggestions.push(`增加生命值`);
        }
        if (role.aoe < 20) {
            suggestions.push(`增加穿透或子弹数`);
        }
        
        return suggestions.length > 0 ? suggestions.join('，或') : '轻微提升属性';
    }
}

// ============================================
// 怪物评估器
// ============================================
export class EnemyAnalyzer {
    constructor() {
        this.enemyStats = {};
        this.analyzeAllEnemies();
    }
    
    /**
     * 分析所有怪物
     */
    analyzeAllEnemies() {
        // 分析普通怪物
        for (const enemy of ENEMIES) {
            this.enemyStats[enemy.id] = this.analyzeEnemy(enemy, 'normal');
        }
        
        // 分析竞技场怪物（对象格式）
        if (ARENA_MOBS && typeof ARENA_MOBS === 'object') {
            for (const [id, mob] of Object.entries(ARENA_MOBS)) {
                this.enemyStats['arena_' + id] = this.analyzeEnemy({ id, ...mob }, 'arena');
            }
        }
        
        // 分析 Boss（对象格式）
        if (ARENA_BOSSES && typeof ARENA_BOSSES === 'object') {
            for (const [id, boss] of Object.entries(ARENA_BOSSES)) {
                this.enemyStats['boss_' + id] = this.analyzeEnemy({ id, ...boss }, 'boss');
            }
        }
    }
    
    /**
     * 分析单个怪物
     */
    analyzeEnemy(enemy, type) {
        return {
            id: enemy.id,
            name: enemy.name || enemy.id,
            type,
            
            // 基础属性
            hp: enemy.hp,
            dmg: enemy.dmg,
            speed: enemy.spd,
            
            // 威胁值 = 伤害 × 速度（越快越难躲）
            threat: Math.round((enemy.dmg || 10) * ((enemy.spd || 100) / 100)),
            
            // 坚韧值 = 生命值
            toughness: enemy.hp,
            
            // 综合难度评分
            difficulty: this.calculateDifficulty(enemy, type)
        };
    }
    
    /**
     * 计算怪物难度
     */
    calculateDifficulty(enemy, type) {
        const hp = enemy.hp || 100;
        const dmg = enemy.dmg || 10;
        const spd = enemy.spd || 100;
        
        // 难度 = 生命 × 伤害 × 速度因子
        let difficulty = (hp / 100) * (dmg / 10) * (spd / 100);
        
        // Boss 难度倍数
        if (type === 'boss') {
            difficulty *= 5;
        }
        
        return Math.round(difficulty * 10);
    }
    
    /**
     * 获取怪物难度分布
     */
    getDifficultyDistribution() {
        const enemies = Object.values(this.enemyStats);
        
        return {
            easy: enemies.filter(e => e.difficulty < 10),
            normal: enemies.filter(e => e.difficulty >= 10 && e.difficulty < 30),
            hard: enemies.filter(e => e.difficulty >= 30 && e.difficulty < 50),
            boss: enemies.filter(e => e.difficulty >= 50)
        };
    }
}

// ============================================
// 角色 vs 怪物平衡分析器
// ============================================
export class MatchupAnalyzer {
    constructor(roleAnalyzer, enemyAnalyzer) {
        this.roles = roleAnalyzer.roleStats;
        this.enemies = enemyAnalyzer.enemyStats;
    }
    
    /**
     * 计算角色对怪物的优势度
     * 返回击杀所需时间（秒）
     */
    calculateKillTime(roleId, enemyId) {
        const role = this.roles[roleId];
        const enemy = this.enemies[enemyId];
        
        if (!role || !enemy) return Infinity;
        
        // 击杀时间 = 怪物血量 / 角色 DPS
        return enemy.hp / role.dps;
    }
    
    /**
     * 计算角色被怪物击杀的时间
     */
    calculateDeathTime(roleId, enemyId) {
        const role = this.roles[roleId];
        const enemy = this.enemies[enemyId];
        
        if (!role || !enemy) return 0;
        
        // 假设每2秒受到一次攻击
        const hitRate = (enemy.speed || 100) / 200; // 速度越快命中率越高
        const dps = (enemy.dmg || 10) * hitRate;
        
        return role.hp / dps;
    }
    
    /**
     * 计算对战优势比
     */
    calculateAdvantageRatio(roleId, enemyId) {
        const killTime = this.calculateKillTime(roleId, enemyId);
        const deathTime = this.calculateDeathTime(roleId, enemyId);
        
        // 优势比 = 角色击杀怪物所需时间 / 角色被击杀所需时间
        // > 1 表示怪物占优，< 1 表示角色占优
        return killTime / deathTime;
    }
    
    /**
     * 分析关卡平衡性
     */
    analyzeStageBalance() {
        const results = [];
        
        for (const stage of STAGES) {
            const stageEnemies = stage.enemies || [];
            const stageResult = {
                name: stage.name,
                time: stage.time,
                rolePerformance: {}
            };
            
            // 分析每个角色在该关卡的表现
            for (const roleId in this.roles) {
                let totalAdvantage = 0;
                let count = 0;
                
                for (const enemy of stageEnemies) {
                    const advantage = this.calculateAdvantageRatio(roleId, enemy.id);
                    if (isFinite(advantage)) {
                        totalAdvantage += advantage;
                        count++;
                    }
                }
                
                const avgAdvantage = count > 0 ? totalAdvantage / count : 1;
                
                stageResult.rolePerformance[roleId] = {
                    advantage: Math.round(avgAdvantage * 100) / 100,
                    rating: this.getRating(avgAdvantage)
                };
            }
            
            results.push(stageResult);
        }
        
        return results;
    }
    
    /**
     * 获取评级
     */
    getRating(advantage) {
        if (advantage < 0.5) return { level: 'S', desc: '碾压' };
        if (advantage < 0.8) return { level: 'A', desc: '轻松' };
        if (advantage < 1.2) return { level: 'B', desc: '均衡' };
        if (advantage < 1.5) return { level: 'C', desc: '困难' };
        return { level: 'D', desc: '极难' };
    }
}

// ============================================
// 平衡性报告生成器
// ============================================
export class BalanceReporter {
    constructor() {
        this.roleAnalyzer = new RoleAnalyzer();
        this.enemyAnalyzer = new EnemyAnalyzer();
        this.matchupAnalyzer = new MatchupAnalyzer(this.roleAnalyzer, this.enemyAnalyzer);
    }
    
    /**
     * 生成完整的平衡性报告
     */
    generateFullReport() {
        return {
            timestamp: new Date().toISOString(),
            
            // 角色平衡报告
            roleBalance: this.roleAnalyzer.getBalanceReport(),
            
            // 怪物难度分布
            enemyDifficulty: this.enemyAnalyzer.getDifficultyDistribution(),
            
            // 关卡平衡分析
            stageBalance: this.matchupAnalyzer.analyzeStageBalance(),
            
            // 总体评估
            overall: this.getOverallAssessment()
        };
    }
    
    /**
     * 总体评估
     */
    getOverallAssessment() {
        const roleReport = this.roleAnalyzer.getBalanceReport();
        const issues = [];
        
        if (roleReport.balanceRatio > BALANCE_CONFIG.THRESHOLDS.warning) {
            issues.push(`角色间平衡度不佳 (差异率: ${roleReport.balanceRatio})`);
        }
        
        // 添加建议
        issues.push(...roleReport.suggestions.map(s => s.issue + ': ' + s.target));
        
        return {
            status: issues.length === 0 ? '平衡良好' : '需要调整',
            issueCount: issues.length,
            issues
        };
    }
    
    /**
     * 打印报告到控制台
     */
    printReport() {
        const report = this.generateFullReport();
        
        console.log('='.repeat(60));
        console.log('              平衡性评估报告');
        console.log('='.repeat(60));
        console.log(`生成时间: ${report.timestamp}`);
        console.log('');
        
        // 角色排名
        console.log('【角色评分排名】');
        console.log('-'.repeat(60));
        console.log('排名 | 角色     | 评分 | DPS | 生存 | 技能潜力 | 法宝契合');
        console.log('-'.repeat(60));
        for (const role of report.roleBalance.ranking) {
            console.log(
                `${role.rank.toString().padStart(2)}   | ` +
                `${role.name.padEnd(8)} | ` +
                `${role.score.toString().padStart(4)} | ` +
                `${role.dps.toString().padStart(3)} | ` +
                `${role.survival.toString().padStart(4)} | ` +
                `${Math.round(role.skillPotential).toString().padStart(8)} | ` +
                `${Math.round(role.artifactSynergy).toString().padStart(8)}`
            );
        }
        console.log('');
        
        // 平衡状态
        console.log(`【平衡状态】${report.roleBalance.status}`);
        console.log(`差异率: ${report.roleBalance.balanceRatio}`);
        console.log(`最强: ${report.roleBalance.strongest} | 最弱: ${report.roleBalance.weakest}`);
        console.log('');
        
        // 技能分析
        console.log('【技能潜力分析】');
        console.log('-'.repeat(40));
        for (const role of report.roleBalance.ranking) {
            console.log(`\n${role.name}:`);
            if (role.skillDetails && role.skillDetails.length > 0) {
                for (const skill of role.skillDetails.slice(0, 3)) {
                    console.log(`  ★ ${skill.name}: ${skill.desc} (价值: ${skill.value})`);
                }
            } else {
                console.log('  无专属技能');
            }
        }
        console.log('');
        
        // 法宝契合分析
        console.log('【最佳法宝搭配】');
        console.log('-'.repeat(40));
        for (const role of report.roleBalance.ranking) {
            console.log(`\n${role.name}:`);
            if (role.bestArtifacts && role.bestArtifacts.length > 0) {
                for (const artifact of role.bestArtifacts) {
                    console.log(`  ◆ ${artifact.name} (契合度: ${Math.round(artifact.synergy)}) - ${artifact.reason}`);
                }
            }
        }
        console.log('');
        
        // 建议
        if (report.roleBalance.suggestions.length > 0) {
            console.log('【调整建议】');
            console.log('-'.repeat(40));
            for (const s of report.roleBalance.suggestions) {
                console.log(`⚠ ${s.target}: ${s.issue}`);
                console.log(`  建议: ${s.recommendation}`);
            }
        }
        
        console.log('='.repeat(60));
        
        return report;
    }
}

// ============================================
// 导出便捷函数
// ============================================

/**
 * 快速平衡检查
 * 可以在开发时随时调用检查当前平衡性
 */
export function checkBalance() {
    const reporter = new BalanceReporter();
    return reporter.printReport();
}

/**
 * 获取角色评估数据（用于UI展示）
 */
export function getRoleStats() {
    const analyzer = new RoleAnalyzer();
    return analyzer.getRanking();
}

/**
 * 获取平衡建议
 */
export function getBalanceSuggestions() {
    const analyzer = new RoleAnalyzer();
    return analyzer.getBalanceReport().suggestions;
}

// 导出全局对象，方便控制台调试
if (typeof window !== 'undefined') {
    window.Balance = {
        check: checkBalance,
        getRoleStats,
        getSuggestions: getBalanceSuggestions,
        RoleAnalyzer,
        EnemyAnalyzer,
        MatchupAnalyzer,
        BalanceReporter
    };
}

