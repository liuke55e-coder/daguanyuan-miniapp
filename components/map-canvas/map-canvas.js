// components/map-canvas/map-canvas.js
// 2D园区地图Canvas组件

const MapRenderer = require('../../utils/map-renderer');
const spotsData = require('../../data/spots.json');

Component({
  properties: {
    // 用户GPS位置
    userLatitude: { type: Number, value: null },
    userLongitude: { type: Number, value: null },
    // 当前路线
    currentRoute: { type: Object, value: null },
    // 已访问景点ID列表
    visitedSpotIds: { type: Array, value: [] }
  },

  data: {
    canvasWidth: 750,
    canvasHeight: 1332,
    mapReady: false
  },

  lifetimes: {
    attached() {
      this.initCanvas();
    }
  },

  observers: {
    'userLatitude, userLongitude'(lat, lng) {
      if (this.renderer && lat && lng) {
        this.renderer.updateUserLocation(lat, lng);
        this.renderer.render();
      }
    },
    'currentRoute'(route) {
      if (this.renderer) {
        this.renderer.setRoute(route);
        this.renderer.render();
      }
    },
    'visitedSpotIds'(ids) {
      if (this.renderer) {
        this.renderer.setVisitedSpots(ids);
        this.renderer.render();
      }
    }
  },

  methods: {
    async initCanvas() {
      const query = this.createSelectorQuery();
      query.select('#mapCanvas')
        .fields({ node: true, size: true })
        .exec(async (res) => {
          if (!res[0]) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;

          canvas.width = this.data.canvasWidth * dpr;
          canvas.height = this.data.canvasHeight * dpr;
          ctx.scale(dpr, dpr);

          this.renderer = new MapRenderer(ctx, {
            mapImagePath: '/assets/images/map-base.png',
            spots: spotsData.spots,
            canvasWidth: this.data.canvasWidth,
            canvasHeight: this.data.canvasHeight
          });

          await this.renderer.loadMapImage();
          this.renderer.setVisitedSpots(this.properties.visitedSpotIds);
          if (this.properties.currentRoute) {
            this.renderer.setRoute(this.properties.currentRoute);
          }
          this.renderer.render();
          this.setData({ mapReady: true });
        });
    },

    // 触摸事件
    onTouchStart(e) {
      if (this.renderer) this.renderer.onTouchStart(e.touches);
    },
    onTouchMove(e) {
      if (this.renderer) {
        this.renderer.onTouchMove(e.touches);
        this.renderer.render();
      }
    },
    onTouchEnd(e) {
      if (!this.renderer || e.touches.length > 0) return;
      // 检测点击景点
      const touch = e.changedTouches[0];
      const spot = this.renderer.hitTestSpot(touch.x, touch.y);
      if (spot) {
        this.triggerEvent('spottap', { spotId: spot.id });
      }
    }
  }
});
