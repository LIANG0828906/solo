import * as THREE from 'three';
import { AudioParams, calculateGradient, calculateWaveHeight } from '../control/AudioController';
import { velocityToColor, velocityToSize } from '../utils/ColorUtils';
import { Terrain } from './Terrain';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  speed: number;
  active: boolean;
  birthTime: number;
}

export interface ParticleStats {
  activeCount: number;
  averageSpeed: number;
  maxSpeed: number;
}

export class ParticleSystem {
  public points: THREE.Points;
  public stats: ParticleStats;
  
  private particles: Particle[];
  private particleCount: number;
  private geometry: THREE.BufferGeometry;
  private params: AudioParams;
  private terrain: Terrain;
  private time: number;
  private spawnPoint: THREE.Vector3;
  private statUpdateTimer: number = 0;

  constructor(terrain: Terrain, count: number = 2000) {
    this.terrain = terrain;
    this.particleCount = count;
    this.particles = [];
    this.time = 0;
    this.params = { frequency: 60, amplitude: 3, phase: 0 };
    this.stats = { activeCount: 0, averageSpeed: 0, maxSpeed: 0 };
    
    const highest = terrain.findHighestPoint();
    this.spawnPoint = new THREE.Vector3(highest.x, highest.height + 5, highest.z);
    
    this.geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    const alphas = new Float32Array(this.particleCount);
    
    for (let i = 0; i < this.particleCount; i++) {
      const shouldActivate = i < this.particleCount * 0.4;
      const p = this.createParticle(true);
      if (shouldActivate) {
        p.active = true;
        p.life = Math.random() * p.maxLife;
      }
      this.particles.push(p);
      if (shouldActivate) {
        positions[i * 3] = p.position.x;
        positions[i * 3 + 1] = p.position.y;
        positions[i * 3 + 2] = p.position.z;
      } else {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -1000;
        positions[i * 3 + 2] = 0;
      }
      colors[i * 3] = 0.29;
      colors[i * 3 + 1] = 0.56;
      colors[i * 3 + 2] = 0.85;
      sizes[i] = 3;
      alphas[i] = shouldActivate ? Math.min(p.life * 4, 1) : 0;
    }
    this.statUpdateTimer = 0.1;
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        pixelRatio: { value: window.devicePixelRatio || 1 }
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float pixelRatio;
        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float glow = smoothstep(0.5, 0.0, dist);
          gl_FragColor = vec4(vColor, vAlpha * glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });
    
    this.points = new THREE.Points(this.geometry, material);
    this.points.frustumCulled = false;
  }

  private createParticle(initial: boolean = false): Particle {
    const maxLife = 3 + Math.random() * 5;
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetZ = (Math.random() - 0.5) * 40;
    const baseY = initial ? this.terrain.getBaseHeight(
      this.spawnPoint.x + offsetX,
      this.spawnPoint.z + offsetZ
    ) : this.spawnPoint.y;
    
    return {
      position: new THREE.Vector3(
        this.spawnPoint.x + offsetX,
        baseY + 2 + Math.random() * 3,
        this.spawnPoint.z + offsetZ
      ),
      velocity: new THREE.Vector3(0, 0, 0),
      life: initial ? Math.random() * maxLife : 0,
      maxLife,
      speed: 0,
      active: !initial,
      birthTime: initial ? -Math.random() * maxLife : this.time
    };
  }

  private respawnParticle(p: Particle): void {
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetZ = (Math.random() - 0.5) * 40;
    const baseY = this.terrain.getBaseHeight(
      this.spawnPoint.x + offsetX,
      this.spawnPoint.z + offsetZ
    );
    
    p.position.set(
      this.spawnPoint.x + offsetX,
      baseY + 2 + Math.random() * 3,
      this.spawnPoint.z + offsetZ
    );
    p.velocity.set(0, 0, 0);
    p.life = 0;
    p.maxLife = 3 + Math.random() * 5;
    p.speed = 0;
    p.active = true;
    p.birthTime = this.time;
  }

  public updateParams(params: AudioParams): void {
    this.params = { ...params };
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    
    const positions = this.geometry.attributes.position as THREE.BufferAttribute;
    const colors = this.geometry.attributes.color as THREE.BufferAttribute;
    const sizes = this.geometry.attributes.size as THREE.BufferAttribute;
    const alphas = this.geometry.attributes.alpha as THREE.BufferAttribute;
    
    let activeCount = 0;
    let totalSpeed = 0;
    let maxSpeed = 0;
    
    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      
      if (!p.active) {
        if (Math.random() < deltaTime * 100) {
          this.respawnParticle(p);
        }
        positions.setY(i, -1000);
        alphas.setX(i, 0);
        continue;
      }
      
      p.life += deltaTime;
      
      if (p.life >= p.maxLife) {
        p.active = false;
        positions.setY(i, -1000);
        alphas.setX(i, 0);
        continue;
      }
      
      const gradient = calculateGradient(
        p.position.x,
        p.position.z,
        this.time,
        this.params,
        (x, z) => this.terrain.getBaseHeight(x, z)
      );
      
      const gravity = -15;
      const friction = 0.92;
      const slopeForce = 8;
      
      p.velocity.x -= gradient.dx * slopeForce * deltaTime;
      p.velocity.z -= gradient.dz * slopeForce * deltaTime;
      p.velocity.y += gravity * deltaTime;
      
      const waveInfluence = calculateWaveHeight(
        p.position.x * 0.1,
        p.position.z * 0.1,
        this.time,
        this.params
      ) * 0.5;
      p.velocity.x += Math.sin(this.time * 2 + i * 0.1) * waveInfluence * deltaTime;
      p.velocity.z += Math.cos(this.time * 2 + i * 0.1) * waveInfluence * deltaTime;
      
      p.position.x += p.velocity.x * deltaTime;
      p.position.y += p.velocity.y * deltaTime;
      p.position.z += p.velocity.z * deltaTime;
      
      const surfaceY = gradient.height + 0.3;
      if (p.position.y < surfaceY) {
        p.position.y = surfaceY;
        p.velocity.y = Math.abs(p.velocity.y) * 0.2;
        p.velocity.x *= friction;
        p.velocity.z *= friction;
      }
      
      const halfSize = 290;
      if (Math.abs(p.position.x) > halfSize || Math.abs(p.position.z) > halfSize) {
        this.respawnParticle(p);
        continue;
      }
      
      p.speed = Math.sqrt(
        p.velocity.x * p.velocity.x +
        p.velocity.y * p.velocity.y +
        p.velocity.z * p.velocity.z
      );
      
      if (p.speed < 0.3 && p.position.y < surfaceY + 1) {
        this.terrain.addDeposit(p.position.x, p.position.z);
      }
      
      positions.setXYZ(i, p.position.x, p.position.y, p.position.z);
      
      const color = velocityToColor(p.speed, 15);
      colors.setXYZ(i, color.r, color.g, color.b);
      
      const size = velocityToSize(p.speed, 15, 3, 6);
      sizes.setX(i, size);
      
      let alpha: number;
      const fadeIn = Math.min(p.life * 4, 1);
      const fadeOut = 1 - Math.pow(Math.max(0, (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3)), 2);
      alpha = fadeIn * fadeOut;
      alphas.setX(i, alpha);
      
      activeCount++;
      totalSpeed += p.speed;
      if (p.speed > maxSpeed) maxSpeed = p.speed;
    }
    
    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
    alphas.needsUpdate = true;
    
    this.statUpdateTimer += deltaTime;
    if (this.statUpdateTimer >= 0.1) {
      this.statUpdateTimer = 0;
      this.stats = {
        activeCount,
        averageSpeed: activeCount > 0 ? totalSpeed / activeCount : 0,
        maxSpeed
      };
    }
  }

  public getStats(): ParticleStats {
    return { ...this.stats };
  }

  public dispose(): void {
    this.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
