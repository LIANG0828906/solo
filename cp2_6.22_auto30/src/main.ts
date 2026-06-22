import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createGalaxy,
  createStarTexture,
  createCoreGlow,
  updateParticleColors,
  updateHeatmap,
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

interface Keyframe {
  core1Pos: THREE.Vector3;
  core1Vel: THREE.Vector3;
  core2Pos: THREE.Vector3;
  core2Vel: THREE.Vector3;
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
  private heatmapFrameCounter: number = 0;

  private keyframes: Keyframe[] = [];
  private keyframeInterval: number = 2.0;
  private lastKeyframeTime: number = -Infinity;
  private maxKeyframes: number = 20;
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
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

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
    this.setupMobileTouch();
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
    this.keyframes = [];
    this.currentTime = 0;
    this.lastKeyframeTime = -Infinity;
    this.recordKeyframe();
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

  private recordKeyframe(): void {
    const kf: Keyframe = {
      core1Pos: this.galaxy1.corePosition.clone(),
      core1Vel: this.galaxy1.coreVelocity.clone(),
      core2Pos: this.galaxy2.corePosition.clone(),
      core2Vel: this.galaxy2.coreVelocity.clone(),
      time: this.currentTime
    };
    this.keyframes.push(kf);
    this.lastKeyframeTime = this.currentTime;
    this.cleanupKeyframes();
  }

  private cleanupKeyframes(): void {
    const particleCount = this.galaxy1.masses.length + this.galaxy2.masses.length;
    if (particleCount > 10000) {
      this.maxKeyframes = 10;
    } else if (particleCount > 5000) {
      this.maxKeyframes = 15;
    } else {
      this.maxKeyframes = 25;
    }

    while (this.keyframes.length > this.maxKeyframes) {
      this.keyframes.shift();
    }
  }

  private findNearestKeyframe(targetTime: number): Keyframe | null {
    let best: Keyframe | null = null;
    for (const kf of this.keyframes) {
      if (kf.time <= targetTime + 0.01) {
        if (!best || kf.time > best.time) {
          best = kf;
        }
      }
    }
    return best;
  }

  private seekTo(targetTime: number): void {
    this.isSeeking = true;

    targetTime = Math.max(0, Math.min(targetTime, this.totalTime));

    const nearestKf = this.findNearestKeyframe(targetTime);

    if (nearestKf && nearestKf.time <= targetTime) {
      if (nearestKf.time === 0 || nearestKf.time < this.currentTime * 0.5) {
        this.restoreInitialState();
        this.currentTime = 0;
      } else {
        this.restoreInitialState();
        this.currentTime = 0;
        const fastDt = 0.1;
        while (this.currentTime < nearestKf.time - fastDt * 0.5) {
          updateGalaxyPhysics(this.galaxy1, this.galaxy2, fastDt);
          this.currentTime += fastDt;
        }
      }
    } else {
      this.restoreInitialState();
      this.currentTime = 0;
    }

    const simDt = 0.05;
    while (this.currentTime < targetTime) {
      updateGalaxyPhysics(this.galaxy1, this.galaxy2, simDt);
      this.currentTime += simDt;
    }

    this.updateGeometry();
    this.updateDynamicVisuals();
    this.isSeeking = false;
  }

  private updateDynamicVisuals(): void {
    updateParticleColors(
      this.galaxy1.positions,
      this.galaxy1.velocities,
      this.galaxy1.colors,
      this.galaxy1.starTypes,
      this.galaxy1.masses.length
    );
    this.galaxy1.points.geometry.attributes.color.needsUpdate = true;

    updateParticleColors(
      this.galaxy2.positions,
      this.galaxy2.velocities,
      this.galaxy2.colors,
      this.galaxy2.starTypes,
      this.galaxy2.masses.length
    );
    this.galaxy2.points.geometry.attributes.color.needsUpdate = true;

    updateHeatmap(
      this.galaxy1.heatmapCanvas,
      this.galaxy1.heatmapTexture,
      this.galaxy1.positions,
      this.galaxy1.masses.length,
      new THREE.Vector3(0, 0, 0)
    );

    updateHeatmap(
      this.galaxy2.heatmapCanvas,
      this.galaxy2.heatmapTexture,
      this.galaxy2.positions,
      this.galaxy2.masses.length,
      new THREE.Vector3(0, 0, 0)
    );
  }

  private handleParamsChange(params: SimParams): void {
    this.simParams = { ...params };
    this.galaxy1.mass = params.mass1;
    this.galaxy2.mass = params.mass2;
  }

  private handleReset(): void {
    this.currentTime = 0;
    this.keyframes = [];
    this.restoreInitialState();
    this.recordKeyframe();
    this.updateDynamicVisuals();
    this.ui.setTimeline(0);
    this.ui.setPlaying(false);
    this.isPlaying = false;
  }

  private handleRecreate(): void {
    this.currentTime = 0;
    this.createGalaxies();
    this.updateDynamicVisuals();
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

  private setupMobileTouch(): void {
    const panel = document.getElementById('control-panel');
    if (!panel) return;

    let touchStartY = 0;
    let isTouchingPanel = false;

    panel.addEventListener('touchstart', (e) => {
      isTouchingPanel = true;
      touchStartY = e.touches[0].clientY;
      e.stopPropagation();
    }, { passive: true });

    panel.addEventListener('touchmove', (e) => {
      if (isTouchingPanel) {
        e.stopPropagation();
      }
    }, { passive: true });

    panel.addEventListener('touchend', () => {
      isTouchingPanel = false;
    }, { passive: true });

    const sliders = panel.querySelectorAll('.slider');
    sliders.forEach(slider => {
      slider.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });
      slider.addEventListener('touchmove', (e) => {
        e.stopPropagation();
      }, { passive: true });
    });

    const canvas = this.renderer.domElement;
    canvas.style.touchAction = 'none';

    let pinchStartDist = 0;
    let pinchStartZoom = 0;

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDist = Math.sqrt(dx * dx + dy * dy);
        pinchStartZoom = this.camera.position.length();
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (pinchStartDist > 0) {
          const scale = pinchStartDist / dist;
          const newDist = pinchStartZoom * scale;
          const clampedDist = Math.max(30, Math.min(500, newDist));
          this.camera.position.normalize().multiplyScalar(clampedDist);
        }
      }
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      pinchStartDist = 0;
    }, { passive: true });
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const rawDelta = now - (this.lastFpsTime || now);
    const deltaTime = Math.min(rawDelta, 50) / 1000;
    this.lastFpsTime = now;

    this.frameCount++;
    if (rawDelta >= 1000) {
      this.fps = this.frameCount * 1000 / rawDelta;
      this.frameCount = 0;
    }

    if (this.isPlaying && !this.isSeeking) {
      const simDt = deltaTime * this.speed;
      const steps = Math.max(1, Math.ceil(simDt / 0.016));
      const stepDt = simDt / steps;

      for (let i = 0; i < steps; i++) {
        updateGalaxyPhysics(this.galaxy1, this.galaxy2, stepDt);
        this.currentTime += stepDt;

        if (this.currentTime - this.lastKeyframeTime >= this.keyframeInterval) {
          this.recordKeyframe();
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

    this.heatmapFrameCounter++;
    if (this.heatmapFrameCounter % 6 === 0) {
      this.updateDynamicVisuals();
    }

    const stats: EnergyStats = computeEnergy(this.galaxy1, this.galaxy2);
    this.ui.updateEnergy(stats);
    this.ui.updateFPS(this.fps);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

new GalaxySimulator();
