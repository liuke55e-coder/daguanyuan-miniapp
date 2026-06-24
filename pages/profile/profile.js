// pages/profile/profile.js - 我的页面
// 游览记录、收藏列表、成就徽章墙

const storage = require('../../utils/storage');

Page({
  data: {
    // 用户信息
    userInfo: null,
    hasUserInfo: false,

    // 统计数据
    stats: {
      visitedSpots: 0,
      routes: 0,
      achievements: 0
    },

    // 收藏列表
    favorites: [],
    favoriteSpots: [],

    // 成就
    achievements: [],
    unlockedAchievementIds: [],

    // 最近游览
    recentVisits: [],

    // 加载状态
    loading: true
  },

  onLoad() {
    this.loadUserProfile();
  },

  onShow() {
    // 每次显示时刷新数据
    this.refreshData();
  },

  // 加载用户信息
  loadUserProfile() {
    // 尝试获取用户信息（需要用户授权）
    wx.getUserProfile({
      desc: '用于展示个人游览记录',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
      },
      fail: () => {
        this.setData({ hasUserInfo: false });
      }
    });

    this.refreshData();
  },

  // 刷新统计数据
  refreshData() {
    const visitRecords = storage.getVisitRecords();
    const favorites = storage.getFavorites();
    const achievements = storage.getAchievements();

    // 加载收藏的景点详情
    const spotsData = require('../../data/spots.json');
    const favoriteSpots = favorites
      .map(id => spotsData.find(s => s.id === id))
      .filter(Boolean);

    // 最近游览（按时间倒序，取前5条）
    const recentVisits = [...visitRecords]
      .sort((a, b) => b.visitTime - a.visitTime)
      .slice(0, 5);

    // 统计已解锁成就
    const unlockedAchievementIds = achievements.map(a => a.id);

    // 计算路线数（基于已访问景点所属路线）
    const routes = this.calculateRoutes(visitRecords);

    this.setData({
      stats: {
        visitedSpots: visitRecords.length,
        routes,
        achievements: achievements.length
      },
      favorites,
      favoriteSpots,
      achievements,
      unlockedAchievementIds,
      recentVisits,
      loading: false
    });
  },

  // 计算已完成的路线数（简化版）
  calculateRoutes(visitRecords) {
    // 基于已访问景点的标签判断路线完成度
    const visitedIds = visitRecords.map(r => r.spotId);
    const spotsData = require('../../data/spots.json');
    const visitedSpots = spotsData.filter(s => visitedIds.includes(s.id));

    let routes = 0;
    // 宝黛爱情线：访问过怡红院 + 潇湘馆
    if (visitedIds.includes('yihongyuan') && visitedIds.includes('xiaoxiangguan')) {
      routes++;
    }
    // 十二金钗线：访问过5个以上十二金钗相关景点
    const jinlingSpots = visitedSpots.filter(s => s.tags.includes('十二金钗'));
    if (jinlingSpots.length >= 5) {
      routes++;
    }
    // 元妃省亲线：访问过大观楼 + 石桥门
    if (visitedIds.includes('datang') && visitedIds.includes('shiqiaomen')) {
      routes++;
    }
    return routes;
  },

  // 获取用户信息
  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      });
    }
  },

  // 跳转收藏列表
  onFavoritesTap() {
    wx.navigateTo({
      url: '/pages/list/list?mode=favorites'
    });
  },

  // 跳转游览记录
  onRecordsTap() {
    wx.showToast({ title: '游览记录功能开发中', icon: 'none' });
  },

  // 关于
  onAboutTap() {
    wx.showModal({
      title: '上海大观园',
      content: '数字孪生导览系统 v1.0.0\n\n基于红楼梦IP的沉浸式景区导览体验\n\n融合AR实景识别、语音讲解、故事化路线推荐',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '上海大观园 · 我的游览记录',
      path: '/pages/index/index'
    };
  }
});
