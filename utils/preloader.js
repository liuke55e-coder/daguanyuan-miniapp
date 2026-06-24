// utils/preloader.js - 资源预加载
// 在用户靠近景点时提前加载视频/音频资源

class Preloader {
  constructor() {
    this.preloaded = new Set();
    this.loading = new Set();
  }

  /**
   * 预加载景点资源
   * @param {Object} spot - 景点数据
   */
  async preloadSpot(spot) {
    if (this.preloaded.has(spot.id) || this.loading.has(spot.id)) return;

    this.loading.add(spot.id);

    const tasks = [];

    // 预加载视频（通过临时video组件）
    if (spot.story && spot.story.scenes) {
      for (const scene of spot.story.scenes) {
        if (scene.video) {
          tasks.push(this.preloadVideo(scene.video));
        }
      }
    }

    // 预加载音频
    if (spot.audio) {
      tasks.push(this.preloadAudio(spot.audio));
    }

    try {
      await Promise.all(tasks);
      this.preloaded.add(spot.id);
    } catch (err) {
      console.warn('预加载失败:', spot.name, err);
    } finally {
      this.loading.delete(spot.id);
    }
  }

  /**
   * 预加载视频
   */
  preloadVideo(url) {
    return new Promise((resolve) => {
      // 微信小程序中，可通过创建临时video标签预加载
      // 此处为简化实现，实际使用 wx.downloadFile 或 video 标签 preload 属性
      wx.downloadFile({
        url,
        success: () => resolve(),
        fail: () => resolve() // 预加载失败不阻塞
      });
    });
  }

  /**
   * 预加载音频
   */
  preloadAudio(url) {
    return new Promise((resolve) => {
      wx.downloadFile({
        url,
        success: () => resolve(),
        fail: () => resolve()
      });
    });
  }

  /**
   * 清除预加载缓存
   */
  clear() {
    this.preloaded.clear();
    this.loading.clear();
  }
}

module.exports = Preloader;
