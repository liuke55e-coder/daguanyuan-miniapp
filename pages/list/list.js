// pages/list/list.js - 景点列表页
// 展示所有景点，按区域分组，支持搜索过滤

const spotsData = require('../../data/spots.json');
const storage = require('../../utils/storage');

Page({
  data: {
    // 原始数据
    allSpots: [],

    // 分组展示数据
    groupedSpots: [],

    // 区域顺序
    areas: ['中轴', '东侧', '西侧', '湖区'],

    // 搜索关键词
    searchKeyword: '',

    // 已访问景点ID集合
    visitedIds: [],

    // 加载状态
    loading: true
  },

  onLoad() {
    this.loadSpots();
  },

  onShow() {
    // 每次显示时刷新已访问状态
    this.setData({ visitedIds: storage.getVisitedSpotIds() });
  },

  // 加载并分组景点数据
  loadSpots() {
    const spots = spotsData || [];
    const visitedIds = storage.getVisitedSpotIds();

    this.setData({
      allSpots: spots,
      visitedIds,
      loading: false
    });

    this.groupSpots(spots);
  },

  // 按区域分组
  groupSpots(spots) {
    const { areas } = this.data;
    const grouped = areas.map(area => ({
      area,
      spots: spots.filter(s => s.area === area)
    })).filter(g => g.spots.length > 0);

    this.setData({ groupedSpots: grouped });
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });

    if (!keyword) {
      this.groupSpots(this.data.allSpots);
      return;
    }

    // 按名称、人物、标签过滤
    const filtered = this.data.allSpots.filter(spot => {
      const matchName = spot.name.includes(keyword);
      const matchCharacter = spot.character.includes(keyword);
      const matchTags = spot.tags.some(t => t.includes(keyword));
      return matchName || matchCharacter || matchTags;
    });

    this.groupSpots(filtered);
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ searchKeyword: '' });
    this.groupSpots(this.data.allSpots);
  },

  // 点击景点卡片
  onSpotTap(e) {
    const spotId = e.currentTarget.dataset.spotId;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${spotId}`
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '上海大观园 · 景点导览',
      path: '/pages/list/list'
    };
  }
});
