import * as THREE from 'three';

export type ParticleKind = 'flame' | 'steam' | 'metal_flow' | 'splash';

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
  active: boolean;
}

export class ParticleEmitter {
  public points: THREE.Points;
  private _geometry: THREE.BufferGeometry;
  private _material: THREE.PointsMaterial;
  private _positions: Float32Array;
  private _colors: Float32Array;
  private _sizes: Float32Array;

  private _pool: ParticleData[];
  private _maxCount: number;
  private _activeCount: number = 0;

  public origin: THREE.Vector3;
  public velocityMin: THREE.Vector3;
  public velocityMax: THREE.Vector3;
  public baseColor: THREE.Color;
  public baseSize: number;
  public lifetime: number;
  public emitRate: number;
  public running: boolean = false;
  public kind: ParticleKind;

  private _emitAccum: number = 0;

  constructor(
    kind: ParticleKind,
    maxCount: number,
    origin: THREE.Vector3,
    color: number,
    lifetime: number,
    baseSize: number
  ) {
    this.kind = kind;
    this._maxCount = maxCount;
    this.origin = origin.clone();
    this.baseColor = new THREE.Color(color);
    this.lifetime = lifetime;
    this.baseSize = baseSize;
    this.emitRate = 20;
    this.velocityMin = new THREE.Vector3(-0.5, 0.5, -0.5);
    this.velocityMax = new THREE.Vector3(0.5, 1.5, 0.5);

    this._geometry = new THREE.BufferGeometry();
    this._positions = new Float32Array(maxCount * 3);
    this._colors = new Float32Array(maxCount * 3);
    this._sizes = new Float32Array(maxCount);

    for (let i = 0; i < maxCount; i++) {
      this._positions[i * 3] = 0;
      this._positions[i * 3 + 1] = -10000;
      this._positions[i * 3 + 2] = 0;
      this._colors[i * 3] = 0;
      this._colors[i * 3 + 1] = 0;
      this._colors[i * 3 + 2] = 0;
      this._sizes[i] = 0;
    }

    this._geometry.setAttribute('position', new THREE.BufferAttribute(this._positions, 3));
    this._geometry.setAttribute('color', new THREE.BufferAttribute(this._colors, 3));
    this._geometry.setAttribute('size', new THREE.BufferAttribute(this._sizes, 1));

    this._material = new THREE.PointsMaterial({
      size: baseSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: kind === 'metal_flow' || kind === 'splash' ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(this._geometry, this._material);
    this.points.frustumCulled = false;

    this._pool = [];
    for (let i = 0; i < maxCount; i++) {
      this._pool.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: lifetime,
        size: baseSize,
        color: new THREE.Color(),
        active: false
      });
    }
  }

  public emitBurst(count: number): void {
    for (let i = 0; i < count; i++) {
      this._spawnOne();
    }
  }

  private _spawnOne(): void {
    if (this._activeCount >= this._maxCount) return;
    const p = this._pool.find(x => !x.active);
    if (!p) return;

    p.active = true;
    p.position.copy(this.origin);
    p.position.x += (Math.random() - 0.5) * 8;
    p.position.y += Math.random() * 4;
    p.position.z += (Math.random() - 0.5) * 8;

    const lerpT = Math.random();
    p.velocity.set(
      THREE.MathUtils.lerp(this.velocityMin.x, this.velocityMax.x, Math.random()),
      THREE.MathUtils.lerp(this.velocityMin.y, this.velocityMax.y, lerpT),
      THREE.MathUtils.lerp(this.velocityMin.z, this.velocityMax.z, Math.random())
    );

    p.maxLife = this.lifetime * (0.8 + Math.random() * 0.4);
    p.life = p.maxLife;
    p.size = this.baseSize * (0.8 + Math.random() * 0.5);
    p.color.copy(this.baseColor);

    this._activeCount++;
  }

  public update(dt: number): void {
    if (this.running) {
      this._emitAccum += this.emitRate * dt;
      while (this._emitAccum >= 1) {
        this._spawnOne();
        this._emitAccum -= 1;
      }
    }

    const gravity = this.kind === 'steam' ? -0.2 : this.kind === 'flame' ? -0.05 : 6.0;
    const damping = this.kind === 'steam' ? 0.98 : this.kind === 'flame' ? 0.995 : 0.998;

    for (let i = 0; i < this._pool.length; i++) {
      const p = this._pool[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        this._activeCount--;
        this._positions[i * 3 + 1] = -10000;
        this._sizes[i] = 0;
        continue;
      }

      const t = 1 - p.life / p.maxLife;

      p.velocity.y -= gravity * dt;
      p.velocity.multiplyScalar(Math.pow(damping, dt * 60));
      p.position.addScaledVector(p.velocity, dt * 60);

      this._positions[i * 3] = p.position.x;
      this._positions[i * 3 + 1] = p.position.y;
      this._positions[i * 3 + 2] = p.position.z;

      let alpha = 1 - t;
      if (this.kind === 'flame') {
        alpha = Math.sin(Math.PI * (1 - t));
      } else if (this.kind === 'steam') {
        alpha = 1 - t;
      }
      this._sizes[i] = p.size * (this.kind === 'steam' ? (0.6 + t * 1.4) : (1 - t * 0.4));

      let r = p.color.r;
      let g = p.color.g;
      let b = p.color.b;

      if (this.kind === 'flame') {
        r = 1.0;
        g = THREE.MathUtils.lerp(0.9, 0.2, t);
        b = THREE.MathUtils.lerp(0.3, 0.0, t);
      } else if (this.kind === 'steam') {
        const c = THREE.MathUtils.lerp(0.9, 0.55, t);
        r = c; g = c; b = c;
      } else if (this.kind === 'metal_flow' || this.kind === 'splash') {
        r = 1.0;
        g = THREE.MathUtils.lerp(0.5, 0.27, t);
        b = 0;
      }

      this._colors[i * 3] = r * alpha;
      this._colors[i * 3 + 1] = g * alpha;
      this._colors[i * 3 + 2] = b * alpha;
    }

    (this._geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this._geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (this._geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
  }

  public dispose(): void {
    this._geometry.dispose();
    this._material.dispose();
  }
}

export class ParticleSystem {
  private _scene: THREE.Scene;
  private _emitters: Map<string, ParticleEmitter> = new Map();

  constructor(scene: THREE.Scene) {
    this._scene = scene;
  }

  public createEmitter(
    id: string,
    kind: ParticleKind,
    maxCount: number,
    origin: THREE.Vector3,
    color: number,
    lifetime: number,
    baseSize: number
  ): ParticleEmitter {
    const emitter = new ParticleEmitter(kind, maxCount, origin, color, lifetime, baseSize);
    this._scene.add(emitter.points);
    this._emitters.set(id, emitter);
    return emitter;
  }

  public getEmitter(id: string): ParticleEmitter | undefined {
    return this._emitters.get(id);
  }

  public removeEmitter(id: string): void {
    const e = this._emitters.get(id);
    if (e) {
      this._scene.remove(e.points);
      e.dispose();
      this._emitters.delete(id);
    }
  }

  public startEmitter(id: string): void {
    const e = this._emitters.get(id);
    if (e) e.running = true;
  }

  public stopEmitter(id: string): void {
    const e = this._emitters.get(id);
    if (e) e.running = false;
  }

  public update(dt: number): void {
    this._emitters.forEach(e => e.update(dt));
  }

  public disposeAll(): void {
    this._emitters.forEach(e => {
      this._scene.remove(e.points);
      e.dispose();
    });
    this._emitters.clear();
  }
}
