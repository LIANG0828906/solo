import * as THREE from 'three';
import gsap from 'gsap';

export type ParticleMode = 'random' | 'ellipsoid';

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetPosition: THREE.Vector3;
  ellipsoidAngle: THREE.Vector2;
  ellipsoidSpeed: THREE.Vector2;
  color: THREE.Color;
  baseColor: THREE.Color;
  size: number;
  fadeOpacity: number;
  inView: boolean;
  wasInView: boolean;
  exploding: boolean;
  explodeVelocity: THREE.Vector3;
  explodeLife: number;
  fadeTween: gsap.core.Tween | null;
  opacityTarget: number;
}

interface SpatialHash {
  [key: string]: number[];
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: ParticleData[] = [];
  private particleCount: number = 5000;
  private mode: ParticleMode = 'random';
  private speed: number = 1.0;
  private baseSize: number = 1.0;
  private baseHue: number = 210;
  private lineThreshold: number = 30;
  private maxLines: number = 10000;

  private points!: THREE.Points;
  private positions!: Float32Array;
  private colors!: Float32Array;
  private sizes!: Float32Array;

  private linesGeometry!: THREE.BufferGeometry;
  private lines!: THREE.LineSegments;
  private linePositions!: Float32Array;
  private lineColors!: Float32Array;

  private bounds: THREE.Box3;
  private ellipsoidRadii: THREE.Vector3;
  private frustum: THREE.Frustum;
  private matrix: THREE.Matrix4;

  public lineCount: number = 0;

  private lineUpdateAccumulator: number = 0;
  private lineUpdateInterval: number = 0.05;
  private cellSize: number = 30;
  private spatialHash: SpatialHash = {};

  private initialized: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.bounds = new THREE.Box3(
      new THREE.Vector3(-80, -60, -80),
      new THREE.Vector3(80, 60, 80)
    );
    this.ellipsoidRadii = new THREE.Vector3(60, 40, 50);
    this.frustum = new THREE.Frustum();
    this.matrix = new THREE.Matrix4();

    this.initParticles();
    this.initPoints();
    this.initLines();

    setTimeout(() => {
      this.initialized = true;
      this.fadeInAllParticles();
    }, 100);
  }

  private initParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.createParticle();
      this.particles.push(particle);
    }
  }

  private createParticle(): ParticleData {
    const hue = (this.baseHue + Math.random() * 40 - 20) / 360;
    const color = new THREE.Color().setHSL(hue, 0.8, 0.6 + Math.random() * 0.3);
    const baseColor = color.clone();

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 40 + Math.random() * 30;

    const position = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );

    const ellipsoidAngle = new THREE.Vector2(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI
    );

    const ellipsoidSpeed = new THREE.Vector2(
      (0.2 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1),
      (0.15 + Math.random() * 0.2) * (Math.random() > 0.5 ? 1 : -1)
    );

    const targetPosition = this.getEllipsoidPosition(ellipsoidAngle);

    return {
      position,
      velocity,
      targetPosition,
      ellipsoidAngle,
      ellipsoidSpeed,
      color,
      baseColor,
      size: 0.8 + Math.random() * 0.4,
      fadeOpacity: 0,
      inView: false,
      wasInView: false,
      exploding: false,
      explodeVelocity: new THREE.Vector3(),
      explodeLife: 0,
      fadeTween: null,
      opacityTarget: 0
    };
  }

  private getEllipsoidPosition(angle: THREE.Vector2): THREE.Vector3 {
    return new THREE.Vector3(
      this.ellipsoidRadii.x * Math.sin(angle.y) * Math.cos(angle.x),
      this.ellipsoidRadii.y * Math.cos(angle.y),
      this.ellipsoidRadii.z * Math.sin(angle.y) * Math.sin(angle.x)
    );
  }

  private initPoints(): void {
    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      this.updateParticleBuffer(i);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio || 1 }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  private initLines(): void {
    const maxLineVertices = this.maxLines * 2;
    this.linePositions = new Float32Array(maxLineVertices * 3);
    this.lineColors = new Float32Array(maxLineVertices * 3);

    this.linesGeometry = new THREE.BufferGeometry();
    this.linesGeometry.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
    this.linesGeometry.setAttribute('color', new THREE.BufferAttribute(this.lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.lines = new THREE.LineSegments(this.linesGeometry, lineMaterial);
    this.scene.add(this.lines);
  }

  private updateParticleBuffer(index: number): void {
    const p = this.particles[index];
    const i3 = index * 3;

    this.positions[i3] = p.position.x;
    this.positions[i3 + 1] = p.position.y;
    this.positions[i3 + 2] = p.position.z;

    const alpha = Math.max(0, Math.min(1, p.fadeOpacity));
    this.colors[i3] = p.color.r * alpha;
    this.colors[i3 + 1] = p.color.g * alpha;
    this.colors[i3 + 2] = p.color.b * alpha;

    this.sizes[index] = p.size * this.baseSize;
  }

  public update(delta: number, camera: THREE.Camera): void {
    const adjustedDelta = delta * this.speed;

    this.updateFrustum(camera);

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];

      if (p.exploding) {
        p.explodeLife -= delta;
        if (p.explodeLife <= 0) {
          this.handleExplosionComplete(i);
        } else {
          p.position.x += p.explodeVelocity.x * delta;
          p.position.y += p.explodeVelocity.y * delta;
          p.position.z += p.explodeVelocity.z * delta;

          p.explodeVelocity.multiplyScalar(0.98);

          const explodeAlpha = Math.max(0, p.explodeLife / 2);
          p.fadeOpacity = explodeAlpha;
          p.color.setHSL(0.08 + explodeAlpha * 0.1, 1, 0.5 + explodeAlpha * 0.3);
        }
      } else {
        if (this.mode === 'random') {
          this.updateRandomMode(p, adjustedDelta);
        } else {
          this.updateEllipsoidMode(p, adjustedDelta, delta);
        }

        if (this.initialized) {
          p.wasInView = p.inView;
          p.inView = this.isParticleInView(p);

          if (p.inView !== p.wasInView) {
            this.triggerFadeAnimation(p, p.inView);
          }
        }
      }

      this.updateParticleBuffer(i);
    }

    (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.points.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (this.points.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;

    this.lineUpdateAccumulator += delta;
    if (this.lineUpdateAccumulator >= this.lineUpdateInterval) {
      this.lineUpdateAccumulator = 0;
      this.updateLinesWithSpatialHash();
    }
  }

  private updateFrustum(camera: THREE.Camera): void {
    this.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.matrix);
  }

  private isParticleInView(p: ParticleData): boolean {
    return this.frustum.containsPoint(p.position);
  }

  private fadeInAllParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      p.inView = this.isParticleInView(p);
      p.wasInView = p.inView;
      if (p.inView) {
        this.triggerFadeAnimation(p, true);
      }
    }
  }

  private triggerFadeAnimation(p: ParticleData, fadeIn: boolean): void {
    if (p.fadeTween) {
      p.fadeTween.kill();
      p.fadeTween = null;
    }

    const targetOpacity = fadeIn ? 1 : 0;
    p.opacityTarget = targetOpacity;
    const duration = fadeIn ? 0.8 : 0.6;

    p.fadeTween = gsap.to(p, {
      fadeOpacity: targetOpacity,
      duration,
      ease: fadeIn ? 'power2.out' : 'power2.in',
      onComplete: () => {
        p.fadeTween = null;
      }
    });
  }

  private handleExplosionComplete(index: number): void {
    const p = this.particles[index];
    p.exploding = false;
    p.color.copy(p.baseColor);
    p.fadeOpacity = 0;

    if (p.fadeTween) {
      p.fadeTween.kill();
      p.fadeTween = null;
    }

    if (this.mode === 'ellipsoid') {
      p.ellipsoidAngle.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI
      );
      p.position.copy(this.getEllipsoidPosition(p.ellipsoidAngle));
    } else {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 40 + Math.random() * 30;
      p.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      p.velocity.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
    }

    p.inView = this.isParticleInView(p);
    p.wasInView = p.inView;

    if (p.inView) {
      this.triggerFadeAnimation(p, true);
    }
  }

  private resetParticlePosition(index: number): void {
    const p = this.particles[index];
    if (this.mode === 'ellipsoid') {
      p.position.copy(this.getEllipsoidPosition(p.ellipsoidAngle));
    } else {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 40 + Math.random() * 30;
      p.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
    }
  }

  private updateRandomMode(p: ParticleData, delta: number): void {
    p.position.x += p.velocity.x * delta * 10;
    p.position.y += p.velocity.y * delta * 10;
    p.position.z += p.velocity.z * delta * 10;

    if (p.position.x < this.bounds.min.x || p.position.x > this.bounds.max.x) {
      p.velocity.x *= -1;
    }
    if (p.position.y < this.bounds.min.y || p.position.y > this.bounds.max.y) {
      p.velocity.y *= -1;
    }
    if (p.position.z < this.bounds.min.z || p.position.z > this.bounds.max.z) {
      p.velocity.z *= -1;
    }

    p.position.clamp(this.bounds.min, this.bounds.max);
  }

  private updateEllipsoidMode(p: ParticleData, adjustedDelta: number, delta: number): void {
    p.ellipsoidAngle.x += p.ellipsoidSpeed.x * adjustedDelta;
    p.ellipsoidAngle.y += p.ellipsoidSpeed.y * adjustedDelta * 0.5;

    if (p.ellipsoidAngle.y < 0.1) p.ellipsoidAngle.y = 0.1;
    if (p.ellipsoidAngle.y > Math.PI - 0.1) p.ellipsoidAngle.y = Math.PI - 0.1;

    const targetPos = this.getEllipsoidPosition(p.ellipsoidAngle);
    p.targetPosition.copy(targetPos);

    p.position.lerp(p.targetPosition, delta * 3);
  }

  private getCellKey(x: number, y: number, z: number): string {
    return `${Math.floor(x / this.cellSize)}_${Math.floor(y / this.cellSize)}_${Math.floor(z / this.cellSize)}`;
  }

  private buildSpatialHash(): void {
    this.spatialHash = {};
    const threshold = this.lineThreshold;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      if (p.fadeOpacity < 0.2 || p.exploding) continue;

      const key = this.getCellKey(p.position.x, p.position.y, p.position.z);
      if (!this.spatialHash[key]) {
        this.spatialHash[key] = [];
      }
      this.spatialHash[key].push(i);
    }
  }

  private getNearbyCells(px: number, py: number, pz: number): string[] {
    const cells: string[] = [];
    const cx = Math.floor(px / this.cellSize);
    const cy = Math.floor(py / this.cellSize);
    const cz = Math.floor(pz / this.cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          cells.push(`${cx + dx}_${cy + dy}_${cz + dz}`);
        }
      }
    }
    return cells;
  }

  private updateLinesWithSpatialHash(): void {
    if (this.lineThreshold <= 0) {
      this.linesGeometry.setDrawRange(0, 0);
      this.lineCount = 0;
      return;
    }

    this.buildSpatialHash();

    const threshold = this.lineThreshold;
    const thresholdSq = threshold * threshold;
    const invThreshold = 1 / threshold;

    let lineIndex = 0;
    let vertexIndex = 0;
    const maxLineVertices = this.linePositions.length / 3;

    for (let i = 0; i < this.particleCount; i++) {
      const p1 = this.particles[i];
      if (p1.fadeOpacity < 0.2 || p1.exploding) continue;

      const p1x = p1.position.x;
      const p1y = p1.position.y;
      const p1z = p1.position.z;
      const p1r = p1.color.r;
      const p1g = p1.color.g;
      const p1b = p1.color.b;
      const p1a = p1.fadeOpacity;

      const cellKey = this.getCellKey(p1x, p1y, p1z);
      const nearbyCells = this.getNearbyCells(p1x, p1y, p1z);

      for (const nCellKey of nearbyCells) {
        const cellParticles = this.spatialHash[nCellKey];
        if (!cellParticles) continue;

        for (const j of cellParticles) {
          if (j <= i) continue;
          if (vertexIndex >= maxLineVertices - 2) break;
          if (lineIndex >= this.maxLines) break;

          const p2 = this.particles[j];
          if (p2.fadeOpacity < 0.2 || p2.exploding) continue;

          const dx = p1x - p2.position.x;
          if (dx > threshold || dx < -threshold) continue;

          const dy = p1y - p2.position.y;
          if (dy > threshold || dy < -threshold) continue;

          const dz = p1z - p2.position.z;
          if (dz > threshold || dz < -threshold) continue;

          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq >= thresholdSq) continue;

          const dist = Math.sqrt(distSq);
          const alpha = (1 - dist * invThreshold) * 0.4;

          const vi = vertexIndex * 3;
          this.linePositions[vi] = p1x;
          this.linePositions[vi + 1] = p1y;
          this.linePositions[vi + 2] = p1z;

          const a1 = alpha * p1a;
          this.lineColors[vi] = p1r * a1;
          this.lineColors[vi + 1] = p1g * a1;
          this.lineColors[vi + 2] = p1b * a1;

          const vi2 = (vertexIndex + 1) * 3;
          this.linePositions[vi2] = p2.position.x;
          this.linePositions[vi2 + 1] = p2.position.y;
          this.linePositions[vi2 + 2] = p2.position.z;

          const a2 = alpha * p2.fadeOpacity;
          this.lineColors[vi2] = p2.color.r * a2;
          this.lineColors[vi2 + 1] = p2.color.g * a2;
          this.lineColors[vi2 + 2] = p2.color.b * a2;

          vertexIndex += 2;
          lineIndex++;
        }

        if (lineIndex >= this.maxLines) break;
      }

      if (lineIndex >= this.maxLines) break;
    }

    this.lineCount = lineIndex;
    this.linesGeometry.setDrawRange(0, vertexIndex);
    (this.linesGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.linesGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  public setMode(mode: ParticleMode): void {
    if (this.mode === mode) return;
    this.mode = mode;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      if (p.exploding) continue;

      if (p.fadeTween) {
        p.fadeTween.kill();
        p.fadeTween = null;
      }

      if (mode === 'ellipsoid') {
        p.ellipsoidAngle.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI
        );
        p.ellipsoidSpeed.set(
          (0.2 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1),
          (0.15 + Math.random() * 0.2) * (Math.random() > 0.5 ? 1 : -1)
        );
        const target = this.getEllipsoidPosition(p.ellipsoidAngle);

        gsap.to(p.position, {
          x: target.x,
          y: target.y,
          z: target.z,
          duration: 1.5,
          ease: 'power2.inOut'
        });
      } else {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 40 + Math.random() * 30;

        gsap.to(p.position, {
          x: radius * Math.sin(phi) * Math.cos(theta),
          y: radius * Math.sin(phi) * Math.sin(theta),
          z: radius * Math.cos(phi),
          duration: 1.5,
          ease: 'power2.inOut'
        });

        p.velocity.set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        );
      }
    }
  }

  public setCount(count: number): void {
    if (count === this.particleCount) return;

    const oldCount = this.particleCount;
    this.particleCount = count;

    if (count > oldCount) {
      for (let i = oldCount; i < count; i++) {
        const particle = this.createParticle();
        particle.fadeOpacity = 0;
        particle.inView = false;
        particle.wasInView = false;
        this.particles.push(particle);

        if (this.initialized) {
          particle.inView = this.isParticleInView(particle);
          particle.wasInView = particle.inView;
          if (particle.inView) {
            this.triggerFadeAnimation(particle, true);
          }
        }
      }
    } else {
      for (let i = count; i < oldCount; i++) {
        if (this.particles[i].fadeTween) {
          this.particles[i].fadeTween?.kill();
        }
      }
      this.particles.length = count;
    }

    this.rebuildBuffers();
  }

  private rebuildBuffers(): void {
    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      this.updateParticleBuffer(i);
    }

    this.points.geometry.dispose();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.points.geometry = geometry;

    const maxLineVertices = this.maxLines * 2;
    this.linePositions = new Float32Array(maxLineVertices * 3);
    this.lineColors = new Float32Array(maxLineVertices * 3);

    this.linesGeometry.dispose();
    this.linesGeometry = new THREE.BufferGeometry();
    this.linesGeometry.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
    this.linesGeometry.setAttribute('color', new THREE.BufferAttribute(this.lineColors, 3));
    this.lines.geometry = this.linesGeometry;
  }

  public setSize(size: number): void {
    this.baseSize = size;
  }

  public setSpeed(speed: number): void {
    this.speed = speed;
  }

  public setColor(hue: number): void {
    this.baseHue = hue;
    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      const h = (hue + Math.random() * 40 - 20) / 360;
      p.baseColor.setHSL(h, 0.8, 0.6 + Math.random() * 0.3);
      if (!p.exploding) {
        p.color.copy(p.baseColor);
      }
    }
  }

  public setLineThreshold(threshold: number): void {
    this.lineThreshold = threshold;
    this.cellSize = Math.max(threshold, 20);
  }

  public explode(position: THREE.Vector3, radius: number = 15): void {
    const radiusSq = radius * radius;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      if (p.exploding) continue;

      const dx = p.position.x - position.x;
      const dy = p.position.y - position.y;
      const dz = p.position.z - position.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < radiusSq) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / radius) * 80;

        if (p.fadeTween) {
          p.fadeTween.kill();
          p.fadeTween = null;
        }

        p.exploding = true;
        p.explodeLife = 2;
        p.explodeVelocity.set(dx, dy, dz).normalize().multiplyScalar(force);
        p.explodeVelocity.y += 20;
      }
    }
  }

  public getCount(): number {
    return this.particleCount;
  }

  public getMode(): ParticleMode {
    return this.mode;
  }

  public dispose(): void {
    for (const p of this.particles) {
      if (p.fadeTween) {
        p.fadeTween.kill();
      }
    }

    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
    this.scene.remove(this.points);

    this.linesGeometry.dispose();
    (this.lines.material as THREE.Material).dispose();
    this.scene.remove(this.lines);
  }
}
