// components/story-card/story-card.js
// 景点故事卡片组件 — 3层展开（迷你/标准/完整）

Component({
  properties: {
    // 景点数据
    spot: { type: Object, value: null },
    // 卡片模式: mini | standard | full
    mode: { type: String, value: 'standard' }
  },

  data: {
    currentMode: 'standard',
    expanded: false,
    playing: false
  },

  lifetimes: {
    attached() {
      this.setData({ currentMode: this.properties.mode });
    }
  },

  methods: {
    // 点击展开
    onExpand() {
      if (this.data.currentMode === 'mini') {
        this.setData({ currentMode: 'standard', expanded: true });
      } else {
        this.setData({ currentMode: 'full', expanded: true });
      }
      this.triggerEvent('expand', { spotId: this.properties.spot.id });
    },

    // 收起
    onCollapse() {
      this.setData({ currentMode: 'standard', expanded: false });
    },

    // 播放视频
    onPlayVideo(e) {
      this.triggerEvent('playvideo', { videoUrl: e.detail.videoUrl });
    },

    // 播放音频
    onPlayAudio(e) {
      this.triggerEvent('playaudio', { audioUrl: e.detail.audioUrl });
    }
  }
});
