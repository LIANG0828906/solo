import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createGalaxy,
  createStarTexture,
  createCoreGlow,
  GalaxyData,
  GalaxyParams
} from './galaxy';
import {
  updateGalaxyPhysics,
  computeEnergy,
  getInitialPositions,
  SimParams,
  EnergyStats
} from './collision';
import { UI } from './ui';

interface Snapshot {
  galaxy1Pos: Float32Array;
  galaxy1Vel: Float32Array;
  galaxy1CorePos: THREE.Vector3;
  galaxy1CoreVel: THREE.Vector3;
  galaxy2Pos: Float32Array;
  galaxy2Vel: Float32Array;
  galaxy2CorePos: THREE.Vector3;
  galaxy2CoreVel: THREE.Vector3;
  time: number;
}

class GalaxySimulator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private starTexture: THREE.Texture;

  private galaxy1!: GalaxyData;
  private galaxy2!: GalaxyData;
  private coreGlow1!: THREE.Points;
  private coreGlow2!: THREE.Points;
  private backgroundStars!: THREE.Points;

  private ui: UI;
  private simParams: SimParams;
  private currentTime: number = 0;
  private totalTime: number = 100;
  private isPlaying: boolean = false;
  private speed: number = 1;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private fps: number = 60;

  private snapshots: Map<number, Snapshot> = new Map();
  private snapshotInterval: number = 0.5;
  private lastSnapshotTime: number = -Infinity;
  private isSeeking: boolean = false;

  private initialGalaxy1Pos!: Float32Array;
  private initialGalaxy1Vel!: Float32Array;
  private initialGalaxy1CorePos!: THREE.Vector3;
  private initialGalaxy1CoreVel!: THREE.Vector3;
  private initialGalaxy2Pos!: Float32Array;
  private initialGalaxy2Vel!: Float32Array;
  private initialGalaxy2CorePos!: THREE.Vector3;
  private initialGalaxy2CoreVel!: THREE.Vector3;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.003);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 80, 180);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    const container = document.getElementById('canvas-container');
    container?.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 500;

    this.starTexture = createStarTexture();

    this.createBackgroundStars();

    this.simParams = {
      mass1: 1.0,
      mass2: 0.8,
      distance: 120,
      angle: 45,
      velocityMultiplier: 1.0
    };

    this.ui = new UI(this.simParams, {
      onParamsChange: this.handleParamsChange.bind(this),
      onReset: this.handleReset.bind(this),
      onRecreate: this.handleRecreate.bind(this),
      onPlayPause: this.handlePlayPause.bind(this),
      onTimelineChange: this.handleTimelineChange.bind(this),
      onSpeedChange: this.handleSpeedChange.bind(this)
    });

    this.createGalaxies();
    this.setupEventListeners();
    this.animate();
  }

  private createBackgroundStars(): void {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = 400 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      const brightness = 0.3 + Math.random() * 0.7;
      const hue = 0.6 + Math.random() * 0.1;
      const color = new THREE.Color().setHSL(hue, 0.5, brightness);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    this.backgroundStars = new THREE.Points(geometry, material);
    this.scene.add(this.backgroundStars);
  }

  private createGalaxies(): void {
    if (this.galaxy1) {
      this.scene.remove(this.galaxy1.points);
      this.scene.remove(this.galaxy1.heatmapMesh);
      this.galaxy1.points.geometry.dispose();
      (this.galaxy1.points.material as THREE.Material).dispose();
    }
    if (this.galaxy2) {
      this.scene.remove(this.galaxy2.points);
      this.scene.remove(this.galaxy2.heatmapMesh);
      this.galaxy2.points.geometry.dispose();
      (this.galaxy2.points.material as THREE.Material).dispose();
    }
    if (this.coreGlow1) {
      this.scene.remove(this.coreGlow1);
      this.coreGlow1.geometry.dispose();
      (this.coreGlow1.material as THREE.Material).dispose();
    }
    if (this.coreGlow2) {
      this.scene.remove(this.coreGlow2);
      this.coreGlow2.geometry.dispose();
      (this.coreGlow2.material as THREE.Material).dispose();
    }

    const { pos1, vel1, pos2, vel2 } = getInitialPositions(this.simParams);

    const particleCount = Math.floor(this.ui.getParticleCount() / 2);

    const galaxyParams1: GalaxyParams = {
      particleCount,
      radius: 40,
      arms: 4,
      spin: 1.5,
      randomness: 0.3,
      randomnessPower: 3,
      hue: 0.65
    };

    const galaxyParams2: GalaxyParams = {
      particleCount,
      radius: 35,
      arms: 3,
      spin: 1.3,
      randomness: 0.35,
      randomnessPower: 3,
      hue: 0.08
    };

    this.galaxy1 = createGalaxy(galaxyParams1, this.starTexture, pos1, vel1, this.simParams.mass1);
    this.galaxy2 = createGalaxy(galaxyParams2, this.starTexture, pos2, vel2, this.simParams.mass2);

    this.scene.add(this.galaxy1.points);
    this.scene.add(this.galaxy2.points);
    this.scene.add(this.galaxy1.heatmapMesh);
    this.scene.add(this.galaxy2.heatmapMesh);

    this.coreGlow1 = createCoreGlow(0x6688ff);
    this.coreGlow1.position.copy(pos1);
    this.scene.add(this.coreGlow1);

    this.coreGlow2 = createCoreGlow(0xff8866);
    this.coreGlow2.position.copy(pos2);
    this.scene.add(this.coreGlow2);

    this.saveInitialState();
    this.snapshots.clear();
    this.currentTime = 0;
    this.lastSnapshotTime = -Infinity;
    this.takeSnapshot();
  }

  private saveInitialState(): void {
    this.initialGalaxy1Pos = new Float32Array(this.galaxy1.positions);
    this.initialGalaxy1Vel = new Float32Array(this.galaxy1.velocities);
    this.initialGalaxy1CorePos = this.galaxy1.corePosition.clone();
    this.initialGalaxy1CoreVel = this.galaxy1.coreVelocity.clone();

    this.initialGalaxy2Pos = new Float32Array(this.galaxy2.positions);
    this.initialGalaxy2Vel = new Float32Array(this.galaxy2.velocities);
    this.initialGalaxy2CorePos = this.galaxy2.corePosition.clone();
    this.initialGalaxy2CoreVel = this.galaxy2.coreVelocity.clone();
  }

  private restoreInitialState(): void {
    this.galaxy1.positions.set(this.initialGalaxy1Pos);
    this.galaxy1.velocities.set(this.initialGalaxy1Vel);
    this.galaxy1.corePosition.copy(this.initialGalaxy1CorePos);
    this.galaxy1.coreVelocity.copy(this.initialGalaxy1CoreVel);

    this.galaxy2.positions.set(this.initialGalaxy2Pos);
    this.galaxy2.velocities.set(this.initialGalaxy2Vel);
    this.galaxy2.corePosition.copy(this.initialGalaxy2CorePos);
    this.galaxy2.coreVelocity.copy(this.initialGalaxy2CoreVel);

    this.updateGeometry();
  }

  private updateGeometry(): void {
    this.galaxy1.points.geometry.attributes.position.needsUpdate = true;
    this.galaxy2.points.geometry.attributes.position.needsUpdate = true;

    this.galaxy1.points.position.copy(this.galaxy1.corePosition);
    this.galaxy2.points.position.copy(this.galaxy2.corePosition);

    this.coreGlow1.position.copy(this.galaxy1.corePosition);
    this.coreGlow2.position.copy(this.galaxy2.corePosition);

    this.galaxy1.heatmapMesh.position.copy(this.galaxy1.corePosition);
    this.galaxy2.heatmapMesh.position.copy(this.galaxy2.corePosition);
  }

  private takeSnapshot(): void {
    const snapshot: Snapshot = {
      galaxy1Pos: new Float32Array(this.galaxy1.positions),
      galaxy1Vel: new Float32Array(this.galaxy1.velocities),
      galaxy1CorePos: this.galaxy1.corePosition.clone(),
      galaxy1CoreVel: this.galaxy1.coreVelocity.clone(),
      galaxy2Pos: new Float32Array(this.galaxy2.positions),
      galaxy2Vel: new Float32Array(this.galaxy2.velocities),
      galaxy2CorePos: this.galaxy2.corePosition.clone(),
      galaxy2CoreVel: this.galaxy2.coreVelocity.clone(),
      time: this.currentTime
    };
    this.snapshots.set(Math.floor(this.currentTime / this.snapshotInterval), snapshot);
    this.lastSnapshotTime = this.currentTime;
  }

  private restoreSnapshot(snapshot: Snapshot): void {
    this.galaxy1.positions.set(snapshot.galaxy1Pos);
    this.galaxy1.velocities.set(snapshot.galaxy1Vel);
    this.galaxy1.corePosition.copy(snapshot.galaxy1CorePos);
    this.galaxy1.coreVelocity.copy(snapshot.galaxy1CoreVel);

    this.galaxy2.positions.set(snapshot.galaxy2Pos);
    this.galaxy2.velocities.set(snapshot.galaxy2Vel);
    this.galaxy2.corePosition.copy(snapshot.galaxy2CorePos);
    this.galaxy2.coreVelocity.copy(snapshot.galaxy2CoreVel);

    this.currentTime = snapshot.time;
    this.updateGeometry();
  }

  private seekTo(targetTime: number): void {
    this.isSeeking = true;

    targetTime = Math.max(0, Math.min(targetTime, this.totalTime));

    const nearestKey = Math.floor(targetTime / this.snapshotInterval);
    let nearestSnapshot: Snapshot | null = null;
    let nearestDist = Infinity;

    for (const [key, snap] of this.snapshots) {
      const dist = Math.abs(key - nearestKey);
      if (dist < nearestDist && snap.time <= targetTime) {
        nearestDist = dist;
        nearestSnapshot = snap;
      }
    }

    if (nearestSnapshot) {
      this.restoreSnapshot(nearestSnapshot);
    } else {
      this.restoreInitialState();
      this.currentTime = 0;
    }

    while (this.currentTime < targetTime) {
      const dt = Math.min(0.05, targetTime - this.currentTime);
      updateGalaxyPhysics(this.galaxy1, this.galaxy2, dt);
      this.currentTime += dt;
    }

    this.updateGeometry();
    this.isSeeking = false;
  }

  private handleParamsChange(params: SimParams): void {
    this.simParams = { ...params };
    this.galaxy1.mass = params.mass1;
    this.galaxy2.mass = params.mass2;
  }

  private handleReset(): void {
    this.currentTime = 0;
    this.snapshots.clear();
    this.restoreInitialState();
    this.takeSnapshot();
    this.ui.setTimeline(0);
    this.ui.setPlaying(false);
    this.isPlaying = false;
  }

  private handleRecreate(): void {
    this.currentTime = 0;
    this.createGalaxies();
    this.ui.setTimeline(0);
    this.ui.setPlaying(false);
    this.isPlaying = false;
  }

  private handlePlayPause(): void {
    this.isPlaying = !this.isPlaying;
  }

  private handleTimelineChange(time: number): void {
    const wasPlaying = this.isPlaying;
    this.isPlaying = false;
    this.seekTo(time);
    this.isPlaying = wasPlaying;
    this.ui.setTimeline(time);
  }

  private handleSpeedChange(speed: number): void {
    this.speed = speed;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const deltaTime = Math.min(now - (this.lastFpsTime || now), 50) / 1000;
    this.lastFpsTime = now;

    this.frameCount++;
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount * 1000 / (now - this.lastFpsTime);
      this.frameCount = 0;
    }

    if (this.isPlaying && !this.isSeeking) {
      const simDt = deltaTime * this.speed;
      const steps = Math.max(1, Math.ceil(simDt / 0.016));
      const stepDt = simDt / steps;

      for (let i = 0; i < steps; i++) {
        updateGalaxyPhysics(this.galaxy1, this.galaxy2, stepDt);
        this.currentTime += stepDt;

        if (this.currentTime - this.lastSnapshotTime >= this.snapshotInterval) {
          this.takeSnapshot();
        }

        if (this.currentTime >= this.totalTime) {
          this.currentTime = this.totalTime;
          this.isPlaying = false;
          this.ui.setPlaying(false);
          break;
        }
      }

      this.coreGlow1.position.copy(this.galaxy1.corePosition);
      this.coreGlow2.position.copy(this.galaxy2.corePosition);

      this.ui.updateTimeline(this.currentTime, this.totalTime);
    }

    const stats: EnergyStats = computeEnergy(this.galaxy1, this.galaxy2);
    this.ui.updateEnergy(stats);
    this.ui.updateFPS(this.fps);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

new GalaxySimulator();
