// utils/tracker.js - 埋点工具
// 简易埋点系统，用于用户行为数据采集

/**
 * Tracker - 埋点追踪器
 * 
 * 功能：
 * - 事件上报（当前仅console.log，后续可接云函数）
 * - 会话管理
 * - 事件队列
 */
class Tracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.eventQueue = [];
    this.enabled = true;
  }

  /**
   * 生成会话ID
   */
  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * 上报事件
   * @param {string} eventId - 事件ID
   * @param {Object} params - 事件参数
   */
  track(eventId, params = {}) {
    if (!this.enabled) return;

    const event = {
      eventId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      params
    };

    // 开发阶段：控制台输出
    console.log('[Tracker]', eventId, params);

    // 加入队列
    this.eventQueue.push(event);

    // 队列超过20条时批量上报
    if (this.eventQueue.length >= 20) {
      this.flush();
    }
  }

  /**
   * 批量上报（预留云函数接口）
   */
  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // TODO: 接入微信云函数上报
    // wx.cloud.callFunction({
    //   name: 'trackEvent',
    //   data: { events }
    // });
  }

  /**
   * 页面浏览事件
   */
  trackPageView(pageName, params = {}) {
    this.track('page_view', { page: pageName, ...params });
  }

  /**
   * 景点查看事件
   */
  trackSpotView(spotId, triggerType = 'manual') {
    this.track('spot_view', { spot_id: spotId, trigger_type: triggerType });
  }

  /**
   * 视频播放事件
   */
  trackVideoPlay(spotId, videoId) {
    this.track('video_play', { spot_id: spotId, video_id: videoId });
  }

  /**
   * 路线选择事件
   */
  trackRouteSelect(routeId) {
    this.track('route_select', { route_id: routeId });
  }
}

module.exports = new Tracker();
