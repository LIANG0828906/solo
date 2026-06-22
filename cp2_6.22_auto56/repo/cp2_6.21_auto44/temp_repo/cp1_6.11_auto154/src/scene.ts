import * as THREE from 'three';
import { Plate } from './plate';
import { Controls } from './controls';
import { PlateData, PLATE_NAMES, COLOR_GRADIENT } from './types';
import { seededRandom } from './utils';

type PlateClickCallback = (plate: Plate | null) => void;

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: Controls | null = null;
  private plates: Plate[] = [];
  private plateObjects: THREE.Object3D[] = [];
  private particles: THREE.InstancedMesh | null = null;
  private particleCount: number = 5000;
  private particleDummy: THREE.Object3D = new THREE.Object3D();
  private earthRadius: number = 5;
  private plateClickCallback: PlateClickCallback | null = null;
  private selectedPlate: Plate | null = null;
  private time: number = 0;
  private isInitialized: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createLights();
    this.createEarth();
    this.createPlates();
    this.createCrackLines();
    this.createParticles();
    this.setupControls();

    window.addEventListener('resize', this.onResize.bind(this));
    this.isInitialized = true;
  }

  private createScene(): void {
    this.scene = new THREE.Scene();
  }

  private createCamera(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      width / height,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 15);
    this.camera.lookAt(0, 0, 0);
  }

  private createRenderer(): void {
    if (!this.container) return;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = false;
    
    this.container.appendChild(this.renderer.domElement);
  }

  private createLights(): void {
    if (!this.scene) return;

    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = false;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    fillLight.position.set(-10, 5, -10);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffaa44, 0.2);
    rimLight.position.set(0, -10, -10);
    this.scene.add(rimLight);
  }

  private createEarth(): void {
    if (!this.scene) return;

    const oceanGeometry = new THREE.SphereGeometry(this.earthRadius, 32, 32);
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1A2A4A');
    gradient.addColorStop(0.5, '#2A4A6A');
    gradient.addColorStop(1, '#4A7A9A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);

    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = 50 + Math.random() * 150;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(74, 122, 154, 0.3)');
      g.addColorStop(1, 'rgba(74, 122, 154, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const oceanTexture = new THREE.CanvasTexture(canvas);
    oceanTexture.wrapS = THREE.RepeatWrapping;
    oceanTexture.wrapT = THREE.ClampToEdgeWrapping;

    const oceanMaterial = new THREE.MeshStandardMaterial({
      map: oceanTexture,
      roughness: 0.9,
      metalness: 0.1
    });

    const oceanSphere = new THREE.Mesh(oceanGeometry, oceanMaterial);
    this.scene.add(oceanSphere);

    const atmosphereGeometry = new THREE.SphereGeometry(this.earthRadius * 1.02, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.scene.add(atmosphere);
  }

  private generatePlateData(): PlateData[] {
    const plates: PlateData[] = [];
    const plateConfigs = [
      { startLat: 15, startLng: -150, endLat: 20, endLng: -130, cp1Lat: 10, cp1Lng: -160, cp2Lat: 25, cp2Lng: -140, size: 2.8, speed: 8.2, elevation: -3800, rotSpeed: 0.3 },
      { startLat: 45, startLng: 80, endLat: 50, endLng: 90, cp1Lat: 40, cp1Lng: 70, cp2Lat: 55, cp2Lng: 100, size: 2.5, speed: 2.1, elevation: 450, rotSpeed: -0.2 },
      { startLat: 5, startLng: 20, endLat: 10, endLng: 25, cp1Lat: 0, cp1Lng: 10, cp2Lat: 15, cp2Lng: 35, size: 2.2, speed: 4.5, elevation: 380, rotSpeed: 0.15 },
      { startLat: 50, startLng: -100, endLat: 55, endLng: -90, cp1Lat: 45, cp1Lng: -110, cp2Lat: 60, cp2Lng: -80, size: 2.3, speed: 2.8, elevation: 520, rotSpeed: -0.25 },
      { startLat: -15, startLng: -60, endLat: -10, endLng: -50, cp1Lat: -20, cp1Lng: -70, cp2Lat: -5, cp2Lng: -40, size: 2.0, speed: 3.5, elevation: 410, rotSpeed: 0.35 },
      { startLat: -80, startLng: 0, endLat: -85, endLng: 10, cp1Lat: -75, cp1Lng: -10, cp2Lat: -88, cp2Lng: 20, size: 2.6, speed: 1.8, elevation: 2800, rotSpeed: 0.1 },
      { startLat: -25, startLng: 135, endLat: -20, endLng: 145, cp1Lat: -30, cp1Lng: 125, cp2Lat: -15, cp2Lng: 155, size: 1.8, speed: 6.2, elevation: 320, rotSpeed: -0.4 },
      { startLat: 22, startLng: 78, endLat: 35, endLng: 95, cp1Lat: 15, cp1Lng: 70, cp2Lat: 45, cp2Lng: 105, size: 1.5, speed: 5.2, elevation: 680, rotSpeed: 0.5 },
      { startLat: -20, startLng: -100, endLat: -15, endLng: -85, cp1Lat: -25, cp1Lng: -110, cp2Lat: -10, cp2Lng: -75, size: 1.6, speed: 7.5, elevation: -2800, rotSpeed: -0.3 },
      { startLat: 18, startLng: -80, endLat: 20, endLng: -72, cp1Lat: 12, cp1Lng: -88, cp2Lat: 25, cp2Lng: -65, size: 1.2, speed: 2.3, elevation: 150, rotSpeed: 0.2 }
    ];

    for (let i = 0; i < 10; i++) {
      const color = new THREE.Color().lerpColors(
        COLOR_GRADIENT.start,
        COLOR_GRADIENT.end,
        i / 9
      );
      const config = plateConfigs[i];
      plates.push({
        id: i,
        name: PLATE_NAMES[i],
        color,
        baseSpeed: config.speed,
        baseElevation: config.elevation,
        startLat: config.startLat,
        startLng: config.startLng,
        endLat: config.endLat,
        endLng: config.endLng,
        cp1Lat: config.cp1Lat,
        cp1Lng: config.cp1Lng,
        cp2Lat: config.cp2Lat,
        cp2Lng: config.cp2Lng,
        size: config.size,
        irregularity: 0.3 + seededRandom(i * 5) * 0.3,
        rotationSpeed: config.rotSpeed
      });
    }

    return plates;
  }

  private createPlates(): void {
    if (!this.scene) return;

    const plateDataList = this.generatePlateData();
    
    for (const plateData of plateDataList) {
      const plate = new Plate(plateData, this.earthRadius);
      const plateGroup = plate.create();
      this.plates.push(plate);
      this.plateObjects.push(plateGroup);
      this.scene.add(plateGroup);
    }
  }

  private createCrackLines(): void {
    if (!this.scene || this.plateObjects.length < 2) return;

    const crackPositions: number[] = [];

    for (let i = 0; i < this.plateObjects.length; i++) {
      const plate1 = this.plates[i];
      const mesh1 = plate1.getMesh();
      if (!mesh1) continue;

      const posAttr = mesh1.geometry.getAttribute('position');
      const vertexCount = posAttr.count;

      for (let j = i + 1; j < Math.min(i + 3, this.plateObjects.length); j++) {
        const plate2 = this.plates[j];
        const mesh2 = plate2.getMesh();
        if (!mesh2) continue;

        const posAttr2 = mesh2.geometry.getAttribute('position');
        const sampleCount = Math.min(8, vertexCount, posAttr2.count);

        for (let s = 0; s < sampleCount; s++) {
          const idx1 = Math.floor((s / sampleCount) * vertexCount);
          const idx2 = Math.floor(((s + 0.5) / sampleCount) * posAttr2.count);
          
          const v1 = new THREE.Vector3(
            posAttr.getX(idx1),
            posAttr.getY(idx1),
            posAttr.getZ(idx1)
          );
          const v2 = new THREE.Vector3(
            posAttr2.getX(idx2),
            posAttr2.getY(idx2),
            posAttr2.getZ(idx2)
          );

          const dist = v1.distanceTo(v2);
          if (dist < 3 && dist > 0.5) {
            const n1 = v1.clone().normalize();
            const n2 = v2.clone().normalize();
            const p1 = n1.multiplyScalar(this.earthRadius + 0.01);
            const p2 = n2.multiplyScalar(this.earthRadius + 0.01);
            crackPositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
          }
        }
      }
    }

    if (crackPositions.length > 0) {
      const crackGeometry = new THREE.BufferGeometry();
      crackGeometry.setAttribute('position', new THREE.Float32BufferAttribute(crackPositions, 3));
      const crackMaterial = new THREE.LineBasicMaterial({
        color: 0x0A0A0A,
        transparent: true,
        opacity: 0.8
      });
      const crackLines = new THREE.LineSegments(crackGeometry, crackMaterial);
      this.scene.add(crackLines);
    }
  }

  private createParticles(): void {
    if (!this.scene) return;

    const geometry = new THREE.SphereGeometry(0.015, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.6
    });

    this.particles = new THREE.InstancedMesh(geometry, material, this.particleCount);
    this.particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < this.particleCount; i++) {
      const phi = Math.acos(2 * seededRandom(i * 123) - 1);
      const theta = 2 * Math.PI * seededRandom(i * 456);
      const r = this.earthRadius + 0.05 + seededRandom(i * 789) * 0.5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      this.particleDummy.position.set(x, y, z);
      this.particleDummy.updateMatrix();
      this.particles.setMatrixAt(i, this.particleDummy.matrix);
    }

    this.particles.instanceMatrix.needsUpdate = true;
    this.scene.add(this.particles);
  }

  private setupControls(): void {
    if (!this.camera || !this.renderer) return;

    this.controls = new Controls(this.camera, this.renderer.domElement);
    this.controls.enableOrbit();
    this.controls.enablePicking(this.plateObjects);
    this.controls.onPlateClick(this.handlePlateClick.bind(this));
  }

  private handlePlateClick(plate: any): void {
    if (this.selectedPlate && this.selectedPlate !== plate) {
      this.selectedPlate.highlight(false);
    }

    if (plate && plate instanceof Plate) {
      this.selectedPlate = plate;
      plate.highlight(true);
      if (this.plateClickCallback) {
        this.plateClickCallback(plate);
      }
    } else {
      this.selectedPlate = null;
      if (this.plateClickCallback) {
        this.plateClickCallback(null);
      }
    }
  }

  public onPlateClick(callback: PlateClickCallback): void {
    this.plateClickCallback = callback;
  }

  public update(progress: number, deltaTime: number): void {
    this.time += deltaTime;

    for (const plate of this.plates) {
      plate.update(progress, deltaTime);
    }

    this.updateParticles();

    if (this.controls) {
      this.controls.update();
    }

    this.render();
  }

  private updateParticles(): void {
    if (!this.particles) return;

    for (let i = 0; i < this.particleCount; i++) {
      const seed = i * 123;
      const basePhi = Math.acos(2 * seededRandom(seed) - 1);
      const baseTheta = 2 * Math.PI * seededRandom(seed + 1);
      const baseR = this.earthRadius + 0.05 + seededRandom(seed + 2) * 0.5;

      const offset = Math.sin(this.time * 0.5 + seededRandom(seed + 3) * Math.PI * 2) * 0.02;
      const r = baseR + offset;

      const x = r * Math.sin(basePhi) * Math.cos(baseTheta);
      const y = r * Math.sin(basePhi) * Math.sin(baseTheta);
      const z = r * Math.cos(basePhi);

      this.particleDummy.position.set(x, y, z);
      this.particleDummy.updateMatrix();
      this.particles.setMatrixAt(i, this.particleDummy.matrix);
    }

    this.particles.instanceMatrix.needsUpdate = true;
  }

  private render(): void {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  }

  private onResize(): void {
    if (!this.camera || !this.renderer || !this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public getCanvas(): HTMLCanvasElement | null {
    return this.renderer?.domElement || null;
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onResize.bind(this));

    for (const plate of this.plates) {
      plate.dispose();
    }

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
