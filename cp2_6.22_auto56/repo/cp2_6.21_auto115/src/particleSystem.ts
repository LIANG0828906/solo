import * as THREE from 'three';

export interface ParticleParams {
  viscosity: number;
  diffusionRate: number;
  forceFieldStrength: number;
}

export class ParticleSystem {
  private particleCount: number;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private velocities: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private params: ParticleParams;
  private targetParams: ParticleParams;
  private paramAnimation: {
    active: boolean;
    startValues: ParticleParams;
    targetValues: ParticleParams;
    startTime: number;
    duration: number;
  } | null = null;
  private mouseForce: THREE.Vector3 | null = null;
  private mouseForceRadius: number = 15;
  private mouseForceStrength: number = 2.0;
  private qualityLevel: number = 1;
  private sphereRadius: number = 40;
  private shellThickness: number = 2;
  private colorStart: THREE.Color = new THREE.Color(0x4a00e0);
  private colorEnd: THREE.Color = new THREE.Color(0xff6b35);
  private tempColor: THREE.Color = new THREE.Color();
  private baseSizes: Float32Array;
  private colorUpdateSkip: number = 0;
  private frameCount: number = 0;

  constructor(count: number = 5000) {
    this.particleCount = count;
    this.params = {
      viscosity: 2.0,
      diffusionRate: 0.1,
      forceFieldStrength: 1.0
    };
    this.targetParams = { ...this.params };

    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.baseSizes = new Float32Array(count);

    this.geometry = new THREE.BufferGeometry();
    this.initParticles();
    this.setupGeometry();
  }

  private initParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const minRadius = this.sphereRadius - this.shellThickness;
      const maxRadius = this.sphereRadius;
      const r = minRadius + Math.random() * (maxRadius - minRadius);

      this.positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      this.positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      this.positions[i3 + 2] = r * Math.cos(phi);

      const speed = 1.5 + Math.random() * 2.0;
      const tangentDir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      
      const posVec = new THREE.Vector3(
        this.positions[i3],
        this.positions[i3 + 1],
        this.positions[i3 + 2]
      ).normalize();
      
      tangentDir.cross(posVec).normalize();
      
      const bitangent = new THREE.Vector3().crossVectors(posVec, tangentDir).normalize();
      const angle = Math.random() * Math.PI * 2;
      const velocityDir = new THREE.Vector3()
        .addScaledVector(tangentDir, Math.cos(angle))
        .addScaledVector(bitangent, Math.sin(angle))
        .normalize();
      
      this.velocities[i3] = velocityDir.x * speed;
      this.velocities[i3 + 1] = velocityDir.y * speed;
      this.velocities[i3 + 2] = velocityDir.z * speed;

      const size = 2 + Math.random() * 3;
      this.sizes[i] = size;
      this.baseSizes[i] = size;

      this.colors[i3] = this.colorStart.r;
      this.colors[i3 + 1] = this.colorStart.g;
      this.colors[i3 + 2] = this.colorStart.b;
    }
  }

  private setupGeometry(): void {
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
  }

  getGeometry(): THREE.BufferGeometry {
    return this.geometry;
  }

  getParticleCount(): number {
    return this.particleCount;
  }

  setParams(params: Partial<ParticleParams>): void {
    const newTarget = { ...this.targetParams, ...params };
    
    const hasChanged = 
      newTarget.viscosity !== this.targetParams.viscosity ||
      newTarget.diffusionRate !== this.targetParams.diffusionRate ||
      newTarget.forceFieldStrength !== this.targetParams.forceFieldStrength;
    
    if (hasChanged) {
      this.paramAnimation = {
        active: true,
        startValues: { ...this.params },
        targetValues: { ...newTarget },
        startTime: performance.now(),
        duration: 500
      };
      this.targetParams = newTarget;
    }
  }

  getParams(): ParticleParams {
    return { ...this.params };
  }

  setMouseForce(position: THREE.Vector3 | null): void {
    this.mouseForce = position;
  }

  setQualityLevel(level: number): void {
    this.qualityLevel = Math.max(0.3, Math.min(1, level));
    const sizeAttribute = this.geometry.getAttribute('aSize') as THREE.BufferAttribute;
    const sizes = sizeAttribute.array as Float32Array;
    
    for (let i = 0; i < this.particleCount; i++) {
      sizes[i] = this.baseSizes[i] * this.qualityLevel;
    }
    sizeAttribute.needsUpdate = true;

    if (this.qualityLevel > 0.8) {
      this.colorUpdateSkip = 0;
    } else if (this.qualityLevel > 0.5) {
      this.colorUpdateSkip = 1;
    } else {
      this.colorUpdateSkip = 2;
    }
  }

  update(deltaTime: number): void {
    this.animateParams();
    this.frameCount++;
    
    const dt = Math.min(deltaTime, 0.033) * 60;
    const viscosityFactor = Math.max(0.92, 1 - this.params.viscosity * 0.02);
    const diffusion = this.params.diffusionRate;
    const forceStrength = this.params.forceFieldStrength;
    const targetRadius = this.sphereRadius - this.shellThickness * 0.5;

    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;

    const mouseX = this.mouseForce?.x ?? 0;
    const mouseY = this.mouseForce?.y ?? 0;
    const mouseZ = this.mouseForce?.z ?? 0;
    const hasMouseForce = this.mouseForce !== null;
    const mouseRadiusSq = this.mouseForceRadius * this.mouseForceRadius;

    const shouldUpdateColor = this.colorUpdateSkip === 0 || this.frameCount % (this.colorUpdateSkip + 1) === 0;

    const minSpeed = 0.5;
    const maxSpeed = 4.0;
    const speedRange = maxSpeed - minSpeed;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      let vx = this.velocities[i3];
      let vy = this.velocities[i3 + 1];
      let vz = this.velocities[i3 + 2];

      vx += (Math.random() - 0.5) * diffusion;
      vy += (Math.random() - 0.5) * diffusion;
      vz += (Math.random() - 0.5) * diffusion;

      const px = positions[i3];
      const py = positions[i3 + 1];
      const pz = positions[i3 + 2];
      
      const distSq = px * px + py * py + pz * pz;
      const dist = Math.sqrt(distSq);
      
      if (dist > 0.01) {
        const invDist = 1 / dist;
        const nx = px * invDist;
        const ny = py * invDist;
        const nz = pz * invDist;

        const radialError = targetRadius - dist;
        const radialForce = radialError * 0.015 * forceStrength;
        vx += nx * radialForce;
        vy += ny * radialForce;
        vz += nz * radialForce;

        const swirl = 0.012 * forceStrength;
        vx += (-ny * swirl + nz * swirl * 0.3);
        vy += (nx * swirl - nz * swirl * 0.5);
        vz += (-nx * swirl * 0.4 + ny * swirl * 0.2);
      }

      if (hasMouseForce) {
        const dx = px - mouseX;
        const dy = py - mouseY;
        const dz = pz - mouseZ;
        const mDistSq = dx * dx + dy * dy + dz * dz;
        
        if (mDistSq < mouseRadiusSq && mDistSq > 0.01) {
          const mDist = Math.sqrt(mDistSq);
          const invMDist = 1 / mDist;
          const falloff = 1 - mDist / this.mouseForceRadius;
          const force = falloff * falloff * this.mouseForceStrength;
          vx += dx * invMDist * force;
          vy += dy * invMDist * force;
          vz += dz * invMDist * force;
        }
      }

      vx *= viscosityFactor;
      vy *= viscosityFactor;
      vz *= viscosityFactor;

      const speedSq = vx * vx + vy * vy + vz * vz;
      if (speedSq > maxSpeed * maxSpeed) {
        const invSpeed = maxSpeed / Math.sqrt(speedSq);
        vx *= invSpeed;
        vy *= invSpeed;
        vz *= invSpeed;
      }

      this.velocities[i3] = vx;
      this.velocities[i3 + 1] = vy;
      this.velocities[i3 + 2] = vz;

      positions[i3] += vx * dt;
      positions[i3 + 1] += vy * dt;
      positions[i3 + 2] += vz * dt;

      if (shouldUpdateColor) {
        const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
        const t = Math.max(0, Math.min(1, (speed - minSpeed) / speedRange));
        
        this.tempColor.copy(this.colorStart).lerp(this.colorEnd, t);
        colors[i3] = this.tempColor.r;
        colors[i3 + 1] = this.tempColor.g;
        colors[i3 + 2] = this.tempColor.b;
      }
    }

    posAttr.needsUpdate = true;
    if (shouldUpdateColor) {
      colAttr.needsUpdate = true;
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private animateParams(): void {
    if (!this.paramAnimation || !this.paramAnimation.active) return;

    const now = performance.now();
    const elapsed = now - this.paramAnimation.startTime;
    const t = Math.min(1, elapsed / this.paramAnimation.duration);
    const easedT = this.easeInOutCubic(t);

    const { startValues, targetValues } = this.paramAnimation;
    
    this.params.viscosity = startValues.viscosity + (targetValues.viscosity - startValues.viscosity) * easedT;
    this.params.diffusionRate = startValues.diffusionRate + (targetValues.diffusionRate - startValues.diffusionRate) * easedT;
    this.params.forceFieldStrength = startValues.forceFieldStrength + (targetValues.forceFieldStrength - startValues.forceFieldStrength) * easedT;

    if (t >= 1) {
      this.paramAnimation.active = false;
      this.params = { ...targetValues };
    }
  }

  getSphereRadius(): number {
    return this.sphereRadius;
  }
}

export function createParticleMaterial(): THREE.ShaderMaterial {
  const vertexShader = `
    attribute float aSize;
    varying vec3 vColor;
    
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying vec3 vColor;
    
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      alpha = pow(alpha, 0.6);
      
      gl_FragColor = vec4(vColor, alpha * 0.9);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader,
    fragmentShader
  });
}
