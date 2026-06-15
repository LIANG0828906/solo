import * as THREE from 'three';
import { PulseRing } from './RenderModule';

export interface ScoreBall {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  originalColor: THREE.Color;
  targetColor: THREE.Color;
  colorLerp: number;
  rotationSpeed: THREE.Vector3;
  driftOffset: THREE.Vector3;
  driftSpeed: number;
  lastHitTime: number;
  hitByPulseIds: Set<number>;
}

export interface ScoreEvent {
  player: number;
  points: number;
  position: THREE.Vector3;
}

export class ScoreBallModule {
  private balls: ScoreBall[] = [];
  private scene: THREE.Scene;
  private onScore?: (event: ScoreEvent) => void;
  private hitCooldown: number = 500;

  private ballColors: THREE.Color[] = [
    new THREE.Color(0xff3366),
    new THREE.Color(0x33ff66),
    new THREE.Color(0xaa33ff)
  ];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createScoreBalls();
  }

  private createScoreBalls(): void {
    const positions = [
      new THREE.Vector3(0, 3, 0),
      new THREE.Vector3(-3, 1, 2),
      new THREE.Vector3(3, 1, 2)
    ];

    positions.forEach((pos, index) => {
      const geometry = new THREE.SphereGeometry(0.8, 32, 32);
      const color = this.ballColors[index];
      
      const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color.clone().multiplyScalar(0.3),
        emissiveIntensity: 0.5,
        shininess: 100,
        transparent: true,
        opacity: 0.9
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      this.balls.push({
        mesh,
        position: pos.clone(),
        originalColor: color.clone(),
        targetColor: color.clone(),
        colorLerp: 1,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        driftOffset: new THREE.Vector3(),
        driftSpeed: 0.5 + Math.random() * 0.5,
        lastHitTime: 0,
        hitByPulseIds: new Set()
      });
    });
  }

  setCallback(onScore: (event: ScoreEvent) => void): void {
    this.onScore = onScore;
  }

  checkCollisions(pulseRings: PulseRing[]): void {
    const now = performance.now();

    for (const ball of this.balls) {
      for (const pulse of pulseRings) {
        if (ball.hitByPulseIds.has(pulse.id)) continue;

        const distance = ball.mesh.position.distanceTo(pulse.position);
        const radiusDiff = Math.abs(distance - pulse.radius);
        
        if (radiusDiff < 1.2) {
          const timeSinceLastHit = now - ball.lastHitTime;
          if (timeSinceLastHit > this.hitCooldown) {
            ball.lastHitTime = now;
            ball.hitByPulseIds.add(pulse.id);
            this.triggerScore(pulse.player, ball.mesh.position);
            this.flashBall(ball);
          }
        }
      }

      const hitIds = ball.hitByPulseIds;
      for (const id of hitIds) {
        const pulse = pulseRings.find(p => p.id === id);
        if (!pulse || pulse.radius > pulse.maxRadius * 0.7) {
          ball.hitByPulseIds.delete(id);
        }
      }
    }
  }

  private triggerScore(player: number, position: THREE.Vector3): void {
    this.onScore?.({
      player,
      points: 1,
      position: position.clone()
    });
  }

  private flashBall(ball: ScoreBall): void {
    ball.targetColor = new THREE.Color(0xffffff);
    ball.colorLerp = 0;

    const material = ball.mesh.material as THREE.MeshPhongMaterial;
    material.emissiveIntensity = 1;
    material.opacity = 1;
  }

  update(): void {
    const now = performance.now();

    for (const ball of this.balls) {
      ball.mesh.rotation.x += ball.rotationSpeed.x;
      ball.mesh.rotation.y += ball.rotationSpeed.y;
      ball.mesh.rotation.z += ball.rotationSpeed.z;

      ball.driftOffset.x = Math.sin(now * 0.001 * ball.driftSpeed) * 0.5;
      ball.driftOffset.z = Math.cos(now * 0.001 * ball.driftSpeed) * 0.5;
      
      ball.mesh.position.x = ball.position.x + ball.driftOffset.x;
      ball.mesh.position.z = ball.position.z + ball.driftOffset.z;

      if (ball.colorLerp < 1) {
        ball.colorLerp += 0.05;
        const material = ball.mesh.material as THREE.MeshPhongMaterial;
        const currentColor = new THREE.Color().lerpColors(ball.targetColor, ball.originalColor, ball.colorLerp);
        material.color.copy(currentColor);
        material.emissive.copy(currentColor.clone().multiplyScalar(0.3));
        material.emissiveIntensity = 0.5 + (1 - ball.colorLerp) * 0.5;
        material.opacity = 0.9 + (1 - ball.colorLerp) * 0.1;
      }
    }
  }

  getBalls(): ScoreBall[] {
    return this.balls;
  }

  destroy(): void {
    for (const ball of this.balls) {
      this.scene.remove(ball.mesh);
      ball.mesh.geometry.dispose();
      (ball.mesh.material as THREE.Material).dispose();
    }
    this.balls = [];
  }
}
