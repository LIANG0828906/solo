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
  visible: boolean;
  exploding: boolean;
  explodeVelocity: THREE.Vector3;
  explodeLife: number;
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

  public lineCount: number = 0;

  private lineUpdateAccumulator: number = 0;
  private lineUpdateInterval: number = 0.033;
  private gridCellSize: number = 30;
  private spatialGrid: Map<string, number[]> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.bounds = new THREE.Box3(
      new THREE.Vector3(-80, -60, -80),
      new THREE.Vector3(80, 60, 80)
    );
    this.ellipsoidRadii = new THREE.Vector3(60, 40, 50);

    this.initParticles();
    this.initPoints();
    this.initLines();
  }

  private initParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.createParticle(i);
      this.particles.push(particle);
    }
  }

  private createParticle(_index: number): ParticleData {
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
      visible: true,
      exploding: false,
      explodeVelocity: new THREE.Vector3(),
      explodeLife: 0
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
    const maxLines = this.particleCount * 2;
    this.linePositions = new Float32Array(maxLines * 6);
    this.lineColors = new Float32Array(maxLines * 6);

    this.linesGeometry = new THREE.BufferGeometry();
    this.linesGeometry.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
    this.linesGeometry.setAttribute('color', new THREE.BufferAttribute(this.lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
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

    const alpha = p.visible ? p.fadeOpacity : 0;
    this.colors[i3] = p.color.r * alpha;
    this.colors[i3 + 1] = p.color.g * alpha;
    this.colors[i3 + 2] = p.color.b * alpha;

    this.sizes[index] = p.size * this.baseSize;
  }

  public update(delta: number, camera: THREE.Camera): void {
    const adjustedDelta = delta * this.speed;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];

      if (p.exploding) {
        p.explodeLife -= delta;
        if (p.explodeLife <= 0) {
          p.exploding = false;
          p.visible = true;
          p.fadeOpacity = 0;
          this.resetParticlePosition(i);
        } else {
          p.position.add(p.explodeVelocity.clone().multiplyScalar(delta));
          p.explodeVelocity.multiplyScalar(0.98);
          const explodeAlpha = p.explodeLife / 2;
          p.color.setHSL(0.1 + explodeAlpha * 0.1, 1, 0.5 + explodeAlpha * 0.3);
        }
      } else {
        if (this.mode === 'random') {
          this.updateRandomMode(p, adjustedDelta);
        } else {
          this.updateEllipsoidMode(p, adjustedDelta, delta);
        }

        this.updateFade(p, camera);
      }

      this.updateParticleBuffer(i);
    }

    (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.points.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (this.points.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;

    this.lineUpdateAccumulator += delta;
    if (this.lineUpdateAccumulator >= this.lineUpdateInterval) {
      this.lineUpdateAccumulator = 0;
      this.updateLines();
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
    p.position.add(p.velocity.clone().multiplyScalar(delta * 10));

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

  private updateFade(p: ParticleData, camera: THREE.Camera): void {
    const distance = p.position.distanceTo(camera.position);
    const far = 180;
    const near = 20;

    if (distance > far) {
      p.visible = false;
    } else if (distance < near) {
      p.visible = true;
    }

    const targetOpacity = p.visible ? Math.min(1, (far - distance) / (far - 80)) : 0;
    p.fadeOpacity += (targetOpacity - p.fadeOpacity) * 0.05;
  }

  private updateLines(): void {
    if (this.lineThreshold <= 0) {
      this.linesGeometry.setDrawRange(0, 0);
      this.lineCount = 0;
      return;
    }

    const thresholdSq = this.lineThreshold * this.lineThreshold;
    let lineIndex = 0;
    let vertexIndex = 0;
    const maxVertices = this.linePositions.length / 3;

    for (let i = 0; i < this.particleCount; i++) {
      const p1 = this.particles[i];
      if (!p1.visible || p1.fadeOpacity < 0.1 || p1.exploding) continue;

      for (let j = i + 1; j < this.particleCount; j++) {
        if (vertexIndex >= maxVertices - 2) break;

        const p2 = this.particles[j];
        if (!p2.visible || p2.fadeOpacity < 0.1 || p2.exploding) continue;

        const dx = p1.position.x - p2.position.x;
        const dy = p1.position.y - p2.position.y;
        const dz = p1.position.z - p2.position.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < thresholdSq) {
          const dist = Math.sqrt(distSq);
          const alpha = (1 - dist / this.lineThreshold) * 0.5;

          const vi = vertexIndex * 3;
          this.linePositions[vi] = p1.position.x;
          this.linePositions[vi + 1] = p1.position.y;
          this.linePositions[vi + 2] = p1.position.z;

          const mixedColor1 = p1.color.clone().multiplyScalar(alpha * p1.fadeOpacity);
          this.lineColors[vi] = mixedColor1.r;
          this.lineColors[vi + 1] = mixedColor1.g;
          this.lineColors[vi + 2] = mixedColor1.b;

          const vi2 = (vertexIndex + 1) * 3;
          this.linePositions[vi2] = p2.position.x;
          this.linePositions[vi2 + 1] = p2.position.y;
          this.linePositions[vi2 + 2] = p2.position.z;

          const mixedColor2 = p2.color.clone().multiplyScalar(alpha * p2.fadeOpacity);
          this.lineColors[vi2] = mixedColor2.r;
          this.lineColors[vi2 + 1] = mixedColor2.g;
          this.lineColors[vi2 + 2] = mixedColor2.b;

          vertexIndex += 2;
          lineIndex++;
        }
      }

      if (vertexIndex >= maxVertices - 2) break;
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
        const particle = this.createParticle(i);
        particle.fadeOpacity = 0;
        this.particles.push(particle);
      }
    } else {
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

    const maxLines = this.particleCount * 2;
    this.linePositions = new Float32Array(maxLines * 6);
    this.lineColors = new Float32Array(maxLines * 6);

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
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
    this.scene.remove(this.points);

    this.linesGeometry.dispose();
    (this.lines.material as THREE.Material).dispose();
    this.scene.remove(this.lines);
  }
}
