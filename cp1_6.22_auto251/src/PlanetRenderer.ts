import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { eventBus } from './EventBus';
import { CelestialDataManager } from './CelestialDataManager';
import type { CelestialBody, TimeUpdatedPayload, ViewFocusPlanetPayload, MeasurementResultPayload } from './types';

export class PlanetRenderer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  sunLight: THREE.PointLight;
  ambientLight: THREE.AmbientLight;
  sunMesh: THREE.Mesh;
  planetMeshes: Map<string, THREE.Mesh>;
  orbitLines: Map<string, THREE.Line>;
  starfield: THREE.Points;
  measurementLine: THREE.Line | null;
  measurementFromId: string | null;
  measurementToId: string | null;
  labels: Map<string, HTMLDivElement>;
  clock: THREE.Clock;
  animationId: number | null;
  initialCameraPos: THREE.Vector3;
  focusTargetId: string | null;
  focusStartTime: number;
  focusDuration: number;
  focusStartPos: THREE.Vector3;
  focusEndPos: THREE.Vector3;

  private celestialDataManager: CelestialDataManager;
  private currentEpochDays: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.celestialDataManager = CelestialDataManager.getInstance();
    this.planetMeshes = new Map();
    this.orbitLines = new Map();
    this.labels = new Map();
    this.measurementLine = null;
    this.measurementFromId = null;
    this.measurementToId = null;
    this.clock = new THREE.Clock();
    this.animationId = null;
    this.initialCameraPos = new THREE.Vector3(0, 80, 150);
    this.focusTargetId = null;
    this.focusStartTime = 0;
    this.focusDuration = 0.5;
    this.focusStartPos = new THREE.Vector3();
    this.focusEndPos = new THREE.Vector3();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);
    this.camera.position.copy(this.initialCameraPos);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 1000;

    this.sunLight = new THREE.PointLight(0xFFF4E0, 1.5, 0, 2);
    this.sunLight.position.set(0, 0, 0);
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.1);

    this.scene.add(this.sunLight);
    this.scene.add(this.ambientLight);

    this.sunMesh = this.createSun();
    this.scene.add(this.sunMesh);

    this.createPlanets();
    this.createOrbitLines();
    this.starfield = this.createStarfield();
    this.scene.add(this.starfield);

    this.setupEventListeners();
  }

  private createSun(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(3, 64, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0xFDB813 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.bodyId = 'sun';
    mesh.add(this.sunLight);
    return mesh;
  }

  private createPlanets(): void {
    const bodies = this.celestialDataManager.getAllBodies();
    const sun = this.celestialDataManager.getBody('sun');
    if (!sun) return;

    bodies.forEach((body) => {
      if (body.type === 'sun') return;

      const scaledRadius = (body.radius / sun.radius) * 3 * 2;
      const geometry = new THREE.SphereGeometry(scaledRadius, 32, 32);
      const emissiveColor = new THREE.Color(body.color).multiplyScalar(0.1);
      const material = new THREE.MeshStandardMaterial({
        color: body.color,
        emissive: emissiveColor,
        roughness: 0.7,
        metalness: 0.2,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.bodyId = body.id;
      mesh.userData.radius = scaledRadius;

      const position = this.celestialDataManager.calculatePosition(body.id, 0);
      mesh.position.copy(position);

      this.planetMeshes.set(body.id, mesh);
      this.scene.add(mesh);

      this.createLabel(body);
    });
  }

  private createOrbitLines(): void {
    const planets = this.celestialDataManager.getPlanets();

    planets.forEach((planet) => {
      const points: THREE.Vector3[] = [];
      const segments = 200;

      for (let i = 0; i <= segments; i++) {
        const time = (i / segments) * planet.orbit.period;
        const position = this.celestialDataManager.calculatePosition(planet.id, time);
        points.push(position);
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.31,
        linewidth: 1,
      });
      const line = new THREE.Line(geometry, material);

      this.orbitLines.set(planet.id, line);
      this.scene.add(line);
    });
  }

  private createStarfield(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * 2000;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const opacity = 0.3 + Math.random() * 0.7;
      colors[i * 3] = opacity;
      colors[i * 3 + 1] = opacity;
      colors[i * 3 + 2] = opacity;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      transparent: true,
      vertexColors: true,
      sizeAttenuation: true,
    });

    return new THREE.Points(geometry, material);
  }

  private createLabel(body: CelestialBody): void {
    const container = this.renderer.domElement.parentElement;
    if (!container) return;

    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.transform = 'translate(-50%, -100%)';
    label.style.background = '#0B0D1790';
    label.style.backdropFilter = 'blur(8px)';
    label.style.padding = '6px 12px';
    label.style.borderRadius = '6px';
    label.style.color = '#A8B2D1';
    label.style.fontFamily = 'Inter, Segoe UI, sans-serif';
    label.style.fontSize = '12px';
    label.style.pointerEvents = 'none';
    label.style.zIndex = '10';
    label.style.display = 'none';

    container.appendChild(label);
    this.labels.set(body.id, label);
  }

  private updateLabels(): void {
    this.planetMeshes.forEach((mesh, bodyId) => {
      const label = this.labels.get(bodyId);
      const body = this.celestialDataManager.getBody(bodyId);
      if (!label || !body) return;

      const position = mesh.position.clone();
      position.project(this.camera);

      const container = this.renderer.domElement.parentElement;
      if (!container) return;

      const x = (position.x * 0.5 + 0.5) * container.clientWidth;
      const y = (-position.y * 0.5 + 0.5) * container.clientHeight;

      const distanceInAU = mesh.position.length() / 20;
      const distanceInMillionKm = Math.round(distanceInAU * 149.5978707);

      label.innerHTML = `
        <div style="font-weight: 600; color: #FFFFFF; margin-bottom: 2px;">${body.name}</div>
        <div style="font-size: 11px; opacity: 0.8;">半径: ${body.radius.toLocaleString()} km</div>
        <div style="font-size: 11px; opacity: 0.8;">公转周期: ${body.orbit.period.toLocaleString()} 天</div>
        <div style="font-size: 11px; opacity: 0.8;">距太阳: ${distanceInMillionKm.toLocaleString()} 百万公里</div>
      `;

      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
      label.style.display = (position.z < 1 && position.z > -1) ? 'block' : 'none';
    });
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private updateCameraFocus(): void {
    if (!this.focusTargetId) return;

    const elapsed = performance.now() / 1000 - this.focusStartTime;
    const progress = Math.min(elapsed / this.focusDuration, 1);
    const easedProgress = this.easeInOutCubic(progress);

    this.camera.position.lerpVectors(this.focusStartPos, this.focusEndPos, easedProgress);
    this.controls.target.lerp(this.focusEndPos.clone().sub(new THREE.Vector3(0, 0, 3)), easedProgress);

    if (progress >= 1) {
      this.focusTargetId = null;
    }
  }

  private updateSunPulse(): void {
    const elapsed = this.clock.getElapsedTime();
    const intensity = 1.0 + Math.sin(elapsed * Math.PI) * 0.25;
    this.sunLight.intensity = intensity;
  }

  animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    this.updatePlanetPositions(this.currentEpochDays);

    this.planetMeshes.forEach((mesh, bodyId) => {
      eventBus.emit('bodyPositionUpdate', {
        bodyId,
        position: {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
        },
      });
    });

    this.updateLabels();
    this.updateMeasurementLine();
    this.updateCameraFocus();
    this.updateSunPulse();
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  updatePlanetPosition(bodyId: string, epochDays: number): void {
    const mesh = this.planetMeshes.get(bodyId);
    if (!mesh) return;

    const position = this.celestialDataManager.calculatePosition(bodyId, epochDays);
    mesh.position.copy(position);
  }

  private updatePlanetPositions(epochDays: number): void {
    this.planetMeshes.forEach((_, bodyId) => {
      this.updatePlanetPosition(bodyId, epochDays);
    });
  }

  focusOnPlanet(bodyId: string): void {
    const mesh = this.planetMeshes.get(bodyId);
    if (!mesh) return;

    const radius = mesh.userData.radius || 1;
    const offset = new THREE.Vector3(radius * 3, radius * 2, radius * 3);
    const targetPosition = mesh.position.clone().add(offset);

    this.focusTargetId = bodyId;
    this.focusStartTime = performance.now() / 1000;
    this.focusStartPos.copy(this.camera.position);
    this.focusEndPos.copy(targetPosition);
  }

  resetCamera(): void {
    this.focusStartTime = performance.now() / 1000;
    this.focusStartPos.copy(this.camera.position);
    this.focusEndPos.copy(this.initialCameraPos);
    this.focusTargetId = '__reset__';
  }

  createMeasurementLine(fromId: string, toId: string): void {
    this.clearMeasurementLine();

    const fromMesh = this.planetMeshes.get(fromId) || (fromId === 'sun' ? this.sunMesh : null);
    const toMesh = this.planetMeshes.get(toId) || (toId === 'sun' ? this.sunMesh : null);

    if (!fromMesh || !toMesh) return;

    const points = [fromMesh.position.clone(), toMesh.position.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0xFFD700,
      dashSize: 5,
      gapSize: 3,
      linewidth: 1,
    });

    this.measurementLine = new THREE.Line(geometry, material);
    this.measurementLine.computeLineDistances();

    this.measurementFromId = fromId;
    this.measurementToId = toId;

    this.scene.add(this.measurementLine);
  }

  updateMeasurementLine(): void {
    if (!this.measurementLine || !this.measurementFromId || !this.measurementToId) return;

    const fromMesh = this.planetMeshes.get(this.measurementFromId) || 
      (this.measurementFromId === 'sun' ? this.sunMesh : null);
    const toMesh = this.planetMeshes.get(this.measurementToId) || 
      (this.measurementToId === 'sun' ? this.sunMesh : null);

    if (!fromMesh || !toMesh) return;

    const positions = this.measurementLine.geometry.attributes.position.array as Float32Array;
    positions[0] = fromMesh.position.x;
    positions[1] = fromMesh.position.y;
    positions[2] = fromMesh.position.z;
    positions[3] = toMesh.position.x;
    positions[4] = toMesh.position.y;
    positions[5] = toMesh.position.z;

    this.measurementLine.geometry.attributes.position.needsUpdate = true;
    this.measurementLine.computeLineDistances();
  }

  clearMeasurementLine(): void {
    if (this.measurementLine) {
      this.scene.remove(this.measurementLine);
      this.measurementLine.geometry.dispose();
      (this.measurementLine.material as THREE.Material).dispose();
      this.measurementLine = null;
    }
    this.measurementFromId = null;
    this.measurementToId = null;
  }

  onWindowResize(): void {
    const container = this.renderer.domElement.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  start(): void {
    if (this.animationId === null) {
      this.animate();
    }
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private setupEventListeners(): void {
    eventBus.on('timeUpdated', (payload: TimeUpdatedPayload) => {
      this.currentEpochDays = payload.epochDays;
    });

    eventBus.on('viewFocusPlanet', (payload: ViewFocusPlanetPayload) => {
      if (payload.planetId) {
        this.focusOnPlanet(payload.planetId);
      }
    });

    eventBus.on('resetView', () => {
      this.resetCamera();
    });

    eventBus.on('measurementResult', (payload: MeasurementResultPayload) => {
      this.createMeasurementLine(payload.fromBodyId, payload.toBodyId);
    });

    eventBus.on('exitMeasurement', () => {
      this.clearMeasurementLine();
    });
  }
}
