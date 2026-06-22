import * as THREE from 'three';
import { River } from './river';

export interface RaftState {
  position: THREE.Vector3;
  rotation: number;
  speed: number;
  currentT: number;
  isPoling: boolean;
  poleAngle: number;
  poleForce: number;
  collisionCount: number;
  poleCount: number;
  isStunned: boolean;
  stunTimer: number;
  inVortex: boolean;
  vortexEscapeCount: number;
  totalDistance: number;
}

export class Raft {
  public group: THREE.Group;
  public state: RaftState;
  public poleGroup: THREE.Group;
  private bambooPoles: THREE.Mesh[] = [];
  private ropeLines: THREE.Line[] = [];
  private splashParticles: THREE.Points | null = null;
  private splashTimer: number = 0;
  private bobPhase: number = 0;
  private raftRadius: number = 1.5;

  constructor(private river: River, private scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.state = {
      position: river.getPositionAtT(0.02).clone(),
      rotation: 0,
      speed: 0,
      currentT: 0.02,
      isPoling: false,
      poleAngle: 0,
      poleForce: 0,
      collisionCount: 0,
      poleCount: 0,
      isStunned: false,
      stunTimer: 0,
      inVortex: false,
      vortexEscapeCount: 0,
      totalDistance: 0
    };

    this.buildRaft();
    this.buildPole();

    this.group.position.copy(this.state.position);
    this.group.position.y = 0.3;
    scene.add(this.group);
  }

  private buildRaft(): void {
    const bambooMat = new THREE.MeshLambertMaterial({ color: 0xC4A44A });
    const bambooDarkMat = new THREE.MeshLambertMaterial({ color: 0x9A8432 });

    for (let i = 0; i < 8; i++) {
      const geo = new THREE.CylinderGeometry(0.12, 0.1, 4, 8);
      const pole = new THREE.Mesh(geo, i % 2 === 0 ? bambooMat : bambooDarkMat);
      pole.rotation.z = Math.PI / 2;
      pole.position.z = (i - 3.5) * 0.28;
      pole.position.y = 0;
      this.bambooPoles.push(pole);
      this.group.add(pole);
    }

    const crossPoleMat = new THREE.MeshLambertMaterial({ color: 0xA08830 });
    for (let c = 0; c < 2; c++) {
      const crossGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6);
      const cross = new THREE.Mesh(crossGeo, crossPoleMat);
      cross.position.x = c === 0 ? -1.2 : 1.2;
      cross.position.y = 0.12;
      this.group.add(cross);
    }

    const ropeMat = new THREE.LineBasicMaterial({ color: 0x8B6914, linewidth: 2 });
    const ropePositions = [-1.2, -0.4, 0.4, 1.2];
    ropePositions.forEach(x => {
      const points: THREE.Vector3[] = [];
      for (let j = 0; j < 8; j++) {
        points.push(new THREE.Vector3(
          x + Math.sin(j * 0.8) * 0.05,
          0.15 + Math.cos(j * 1.2) * 0.03,
          (j - 3.5) * 0.28
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, ropeMat);
      this.ropeLines.push(line);
      this.group.add(line);
    });
  }

  private buildPole(): void {
    this.poleGroup = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.06, 5, 6);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x6B4226 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = -2.5;
    this.poleGroup.add(pole);
    this.poleGroup.position.set(0, 0.5, -0.5);
    this.poleGroup.visible = false;
    this.group.add(this.poleGroup);
  }

  createSplash(): void {
    if (this.splashParticles) {
      this.scene.remove(this.splashParticles);
      this.splashParticles.geometry.dispose();
    }

    const count = 200;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    const tangent = this.river.getTangentAtT(this.state.currentT);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const splashPos = this.state.position.clone().add(tangent.multiplyScalar(-1));

    for (let i = 0; i < count; i++) {
      positions[i * 3] = splashPos.x;
      positions[i * 3 + 1] = 0.3;
      positions[i * 3 + 2] = splashPos.z;

      const angle = (Math.random() - 0.5) * Math.PI * 0.8 + Math.atan2(normal.x, normal.z);
      const speed = 2 + Math.random() * 4;
      velocities[i * 3] = Math.sin(angle) * speed;
      velocities[i * 3 + 1] = 2 + Math.random() * 3;
      velocities[i * 3 + 2] = Math.cos(angle) * speed;

      lifetimes[i] = 0.15 + Math.random() * 0.15;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.15,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.splashParticles = new THREE.Points(geo, mat);
    (this.splashParticles as any).__velocities = velocities;
    (this.splashParticles as any).__lifetimes = lifetimes;
    (this.splashParticles as any).__age = 0;
    this.scene.add(this.splashParticles);
    this.splashTimer = 0.3;
  }

  private updateSplash(delta: number): void {
    if (!this.splashParticles || this.splashTimer <= 0) return;

    this.splashTimer -= delta;
    const posAttr = this.splashParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const velocities = (this.splashParticles as any).__velocities as Float32Array;
    const lifetimes = (this.splashParticles as any).__lifetimes as Float32Array;
    const age = ((this.splashParticles as any).__age as number) + delta;
    (this.splashParticles as any).__age = age;

    for (let i = 0; i < posAttr.count; i++) {
      if (age > lifetimes[i]) {
        posAttr.setXYZ(i, 0, -100, 0);
        continue;
      }
      posAttr.setX(i, posAttr.getX(i) + velocities[i * 3] * delta);
      posAttr.setY(i, posAttr.getY(i) + velocities[i * 3 + 1] * delta - 9.8 * delta * age);
      posAttr.setZ(i, posAttr.getZ(i) + velocities[i * 3 + 2] * delta);
    }
    posAttr.needsUpdate = true;

    const fadeRatio = Math.max(0, 1 - age / 0.3);
    (this.splashParticles.material as THREE.PointsMaterial).opacity = 0.7 * fadeRatio;

    if (this.splashTimer <= 0) {
      this.scene.remove(this.splashParticles);
      this.splashParticles.geometry.dispose();
      (this.splashParticles.material as THREE.PointsMaterial).dispose();
      this.splashParticles = null;
    }
  }

  pole(angle: number, force: number): void {
    if (this.state.isStunned) return;

    this.state.isPoling = true;
    this.state.poleAngle = angle;
    this.state.poleForce = force;
    this.state.poleCount++;

    const tangent = this.river.getTangentAtT(this.state.currentT);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const pushDir = tangent.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

    this.state.speed += force * 3.0;
    this.state.rotation += angle * 0.3 * force;

    this.poleGroup.visible = true;
    this.poleGroup.rotation.x = -0.5;
    this.poleGroup.rotation.z = angle * 0.3;

    this.createSplash();

    setTimeout(() => {
      this.poleGroup.visible = false;
      this.state.isPoling = false;
    }, 400);
  }

  private handleCollision(obstacle: { type: string; segmentType: string }): void {
    this.state.collisionCount++;

    if (obstacle.type === 'rock') {
      this.state.isStunned = true;
      this.state.stunTimer = 2.0;
      this.state.speed *= 0.7;
    } else if (obstacle.type === 'log') {
      this.state.rotation += Math.PI / 4 * (Math.random() > 0.5 ? 1 : -1);
      this.state.speed = this.river.getFlowSpeedAtT(this.state.currentT);
    } else if (obstacle.type === 'vortex') {
      this.state.inVortex = true;
      this.state.vortexEscapeCount = 0;
    }
  }

  tryEscapeVortex(reversePole: boolean): void {
    if (!this.state.inVortex) return;
    if (reversePole) {
      this.state.vortexEscapeCount++;
      if (this.state.vortexEscapeCount >= 3) {
        this.state.inVortex = false;
        this.state.vortexEscapeCount = 0;
      }
    }
  }

  reset(): void {
    this.state.position.copy(this.river.getPositionAtT(0.02));
    this.state.rotation = 0;
    this.state.speed = 0;
    this.state.currentT = 0.02;
    this.state.isPoling = false;
    this.state.poleAngle = 0;
    this.state.poleForce = 0;
    this.state.isStunned = false;
    this.state.stunTimer = 0;
    this.state.inVortex = false;
    this.state.vortexEscapeCount = 0;
    this.state.totalDistance = 0;
    this.group.position.copy(this.state.position);
    this.group.position.y = 0.3;
    this.group.rotation.y = 0;
  }

  update(delta: number, time: number): void {
    if (this.state.isStunned) {
      this.state.stunTimer -= delta;
      if (this.state.stunTimer <= 0) {
        this.state.isStunned = false;
      }
    }

    const flowSpeed = this.river.getFlowSpeedAtT(this.state.currentT);

    if (this.state.inVortex) {
      this.state.rotation -= 1.5 * delta;
      const closestObs = this.river.obstacles.find(o => o.type === 'vortex' && o.active);
      if (closestObs) {
        const pullDir = closestObs.position.clone().sub(this.state.position).normalize();
        this.state.position.add(pullDir.multiplyScalar(0.5 * delta));
      }
      this.state.speed *= 0.95;
    } else {
      const flowDecay = 0.98;
      this.state.speed = this.state.speed * flowDecay + flowSpeed * (1 - flowDecay);

      if (!this.state.isStunned) {
        const tangent = this.river.getTangentAtT(this.state.currentT);
        const flowMovement = tangent.multiplyScalar(flowSpeed * delta);
        const pushMovement = new THREE.Vector3(
          Math.sin(this.state.rotation) * this.state.speed * delta * 0.3,
          0,
          -Math.cos(this.state.rotation) * this.state.speed * delta
        );
        this.state.position.add(flowMovement);
        this.state.position.add(pushMovement);
      }

      this.state.speed = Math.max(0, this.state.speed - 0.5 * delta);
    }

    this.state.currentT = this.river.findClosestT(this.state.position);
    const riverPos = this.river.getPositionAtT(this.state.currentT);
    const tangent = this.river.getTangentAtT(this.state.currentT);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const seg = this.river.getSegmentAtT(this.state.currentT);
    const offset = this.state.position.clone().sub(riverPos);
    const lateralOffset = offset.dot(normal);
    const maxLateral = seg.width / 2 - 1.5;
    if (Math.abs(lateralOffset) > maxLateral) {
      const correction = normal.multiplyScalar((Math.abs(lateralOffset) - maxLateral) * Math.sign(lateralOffset) * -0.5);
      this.state.position.add(correction);
    }

    const prevDist = this.state.totalDistance;
    this.state.totalDistance += this.state.speed * delta;
    const distTraveled = (this.state.totalDistance / this.river.riverLength) * 40;

    const collision = this.river.checkObstacleCollision(this.state.position, this.raftRadius);
    if (collision && collision.type !== 'vortex') {
      const pushDir = this.state.position.clone().sub(collision.position).normalize();
      this.state.position.add(pushDir.multiplyScalar(0.3));
      this.handleCollision(collision);
      collision.active = false;
      setTimeout(() => { collision.active = true; }, 5000);
    } else if (collision && collision.type === 'vortex' && !this.state.inVortex) {
      this.handleCollision(collision);
    }

    this.bobPhase += delta * Math.PI;
    const bobAngle = Math.sin(this.bobPhase) * 3 * Math.PI / 180;
    const bobRoll = Math.cos(this.bobPhase * 0.7) * 1.5 * Math.PI / 180;

    this.group.position.copy(this.state.position);
    this.group.position.y = 0.3 + Math.sin(this.bobPhase) * 0.05;
    this.group.rotation.y = this.state.rotation;
    this.group.rotation.x = bobAngle;
    this.group.rotation.z = bobRoll;

    if (this.state.isStunned) {
      this.group.rotation.z += Math.sin(time * 10) * 0.1;
      this.group.position.y += Math.sin(time * 8) * 0.1;
    }

    this.updateSplash(delta);
  }

  getDistance(): number {
    return Math.floor((this.state.totalDistance / this.river.riverLength) * 40);
  }
}
