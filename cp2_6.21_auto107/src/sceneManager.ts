import * as THREE from 'three';
import { ParticleEngine } from './particleEngine';
import { Particle } from './types';

const MAX_TRAILS = 5;
const BG_COLOR = 0x0a0a1a;

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  particleGeometry: THREE.BufferGeometry;
  particleMaterial: THREE.PointsMaterial;
  particleMesh: THREE.Points;
  trailGeometry: THREE.BufferGeometry;
  trailMaterial: THREE.PointsMaterial;
  trailMesh: THREE.Points;

  private engine: ParticleEngine;
  private isDragging: boolean;
  private previousMouse: { x: number; y: number };
  private rotationVelocity: { x: number; y: number };
  private damping: number;
  private cameraDistance: number;
  private targetCameraDistance: number;
  private pivot: THREE.Group;

  constructor(engine: ParticleEngine, container: HTMLElement) {
    this.engine = engine;
    this.isDragging = false;
    this.previousMouse = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0, y: 0 };
    this.damping = 0.92;
    this.cameraDistance = 30;
    this.targetCameraDistance = 30;
    this.pivot = new THREE.Group();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BG_COLOR);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.insertBefore(this.renderer.domElement, container.firstChild);

    const particleCount = engine.particles.length;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const p = engine.particles[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      colors[i * 3] = p.r;
      colors[i * 3 + 1] = p.g;
      colors[i * 3 + 2] = p.b;
    }

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.particleMaterial = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particleMesh = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.pivot.add(this.particleMesh);

    const trailCount = particleCount * MAX_TRAILS;
    const trailPositions = new Float32Array(trailCount * 3);
    const trailColors = new Float32Array(trailCount * 3);

    this.trailGeometry = new THREE.BufferGeometry();
    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

    this.trailMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.trailMesh = new THREE.Points(this.trailGeometry, this.trailMaterial);
    this.pivot.add(this.trailMesh);

    this.scene.add(this.pivot);

    this.initTrailGeometry();

    this.bindEvents(container);
  }

  private initTrailGeometry(): void {
    const posAttr = this.trailGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.trailGeometry.getAttribute('color') as THREE.BufferAttribute;
    posAttr.setUsage(THREE.DynamicDrawUsage);
    colAttr.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < this.engine.particles.length; i++) {
      for (let t = 0; t < MAX_TRAILS; t++) {
        const idx = (i * MAX_TRAILS + t) * 3;
        posAttr.array[idx] = 0;
        posAttr.array[idx + 1] = 0;
        posAttr.array[idx + 2] = 0;
        colAttr.array[idx] = 0;
        colAttr.array[idx + 1] = 0;
        colAttr.array[idx + 2] = 0;
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  private updateCameraPosition(): void {
    this.camera.position.set(0, 0, this.cameraDistance);
    this.camera.lookAt(0, 0, 0);
  }

  private bindEvents(container: HTMLElement): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      this.isDragging = true;
      this.previousMouse.x = e.clientX;
      this.previousMouse.y = e.clientY;
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.previousMouse.x;
      const dy = e.clientY - this.previousMouse.y;
      this.rotationVelocity.x = dy * 0.005;
      this.rotationVelocity.y = dx * 0.005;
      this.pivot.rotation.x += this.rotationVelocity.x;
      this.pivot.rotation.y += this.rotationVelocity.y;
      this.previousMouse.x = e.clientX;
      this.previousMouse.y = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      this.targetCameraDistance += e.deltaY * 0.03;
      this.targetCameraDistance = Math.max(10, Math.min(120, this.targetCameraDistance));
    }, { passive: false });

    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMouse.x = e.touches[0].clientX;
        this.previousMouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.previousMouse.x;
      const dy = e.touches[0].clientY - this.previousMouse.y;
      this.rotationVelocity.x = dy * 0.005;
      this.rotationVelocity.y = dx * 0.005;
      this.pivot.rotation.x += this.rotationVelocity.x;
      this.pivot.rotation.y += this.rotationVelocity.y;
      this.previousMouse.x = e.touches[0].clientX;
      this.previousMouse.y = e.touches[0].clientY;
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  update(): void {
    if (!this.isDragging) {
      this.pivot.rotation.x += this.rotationVelocity.x;
      this.pivot.rotation.y += this.rotationVelocity.y;
      this.rotationVelocity.x *= this.damping;
      this.rotationVelocity.y *= this.damping;
    }

    this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * 0.1;
    this.updateCameraPosition();

    this.syncParticleBuffers();
    this.syncTrailBuffers();

    this.renderer.render(this.scene, this.camera);
  }

  private syncParticleBuffers(): void {
    const posAttr = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.particleGeometry.getAttribute('color') as THREE.BufferAttribute;
    const particles = this.engine.particles;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      posAttr.array[i * 3] = p.x;
      posAttr.array[i * 3 + 1] = p.y;
      posAttr.array[i * 3 + 2] = p.z;
      colAttr.array[i * 3] = p.r;
      colAttr.array[i * 3 + 1] = p.g;
      colAttr.array[i * 3 + 2] = p.b;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  private syncTrailBuffers(): void {
    const posAttr = this.trailGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.trailGeometry.getAttribute('color') as THREE.BufferAttribute;
    const particles = this.engine.particles;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const trail = p.trail;
      for (let t = 0; t < MAX_TRAILS; t++) {
        const idx = (i * MAX_TRAILS + t) * 3;
        if (t < trail.length) {
          const tp = trail[t];
          posAttr.array[idx] = tp.x;
          posAttr.array[idx + 1] = tp.y;
          posAttr.array[idx + 2] = tp.z;
          const alpha = (t + 1) / (trail.length + 1);
          colAttr.array[idx] = p.r * alpha;
          colAttr.array[idx + 1] = p.g * alpha;
          colAttr.array[idx + 2] = p.b * alpha;
        } else {
          posAttr.array[idx] = p.x;
          posAttr.array[idx + 1] = p.y;
          posAttr.array[idx + 2] = p.z;
          colAttr.array[idx] = 0;
          colAttr.array[idx + 1] = 0;
          colAttr.array[idx + 2] = 0;
        }
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }
}
