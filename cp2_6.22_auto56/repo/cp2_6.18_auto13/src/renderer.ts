// ============================================================================
// renderer.ts - 三维渲染模块
// 职责：初始化Three.js场景、透视相机、WebGL渲染器，接收Mesh数据创建热力图柱状体群，
//       管理OrbitControls相机控件，响应UI控制面板的视角切换和过滤指令，
//       管理CSS2DRenderer标签、时间轴动画、tooltip提示
// 调用关系：
//   - on('dataReady', ...)         ←  dataHandler.ts 发送的初始数据
//   - on('hourlyDataReady', ...)   ←  dataHandler.ts 发送的24小时数据
//   - on('filterChange', ...)      ←  uiControl.ts   发送的温度范围过滤
//   - on('viewChange', ...)        ←  uiControl.ts   发送的视角切换
//   - on('timelinePlay', ...)      ←  uiControl.ts   发送的播放控制
//   - on('timelineHour', ...)      ←  uiControl.ts   发送的时间点跳转
//   - emit('statsUpdate', ...)     →  uiControl.ts   更新统计信息
// 数据流向：
//   Mesh数组 → 创建柱状体 → 渲染到场景 → 接收UI指令 → gsap动画更新相机/柱状体
// ============================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { gsap } from 'gsap';
import { eventBus } from './eventBus';
import type { MeshData } from './dataHandler';

interface BarObject {
  id: string;
  mesh: THREE.Mesh;
  topMesh: THREE.Mesh;
  label: CSS2DObject;
  temperature: number;
  baseHeight: number;
  basePosition: THREE.Vector3;
  baseColor: THREE.Color;
  isFiltered: boolean;
}

interface HourlyMeshDataset {
  hour: number;
  meshData: MeshData[];
}

export class Renderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private canvas: HTMLCanvasElement;
  private labelContainer: HTMLElement;
  private tooltip: HTMLElement;

  private bars: Map<string, BarObject> = new Map();
  private barsGroup: THREE.Group;
  private hourlyData: HourlyMeshDataset[] = [];

  private filterMin: number = 15;
  private filterMax: number = 45;
  private currentHour: number = 0;
  private isPlaying: boolean = false;
  private playInterval: number | null = null;
  private animationFrameId: number | null = null;

  private barWidth: number = 0.8;

  private defaultCameraPos: THREE.Vector3 = new THREE.Vector3(12, 10, 12);
  private defaultTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(canvasId: string, labelContainerId: string, tooltipId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.labelContainer = document.getElementById(labelContainerId) as HTMLElement;
    this.tooltip = document.getElementById(tooltipId) as HTMLElement;

    if (!this.canvas || !this.labelContainer || !this.tooltip) {
      throw new Error('Required DOM elements not found');
    }

    // 初始化Three.js核心对象
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0A0A1A');
    this.scene.fog = new THREE.Fog('#0A0A1A', 20, 40);

    // 透视相机：视野60，近裁面0.1，远裁面1000
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.defaultTarget);

    // WebGL渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // CSS2D渲染器 - 用于柱状体顶部数值标签
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.labelContainer.appendChild(this.labelRenderer.domElement);

    // OrbitControls：旋转速度0.5，缩放范围0.5-20
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 20;
    this.controls.target.copy(this.defaultTarget);

    // 射线检测 - 用于鼠标交互
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 柱状体组
    this.barsGroup = new THREE.Group();
    this.scene.add(this.barsGroup);

    // 初始化场景
    this.setupLighting();
    this.setupGround();
    this.setupEventListeners();

    // 注册事件总线监听
    this.registerEventBusListeners();

    // 开始渲染循环
    this.animate();
  }

  // 设置光照
  private setupLighting(): void {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // 主方向光 - 产生阴影
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.bias = -0.0001;
    this.scene.add(directionalLight);

    // 辅助点光源 - 增强科技感
    const pointLight1 = new THREE.PointLight(0x0066ff, 0.3, 30);
    pointLight1.position.set(-8, 6, -8);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff3300, 0.2, 25);
    pointLight2.position.set(8, 4, 8);
    this.scene.add(pointLight2);
  }

  // 设置地面和网格
  private setupGround(): void {
    // 地面平面
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f0f1f,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 网格辅助线：网格大小1单位，线颜色rgba(100,100,200,0.15)
    const gridHelper = new THREE.GridHelper(
      30,
      30,
      new THREE.Color('rgba(100, 100, 200, 0.15)'),
      new THREE.Color('rgba(100, 100, 200, 0.1)')
    );
    gridHelper.position.y = 0.001;
    this.scene.add(gridHelper);
  }

  // 设置事件监听
  private setupEventListeners(): void {
    // 窗口大小调整
    window.addEventListener('resize', () => this.onWindowResize());

    // 鼠标移动 - tooltip
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // 鼠标离开 - 隐藏tooltip
    this.canvas.addEventListener('mouseleave', () => this.hideTooltip());

    // 双击 - 相机聚焦到柱状体
    this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
  }

  // 注册事件总线监听
  private registerEventBusListeners(): void {
    // 接收初始数据
    eventBus.on('dataReady', (meshData: MeshData[], config: any) => {
      this.barWidth = config.barWidth;
      this.createBars(meshData);
    });

    // 接收24小时数据
    eventBus.on(
      'hourlyDataReady',
      (hourlyData: HourlyMeshDataset[]) => {
        this.hourlyData = hourlyData;
      }
    );

    // 温度范围过滤
    eventBus.on('filterChange', (range: { min: number; max: number }) => {
      this.applyFilter(range.min, range.max);
    });

    // 视角切换
    eventBus.on('viewChange', (view: string) => {
      this.changeView(view);
    });

    // 时间轴播放控制
    eventBus.on('timelinePlay', (play: boolean) => {
      if (play) {
        this.startTimelineAnimation();
      } else {
        this.stopTimelineAnimation();
      }
    });

    // 时间轴跳转到指定小时
    eventBus.on('timelineHour', (hour: number) => {
      this.jumpToHour(hour);
    });
  }

  // 创建柱状体群
  private createBars(meshDataArray: MeshData[]): void {
    // 清除现有柱状体
    this.bars.forEach((bar) => {
      this.barsGroup.remove(bar.mesh);
      this.barsGroup.remove(bar.topMesh);
      this.scene.remove(bar.label);
      bar.mesh.geometry.dispose();
      (bar.mesh.material as THREE.Material).dispose();
      bar.topMesh.geometry.dispose();
      (bar.topMesh.material as THREE.Material).dispose();
    });
    this.bars.clear();

    meshDataArray.forEach((data) => {
      const bar = this.createSingleBar(data);
      this.bars.set(data.id, bar);
      this.barsGroup.add(bar.mesh);
      this.barsGroup.add(bar.topMesh);
      this.scene.add(bar.label);
    });

    this.updateStats();
  }

  // 创建单个柱状体
  private createSingleBar(data: MeshData): BarObject {
    const { barWidth } = this;
    const height = data.height;

    // 侧面几何体 - 半透明渐变
    const sideGeometry = new THREE.BoxGeometry(barWidth, height, barWidth);
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: data.topColor,
      transparent: true,
      opacity: data.sideOpacity,
      roughness: 0.6,
      metalness: 0.2,
      emissive: data.topColor,
      emissiveIntensity: 0.1,
    });
    const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial);
    sideMesh.position.copy(data.position);
    sideMesh.castShadow = true;
    sideMesh.receiveShadow = true;
    sideMesh.userData.barId = data.id;

    // 顶面几何体 - 不透明
    const topGeometry = new THREE.BoxGeometry(
      barWidth * 0.98,
      0.02,
      barWidth * 0.98
    );
    const topMaterial = new THREE.MeshStandardMaterial({
      color: data.topColor,
      roughness: 0.3,
      metalness: 0.5,
      emissive: data.topColor,
      emissiveIntensity: 0.2,
    });
    const topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.position.set(
      data.position.x,
      data.position.y + height / 2 + 0.01,
      data.position.z
    );
    topMesh.userData.barId = data.id;

    // 顶部数值标签 - CSS2DObject
    const labelDiv = document.createElement('div');
    labelDiv.className = 'bar-label';
    labelDiv.textContent = `${data.temperature.toFixed(1)}°C`;
    labelDiv.style.cssText = `
      color: #ffffff;
      font-size: 10px;
      font-weight: 600;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      padding: 2px 6px;
      background: rgba(0,0,0,0.5);
      border-radius: 4px;
      pointer-events: none;
      white-space: nowrap;
      transition: opacity 0.3s ease;
    `;
    const label = new CSS2DObject(labelDiv);
    label.position.set(
      data.position.x,
      data.position.y + height / 2 + 0.5,
      data.position.z
    );

    return {
      id: data.id,
      mesh: sideMesh,
      topMesh,
      label,
      temperature: data.temperature,
      baseHeight: height,
      basePosition: data.position.clone(),
      baseColor: data.topColor.clone(),
      isFiltered: false,
    };
  }

  // 应用温度范围过滤 - 使用gsap动画平滑过渡
  private applyFilter(min: number, max: number): void {
    this.filterMin = min;
    this.filterMax = max;

    this.bars.forEach((bar) => {
      const shouldFilter =
        bar.temperature < min || bar.temperature > max;

      if (shouldFilter !== bar.isFiltered) {
        bar.isFiltered = shouldFilter;

        if (shouldFilter) {
          // 过滤：透明度渐变至0.1，高度降低至0.3，隐藏标签
          const targetHeight = 0.3;
          const targetY = targetHeight / 2;

          // gsap动画：侧面材质透明度
          gsap.to((bar.mesh.material as THREE.MeshStandardMaterial), {
            opacity: 0.1,
            duration: 0.3,
            ease: 'power1.inOut',
          });

          // gsap动画：柱状体高度和位置
          gsap.to(bar.mesh.scale, {
            y: targetHeight / bar.baseHeight,
            duration: 0.3,
            ease: 'power1.inOut',
          });

          gsap.to(bar.mesh.position, {
            y: targetY,
            duration: 0.3,
            ease: 'power1.inOut',
          });

          // 顶面位置
          gsap.to(bar.topMesh.position, {
            y: targetY + targetHeight / 2 + 0.01,
            duration: 0.3,
            ease: 'power1.inOut',
          });

          // 标签位置和透明度
          gsap.to(bar.label.position, {
            y: targetY + targetHeight / 2 + 0.5,
            duration: 0.3,
            ease: 'power1.inOut',
          });

          gsap.to((bar.label.element as HTMLElement).style, {
            opacity: 0,
            duration: 0.3,
            ease: 'power1.inOut',
            onComplete: () => {
              bar.label.visible = false;
            },
          });
        } else {
          // 恢复：显示标签，恢复高度和透明度
          bar.label.visible = true;

          gsap.to((bar.mesh.material as THREE.MeshStandardMaterial), {
            opacity: 0.6,
            duration: 0.3,
            ease: 'power1.inOut',
          });

          gsap.to(bar.mesh.scale, {
            y: 1,
            duration: 0.3,
            ease: 'power1.inOut',
          });

          gsap.to(bar.mesh.position, {
            y: bar.basePosition.y,
            duration: 0.3,
            ease: 'power1.inOut',
          });

          gsap.to(bar.topMesh.position, {
            y: bar.basePosition.y + bar.baseHeight / 2 + 0.01,
            duration: 0.3,
            ease: 'power1.inOut',
          });

          gsap.to(bar.label.position, {
            y: bar.basePosition.y + bar.baseHeight / 2 + 0.5,
            duration: 0.3,
            ease: 'power1.inOut',
          });

          gsap.to((bar.label.element as HTMLElement).style, {
            opacity: 1,
            duration: 0.3,
            ease: 'power1.inOut',
          });
        }
      }
    });

    this.updateStats();
  }

  // 切换视角 - 使用gsap动画
  private changeView(view: string): void {
    let targetPos: THREE.Vector3;
    let targetLook: THREE.Vector3;

    switch (view) {
      case 'top':
        targetPos = new THREE.Vector3(0, 18, 0.01);
        targetLook = new THREE.Vector3(0, 0, 0);
        break;
      case 'side':
        targetPos = new THREE.Vector3(15, 3, 0);
        targetLook = new THREE.Vector3(0, 0, 0);
        break;
      case 'default':
      default:
        targetPos = this.defaultCameraPos.clone();
        targetLook = this.defaultTarget.clone();
        break;
    }

    // 使用gsap的to方法实现0.8秒过渡，ease功率1.5
    gsap.to(this.camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.8,
      ease: 'power1.5.inOut',
    });

    gsap.to(this.controls.target, {
      x: targetLook.x,
      y: targetLook.y,
      z: targetLook.z,
      duration: 0.8,
      ease: 'power1.5.inOut',
    });
  }

  // 鼠标移动 - tooltip
  private onMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = Array.from(this.bars.values()).flatMap((bar) => [
      bar.mesh,
      bar.topMesh,
    ]);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const intersected = intersects[0].object;
      const barId = intersected.userData.barId;
      const bar = this.bars.get(barId);

      if (bar && !bar.isFiltered) {
        this.showTooltip(event.clientX, event.clientY, bar.temperature);
      } else {
        this.hideTooltip();
      }
    } else {
      this.hideTooltip();
    }
  }

  // 显示tooltip
  private showTooltip(x: number, y: number, temperature: number): void {
    this.tooltip.textContent = `温度：${temperature.toFixed(1)}°C`;
    this.tooltip.style.left = `${x + 15}px`;
    this.tooltip.style.top = `${y + 15}px`;
    this.tooltip.classList.add('visible');
  }

  // 隐藏tooltip
  private hideTooltip(): void {
    this.tooltip.classList.remove('visible');
  }

  // 双击 - 相机聚焦到柱状体
  private onDoubleClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = Array.from(this.bars.values()).flatMap((bar) => [
      bar.mesh,
      bar.topMesh,
    ]);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const intersected = intersects[0].object;
      const barId = intersected.userData.barId;
      const bar = this.bars.get(barId);

      if (bar) {
        this.focusOnBar(bar);
      }
    }
  }

  // 聚焦到柱状体 - gsap动画 0.8s，ease功率1.5
  private focusOnBar(bar: BarObject): void {
    const barPos = bar.basePosition;
    const barHeight = bar.baseHeight;

    // 相机移动到柱状体正上方
    const targetPos = new THREE.Vector3(
      barPos.x,
      barPos.y + barHeight + 8,
      barPos.z + 0.01
    );
    const targetLook = new THREE.Vector3(barPos.x, barPos.y + barHeight / 2, barPos.z);

    // 使用gsap.to方法实现平滑动画
    gsap.to(this.camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.8,
      ease: 'power1.5.inOut',
    });

    gsap.to(this.controls.target, {
      x: targetLook.x,
      y: targetLook.y,
      z: targetLook.z,
      duration: 0.8,
      ease: 'power1.5.inOut',
    });
  }

  // 开始时间轴动画 - 每0.5秒模拟一小时
  private startTimelineAnimation(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;

    // 每0.5秒模拟一小时
    this.playInterval = window.setInterval(() => {
      this.currentHour = (this.currentHour + 1) % 24;
      this.updateHourlyData(this.currentHour);

      // 通知UI更新进度
      eventBus.emit('timelineProgress', this.currentHour / 23);
    }, 500);
  }

  // 停止时间轴动画
  private stopTimelineAnimation(): void {
    this.isPlaying = false;
    if (this.playInterval !== null) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
  }

  // 跳转到指定小时
  private jumpToHour(hour: number): void {
    this.currentHour = Math.max(0, Math.min(23, Math.floor(hour)));
    this.updateHourlyData(this.currentHour);
  }

  // 更新小时数据 - gsap动画过渡 0.2s
  private updateHourlyData(hour: number): void {
    const hourData = this.hourlyData.find((d) => d.hour === hour);
    if (!hourData) return;

    hourData.meshData.forEach((data) => {
      const bar = this.bars.get(data.id);
      if (bar) {
        // 更新温度
        bar.temperature = data.temperature;
        bar.baseHeight = data.height;
        bar.baseColor = data.topColor.clone();
        bar.basePosition.y = data.height / 2;

        // 如果没有被过滤，更新显示
        if (!bar.isFiltered) {
          // gsap动画：高度 - 每帧过渡0.2s
          gsap.to(bar.mesh.scale, {
            y: 1,
            duration: 0.2,
            ease: 'power1.inOut',
          });

          gsap.to(bar.mesh.position, {
            y: data.height / 2,
            duration: 0.2,
            ease: 'power1.inOut',
          });

          gsap.to(bar.topMesh.position, {
            y: data.height / 2 + data.height / 2 + 0.01,
            duration: 0.2,
            ease: 'power1.inOut',
          });

          gsap.to(bar.label.position, {
            y: data.height / 2 + data.height / 2 + 0.5,
            duration: 0.2,
            ease: 'power1.inOut',
          });

          // 更新标签文本
          (bar.label.element as HTMLElement).textContent =
            `${data.temperature.toFixed(1)}°C`;
        } else {
          // 被过滤的也要更新标签文本（虽然不可见）
          (bar.label.element as HTMLElement).textContent =
            `${data.temperature.toFixed(1)}°C`;
        }

        // gsap动画：颜色渐变 - 每帧过渡0.2s
        const sideMat = bar.mesh.material as THREE.MeshStandardMaterial;
        const topMat = bar.topMesh.material as THREE.MeshStandardMaterial;

        gsap.to(sideMat.color, {
          r: data.topColor.r,
          g: data.topColor.g,
          b: data.topColor.b,
          duration: 0.2,
          ease: 'power1.inOut',
        });

        gsap.to(sideMat.emissive, {
          r: data.topColor.r * 0.1,
          g: data.topColor.g * 0.1,
          b: data.topColor.b * 0.1,
          duration: 0.2,
          ease: 'power1.inOut',
        });

        gsap.to(topMat.color, {
          r: data.topColor.r,
          g: data.topColor.g,
          b: data.topColor.b,
          duration: 0.2,
          ease: 'power1.inOut',
        });

        gsap.to(topMat.emissive, {
          r: data.topColor.r * 0.2,
          g: data.topColor.g * 0.2,
          b: data.topColor.b * 0.2,
          duration: 0.2,
          ease: 'power1.inOut',
        });
      }
    });

    // 通知UI更新时间显示
    eventBus.emit('currentTimeUpdate', hour);

    // 重新应用过滤（因为温度变化了）
    this.applyFilter(this.filterMin, this.filterMax);
  }

  // 更新统计信息
  private updateStats(): void {
    const visibleBars = Array.from(this.bars.values()).filter(
      (b) => !b.isFiltered
    );
    const temps = visibleBars.map((b) => b.temperature);

    if (temps.length > 0) {
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      const maxTemp = Math.max(...temps);
      const minTemp = Math.min(...temps);

      eventBus.emit('statsUpdate', {
        avgTemp: Math.round(avgTemp * 10) / 10,
        maxTemp: Math.round(maxTemp * 10) / 10,
        minTemp: Math.round(minTemp * 10) / 10,
        activeBars: visibleBars.length,
        totalBars: this.bars.size,
      });
    }
  }

  // 窗口大小调整
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  // 渲染循环
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };

  // 销毁
  public dispose(): void {
    this.stopTimelineAnimation();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', () => this.onWindowResize());
    eventBus.clear();
    this.renderer.dispose();
  }
}
