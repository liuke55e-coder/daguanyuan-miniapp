// utils/achievement.js - 成就系统
// 基于条件求值引擎的成就解锁逻辑

const achievementDefinitions = require('../data/achievements.json');
const Storage = require('./storage');

/**
 * AchievementEngine - 成就引擎
 * 
 * 功能：
 * - 加载成就定义
 * - 条件求值引擎
 * - 成就解锁检测
 * - 进度计算
 */
class AchievementEngine {
  constructor() {
    this.definitions = achievementDefinitions.achievements || [];
    this.unlocked = Storage.getAchievements();
  }

  /**
   * 检查并触发成就
   * @param {Object} userState - 用户当前状态
   * @returns {Array} 新解锁的成就列表
   */
  check(userState) {
    const newlyUnlocked = [];

    for (const def of this.definitions) {
      // 已解锁则跳过
      if (this.unlocked.includes(def.id)) continue;

      // 检查条件
      if (this.evaluateCondition(def.condition, userState)) {
        this.unlocked.push(def.id);
        newlyUnlocked.push(def);
      }
    }

    // 持久化
    if (newlyUnlocked.length > 0) {
      Storage.setAchievements(this.unlocked);
    }

    return newlyUnlocked;
  }

  /**
   * 条件求值引擎
   */
  evaluateCondition(condition, state) {
    switch (condition.type) {
      // 游览景点数 ≥ N
      case 'visit_count':
        return (state.visitedSpotIds || []).length >= condition.value;

      // 完成特定路线
      case 'route_complete':
        return (state.completedRoutes || []).includes(condition.routeId);

      // 收集某类徽章 ≥ N
      case 'collect_badges':
        return this.countUnlockedByCategory(condition.category) >= condition.value;

      // 打卡特定景点组合
      case 'visit_specific':
        return condition.spotIds.every(id =>
          (state.visitedSpotIds || []).includes(id)
        );

      // 收藏景点数 ≥ N
      case 'favorite_count':
        return (state.favoriteCount || 0) >= condition.value;

      default:
        return false;
    }
  }

  /**
   * 统计某类别已解锁成就数
   */
  countUnlockedByCategory(category) {
    let count = 0;
    for (const def of this.definitions) {
      if (def.category === category && this.unlocked.includes(def.id)) {
        count++;
      }
    }
    return count;
  }

  /**
   * 获取成就进度
   * @returns {Object} { current, target, percentage }
   */
  getProgress(achievementId, userState) {
    const def = this.definitions.find(d => d.id === achievementId);
    if (!def) return null;

    let current = 0;
    const target = def.condition.value || 0;

    switch (def.condition.type) {
      case 'visit_count':
        current = (userState.visitedSpotIds || []).length;
        break;
      case 'route_complete':
        current = (userState.completedRoutes || []).includes(def.condition.routeId) ? 1 : 0;
        break;
      case 'favorite_count':
        current = userState.favoriteCount || 0;
        break;
      case 'visit_specific':
        const matched = def.condition.spotIds.filter(id =>
          (userState.visitedSpotIds || []).includes(id)
        ).length;
        current = matched;
        break;
    }

    return {
      current,
      target,
      percentage: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
    };
  }

  /**
   * 获取所有成就（含解锁状态）
   */
  getAllAchievements() {
    return this.definitions.map(def => ({
      ...def,
      unlocked: this.unlocked.includes(def.id),
      unlockedAt: null // 简化：不记录解锁时间
    }));
  }

  /**
   * 获取已解锁成就数
   */
  getUnlockedCount() {
    return this.unlocked.length;
  }

  /**
   * 获取总成就数
   */
  getTotalCount() {
    return this.definitions.length;
  }

  /**
   * 获取按类别分组的成就
   */
  getGroupedByCategory() {
    const grouped = {};
    for (const def of this.definitions) {
      if (!grouped[def.category]) grouped[def.category] = [];
      grouped[def.category].push({
        ...def,
        unlocked: this.unlocked.includes(def.id)
      });
    }
    return grouped;
  }
}

module.exports = AchievementEngine;
