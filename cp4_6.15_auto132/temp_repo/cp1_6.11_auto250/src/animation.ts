import * as THREE from 'three';

export class AnimationController {
  private scene: THREE.Scene;
  private woodDustParticles: THREE.Points[] = [];
  private shuttleTrailParticles: THREE.Points[] = [];
  private audioCtx: AudioContext | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  scheduleAnima(
    action: (t: number) => void,
    duration: number,
    easing: 'ease-in-out' | 'linear'
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const startTime = performance.now();
      const durationMs = duration * 1000;

      const tick = () => {
        const elapsed = performance.now() - startTime;
        let t = Math.min(elapsed / durationMs, 1);

        if (easing === 'ease-in-out') {
          t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        }

        action(t);

        if (elapsed < durationMs) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(tick);
    });
  }

  createWoodDustParticles(position: THREE.Vector3): void {
    const count = 10;
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 30;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        )
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const size = 8 + Math.random() * 7;
    const material = new THREE.PointsMaterial({
      size,
      color: 0xc4a77d,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    (points as any)._velocities = velocities;
    this.scene.add(points);
    this.woodDustParticles.push(points);
  }

  createShuttleTrailParticles(position: THREE.Vector3): void {
    const count = 5;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 6,
      color: 0xffd700,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.shuttleTrailParticles.push(points);
  }

  playClickSound(): void {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }

    const oscillator = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.value = 800;
    gain.gain.value = 0.1;

    oscillator.connect(gain);
    gain.connect(this.audioCtx.destination);

    const now = this.audioCtx.currentTime;
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  update(dt: number): void {
    for (let i = this.woodDustParticles.length - 1; i >= 0; i--) {
      const points = this.woodDustParticles[i];
      const material = points.material as THREE.PointsMaterial;
      const geometry = points.geometry;
      const velocities: THREE.Vector3[] = (points as any)._velocities;
      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

      for (let j = 0; j < velocities.length; j++) {
        posAttr.setXYZ(
          j,
          posAttr.getX(j) + velocities[j].x * dt,
          posAttr.getY(j) + velocities[j].y * dt,
          posAttr.getZ(j) + velocities[j].z * dt
        );
      }
      posAttr.needsUpdate = true;

      material.opacity -= 0.3 * dt;

      if (material.opacity <= 0) {
        this.scene.remove(points);
        geometry.dispose();
        material.dispose();
        this.woodDustParticles.splice(i, 1);
      }
    }

    for (let i = this.shuttleTrailParticles.length - 1; i >= 0; i--) {
      const points = this.shuttleTrailParticles[i];
      const material = points.material as THREE.PointsMaterial;

      material.opacity -= 1.5 * dt;

      if (material.opacity <= 0) {
        this.scene.remove(points);
        points.geometry.dispose();
        material.dispose();
        this.shuttleTrailParticles.splice(i, 1);
      }
    }
  }
}
