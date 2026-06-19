import * as THREE from 'three';
import { UIManager } from './ui';
import { BuildingManager } from './building';
import { LightManager } from './lights';
import { TrafficManager } from './traffic';
import type { BuildingInfo } from './ui';

class CityVisualizationApp {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private uiManager!: UIManager;
  private buildingManager!: BuildingManager;
  private lightManager!: LightManager;
  private trafficManager!: TrafficManager;
  private clock!: THREE.Clock;
  private stars!: THREE.Points;
  private readonly container: HTMLElement;

  constructor() {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      throw new Error('Cannot find app container');
    }
    this.container = appContainer;

    /**
     * 初始化流程数据流：
     * createScene → createCamera → createRenderer → createStarfield
     * → BuildingManager（生成建筑群 + 计算包围盒）
     * → LightManager（使用 BuildingManager 的包围盒计算阴影相机）
     * → TrafficManager（生成交通路径）
     * → UIManager（创建滑块和信息面板）
     * → setupUICallbacks（绑定模块间事件回调）
     */
    this.init();
    this.animate();
  }

  private init(): void {
    this.clock = new THREE.Clock();
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createStarfield();
    this.setupResizeHandler();

    this.buildingManager = new BuildingManager(this.scene, this.camera, this.renderer);

    /**
     * 数据流：BuildingManager.getSceneBounds() → LightManager 构造函数
     * 建筑群包围盒数据用于动态计算阴影相机的视锥体范围，确保阴影不被裁剪
     */
    const sceneBounds = this.buildingManager.getSceneBounds();
    this.lightManager = new LightManager(this.scene, sceneBounds);

    this.trafficManager = new TrafficManager(this.scene);

    this.uiManager = new UIManager(this.container);
    this.setupUICallbacks();

    this.lightManager.updateSunPosition(this.uiManager.getCurrentTime());
  }

  private createScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.Fog(0x0a0a1a, 80, 180);
  }

  private createCamera(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);

    const cameraDistance = 90;
    const cameraHeight = 70;
    this.camera.position.set(cameraDistance * Math.cos(Math.PI / 4), cameraHeight, cameraDistance * Math.sin(Math.PI / 4));
    this.camera.lookAt(0, 0, 0);
  }

  private createRenderer(): void {
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
      throw new Error('Cannot find canvas container');
    }

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    canvasContainer.appendChild(this.renderer.domElement);
  }

  private createStarfield(): void {
    const starCount = 1500;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const radius = 300 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.6 + 50;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const colorChoice = Math.random();
      if (colorChoice < 0.7) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      } else if (colorChoice < 0.85) {
        colors[i * 3] = 0.7;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 0.7;
      }

      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }

  /**
   * 数据流：设置模块间的事件回调连接
   *
   * 时间滑块数据流：
   * UIManager.onTimeChange → 回调(time)
   *   → LightManager.updateSunPosition(time)  更新太阳位置、光照颜色、阴影
   *   → updateBackgroundByTime(time)          更新天空背景和雾颜色
   *
   * 建筑点击数据流：
   * BuildingManager.onBuildingClick → 回调(BuildingInfo | null)
   *   → UIManager.showBuildingInfo(info)    显示建筑属性面板（滑入动画）
   *   → UIManager.hideInfoPanel()           隐藏面板（滑出动画）
   *
   * UI关闭按钮数据流：
   * UIManager.onBuildingSelect → 回调(null)
   *   → BuildingManager.clearSelection()   清除建筑选中状态
   */
  private setupUICallbacks(): void {
    /**
     * 接收 UI 模块的时间值 → 传递给光影模块更新太阳位置 → 触发重绘
     * 同时根据时间值更新场景背景和雾的颜色
     */
    this.uiManager.onTimeChange((time: number) => {
      this.lightManager.updateSunPosition(time);
      this.updateBackgroundByTime(time);
    });

    /**
     * 接收 UI 模块的取消选择事件（用户点击信息面板关闭按钮）
     * → 通知 BuildingManager 清除建筑选中状态
     */
    this.uiManager.onBuildingSelect((info: BuildingInfo | null) => {
      if (info === null) {
        this.buildingManager.clearSelection();
      }
    });

    /**
     * 接收建筑模块的点击事件 → 传递 BuildingInfo 给 UI 模块显示/隐藏信息面板
     * BuildingInfo 包含：建筑名称、楼层数、用途类型等属性
     */
    this.buildingManager.onBuildingClick((info: BuildingInfo | null) => {
      if (info) {
        this.uiManager.showBuildingInfo(info);
      } else {
        this.uiManager.hideInfoPanel();
      }
    });
  }

  /**
   * 数据流：接收 UI 模块的时间值（6~18小时）
   * → 插值计算不同时段的天空颜色和雾颜色
   * → 更新 scene.background 和 scene.fog.color
   * → 下一帧 renderer.render 时呈现新的天空效果
   */
  private updateBackgroundByTime(hours: number): void {
    const t = (hours - 6) / 12;
    const clampedT = Math.max(0, Math.min(1, t));

    let topColor: THREE.Color;
    let bottomColor: THREE.Color;

    if (clampedT < 0.15) {
      const localT = clampedT / 0.15;
      topColor = new THREE.Color(0x0a0a2e).lerp(new THREE.Color(0x1a1a4e), localT);
      bottomColor = new THREE.Color(0xff4422).lerp(new THREE.Color(0xff8844), localT);
    } else if (clampedT < 0.3) {
      const localT = (clampedT - 0.15) / 0.15;
      topColor = new THREE.Color(0x1a1a4e).lerp(new THREE.Color(0x4a7fb8), localT);
      bottomColor = new THREE.Color(0xff8844).lerp(new THREE.Color(0xaaccff), localT);
    } else if (clampedT < 0.7) {
      topColor = new THREE.Color(0x4a7fb8);
      bottomColor = new THREE.Color(0xaaccff);
    } else if (clampedT < 0.85) {
      const localT = (clampedT - 0.7) / 0.15;
      topColor = new THREE.Color(0x4a7fb8).lerp(new THREE.Color(0x2a1a3e), localT);
      bottomColor = new THREE.Color(0xaaccff).lerp(new THREE.Color(0xff6644), localT);
    } else {
      const localT = (clampedT - 0.85) / 0.15;
      topColor = new THREE.Color(0x2a1a3e).lerp(new THREE.Color(0x0a0a1a), localT);
      bottomColor = new THREE.Color(0xff6644).lerp(new THREE.Color(0x0a0a1a), localT);
    }

    this.scene.background = topColor;
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(bottomColor);
    }
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  /**
   * 数据流：每帧渲染循环
   * performance.now() → BuildingManager.updateAnimations  推进选中动画 + 光柱动画
   * clock.getDelta()   → TrafficManager.update            推进交通光点沿路径移动
   * clock.getElapsedTime() → stars.rotation               缓慢旋转星空
   * → renderer.render(scene, camera)  输出最终画面到 Canvas
   */
  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const time = performance.now();
    const deltaTime = this.clock.getDelta() * 1000;
    const elapsed = this.clock.getElapsedTime();

    this.buildingManager.updateAnimations(time);
    this.trafficManager.update(time, deltaTime);

    if (this.stars) {
      this.stars.rotation.y = elapsed * 0.01;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    new CityVisualizationApp();
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
});
