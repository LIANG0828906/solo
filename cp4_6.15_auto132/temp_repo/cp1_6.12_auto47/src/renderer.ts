import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { StationData } from './dataSimulator';

export interface RendererCallbacks {
  onStationClick: (stationId: string | null) => void;
  onStationHover: (station: StationData | null, x: number, y: number) => void;
}

interface StationMesh {
  id: string;
  data: StationData;
  group: THREE.Group;
  cylinder: THREE.Mesh;
  halo: THREE.Mesh;
  targetHeight: number;
  currentHeight: number;
  targetColor: THREE.Color;
  currentColor: THREE.Color;
}

const AQI_COLORS: Array<{ threshold: number; color: THREE.Color }> = [
  { threshold: 50, color: new THREE.Color(0x00e400) },
  { threshold: 100, color: new THREE.Color(0xffff00) },
  { threshold: 150, color: new THREE.Color(0xff7e00) },
  { threshold: 200, color: new THREE.Color(0xff0000) },
  { threshold: 300, color: new THREE.Color(0x8f3f97) },
];

function getAqiColor(aqi: number): THREE.Color {
  if (aqi <= AQI_COLORS[0].threshold) {
    return AQI_COLORS[0].color.clone();
  }
  for (let i = 1; i < AQI_COLORS.length; i++) {
    const prev = AQI_COLORS[i - 1];
    const curr = AQI_COLORS[i];
    if (aqi <= curr.threshold) {
      const t = (aqi - prev.threshold) / (curr.threshold - prev.threshold);
      return prev.color.clone().lerp(curr.color, t);
    }
  }
  return AQI_COLORS[AQI_COLORS.length - 1].color.clone();
}

function aqiToHeight(aqi: number): number {
  return Math.min(500, (aqi / 300) * 500);
}

function latLngToPosition(lat: number, lng: number): THREE.Vector3 {
  const latMin = 39.65;
  const latMax = 40.30;
  const lngMin = 116.05;
  const lngMax = 116.80;
  const x = ((lng - lngMin) / (lngMax - lngMin) - 0.5) * 800;
  const z = ((latMax - lat) / (latMax - latMin) - 0.5) * 800;
  return new THREE.Vector3(x, 0, z);
}

export class AirQualityRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private stationMeshes: Map<string, StationMesh> = new Map();
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private callbacks: RendererCallbacks;
  private selectedStationId: string | null = null;
  private hoveredStationId: string | null = null;
  private animationId: number | null = null;
  private startTime: number;
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement, callbacks: RendererCallbacks) {
    this.container = container;
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.startTime = performance.now();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      5000
    );
    this.camera.position.set(0, 700, 900);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x0a0e1a, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 300;
    this.controls.maxDistance = 2500;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.target.set(0, 0, 0);

    this.setupLights();
    this.setupEnvironment();
    this.setupGround();
    this.setupEventListeners();
    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(300, 600, 400);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -800;
    directionalLight.shadow.camera.right = 800;
    directionalLight.shadow.camera.top = 800;
    directionalLight.shadow.camera.bottom = -800;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 2000;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    fillLight.position.set(-300, 400, -200);
    this.scene.add(fillLight);
  }

  private setupEnvironment(): void {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 2000 + Math.random() * 1000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)) * 0.6 + 200;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.5,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: false,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);

    const skyGeo = new THREE.SphereGeometry(3000, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x000428) },
        bottomColor: { value: new THREE.Color(0x0a0e1a) },
        offset: { value: 400 },
        exponent: { value: 0.6 },
      },
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
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  private setupGround(): void {
    const groundGeo = new THREE.PlaneGeometry(1200, 1200, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0d1424,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(1200, 40, 0x3a4a6a, 0x1e2a44);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.6;
    this.scene.add(gridHelper);

    const outerGrid = new THREE.GridHelper(2000, 60, 0x1a2540, 0x101830);
    (outerGrid.material as THREE.Material).transparent = true;
    (outerGrid.material as THREE.Material).opacity = 0.3;
    outerGrid.position.y = -1;
    this.scene.add(outerGrid);
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('click', this.onClick.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const cylinders = Array.from(this.stationMeshes.values()).map((sm) => sm.cylinder);
    const intersects = this.raycaster.intersectObjects(cylinders);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const stationMesh = Array.from(this.stationMeshes.values()).find(
        (sm) => sm.cylinder === mesh
      );
      if (stationMesh && stationMesh.id !== this.hoveredStationId) {
        this.hoveredStationId = stationMesh.id;
        this.callbacks.onStationHover(stationMesh.data, event.clientX, event.clientY);
        this.canvas.style.cursor = 'pointer';
      } else if (stationMesh) {
        this.callbacks.onStationHover(stationMesh.data, event.clientX, event.clientY);
      }
    } else if (this.hoveredStationId !== null) {
      this.hoveredStationId = null;
      this.callbacks.onStationHover(null, 0, 0);
      this.canvas.style.cursor = 'grab';
    }
  }

  private onClick(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const cylinders = Array.from(this.stationMeshes.values()).map((sm) => sm.cylinder);
    const intersects = this.raycaster.intersectObjects(cylinders);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const stationMesh = Array.from(this.stationMeshes.values()).find(
        (sm) => sm.cylinder === mesh
      );
      if (stationMesh) {
        this.setSelectedStation(stationMesh.id);
        this.callbacks.onStationClick(stationMesh.id);
      }
    } else {
      this.setSelectedStation(null);
      this.callbacks.onStationClick(null);
    }
  }

  private setSelectedStation(stationId: string | null): void {
    this.selectedStationId = stationId;
    this.stationMeshes.forEach((sm) => {
      const isSelected = stationId === null || sm.id === stationId;
      const mat = sm.cylinder.material as THREE.MeshStandardMaterial;
      mat.transparent = !isSelected;
      mat.opacity = isSelected ? 1.0 : 0.3;
      const haloMat = sm.halo.material as THREE.MeshBasicMaterial;
      haloMat.transparent = true;
      haloMat.opacity = isSelected ? 0.8 : 0.2;
    });
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public createStation(data: StationData): void {
    if (this.stationMeshes.has(data.id)) return;

    const position = latLngToPosition(data.lat, data.lng);
    const group = new THREE.Group();
    group.position.copy(position);

    const initialHeight = 1;
    const cylinderGeo = new THREE.CylinderGeometry(14, 18, initialHeight, 8, 1, false);
    const color = getAqiColor(data.aqi);
    const cylinderMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.6,
      transparent: false,
    });
    const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    cylinder.position.y = initialHeight / 2;
    group.add(cylinder);

    const haloGeo = new THREE.SphereGeometry(22, 16, 8);
    const haloMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.y = 0;
    group.add(halo);

    const baseGeo = new THREE.CylinderGeometry(22, 26, 4, 8, 1, false);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x2a3a5a,
      roughness: 0.6,
      metalness: 0.4,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 2;
    base.receiveShadow = true;
    group.add(base);

    this.scene.add(group);

    this.stationMeshes.set(data.id, {
      id: data.id,
      data,
      group,
      cylinder,
      halo,
      targetHeight: aqiToHeight(data.aqi),
      currentHeight: initialHeight,
      targetColor: color.clone(),
      currentColor: color.clone(),
    });
  }

  public updateStation(data: StationData): void {
    const sm = this.stationMeshes.get(data.id);
    if (!sm) {
      this.createStation(data);
      return;
    }
    sm.data = data;
    sm.targetHeight = aqiToHeight(data.aqi);
    sm.targetColor = getAqiColor(data.aqi);
  }

  public updateAllStations(dataList: StationData[]): void {
    dataList.forEach((data) => this.updateStation(data));
  }

  private lerp(current: number, target: number, factor: number): number {
    return current + (target - current) * factor;
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    const elapsed = (performance.now() - this.startTime) / 1000;
    const animFactor = 0.08;

    this.stationMeshes.forEach((sm) => {
      sm.currentHeight = this.lerp(sm.currentHeight, sm.targetHeight, animFactor);
      sm.currentColor.lerp(sm.targetColor, animFactor);

      const geo = sm.cylinder.geometry as THREE.CylinderGeometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      const halfHeight = sm.currentHeight / 2;
      for (let i = 0; i < positions.length; i += 3) {
        const y = positions[i + 1];
        if (y > 0) {
          positions[i + 1] = halfHeight;
        } else if (y < 0) {
          positions[i + 1] = -halfHeight;
        }
      }
      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
      sm.cylinder.position.y = halfHeight;

      const mat = sm.cylinder.material as THREE.MeshStandardMaterial;
      mat.color.copy(sm.currentColor);
      mat.emissive.copy(sm.currentColor);

      const haloScale = 1 + Math.sin(elapsed * Math.PI + sm.group.position.x * 0.01) * 0.15;
      sm.halo.scale.setScalar(haloScale);
      sm.halo.position.y = sm.currentHeight + 10;
      const haloMat = sm.halo.material as THREE.MeshBasicMaterial;
      haloMat.color.copy(sm.currentColor);
      const baseOpacity = this.selectedStationId === null || sm.id === this.selectedStationId ? 0.6 : 0.15;
      haloMat.opacity = baseOpacity + Math.sin(elapsed * Math.PI) * 0.2;
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize.bind(this));
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.removeEventListener('click', this.onClick.bind(this));
    this.renderer.dispose();
    this.controls.dispose();

    this.stationMeshes.forEach((sm) => {
      (sm.cylinder.geometry as THREE.BufferGeometry).dispose();
      (sm.cylinder.material as THREE.Material).dispose();
      (sm.halo.geometry as THREE.BufferGeometry).dispose();
      (sm.halo.material as THREE.Material).dispose();
    });
  }
}
