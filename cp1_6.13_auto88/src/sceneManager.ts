import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TerrainRenderer } from './terrainModule/terrainRenderer';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private terrainRenderer: TerrainRenderer;
  private animationId: number = 0;
  private onTerrainClick: ((x: number, y: number) => void) | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a12);

    const width = canvas.width;
    const height = canvas.height;
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(60, 40, 60);

    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI / 2;

    this.terrainRenderer = new TerrainRenderer(this.scene);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupLighting();
    this.setupEventListeners();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404050, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x6688cc, 0.3);
    fillLight.position.set(-30, 20, -30);
    this.scene.add(fillLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this));
    this.renderer.domElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
  }

  private handleResize(): void {
    const canvas = this.renderer.domElement;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    canvas.width = width;
    canvas.height = height;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.button !== 0 || !this.onTerrainClick) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const terrainMesh = this.terrainRenderer.getTerrainMesh();
    if (terrainMesh) {
      const intersects = this.raycaster.intersectObject(terrainMesh);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const size = this.terrainRenderer.getTerrainSize();
        const x = ((point.x / size) + 0.5) * 256;
        const y = ((point.z / size) + 0.5) * 256;
        this.onTerrainClick(Math.max(0, Math.min(255, x)), Math.max(0, Math.min(255, y)));
      }
    }
  }

  createTerrain(heightMap: number[]): void {
    this.terrainRenderer.createTerrain(heightMap);
    this.terrainRenderer.createWater();
  }

  updateTerrain(heightMap: number[]): void {
    this.terrainRenderer.updateTerrain(heightMap);
  }

  updateWaterLevel(level: number): void {
    this.terrainRenderer.updateWaterLevel(level);
  }

  setOnTerrainClick(callback: (x: number, y: number) => void): void {
    this.onTerrainClick = callback;
  }

  start(): void {
    let lastTime = performance.now();
    
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      this.controls.update();
      this.terrainRenderer.updateWaterAnimation(deltaTime);
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  dispose(): void {
    this.stop();
    this.terrainRenderer.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}
