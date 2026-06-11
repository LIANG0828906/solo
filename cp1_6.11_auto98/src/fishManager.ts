import * as THREE from 'three';

const FISH_COUNT = 200;
const PARTICLES_PER_FISH = 15;
const SPARKLE_COUNT = 200;
const TOTAL_INSTANCES = FISH_COUNT * PARTICLES_PER_FISH;
const CHAIN_LENGTH = 2.5;
const CHAIN_SPACING = CHAIN_LENGTH / (PARTICLES_PER_FISH - 1);
const BOUNDARY = 45;
const COLLISION_DIST = 3.0;
const BASE_SPEED = 3.5;
const SEEK_STRENGTH = 2.0;
const BOUNDARY_STRENGTH = 8.0;
const AVOIDANCE_STRENGTH = 4.0;
const MAX_TURN_RATE = (120 * Math.PI) / 180;
const HEAD_SIZE = 0.3;
const TAIL_SIZE = 0.1;

const CYAN = new THREE.Color(0x00bcd4);
const ORANGE = new THREE.Color(0xff7043);

interface FishData {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  chain: THREE.Vector3[];
  avoidanceTimer: number;
  speedMult: number;
  baseSpeed: number;
  colorFactor: number;
  targetOffset: THREE.Vector3;
  targetOffsetLen: number;
}

export class FishManager {
  private fishes: FishData[];
  private fishMesh: THREE.InstancedMesh;
  private sparkleGeo: THREE.BufferGeometry;
  private sparklePoints: THREE.Points;
  private sparklePositions: Float32Array;
  private sparklePhases: Float32Array;
  private breathingTime: number;
  private dummy: THREE.Object3D;
  private tempColor: THREE.Color;

  constructor(scene: THREE.Scene) {
    this.fishes = [];
    this.breathingTime = 0;
    this.dummy = new THREE.Object3D();
    this.tempColor = new THREE.Color();

    const particleGeo = new THREE.IcosahedronGeometry(1, 2);
    const particleMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.85,
    });
    this.fishMesh = new THREE.InstancedMesh(particleGeo, particleMat, TOTAL_INSTANCES);
    this.fishMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const colors = new Float32Array(TOTAL_INSTANCES * 3);
    this.fishMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    this.fishMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

    scene.add(this.fishMesh);

    this.sparklePositions = new Float32Array(SPARKLE_COUNT * 3);
    this.sparklePhases = new Float32Array(SPARKLE_COUNT);
    const sparkleSizes = new Float32Array(SPARKLE_COUNT);

    for (let i = 0; i < SPARKLE_COUNT; i++) {
      this.sparklePositions[i * 3] = (Math.random() - 0.5) * 60;
      this.sparklePositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      this.sparklePositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      this.sparklePhases[i] = Math.random() * Math.PI * 2;
      sparkleSizes[i] = 0.5 + Math.random() * 1.0;
    }

    this.sparkleGeo = new THREE.BufferGeometry();
    this.sparkleGeo.setAttribute('position', new THREE.BufferAttribute(this.sparklePositions, 3));
    this.sparkleGeo.setAttribute('size', new THREE.BufferAttribute(sparkleSizes, 1));

    const sparkleMat = new THREE.PointsMaterial({
      color: 0x88ddff,
      size: 0.4,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.sparklePoints = new THREE.Points(this.sparkleGeo, sparkleMat);
    scene.add(this.sparklePoints);

    this.initFish();
  }

  private initFish(): void {
    for (let i = 0; i < FISH_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;
      const r = 5 + Math.random() * 10;
      const pos = new THREE.Vector3(
        Math.cos(theta) * Math.cos(phi) * r,
        Math.sin(phi) * r * 0.5,
        Math.sin(theta) * Math.cos(phi) * r,
      );

      const speed = BASE_SPEED + (Math.random() - 0.5) * 1.0;
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 2,
      ).normalize().multiplyScalar(speed);

      const chain: THREE.Vector3[] = [];
      for (let j = 0; j < PARTICLES_PER_FISH; j++) {
        chain.push(pos.clone().add(
          vel.clone().normalize().multiplyScalar(-j * CHAIN_SPACING),
        ));
      }

      const offTheta = Math.random() * Math.PI * 2;
      const offPhi = (Math.random() - 0.5) * Math.PI * 0.8;
      const offR = 0.3 + Math.random() * 0.7;
      const targetOffset = new THREE.Vector3(
        Math.cos(offTheta) * Math.cos(offPhi) * offR,
        Math.sin(offPhi) * offR * 0.4,
        Math.sin(offTheta) * Math.cos(offPhi) * offR,
      );

      this.fishes.push({
        pos,
        vel,
        chain,
        avoidanceTimer: 0,
        speedMult: 1.0,
        baseSpeed: speed,
        colorFactor: i / FISH_COUNT,
        targetOffset,
        targetOffsetLen: offR,
      });
    }
  }

  update(deltaTime: number, targetPoint: THREE.Vector3, gatheringRadius: number): void {
    this.breathingTime += deltaTime;
    const breathPhase = 0.5 - 0.5 * Math.cos((2 * Math.PI * this.breathingTime) / 6);
    const effectiveRadius = gatheringRadius + 5 * breathPhase;

    const avoidancePairs: [number, number][] = [];
    for (let i = 0; i < FISH_COUNT; i++) {
      for (let j = i + 1; j < FISH_COUNT; j++) {
        const dx = this.fishes[i].pos.x - this.fishes[j].pos.x;
        const dy = this.fishes[i].pos.y - this.fishes[j].pos.y;
        const dz = this.fishes[i].pos.z - this.fishes[j].pos.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < COLLISION_DIST * COLLISION_DIST) {
          avoidancePairs.push([i, j]);
        }
      }
    }

    for (let i = 0; i < FISH_COUNT; i++) {
      const fish = this.fishes[i];

      const individualTarget = targetPoint.clone().add(
        fish.targetOffset.clone().multiplyScalar(effectiveRadius),
      );

      const seekDir = individualTarget.clone().sub(fish.pos);
      const seekDist = seekDir.length();
      if (seekDist > 0.01) {
        seekDir.normalize();
      }
      const seekForce = seekDir.multiplyScalar(SEEK_STRENGTH);

      const boundaryForce = new THREE.Vector3();
      const margin = 5;
      const bx = fish.pos.x;
      const by = fish.pos.y;
      const bz = fish.pos.z;
      if (bx > BOUNDARY - margin) boundaryForce.x -= (bx - (BOUNDARY - margin)) * BOUNDARY_STRENGTH / margin;
      if (bx < -BOUNDARY + margin) boundaryForce.x -= (bx + BOUNDARY - margin) * BOUNDARY_STRENGTH / margin;
      if (by > BOUNDARY - margin) boundaryForce.y -= (by - (BOUNDARY - margin)) * BOUNDARY_STRENGTH / margin;
      if (by < -BOUNDARY + margin) boundaryForce.y -= (by + BOUNDARY - margin) * BOUNDARY_STRENGTH / margin;
      if (bz > BOUNDARY - margin) boundaryForce.z -= (bz - (BOUNDARY - margin)) * BOUNDARY_STRENGTH / margin;
      if (bz < -BOUNDARY + margin) boundaryForce.z -= (bz + BOUNDARY - margin) * BOUNDARY_STRENGTH / margin;

      if (Math.abs(bx) > BOUNDARY || Math.abs(by) > BOUNDARY || Math.abs(bz) > BOUNDARY) {
        boundaryForce.add(fish.pos.clone().negate().normalize().multiplyScalar(BOUNDARY_STRENGTH * 2));
      }

      const avoidanceForce = new THREE.Vector3();
      for (const [a, b] of avoidancePairs) {
        const other = a === i ? this.fishes[b] : b === i ? this.fishes[a] : null;
        if (other === null) continue;
        const diff = fish.pos.clone().sub(other.pos);
        const dist = diff.length();
        if (dist < COLLISION_DIST && dist > 0.01) {
          avoidanceForce.add(diff.normalize().multiplyScalar(AVOIDANCE_STRENGTH / dist));

          if (fish.avoidanceTimer <= 0) {
            fish.avoidanceTimer = 0.2;
            fish.speedMult = 1.5;

            const currentDir = fish.vel.clone().normalize();
            const perpAxis = new THREE.Vector3(0, 1, 0);
            if (Math.abs(currentDir.dot(perpAxis)) > 0.9) {
              perpAxis.set(1, 0, 0);
            }
            perpAxis.cross(currentDir).normalize();
            const angle = (30 * Math.PI) / 180;
            const rotMatrix = new THREE.Matrix4().makeRotationAxis(perpAxis, angle);
            fish.vel.applyMatrix4(rotMatrix);
          }

          if (other.avoidanceTimer <= 0) {
            other.avoidanceTimer = 0.2;
            other.speedMult = 1.5;

            const otherDir = other.vel.clone().normalize();
            const otherPerp = new THREE.Vector3(0, 1, 0);
            if (Math.abs(otherDir.dot(otherPerp)) > 0.9) {
              otherPerp.set(1, 0, 0);
            }
            otherPerp.cross(otherDir).normalize();
            const otherAngle = (-30 * Math.PI) / 180;
            const otherRotMatrix = new THREE.Matrix4().makeRotationAxis(otherPerp, otherAngle);
            other.vel.applyMatrix4(otherRotMatrix);
          }
        }
      }

      const acceleration = new THREE.Vector3()
        .add(seekForce)
        .add(boundaryForce)
        .add(avoidanceForce);

      fish.vel.add(acceleration.multiplyScalar(deltaTime));

      const currentSpeed = fish.vel.length();
      const targetSpeed = fish.baseSpeed * fish.speedMult;
      if (currentSpeed > 0.01) {
        const clampedSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, 0.1);
        fish.vel.normalize().multiplyScalar(clampedSpeed);
      }

      if (fish.avoidanceTimer > 0) {
        fish.avoidanceTimer -= deltaTime;
        if (fish.avoidanceTimer <= 0) {
          fish.speedMult = 1.0;
          fish.avoidanceTimer = 0;
        }
      }

      const maxTurnRad = MAX_TURN_RATE * deltaTime;
      const prevDir = fish.chain[1].clone().sub(fish.pos).negate().normalize();
      const nextDir = fish.vel.clone().normalize();
      const angleDiff = prevDir.angleTo(nextDir);
      if (angleDiff > maxTurnRad && angleDiff > 0.001) {
        const t = maxTurnRad / angleDiff;
        nextDir.lerp(prevDir, 1 - t).normalize();
        fish.vel.copy(nextDir.multiplyScalar(fish.vel.length()));
      }

      fish.pos.add(fish.vel.clone().multiplyScalar(deltaTime));
      fish.pos.x = THREE.MathUtils.clamp(fish.pos.x, -BOUNDARY - 2, BOUNDARY + 2);
      fish.pos.y = THREE.MathUtils.clamp(fish.pos.y, -BOUNDARY - 2, BOUNDARY + 2);
      fish.pos.z = THREE.MathUtils.clamp(fish.pos.z, -BOUNDARY - 2, BOUNDARY + 2);

      fish.chain[0].copy(fish.pos);
      for (let j = 1; j < PARTICLES_PER_FISH; j++) {
        const prev = fish.chain[j - 1];
        const curr = fish.chain[j];
        const dir = prev.clone().sub(curr);
        const len = dir.length();
        if (len > CHAIN_SPACING) {
          dir.normalize();
          curr.copy(prev).sub(dir.multiplyScalar(CHAIN_SPACING));
        }
      }

      const distToCenter = fish.pos.distanceTo(targetPoint);
      fish.colorFactor = THREE.MathUtils.clamp(1 - distToCenter / (effectiveRadius * 1.5), 0, 1);
    }

    this.updateInstancedMesh(effectiveRadius);
    this.updateSparkles(deltaTime);
  }

  private updateInstancedMesh(effectiveRadius: number): void {
    let instanceIdx = 0;

    for (let i = 0; i < FISH_COUNT; i++) {
      const fish = this.fishes[i];

      for (let j = 0; j < PARTICLES_PER_FISH; j++) {
        const particle = fish.chain[j];
        const t = j / (PARTICLES_PER_FISH - 1);
        const size = THREE.MathUtils.lerp(HEAD_SIZE, TAIL_SIZE, t);

        const breatheScale = 1 + 0.05 * Math.sin((2 * Math.PI * this.breathingTime) / 6);

        this.dummy.position.copy(particle);
        this.dummy.scale.setScalar(size * breatheScale);
        this.dummy.updateMatrix();
        this.fishMesh.setMatrixAt(instanceIdx, this.dummy.matrix);

        const posT = Math.min(fish.colorFactor + t * 0.3, 1);
        this.tempColor.copy(CYAN).lerp(ORANGE, posT);
        this.fishMesh.setColorAt(instanceIdx, this.tempColor);

        instanceIdx++;
      }
    }

    this.fishMesh.instanceMatrix.needsUpdate = true;
    if (this.fishMesh.instanceColor) {
      this.fishMesh.instanceColor.needsUpdate = true;
    }
  }

  private updateSparkles(deltaTime: number): void {
    const posAttr = this.sparkleGeo.getAttribute('position') as THREE.BufferAttribute;

    for (let i = 0; i < SPARKLE_COUNT; i++) {
      this.sparklePhases[i] += deltaTime * (0.5 + Math.random() * 0.3);

      const idx = i * 3;
      this.sparklePositions[idx] += Math.sin(this.sparklePhases[i]) * deltaTime * 0.3;
      this.sparklePositions[idx + 1] += Math.cos(this.sparklePhases[i] * 0.7) * deltaTime * 0.2;
      this.sparklePositions[idx + 2] += Math.sin(this.sparklePhases[i] * 1.3) * deltaTime * 0.3;

      for (let axis = 0; axis < 3; axis++) {
        if (this.sparklePositions[idx + axis] > 50) this.sparklePositions[idx + axis] = -50;
        if (this.sparklePositions[idx + axis] < -50) this.sparklePositions[idx + axis] = 50;
      }
    }

    posAttr.needsUpdate = true;

    const mat = this.sparklePoints.material as THREE.PointsMaterial;
    mat.opacity = 0.3 + 0.3 * Math.sin(this.breathingTime * 1.5);
  }

  dispose(): void {
    this.fishMesh.geometry.dispose();
    (this.fishMesh.material as THREE.Material).dispose();
    this.sparkleGeo.dispose();
    (this.sparklePoints.material as THREE.Material).dispose();
  }
}
