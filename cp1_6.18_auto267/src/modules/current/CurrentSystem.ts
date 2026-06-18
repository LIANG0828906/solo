import * as THREE from 'three';

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector2;
  speed: number;
  offset: number;
}

export interface CurrentPoint {
  x: number;
  z: number;
  vx: number;
  vz: number;
  speed: number;
}

export class CurrentSystem {
  private scene: THREE.Scene;
  private particles: ParticleData[];
  private group: THREE.Group;
  private arrowMeshes: THREE.Group[];
  private animationId: number;
  private onDataUpdate: ((data: CurrentPoint[]) => void) | null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particles = [];
    this.group = new THREE.Group();
    this.arrowMeshes = [];
    this.animationId = 0;
    this.onDataUpdate = null;
    this.scene.add(this.group);

    this.initParticles();
  }

  private initParticles() {
    const particleCount = 800;

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 180;
      const z = (Math.random() - 0.5) * 180;

      const baseAngle = Math.sin(x * 0.02) * Math.cos(z * 0.02) * Math.PI;
      const speed = 2 + Math.random() * 6;
      const vx = Math.cos(baseAngle + Math.random() * 0.5) * speed;
      const vz = Math.sin(baseAngle + Math.random() * 0.5) * speed;

      this.particles.push({
        position: new THREE.Vector3(x, 0, z),
        velocity: new THREE.Vector2(vx, vz),
        speed,
        offset: Math.random() * Math.PI * 2
      });

      const arrow = this.createArrow(speed);
      arrow.position.set(x, 0, z);
      this.group.add(arrow);
      this.arrowMeshes.push(arrow);
    }
  }

  private createArrow(speed: number): THREE.Group {
    const length = 2 + (speed / 8) * 6;
    const shaftLength = length * 0.7;
    const headLength = length * 0.3;
    const shaftRadius = 0.15;
    const headRadius = 0.35;

    const arrowGroup = new THREE.Group();

    const shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 6);
    const headGeometry = new THREE.ConeGeometry(headRadius, headLength, 6);

    const color = this.getSpeedColor(speed);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85
    });

    const shaft = new THREE.Mesh(shaftGeometry, material);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = shaftLength / 2 + headLength / 2;

    arrowGroup.add(shaft);
    arrowGroup.add(head);
    arrowGroup.rotation.x = Math.PI / 2;
    arrowGroup.rotation.z = Math.PI / 2;

    return arrowGroup;
  }

  private getSpeedColor(speed: number): THREE.Color {
    const t = Math.min(1, Math.max(0, (speed - 2) / 6));
    const startColor = new THREE.Color(0x00B4D8);
    const midColor = new THREE.Color(0x0077B6);
    const endColor = new THREE.Color(0x00F5D4);

    if (t < 0.5) {
      return startColor.clone().lerp(midColor, t * 2);
    } else {
      return midColor.clone().lerp(endColor, (t - 0.5) * 2);
    }
  }

  private updateParticleFlow(time: number) {
    const startTime = performance.now();

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const mesh = this.arrowMeshes[i];

      const noiseX = Math.sin(particle.position.x * 0.03 + time * 0.0005 + particle.offset) * 2;
      const noiseZ = Math.cos(particle.position.z * 0.03 + time * 0.0004 + particle.offset) * 2;

      particle.velocity.x += noiseX * 0.02;
      particle.velocity.y += noiseZ * 0.02;

      const currentSpeed = Math.sqrt(
        particle.velocity.x ** 2 + particle.velocity.y ** 2
      );
      const targetSpeed = 2 + Math.abs(Math.sin(particle.position.x * 0.01 + particle.position.z * 0.01 + time * 0.0003)) * 6;

      if (currentSpeed > 0) {
        particle.velocity.x = (particle.velocity.x / currentSpeed) * targetSpeed;
        particle.velocity.y = (particle.velocity.y / currentSpeed) * targetSpeed;
      }

      particle.speed = targetSpeed;

      particle.position.x += particle.velocity.x * 0.02;
      particle.position.z += particle.velocity.y * 0.02;

      if (particle.position.x > 95) particle.position.x = -95;
      if (particle.position.x < -95) particle.position.x = 95;
      if (particle.position.z > 95) particle.position.z = -95;
      if (particle.position.z < -95) particle.position.z = 95;

      mesh.position.x = particle.position.x;
      mesh.position.z = particle.position.z;

      const angle = Math.atan2(particle.velocity.y, particle.velocity.x);
      mesh.rotation.y = -angle;

      const waveY = Math.sin(particle.position.x * 0.2 + time * 0.0008) * 1.5
        + Math.sin(particle.position.z * 0.4 + time * 0.0006) * 1.0
        + Math.sin((particle.position.x + particle.position.z) * 0.3 + time * 0.001) * 0.7;
      mesh.position.y = waveY + 0.5;

      const scale = 0.5 + (particle.speed / 8) * 0.5;
      mesh.scale.setScalar(scale);

      const newColor = this.getSpeedColor(particle.speed);
      mesh.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.color.copy(newColor);
        }
      });
    }

    const elapsed = performance.now() - startTime;
    if (elapsed > 8) {
      console.warn(`Particle update took ${elapsed}ms, exceeding 8ms budget`);
    }
  }

  setOnDataUpdate(callback: (data: CurrentPoint[]) => void) {
    this.onDataUpdate = callback;
  }

  start() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const now = performance.now();
      this.updateParticleFlow(now);

      if (this.onDataUpdate && Math.random() < 0.05) {
        const data: CurrentPoint[] = this.particles.slice(0, 100).map((p) => ({
          x: p.position.x,
          z: p.position.z,
          vx: p.velocity.x,
          vz: p.velocity.y,
          speed: p.speed
        }));
        this.onDataUpdate(data);
      }
    };
    animate();
  }

  stop() {
    cancelAnimationFrame(this.animationId);
    this.arrowMeshes.forEach((group) => {
      group.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    });
    this.scene.remove(this.group);
  }
}
