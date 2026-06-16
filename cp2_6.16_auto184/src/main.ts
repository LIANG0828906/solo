import * as THREE from 'three';
import { generateGalaxy, type GalaxyParticleData, type GalaxyParams } from './core/GalaxyGenerator';
import { ParticleUpdater } from './core/ParticleUpdater';
import { ControlPanel, type ControlState } from './ui/ControlPanel';

class StarPulseApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvasContainer: HTMLElement;

  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;
  private spriteTexture: THREE.Texture | null = null;

  private particleData: GalaxyParticleData | null = null;
  private particleUpdater: ParticleUpdater;
  private controlPanel: ControlPanel;

  private cameraTheta = Math.PI * 0.25;
  private cameraPhi = Math.PI * 0.35;
  private cameraRadius = 30;
  private cameraTargetRadius = 30;
  private minRadius = 10;
  private maxRadius = 60;
  private defaultTheta = Math.PI * 0.25;
  private defaultPhi = Math.PI * 0.35;
  private defaultRadius = 30;

  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private cameraAnimating = false;
  private cameraAnimStart = 0;
  private cameraAnimDuration = 1000;
  private cameraAnimStartTheta = 0;
  private cameraAnimStartPhi = 0;
  private cameraAnimStartRadius = 0;
  private cameraAnimEndTheta = 0;
  private cameraAnimEndPhi = 0;
  private cameraAnimEndRadius = 0;
  private isZoomedIn = false;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private elapsedTime = 0;
  private lastFrameTime = 0;
  private fpsAccumulator = 0;
  private fpsFrameCount = 0;
  private fpsUpdateInterval = 500;
  private lastFpsUpdate = 0;

  private controlState: ControlState;

  private animationFrameId: number | null = null;
  private resizeHandler: () => void;

  constructor() {
    this.canvasContainer = document.getElementById('canvas-container')!;
    this.controlPanel = new ControlPanel();
    this.particleUpdater = new ParticleUpdater();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.controlState = this.controlPanel.getState();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050510);
    this.scene.fog = new THREE.FogExp2(0x050510, 0.015);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x050510, 1);
    this.canvasContainer.appendChild(this.renderer.domElement);

    this.spriteTexture = this.createStarTexture();

    this.setupLights();
    this.bindEvents();

    this.controlPanel.init();
    this.controlPanel.onChange((state) => this.handleControlChange(state));

    this.rebuildGalaxy();
    this.resizeHandler = () => this.onResize();
  }

  private createStarTexture(): THREE.Texture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.45)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.04)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 200, 1.5);
    pointLight.position.set(0, 0, 30);
    this.camera.add(pointLight);
    this.scene.add(this.camera);
  }

  private updateCameraPosition(): void {
    const sinPhi = Math.sin(this.cameraPhi);
    const x = this.cameraRadius * sinPhi * Math.cos(this.cameraTheta);
    const y = this.cameraRadius * Math.cos(this.cameraPhi);
    const z = this.cameraRadius * sinPhi * Math.sin(this.cameraTheta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  private rebuildGalaxy(): void {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.points) {
      this.scene.remove(this.points);
    }

    const params: GalaxyParams = {
      type: this.controlState.galaxyType,
      densityMultiplier: this.controlState.densityMultiplier,
      evolutionTime: this.controlState.evolutionTime
    };

    this.particleData = generateGalaxy(params);
    this.particleUpdater.setParticleData(this.particleData, this.controlState.galaxyType);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.particleData.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.particleData.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.particleData.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.18,
      map: this.spriteTexture!,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  private handleControlChange(state: Partial<ControlState>): void {
    const needsRegenerate =
      state.galaxyType !== undefined ||
      state.densityMultiplier !== undefined ||
      state.evolutionTime !== undefined;

    this.controlState = { ...this.controlState, ...state };

    if (needsRegenerate) {
      this.rebuildGalaxy();
    }
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || this.cameraAnimating) return;

      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;

      this.cameraTheta -= dx * 0.005;
      this.cameraPhi -= dy * 0.005;
      this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi));

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.updateCameraPosition();
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.cameraAnimating) return;

      const delta = e.deltaY > 0 ? 1 : -1;
      this.cameraTargetRadius += delta * 1.5;
      this.cameraTargetRadius = Math.max(this.minRadius, Math.min(this.maxRadius, this.cameraTargetRadius));
    }, { passive: false });

    canvas.addEventListener('dblclick', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      let hitCenter = false;
      if (this.points) {
        const intersects = this.raycaster.intersectObject(this.points);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          const distFromCenter = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
          if (distFromCenter < 8) {
            hitCenter = true;
          }
        }
      }

      if (this.isZoomedIn) {
        this.startCameraAnimation(this.defaultTheta, this.defaultPhi, this.defaultRadius);
        this.isZoomedIn = false;
      } else if (hitCenter) {
        this.startCameraAnimation(this.cameraTheta, this.cameraPhi, 15);
        this.isZoomedIn = true;
      } else {
        this.startCameraAnimation(this.defaultTheta, this.defaultPhi, this.defaultRadius);
        this.isZoomedIn = false;
      }
    });

    let touchStartX = 0;
    let touchStartY = 0;
    let lastTouchDistance = 0;
    let touchStartTime = 0;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        this.isDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && this.isDragging && !this.cameraAnimating) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;

        this.cameraTheta -= dx * 0.005;
        this.cameraPhi -= dy * 0.005;
        this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi));

        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        this.updateCameraPosition();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const scale = lastTouchDistance / distance;
        this.cameraTargetRadius *= scale;
        this.cameraTargetRadius = Math.max(this.minRadius, Math.min(this.maxRadius, this.cameraTargetRadius));

        lastTouchDistance = distance;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (e.touches.length === 0) {
        const touchDuration = performance.now() - touchStartTime;
        const dx = touchStartX - (e.changedTouches[0]?.clientX || touchStartX);
        const dy = touchStartY - (e.changedTouches[0]?.clientY || touchStartY);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (touchDuration < 300 && dist < 10) {
          if (this.isZoomedIn) {
            this.startCameraAnimation(this.defaultTheta, this.defaultPhi, this.defaultRadius);
            this.isZoomedIn = false;
          } else {
            this.startCameraAnimation(this.cameraTheta, this.cameraPhi, 15);
            this.isZoomedIn = true;
          }
        }
        this.isDragging = false;
      }
    }, { passive: false });

    window.addEventListener('resize', this.resizeHandler);
  }

  private startCameraAnimation(endTheta: number, endPhi: number, endRadius: number): void {
    this.cameraAnimating = true;
    this.cameraAnimStart = performance.now();
    this.cameraAnimStartTheta = this.cameraTheta;
    this.cameraAnimStartPhi = this.cameraPhi;
    this.cameraAnimStartRadius = this.cameraRadius;
    this.cameraAnimEndTheta = endTheta;
    this.cameraAnimEndPhi = endPhi;
    this.cameraAnimEndRadius = endRadius;
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private updateCameraAnimation(now: number): void {
    if (!this.cameraAnimating) return;

    const elapsed = now - this.cameraAnimStart;
    const t = Math.min(elapsed / this.cameraAnimDuration, 1);
    const eased = this.easeInOut(t);

    this.cameraTheta = this.cameraAnimStartTheta + (this.cameraAnimEndTheta - this.cameraAnimStartTheta) * eased;
    this.cameraPhi = this.cameraAnimStartPhi + (this.cameraAnimEndPhi - this.cameraAnimStartPhi) * eased;
    this.cameraRadius = this.cameraAnimStartRadius + (this.cameraAnimEndRadius - this.cameraAnimStartRadius) * eased;
    this.cameraTargetRadius = this.cameraRadius;

    this.updateCameraPosition();

    if (t >= 1) {
      this.cameraAnimating = false;
    }
  }

  private onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private animate(now: number): void {
    this.animationFrameId = requestAnimationFrame((t) => this.animate(t));

    if (this.lastFrameTime === 0) {
      this.lastFrameTime = now;
    }

    const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;
    this.elapsedTime += deltaTime;

    this.fpsAccumulator += deltaTime;
    this.fpsFrameCount++;

    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      const fps = this.fpsFrameCount / this.fpsAccumulator;
      this.controlPanel.updateFPS(fps);
      this.fpsAccumulator = 0;
      this.fpsFrameCount = 0;
      this.lastFpsUpdate = now;
    }

    this.updateCameraAnimation(now);

    if (!this.cameraAnimating && !this.isDragging) {
      const lerpFactor = 0.1;
      this.cameraRadius += (this.cameraTargetRadius - this.cameraRadius) * lerpFactor;
      this.updateCameraPosition();
    }

    if (this.particleData && this.geometry) {
      this.particleUpdater.update({
        rotationSpeed: this.controlState.rotationSpeed,
        evolutionTime: this.controlState.evolutionTime,
        deltaTime,
        elapsedTime: this.elapsedTime
      });

      const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
      posAttr.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  start(): void {
    this.lastFrameTime = performance.now();
    this.animate(this.lastFrameTime);
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.resizeHandler);
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.spriteTexture) this.spriteTexture.dispose();
    this.renderer.dispose();
  }
}

const app = new StarPulseApp();
app.start();
