import * as THREE from 'three';
import { Insect, SwarmMode } from '../store/sceneStore';
import { findPath } from './pathfinding';
import { Obstacle } from '../store/sceneStore';

const SAFE_DISTANCE = 0.3;
const SWING_AMPLITUDE = THREE.MathUtils.degToRad(3);
const SWING_FREQUENCY = 2;
const ANTENNA_FREQ = 8;

export function createBeeMesh(): THREE.Group {
  const group = new THREE.Group();

  const bodyGeo = new THREE.SphereGeometry(0.12, 12, 10);
  bodyGeo.scale(1, 0.85, 1.4);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf4d03f,
    roughness: 0.5,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0x6e4b3a,
    roughness: 0.7,
    metalness: 0,
  });
  for (let i = 0; i < 3; i++) {
    const stripeGeo = new THREE.TorusGeometry(0.11, 0.02, 6, 16);
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = Math.PI / 2;
    stripe.position.z = -0.08 + i * 0.08;
    group.add(stripe);
  }

  const headGeo = new THREE.SphereGeometry(0.07, 10, 8);
  const headMat = new THREE.MeshStandardMaterial({ color: 0x2c1810, roughness: 0.6 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.z = 0.16;
  group.add(head);

  const antennaMat = new THREE.LineBasicMaterial({ color: 0x1a0f08 });
  for (let side = -1; side <= 1; side += 2) {
    const antennaPoints = [];
    antennaPoints.push(new THREE.Vector3(side * 0.02, 0.05, 0.18));
    antennaPoints.push(new THREE.Vector3(side * 0.05, 0.12, 0.22));
    const antennaGeo = new THREE.BufferGeometry().setFromPoints(antennaPoints);
    const antenna = new THREE.Line(antennaGeo, antennaMat);
    antenna.userData.side = side;
    antenna.name = `antenna_${side}`;
    group.add(antenna);
  }

  const wingGeo = new THREE.PlaneGeometry(0.18, 0.12, 1, 1);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });
  for (let side = -1; side <= 1; side += 2) {
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.rotation.z = side * 0.3;
    wing.position.set(side * 0.1, 0.05, 0);
    wing.name = `wing_${side}`;
    group.add(wing);
  }

  return group;
}

export function createAntMesh(): THREE.Group {
  const group = new THREE.Group();
  const segmentMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    roughness: 0.7,
    metalness: 0,
  });

  const abdomenGeo = new THREE.SphereGeometry(0.09, 10, 8);
  abdomenGeo.scale(0.9, 0.85, 1.2);
  const abdomen = new THREE.Mesh(abdomenGeo, segmentMat);
  abdomen.position.z = -0.12;
  group.add(abdomen);

  const thoraxGeo = new THREE.SphereGeometry(0.065, 10, 8);
  thoraxGeo.scale(0.95, 0.8, 1);
  const thorax = new THREE.Mesh(thoraxGeo, segmentMat);
  thorax.position.z = 0;
  group.add(thorax);

  const headGeo = new THREE.SphereGeometry(0.055, 10, 8);
  const head = new THREE.Mesh(headGeo, segmentMat);
  head.position.z = 0.1;
  group.add(head);

  const antennaMat = new THREE.LineBasicMaterial({ color: 0x1a0f08 });
  for (let side = -1; side <= 1; side += 2) {
    const antennaPoints = [];
    antennaPoints.push(new THREE.Vector3(side * 0.02, 0.04, 0.13));
    antennaPoints.push(new THREE.Vector3(side * 0.06, 0.09, 0.17));
    const antennaGeo = new THREE.BufferGeometry().setFromPoints(antennaPoints);
    const antenna = new THREE.Line(antennaGeo, antennaMat);
    antenna.userData.side = side;
    antenna.name = `antenna_${side}`;
    group.add(antenna);
  }

  const legMat = new THREE.LineBasicMaterial({ color: 0x1a0f08 });
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 3; i++) {
      const legPoints = [];
      const zOffset = -0.08 + i * 0.08;
      legPoints.push(new THREE.Vector3(side * 0.04, 0, zOffset));
      legPoints.push(new THREE.Vector3(side * 0.08, -0.04, zOffset + side * 0.02));
      legPoints.push(new THREE.Vector3(side * 0.1, -0.08, zOffset + side * 0.04));
      const legGeo = new THREE.BufferGeometry().setFromPoints(legPoints);
      const leg = new THREE.Line(legGeo, legMat);
      leg.userData.side = side;
      leg.userData.index = i;
      leg.name = `leg_${side}_${i}`;
      group.add(leg);
    }
  }

  return group;
}

export function updateInsect(
  insect: Insect,
  dt: number,
  time: number,
  target: THREE.Vector3 | null,
  mode: SwarmMode,
  allInsects: Insect[],
  obstacles: Obstacle[],
  terrainSize: number = 20
): { newPosition: THREE.Vector3; newVelocity: THREE.Vector3; newPhase: number; newPath: THREE.Vector3[]; newPathIndex: number; newTarget: THREE.Vector3 | null } {
  const newVelocity = new THREE.Vector3();
  let actualSpeed = insect.speed;

  if (mode === 'disperse') {
    actualSpeed *= 0.7;
  }

  let moveTarget: THREE.Vector3 | null = null;

  if (mode === 'gather' && target) {
    moveTarget = target.clone();
    if (insect.path.length === 0 || insect.pathIndex >= insect.path.length) {
      const newPath = findPath(insect.position, target, obstacles, 40, terrainSize);
      return {
        newPosition: insect.position.clone(),
        newVelocity: new THREE.Vector3(),
        newPhase: insect.phase + dt * 10,
        newPath,
        newPathIndex: 1,
        newTarget: target.clone(),
      };
    } else if (insect.pathIndex < insect.path.length) {
      const waypoint = insect.path[insect.pathIndex];
      moveTarget = waypoint.clone();
      if (insect.type === 'bee') {
        moveTarget.y = 0.8 + Math.sin(time * 2 + insect.phase) * 0.15;
      }
    }
  } else if (mode === 'disperse') {
    if (!insect.targetPosition || insect.position.distanceTo(insect.targetPosition) < 0.5) {
      const randTarget = new THREE.Vector3(
        (Math.random() - 0.5) * (terrainSize - 2),
        insect.type === 'bee' ? 0.5 + Math.random() * 1.5 : 0.1,
        (Math.random() - 0.5) * (terrainSize - 2)
      );
      moveTarget = randTarget;
    } else {
      moveTarget = insect.targetPosition.clone();
    }
  }

  if (moveTarget) {
    const direction = new THREE.Vector3().subVectors(moveTarget, insect.position);
    direction.y = 0;
    const dist = direction.length();

    if (dist > 0.05) {
      direction.normalize();
      newVelocity.copy(direction).multiplyScalar(actualSpeed);
    }

    if (mode === 'gather' && target && insect.path.length > 0) {
      const waypoint = insect.path[insect.pathIndex];
      const d = insect.position.distanceTo(waypoint);
      if (d < 0.3 && insect.pathIndex < insect.path.length - 1) {
        return {
          newPosition: insect.position.clone(),
          newVelocity,
          newPhase: insect.phase,
          newPath: insect.path,
          newPathIndex: insect.pathIndex + 1,
          newTarget: insect.targetPosition,
        };
      }
    }
  }

  for (const other of allInsects) {
    if (other.id === insect.id) continue;
    const diff = new THREE.Vector3().subVectors(insect.position, other.position);
    diff.y = 0;
    const dist = diff.length();
    if (dist < SAFE_DISTANCE && dist > 0.001) {
      diff.normalize().multiplyScalar((SAFE_DISTANCE - dist) * 8);
      newVelocity.add(diff);
    }
  }

  const half = terrainSize / 2 - 0.5;
  let newPosition = new THREE.Vector3().copy(insect.position).addScaledVector(newVelocity, dt);
  newPosition.x = THREE.MathUtils.clamp(newPosition.x, -half, half);
  newPosition.z = THREE.MathUtils.clamp(newPosition.z, -half, half);

  if (insect.type === 'bee') {
    newPosition.y = 0.8 + Math.sin(time * 2 + insect.phase) * 0.15;
  } else {
    newPosition.y = 0.1;
  }

  for (const obs of obstacles) {
    const dx = newPosition.x - obs.position.x;
    const dz = newPosition.z - obs.position.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    const minDist = obs.radius + 0.15;
    if (d < minDist && d > 0.001) {
      const pushX = (dx / d) * (minDist - d);
      const pushZ = (dz / d) * (minDist - d);
      newPosition.x += pushX;
      newPosition.z += pushZ;
    }
  }

  return {
    newPosition,
    newVelocity,
    newPhase: insect.phase + dt * 3,
    newPath: insect.path,
    newPathIndex: insect.pathIndex,
    newTarget: mode === 'disperse' ? (moveTarget || insect.targetPosition) : null,
  };
}

export function applyAnimationToMesh(mesh: THREE.Group, insect: Insect, time: number): void {
  const velocity = insect.velocity;
  if (velocity.lengthSq() > 0.01) {
    const angle = Math.atan2(velocity.x, velocity.z);
    mesh.rotation.y = angle;
  }

  const swing = Math.sin(time * SWING_FREQUENCY * Math.PI * 2 + insect.phase) * SWING_AMPLITUDE;
  mesh.rotation.z = swing;

  const antenna1 = mesh.getObjectByName('antenna_-1');
  const antenna2 = mesh.getObjectByName('antenna_1');
  const antFlick = Math.sin(time * ANTENNA_FREQ * Math.PI * 2 + insect.phase) * 0.15;
  if (antenna1) antenna1.rotation.z = antFlick;
  if (antenna2) antenna2.rotation.z = -antFlick;

  if (insect.type === 'bee') {
    const wing1 = mesh.getObjectByName('wing_-1');
    const wing2 = mesh.getObjectByName('wing_1');
    const wingFlap = Math.sin(time * 60 + insect.phase) * 0.5;
    if (wing1) wing1.rotation.z = -0.3 + wingFlap;
    if (wing2) wing2.rotation.z = 0.3 - wingFlap;
  } else {
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 3; i++) {
        const leg = mesh.getObjectByName(`leg_${side}_${i}`);
        if (leg) {
          leg.rotation.y = Math.sin(time * 10 + insect.phase + i * 1.5 + side * 0.5) * 0.3;
        }
      }
    }
  }
}
