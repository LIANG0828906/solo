import * as THREE from 'three';
import { Pane } from 'tweakpane';
import { ArrayBuilder } from './ArrayBuilder';
import { RuneManager } from './RuneManager';
import { ArrayType, ElementType, CameraState } from './types';

class RuneArrayApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private arrayBuilder: ArrayBuilder;
  private runeManager: RuneManager;
  private clock: THREE.Clock;
  private currentArrayType: ArrayType = 'hexagram';
  
  private cameraState: CameraState = {
    target: new THREE.Vector3(0, 0, 0),
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    distance: 8,
    targetTheta: Math.PI / 4,
    targetPhi: Math.PI / 3,
    targetDistance: 8,
    targetLookAt: new THREE.Vector3(0, 0, 0)
  };
  
  private isMiddleMouseDown: boolean = false;
  private isRightMouseDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  
  private minDistance: number = 2;
  private maxDistance: number = 15;
  private damping: number = 0.95;
  private rotationSpeed: number = 0.005;
  
  private stats: { fps: number; frameCount: number; lastTime: number } = {
    fps: 0,
    frameCount: 0,
    lastTime: performance.now()
  };

  constructor() {
    this.canvas = document.getElementById('three-canvas') as HTMLCanvasElement;
    this.clock = new THREE.Clock();
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    
    this.arrayBuilder = new ArrayBuilder(this.scene);
    this.runeManager = new RuneManager(this.scene, this.camera, this.arrayBuilder);
    
    this.init();
  }

  private init(): void {
    this.setupRenderer();
    this.setupLights();
    this.setupArray();
    this.setupEventListeners();
    this.setupUI();
    this.setupDebug();
    this.updateCameraPosition();
    
    setTimeout(() => {
      const loading = document.getElementById('loading');
      if (loading) {
        loading.classList.add('hidden');
      }
    }, 500);
    
    this.animate();
  }

  private setupRenderer(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);
    
    const purpleLight = new THREE.PointLight(0x8a2be2, 0.5, 20);
    purpleLight.position.set(-5, 3, -5);
    this.scene.add(purpleLight);
    
    const cyanLight = new THREE.PointLight(0x00ffff, 0.3, 15);
    cyanLight.position.set(5, 2, 5);
    this.scene.add(cyanLight);
    
    const centerLight = new THREE.PointLight(0xffffff, 0.8, 10);
    centerLight.position.set(0, 2, 0);
    this.scene.add(centerLight);
  }

  private setupArray(): void {
    this.arrayBuilder.build(this.currentArrayType);
    this.updateUI();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
    
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    document.addEventListener('mousedown', () => {
      this.runeManager.resumeAudio();
    }, { once: true });
    
    document.querySelectorAll('.rune-icon').forEach(icon => {
      icon.addEventListener('click', () => {
        const element = icon.getAttribute('data-element') as ElementType;
        if (element) {
          this.runeManager.spawnRune(element);
        }
      });
    });
    
    document.querySelectorAll('.array-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type') as ArrayType;
        if (type && type !== this.currentArrayType) {
          this.switchArray(type);
          
          document.querySelectorAll('.array-btn').forEach(b => {
            b.classList.remove('active');
          });
          btn.classList.add('active');
        }
      });
    });
    
    this.runeManager.setOnProgressUpdate((placed, total) => {
      this.updateProgressUI(placed, total);
    });
    
    this.runeManager.setOnArrayActivated(() => {
      this.onArrayActivated();
    });
  }

  private setupUI(): void {
    this.updateProgressUI(0, 6);
  }

  private setupDebug(): void {
    const pane = new Pane({
      title: '调试面板',
      expanded: false
    });
    
    const cameraFolder = pane.addFolder({
      title: '相机控制'
    });
    
    cameraFolder.addBinding(this.cameraState, 'targetTheta', {
      min: 0,
      max: Math.PI * 2,
      step: 0.01,
      label: '水平角度'
    });
    
    cameraFolder.addBinding(this.cameraState, 'targetPhi', {
      min: 0.1,
      max: Math.PI / 2 - 0.1,
      step: 0.01,
      label: '垂直角度'
    });
    
    cameraFolder.addBinding(this.cameraState, 'targetDistance', {
      min: this.minDistance,
      max: this.maxDistance,
      step: 0.1,
      label: '距离'
    });
    
    const arrayFolder = pane.addFolder({
      title: '阵法切换'
    });
    
    arrayFolder.addBlade({
      view: 'list',
      label: '阵法类型',
      options: [
        { text: '六芒星魔法阵', value: 'hexagram' },
        { text: '螺旋元素阵', value: 'spiral' },
        { text: '符文圆环阵', value: 'ring' }
      ],
      value: this.currentArrayType
    }).on('change', (e) => {
      this.switchArray(e.value as ArrayType);
    });
    
    const runeFolder = pane.addFolder({
      title: '符文生成'
    });
    
    const elements: { text: string; value: ElementType }[] = [
      { text: '火符文', value: 'fire' },
      { text: '水符文', value: 'water' },
      { text: '风符文', value: 'wind' },
      { text: '土符文', value: 'earth' },
      { text: '光符文', value: 'light' },
      { text: '暗符文', value: 'dark' }
    ];
    
    elements.forEach(el => {
      runeFolder.addButton({
        title: el.text
      }).on('click', () => {
        this.runeManager.spawnRune(el.value);
      });
    });
    
    runeFolder.addButton({
      title: '重置所有符文'
    }).on('click', () => {
      this.runeManager.reset();
      this.updateProgressUI(0, 6);
      const slots = this.arrayBuilder.getSlots();
      slots.forEach(slot => {
        slot.occupied = false;
        slot.runeId = null;
        if (slot.outlineMesh) {
          const material = slot.outlineMesh.material as THREE.MeshBasicMaterial;
          material.opacity = 0.3;
        }
      });
    });
    
    const statsFolder = pane.addFolder({
      title: '性能统计'
    });
    
    statsFolder.addBinding(this.stats, 'fps', {
      readonly: true,
      label: 'FPS'
    });
  }

  private onWindowResize(): void {
    const width = Math.max(window.innerWidth, 800);
    const height = Math.max(window.innerHeight, 600);
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      this.runeManager.handleMouseDown(event, this.canvas);
    } else if (event.button === 1) {
      this.isMiddleMouseDown = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    } else if (event.button === 2) {
      this.isRightMouseDown = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  private onMouseMove(event: MouseEvent): void {
    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;
    
    if (this.isRightMouseDown) {
      this.cameraState.targetTheta -= deltaX * this.rotationSpeed;
      this.cameraState.targetPhi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.1, this.cameraState.targetPhi - deltaY * this.rotationSpeed)
      );
    }
    
    if (this.isMiddleMouseDown) {
      const panSpeed = 0.01 * this.cameraState.distance;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      this.camera.getWorldDirection(right);
      right.cross(up).normalize();
      
      const panOffset = new THREE.Vector3();
      panOffset.addScaledVector(right, -deltaX * panSpeed);
      panOffset.y = -deltaY * panSpeed;
      
      this.cameraState.targetLookAt.add(panOffset);
    }
    
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    
    this.runeManager.handleMouseMove(event, this.canvas);
  }

  private onMouseUp(): void {
    this.isMiddleMouseDown = false;
    this.isRightMouseDown = false;
    this.runeManager.handleMouseUp();
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const zoomSpeed = 0.001;
    this.cameraState.targetDistance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.cameraState.targetDistance + event.deltaY * zoomSpeed)
    );
  }

  private updateCameraPosition(): void {
    this.cameraState.theta += (this.cameraState.targetTheta - this.cameraState.theta) * (1 - this.damping);
    this.cameraState.phi += (this.cameraState.targetPhi - this.cameraState.phi) * (1 - this.damping);
    this.cameraState.distance += (this.cameraState.targetDistance - this.cameraState.distance) * (1 - this.damping);
    this.cameraState.target.lerp(this.cameraState.targetLookAt, 1 - this.damping);
    
    const x = this.cameraState.target.x + 
      this.cameraState.distance * Math.sin(this.cameraState.phi) * Math.cos(this.cameraState.theta);
    const y = this.cameraState.target.y + 
      this.cameraState.distance * Math.cos(this.cameraState.phi);
    const z = this.cameraState.target.z + 
      this.cameraState.distance * Math.sin(this.cameraState.phi) * Math.sin(this.cameraState.theta);
    
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraState.target);
  }

  private switchArray(type: ArrayType): void {
    this.currentArrayType = type;
    this.runeManager.reset();
    this.arrayBuilder.build(type);
    this.updateUI();
    this.updateProgressUI(0, 6);
  }

  private updateUI(): void {
    const config = this.arrayBuilder.getConfig();
    const nameElement = document.getElementById('array-name');
    if (nameElement) {
      nameElement.textContent = config.name;
    }
  }

  private updateProgressUI(placed: number, total: number): void {
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    
    if (progressText) {
      progressText.textContent = `${placed} / ${total}`;
    }
    
    if (progressFill) {
      progressFill.style.width = `${(placed / total) * 100}%`;
    }
  }

  private onArrayActivated(): void {
    const container = document.getElementById('canvas-container');
    if (container) {
      container.classList.add('shake');
      setTimeout(() => {
        container.classList.remove('shake');
      }, 200);
    }
  }

  private updateFPS(): void {
    this.stats.frameCount++;
    const now = performance.now();
    
    if (now - this.stats.lastTime >= 1000) {
      this.stats.fps = Math.round(
        this.stats.frameCount * 1000 / (now - this.stats.lastTime)
      );
      this.stats.frameCount = 0;
      this.stats.lastTime = now;
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();
    
    this.updateCameraPosition();
    this.arrayBuilder.update(deltaTime, elapsedTime);
    this.runeManager.update(deltaTime, elapsedTime);
    this.updateFPS();
    
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.arrayBuilder.dispose();
    this.runeManager.reset();
    this.renderer.dispose();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RuneArrayApp();
});
