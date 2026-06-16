import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private points: THREE.Points;
  private maxParticles: number = 80;
  private activeCount: number = 0;

  constructor() {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);
    const sizes = new Float32Array(this.maxParticles);
    const alphas = new Float32Array(this.maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float alpha = (1.0 - smoothstep(0.0, 0.5, d)) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  get mesh(): THREE.Points {
    return this.points;
  }

  burst(position: THREE.Vector3, color: THREE.Color, count: number = 30): void {
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      const speed = 0.01 + Math.random() * 0.02;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );

      this.particles.push({
        position: position.clone(),
        velocity,
        life: 1.0,
        maxLife: 0.8 + Math.random() * 0.4,
        size: 2 + Math.random() * 3,
        color: color.clone(),
      });
    }
  }

  update(deltaTime: number): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;
    const alphas = this.geometry.attributes.alpha.array as Float32Array;
    const sizes = this.geometry.attributes.size.array as Float32Array;

    this.particles = this.particles.filter((p) => p.life > 0);

    this.particles.forEach((particle, index) => {
      particle.life -= deltaTime / particle.maxLife;

      particle.position.add(particle.velocity);
      particle.velocity.multiplyScalar(0.96);

      positions[index * 3] = particle.position.x;
      positions[index * 3 + 1] = particle.position.y;
      positions[index * 3 + 2] = particle.position.z;

      colors[index * 3] = particle.color.r;
      colors[index * 3 + 1] = particle.color.g;
      colors[index * 3 + 2] = particle.color.b;

      alphas[index] = Math.max(0, particle.life);
      sizes[index] = particle.size;
    });

    this.activeCount = this.particles.length;

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.setDrawRange(0, this.activeCount);
  }
}

export class FlyingStar {
  private mesh: THREE.Mesh;
  private glow: THREE.Mesh;
  private path: THREE.CatmullRomCurve3 | null = null;
  private currentT: number = 0;
  private speed: number = 0.005;
  private active: boolean = false;
  private onConstellationPass: ((index: number) => void) | null = null;
  private lastPassedIndex: number = -1;
  private controlPointCount: number = 0;

  constructor() {
    const geometry = new THREE.SphereGeometry(0.08, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    this.mesh = new THREE.Mesh(geometry, material);

    const glowGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glow);

    this.mesh.visible = false;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  setPath(points: THREE.Vector3[]): void {
    this.path = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    this.controlPointCount = points.length;
    this.currentT = 0;
    this.lastPassedIndex = -1;
    if (points.length > 0) {
      const pos = this.path.getPoint(0);
      this.mesh.position.copy(pos);
    }
  }

  start(): void {
    if (!this.path) return;
    this.active = true;
    this.mesh.visible = true;
    this.currentT = 0;
    this.lastPassedIndex = -1;
  }

  stop(): void {
    this.active = false;
    this.mesh.visible = false;
  }

  isActive(): boolean {
    return this.active;
  }

  setOnConstellationPass(callback: (index: number) => void): void {
    this.onConstellationPass = callback;
  }

  update(deltaTime: number): void {
    if (!this.active || !this.path) return;

    this.currentT += this.speed * deltaTime * 60;

    if (this.currentT >= 1) {
      this.currentT = 1;
      this.active = false;
      this.mesh.visible = false;
      return;
    }

    const pos = this.path.getPoint(this.currentT);
    this.mesh.position.copy(pos);

    const segCount = this.controlPointCount - 1;
    if (segCount > 0) {
      const rawIndex = Math.floor(this.currentT * segCount);
      const index = Math.min(rawIndex, segCount - 1);
      if (index > this.lastPassedIndex && this.onConstellationPass) {
        this.lastPassedIndex = index;
        this.onConstellationPass(index);
      }
    }
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
}
