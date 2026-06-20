import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { SceneManager } from './SceneManager';
import { HistoryManager } from './HistoryManager';
import { UIHandler } from './UIHandler';
import type { GeometryType } from './GeometryFactory';

class App {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private controls: OrbitControls;
  private sceneManager: SceneManager;
  private historyManager: HistoryManager;
  private uiHandler!: UIHandler;
  private clock = new THREE.Clock();
  private frameCount = 0;
  private lastFpsUpdate = 0;

  constructor() {
    this.canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;
    if (!this.canvas) throw new Error('Canvas element not found');

    this.scene = new THREE.Scene();
    this.setupSkyDome();
    this.setupLighting();
    this.setupGridGround();

    const { innerWidth: w, innerHeight: h } = window;
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    this.camera.position.set(8, 6, 10);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(w, h);
    const labelDom = this.labelRenderer.domElement;
    labelDom.style.position = 'absolute';
    labelDom.style.top = '0';
    labelDom.style.left = '0';
    labelDom.style.pointerEvents = 'none';
    labelDom.style.zIndex = '10';
    labelDom.style.width = '100%';
    labelDom.style.height = '100%';
    document.getElementById('app')?.appendChild(labelDom);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.target.set(0, 1, 0);
    this.controls.enablePan = true;

    this.sceneManager = new SceneManager(this.scene);
    this.historyManager = new HistoryManager(this.renderer, this.scene, this.camera);

    this.historyManager.setRestoreCallback((objects) => {
      this.sceneManager.restoreObjects(objects);
    });

    this.uiHandler = new UIHandler({
      canvas: this.renderer.domElement,
      scene: this.scene,
      camera: this.camera,
      sceneManager: this.sceneManager,
      historyManager: this.historyManager,
      onDropGeometry: (type: GeometryType, pos) => {
        this.sceneManager.addGeometry(type, pos);
      },
    });

    window.addEventListener('resize', this.onResize.bind(this));

    this.animate();
  }

  private setupSkyDome(): void {
    const uniforms = {
      topColor: { value: new THREE.Color('#1e3a8a') },
      bottomColor: { value: new THREE.Color('#fef9c3') },
      offset: { value: 12 },
      exponent: { value: 0.6 },
    };

    const skyGeo = new THREE.SphereGeometry(400, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.name = '__skyDome';
    this.scene.add(sky);
    this.scene.background = null;
  }

  private setupGridGround(): void {
    const grid = new THREE.GridHelper(20, 20, '#94a3b8', '#94a3b8');
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.3;
    grid.position.y = 0;
    this.scene.add(grid);

    const planeGeo = new THREE.PlaneGeometry(50, 50);
    const planeMat = new THREE.ShadowMaterial({
      opacity: 0.15,
    });
    const shadowPlane = new THREE.Mesh(planeGeo, planeMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);
  }

  private setupLighting(): void {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.5);
    hemi.position.set(0, 10, 0);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(8, 15, 6);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.left = -15;
    dir.shadow.camera.right = 15;
    dir.shadow.camera.top = 15;
    dir.shadow.camera.bottom = -15;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 50;
    dir.shadow.bias = -0.0005;
    this.scene.add(dir);

    const fill = new THREE.DirectionalLight(0xa5b4fc, 0.4);
    fill.position.set(-6, 4, -8);
    this.scene.add(fill);

    const rim = new THREE.PointLight(0xfbbf24, 0.3, 30);
    rim.position.set(-4, 5, -5);
    this.scene.add(rim);
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    const delta = this.clock.getDelta();

    this.controls.update(delta);

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);

    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      const fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
      (this.renderer.info as any).displayedFps = fps;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    new App();
    console.log('[Sculpture Studio] Application initialized successfully');
  } catch (err) {
    console.error('[Sculpture Studio] Failed to initialize:', err);
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;color:#f87171;background:#0f172a;padding:24px;">
        <h2 style="margin:0;">启动失败</h2>
        <pre style="background:#1e293b;padding:16px;border-radius:8px;max-width:600px;overflow:auto;margin:0;">${err}</pre>
        <p style="margin:0;color:#94a3b8;">请运行 <code style="background:#1e293b;padding:2px 6px;border-radius:4px;">npm install</code> 后重试</p>
      </div>
    `;
  }
});
