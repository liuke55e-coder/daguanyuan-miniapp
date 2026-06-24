// utils/storage.js - 本地存储管理
// 封装 wx.Storage API，提供类型安全的持久化操作

const Storage = {
  // ===== 收藏管理 =====

  /** 切换收藏状态，返回 true=已收藏, false=已取消 */
  toggleFavorite(spotId) {
    const favorites = this.getFavorites();
    const idx = favorites.indexOf(spotId);
    if (idx > -1) {
      favorites.splice(idx, 1);
    } else {
      favorites.push(spotId);
    }
    wx.setStorageSync('favorites', favorites);
    return idx === -1;
  },

  /** 检查是否已收藏 */
  isFavorite(spotId) {
    return this.getFavorites().includes(spotId);
  },

  /** 获取收藏列表 */
  getFavorites() {
    try {
      return wx.getStorageSync('favorites') || [];
    } catch (err) {
      return [];
    }
  },

  /** 获取收藏数量 */
  getFavoriteCount() {
    return this.getFavorites().length;
  },

  // ===== 游览记录 =====

  /** 添加游览记录 */
  addVisitRecord(spotId) {
    const records = this.getVisitRecords();
    // 避免重复记录（同一景点30分钟内不重复记录）
    const recent = records.find(r =>
      r.spotId === spotId &&
      Date.now() - r.timestamp < 30 * 60 * 1000
    );
    if (!recent) {
      records.push({ spotId, timestamp: Date.now() });
      wx.setStorageSync('visit_records', records);
    }
  },

  /** 获取游览记录 */
  getVisitRecords() {
    try {
      return wx.getStorageSync('visit_records') || [];
    } catch (err) {
      return [];
    }
  },

  /** 获取已访问景点ID集合 */
  getVisitedSpotIds() {
    const records = this.getVisitRecords();
    return [...new Set(records.map(r => r.spotId))];
  },

  /** 获取游览景点数 */
  getVisitedCount() {
    return this.getVisitedSpotIds().length;
  },

  // ===== 路线进度 =====

  /** 保存路线进度 */
  setRouteProgress(routeId, completedSpots) {
    wx.setStorageSync(`route_${routeId}`, completedSpots);
  },

  /** 获取路线进度 */
  getRouteProgress(routeId) {
    try {
      return wx.getStorageSync(`route_${routeId}`) || [];
    } catch (err) {
      return [];
    }
  },

  /** 获取已完成的路线ID列表 */
  getCompletedRoutes() {
    const routes = ['love', 'jinling', 'xingqin'];
    return routes.filter(routeId => {
      const progress = this.getRouteProgress(routeId);
      // 需要从routes.json获取该路线的总景点数
      return progress.length >= 3; // 简化判断
    });
  },

  // ===== 成就管理 =====

  /** 保存已解锁成就 */
  setAchievements(achievementIds) {
    wx.setStorageSync('achievements', achievementIds);
  },

  /** 获取已解锁成就 */
  getAchievements() {
    try {
      return wx.getStorageSync('achievements') || [];
    } catch (err) {
      return [];
    }
  },

  /** 获取已解锁成就数 */
  getAchievementCount() {
    return this.getAchievements().length;
  },

  // ===== 缓存管理 =====

  /** 清除所有缓存 */
  clearAll() {
    try {
      wx.clearStorageSync();
    } catch (err) {
      console.error('清除缓存失败:', err);
    }
  },

  /** 获取缓存大小 */
  getStorageInfo() {
    try {
      return wx.getStorageInfoSync();
    } catch (err) {
      return { currentSize: 0, limitSize: 10240 };
    }
  }
};

module.exports = Storage;
