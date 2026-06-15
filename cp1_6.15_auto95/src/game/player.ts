import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import type { EnemyState, Projectile } from '@/game/types';

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  dodge: boolean;
  meleeAttack: boolean;
  rangedAttack: boolean;
  mouseWorldPos: THREE.Vector3;
}

export class PlayerController {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private store: ReturnType<typeof useGameStore>;

  private group: THREE.Group;
  private bodyMesh: THREE.Mesh;
  private topCap: THREE.Mesh;
  private bottomCap: THREE.Mesh;
  private sword: THREE.Group;
  private swordBlade: THREE.Mesh;

  private position: THREE.Vector3;
  private facingAngle: number;
  private moveSpeed: number = 5;

  private isDodging: boolean;
  private dodgeTimer: number;
  private dodgeDuration: number = 0.3;
  private dodgeDirection: THREE.Vector3;
  private dodgeSpeed: number = 18;
  private isInvincible: boolean;

  private meleeCooldown: number;
  private meleeCooldownMax: number = 0.4;
  private meleeSwingTimer: number;
  private meleeSwingDuration: number = 0.2;

  private rangedCooldown: number;
  private rangedCooldownMax: number = 0.5;

  private isDead: boolean;
  private deathTimer: number;

  private damageFlashOverlay: HTMLElement | null;
  private damageFlashTimer: number;

  private newProjectiles: Projectile[];

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, store: ReturnType<typeof useGameStore>) {
    this.scene = scene;
    this.camera = camera;
    this.store = store;

    this.position = new THREE.Vector3(0, 0, 0);
    this.facingAngle = 0;

    this.isDodging = false;
    this.dodgeTimer = 0;
    this.dodgeDirection = new THREE.Vector3();
    this.isInvincible = false;

    this.meleeCooldown = 0;
    this.meleeSwingTimer = 0;

    this.rangedCooldown = 0;

    this.isDead = false;
    this.deathTimer = 0;

    this.damageFlashOverlay = null;
    this.damageFlashTimer = 0;

    this.newProjectiles = [];

    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488ff });
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.6;
    this.group.add(this.bodyMesh);

    const capGeo = new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    this.topCap = new THREE.Mesh(capGeo, bodyMat);
    this.topCap.position.y = 1.2;
    this.topCap.rotation.x = 0;
    this.group.add(this.topCap);

    this.bottomCap = new THREE.Mesh(capGeo.clone(), bodyMat);
    this.bottomCap.position.y = 0;
    this.bottomCap.rotation.x = Math.PI;
    this.group.add(this.bottomCap);

    this.sword = new THREE.Group();
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const bladeGeo = new THREE.BoxGeometry(0.08, 0.08, 1.0);
    this.swordBlade = new THREE.Mesh(bladeGeo, bladeMat);
    this.swordBlade.position.z = 0.5;
    this.sword.add(this.swordBlade);

    const hiltMat = new THREE.MeshStandardMaterial({ color: 0x886633 });
    const hiltGeo = new THREE.BoxGeometry(0.3, 0.06, 0.1);
    const hilt = new THREE.Mesh(hiltGeo, hiltMat);
    hilt.position.z = -0.05;
    this.sword.add(hilt);

    const handleMat = new THREE.MeshStandardMaterial({ color: 0x553311 });
    const handleGeo = new THREE.BoxGeometry(0.06, 0.06, 0.2);
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.z = -0.2;
    this.sword.add(handle);

    this.sword.position.set(0.5, 0.8, 0);
    this.sword.rotation.y = -Math.PI / 6;
    this.group.add(this.sword);

    this.group.position.copy(this.position);
    scene.add(this.group);

    this.createDamageFlashOverlay();
  }

  private createDamageFlashOverlay(): void {
    this.damageFlashOverlay = document.createElement('div');
    this.damageFlashOverlay.style.position = 'fixed';
    this.damageFlashOverlay.style.top = '0';
    this.damageFlashOverlay.style.left = '0';
    this.damageFlashOverlay.style.width = '100%';
    this.damageFlashOverlay.style.height = '100%';
    this.damageFlashOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
    this.damageFlashOverlay.style.pointerEvents = 'none';
    this.damageFlashOverlay.style.zIndex = '9999';
    this.damageFlashOverlay.style.transition = 'background-color 0.1s ease-out';
    document.body.appendChild(this.damageFlashOverlay);
  }

  update(dt: number, inputState: InputState, enemies: EnemyState[]): Projectile[] {
    this.newProjectiles = [];

    if (this.isDead) {
      this.updateDeath(dt);
      this.updateCamera();
      return this.newProjectiles;
    }

    this.updateMovement(dt, inputState);
    this.updateDodge(dt, inputState);
    this.updateMeleeAttack(dt, inputState, enemies);
    this.updateRangedAttack(dt, inputState);
    this.updateDamageFlash(dt);
    this.updateSwordAnimation(dt);
    this.updateCamera();

    return this.newProjectiles;
  }

  private updateMovement(dt: number, input: InputState): void {
    if (this.isDodging) return;

    const dir = new THREE.Vector3();
    if (input.forward) dir.z -= 1;
    if (input.backward) dir.z += 1;
    if (input.left) dir.x -= 1;
    if (input.right) dir.x += 1;

    if (dir.lengthSq() > 0) {
      dir.normalize();
      this.position.addScaledVector(dir, this.moveSpeed * dt);

      this.facingAngle = Math.atan2(dir.x, dir.z);
    }

    if (input.mouseWorldPos) {
      const toMouse = new THREE.Vector3().subVectors(input.mouseWorldPos, this.position);
      toMouse.y = 0;
      if (toMouse.lengthSq() > 0.01) {
        this.facingAngle = Math.atan2(toMouse.x, toMouse.z);
      }
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.facingAngle;
  }

  private updateDodge(dt: number, input: InputState): void {
    if (this.isDodging) {
      this.dodgeTimer -= dt;
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.isInvincible = false;
        this.bodyMesh.material.opacity = 1;
        (this.bodyMesh.material as THREE.MeshStandardMaterial).transparent = false;
      } else {
        this.position.addScaledVector(this.dodgeDirection, this.dodgeSpeed * dt);
        this.group.position.copy(this.position);

        const blink = Math.sin(this.dodgeTimer * 30) > 0;
        (this.bodyMesh.material as THREE.MeshStandardMaterial).transparent = true;
        (this.bodyMesh.material as THREE.MeshStandardMaterial).opacity = blink ? 0.3 : 1;
      }
      return;
    }

    if (input.dodge) {
      this.isDodging = true;
      this.isInvincible = true;
      this.dodgeTimer = this.dodgeDuration;

      const dir = new THREE.Vector3();
      if (input.forward) dir.z -= 1;
      if (input.backward) dir.z += 1;
      if (input.left) dir.x -= 1;
      if (input.right) dir.x += 1;

      if (dir.lengthSq() > 0) {
        dir.normalize();
      } else {
        dir.set(0, 0, -1);
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.facingAngle);
      }
      this.dodgeDirection.copy(dir);
    }
  }

  private updateMeleeAttack(dt: number, input: InputState, enemies: EnemyState[]): void {
    if (this.meleeCooldown > 0) {
      this.meleeCooldown -= dt;
    }

    if (this.meleeSwingTimer > 0) {
      this.meleeSwingTimer -= dt;
      if (this.meleeSwingTimer <= 0) {
        this.sword.rotation.y = -Math.PI / 6;
      }
    }

    if (input.meleeAttack && this.meleeCooldown <= 0 && !this.isDodging) {
      this.meleeCooldown = this.meleeCooldownMax;
      this.meleeSwingTimer = this.meleeSwingDuration;

      const playerAttack = this.store.getState().player.attack;
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.facingAngle);

      for (const enemy of enemies) {
        const toEnemy = new THREE.Vector3(
          enemy.position.x - this.position.x,
          0,
          enemy.position.z - this.position.z
        );
        const dist = toEnemy.length();
        if (dist > 1.5) continue;

        toEnemy.normalize();
        const dot = forward.dot(toEnemy);
        const fanAngle = Math.PI / 3;
        const angle = Math.acos(THREE.MathUtils.clamp(dot, -1, 1));

        if (angle <= fanAngle / 2) {
          if (enemy.takeDamage) {
            enemy.takeDamage(playerAttack);
          }
        }
      }
    }
  }

  private updateRangedAttack(dt: number, input: InputState): void {
    if (this.rangedCooldown > 0) {
      this.rangedCooldown -= dt;
    }

    if (input.rangedAttack && this.rangedCooldown <= 0 && !this.isDodging) {
      const state = this.store.getState();
      if (state.player.energy >= 10) {
        state.player.energy -= 10;
        this.rangedCooldown = this.rangedCooldownMax;

        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.facingAngle);
        const spawnPos = this.position.clone().add(forward.clone().multiplyScalar(0.8));
        spawnPos.y = 0.8;

        const projectile: Projectile = {
          id: `player_bolt_${Date.now()}_${Math.random()}`,
          position: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
          velocity: { x: forward.x * 20, y: 0, z: forward.z * 20 },
          damage: state.player.attack * 0.8,
          owner: 'player',
          lifetime: 3,
          age: 0,
          type: 'energyBolt',
          radius: 0.2,
          onHit: () => {},
          mesh: null,
        };

        const boltGeo = new THREE.SphereGeometry(0.15, 12, 8);
        const boltMat = new THREE.MeshStandardMaterial({
          color: 0x44aaff,
          emissive: 0x2266ff,
          emissiveIntensity: 2,
        });
        const boltMesh = new THREE.Mesh(boltGeo, boltMat);
        boltMesh.position.copy(spawnPos);

        const glowGeo = new THREE.SphereGeometry(0.25, 8, 6);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0x88ccff,
          transparent: true,
          opacity: 0.4,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        boltMesh.add(glow);

        const light = new THREE.PointLight(0x4488ff, 2, 5);
        boltMesh.add(light);

        this.scene.add(boltMesh);
        projectile.mesh = boltMesh;

        this.newProjectiles.push(projectile);
      }
    }
  }

  private updateSwordAnimation(dt: number): void {
    if (this.meleeSwingTimer > 0) {
      const t = 1 - this.meleeSwingTimer / this.meleeSwingDuration;
      const swingAngle = -Math.PI / 6 + t * Math.PI * 0.8;
      this.sword.rotation.y = swingAngle;
    }
  }

  private updateDamageFlash(dt: number): void {
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= dt;
      const alpha = THREE.MathUtils.clamp(this.damageFlashTimer / 0.3, 0, 0.5);
      if (this.damageFlashOverlay) {
        this.damageFlashOverlay.style.backgroundColor = `rgba(255, 0, 0, ${alpha})`;
      }
      if (this.damageFlashTimer <= 0 && this.damageFlashOverlay) {
        this.damageFlashOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
      }
    }
  }

  private updateDeath(dt: number): void {
    this.deathTimer += dt;
    const fallProgress = THREE.MathUtils.clamp(this.deathTimer / 0.6, 0, 1);
    this.group.rotation.x = fallProgress * (Math.PI / 2);
    this.group.position.y = -fallProgress * 0.3;

    if (fallProgress >= 1) {
      (this.bodyMesh.material as THREE.MeshStandardMaterial).transparent = true;
      (this.bodyMesh.material as THREE.MeshStandardMaterial).opacity =
        THREE.MathUtils.clamp(1 - (this.deathTimer - 0.6) / 1.0, 0, 1);
    }
  }

  private updateCamera(): void {
    const distance = 10;
    const height = distance * Math.tan(THREE.MathUtils.degToRad(45));
    const offset = new THREE.Vector3(0, height, distance);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.facingAngle);

    const targetPos = this.position.clone().add(offset);
    this.camera.position.lerp(targetPos, 0.1);
    this.camera.lookAt(this.position.x, 0.5, this.position.z);
  }

  takeDamage(amount: number): void {
    if (this.isInvincible || this.isDead) return;

    const state = this.store.getState();
    const newHp = Math.max(0, state.player.hp - amount);
    state.player.hp = newHp;

    this.damageFlashTimer = 0.3;

    const hitMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.5 });
    this.bodyMesh.material = hitMat;
    setTimeout(() => {
      this.bodyMesh.material = new THREE.MeshStandardMaterial({ color: 0x4488ff });
    }, 100);

    if (newHp <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.isDead = true;
    this.deathTimer = 0;
    const state = this.store.getState();
    if (state.setGameOver) {
      state.setGameOver(true);
    }
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getIsDodging(): boolean {
    return this.isDodging;
  }

  getIsDead(): boolean {
    return this.isDead;
  }

  dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    this.scene.remove(this.group);
    if (this.damageFlashOverlay && this.damageFlashOverlay.parentNode) {
      this.damageFlashOverlay.parentNode.removeChild(this.damageFlashOverlay);
    }
  }
}
