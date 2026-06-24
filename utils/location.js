// utils/location.js - 定位管理
// 封装微信小程序定位API

class LocationManager {
  constructor() {
    this.watcherId = null;
    this.listeners = [];
    this.lastLocation = null;
  }

  /**
   * 请求位置授权并获取当前位置
   */
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.lastLocation = {
            latitude: res.latitude,
            longitude: res.longitude,
            accuracy: res.accuracy,
            speed: res.speed || 0,
            timestamp: Date.now()
          };
          resolve(this.lastLocation);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }

  /**
   * 开始后台位置追踪
   */
  startTracking(callback) {
    if (callback) {
      this.listeners.push(callback);
    }

    wx.startLocationUpdateBackground({
      success: () => {
        wx.onLocationChange((res) => {
          this.lastLocation = {
            latitude: res.latitude,
            longitude: res.longitude,
            accuracy: res.accuracy,
            speed: res.speed || 0,
            timestamp: Date.now()
          };
          // 通知所有监听者
          this.listeners.forEach(fn => fn(this.lastLocation));
        });
      },
      fail: (err) => {
        console.error('启动后台定位失败:', err);
      }
    });
  }

  /**
   * 停止位置追踪
   */
  stopTracking() {
    wx.stopLocationUpdate({
      success: () => {
        this.listeners = [];
      }
    });
  }

  /**
   * 获取最后一次位置
   */
  getLastLocation() {
    return this.lastLocation;
  }
}

module.exports = LocationManager;
