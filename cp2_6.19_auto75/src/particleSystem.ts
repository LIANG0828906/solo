import * as THREE from 'three';
import type { ParticleData, ColorMode } from './types';
import { PRESETS } from './types';

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: ParticleData[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private trailGeometry: THREE.BufferGeometry;
  private trailMaterial: THREE.LineBasicMaterial;
  private trailLines: THREE.LineSegments;
  private particleTexture: THREE.Texture | null = null;
  private vortexSpeed: number = 0.01;
  private springStrength: number = 0.5;
  private colorMode: ColorMode = 'warm';
  private maxParticles: number = 5000;
  private currentCount: number = 2000;
  private transitionStartPositions: THREE.Vector3[] = [];
  private transitionEndPositions: THREE.Vector3[] = [];
  private isTransitioning: boolean = false;
  private transitionDuration: number = 500;
  private transitionStartTime: number = 0;
  private fadeParticles: Map<number, number> = new Map();
  private raycaster: THREE.Raycaster;
  private mouseVector: THREE.Vector2;
  private halos: Map<number, { mesh: THREE.Mesh; startTime: number }> = new Map();
  private haloGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouseVector = new THREE.Vector2();

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    this.particleTexture = new THREE.CanvasTexture(canvas);

    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      map: this.particleTexture,
      alphaTest: 0.01
    });

    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setDrawRange(0, this.currentCount);

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.renderOrder = 2;
    this.scene.add(this.points);

    this.trailGeometry = new THREE.BufferGeometry();
    this.trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const trailPositions = new Float32Array(this.maxParticles * 10 * 3);
    const trailColors = new Float32Array(this.maxParticles * 10 * 3);

    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    this.trailGeometry.setDrawRange(0, 0);

    this.trailLines = new THREE.LineSegments(this.trailGeometry, this.trailMaterial);
    this.trailLines.renderOrder = 1;
    this.scene.add(this.trailLines);

    this.haloGroup = new THREE.Group();
    this.haloGroup.renderOrder = 3;
    this.scene.add(this.haloGroup);

    this.generateParticles(this.currentCount, 'nebula');
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private getParticleColor(radius: number, maxRadius: number): THREE.Color {
    const t = Math.min(radius / maxRadius, 1);
    
    switch (this.colorMode) {
      case 'warm': {
        const centerHue = 20;
        const edgeHue = 260;
        const hue = centerHue + (edgeHue - centerHue) * t;
        return new THREE.Color().setHSL(hue / 360, 1, 0.6);
      }
      case 'cool': {
        const centerHue = 190;
        const edgeHue = 320;
        const hue = centerHue + (edgeHue - centerHue) * t;
        return new THREE.Color().setHSL(hue / 360, 1, 0.6);
      }
      case 'rainbow': {
        const hue = t * 360;
        return new THREE.Color().setHSL(hue / 360, 1, 0.6);
      }
      default:
        return new THREE.Color(0xffffff);
    }
  }

  public generateParticles(count: number, presetName: string = 'nebula'): void {
    const preset = PRESETS[presetName] || PRESETS.nebula;
    const maxRadius = 8;

    for (let i = 0; i < count; i++) {
      const position = preset.generatePosition(i, count);
      const radius = position.length();
      const angle = Math.atan2(position.z, position.x);
      const height = position.y;

      const particle: ParticleData = {
        position: position.clone(),
        originalPosition: position.clone(),
        targetPosition: position.clone(),
        velocity: new THREE.Vector3(),
        color: this.getParticleColor(radius, maxRadius),
        size: 0.1 + Math.random() * 0.4,
        alpha: 1,
        trail: [],
        angle,
        radius,
        height
      };

      if (i < this.particles.length) {
        this.particles[i] = particle;
      } else {
        this.particles.push(particle);
      }
    }

    this.currentCount = count;
    this.geometry.setDrawRange(0, count);
    this.updateBufferAttributes();
  }

  public setParticleCount(newCount: number): void {
    if (newCount === this.currentCount) return;

    if (newCount > this.currentCount) {
      for (let i = this.currentCount; i < newCount; i++) {
        const preset = PRESETS.nebula;
        const position = preset.generatePosition(i, newCount);
        const radius = position.length();
        const angle = Math.atan2(position.z, position.x);
        const height = position.y;

        const particle: ParticleData = {
          position: position.clone(),
          originalPosition: position.clone(),
          targetPosition: position.clone(),
          velocity: new THREE.Vector3(),
          color: this.getParticleColor(radius, 8),
          size: 0.1 + Math.random() * 0.4,
          alpha: 0,
          trail: [],
          angle,
          radius,
          height
        };

        if (i < this.particles.length) {
          this.particles[i] = particle;
        } else {
          this.particles.push(particle);
        }

        this.fadeParticles.set(i, 0);
      }
    } else {
      for (let i = newCount; i < this.currentCount; i++) {
        this.fadeParticles.set(i, 1);
      }
    }

    this.currentCount = newCount;
    this.geometry.setDrawRange(0, Math.max(newCount, this.currentCount));
  }

  public setVortexSpeed(speed: number): void {
    this.vortexSpeed = speed;
  }

  public setSpringStrength(strength: number): void {
    this.springStrength = strength;
  }

  public setColorMode(mode: ColorMode): void {
    this.colorMode = mode;
    for (let i = 0; i < this.currentCount; i++) {
      const particle = this.particles[i];
      if (particle) {
        particle.color = this.getParticleColor(particle.radius, 8);
      }
    }
  }

  public applyPreset(presetName: string): void {
    const preset = PRESETS[presetName];
    if (!preset) return;

    this.isTransitioning = true;
    this.transitionStartTime = performance.now();
    this.transitionStartPositions = [];
    this.transitionEndPositions = [];

    for (let i = 0; i < this.currentCount; i++) {
      const particle = this.particles[i];
      if (particle) {
        this.transitionStartPositions.push(particle.position.clone());
        const newPos = preset.generatePosition(i, this.currentCount);
        this.transitionEndPositions.push(newPos);
        particle.targetPosition = newPos.clone();
        particle.originalPosition = newPos.clone();
        particle.radius = newPos.length();
        particle.angle = Math.atan2(newPos.z, newPos.x);
        particle.height = newPos.y;
        particle.color = this.getParticleColor(particle.radius, 8);
      }
    }
  }

  public update(delta: number, mouseForce?: THREE.Vector3): void {
    const now = performance.now();

    if (this.isTransitioning) {
      const elapsed = now - this.transitionStartTime;
      const progress = Math.min(elapsed / this.transitionDuration, 1);
      const eased = this.easeInOutQuad(progress);

      for (let i = 0; i < this.currentCount; i++) {
        const particle = this.particles[i];
        const start = this.transitionStartPositions[i];
        const end = this.transitionEndPositions[i];
        if (particle && start && end) {
          particle.position.lerpVectors(start, end, eased);
          particle.originalPosition.copy(end);
          particle.targetPosition.copy(end);
        }
      }

      if (progress >= 1) {
        this.isTransitioning = false;
        this.transitionStartPositions = [];
        this.transitionEndPositions = [];
      }
    }

    const fadeKeys = Array.from(this.fadeParticles.keys());
    for (const key of fadeKeys) {
      const current = this.fadeParticles.get(key)!;
      const target = key < this.currentCount ? 1 : 0;
      const newAlpha = current + (target - current) * delta * 3;
      this.fadeParticles.set(key, newAlpha);

      if (this.particles[key]) {
        this.particles[key].alpha = newAlpha;
      }

      if (Math.abs(newAlpha - target) < 0.01) {
        this.fadeParticles.delete(key);
        if (key >= this.currentCount) {
          this.geometry.setDrawRange(0, this.currentCount);
        }
      }
    }

    const damping = 0.95;

    for (let i = 0; i < this.currentCount; i++) {
      const particle = this.particles[i];
      if (!particle || particle.alpha <= 0) continue;

      if (!this.isTransitioning) {
        particle.angle += this.vortexSpeed * delta * 60;
        const targetX = Math.cos(particle.angle) * particle.radius;
        const targetZ = Math.sin(particle.angle) * particle.radius;
        const targetY = particle.height + Math.sin(particle.angle * 0.5) * 0.2;
        particle.targetPosition.set(targetX, targetY, targetZ);

        const springForce = particle.targetPosition.clone().sub(particle.position);
        springForce.multiplyScalar(this.springStrength * delta * 60);
        particle.velocity.add(springForce);

        if (mouseForce) {
          const dist = particle.position.distanceTo(mouseForce);
          if (dist < 5) {
            const force = particle.position.clone().sub(mouseForce);
            force.normalize();
            force.multiplyScalar((5 - dist) * 0.5 * delta * 60);
            particle.velocity.add(force);
          }
        }

        particle.velocity.multiplyScalar(damping);
        particle.position.add(particle.velocity.clone().multiplyScalar(delta * 60));
      }

      particle.trail.unshift(particle.position.clone());
      if (particle.trail.length > 5) {
        particle.trail.pop();
      }
    }

    this.updateBufferAttributes();
    this.updateHalos();
  }

  private updateBufferAttributes(): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < this.currentCount; i++) {
      const particle = this.particles[i];
      if (!particle) continue;

      const idx = i * 3;
      positions[idx] = particle.position.x;
      positions[idx + 1] = particle.position.y;
      positions[idx + 2] = particle.position.z;

      const alpha = particle.alpha;
      colors[idx] = particle.color.r * alpha;
      colors[idx + 1] = particle.color.g * alpha;
      colors[idx + 2] = particle.color.b * alpha;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    const trailPositions = this.trailGeometry.attributes.position.array as Float32Array;
    const trailColors = this.trailGeometry.attributes.color.array as Float32Array;
    let trailIndex = 0;

    for (let i = 0; i < this.currentCount; i++) {
      const particle = this.particles[i];
      if (!particle || particle.trail.length < 2) continue;

      for (let j = 0; j < particle.trail.length - 1; j++) {
        const p1 = particle.trail[j];
        const p2 = particle.trail[j + 1];
        const alpha = 1 - j / particle.trail.length;

        const idx = trailIndex * 3;
        trailPositions[idx] = p1.x;
        trailPositions[idx + 1] = p1.y;
        trailPositions[idx + 2] = p1.z;
        trailColors[idx] = particle.color.r * alpha;
        trailColors[idx + 1] = particle.color.g * alpha;
        trailColors[idx + 2] = particle.color.b * alpha;

        const idx2 = (trailIndex + 1) * 3;
        trailPositions[idx2] = p2.x;
        trailPositions[idx2 + 1] = p2.y;
        trailPositions[idx2 + 2] = p2.z;
        const alpha2 = 1 - (j + 1) / particle.trail.length;
        trailColors[idx2] = particle.color.r * alpha2;
        trailColors[idx2 + 1] = particle.color.g * alpha2;
        trailColors[idx2 + 2] = particle.color.b * alpha2;

        trailIndex += 2;
      }
    }

    this.trailGeometry.setDrawRange(0, trailIndex);
    this.trailGeometry.attributes.position.needsUpdate = true;
    this.trailGeometry.attributes.color.needsUpdate = true;
  }

  public getParticleAtScreenPoint(
    screenX: number,
    screenY: number,
    camera: THREE.Camera,
    width: number,
    height: number
  ): number | null {
    this.mouseVector.x = (screenX / width) * 2 - 1;
    this.mouseVector.y = -(screenY / height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVector, camera);

    const intersects = this.raycaster.intersectObject(this.points);

    if (intersects.length > 0) {
      return intersects[0].index ?? null;
    }

    return null;
  }

  public getParticleWorldPosition(index: number): THREE.Vector3 | null {
    const particle = this.particles[index];
    if (!particle) return null;
    return particle.position.clone();
  }

  public getParticleVelocity(index: number): THREE.Vector3 | null {
    const particle = this.particles[index];
    if (!particle) return null;
    return particle.velocity.clone();
  }

  public projectToScreen(position: THREE.Vector3, camera: THREE.Camera, width: number, height: number): { x: number; y: number } {
    const vector = position.clone();
    vector.project(camera);
    return {
      x: (vector.x + 1) / 2 * width,
      y: (-vector.y + 1) / 2 * height
    };
  }

  private createHaloMesh(): THREE.Mesh {
    const innerRadius = 0.5;
    const outerRadius = 0.9;
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const positionAttr = geometry.attributes.position;
    const colors = new Float32Array(positionAttr.count * 3);

    const colorStart = new THREE.Color(0xff6b35);
    const colorEnd = new THREE.Color(0x6b35ff);

    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const t = (dist - innerRadius) / (outerRadius - innerRadius);
      const color = colorStart.clone().lerp(colorEnd, t);
      const idx = i * 3;
      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return new THREE.Mesh(geometry, material);
  }

  public showParticleHalo(particleIndex: number): void {
    if (this.halos.has(particleIndex)) return;
    if (particleIndex < 0 || particleIndex >= this.currentCount) return;

    const particle = this.particles[particleIndex];
    if (!particle) return;

    const mesh = this.createHaloMesh();
    mesh.position.copy(particle.position);
    mesh.lookAt(new THREE.Vector3(0, 0, -100));

    this.haloGroup.add(mesh);
    this.halos.set(particleIndex, { mesh, startTime: performance.now() });
  }

  public hideParticleHalo(particleIndex: number): void {
    const halo = this.halos.get(particleIndex);
    if (!halo) return;

    this.haloGroup.remove(halo.mesh);
    (halo.mesh.geometry as THREE.BufferGeometry).dispose();
    (halo.mesh.material as THREE.Material).dispose();
    this.halos.delete(particleIndex);
  }

  private updateHalos(): void {
    const now = performance.now();
    const breathCycle = 2000;

    this.halos.forEach((halo, particleIndex) => {
      const particle = this.particles[particleIndex];
      if (!particle) {
        this.hideParticleHalo(particleIndex);
        return;
      }

      halo.mesh.position.copy(particle.position);
      halo.mesh.lookAt(new THREE.Vector3(0, 0, -100));

      const elapsed = now - halo.startTime;
      const t = (elapsed % breathCycle) / breathCycle;
      const breath = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
      const scale = 0.8 + breath * 0.4;
      halo.mesh.scale.set(scale, scale, scale);

      const material = halo.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.2 + breath * 0.2;
    });
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.trailGeometry.dispose();
    this.trailMaterial.dispose();
    if (this.particleTexture) {
      this.particleTexture.dispose();
    }
    this.halos.forEach((halo) => {
      this.haloGroup.remove(halo.mesh);
      (halo.mesh.geometry as THREE.BufferGeometry).dispose();
      (halo.mesh.material as THREE.Material).dispose();
    });
    this.halos.clear();
    this.scene.remove(this.haloGroup);
    this.scene.remove(this.points);
    this.scene.remove(this.trailLines);
  }
}
