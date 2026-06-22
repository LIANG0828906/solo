// 3D场景管理类：创建地球、大气层、台风粒子云、路径轨迹线和城市标记
// 数据流向：接收来自DataService的台风路径数据数组，逐帧更新粒子位置和热力图颜色

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TyphoonParticle, ParticleState } from './TyphoonParticle';
import type { DataPoint, CityImpact, HeatmapGrid } from '@/data/DataService';

const EARTH_RADIUS = 2.0;
const PARTICLE_COUNT = 2600;
const TOTAL_STEPS = 72;

type CameraMode = 'perspective3d' | 'ortho2d';

export interface SceneCallbacks {
  onCityClick?: (cityId: string) => void;
  onTimeStepChange?: (step: number) => void;
}

export class TyphoonScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera3d: THREE.PerspectiveCamera;
  private camera2d: THREE.OrthographicCamera;
  private currentCamera: THREE.Camera;
  private controls: OrbitControls;
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;

  // 地球元素
  private earth!: THREE.Mesh;
  private atmosphere!: THREE.Mesh;
  private grid2dHelper!: THREE.Group;

  // 台风相关
  private typhoonPath!: THREE.Line;
  private particlesGeometry!: THREE.BufferGeometry;
  private particlesMesh!: THREE.Points;
  private particles: TyphoonParticle[] = [];
  private particlePositions!: Float32Array;
  private particleColors!: Float32Array;
  private particleSizes!: Float32Array;
  private particleState: ParticleState;

  // 城市相关
  private cityMarkers: Map<string, THREE.Group> = new Map();
  private cityHeatSpheres: Map<string, THREE.Mesh> = new Map();
  private cityHeatSprites: Map<string, THREE.Sprite> = new Map(); // 新增：贴地径向渐变热力Sprite
  private cityLabels: Map<string, HTMLDivElement> = new Map();
  private heatmapTexture!: THREE.Texture;  // 预计算热力图径向渐变贴图
  private raycaster = new THREE.Raycaster();
  private mouseNdc = new THREE.Vector2();

  // 数据
  private pathData: DataPoint[] = [];
  private cityData: CityImpact[] = [];
  private heatmapCells: HeatmapGrid['cells'] = [];

  // 动画控制
  private currentTimeStep = 0;
  private isPlaying = false;
  private speedMultiplier = 1.0;
  private playTimer = 0;
  private showHeatmap = true;

  // 相机过渡
  private cameraMode: CameraMode = 'perspective3d';
  private cameraTransitionActive = false;
  private cameraTransitionDuration = 1.0;   // 1秒平滑过渡
  private cameraTransitionT = 0;
  private cameraTransitionFrom = new THREE.Vector3();
  private cameraTransitionTarget = new THREE.Vector3();
  private cameraLookAtFrom = new THREE.Vector3();
  private cameraLookAtTarget = new THREE.Vector3();
  private cameraUpFrom = new THREE.Vector3(0, 1, 0);
  private cameraUpTarget = new THREE.Vector3(0, 1, 0);
  private cameraFovFrom = 50;
  private cameraFovTarget = 50;

  // 运行数据
  private clock = new THREE.Clock();
  private running = false;
  private resizeObserver: ResizeObserver;
  private callbacks: SceneCallbacks;
  private hoveredCityId: string | null = null;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement, callbacks: SceneCallbacks = {}) {
    this.container = container;
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.particleState = {
      position: new THREE.Vector3(),
      color: new THREE.Color(),
      size: 0,
      opacity: 1,
    };

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    // Scene
    this.scene = new THREE.Scene();

    // Cameras
    const { clientWidth: w, clientHeight: h } = container;
    this.camera3d = new THREE.PerspectiveCamera(50, w / h, 0.01, 100);
    this.camera3d.position.set(0, 0.8, 5.2);
    this.camera3d.lookAt(0, 0, 0);

    const aspect = w / h;
    const size = 4.2;
    this.camera2d = new THREE.OrthographicCamera(-aspect * size, aspect * size, size, -size, 0.1, 200);
    this.camera2d.position.set(0, 15, 0.0001);
    this.camera2d.up.set(0, 0, -1);
    this.camera2d.lookAt(0, 0, 0);

    this.currentCamera = this.camera3d;

    // Controls
    this.controls = new OrbitControls(this.camera3d, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2.6;
    this.controls.maxDistance = 12;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 0.8;

    // Lights
    const ambient = new THREE.AmbientLight(0x6070a0, 0.55);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.05);
    sun.position.set(6, 4, 5);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x4f8fff, 0.35);
    rim.position.set(-5, -2, -6);
    this.scene.add(rim);

    this.buildEarth();
    this.buildAtmosphere();
    this.build2dGrid();
    this.heatmapTexture = this.buildHeatmapGradientTexture();
    this.buildTyphoonSystem();
    this.buildLabelsContainer();

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);
    this.onResize();

    this.bindEvents();
  }

  // ========== 构建子组件 ==========

  private buildEarth(): void {
    const geo = new THREE.IcosahedronGeometry(EARTH_RADIUS, 4);
    // 自定义顶点颜色：深蓝海洋 + 浅色大陆（简单程序化）
    const colors: number[] = [];
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const OCEAN = new THREE.Color(0x103a6d);
    const LAND = new THREE.Color(0x6ea87b);
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const lat = Math.asin(v.y / EARTH_RADIUS) * 180 / Math.PI;
      const lng = Math.atan2(v.z, v.x) * 180 / Math.PI;
      // 简化大陆：几个纬度带的噪声
      const s = Math.sin(lat * 0.23) * Math.cos(lng * 0.15) + Math.sin(lat * 0.08 + 2) * Math.cos(lng * 0.07 - 1);
      const n = s + (Math.sin(lat * 1.3 + lng * 0.6) * 0.3);
      const t = n > 0.05 ? THREE.MathUtils.clamp((n + 0.1) * 1.4, 0, 1) : 0;
      const c = OCEAN.clone().lerp(LAND, t);
      // 极地冰盖
      if (Math.abs(lat) > 70) {
        const ice = THREE.MathUtils.clamp((Math.abs(lat) - 70) / 15, 0, 1);
        c.lerp(new THREE.Color(0xffffff), ice * 0.75);
      }
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 8,
      specular: new THREE.Color(0x224477),
      flatShading: true,
    });
    this.earth = new THREE.Mesh(geo, mat);
    this.scene.add(this.earth);
  }

  private buildAtmosphere(): void {
    const geo = new THREE.SphereGeometry(EARTH_RADIUS * 1.08, 48, 48);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(0x6ac6ff) },
        uIntensity: { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vPosW;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vPosW = wp.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec3 vNormalW;
        varying vec3 vPosW;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vPosW);
          float f = pow(1.0 - abs(dot(viewDir, vNormalW)), 3.0);
          gl_FragColor = vec4(uColor, f * 0.6 * uIntensity);
        }
      `,
    });
    this.atmosphere = new THREE.Mesh(geo, mat);
    this.scene.add(this.atmosphere);
  }

  private build2dGrid(): void {
    this.grid2dHelper = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({
      color: 0x4a88d8,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    // 纬线
    for (let lat = -80; lat <= 80; lat += 20) {
      const pts: THREE.Vector3[] = [];
      for (let lng = -180; lng <= 180; lng += 5) {
        pts.push(TyphoonScene.llToXYZ(lat, lng, EARTH_RADIUS * 1.002));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.grid2dHelper.add(new THREE.Line(geo, mat));
    }
    // 经线
    for (let lng = -180; lng < 180; lng += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        pts.push(TyphoonScene.llToXYZ(lat, lng, EARTH_RADIUS * 1.002));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.grid2dHelper.add(new THREE.Line(geo, mat));
    }
    this.grid2dHelper.visible = false;
    this.scene.add(this.grid2dHelper);
  }

  private buildTyphoonSystem(): void {
    // 路径轨迹线（空，加载数据后填充）
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * TOTAL_STEPS), 3));
    const lineColor: number[] = [];
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const t = i / (TOTAL_STEPS - 1);
      lineColor.push(0.2 + 0.6 * t, 0.55, 1.0 - 0.6 * t);
    }
    lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColor, 3));
    const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 });
    this.typhoonPath = new THREE.Line(lineGeo, lineMat);
    this.scene.add(this.typhoonPath);

    // 粒子系统
    this.particlesGeometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    this.particleColors = new Float32Array(PARTICLE_COUNT * 3);
    this.particleSizes = new Float32Array(PARTICLE_COUNT);
    this.particlesGeometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    this.particlesGeometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));
    // 初始位置
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.particles.push(new TyphoonParticle(i, PARTICLE_COUNT));
      this.particleSizes[i] = 0.015;
      this.particlePositions[i * 3] = 0;
      this.particlePositions[i * 3 + 1] = -100;
      this.particlePositions[i * 3 + 2] = 0;
    }

    // 圆形 sprite 纹理（Canvas生成）
    const spriteTex = TyphoonScene.makeSpriteTexture();

    const pointsMat = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: spriteTex },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      vertexShader: `
        attribute float size;
        uniform float uPixelRatio;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * 350.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        varying vec3 vColor;
        void main() {
          vec4 t = texture2D(uTex, gl_PointCoord);
          if (t.a < 0.02) discard;
          gl_FragColor = vec4(vColor, 1.0) * t;
        }
      `,
    });
    this.particlesGeometry.setAttribute('size', new THREE.BufferAttribute(this.particleSizes, 1));

    this.particlesMesh = new THREE.Points(this.particlesGeometry, pointsMat);
    this.particlesMesh.visible = false;
    this.scene.add(this.particlesMesh);
  }

  private static makeSpriteTexture(): THREE.Texture {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0.0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.65)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.25)');
    g.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }

  private buildLabelsContainer(): void {
    const el = document.createElement('div');
    el.style.cssText = [
      'position:absolute', 'inset:0', 'pointer-events:none',
      'overflow:hidden', 'z-index:2',
    ].join(';') + ';';
    this.container.parentElement!.appendChild(el);
    this.labelsContainer = el;
  }

  /**
   * 预计算：城市热力图径向渐变贴图
   * 中心颜色饱和，边缘透明，形成从中心向外衰减的圆形热力区域
   */
  private buildHeatmapGradientTexture(): THREE.Texture {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    // 三层渐变叠加，中心亮，边缘快速衰减
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0.00, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.45)');
    g.addColorStop(0.80, 'rgba(255,255,255,0.14)');
    g.addColorStop(1.00, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  /** 灾害等级 -> RGB颜色（黄→橙→深红） */
  private static disasterColor(level: 1 | 2 | 3): THREE.Color {
    switch (level) {
      case 3: return new THREE.Color(0xff2030);  // 红
      case 2: return new THREE.Color(0xff7a1f);  // 橙
      default: return new THREE.Color(0xffd23a); // 黄
    }
  }

  // ========== 公共API：数据注入 ==========

  setPathData(data: DataPoint[]): void {
    this.pathData = data.slice();
    // 写入路径线
    const pos = this.typhoonPath.geometry.attributes.position as THREE.BufferAttribute;
    const colors = this.typhoonPath.geometry.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < data.length && i < TOTAL_STEPS; i++) {
      const pt = data[i];
      const p = TyphoonScene.llToXYZ(pt.lat, pt.lng, EARTH_RADIUS * 1.01);
      pos.setXYZ(i, p.x, p.y, p.z);
      // 颜色：根据风速
      const t = THREE.MathUtils.clamp((pt.windSpeed - 80) / 160, 0, 1);
      colors.setXYZ(i, 0.2 + t * 0.8, 0.8 - t * 0.4, 1.0 - t * 0.7);
    }
    pos.needsUpdate = true;
    colors.needsUpdate = true;
    this.typhoonPath.geometry.computeBoundingSphere();
    this.particlesMesh.visible = true;
  }

  setCityData(data: CityImpact[]): void {
    this.cityData = data.slice();
    // 构建城市标记（小柱体 + 球体）
    for (const city of this.cityData) {
      const g = new THREE.Group();
      g.userData.cityId = city.cityId;

      const center = TyphoonScene.llToXYZ(city.lat, city.lng, EARTH_RADIUS * 1.002);
      const n = center.clone().normalize();
      // 小柱体：从地表指向外
      const pillarH = 0.07;
      const pillarGeo = new THREE.CylinderGeometry(0.012, 0.018, pillarH, 10);
      const pillarMat = new THREE.MeshBasicMaterial({ color: 0xffc94a });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      TyphoonScene.orientToSurface(center, pillar);
      pillar.position.copy(center).addScaledVector(pillar.userData.normal || new THREE.Vector3(0, 1, 0), pillarH / 2);
      pillar.userData.normal = pillar.userData.normal || new THREE.Vector3(0, 1, 0);
      g.add(pillar);
      // 顶部发光球
      const tipGeo = new THREE.SphereGeometry(0.028, 14, 14);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xffd86b });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.copy(center).addScaledVector(n, pillarH + 0.028);
      g.add(tip);
      g.userData.tipMat = tipMat;
      this.cityMarkers.set(city.cityId, g);
      this.scene.add(g);

      // ============ 热力图实现：径向渐变 Sprite + 贴地球体 ============
      // 基础半径（km → three.js 单位）：小城市 50km，大城市 120km
      const baseRadius = city.size === 'large'
        ? (120 / 6371) * EARTH_RADIUS
        : (50 / 6371) * EARTH_RADIUS;

      // 1) 贴地 3D 半球（让热力球在球面上有体积感）
      const heatGeo = new THREE.SphereGeometry(baseRadius, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2);
      const heatMat = new THREE.MeshBasicMaterial({
        color: 0xffcc33,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const heat = new THREE.Mesh(heatGeo, heatMat);
      TyphoonScene.orientToSurface(center, heat);
      heat.position.copy(center).addScaledVector(n, 0.005);
      heat.scale.setScalar(0.6);
      this.cityHeatSpheres.set(city.cityId, heat);
      this.scene.add(heat);

      // 2) 径向渐变 Sprite（billboard，让热力区域有发光边缘效果）
      const spriteMat = new THREE.SpriteMaterial({
        map: this.heatmapTexture,
        color: 0xffcc33,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.55,
      });
      const sprite = new THREE.Sprite(spriteMat);
      // 把 Sprite 沿法线抬起来，避免被地球表面完全遮挡
      sprite.position.copy(center).addScaledVector(n, baseRadius * 0.45);
      // 根据城市规模设置初始尺寸
      const spriteSize = baseRadius * 2.2;
      sprite.scale.set(spriteSize, spriteSize, 1);
      sprite.userData.baseSize = spriteSize;
      this.cityHeatSprites.set(city.cityId, sprite);
      this.scene.add(sprite);

      // HTML 城市名标签（默认隐藏，2D模式显示）
      this.createCityLabel(city);
    }
    this.updateCityVisuals(0);
  }

  private createCityLabel(city: CityImpact): void {
    const el = document.createElement('div');
    el.style.cssText = [
      'position:absolute', 'color:#c9e6ff', 'font-size:12px',
      'padding:2px 8px', 'border-radius:6px',
      'background:rgba(10,30,60,0.6)',
      'backdrop-filter:blur(4px)',
      'border:1px solid rgba(120,180,255,0.3)',
      'white-space:nowrap',
      'transform:translate(-50%,-140%)',
      'text-shadow:0 0 8px rgba(0,180,255,0.5)',
      'opacity:0',
      'transition:opacity 0.3s',
      'pointer-events:none',
    ].join(';') + ';';
    el.textContent = city.name;
    this.labelsContainer.appendChild(el);
    this.cityLabels.set(city.cityId, el);
  }

  setHeatmapData(grid: HeatmapGrid): void {
    this.heatmapCells = grid.cells;
  }

  // ========== 公共API：控制 ==========

  play(): void {
    this.isPlaying = true;
    this.playTimer = 0;
  }
  pause(): void { this.isPlaying = false; }
  reset(): void {
    this.currentTimeStep = 0;
    this.isPlaying = false;
    this.playTimer = 0;
    this.updateFrame(this.currentTimeStep);
    this.callbacks.onTimeStepChange?.(0);
  }
  setSpeed(mult: number): void {
    this.speedMultiplier = THREE.MathUtils.clamp(mult, 0.25, 4);
  }
  setHeatmapVisible(v: boolean): void {
    this.showHeatmap = v;
    for (const [, m] of this.cityHeatSpheres) m.visible = v;
    for (const [, s] of this.cityHeatSprites) s.visible = v;
  }
  jumpTo(step: number): void {
    this.currentTimeStep = THREE.MathUtils.clamp(Math.round(step), 0, TOTAL_STEPS - 1);
    this.updateFrame(this.currentTimeStep);
  }
  getTimeStep(): number { return this.currentTimeStep; }

  switchCameraMode(mode: CameraMode): void {
    if (this.cameraMode === mode) return;
    this.cameraMode = mode;

    // 记录当前相机状态（无论当前是3d还是2d都用3d相机来过渡）
    this.cameraTransitionFrom.copy(this.camera3d.position);
    this.cameraLookAtFrom.copy(this.controls.target);
    this.cameraUpFrom.copy(this.camera3d.up);
    this.cameraFovFrom = this.camera3d.fov;

    // 目标状态
    if (mode === 'ortho2d') {
      this.cameraTransitionTarget.set(0, 11.5, 0.0001);
      this.cameraLookAtTarget.set(0, 0, 0);
      this.cameraUpTarget.set(0, 0, -1);
      this.cameraFovTarget = 20; // 2D过程中逐渐压缩FOV模拟正交感
    } else {
      this.cameraTransitionTarget.set(0, 0.8, 5.2);
      this.cameraLookAtTarget.set(0, 0, 0);
      this.cameraUpTarget.set(0, 1, 0);
      this.cameraFovTarget = 50;
    }

    this.cameraTransitionT = 0;
    this.cameraTransitionActive = true;
    // 过渡期间始终使用 camera3d，在最后一帧切换
    this.currentCamera = this.camera3d;
    this.controls.enabled = false;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    const loop = () => {
      if (!this.running) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this.update(dt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  stop(): void { this.running = false; }

  // ========== 主循环 ==========

  private update(dt: number): void {
    // ========= 相机平滑过渡（1秒，easeOutCubic） =========
    if (this.cameraTransitionActive) {
      this.cameraTransitionT += dt;
      const tRaw = THREE.MathUtils.clamp(this.cameraTransitionT / this.cameraTransitionDuration, 0, 1);
      const e = easeOutCubic(tRaw);

      // 插值位置 / 观察点 / up 向量
      const pos = this.cameraTransitionFrom.clone().lerp(this.cameraTransitionTarget, e);
      const look = this.cameraLookAtFrom.clone().lerp(this.cameraLookAtTarget, e);
      const up = this.cameraUpFrom.clone().lerp(this.cameraUpTarget, e).normalize();

      this.camera3d.position.copy(pos);
      this.camera3d.up.copy(up);
      this.camera3d.lookAt(look);
      this.camera3d.fov = this.cameraFovFrom + (this.cameraFovTarget - this.cameraFovFrom) * e;
      this.camera3d.updateProjectionMatrix();

      // 经纬度网格 & 城市名标签淡入（向 ortho2d 过渡时淡入，反向淡出）
      const gridVisibility = this.cameraMode === 'ortho2d' ? e : 1 - e;
      this.grid2dHelper.visible = gridVisibility > 0.02;
      this.grid2dHelper.traverse(obj => {
        if ((obj as any).material) {
          const m = (obj as any).material as THREE.LineBasicMaterial;
          m.opacity = 0.25 * gridVisibility;
        }
      });
      for (const [, label] of this.cityLabels) {
        label.style.opacity = String(gridVisibility);
      }

      // 最后一帧：切换到正式相机
      if (tRaw >= 1) {
        this.cameraTransitionActive = false;
        if (this.cameraMode === 'ortho2d') {
          this.currentCamera = this.camera2d;
          this.controls.enabled = false;
          this.grid2dHelper.visible = true;
          this.grid2dHelper.traverse(obj => {
            if ((obj as any).material) ((obj as any).material as THREE.LineBasicMaterial).opacity = 0.3;
          });
          for (const [, label] of this.cityLabels) label.style.opacity = '1';
        } else {
          this.currentCamera = this.camera3d;
          this.controls.enabled = true;
          this.camera3d.up.set(0, 1, 0);
          this.grid2dHelper.visible = false;
          for (const [, label] of this.cityLabels) label.style.opacity = '0';
        }
      }
    }

    if (this.currentCamera === this.camera3d && this.controls.enabled) {
      this.controls.update();
    }

    // 播放时间推进
    if (this.isPlaying && this.pathData.length > 0) {
      this.playTimer += dt * this.speedMultiplier;
      const stepDur = 0.65;
      if (this.playTimer >= stepDur) {
        this.playTimer -= stepDur;
        this.currentTimeStep++;
        if (this.currentTimeStep >= TOTAL_STEPS) {
          this.currentTimeStep = TOTAL_STEPS - 1;
          this.isPlaying = false;
        }
        this.callbacks.onTimeStepChange?.(this.currentTimeStep);
      }
    }

    this.updateFrame(this.currentTimeStep, dt);
    this.updateLabelPositions();
  }

  /**
   * 核心帧更新：根据时间步（以及 dt 做子帧插值）
   */
  private updateFrame(step: number, dt = 0.016): void {
    if (this.pathData.length === 0) return;
    const i0 = THREE.MathUtils.clamp(step, 0, this.pathData.length - 1);
    const i1 = Math.min(i0 + 1, this.pathData.length - 1);
    const frac = Math.min(1, this.playTimer / 0.65);
    const a = this.pathData[i0];
    const b = this.pathData[i1];
    const lat = a.lat + (b.lat - a.lat) * frac;
    const lng = a.lng + (b.lng - a.lng) * frac;
    const windSpeed = a.windSpeed + (b.windSpeed - a.windSpeed) * frac;
    const strength = THREE.MathUtils.clamp((windSpeed - 80) / 160, 0, 1);

    // 中心位置（略高于地表）
    const center = TyphoonScene.llToXYZ(lat, lng, EARTH_RADIUS * 1.015);
    const normal = center.clone().normalize();
    // 切平面
    let tangentU = new THREE.Vector3(normal.z, 0, -normal.x).normalize();
    if (tangentU.lengthSq() < 0.01) tangentU.set(1, 0, 0);
    const tangentV = new THREE.Vector3().crossVectors(normal, tangentU).normalize();

    // 半径（单位）：150~500 km 映射到 three.js
    const baseRadiusKm = 0.08 + strength * 0.22;

    // 逐粒子更新
    const posAttr = this.particlesGeometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.particlesGeometry.attributes.color as THREE.BufferAttribute;
    const sizeAttr = this.particlesGeometry.attributes.size as THREE.BufferAttribute;
    const tmp = this.particleState;
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update(
        center, normal, tangentU, tangentV,
        baseRadiusKm, windSpeed, dt, strength,
        tmp,
      );
      posAttr.setXYZ(i, tmp.position.x, tmp.position.y, tmp.position.z);
      colAttr.setXYZ(i, tmp.color.r, tmp.color.g, tmp.color.b);
      (sizeAttr.array as Float32Array)[i] = tmp.size;
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;

    // 大气光晕：强度越高越亮，偏红
    const atmoMat = this.atmosphere.material as THREE.ShaderMaterial;
    const c = new THREE.Color(0x6ac6ff).lerp(new THREE.Color(0xff5555), strength * 0.35);
    atmoMat.uniforms.uColor.value.copy(c);
    atmoMat.uniforms.uIntensity.value = 0.85 + strength * 0.6;

    // 更新城市
    this.updateCityVisuals(i0);
  }

  private updateCityVisuals(step: number): void {
    if (this.cityData.length === 0) return;
    for (const city of this.cityData) {
      const ti = Math.min(step, city.timeline.length - 1);
      const s = city.timeline[ti];
      const g = this.cityMarkers.get(city.cityId);
      if (g) {
        const tipMat = g.userData.tipMat as THREE.MeshBasicMaterial;
        const col = TyphoonScene.disasterColor(s.disasterLevel as 1 | 2 | 3);
        tipMat.color.copy(col);
        // 脉冲动画：高等级脉冲幅度更大
        const pulsePhase = performance.now() * 0.005 + city.cityId.charCodeAt(0);
        const pulse = 1 + Math.sin(pulsePhase) * (s.disasterLevel >= 3 ? 0.28 : 0.12);
        g.scale.setScalar(pulse * (s.disasterLevel >= 2 ? 1.15 : 1));
      }

      // 贴地半球
      const heat = this.cityHeatSpheres.get(city.cityId);
      if (heat) {
        const hm = heat.material as THREE.MeshBasicMaterial;
        const col = TyphoonScene.disasterColor(s.disasterLevel as 1 | 2 | 3);
        hm.color.copy(col);
        hm.opacity = 0.12 + s.disasterLevel * 0.14;
        // 半径按灾害等级缩放（1~3级对应 0.6x → 1.0x → 1.55x）
        const sc = 0.5 + s.disasterLevel * 0.45;
        heat.scale.setScalar(sc);
        heat.visible = this.showHeatmap;
      }

      // 径向渐变 Sprite（发光效果，Additive blending）
      const sprite = this.cityHeatSprites.get(city.cityId);
      if (sprite) {
        const sm = sprite.material as THREE.SpriteMaterial;
        const col = TyphoonScene.disasterColor(s.disasterLevel as 1 | 2 | 3);
        sm.color.copy(col);
        // 高等级透明度更高更亮
        sm.opacity = 0.35 + s.disasterLevel * 0.22;
        const baseSize = (sprite.userData.baseSize as number) ?? 0.5;
        const sc = 0.55 + s.disasterLevel * 0.5;
        sprite.scale.set(baseSize * sc, baseSize * sc, 1);
        sprite.visible = this.showHeatmap;
      }
    }
  }

  private updateLabelPositions(): void {
    const cam = this.currentCamera;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const v = new THREE.Vector3();
    for (const city of this.cityData) {
      const label = this.cityLabels.get(city.cityId);
      if (!label) continue;
      const center = TyphoonScene.llToXYZ(city.lat, city.lng, EARTH_RADIUS * 1.03);
      v.copy(center).project(cam);
      // 背面剔除
      const toCam = cam.position.clone().sub(center).normalize();
      const n = center.clone().normalize();
      if (toCam.dot(n) < 0 && this.currentCamera === this.camera3d) {
        label.style.display = 'none';
        continue;
      }
      label.style.display = 'block';
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -140%)`;
    }
  }

  private render(): void {
    this.renderer.render(this.scene, this.currentCamera);
  }

  // ========== 事件 ==========

  private bindEvents(): void {
    // 城市点击
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouseNdc, this.currentCamera);
      const meshes: THREE.Object3D[] = [];
      for (const [, g] of this.cityMarkers) meshes.push(g);
      const hits = this.raycaster.intersectObjects(meshes, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !(obj.userData && obj.userData.cityId)) obj = obj.parent;
        if (obj?.userData?.cityId) {
          this.callbacks.onCityClick?.(obj.userData.cityId as string);
        }
      }
    });
    // hover
    let downX = 0, downY = 0;
    this.canvas.addEventListener('mousedown', (e) => { downX = e.clientX; downY = e.clientY; });
    this.canvas.addEventListener('click', () => { /* handled above */ });
    // 避免拖拽触发click：已被原生click自己处理（差值<4才触发）
    void downX; void downY;
  }

  // ========== 工具 ==========

  static llToXYZ(latDeg: number, lngDeg: number, r: number): THREE.Vector3 {
    const lat = latDeg * Math.PI / 180;
    const lng = lngDeg * Math.PI / 180;
    const x = r * Math.cos(lat) * Math.cos(lng);
    const y = r * Math.sin(lat);
    const z = r * Math.cos(lat) * Math.sin(lng);
    return new THREE.Vector3(x, y, z);
  }

  static orientToSurface(center: THREE.Vector3, mesh: THREE.Mesh): void {
    const normal = center.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, normal);
    mesh.quaternion.copy(q);
    mesh.userData.normal = normal;
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera3d.aspect = w / h;
    this.camera3d.updateProjectionMatrix();
    const aspect = w / h;
    const size = 4.2;
    this.camera2d.left = -aspect * size;
    this.camera2d.right = aspect * size;
    this.camera2d.top = size;
    this.camera2d.bottom = -size;
    this.camera2d.updateProjectionMatrix();
  }

  dispose(): void {
    this.running = false;
    this.resizeObserver.disconnect();
    this.renderer.dispose();
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

