import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { SensorSnapshot, SensorType, SensorConfigs } from './DataFusion';

const SENSOR_POSITIONS: Record<SensorType, THREE.Vector3> = {
  temperature: new THREE.Vector3(-4, 0, 0),
  vibration: new THREE.Vector3(0, 0, 0),
  noise: new THREE.Vector3(4, 0, 0)
};

const SENSOR_COLORS: Record<SensorType, { main: string; light: string; dark: string }> = {
  temperature: { main: '#E53935', light: '#FF8A65', dark: '#C62828' },
  vibration: { main: '#1E88E5', light: '#64B5F6', dark: '#1565C0' },
  noise: { main: '#43A047', light: '#81C784', dark: '#2E7D32' }
};

const SENSOR_NAMES: Record<SensorType, string> = {
  temperature: '温度传感器',
  vibration: '振动传感器',
  noise: '噪声传感器'
};

interface SensorVisual {
  type: SensorType;
  group: THREE.Group;
  marker: THREE.Mesh;
  bars: THREE.Mesh[];
  barBase: THREE.Mesh;
  particles: THREE.Points;
  label: CSS2DObject;
  warningRing: THREE.Mesh;
  warningOpacity: number;
  warningActive: boolean;
  infoPanel: CSS2DObject | null;
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private canvas: HTMLCanvasElement;
  private container: HTMLElement;
  private sensorConfigs: SensorConfigs | null = null;

  private currentSnapshot: SensorSnapshot | null = null;
  private sensorVisuals: Map<SensorType, SensorVisual> = new Map();

  private animationFrameId: number = 0;
  private clock: THREE.Clock;
  private particleTimer: number = 0;
  private particlePool: Map<SensorType, THREE.Points> = new Map();

  private isAnimatingCamera = false;
  private cameraStartPos = new THREE.Vector3();
  private cameraTargetPos = new THREE.Vector3();
  private cameraLookTarget = new THREE.Vector3();
  private cameraAnimStart = 0;
  private cameraAnimDuration = 0.8;

  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private spherical = { theta: 0, phi: Math.PI / 3, radius: 15 };
  private targetLookAt = new THREE.Vector3(0, 0, 0);

  private alertContainer: HTMLElement;
  private activeAlerts: Map<SensorType, HTMLElement> = new Map();

  private onSensorClick: ((type: SensorType) => void) | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
    this.container = container;
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.alertContainer = document.getElementById('alert-container')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#161B22');

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 12);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(container.clientWidth, container.clientHeight);
    (this.labelRenderer.domElement as HTMLElement).style.position = 'absolute';
    (this.labelRenderer.domElement as HTMLElement).style.top = '0';
    (this.labelRenderer.domElement as HTMLElement).style.left = '0';
    (this.labelRenderer.domElement as HTMLElement).style.pointerEvents = 'none';
    container.appendChild(this.labelRenderer.domElement);

    this.setupLighting();
    this.setupFactoryFloor();
    this.setupSensors();
    this.setupInteraction();
    this.handleResize();

    window.addEventListener('resize', () => this.handleResize());
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x6C63FF, 0.5, 30);
    pointLight1.position.set(-5, 5, 5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x58A6FF, 0.5, 30);
    pointLight2.position.set(5, 5, -5);
    this.scene.add(pointLight2);
  }

  private setupFactoryFloor(): void {
    const floorGeometry = new THREE.PlaneGeometry(20, 15);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x21262D,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const gridHelper = new THREE.GridHelper(20, 20, 0x30363D, 0x21262D);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);

    this.createFactoryWalls();
    this.createEquipment();
  }

  private createFactoryWalls(): void {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x161B22,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.6
    });

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(20, 8, 0.2),
      wallMaterial
    );
    backWall.position.set(0, 4, -7.5);
    this.scene.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 8, 15),
      wallMaterial
    );
    leftWall.position.set(-10, 4, 0);
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 8, 15),
      wallMaterial
    );
    rightWall.position.set(10, 4, 0);
    this.scene.add(rightWall);
  }

  private createEquipment(): void {
    const equipmentMaterial = new THREE.MeshStandardMaterial({
      color: 0x30363D,
      roughness: 0.7,
      metalness: 0.3
    });

    const machine1 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      equipmentMaterial
    );
    machine1.position.set(-6, 0.75, 3);
    machine1.castShadow = true;
    machine1.receiveShadow = true;
    this.scene.add(machine1);

    const machine2 = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 2, 3),
      equipmentMaterial
    );
    machine2.position.set(6, 1, 3);
    machine2.castShadow = true;
    machine2.receiveShadow = true;
    this.scene.add(machine2);

    const machine3 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.2, 2),
      equipmentMaterial
    );
    machine3.position.set(0, 0.6, -4);
    machine3.castShadow = true;
    machine3.receiveShadow = true;
    this.scene.add(machine3);

    this.addAccentLights();
  }

  private addAccentLights(): void {
    const accentColors = [0x6C63FF, 0x58A6FF, 0x6C63FF];
    const positions = [
      new THREE.Vector3(-6, 1.6, 3),
      new THREE.Vector3(6, 2.1, 3),
      new THREE.Vector3(0, 1.3, -4)
    ];

    positions.forEach((pos, i) => {
      const light = new THREE.PointLight(accentColors[i], 0.3, 3);
      light.position.copy(pos);
      this.scene.add(light);
    });
  }

  private setupSensors(): void {
    (['temperature', 'vibration', 'noise'] as SensorType[]).forEach(type => {
      this.createSensorVisual(type);
    });
  }

  private createSensorVisual(type: SensorType): void {
    const group = new THREE.Group();
    const position = SENSOR_POSITIONS[type];
    const colors = SENSOR_COLORS[type];
    group.position.copy(position);

    const markerGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.6, 16);
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: colors.main,
      emissive: colors.main,
      emissiveIntensity: 0.3,
      roughness: 0.5,
      metalness: 0.5
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.y = 0.3;
    marker.castShadow = true;
    marker.userData = { sensorType: type, clickable: true };
    group.add(marker);

    const baseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.9
    });
    const barBase = new THREE.Mesh(baseGeometry, baseMaterial);
    barBase.position.y = 0.025;
    group.add(barBase);

    const bars: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const barGeometry = new THREE.BoxGeometry(0.12, 0.5, 0.12);
      const barMaterial = new THREE.MeshStandardMaterial({
        color: colors.main,
        emissive: colors.light,
        emissiveIntensity: 0.2,
        roughness: 0.4,
        metalness: 0.4,
        transparent: true,
        opacity: 0.9
      });
      const bar = new THREE.Mesh(barGeometry, barMaterial);
      const xOffset = (i - 2) * 0.18;
      bar.position.set(xOffset, 0.75, 0);
      bar.castShadow = true;
      bars.push(bar);
      group.add(bar);
    }

    const particleCount = 10;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (i - 2) * 0.18;
      particlePositions[i * 3 + 1] = 1;
      particlePositions[i * 3 + 2] = 0;
      particleSizes[i] = 0.05;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      color: colors.light,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);
    this.particlePool.set(type, particles);

    const ringGeometry = new THREE.RingGeometry(0.5, 0.52, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF0000,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const warningRing = new THREE.Mesh(ringGeometry, ringMaterial);
    warningRing.rotation.x = -Math.PI / 2;
    warningRing.position.y = 0.1;
    warningRing.visible = false;
    group.add(warningRing);

    const labelDiv = document.createElement('div');
    labelDiv.style.cssText = `
      background: rgba(0, 0, 0, 0.5);
      color: white;
      font-size: 14px;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: Consolas, monospace;
      white-space: nowrap;
    `;
    labelDiv.textContent = `${SENSOR_NAMES[type]}: --`;
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, 1.8, 0);
    group.add(label);

    this.scene.add(group);

    this.sensorVisuals.set(type, {
      type,
      group,
      marker,
      bars,
      barBase,
      particles,
      label,
      warningRing,
      warningOpacity: 0,
      warningActive: false,
      infoPanel: null
    });
  }

  private setupInteraction(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
    
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging || this.isAnimatingCamera) return;

    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;

    this.spherical.theta -= deltaX * 0.005;
    this.spherical.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.1, this.spherical.phi - deltaY * 0.005));

    this.updateCameraPosition();
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onCanvasClick(e: MouseEvent): void {
    if (this.isDragging) return;

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const clickables: THREE.Object3D[] = [];
    this.sensorVisuals.forEach(visual => {
      clickables.push(visual.marker);
    });

    const intersects = this.raycaster.intersectObjects(clickables, false);

    if (intersects.length > 0) {
      const clicked = intersects[0].object;
      const sensorType = clicked.userData.sensorType as SensorType;
      if (sensorType && this.onSensorClick) {
        this.onSensorClick(sensorType);
      }
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.spherical.radius = Math.max(5, Math.min(30, this.spherical.radius + e.deltaY * 0.02));
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const x = this.targetLookAt.x + this.spherical.radius * Math.sin(this.spherical.phi) * Math.sin(this.spherical.theta);
    const y = this.targetLookAt.y + this.spherical.radius * Math.cos(this.spherical.phi);
    const z = this.targetLookAt.z + this.spherical.radius * Math.sin(this.spherical.phi) * Math.cos(this.spherical.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.targetLookAt);
  }

  public setOnSensorClick(callback: (type: SensorType) => void): void {
    this.onSensorClick = callback;
  }

  public setSensorConfigs(configs: SensorConfigs): void {
    this.sensorConfigs = configs;
  }

  public updateSnapshot(snapshot: SensorSnapshot): void {
    this.currentSnapshot = snapshot;
    this.updateSensorVisuals(snapshot);
  }

  private updateSensorVisuals(snapshot: SensorSnapshot): void {
    (['temperature', 'vibration', 'noise'] as SensorType[]).forEach(type => {
      const data = snapshot[type];
      const visual = this.sensorVisuals.get(type);
      const config = this.sensorConfigs?.[type];
      if (!visual || !config) return;

      const unit = config.unit;
      (visual.label.element as HTMLElement).textContent = `${SENSOR_NAMES[type]}: ${data.value.toFixed(1)}${unit}`;

      const colors = SENSOR_COLORS[type];
      const maxValue = config.max;
      visual.bars.forEach((bar, index) => {
        const scale = 0.5 + (data.value / maxValue) * 2 + Math.sin(Date.now() * 0.003 + index) * 0.1;
        bar.scale.y = scale;
        bar.position.y = 0.6 + scale * 0.5;
        
        const material = bar.material as THREE.MeshStandardMaterial;
        const colorMix = data.value / maxValue;
        material.color.lerpColors(
          new THREE.Color(colors.light),
          new THREE.Color(colors.main),
          colorMix
        );
        material.emissiveIntensity = 0.2 + colorMix * 0.3;
      });

      if (config && data.value > config.threshold) {
        this.triggerWarning(type, data.value);
      }
    });
  }

  private triggerWarning(type: SensorType, value: number): void {
    const visual = this.sensorVisuals.get(type);
    if (!visual) return;

    if (!visual.warningActive) {
      visual.warningActive = true;
      visual.warningOpacity = 0.8;
      visual.warningRing.visible = true;
      (visual.warningRing.material as THREE.MeshBasicMaterial).opacity = 0.8;
      this.showAlertCard(type, value);
    } else {
      visual.warningOpacity = Math.max(visual.warningOpacity, 0.6);
    }
  }

  private showAlertCard(type: SensorType, value: number): void {
    if (this.activeAlerts.size >= 3) {
      const oldestKey = this.activeAlerts.keys().next().value;
      if (oldestKey) {
        this.removeAlertCard(oldestKey);
      }
    }

    if (this.activeAlerts.has(type)) {
      const existing = this.activeAlerts.get(type)!;
      existing.querySelector('.alert-value')!.textContent = 
        `当前值: ${value.toFixed(1)}${this.sensorConfigs?.[type]?.unit || ''}`;
      return;
    }

    const card = document.createElement('div');
    card.className = 'alert-card';
    card.innerHTML = `
      <div class="alert-title">⚠ ${SENSOR_NAMES[type]} 异常</div>
      <div class="alert-value">当前值: ${value.toFixed(1)}${this.sensorConfigs?.[type]?.unit || ''}</div>
    `;
    this.alertContainer.appendChild(card);
    this.activeAlerts.set(type, card);

    setTimeout(() => {
      this.removeAlertCard(type);
    }, 5000);
  }

  private removeAlertCard(type: SensorType): void {
    const card = this.activeAlerts.get(type);
    if (card) {
      card.style.transition = 'opacity 0.3s ease';
      card.style.opacity = '0';
      setTimeout(() => {
        if (card.parentNode) {
          card.parentNode.removeChild(card);
        }
        this.activeAlerts.delete(type);
      }, 300);
    }
  }

  public flyToSensor(type: SensorType): void {
    const visual = this.sensorVisuals.get(type);
    if (!visual) return;

    const targetPos = SENSOR_POSITIONS[type].clone();
    this.cameraStartPos.copy(this.camera.position);
    this.cameraTargetPos.set(targetPos.x + 3, targetPos.y + 3, targetPos.z + 5);
    this.cameraLookTarget.copy(targetPos);
    this.cameraAnimStart = performance.now();
    this.isAnimatingCamera = true;
  }

  public showInfoPanel(type: SensorType, snapshot: SensorSnapshot, history: SensorSnapshot[]): void {
    const visual = this.sensorVisuals.get(type);
    const config = this.sensorConfigs?.[type];
    if (!visual || !config) return;

    this.closeInfoPanel();

    const panelDiv = document.createElement('div');
    panelDiv.style.cssText = `
      position: absolute;
      width: 200px;
      height: 100px;
      background: rgba(30, 30, 46, 0.9);
      border: 1px solid #6C63FF;
      border-radius: 8px;
      padding: 12px;
      pointer-events: auto;
      font-family: 'Segoe UI', sans-serif;
    `;

    const sensorData = snapshot[type];
    const historyValues = history.map(s => s[type].value);
    const maxVal = Math.max(...historyValues);
    const minVal = Math.min(...historyValues);

    panelDiv.innerHTML = `
      <div style="color: #6C63FF; font-size: 13px; font-weight: 600; margin-bottom: 8px;">${SENSOR_NAMES[type]}</div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #C9D1D9;">
        <span>ID:</span><span style="color: #58A6FF;">${config.id}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #C9D1D9;">
        <span>单位:</span><span style="color: #58A6FF;">${config.unit}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #C9D1D9;">
        <span>当前值:</span><span style="color: #58A6FF; font-weight: 500;">${sensorData.value.toFixed(1)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #C9D1D9;">
        <span>历史最大:</span><span style="color: #E53935;">${maxVal.toFixed(1)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #C9D1D9;">
        <span>历史最小:</span><span style="color: #43A047;">${minVal.toFixed(1)}</span>
      </div>
    `;

    const infoPanel = new CSS2DObject(panelDiv);
    infoPanel.position.set(0, 2.5, 0);
    visual.group.add(infoPanel);
    visual.infoPanel = infoPanel;
  }

  public closeInfoPanel(): void {
    this.sensorVisuals.forEach(visual => {
      if (visual.infoPanel) {
        visual.group.remove(visual.infoPanel);
        visual.infoPanel = null;
      }
    });
  }

  private updateCameraAnimation(): void {
    if (!this.isAnimatingCamera) return;

    const elapsed = (performance.now() - this.cameraAnimStart) / 1000;
    const t = Math.min(elapsed / this.cameraAnimDuration, 1);
    const eased = 1 - Math.pow(1 - t, 3);

    this.camera.position.lerpVectors(this.cameraStartPos, this.cameraTargetPos, eased);
    this.camera.lookAt(this.cameraLookTarget);

    const dir = new THREE.Vector3().subVectors(this.camera.position, this.cameraLookTarget);
    this.spherical.radius = dir.length();
    this.spherical.theta = Math.atan2(dir.x, dir.z);
    this.spherical.phi = Math.acos(dir.y / this.spherical.radius);
    this.targetLookAt.copy(this.cameraLookTarget);

    if (t >= 1) {
      this.isAnimatingCamera = false;
    }
  }

  private updateWarnings(delta: number): void {
    this.sensorVisuals.forEach(visual => {
      if (visual.warningActive) {
        visual.warningOpacity -= delta * 0.8;
        const ringMat = visual.warningRing.material as THREE.MeshBasicMaterial;
        ringMat.opacity = Math.max(0, visual.warningOpacity);

        const scale = 1 + (1 - visual.warningOpacity / 0.8) * 1.5;
        visual.warningRing.scale.setScalar(scale);

        if (visual.warningOpacity <= 0) {
          visual.warningActive = false;
          visual.warningRing.visible = false;
          visual.warningRing.scale.setScalar(1);
        }
      }
    });
  }

  private updateParticles(delta: number): void {
    this.particleTimer += delta;
    if (this.particleTimer >= 0.5) {
      this.particleTimer = 0;
      
      this.sensorVisuals.forEach(visual => {
        const positions = visual.particles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < 5; i++) {
          const barIndex = i;
          const bar = visual.bars[barIndex];
          if (bar) {
            positions[i * 3] = (i - 2) * 0.18;
            positions[i * 3 + 1] = bar.position.y + bar.scale.y * 0.5 + 0.1;
            positions[i * 3 + 2] = 0;
          }
        }
        visual.particles.geometry.attributes.position.needsUpdate = true;
      });
    }
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    this.updateCameraAnimation();
    this.updateWarnings(delta);
    this.updateParticles(delta);

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };

  public start(): void {
    this.animate();
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.labelRenderer.setSize(width, height);
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', () => this.handleResize());
    this.renderer.dispose();
  }
}
