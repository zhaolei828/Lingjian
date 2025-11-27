// ========== 空间哈希网格 - 高效碰撞检测 ==========
// 将 O(n²) 碰撞检测优化到 O(n * k)，k 为格子内平均实体数

export class SpatialHash {
    constructor(cellSize = 64) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.entityCells = new Map(); // 记录每个实体所在的格子
    }
    
    // 计算格子键
    _getKey(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }
    
    // 清空网格
    clear() {
        this.grid.clear();
        this.entityCells.clear();
    }
    
    // 插入实体
    insert(entity) {
        const key = this._getKey(entity.x, entity.y);
        
        if (!this.grid.has(key)) {
            this.grid.set(key, new Set());
        }
        this.grid.get(key).add(entity);
        this.entityCells.set(entity, key);
    }
    
    // 批量插入
    insertAll(entities) {
        for (const entity of entities) {
            if (!entity.dead) {
                this.insert(entity);
            }
        }
    }
    
    // 移除实体
    remove(entity) {
        const key = this.entityCells.get(entity);
        if (key && this.grid.has(key)) {
            this.grid.get(key).delete(entity);
        }
        this.entityCells.delete(entity);
    }
    
    // 更新实体位置（移动后调用）
    update(entity) {
        const oldKey = this.entityCells.get(entity);
        const newKey = this._getKey(entity.x, entity.y);
        
        if (oldKey !== newKey) {
            // 从旧格子移除
            if (oldKey && this.grid.has(oldKey)) {
                this.grid.get(oldKey).delete(entity);
            }
            // 添加到新格子
            if (!this.grid.has(newKey)) {
                this.grid.set(newKey, new Set());
            }
            this.grid.get(newKey).add(entity);
            this.entityCells.set(entity, newKey);
        }
    }
    
    // 查询点附近的实体
    queryPoint(x, y, radius = 1) {
        const results = [];
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        
        // 检查周围格子
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const key = `${cx + dx},${cy + dy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (const entity of cell) {
                        if (!entity.dead) {
                            results.push(entity);
                        }
                    }
                }
            }
        }
        return results;
    }
    
    // 查询圆形范围内的实体
    queryRadius(x, y, radius) {
        const cellRadius = Math.ceil(radius / this.cellSize);
        const candidates = this.queryPoint(x, y, cellRadius);
        const radiusSq = radius * radius;
        
        return candidates.filter(entity => {
            const dx = entity.x - x;
            const dy = entity.y - y;
            return dx * dx + dy * dy <= radiusSq;
        });
    }
    
    // 查询矩形范围内的实体
    queryRect(x1, y1, x2, y2) {
        const results = [];
        const cx1 = Math.floor(x1 / this.cellSize);
        const cy1 = Math.floor(y1 / this.cellSize);
        const cx2 = Math.floor(x2 / this.cellSize);
        const cy2 = Math.floor(y2 / this.cellSize);
        
        for (let cx = cx1; cx <= cx2; cx++) {
            for (let cy = cy1; cy <= cy2; cy++) {
                const key = `${cx},${cy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (const entity of cell) {
                        if (!entity.dead && 
                            entity.x >= x1 && entity.x <= x2 &&
                            entity.y >= y1 && entity.y <= y2) {
                            results.push(entity);
                        }
                    }
                }
            }
        }
        return results;
    }
    
    // 获取统计信息
    getStats() {
        let totalEntities = 0;
        let maxInCell = 0;
        let nonEmptyCells = 0;
        
        for (const cell of this.grid.values()) {
            const size = cell.size;
            if (size > 0) {
                nonEmptyCells++;
                totalEntities += size;
                maxInCell = Math.max(maxInCell, size);
            }
        }
        
        return {
            totalEntities,
            nonEmptyCells,
            maxInCell,
            avgPerCell: nonEmptyCells > 0 ? (totalEntities / nonEmptyCells).toFixed(1) : 0
        };
    }
}

// ========== 碰撞检测管理器 ==========
export class CollisionManager {
    constructor(cellSize = 64) {
        this.enemyGrid = new SpatialHash(cellSize);
        this.bulletGrid = new SpatialHash(cellSize);
        this.coinGrid = new SpatialHash(cellSize * 2); // 金币格子可以大一些
    }
    
    // 每帧开始时重建网格
    rebuild(enemies, bullets, coins) {
        this.enemyGrid.clear();
        this.bulletGrid.clear();
        this.coinGrid.clear();
        
        this.enemyGrid.insertAll(enemies);
        this.bulletGrid.insertAll(bullets);
        this.coinGrid.insertAll(coins);
    }
    
    // 检测玩家与敌人的碰撞
    checkPlayerEnemyCollisions(player, hitRadius = 30) {
        const nearby = this.enemyGrid.queryRadius(player.x, player.y, hitRadius + 50);
        const collisions = [];
        
        for (const enemy of nearby) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const combinedRadius = hitRadius + (enemy.size || 20);
            
            if (dist < combinedRadius) {
                collisions.push(enemy);
            }
        }
        
        return collisions;
    }
    
    // 检测子弹与敌人的碰撞
    checkBulletEnemyCollisions(bullets, hitCallback) {
        let checksCount = 0;
        
        for (const bullet of bullets) {
            if (bullet.dead) continue;
            
            // 只检查子弹附近的敌人
            const nearby = this.enemyGrid.queryRadius(bullet.x, bullet.y, 80);
            checksCount += nearby.length;
            
            for (const enemy of nearby) {
                if (enemy.dead) continue;
                
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < (enemy.size || 20) + 10) {
                    hitCallback(bullet, enemy);
                    if (bullet.dead) break; // 子弹已消耗
                }
            }
        }
        
        return checksCount;
    }
    
    // 检测玩家拾取金币
    checkCoinPickup(player, pickupRadius = 150) {
        return this.coinGrid.queryRadius(player.x, player.y, pickupRadius);
    }
    
    // 查找最近的敌人（用于自动瞄准）
    findNearestEnemy(x, y, maxRange = 600) {
        const nearby = this.enemyGrid.queryRadius(x, y, maxRange);
        
        let nearest = null;
        let minDist = maxRange;
        
        for (const enemy of nearby) {
            if (enemy.dead) continue;
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        
        return nearest;
    }
    
    // 查找范围内所有敌人（用于 AOE 技能）
    findEnemiesInRange(x, y, range) {
        return this.enemyGrid.queryRadius(x, y, range);
    }
}

// 全局碰撞管理器实例
export const collisionManager = new CollisionManager(64);

