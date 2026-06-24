// app.js - 小程序入口
// 上海大观园数字孪生导览系统
// 版本: v1.0.0

App({
  onLaunch() {
    // 初始化全局数据
    this.globalData = {
      // 用户信息
      userInfo: null,
      // 位置信息
      userLocation: null,
      // 当前选中路线
      currentRoute: null,
      // 游览记录
      visitRecords: [],
      // 收藏列表
      favorites: [],
      // 成就列表
      achievements: [],
      // 设备信息
      deviceInfo: null,
      // AR支持状态
      arSupported: null
    };

    // 加载本地持久化数据
    this.loadLocalData();

    // 获取设备信息
    this.getDeviceInfo();

    // 检测AR支持
    this.checkARSupport();
  },

  // 加载本地存储数据
  loadLocalData() {
    try {
      const favorites = wx.getStorageSync('favorites');
      if (favorites) this.globalData.favorites = favorites;

      const visitRecords = wx.getStorageSync('visit_records');
      if (visitRecords) this.globalData.visitRecords = visitRecords;

      const achievements = wx.getStorageSync('achievements');
      if (achievements) this.globalData.achievements = achievements;
    } catch (err) {
      console.error('加载本地数据失败:', err);
    }
  },

  // 获取设备信息
  getDeviceInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.deviceInfo = {
        platform: systemInfo.platform,
        system: systemInfo.system,
        version: systemInfo.version,
        screenWidth: systemInfo.screenWidth,
        screenHeight: systemInfo.screenHeight,
        pixelRatio: systemInfo.pixelRatio
      };
    } catch (err) {
      console.error('获取设备信息失败:', err);
    }
  },

  // 检测AR支持
  checkARSupport() {
    // VKSession 需要微信 8.0.5+、iOS 15+ / Android 8+
    try {
      const systemInfo = wx.getSystemInfoSync();
      const version = systemInfo.version;
      const platform = systemInfo.platform;

      // 微信版本检测（简化）
      const wxVersionOk = this.compareVersion(version, '8.0.5') >= 0;

      // 系统版本检测
      let systemVersionOk = false;
      if (platform === 'ios') {
        systemVersionOk = parseInt(systemInfo.system.split(' ')[1]) >= 15;
      } else if (platform === 'android') {
        systemVersionOk = parseInt(systemInfo.system.split(' ')[1]) >= 8;
      }

      this.globalData.arSupported = wxVersionOk && systemVersionOk;
    } catch (err) {
      this.globalData.arSupported = false;
    }
  },

  // 简易版本号比较
  compareVersion(v1, v2) {
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
});
