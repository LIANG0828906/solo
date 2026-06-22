import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  WeatherPreset,
  WeatherType,
  RuntimeParams,
  BlendConfig,
  WEATHER_PRESETS,
  DEFAULT_RUNTIME_PARAMS,
  DEFAULT_BLEND_CONFIG,
  hexToRgb,
  lerpColor,
  rgbToHex,
  lerp,
  clamp,
  getBlendedPreset,
} from './WeatherConfig';

interface ParticleData {
  positions: Float32Array;
  velocities: Float32Array;
  sizes: Float32Array;
  phases: Float32Array;
  activeCount: number;
}

interface ParticleSystemData {
  object: THREE.Object3D;
  data: ParticleData;
  preset: WeatherPreset;
  visibility: Float32Array;
}

const SCENE_SIZE = 50;
const PARTICLE_SPREAD = 40;
const TRANSITION_DURATION = 2.0;
const GROUND_Y = 0;
const SKY_Y = 50;
const MAX_PARTICLES = 6000;

export class WeatherEffectSystem {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private groundGrid: THREE.GridHelper;
  private backgroundMesh: THREE.Mesh;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private flashPlane: THREE.Mesh;
  private animationId: number;
  private clock: THREE.Clock;
  private isDisposed: boolean;

  private particleSystems: ParticleSystemData[] = [];
  private currentPreset: WeatherPreset;
  private targetPreset: WeatherPreset;
  private blendConfig: BlendConfig;
  private runtimeParams: RuntimeParams;

  private transitionProgress: number;
  private inTransition: boolean;
  private fromPreset: WeatherPreset | null;

  private flashActive: boolean;
  private flashStartTime: number;
  private flashDuration: number;
  private nextFlashTime: number;

  private onFpsUpdate: ((fps: number) => void) | undefined;
  private frameCount: number;
  private fpsTime: number;
  private lastFps: number;

  constructor(container: HTMLElement, onFpsUpdate?: (fps: number) => void) {
    this.container = container;
    this.onFpsUpdate = onFpsUpdate;
    this.isDisposed = false;
    this.animationId = 0;
    this.clock = new THREE.Clock();
    this.frameCount = 0;
    this.fpsTime = 0;
    this.lastFps = 60;

    this.currentPreset = WEATHER_PRESETS.rain;
    this.targetPreset = WEATHER_PRESETS.rain;
    this.fromPreset = null;
    this.blendConfig = { ...DEFAULT_BLEND_CONFIG };
    this.runtimeParams = { ...DEFAULT_RUNTIME_PARAMS };

    this.transitionProgress = 1;
    this.inTransition = false;

    this.flashActive = false;
    this.flashStartTime = 0;
    this.flashDuration = 0.1;
    this.nextFlashTime = 0;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);

    const cameraDistance = 35;
    const cameraAngle = (30 * Math.PI) / 180;
    this.camera.position.set(
      0,
      Math.sin(cameraAngle) * cameraDistance,
      Math.cos(cameraAngle) * cameraDistance
    );
    this.camera.lookAt(0, 5, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 100;
    this.controls.target.set(0, 5, 0);
    this.controls.update();

    this.groundGrid = new THREE.GridHelper(SCENE_SIZE * 2, SCENE_SIZE * 2 / 5, 0xaaaaaa, 0x888888);
    (this.groundGrid.material as THREE.Material).opacity = 0.6;
    (this.groundGrid.material as THREE.Material).transparent = true;
    this.groundGrid.position.y = GROUND_Y;
    this.scene.add(this.groundGrid);

    const groundGeo = new THREE.PlaneGeometry(SCENE_SIZE * 4, SCENE_SIZE * 4);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = GROUND_Y - 0.01;
    this.scene.add(ground);

    this.backgroundMesh = this.createBackgroundMesh();
    this.scene.add(this.backgroundMesh);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(10, 30, 10);
    this.scene.add(this.directionalLight);

    const flashGeo = new THREE.PlaneGeometry(4, 4);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });
    this.flashPlane = new THREE.Mesh(flashGeo, flashMat);
    this.flashPlane.position.set(0, 25, -20);
    this.flashPlane.visible = false;
    this.scene.add(this.flashPlane);

    this.applyPreset(this.currentPreset);
    this.rebuildParticleSystems();

    window.addEventListener('resize', this.handleResize);
    this.animateLoop();
  }

  private createBackgroundMesh(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(200, 32, 32);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new THREE.Color(0x2c3e50) },
        uBottomColor: { value: new THREE.Color(0x1a252c) },
        uOffset: { value: 0.2 },
        uExponent: { value: 0.7 },
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
        uniform vec3 uTopColor;
        uniform vec3 uBottomColor;
        uniform float uOffset;
        uniform float uExponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, uOffset, 0.0)).y;
          float t = max(pow(max(h, 0.0), uExponent), 0.0);
          gl_FragColor = vec4(mix(uBottomColor, uTopColor, t), 1.0);
        }
      `,
    });
    return new THREE.Mesh(geo, mat);
  }

  private handleResize = (): void => {
    if (this.isDisposed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public setWeather(type: WeatherType, smooth: boolean = true): void {
    if (this.blendConfig.enabled) {
      this.blendConfig.enabled = false;
    }
    const newPreset = WEATHER_PRESETS[type];
    if (!smooth) {
      this.currentPreset = newPreset;
      this.targetPreset = newPreset;
      this.fromPreset = null;
      this.inTransition = false;
      this.transitionProgress = 1;
      this.applyPreset(newPreset);
      this.rebuildParticleSystems();
    } else {
      this.fromPreset = { ...this.currentPreset };
      this.targetPreset = newPreset;
      this.inTransition = true;
      this.transitionProgress = 0;
    }
  }

  public setBlendConfig(config: BlendConfig): void {
    const wasEnabled = this.blendConfig.enabled;
    const wasA = this.blendConfig.weatherA;
    const wasB = this.blendConfig.weatherB;
    const wasRatio = this.blendConfig.ratio;

    this.blendConfig = { ...config };

    if (!config.enabled) {
      if (wasEnabled) {
        this.setWeather(this.currentPreset.id, true);
      }
      return;
    }

    const presetA = WEATHER_PRESETS[config.weatherA];
    const presetB = WEATHER_PRESETS[config.weatherB];
    const blended = getBlendedPreset(presetA, presetB, config.ratio);

    if (!wasEnabled || wasA !== config.weatherA || wasB !== config.weatherB) {
      this.fromPreset = { ...this.currentPreset };
      this.targetPreset = blended;
      this.currentPreset = blended;
      this.inTransition = true;
      this.transitionProgress = 0;
      this.rebuildParticleSystems();
    } else if (wasRatio !== config.ratio) {
      this.currentPreset = blended;
      this.targetPreset = blended;
      this.applyPreset(blended);
      this.updateParticleDensities();
    }
  }

  public setRuntimeParams(params: Partial<RuntimeParams>): void {
    const densityChanged =
      params.densityMultiplier !== undefined &&
      params.densityMultiplier !== this.runtimeParams.densityMultiplier;

    this.runtimeParams = { ...this.runtimeParams, ...params };

    if (densityChanged) {
      this.updateParticleDensities();
    }

    this.applyBrightness();
  }

  private applyPreset(preset: WeatherPreset): void {
    const bgMat = this.backgroundMesh.material as THREE.ShaderMaterial;
    const topRgb = hexToRgb(preset.background.topColor);
    const bottomRgb = hexToRgb(preset.background.bottomColor);
    bgMat.uniforms.uTopColor.value.setRGB(topRgb.r, topRgb.g, topRgb.b);
    bgMat.uniforms.uBottomColor.value.setRGB(bottomRgb.r, bottomRgb.g, bottomRgb.b);

    const ambRgb = hexToRgb(preset.lighting.ambientColor);
    this.ambientLight.color.setRGB(ambRgb.r, ambRgb.g, ambRgb.b);
    this.ambientLight.intensity = preset.lighting.ambientIntensity;

    const dirRgb = hexToRgb(preset.lighting.directionalColor);
    this.directionalLight.color.setRGB(dirRgb.r, dirRgb.g, dirRgb.b);
    this.directionalLight.intensity = preset.lighting.directionalIntensity;
    this.directionalLight.position.set(
      preset.lighting.directionalPosition[0],
      preset.lighting.directionalPosition[1],
      preset.lighting.directionalPosition[2]
    );

    const fogRgb = hexToRgb(preset.background.fogColor);
    this.scene.fog = new THREE.FogExp2(
      rgbToHex(fogRgb.r, fogRgb.g, fogRgb.b),
      preset.background.fogDensity
    );

    this.applyBrightness();
    this.scheduleNextFlash(preset);
  }

  private applyBrightness(): void {
    const b = this.runtimeParams.brightnessMultiplier;
    const preset = this.currentPreset;
    this.ambientLight.intensity = preset.lighting.ambientIntensity * b;
    this.directionalLight.intensity = preset.lighting.directionalIntensity * b;
  }

  private scheduleNextFlash(preset: WeatherPreset): void {
    if (preset.hasThunder && preset.thunderInterval) {
      const [min, max] = preset.thunderInterval;
      this.nextFlashTime = performance.now() + min + Math.random() * (max - min);
    } else {
      this.nextFlashTime = Number.MAX_SAFE_INTEGER;
      this.flashActive = false;
      this.flashPlane.visible = false;
      (this.flashPlane.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  }

  private rebuildParticleSystems(): void {
    for (const sys of this.particleSystems) {
      this.scene.remove(sys.object);
      this.disposeObject(sys.object);
    }
    this.particleSystems = [];

    if (this.blendConfig.enabled) {
      const presetA = WEATHER_PRESETS[this.blendConfig.weatherA];
      const presetB = WEATHER_PRESETS[this.blendConfig.weatherB];
      const ratio = this.blendConfig.ratio;
      const total = clamp(
        Math.round(this.runtimeParams.densityMultiplier * Math.max(presetA.particles.count, presetB.particles.count)),
        1,
        MAX_PARTICLES
      );
      const countA = clamp(Math.round(total * (1 - ratio)), 0, MAX_PARTICLES);
      const countB = clamp(total - countA, 0, MAX_PARTICLES);

      if (countA > 0) this.particleSystems.push(this.createParticleSystem(presetA, countA));
      if (countB > 0) this.particleSystems.push(this.createParticleSystem(presetB, countB));
    } else {
      const preset = this.currentPreset;
      const count = clamp(
        Math.round(this.runtimeParams.densityMultiplier * preset.particles.count),
        1,
        MAX_PARTICLES
      );
      this.particleSystems.push(this.createParticleSystem(preset, count));
    }

    for (const sys of this.particleSystems) {
      this.scene.add(sys.object);
    }
  }

  private updateParticleDensities(): void {
    if (this.blendConfig.enabled) {
      const presetA = WEATHER_PRESETS[this.blendConfig.weatherA];
      const presetB = WEATHER_PRESETS[this.blendConfig.weatherB];
      const ratio = this.blendConfig.ratio;
      const total = clamp(
        Math.round(this.runtimeParams.densityMultiplier * Math.max(presetA.particles.count, presetB.particles.count)),
        1,
        MAX_PARTICLES
      );
      const desiredA = clamp(Math.round(total * (1 - ratio)), 0, MAX_PARTICLES);
      const desiredB = clamp(total - desiredA, 0, MAX_PARTICLES);

      const sysA = this.particleSystems.find((s) => s.preset.id === presetA.id);
      const sysB = this.particleSystems.find((s) => s.preset.id === presetB.id);

      if (sysA) {
        sysA.data.activeCount = Math.min(desiredA, sysA.data.positions.length / 3);
      } else if (desiredA > 0) {
        const newSys = this.createParticleSystem(presetA, desiredA);
        this.particleSystems.push(newSys);
        this.scene.add(newSys.object);
      }

      if (sysB) {
        sysB.data.activeCount = Math.min(desiredB, sysB.data.positions.length / 3);
      } else if (desiredB > 0) {
        const newSys = this.createParticleSystem(presetB, desiredB);
        this.particleSystems.push(newSys);
        this.scene.add(newSys.object);
      }
    } else {
      const preset = this.currentPreset;
      const desired = clamp(
        Math.round(this.runtimeParams.densityMultiplier * preset.particles.count),
        1,
        MAX_PARTICLES
      );
      if (this.particleSystems[0]) {
        this.particleSystems[0].data.activeCount = Math.min(
          desired,
          this.particleSystems[0].data.positions.length / 3
        );
      }
    }
  }

  private createParticleSystem(preset: WeatherPreset, count: number): ParticleSystemData {
    const maxCount = Math.max(count, Math.round(preset.particles.count * 2));
    const positions = new Float32Array(maxCount * 3);
    const velocities = new Float32Array(maxCount * 3);
    const sizes = new Float32Array(maxCount);
    const phases = new Float32Array(maxCount);
    const visibility = new Float32Array(maxCount);

    for (let i = 0; i < maxCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * PARTICLE_SPREAD * 2;
      positions[i * 3 + 1] = Math.random() * SKY_Y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * PARTICLE_SPREAD * 2;

      const v = preset.particles;
      velocities[i * 3 + 0] = v.speedX[0] + Math.random() * (v.speedX[1] - v.speedX[0]);
      velocities[i * 3 + 1] = v.speedY[0] + Math.random() * (v.speedY[1] - v.speedY[0]);
      velocities[i * 3 + 2] = v.speedZ[0] + Math.random() * (v.speedZ[1] - v.speedZ[0]);

      sizes[i] = v.size[0] + Math.random() * (v.size[1] - v.size[0]);
      phases[i] = Math.random() * Math.PI * 2;
      visibility[i] = 1;
    }

    let object: THREE.Object3D;

    if (preset.particles.geometry === 'cylinder') {
      const geo = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: preset.particles.color,
        transparent: true,
        opacity: preset.particles.opacity,
        depthWrite: false,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, maxCount);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      object = mesh;
    } else if (preset.particles.geometry === 'sphere') {
      const geo = new THREE.SphereGeometry(1, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: preset.particles.color,
        transparent: true,
        opacity: preset.particles.opacity,
        depthWrite: false,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, maxCount);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      object = mesh;
    } else {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(0.6, 'rgba(255,255,255,0.3)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      const mat = new THREE.PointsMaterial({
        color: preset.particles.color,
        size: 0.15,
        map: texture,
        transparent: true,
        opacity: preset.particles.opacity,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
      });
      object = new THREE.Points(geo, mat);
      object.frustumCulled = false;
    }

    return {
      object,
      data: {
        positions,
        velocities,
        sizes,
        phases,
        activeCount: count,
      },
      preset,
      visibility,
    };
  }

  private updateTransition(delta: number): void {
    if (!this.inTransition || !this.fromPreset) return;

    this.transitionProgress = clamp(
      this.transitionProgress + delta / TRANSITION_DURATION,
      0,
      1
    );
    const t = this.easeInOutCubic(this.transitionProgress);

    const blended = getBlendedPreset(this.fromPreset, this.targetPreset, t);
    this.currentPreset = blended;
    this.applyPreset(blended);

    this.updateParticleDensities();

    if (this.transitionProgress >= 1) {
      this.inTransition = false;
      this.fromPreset = null;
      this.currentPreset = this.targetPreset;
      this.applyPreset(this.targetPreset);
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private updateParticles(delta: number): void {
    const windAngle = (this.runtimeParams.windAngle * Math.PI) / 180;
    const windX = Math.sin(windAngle) * 3;
    const windZ = Math.cos(windAngle) * 3;
    const speedMul = this.runtimeParams.speedMultiplier;
    const sizeMul = this.runtimeParams.sizeMultiplier;

    for (const sys of this.particleSystems) {
      const { data, preset, visibility } = sys;
      const { positions, velocities, sizes, phases, activeCount } = data;
      const spiral = preset.particles.spiralFactor || 0;
      const floatAmp = preset.particles.floatAmplitude || 0;
      const floatFreq = preset.particles.floatFrequency || 0;
      const elapsed = this.clock.getElapsedTime();

      if (sys.object instanceof THREE.InstancedMesh) {
        const mesh = sys.object;
        const dummy = new THREE.Object3D();
        for (let i = 0; i < activeCount; i++) {
          const ix = i * 3;
          const vy = velocities[ix + 1] * speedMul;
          let vx = velocities[ix + 0] * speedMul;
          let vz = velocities[ix + 2] * speedMul;

          if (spiral > 0) {
            phases[i] += delta * 2;
            vx += Math.sin(phases[i]) * spiral * delta * 5;
            vz += Math.cos(phases[i]) * spiral * delta * 5;
          }

          vx += windX * delta;
          vz += windZ * delta;

          positions[ix + 0] += vx * delta;
          positions[ix + 1] += vy * delta;
          positions[ix + 2] += vz * delta;

          if (floatAmp > 0) {
            positions[ix + 1] +=
              Math.sin(elapsed * floatFreq + phases[i]) * floatAmp * delta;
          }

          if (positions[ix + 1] < GROUND_Y - 0.5) {
            positions[ix + 0] = (Math.random() - 0.5) * PARTICLE_SPREAD * 2;
            positions[ix + 1] = SKY_Y;
            positions[ix + 2] = (Math.random() - 0.5) * PARTICLE_SPREAD * 2;
          }
          if (positions[ix + 1] > SKY_Y + 5) {
            positions[ix + 1] = GROUND_Y;
          }
          if (Math.abs(positions[ix + 0]) > PARTICLE_SPREAD * 1.5) {
            positions[ix + 0] = -Math.sign(positions[ix + 0]) * PARTICLE_SPREAD;
          }
          if (Math.abs(positions[ix + 2]) > PARTICLE_SPREAD * 1.5) {
            positions[ix + 2] = -Math.sign(positions[ix + 2]) * PARTICLE_SPREAD;
          }

          const s = sizes[i] * sizeMul;
          dummy.position.set(positions[ix + 0], positions[ix + 1], positions[ix + 2]);
          if (preset.particles.geometry === 'cylinder') {
            dummy.scale.set(s * 100, s * 100, s * 100);
            const speedLen = Math.sqrt(vx * vx + vy * vy + vz * vz) + 0.001;
            dummy.lookAt(
              positions[ix + 0] + vx / speedLen * 0.2,
              positions[ix + 1] + vy / speedLen * 0.2,
              positions[ix + 2] + vz / speedLen * 0.2
            );
          } else {
            dummy.scale.set(s, s, s);
          }
          dummy.updateMatrix();
          const vis = clamp(visibility[i], 0, 1);
          if (vis < 0.01) {
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
          }
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.count = activeCount;
        mesh.instanceMatrix.needsUpdate = true;
      } else if (sys.object instanceof THREE.Points) {
        const points = sys.object;
        const geo = points.geometry;
        const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
        const sizeAttr = geo.getAttribute('size') as THREE.BufferAttribute;
        const mat = points.material as THREE.PointsMaterial;
        mat.size = 0.15 * sizeMul;

        for (let i = 0; i < activeCount; i++) {
          const ix = i * 3;
          let vx = velocities[ix + 0] * speedMul;
          const vy = velocities[ix + 1] * speedMul;
          let vz = velocities[ix + 2] * speedMul;

          if (spiral > 0) {
            phases[i] += delta * 2;
            vx += Math.sin(phases[i]) * spiral * delta * 5;
            vz += Math.cos(phases[i]) * spiral * delta * 5;
          }

          vx += windX * delta;
          vz += windZ * delta;

          positions[ix + 0] += vx * delta;
          positions[ix + 1] += vy * delta;
          positions[ix + 2] += vz * delta;

          if (floatAmp > 0) {
            positions[ix + 1] +=
              Math.sin(elapsed * floatFreq + phases[i]) * floatAmp * delta;
          }

          if (positions[ix + 1] < GROUND_Y - 0.5 || vy < 0 && positions[ix + 1] < GROUND_Y) {
            positions[ix + 0] = (Math.random() - 0.5) * PARTICLE_SPREAD * 2;
            positions[ix + 1] = SKY_Y;
            positions[ix + 2] = (Math.random() - 0.5) * PARTICLE_SPREAD * 2;
          }
          if (positions[ix + 1] > SKY_Y + 5) {
            positions[ix + 1] = GROUND_Y;
          }
          if (Math.abs(positions[ix + 0]) > PARTICLE_SPREAD * 1.5) {
            positions[ix + 0] = -Math.sign(positions[ix + 0]) * PARTICLE_SPREAD;
          }
          if (Math.abs(positions[ix + 2]) > PARTICLE_SPREAD * 1.5) {
            positions[ix + 2] = -Math.sign(positions[ix + 2]) * PARTICLE_SPREAD;
          }

          posAttr.array[ix + 0] = positions[ix + 0];
          posAttr.array[ix + 1] = positions[ix + 1];
          posAttr.array[ix + 2] = positions[ix + 2];
          (sizeAttr.array as Float32Array)[i] = sizes[i];
        }
        posAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
        (geo as any).setDrawRange(0, activeCount);
      }
    }
  }

  private updateFlash(delta: number): void {
    const now = performance.now();
    const preset = this.currentPreset;

    if (!this.flashActive && preset.hasThunder && now >= this.nextFlashTime) {
      this.flashActive = true;
      this.flashStartTime = now;
      this.flashPlane.visible = true;
      (this.flashPlane.material as THREE.MeshBasicMaterial).opacity = 0.9;

      const flashLight = new THREE.PointLight(0xffffff, 5, 100);
      flashLight.position.set(
        (Math.random() - 0.5) * 20,
        30 + Math.random() * 10,
        (Math.random() - 0.5) * 20
      );
      this.scene.add(flashLight);
      setTimeout(() => {
        if (!this.isDisposed) {
          this.scene.remove(flashLight);
          flashLight.dispose();
        }
      }, 100);
    }

    if (this.flashActive) {
      const elapsed = (now - this.flashStartTime) / 1000;
      const t = clamp(elapsed / this.flashDuration, 0, 1);
      (this.flashPlane.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);

      if (t >= 1) {
        this.flashActive = false;
        this.flashPlane.visible = false;
        this.scheduleNextFlash(preset);
      }
    }
  }

  private animateLoop = (): void => {
    if (this.isDisposed) return;
    this.animationId = requestAnimationFrame(this.animateLoop);

    const delta = clamp(this.clock.getDelta(), 0, 0.1);
    this.controls.update();

    this.updateTransition(delta);
    this.updateParticles(delta);
    this.updateFlash(delta);

    this.renderer.render(this.scene, this.camera);

    if (this.onFpsUpdate) {
      this.frameCount++;
      this.fpsTime += delta;
      if (this.fpsTime >= 0.5) {
        this.lastFps = Math.round(this.frameCount / this.fpsTime);
        this.onFpsUpdate(this.lastFps);
        this.frameCount = 0;
        this.fpsTime = 0;
      }
    }
  };

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
        if (child.geometry) child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of materials) {
          if (mat) {
            if ('map' in mat && (mat as any).map) (mat as any).map.dispose();
            mat.dispose();
          }
        }
      }
    });
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.handleResize);

    for (const sys of this.particleSystems) {
      this.disposeObject(sys.object);
    }
    this.disposeObject(this.groundGrid);
    this.disposeObject(this.backgroundMesh);
    this.disposeObject(this.flashPlane);

    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  public getRuntimeParams(): RuntimeParams {
    return { ...this.runtimeParams };
  }
}
