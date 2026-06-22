import * as THREE from 'three';

interface PresetConfig {
  colors: string[];
  freqMultiplier: number;
  ampMultiplier: number;
  bgTop: string;
  bgBottom: string;
}

const PRESETS: Record<'dream' | 'lava' | 'aurora', PresetConfig> = {
  dream: {
    colors: ['#45A29E', '#66FCF1', '#C5C6C7', '#9463FF'],
    freqMultiplier: 1.0,
    ampMultiplier: 1.0,
    bgTop: '#0B0C10',
    bgBottom: '#1F2833'
  },
  lava: {
    colors: ['#FF6B35', '#F7931E', '#FF4444', '#FFD700'],
    freqMultiplier: 1.5,
    ampMultiplier: 1.3,
    bgTop: '#120808',
    bgBottom: '#2B1510'
  },
  aurora: {
    colors: ['#00FFA3', '#9D4EDD', '#4CC9F0', '#F72585'],
    freqMultiplier: 0.8,
    ampMultiplier: 0.9,
    bgTop: '#0C0B14',
    bgBottom: '#181528'
  }
};

const WAVE_COUNT = 8;
const FILAMENT_COUNT = 50;
const CONTROL_POINT_COUNT = 60;
const CURVE_SAMPLE_COUNT = 200;
const PARTICLES_PER_FILAMENT = 80;

interface WaveParams {
  freqX: number;
  freqY: number;
  freqZ: number;
  ampX: number;
  ampY: number;
  ampZ: number;
  phase: number;
}

interface FilamentState {
  basePoints: Float32Array;
  currentPoints: Float32Array;
  deflectedPoints: Float32Array;
  colorIndex: number;
  lineWidth: number;
  baseRotation: THREE.Euler;
  center: THREE.Vector3;
  mesh: THREE.Line;
  glowMesh: THREE.Line;
  targetGlowIntensity: number;
  currentGlowIntensity: number;
  burstPhase: 'idle' | 'burst' | 'shrink' | 'expand';
  burstTime: number;
  burstDuration: number;
  dragOffset: THREE.Vector3;
  springVelocity: THREE.Vector3;
  isDragging: boolean;
}

export default class AuraWeave {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private filaments: FilamentState[] = [];
  private particles: THREE.Points | null = null;
  private particlePositions: Float32Array = new Float32Array(0);
  private particleVelocities: Float32Array = new Float32Array(0);
  private particleOrigins: Float32Array = new Float32Array(0);
  private particleColors: Float32Array = new Float32Array(0);
  private particleActive: Uint8Array = new Uint8Array(0);
  private particleBurstMap: Int32Array = new Int32Array(0);

  private raycaster: THREE.Raycaster;
  private mouseNDC: THREE.Vector2;
  private mouseWorld: THREE.Vector3;
  private mousePlane: THREE.Plane;

  private twistSpeed: number = 1.0;
  private colorSpeedMultiplier: number = 1.0;
  private recoveryTime: number = 1.5;

  private waveParams: WaveParams[];
  private globalTime: number = 0;

  private targetColors: THREE.Color[];
  private currentColors: THREE.Color[];
  private colorTransitionProgress: number = 1;

  private currentPreset: PresetConfig;
  private targetPreset: PresetConfig;
  private presetTransitionProgress: number = 1;

  private bgGradient: HTMLElement;
  private currentBgTop: THREE.Color;
  private currentBgBottom: THREE.Color;
  private targetBgTop: THREE.Color;
  private targetBgBottom: THREE.Color;
  private bgTransitionProgress: number = 1;

  private isDragging: boolean = false;
  private dragStart: THREE.Vector2 = new THREE.Vector2();
  private dragWorldStart: THREE.Vector3 = new THREE.Vector3();
  private selectedFilament: number = -1;

  private tempVec1: THREE.Vector3 = new THREE.Vector3();
  private tempVec2: THREE.Vector3 = new THREE.Vector3();
  private tempVec3: THREE.Vector3 = new THREE.Vector3();

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2(-999, -999);
    this.mouseWorld = new THREE.Vector3(0, 0, 0);
    this.mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this.waveParams = this.generateWaveParams();

    this.currentPreset = PRESETS.dream;
    this.targetPreset = PRESETS.dream;
    this.targetColors = PRESETS.dream.colors.map(c => new THREE.Color(c));
    this.currentColors = PRESETS.dream.colors.map(c => new THREE.Color(c));

    this.bgGradient = document.getElementById('bgGradient')!;
    this.currentBgTop = new THREE.Color(PRESETS.dream.bgTop);
    this.currentBgBottom = new THREE.Color(PRESETS.dream.bgBottom);
    this.targetBgTop = new THREE.Color(PRESETS.dream.bgTop);
    this.targetBgBottom = new THREE.Color(PRESETS.dream.bgBottom);

    this.initFilaments();
    this.initParticles();
    this.bindEvents();
  }

  private generateWaveParams(): WaveParams[] {
    const params: WaveParams[] = [];
    for (let i = 0; i < WAVE_COUNT; i++) {
      const baseFreq = 0.3 + i * 0.25;
      params.push({
        freqX: baseFreq * (0.8 + Math.random() * 0.4),
        freqY: baseFreq * (0.7 + Math.random() * 0.5),
        freqZ: baseFreq * 1.2 * (0.7 + Math.random() * 0.5),
        ampX: (0.8 + Math.random() * 0.4) / (i + 1),
        ampY: (1.0 + Math.random() * 0.5) / (i + 1),
        ampZ: (0.6 + Math.random() * 0.3) / (i + 1),
        phase: Math.random() * Math.PI * 2
      });
    }
    return params;
  }

  private initFilaments(): void {
    for (let i = 0; i < FILAMENT_COUNT; i++) {
      const basePoints = new Float32Array(CONTROL_POINT_COUNT * 3);
      const currentPoints = new Float32Array(CONTROL_POINT_COUNT * 3);
      const deflectedPoints = new Float32Array(CONTROL_POINT_COUNT * 3);

      const angle = (i / FILAMENT_COUNT) * Math.PI * 2;
      const radius = 2 + Math.random() * 4;
      const cx = Math.cos(angle) * radius;
      const cy = (Math.random() - 0.5) * 3;
      const cz = Math.sin(angle) * radius;
      const center = new THREE.Vector3(cx, cy, cz);

      const length = 4 + Math.random() * 5;
      const rotX = Math.random() * Math.PI;
      const rotY = Math.random() * Math.PI;
      const rotZ = Math.random() * Math.PI;
      const baseRotation = new THREE.Euler(rotX, rotY, rotZ);

      for (let j = 0; j < CONTROL_POINT_COUNT; j++) {
        const t = j / (CONTROL_POINT_COUNT - 1);
        basePoints[j * 3] = (t - 0.5) * length;
        basePoints[j * 3 + 1] = 0;
        basePoints[j * 3 + 2] = 0;
      }

      const lineWidth = 2 + Math.random() * 2;
      const colorIndex = i % this.currentColors.length;

      const positions = new Float32Array(CURVE_SAMPLE_COUNT * 3);
      const colors = new Float32Array(CURVE_SAMPLE_COUNT * 3);
      const glowPositions = new Float32Array(CURVE_SAMPLE_COUNT * 3);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const glowGeometry = new THREE.BufferGeometry();
      glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
      glowGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(CURVE_SAMPLE_COUNT * 3), 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        linewidth: lineWidth
      });

      const glowMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const mesh = new THREE.Line(geometry, material);
      const glowMesh = new THREE.Line(glowGeometry, glowMaterial);
      mesh.frustumCulled = false;
      glowMesh.frustumCulled = false;

      this.scene.add(mesh);
      this.scene.add(glowMesh);

      this.filaments.push({
        basePoints,
        currentPoints,
        deflectedPoints,
        colorIndex,
        lineWidth,
        baseRotation,
        center,
        mesh,
        glowMesh,
        targetGlowIntensity: 0.1,
        currentGlowIntensity: 0.1,
        burstPhase: 'idle',
        burstTime: 0,
        burstDuration: 1.5,
        dragOffset: new THREE.Vector3(),
        springVelocity: new THREE.Vector3(),
        isDragging: false
      });
    }
  }

  private initParticles(): void {
    const totalParticles = FILAMENT_COUNT * PARTICLES_PER_FILAMENT;
    this.particlePositions = new Float32Array(totalParticles * 3);
    this.particleVelocities = new Float32Array(totalParticles * 3);
    this.particleOrigins = new Float32Array(totalParticles * 3);
    this.particleColors = new Float32Array(totalParticles * 3);
    this.particleActive = new Uint8Array(totalParticles);
    this.particleBurstMap = new Int32Array(totalParticles).fill(-1);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: texture
    });

    this.particles = new THREE.Points(geometry, material);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousemove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouseNDC, this.camera);
      this.raycaster.ray.intersectPlane(this.mousePlane, this.mouseWorld);

      if (this.isDragging && this.selectedFilament >= 0) {
        const f = this.filaments[this.selectedFilament];
        this.tempVec1.copy(this.mouseWorld).sub(this.dragWorldStart);
        f.dragOffset.copy(this.tempVec1);
      }
    });

    dom.addEventListener('mouseleave', () => {
      this.mouseNDC.set(-999, -999);
    });

    dom.addEventListener('mousedown', (e) => {
      const rect = dom.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      this.raycaster.setFromCamera(ndc, this.camera);

      const meshes = this.filaments.map(f => f.mesh);
      const intersects = this.raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Line;
        const idx = meshes.indexOf(hitMesh);
        if (idx >= 0) {
          this.triggerBurst(idx);
        }
      }

      this.dragStart.set(e.clientX, e.clientY);
      this.raycaster.setFromCamera(ndc, this.camera);
      this.raycaster.ray.intersectPlane(this.mousePlane, this.dragWorldStart);

      let closestIdx = -1;
      let closestDist = Infinity;
      for (let i = 0; i < this.filaments.length; i++) {
        this.tempVec1.copy(this.filaments[i].center).add(this.filaments[i].dragOffset);
        this.tempVec2.copy(this.dragWorldStart);
        const dx = this.tempVec1.x - this.tempVec2.x;
        const dy = this.tempVec1.y - this.tempVec2.y;
        const dz = this.tempVec1.z - this.tempVec2.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < closestDist && dist < 6) {
          closestDist = dist;
          closestIdx = i;
        }
      }
      if (closestIdx >= 0) {
        this.selectedFilament = closestIdx;
        this.isDragging = true;
        this.filaments[closestIdx].isDragging = true;
      }
    });

    dom.addEventListener('mouseup', () => {
      if (this.isDragging && this.selectedFilament >= 0) {
        this.filaments[this.selectedFilament].isDragging = false;
      }
      this.isDragging = false;
      this.selectedFilament = -1;
    });
  }

  public setTwistSpeed(v: number): void {
    this.twistSpeed = v;
  }

  public setColorSpeed(v: 'slow' | 'medium' | 'fast'): void {
    if (v === 'slow') this.colorSpeedMultiplier = 0.4;
    else if (v === 'fast') this.colorSpeedMultiplier = 2.2;
    else this.colorSpeedMultiplier = 1.0;
  }

  public setRecoveryTime(v: number): void {
    this.recoveryTime = v;
  }

  public setPreset(preset: 'dream' | 'lava' | 'aurora'): void {
    this.targetPreset = PRESETS[preset];
    this.targetColors = PRESETS[preset].colors.map(c => new THREE.Color(c));
    this.targetBgTop = new THREE.Color(PRESETS[preset].bgTop);
    this.targetBgBottom = new THREE.Color(PRESETS[preset].bgBottom);
    this.colorTransitionProgress = 0;
    this.presetTransitionProgress = 0;
    this.bgTransitionProgress = 0;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private easeInCubic(t: number): number {
    return t * t * t;
  }

  private lerpColor(from: THREE.Color, to: THREE.Color, t: number, out: THREE.Color): void {
    out.r = from.r + (to.r - from.r) * t;
    out.g = from.g + (to.g - from.g) * t;
    out.b = from.b + (to.b - from.b) * t;
  }

  private updateControlPoints(filament: FilamentState, time: number): void {
    const { basePoints, currentPoints, baseRotation, center, baseRotation: rot } = filament;

    let freqMul = this.currentPreset.freqMultiplier;
    let ampMul = this.currentPreset.ampMultiplier;
    if (this.presetTransitionProgress < 1) {
      const t = this.presetTransitionProgress;
      freqMul = this.currentPreset.freqMultiplier + (this.targetPreset.freqMultiplier - this.currentPreset.freqMultiplier) * t;
      ampMul = this.currentPreset.ampMultiplier + (this.targetPreset.ampMultiplier - this.currentPreset.ampMultiplier) * t;
    }

    const cosX = Math.cos(rot.x), sinX = Math.sin(rot.x);
    const cosY = Math.cos(rot.y), sinY = Math.sin(rot.y);
    const cosZ = Math.cos(rot.z), sinZ = Math.sin(rot.z);

    for (let j = 0; j < CONTROL_POINT_COUNT; j++) {
      const ji = j * 3;
      let ox = basePoints[ji];
      let oy = basePoints[ji + 1];
      let oz = basePoints[ji + 2];

      const tPos = j / (CONTROL_POINT_COUNT - 1);

      let waveX = 0, waveY = 0, waveZ = 0;
      for (let w = 0; w < WAVE_COUNT; w++) {
        const wp = this.waveParams[w];
        const timeFactor = time * this.twistSpeed * freqMul + wp.phase;
        const tFreq = tPos * 3.0;
        waveX += Math.sin(timeFactor * wp.freqX + tFreq + wp.phase) * wp.ampX * ampMul;
        waveY += Math.cos(timeFactor * wp.freqY + tFreq * 1.3 + wp.phase) * wp.ampY * ampMul;
        waveZ += Math.sin(timeFactor * wp.freqZ * 0.7 + tFreq * 0.8) * wp.ampZ * ampMul
               + Math.cos(timeFactor * wp.freqZ + tFreq * 1.7) * wp.ampZ * 0.6 * ampMul;
      }

      ox += waveX * 2.0;
      oy += waveY * 1.5;
      oz += waveZ * 1.8;

      let x1 = ox;
      let y1 = oy * cosX - oz * sinX;
      let z1 = oy * sinX + oz * cosX;

      let x2 = x1 * cosY + z1 * sinY;
      let y2 = y1;
      let z2 = -x1 * sinY + z1 * cosY;

      let x3 = x2 * cosZ - y2 * sinZ;
      let y3 = x2 * sinZ + y2 * cosZ;
      let z3 = z2;

      currentPoints[ji] = x3 + center.x;
      currentPoints[ji + 1] = y3 + center.y;
      currentPoints[ji + 2] = z3 + center.z;
    }
  }

  private applyMouseDeflection(filament: FilamentState, dt: number): void {
    const { currentPoints, deflectedPoints, center, dragOffset, springVelocity, isDragging: fDragging } = filament;

    this.tempVec1.copy(center).add(dragOffset);
    const dx = this.mouseWorld.x - this.tempVec1.x;
    const dy = this.mouseWorld.y - this.tempVec1.y;
    const dz = this.mouseWorld.z - this.tempVec1.z;
    const distToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz);

    let glowTarget = 0.1;
    const influenceRadius = 10.0;

    if (distToMouse < influenceRadius && this.mouseNDC.x > -2) {
      const influence = 1 - distToMouse / influenceRadius;
      const angleFactor = this.easeOutCubic(Math.min(influence, 1)) * 30 * Math.PI / 180;
      const maxDeflect = 2.5 * influence;

      this.tempVec2.set(dx, dy, dz).normalize();

      const transitionT = this.easeOutCubic(Math.min(1, dt / 0.5));

      for (let j = 0; j < CONTROL_POINT_COUNT; j++) {
        const ji = j * 3;
        this.tempVec3.set(currentPoints[ji], currentPoints[ji + 1], currentPoints[ji + 2]);
        this.tempVec3.sub(center);

        const tPos = j / (CONTROL_POINT_COUNT - 1);
        const endFactor = Math.abs(tPos - 0.5) * 2;
        const deflectAmount = angleFactor * endFactor;

        this.tempVec1.copy(this.tempVec2).multiplyScalar(maxDeflect * endFactor * 0.6);

        const cx = this.tempVec3.x;
        const cy = this.tempVec3.y;
        const cz = this.tempVec3.z;

        const rx = cx + (-cy * Math.sin(deflectAmount * 0.3) + cz * Math.cos(deflectAmount * 0.5)) * 0.0 + this.tempVec1.x;
        const ry = cy + this.tempVec1.y;
        const rz = cz + this.tempVec1.z;

        const targetX = rx + center.x + dragOffset.x;
        const targetY = ry + center.y + dragOffset.y;
        const targetZ = rz + center.z + dragOffset.z;

        deflectedPoints[ji] = deflectedPoints[ji] + (targetX - deflectedPoints[ji]) * transitionT;
        deflectedPoints[ji + 1] = deflectedPoints[ji + 1] + (targetY - deflectedPoints[ji + 1]) * transitionT;
        deflectedPoints[ji + 2] = deflectedPoints[ji + 2] + (targetZ - deflectedPoints[ji + 2]) * transitionT;
      }

      glowTarget = 0.1 + (0.6 - 0.1) * this.easeOutCubic(influence);
    } else {
      const transitionT = this.easeOutCubic(Math.min(1, dt / 0.5));
      for (let j = 0; j < CONTROL_POINT_COUNT; j++) {
        const ji = j * 3;
        const targetX = currentPoints[ji] + dragOffset.x;
        const targetY = currentPoints[ji + 1] + dragOffset.y;
        const targetZ = currentPoints[ji + 2] + dragOffset.z;
        deflectedPoints[ji] = deflectedPoints[ji] + (targetX - deflectedPoints[ji]) * transitionT;
        deflectedPoints[ji + 1] = deflectedPoints[ji + 1] + (targetY - deflectedPoints[ji + 1]) * transitionT;
        deflectedPoints[ji + 2] = deflectedPoints[ji + 2] + (targetZ - deflectedPoints[ji + 2]) * transitionT;
      }
    }

    const glowTransitionT = this.easeOutCubic(Math.min(1, dt / 0.5));
    filament.targetGlowIntensity = glowTarget;
    filament.currentGlowIntensity = filament.currentGlowIntensity + (filament.targetGlowIntensity - filament.currentGlowIntensity) * glowTransitionT;

    if (!fDragging) {
      const springK = 120;
      const damping = 8;
      springVelocity.x += (-dragOffset.x * springK - springVelocity.x * damping) * dt;
      springVelocity.y += (-dragOffset.y * springK - springVelocity.y * damping) * dt;
      springVelocity.z += (-dragOffset.z * springK - springVelocity.z * damping) * dt;
      dragOffset.x += springVelocity.x * dt;
      dragOffset.y += springVelocity.y * dt;
      dragOffset.z += springVelocity.z * dt;
      const totalDragLen = Math.sqrt(dragOffset.x * dragOffset.x + dragOffset.y * dragOffset.y + dragOffset.z * dragOffset.z);
      if (totalDragLen < 0.001 && springVelocity.length() < 0.01) {
        dragOffset.set(0, 0, 0);
        springVelocity.set(0, 0, 0);
      }
    }
  }

  private updateFilamentMesh(filament: FilamentState, filamentIndex: number): void {
    if (filament.burstPhase !== 'idle') return;

    const { deflectedPoints, mesh, glowMesh } = filament;
    const posAttr = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
    const glowPosAttr = glowMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const glowColorAttr = glowMesh.geometry.getAttribute('color') as THREE.BufferAttribute;

    const positions = posAttr.array as Float32Array;
    const colors = colorAttr.array as Float32Array;
    const glowPositions = glowPosAttr.array as Float32Array;
    const glowColors = glowColorAttr.array as Float32Array;

    const curvePoints: THREE.Vector3[] = [];
    for (let j = 0; j < CONTROL_POINT_COUNT; j++) {
      curvePoints.push(new THREE.Vector3(
        deflectedPoints[j * 3],
        deflectedPoints[j * 3 + 1],
        deflectedPoints[j * 3 + 2]
      ));
    }

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const sampled = curve.getPoints(CURVE_SAMPLE_COUNT);

    let baseColor: THREE.Color;
    if (this.colorTransitionProgress < 1) {
      const fromColor = this.currentColors[filament.colorIndex % this.currentColors.length];
      const toColor = this.targetColors[filament.colorIndex % this.targetColors.length];
      baseColor = new THREE.Color();
      this.lerpColor(fromColor, toColor, this.colorTransitionProgress, baseColor);
    } else {
      baseColor = this.currentColors[filament.colorIndex % this.currentColors.length];
    }

    for (let j = 0; j < CURVE_SAMPLE_COUNT; j++) {
      const ji = j * 3;
      positions[ji] = sampled[j].x;
      positions[ji + 1] = sampled[j].y;
      positions[ji + 2] = sampled[j].z;

      glowPositions[ji] = sampled[j].x;
      glowPositions[ji + 1] = sampled[j].y;
      glowPositions[ji + 2] = sampled[j].z;

      const tPos = j / (CURVE_SAMPLE_COUNT - 1);
      const nextIdx = (filament.colorIndex + 1) % this.currentColors.length;
      let c1: THREE.Color, c2: THREE.Color;
      if (this.colorTransitionProgress < 1) {
        c1 = new THREE.Color();
        c2 = new THREE.Color();
        this.lerpColor(this.currentColors[filament.colorIndex % this.currentColors.length], this.targetColors[filament.colorIndex % this.targetColors.length], this.colorTransitionProgress, c1);
        this.lerpColor(this.currentColors[nextIdx], this.targetColors[nextIdx], this.colorTransitionProgress, c2);
      } else {
        c1 = this.currentColors[filament.colorIndex % this.currentColors.length];
        c2 = this.currentColors[nextIdx];
      }
      const localT = (tPos + filament.colorIndex * 0.2 + this.globalTime * 0.1 * this.colorSpeedMultiplier) % 1;
      const mix = 0.5 + 0.5 * Math.sin(localT * Math.PI * 2);
      colors[ji] = c1.r * (1 - mix) + c2.r * mix;
      colors[ji + 1] = c1.g * (1 - mix) + c2.g * mix;
      colors[ji + 2] = c1.b * (1 - mix) + c2.b * mix;

      glowColors[ji] = baseColor.r;
      glowColors[ji + 1] = baseColor.g;
      glowColors[ji + 2] = baseColor.b;
    }

    (mesh.material as THREE.LineBasicMaterial).linewidth = filament.lineWidth;
    (glowMesh.material as THREE.LineBasicMaterial).opacity = filament.currentGlowIntensity;

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    glowPosAttr.needsUpdate = true;
    glowColorAttr.needsUpdate = true;

    mesh.visible = true;
    glowMesh.visible = true;
  }

  private triggerBurst(filamentIndex: number): void {
    const f = this.filaments[filamentIndex];
    if (f.burstPhase !== 'idle') return;

    const totalStart = filamentIndex * PARTICLES_PER_FILAMENT;
    f.burstPhase = 'burst';
    f.burstTime = 0;
    f.burstDuration = this.recoveryTime;
    f.mesh.visible = false;
    f.glowMesh.visible = false;

    let baseColor: THREE.Color;
    if (this.colorTransitionProgress < 1) {
      const fromColor = this.currentColors[f.colorIndex % this.currentColors.length];
      const toColor = this.targetColors[f.colorIndex % this.targetColors.length];
      baseColor = new THREE.Color();
      this.lerpColor(fromColor, toColor, this.colorTransitionProgress, baseColor);
    } else {
      baseColor = this.currentColors[f.colorIndex % this.currentColors.length];
    }

    const curvePoints: THREE.Vector3[] = [];
    for (let j = 0; j < CONTROL_POINT_COUNT; j++) {
      curvePoints.push(new THREE.Vector3(
        f.deflectedPoints[j * 3],
        f.deflectedPoints[j * 3 + 1],
        f.deflectedPoints[j * 3 + 2]
      ));
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints);

    const filCenterX = f.center.x + f.dragOffset.x;
    const filCenterY = f.center.y + f.dragOffset.y;
    const filCenterZ = f.center.z + f.dragOffset.z;

    for (let i = 0; i < PARTICLES_PER_FILAMENT; i++) {
      const pIdx = totalStart + i;
      const tCurve = i / (PARTICLES_PER_FILAMENT - 1);
      const pt = curve.getPoint(tCurve);

      this.particleOrigins[pIdx * 3] = pt.x;
      this.particleOrigins[pIdx * 3 + 1] = pt.y;
      this.particleOrigins[pIdx * 3 + 2] = pt.z;

      this.particlePositions[pIdx * 3] = pt.x;
      this.particlePositions[pIdx * 3 + 1] = pt.y;
      this.particlePositions[pIdx * 3 + 2] = pt.z;

      const dirX = pt.x - filCenterX;
      const dirY = pt.y - filCenterY;
      const dirZ = pt.z - filCenterZ;
      const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
      const randomSpreadX = (Math.random() - 0.5) * 2;
      const randomSpreadY = (Math.random() - 0.5) * 2;
      const randomSpreadZ = (Math.random() - 0.5) * 2;
      const speed = 4 + Math.random() * 6;
      this.particleVelocities[pIdx * 3] = (dirX / dirLen + randomSpreadX * 0.6) * speed;
      this.particleVelocities[pIdx * 3 + 1] = (dirY / dirLen + randomSpreadY * 0.6) * speed;
      this.particleVelocities[pIdx * 3 + 2] = (dirZ / dirLen + randomSpreadZ * 0.6) * speed;

      const colorJitter = 0.3;
      this.particleColors[pIdx * 3] = Math.min(1, baseColor.r + (Math.random() - 0.5) * colorJitter);
      this.particleColors[pIdx * 3 + 1] = Math.min(1, baseColor.g + (Math.random() - 0.5) * colorJitter);
      this.particleColors[pIdx * 3 + 2] = Math.min(1, baseColor.b + (Math.random() - 0.5) * colorJitter);

      this.particleActive[pIdx] = 1;
      this.particleBurstMap[pIdx] = filamentIndex;
    }

    const posAttr = this.particles!.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = this.particles!.geometry.getAttribute('color') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  }

  private updateBurstParticles(dt: number): void {
    const posAttr = this.particles!.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;

    for (let i = 0; i < FILAMENT_COUNT; i++) {
      const f = this.filaments[i];
      if (f.burstPhase === 'idle') continue;

      f.burstTime += dt;
      const shrinkDuration = 0.2;
      const totalRecovery = f.burstDuration;
      const expandDuration = Math.max(0.1, totalRecovery - shrinkDuration);

      const particleStart = i * PARTICLES_PER_FILAMENT;

      if (f.burstPhase === 'burst') {
        if (f.burstTime >= 0.35) {
          f.burstPhase = 'shrink';
          f.burstTime = 0;
        } else {
          const t = f.burstTime / 0.35;
          const drag = 3.5;
          for (let p = 0; p < PARTICLES_PER_FILAMENT; p++) {
            const pIdx = particleStart + p;
            if (!this.particleActive[pIdx]) continue;
            const vi = pIdx * 3;
            this.particleVelocities[vi] *= Math.exp(-drag * dt);
            this.particleVelocities[vi + 1] *= Math.exp(-drag * dt);
            this.particleVelocities[vi + 2] *= Math.exp(-drag * dt);
            this.particleVelocities[vi + 1] -= 1.5 * dt;

            positions[vi] += this.particleVelocities[vi] * dt;
            positions[vi + 1] += this.particleVelocities[vi + 1] * dt;
            positions[vi + 2] += this.particleVelocities[vi + 2] * dt;
          }
        }
      } else if (f.burstPhase === 'shrink') {
        const filCenterX = f.center.x + f.dragOffset.x;
        const filCenterY = f.center.y + f.dragOffset.y;
        const filCenterZ = f.center.z + f.dragOffset.z;

        if (f.burstTime >= shrinkDuration) {
          f.burstPhase = 'expand';
          f.burstTime = 0;
          for (let p = 0; p < PARTICLES_PER_FILAMENT; p++) {
            const pIdx = particleStart + p;
            const vi = pIdx * 3;
            positions[vi] = filCenterX;
            positions[vi + 1] = filCenterY;
            positions[vi + 2] = filCenterZ;
          }
        } else {
          const t = f.burstTime / shrinkDuration;
          const easeT = this.easeInCubic(t);
          for (let p = 0; p < PARTICLES_PER_FILAMENT; p++) {
            const pIdx = particleStart + p;
            if (!this.particleActive[pIdx]) continue;
            const vi = pIdx * 3;
            positions[vi] = positions[vi] + (filCenterX - positions[vi]) * easeT;
            positions[vi + 1] = positions[vi + 1] + (filCenterY - positions[vi + 1]) * easeT;
            positions[vi + 2] = positions[vi + 2] + (filCenterZ - positions[vi + 2]) * easeT;
          }
        }
      } else if (f.burstPhase === 'expand') {
        if (f.burstTime >= expandDuration) {
          for (let p = 0; p < PARTICLES_PER_FILAMENT; p++) {
            const pIdx = particleStart + p;
            const vi = pIdx * 3;
            positions[vi] = this.particleOrigins[vi];
            positions[vi + 1] = this.particleOrigins[vi + 1];
            positions[vi + 2] = this.particleOrigins[vi + 2];
            this.particleActive[pIdx] = 0;
            this.particleBurstMap[pIdx] = -1;
          }
          f.burstPhase = 'idle';
          f.burstTime = 0;
          f.mesh.visible = true;
          f.glowMesh.visible = true;
        } else {
          const t = f.burstTime / expandDuration;
          const easeT = this.easeOutCubic(t);
          for (let p = 0; p < PARTICLES_PER_FILAMENT; p++) {
            const pIdx = particleStart + p;
            if (!this.particleActive[pIdx]) continue;
            const vi = pIdx * 3;
            const filCenterX = f.center.x + f.dragOffset.x;
            const filCenterY = f.center.y + f.dragOffset.y;
            const filCenterZ = f.center.z + f.dragOffset.z;
            positions[vi] = filCenterX + (this.particleOrigins[vi] - filCenterX) * easeT;
            positions[vi + 1] = filCenterY + (this.particleOrigins[vi + 1] - filCenterY) * easeT;
            positions[vi + 2] = filCenterZ + (this.particleOrigins[vi + 2] - filCenterZ) * easeT;
          }
        }
      }
    }

    posAttr.needsUpdate = true;
  }

  private updateTransitions(dt: number): void {
    if (this.colorTransitionProgress < 1) {
      this.colorTransitionProgress = Math.min(1, this.colorTransitionProgress + dt / 0.3);
      if (this.colorTransitionProgress >= 1) {
        for (let i = 0; i < this.currentColors.length; i++) {
          this.currentColors[i].copy(this.targetColors[i]);
        }
      }
    }

    if (this.presetTransitionProgress < 1) {
      this.presetTransitionProgress = Math.min(1, this.presetTransitionProgress + dt / 0.3);
      if (this.presetTransitionProgress >= 1) {
        this.currentPreset = this.targetPreset;
      }
    }

    if (this.bgTransitionProgress < 1) {
      this.bgTransitionProgress = Math.min(1, this.bgTransitionProgress + dt / 0.3);
      const t = this.easeOutCubic(this.bgTransitionProgress);
      const rTop = Math.round((this.currentBgTop.r + (this.targetBgTop.r - this.currentBgTop.r) * t) * 255);
      const gTop = Math.round((this.currentBgTop.g + (this.targetBgTop.g - this.currentBgTop.g) * t) * 255);
      const bTop = Math.round((this.currentBgTop.b + (this.targetBgTop.b - this.currentBgTop.b) * t) * 255);
      const rBot = Math.round((this.currentBgBottom.r + (this.targetBgBottom.r - this.currentBgBottom.r) * t) * 255);
      const gBot = Math.round((this.currentBgBottom.g + (this.targetBgBottom.g - this.currentBgBottom.g) * t) * 255);
      const bBot = Math.round((this.currentBgBottom.b + (this.targetBgBottom.b - this.currentBgBottom.b) * t) * 255);
      this.bgGradient.style.background = `linear-gradient(180deg, rgb(${rTop},${gTop},${bTop}) 0%, rgb(${rBot},${gBot},${bBot}) 100%)`;
      if (this.bgTransitionProgress >= 1) {
        this.currentBgTop.copy(this.targetBgTop);
        this.currentBgBottom.copy(this.targetBgBottom);
      }
    }
  }

  public update(dt: number): void {
    this.globalTime += dt;

    this.updateTransitions(dt);

    for (let i = 0; i < this.filaments.length; i++) {
      const f = this.filaments[i];
      this.updateControlPoints(f, this.globalTime);
      this.applyMouseDeflection(f, dt);
      this.updateFilamentMesh(f, i);
    }

    this.updateBurstParticles(dt);
  }
}
