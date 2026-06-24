// pages/relations/relations.js - 人物关系页（P1简单实现）
// 展示红楼梦主要人物及其关系

const charactersData = require('../../data/characters.json');

Page({
  data: {
    // 人物列表
    characters: [],

    // 展开的人物ID
    expandedId: '',

    // 加载状态
    loading: true
  },

  onLoad() {
    this.loadCharacters();
  },

  // 加载人物数据
  loadCharacters() {
    const characters = charactersData || [];
    this.setData({
      characters,
      loading: false
    });
  },

  // 点击人物卡片，展开/收起关系
  onCharacterTap(e) {
    const characterId = e.currentTarget.dataset.characterId;
    const { expandedId } = this.data;

    if (expandedId === characterId) {
      this.setData({ expandedId: '' });
    } else {
      this.setData({ expandedId: characterId });
    }
  },

  // 查看关联人物
  onRelationTap(e) {
    const relatedId = e.currentTarget.dataset.relatedId;
    // 滚动到对应人物并展开
    this.setData({ expandedId: relatedId });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '红楼梦 · 人物关系',
      path: '/pages/relations/relations'
    };
  }
});
