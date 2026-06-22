import * as THREE from 'three';
import { GeometryObject, RayPath, RT60Data, HeatmapData, MaterialType } from '../types';
import { getAbsorptionCoefficient } from '../utils/materials';

const MAX_REFLECTIONS = 5;
const RAY_COUNT = 128;
const RECEIVER_RADIUS = 0.5;
const ENERGY_THRESHOLD = 0.01;
const GRID_SIZE = 24;
const CELL_SIZE = 0.5;
const GRID_EXTENT = 6;

const AIR_ABSORPTION = {
  low: 0.001,
  mid: 0.005,
  high: 0.02,
};

export const generateFibonacciSphere = (count: number): THREE.Vector3[] => {
  const points: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;

    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;

    points.push(new THREE.Vector3(x, y, z).normalize());
  }

  return points;
};

const createMeshFromGeometry = (geo: GeometryObject): THREE.Mesh => {
  let geometry: THREE.BufferGeometry;

  switch (geo.type) {
    case 'wall':
      geometry = new THREE.BoxGeometry(geo.size.x, geo.size.y, geo.size.z);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(
        geo.size.x / 2,
        geo.size.x / 2,
        geo.size.y,
        32
      );
      break;
    case 'wedge':
      geometry = new THREE.ConeGeometry(geo.size.x / 2, geo.size.y, 4);
      break;
    default:
      geometry = new THREE.BoxGeometry(geo.size.x, geo.size.y, geo.size.z);
  }

  const mesh = new THREE.Mesh(geometry);
  mesh.position.set(geo.position.x, geo.position.y, geo.position.z);
  mesh.rotation.set(geo.rotation.x, geo.rotation.y, geo.rotation.z);
  mesh.updateMatrixWorld();
  mesh.userData = { material: geo.material, id: geo.id };

  return mesh;
};

interface RayTraceResult {
  paths: RayPath[];
  rt60: RT60Data;
  heatmap: HeatmapData;
}

export const simulateRays = (
  sourcePos: { x: number; y: number; z: number },
  receiverPositions: { x: number; y: number; z: number }[],
  geometries: GeometryObject[]
): RayTraceResult => {
  const meshes = geometries.map(createMeshFromGeometry);
  const raycaster = new THREE.Raycaster();
  const source = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
  const directions = generateFibonacciSphere(RAY_COUNT);

  const paths: RayPath[] = [];
  const validPaths: RayPath[] = [];

  directions.forEach((direction, rayIndex) => {
    const points: THREE.Vector3[] = [source.clone()];
    let currentPos = source.clone();
    let currentDir = direction.clone();
    let energy = 1.0;
    let reflections = 0;
    let totalLength = 0;
    let reachedReceiver = false;
    let receiverIndex = -1;

    for (let bounce = 0; bounce <= MAX_REFLECTIONS; bounce++) {
      raycaster.set(currentPos, currentDir);
      raycaster.far = 100;

      const intersects = raycaster.intersectObjects(meshes, false);

      let hitReceiver = false;
      let closestReceiverDist = Infinity;
      let closestReceiverIndex = -1;

      receiverPositions.forEach((recv, idx) => {
        const recvPos = new THREE.Vector3(recv.x, recv.y, recv.z);
        const toReceiver = recvPos.clone().sub(currentPos);
        const distAlongRay = toReceiver.dot(currentDir);

        if (distAlongRay > 0.01) {
          const closestPoint = currentPos.clone().add(
            currentDir.clone().multiplyScalar(distAlongRay)
          );
          const distToRay = recvPos.distanceTo(closestPoint);

          if (distToRay < RECEIVER_RADIUS && distAlongRay < closestReceiverDist) {
            let blocked = false;
            if (intersects.length > 0) {
              const closestHit = intersects[0].distance;
              if (closestHit < distAlongRay) {
                blocked = true;
              }
            }

            if (!blocked) {
              hitReceiver = true;
              closestReceiverDist = distAlongRay;
              closestReceiverIndex = idx;
            }
          }
        }
      });

      if (hitReceiver && closestReceiverIndex >= 0) {
        const recvPos = receiverPositions[closestReceiverIndex];
        const hitPoint = new THREE.Vector3(recvPos.x, recvPos.y, recvPos.z);
        const distToReceiver = currentPos.distanceTo(hitPoint);

        const airAbsorptionFactor = Math.exp(
          -AIR_ABSORPTION.mid * distToReceiver
        );
        energy *= airAbsorptionFactor;
        totalLength += distToReceiver;

        points.push(hitPoint);
        reachedReceiver = true;
        receiverIndex = closestReceiverIndex;
        break;
      }

      if (intersects.length === 0) {
        const endPoint = currentPos
          .clone()
          .add(currentDir.clone().multiplyScalar(50));
        totalLength += 50;
        energy *= Math.exp(-AIR_ABSORPTION.mid * 50);
        points.push(endPoint);
        break;
      }

      const hit = intersects[0];
      const hitPoint = hit.point.clone();
      const hitDistance = hit.distance;

      totalLength += hitDistance;

      const airAbsorptionFactor = Math.exp(
        -AIR_ABSORPTION.mid * hitDistance
      );
      energy *= airAbsorptionFactor;

      points.push(hitPoint.clone());

      if (bounce < MAX_REFLECTIONS) {
        const material = hit.object.userData.material as MaterialType;
        const absorption = getAbsorptionCoefficient(material, 'mid');
        energy *= 1 - absorption;

        if (energy < ENERGY_THRESHOLD) {
          break;
        }

        const normal = hit.face?.normal.clone() || new THREE.Vector3(0, 1, 0);
        normal.transformDirection(hit.object.matrixWorld);
        normal.normalize();

        currentDir = currentDir
          .clone()
          .reflect(normal)
          .normalize();

        currentPos = hitPoint.clone().add(currentDir.clone().multiplyScalar(0.001));
        reflections++;
      } else {
        break;
      }
    }

    const path: RayPath = {
      id: `ray-${rayIndex}`,
      points: points.map((p) => ({ x: p.x, y: p.y, z: p.z })),
      totalLength: parseFloat(totalLength.toFixed(2)),
      energyLoss: parseFloat(((1 - energy) * 100).toFixed(1)),
      reflections,
      isValid: reachedReceiver,
      receiverIndex: reachedReceiver ? receiverIndex : undefined,
    };

    paths.push(path);

    if (reachedReceiver) {
      validPaths.push(path);
    }
  });

  const rt60 = calculateRT60(geometries);
  const heatmap = calculateHeatmap(source, meshes, geometries);

  return {
    allPaths: paths,
    validPaths: validPaths,
    rt60,
    heatmap,
  };
};

const calculateRT60 = (geometries: GeometryObject[]): RT60Data => {
  let totalSurfaceArea = 0;
  let totalAbsorptionLow = 0;
  let totalAbsorptionMid = 0;
  let totalAbsorptionHigh = 0;
  let totalVolume = 0;

  geometries.forEach((geo) => {
    let surfaceArea = 0;
    let volume = 0;

    switch (geo.type) {
      case 'wall':
        surfaceArea =
          2 *
          (geo.size.x * geo.size.y +
            geo.size.y * geo.size.z +
            geo.size.x * geo.size.z);
        volume = geo.size.x * geo.size.y * geo.size.z;
        break;
      case 'cylinder':
        const radius = geo.size.x / 2;
        surfaceArea =
          2 * Math.PI * radius * geo.size.y + 2 * Math.PI * radius * radius;
        volume = Math.PI * radius * radius * geo.size.y;
        break;
      case 'wedge':
        const baseRadius = geo.size.x / 2;
        const slantHeight = Math.sqrt(
          baseRadius * baseRadius + geo.size.y * geo.size.y
        );
        surfaceArea =
          Math.PI * baseRadius * baseRadius +
          Math.PI * baseRadius * slantHeight;
        volume = (1 / 3) * Math.PI * baseRadius * baseRadius * geo.size.y;
        break;
    }

    const absLow = getAbsorptionCoefficient(geo.material, 'low');
    const absMid = getAbsorptionCoefficient(geo.material, 'mid');
    const absHigh = getAbsorptionCoefficient(geo.material, 'high');

    totalSurfaceArea += surfaceArea;
    totalAbsorptionLow += surfaceArea * absLow;
    totalAbsorptionMid += surfaceArea * absMid;
    totalAbsorptionHigh += surfaceArea * absHigh;
    totalVolume += volume;
  });

  if (totalSurfaceArea === 0) {
    return { low: 0, mid: 0, high: 0 };
  }

  const effectiveVolume = Math.max(totalVolume, 10);

  const calculateRT = (
    absorption: number,
    airAbsorption: number
  ): number => {
    if (absorption <= 0) return 10;
    const effectiveAbsorption = absorption + 4 * airAbsorption * effectiveVolume;
    return 0.161 * effectiveVolume / effectiveAbsorption;
  };

  return {
    low: parseFloat(calculateRT(totalAbsorptionLow, AIR_ABSORPTION.low).toFixed(2)),
    mid: parseFloat(calculateRT(totalAbsorptionMid, AIR_ABSORPTION.mid).toFixed(2)),
    high: parseFloat(calculateRT(totalAbsorptionHigh, AIR_ABSORPTION.high).toFixed(2)),
  };
};

const calculateHeatmap = (
  source: THREE.Vector3,
  meshes: THREE.Mesh[],
  geometries: GeometryObject[]
): HeatmapData => {
  const values: number[][] = [];
  const raycaster = new THREE.Raycaster();

  for (let i = 0; i < GRID_SIZE; i++) {
    values[i] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      const x = -GRID_EXTENT + i * CELL_SIZE;
      const z = -GRID_EXTENT + j * CELL_SIZE;
      const gridPoint = new THREE.Vector3(x, 0.01, z);

      const toPoint = gridPoint.clone().sub(source);
      const distance = toPoint.length();

      if (distance < 0.1) {
        values[i][j] = 1.0;
        continue;
      }

      const direction = toPoint.normalize();
      raycaster.set(source, direction);
      raycaster.far = distance - 0.1;

      const intersects = raycaster.intersectObjects(meshes, false);
      const blocked = intersects.length > 0;

      let directEnergy = 0;
      if (!blocked) {
        directEnergy = 1 / (distance * distance);
      }

      let reflectedEnergy = 0;
      if (blocked) {
        const sampleDirections = generateFibonacciSphere(32);
        let totalReflected = 0;
        let validSamples = 0;

        sampleDirections.forEach((sampleDir) => {
          raycaster.set(source, sampleDir);
          const firstHits = raycaster.intersectObjects(meshes, false);

          if (firstHits.length > 0) {
            const hit = firstHits[0];
            const normal = hit.face?.normal.clone() || new THREE.Vector3(0, 1, 0);
            normal.transformDirection(hit.object.matrixWorld).normalize();

            const reflectDir = sampleDir.clone().reflect(normal).normalize();
            const reflectOrigin = hit.point
              .clone()
              .add(reflectDir.clone().multiplyScalar(0.01));

            const toGrid = gridPoint.clone().sub(reflectOrigin);
            const gridDist = toGrid.length();
            const gridDir = toGrid.normalize();

            const dotProduct = reflectDir.dot(gridDir);
            if (dotProduct > 0.5) {
              raycaster.set(reflectOrigin, gridDir);
              raycaster.far = gridDist - 0.1;
              const secondHits = raycaster.intersectObjects(meshes, false);

              if (secondHits.length === 0) {
                const material = hit.object.userData.material as MaterialType;
                const absorption = getAbsorptionCoefficient(material, 'mid');
                const reflected =
                  (1 - absorption) / (hit.distance * hit.distance * gridDist * gridDist);
                totalReflected += reflected;
                validSamples++;
              }
            }
          }
        });

        if (validSamples > 0) {
          reflectedEnergy = totalReflected / validSamples;
        }
      }

      values[i][j] = Math.min(directEnergy + reflectedEnergy * 5, 1.0);
    }
  }

  let maxValue = 0;
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (values[i][j] > maxValue) {
        maxValue = values[i][j];
      }
    }
  }

  if (maxValue > 0) {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        values[i][j] = Math.min(values[i][j] / maxValue, 1.0);
      }
    }
  }

  return {
    gridSize: GRID_SIZE,
    cellSize: CELL_SIZE,
    values,
  };
};
