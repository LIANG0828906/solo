import * as THREE from 'three';
import { EventDispatcher } from '@/managers/EventDispatcher';
import { PhysicsEvent } from '@/types';

interface Particle3D {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  startScale: number;
}

export class ParticleSystem3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private eventDispatcher: EventDispatcher;
  private particles: Particle3D[] = [];
  private readonly MAX_PARTICLES = 200;
  private container: HTMLDivElement;
  private width: number;
  private height: number;
  private canvas2D: HTMLCanvasElement | null = null;

  constructor(
    container: HTMLDivElement,
    eventDispatcher: EventDispatcher,
    width: number,
    height: number,
  ) {
    this.container = container;
    this.eventDispatcher = eventDispatcher;
    this.width = width;
    this.height = height;

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.pointerEvents = 'none';
    this.renderer.domElement.style.zIndex = '2';

    container.appendChild(this.renderer.domElement);

    this.eventDispatcher.addPhysicsListener((event) => this.handlePhysicsEvent(event));

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 200);
    pointLight.position.set(0, 0, 100);
    this.scene.add(pointLight);
  }

  public setCanvas2DReference(canvas: HTMLCanvasElement): void {
    this.canvas2D = canvas;
  }

  private handlePhysicsEvent(event: PhysicsEvent): void {
    if (event.type === 'bond_formed') {
      const x = (event.point.x / this.width - 0.5) * 200;
      const y = -(event.point.y / this.height - 0.5) * 150;

      const intensity = event.bondType === 'triple' ? 1.5 : event.bondType === 'double' ? 1.2 : 1;
      const color = this.getBondColor(event.bondType);
      const particleCount = Math.floor(8 * intensity);

      this.createEnergyBurst(x, y, particleCount, color, intensity);
    }
  }

  private getBondColor(bondType: 'single' | 'double' | 'triple'): number {
    switch (bondType) {
      case 'single':
        return 0x4fc3f7;
      case 'double':
        return 0xffd54f;
      case 'triple':
        return 0xe91e63;
      default:
        return 0xffffff;
    }
  }

  private createEnergyBurst(
    x: number,
    y: number,
    count: number,
    color: number,
    intensity: number,
  ): void {
    const slots = this.MAX_PARTICLES - this.particles.length;
    const actualCount = Math.min(count, slots);
    if (actualCount <= 0) return;

    for (let i = 0; i < actualCount; i++) {
      const angle = (i / actualCount) * Math.PI * 2 + Math.random() * 0.3;
      const speed = (1.5 + Math.random() * 2) * intensity;
      const zSpeed = (Math.random() - 0.5) * 2;

      const geometry = new THREE.SphereGeometry(0.8 + Math.random() * 0.6, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(x, y, Math.random() * 5 - 2.5);

      this.scene.add(mesh);

      const particle: Particle3D = {
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          zSpeed,
        ),
        lifetime: 0,
        maxLifetime: 600 + Math.random() * 400,
        startScale: 1 + Math.random() * 0.5,
      };

      this.particles.push(particle);
    }
  }

  public render(deltaTime: number): void {
    this.updateParticles(deltaTime);
    this.renderer.render(this.scene, this.camera);
  }

  private updateParticles(deltaTime: number): void {
    const toRemove: number[] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      particle.lifetime += deltaTime;

      if (particle.lifetime >= particle.maxLifetime) {
        toRemove.push(i);
        continue;
      }

      particle.mesh.position.x += particle.velocity.x;
      particle.mesh.position.y += particle.velocity.y;
      particle.mesh.position.z += particle.velocity.z;

      particle.velocity.multiplyScalar(0.96);

      const progress = particle.lifetime / particle.maxLifetime;
      const scale = particle.startScale * (1 - progress * 0.7);
      particle.mesh.scale.set(scale, scale, scale);

      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 1 - progress * progress);
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      const idx = toRemove[i];
      const particle = this.particles[idx];
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
      this.particles.splice(idx, 1);
    }
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public getParticleCount(): number {
    return this.particles.length;
  }

  public dispose(): void {
    for (const particle of this.particles) {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
