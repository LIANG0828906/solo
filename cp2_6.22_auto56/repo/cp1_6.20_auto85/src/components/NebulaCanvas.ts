import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import type { NebulaParams, Morphology } from '../types';

const MAX_PARTICLES = 20000;
const WAVE_PARTICLE_COUNT = 200;

interface ParticleData {
  position: Float32Array;
  velocity: Float32Array;
  basePosition: Float32Array;
  color: Float32Array;
  size: Float32Array;
  alpha: Float32Array;
  seed: Float32Array;
}

export class NebulaCanvas {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;

  private nebulaPoints: THREE.Points | null = null;
  private nebulaGeometry: THREE.BufferGeometry | null = null;
  private nebulaMaterial: THREE.ShaderMaterial | null = null;
  private starField: THREE.Points | null = null;

  private particleData: ParticleData | null = null;
  private currentCount = 0;
  private currentParams: NebulaParams;
  private targetParams: NebulaParams;

  private wavePoints: THREE.Points | null = null;
  private waveGeometry: THREE.BufferGeometry | null = null;
  private waveMaterial: THREE.ShaderMaterial | null = null;
  private waveStartTime = 0;
  private waveActive = false;
  private waveOrigin = new THREE.Vector3();

  private autoRotate = true;
  private autoRotateResumeAt = 0;
  private lastInteractionTime = 0;

  private animationId: number | null = null;
  private clock = new THREE.Clock();
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, initialParams: NebulaParams) {
    this.container = container;
    this.currentParams = { ...initialParams };
    this.targetParams = { ...initialParams };

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.camera.position.set(0, 0, 15);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 1);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotateSpeed = 360 / 30;
    this.controls.autoRotate = true;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);

    this.createStarField();
    this.createNebulaParticles();
    this.createWaveEffect();
    this.setupInteractionListeners();
    this.onResize();
    this.animate();
  }

  private onResize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  private createStarField() {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 50 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness * (0.9 + Math.random() * 0.1);
      sizes[i] = 0.3 + Math.random() * 0.8;
      alphas[i] = 0.4 + Math.random() * 0.6;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vTime;
        uniform float uTime;
        void main() {
          vColor = color;
          vAlpha = alpha * (0.6 + 0.4 * sin(uTime * 2.0 + position.x * 0.1));
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float a = 1.0 - smoothstep(0.0, 0.5, d);
          gl_FragColor = vec4(vColor, a * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });
    this.starField = new THREE.Points(geom, mat);
    this.scene.add(this.starField);

    const bgGeom = new THREE.SphereGeometry(200, 32, 32);
    const bgMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {},
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        void main() {
          vec3 dir = normalize(vPos);
          float t = dir.y * 0.5 + 0.5;
          vec3 c1 = vec3(0.04, 0.04, 0.1);
          vec3 c2 = vec3(0.06, 0.02, 0.15);
          vec3 c3 = vec3(0.02, 0.02, 0.05);
          vec3 col = mix(c1, c2, t);
          float dist = length(dir.xy);
          col = mix(col, c3, smoothstep(0.0, 1.0, dist));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthWrite: false,
    });
    this.scene.add(new THREE.Mesh(bgGeom, bgMat));
  }

  private generateMorphologyPositions(
    morphology: Morphology,
    count: number,
    positions: Float32Array,
    seeds: Float32Array
  ) {
    for (let i = 0; i < count; i++) {
      const seed = Math.random();
      seeds[i] = seed;
      let x = 0, y = 0, z = 0;
      if (morphology === 'spiral') {
        const arms = 4;
        const arm = Math.floor(Math.random() * arms);
        const armAngle = (arm / arms) * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.55) * 5.5;
        const twists = r * 1.0;
        const angle = armAngle + twists + (Math.random() - 0.5) * 0.6;
        x = Math.cos(angle) * r + (Math.random() - 0.5) * 0.5;
        z = Math.sin(angle) * r + (Math.random() - 0.5) * 0.5;
        y = (Math.random() - 0.5) * (0.8 + r * 0.15);
      } else if (morphology === 'elliptical') {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.pow(Math.random(), 0.7) * 5;
        const a = 1.0, b = 0.7, c = 0.6;
        x = a * r * Math.sin(phi) * Math.cos(theta);
        z = b * r * Math.sin(phi) * Math.sin(theta);
        y = c * r * Math.cos(phi);
      } else {
        const r = Math.pow(Math.random(), 0.5) * 6;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const noise = 1 + Math.sin(r * 2) * 0.3 + Math.sin(r * 5 + seed * 10) * 0.2;
        x = r * noise * Math.sin(phi) * Math.cos(theta);
        z = r * noise * Math.sin(phi) * Math.sin(theta);
        y = r * noise * Math.cos(phi) * 0.7;
      }
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
  }

  private updateParticleColors(
    count: number,
    positions: Float32Array,
    colors: Float32Array,
    sizes: Float32Array,
    alphas: Float32Array,
    colorShift: number
  ) {
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      const t = Math.min(dist / 6, 1);
      const warmR = 1.0, warmG = 0.42, warmB = 0.21;
      const coolR = 0.13, coolG = 0.59, coolB = 0.95;
      const r = warmR + (coolR - warmR) * t;
      const g = warmG + (coolG - warmG) * t;
      const b = warmB + (coolB - warmB) * t;
      const shiftR = r * (1 - colorShift) + coolR * colorShift;
      const shiftG = g * (1 - colorShift) + coolG * colorShift;
      const shiftB = b * (1 - colorShift) + (0.8 * colorShift);
      colors[i * 3] = shiftR;
      colors[i * 3 + 1] = shiftG;
      colors[i * 3 + 2] = shiftB;
      sizes[i] = 1.5 + (1 - t) * 2 + Math.random() * 0.5;
      alphas[i] = 0.3 + (1 - t) * 0.5 + Math.random() * 0.2;
    }
  }

  private createNebulaParticles() {
    const position = new Float32Array(MAX_PARTICLES * 3);
    const velocity = new Float32Array(MAX_PARTICLES * 3);
    const basePosition = new Float32Array(MAX_PARTICLES * 3);
    const color = new Float32Array(MAX_PARTICLES * 3);
    const size = new Float32Array(MAX_PARTICLES);
    const alpha = new Float32Array(MAX_PARTICLES);
    const seed = new Float32Array(MAX_PARTICLES);

    this.particleData = { position, velocity, basePosition, color, size, alpha, seed };
    this.currentCount = this.currentParams.particleCount;

    this.generateMorphologyPositions(this.currentParams.morphology, this.currentCount, basePosition, seed);
    position.set(basePosition);
    this.updateParticleColors(this.currentCount, position, color, size, alpha, this.currentParams.colorShift);

    for (let i = 0; i < this.currentCount; i++) {
      velocity[i * 3] = (Math.random() - 0.5) * 0.01;
      velocity[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocity[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    this.nebulaGeometry = new THREE.BufferGeometry();
    this.nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(position, 3).setUsage(THREE.DynamicDrawUsage));
    this.nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(color, 3).setUsage(THREE.DynamicDrawUsage));
    this.nebulaGeometry.setAttribute('size', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
    this.nebulaGeometry.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.nebulaGeometry.setDrawRange(0, this.currentCount);

    this.nebulaMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        void main() {
          vColor = color;
          vAlpha = alpha * (0.85 + 0.15 * sin(uTime * 1.5 + position.x * 0.5 + position.y * 0.3));
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (400.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = 1.0 - smoothstep(0.0, 0.5, d);
          glow = pow(glow, 1.5);
          gl_FragColor = vec4(vColor, glow * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });

    this.nebulaPoints = new THREE.Points(this.nebulaGeometry, this.nebulaMaterial);
    this.scene.add(this.nebulaPoints);
  }

  private createWaveEffect() {
    const positions = new Float32Array(WAVE_PARTICLE_COUNT * 3);
    const colors = new Float32Array(WAVE_PARTICLE_COUNT * 3);
    const sizes = new Float32Array(WAVE_PARTICLE_COUNT);
    for (let i = 0; i < WAVE_PARTICLE_COUNT; i++) {
      const angle = (i / WAVE_PARTICLE_COUNT) * Math.PI * 2;
      positions[i * 3] = Math.cos(angle);
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(angle);
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.6;
      colors[i * 3 + 2] = 0.3;
      sizes[i] = 2;
    }
    this.waveGeometry = new THREE.BufferGeometry();
    this.waveGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.waveGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
    this.waveGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.waveMaterial = new THREE.ShaderMaterial({
      uniforms: { uAlpha: { value: 0 } },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vSize;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (400.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float uAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = 1.0 - smoothstep(0.0, 0.5, d);
          gl_FragColor = vec4(vColor, glow * uAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });
    this.wavePoints = new THREE.Points(this.waveGeometry, this.waveMaterial);
    this.wavePoints.visible = false;
    this.scene.add(this.wavePoints);
  }

  private setupInteractionListeners() {
    const dom = this.renderer.domElement;
    const pauseAuto = () => {
      this.controls.autoRotate = false;
      this.autoRotate = false;
      this.lastInteractionTime = performance.now();
    };
    dom.addEventListener('pointerdown', pauseAuto);
    dom.addEventListener('wheel', pauseAuto, { passive: true });
    dom.addEventListener('pointermove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });
    dom.addEventListener('click', () => this.onClick());
  }

  private onClick() {
    if (!this.nebulaPoints) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.nebulaPoints);
    if (hits.length > 0 || this.raycaster.ray.direction) {
      const dir = this.raycaster.ray.direction.clone();
      const origin = this.raycaster.ray.origin.clone();
      const t = 15 / Math.abs(dir.z || 1);
      const point = origin.add(dir.multiplyScalar(t));
      this.triggerWave(point);
    }
  }

  triggerWave(origin: THREE.Vector3) {
    if (!this.wavePoints || !this.waveGeometry || !this.waveMaterial) return;
    this.waveOrigin.copy(origin);
    this.waveActive = true;
    this.waveStartTime = performance.now();
    this.wavePoints.visible = true;
    const positions = this.waveGeometry.attributes.position.array as Float32Array;
    const colors = this.waveGeometry.attributes.color.array as Float32Array;
    for (let i = 0; i < WAVE_PARTICLE_COUNT; i++) {
      const hue = (i / WAVE_PARTICLE_COUNT + Math.random() * 0.1) % 1;
      const c = new THREE.Color().setHSL(hue, 0.9, 0.6);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    this.waveGeometry.attributes.color.needsUpdate = true;
  }

  updateParams(newParams: Partial<NebulaParams>) {
    const oldCount = this.currentCount;
    const oldMorph = this.currentParams.morphology;
    this.targetParams = { ...this.targetParams, ...newParams };
    const countChanged = newParams.particleCount !== undefined && newParams.particleCount !== this.currentParams.particleCount;
    const morphChanged = newParams.morphology !== undefined && newParams.morphology !== this.currentParams.morphology;
    const colorChanged = newParams.colorShift !== undefined;
    gsap.to(this.currentParams, {
      ...this.targetParams,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (!this.particleData) return;
        if (morphChanged || countChanged) {
          this.currentCount = Math.round(this.currentParams.particleCount);
          this.generateMorphologyPositions(
            this.currentParams.morphology,
            this.currentCount,
            this.particleData.basePosition,
            this.particleData.seed
          );
          this.particleData.position.set(this.particleData.basePosition);
          if (this.nebulaGeometry) {
            this.nebulaGeometry.setDrawRange(0, this.currentCount);
            this.nebulaGeometry.attributes.position.needsUpdate = true;
          }
        } else {
          for (let i = 0; i < this.currentCount; i++) {
            this.particleData.position[i * 3] = this.particleData.basePosition[i * 3];
            this.particleData.position[i * 3 + 1] = this.particleData.basePosition[i * 3 + 1];
            this.particleData.position[i * 3 + 2] = this.particleData.basePosition[i * 3 + 2];
          }
        }
        if (colorChanged || morphChanged || countChanged) {
          this.updateParticleColors(
            this.currentCount,
            this.particleData.position,
            this.particleData.color,
            this.particleData.size,
            this.particleData.alpha,
            this.currentParams.colorShift
          );
          if (this.nebulaGeometry) {
            this.nebulaGeometry.attributes.color.needsUpdate = true;
            this.nebulaGeometry.attributes.size.needsUpdate = true;
            this.nebulaGeometry.attributes.alpha.needsUpdate = true;
          }
        }
      },
    });
  }

  switchMorphology(morphology: Morphology) {
    this.updateParams({ morphology });
  }

  reset() {
    this.updateParams(this.targetParams);
  }

  private updateWave(dt: number) {
    if (!this.waveActive || !this.waveGeometry || !this.waveMaterial || !this.wavePoints) return;
    const elapsed = (performance.now() - this.waveStartTime) / 1000;
    const duration = 2;
    if (elapsed >= duration) {
      this.waveActive = false;
      this.wavePoints.visible = false;
      this.waveMaterial.uniforms.uAlpha.value = 0;
      return;
    }
    const t = elapsed / duration;
    const radius = t * 5;
    const alpha = 1 - t;
    this.waveMaterial.uniforms.uAlpha.value = alpha;
    const positions = this.waveGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < WAVE_PARTICLE_COUNT; i++) {
      const angle = (i / WAVE_PARTICLE_COUNT) * Math.PI * 2;
      const wobble = Math.sin(angle * 3 + elapsed * 5) * 0.3;
      const r = radius + wobble;
      positions[i * 3] = this.waveOrigin.x + Math.cos(angle) * r;
      positions[i * 3 + 1] = this.waveOrigin.y + Math.sin(angle * 2) * 0.5;
      positions[i * 3 + 2] = this.waveOrigin.z + Math.sin(angle) * r;
    }
    this.waveGeometry.attributes.position.needsUpdate = true;
  }

  private updateParticles(dt: number, time: number) {
    if (!this.particleData || !this.nebulaGeometry) return;
    const { position, velocity, basePosition, seed } = this.particleData;
    const g = this.currentParams.gravity * 0.001;
    const turb = this.currentParams.turbulence * 0.003;
    const diss = this.currentParams.dissipation;
    const count = this.currentCount;
    for (let i = 0; i < count; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      const bx = basePosition[ix], by = basePosition[iy], bz = basePosition[iz];
      velocity[ix] += (-bx * g) + Math.sin(time * 0.5 + seed[i] * 10) * turb;
      velocity[iy] += (-by * g) + Math.cos(time * 0.7 + seed[i] * 8) * turb;
      velocity[iz] += (-bz * g) + Math.sin(time * 0.3 + seed[i] * 12) * turb;
      const cx = position[ix] - bx;
      const cy = position[iy] - by;
      const cz = position[iz] - bz;
      velocity[ix] -= cx * diss;
      velocity[iy] -= cy * diss;
      velocity[iz] -= cz * diss;
      const spinAngle = time * 0.15 + seed[i] * 2;
      const spinX = Math.sin(spinAngle) * 0.002;
      const spinZ = Math.cos(spinAngle) * 0.002;
      velocity[ix] += spinX;
      velocity[iz] += spinZ;
      velocity[ix] *= 0.98;
      velocity[iy] *= 0.98;
      velocity[iz] *= 0.98;
      position[ix] += velocity[ix];
      position[iy] += velocity[iy];
      position[iz] += velocity[iz];
    }
    this.nebulaGeometry.attributes.position.needsUpdate = true;
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();
    const time = this.clock.getElapsedTime();
    const now = performance.now();
    if (!this.autoRotate && now - this.lastInteractionTime > 3000) {
      this.autoRotate = true;
      this.controls.autoRotate = true;
    }
    this.controls.update();
    this.updateParticles(dt, time);
    this.updateWave(dt);
    if (this.nebulaMaterial) this.nebulaMaterial.uniforms.uTime.value = time;
    if (this.starField && this.starField.material instanceof THREE.ShaderMaterial) {
      this.starField.material.uniforms.uTime.value = time;
    }
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      const mat = (obj as THREE.Mesh).material;
      if (mat) {
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat.dispose();
      }
    });
  }
}
