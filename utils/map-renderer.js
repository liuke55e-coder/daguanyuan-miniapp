// utils/map-renderer.js - 2D地图渲染引擎
// 基于 Canvas 2D API 的自研轻量渲染器

/**
 * MapRenderer - 园区地图渲染器
 * 
 * 功能：
 * - 加载并绘制2D底图
 * - 景点标记点绘制（3种状态：默认/附近/已访问）
 * - GPS位置蓝点绘制
 * - 主题路线虚线绘制
 * - 双指缩放 + 单指平移
 * - GPS坐标 → Canvas像素坐标转换
 */
class MapRenderer {
  /**
   * @param {CanvasContext} ctx - Canvas 2D 上下文
   * @param {Object} options - 配置项
   * @param {string} options.mapImagePath - 底图路径
   * @param {Array} options.spots - 景点数据列表
   * @param {number} options.canvasWidth - Canvas宽度（px）
   * @param {number} options.canvasHeight - Canvas高度（px）
   */
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.mapImagePath = options.mapImagePath || '/assets/images/map-base.png';
    this.spots = options.spots || [];
    this.canvasWidth = options.canvasWidth || 750;
    this.canvasHeight = options.canvasHeight || 1334;

    // 变换状态
    this.scale = 1;
    this.minScale = 0.5;
    this.maxScale = 3;
    this.offsetX = 0;
    this.offsetY = 0;

    // 底图Image对象
    this.mapImage = null;

    // 用户位置
    this.userX = null;
    this.userY = null;

    // 当前路线
    this.currentRoute = null;

    // 已访问景点ID集合
    this.visitedSpotIds = new Set();

    // 触摸状态
    this.touches = {};
    this.lastTouchDistance = 0;
    this.lastTouchCenter = { x: 0, y: 0 };
  }

  /**
   * 加载底图
   */
  async loadMapImage() {
    return new Promise((resolve, reject) => {
      const img = this.ctx.createImage();
      img.onload = () => {
        this.mapImage = img;
        resolve();
      };
      img.onerror = reject;
      img.src = this.mapImagePath;
    });
  }

  /**
   * 设置已访问景点
   */
  setVisitedSpots(spotIds) {
    this.visitedSpotIds = new Set(spotIds);
  }

  /**
   * 设置当前路线
   */
  setRoute(route) {
    this.currentRoute = route;
  }

  /**
   * 更新用户GPS位置并转为Canvas坐标
   */
  updateUserLocation(latitude, longitude) {
    const point = this.gpsToCanvas(latitude, longitude);
    this.userX = point.x;
    this.userY = point.y;
  }

  /**
   * GPS坐标 → Canvas像素坐标（仿射变换）
   * 
   * 大观园园区GPS范围（需实地采集校准）：
   * 左上角: 31.1000°N, 120.9300°E
   * 右下角: 31.0900°N, 120.9400°E
   */
  gpsToCanvas(latitude, longitude) {
    // 园区GPS边界（占位值，需实地采集）
    const bounds = {
      north: 31.1000,  // 最北
      south: 31.0900,  // 最南
      west: 120.9300,  // 最西
      east: 120.9400   // 最东
    };

    const x = ((longitude - bounds.west) / (bounds.east - bounds.west)) * this.canvasWidth;
    const y = ((bounds.north - latitude) / (bounds.north - bounds.south)) * this.canvasHeight;
    return { x, y };
  }

  /**
   * 主渲染循环
   */
  render() {
    if (!this.ctx || !this.mapImage) return;

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.ctx.save();

    // 应用缩放和平移
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    // 1. 绘制底图
    this.drawMapBase();

    // 2. 绘制路线（如有）
    if (this.currentRoute) {
      this.drawRoute();
    }

    // 3. 绘制景点标记
    this.drawSpots();

    this.ctx.restore();

    // 4. 绘制用户位置（不受缩放影响，保持固定大小）
    if (this.userX !== null && this.userY !== null) {
      this.drawUserLocation();
    }
  }

  /**
   * 绘制底图
   */
  drawMapBase() {
    this.ctx.drawImage(
      this.mapImage,
      0, 0,
      this.canvasWidth, this.canvasHeight
    );
  }

  /**
   * 绘制景点标记
   */
  drawSpots() {
    for (const spot of this.spots) {
      const { x, y } = spot.position.map;
      const isVisited = this.visitedSpotIds.has(spot.id);
      const isOnRoute = this.currentRoute
        ? this.currentRoute.spots.includes(spot.id)
        : true;

      // 路线外景点半透明
      const alpha = isOnRoute ? 1 : 0.3;

      this.ctx.globalAlpha = alpha;

      if (isVisited) {
        this.drawVisitedMarker(x, y, spot.name);
      } else {
        this.drawDefaultMarker(x, y, spot.name);
      }
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * 绘制默认景点标记
   */
  drawDefaultMarker(x, y, name) {
    // 外圈
    this.ctx.beginPath();
    this.ctx.arc(x, y, 14, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fill();
    this.ctx.strokeStyle = '#C41E3A';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // 内圆
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0, Math.PI * 2);
    this.ctx.fillStyle = '#C41E3A';
    this.ctx.fill();

    // 名称
    this.ctx.font = '11px sans-serif';
    this.ctx.fillStyle = '#3C3C3C';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(name, x, y - 22);
  }

  /**
   * 绘制已访问标记
   */
  drawVisitedMarker(x, y, name) {
    // 外圈
    this.ctx.beginPath();
    this.ctx.arc(x, y, 12, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(46, 139, 87, 0.2)';
    this.ctx.fill();
    this.ctx.strokeStyle = '#2E8B57';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // 勾号
    this.ctx.fillStyle = '#2E8B57';
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('✓', x, y);

    // 名称
    this.ctx.font = '11px sans-serif';
    this.ctx.fillStyle = '#888888';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'alphabetic';
    this.ctx.fillText(name, x, y - 20);
  }

  /**
   * 绘制用户位置蓝点
   */
  drawUserLocation() {
    const x = this.userX * this.scale + this.offsetX;
    const y = this.userY * this.scale + this.offsetY;

    // 外圈脉冲
    this.ctx.beginPath();
    this.ctx.arc(x, y, 16, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 122, 255, 0.15)';
    this.ctx.fill();

    // 蓝点
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, Math.PI * 2);
    this.ctx.fillStyle = '#007AFF';
    this.ctx.fill();
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  /**
   * 绘制路线虚线
   */
  drawRoute() {
    if (!this.currentRoute || this.currentRoute.spots.length < 2) return;

    const routeSpots = this.currentRoute.spots
      .map(id => this.spots.find(s => s.id === id))
      .filter(Boolean);

    this.ctx.strokeStyle = this.currentRoute.color || '#C41E3A';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([8, 6]);
    this.ctx.lineCap = 'round';

    this.ctx.beginPath();
    const first = routeSpots[0];
    this.ctx.moveTo(first.position.map.x, first.position.map.y);

    for (let i = 1; i < routeSpots.length; i++) {
      this.ctx.lineTo(routeSpots[i].position.map.x, routeSpots[i].position.map.y);
    }

    this.ctx.stroke();
    this.ctx.setLineDash([]); // 重置
  }

  /**
   * 处理触摸开始
   */
  onTouchStart(touches) {
    if (touches.length === 1) {
      // 单指：记录起始点
      this.touches.startX = touches[0].x;
      this.touches.startY = touches[0].y;
      this.touches.startOffsetX = this.offsetX;
      this.touches.startOffsetY = this.offsetY;
    } else if (touches.length === 2) {
      // 双指：记录初始距离和中心
      this.lastTouchDistance = this.getTouchDistance(touches);
      this.lastTouchCenter = this.getTouchCenter(touches);
      this.touches.startScale = this.scale;
    }
  }

  /**
   * 处理触摸移动
   */
  onTouchMove(touches) {
    if (touches.length === 1) {
      // 单指平移
      const dx = touches[0].x - this.touches.startX;
      const dy = touches[0].y - this.touches.startY;
      this.offsetX = this.touches.startOffsetX + dx;
      this.offsetY = this.touches.startOffsetY + dy;
    } else if (touches.length === 2) {
      // 双指缩放
      const distance = this.getTouchDistance(touches);
      const center = this.getTouchCenter(touches);
      const newScale = this.touches.startScale * (distance / this.lastTouchDistance);
      this.scale = Math.max(this.minScale, Math.min(this.maxScale, newScale));

      // 以中心点为锚点调整偏移
      const scaleRatio = this.scale / this.touches.startScale;
      this.offsetX = center.x - (center.x - this.offsetX) * scaleRatio;
      this.offsetY = center.y - (center.y - this.offsetY) * scaleRatio;
    }
  }

  /**
   * 检测点击的景点
   */
  hitTestSpot(tapX, tapY) {
    // 将屏幕坐标转为地图坐标
    const mapX = (tapX - this.offsetX) / this.scale;
    const mapY = (tapY - this.offsetY) / this.scale;

    for (const spot of this.spots) {
      const dx = mapX - spot.position.map.x;
      const dy = mapY - spot.position.map.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 20) return spot;
    }
    return null;
  }

  /**
   * 计算双指距离
   */
  getTouchDistance(touches) {
    const dx = touches[0].x - touches[1].x;
    const dy = touches[0].y - touches[1].y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算双指中心点
   */
  getTouchCenter(touches) {
    return {
      x: (touches[0].x + touches[1].x) / 2,
      y: (touches[0].y + touches[1].y) / 2
    };
  }
}

module.exports = MapRenderer;
