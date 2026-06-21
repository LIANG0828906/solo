import * as THREE from 'three';
import type { Vehicle, RoadNetwork, Intersection, RoadSegment, Obstacle, HeatmapCell, Analytics } from '@/types';
import { aStarSearch, getIntersectionPosition } from './RoadNetwork';

const VEHICLE_COLORS = [
  '#ff3333', '#33ff33', '#3333ff', '#ffff33', '#ff33ff',
  '#33ffff', '#ff9933', '#9933ff', '#ff6699', '#66ff99',
  '#ffcc00', '#cc00ff', '#00ffcc', '#ff0066', '#66ccff',
];

const CAR_LENGTH = 4;
const FOLLOW_DISTANCE = 8;
const BRAKE_DISTANCE = 15;
const ACCELERATION = 3;
const BRAKE_DECELERATION = 6;

function kmhToMs(kmh: number): number {
  return kmh / 3.6;
}

function randomColor(): string {
  return VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)];
}

function findSegmentBetween(
  network: RoadNetwork,
  fromId: string,
  toId: string
): RoadSegment | undefined {
  return network.segments.find(
    (s) =>
      (s.from === fromId && s.to === toId) ||
      (s.from === toId && s.to === fromId)
  );
}

export function generateVehicle(
  id: string,
  network: RoadNetwork,
  strategy: 'shortest' | 'avoid-congestion'
): Vehicle {
  const intersections = network.intersections;
  const startIdx = Math.floor(Math.random() * intersections.length);
  let endIdx = Math.floor(Math.random() * intersections.length);
  while (endIdx === startIdx) {
    endIdx = Math.floor(Math.random() * intersections.length);
  }

  const startInt = intersections[startIdx];
  const endInt = intersections[endIdx];

  const path = aStarSearch(network, startInt.id, endInt.id);

  const startPos = getIntersectionPosition(startInt);

  return {
    id,
    position: { x: startPos.x, y: 0.5, z: startPos.z },
    rotation: { y: 0 },
    speed: 0,
    targetSpeed: kmhToMs(40),
    path: path.length > 0 ? path : [startInt.id],
    currentPathIndex: 0,
    strategy,
    isBraking: false,
    color: randomColor(),
  };
}

export class VehicleSim implements Vehicle {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { y: number };
  speed: number;
  targetSpeed: number;
  path: string[];
  currentPathIndex: number;
  detourPath?: string[];
  strategy: 'shortest' | 'avoid-congestion';
  isBraking: boolean;
  color: string;

  constructor(data: Vehicle) {
    this.id = data.id;
    this.position = { ...data.position };
    this.rotation = { ...data.rotation };
    this.speed = data.speed;
    this.targetSpeed = data.targetSpeed;
    this.path = [...data.path];
    this.currentPathIndex = data.currentPathIndex;
    this.detourPath = data.detourPath ? [...data.detourPath] : undefined;
    this.strategy = data.strategy;
    this.isBraking = data.isBraking;
    this.color = data.color;
  }

  toJSON(): Vehicle {
    return {
      id: this.id,
      position: { ...this.position },
      rotation: { ...this.rotation },
      speed: this.speed,
      targetSpeed: this.targetSpeed,
      path: [...this.path],
      currentPathIndex: this.currentPathIndex,
      detourPath: this.detourPath ? [...this.detourPath] : undefined,
      strategy: this.strategy,
      isBraking: this.isBraking,
      color: this.color,
    };
  }
}

function getEffectivePath(vehicle: Vehicle): string[] {
  return vehicle.detourPath && vehicle.detourPath.length > 0 ? vehicle.detourPath : vehicle.path;
}

function getEffectiveIndex(vehicle: Vehicle): number {
  return vehicle.detourPath && vehicle.detourPath.length > 0 ? 0 : vehicle.currentPathIndex;
}

function distance3D(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function distanceXZ(a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function checkFrontVehicle(
  vehicle: Vehicle,
  vehicles: Vehicle[],
  lookAheadDistance: number
): Vehicle | null {
  const effectivePath = getEffectivePath(vehicle);
  const effectiveIndex = getEffectiveIndex(vehicle);

  if (effectiveIndex >= effectivePath.length - 1) return null;

  const nextTargetId = effectivePath[effectiveIndex + 1];
  const vehiclePos = new THREE.Vector3(vehicle.position.x, vehicle.position.y, vehicle.position.z);

  let closest: Vehicle | null = null;
  let closestDist = Infinity;

  for (const other of vehicles) {
    if (other.id === vehicle.id) continue;

    const otherPath = getEffectivePath(other);
    const otherIndex = getEffectiveIndex(other);
    if (otherIndex >= otherPath.length - 1) continue;

    const otherNextId = otherPath[otherIndex + 1];
    if (otherNextId !== nextTargetId && otherPath[otherIndex] !== effectivePath[effectiveIndex]) {
      continue;
    }

    const otherPos = new THREE.Vector3(other.position.x, other.position.y, other.position.z);
    const dist = vehiclePos.distanceTo(otherPos);

    if (dist < lookAheadDistance && dist < closestDist) {
      const toOther = new THREE.Vector3().subVectors(otherPos, vehiclePos).normalize();
      const direction = new THREE.Vector3();
      direction.x = otherPos.x - vehiclePos.x;
      direction.z = otherPos.z - vehiclePos.z;
      direction.y = 0;
      if (direction.lengthSq() > 0) {
        direction.normalize();
        const dot = toOther.dot(direction);
        if (dot > 0.5) {
          closest = other;
          closestDist = dist;
        }
      }
    }
  }

  return closest;
}

function shouldBrakeForSignal(
  vehicle: Vehicle,
  network: RoadNetwork,
  stopDistance: number
): boolean {
  const effectivePath = getEffectivePath(vehicle);
  const effectiveIndex = getEffectiveIndex(vehicle);

  if (effectiveIndex >= effectivePath.length - 1) return false;

  const nextIntersectionId = effectivePath[effectiveIndex + 1];
  const nextIntersection = network.intersections.find((i) => i.id === nextIntersectionId);
  if (!nextIntersection) return false;

  const distToIntersection = distanceXZ(
    vehicle.position,
    { x: nextIntersection.x, z: nextIntersection.z }
  );

  return nextIntersection.signalState === 'red' && distToIntersection < stopDistance;
}

function checkObstacleOnPath(
  vehicle: Vehicle,
  network: RoadNetwork,
  obstacles: Obstacle[]
): Obstacle | null {
  const effectivePath = getEffectivePath(vehicle);
  const effectiveIndex = getEffectiveIndex(vehicle);

  if (effectiveIndex >= effectivePath.length - 1) return null;

  const fromId = effectivePath[effectiveIndex];
  const toId = effectivePath[effectiveIndex + 1];
  const segment = findSegmentBetween(network, fromId, toId);
  if (!segment) return null;

  for (const obstacle of obstacles) {
    if (obstacle.affectedSegmentId === segment.id) {
      const fromInt = network.intersections.find((i) => i.id === fromId);
      const toInt = network.intersections.find((i) => i.id === toId);
      if (!fromInt || !toInt) continue;

      const dist = distanceXZ(vehicle.position, obstacle.position);
      if (dist < 30) {
        return obstacle;
      }
    }
  }

  return null;
}

function computeDetourPath(
  vehicle: Vehicle,
  network: RoadNetwork,
  obstacle: Obstacle
): string[] | undefined {
  const effectivePath = getEffectivePath(vehicle);
  const effectiveIndex = getEffectiveIndex(vehicle);

  if (effectiveIndex >= effectivePath.length - 1) return undefined;

  const fromId = effectivePath[effectiveIndex];
  const toId = effectivePath[effectiveIndex + 1];
  const blockedSegment = findSegmentBetween(network, fromId, toId);
  if (!blockedSegment) return undefined;

  const congestionWeights = new Map<string, number>();
  congestionWeights.set(blockedSegment.id, 100);

  const endId = effectivePath[effectivePath.length - 1];
  const detour = aStarSearch(network, fromId, endId, congestionWeights);

  if (detour.length > 1) {
    return detour;
  }

  return undefined;
}

export function updateVehicle(
  vehicle: Vehicle,
  deltaTime: number,
  network: RoadNetwork,
  obstacles: Obstacle[],
  vehicles: Vehicle[]
): Vehicle {
  const effectivePath = getEffectivePath(vehicle);
  let effectiveIndex = getEffectiveIndex(vehicle);

  const updated: Vehicle = {
    ...vehicle,
    position: { ...vehicle.position },
    rotation: { ...vehicle.rotation },
    path: [...vehicle.path],
    detourPath: vehicle.detourPath ? [...vehicle.detourPath] : undefined,
  };

  if (effectiveIndex >= effectivePath.length - 1) {
    updated.speed = Math.max(0, updated.speed - BRAKE_DECELERATION * deltaTime);
    updated.isBraking = true;
    return updated;
  }

  const obstacle = checkObstacleOnPath(updated, network, obstacles);
  if (obstacle && !updated.detourPath) {
    const detour = computeDetourPath(updated, network, obstacle);
    if (detour && detour.length > 0) {
      updated.detourPath = detour;
      return updateVehicle(updated, deltaTime, network, obstacles.filter((o) => o.id !== obstacle.id), vehicles);
    }
  }

  const newEffectivePath = getEffectivePath(updated);
  const newEffectiveIndex = getEffectiveIndex(updated);

  if (newEffectiveIndex >= newEffectivePath.length - 1) {
    if (updated.detourPath) {
      updated.detourPath = undefined;
      return updateVehicle(updated, deltaTime, network, obstacles, vehicles);
    }
    updated.speed = Math.max(0, updated.speed - BRAKE_DECELERATION * deltaTime);
    updated.isBraking = true;
    return updated;
  }

  const nextIntersectionId = newEffectivePath[newEffectiveIndex + 1];
  const nextIntersection = network.intersections.find((i) => i.id === nextIntersectionId);
  if (!nextIntersection) return updated;

  const currentSegment = findSegmentBetween(
    network,
    newEffectivePath[newEffectiveIndex],
    nextIntersectionId
  );

  const speedLimitMs = currentSegment ? kmhToMs(currentSegment.speedLimit) : kmhToMs(40);
  updated.targetSpeed = speedLimitMs;

  const shouldBrakeSignal = shouldBrakeForSignal(updated, network, BRAKE_DISTANCE);
  const frontVehicle = checkFrontVehicle(updated, vehicles, BRAKE_DISTANCE + FOLLOW_DISTANCE);

  let needBrake = false;
  let targetSpeedMs = speedLimitMs;

  if (shouldBrakeSignal) {
    needBrake = true;
    targetSpeedMs = 0;
  }

  if (frontVehicle) {
    const distToFront = distance3D(updated.position, frontVehicle.position);
    if (distToFront < FOLLOW_DISTANCE + CAR_LENGTH) {
      needBrake = true;
      targetSpeedMs = Math.min(targetSpeedMs, frontVehicle.speed * 0.8);
    } else if (distToFront < BRAKE_DISTANCE) {
      targetSpeedMs = Math.min(targetSpeedMs, frontVehicle.speed);
    }
  }

  updated.isBraking = needBrake;

  if (needBrake) {
    updated.speed = Math.max(targetSpeedMs, updated.speed - BRAKE_DECELERATION * deltaTime);
  } else {
    if (updated.speed < updated.targetSpeed) {
      updated.speed = Math.min(updated.targetSpeed, updated.speed + ACCELERATION * deltaTime);
    } else if (updated.speed > updated.targetSpeed) {
      updated.speed = Math.max(updated.targetSpeed, updated.speed - BRAKE_DECELERATION * 0.5 * deltaTime);
    }
  }

  const targetPos = getIntersectionPosition(nextIntersection);
  const dx = targetPos.x - updated.position.x;
  const dz = targetPos.z - updated.position.z;
  const distToTarget = Math.sqrt(dx * dx + dz * dz);

  if (distToTarget > 0) {
    const moveDistance = updated.speed * deltaTime;
    const ratio = Math.min(moveDistance / distToTarget, 1);

    updated.position.x += dx * ratio;
    updated.position.z += dz * ratio;

    const targetAngle = Math.atan2(dx, dz);
    let angleDiff = targetAngle - updated.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    updated.rotation.y += angleDiff * Math.min(1, deltaTime * 5);
  }

  const distToIntersection = distanceXZ(
    updated.position,
    { x: nextIntersection.x, z: nextIntersection.z }
  );

  if (distToIntersection < 1.0 && updated.speed < 2) {
    if (updated.detourPath) {
      updated.detourPath = updated.detourPath.slice(1);
      if (updated.detourPath.length <= 1) {
        updated.detourPath = undefined;
        for (let i = 0; i < updated.path.length; i++) {
          if (updated.path[i] === nextIntersectionId) {
            updated.currentPathIndex = i;
            break;
          }
        }
      }
    } else {
      updated.currentPathIndex = newEffectiveIndex + 1;
    }
  } else if (distToIntersection < 0.5) {
    if (updated.detourPath) {
      updated.detourPath = updated.detourPath.slice(1);
      if (updated.detourPath.length <= 1) {
        updated.detourPath = undefined;
        for (let i = 0; i < updated.path.length; i++) {
          if (updated.path[i] === nextIntersectionId) {
            updated.currentPathIndex = i;
            break;
          }
        }
      }
    } else {
      updated.currentPathIndex = newEffectiveIndex + 1;
    }
  }

  return updated;
}

export function calculateHeatmap(
  vehicles: Vehicle[],
  segments: RoadSegment[]
): HeatmapCell[] {
  const segmentData = new Map<
    string,
    { speeds: number[]; count: number }
  >();

  segments.forEach((seg) => {
    segmentData.set(seg.id, { speeds: [], count: 0 });
  });

  vehicles.forEach((vehicle) => {
    const effectivePath = getEffectivePath(vehicle);
    const effectiveIndex = getEffectiveIndex(vehicle);

    if (effectiveIndex >= effectivePath.length - 1) return;

    const fromId = effectivePath[effectiveIndex];
    const toId = effectivePath[effectiveIndex + 1];

    for (const seg of segments) {
      if (
        (seg.from === fromId && seg.to === toId) ||
        (seg.from === toId && seg.to === fromId)
      ) {
        const data = segmentData.get(seg.id);
        if (data) {
          data.speeds.push(vehicle.speed * 3.6);
          data.count++;
        }
        break;
      }
    }
  });

  const heatmap: HeatmapCell[] = [];

  segments.forEach((seg) => {
    const data = segmentData.get(seg.id);
    if (!data) return;

    const avgSpeed =
      data.speeds.length > 0
        ? data.speeds.reduce((a, b) => a + b, 0) / data.speeds.length
        : seg.speedLimit;

    const speedRatio = avgSpeed / seg.speedLimit;

    let congestionLevel: 0 | 1 | 2;
    if (speedRatio >= 0.6) {
      congestionLevel = 0;
    } else if (speedRatio >= 0.2) {
      congestionLevel = 1;
    } else {
      congestionLevel = 2;
    }

    heatmap.push({
      segmentId: seg.id,
      congestionLevel,
      avgSpeed,
      vehicleCount: data.count,
    });
  });

  return heatmap;
}

export function calculateAnalytics(vehicles: Vehicle[]): Analytics {
  const totalVehicles = vehicles.length;

  if (totalVehicles === 0) {
    return {
      totalVehicles: 0,
      avgSpeed: 0,
      congestionIndex: 0,
    };
  }

  const totalSpeedMs = vehicles.reduce((sum, v) => sum + v.speed, 0);
  const avgSpeedMs = totalSpeedMs / totalVehicles;
  const avgSpeedKmh = avgSpeedMs * 3.6;

  const slowVehicles = vehicles.filter((v) => v.speed * 3.6 < 12).length;
  const congestionIndex = Math.min(100, Math.round((slowVehicles / totalVehicles) * 100));

  return {
    totalVehicles,
    avgSpeed: Math.round(avgSpeedKmh * 10) / 10,
    congestionIndex,
  };
}
