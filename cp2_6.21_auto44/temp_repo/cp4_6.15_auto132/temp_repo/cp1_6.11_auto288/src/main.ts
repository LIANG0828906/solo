import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Compass, type CompassData } from './compass';
import { FengShui } from './fengshui';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  
  private compass!: Compass;
  private fengshui!: FengShui;
  
  private clock: THREE.Clock;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 60;
  
  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xEDE4D4);
    this.scene.fog = new THREE.Fog(0xEDE4D4, 80, 250);
    
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 85, 110);
    this.camera.lookAt(0, -20, 0);
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 60;
    this.controls.maxDistance = 200;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.target.set(0, -20, 0);
    this.controls.enabled = true;
    
    this.clock = new THREE.Clock();
    
    this.setupLights();
    this.setupAtmosphere();
    this.initModules();
    this.setupEventListeners();
    this.updateCompassDisplay(this.compass.getCompassData());
    
    this.animate();
  }
  
  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    this.scene.add(ambientLight);
    
    const hemisphereLight = new THREE.HemisphereLight(
      0xFFF8DC,
      0x8B7355,
      0.4
    );
    this.scene.add(hemisphereLight);
    
    const sunLight = new THREE.DirectionalLight(0xFFF4E0, 1.0);
    sunLight.position.set(80, 120, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -150;
    sunLight.shadow.camera.right = 150;
    sunLight.shadow.camera.top = 150;
    sunLight.shadow.camera.bottom = -150;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);
    
    const fillLight = new THREE.DirectionalLight(0xB8D4E8, 0.25);
    fillLight.position.set(-60, 40, -40);
    this.scene.add(fillLight);
    
    const compassLight = new THREE.PointLight(0xFFD700, 0.8, 150, 2);
    compassLight.position.set(0, 35, 0);
    compassLight.castShadow = false;
    this.scene.add(compassLight);
  }
  
  private setupAtmosphere(): void {
    const particleCount = 300;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = Math.random() * 150 - 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
      
      const goldTint = 0.8 + Math.random() * 0.2;
      colors[i * 3] = 1 * goldTint;
      colors[i * 3 + 1] = 0.95 * goldTint;
      colors[i * 3 + 2] = 0.85 * goldTint;
    }
    
    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    dustGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const dustMat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const dust = new THREE.Points(dustGeom, dustMat);
    this.scene.add(dust);
    
    dust.userData.update = (delta: number) => {
      const pos = dustGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3] += Math.sin(Date.now() * 0.0001 + i) * delta * 0.5;
        pos[i * 3 + 1] += delta * 0.3;
        pos[i * 3 + 2] += Math.cos(Date.now() * 0.0001 + i) * delta * 0.5;
        
        if (pos[i * 3 + 1] > 150) pos[i * 3 + 1] = -10;
      }
      dustGeom.attributes.position.needsUpdate = true;
    };
    this.scene.userData.dust = dust;
  }
  
  private initModules(): void {
    this.compass = new Compass(this.scene);
    this.compass.group.position.set(0, 15, 0);
    this.compass.group.scale.setScalar(0.9);
    this.scene.add(this.compass.group);
    
    this.compass.onAngleChange = (data: CompassData) => {
      this.updateCompassDisplay(data);
    };
    
    this.fengshui = new FengShui(this.scene);
  }
  
  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));
    
    const canvas = this.renderer.domElement;
    let isCompassDragging = false;
    
    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      const hit = this.compass.handleMouseDown(e, this.camera, this.container);
      if (hit) {
        isCompassDragging = true;
        this.controls.enabled = false;
      }
    });
    
    canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (isCompassDragging || this.compass.getIsDragging()) {
        this.compass.handleMouseMove(e, this.camera, this.container);
      }
    });
    
    const endDrag = () => {
      if (isCompassDragging) {
        isCompassDragging = false;
        this.compass.handleMouseUp();
        this.controls.enabled = true;
      }
    };
    
    window.addEventListener('mouseup', endDrag);
    canvas.addEventListener('mouseleave', endDrag);
    
    canvas.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
    });
    
    const btnSurvey = document.getElementById('btn-survey');
    const btnReset = document.getElementById('btn-reset');
    
    if (btnSurvey) {
      btnSurvey.addEventListener('click', () => {
        const data = this.compass.getCompassData();
        this.fengshui.survey(data);
      });
    }
    
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.compass.setAngle(180, false);
        this.fengshui.reset();
      });
    }
    
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const data = this.compass.getCompassData();
        this.fengshui.survey(data);
      }
      if (e.key === 'Escape' || e.key === 'r' || e.key === 'R') {
        this.compass.setAngle(180, false);
        this.fengshui.reset();
      }
      
      if (this.compass.getIsDragging()) return;
      
      const step = e.shiftKey ? 1 : 5;
      if (e.key === 'ArrowLeft') {
        this.compass.setAngle(this.compass.currentAngle - step, false);
      }
      if (e.key === 'ArrowRight') {
        this.compass.setAngle(this.compass.currentAngle + step, false);
      }
    });
  }
  
  private updateCompassDisplay(data: CompassData): void {
    const angleEl = document.getElementById('angle-display');
    const dirEl = document.getElementById('direction-display');
    const guaEl = document.getElementById('gua-display');
    
    if (angleEl) angleEl.textContent = `${data.angle}°`;
    if (dirEl) dirEl.textContent = data.mountainDirection;
    if (guaEl) guaEl.textContent = `${data.guaName}·${data.guaElement}`;
  }
  
  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.elapsedTime;
    
    this.controls.update();
    this.compass.updateParticles(delta);
    this.compass.updateBaguaMirror(delta);
    this.fengshui.updateHalos(delta);
    
    if (this.scene.userData.dust) {
      this.scene.userData.dust.userData.update(delta);
    }
    
    this.bobCompass(elapsed);
    
    this.renderer.render(this.scene, this.camera);
    
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }
  
  private bobCompass(time: number): void {
    this.compass.group.position.y = 15 + Math.sin(time * 1.2) * 1.2;
    this.compass.group.rotation.z = Math.sin(time * 0.8) * 0.008;
    this.compass.group.rotation.x = Math.cos(time * 0.6) * 0.008;
  }
  
  public getFPS(): number {
    return this.fps;
  }
}

let app: App | null = null;

window.addEventListener('DOMContentLoaded', () => {
  try {
    app = new App();
    console.log('堪輿真訣 已啟動');
    console.log('操作指南：');
    console.log('  - 滑鼠左鍵拖動羅盤指針旋轉');
    console.log('  - 滑鼠右鍵/滾輪縮放旋轉視角');
    console.log('  - 左右方向鍵微調角度 (Shift精細)');
    console.log('  - 空格/Enter鍵：勘宅');
    console.log('  - Esc/R鍵：復位');
  } catch (err) {
    console.error('啟動失敗：', err);
  }
});

export { App };
