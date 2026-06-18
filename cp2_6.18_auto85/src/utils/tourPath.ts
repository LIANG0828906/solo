import * as THREE from 'three';
import { WallPlacement, WorkMaterial, VenueWall } from '@/types';
import { getWallsForVenue, VENUE_CONFIGS } from './venueConfigs';

interface TourWaypoint {
  cameraPos: THREE.Vector3;
  lookAt: THREE.Vector3;
  workId: string | null;
}

const wallToWorld = (wall: VenueWall, localX: number, localY: number): THREE.Vector3 => {
  const [wx, wy, wz] = wall.position;
  const [rx, ry, rz] = wall.rotation;
  const halfW = wall.width / 2;
  const halfH = wall.height / 2;
  const x = (localX - 0.5) * wall.width;
  const y = (localY - 0.5) * wall.height;
  const offset = 4;

  const matrix = new THREE.Matrix4();
  matrix.makeRotationFromEuler(new THREE.Euler(rx, ry, rz));
  const forward = new THREE.Vector3(0, 0, 1).applyMatrix4(matrix);
  const right = new THREE.Vector3(1, 0, 0).applyMatrix4(matrix);
  const up = new THREE.Vector3(0, 1, 0).applyMatrix4(matrix);

  const wallPoint = new THREE.Vector3(wx, wy, wz)
    .add(right.multiplyScalar(x))
    .add(up.multiplyScalar(y));
  const cameraPoint = wallPoint.clone().add(forward.multiplyScalar(offset));

  return cameraPoint;
};

export const calculateTourPath = (
  venueTemplate: keyof typeof VENUE_CONFIGS,
  wallLayout: number,
  placements: WallPlacement[],
  works: WorkMaterial[]
): TourWaypoint[] => {
  const walls = getWallsForVenue(venueTemplate, wallLayout);
  const waypoints: TourWaypoint[] = [];

  waypoints.push({
    cameraPos: new THREE.Vector3(0, 2, 12),
    lookAt: new THREE.Vector3(0, 2, 0),
    workId: null,
  });

  const sortedPlacements = [...placements].sort((a, b) => {
    if (a.wallIndex !== b.wallIndex) return a.wallIndex - b.wallIndex;
    return a.positionX - b.positionX;
  });

  sortedPlacements.forEach((placement) => {
    const wall = walls[placement.wallIndex];
    if (!wall) return;

    const cameraPos = wallToWorld(wall, placement.positionX, placement.positionY);
    const [wx, wy, wz] = wall.position;
    const [rx, ry, rz] = wall.rotation;
    const halfW = wall.width / 2;
    const halfH = wall.height / 2;
    const x = (placement.positionX - 0.5) * wall.width;
    const y = (placement.positionY - 0.5) * wall.height;

    const matrix = new THREE.Matrix4();
    matrix.makeRotationFromEuler(new THREE.Euler(rx, ry, rz));
    const right = new THREE.Vector3(1, 0, 0).applyMatrix4(matrix);
    const up = new THREE.Vector3(0, 1, 0).applyMatrix4(matrix);

    const lookAt = new THREE.Vector3(wx, wy, wz)
      .add(right.multiplyScalar(x))
      .add(up.multiplyScalar(y));

    waypoints.push({
      cameraPos,
      lookAt,
      workId: placement.workId,
    });
  });

  waypoints.push({
    cameraPos: new THREE.Vector3(0, 2, 12),
    lookAt: new THREE.Vector3(0, 2, 0),
    workId: null,
  });

  return waypoints;
};

export const interpolatePath = (
  waypoints: TourWaypoint[],
  progress: number
): { cameraPos: THREE.Vector3; lookAt: THREE.Vector3; currentWorkId: string | null } => {
  if (waypoints.length < 2) {
    return {
      cameraPos: waypoints[0]?.cameraPos || new THREE.Vector3(),
      lookAt: waypoints[0]?.lookAt || new THREE.Vector3(),
      currentWorkId: waypoints[0]?.workId || null,
    };
  }

  const segments = waypoints.length - 1;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const totalT = clampedProgress * segments;
  const segmentIndex = Math.min(Math.floor(totalT), segments - 1);
  const localT = totalT - segmentIndex;

  const p0 = waypoints[segmentIndex];
  const p1 = waypoints[segmentIndex + 1];
  const t = localT;

  const cameraPos = new THREE.Vector3().lerpVectors(p0.cameraPos, p1.cameraPos, t);
  const lookAt = new THREE.Vector3().lerpVectors(p0.lookAt, p1.lookAt, t);

  const pauseThreshold = 0.05;
  const currentWorkId =
    localT < pauseThreshold
      ? p0.workId
      : localT > 1 - pauseThreshold
      ? p1.workId
      : t > 0.5
      ? p1.workId
      : p0.workId;

  return { cameraPos, lookAt, currentWorkId };
};

export const getTourSegmentTimes = (
  waypoints: TourWaypoint[],
  baseSpeed: number
): { segmentDuration: number; pauseDuration: number } => {
  const workCount = waypoints.filter((w) => w.workId !== null).length;
  return {
    segmentDuration: (3 / baseSpeed) * 1000,
    pauseDuration: 2000,
  };
};
