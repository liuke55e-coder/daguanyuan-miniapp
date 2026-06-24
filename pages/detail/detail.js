// pages/detail/detail.js - 景点详情页
// 故事卡片、视频播放、语音讲解、收藏功能

const spotsData = require('../../data/spots.json');
const storage = require('../../utils/storage');

Page({
  data: {
    // 景点信息
    spot: null,
    spotId: '',

    // 收藏状态
    isFavorited: false,

    // 视频
    videoSrc: '',
    videoPoster: '',

    // 音频
    audioSrc: '',
    audioTitle: '',

    // 页面状态
    loading: true,
    error: false
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      this.setData({ loading: false, error: true });
      return;
    }

    this.setData({ spotId: id });
    this.loadSpotDetail(id);
  },

  onShow() {
    // 刷新收藏状态
    if (this.data.spotId) {
      this.setData({ isFavorited: storage.isFavorite(this.data.spotId) });
    }
  },

  // 加载景点详情
  loadSpotDetail(id) {
    const spot = spotsData.find(s => s.id === id);

    if (!spot) {
      this.setData({ loading: false, error: true });
      wx.showToast({ title: '景点信息未找到', icon: 'none' });
      return;
    }

    // 记录游览
    storage.addVisitRecord(spot.id, spot.name);

    this.setData({
      spot,
      videoSrc: spot.video || '',
      videoPoster: spot.image || '',
      audioSrc: spot.audio || '',
      audioTitle: `${spot.name} · 语音讲解`,
      isFavorited: storage.isFavorite(id),
      loading: false
    });
  },

  // 收藏/取消收藏
  onToggleFavorite() {
    const { spotId, isFavorited } = this.data;
    if (isFavorited) {
      storage.removeFavorite(spotId);
      wx.showToast({ title: '已取消收藏', icon: 'none' });
    } else {
      storage.addFavorite(spotId);
      wx.showToast({ title: '已加入收藏', icon: 'success' });
    }
    this.setData({ isFavorited: !isFavorited });
  },

  // 视频事件
  onVideoPlay() {
    // 视频开始播放
  },

  onVideoPause() {
    // 视频暂停
  },

  onVideoEnded() {
    // 视频播放完成
  },

  // 音频事件
  onAudioPlay() {
    // 音频开始播放
  },

  onAudioPause() {
    // 音频暂停
  },

  // 跳转AR
  onARClick() {
    wx.navigateTo({
      url: '/pages/ar/ar'
    });
  },

  // 分享
  onShareAppMessage() {
    const { spot } = this.data;
    return {
      title: spot ? `大观园 · ${spot.name}` : '大观园景点',
      path: `/pages/detail/detail?id=${this.data.spotId}`,
      imageUrl: spot?.image || ''
    };
  }
});
