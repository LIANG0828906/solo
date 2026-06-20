import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { eventBus } from '../utils/EventBus';
import { ParticleData, StyleConfig } from '../types';

export class Renderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private renderPass: RenderPass | null = null;
  private bloomPass: UnrealBloomPass | null = null;

  private particles: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particleMaterial: THREE.ShaderMaterial | null = null;

  private maxParticles: number = 12000;
  private activeParticleCount: number = 0;

  private isBloomEnabled: boolean = false;
  private targetBloomIntensity: number = 0;
  private currentBloomIntensity: number = 0;

  private fps: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;

  private animationId: number | null = null;
  private lastTime: number = 0;

  private styleConfig: StyleConfig | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 12;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x0a0a0f, 1);

    container.appendChild(this.renderer.domElement);

    this.initParticles();
    this.initPostProcessing();
    this.setupEventListeners();
    this.handleResize();

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private initParticles(): void {
    this.particleGeometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);
    const sizes = new Float32Array(this.maxParticles);

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.particleGeometry.setDrawRange(0, 0);

    const vertexShader = `
      attribute float size;
      varying vec3 vColor;
      varying float vSize;

      void main() {
        vColor = color;
        vSize = size;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * 100.0 / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      varying float vSize;

      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);

        if (dist > 0.5) {
          discard;
        }

        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {}
    });

    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  private initPostProcessing(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.composer = new EffectComposer(this.renderer);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.8,
      0.4,
      0.85
    );
    this.bloomPass.enabled = false;
    this.composer.addPass(this.bloomPass);
  }

  private setupEventListeners(): void {
    eventBus.on('particles:render', (data: ParticleData) => {
      this.updateParticles(data);
    });

    eventBus.on('style:change', () => {
      // Style transitions are handled in update loop
    });
  }

  private updateParticles(data: ParticleData): void {
    if (!this.particleGeometry) return;

    const positionAttr = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = this.particleGeometry.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = this.particleGeometry.getAttribute('size') as THREE.BufferAttribute;

    const positionArray = positionAttr.array as Float32Array;
    const colorArray = colorAttr.array as Float32Array;
    const sizeArray = sizeAttr.array as Float32Array;

    positionArray.set(data.positions.subarray(0, data.count * 3));
    colorArray.set(data.colors.subarray(0, data.count * 3));
    sizeArray.set(data.sizes.subarray(0, data.count));

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;

    this.particleGeometry.setDrawRange(0, data.count);
    this.activeParticleCount = data.count;
  }

  start(): void {
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;
    this.animate();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
      eventBus.emit('fps:update', this.fps);
    }

    eventBus.emit('render:update', deltaTime);

    this.updateBloomTransition(deltaTime);

    if (this.composer && this.isBloomEnabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  setBloomEnabled(enabled: boolean): void {
    this.isBloomEnabled = enabled;
    if (this.bloomPass) {
      this.bloomPass.enabled = enabled;
    }
  }

  setBloomIntensity(intensity: number): void {
    this.targetBloomIntensity = intensity;
  }

  private updateBloomTransition(deltaTime: number): void {
    const speed = 2;
    if (Math.abs(this.currentBloomIntensity - this.targetBloomIntensity) > 0.001) {
      this.currentBloomIntensity += (this.targetBloomIntensity - this.currentBloomIntensity) * Math.min(1, speed * deltaTime);
      if (this.bloomPass) {
        this.bloomPass.strength = this.currentBloomIntensity;
      }
    }
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);

    if (this.composer) {
      this.composer.setSize(width, height);
    }

    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
  }

  getFps(): number {
    return this.fps;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  dispose(): void {
    this.stop();

    if (this.particleGeometry) {
      this.particleGeometry.dispose();
    }
    if (this.particleMaterial) {
      this.particleMaterial.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }

    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}
