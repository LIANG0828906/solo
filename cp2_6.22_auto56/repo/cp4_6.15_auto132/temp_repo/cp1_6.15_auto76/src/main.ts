import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OceanFlowRenderer } from './oceanFlow';
import { HeatmapRenderer } from './heatmap';
import { UIController } from './panel';
import type { OceanCurrent, TemperatureGrid } from './types';

class OceanVisualizationApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private earth: THREE.Mesh;
  private earthGroup: THREE.Group;
  private stars: THREE.Points;
  private oceanFlow: OceanFlowRenderer;
  private heatmap: HeatmapRenderer;
  private uiController: UIController;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private container: HTMLElement;
  private clock: THREE.Clock;
  private initialCameraPosition: THREE.Vector3;
  private isAnimatingReset: boolean = false;
  private resetStartTime: number = 0;
  private resetDuration: number = 1000;
  private targetCameraPosition: THREE.Vector3;
  private targetTargetPosition: THREE.Vector3;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    this.container = container;

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = new THREE.Scene();
    
    const initialDist = 4;
    this.initialCameraPosition = new THREE.Vector3(0, 1.2, initialDist);
    this.targetCameraPosition = this.initialCameraPosition.clone();
    this.targetTargetPosition = new THREE.Vector3(0, 0, 0);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.copy(this.initialCameraPosition);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.earthGroup = new THREE.Group();
    this.scene.add(this.earthGroup);

    const earthRadius = 1.5;
    this.earth = this.createEarth(earthRadius);
    this.earthGroup.add(this.earth);

    this.addAtmosphere(earthRadius);
    this.stars = this.createStars();
    this.scene.add(this.stars);

    this.addLighting();

    this.oceanFlow = new OceanFlowRenderer(this.earthGroup, earthRadius);
    this.heatmap = new HeatmapRenderer(this.earthGroup, earthRadius);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 0.8;
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 10;
    this.controls.enablePan = false;

    this.uiController = new UIController(
      document.getElementById('app')!,
      this.oceanFlow,
      this.heatmap,
      (currents: OceanCurrent[], tempGrid: TemperatureGrid) => {
        this.onDataUpdate(currents, tempGrid);
      },
      () => this.resetView()
    );

    this.setupEventListeners();
    this.animate();
  }

  private createEarth(radius: number): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(radius, 128, 64);
    
    const earthCanvas = this.createEarthTexture();
    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;
    
    const bumpCanvas = this.createBumpTexture();
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    
    const specCanvas = this.createSpecularTexture();
    const specTexture = new THREE.CanvasTexture(specCanvas);

    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.02,
      specularMap: specTexture,
      specular: new THREE.Color(0x333355),
      shininess: 15
    });

    return new THREE.Mesh(geometry, material);
  }

  private createEarthTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0A2A5E');
    gradient.addColorStop(0.3, '#0E4D8C');
    gradient.addColorStop(0.5, '#1565A0');
    gradient.addColorStop(0.7, '#0E4D8C');
    gradient.addColorStop(1, '#0A2A5E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.drawContinent(ctx, canvas.width, canvas.height, 'northAmerica', [
      { x: 0.08, y: 0.18, w: 0.18, h: 0.25 },
      { x: 0.12, y: 0.12, w: 0.14, h: 0.12 },
      { x: 0.20, y: 0.30, w: 0.08, h: 0.18 }
    ]);

    this.drawContinent(ctx, canvas.width, canvas.height, 'southAmerica', [
      { x: 0.26, y: 0.42, w: 0.08, h: 0.15 },
      { x: 0.28, y: 0.55, w: 0.05, h: 0.18 }
    ]);

    this.drawContinent(ctx, canvas.width, canvas.height, 'europe', [
      { x: 0.46, y: 0.22, w: 0.10, h: 0.12 }
    ]);

    this.drawContinent(ctx, canvas.width, canvas.height, 'africa', [
      { x: 0.46, y: 0.35, w: 0.12, h: 0.15 },
      { x: 0.47, y: 0.48, w: 0.10, h: 0.18 }
    ]);

    this.drawContinent(ctx, canvas.width, canvas.height, 'asia', [
      { x: 0.56, y: 0.18, w: 0.22, h: 0.18 },
      { x: 0.68, y: 0.26, w: 0.12, h: 0.14 },
      { x: 0.62, y: 0.38, w: 0.14, h: 0.10 }
    ]);

    this.drawContinent(ctx, canvas.width, canvas.height, 'australia', [
      { x: 0.78, y: 0.58, w: 0.08, h: 0.07 }
    ]);

    this.drawContinent(ctx, canvas.width, canvas.height, 'antarctica', [
      { x: 0.0, y: 0.90, w: 1.0, h: 0.10 }
    ]);

    this.drawContinent(ctx, canvas.width, canvas.height, 'greenland', [
      { x: 0.38, y: 0.10, w: 0.06, h: 0.10 }
    ]);

    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 3 + 1;
      const brightness = 140 + Math.random() * 60;
      ctx.fillStyle = `rgba(${brightness}, ${brightness + 20}, ${brightness + 50}, 0.03)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const iceGradient = ctx.createLinearGradient(0, 0, 0, 100);
    iceGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    iceGradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
    ctx.fillStyle = iceGradient;
    ctx.fillRect(0, 0, canvas.width, 80);

    const southIce = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
    southIce.addColorStop(0, 'rgba(200, 220, 255, 0)');
    southIce.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
    ctx.fillStyle = southIce;
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    return canvas;
  }

  private drawContinent(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    name: string,
    regions: { x: number; y: number; w: number; h: number }[]
  ): void {
    for (const region of regions) {
      const baseX = region.x * w;
      const baseY = region.y * h;
      const regionW = region.w * w;
      const regionH = region.h * h;

      for (let i = 0; i < 3; i++) {
        const offsetX = baseX + (Math.random() - 0.5) * regionW * 0.1;
        const offsetY = baseY + (Math.random() - 0.5) * regionH * 0.1;
        const rw = regionW * (0.9 + Math.random() * 0.2);
        const rh = regionH * (0.9 + Math.random() * 0.2);

        ctx.fillStyle = `rgba(34, ${85 + i * 20}, ${55 + i * 10}, ${0.7 + i * 0.1})`;
        ctx.beginPath();
        
        const steps = 50;
        for (let j = 0; j <= steps; j++) {
          const t = j / steps;
          const angle = t * Math.PI * 2;
          const radius = (1 + Math.sin(t * 8) * 0.15 + Math.cos(t * 6 + i) * 0.1) * 0.5;
          const px = offsetX + rw * 0.5 + Math.cos(angle) * radius * rw;
          const py = offsetY + rh * 0.5 + Math.sin(angle) * radius * rh * 1.2;
          
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }

      const midX = baseX + regionW * 0.5;
      const midY = baseY + regionH * 0.5;
      for (let i = 0; i < 30; i++) {
        const x = midX + (Math.random() - 0.5) * regionW * 0.8;
        const y = midY + (Math.random() - 0.5) * regionH * 0.8;
        const size = 2 + Math.random() * 8;
        const greenBase = 80 + Math.random() * 60;
        const brownness = Math.random();
        const r = Math.floor(40 + brownness * 40);
        const g = Math.floor(greenBase - brownness * 20);
        const b = Math.floor(30 + (1 - brownness) * 20);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.2 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(180, 170, 140, 0.15)';
      for (let i = 0; i < 8; i++) {
        const sx = baseX + Math.random() * regionW;
        const sy = baseY + regionH - Math.random() * regionH * 0.3;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 8 + Math.random() * 15, 4 + Math.random() * 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private createBumpTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 4 + 1;
      const value = 128 + (Math.random() - 0.5) * 60;
      ctx.fillStyle = `rgba(${value}, ${value}, ${value}, 0.05)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  }

  private createSpecularTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const region of [
      [0.08, 0.15, 0.20, 0.50],
      [0.26, 0.42, 0.08, 0.30],
      [0.46, 0.22, 0.22, 0.45],
      [0.56, 0.18, 0.28, 0.35],
      [0.78, 0.58, 0.08, 0.07]
    ]) {
      ctx.fillStyle = '#333333';
      ctx.fillRect(
        region[0] * canvas.width,
        region[1] * canvas.height,
        region[2] * canvas.width,
        region[3] * canvas.height
      );
    }

    return canvas;
  }

  private addAtmosphere(radius: number): void {
    const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.15, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.earthGroup.add(atmosphere);
  }

  private createStars(): THREE.Points {
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const r = 80 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const starColor = new THREE.Color();
      starColor.setHSL(0.55 + Math.random() * 0.15, 0.3, 0.7 + Math.random() * 0.3);
      colors[i * 3] = starColor.r;
      colors[i * 3 + 1] = starColor.g;
      colors[i * 3 + 2] = starColor.b;

      sizes[i] = Math.random() * 1.5 + 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    return new THREE.Points(geometry, material);
  }

  private addLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4488FF, 0.3);
    fillLight.position.set(-3, 1, -3);
    this.scene.add(fillLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());

    this.renderer.domElement.addEventListener('click', (e) => this.onEarthClick(e));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onEarthClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.earth);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const latLng = this.vector3ToLatLng(point);
      const info = this.uiController.getLocationInfo(latLng.lat, latLng.lng);
      
      const screenX = event.clientX;
      const screenY = event.clientY;
      this.uiController.showInfoCard(latLng.lat, latLng.lng, screenX, screenY, info);
    }
  }

  private vector3ToLatLng(point: THREE.Vector3): { lat: number; lng: number } {
    const len = point.length();
    const normalized = point.clone().normalize();
    
    const lat = 90 - Math.acos(normalized.y) * (180 / Math.PI);
    let lng = Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI) - 180;
    
    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;
    
    return {
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000
    };
  }

  private onDataUpdate(currents: OceanCurrent[], tempGrid: TemperatureGrid): void {
    this.oceanFlow.updateCurrents(currents);
    this.heatmap.updateTemperatureData(tempGrid.data);
  }

  private resetView(): void {
    this.isAnimatingReset = true;
    this.resetStartTime = performance.now();
    this.targetCameraPosition = this.initialCameraPosition.clone();
    this.targetTargetPosition = new THREE.Vector3(0, 0, 0);
  }

  private animateReset(now: number): void {
    const elapsed = now - this.resetStartTime;
    if (elapsed >= this.resetDuration) {
      this.isAnimatingReset = false;
      this.camera.position.copy(this.initialCameraPosition);
      this.controls.target.set(0, 0, 0);
      return;
    }

    const t = elapsed / this.resetDuration;
    const eased = 1 - Math.pow(1 - t, 3);

    const startPos = this.camera.position.clone();
    this.camera.position.lerpVectors(startPos, this.initialCameraPosition, eased);
    
    const startTarget = this.controls.target.clone();
    this.controls.target.lerpVectors(startTarget, new THREE.Vector3(0, 0, 0), eased);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    if (this.isAnimatingReset) {
      this.animateReset(now);
    }

    this.controls.update();
    this.oceanFlow.update(delta * 1000);
    this.heatmap.update(now);

    this.stars.rotation.y += delta * 0.005;

    this.renderer.render(this.scene, this.camera);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OceanVisualizationApp('canvas-container');
});
