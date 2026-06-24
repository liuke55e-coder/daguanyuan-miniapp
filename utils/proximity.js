// utils/proximity.js - 近场判断
// 基于 Haversine 公式计算用户与景点的距离

/**
 * ProximityDetector - 近场检测器
 * 
 * 功能：
 * - 计算用户与所有景点的距离
 * - 判断是否进入景点触发范围
 * - 冷却机制避免频繁推送
 * - 快速移动抑制
 */
class ProximityDetector {
  /**
   * @param {Array} spots - 景点数据列表
   * @param {Object} options
   * @param {number} options.triggerDistance - 触发距离（米），默认50m
   * @param {number} options.cooldownMs - 冷却时间（毫秒），默认30秒
   * @param {number} options.fastMoveThreshold - 快速移动阈值（m/s），默认5m/s
   */
  constructor(spots, options = {}) {
    this.spots = spots;
    this.triggerDistance = options.triggerDistance || 50;
    this.cooldownMs = options.cooldownMs || 30000;
    this.fastMoveThreshold = options.fastMoveThreshold || 5;

    // 上次触发记录
    this.lastTrigger = {};
    // 上次位置（用于检测快速移动）
    this.lastLocation = null;
    this.lastLocationTime = null;
  }

  /**
   * 检测最近景点
   * @param {number} userLat - 用户纬度
   * @param {number} userLng - 用户经度
   * @returns {Object|null} 最近的在触发范围内的景点，null表示无
   */
  detect(userLat, userLng) {
    // 检测快速移动
    if (this.isFastMoving(userLat, userLng)) {
      return null;
    }

    let nearestSpot = null;
    let nearestDist = Infinity;

    for (const spot of this.spots) {
      const dist = ProximityDetector.haversineDistance(
        userLat, userLng,
        spot.position.gps.latitude,
        spot.position.gps.longitude
      );

      if (dist < nearestDist && dist <= this.triggerDistance) {
        nearestDist = dist;
        nearestSpot = spot;
      }
    }

    if (nearestSpot) {
      // 冷却检查
      if (this.isInCooldown(nearestSpot.id)) {
        return null;
      }
      // 记录触发
      this.lastTrigger[nearestSpot.id] = Date.now();
    }

    // 更新位置
    this.lastLocation = { lat: userLat, lng: userLng };
    this.lastLocationTime = Date.now();

    return nearestSpot;
  }

  /**
   * 是否在冷却期
   */
  isInCooldown(spotId) {
    const lastTime = this.lastTrigger[spotId];
    return lastTime && (Date.now() - lastTime < this.cooldownMs);
  }

  /**
   * 是否在快速移动
   */
  isFastMoving(lat, lng) {
    if (!this.lastLocation || !this.lastLocationTime) return false;

    const dist = ProximityDetector.haversineDistance(
      this.lastLocation.lat, this.lastLocation.lng,
      lat, lng
    );
    const timeDiff = (Date.now() - this.lastLocationTime) / 1000; // 秒

    if (timeDiff === 0) return false;
    const speed = dist / timeDiff; // m/s
    return speed > this.fastMoveThreshold;
  }

  /**
   * Haversine 公式计算两点距离（米）
   * 考虑地球曲率，适合计算GPS坐标距离
   */
  static haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 重置冷却状态
   */
  reset() {
    this.lastTrigger = {};
    this.lastLocation = null;
    this.lastLocationTime = null;
  }
}

module.exports = ProximityDetector;
