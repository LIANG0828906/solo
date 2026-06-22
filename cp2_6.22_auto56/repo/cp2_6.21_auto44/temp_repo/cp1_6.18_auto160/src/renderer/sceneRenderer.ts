import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { ParticleData, ParticleConfig, EmotionType } from '../types';
import { EMOTION_COLORS, DEFAULT_PARTICLE_CONFIG, EMOTION_ORDER } from '../types';
import type { ParticleEngine, EmotionCluster } from '../engine/particleEngine';

export interface RendererCallbacks {
  onFrame: (delta: number) => void;
}

type ParticleSprite = THREE.Sprite & { _particleId?: string };

export class SceneRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private particleTexture: THREE.Texture;
  private spriteGroup: THREE.Group;
  private sprites: Map<string, ParticleSprite> = new Map();
  private config: ParticleConfig;
  private callbacks: RendererCallbacks;
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private lights: Map<EmotionType, THREE.PointLight> = new Map();
  private resizeObserver: ResizeObserver | null = null;
  private width = 1;
  private height = 1;

  constructor(container: HTMLElement, callbacks: RendererCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_PARTICLE_CONFIG };

    this.clock = new THREE.Clock();

    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = this.createBackgroundGradient();
    this.scene.fog = new THREE.FogExp2(0x0A0A2E, 0.028);

    this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 200);
    this.camera.position.set(0, 2, 16);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      this.config.bloomStrength,
      0.6,
      0.2
    );
    this.composer.addPass(this.bloomPass);

    this.particleTexture = this.createRadialGradientTexture();

    this.spriteGroup = new THREE.Group();
    this.scene.add(this.spriteGroup);

    this.setupLights();
    this.setupResizeObserver();
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  setBloomStrength(s: number): void {
    this.bloomPass.strength = s;
  }

  private createBackgroundGradient(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#0A0A2E');
    grad.addColorStop(0.5, '#13133E');
    grad.addColorStop(1, '#1B1B4E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  private createRadialGradientTexture(): THREE.Texture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.85)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.45)');
    gradient.addColorStop(0.75, 'rgba(255,255,255,0.12)');
    gradient.addColorStop(1.0, 'rgba(255,255,255,0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(ambient);

    const positions: Record<EmotionType, [number, number, number]> = {
      joy: [6, 5, -3],
      sadness: [-6, -2, 3],
      anger: [4, -4, 5],
      calm: [-5, 4, -5]
    };

    for (const emotion of EMOTION_ORDER) {
      const color = new THREE.Color(EMOTION_COLORS[emotion].hex);
      const [x, y, z] = positions[emotion];
      const light = new THREE.PointLight(color, 1.1, 25, 1.8);
      light.position.set(x, y, z);
      this.scene.add(light);
      this.lights.set(emotion, light);
    }

    const core = new THREE.PointLight(0xffffff, 0.4, 20, 2);
    core.position.set(0, 0, 0);
    this.scene.add(core);
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.onResize());
      this.resizeObserver.observe(this.container);
    }
    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.composer.setSize(this.width, this.height);
    this.bloomPass.setSize(this.width, this.height);
  };

  syncWithParticles(engine: ParticleEngine): void {
    const particles = engine.getParticles();
    const existing = new Set(this.sprites.keys());

    for (const p of particles) {
      let sprite = this.sprites.get(p.id);
      if (!sprite) {
        sprite = this.createSprite(p);
        (sprite as ParticleSprite)._particleId = p.id;
        this.sprites.set(p.id, sprite);
        this.spriteGroup.add(sprite);
      } else {
        existing.delete(p.id);
      }
      this.updateSpriteFromData(sprite, p);
    }

    for (const id of existing) {
      const s = this.sprites.get(id);
      if (s) {
        this.spriteGroup.remove(s);
        s.material.dispose();
        this.sprites.delete(id);
      }
    }
  }

  updateParticleVisuals(engine: ParticleEngine): void {
    const particles = engine.getParticles();
    for (const p of particles) {
      const sprite = this.sprites.get(p.id);
      if (!sprite) continue;
      this.updateSpriteFromData(sprite, p);
    }
  }

  private createSprite(p: ParticleData): ParticleSprite {
    const color = new THREE.Color(p.colorHex);
    const mat = new THREE.SpriteMaterial({
      map: this.particleTexture,
      color: color,
      transparent: true,
      opacity: p.opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(mat) as ParticleSprite;
    sprite.scale.setScalar(p.size);
    return sprite;
  }

  private updateSpriteFromData(sprite: ParticleSprite, p: ParticleData): void {
    sprite.position.set(p.position.x, p.position.y, p.position.z);
    sprite.scale.setScalar(p.size);
    const mat = sprite.material as THREE.SpriteMaterial;
    if (Math.abs(mat.opacity - p.opacity) > 0.005) {
      mat.opacity = p.opacity;
    }
  }

  updateLightsFromClusters(clusters: ReadonlyMap<EmotionType, EmotionCluster>): void {
    for (const [emotion, cluster] of clusters.entries()) {
      const light = this.lights.get(emotion);
      if (!light) continue;
      const totalWeight = [...clusters.values()].reduce((s, c) => s + c.count, 0) || 1;
      const intensity = 0.6 + (cluster.count / totalWeight) * 1.4;
      light.intensity = intensity;
      light.position.x = cluster.center.x * 1.8;
      light.position.y = cluster.center.y * 1.8;
      light.position.z = cluster.center.z * 1.8;
    }
  }

  captureScreenshot(filename = 'emotion-spectrometer.png'): void {
    this.renderer.render(this.scene, this.camera);
    try {
      const url = this.renderer.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (_e) {
    }
  }

  start(): void {
    if (this.animationId !== null) return;
    this.clock.start();

    const loop = () => {
      this.animationId = requestAnimationFrame(loop);
      const delta = Math.min(this.clock.getDelta(), 0.05);
      this.callbacks.onFrame(delta);
      this.composer.render();
    };
    loop();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clock.stop();
  }

  dispose(): void {
    this.stop();
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.onResize);

    for (const sprite of this.sprites.values()) {
      this.spriteGroup.remove(sprite);
      (sprite.material as THREE.Material).dispose();
    }
    this.sprites.clear();

    this.particleTexture.dispose();
    if (this.scene.background instanceof THREE.Texture) {
      this.scene.background.dispose();
    }

    this.composer.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
