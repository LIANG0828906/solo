import * as THREE from 'three';

export interface ParticleParams {
  vortexStrength: number;
  particleSpeed: number;
  particleSize: number;
  windForce: number;
  backgroundColor: string;
}

interface ParticleData {
  baseRadius: Float32Array;
  baseAngle: Float32Array;
  baseHeight: Float32Array;
  currentAngle: Float32Array;
  currentHeight: Float32Array;
  colors: Float32Array;
  shockwaveOffset: Float32Array;
  shockwavePhase: Float32Array;
  shockwaveDir: Float32Array;
}

interface BurstRing {
  mesh: THREE.Mesh;
  phase: number;
  duration: number;
  maxRadius: number;
}

const CYLINDER_RADIUS = 15;
const CYLINDER_HEIGHT = 8;
const PARTICLE_COUNT = 8000;
const BURST_PARTICLE_COUNT = 300;
const BURST_RADIUS = 5;
const BURST_DURATION = 0.6;
const RING_DURATION = 1.2;

const COLOR_BOTTOM = new THREE.Color('#4FC3F7');
const COLOR_MIDDLE = new THREE.Color('#E57373');
const COLOR_TOP = new THREE.Color('#FFD54F');

const vertexShader = `
  attribute float size;
  attribute vec3 customColor;
  varying vec3 vColor;
  
  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.3, 0.5, d);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export class ParticleStorm {
  private scene: THREE.Scene;
  private particleCount: number;
  private particles!: THREE.Points;
  private particleData!: ParticleData;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.ShaderMaterial;
  private burstRings: BurstRing[] = [];
  private ringGeometry: THREE.RingGeometry;

  constructor(scene: THREE.Scene, count: number = PARTICLE_COUNT) {
    this.scene = scene;
    this.particleCount = count;
    this.ringGeometry = new THREE.RingGeometry(0.95, 1.0, 64);
    this.initParticles();
  }

  private initParticles(): void {
    this.geometry = new THREE.BufferGeometry();
    this.particleData = {
      baseRadius: new Float32Array(this.particleCount),
      baseAngle: new Float32Array(this.particleCount),
      baseHeight: new Float32Array(this.particleCount),
      currentAngle: new Float32Array(this.particleCount),
      currentHeight: new Float32Array(this.particleCount),
      colors: new Float32Array(this.particleCount * 3),
      shockwaveOffset: new Float32Array(this.particleCount * 3),
      shockwavePhase: new Float32Array(this.particleCount).fill(-1),
      shockwaveDir: new Float32Array(this.particleCount * 3),
    };

    const positions = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    const customColors = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * CYLINDER_RADIUS;
      const height = Math.random() * CYLINDER_HEIGHT - CYLINDER_HEIGHT / 2;

      this.particleData.baseAngle[i] = angle;
      this.particleData.baseRadius[i] = radius;
      this.particleData.baseHeight[i] = height;
      this.particleData.currentAngle[i] = angle;
      this.particleData.currentHeight[i] = height;

      const color = this.getColorByHeight(height);
      this.particleData.colors[i * 3] = color.r;
      this.particleData.colors[i * 3 + 1] = color.g;
      this.particleData.colors[i * 3 + 2] = color.b;

      positions[i * 3] = radius * Math.cos(angle);
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = radius * Math.sin(angle);

      sizes[i] = 0.3;
      customColors[i * 3] = color.r;
      customColors[i * 3 + 1] = color.g;
      customColors[i * 3 + 2] = color.b;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('customColor', new THREE.BufferAttribute(customColors, 3));

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
  }

  private getColorByHeight(height: number): THREE.Color {
    const normalizedHeight = (height + CYLINDER_HEIGHT / 2) / CYLINDER_HEIGHT;
    
    if (normalizedHeight < 0.375) {
      const t = normalizedHeight / 0.375;
      return COLOR_BOTTOM.clone().lerp(COLOR_MIDDLE, t);
    } else if (normalizedHeight < 0.75) {
      const t = (normalizedHeight - 0.375) / 0.375;
      return COLOR_MIDDLE.clone().lerp(COLOR_TOP, t);
    } else {
      return COLOR_TOP.clone();
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  public update(deltaTime: number, params: ParticleParams): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    const sizes = this.geometry.attributes.size.array as Float32Array;
    const customColors = this.geometry.attributes.customColor.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      this.particleData.currentAngle[i] += params.vortexStrength * params.particleSpeed * deltaTime;
      this.particleData.currentHeight[i] += params.particleSpeed * deltaTime * 0.5;

      if (this.particleData.currentHeight[i] > CYLINDER_HEIGHT / 2) {
        this.particleData.currentHeight[i] = -CYLINDER_HEIGHT / 2;
      }

      const radius = this.particleData.baseRadius[i];
      const angle = this.particleData.currentAngle[i];
      const height = this.particleData.currentHeight[i];
      const windOffset = params.windForce * height;

      let x = radius * Math.cos(angle) + windOffset;
      let y = height;
      let z = radius * Math.sin(angle);

      if (this.particleData.shockwavePhase[i] >= 0) {
        this.particleData.shockwavePhase[i] += deltaTime / BURST_DURATION;
        const phase = this.particleData.shockwavePhase[i];

        if (phase >= 1) {
          this.particleData.shockwavePhase[i] = -1;
          this.particleData.shockwaveOffset[i * 3] = 0;
          this.particleData.shockwaveOffset[i * 3 + 1] = 0;
          this.particleData.shockwaveOffset[i * 3 + 2] = 0;
        } else {
          let offsetScale: number;
          if (phase < 0.4) {
            const t = phase / 0.4;
            offsetScale = this.easeOutCubic(t) * BURST_RADIUS;
          } else {
            const t = (phase - 0.4) / 0.6;
            offsetScale = BURST_RADIUS * (1 - this.easeOutCubic(t));
          }

          x += this.particleData.shockwaveDir[i * 3] * offsetScale;
          y += this.particleData.shockwaveDir[i * 3 + 1] * offsetScale;
          z += this.particleData.shockwaveDir[i * 3 + 2] * offsetScale;
        }
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      sizes[i] = params.particleSize;

      const color = this.getColorByHeight(height);
      customColors[i * 3] = color.r;
      customColors[i * 3 + 1] = color.g;
      customColors[i * 3 + 2] = color.b;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.customColor.needsUpdate = true;

    this.updateBurstRings(deltaTime);
  }

  private updateBurstRings(deltaTime: number): void {
    for (let i = this.burstRings.length - 1; i >= 0; i--) {
      const ring = this.burstRings[i];
      ring.phase += deltaTime / ring.duration;

      if (ring.phase >= 1) {
        this.scene.remove(ring.mesh);
        ring.mesh.geometry.dispose();
        (ring.mesh.material as THREE.Material).dispose();
        this.burstRings.splice(i, 1);
      } else {
        const scale = 0.1 + ring.phase * ring.maxRadius;
        ring.mesh.scale.setScalar(scale);
        const material = ring.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = 0.8 * (1 - ring.phase);
      }
    }
  }

  public triggerBurst(center: THREE.Vector3): void {
    this.createBurstRing(center);

    const particlePositions = this.geometry.attributes.position.array as Float32Array;
    const affectedIndices: { index: number; distance: number }[] = [];

    for (let i = 0; i < this.particleCount; i++) {
      const px = particlePositions[i * 3];
      const py = particlePositions[i * 3 + 1];
      const pz = particlePositions[i * 3 + 2];

      const dx = px - center.x;
      const dy = py - center.y;
      const dz = pz - center.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < BURST_RADIUS * 1.5) {
        affectedIndices.push({ index: i, distance: dist });
      }
    }

    affectedIndices.sort((a, b) => a.distance - b.distance);
    const count = Math.min(BURST_PARTICLE_COUNT, affectedIndices.length);

    for (let i = 0; i < count; i++) {
      const idx = affectedIndices[i].index;
      const px = particlePositions[idx * 3];
      const py = particlePositions[idx * 3 + 1];
      const pz = particlePositions[idx * 3 + 2];

      const dx = px - center.x;
      const dy = py - center.y;
      const dz = pz - center.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

      this.particleData.shockwaveDir[idx * 3] = dx / dist;
      this.particleData.shockwaveDir[idx * 3 + 1] = dy / dist;
      this.particleData.shockwaveDir[idx * 3 + 2] = dz / dist;
      this.particleData.shockwavePhase[idx] = 0;
    }
  }

  private createBurstRing(center: THREE.Vector3): void {
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const ring = new THREE.Mesh(this.ringGeometry, ringMaterial);
    ring.position.copy(center);
    ring.lookAt(center.x + 1, center.y, center.z);
    ring.scale.setScalar(0.1);
    this.scene.add(ring);

    this.burstRings.push({
      mesh: ring,
      phase: 0,
      duration: RING_DURATION,
      maxRadius: BURST_RADIUS * 2,
    });

    const ring2 = ring.clone();
    ring2.lookAt(center.x, center.y + 1, center.z);
    this.scene.add(ring2);
    this.burstRings.push({
      mesh: ring2,
      phase: 0,
      duration: RING_DURATION,
      maxRadius: BURST_RADIUS * 2,
    });

    const ring3 = ring.clone();
    ring3.lookAt(center.x, center.y, center.z + 1);
    this.scene.add(ring3);
    this.burstRings.push({
      mesh: ring3,
      phase: 0,
      duration: RING_DURATION,
      maxRadius: BURST_RADIUS * 2,
    });
  }

  public getParticles(): THREE.Points {
    return this.particles;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.ringGeometry.dispose();
    this.scene.remove(this.particles);

    for (const ring of this.burstRings) {
      this.scene.remove(ring.mesh);
      ring.mesh.material instanceof THREE.Material && ring.mesh.material.dispose();
    }
    this.burstRings = [];
  }
}
