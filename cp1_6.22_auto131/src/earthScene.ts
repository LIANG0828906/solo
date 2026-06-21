import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CityClimate, HoverInfo, ViewMode, GlobalStats, MonthlyRecord } from './types';
import { generateClimateData, getMonthlyDataByYear } from './data/climateData';

interface BarData {
  cityId: string;
  cityName: string;
  month: number;
  targetHeight: number;
  currentHeight: number;
  targetTemp: number;
  currentTemp: number;
  targetPrecip: number;
  currentPrecip: number;
}

export class EarthScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private earthGroup: THREE.Group;
  private barsGroup: THREE.Group;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private climateData: CityClimate[];
  private barMeshes: Map<THREE.Mesh, BarData> = new Map();
  private barEdgeMeshes: Map<THREE.Mesh, THREE.LineSegments> = new Map();
  private hoveredMesh: THREE.Mesh | null = null;
  private currentYear: number = 2015;
  private viewMode: ViewMode = 'auto-rotate';
  private animationFrameId: number = 0;
  private lastTime: number = 0;
  private autoRotateSpeed: number = (2 * Math.PI) / 10;
  private lerpDuration: number = 0.6;
  private lerpStartTime: number = 0;
  private isAnimating: boolean = false;
  private barGeometry: THREE.BoxGeometry;
  private onHoverChange: ((info: HoverInfo) => void) | null = null;
  private onCityClick: ((cityId: string) => void) | null = null;
  private compareMode: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.earthGroup = new THREE.Group();
    this.barsGroup = new THREE.Group();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.climateData = generateClimateData();
    this.barGeometry = new THREE.BoxGeometry(0.15, 1, 0.15);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.setupRenderer();
    this.setupCamera();
    this.setupControls();
    this.setupLights();
    this.setupEarth();
    this.setupBars();
    this.setupEvents();
    this.scene.add(this.earthGroup);
    this.scene.add(this.barsGroup);
  }

  private setupRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
  }

  private setupCamera(): void {
    this.camera.position.set(0, 3, 14);
    this.camera.lookAt(0, 0, 0);
  }

  private setupControls(): void {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 7;
    this.controls.maxDistance = 42;
    this.controls.enablePan = true;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = this.autoRotateSpeed * (180 / Math.PI) / 6;
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 15, 10);
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x4fc3f7, 0.3);
    rimLight.position.set(-10, -5, -10);
    this.scene.add(rimLight);
  }

  private setupEarth(): void {
    const radius = 5;
    const sphereGeo = new THREE.SphereGeometry(radius, 24, 16);

    const landColors: [number, number] = [0x2e5c4e, 0x4a7c6e];
    const oceanColor = 0x0b3d5b;

    const colors = new Float32Array(sphereGeo.attributes.position.count * 3);
    const positions = sphereGeo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const len = Math.sqrt(x * x + y * y + z * z);
      const nx = x / len;
      const ny = y / len;
      const nz = z / len;

      const noise = this.simplexNoise2D(nx * 2 + nz * 1.5, ny * 2.5);
      const isLand = noise > 0.15 || (Math.abs(ny) > 0.7 && noise > -0.1);

      let color: THREE.Color;
      if (isLand) {
        const t = (noise + 1) / 2;
        const c1 = new THREE.Color(landColors[0]);
        const c2 = new THREE.Color(landColors[1]);
        color = c1.lerp(c2, t);
      } else {
        color = new THREE.Color(oceanColor);
        const depthDarken = 0.85 + Math.abs(ny) * 0.15;
        color.multiplyScalar(depthDarken);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    sphereGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const sphereMat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      flatShading: true,
      shininess: 8,
    });

    const earthMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.earthGroup.add(earthMesh);

    const wireGeo = new THREE.SphereGeometry(radius + 0.005, 24, 16);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1a3a4a,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    this.earthGroup.add(wireMesh);
  }

  private simplexNoise2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const n2 = Math.sin(x * 4.1414 + y * 12.9898) * 12345.678;
    const n3 = Math.sin((x + y) * 7.123 + x * 3.333) * 54321.123;
    return ((n - Math.floor(n)) + (n2 - Math.floor(n2)) + (n3 - Math.floor(n3))) / 3 - 0.5;
  }

  private latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
  }

  private tempToColor(temp: number): THREE.Color {
    const clampedTemp = Math.max(-10, Math.min(40, temp));
    let t: number;
    let c1: THREE.Color;
    let c2: THREE.Color;

    if (clampedTemp <= 0) {
      t = (clampedTemp + 10) / 10;
      c1 = new THREE.Color(0x0066cc);
      c2 = new THREE.Color(0x00ccff);
    } else {
      t = clampedTemp / 40;
      c1 = new THREE.Color(0x00ccff);
      c2 = new THREE.Color(0xff3300);
    }

    return c1.lerp(c2, Math.max(0, Math.min(1, t)));
  }

  private setupBars(): void {
    const earthRadius = 5;

    this.climateData.forEach((city) => {
      const yearData = getMonthlyDataByYear(city.monthlyData, this.currentYear);
      const basePos = this.latLngToVector3(city.lat, city.lng, earthRadius);
      const normal = basePos.clone().normalize();
      const tangent = this.computeTangent(normal);
      const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

      let accumulatedHeight = 0;

      yearData.forEach((record: MonthlyRecord, idx: number) => {
        const height = Math.max(0.05, record.precipitation / 10);
        const color = this.tempToColor(record.temperature);

        const mat = new THREE.MeshPhongMaterial({
          color,
          flatShading: true,
          shininess: 20,
          emissive: color.clone().multiplyScalar(0.08),
        });

        const mesh = new THREE.Mesh(this.barGeometry, mat);
        const barWidth = 0.15;
        const offset = (idx - 5.5) * barWidth * 1.05;

        const worldPos = basePos
          .clone()
          .add(tangent.clone().multiplyScalar(offset))
          .add(normal.clone().multiplyScalar(accumulatedHeight + height / 2 + 0.05));

        mesh.position.copy(worldPos);

        const up = normal.clone();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
        mesh.quaternion.copy(quat);
        mesh.scale.y = height;

        const barData: BarData = {
          cityId: city.cityId,
          cityName: city.cityName,
          month: record.month,
          targetHeight: height,
          currentHeight: height,
          targetTemp: record.temperature,
          currentTemp: record.temperature,
          targetPrecip: record.precipitation,
          currentPrecip: record.precipitation,
        };

        this.barMeshes.set(mesh, barData);
        this.barsGroup.add(mesh);

        accumulatedHeight += height + 0.02;

        void bitangent;
      });
    });
  }

  private computeTangent(normal: THREE.Vector3): THREE.Vector3 {
    const up = new THREE.Vector3(0, 1, 0);
    let tangent = new THREE.Vector3().crossVectors(up, normal);
    if (tangent.lengthSq() < 0.001) {
      tangent = new THREE.Vector3(1, 0, 0);
    } else {
      tangent.normalize();
    }
    return tangent;
  }

  private setupEvents(): void {
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('click', this.onClick);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private onMouseMove = (e: MouseEvent): void => {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  private onClick = (): void => {
    if (!this.compareMode || !this.hoveredMesh) return;
    const data = this.barMeshes.get(this.hoveredMesh);
    if (data && this.onCityClick) {
      this.onCityClick(data.cityId);
    }
  };

  setOnHoverChange(callback: (info: HoverInfo) => void): void {
    this.onHoverChange = callback;
  }

  setOnCityClick(callback: (cityId: string) => void): void {
    this.onCityClick = callback;
  }

  setCompareMode(enabled: boolean): void {
    this.compareMode = enabled;
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    switch (mode) {
      case 'auto-rotate':
        this.controls.autoRotate = true;
        this.controls.enableRotate = true;
        this.controls.enablePan = true;
        break;
      case 'free-explore':
        this.controls.autoRotate = false;
        this.controls.enableRotate = true;
        this.controls.enablePan = true;
        break;
      case 'locked':
        this.controls.autoRotate = false;
        this.controls.enableRotate = false;
        this.controls.enablePan = false;
        break;
    }
  }

  setYear(year: number): void {
    if (year === this.currentYear) return;
    this.currentYear = year;
    this.isAnimating = true;
    this.lerpStartTime = performance.now();

    this.climateData.forEach((city) => {
      const yearData = getMonthlyDataByYear(city.monthlyData, year);
      yearData.forEach((record, idx) => {
        const targetMesh = this.findMesh(city.cityId, record.month);
        if (targetMesh) {
          const data = this.barMeshes.get(targetMesh)!;
          data.targetHeight = Math.max(0.05, record.precipitation / 10);
          data.targetTemp = record.temperature;
          data.targetPrecip = record.precipitation;
        }
        void idx;
      });
    });
  }

  private findMesh(cityId: string, month: number): THREE.Mesh | null {
    for (const [mesh, data] of this.barMeshes) {
      if (data.cityId === cityId && data.month === month) {
        return mesh;
      }
    }
    return null;
  }

  getCityMonthlyData(cityId: string): MonthlyRecord[] {
    const city = this.climateData.find((c) => c.cityId === cityId);
    if (!city) return [];
    return getMonthlyDataByYear(city.monthlyData, this.currentYear);
  }

  getCityById(cityId: string): CityClimate | undefined {
    return this.climateData.find((c) => c.cityId === cityId);
  }

  getGlobalStats(): GlobalStats {
    let totalTemp = 0;
    let totalPrecip = 0;
    let count = 0;

    this.barMeshes.forEach((data) => {
      totalTemp += data.currentTemp;
      totalPrecip += data.currentPrecip;
      count++;
    });

    return {
      avgTemperature: count > 0 ? totalTemp / count : 0,
      totalPrecipitation: totalPrecip,
    };
  }

  private updateHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.barMeshes.keys());
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      if (mesh !== this.hoveredMesh) {
        this.clearHover();
        this.hoveredMesh = mesh;
        this.addHoverEffect(mesh);
      }
      this.emitHoverInfo(mesh, intersects[0].point);
    } else {
      if (this.hoveredMesh) {
        this.clearHover();
      }
      if (this.onHoverChange) {
        this.onHoverChange({
          cityId: '',
          cityName: '',
          month: 0,
          temperature: 0,
          precipitation: 0,
          screenX: 0,
          screenY: 0,
          visible: false,
        });
      }
    }
  }

  private addHoverEffect(mesh: THREE.Mesh): void {
    const edgeGeo = new THREE.EdgesGeometry(mesh.geometry);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.scale.copy(mesh.scale);
    edges.position.copy(mesh.position);
    edges.quaternion.copy(mesh.quaternion);
    mesh.parent?.add(edges);
    this.barEdgeMeshes.set(mesh, edges);

    const mat = mesh.material as THREE.MeshPhongMaterial;
    mat.emissiveIntensity = 0.5;
    mat.emissive.setHex(0xffffff);
  }

  private clearHover(): void {
    if (this.hoveredMesh) {
      const edges = this.barEdgeMeshes.get(this.hoveredMesh);
      if (edges) {
        edges.parent?.remove(edges);
        (edges.geometry as THREE.BufferGeometry).dispose();
        (edges.material as THREE.Material).dispose();
        this.barEdgeMeshes.delete(this.hoveredMesh);
      }
      const mat = this.hoveredMesh.material as THREE.MeshPhongMaterial;
      const data = this.barMeshes.get(this.hoveredMesh);
      if (data) {
        const originalColor = this.tempToColor(data.currentTemp);
        mat.emissive.copy(originalColor.clone().multiplyScalar(0.08));
        mat.emissiveIntensity = 1;
      }
      this.hoveredMesh = null;
    }
  }

  private emitHoverInfo(mesh: THREE.Mesh, worldPoint: THREE.Vector3): void {
    const data = this.barMeshes.get(mesh);
    if (!data || !this.onHoverChange) return;

    const screenPos = worldPoint.clone().project(this.camera);
    const screenX = (screenPos.x + 1) / 2 * window.innerWidth;
    const screenY = (-screenPos.y + 1) / 2 * window.innerHeight;

    this.onHoverChange({
      cityId: data.cityId,
      cityName: data.cityName,
      month: data.month,
      temperature: data.currentTemp,
      precipitation: data.currentPrecip,
      screenX,
      screenY,
      visible: true,
    });
  }

  private updateAnimation(time: number): void {
    if (!this.isAnimating) return;

    const elapsed = (time - this.lerpStartTime) / 1000;
    const t = Math.min(1, elapsed / this.lerpDuration);
    const ease = 1 - Math.pow(1 - t, 3);

    const earthRadius = 5;

    this.climateData.forEach((city) => {
      const basePos = this.latLngToVector3(city.lat, city.lng, earthRadius);
      const normal = basePos.clone().normalize();
      const tangent = this.computeTangent(normal);

      let accumulatedHeight = 0;
      for (let month = 1; month <= 12; month++) {
        const mesh = this.findMesh(city.cityId, month);
        if (!mesh) continue;
        const data = this.barMeshes.get(mesh)!;

        data.currentHeight = data.currentHeight + (data.targetHeight - data.currentHeight) * ease;
        data.currentTemp = data.currentTemp + (data.targetTemp - data.currentTemp) * ease;
        data.currentPrecip = data.currentPrecip + (data.targetPrecip - data.currentPrecip) * ease;

        const newColor = this.tempToColor(data.currentTemp);
        const mat = mesh.material as THREE.MeshPhongMaterial;
        mat.color.copy(newColor);
        if (mesh !== this.hoveredMesh) {
          mat.emissive.copy(newColor.clone().multiplyScalar(0.08));
        }

        const barWidth = 0.15;
        const offset = (month - 6.5) * barWidth * 1.05;
        const worldPos = basePos
          .clone()
          .add(tangent.clone().multiplyScalar(offset))
          .add(normal.clone().multiplyScalar(accumulatedHeight + data.currentHeight / 2 + 0.05));

        mesh.position.copy(worldPos);
        mesh.scale.y = data.currentHeight;

        const edgeMesh = this.barEdgeMeshes.get(mesh);
        if (edgeMesh) {
          edgeMesh.position.copy(worldPos);
          edgeMesh.scale.y = data.currentHeight;
        }

        accumulatedHeight += data.currentHeight + 0.02;
      }
    });

    if (t >= 1) {
      this.isAnimating = false;
    }
  }

  private animate = (time: number): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = time - this.lastTime;
    this.lastTime = time;

    if (this.viewMode === 'auto-rotate') {
      this.barsGroup.rotation.y = this.earthGroup.rotation.y;
    }

    this.controls.update();
    this.updateAnimation(time);
    this.updateHover();

    void delta;
    this.renderer.render(this.scene, this.camera);
  };

  start(): void {
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  stop(): void {
    cancelAnimationFrame(this.animationFrameId);
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('click', this.onClick);

    this.barMeshes.forEach((_data, mesh) => {
      (mesh.material as THREE.Material).dispose();
    });
    this.barGeometry.dispose();

    this.earthGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) {
        ((obj as THREE.Mesh).geometry as THREE.BufferGeometry).dispose();
      }
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
        }
      }
    });

    this.renderer.dispose();
    this.controls.dispose();
  }
}
