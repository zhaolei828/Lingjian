/**
 * 微信小游戏资源缓存管理器
 * 首次从 CDN 下载资源并缓存到本地，后续直接使用本地资源
 */

const isMinigame = typeof wx !== 'undefined';

// 缓存配置
const CACHE_CONFIG = {
    version: '1.0.0',  // 版本号，更新时修改此值会重新下载资源
    prefix: 'lingjian_cache_'
};

// 文件系统管理器
let fs = null;
if (isMinigame) {
    fs = wx.getFileSystemManager();
}

// 获取本地缓存路径
function getLocalPath(key) {
    return `${wx.env.USER_DATA_PATH}/${CACHE_CONFIG.prefix}${key}`;
}

// 获取缓存版本
function getCacheVersion() {
    if (!isMinigame) return null;
    try {
        return wx.getStorageSync('cache_version');
    } catch (e) {
        return null;
    }
}

// 设置缓存版本
function setCacheVersion(version) {
    if (!isMinigame) return;
    try {
        wx.setStorageSync('cache_version', version);
    } catch (e) {
        console.warn('设置缓存版本失败:', e);
    }
}

// 检查文件是否已缓存
function isFileCached(key) {
    if (!isMinigame || !fs) return false;
    try {
        const path = getLocalPath(key);
        fs.accessSync(path);
        return true;
    } catch (e) {
        return false;
    }
}

// 下载并缓存文件
function downloadAndCache(url, key) {
    return new Promise((resolve, reject) => {
        if (!isMinigame) {
            reject(new Error('非小游戏环境'));
            return;
        }

        const localPath = getLocalPath(key);

        wx.downloadFile({
            url: url,
            success: (res) => {
                if (res.statusCode === 200) {
                    // 保存到本地
                    fs.saveFile({
                        tempFilePath: res.tempFilePath,
                        filePath: localPath,
                        success: () => {
                            console.log(`[Cache] 缓存成功: ${key}`);
                            resolve(localPath);
                        },
                        fail: (err) => {
                            console.warn(`[Cache] 保存失败: ${key}`, err);
                            // 保存失败，直接使用临时文件
                            resolve(res.tempFilePath);
                        }
                    });
                } else {
                    reject(new Error(`下载失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}

// 获取资源（优先使用缓存）
export async function getResource(url, key) {
    if (!isMinigame) {
        // 非小游戏环境直接返回 URL
        return url;
    }

    // 检查版本是否更新
    const cachedVersion = getCacheVersion();
    if (cachedVersion !== CACHE_CONFIG.version) {
        // 版本更新，清理旧缓存
        console.log('[Cache] 版本更新，清理旧缓存');
        await clearCache();
        setCacheVersion(CACHE_CONFIG.version);
    }

    // 检查是否已缓存
    if (isFileCached(key)) {
        console.log(`[Cache] 使用本地缓存: ${key}`);
        return getLocalPath(key);
    }

    // 下载并缓存
    try {
        const localPath = await downloadAndCache(url, key);
        return localPath;
    } catch (e) {
        console.warn(`[Cache] 下载失败，使用原始URL: ${key}`, e);
        return url;
    }
}

// 批量预加载资源
export async function preloadResources(resources, onProgress) {
    if (!isMinigame) return;

    const total = Object.keys(resources).length;
    let loaded = 0;

    for (const [key, url] of Object.entries(resources)) {
        try {
            await getResource(url, key);
        } catch (e) {
            console.warn(`[Cache] 预加载失败: ${key}`, e);
        }
        loaded++;
        if (onProgress) {
            onProgress(loaded, total, key);
        }
    }

    console.log(`[Cache] 预加载完成: ${loaded}/${total}`);
}

// 清理缓存
export async function clearCache() {
    if (!isMinigame || !fs) return;

    try {
        const files = fs.readdirSync(wx.env.USER_DATA_PATH);
        for (const file of files) {
            if (file.startsWith(CACHE_CONFIG.prefix)) {
                try {
                    fs.unlinkSync(`${wx.env.USER_DATA_PATH}/${file}`);
                    console.log(`[Cache] 删除: ${file}`);
                } catch (e) {
                    // 忽略删除失败
                }
            }
        }
    } catch (e) {
        console.warn('[Cache] 清理缓存失败:', e);
    }
}

// 获取缓存大小
export function getCacheSize() {
    if (!isMinigame || !fs) return 0;

    let totalSize = 0;
    try {
        const files = fs.readdirSync(wx.env.USER_DATA_PATH);
        for (const file of files) {
            if (file.startsWith(CACHE_CONFIG.prefix)) {
                try {
                    const stat = fs.statSync(`${wx.env.USER_DATA_PATH}/${file}`);
                    totalSize += stat.size;
                } catch (e) {
                    // 忽略
                }
            }
        }
    } catch (e) {
        // 忽略
    }
    return totalSize;
}

// 格式化文件大小
export function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

export default {
    getResource,
    preloadResources,
    clearCache,
    getCacheSize,
    formatSize,
    CACHE_CONFIG
};

