// pages/index/index.js - 首页（地图Tab）
// 上海大观园数字孪生导览系统

const app = getApp();
const spotsData = require('../../data/spots.json');
const ProximityDetector = require('../../utils/proximity');
const Storage = require('../../utils/storage');

// 模拟导航路线（开发阶段用）
const SIMULATED_ROUTE = [
  { lat: 31.0960, lng: 120.9355, spotId: 'damen' },       // 大门
  { lat: 31.0960, lng: 120.9350, spotId: 'qinfangting' },  // 沁芳亭
  { lat: 31.0955, lng: 120.9345, spotId: 'tirenmude' },    // 体仁沐德
  { lat: 31.0950, lng: 120.9340, spotId: 'daguanlou' },    // 大观楼
  { lat: 31.0945, lng: 120.9335, spotId: 'yihongyuan' },   // 怡红院
  { lat: 31.0948, lng: 120.9348, spotId: 'xiaoxiangguan' },// 潇湘馆
  { lat: 31.0940, lng: 120.9340, spotId: 'luwei\'an' },    // 蘅芜苑
  { lat: 31.0935, lng: 120.9330, spotId: 'longcui\'an' },  // 栊翠庵
  { lat: 31.0938, lng: 120.9345, spotId: 'daoxiangcun' },  // 稻香村
];

Page({
  data: {
    // 地图状态
    mapReady: false,
    loading: true,

    // 位置状态
    locationAuthorized: false,
    userLatitude: null,
    userLongitude: null,

    // 模拟导航状态
    isSimulating: true,
    simStep: 0,
    simPaused: false,
    simSpeed: 1,

    // 路线状态
    currentRoute: null,
    routes: [
      {
        id: 'love',
        name: '宝黛爱情线',
        subtitle: '从共读西厢到焚稿断痴情',
        color: '#C04040'
      },
      {
        id: 'jinling',
        name: '十二金钗探秘',
        subtitle: '逐一探访金陵十二钗的居所',
        color: '#8B5E6B'
      },
      {
        id: 'xingqin',
        name: '元妃省亲盛典',
        subtitle: '还原皇家仪仗的恢弘场面',
        color: '#D4A853'
      }
    ],

    // 已访问景点
    visitedSpotIds: [],

    // 附近景点
    nearbySpot: null,

    // 景点列表（用于近场匹配）
    spots: spotsData.spots
  },

  onLoad() {
    // 加载已访问记录
    this.setData({ visitedSpotIds: Storage.getVisitedSpotIds() });

    // 初始化近场检测器
    this.proximityDetector = new ProximityDetector(spotsData.spots, {
      triggerDistance: 50,
      cooldownMs: 30000
    });

    this.setData({ loading: false, mapReady: true });

    // 启动模拟导航
    this.startSimulation();
  },

  onShow() {
    if (app.globalData.currentRoute) {
      this.setData({ currentRoute: app.globalData.currentRoute });
    }
  },

  onUnload() {
    this.stopSimulation();
    this.stopLocationTracking();
  },

  // ===== 模拟导航 =====

  startSimulation() {
    const pos = SIMULATED_ROUTE[0];
    this.setData({
      userLatitude: pos.lat,
      userLongitude: pos.lng,
      locationAuthorized: true,
      simStep: 0
    });
    this.checkNearbySpots(pos.lat, pos.lng);

    // 每2秒移动到下一个点
    this.simTimer = setInterval(() => {
      if (this.data.simPaused) return;
      this.moveToNextSimPoint();
    }, 2000 / this.data.simSpeed);
  },

  moveToNextSimPoint() {
    let next = this.data.simStep + 1;
    if (next >= SIMULATED_ROUTE.length) next = 0;
    const pos = SIMULATED_ROUTE[next];
    this.setData({
      simStep: next,
      userLatitude: pos.lat,
      userLongitude: pos.lng
    });
    this.checkNearbySpots(pos.lat, pos.lng);
  },

  stopSimulation() {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
  },

  // 暂停/继续模拟
  onToggleSimulation() {
    const paused = !this.data.simPaused;
    this.setData({ simPaused: paused });
    wx.showToast({
      title: paused ? '模拟已暂停' : '模拟继续中',
      icon: 'none',
      duration: 1000
    });
  },

  // 加速/减速模拟
  onChangeSimSpeed() {
    const speeds = [0.5, 1, 2, 4];
    const currentIdx = speeds.indexOf(this.data.simSpeed);
    const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
    this.setData({ simSpeed: nextSpeed });
    // 重启定时器
    this.stopSimulation();
    this.startSimulation();
    wx.showToast({
      title: `速度: ${nextSpeed}x`,
      icon: 'none',
      duration: 800
    });
  },

  // ===== 位置相关 =====

  requestLocation() {
    // 如果模拟中，不请求真实GPS
    if (this.data.isSimulating) {
      this.setData({ locationAuthorized: true });
      return;
    }

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          locationAuthorized: true,
          isSimulating: false,
          userLatitude: res.latitude,
          userLongitude: res.longitude
        });
        this.startLocationTracking();
      },
      fail: () => {
        this.setData({ locationAuthorized: false });
      }
    });
  },

  startLocationTracking() {
    wx.startLocationUpdateBackground({
      success: () => {
        wx.onLocationChange((res) => {
          if (this.data.isSimulating) return;
          this.setData({
            userLatitude: res.latitude,
            userLongitude: res.longitude
          });
          this.checkNearbySpots(res.latitude, res.longitude);
        });
      }
    });
  },

  stopLocationTracking() {
    wx.stopLocationUpdate({ success() {} });
  },

  checkNearbySpots(lat, lng) {
    const spot = this.proximityDetector.detect(lat, lng);
    if (spot && spot.id !== (this.data.nearbySpot && this.data.nearbySpot.id)) {
      this.setData({ nearbySpot: spot });
      // 记录游览
      Storage.addVisitRecord(spot.id);
      this.setData({ visitedSpotIds: Storage.getVisitedSpotIds() });
    }
  },

  // ===== 路线 =====

  onRouteSelect(e) {
    const routeId = e.currentTarget.dataset.routeId;
    const route = this.data.routes.find(r => r.id === routeId);
    this.setData({ currentRoute: route });
    app.globalData.currentRoute = route;
  },

  onRouteClear() {
    this.setData({ currentRoute: null });
    app.globalData.currentRoute = null;
  },

  // ===== 跳转 =====

  onSpotTap(e) {
    // 从 story-card 的 expand 事件或 map-canvas 的 spottap 事件
    let spotId = null;
    if (e.detail && e.detail.spotId) {
      spotId = e.detail.spotId;
    } else if (this.data.nearbySpot) {
      spotId = this.data.nearbySpot.id;
    }
    if (spotId) {
      wx.navigateTo({ url: `/pages/detail/detail?id=${spotId}` });
    }
  },

  onARClick() {
    wx.navigateTo({ url: '/pages/ar/ar' });
  },

  onShareAppMessage() {
    return {
      title: '上海大观园·红楼梦数字导览',
      path: '/pages/index/index'
    };
  }
});
