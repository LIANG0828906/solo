import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  life: number;
  trail: THREE.Vector3[];
  active: boolean;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private maxParticles: number = 3000;
  private activeCount: number = 0;
  private windDirection: number = 0;
  private windSpeed: number = 5;
  private gridSize: number;
  private boundary: THREE.Box3;
  
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  
  constructor(scene: THREE.Scene, gridSize: number) {
    this.scene = scene;
    this.gridSize = gridSize;
    this.boundary = new THREE.Box3(
      new THREE.Vector3(-gridSize / 2, 0, -gridSize / 2),
      new THREE.Vector3(gridSize / 2, 3, gridSize / 2)
    );
    
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    
    this.points = new THREE.Points(this.geometry, material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
    
    this.initParticles();
  }
  
  private initParticles(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        age: 0,
        life: 2,
        trail: [],
        active: false,
      });
    }
    this.updateParticleCount();
  }
  
  private spawnParticle(index: number): void {
    const particle = this.particles[index];
    particle.position.set(
      (Math.random() - 0.5) * this.gridSize,
      Math.random() * 2 + 0.5,
      (Math.random() - 0.5) * this.gridSize
    );
    
    const angle = (this.windDirection + (Math.random() - 0.5) * 30) * Math.PI / 180;
    const speed = this.windSpeed * (0.5 + Math.random() * 0.5) * 0.3;
    particle.velocity.set(
      Math.sin(angle) * speed,
      (Math.random() - 0.5) * 0.1,
      Math.cos(angle) * speed
    );
    
    particle.age = 0;
    particle.life = 0.5 + Math.random() * 1;
    particle.trail = [];
    particle.active = true;
  }
  
  updateParticleCount(): void {
    const targetCount = Math.min(this.maxParticles, Math.floor(200 + this.windSpeed * 200));
    this.activeCount = targetCount;
    
    for (let i = 0; i < this.maxParticles; i++) {
      if (i < targetCount && !this.particles[i].active) {
        this.spawnParticle(i);
      } else if (i >= targetCount && this.particles[i].active) {
        this.particles[i].active = false;
      }
    }
    
    this.geometry.setDrawRange(0, targetCount);
  }
  
  update(deltaTime: number, elevationFunction?: (x: number, z: number) => number): void {
    for (let i = 0; i < this.activeCount; i++) {
      const particle = this.particles[i];
      if (!particle.active) continue;
      
      particle.trail.push(particle.position.clone());
      if (particle.trail.length > 10) {
        particle.trail.shift();
      }
      
      const angle = (this.windDirection + (Math.random() - 0.5) * 20) * Math.PI / 180;
      const speed = this.windSpeed * 0.3;
      particle.velocity.x = Math.sin(angle) * speed + (Math.random() - 0.5) * 0.05;
      particle.velocity.z = Math.cos(angle) * speed + (Math.random() - 0.5) * 0.05;
      particle.velocity.y = (Math.random() - 0.5) * 0.05;
      
      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 3));
      particle.age += deltaTime;
      
      let groundY = 0.3;
      if (elevationFunction) {
        groundY = elevationFunction(
          (particle.position.x + this.gridSize / 2),
          (particle.position.z + this.gridSize / 2)
        ) * 2 + 0.3;
      }
      
      if (particle.position.y < groundY) {
        particle.position.y = groundY + Math.random() * 0.5;
      }
      if (particle.position.y > 3) {
        particle.position.y = 3;
      }
      
      if (particle.age >= particle.life ||
          !this.boundary.containsPoint(particle.position)) {
        this.spawnParticle(i);
      }
      
      const posIndex = i * 3;
      this.positions[posIndex] = particle.position.x;
      this.positions[posIndex + 1] = particle.position.y;
      this.positions[posIndex + 2] = particle.position.z;
      
      const lifeRatio = 1 - particle.age / particle.life;
      const alpha = Math.min(1, lifeRatio * 2);
      
      const speedRatio = Math.min(1, this.windSpeed / 12);
      this.colors[posIndex] = 0.4 + speedRatio * 0.3;
      this.colors[posIndex + 1] = 0.7 + speedRatio * 0.2;
      this.colors[posIndex + 2] = 0.95;
      
      this.sizes[i] = 0.1 + alpha * 0.1;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }
  
  setWind(direction: number, speed: number): void {
    this.windDirection = direction;
    this.windSpeed = speed;
    this.updateParticleCount();
  }
  
  setOpacity(opacity: number): void {
    (this.points.material as THREE.PointsMaterial).opacity = opacity;
  }
  
  getOpacity(): number {
    return (this.points.material as THREE.PointsMaterial).opacity;
  }
  
  dispose(): void {
    this.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
    this.scene.remove(this.points);
  }
}
