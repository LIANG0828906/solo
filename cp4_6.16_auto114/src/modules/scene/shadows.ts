import * as THREE from 'three';
import { BuildingData } from '../../types';

export const calculateShadowPolygon = (
  building: BuildingData,
  sunAltitude: number,
  sunAzimuth: number
): THREE.Vector2[] => {
  if (sunAltitude <= 0) return [];
  
  const shadowLength = building.height / Math.tan(sunAltitude * Math.PI / 180);
  const azimuthRad = sunAzimuth * Math.PI / 180;
  
  const dx = Math.sin(azimuthRad) * shadowLength;
  const dz = Math.cos(azimuthRad) * shadowLength;
  
  const halfW = building.width / 2;
  const halfD = building.depth / 2;
  
  const baseCorners = [
    new THREE.Vector2(building.x - halfW, building.z - halfD),
    new THREE.Vector2(building.x + halfW, building.z - halfD),
    new THREE.Vector2(building.x + halfW, building.z + halfD),
    new THREE.Vector2(building.x - halfW, building.z + halfD),
  ];
  
  const shadowCorners = baseCorners.map(c => 
    new THREE.Vector2(c.x + dx, c.y + dz)
  );
  
  return [...baseCorners, ...shadowCorners.reverse()];
};

export const createShadowMesh = (
  building: BuildingData,
  sunAltitude: number,
  sunAzimuth: number
): THREE.Mesh | null => {
  const polygon = calculateShadowPolygon(building, sunAltitude, sunAzimuth);
  
  if (polygon.length === 0) return null;
  
  const shape = new THREE.Shape(polygon.map(p => new THREE.Vector2(p.x, p.y)));
  
  const geometry = new THREE.ShapeGeometry(shape);
  
  const shadowLength = building.height / Math.tan(sunAltitude * Math.PI / 180);
  const distance = shadowLength;
  
  const blurFactor = Math.min(distance / 100, 0.5);
  
  const material = new THREE.MeshBasicMaterial({
    color: 0x2a3545,
    transparent: true,
    opacity: 0.4 - blurFactor * 0.3,
    side: THREE.DoubleSide,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.01;
  mesh.userData = { buildingId: building.id };
  
  return mesh;
};

export const updateShadowMesh = (
  shadowMesh: THREE.Mesh,
  building: BuildingData,
  sunAltitude: number,
  sunAzimuth: number
): void => {
  const polygon = calculateShadowPolygon(building, sunAltitude, sunAzimuth);
  
  if (polygon.length === 0) {
    shadowMesh.visible = false;
    return;
  }
  
  shadowMesh.visible = true;
  
  const positions = new Float32Array(polygon.length * 3);
  for (let i = 0; i < polygon.length; i++) {
    positions[i * 3] = polygon[i].x;
    positions[i * 3 + 1] = 0.01;
    positions[i * 3 + 2] = polygon[i].y;
  }
  
  const indices: number[] = [];
  for (let i = 1; i < polygon.length - 1; i++) {
    indices.push(0, i, i + 1);
  }
  
  const geometry = shadowMesh.geometry;
  geometry.dispose();
  
  const newGeometry = new THREE.BufferGeometry();
  newGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  newGeometry.setIndex(indices);
  
  shadowMesh.geometry = newGeometry;
  newGeometry.computeVertexNormals();
  
  const distance = building.height / Math.tan(sunAltitude * Math.PI / 180);
  const blurFactor = Math.min(distance / 100, 0.5);
  
  const material = shadowMesh.material as THREE.MeshBasicMaterial;
  material.opacity = 0.4 - blurFactor * 0.3;
};

export const createAllShadowMeshes = (
  buildings: BuildingData[],
  sunAltitude: number,
  sunAzimuth: number
): Map<string, THREE.Mesh> => {
  const shadowMap = new Map<string, THREE.Mesh>();
  
  buildings.forEach(building => {
    const shadowMesh = createShadowMesh(building, sunAltitude, sunAzimuth);
    if (shadowMesh) {
      shadowMap.set(building.id, shadowMesh);
    }
  });
  
  return shadowMap;
};

export const updateAllShadowMeshes = (
  shadowMap: Map<string, THREE.Mesh>,
  buildings: BuildingData[],
  sunAltitude: number,
  sunAzimuth: number
): void => {
  buildings.forEach(building => {
    const shadowMesh = shadowMap.get(building.id);
    if (shadowMesh) {
      updateShadowMesh(shadowMesh, building, sunAltitude, sunAzimuth);
    }
  });
};

export const calculateBuildingShadowCoverage = (
  targetBuilding: BuildingData,
  buildings: BuildingData[],
  sunAltitude: number,
  sunAzimuth: number
): number => {
  if (sunAltitude <= 0) return 100;
  
  const samplePoints = 50;
  let shadowedPoints = 0;
  
  const halfW = targetBuilding.width / 2;
  const halfD = targetBuilding.depth / 2;
  
  for (let i = 0; i < samplePoints; i++) {
    const px = targetBuilding.x - halfW + Math.random() * targetBuilding.width;
    const pz = targetBuilding.z - halfD + Math.random() * targetBuilding.depth;
    const point = new THREE.Vector2(px, pz);
    
    for (const building of buildings) {
      if (building.id === targetBuilding.id) continue;
      
      const shadowPoly = calculateShadowPolygon(building, sunAltitude, sunAzimuth);
      if (shadowPoly.length === 0) continue;
      
      if (isPointInPolygon(point, shadowPoly)) {
        shadowedPoints++;
        break;
      }
    }
  }
  
  return Math.round((shadowedPoints / samplePoints) * 100);
};

const isPointInPolygon = (point: THREE.Vector2, polygon: THREE.Vector2[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, zi = polygon[i].y;
    const xj = polygon[j].x, zj = polygon[j].y;
    
    if (((zi > point.y) !== (zj > point.y)) &&
        (point.x < (xj - xi) * (point.y - zi) / (zj - zi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
};

export const createHeatmapTexture = (
  building: BuildingData,
  buildings: BuildingData[],
  dayOfYear: number
): THREE.CanvasTexture => {
  const resolution = 64;
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;
  
  const imageData = ctx.createImageData(resolution, resolution);
  const data = imageData.data;
  
  const halfW = building.width / 2;
  const halfD = building.depth / 2;
  
  const hours = [8, 10, 12, 14, 16, 18];
  
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const worldX = building.x - halfW + (x / resolution) * building.width;
      const worldZ = building.z - halfD + (y / resolution) * building.depth;
      const point = new THREE.Vector2(worldX, worldZ);
      
      let shadowHours = 0;
      
      for (const hour of hours) {
        const sunPos = calculateSunPositionForHour(dayOfYear, hour);
        
        if (sunPos.altitude > 0) {
          for (const b of buildings) {
            if (b.id === building.id) continue;
            
            const shadowPoly = calculateShadowPolygon(b, sunPos.altitude, sunPos.azimuth);
            
            if (shadowPoly.length > 0 && isPointInPolygon(point, shadowPoly)) {
              shadowHours++;
              break;
            }
          }
        } else {
          shadowHours++;
        }
      }
      
      const ratio = shadowHours / hours.length;
      const idx = (y * resolution + x) * 4;
      
      const color = getHeatmapColor(ratio);
      
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 180;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  return texture;
};

const calculateSunPositionForHour = (dayOfYear: number, hour: number): { altitude: number; azimuth: number } => {
  const LATITUDE = 39.9;
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180);
  const hourAngle = (hour - 12) * 15 * Math.PI / 180;
  const latRad = LATITUDE * Math.PI / 180;
  
  const sinAltitude = Math.sin(latRad) * Math.sin(declination * Math.PI / 180) + 
                    Math.cos(latRad) * Math.cos(declination * Math.PI / 180) * Math.cos(hourAngle);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude))) * 180 / Math.PI;
  
  let azimuth = Math.acos(
    (Math.sin(declination * Math.PI / 180) * Math.cos(latRad) - 
    Math.cos(declination * Math.PI / 180) * Math.sin(latRad) * Math.cos(hourAngle)) / 
    Math.cos(altitude * Math.PI / 180)) * 180 / Math.PI;
  
  if (hourAngle > 0) {
    azimuth = 360 - azimuth;
  }
  
  return { altitude, azimuth };
};

const getHeatmapColor = (ratio: number): { r: number; g: number; b: number } => {
  if (ratio < 0.25) {
    return { r: 0, g: Math.floor(ratio * 4 * 255), b: 255 };
  } else if (ratio < 0.5) {
    const t = (ratio - 0.25) * 4;
    return { r: 0, g: 255, b: Math.floor(255 * (1 - t)) };
  } else if (ratio < 0.75) {
    const t = (ratio - 0.5) * 4;
    return { r: Math.floor(t * 255), g: 255, b: 0 };
  } else {
    const t = (ratio - 0.75) * 4;
    return { r: 255, g: Math.floor(255 * (1 - t)), b: 0 };
  }
};
