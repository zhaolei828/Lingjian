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
        dps: 0.35,           // DPS权重
        survival: 0.30,      // 生存能力权重
        aoe: 0.20,           // 范围清场权重
        mobility: 0.15       // 机动性权重
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
            skillBonus: this.analyzeSkills(role),
            
            // 综合评分（初始化，后续计算）
            score: 0,
            normalizedScore: 0
        };
        
        // 计算原始综合评分
        stats.rawScore = 
            stats.dps * BALANCE_CONFIG.WEIGHTS.dps +
            stats.survival * BALANCE_CONFIG.WEIGHTS.survival +
            stats.aoe * BALANCE_CONFIG.WEIGHTS.aoe +
            stats.mobility * BALANCE_CONFIG.WEIGHTS.mobility;
            
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
     * 分析角色可用技能
     */
    analyzeSkills(role) {
        // 如果有 SKILLS 数据，分析角色专属技能
        if (!SKILLS || !SKILLS[role.id]) {
            return 1.0;
        }
        
        const skills = SKILLS[role.id];
        let bonus = 1.0;
        
        // 根据技能数量和效果计算加成
        bonus += skills.length * 0.05;
        
        return bonus;
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
        console.log('-'.repeat(40));
        for (const role of report.roleBalance.ranking) {
            console.log(`${role.rank}. ${role.name.padEnd(10)} | 评分: ${role.score.toString().padStart(4)} | DPS: ${role.dps.toString().padStart(3)} | 生存: ${role.survival.toString().padStart(4)}`);
        }
        console.log('');
        
        // 平衡状态
        console.log(`【平衡状态】${report.roleBalance.status}`);
        console.log(`差异率: ${report.roleBalance.balanceRatio}`);
        console.log(`最强: ${report.roleBalance.strongest} | 最弱: ${report.roleBalance.weakest}`);
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

