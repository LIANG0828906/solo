import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer, RenderPass, EffectPass, BloomEffect, KernelSize, DepthOfFieldEffect } from 'postprocessing';
import type { PresetType, PresetConfig } from './types';
import { PRESET_CONFIGS } from './types';

const MAX_PARTICLES = 500;

interface ParticleData {
  positions: Float32Array;
  alphas: Float32Array;
  ages: Float32Array;
  count: number;
  head: number;
}

function radiusToKernelSize(radius: number): KernelSize {
  if (radius < 0.3) return KernelSize.SMALL;
  if (radius < 0.5) return KernelSize.MEDIUM;
  if (radius < 0.7) return KernelSize.LARGE;
  return KernelSize.VERY_LARGE;
}

export class SceneRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private bloomEffect: BloomEffect;
  private dofEffect: DepthOfFieldEffect;
  private renderPass: RenderPass;
  private effectPass: EffectPass;

  private sculptMesh: THREE.Mesh | null = null;
  private material: THREE.MeshStandardMaterial;
  private currentPreset: PresetType = 'crystal';
  private targetPresetCfg: PresetConfig = PRESET_CONFIGS.crystal;
  private currentCfg: PresetConfig = { ...PRESET_CONFIGS.crystal };
  private presetTransition = 1.0;

  private pointLight1: THREE.PointLight;
  private pointLight2: THREE.PointLight;
  private ambientLight: THREE.AmbientLight;

  private rotationSpeed = 0.5;
  private trailLength = 30;

  private particles: ParticleData;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private particlePoints: THREE.Points;

  private fadeOverlay: HTMLElement;
  private resetActive = false;
  private resetPhase: 'none' | 'fadeout' | 'fadein' = 'none';
  private resetTimer = 0;

  private animFrameId = 0;
  private lastTime = 0;

  constructor(container: HTMLElement) {
    this.fadeOverlay = document.getElementById('reset-overlay')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.08);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    this.camera.position.set(0, 1.5, 4);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.insertBefore(this.renderer.domElement, container.firstChild);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;

    this.ambientLight = new THREE.AmbientLight(0x404060, 0.3);
    this.scene.add(this.ambientLight);

    this.pointLight1 = new THREE.PointLight(0x00ffff, 2, 20);
    this.pointLight1.position.set(3, 3, 3);
    this.scene.add(this.pointLight1);

    this.pointLight2 = new THREE.PointLight(0xff00ff, 1.5, 20);
    this.pointLight2.position.set(-3, -2, 2);
    this.scene.add(this.pointLight2);

    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.9,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });

    this.particles = {
      positions: new Float32Array(MAX_PARTICLES * 3),
      alphas: new Float32Array(MAX_PARTICLES),
      ages: new Float32Array(MAX_PARTICLES),
      count: 0,
      head: 0,
    };

    this.particleGeometry = new THREE.BufferGeometry();
    const posArr = new Float32Array(MAX_PARTICLES * 3);
    const colArr = new Float32Array(MAX_PARTICLES * 3);
    const sizeArr = new Float32Array(MAX_PARTICLES);
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArr, 1));

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particlePoints = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particlePoints);

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomEffect = new BloomEffect({
      intensity: this.currentCfg.bloomIntensity,
      luminanceThreshold: this.currentCfg.bloomThreshold,
      luminanceSmoothing: 0.3,
      kernelSize: radiusToKernelSize(this.currentCfg.bloomRadius),
    });

    this.dofEffect = new DepthOfFieldEffect(this.camera, {
      focusDistance: this.currentCfg.dofFocus / 10,
      focalLength: 0.025,
      bokehScale: 2.5,
    });

    this.effectPass = new EffectPass(this.camera, this.bloomEffect, this.dofEffect);
    this.composer.addPass(this.effectPass);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
  }

  setSculptGeometry(geometry: THREE.BufferGeometry): void {
    if (this.sculptMesh) {
      this.sculptMesh.geometry.dispose();
      this.sculptMesh.geometry = geometry;
    } else {
      this.sculptMesh = new THREE.Mesh(geometry, this.material);
      this.scene.add(this.sculptMesh);
    }
  }

  setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed;
  }

  setTrailLength(length: number): void {
    this.trailLength = length;
  }

  applyPreset(preset: PresetType): void {
    this.currentPreset = preset;
    this.targetPresetCfg = PRESET_CONFIGS[preset];
    this.presetTransition = 0;
  }

  private lerpPresetConfig(dt: number): void {
    if (this.presetTransition >= 1) return;
    const speed = 1 / 0.8;
    this.presetTransition = Math.min(1, this.presetTransition + dt * speed);
    const t = this.presetTransition;
    const c = this.currentCfg;
    const tgt = this.targetPresetCfg;

    c.baseHue = c.baseHue + (tgt.baseHue - c.baseHue) * t;
    c.hueRange = c.hueRange + (tgt.hueRange - c.hueRange) * t;
    c.saturation = c.saturation + (tgt.saturation - c.saturation) * t;
    c.metalness = c.metalness + (tgt.metalness - c.metalness) * t;
    c.roughness = c.roughness + (tgt.roughness - c.roughness) * t;
    c.opacity = c.opacity + (tgt.opacity - c.opacity) * t;
    c.bloomIntensity = c.bloomIntensity + (tgt.bloomIntensity - c.bloomIntensity) * t;
    c.bloomRadius = c.bloomRadius + (tgt.bloomRadius - c.bloomRadius) * t;
    c.bloomThreshold = c.bloomThreshold + (tgt.bloomThreshold - c.bloomThreshold) * t;
    c.dofFocus = c.dofFocus + (tgt.dofFocus - c.dofFocus) * t;
    c.dofAperture = c.dofAperture + (tgt.dofAperture - c.dofAperture) * t;
    c.ambientIntensity = c.ambientIntensity + (tgt.ambientIntensity - c.ambientIntensity) * t;

    this.material.metalness = c.metalness;
    this.material.roughness = c.roughness;
    this.material.opacity = c.opacity;
    this.material.transparent = c.transparent || c.opacity < 1;

    this.bloomEffect.intensity = c.bloomIntensity;
    this.bloomEffect.luminanceThreshold = c.bloomThreshold;
    this.bloomEffect.kernelSize = radiusToKernelSize(c.bloomRadius);

    this.dofEffect.focusDistance = c.dofFocus / 10;
    this.dofEffect.bokehScale = c.dofAperture * 500;

    this.ambientLight.intensity = c.ambientIntensity;
    this.pointLight1.color.setHex(tgt.lightColor);

    if (this.presetTransition >= 1) {
      this.currentCfg = { ...tgt };
    }
  }

  getCurrentPresetConfig(): PresetConfig {
    return this.currentCfg;
  }

  addParticlesFromSculpt(): void {
    if (!this.sculptMesh) return;
    const geo = this.sculptMesh.geometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;

    const sampleCount = 3;
    for (let s = 0; s < sampleCount; s++) {
      const vi = Math.floor(Math.random() * posAttr.count);
      const i3 = vi * 3;

      const idx = this.particles.head;
      this.particles.positions[idx * 3] = posAttr.array[i3]!;
      this.particles.positions[idx * 3 + 1] = posAttr.array[i3 + 1]!;
      this.particles.positions[idx * 3 + 2] = posAttr.array[i3 + 2]!;
      this.particles.alphas[idx] = 1.0;
      this.particles.ages[idx] = 0;

      this.particles.head = (this.particles.head + 1) % MAX_PARTICLES;
      if (this.particles.count < MAX_PARTICLES) {
        this.particles.count++;
      }
    }
  }

  private updateParticles(dt: number): void {
    const posAttr = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.particleGeometry.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = this.particleGeometry.getAttribute('size') as THREE.BufferAttribute;

    const cfg = this.currentCfg;
    let drawCount = 0;
    const aliveIndices: number[] = [];

    for (let i = 0; i < this.particles.count; i++) {
      const idx = (this.particles.head - this.particles.count + i + MAX_PARTICLES) % MAX_PARTICLES;
      this.particles.ages[idx] += dt * 60;

      if (this.particles.ages[idx] > this.trailLength) {
        continue;
      }

      aliveIndices.push(idx);
      const ageRatio = this.particles.ages[idx] / this.trailLength;
      const alpha = 1 - ageRatio;

      const si = idx * 3;
      posAttr.array[drawCount * 3] = this.particles.positions[si]! + (Math.random() - 0.5) * 0.02;
      posAttr.array[drawCount * 3 + 1] = this.particles.positions[si + 1]! + (Math.random() - 0.5) * 0.02;
      posAttr.array[drawCount * 3 + 2] = this.particles.positions[si + 2]! + (Math.random() - 0.5) * 0.02;

      const h = (cfg.baseHue + ageRatio * 0.1) % 1;
      const color = new THREE.Color().setHSL(h, cfg.saturation * 0.8, 0.4 + alpha * 0.3);
      colAttr.array[drawCount * 3] = color.r;
      colAttr.array[drawCount * 3 + 1] = color.g;
      colAttr.array[drawCount * 3 + 2] = color.b;

      sizeAttr.array[drawCount] = 0.02 + alpha * 0.04;

      drawCount++;
    }

    this.particleGeometry.setDrawRange(0, drawCount);

    if (drawCount > 0) {
      posAttr.updateRange.offset = 0;
      posAttr.updateRange.count = drawCount * 3;
      posAttr.needsUpdate = true;

      colAttr.updateRange.offset = 0;
      colAttr.updateRange.count = drawCount * 3;
      colAttr.needsUpdate = true;

      sizeAttr.updateRange.offset = 0;
      sizeAttr.updateRange.count = drawCount;
      sizeAttr.needsUpdate = true;
    }
  }

  clearParticles(): void {
    this.particles.count = 0;
    this.particles.head = 0;
    this.particleGeometry.setDrawRange(0, 0);
  }

  takeSnapshot(onComplete?: () => void): void {
    const w = 1920;
    const h = 1080;

    const oldW = this.renderer.domElement.width;
    const oldH = this.renderer.domElement.height;

    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.composer.render();

    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `voxelsculpt_${Date.now()}.png`;
    link.href = dataUrl;

    const cleanup = () => {
      this.renderer.setSize(oldW, oldH, false);
      this.composer.setSize(oldW, oldH);
      this.camera.aspect = oldW / oldH;
      this.camera.updateProjectionMatrix();
      if (onComplete) onComplete();
    };

    link.addEventListener('click', () => {
      setTimeout(cleanup, 100);
    });

    link.click();
    setTimeout(cleanup, 500);
  }

  reset(onComplete: () => void): void {
    if (this.resetActive) return;
    this.resetActive = true;
    this.resetPhase = 'fadeout';
    this.resetTimer = 0;
    this.fadeOverlay.classList.add('active');
    this._resetCallback = onComplete;
  }

  private _resetCallback: (() => void) | null = null;

  private handleReset(dt: number): void {
    if (!this.resetActive) return;

    this.resetTimer += dt;

    if (this.resetPhase === 'fadeout' && this.resetTimer >= 0.5) {
      this.resetPhase = 'fadein';
      this.resetTimer = 0;
      this.clearParticles();
      if (this.sculptMesh) {
        this.sculptMesh.rotation.set(0, 0, 0);
      }
      if (this._resetCallback) {
        this._resetCallback();
        this._resetCallback = null;
      }
    }

    if (this.resetPhase === 'fadein' && this.resetTimer >= 0.5) {
      this.resetPhase = 'none';
      this.resetActive = false;
      this.fadeOverlay.classList.remove('active');
    }
  }

  startLoop(): void {
    this.lastTime = performance.now();
    const loop = (time: number) => {
      this.animFrameId = requestAnimationFrame(loop);
      const dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      this.lerpPresetConfig(dt);

      if (this.sculptMesh) {
        this.sculptMesh.rotation.y += this.rotationSpeed * Math.PI * 2 * dt;
      }

      this.addParticlesFromSculpt();
      this.updateParticles(dt);

      const pulseFactor = 1.5 + Math.sin(time * 0.003) * 0.5;
      this.pointLight1.intensity = pulseFactor;
      this.pointLight2.intensity = pulseFactor * 0.8;

      this.controls.update();
      this.composer.render();

      this.handleReset(dt);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stopLoop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  dispose(): void {
    this.stopLoop();
    this.renderer.dispose();
    this.controls.dispose();
    this.material.dispose();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.composer.dispose();
    if (this.sculptMesh) {
      this.sculptMesh.geometry.dispose();
    }
  }
}
