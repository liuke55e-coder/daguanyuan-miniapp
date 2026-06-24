// pages/index/index.js - 首页（地图Tab）
// 上海大观园数字孪生导览系统

const app = getApp();

Page({
  data: {
    // 地图状态
    mapReady: false,
    mapScale: 1,
    mapOffsetX: 0,
    mapOffsetY: 0,

    // 位置状态
    locationAuthorized: false,
    userLatitude: null,
    userLongitude: null,

    // 路线状态
    currentRoute: null,
    routes: [
      {
        id: 'love',
        name: '宝黛爱情线',
        subtitle: '从共读西厢到焚稿断痴情',
        color: '#C41E3A'
      },
      {
        id: 'jinling',
        name: '十二金钗探秘',
        subtitle: '逐一探访金陵十二钗的居所',
        color: '#8B2252'
      },
      {
        id: 'xingqin',
        name: '元妃省亲盛典',
        subtitle: '还原皇家仪仗的恢弘场面',
        color: '#B8860B'
      }
    ],

    // 附近景点
    nearbySpot: null,

    // 加载状态
    loading: true
  },

  onLoad() {
    this.initMap();
    this.requestLocation();
  },

  onShow() {
    // 页面显示时恢复路线状态
    if (app.globalData.currentRoute) {
      this.setData({ currentRoute: app.globalData.currentRoute });
    }
  },

  onUnload() {
    // 停止位置监听
    this.stopLocationTracking();
  },

  // 初始化地图
  initMap() {
    // 地图将在 map-canvas 组件中渲染
    this.setData({ loading: false, mapReady: true });
  },

  // 请求位置授权
  requestLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          locationAuthorized: true,
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

  // 开始位置追踪
  startLocationTracking() {
    wx.startLocationUpdateBackground({
      success: () => {
        wx.onLocationChange((res) => {
          this.setData({
            userLatitude: res.latitude,
            userLongitude: res.longitude
          });
          this.checkNearbySpots(res.latitude, res.longitude);
        });
      }
    });
  },

  // 停止位置追踪
  stopLocationTracking() {
    wx.stopLocationUpdate({
      success: () => {}
    });
  },

  // 检查附近景点
  checkNearbySpots(lat, lng) {
    // 将在 proximity.js 中实现
    // 此处为占位，后续由 proximity 工具函数处理
  },

  // 选择路线
  onRouteSelect(e) {
    const routeId = e.currentTarget.dataset.routeId;
    const route = this.data.routes.find(r => r.id === routeId);
    this.setData({ currentRoute: route });
    app.globalData.currentRoute = route;
  },

  // 清除路线选择
  onRouteClear() {
    this.setData({ currentRoute: null });
    app.globalData.currentRoute = null;
  },

  // 跳转景点详情
  onSpotTap(e) {
    const spotId = e.currentTarget.dataset.spotId;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${spotId}`
    });
  },

  // 跳转AR页面
  onARClick() {
    wx.navigateTo({
      url: '/pages/ar/ar'
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '上海大观园·红楼梦数字导览',
      path: '/pages/index/index'
    };
  }
});
