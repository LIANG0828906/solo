import * as THREE from 'three';
import type { IslandData, Projectile } from './types';
import { ParticleEffects } from './particleEffects';
import { IslandGenerator } from './islandGenerator';
import { AirshipControl } from './airshipControl';

export class CollisionManager {
  private scene: THREE.Scene;
  private particleEffects: ParticleEffects;
  private islandGenerator: IslandGenerator;
  private airship: AirshipControl;
  private projectiles: Projectile[] = [];
  private onScoreUpdate?: (score: number) => void;
  private onFlashBorder?: (color: string) => void;

  constructor(
    scene: THREE.Scene,
    particleEffects: ParticleEffects,
    islandGenerator: IslandGenerator,
    airship: AirshipControl
  ) {
    this.scene = scene;
    this.particleEffects = particleEffects;
    this.islandGenerator = islandGenerator;
    this.airship = airship;
  }

  setScoreCallback(callback: (score: number) => void): void {
    this.onScoreUpdate = callback;
  }

  setFlashBorderCallback(callback: (color: string) => void): void {
    this.onFlashBorder = callback;
  }

  update(dt: number, currentScore: number): number {
    const airshipPos = this.airship.getPosition();
    const islands = this.islandGenerator.getIslands();
    let score = currentScore;

    for (const island of islands) {
      const dist = airshipPos.distanceTo(island.position);

      if (dist < island.colliderRadius + 2) {
        if (island.cooldown <= 0) {
          this.triggerElementEffect(island);
          island.cooldown = 8;
          this.islandGenerator.triggerGlowFlash(island);
          this.flashBorder(island.color);
        }
      }

      if (island.hasTreasure && !island.treasureCollected && island.treasureMesh) {
        const treasureWorldPos = new THREE.Vector3();
        island.treasureMesh.getWorldPosition(treasureWorldPos);
        const treasureDist = airshipPos.distanceTo(treasureWorldPos);

        if (treasureDist < 2) {
          this.islandGenerator.collectTreasure(island);
          score += 10;
          if (this.onScoreUpdate) {
            this.onScoreUpdate(score);
          }
          this.particleEffects.spawnCoinParticles(treasureWorldPos, 5);
          this.particleEffects.spawnExplosion(treasureWorldPos, new THREE.Color(0xffd54f), 50);
        }
      }
    }

    this.updateProjectiles(dt, islands);

    return score;
  }

  private triggerElementEffect(island: IslandData): void {
    switch (island.element) {
      case 'wind':
        this.airship.activateSpeedBoost(3);
        this.particleEffects.spawnExplosion(this.airship.getPosition(), island.color, 80);
        break;
      case 'fire':
        this.fireProjectile(island.color);
        this.airship.activateAttack(3);
        break;
      case 'water':
        this.airship.activateShield(5);
        this.particleEffects.spawnExplosion(this.airship.getPosition(), island.color, 100);
        break;
      case 'earth':
        this.airship.activateBuoyancy(4);
        this.particleEffects.spawnExplosion(this.airship.getPosition(), island.color, 60);
        break;
    }
  }

  private fireProjectile(color: THREE.Color): void {
    const startPos = this.airship.getPosition();
    const direction = this.airship.getForwardDirection();

    const geo = new THREE.SphereGeometry(0.5, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff1744
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    mesh.position.add(direction.clone().multiplyScalar(2));

    const vel = direction.clone().multiplyScalar(8);

    this.projectiles.push({
      mesh,
      velocity: vel,
      life: 5
    });

    this.scene.add(mesh);
  }

  private updateProjectiles(dt: number, islands: IslandData[]): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
        continue;
      }

      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));

      for (const island of islands) {
        const dist = p.mesh.position.distanceTo(island.position);
        if (dist < island.colliderRadius) {
          this.particleEffects.spawnExplosion(p.mesh.position.clone(), new THREE.Color(0xff1744), 30);
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          (p.mesh.material as THREE.Material).dispose();
          this.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  private flashBorder(color: THREE.Color): void {
    if (!this.onFlashBorder) return;
    const hexColor = '#' + color.getHexString();
    this.onFlashBorder(hexColor);
  }

  getProjectiles(): Projectile[] {
    return this.projectiles;
  }

  dispose(): void {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    this.projectiles = [];
  }
}
