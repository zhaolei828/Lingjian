// ========== 对象池系统 ==========
// 用于复用频繁创建/销毁的游戏对象，减少 GC 压力

/**
 * 通用对象池
 * 支持任意类型的对象复用
 */
export class Pool {
    constructor() {
        this.pools = {};  // { className: [instances...] }
    }

    /**
     * 从池中获取对象，如果池空则创建新对象
     * @param {string} name - 对象类型标识
     * @param {Function} ClassRef - 类构造函数
     * @param  {...any} args - 构造参数（仅在创建新对象时使用）
     * @returns {Object} 对象实例
     */
    get(name, ClassRef, ...args) {
        if (!this.pools[name]) {
            this.pools[name] = [];
        }

        const pool = this.pools[name];
        
        if (pool.length > 0) {
            const obj = pool.pop();
            // 如果对象有 reset 方法，调用它进行初始化
            if (obj.reset) {
                obj.reset(...args);
            }
            obj.dead = false;
            return obj;
        }

        // 池空了，创建新对象
        return new ClassRef(...args);
    }

    /**
     * 将对象回收到池中
     * @param {string} name - 对象类型标识
     * @param {Object} obj - 要回收的对象
     */
    recycle(name, obj) {
        if (!this.pools[name]) {
            this.pools[name] = [];
        }

        // 限制池大小，防止内存泄漏
        const maxPoolSize = 200;
        if (this.pools[name].length < maxPoolSize) {
            obj.dead = true;
            this.pools[name].push(obj);
        }
    }

    /**
     * 批量回收数组中标记为 dead 的对象
     * @param {string} name - 对象类型标识
     * @param {Array} arr - 对象数组
     * @returns {Array} 过滤后的存活对象数组
     */
    recycleDeadFromArray(name, arr) {
        const alive = [];
        for (const obj of arr) {
            if (obj.dead) {
                this.recycle(name, obj);
            } else {
                alive.push(obj);
            }
        }
        return alive;
    }

    /**
     * 清空所有池
     */
    clear() {
        this.pools = {};
    }

    /**
     * 获取池状态（用于调试）
     */
    getStats() {
        const stats = {};
        for (const name in this.pools) {
            stats[name] = this.pools[name].length;
        }
        return stats;
    }
}

// 导出全局单例
export const pool = new Pool();
export default Pool;

