import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleSystem } from './ParticleSystem';
import type { GridData } from '@/data/weatherGenerator';

export interface SceneParams {
  gridData: GridData;
  gridSize: number;
}

export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private particleSystem: ParticleSystem;
  
  private terrain: THREE.Mesh;
  private terrainGeometry: THREE.PlaneGeometry;
  private highlightMesh: THREE.Mesh | null = null;
  private selectedGrid: { x: number; y: number } | null = null;
  private targetElevationOffset: number = 0;
  
  private gridSize: number = 20;
  private gridData: GridData | null = null;
  
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private onFrameCallback?: (delta: number) => void;
  private onGridClick?: (x: number, y: number) => void;
  
  private transitionAlpha: number = 1;
  private isTransitioning: boolean = false;
  private transitionDirection: 'in' | 'out' = 'in';
  
  private initialCameraState: CameraState = {
    position: new THREE.Vector3(15, 18, 15),
    target: new THREE.Vector3(0, 0, 0),
  };
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0B131C);
    this.scene.fog = new THREE.Fog(0x0B131C, 20, 50);
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.copy(this.initialCameraState.position);
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.2;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.copy(this.initialCameraState.target);
    
    this.setupLights();
    this.terrainGeometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize, 40, 40);
    this.terrain = new THREE.Mesh(
      this.terrainGeometry,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: false,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.1,
      })
    );
    this.terrain.rotation.x = -Math.PI / 2;
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
    
    const gridHelper = new THREE.GridHelper(this.gridSize, this.gridSize, 0x2E86AB, 0x1a3a4a);
    gridHelper.position.y = 0.01;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    this.scene.add(gridHelper);
    
    this.particleSystem = new ParticleSystem(this.scene, this.gridSize);
    this.setupRaycaster();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.animate();
  }
  
  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x4a6b8a, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0x4488aa, 0.3);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);
  }
  
  private setupRaycaster(): void {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const onDoubleClick = (event: MouseEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObject(this.terrain);
      
      if (intersects.length > 0 && intersects[0].face) {
        const point = intersects[0].point;
        const gridX = Math.floor((point.x + this.gridSize / 2));
        const gridY = Math.floor((point.z + this.gridSize / 2));
        
        if (gridX >= 0 && gridX < this.gridSize && gridY >= 0 && gridY < this.gridSize) {
          this.setSelectedGrid(gridX, gridY);
          if (this.onGridClick) {
            this.onGridClick(gridX, gridY);
          }
        }
      }
    };
    
    this.renderer.domElement.addEventListener('dblclick', onDoubleClick);
  }
  
  setOnGridClick(callback: (x: number, y: number) => void): void {
    this.onGridClick = callback;
  }
  
  setOnFrameCallback(callback: (delta: number) => void): void {
    this.onFrameCallback = callback;
  }
  
  updateWeather(params: SceneParams): void {
    this.gridData = params.gridData;
    this.gridSize = params.gridSize;
    this.updateTerrain();
    
    let totalWindSpeed = 0;
    let totalWindDir = 0;
    let count = 0;
    
    for (let y = 0; y < params.gridData.windSpeed.length; y++) {
      for (let x = 0; x < params.gridData.windSpeed[y].length; x++) {
        totalWindSpeed += params.gridData.windSpeed[y][x];
        totalWindDir += params.gridData.windDirection[y][x];
        count++;
      }
    }
    
    const avgWindSpeed = count > 0 ? totalWindSpeed / count : 5;
    const avgWindDir = count > 0 ? totalWindDir / count : 0;
    
    this.particleSystem.setWind(avgWindDir, avgWindSpeed);
  }
  
  private updateTerrain(): void {
    if (!this.gridData) return;
    
    const positions = this.terrainGeometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    
    const segSize = this.gridSize / 40;
    
    for (let i = 0; i < positions.count; i++) {
      const x = (positions.getX(i) + this.gridSize / 2) / this.gridSize;
      const z = (-positions.getY(i) + this.gridSize / 2) / this.gridSize;
      
      const gridX = Math.floor(x * (this.gridData.elevation[0]?.length || 1));
      const gridY = Math.floor(z * (this.gridData.elevation.length || 1));
      
      const clampedX = Math.max(0, Math.min(this.gridData.elevation[0]?.length - 1 || 0, gridX));
      const clampedY = Math.max(0, Math.min(this.gridData.elevation.length - 1, gridY));
      
      const elevation = this.gridData.elevation[clampedY]?.[clampedX] || 0;
      const temperature = this.gridData.temperature[clampedY]?.[clampedX] || 20;
      
      positions.setZ(i, elevation * 2);
      
      const color = this.getTerrainColor(elevation, temperature);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    this.terrainGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.terrainGeometry.attributes.position.needsUpdate = true;
    this.terrainGeometry.attributes.color.needsUpdate = true;
    this.terrainGeometry.computeVertexNormals();
  }
  
  private getTerrainColor(elevation: number, temperature: number): THREE.Color {
    const lowColor = new THREE.Color(0x1B4332);
    const highColor = new THREE.Color(0xD5D5D5);
    const warmColor = new THREE.Color(0xd4893a);
    const coolColor = new THREE.Color(0x4a90b8);
    
    const elevRatio = Math.min(1, Math.max(0, elevation / 3));
    const baseColor = lowColor.clone().lerp(highColor, elevRatio);
    
    const tempRatio = (temperature + 10) / 50;
    const tempColor = coolColor.clone().lerp(warmColor, Math.min(1, Math.max(0, tempRatio)));
    
    return baseColor.clone().lerp(tempColor, 0.3);
  }
  
  getElevationAt(gridX: number, gridY: number): number {
    if (!this.gridData) return 0;
    return this.gridData.elevation[gridY]?.[gridX] || 0;
  }
  
  setSelectedGrid(x: number | null, y: number | null): void {
    if (x === null || y === null) {
      if (this.highlightMesh) {
        this.scene.remove(this.highlightMesh);
        this.highlightMesh.geometry.dispose();
        (this.highlightMesh.material as THREE.Material).dispose();
        this.highlightMesh = null;
      }
      this.selectedGrid = null;
      this.targetElevationOffset = 0;
      return;
    }
    
    this.selectedGrid = { x, y };
    
    if (!this.highlightMesh) {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0x2E86AB,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      this.highlightMesh = new THREE.Mesh(geometry, material);
      this.highlightMesh.rotation.x = -Math.PI / 2;
      this.scene.add(this.highlightMesh);
    }
    
    const elevation = this.getElevationAt(x, y);
    this.highlightMesh.position.set(
      x - this.gridSize / 2 + 0.5,
      elevation * 2 + 0.05,
      y - this.gridSize / 2 + 0.5
    );
    this.targetElevationOffset = 0.3;
  }
  
  resetCamera(): void {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = this.initialCameraState.position.clone();
    const endTarget = this.initialCameraState.target.clone();
    
    const duration = 0.5;
    const startTime = this.clock.getElapsedTime();
    
    const animateCamera = () => {
      const elapsed = this.clock.getElapsedTime() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      
      this.camera.position.lerpVectors(startPos, endPos, eased);
      this.controls.target.lerpVectors(startTarget, endTarget, eased);
      this.controls.update();
      
      if (t < 1) {
        requestAnimationFrame(animateCamera);
      }
    };
    
    animateCamera();
  }
  
  startTransition(callback?: () => void): void {
    this.isTransitioning = true;
    this.transitionDirection = 'out';
    
    const startTime = this.clock.getElapsedTime();
    const duration = 0.3;
    
    const animateTransition = () => {
      const elapsed = this.clock.getElapsedTime() - startTime;
      const t = Math.min(1, elapsed / duration);
      
      if (this.transitionDirection === 'out') {
        this.transitionAlpha = 1 - t;
      } else {
        this.transitionAlpha = t;
      }
      
      this.particleSystem.setOpacity(0.7 * this.transitionAlpha);
      const terrainMaterial = this.terrain.material as THREE.MeshStandardMaterial;
      terrainMaterial.transparent = true;
      terrainMaterial.opacity = this.transitionAlpha;
      
      if (t < 1) {
        requestAnimationFrame(animateTransition);
      } else if (this.transitionDirection === 'out') {
        if (callback) callback();
        this.transitionDirection = 'in';
        const inStartTime = this.clock.getElapsedTime();
        const animateIn = () => {
          const inElapsed = this.clock.getElapsedTime() - inStartTime;
          const inT = Math.min(1, inElapsed / duration);
          this.transitionAlpha = inT;
          this.particleSystem.setOpacity(0.7 * this.transitionAlpha);
          (this.terrain.material as THREE.MeshStandardMaterial).opacity = this.transitionAlpha;
          
          if (inT < 1) {
            requestAnimationFrame(animateIn);
          } else {
            this.isTransitioning = false;
          }
        };
        animateIn();
      }
    };
    
    animateTransition();
  }
  
  exportScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }
  
  private handleResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }
  
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    
    const delta = this.clock.getDelta();
    
    this.controls.update();
    this.particleSystem.update(delta, (x, z) => {
      const gx = Math.floor(x);
      const gy = Math.floor(z);
      return this.getElevationAt(gx, gy);
    });
    
    if (this.highlightMesh && this.selectedGrid) {
      const targetY = this.getElevationAt(this.selectedGrid.x, this.selectedGrid.y) * 2 + 0.05 + this.targetElevationOffset;
      this.highlightMesh.position.y += (targetY - this.highlightMesh.position.y) * 0.05;
    }
    
    if (this.onFrameCallback) {
      this.onFrameCallback(delta);
    }
    
    this.renderer.render(this.scene, this.camera);
  };
  
  dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.particleSystem.dispose();
    this.terrainGeometry.dispose();
    (this.terrain.material as THREE.Material).dispose();
    
    if (this.highlightMesh) {
      this.highlightMesh.geometry.dispose();
      (this.highlightMesh.material as THREE.Material).dispose();
    }
    
    this.renderer.dispose();
    this.controls.dispose();
    
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
