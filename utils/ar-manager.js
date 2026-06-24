// utils/ar-manager.js - AR引擎管理
// 基于微信 VKSession API 的实景识别引擎

/**
 * ARManager - AR实景识别管理器
 * 
 * 功能：
 * - 检测设备AR支持
 * - 初始化 VKSession + ImageTracker
 * - 加载识别目标图像
 * - 启动/停止追踪
 * - 返回跟踪结果（targetId + matrix）
 */
class ARManager {
  constructor() {
    this.session = null;
    this.tracker = null;
    this.available = false;
    this.tracking = false;
    this.targets = [];
    this.listeners = {
      detect: [],
      lost: [],
      error: []
    };
  }

  /**
   * 检测设备是否支持AR
   * @returns {Promise<{available: boolean, reason?: string}>}
   */
  async checkAvailability() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      const version = systemInfo.version;
      const platform = systemInfo.platform;

      // 微信版本 >= 8.0.5
      const wxVersionOk = ARManager.compareVersion(version, '8.0.5') >= 0;

      // 系统版本
      let systemVersionOk = false;
      if (platform === 'ios') {
        const sysVer = parseFloat(systemInfo.system.split(' ')[1]);
        systemVersionOk = sysVer >= 15;
      } else if (platform === 'android') {
        const sysVer = parseInt(systemInfo.system.split(' ')[1]);
        systemVersionOk = sysVer >= 8;
      }

      if (!wxVersionOk || !systemVersionOk) {
        return {
          available: false,
          reason: 'device_unsupported'
        };
      }

      this.available = true;
      return { available: true };
    } catch (err) {
      return {
        available: false,
        reason: 'check_failed'
      };
    }
  }

  /**
   * 初始化AR会话
   * @param {Array} targets - 识别目标配置 [{id, imagePath}]
   */
  async init(targets = []) {
    if (!this.available) {
      throw new Error('设备不支持AR');
    }

    this.targets = targets;

    // 创建 VKSession
    this.session = wx.createVKSession({
      track: {
        image: {
          mode: 1 // 1=Camera模式
        }
      }
    });

    // 创建图像追踪器
    this.tracker = this.session.createImageTracker();

    // 加载目标图像
    for (const target of targets) {
      await this.tracker.addImageTarget(
        target.imagePath,
        target.id
      );
    }

    // 监听追踪事件
    this.tracker.on('detect', (result) => {
      this.listeners.detect.forEach(fn => fn(result));
    });

    this.tracker.on('lost', (targetId) => {
      this.listeners.lost.forEach(fn => fn(targetId));
    });

    return true;
  }

  /**
   * 开始追踪
   */
  start() {
    if (!this.session) return;
    this.session.start();
    this.tracking = true;
  }

  /**
   * 停止追踪
   */
  stop() {
    if (!this.session) return;
    this.session.stop();
    this.tracking = false;
  }

  /**
   * 销毁会话
   */
  destroy() {
    this.stop();
    if (this.session) {
      this.session.destroy();
      this.session = null;
      this.tracker = null;
    }
    this.listeners = { detect: [], lost: [], error: [] };
  }

  /**
   * 注册事件监听
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * 简易版本号比较
   */
  static compareVersion(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const a = parts1[i] || 0;
      const b = parts2[i] || 0;
      if (a > b) return 1;
      if (a < b) return -1;
    }
    return 0;
  }
}

module.exports = ARManager;
