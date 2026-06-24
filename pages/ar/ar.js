// pages/ar/ar.js - AR实景识别页
// 打开摄像头，实时识别建筑，叠加信息标签
// 完整AR逻辑在 utils/ar-manager.js 中（占位）

const app = getApp();

Page({
  data: {
    // AR会话状态
    arReady: false,
    arSupported: true,
    tracking: false,

    // 识别到的目标信息
    detectedSpot: null,
    showOverlay: false,

    // 相机状态
    cameraAuthorized: false,
    cameraPosition: 'back',
    devicePosition: 'back',

    // 调试
    trackingStatus: '初始化中...'
  },

  onLoad() {
    // 检查AR支持
    const arSupported = app.globalData.arSupported;
    this.setData({
      arSupported: arSupported !== false
    });

    if (!arSupported) {
      this.setData({ trackingStatus: '当前设备不支持AR功能' });
      return;
    }

    // 请求相机权限
    this.requestCameraPermission();
  },

  onReady() {
    if (this.data.arSupported && this.data.cameraAuthorized) {
      this.initARSession();
    }
  },

  onUnload() {
    this.destroyARSession();
  },

  // 请求相机权限
  requestCameraPermission() {
    wx.authorize({
      scope: 'scope.camera',
      success: () => {
        this.setData({ cameraAuthorized: true });
        if (this.data.arSupported) {
          this.initARSession();
        }
      },
      fail: () => {
        this.setData({
          cameraAuthorized: false,
          trackingStatus: '需要相机权限才能使用AR功能'
        });
        // 引导用户打开设置
        wx.showModal({
          title: '相机权限',
          content: 'AR识景功能需要使用相机，请在设置中开启相机权限',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      }
    });
  },

  // 初始化AR会话
  initARSession() {
    this.setData({ trackingStatus: '正在初始化AR引擎...' });

    try {
      // 创建VKSession（微信8.0.5+）
      const session = wx.createVKSession({
        track: {
          image: { autoStart: true }
        }
      });

      this.vkSession = session;

      // 加载目标图像
      this.loadARTargets(session);

      // 监听检测事件
      session.on('update', (res) => {
        this.setData({ trackingStatus: '追踪中' });
      });

      session.on('add', (res) => {
        // 检测到目标
        this.onTargetDetected(res);
      });

      session.on('remove', (res) => {
        // 目标丢失
        this.onTargetLost(res);
      });

      session.on('error', (err) => {
        console.error('AR引擎错误:', err);
        this.setData({
          trackingStatus: 'AR引擎出错',
          arReady: false
        });
      });

      // 启动会话
      session.start().then(() => {
        this.setData({
          arReady: true,
          trackingStatus: '将镜头对准大观园建筑...'
        });
      }).catch((err) => {
        console.error('启动AR会话失败:', err);
        this.setData({
          arReady: false,
          trackingStatus: 'AR引擎启动失败'
        });
      });

    } catch (err) {
      console.error('初始化AR失败:', err);
      this.setData({
        arReady: false,
        arSupported: false,
        trackingStatus: 'AR功能初始化失败，请稍后重试'
      });
    }
  },

  // 加载AR目标图像
  loadARTargets(session) {
    // 完整实现在 utils/ar-manager.js 中
    // 此处为占位实现
    const spotsData = require('../../data/spots.json');
    const targets = spotsData
      .filter(s => s.arTarget)
      .slice(0, 5) // 限制前5个目标
      .map(s => ({
        id: s.id,
        name: s.name,
        image: s.arTarget
      }));

    // 创建 ImageTracker
    targets.forEach(target => {
      try {
        const tracker = session.createImageTracker({
          image: target.image,
          name: target.id
        });
        this.setData({
          trackingStatus: `已加载目标: ${target.name}`
        });
      } catch (err) {
        console.error(`加载目标 ${target.name} 失败:`, err);
      }
    });
  },

  // 检测到目标
  onTargetDetected(res) {
    const targetName = res.targetName || res.name;
    const spotsData = require('../../data/spots.json');
    const spot = spotsData.find(s => s.id === targetName);

    if (spot) {
      this.setData({
        detectedSpot: spot,
        showOverlay: true,
        tracking: true,
        trackingStatus: `识别到: ${spot.name}`
      });

      // 震动反馈
      wx.vibrateShort({ type: 'medium' });
    }
  },

  // 目标丢失
  onTargetLost(res) {
    this.setData({
      showOverlay: false,
      tracking: false,
      trackingStatus: '将镜头对准大观园建筑...'
    });

    // 延迟清除检测信息
    setTimeout(() => {
      if (!this.data.tracking) {
        this.setData({ detectedSpot: null });
      }
    }, 1000);
  },

  // 销毁AR会话
  destroyARSession() {
    if (this.vkSession) {
      try {
        this.vkSession.destroy();
      } catch (err) {
        console.error('销毁AR会话失败:', err);
      }
      this.vkSession = null;
    }
  },

  // 切换摄像头
  onSwitchCamera() {
    const newPosition = this.data.devicePosition === 'back' ? 'front' : 'back';
    this.setData({ devicePosition: newPosition });
  },

  // 关闭AR
  onClose() {
    wx.navigateBack();
  },

  // 叠加层点击
  onOverlayTap() {
    if (this.data.detectedSpot) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${this.data.detectedSpot.id}`
      });
    }
  }
});
