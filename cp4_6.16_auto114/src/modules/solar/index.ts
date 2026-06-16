import { BuildingData, SolarGrid } from '../../types';

const GRID_SIZE = 10;
const LATITUDE = 39.9;

const calculateSunPosition = (dayOfYear: number, hour: number): { altitude: number; azimuth: number } => {
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180);
  
  const hourAngle = (hour - 12) * 15 * Math.PI / 180;
  
  const latRad = LATITUDE * Math.PI / 180;
  
  const sinAltitude = Math.sin(latRad) * Math.sin(declination) + 
                    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));
  
  let azimuth = Math.acos(
    (Math.sin(declination) * Math.cos(latRad) - Math.cos(declination) * Math.sin(latRad) * Math.cos(hourAngle)) / 
    Math.cos(altitude)
  );
  
  if (hourAngle > 0) {
    azimuth = 2 * Math.PI - azimuth;
  }
  
  return {
    altitude: altitude * 180 / Math.PI,
    azimuth: azimuth * 180 / Math.PI
  };
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#B8860B';
  if (score >= 60) return '#FFD700';
  if (score >= 40) return '#FFFACD';
  return '#808080';
};

const calculateScore = (totalHours: number, maxHours: number): number => {
  const ratio = totalHours / maxHours;
  return Math.round(40 + ratio * 60);
};

const pointInPolygon = (point: { x: number; z: number }, polygon: { x: number; z: number }[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, zi = polygon[i].z;
    const xj = polygon[j].x, zj = polygon[j].z;
    
    if (((zi > point.z) !== (zj > point.z)) &&
        (point.x < (xj - xi) * (point.z - zi) / (zj - zi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
};

const getBuildingShadowPolygon = (
  building: BuildingData,
  sunAltitude: number,
  sunAzimuth: number
): { x: number; z: number }[] => {
  if (sunAltitude <= 0) return [];
  
  const shadowLength = building.height / Math.tan(sunAltitude * Math.PI / 180);
  const azimuthRad = sunAzimuth * Math.PI / 180;
  
  const dx = Math.sin(azimuthRad) * shadowLength;
  const dz = Math.cos(azimuthRad) * shadowLength;
  
  const halfW = building.width / 2;
  const halfD = building.depth / 2;
  
  const corners = [
    { x: building.x - halfW, z: building.z - halfD },
    { x: building.x + halfW, z: building.z - halfD },
    { x: building.x + halfW, z: building.z + halfD },
    { x: building.x - halfW, z: building.z + halfD },
  ];
  
  const shadowCorners = corners.map(c => ({
    x: c.x + dx,
    z: c.z + dz
  }));
  
  return [...corners, ...shadowCorners.reverse()];
};

const isPointInAnyShadow = (
  point: { x: number; z: number },
  buildings: BuildingData[],
  currentBuildingId: string,
  sunAltitude: number,
  sunAzimuth: number
): boolean => {
  for (const building of buildings) {
    if (building.id === currentBuildingId) continue;
    
    const shadowPoly = getBuildingShadowPolygon(building, sunAltitude, sunAzimuth);
    if (shadowPoly.length === 0) continue;
    
    if (pointInPolygon(point, shadowPoly)) {
      return true;
    }
  }
  return false;
};

export const evaluateSolarPotential = (
  building: BuildingData,
  buildings: BuildingData[]
): { grids: SolarGrid[]; totalArea: number; estimatedEnergy: number } => {
  const grids: SolarGrid[] = [];
  
  const cellWidth = building.width / GRID_SIZE;
  const cellDepth = building.depth / GRID_SIZE;
  
  let maxSunlightHours = 0;
  const gridSunlightHours: number[] = [];
  
  for (let gx = 0; gx < GRID_SIZE; gx++) {
    for (let gz = 0; gz < GRID_SIZE; gz++) {
      let totalHours = 0;
      
      const gridCenterX = building.x - building.width / 2 + (gx + 0.5) * cellWidth;
      const gridCenterZ = building.z - building.depth / 2 + (gz + 0.5) * cellDepth;
      
      for (let day = 1; day <= 365; day += 7) {
        for (let hour = 6; hour <= 20; hour++) {
          const { altitude, azimuth } = calculateSunPosition(day, hour);
          
          if (altitude > 0) {
            const inShadow = isPointInAnyShadow(
              { x: gridCenterX, z: gridCenterZ },
              buildings,
              building.id,
              altitude,
              azimuth
            );
            
            if (!inShadow) {
              totalHours += (1 / 52);
            }
          }
        }
      }
      
      gridSunlightHours.push(totalHours);
      maxSunlightHours = Math.max(maxSunlightHours, totalHours);
    }
  }
  
  for (let gx = 0; gx < GRID_SIZE; gx++) {
    for (let gz = 0; gz < GRID_SIZE; gz++) {
      const idx = gx * GRID_SIZE + gz;
      const totalHours = gridSunlightHours[idx];
      const score = calculateScore(totalHours, maxSunlightHours || 1);
      
      grids.push({
        gridX: gx,
        gridZ: gz,
        totalSunlightHours: Math.round(totalHours * 10) / 10,
        score,
        color: getScoreColor(score)
      });
    }
  }
  
  const totalArea = building.width * building.depth;
  
  const avgHours = gridSunlightHours.reduce((a, b) => a + b, 0) / gridSunlightHours.length;
  const efficiency = 0.18;
  const performanceRatio = 0.75;
  const estimatedEnergy = Math.round(totalArea * avgHours * 1000 * efficiency * performanceRatio / 1000);
  
  return {
    grids,
    totalArea: Math.round(totalArea * 100) / 100,
    estimatedEnergy
  };
};

export const calculateShadowCoverage = (
  building: BuildingData,
  buildings: BuildingData[],
  hour: number,
  dayOfYear: number
): number => {
  const { altitude, azimuth } = calculateSunPosition(dayOfYear, hour);
  
  if (altitude <= 0) return 100;
  
  const samplePoints = 25;
  let shadowedPoints = 0;
  
  const halfW = building.width / 2;
  const halfD = building.depth / 2;
  
  for (let i = 0; i < samplePoints; i++) {
    const px = building.x - halfW + Math.random() * building.width;
    const pz = building.z - halfD + Math.random() * building.depth;
    
    if (isPointInAnyShadow(
      { x: px, z: pz },
      buildings,
      building.id,
      altitude,
      azimuth
    )) {
      shadowedPoints++;
    }
  }
  
  return Math.round((shadowedPoints / samplePoints) * 100);
};

export const getDayName = (dayOfYear: number): string => {
  const date = new Date(2024, 0, 1);
  date.setDate(dayOfYear);
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return `${months[date.getMonth()]}${date.getDate()}日`;
};

export { calculateSunPosition };
