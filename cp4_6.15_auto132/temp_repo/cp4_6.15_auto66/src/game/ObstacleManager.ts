import * as THREE from 'three';
import type { IBeatData, IObstacleInstance } from '../types';
import { LANE_POSITIONS, SCROLL_SPEED, BEAT_LOOKAHEAD, MAX_PARTICLES } from '../types';

interface ObstaclePool {
  spikes: THREE.Group[];
  bars: THREE.Group[];
  walls: THREE.Group[];
}

export class ObstacleManager {
  private beats: IBeatData[] = [];
  private obstacles: IObstacleInstance[] = [];
  private pool: ObstaclePool;
  private nextBeatIndex: number = 0;
  private currentBeatIndex: number = -1;
  private scene: THREE.Scene;
  private idCounter: number = 0;
  private difficulty: 'normal' | 'hard' = 'normal';
  private gridPulseTime: number = 0;

  private particleGeometry: THREE.BoxGeometry;
  private obstacleParticles: Array<{
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
  }> = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.pool = { spikes: [], bars: [], walls: [] };
    this.particleGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
  }

  setBeats(beats: IBeatData[], difficulty: 'normal' | 'hard'): void {
    this.beats = beats;
    this.difficulty = difficulty;
    this.nextBeatIndex = 0;
    this.currentBeatIndex = -1;

    if (difficulty === 'hard') {
      const extraBeats: IBeatData[] = [];
      if (beats.length > 1) {
        const avgInterval = (beats[beats.length - 1].time - beats[0].time) / (beats.length - 1);
        for (let i = 0; i < beats.length; i++) {
          if (Math.random() < 0.4) {
            const offset = avgInterval * 0.5 * (0.5 + Math.random() * 0.5);
            extraBeats.push({
              time: beats[i].time + offset,
              intensity: beats[i].intensity * 0.7,
              type: Math.random() < 0.3 ? 'wall' : 'spike',
            });
          }
        }
      }
      this.beats = [...beats, ...extraBeats].sort((a, b) => a.time - b.time);
    }

    if (this.beats.length > 2) {
      const avgInterval = (this.beats[this.beats.length - 1].time - this.beats[0].time) / (this.beats.length - 1);
      const avgBPM = 60 / Math.max(0.01, avgInterval);
      console.log(`[ObstacleManager] 加载节拍:${this.beats.length}个 平均间隔:${avgInterval.toFixed(3)}s 约${avgBPM.toFixed(1)}BPM 校准偏移:BEAT_LOOKAHEAD=${BEAT_LOOKAHEAD}s`);
    }
  }

  getCurrentBeatIndex(): number {
    return this.currentBeatIndex;
  }

  getGridPulseIntensity(): number {
    return Math.max(0, 1 - this.gridPulseTime * 4);
  }

  update(currentTime: number, delta: number, scrollSpeed: number): IObstacleInstance[] {
    this.gridPulseTime += delta;
    const spawnTime = currentTime + BEAT_LOOKAHEAD;

    while (this.nextBeatIndex < this.beats.length && this.beats[this.nextBeatIndex].time <= spawnTime) {
      const beat = this.beats[this.nextBeatIndex];
      const timeUntilBeat = beat.time - currentTime;
      const spawnZ = -Math.max(3, scrollSpeed * Math.max(0.01, timeUntilBeat));
      if (this.nextBeatIndex < 3) {
        console.log(`[ObstacleManager] spawn beat#${this.nextBeatIndex} t=${beat.time.toFixed(3)}s now=${currentTime.toFixed(3)}s Δ=${timeUntilBeat.toFixed(3)}s z=${spawnZ.toFixed(1)} 强度=${beat.intensity.toFixed(2)} type=${beat.type}`);
      }
      this.spawnObstacle(beat, spawnZ);
      this.nextBeatIndex++;
    }

    const passedBeats: IObstacleInstance[] = [];

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (!obs.active) continue;

      if (obs.mesh) {
        obs.mesh.position.z += scrollSpeed * delta;
      }

      if (obs.mesh && obs.mesh.position.z > 3) {
        if (!obs.passed) {
          obs.passed = true;
          passedBeats.push(obs);
          this.currentBeatIndex = this.nextBeatIndex - 1;
          this.gridPulseTime = 0;
        }
      }

      if (obs.mesh && obs.mesh.position.z > 8) {
        this.recycleObstacle(obs);
      }
    }

    this.updateObstacleParticles(delta);

    return passedBeats;
  }

  private spawnObstacle(beat: IBeatData, spawnZ: number): void {
    const lane = Math.floor(Math.random() * 3);
    let mesh: THREE.Group;

    switch (beat.type) {
      case 'spike':
        mesh = this.getSpike();
        break;
      case 'bar':
        mesh = this.getBar();
        break;
      case 'wall':
        mesh = this.getWall();
        break;
    }

    mesh.position.set(LANE_POSITIONS[lane], beat.type === 'bar' ? 2.5 : 0, spawnZ);
    mesh.visible = true;
    this.scene.add(mesh);

    const instance: IObstacleInstance = {
      id: this.idCounter++,
      type: beat.type,
      lane,
      beatTime: beat.time,
      intensity: beat.intensity,
      mesh,
      active: true,
      passed: false,
    };

    this.obstacles.push(instance);
  }

  private getSpike(): THREE.Group {
    if (this.pool.spikes.length > 0) {
      return this.pool.spikes.pop()!;
    }

    const group = new THREE.Group();
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 0.6,
      metalness: 0.7,
      roughness: 0.3,
    });

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.5, 4), spikeMat);
    cone.position.y = 0.75;
    group.add(cone);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.15, 0.8),
      new THREE.MeshStandardMaterial({
        color: 0x660022,
        emissive: 0xff0055,
        emissiveIntensity: 0.3,
      })
    );
    base.position.y = 0.075;
    group.add(base);

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), glowMat);
    glow.position.y = 0.5;
    group.add(glow);

    return group;
  }

  private getBar(): THREE.Group {
    if (this.pool.bars.length > 0) {
      return this.pool.bars.pop()!;
    }

    const group = new THREE.Group();
    const barMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.3,
    });

    const bar = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 0.3), barMat);
    bar.position.y = 2.2;
    group.add(bar);

    const leftPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x664400, metalness: 0.8 })
    );
    leftPole.position.set(-1.3, 1.1, 0);
    group.add(leftPole);

    const rightPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x664400, metalness: 0.8 })
    );
    rightPole.position.set(1.3, 1.1, 0);
    group.add(rightPole);

    return group;
  }

  private getWall(): THREE.Group {
    if (this.pool.walls.length > 0) {
      return this.pool.walls.pop()!;
    }

    const group = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x4040ff,
      emissive: 0x4040ff,
      emissiveIntensity: 0.4,
      metalness: 0.5,
      roughness: 0.4,
      transparent: true,
      opacity: 0.85,
    });

    const wall = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3, 0.5), wallMat);
    wall.position.y = 1.5;
    group.add(wall);

    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.6,
    });
    const topEdge = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.05, 0.55), edgeMat);
    topEdge.position.y = 3.0;
    group.add(topEdge);

    return group;
  }

  private recycleObstacle(obs: IObstacleInstance): void {
    if (!obs.mesh) return;
    this.scene.remove(obs.mesh);
    obs.active = false;
    obs.mesh.visible = false;
    obs.passed = false;

    switch (obs.type) {
      case 'spike':
        this.pool.spikes.push(obs.mesh);
        break;
      case 'bar':
        this.pool.bars.push(obs.mesh);
        break;
      case 'wall':
        this.pool.walls.push(obs.mesh);
        break;
    }

    obs.mesh = null;
    const idx = this.obstacles.indexOf(obs);
    if (idx >= 0) {
      this.obstacles.splice(idx, 1);
    }
  }

  checkCollision(playerHitbox: { x: number; y: number; z: number; width: number; height: number; depth: number }): IObstacleInstance | null {
    for (const obs of this.obstacles) {
      if (!obs.active || !obs.mesh || obs.passed) continue;

      let obsWidth: number, obsHeight: number, obsDepth: number, obsY: number;

      switch (obs.type) {
        case 'spike':
          obsWidth = 0.8;
          obsHeight = 1.5;
          obsDepth = 0.8;
          obsY = 0.75;
          break;
        case 'bar':
          obsWidth = 3;
          obsHeight = 0.3;
          obsDepth = 0.3;
          obsY = 2.2;
          break;
        case 'wall':
          obsWidth = 2.2;
          obsHeight = 3;
          obsDepth = 0.5;
          obsY = 1.5;
          break;
      }

      const dx = Math.abs(playerHitbox.x - obs.mesh.position.x);
      const dy = Math.abs(playerHitbox.y - obsY);
      const dz = Math.abs(playerHitbox.z - obs.mesh.position.z);

      if (
        dx < (playerHitbox.width + obsWidth) / 2 &&
        dy < (playerHitbox.height + obsHeight) / 2 &&
        dz < (playerHitbox.depth + obsDepth) / 2
      ) {
        return obs;
      }
    }
    return null;
  }

  private updateObstacleParticles(delta: number): void {
    for (let i = this.obstacleParticles.length - 1; i >= 0; i--) {
      const p = this.obstacleParticles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.MeshBasicMaterial).dispose();
        this.obstacleParticles.splice(i, 1);
        continue;
      }
      p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
      const alpha = p.life / p.maxLife;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
    }
  }

  reset(): void {
    for (const obs of this.obstacles) {
      if (obs.mesh) {
        this.scene.remove(obs.mesh);
      }
    }
    this.obstacles = [];
    this.nextBeatIndex = 0;
    this.currentBeatIndex = -1;

    for (const p of this.obstacleParticles) {
      this.scene.remove(p.mesh);
      (p.mesh.material as THREE.MeshBasicMaterial).dispose();
    }
    this.obstacleParticles = [];
  }
}
