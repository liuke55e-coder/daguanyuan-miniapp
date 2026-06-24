// components/video-player/video-player.js
// 视频播放器组件 - 封装 wx.createVideoContext

Component({
  properties: {
    src: {
      type: String,
      value: ''
    },
    poster: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    autoplay: {
      type: Boolean,
      value: false
    },
    loop: {
      type: Boolean,
      value: false
    },
    muted: {
      type: Boolean,
      value: false
    }
  },

  data: {
    playing: false,
    currentTime: 0,
    duration: 0,
    showControls: true
  },

  methods: {
    onPlay() {
      this.setData({ playing: true });
      this.triggerEvent('play');
    },

    onPause() {
      this.setData({ playing: false });
      this.triggerEvent('pause');
    },

    onEnded() {
      this.setData({ playing: false });
      this.triggerEvent('ended');
    },

    onTimeUpdate(e) {
      this.setData({ currentTime: e.detail.currentTime });
      this.triggerEvent('timeupdate', { currentTime: e.detail.currentTime });
    },

    onError(e) {
      console.error('视频播放错误:', e.detail);
      this.triggerEvent('error', e.detail);
    },

    togglePlay() {
      const ctx = wx.createVideoContext('videoPlayer', this);
      if (this.data.playing) {
        ctx.pause();
      } else {
        ctx.play();
      }
    }
  }
});
