export interface PathPoint {
  time: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface PlateData {
  id: string;
  name: string;
  area: number;
  driftSpeed: number;
  color: string;
  pathPoints: PathPoint[];
  outlinePoints: [number, number][];
}

export interface GeologicalPeriod {
  name: string;
  startTime: number;
  endTime: number;
}

export const geologicalPeriods: GeologicalPeriod[] = [
  { name: '石炭纪', startTime: -300, endTime: -299 },
  { name: '二叠纪', startTime: -299, endTime: -252 },
  { name: '三叠纪', startTime: -252, endTime: -201 },
  { name: '侏罗纪', startTime: -201, endTime: -145 },
  { name: '白垩纪', startTime: -145, endTime: -66 },
  { name: '古近纪', startTime: -66, endTime: -23 },
  { name: '新近纪', startTime: -23, endTime: -2.6 },
  { name: '第四纪', startTime: -2.6, endTime: 0 },
];

export function getGeologicalPeriod(time: number): string {
  for (const period of geologicalPeriods) {
    if (time <= period.startTime && time > period.endTime) {
      return period.name;
    }
  }
  return '现代';
}

function latLonToVector3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

const EARTH_RADIUS = 5.01;

function createOutlineFromCenter(
  centerLat: number,
  centerLon: number,
  latRange: number,
  lonRange: number,
  segments: number
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const latOffset = Math.sin(angle) * latRange;
    const lonOffset = Math.cos(angle) * lonRange;
    points.push([
      centerLat + latOffset,
      centerLon + lonOffset,
    ]);
  }
  return points;
}

export const plateData: PlateData[] = [
  {
    id: 'north-america',
    name: '北美板块',
    area: 75.9,
    driftSpeed: 2.3,
    color: '#8B9A6E',
    outlinePoints: createOutlineFromCenter(40, -95, 18, 25, 32),
    pathPoints: [
      {
        time: -300,
        position: latLonToVector3(30, -30, EARTH_RADIUS),
        rotation: [0, 0.5, 0],
      },
      {
        time: -200,
        position: latLonToVector3(35, -45, EARTH_RADIUS),
        rotation: [0, 0.3, 0],
      },
      {
        time: -100,
        position: latLonToVector3(38, -70, EARTH_RADIUS),
        rotation: [0, 0.1, 0],
      },
      {
        time: -50,
        position: latLonToVector3(40, -85, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
      {
        time: 0,
        position: latLonToVector3(42, -95, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
    ],
  },
  {
    id: 'south-america',
    name: '南美板块',
    area: 43.6,
    driftSpeed: 2.1,
    color: '#8B9A6E',
    outlinePoints: createOutlineFromCenter(-15, -60, 20, 12, 32),
    pathPoints: [
      {
        time: -300,
        position: latLonToVector3(-10, -30, EARTH_RADIUS),
        rotation: [0, -0.5, 0],
      },
      {
        time: -200,
        position: latLonToVector3(-12, -35, EARTH_RADIUS),
        rotation: [0, -0.3, 0],
      },
      {
        time: -100,
        position: latLonToVector3(-14, -45, EARTH_RADIUS),
        rotation: [0, -0.1, 0],
      },
      {
        time: -50,
        position: latLonToVector3(-15, -55, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
      {
        time: 0,
        position: latLonToVector3(-15, -60, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
    ],
  },
  {
    id: 'africa',
    name: '非洲板块',
    area: 78.5,
    driftSpeed: 2.5,
    color: '#8B9A6E',
    outlinePoints: createOutlineFromCenter(5, 20, 22, 18, 32),
    pathPoints: [
      {
        time: -300,
        position: latLonToVector3(0, 0, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
      {
        time: -200,
        position: latLonToVector3(2, 5, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
      {
        time: -100,
        position: latLonToVector3(4, 12, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
      {
        time: -50,
        position: latLonToVector3(5, 18, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
      {
        time: 0,
        position: latLonToVector3(5, 20, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
    ],
  },
  {
    id: 'eurasia',
    name: '欧亚板块',
    area: 67.8,
    driftSpeed: 2.0,
    color: '#8B9A6E',
    outlinePoints: createOutlineFromCenter(50, 80, 25, 35, 32),
    pathPoints: [
      {
        time: -300,
        position: latLonToVector3(45, 30, EARTH_RADIUS),
        rotation: [0, -0.3, 0],
      },
      {
        time: -200,
        position: latLonToVector3(48, 50, EARTH_RADIUS),
        rotation: [0, -0.2, 0],
      },
      {
        time: -100,
        position: latLonToVector3(50, 65, EARTH_RADIUS),
        rotation: [0, -0.1, 0],
      },
      {
        time: -50,
        position: latLonToVector3(50, 75, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
      {
        time: 0,
        position: latLonToVector3(50, 80, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
    ],
  },
  {
    id: 'australia',
    name: '澳洲板块',
    area: 47.3,
    driftSpeed: 5.6,
    color: '#8B9A6E',
    outlinePoints: createOutlineFromCenter(-25, 135, 15, 20, 32),
    pathPoints: [
      {
        time: -300,
        position: latLonToVector3(-50, 60, EARTH_RADIUS),
        rotation: [0, 0.5, 0.2],
      },
      {
        time: -200,
        position: latLonToVector3(-45, 80, EARTH_RADIUS),
        rotation: [0, 0.4, 0.15],
      },
      {
        time: -100,
        position: latLonToVector3(-35, 100, EARTH_RADIUS),
        rotation: [0, 0.2, 0.1],
      },
      {
        time: -50,
        position: latLonToVector3(-30, 120, EARTH_RADIUS),
        rotation: [0, 0.1, 0.05],
      },
      {
        time: 0,
        position: latLonToVector3(-25, 135, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
    ],
  },
  {
    id: 'antarctica',
    name: '南极板块',
    area: 60.9,
    driftSpeed: 1.5,
    color: '#8B9A6E',
    outlinePoints: createOutlineFromCenter(-85, 0, 10, 180, 32),
    pathPoints: [
      {
        time: -300,
        position: latLonToVector3(-65, 0, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
      {
        time: -200,
        position: latLonToVector3(-70, 0, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
      {
        time: -100,
        position: latLonToVector3(-80, 0, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
      {
        time: -50,
        position: latLonToVector3(-83, 0, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
      {
        time: 0,
        position: latLonToVector3(-85, 0, EARTH_RADIUS),
        rotation: [0, 0, 0],
      },
    ],
  },
];
