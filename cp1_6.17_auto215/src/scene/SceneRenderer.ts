import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CityData, EventType, Continent, FilterConfig, ViewConfig, HeatmapPoint } from '../types/DataTypes';
import { eventBus } from '../event/EventBus';

const EARTH_RADIUS = 5;
const BUBBLE_HOVER_HEIGHT = 0.05;
const MIN_BUBBLE_DIAMETER = 0.2;
const MAX_BUBBLE_DIAMETER = 0.6;
const MIN_AQI = 10;
const MAX_AQI = 200;

function aqiToColor(aqi: number): THREE.Color {
  const t = Math.max(0, Math.min(1, (aqi - MIN_AQI) / (MAX_AQI - MIN_AQI)));
  const green = new THREE.Color(0x00E676);
  const red = new THREE.Color(0xFF1744);
  return green.clone().lerp(red, t);
}

function aqiToDiameter(aqi: number): number {
  const t = Math.max(0, Math.min(1, (aqi - MIN_AQI) / (MAX_AQI - MIN_AQI)));
  return MIN_BUBBLE_DIAMETER + t * (MAX_BUBBLE_DIAMETER - MIN_BUBBLE_DIAMETER);
}

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

interface CityBubble {
  mesh: THREE.Mesh;
  cityData: CityData;
  radius: number;
  halo?: THREE.Mesh;
  haloColor?: THREE.Color;
  pulseTime: number;
}

export class SceneRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private earth: THREE.Mesh | null = null;
  private bubbles: CityBubble[] = [];
  private cityData: CityData[] = [];
  private currentMonthIndex: number = 0;
  private filterConfig: FilterConfig = { continent: 'all', compareCities: [] };
  private heatmapMesh: THREE.Mesh | null = null;
  private heatmapPoints: HeatmapPoint[] = [];
  private windParticles: THREE.Points | null = null;
  private particleVelocities: THREE.Vector3[] = [];
  private showHeatmap: boolean = false;
  private showWindParticles: boolean = false;
  private animationId: number = 0;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredBubble: CityBubble | null = null;
  private isFlying: boolean = false;
  private flyStartTime: number = 0;
  private flyStartPos: THREE.Vector3 = new THREE.Vector3();
  private flyStartTarget: THREE.Vector3 = new THREE.Vector3();
  private flyEndPos: THREE.Vector3 = new THREE.Vector3();
  private flyEndTarget: THREE.Vector3 = new THREE.Vector3();
  private pulseRings: { mesh: THREE.Mesh; startTime: number; color: THREE.Color }[] = [];
  private initialCameraPosition = new THREE.Vector3(0, 0, 12);

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0B0F19);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.copy(this.initialCameraPosition);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 30;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupLights();
    this.createEarth();
    this.setupEventListeners();
    this.animate();

    eventBus.on(EventType.DATA_UPDATED, this.onDataUpdated.bind(this));
    eventBus.on(EventType.TIME_CHANGE, this.onTimeChange.bind(this));
    eventBus.on(EventType.FILTER_CHANGE, this.onFilterChange.bind(this));
    eventBus.on(EventType.VIEW_CHANGE, this.onViewChange.bind(this));
    eventBus.on(EventType.COMPARE_SELECT, this.onCompareSelect.bind(this));
    eventBus.on(EventType.LAYER_CHANGE, this.onLayerChange.bind(this));
    eventBus.on(EventType.RESET_VIEW, this.onResetView.bind(this));
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 5, 10);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4488ff, 0.3, 50);
    pointLight.position.set(-10, -5, -10);
    this.scene.add(pointLight);
  }

  private createEarthTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGradient.addColorStop(0, '#0a1628');
    oceanGradient.addColorStop(0.5, '#0d2137');
    oceanGradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const continents = [
      { x: 1300, y: 200, w: 350, h: 350, rotation: -0.3 },
      { x: 1500, y: 550, w: 250, h: 300, rotation: 0.2 },
      { x: 1000, y: 300, w: 200, h: 150, rotation: 0 },
      { x: 1050, y: 450, w: 150, h: 250, rotation: 0.1 },
      { x: 600, y: 200, w: 400, h: 300, rotation: 0 },
      { x: 600, y: 500, w: 200, h: 350, rotation: 0.1 },
      { x: 250, y: 280, w: 400, h: 280, rotation: -0.1 },
      { x: 250, y: 560, w: 200, h: 200, rotation: 0.2 },
      { x: 1700, y: 700, w: 200, h: 150, rotation: 0.3 },
    ];

    continents.forEach((cont) => {
      ctx.save();
      ctx.translate(cont.x, cont.y);
      ctx.rotate(cont.rotation);

      const landGradient = ctx.createRadialGradient(
        cont.w * 0.3, cont.h * 0.3, 0,
        cont.w * 0.5, cont.h * 0.5, cont.w * 0.6
      );
      landGradient.addColorStop(0, '#1a5a2e');
      landGradient.addColorStop(0.5, '#0d3d1a');
      landGradient.addColorStop(1, '#0a2f14');

      ctx.fillStyle = landGradient;
      ctx.beginPath();
      ctx.ellipse(cont.w / 2, cont.h / 2, cont.w / 2, cont.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(13, 17, 23, 0.15)';
      ctx.beginPath();
      ctx.ellipse(cont.w / 2 - cont.w * 0.1, cont.h / 2 - cont.h * 0.1, cont.w / 2.2, cont.h / 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2 + 0.5;
      ctx.fillStyle = `rgba(100, 150, 100, ${Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  private createEarth(): void {
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const texture = this.createEarthTexture();
    
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpScale: 0.02,
      shininess: 10,
      specular: new THREE.Color(0x111122)
    });

    this.earth = new THREE.Mesh(geometry, material);
    this.scene.add(this.earth);

    const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.02, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.scene.add(atmosphere);

    const gridGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.005, 48, 24);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x2A2A3E,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    this.scene.add(grid);
  }

  private createBubbles(cities: CityData[]): void {
    this.bubbles.forEach(bubble => {
      this.scene.remove(bubble.mesh);
      if (bubble.halo) this.scene.remove(bubble.halo);
    });
    this.bubbles = [];

    cities.forEach((city) => {
      const aqi = city.monthlyData[0]?.aqi || 50;
      const diameter = aqiToDiameter(aqi);
      const color = aqiToColor(aqi);

      const position = latLonToVector3(city.latitude, city.longitude, EARTH_RADIUS + BUBBLE_HOVER_HEIGHT + diameter / 2);

      const geometry = new THREE.SphereGeometry(diameter / 2, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
        emissive: color,
        emissiveIntensity: 0.6
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.userData = { cityId: city.id };

      this.scene.add(mesh);
      this.bubbles.push({ mesh, cityData: city, radius: diameter / 2, pulseTime: 0 });
    });
  }

  private updateBubbles(monthIndex: number): void {
    this.bubbles.forEach(bubble => {
      const city = this.cityData.find(c => c.id === bubble.cityData.id);
      if (!city) return;

      const record = city.monthlyData[monthIndex];
      if (!record) return;

      const targetDiameter = aqiToDiameter(record.aqi);
      const targetColor = aqiToColor(record.aqi);

      const currentDiameter = bubble.radius * 2;
      const newDiameter = currentDiameter + (targetDiameter - currentDiameter) * 0.15;
      
      bubble.mesh.geometry.dispose();
      bubble.mesh.geometry = new THREE.SphereGeometry(newDiameter / 2, 16, 16);
      bubble.radius = newDiameter / 2;

      const material = bubble.mesh.material as THREE.MeshPhongMaterial;
      material.color.lerp(targetColor, 0.15);
      material.emissive.lerp(targetColor, 0.15);

      const position = latLonToVector3(city.latitude, city.longitude, EARTH_RADIUS + BUBBLE_HOVER_HEIGHT + newDiameter / 2);
      bubble.mesh.position.copy(position);

      bubble.cityData.monthlyData = [record];
    });
  }

  private createHeatmap(): void {
    if (this.heatmapMesh) {
      this.scene.remove(this.heatmapMesh);
      this.heatmapMesh.geometry.dispose();
      (this.heatmapMesh.material as THREE.Material).dispose();
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.heatmapPoints.forEach(point => {
      const x = ((point.longitude + 180) / 360) * canvas.width;
      const y = ((90 - point.latitude) / 180) * canvas.height;
      const radius = 20 + point.intensity * 30;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      
      const r = Math.floor(255 * Math.min(1, point.intensity * 2));
      const g = Math.floor(255 * Math.min(1, (1 - Math.abs(point.intensity - 0.5) * 2)));
      const b = Math.floor(255 * Math.max(0, 1 - point.intensity * 2));
      
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${point.intensity * 0.6})`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${point.intensity * 0.3})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const geometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.015, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.heatmapMesh = new THREE.Mesh(geometry, material);
    this.heatmapMesh.visible = this.showHeatmap;
    this.scene.add(this.heatmapMesh);
  }

  private createWindParticles(): void {
    if (this.windParticles) {
      this.scene.remove(this.windParticles);
      this.windParticles.geometry.dispose();
      (this.windParticles.material as THREE.Material).dispose();
    }

    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    this.particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      const lat = (Math.random() - 0.5) * 160;
      const lon = (Math.random() - 0.5) * 360;
      const height = EARTH_RADIUS * 1.03 + Math.random() * 0.3;

      const pos = latLonToVector3(lat, lon, height);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const tangent = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize().multiplyScalar(0.02);
      this.particleVelocities.push(tangent);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.windParticles = new THREE.Points(geometry, material);
    this.windParticles.visible = this.showWindParticles;
    this.scene.add(this.windParticles);
  }

  private updateWindParticles(deltaTime: number): void {
    if (!this.windParticles || !this.windParticles.visible) return;

    const positions = this.windParticles.geometry.attributes.position.array as Float32Array;
    const speed = 5 * deltaTime;

    for (let i = 0; i < positions.length / 3; i++) {
      const i3 = i * 3;
      let pos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      
      const velocity = this.particleVelocities[i];
      
      const tangent = new THREE.Vector3().crossVectors(
        pos.clone().normalize(),
        velocity
      ).normalize();
      
      pos.add(tangent.multiplyScalar(speed));
      
      const currentHeight = pos.length();
      const targetHeight = EARTH_RADIUS * 1.03 + Math.sin(i * 0.1 + Date.now() * 0.001) * 0.15;
      pos.normalize().multiplyScalar(targetHeight);

      positions[i3] = pos.x;
      positions[i3 + 1] = pos.y;
      positions[i3 + 2] = pos.z;
    }

    this.windParticles.geometry.attributes.position.needsUpdate = true;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  private onResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  private onClick(event: MouseEvent): void {
    if (this.isFlying) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const meshes = this.bubbles
      .filter(b => b.mesh.visible)
      .map(b => b.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const cityId = intersects[0].object.userData.cityId;
      const bubble = this.bubbles.find(b => b.cityData.id === cityId);
      
      if (bubble) {
        eventBus.emit(EventType.CITY_CLICK, bubble.cityData);
        this.flyToCity(bubble);
        this.createPulseRing(bubble);
      }
    }
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const meshes = this.bubbles
      .filter(b => b.mesh.visible)
      .map(b => b.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const cityId = intersects[0].object.userData.cityId;
      const bubble = this.bubbles.find(b => b.cityData.id === cityId);
      
      if (bubble && bubble !== this.hoveredBubble) {
        if (this.hoveredBubble) {
          const mat = this.hoveredBubble.mesh.material as THREE.MeshPhongMaterial;
          mat.emissiveIntensity = 0.3;
        }
        this.hoveredBubble = bubble;
        const mat = bubble.mesh.material as THREE.MeshPhongMaterial;
        mat.emissiveIntensity = 0.6;
        document.body.style.cursor = 'pointer';
      }
    } else if (this.hoveredBubble) {
      const mat = this.hoveredBubble.mesh.material as THREE.MeshPhongMaterial;
      mat.emissiveIntensity = 0.3;
      this.hoveredBubble = null;
      document.body.style.cursor = 'default';
    }
  }

  private flyToCity(bubble: CityBubble): void {
    const cityPos = bubble.mesh.position.clone();
    const direction = cityPos.clone().normalize();
    
    const distance = 2.5;
    this.flyEndPos.copy(direction.multiplyScalar(EARTH_RADIUS + distance + bubble.radius));
    this.flyEndTarget.copy(cityPos);
    
    this.flyStartPos.copy(this.camera.position);
    this.flyStartTarget.copy(this.controls.target);
    
    this.isFlying = true;
    this.flyStartTime = performance.now();
    this.controls.enabled = false;
  }

  private updateFlyAnimation(currentTime: number): void {
    if (!this.isFlying) return;

    const duration = 2000;
    const elapsed = currentTime - this.flyStartTime;
    const t = Math.min(1, elapsed / duration);

    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const midHeight = Math.max(this.flyStartPos.length(), this.flyEndPos.length()) * 1.3;
    const midPoint = new THREE.Vector3()
      .addVectors(this.flyStartPos, this.flyEndPos)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(midHeight);

    const p0 = this.flyStartPos;
    const p1 = midPoint;
    const p2 = midPoint;
    const p3 = this.flyEndPos;

    const oneMinusT = 1 - easeT;
    const position = new THREE.Vector3(
      oneMinusT * oneMinusT * oneMinusT * p0.x +
      3 * oneMinusT * oneMinusT * easeT * p1.x +
      3 * oneMinusT * easeT * easeT * p2.x +
      easeT * easeT * easeT * p3.x,
      oneMinusT * oneMinusT * oneMinusT * p0.y +
      3 * oneMinusT * oneMinusT * easeT * p1.y +
      3 * oneMinusT * easeT * easeT * p2.y +
      easeT * easeT * easeT * p3.y,
      oneMinusT * oneMinusT * oneMinusT * p0.z +
      3 * oneMinusT * oneMinusT * easeT * p1.z +
      3 * oneMinusT * easeT * easeT * p2.z +
      easeT * easeT * easeT * p3.z
    );

    this.camera.position.copy(position);
    this.controls.target.lerpVectors(this.flyStartTarget, this.flyEndTarget, easeT);

    if (t >= 1) {
      this.isFlying = false;
      this.controls.enabled = true;
    }
  }

  private createPulseRing(bubble: CityBubble): void {
    const color = (bubble.mesh.material as THREE.MeshPhongMaterial).color.clone();
    
    const geometry = new THREE.RingGeometry(0.25, 0.27, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(bubble.mesh.position);
    ring.lookAt(new THREE.Vector3(0, 0, 0));

    this.scene.add(ring);
    this.pulseRings.push({ mesh: ring, startTime: performance.now(), color });
  }

  private updatePulseRings(currentTime: number): void {
    this.pulseRings = this.pulseRings.filter(ring => {
      const elapsed = currentTime - ring.startTime;
      const duration = 1500;
      const t = elapsed / duration;

      if (t >= 1) {
        this.scene.remove(ring.mesh);
        ring.mesh.geometry.dispose();
        (ring.mesh.material as THREE.Material).dispose();
        return false;
      }

      const innerRadius = 0.25 + t * 1.0;
      const outerRadius = 0.27 + t * 1.0;
      
      ring.mesh.geometry.dispose();
      ring.mesh.geometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
      
      const material = ring.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 1 - t;

      return true;
    });
  }

  private updateCompareHalos(): void {
    const haloColors = [
      new THREE.Color(0xFF6B6B),
      new THREE.Color(0x4ECDC4),
      new THREE.Color(0x45B7D1)
    ];

    this.bubbles.forEach(bubble => {
      if (bubble.halo) {
        this.scene.remove(bubble.halo);
        bubble.halo.geometry.dispose();
        (bubble.halo.material as THREE.Material).dispose();
        bubble.halo = undefined;
      }
    });

    this.filterConfig.compareCities.forEach((cityId, index) => {
      const bubble = this.bubbles.find(b => b.cityData.id === cityId);
      if (!bubble) return;

      const radius = bubble.radius * 1.5;
      const geometry = new THREE.RingGeometry(radius * 0.9, radius, 32);
      const material = new THREE.MeshBasicMaterial({
        color: haloColors[index % 3],
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });

      const halo = new THREE.Mesh(geometry, material);
      halo.position.copy(bubble.mesh.position);
      halo.lookAt(new THREE.Vector3(0, 0, 0));
      halo.userData = { cityId, haloIndex: index };

      this.scene.add(halo);
      bubble.halo = halo;
      bubble.haloColor = haloColors[index % 3];
    });
  }

  private updateHalosAnimation(time: number): void {
    this.bubbles.forEach(bubble => {
      if (!bubble.halo || !bubble.haloColor) return;

      const pulse = (Math.sin(time * 0.003 + bubble.mesh.position.x) + 1) / 2;
      const material = bubble.halo.material as THREE.MeshBasicMaterial;
      material.opacity = 0.5 + pulse * 0.5;
      
      const baseRadius = bubble.radius * 1.5;
      const pulseRadius = baseRadius * (1 + pulse * 0.15);
      
      bubble.halo.geometry.dispose();
      bubble.halo.geometry = new THREE.RingGeometry(pulseRadius * 0.85, pulseRadius, 32);
    });
  }

  private onDataUpdated(data: CityData[]): void {
    this.cityData = data;
    this.createBubbles(data);
    eventBus.emit(EventType.SCENE_READY);
  }

  private onTimeChange(monthIndex: number): void {
    this.currentMonthIndex = monthIndex;
    this.updateBubbles(monthIndex);
  }

  private onFilterChange(config: FilterConfig): void {
    this.filterConfig = config;
    
    this.bubbles.forEach(bubble => {
      const matchesContinent = config.continent === 'all' || bubble.cityData.continent === config.continent;
      bubble.mesh.visible = matchesContinent;
    });

    this.updateCompareHalos();
  }

  private onViewChange(viewConfig: ViewConfig): void {
    this.flyEndPos.set(viewConfig.cameraPosition.x, viewConfig.cameraPosition.y, viewConfig.cameraPosition.z);
    this.flyEndTarget.set(viewConfig.targetPosition.x, viewConfig.targetPosition.y, viewConfig.targetPosition.z);
    this.flyStartPos.copy(this.camera.position);
    this.flyStartTarget.copy(this.controls.target);
    this.isFlying = true;
    this.flyStartTime = performance.now();
    this.controls.enabled = false;
  }

  private onCompareSelect(cityIds: string[]): void {
    this.filterConfig.compareCities = cityIds;
    this.updateCompareHalos();
  }

  private onLayerChange(layers: { heatmap: boolean; windParticles: boolean }): void {
    this.showHeatmap = layers.heatmap;
    this.showWindParticles = layers.windParticles;

    if (this.showHeatmap && !this.heatmapMesh) {
      this.createHeatmap();
    } else if (this.heatmapMesh) {
      this.heatmapMesh.visible = this.showHeatmap;
    }

    if (this.showWindParticles && !this.windParticles) {
      this.createWindParticles();
    } else if (this.windParticles) {
      this.windParticles.visible = this.showWindParticles;
    }
  }

  private onResetView(): void {
    this.flyStartPos.copy(this.camera.position);
    this.flyStartTarget.copy(this.controls.target);
    this.flyEndPos.copy(this.initialCameraPosition);
    this.flyEndTarget.set(0, 0, 0);
    this.isFlying = true;
    this.flyStartTime = performance.now();
    this.controls.enabled = false;
  }

  private lastTime: number = 0;

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (!this.isFlying) {
      this.controls.update();
    }

    this.updateFlyAnimation(currentTime);
    this.updatePulseRings(currentTime);
    this.updateHalosAnimation(currentTime);
    this.updateWindParticles(deltaTime);

    eventBus.emit(EventType.ANIMATION_FRAME, deltaTime);

    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    this.controls.dispose();
    
    window.removeEventListener('resize', this.onResize.bind(this));
    
    this.bubbles.forEach(bubble => {
      bubble.mesh.geometry.dispose();
      (bubble.mesh.material as THREE.Material).dispose();
    });

    if (this.heatmapMesh) {
      this.heatmapMesh.geometry.dispose();
      (this.heatmapMesh.material as THREE.Material).dispose();
    }
  }
}

export default SceneRenderer;
