import * as THREE from 'three';

export interface InputState {
  translateI: boolean;
  translateK: boolean;
  translateJ: boolean;
  translateL: boolean;
  pitchU: boolean;
  pitchO: boolean;
  yawY: boolean;
  yawH: boolean;
}

export type RCSDirection =
  | 'forward' | 'backward' | 'left' | 'right'
  | 'up' | 'down' | 'pitchUp' | 'pitchDown'
  | 'yawLeft' | 'yawRight';

export interface SpacecraftState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  attitude: {
    pitch: number;
    yaw: number;
    roll: number;
  };
}

const INITIAL_DISTANCE = 200;
const MAX_TRANSLATION_SPEED = 2.0;
const TRANSLATION_ACCEL = 1.5;
const VELOCITY_DAMPING = 0.98;
const ROTATION_SPEED = 0.8;
const ROTATION_DAMPING = 0.94;

export class Spacecraft {
  private scene: THREE.Scene;
  public group: THREE.Group;
  private state: SpacecraftState;
  private angularVelocity = { pitch: 0, yaw: 0, roll: 0 };
  private particles: THREE.Points;
  private particleData: {
    pos: Float32Array;
    vel: Float32Array;
    life: Float32Array;
    maxLife: Float32Array;
  };
  private particleCount = 200;
  private nextParticle = 0;
  private shakeIntensity = 0;
  private shakeTime = 0;
  private initialPosition: THREE.Vector3;
  private initialQuaternion: THREE.Quaternion;
  private fireworks: THREE.Points | null = null;
  private fireworksData: any = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.initialPosition = new THREE.Vector3(4.5, 0, INITIAL_DISTANCE);
    this.initialQuaternion = new THREE.Quaternion();
    this.state = {
      position: this.initialPosition.clone(),
      velocity: new THREE.Vector3(),
      attitude: { pitch: 0, yaw: 0, roll: 0 }
    };
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.particleCount * 3);
    const col = new Float32Array(this.particleCount * 3);
    const siz = new Float32Array(this.particleCount);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(siz, 1));
    const mat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(geo, mat);
    this.particleData = {
      pos: new Float32Array(this.particleCount * 3),
      vel: new Float32Array(this.particleCount * 3),
      life: new Float32Array(this.particleCount),
      maxLife: new Float32Array(this.particleCount)
    };
    this.build();
  }

  private createHullMaterial(color: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      metalness: 0.92,
      roughness: 0.08
    });
  }

  build(): void {
    const craftGroup = new THREE.Group();
    const hullMat = this.createHullMaterial(0xf5f5fa);
    const accentMat = this.createHullMaterial(0xd8e4f0);
    const heatMat = new THREE.MeshStandardMaterial({
      color: 0x303038,
      metalness: 0.7,
      roughness: 0.2
    });
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x4ac4ff,
      metalness: 0.3,
      roughness: 0.1,
      emissive: 0x1a5080,
      emissiveIntensity: 0.5
    });

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.9, 2.4, 8, 16),
      hullMat
    );
    body.rotation.x = Math.PI / 2;
    craftGroup.add(body);

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 1.4, 16),
      accentMat
    );
    nose.position.z = -1.9;
    nose.rotation.x = -Math.PI / 2;
    craftGroup.add(nose);

    const dockingNozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.55, 0.5, 16),
      accentMat
    );
    dockingNozzle.position.z = -2.5;
    dockingNozzle.rotation.x = Math.PI / 2;
    craftGroup.add(dockingNozzle);

    const dockingRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.08, 8, 20),
      heatMat
    );
    dockingRing.position.z = -2.75;
    craftGroup.add(dockingRing);

    const heatShield = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.95, 0.25, 20),
      heatMat
    );
    heatShield.position.z = 2.4;
    heatShield.rotation.x = Math.PI / 2;
    craftGroup.add(heatShield);

    const engineBell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.6, 0.8, 16),
      heatMat
    );
    engineBell.position.z = 2.9;
    engineBell.rotation.x = Math.PI / 2;
    craftGroup.add(engineBell);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.9, 1.4),
        accentMat
      );
      fin.position.set(
        Math.cos(angle) * 0.95,
        Math.sin(angle) * 0.95,
        1.8
      );
      fin.rotation.z = angle + Math.PI / 2;
      craftGroup.add(fin);
    }

    const windows: Array<[number, number, number]> = [
      [0, 0.55, -0.5],
      [0.48, 0.28, -0.5],
      [-0.48, 0.28, -0.5],
      [0.48, -0.28, -0.5],
      [-0.48, -0.28, -0.5],
      [0, -0.55, -0.5]
    ];
    windows.forEach(([x, y, z]) => {
      const w = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        windowMat
      );
      w.position.set(x, y, z);
      w.rotation.x = -Math.PI / 2;
      craftGroup.add(w);
    });

    const rcsThrusters: Array<[number, number, number, string]> = [
      [0.85, 0.85, 1.2, '+X'],
      [-0.85, 0.85, 1.2, '-X'],
      [0.85, -0.85, 1.2, '+X'],
      [-0.85, -0.85, 1.2, '-X']
    ];
    rcsThrusters.forEach(([x, y, z]) => {
      const t = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.2, 8),
        heatMat
      );
      t.position.set(x, y, z);
      t.rotation.x = Math.PI / 2;
      craftGroup.add(t);
    });

    this.group.add(craftGroup);
    this.scene.add(this.group);
    this.scene.add(this.particles);
    this.group.position.copy(this.initialPosition);
    this.group.quaternion.copy(this.initialQuaternion);
    this.group.rotateY(Math.PI);
  }

  handleInput(input: InputState, delta: number): void {
    const directions: RCSDirection[] = [];
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.group.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.group.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.group.quaternion);

    if (input.translateI) {
      this.state.velocity.add(forward.clone().multiplyScalar(TRANSLATION_ACCEL * delta));
      directions.push('forward');
    }
    if (input.translateK) {
      this.state.velocity.sub(forward.clone().multiplyScalar(TRANSLATION_ACCEL * delta));
      directions.push('backward');
    }
    if (input.translateJ) {
      this.state.velocity.sub(right.clone().multiplyScalar(TRANSLATION_ACCEL * delta));
      directions.push('left');
    }
    if (input.translateL) {
      this.state.velocity.add(right.clone().multiplyScalar(TRANSLATION_ACCEL * delta));
      directions.push('right');
    }

    const speed = this.state.velocity.length();
    if (speed > MAX_TRANSLATION_SPEED) {
      this.state.velocity.multiplyScalar(MAX_TRANSLATION_SPEED / speed);
    }

    if (input.pitchU) {
      this.angularVelocity.pitch += ROTATION_SPEED * delta;
      directions.push('pitchUp');
    }
    if (input.pitchO) {
      this.angularVelocity.pitch -= ROTATION_SPEED * delta;
      directions.push('pitchDown');
    }
    if (input.yawY) {
      this.angularVelocity.yaw += ROTATION_SPEED * delta;
      directions.push('yawLeft');
    }
    if (input.yawH) {
      this.angularVelocity.yaw -= ROTATION_SPEED * delta;
      directions.push('yawRight');
    }

    if (directions.length > 0) {
      this.emitRCSParticles(directions);
    }
  }

  emitRCSParticles(directions: RCSDirection[]): void {
    const back = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
    const leftDir = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.group.quaternion);
    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(this.group.quaternion);
    const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(this.group.quaternion);
    const downDir = new THREE.Vector3(0, -1, 0).applyQuaternion(this.group.quaternion);

    directions.forEach(dir => {
      let emitPos: THREE.Vector3;
      let emitVel: THREE.Vector3;
      const basePos = this.group.position.clone();
      switch (dir) {
        case 'forward':
          emitPos = basePos.clone().add(back.clone().multiplyScalar(2.8));
          emitVel = back.clone().multiplyScalar(8 + Math.random() * 4);
          break;
        case 'backward':
          emitPos = basePos.clone().add(back.clone().multiplyScalar(-2));
          emitVel = back.clone().multiplyScalar(-8);
          break;
        case 'left':
          emitPos = basePos.clone().add(rightDir.clone().multiplyScalar(0.9));
          emitVel = rightDir.clone().multiplyScalar(6);
          break;
        case 'right':
          emitPos = basePos.clone().add(leftDir.clone().multiplyScalar(0.9));
          emitVel = leftDir.clone().multiplyScalar(6);
          break;
        case 'pitchUp':
          emitPos = basePos.clone().add(upDir.clone().multiplyScalar(0.85)).add(back.clone().multiplyScalar(1.2));
          emitVel = upDir.clone().multiplyScalar(5);
          break;
        case 'pitchDown':
          emitPos = basePos.clone().add(downDir.clone().multiplyScalar(0.85)).add(back.clone().multiplyScalar(1.2));
          emitVel = downDir.clone().multiplyScalar(5);
          break;
        case 'yawLeft':
          emitPos = basePos.clone().add(rightDir.clone().multiplyScalar(0.85)).add(back.clone().multiplyScalar(1.2));
          emitVel = rightDir.clone().multiplyScalar(5);
          break;
        case 'yawRight':
          emitPos = basePos.clone().add(leftDir.clone().multiplyScalar(0.85)).add(back.clone().multiplyScalar(1.2));
          emitVel = leftDir.clone().multiplyScalar(5);
          break;
      }
      for (let j = 0; j < 3; j++) {
        const idx = this.nextParticle % this.particleCount;
        const i3 = idx * 3;
        this.particleData.pos[i3] = emitPos.x + (Math.random() - 0.5) * 0.1;
        this.particleData.pos[i3 + 1] = emitPos.y + (Math.random() - 0.5) * 0.1;
        this.particleData.pos[i3 + 2] = emitPos.z + (Math.random() - 0.5) * 0.1;
        this.particleData.vel[i3] = emitVel.x + (Math.random() - 0.5) * 2;
        this.particleData.vel[i3 + 1] = emitVel.y + (Math.random() - 0.5) * 2;
        this.particleData.vel[i3 + 2] = emitVel.z + (Math.random() - 0.5) * 2;
        this.particleData.maxLife[idx] = 0.35 + Math.random() * 0.25;
        this.particleData.life[idx] = this.particleData.maxLife[idx];
        this.nextParticle++;
      }
    });
  }

  update(delta: number): SpacecraftState & { speed: number } {
    this.state.velocity.multiplyScalar(VELOCITY_DAMPING);
    this.state.position.add(this.state.velocity.clone().multiplyScalar(delta));

    this.angularVelocity.pitch *= ROTATION_DAMPING;
    this.angularVelocity.yaw *= ROTATION_DAMPING;
    this.angularVelocity.roll *= ROTATION_DAMPING;
    this.state.attitude.pitch += this.angularVelocity.pitch * delta;
    this.state.attitude.yaw += this.angularVelocity.yaw * delta;

    const qPitch = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      this.angularVelocity.pitch * delta
    );
    const qYaw = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.angularVelocity.yaw * delta
    );
    this.group.quaternion.premultiply(qYaw).premultiply(qPitch);

    if (this.shakeTime > 0) {
      this.shakeTime -= delta;
      const s = this.shakeIntensity * (this.shakeTime / 0.5);
      this.group.position.x = this.state.position.x + (Math.random() - 0.5) * s;
      this.group.position.y = this.state.position.y + (Math.random() - 0.5) * s;
      this.group.position.z = this.state.position.z + (Math.random() - 0.5) * s;
    } else {
      this.group.position.copy(this.state.position);
    }

    const posAttr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.particles.geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizAttr = this.particles.geometry.getAttribute('size') as THREE.BufferAttribute;
    for (let i = 0; i < this.particleCount; i++) {
      if (this.particleData.life[i] > 0) {
        this.particleData.life[i] -= delta;
        const i3 = i * 3;
        this.particleData.pos[i3] += this.particleData.vel[i3] * delta;
        this.particleData.pos[i3 + 1] += this.particleData.vel[i3 + 1] * delta;
        this.particleData.pos[i3 + 2] += this.particleData.vel[i3 + 2] * delta;
        posAttr.array[i3] = this.particleData.pos[i3];
        posAttr.array[i3 + 1] = this.particleData.pos[i3 + 1];
        posAttr.array[i3 + 2] = this.particleData.pos[i3 + 2];
        const t = this.particleData.life[i] / this.particleData.maxLife[i];
        const r = 0.3 + 0.4 * (1 - t);
        const g = 0.6 + 0.4 * t;
        const b = 1.0;
        colAttr.array[i3] = r;
        colAttr.array[i3 + 1] = g;
        colAttr.array[i3 + 2] = b;
        (sizAttr.array as Float32Array)[i] = 0.18 * t;
      } else {
        const i3 = i * 3;
        posAttr.array[i3] = posAttr.array[i3 + 1] = posAttr.array[i3 + 2] = 99999;
        (sizAttr.array as Float32Array)[i] = 0;
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizAttr.needsUpdate = true;

    this.updateFireworks(delta);

    return {
      ...this.state,
      speed: this.state.velocity.length()
    };
  }

  triggerCollisionShake(): void {
    this.shakeIntensity = 2.5;
    this.shakeTime = 0.5;
  }

  resetPosition(): void {
    this.state.position.copy(this.initialPosition);
    this.state.velocity.set(0, 0, 0);
    this.state.attitude = { pitch: 0, yaw: 0, roll: 0 };
    this.angularVelocity = { pitch: 0, yaw: 0, roll: 0 };
    this.group.quaternion.identity();
    this.group.rotateY(Math.PI);
    this.group.position.copy(this.initialPosition);
  }

  spawnFireworks(count: number = 300): void {
    if (this.fireworks) {
      this.scene.remove(this.fireworks);
    }
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(siz, 1));
    const mat = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.fireworks = new THREE.Points(geo, mat);
    const vel = new Float32Array(count * 3);
    const life = new Float32Array(count);
    const maxLife = new Float32Array(count);
    const center = this.group.position.clone();
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 5 + Math.random() * 8;
      vel[i3] = (r * Math.sin(phi) * Math.cos(theta)) / 1.5;
      vel[i3 + 1] = (r * Math.sin(phi) * Math.sin(theta)) / 1.5;
      vel[i3 + 2] = (r * Math.cos(phi)) / 1.5;
      pos[i3] = center.x;
      pos[i3 + 1] = center.y;
      pos[i3 + 2] = center.z;
      const hue = 0.1 + Math.random() * 0.08;
      const c = new THREE.Color().setHSL(hue, 1, 0.6);
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
      siz[i] = 0.25 + Math.random() * 0.2;
      maxLife[i] = 1.2 + Math.random() * 1;
      life[i] = maxLife[i];
    }
    this.fireworksData = { pos, vel, col, siz, life, maxLife, center };
    this.scene.add(this.fireworks);
  }

  private updateFireworks(delta: number): void {
    if (!this.fireworks || !this.fireworksData) return;
    const { pos, vel, col, siz, life, maxLife } = this.fireworksData;
    const posAttr = this.fireworks.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.fireworks.geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizAttr = this.fireworks.geometry.getAttribute('size') as THREE.BufferAttribute;
    const count = life.length;
    let allDead = true;
    for (let i = 0; i < count; i++) {
      if (life[i] > 0) {
        allDead = false;
        life[i] -= delta;
        const i3 = i * 3;
        pos[i3] += vel[i3] * delta;
        pos[i3 + 1] += vel[i3 + 1] * delta;
        pos[i3 + 2] += vel[i3 + 2] * delta;
        vel[i3 + 1] -= 0.5 * delta;
        posAttr.array[i3] = pos[i3];
        posAttr.array[i3 + 1] = pos[i3 + 1];
        posAttr.array[i3 + 2] = pos[i3 + 2];
        const t = Math.max(0, life[i] / maxLife[i]);
        (sizAttr.array as Float32Array)[i] = siz[i] * t;
        colAttr.array[i3] = col[i3] * (0.4 + 0.6 * t);
        colAttr.array[i3 + 1] = col[i3 + 1] * (0.4 + 0.6 * t);
        colAttr.array[i3 + 2] = col[i3 + 2] * (0.4 + 0.6 * t);
      } else {
        const i3 = i * 3;
        posAttr.array[i3] = posAttr.array[i3 + 1] = posAttr.array[i3 + 2] = 99999;
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizAttr.needsUpdate = true;
    if (allDead) {
      this.scene.remove(this.fireworks);
      this.fireworks = null;
      this.fireworksData = null;
    }
  }
}
