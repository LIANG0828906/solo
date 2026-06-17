import * as THREE from 'three';

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class EffectManager {
  private scene: THREE.Scene;
  private particles: Particle[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnPlaceParticles(position: THREE.Vector3): void {
    const particleCount = 8;
    const geometry = new THREE.SphereGeometry(0.08, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });

    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(geometry, material.clone());
      mesh.position.copy(position);
      mesh.position.y += 0.5;

      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed * 0.3,
        1 + Math.random() * 1.5,
        Math.sin(angle) * speed * 0.3
      );

      this.particles.push({
        mesh,
        velocity,
        angularVelocity: new THREE.Vector3(),
        life: 0.3,
        maxLife: 0.3,
      });

      this.scene.add(mesh);
    }
  }

  spawnBreakParticles(position: THREE.Vector3, color: number): void {
    const shardCount = 4 + Math.floor(Math.random() * 5);
    const size = 0.25 + Math.random() * 0.15;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshLambertMaterial({ color });

    for (let i = 0; i < shardCount; i++) {
      const shardMaterial = material.clone();
      const mesh = new THREE.Mesh(geometry, shardMaterial);
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 0.5;
      mesh.position.y += (Math.random() - 0.5) * 0.5;
      mesh.position.z += (Math.random() - 0.5) * 0.5;
      mesh.castShadow = true;

      const speed = 1 + Math.random() * 2;
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed * 2,
        1 + Math.random() * 3,
        (Math.random() - 0.5) * speed * 2
      );

      const angularVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3
      );

      this.particles.push({
        mesh,
        velocity,
        angularVelocity,
        life: 1.5,
        maxLife: 1.5,
      });

      this.scene.add(mesh);
    }
  }

  spawnDustParticles(position: THREE.Vector3): void {
    const count = 5 + Math.floor(Math.random() * 6);
    const geometry = new THREE.SphereGeometry(0.06, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, material.clone());
      mesh.position.copy(position);
      mesh.position.y += 0.1;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        0.5 + Math.random() * 1,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh,
        velocity,
        angularVelocity: new THREE.Vector3(),
        life: 0.3,
        maxLife: 0.3,
      });

      this.scene.add(mesh);
    }
  }

  update(deltaTime: number): void {
    const gravity = -9.8;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= deltaTime;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        const mat = p.mesh.material;
        if (Array.isArray(mat)) {
          mat.forEach(m => m.dispose());
        } else {
          mat.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y += gravity * deltaTime * 0.5;
      p.mesh.position.addScaledVector(p.velocity, deltaTime);

      p.mesh.rotation.x += p.angularVelocity.x * deltaTime;
      p.mesh.rotation.y += p.angularVelocity.y * deltaTime;
      p.mesh.rotation.z += p.angularVelocity.z * deltaTime;

      const opacity = p.life / p.maxLife;
      const mat = p.mesh.material as THREE.Material & { opacity?: number };
      if (Array.isArray(mat)) {
        (mat as Array<THREE.Material & { opacity?: number }>).forEach(m => {
          if ('opacity' in m) m.opacity = opacity;
        });
      } else if ('opacity' in mat) {
        mat.opacity = opacity;
      }
    }
  }

  clear(): void {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      const mat = p.mesh.material;
      if (Array.isArray(mat)) {
        mat.forEach(m => m.dispose());
      } else {
        mat.dispose();
      }
    }
    this.particles = [];
  }
}

export function playBreakSound(): void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    const duration = 0.1;

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + duration);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start();

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.15, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);

    noiseSource.stop(ctx.currentTime + duration);

    setTimeout(() => {
      ctx.close();
    }, duration * 1000 + 100);
  } catch (e) {
    // Audio not supported
  }
}
