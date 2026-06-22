import * as THREE from 'three';
import * as dat from 'dat.gui';
import { ObstacleManager } from '../managers/ObstacleManager';
import { FishSchoolManager } from '../managers/FishSchoolManager';
import { RadarRenderer } from '../renderers/RadarRenderer';
import { WaveformRenderer } from '../renderers/WaveformRenderer';
import { SNRRenderer } from '../renderers/SNRRenderer';
import {
  calculateDopplerShift,
  calculateEchoStrength,
  calculateSNR,
  degToRad,
  generateReverbParticles,
  getSonarDirection,
  pointInSonarCone,
  radToDeg,
  strengthToColor,
} from '../utils/SonarPhysics';
import {
  EchoPathData,
  ReverbParticle,
  SNRSample,
  SonarConfig,
  TargetInfo,
  WaveformSample,
} from '../types';

export interface SceneCallbacks {
  onPerformanceUpdate?: (fps: number, particleCount: number) => void;
  onTargetUpdate?: (target: TargetInfo | null) => void;
}

export class SonarScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  private obstacleManager: ObstacleManager;
  private fishSchoolManager: FishSchoolManager;
  private radarRenderer: RadarRenderer;
  private waveformRenderer: WaveformRenderer;
  private snrRenderer: SNRRenderer;

  private config: SonarConfig = {
    horizontalAngle: 0,
    verticalAngle: 0,
    frequency: 20,
    reverbDecay: 0.5,
    noiseThreshold: 0.3,
    pulseRepetitionFreq: 5,
    beamWidth: 30,
    maxRange: 80,
  };

  private sonarOrigin: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private sonarProbe: THREE.Group = new THREE.Group();
  private beamMesh: THREE.Mesh | null = null;
  private beamInnerLines: THREE.LineSegments | null = null;
  private echoPaths: Map<string, { line: THREE.Line; data: EchoPathData }> = new Map();

  private reverbParticles: ReverbParticle[] = [];
  private reverbPoints: THREE.Points | null = null;
  private reverbGeometry: THREE.BufferGeometry | null = null;
  private totalParticleBudget: number = 10000;
  private activeParticleCount: number = 10000;
  private particlePool: { position: THREE.Vector3; phase: number; speed: number }[] = [];

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private currentTargets: TargetInfo[] = [];

  private gui: dat.GUI;
  private callbacks: SceneCallbacks;

  private lastPulseTime: number = 0;
  private frameCount: number = 0;
  private fpsAccumulator: number = 0;
  private currentFPS: number = 60;
  private lastFrameTime: number = performance.now();

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    container: HTMLElement,
    callbacks: SceneCallbacks = {}
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.container = container;
    this.callbacks = callbacks;

    this.obstacleManager = new ObstacleManager(this.scene);
    this.fishSchoolManager = new FishSchoolManager(this.scene);
    this.radarRenderer = new RadarRenderer('radar-canvas', this.config.maxRange);
    this.waveformRenderer = new WaveformRenderer('waveform-canvas');
    this.snrRenderer = new SNRRenderer('snr-canvas');

    this.gui = this.buildGUI();
    this.initEnvironment();
    this.initSonarProbe();
    this.initBeam();
    this.initReverbParticles();
    this.obstacleManager.createAll();
    this.fishSchoolManager.createSchool(20);
  }

  private buildGUI(): dat.GUI {
    const gui = new dat.GUI({ width: 280 });
    const style = gui.domElement.style as any;
    style.position = 'absolute';
    style.top = '20px';
    style.left = '20px';
    style.zIndex = '15';
    style.background = 'rgba(0, 20, 40, 0.7)';
    style.backdropFilter = 'blur(12px)';
    style.webkitBackdropFilter = 'blur(12px)';
    style.border = '1px solid rgba(0, 255, 255, 0.2)';
    style.borderRadius = '12px';
    style.padding = '4px';
    style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.1)';

    const beamFolder = gui.addFolder('波束参数');
    beamFolder.add(this.config, 'horizontalAngle', -90, 90, 1).name('水平角度 (°)').listen().onChange(() => {
      this.updateBeamOrientation();
    });
    beamFolder.add(this.config, 'verticalAngle', -45, 45, 1).name('俯仰角度 (°)').listen().onChange(() => {
      this.updateBeamOrientation();
    });
    beamFolder.add(this.config, 'frequency', 5, 50, 0.5).name('频率 (kHz)').listen();
    beamFolder.add(this.config, 'beamWidth', 10, 60, 1).name('波束宽度 (°)').listen().onChange(() => {
      this.rebuildBeam();
    });
    beamFolder.open();

    const advancedFolder = gui.addFolder('高级参数');
    advancedFolder.add(this.config, 'reverbDecay', 0, 1, 0.01).name('混响衰减系数').listen().onChange((v: number) => {
      this.updateReverbAppearance(v, this.config.noiseThreshold);
    });
    advancedFolder.add(this.config, 'noiseThreshold', 0, 1, 0.01).name('噪声门限').listen().onChange((v: number) => {
      this.updateReverbAppearance(this.config.reverbDecay, v);
    });
    advancedFolder.add(this.config, 'pulseRepetitionFreq', 1, 20, 0.5).name('脉冲重复频率 (Hz)').listen();
    advancedFolder.open();

    return gui;
  }

  private initEnvironment(): void {
    const canvas = this.renderer.domElement;
    const bgTex = this.createGradientTexture();
    this.scene.background = bgTex;

    const fog = new THREE.FogExp2(0x000a14, 0.012);
    this.scene.fog = fog;

    const ambient = new THREE.AmbientLight(0x224466, 0.35);
    this.scene.add(ambient);

    const light1 = new THREE.PointLight(0x00ccff, 1.2, 80, 2);
    light1.position.set(10, 15, 10);
    this.scene.add(light1);

    const light2 = new THREE.PointLight(0x0088aa, 0.8, 60, 2);
    light2.position.set(-15, 10, -20);
    this.scene.add(light2);

    const lightConeGeo = new THREE.SpotLight(0x66ddff, 0.6, 100, Math.PI / 5, 0.5, 1);
    lightConeGeo.position.set(0, 30, 0);
    lightConeGeo.target.position.set(0, -20, 0);
    this.scene.add(lightConeGeo);
    this.scene.add(lightConeGeo.target);
  }

  private createGradientTexture(): THREE.Texture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#001530');
    grad.addColorStop(0.5, '#000a20');
    grad.addColorStop(1, '#000310');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 1.5;
      const a = Math.random() * 0.15;
      ctx.fillStyle = `rgba(100, 200, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  private initSonarProbe(): void {
    const group = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(0.6, 0.8, 2, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x223344,
      metalness: 0.8,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);

    const headGeo = new THREE.SphereGeometry(0.7, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x00ccff,
      emissive: 0x0066aa,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.15,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.rotation.x = Math.PI;
    head.position.y = 1.5;
    group.add(head);

    const ringGeo = new THREE.TorusGeometry(0.75, 0.06, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.2,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.5;
    group.add(ring);

    const standGeo = new THREE.CylinderGeometry(0.4, 0.6, 0.6, 12);
    const stand = new THREE.Mesh(standGeo, bodyMat);
    stand.position.y = -0.8;
    group.add(stand);

    this.sonarOrigin.set(0, 1.5, 0);
    group.position.copy(this.sonarOrigin);
    group.position.y = 0;
    this.scene.add(group);
    this.sonarProbe = group;
    this.updateBeamOrientation();
  }

  private rebuildBeam(): void {
    if (this.beamMesh) {
      this.scene.remove(this.beamMesh);
      this.beamMesh.geometry.dispose();
      (this.beamMesh.material as THREE.Material).dispose();
    }
    if (this.beamInnerLines) {
      this.scene.remove(this.beamInnerLines);
      this.beamInnerLines.geometry.dispose();
      (this.beamInnerLines.material as THREE.Material).dispose();
    }
    this.initBeam();
    this.updateBeamOrientation();
  }

  private initBeam(): void {
    const length = this.config.maxRange;
    const halfAngle = degToRad(this.config.beamWidth / 2);
    const radius = Math.tan(halfAngle) * length;

    const coneGeo = new THREE.ConeGeometry(radius, length, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.beamMesh = new THREE.Mesh(coneGeo, coneMat);
    this.beamMesh.position.copy(this.sonarOrigin);
    this.scene.add(this.beamMesh);

    const ringCount = 8;
    const linePositions: number[] = [];
    for (let i = 1; i <= ringCount; i++) {
      const t = i / ringCount;
      const ringRadius = radius * t;
      const ringLen = length * t;
      const segments = 24;
      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        linePositions.push(
          Math.cos(a) * ringRadius,
          -ringLen,
          Math.sin(a) * ringRadius
        );
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.18,
    });
    this.beamInnerLines = new THREE.LineSegments(lineGeo, lineMat);
    this.beamInnerLines.position.copy(this.sonarOrigin);
    this.scene.add(this.beamInnerLines);
  }

  private updateBeamOrientation(): void {
    const dir = getSonarDirection(this.config);
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    if (this.beamMesh) {
      this.beamMesh.quaternion.copy(q);
      const pulse = 0.1 + 0.05 * Math.sin(performance.now() * 0.003);
      (this.beamMesh.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
    if (this.beamInnerLines) {
      this.beamInnerLines.quaternion.copy(q);
    }
    if (this.sonarProbe) {
      this.sonarProbe.rotation.y = degToRad(this.config.horizontalAngle);
      this.sonarProbe.rotation.x = -degToRad(this.config.verticalAngle);
    }
  }

  private initReverbParticles(): void {
    const bounds = new THREE.Box3(
      new THREE.Vector3(-80, -25, -80),
      new THREE.Vector3(80, 10, 80)
    );
    this.reverbParticles = generateReverbParticles(this.totalParticleBudget, bounds, 42);
    this.particlePool = this.reverbParticles.map((p) => ({
      position: p.position.clone(),
      phase: p.phase,
      speed: p.speed,
    }));

    this.reverbGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.totalParticleBudget * 3);
    const colors = new Float32Array(this.totalParticleBudget * 3);
    this.reverbParticles.forEach((p, i) => {
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
      colors[i * 3] = 0.2;
      colors[i * 3 + 1] = 0.6;
      colors[i * 3 + 2] = 1.0;
    });
    this.reverbGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.reverbGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.reverbGeometry.setDrawRange(0, this.activeParticleCount);

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.6 * (1 - this.config.reverbDecay * 0.7),
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.reverbPoints = new THREE.Points(this.reverbGeometry, particleMat);
    this.scene.add(this.reverbPoints);
    this.activeParticleCount = this.totalParticleBudget;
  }

  public updateReverbAppearance(reverbDecay: number, noiseThreshold: number): void {
    if (!this.reverbPoints) return;
    const mat = this.reverbPoints.material as THREE.PointsMaterial;
    const baseOpacity = (1 - reverbDecay) * (0.3 + noiseThreshold * 0.5);
    mat.opacity = Math.max(0.02, Math.min(0.9, baseOpacity));
    mat.size = 0.12 + (1 - reverbDecay) * 0.18;
  }

  public setParticleCount(count: number): void {
    count = Math.max(1000, Math.min(this.totalParticleBudget, count));
    this.activeParticleCount = count;
    if (this.reverbGeometry) {
      this.reverbGeometry.setDrawRange(0, count);
    }
  }

  private updateReverbParticles(delta: number, time: number): void {
    if (!this.reverbGeometry || !this.reverbPoints) return;
    const positions = this.reverbGeometry.attributes.position as THREE.BufferAttribute;
    const colors = this.reverbGeometry.attributes.color as THREE.BufferAttribute;
    const posArr = positions.array as Float32Array;
    const colArr = colors.array as Float32Array;
    const decay = this.config.reverbDecay;
    const noise = this.config.noiseThreshold;
    const baseA = (1 - decay) * (0.5 + noise * 0.5);

    for (let i = 0; i < this.activeParticleCount; i++) {
      const p = this.particlePool[i];
      const sway = Math.sin(time * p.speed + p.phase) * 0.05;
      const swayZ = Math.cos(time * p.speed * 0.7 + p.phase) * 0.04;
      posArr[i * 3] = p.position.x + sway;
      posArr[i * 3 + 1] = p.position.y + Math.sin(time * 0.3 + p.phase) * 0.08;
      posArr[i * 3 + 2] = p.position.z + swayZ;
      const flicker = 0.5 + Math.sin(time * 2 + p.phase) * 0.5;
      const intensity = baseA * flicker;
      colArr[i * 3] = 0.1 + intensity * 0.2;
      colArr[i * 3 + 1] = 0.4 + intensity * 0.5;
      colArr[i * 3 + 2] = 0.7 + intensity * 0.3;
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
  }

  private emitPulse(currentTime: number): void {
    const pulseInterval = 1 / this.config.pulseRepetitionFreq;
    if (currentTime - this.lastPulseTime < pulseInterval) return;
    this.lastPulseTime = currentTime;

    const dir = getSonarDirection(this.config);
    this.raycaster.set(this.sonarOrigin, dir);
    this.raycaster.far = this.config.maxRange;

    const collisionMeshes = this.obstacleManager.getCollisionMeshes();
    const fishMeshes: THREE.Object3D[] = [];
    this.fishSchoolManager.getFishes().forEach((f) => fishMeshes.push(f.mesh));
    const allTargets = [...collisionMeshes, ...fishMeshes];

    const hits = this.raycaster.intersectObjects(allTargets, true);
    if (hits.length > 0) {
      const hit = hits[0];
      this.processEcho(hit.point, hit.object, currentTime);
    }
  }

  private processEcho(hitPoint: THREE.Vector3, hitObject: THREE.Object3D, currentTime: number): void {
    let materialType: 'rock' | 'metal' | 'fish' = 'rock';
    let velocity = new THREE.Vector3(0, 0, 0);

    let found: THREE.Object3D | null = hitObject;
    while (found) {
      const t = (found.userData as any)?.materialType;
      if (t === 'metal' || t === 'rock' || t === 'fish') {
        materialType = t;
        break;
      }
      found = found.parent;
    }

    this.fishSchoolManager.getFishes().forEach((fish) => {
      let p: THREE.Object3D | null = hitObject;
      while (p) {
        if (p === fish.mesh) {
          materialType = 'fish';
          velocity = fish.data.velocity.clone();
          break;
        }
        p = p.parent;
      }
    });

    const distance = this.sonarOrigin.distanceTo(hitPoint);
    const waveDir = hitPoint.clone().sub(this.sonarOrigin).normalize();
    const dopplerShift = calculateDopplerShift(
      this.config.frequency * 1000,
      velocity,
      waveDir
    );
    const echoStrength = calculateEchoStrength(distance, materialType, this.config.frequency);

    this.spawnEchoPath(hitPoint, echoStrength, currentTime);
    this.registerTarget(hitPoint, velocity, distance, echoStrength, dopplerShift, materialType);
  }

  private spawnEchoPath(hitPoint: THREE.Vector3, strength: number, currentTime: number): void {
    const id = `echo_${currentTime.toFixed(3)}_${Math.random().toString(36).slice(2, 7)}`;
    const points = [this.sonarOrigin.clone(), hitPoint.clone(), this.sonarOrigin.clone()];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const color = strengthToColor(strength);
    const mat = new THREE.LineDashedMaterial({
      color: color,
      dashSize: 0.8,
      gapSize: 0.4,
      transparent: true,
      opacity: Math.max(0.3, strength),
      linewidth: 2,
    });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    this.scene.add(line);
    const data: EchoPathData = {
      id,
      start: this.sonarOrigin.clone(),
      hitPoint: hitPoint.clone(),
      end: this.sonarOrigin.clone(),
      strength,
      timestamp: currentTime,
      lifetime: 1.8,
    };
    this.echoPaths.set(id, { line, data });
  }

  private updateEchoPaths(currentTime: number): void {
    const toRemove: string[] = [];
    this.echoPaths.forEach((entry, id) => {
      const age = currentTime - entry.data.timestamp;
      const t = age / entry.data.lifetime;
      if (t >= 1) {
        toRemove.push(id);
        return;
      }
      const mat = entry.line.material as THREE.LineDashedMaterial;
      mat.opacity = Math.max(0, entry.data.strength * (1 - t));
    });
    toRemove.forEach((id) => {
      const entry = this.echoPaths.get(id);
      if (entry) {
        this.scene.remove(entry.line);
        entry.line.geometry.dispose();
        (entry.line.material as THREE.Material).dispose();
        this.echoPaths.delete(id);
      }
    });
  }

  private registerTarget(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    distance: number,
    echoStrength: number,
    dopplerShift: number,
    materialType: 'rock' | 'metal' | 'fish'
  ): void {
    const toTarget = position.clone().sub(this.sonarOrigin);
    const azimuth = radToDeg(Math.atan2(toTarget.x, toTarget.z));
    const elevation = radToDeg(Math.asin(toTarget.y / Math.max(0.1, toTarget.length())));
    const target: TargetInfo = {
      id: `target_${Date.now().toString(36)}`,
      position: position.clone(),
      velocity: velocity.clone(),
      distance,
      azimuth,
      elevation,
      echoStrength,
      dopplerShift,
      materialType,
      detected: true,
    };
    this.currentTargets = [target];
    if (this.callbacks.onTargetUpdate) {
      this.callbacks.onTargetUpdate(target);
    }
  }

  private scanFishInCone(): void {
    const detected: TargetInfo[] = [];
    this.fishSchoolManager.getFishes().forEach((fish) => {
      const check = pointInSonarCone(fish.data.position, this.sonarOrigin, this.config);
      if (check.inside) {
        const waveDir = fish.data.position.clone().sub(this.sonarOrigin).normalize();
        const dopplerShift = calculateDopplerShift(
          this.config.frequency * 1000,
          fish.data.velocity,
          waveDir
        );
        const strength = calculateEchoStrength(check.distance, 'fish', this.config.frequency, check.angle);
        const toTarget = fish.data.position.clone().sub(this.sonarOrigin);
        detected.push({
          id: fish.id,
          position: fish.data.position.clone(),
          velocity: fish.data.velocity.clone(),
          distance: check.distance,
          azimuth: radToDeg(Math.atan2(toTarget.x, toTarget.z)),
          elevation: radToDeg(Math.asin(toTarget.y / Math.max(0.1, toTarget.length()))),
          echoStrength: strength,
          dopplerShift,
          materialType: 'fish',
          detected: true,
        });
      }
    });
    if (detected.length > 0) {
      detected.sort((a, b) => a.distance - b.distance);
      this.currentTargets = detected;
      if (this.callbacks.onTargetUpdate) {
        this.callbacks.onTargetUpdate(detected[0]);
      }
    }
  }

  private updateFPS(): void {
    const now = performance.now();
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.frameCount++;
    this.fpsAccumulator += dt;
    if (this.fpsAccumulator >= 500) {
      this.currentFPS = Math.round((this.frameCount * 1000) / this.fpsAccumulator);
      this.frameCount = 0;
      this.fpsAccumulator = 0;
      if (this.currentFPS < 30 && this.activeParticleCount > 2000) {
        this.setParticleCount(Math.floor(this.activeParticleCount * 0.85));
      } else if (this.currentFPS >= 55 && this.activeParticleCount < this.totalParticleBudget) {
        this.setParticleCount(Math.min(this.totalParticleBudget, Math.floor(this.activeParticleCount * 1.1)));
      }
      if (this.callbacks.onPerformanceUpdate) {
        this.callbacks.onPerformanceUpdate(this.currentFPS, this.activeParticleCount);
      }
    }
  }

  public update(delta: number, currentTime: number): void {
    this.updateFPS();
    this.updateBeamOrientation();
    this.fishSchoolManager.update(delta, currentTime);
    this.updateReverbParticles(delta, currentTime);
    this.emitPulse(currentTime);
    this.scanFishInCone();
    this.updateEchoPaths(currentTime);

    let primaryDoppler = 0;
    let primaryStrength = 0;
    if (this.currentTargets.length > 0) {
      const t = this.currentTargets[0];
      primaryDoppler = t.dopplerShift;
      primaryStrength = t.echoStrength;
    }
    this.waveformRenderer.render(
      this.config.frequency,
      primaryDoppler,
      primaryStrength,
      this.config.noiseThreshold,
      currentTime
    );

    const snr = calculateSNR(primaryStrength, this.config.reverbDecay, this.config.noiseThreshold);
    this.snrRenderer.addSample({ value: snr, timestamp: currentTime });
    this.snrRenderer.render();

    this.radarRenderer.render(this.config, this.currentTargets, currentTime);

    const sample: WaveformSample = {
      value: primaryStrength,
      frequency: this.config.frequency * 1000 + primaryDoppler,
      timestamp: currentTime,
    };
    this.waveformRenderer.addSample(sample);
  }

  public getConfig(): SonarConfig {
    return this.config;
  }

  public getCurrentTargets(): TargetInfo[] {
    return this.currentTargets;
  }

  public getFPS(): number {
    return this.currentFPS;
  }

  public getActiveParticleCount(): number {
    return this.activeParticleCount;
  }

  public dispose(): void {
    this.gui.destroy();
    this.obstacleManager.dispose();
    this.fishSchoolManager.dispose();
    if (this.beamMesh) {
      this.scene.remove(this.beamMesh);
      this.beamMesh.geometry.dispose();
      (this.beamMesh.material as THREE.Material).dispose();
    }
    if (this.beamInnerLines) {
      this.scene.remove(this.beamInnerLines);
      this.beamInnerLines.geometry.dispose();
      (this.beamInnerLines.material as THREE.Material).dispose();
    }
    if (this.reverbPoints) {
      this.scene.remove(this.reverbPoints);
      this.reverbGeometry?.dispose();
      (this.reverbPoints.material as THREE.Material).dispose();
    }
    this.echoPaths.forEach((entry) => {
      this.scene.remove(entry.line);
      entry.line.geometry.dispose();
      (entry.line.material as THREE.Material).dispose();
    });
    this.echoPaths.clear();
  }
}
