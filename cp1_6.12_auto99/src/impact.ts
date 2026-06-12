import * as THREE from 'three';
import { Planet, ImpactInfo } from './planet';

interface Shockwave {
  mesh: THREE.Mesh;
  startTime: number;
  duration: number;
  maxRadius: number;
}

interface DebrisParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  fadeOutTime: number;
  planetRadius: number;
}

export interface ImpactConfig {
  asteroidRadius: number;
  impactSpeed: number;
}

export class ImpactManager {
  private scene: THREE.Scene;
  private planet: Planet;
  private shockwaves: Shockwave[] = [];
  private debrisParticles: DebrisParticle[] = [];
  private maxDebris = 200;
  private planetGravity = 9.8;

  private dragStartPos: THREE.Vector2 | null = null;
  private isDragging = false;
  private dragThreshold = 5;

  constructor(scene: THREE.Scene, planet: Planet) {
    this.scene = scene;
    this.planet = planet;
  }

  public setupClickInteraction(
    domElement: HTMLElement,
    camera: THREE.PerspectiveCamera,
    configGetter: () => ImpactConfig,
    onImpactCallback?: () => void
  ): void {
    domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
    domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    domElement.addEventListener('mouseup', (e) => this.onMouseUp(e, domElement, camera, configGetter, onImpactCallback));
    domElement.addEventListener('mouseleave', () => {
      this.dragStartPos = null;
      this.isDragging = false;
    });
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.dragStartPos = new THREE.Vector2(e.clientX, e.clientY);
    this.isDragging = false;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.dragStartPos) return;
    const dx = e.clientX - this.dragStartPos.x;
    const dy = e.clientY - this.dragStartPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > this.dragThreshold) {
      this.isDragging = true;
    }
  }

  private onMouseUp(
    e: MouseEvent,
    domElement: HTMLElement,
    camera: THREE.PerspectiveCamera,
    configGetter: () => ImpactConfig,
    onImpactCallback?: () => void
  ): void {
    if (e.button !== 0 || !this.dragStartPos) return;
    const startPos = this.dragStartPos;
    this.dragStartPos = null;

    if (this.isDragging) {
      this.isDragging = false;
      return;
    }

    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > this.dragThreshold) {
      this.isDragging = false;
      return;
    }

    const rect = domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(this.planet.mesh);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const config = configGetter();
      this.createImpact(hit.point, config);
      onImpactCallback?.();
    }
  }

  public createImpact(worldPosition: THREE.Vector3, config: ImpactConfig): void {
    const craterDiameter = config.asteroidRadius * 4;
    const craterDepth = config.asteroidRadius * 0.5;

    const impactInfo: ImpactInfo = {
      worldPosition: worldPosition.clone(),
      radius: craterDiameter / 2,
      depth: craterDepth
    };

    this.planet.addImpactCrater(impactInfo);
    this.createShockwave(worldPosition, craterDiameter);
    this.createDebris(worldPosition, config);
  }

  private createShockwave(worldPosition: THREE.Vector3, craterDiameter: number): void {
    const maxRadius = craterDiameter * 2;

    const geometry = new THREE.RingGeometry(0.01, 0.02, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(worldPosition);

    const normal = worldPosition.clone().normalize();
    mesh.lookAt(worldPosition.clone().add(normal));

    this.scene.add(mesh);

    this.shockwaves.push({
      mesh,
      startTime: performance.now() / 1000,
      duration: 0.6,
      maxRadius
    });
  }

  private createDebris(worldPosition: THREE.Vector3, config: ImpactConfig): void {
    const count = Math.floor(20 + Math.random() * 31);
    const surfaceColor = this.planet.getSurfaceColorAt(worldPosition);
    const normal = worldPosition.clone().normalize();
    const planetRadius = this.planet.mesh.geometry.parameters.radius;

    for (let i = 0; i < count; i++) {
      if (this.debrisParticles.length >= this.maxDebris) {
        this.recycleOldestDebris();
      }

      const size = 0.2 + Math.random() * 0.6;
      const geometry = new THREE.BoxGeometry(size, size, size);

      const colorVariation = 0.85 + Math.random() * 0.3;
      const color = surfaceColor.clone().multiplyScalar(colorVariation);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.9,
        metalness: 0.1,
        transparent: true,
        opacity: 1
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(worldPosition);

      let direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 0.8 + 0.2,
        (Math.random() - 0.5) * 2
      ).normalize();

      direction.lerp(normal, 0.6).normalize();

      const speed = (1 + Math.random() * 2) * (0.5 + config.impactSpeed * 0.15);
      const velocity = direction.multiplyScalar(speed);

      const lifetime = 3 + Math.random() * 2;

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      this.scene.add(mesh);

      this.debrisParticles.push({
        mesh,
        velocity,
        lifetime,
        maxLifetime: lifetime,
        fadeOutTime: 0.3,
        planetRadius
      });
    }
  }

  private recycleOldestDebris(): void {
    if (this.debrisParticles.length === 0) return;
    const oldest = this.debrisParticles.shift()!;
    this.scene.remove(oldest.mesh);
    oldest.mesh.geometry.dispose();
    (oldest.mesh.material as THREE.Material).dispose();
  }

  public update(currentTime: number, deltaTime: number): void {
    this.updateShockwaves(currentTime);
    this.updateDebris(deltaTime);
  }

  private updateShockwaves(currentTime: number): void {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      const elapsed = currentTime - sw.startTime;

      if (elapsed >= sw.duration) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        (sw.mesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }

      const t = elapsed / sw.duration;
      const currentRadius = sw.maxRadius * t;

      const ringWidth = Math.max(0.05, sw.maxRadius * 0.1 * (1 - t * 0.5));

      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);

      const newGeometry = new THREE.RingGeometry(
        Math.max(0.01, currentRadius - ringWidth),
        currentRadius,
        64
      );
      sw.mesh.geometry.dispose();
      sw.mesh.geometry = newGeometry;
    }
  }

  private updateDebris(deltaTime: number): void {
    const dt = Math.min(deltaTime, 0.05);

    for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
      const particle = this.debrisParticles[i];

      particle.lifetime -= dt;

      const toCenter = particle.mesh.position.clone().negate().normalize();
      const gravityForce = this.planetGravity * dt * 0.3;
      particle.velocity.addScaledVector(toCenter, gravityForce);

      particle.mesh.position.addScaledVector(particle.velocity, dt);

      const distFromCenter = particle.mesh.position.length();
      if (distFromCenter < particle.planetRadius + 0.05) {
        particle.velocity.multiplyScalar(0);
        particle.mesh.position.setLength(particle.planetRadius + 0.05);
      }

      particle.mesh.rotation.x += dt * 2;
      particle.mesh.rotation.y += dt * 1.5;

      const material = particle.mesh.material as THREE.MeshStandardMaterial;
      if (particle.lifetime < particle.fadeOutTime) {
        material.opacity = Math.max(0, particle.lifetime / particle.fadeOutTime);
      }

      if (particle.lifetime <= 0) {
        this.scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        material.dispose();
        this.debrisParticles.splice(i, 1);
      }
    }
  }

  public clearAll(): void {
    for (const sw of this.shockwaves) {
      this.scene.remove(sw.mesh);
      sw.mesh.geometry.dispose();
      (sw.mesh.material as THREE.Material).dispose();
    }
    this.shockwaves = [];

    for (const particle of this.debrisParticles) {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
    }
    this.debrisParticles = [];
  }

  public getActiveDebrisCount(): number {
    return this.debrisParticles.length;
  }
}
