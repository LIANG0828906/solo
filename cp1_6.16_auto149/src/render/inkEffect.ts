import * as THREE from 'three';

export interface InkStrokeParams {
  radius: number;
  opacity: number;
  position: THREE.Vector3;
  speed: number;
}

const rippleVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const rippleFragmentShader = `
  uniform float uTime;
  uniform float uMaxRadius;
  uniform float uDuration;
  varying vec2 vUv;
  
  void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center);
    float currentRadius = (uTime / uDuration) * uMaxRadius;
    float ringWidth = 0.03;
    float ring = smoothstep(currentRadius - ringWidth, currentRadius, dist) * 
                 (1.0 - smoothstep(currentRadius, currentRadius + ringWidth, dist));
    float fade = 1.0 - (uTime / uDuration);
    float alpha = ring * fade * 0.6;
    gl_FragColor = vec4(0.2, 0.2, 0.25, alpha);
  }
`;

export function createRippleMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMaxRadius: { value: 50 },
      uDuration: { value: 1.0 }
    },
    vertexShader: rippleVertexShader,
    fragmentShader: rippleFragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

export function createRippleMesh(
  position: THREE.Vector3,
  size: number = 50
): {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  startTime: number;
  duration: number;
} {
  const material = createRippleMaterial();
  const geometry = new THREE.PlaneGeometry(size, size, 1, 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(position);
  mesh.position.y = 0.01;
  mesh.renderOrder = 5;
  return {
    mesh,
    material,
    startTime: performance.now(),
    duration: 1000
  };
}

export class InkParticleSystem {
  private scene: THREE.Scene;
  private particles: THREE.Points | null = null;
  private particleData: Array<{
    position: THREE.Vector3; velocity: THREE.Vector3; birthTime: number; life: number }> = [];
  private maxParticles: number = 200;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.init();
  }

  private init(): void {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 4);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));

    this.material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.particles.renderOrder = 10;
    this.scene.add(this.particles);
  }

  emit(position: THREE.Vector3, count: number = 8): void {
    const now = performance.now();
    for (let i = 0; i < count; i++) {
      if (this.particleData.length >= this.maxParticles) {
        this.particleData.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 0.5,
        Math.sin(angle) * speed
      );
      this.particleData.push({
        position: position.clone(),
        velocity,
        birthTime: now,
        life: 1200
      });
    }
  }

  update(): void {
    if (!this.geometry || !this.particles) return;
    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;
    const now = performance.now();

    this.particleData = this.particleData.filter(p => now - p.birthTime < p.life);

    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particleData.length) {
        const p = this.particleData[i];
        const age = (now - p.birthTime) / p.life;
        p.velocity.y -= 0.02;
        p.position.add(p.velocity.clone().multiplyScalar(0.1));
        positions[i * 3] = p.position.x;
        positions[i * 3 + 1] = Math.max(0, p.position.y);
        positions[i * 3 + 2] = p.position.z;
        const alpha = Math.max(0, 1 - age);
        colors[i * 4] = 0;
        colors[i * 4 + 1] = 0;
        colors[i * 4 + 2] = 0;
        colors[i * 4 + 3] = alpha;
      } else {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -1000;
        positions[i * 3 + 2] = 0;
        colors[i * 4 + 3] = 0;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  dispose(): void {
    this.geometry?.dispose();
    this.material?.dispose();
    if (this.particles) {
      this.scene.remove(this.particles);
    }
  }
}

export function createInkStrokeTexture(
  radius: number,
  opacity: number,
  speed: number
): THREE.CanvasTexture {
  const size = Math.max(64, Math.ceil(radius * 4));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const center = size / 2;
  const baseRadius = (radius / 2) * (size / 100);
  const featherRadius = baseRadius * (0.3 + Math.min(speed / 30, 1) * 0.5);
  const gradient = ctx.createRadialGradient(
    center, center, 0,
    center, center, baseRadius + featherRadius
  );

  if (speed < 5) {
    gradient.addColorStop(0, `rgba(0,0,0,${opacity * 0.95})`);
    gradient.addColorStop(0.6, `rgba(0,0,0,${opacity * 0.7})`);
    gradient.addColorStop(0.85, `rgba(0,0,0,${opacity * 0.3})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
  } else if (speed < 15) {
    gradient.addColorStop(0, `rgba(0,0,0,${opacity * 0.85})`);
    gradient.addColorStop(0.4, `rgba(0,0,0,${opacity * 0.55})`);
    gradient.addColorStop(0.75, `rgba(0,0,0,${opacity * 0.2})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
  } else {
    const gapFactor = 0.15 + Math.random() * 0.25;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * baseRadius * 0.8;
      const x = center + Math.cos(a) * r;
      const y = center + Math.sin(a) * r;
      ctx.fillStyle = `rgba(0,0,0,${opacity * gapFactor})`;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    gradient.addColorStop(0, `rgba(0,0,0,${opacity * 0.7})`);
    gradient.addColorStop(0.35, `rgba(0,0,0,${opacity * 0.4})`);
    gradient.addColorStop(0.7, `rgba(0,0,0,${opacity * 0.12})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
  }

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center, center, baseRadius + featherRadius, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createInkMarkSprite(params: InkStrokeParams): THREE.Sprite {
  const texture = createInkStrokeTexture(params.radius, params.opacity, params.speed);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });
  const sprite = new THREE.Sprite(material);
  const scale = Math.max(2, params.radius * 0.25);
  sprite.scale.set(scale, scale, 1);
  sprite.position.copy(params.position);
  sprite.renderOrder = 3;
  return sprite;
}
