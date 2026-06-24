// components/audio-player/audio-player.js
// 语音讲解播放器 - 使用 wx.createInnerAudioContext

Component({
  properties: {
    src: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: '语音讲解'
    },
    autoplay: {
      type: Boolean,
      value: false
    }
  },

  data: {
    playing: false,
    currentTime: 0,
    duration: 0,
    progress: 0
  },

  lifetimes: {
    attached() {
      this.audioCtx = wx.createInnerAudioContext();
      this.audioCtx.onPlay(() => {
        this.setData({ playing: true });
        this.triggerEvent('play');
      });
      this.audioCtx.onPause(() => {
        this.setData({ playing: false });
        this.triggerEvent('pause');
      });
      this.audioCtx.onStop(() => {
        this.setData({ playing: false, progress: 0 });
        this.triggerEvent('stop');
      });
      this.audioCtx.onEnded(() => {
        this.setData({ playing: false, progress: 100 });
        this.triggerEvent('ended');
      });
      this.audioCtx.onTimeUpdate(() => {
        const current = this.audioCtx.currentTime;
        const duration = this.audioCtx.duration;
        this.setData({
          currentTime: current,
          duration: duration,
          progress: duration ? (current / duration) * 100 : 0
        });
        this.triggerEvent('timeupdate', { currentTime: current, duration });
      });
      this.audioCtx.onError((err) => {
        console.error('音频播放错误:', err);
        this.setData({ playing: false });
        this.triggerEvent('error', err);
      });
    },

    detached() {
      if (this.audioCtx) {
        this.audioCtx.destroy();
      }
    }
  },

  observers: {
    'src'(newSrc) {
      if (newSrc) {
        this.audioCtx.src = newSrc;
      }
    }
  },

  methods: {
    togglePlay() {
      if (this.data.playing) {
        this.audioCtx.pause();
      } else {
        if (!this.audioCtx.src && this.properties.src) {
          this.audioCtx.src = this.properties.src;
        }
        this.audioCtx.play();
      }
    },

    seekTo(e) {
      const percent = e.detail.value;
      const duration = this.audioCtx.duration;
      if (duration) {
        this.audioCtx.seek((percent / 100) * duration);
      }
    }
  }
});
