// components/badge-wall/badge-wall.js
// 成就徽章墙组件

Component({
  properties: {
    achievements: {
      type: Array,
      value: []
    },
    unlockedIds: {
      type: Array,
      value: []
    }
  },

  data: {
    badges: [
      { id: 'first_visit', name: '初入大观园', icon: '🏯', desc: '首次游览景点', unlocked: false },
      { id: 'five_spots', name: '游园五景', icon: '🌸', desc: '游览5个景点', unlocked: false },
      { id: 'ten_spots', name: '十景巡礼', icon: '🏅', desc: '游览10个景点', unlocked: false },
      { id: 'all_spots', name: '大观园通', icon: '👑', desc: '游览全部景点', unlocked: false },
      { id: 'three_areas', name: '区域探索者', icon: '🗺️', desc: '游览全部四个区域', unlocked: false },
      { id: 'ar_first', name: 'AR初体验', icon: '📱', desc: '首次使用AR识景', unlocked: false },
      { id: 'favorites_5', name: '收藏家', icon: '⭐', desc: '收藏5个景点', unlocked: false },
      { id: 'love_route', name: '宝黛之恋', icon: '💕', desc: '完成宝黛爱情线', unlocked: false }
    ]
  },

  observers: {
    'unlockedIds'(ids) {
      if (ids && ids.length > 0) {
        const badges = this.data.badges.map(badge => ({
          ...badge,
          unlocked: ids.includes(badge.id)
        }));
        this.setData({ badges });
      }
    }
  },

  methods: {
    onBadgeTap(e) {
      const badge = e.currentTarget.dataset.badge;
      if (badge.unlocked) {
        wx.showToast({ title: badge.desc, icon: 'none' });
      }
      this.triggerEvent('bargetap', { badge });
    }
  }
});
