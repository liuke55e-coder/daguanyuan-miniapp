// components/ar-overlay/ar-overlay.js
// AR信息叠加层组件 - 显示识别到的建筑信息

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    spotInfo: {
      type: Object,
      value: null
    },
    tracking: {
      type: Boolean,
      value: false
    }
  },

  data: {
    animationClass: ''
  },

  observers: {
    'visible'(newVal) {
      if (newVal) {
        this.setData({ animationClass: 'overlay-enter' });
      } else {
        this.setData({ animationClass: 'overlay-exit' });
      }
    }
  },

  methods: {
    onTap() {
      if (this.properties.spotInfo && this.properties.spotInfo.id) {
        wx.navigateTo({
          url: `/pages/detail/detail?id=${this.properties.spotInfo.id}`
        });
      }
      this.triggerEvent('tap', { spot: this.properties.spotInfo });
    },

    onClose() {
      this.triggerEvent('close');
    }
  }
});
