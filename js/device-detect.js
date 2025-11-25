/**
 * 设备检测与自动跳转
 * 在 PC 和移动端页面中引入此脚本，会自动跳转到正确的版本
 */
(function() {
    // 检测是否为移动设备
    function isMobile() {
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isNarrow = window.innerWidth <= 1024;
        const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return (hasTouch && isNarrow) || mobileUA;
    }
    
    // 获取当前页面类型
    const currentPage = window.location.pathname;
    const isOnPC = currentPage.includes('pc.html');
    const isOnMobile = currentPage.includes('mobile.html');
    
    // 检测 URL 参数，允许手动覆盖（?force=pc 或 ?force=mobile）
    const urlParams = new URLSearchParams(window.location.search);
    const forceMode = urlParams.get('force');
    
    if (forceMode === 'pc' || forceMode === 'mobile') {
        // 用户手动指定了模式，不自动跳转
        return;
    }
    
    const mobile = isMobile();
    
    // 在 PC 页面但设备是移动端 -> 跳转到移动端
    if (isOnPC && mobile) {
        window.location.replace('mobile.html');
    }
    // 在移动端页面但设备是 PC -> 跳转到 PC
    else if (isOnMobile && !mobile) {
        window.location.replace('pc.html');
    }
})();

