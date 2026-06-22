import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SeismicPoint } from './SeismicPoint';
import { PlateBoundary } from './PlateBoundary';
import type { SeismicRecord, PlateBoundaryData } from '../data/SeismicData';

export class Earth {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private earthGroup: THREE.Group;
  private earthMesh: THREE.Mesh;
  private atmosphereMesh: THREE.Mesh;
  private seismicPoints: Map<string, SeismicPoint> = new Map();
  private plateBoundaries: PlateBoundary[] = [];
  private stars: THREE.Points;
  private earthRadius: number = 1.5;
  private rotationSpeed: number = 0.0005;
  private autoRotate: boolean = true;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.earthGroup = new THREE.Group();
    this.earthMesh = this.createEarthMesh();
    this.atmosphereMesh = this.createAtmosphere();
    this.stars = this.createStars();
    
    this.setupRenderer(container);
    this.setupCamera();
    this.setupControls();
    this.setupLights();
    
    this.scene.add(this.earthGroup);
    this.earthGroup.add(this.earthMesh);
    this.earthGroup.add(this.atmosphereMesh);
    this.scene.add(this.stars);
  }

  private createEarthMesh(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(this.earthRadius, 64, 64);
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a3a15');
    gradient.addColorStop(0.3, '#2d5a27');
    gradient.addColorStop(0.5, '#3d7a35');
    gradient.addColorStop(0.7, '#2d5a27');
    gradient.addColorStop(1, '#1a3a15');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#8b6914';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 20 + Math.random() * 80;
      
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#6b4914';
      ctx.beginPath();
      ctx.ellipse(x + radius * 0.2, y + radius * 0.1, radius * 0.7, radius * 0.4, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8b6914';
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 10,
      specular: new THREE.Color(0x333333)
    });
    
    return new THREE.Mesh(geometry, material);
  }

  private createAtmosphere(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(this.earthRadius * 1.02, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      shininess: 100
    });
    return new THREE.Mesh(geometry, material);
  }

  private createStars(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    
    for (let i = 0; i < 5000; i++) {
      const radius = 100 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      vertices.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      
      const brightness = 0.5 + Math.random() * 0.5;
      colors.push(brightness, brightness, brightness + Math.random() * 0.2);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    return new THREE.Points(geometry, material);
  }

  private setupRenderer(container: HTMLElement): void {
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a1a, 1);
    container.appendChild(this.renderer.domElement);
  }

  private setupCamera(): void {
    this.camera.position.set(0, 1, 4);
    this.camera.lookAt(0, 0, 0);
  }

  private setupControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.8;
    this.controls.minDistance = this.earthRadius * 1.5;
    this.controls.maxDistance = this.earthRadius * 6;
    this.controls.enablePan = false;
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x2d5a27, 0.3);
    this.scene.add(hemisphereLight);
  }

  public addSeismicPoints(records: SeismicRecord[]): void {
    const recordsToAdd = records.slice(0, 500);
    
    recordsToAdd.forEach(record => {
      if (!this.seismicPoints.has(record.id)) {
        const point = new SeismicPoint(record, this.earthRadius);
        this.seismicPoints.set(record.id, point);
        this.earthGroup.add(point.getGroup());
      }
    });
  }

  public updateVisiblePoints(visibleIds: Set<string>, newIds: Set<string>): void {
    this.seismicPoints.forEach((point, id) => {
      const isVisible = visibleIds.has(id);
      point.setVisible(isVisible);
      
      if (isVisible && newIds.has(id)) {
        point.startBurstAnimation();
      }
    });
  }

  public addPlateBoundaries(boundaries: PlateBoundaryData[]): void {
    boundaries.forEach(data => {
      const boundary = new PlateBoundary(data, this.earthRadius);
      this.plateBoundaries.push(boundary);
      this.earthGroup.add(boundary.getGroup());
    });
  }

  public getEarthGroup(): THREE.Group {
    return this.earthGroup;
  }

  public getSeismicPoints(): Map<string, SeismicPoint> {
    return this.seismicPoints;
  }

  public getPlateBoundaries(): PlateBoundary[] {
    return this.plateBoundaries;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getControls(): OrbitControls {
    return this.controls;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getEarthRadius(): number {
    return this.earthRadius;
  }

  public setAutoRotate(rotate: boolean): void {
    this.autoRotate = rotate;
  }

  public update(currentTime: number): void {
    if (this.autoRotate) {
      this.earthGroup.rotation.y += this.rotationSpeed;
    }
    
    this.seismicPoints.forEach(point => {
      point.update(currentTime);
    });
    
    this.stars.rotation.y += 0.0001;
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public onResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    this.seismicPoints.forEach(point => point.dispose());
    this.plateBoundaries.forEach(boundary => boundary.dispose());
    
    this.scene.remove(this.earthGroup);
    this.scene.remove(this.stars);
    
    this.earthMesh.geometry.dispose();
    (this.earthMesh.material as THREE.Material).dispose();
    this.atmosphereMesh.geometry.dispose();
    (this.atmosphereMesh.material as THREE.Material).dispose();
    this.stars.geometry.dispose();
    (this.stars.material as THREE.Material).dispose();
    
    this.renderer.dispose();
    this.controls.dispose();
  }
}
