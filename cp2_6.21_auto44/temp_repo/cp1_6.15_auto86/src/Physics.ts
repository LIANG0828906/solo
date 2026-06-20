import * as THREE from 'three';
import { CONFIG, Obstacle, EnergyRing, eventEmitter } from './types';
import { PlayerShip } from './PlayerShip';
import { AIShip } from './AIShip';

interface CollisionResult {
  collided: boolean;
  normal: THREE.Vector3;
  impactSpeed: number;
}

export class Physics {
  private scene: THREE.Scene;
  private particlePool: Array<{ element: HTMLElement; active: boolean }> = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initParticlePool();
  }

  private initParticlePool(): void {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    for (let i = 0; i < CONFIG.MAX_PARTICLES; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      overlay.appendChild(particle);
      this.particlePool.push({ element: particle, active: false });
    }
  }

  checkShipObstacleCollision(
    ship: PlayerShip | AIShip,
    obstacles: Obstacle[]
  ): CollisionResult {
    const shipBox = ship.getBoundingBox();
    
    for (const obstacle of obstacles) {
      if (shipBox.intersectsBox(obstacle.boundingBox)) {
        const shipCenter = shipBox.getCenter(new THREE.Vector3());
        const obstacleCenter = obstacle.boundingBox.getCenter(new THREE.Vector3());
        
        const normal = shipCenter.clone().sub(obstacleCenter).normalize();
        const velocity = ship.getVelocity();
        const impactSpeed = velocity.dot(normal.clone().negate());
        
        return {
          collided: true,
          normal,
          impactSpeed: Math.max(0, impactSpeed),
        };
      }
    }
    
    return { collided: false, normal: new THREE.Vector3(), impactSpeed: 0 };
  }

  checkEnergyRingCollection(
    ship: PlayerShip | AIShip,
    energyRings: EnergyRing[]
  ): EnergyRing | null {
    const shipBox = ship.getBoundingBox();
    
    for (const ring of energyRings) {
      if (!ring.collected && shipBox.intersectsBox(ring.boundingBox)) {
        return ring;
      }
    }
    
    return null;
  }

  collectEnergyRing(ring: EnergyRing, position: THREE.Vector3): void {
    ring.collected = true;
    ring.mesh.visible = false;
    
    this.spawnEnergyParticles(position);
    
    eventEmitter.emit('energyCollected', { position });
  }

  private spawnEnergyParticles(position: THREE.Vector3): void {
    const screenPos = this.worldToScreen(position);
    if (!screenPos) return;

    const activeParticles = this.particlePool.filter(p => !p.active).slice(0, 15);
    
    activeParticles.forEach((particle, index) => {
      const angle = (index / activeParticles.length) * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;
      
      particle.element.style.left = `${screenPos.x + offsetX}px`;
      particle.element.style.top = `${screenPos.y + offsetY}px`;
      particle.element.style.background = '#00ff00';
      particle.element.style.boxShadow = '0 0 10px #00ff00';
      particle.active = true;
      particle.element.classList.add('active');
      
      setTimeout(() => {
        particle.element.classList.remove('active');
        particle.active = false;
      }, 300);
    });
  }

  private worldToScreen(worldPos: THREE.Vector3): { x: number; y: number } | null {
    const camera = this.scene.userData.camera as THREE.Camera;
    if (!camera) return null;

    const vector = worldPos.clone().project(camera);
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) return null;

    return {
      x: (vector.x * 0.5 + 0.5) * canvas.clientWidth,
      y: (-vector.y * 0.5 + 0.5) * canvas.clientHeight,
    };
  }

  applyThrust(
    velocity: THREE.Vector3,
    direction: THREE.Vector3,
    thrust: number,
    dt: number
  ): THREE.Vector3 {
    const thrustVector = direction.clone().multiplyScalar(thrust * dt);
    return velocity.clone().add(thrustVector);
  }

  applyFriction(velocity: THREE.Vector3, dt: number): THREE.Vector3 {
    const friction = 1 - CONFIG.FRICTION * dt;
    return velocity.clone().multiplyScalar(friction);
  }

  applyGravity(velocity: THREE.Vector3, dt: number): THREE.Vector3 {
    return new THREE.Vector3(
      velocity.x,
      velocity.y - CONFIG.GRAVITY * dt,
      velocity.z
    );
  }

  clampAltitude(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    trackHeight: number,
    dt: number
  ): THREE.Vector3 {
    const maxAltitude = trackHeight + CONFIG.MAX_ALTITUDE;
    const minAltitude = trackHeight + 2;
    
    let newVelocity = velocity.clone();
    
    if (position.y > maxAltitude) {
      newVelocity.y -= (position.y - maxAltitude) * dt * 5;
    } else if (position.y < minAltitude) {
      newVelocity.y += (minAltitude - position.y) * dt * 5;
    }
    
    return newVelocity;
  }

  checkLapCompletion(
    currentProgress: number,
    lastProgress: number
  ): boolean {
    return lastProgress > 0.9 && currentProgress < 0.1;
  }

  calculateRanking(
    playerState: { lap: number; progress: number; totalTime: number },
    aiStates: Array<{ name: string; lap: number; progress: number; totalTime: number; color: string }>
  ): Array<{ name: string; lap: number; progress: number; totalTime: number; isPlayer: boolean; color: string }> {
    const allRacers = [
      {
        name: '玩家',
        lap: playerState.lap,
        progress: playerState.progress,
        totalTime: playerState.totalTime,
        isPlayer: true,
        color: '#8B4513',
      },
      ...aiStates.map(ai => ({
        ...ai,
        isPlayer: false,
      })),
    ];

    return allRacers.sort((a, b) => {
      if (b.lap !== a.lap) return b.lap - a.lap;
      if (b.progress !== a.progress) return b.progress - a.progress;
      return a.totalTime - b.totalTime;
    });
  }

  dispose(): void {
    this.particlePool.forEach(p => {
      if (p.element.parentNode) {
        p.element.parentNode.removeChild(p.element);
      }
    });
    this.particlePool = [];
  }
}
