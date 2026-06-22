import * as THREE from 'three';
import type { AirshipState } from './types';

export class AirshipControl {
  private scene: THREE.Scene;
  private airshipGroup: THREE.Group;
  private state: AirshipState;
  private keys: Record<string, boolean> = {};
  private shieldMesh?: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.state = {
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(),
      yaw: 0,
      pitch: 0,
      roll: 0,
      targetYaw: 0,
      targetPitch: 0,
      targetRoll: 0,
      baseSpeed: 12,
      currentSpeed: 12,
      verticalSpeed: 6,
      speedBoost: false,
      speedBoostTimer: 0,
      shieldActive: false,
      shieldTimer: 0,
      buoyancyBoost: false,
      buoyancyBoostTimer: 0,
      attackActive: false,
      attackTimer: 0
    };

    this.airshipGroup = this.createAirship();
    this.scene.add(this.airshipGroup);

    this.bindEvents();
  }

  private createAirship(): THREE.Group {
    const group = new THREE.Group();

    const bodyGeo = new THREE.SphereGeometry(1.5, 16, 12);
    bodyGeo.scale(1, 0.7, 1.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a237e,
      metalness: 0.6,
      roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    const sailGeo = new THREE.PlaneGeometry(2.5, 3);
    const sailMat = new THREE.MeshStandardMaterial({
      color: 0x7c4dff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });

    const leftSail = new THREE.Mesh(sailGeo, sailMat);
    leftSail.position.set(-1.8, 0.5, 0);
    leftSail.rotation.y = Math.PI / 4;
    group.add(leftSail);

    const rightSail = new THREE.Mesh(sailGeo, sailMat);
    rightSail.position.set(1.8, 0.5, 0);
    rightSail.rotation.y = -Math.PI / 4;
    group.add(rightSail);

    const basketGeo = new THREE.BoxGeometry(1.2, 0.8, 1.5);
    const basketMat = new THREE.MeshStandardMaterial({
      color: 0x4e342e,
      roughness: 0.8,
      metalness: 0.1
    });
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.y = -2;
    group.add(basket);

    const ropeMat = new THREE.LineBasicMaterial({ color: 0x8d6e63 });
    const ropePositions = [
      new THREE.Vector3(-0.6, -0.8, 0.7),
      new THREE.Vector3(-0.4, -1.6, 0.6),
      new THREE.Vector3(0.6, -0.8, 0.7),
      new THREE.Vector3(0.4, -1.6, 0.6),
      new THREE.Vector3(-0.6, -0.8, -0.7),
      new THREE.Vector3(-0.4, -1.6, -0.6),
      new THREE.Vector3(0.6, -0.8, -0.7),
      new THREE.Vector3(0.4, -1.6, -0.6)
    ];

    for (let i = 0; i < ropePositions.length; i += 2) {
      const ropeGeo = new THREE.BufferGeometry().setFromPoints([
        ropePositions[i],
        ropePositions[i + 1]
      ]);
      const rope = new THREE.Line(ropeGeo, ropeMat);
      group.add(rope);
    }

    const shieldGeo = new THREE.SphereGeometry(3, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    group.add(this.shieldMesh);

    return group;
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'r') {
        this.resetPosition();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  update(dt: number): void {
    this.updateBoostTimers(dt);
    this.handleInput(dt);
    this.applyPhysics(dt);
    this.updateRotation(dt);
    this.updateMesh();
    this.updateShieldVisual(dt);
  }

  private updateBoostTimers(dt: number): void {
    if (this.state.speedBoost) {
      this.state.speedBoostTimer -= dt;
      if (this.state.speedBoostTimer <= 0) {
        this.state.speedBoost = false;
        this.state.currentSpeed = this.state.baseSpeed;
      }
    }

    if (this.state.shieldActive) {
      this.state.shieldTimer -= dt;
      if (this.state.shieldTimer <= 0) {
        this.state.shieldActive = false;
      }
    }

    if (this.state.buoyancyBoost) {
      this.state.buoyancyBoostTimer -= dt;
      if (this.state.buoyancyBoostTimer <= 0) {
        this.state.buoyancyBoost = false;
      }
    }

    if (this.state.attackActive) {
      this.state.attackTimer -= dt;
      if (this.state.attackTimer <= 0) {
        this.state.attackActive = false;
      }
    }
  }

  private handleInput(dt: number): void {
    const yawSpeed = 1.5;
    const pitchSpeed = 1.0;

    if (this.keys['a']) {
      this.state.targetYaw += yawSpeed * dt;
      this.state.targetRoll = 0.26;
    } else if (this.keys['d']) {
      this.state.targetYaw -= yawSpeed * dt;
      this.state.targetRoll = -0.26;
    } else {
      this.state.targetRoll *= 0.9;
    }

    if (this.keys['q']) {
      this.state.targetPitch = 0.2;
    } else if (this.keys['e']) {
      this.state.targetPitch = -0.2;
    } else {
      this.state.targetPitch *= 0.9;
    }

    let speed = this.state.speedBoost ? 16 : this.state.baseSpeed;

    if (this.keys['w']) {
      this.state.currentSpeed = speed;
    } else if (this.keys['s']) {
      this.state.currentSpeed = -speed * 0.5;
    } else {
      this.state.currentSpeed *= 0.95;
    }
  }

  private applyPhysics(dt: number): void {
    const forward = new THREE.Vector3(
      -Math.sin(this.state.yaw),
      0,
      -Math.cos(this.state.yaw)
    );

    const moveSpeed = this.state.currentSpeed * dt;
    this.state.position.add(forward.multiplyScalar(moveSpeed));

    let verticalVel = 0;
    if (this.keys['q']) {
      verticalVel = this.state.verticalSpeed;
    } else if (this.keys['e']) {
      verticalVel = -this.state.verticalSpeed;
    }

    if (this.state.buoyancyBoost) {
      verticalVel += 3;
      this.state.position.x += (Math.random() - 0.5) * 0.05;
      this.state.position.z += (Math.random() - 0.5) * 0.05;
    }

    this.state.position.y += verticalVel * dt;
  }

  private updateRotation(dt: number): void {
    const yawDiff = this.state.targetYaw - this.state.yaw;
    this.state.yaw += yawDiff * Math.min(1, dt * 8);

    const pitchDiff = this.state.targetPitch - this.state.pitch;
    this.state.pitch += pitchDiff * Math.min(1, dt * 6);

    const rollDiff = this.state.targetRoll - this.state.roll;
    this.state.roll += rollDiff * Math.min(1, dt * 6);

    this.state.targetPitch *= 0.92;
  }

  private updateMesh(): void {
    this.airshipGroup.position.copy(this.state.position);
    this.airshipGroup.rotation.y = this.state.yaw;
    this.airshipGroup.rotation.x = this.state.pitch;
    this.airshipGroup.rotation.z = this.state.roll;
  }

  private updateShieldVisual(dt: number): void {
    if (!this.shieldMesh) return;
    const mat = this.shieldMesh.material as THREE.MeshBasicMaterial;
    const targetOpacity = this.state.shieldActive ? 0.4 : 0;
    mat.opacity += (targetOpacity - mat.opacity) * Math.min(1, dt * 5);

    if (this.state.shieldActive) {
      this.shieldMesh.rotation.y += dt * 0.5;
      this.shieldMesh.rotation.x += dt * 0.3;
    }
  }

  activateSpeedBoost(duration: number): void {
    this.state.speedBoost = true;
    this.state.speedBoostTimer = duration;
    this.state.currentSpeed = 16;
  }

  activateShield(duration: number): void {
    this.state.shieldActive = true;
    this.state.shieldTimer = duration;
  }

  activateBuoyancy(duration: number): void {
    this.state.buoyancyBoost = true;
    this.state.buoyancyBoostTimer = duration;
  }

  activateAttack(duration: number): void {
    this.state.attackActive = true;
    this.state.attackTimer = duration;
  }

  resetPosition(): void {
    this.state.position.set(0, 0, 0);
    this.state.yaw = 0;
    this.state.pitch = 0;
    this.state.roll = 0;
    this.state.targetYaw = 0;
    this.state.targetPitch = 0;
    this.state.targetRoll = 0;
    this.state.currentSpeed = this.state.baseSpeed;
    this.state.speedBoost = false;
    this.state.speedBoostTimer = 0;
    this.state.shieldActive = false;
    this.state.shieldTimer = 0;
    this.state.buoyancyBoost = false;
    this.state.buoyancyBoostTimer = 0;
    this.state.attackActive = false;
    this.state.attackTimer = 0;
  }

  getPosition(): THREE.Vector3 {
    return this.state.position.clone();
  }

  getForwardDirection(): THREE.Vector3 {
    return new THREE.Vector3(
      -Math.sin(this.state.yaw),
      Math.sin(this.state.pitch),
      -Math.cos(this.state.yaw)
    ).normalize();
  }

  getState(): AirshipState {
    return { ...this.state };
  }

  isThrustActive(): boolean {
    return this.keys['w'] || this.state.speedBoost;
  }

  hasShield(): boolean {
    return this.state.shieldActive;
  }

  hasAttack(): boolean {
    return this.state.attackActive;
  }

  dispose(): void {
    this.scene.remove(this.airshipGroup);
  }

  getMesh(): THREE.Group {
    return this.airshipGroup;
  }
}
