import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GRID_SIZE, CELL_SIZE } from '../models/buildingConfig';

export class SceneManager {
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  gridHelper!: THREE.GridHelper;
  groundPlane!: THREE.Mesh;
  controls!: OrbitControls;
  ambientLight!: THREE.AmbientLight;
  directionalLight!: THREE.DirectionalLight;
  hemisphereLight!: THREE.HemisphereLight;
  isNightMode: boolean = false;
  breathingIntensity: number = 0;
  private container: HTMLElement | null = null;
  private dayFogColor: number = 0x1a0a3f;
  private nightFogColor: number = 0x0a0a1f;
  private dayAmbientIntensity: number = 0.6;
  private nightAmbientIntensity: number = 0.2;
  private dayDirectionalIntensity: number = 1.0;
  private nightDirectionalIntensity: number = 0.3;

  init(container: HTMLElement): void {
    this.container = container;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1f);
    this.scene.fog = new THREE.FogExp2(this.dayFogColor, 0.015);

    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(30, 40, 50);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 120;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.target.set(0, 0, 0);

    this.setupLights();
    this.createGround();
    this.createGrid();
    this.setupEventListeners();
  }

  private setupLights(): void {
    this.ambientLight = new THREE.AmbientLight(0x404080, this.dayAmbientIntensity);
    this.scene.add(this.ambientLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x8888ff, 0x1a1a3f, 0.4);
    this.scene.add(this.hemisphereLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, this.dayDirectionalIntensity);
    this.directionalLight.position.set(50, 80, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.directionalLight.shadow.bias = -0.0001;
    this.scene.add(this.directionalLight);
  }

  private createGround(): void {
    const groundSize = GRID_SIZE * CELL_SIZE;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a1f,
      roughness: 0.9,
      metalness: 0.1
    });
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.receiveShadow = true;
    this.groundPlane.name = 'ground';
    this.scene.add(this.groundPlane);
  }

  private createGrid(): void {
    const gridTotalSize = GRID_SIZE * CELL_SIZE;
    this.gridHelper = new THREE.GridHelper(gridTotalSize, GRID_SIZE, 0x00ffff, 0x1a1a4a);
    this.gridHelper.position.y = 0.01;
    (this.gridHelper.material as THREE.Material).opacity = 0.3;
    (this.gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(this.gridHelper);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private onWindowResize(): void {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getControls(): OrbitControls {
    return this.controls;
  }

  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  setNightMode(enabled: boolean): void {
    if (this.isNightMode === enabled) return;
    this.isNightMode = enabled;
    
    const targetFogColor = enabled ? this.nightFogColor : this.dayFogColor;
    const targetAmbientIntensity = enabled ? this.nightAmbientIntensity : this.dayAmbientIntensity;
    const targetDirectionalIntensity = enabled ? this.nightDirectionalIntensity : this.dayDirectionalIntensity;
    
    this.animateColor(this.scene.fog as THREE.FogExp2, 'color', targetFogColor, 2000);
    this.animateValue(this.ambientLight, 'intensity', targetAmbientIntensity, 2000);
    this.animateValue(this.directionalLight, 'intensity', targetDirectionalIntensity, 2000);
    
    if (this.scene.background instanceof THREE.Color) {
      this.animateColor(this.scene.background, null, targetFogColor, 2000);
    }
    
    const gridMaterial = this.gridHelper.material as THREE.LineBasicMaterial;
    const targetGridColor = enabled ? 0x6600ff : 0x00ffff;
    this.animateColor(gridMaterial, 'color', targetGridColor, 2000);
  }

  private animateColor(object: any, property: string | null, targetColor: number, duration: number): void {
    const startColor = new THREE.Color(property ? object[property] : object);
    const endColor = new THREE.Color(targetColor);
    const startTime = Date.now();
    
    const update = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentColor = startColor.clone().lerp(endColor, eased);
      if (property) {
        object[property] = currentColor;
      } else {
        object.set(currentColor.r, currentColor.g, currentColor.b);
      }
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    update();
  }

  private animateValue(object: any, property: string, targetValue: number, duration: number): void {
    const startValue = object[property];
    const startTime = Date.now();
    
    const update = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      object[property] = startValue + (targetValue - startValue) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    update();
  }

  updateBreathingEffect(intensity: number): void {
    this.breathingIntensity = intensity;
    this.renderer.toneMappingExposure = 1.2 + intensity * 0.3;
    
    const pulseColor = new THREE.Color(0x00ffff);
    pulseColor.multiplyScalar(0.1 * intensity);
    
    if (this.isNightMode) {
      this.ambientLight.color.setHex(0x202060).add(pulseColor);
    }
  }

  focusOnPosition(x: number, z: number, height: number): void {
    const targetX = x;
    const targetZ = z;
    const targetY = height / 2;
    
    const startTarget = this.controls.target.clone();
    const startCamPos = this.camera.position.clone();
    const startTime = Date.now();
    const duration = 1500;
    
    const offset = new THREE.Vector3(20, height * 0.8 + 15, 25);
    const endCamPos = new THREE.Vector3(targetX, targetY, targetZ).add(offset);
    
    const update = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      this.controls.target.lerpVectors(startTarget, new THREE.Vector3(targetX, targetY, targetZ), eased);
      this.camera.position.lerpVectors(startCamPos, endCamPos, eased);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    update();
  }

  dispose(): void {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
