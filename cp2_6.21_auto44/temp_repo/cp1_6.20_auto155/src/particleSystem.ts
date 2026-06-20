import * as THREE from 'three';

export type ParticleType = 'smoke' | 'water' | 'fire';
export type ForceType = 'gravity' | 'vortex' | 'wind';

export interface ParticleParams {
  emissionRate: number;
  initialSpeed: number;
  lifetime: number;
  particleSize: number;
}

export interface ForceField {
  id: string;
  type: ForceType;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  strength: number;
  mesh: THREE.Object3D;
}

interface ParticleDefaults {
  emissionRate: number;
  initialSpeed: number;
  lifetime: number;
  particleSize: number;
}

const PARTICLE_DEFAULTS: Record<ParticleType, ParticleDefaults> = {
  smoke: { emissionRate: 20, initialSpeed: 0.8, lifetime: 3.5, particleSize: 0.35 },
  water: { emissionRate: 50, initialSpeed: 3.0, lifetime: 1.5, particleSize: 0.12 },
  fire: { emissionRate: 30, initialSpeed: 2.0, lifetime: 2.0, particleSize: 0.20 },
};

const MAX_PARTICLES = 8000;

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  lifetime: number;
  size: number;
  color: THREE.Color;
  active: boolean;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;

  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  private params: ParticleParams;
  private particleType: ParticleType = 'fire';

  private forceFields: ForceField[] = [];
  private nextForceId = 0;

  private emissionAccumulator = 0;
  private emitterPosition = new THREE.Vector3(0, 0, 0);

  private tweeningParams: ParticleParams | null = null;
  private tweenProgress = 0;
  private tweenDuration = 0.4;
  private tweenStartParams: ParticleParams | null = null;

  private typeTransitionProgress = 0;
  private typeTransitionDuration = 1.0;
  private oldType: ParticleType | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.params = { ...PARTICLE_DEFAULTS.fire };

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        age: 0,
        lifetime: 1,
        size: 1,
        color: new THREE.Color(),
        active: false,
      });
    }

    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));

    this.material = this.createShaderMaterial();
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  private createShaderMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uTexture: { value: this.createParticleTexture() },
      },
      vertexShader: `
        attribute float aSize;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
          vAlpha = clamp(aSize * 5.0, 0.0, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          vec3 finalColor = vColor * texColor.rgb;
          float alpha = texColor.a * vAlpha;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });
  }

  private createParticleTexture(): THREE.Texture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  getParams(): ParticleParams {
    return { ...this.params };
  }

  setParam(key: keyof ParticleParams, value: number): void {
    this.params[key] = value;
  }

  getParticleType(): ParticleType {
    return this.particleType;
  }

  setParticleType(type: ParticleType): void {
    if (this.particleType === type) return;
    this.oldType = this.particleType;
    this.particleType = type;
    this.typeTransitionProgress = 0;
    const defaults = PARTICLE_DEFAULTS[type];
    this.tweenStartParams = { ...this.params };
    this.tweeningParams = { ...defaults };
    this.tweenProgress = 0;
  }

  getForceFields(): ForceField[] {
    return this.forceFields;
  }

  addForceField(type: ForceType, position: THREE.Vector3): ForceField | null {
    if (this.forceFields.length >= 3) return null;
    const id = `force_${this.nextForceId++}`;
    const pos = position.clone();
    const targetPos = position.clone();
    const mesh = this.createForceFieldMesh(type);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    const field: ForceField = {
      id,
      type,
      position: pos,
      targetPosition: targetPos,
      strength: type === 'gravity' ? 8 : type === 'vortex' ? 6 : 5,
      mesh,
    };
    this.forceFields.push(field);
    return field;
  }

  removeForceField(id: string): void {
    const idx = this.forceFields.findIndex(f => f.id === id);
    if (idx >= 0) {
      const field = this.forceFields[idx];
      this.scene.remove(field.mesh);
      this.disposeForceMesh(field.mesh);
      this.forceFields.splice(idx, 1);
    }
  }

  getForceFieldByMesh(mesh: THREE.Object3D): ForceField | null {
    return this.forceFields.find(f => f.mesh === mesh || f.mesh.children.includes(mesh as THREE.Mesh)) || null;
  }

  setForceFieldTargetPosition(id: string, target: THREE.Vector3): void {
    const field = this.forceFields.find(f => f.id === id);
    if (field) {
      field.targetPosition.copy(target);
    }
  }

  private disposeForceMesh(obj: THREE.Object3D): void {
    obj.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }

  private createForceFieldMesh(type: ForceType): THREE.Object3D {
    const group = new THREE.Group();

    if (type === 'gravity') {
      const color = new THREE.Color('#e74c3c');
      const geo = new THREE.SphereGeometry(0.3, 24, 24);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
      });
      const sphere = new THREE.Mesh(geo, mat);
      group.add(sphere);

      const wireGeo = new THREE.SphereGeometry(0.45, 16, 16);
      const wireMat = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      group.add(wire);
    } else if (type === 'vortex') {
      const color = new THREE.Color('#3498db');
      const curve = new THREE.CatmullRomCurve3(this.createHelixPoints(0.4, 1.0, 3));
      const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.05, 12, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      group.add(tube);

      const ringGeo = new THREE.TorusGeometry(0.25, 0.03, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      group.add(ring);
    } else {
      const color = new THREE.Color('#2ecc71');
      const arrowGroup = new THREE.Group();
      const shaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 12);
      const shaftMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7,
      });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.y = 0.15;
      arrowGroup.add(shaft);

      const coneGeo = new THREE.ConeGeometry(0.15, 0.35, 16);
      const coneMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = 0.65;
      arrowGroup.add(cone);

      arrowGroup.rotation.x = Math.PI / 2;
      group.add(arrowGroup);

      const planeGeo = new THREE.CircleGeometry(0.2, 24);
      const planeMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.05;
      group.add(plane);
    }

    group.userData.isForceField = true;
    return group;
  }

  private createHelixPoints(radius: number, height: number, turns: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const segments = 200;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * turns;
      const r = radius * (1 - t * 0.3);
      points.push(new THREE.Vector3(
        Math.cos(angle) * r,
        t * height - height / 2,
        Math.sin(angle) * r
      ));
    }
    return points;
  }

  private getColorForType(type: ParticleType, lifeRatio: number, outColor: THREE.Color): void {
    if (type === 'smoke') {
      const t = lifeRatio;
      const r = 0.45 + (0.9 - 0.45) * (1 - t);
      const g = 0.45 + (0.9 - 0.45) * (1 - t);
      const b = 0.5 + (0.95 - 0.5) * (1 - t);
      outColor.setRGB(r, g, b);
    } else if (type === 'water') {
      const t = lifeRatio;
      const r = 0.15 + 0.15 * (1 - t);
      const g = 0.55 + 0.3 * (1 - t);
      const b = 1.0;
      outColor.setRGB(r, g, b);
    } else {
      const t = lifeRatio;
      if (t < 0.33) {
        const s = t / 0.33;
        outColor.setRGB(1, 0.9 + 0.1 * (1 - s), 0.2 * s);
      } else if (t < 0.66) {
        const s = (t - 0.33) / 0.33;
        outColor.setRGB(1, 0.5 + 0.4 * (1 - s), 0.05);
      } else {
        const s = (t - 0.66) / 0.34;
        outColor.setRGB(0.8 + 0.2 * (1 - s), 0.15 + 0.35 * (1 - s), 0.02);
      }
    }
  }

  update(deltaTime: number): void {
    if (this.tweeningParams && this.tweenStartParams) {
      this.tweenProgress += deltaTime / this.tweenDuration;
      const t = Math.min(this.tweenProgress, 1.0);
      const eased = this.easeInOutCubic(t);
      for (const key of Object.keys(this.params) as (keyof ParticleParams)[]) {
        this.params[key] = this.tweenStartParams[key] + (this.tweeningParams[key] - this.tweenStartParams[key]) * eased;
      }
      if (t >= 1.0) {
        this.tweeningParams = null;
        this.tweenStartParams = null;
      }
    }

    if (this.oldType) {
      this.typeTransitionProgress += deltaTime / this.typeTransitionDuration;
      if (this.typeTransitionProgress >= 1.0) {
        this.oldType = null;
        this.typeTransitionProgress = 1.0;
      }
    }

    for (const field of this.forceFields) {
      const dx = field.targetPosition.x - field.position.x;
      const dy = field.targetPosition.y - field.position.y;
      const dz = field.targetPosition.z - field.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 0.001) {
        const speed = Math.min(dist * 8 * deltaTime, dist);
        field.position.x += dx * speed / dist;
        field.position.y += dy * speed / dist;
        field.position.z += dz * speed / dist;
        field.mesh.position.copy(field.position);
      }

      if (field.type === 'vortex') {
        field.mesh.rotation.y += deltaTime * 2.5;
      }
    }

    this.emissionAccumulator += this.params.emissionRate * deltaTime;
    let emitted = 0;
    while (this.emissionAccumulator >= 1.0 && emitted < 50) {
      this.emitParticle();
      this.emissionAccumulator -= 1.0;
      emitted++;
    }

    const color1 = new THREE.Color();
    const color2 = new THREE.Color();
    const mixT = this.oldType ? Math.min(this.typeTransitionProgress / this.typeTransitionDuration, 1.0) : 1.0;

    let activeCount = 0;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) {
        this.sizes[i] = 0;
        continue;
      }

      p.age += deltaTime;
      if (p.age >= p.lifetime) {
        p.active = false;
        this.sizes[i] = 0;
        continue;
      }

      activeCount++;
      const lifeRatio = p.age / p.lifetime;

      for (const field of this.forceFields) {
        const toParticleX = p.position.x - field.position.x;
        const toParticleY = p.position.y - field.position.y;
        const toParticleZ = p.position.z - field.position.z;
        const distSq = toParticleX * toParticleX + toParticleY * toParticleY + toParticleZ * toParticleZ;
        const dist = Math.sqrt(distSq) + 0.1;

        if (field.type === 'gravity') {
          const force = -field.strength / (distSq + 0.5);
          p.velocity.x += (toParticleX / dist) * force * deltaTime;
          p.velocity.y += (toParticleY / dist) * force * deltaTime;
          p.velocity.z += (toParticleZ / dist) * force * deltaTime;
        } else if (field.type === 'vortex') {
          const radialX = toParticleX / dist;
          const radialZ = toParticleZ / dist;
          const tangentX = -radialZ;
          const tangentZ = radialX;
          const rotForce = field.strength / (dist + 0.5);
          p.velocity.x += tangentX * rotForce * deltaTime * 2;
          p.velocity.z += tangentZ * rotForce * deltaTime * 2;
          p.velocity.y += (-toParticleY / dist) * field.strength * 0.3 * deltaTime;
          const inward = field.strength * 0.4 / (dist + 0.5);
          p.velocity.x -= radialX * inward * deltaTime;
          p.velocity.z -= radialZ * inward * deltaTime;
        } else {
          const windX = 1.0;
          const windY = 0.15;
          const windZ = 0.0;
          const decay = 1.0 / (dist * 0.5 + 1.0);
          p.velocity.x += windX * field.strength * decay * deltaTime;
          p.velocity.y += windY * field.strength * decay * deltaTime;
          p.velocity.z += windZ * field.strength * decay * deltaTime;
        }
      }

      if (this.particleType === 'smoke') {
        p.velocity.y += 1.5 * deltaTime;
        p.velocity.multiplyScalar(Math.pow(0.3, deltaTime));
      } else if (this.particleType === 'water') {
        p.velocity.y -= 4.0 * deltaTime;
        p.velocity.multiplyScalar(Math.pow(0.7, deltaTime));
      } else {
        p.velocity.y += 2.5 * deltaTime;
        p.velocity.multiplyScalar(Math.pow(0.5, deltaTime));
      }

      p.position.x += p.velocity.x * deltaTime;
      p.position.y += p.velocity.y * deltaTime;
      p.position.z += p.velocity.z * deltaTime;

      this.positions[i * 3] = p.position.x;
      this.positions[i * 3 + 1] = p.position.y;
      this.positions[i * 3 + 2] = p.position.z;

      this.getColorForType(this.particleType, lifeRatio, color1);
      if (this.oldType) {
        this.getColorForType(this.oldType, lifeRatio, color2);
        color2.lerp(color1, mixT);
        this.colors[i * 3] = color2.r;
        this.colors[i * 3 + 1] = color2.g;
        this.colors[i * 3 + 2] = color2.b;
      } else {
        this.colors[i * 3] = color1.r;
        this.colors[i * 3 + 1] = color1.g;
        this.colors[i * 3 + 2] = color1.b;
      }

      let sizeMultiplier = 1.0;
      if (this.particleType === 'smoke') {
        sizeMultiplier = 0.4 + lifeRatio * 1.0;
      } else if (this.particleType === 'water') {
        sizeMultiplier = 1.0 - lifeRatio * 0.3;
      } else {
        sizeMultiplier = 1.0 - lifeRatio * 0.5;
      }
      const alphaMultiplier = this.particleType === 'smoke'
        ? Math.sin(lifeRatio * Math.PI) * 0.7
        : Math.sin(lifeRatio * Math.PI);

      this.sizes[i] = p.size * sizeMultiplier * alphaMultiplier;
    }

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;

    this._activeParticleCount = activeCount;
  }

  private _activeParticleCount = 0;

  getActiveParticleCount(): number {
    return this._activeParticleCount;
  }

  private emitParticle(): void {
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) {
        const p = this.particles[i];
        p.active = true;
        p.age = 0;
        p.lifetime = this.params.lifetime * (0.8 + Math.random() * 0.4);
        p.size = this.params.particleSize * (0.7 + Math.random() * 0.6);

        p.position.copy(this.emitterPosition);

        let dirX: number, dirY: number, dirZ: number;
        if (this.particleType === 'smoke') {
          dirX = (Math.random() - 0.5) * 0.3;
          dirY = 0.7 + Math.random() * 0.5;
          dirZ = (Math.random() - 0.5) * 0.3;
        } else if (this.particleType === 'water') {
          const angle = Math.random() * Math.PI * 2;
          const cone = 0.4 + Math.random() * 0.3;
          dirX = Math.cos(angle) * cone;
          dirY = 0.8 + Math.random() * 0.5;
          dirZ = Math.sin(angle) * cone;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const cone = 0.2 + Math.random() * 0.25;
          dirX = Math.cos(angle) * cone;
          dirY = 0.85 + Math.random() * 0.4;
          dirZ = Math.sin(angle) * cone;
        }
        const speed = this.params.initialSpeed * (0.7 + Math.random() * 0.6);
        const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
        dirX /= len;
        dirY /= len;
        dirZ /= len;
        p.velocity.set(dirX * speed, dirY * speed, dirZ * speed);

        return;
      }
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  serialize(): any {
    return {
      version: 1,
      particleType: this.particleType,
      params: { ...this.params },
      forceFields: this.forceFields.map(f => ({
        id: f.id,
        type: f.type,
        position: { x: f.position.x, y: f.position.y, z: f.position.z },
        strength: f.strength,
      })),
    };
  }

  deserialize(data: any): ParticleType | null {
    if (!data || data.version !== 1) return null;

    const type = data.particleType as ParticleType;
    if (type && ['smoke', 'water', 'fire'].includes(type)) {
      this.particleType = type;
      this.oldType = null;
    }

    if (data.params) {
      if (typeof data.params.emissionRate === 'number') this.params.emissionRate = data.params.emissionRate;
      if (typeof data.params.initialSpeed === 'number') this.params.initialSpeed = data.params.initialSpeed;
      if (typeof data.params.lifetime === 'number') this.params.lifetime = data.params.lifetime;
      if (typeof data.params.particleSize === 'number') this.params.particleSize = data.params.particleSize;
    }

    for (const f of this.forceFields) {
      this.scene.remove(f.mesh);
      this.disposeForceMesh(f.mesh);
    }
    this.forceFields = [];

    if (Array.isArray(data.forceFields)) {
      for (const fData of data.forceFields) {
        const type = fData.type as ForceType;
        if (!['gravity', 'vortex', 'wind'].includes(type)) continue;
        if (this.forceFields.length >= 3) break;
        const pos = new THREE.Vector3(
          fData.position?.x ?? 0,
          fData.position?.y ?? 0,
          fData.position?.z ?? 0
        );
        const id = fData.id || `force_${this.nextForceId++}`;
        const mesh = this.createForceFieldMesh(type);
        mesh.position.copy(pos);
        this.scene.add(mesh);
        this.forceFields.push({
          id,
          type,
          position: pos.clone(),
          targetPosition: pos.clone(),
          strength: fData.strength ?? (type === 'gravity' ? 8 : type === 'vortex' ? 6 : 5),
          mesh,
        });
        if (fData.id && /force_(\d+)/.test(fData.id)) {
          const n = parseInt(RegExp.$1);
          if (n >= this.nextForceId) this.nextForceId = n + 1;
        }
      }
    }

    return type;
  }

  getEmitterPosition(): THREE.Vector3 {
    return this.emitterPosition.clone();
  }

  setEmitterPosition(pos: THREE.Vector3): void {
    this.emitterPosition.copy(pos);
  }

  resize(): void {
    if (this.material.uniforms.uPixelRatio) {
      this.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    }
  }

  dispose(): void {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
    for (const f of this.forceFields) {
      this.scene.remove(f.mesh);
      this.disposeForceMesh(f.mesh);
    }
    this.forceFields = [];
  }
}
