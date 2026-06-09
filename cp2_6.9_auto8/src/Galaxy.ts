import * as THREE from 'three';

export interface GalaxyParams {
  particleCount: number;
  coreParticleCount: number;
  radius: number;
  thickness: number;
  armCount: number;
  pitch: number;
  armDensityRatio: number;
  angularVelocity: number;
  particleSize: number;
  mass: number;
}

export interface GalaxyState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mass: number;
}

export class Galaxy {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public mass: number;
  public particles: THREE.Points | null = null;
  public coreParticles: THREE.Points | null = null;
  public geometry: THREE.BufferGeometry | null = null;
  public coreGeometry: THREE.BufferGeometry | null = null;
  public positions: Float32Array;
  public velocities: Float32Array;
  public colors: Float32Array;
  public corePositions: Float32Array;
  public coreColors: Float32Array;
  public trailPositions: Float32Array[] = [];
  public trailGeometries: THREE.BufferGeometry[] = [];
  public trailLines: THREE.Line[] = [];
  
  private params: GalaxyParams;
  private scene: THREE.Scene;
  private particleTexture: THREE.Texture;
  private showTrailsFlag: boolean = false;
  private maxTrailLength: number = 100;
  private trailDecayTime: number = 0.5;
  private initialPositions: Float32Array;
  private initialVelocities: Float32Array;
  private isMerging: boolean = false;
  private mergeProgress: number = 0;
  private rotationAngle: number = 0;

  constructor(scene: THREE.Scene, params: GalaxyParams) {
    this.scene = scene;
    this.params = { ...params };
    this.mass = params.mass;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    
    const totalParticles = params.particleCount + params.coreParticleCount;
    this.positions = new Float32Array(params.particleCount * 3);
    this.velocities = new Float32Array(params.particleCount * 3);
    this.colors = new Float32Array(params.particleCount * 3);
    this.corePositions = new Float32Array(params.coreParticleCount * 3);
    this.coreColors = new Float32Array(params.coreParticleCount * 3);
    
    this.initialPositions = new Float32Array(params.particleCount * 3);
    this.initialVelocities = new Float32Array(params.particleCount * 3);
    
    this.particleTexture = this.createParticleTexture();
    this.generateParticles();
    this.createTrailBuffers();
  }

  private createParticleTexture(): THREE.Texture {
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
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  public generateParticles(): void {
    const { particleCount, coreParticleCount, radius, thickness, armCount, pitch, armDensityRatio } = this.params;
    
    const b = pitch / (2 * Math.PI);
    
    for (let i = 0; i < particleCount; i++) {
      let r: number;
      let theta: number;
      
      const inArm = Math.random() < (armDensityRatio / (armDensityRatio + 1));
      
      if (inArm) {
        const armIndex = Math.floor(Math.random() * armCount);
        const armOffset = (armIndex / armCount) * Math.PI * 2;
        
        r = Math.pow(Math.random(), 0.5) * radius;
        theta = armOffset + (r / (radius * Math.exp(b * Math.PI * 2))) * Math.PI * 2 * pitch;
        theta += (Math.random() - 0.5) * 0.3;
      } else {
        r = Math.pow(Math.random(), 0.5) * radius;
        theta = Math.random() * Math.PI * 2;
      }
      
      const z = (Math.random() - 0.5) * thickness * (1 - r / radius);
      
      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;
      
      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;
      
      this.initialPositions[i * 3] = x;
      this.initialPositions[i * 3 + 1] = y;
      this.initialPositions[i * 3 + 2] = z;
      
      const dist = Math.sqrt(x * x + y * y + z * z);
      const normDist = dist / radius;
      
      const h = THREE.MathUtils.lerp(50, 220, normDist);
      const s = 0.8;
      const l = THREE.MathUtils.lerp(0.7, 0.5, normDist);
      
      const color = new THREE.Color().setHSL(h / 360, s, l);
      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;
      
      const orbitSpeed = 0.5 * (1 - normDist * 0.5);
      const perpX = -y / (dist + 0.001);
      const perpY = x / (dist + 0.001);
      
      this.velocities[i * 3] = perpX * orbitSpeed;
      this.velocities[i * 3 + 1] = perpY * orbitSpeed;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
      
      this.initialVelocities[i * 3] = this.velocities[i * 3];
      this.initialVelocities[i * 3 + 1] = this.velocities[i * 3 + 1];
      this.initialVelocities[i * 3 + 2] = this.velocities[i * 3 + 2];
    }
    
    for (let i = 0; i < coreParticleCount; i++) {
      const coreRadius = 0.8;
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = Math.pow(Math.random(), 0.33) * coreRadius;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      this.corePositions[i * 3] = x;
      this.corePositions[i * 3 + 1] = y;
      this.corePositions[i * 3 + 2] = z;
      
      const color = new THREE.Color(0xffcc00);
      const brightness = 0.8 + Math.random() * 0.2;
      this.coreColors[i * 3] = color.r * brightness;
      this.coreColors[i * 3 + 1] = color.g * brightness;
      this.coreColors[i * 3 + 2] = color.b * brightness;
    }
    
    this.createPoints();
  }

  private createPoints(): void {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.geometry?.dispose();
    }
    if (this.coreParticles) {
      this.scene.remove(this.coreParticles);
      this.coreGeometry?.dispose();
    }
    
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: this.params.particleSize,
      vertexColors: true,
      map: this.particleTexture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    
    this.particles = new THREE.Points(this.geometry, material);
    
    this.coreGeometry = new THREE.BufferGeometry();
    this.coreGeometry.setAttribute('position', new THREE.BufferAttribute(this.corePositions, 3));
    this.coreGeometry.setAttribute('color', new THREE.BufferAttribute(this.coreColors, 3));
    
    const coreMaterial = new THREE.PointsMaterial({
      size: this.params.particleSize * 1.2,
      vertexColors: true,
      map: this.particleTexture,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    
    this.coreParticles = new THREE.Points(this.coreGeometry, coreMaterial);
    
    this.scene.add(this.particles);
    this.scene.add(this.coreParticles);
    
    this.updateWorldPositions();
  }

  private createTrailBuffers(): void {
    const trailStep = Math.max(1, Math.floor(this.params.particleCount / 200));
    for (let i = 0; i < this.params.particleCount; i += trailStep) {
      const trailBuffer = new Float32Array(this.maxTrailLength * 3);
      this.trailPositions.push(trailBuffer);
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(trailBuffer, 3));
      
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        vertexColors: false
      });
      
      const line = new THREE.Line(geometry, material);
      line.visible = false;
      
      this.trailGeometries.push(geometry);
      this.trailLines.push(line);
      this.scene.add(line);
    }
  }

  public update(delta: number, gravityForce?: THREE.Vector3, simulationSpeed: number = 1): void {
    const { particleCount, angularVelocity, coreParticleCount } = this.params;
    
    this.rotationAngle += angularVelocity * delta * simulationSpeed;
    
    if (gravityForce) {
      const accX = gravityForce.x / this.mass;
      const accY = gravityForce.y / this.mass;
      const accZ = gravityForce.z / this.mass;
      
      this.velocity.x += accX * delta * simulationSpeed;
      this.velocity.y += accY * delta * simulationSpeed;
      this.velocity.z += accZ * delta * simulationSpeed;
    }
    
    this.position.x += this.velocity.x * delta * simulationSpeed;
    this.position.y += this.velocity.y * delta * simulationSpeed;
    this.position.z += this.velocity.z * delta * simulationSpeed;
    
    if (!this.isMerging) {
      const cos = Math.cos(angularVelocity * delta * simulationSpeed);
      const sin = Math.sin(angularVelocity * delta * simulationSpeed);
      
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const x = this.positions[idx];
        const y = this.positions[idx + 1];
        
        this.positions[idx] = x * cos - y * sin;
        this.positions[idx + 1] = x * sin + y * cos;
        
        this.positions[idx] += this.velocities[idx] * delta * simulationSpeed;
        this.positions[idx + 1] += this.velocities[idx + 1] * delta * simulationSpeed;
        this.positions[idx + 2] += this.velocities[idx + 2] * delta * simulationSpeed;
      }
    } else {
      this.mergeProgress = Math.min(1, this.mergeProgress + delta * 0.3);
      
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        this.positions[idx] += this.velocities[idx] * delta * simulationSpeed * 0.5;
        this.positions[idx + 1] += this.velocities[idx + 1] * delta * simulationSpeed * 0.5;
        this.positions[idx + 2] += this.velocities[idx + 2] * delta * simulationSpeed * 0.5;
        
        const dist = Math.sqrt(
          this.positions[idx] * this.positions[idx] +
          this.positions[idx + 1] * this.positions[idx + 1] +
          this.positions[idx + 2] * this.positions[idx + 2]
        );
        
        if (dist > 0) {
          this.velocities[idx] -= (this.positions[idx] / dist) * delta * 0.5;
          this.velocities[idx + 1] -= (this.positions[idx + 1] / dist) * delta * 0.5;
          this.velocities[idx + 2] -= (this.positions[idx + 2] / dist) * delta * 0.5;
        }
        
        const mergeColor = new THREE.Color(0xaa88cc);
        const t = this.mergeProgress;
        this.colors[idx] = THREE.MathUtils.lerp(this.colors[idx], mergeColor.r, t * 0.02);
        this.colors[idx + 1] = THREE.MathUtils.lerp(this.colors[idx + 1], mergeColor.g, t * 0.02);
        this.colors[idx + 2] = THREE.MathUtils.lerp(this.colors[idx + 2], mergeColor.b, t * 0.02);
      }
    }
    
    for (let i = 0; i < coreParticleCount; i++) {
      const idx = i * 3;
      const x = this.corePositions[idx];
      const y = this.corePositions[idx + 1];
      const z = this.corePositions[idx + 2];
      
      const dist = Math.sqrt(x * x + y * y + z * z);
      if (dist > 0) {
        this.corePositions[idx] -= (x / dist) * delta * 0.1;
        this.corePositions[idx + 1] -= (y / dist) * delta * 0.1;
        this.corePositions[idx + 2] -= (z / dist) * delta * 0.1;
      }
    }
    
    if (this.showTrailsFlag) {
      this.updateTrails();
    }
    
    this.updateWorldPositions();
    
    if (this.geometry) {
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
    }
    if (this.coreGeometry) {
      this.coreGeometry.attributes.position.needsUpdate = true;
    }
  }

  private updateWorldPositions(): void {
    if (this.particles) {
      this.particles.position.copy(this.position);
    }
    if (this.coreParticles) {
      this.coreParticles.position.copy(this.position);
    }
  }

  private updateTrails(): void {
    const trailStep = Math.max(1, Math.floor(this.params.particleCount / 200));
    
    for (let t = 0; t < this.trailPositions.length; t++) {
      const particleIndex = t * trailStep;
      const trail = this.trailPositions[t];
      
      for (let i = this.maxTrailLength - 1; i > 0; i--) {
        trail[i * 3] = trail[(i - 1) * 3];
        trail[i * 3 + 1] = trail[(i - 1) * 3 + 1];
        trail[i * 3 + 2] = trail[(i - 1) * 3 + 2];
      }
      
      trail[0] = this.positions[particleIndex * 3] + this.position.x;
      trail[1] = this.positions[particleIndex * 3 + 1] + this.position.y;
      trail[2] = this.positions[particleIndex * 3 + 2] + this.position.z;
      
      if (this.trailGeometries[t]) {
        this.trailGeometries[t].attributes.position.needsUpdate = true;
      }
      
      const material = this.trailLines[t].material as THREE.LineBasicMaterial;
      material.opacity = 0.3 * (1 - this.trailDecayTime);
    }
  }

  public applyGravity(force: THREE.Vector3, perturbation: number): void {
    const { particleCount } = this.params;
    
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      
      const perturbX = (Math.random() - 0.5) * perturbation;
      const perturbY = (Math.random() - 0.5) * perturbation;
      const perturbZ = (Math.random() - 0.5) * perturbation;
      
      this.velocities[idx] += (force.x + perturbX) / this.mass;
      this.velocities[idx + 1] += (force.y + perturbY) / this.mass;
      this.velocities[idx + 2] += (force.z + perturbZ) / this.mass;
    }
  }

  public getCenterOfMass(): THREE.Vector3 {
    return this.position.clone();
  }

  public getParticleWorldPosition(index: number): THREE.Vector3 {
    const idx = index * 3;
    return new THREE.Vector3(
      this.positions[idx] + this.position.x,
      this.positions[idx + 1] + this.position.y,
      this.positions[idx + 2] + this.position.z
    );
  }

  public getParticleVelocity(index: number): THREE.Vector3 {
    const idx = index * 3;
    return new THREE.Vector3(
      this.velocities[idx],
      this.velocities[idx + 1],
      this.velocities[idx + 2]
    );
  }

  public showTrails(enabled: boolean): void {
    this.showTrailsFlag = enabled;
    for (const line of this.trailLines) {
      line.visible = enabled;
    }
  }

  public setParticleSize(size: number): void {
    this.params.particleSize = size;
    if (this.particles) {
      (this.particles.material as THREE.PointsMaterial).size = size;
    }
    if (this.coreParticles) {
      (this.coreParticles.material as THREE.PointsMaterial).size = size * 1.2;
    }
  }

  public setMass(mass: number): void {
    this.mass = mass;
  }

  public startMerging(): void {
    this.isMerging = true;
    this.mergeProgress = 0;
  }

  public isMergeComplete(): boolean {
    return this.mergeProgress >= 1;
  }

  public reset(): void {
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.rotationAngle = 0;
    this.isMerging = false;
    this.mergeProgress = 0;
    
    this.positions.set(this.initialPositions);
    this.velocities.set(this.initialVelocities);
    
    for (let i = 0; i < this.params.particleCount; i++) {
      const idx = i * 3;
      const x = this.positions[idx];
      const y = this.positions[idx + 1];
      const z = this.positions[idx + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      const normDist = dist / this.params.radius;
      
      const h = THREE.MathUtils.lerp(50, 220, normDist);
      const s = 0.8;
      const l = THREE.MathUtils.lerp(0.7, 0.5, normDist);
      
      const color = new THREE.Color().setHSL(h / 360, s, l);
      this.colors[idx] = color.r;
      this.colors[idx + 1] = color.g;
      this.colors[idx + 2] = color.b;
    }
    
    for (const trail of this.trailPositions) {
      trail.fill(0);
    }
    
    this.updateWorldPositions();
    
    if (this.geometry) {
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
    }
    if (this.coreGeometry) {
      this.coreGeometry.attributes.position.needsUpdate = true;
    }
  }

  public dispose(): void {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.geometry?.dispose();
      (this.particles.material as THREE.Material).dispose();
    }
    if (this.coreParticles) {
      this.scene.remove(this.coreParticles);
      this.coreGeometry?.dispose();
      (this.coreParticles.material as THREE.Material).dispose();
    }
    for (const line of this.trailLines) {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.particleTexture.dispose();
  }

  public getParticleCount(): number {
    return this.params.particleCount + this.params.coreParticleCount;
  }
}
