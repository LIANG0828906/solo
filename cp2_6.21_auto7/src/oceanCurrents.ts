export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface OceanCurrent {
  id: string;
  name: string;
  nameEn: string;
  type: 'warm' | 'cold';
  isSeasonal: boolean;
  seasons: Season[];
  points: [number, number][];
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function rad2deg(rad: number): number {
  return rad * (180 / Math.PI);
}

function slerpPoint(p1: [number, number], p2: [number, number], t: number): [number, number] {
  const phi1 = deg2rad(p1[1]);
  const phi2 = deg2rad(p2[1]);
  const theta1 = deg2rad(p1[0]);
  const theta2 = deg2rad(p2[0]);

  const x1 = Math.cos(phi1) * Math.cos(theta1);
  const y1 = Math.cos(phi1) * Math.sin(theta1);
  const z1 = Math.sin(phi1);

  const x2 = Math.cos(phi2) * Math.cos(theta2);
  const y2 = Math.cos(phi2) * Math.sin(theta2);
  const z2 = Math.sin(phi2);

  const dot = Math.min(1, Math.max(-1, x1 * x2 + y1 * y2 + z1 * z2));
  const omega = Math.acos(dot);

  if (omega < 1e-6) {
    return p1;
  }

  const sinOmega = Math.sin(omega);
  const s1 = Math.sin((1 - t) * omega) / sinOmega;
  const s2 = Math.sin(t * omega) / sinOmega;

  const x = s1 * x1 + s2 * x2;
  const y = s1 * y1 + s2 * y2;
  const z = s1 * z1 + s2 * z2;

  const lat = rad2deg(Math.asin(Math.max(-1, Math.min(1, z))));
  const lon = rad2deg(Math.atan2(y, x));

  return [lon, lat];
}

export function interpolatePath(controlPoints: [number, number][], segmentsPerSegment: number): [number, number][] {
  if (controlPoints.length < 2) {
    return [...controlPoints];
  }

  const result: [number, number][] = [];
  const n = controlPoints.length;

  for (let i = 0; i < n - 1; i++) {
    const p0 = i === 0 ? controlPoints[0] : controlPoints[i - 1];
    const p1 = controlPoints[i];
    const p2 = controlPoints[i + 1];
    const p3 = i + 2 >= n ? controlPoints[n - 1] : controlPoints[i + 2];

    if (i === 0) {
      result.push([p1[0], p1[1]]);
    }

    for (let j = 1; j <= segmentsPerSegment; j++) {
      const t = j / segmentsPerSegment;
      const phi0 = deg2rad(p0[1]);
      const phi1 = deg2rad(p1[1]);
      const phi2 = deg2rad(p2[1]);
      const phi3 = deg2rad(p3[1]);
      const theta0 = deg2rad(p0[0]);
      const theta1 = deg2rad(p1[0]);
      const theta2 = deg2rad(p2[0]);
      const theta3 = deg2rad(p3[0]);

      const c0x = Math.cos(phi0) * Math.cos(theta0);
      const c0y = Math.cos(phi0) * Math.sin(theta0);
      const c0z = Math.sin(phi0);
      const c1x = Math.cos(phi1) * Math.cos(theta1);
      const c1y = Math.cos(phi1) * Math.sin(theta1);
      const c1z = Math.sin(phi1);
      const c2x = Math.cos(phi2) * Math.cos(theta2);
      const c2y = Math.cos(phi2) * Math.sin(theta2);
      const c2z = Math.sin(phi2);
      const c3x = Math.cos(phi3) * Math.cos(theta3);
      const c3y = Math.cos(phi3) * Math.sin(theta3);
      const c3z = Math.sin(phi3);

      const t2 = t * t;
      const t3 = t2 * t;

      let x = 0.5 * ((2 * c1x) + (-c0x + c2x) * t + (2 * c0x - 5 * c1x + 4 * c2x - c3x) * t2 + (-c0x + 3 * c1x - 3 * c2x + c3x) * t3);
      let y = 0.5 * ((2 * c1y) + (-c0y + c2y) * t + (2 * c0y - 5 * c1y + 4 * c2y - c3y) * t2 + (-c0y + 3 * c1y - 3 * c2y + c3y) * t3);
      let z = 0.5 * ((2 * c1z) + (-c0z + c2z) * t + (2 * c0z - 5 * c1z + 4 * c2z - c3z) * t2 + (-c0z + 3 * c1z - 3 * c2z + c3z) * t3);

      const len = Math.sqrt(x * x + y * y + z * z);
      if (len > 0) {
        x /= len;
        y /= len;
        z /= len;
      }

      const lat = rad2deg(Math.asin(Math.max(-1, Math.min(1, z))));
      const lon = rad2deg(Math.atan2(y, x));

      result.push([lon, lat]);
    }
  }

  return result;
}

export function getCurrentColor(type: 'warm' | 'cold', progress: number): { r: number; g: number; b: number } {
  const p = Math.max(0, Math.min(1, progress));
  let start: { r: number; g: number; b: number };
  let end: { r: number; g: number; b: number };

  if (type === 'warm') {
    start = { r: 0xff, g: 0x33, b: 0x33 };
    end = { r: 0xff, g: 0x99, b: 0x33 };
  } else {
    start = { r: 0x00, g: 0x66, b: 0xff };
    end = { r: 0x00, g: 0xff, b: 0xff };
  }

  return {
    r: Math.round(start.r + (end.r - start.r) * p),
    g: Math.round(start.g + (end.g - start.g) * p),
    b: Math.round(start.b + (end.b - start.b) * p),
  };
}

export function latLonToVector3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = deg2rad(lat);
  const theta = deg2rad(lon);
  const cosPhi = Math.cos(phi);
  return [
    radius * cosPhi * Math.cos(theta),
    radius * Math.sin(phi),
    radius * cosPhi * Math.sin(theta),
  ];
}

export function getMainCurrents(): OceanCurrent[] {
  const gulfStreamCP: [number, number][] = [
    [-87, 21],
    [-83, 24],
    [-81, 25],
    [-77, 30],
    [-72, 36],
    [-68, 40],
    [-60, 43],
    [-50, 45],
    [-35, 48],
    [-20, 50],
    [-10, 52],
  ];

  const northAtlanticDriftCP: [number, number][] = [
    [-45, 45],
    [-35, 48],
    [-25, 51],
    [-15, 53],
    [-5, 56],
    [5, 58],
    [15, 60],
    [25, 62],
  ];

  const northPacificCurrentCP: [number, number][] = [
    [140, 35],
    [150, 38],
    [170, 40],
    [180, 42],
    [-170, 43],
    [-155, 45],
    [-140, 48],
    [-135, 52],
    [-130, 55],
  ];

  const peruCurrentCP: [number, number][] = [
    [-75, -55],
    [-76, -45],
    [-77, -35],
    [-78, -25],
    [-79, -15],
    [-80, -8],
    [-86, -3],
    [-90, 0],
  ];

  const benguelaCurrentCP: [number, number][] = [
    [18, -34],
    [16, -28],
    [14, -22],
    [12, -17],
    [11, -12],
    [10, -8],
    [9, -5],
  ];

  const westAustralianCurrentCP: [number, number][] = [
    [115, -35],
    [114, -28],
    [113, -22],
    [112, -16],
    [113, -10],
    [115, -5],
    [118, -2],
  ];

  return [
    {
      id: 'gulf-stream',
      name: '墨西哥湾暖流',
      nameEn: 'Gulf Stream',
      type: 'warm',
      isSeasonal: false,
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      points: interpolatePath(gulfStreamCP, 7),
    },
    {
      id: 'north-atlantic-drift',
      name: '北大西洋暖流',
      nameEn: 'North Atlantic Drift',
      type: 'warm',
      isSeasonal: false,
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      points: interpolatePath(northAtlanticDriftCP, 10),
    },
    {
      id: 'north-pacific-current',
      name: '北太平洋暖流',
      nameEn: 'North Pacific Current',
      type: 'warm',
      isSeasonal: false,
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      points: interpolatePath(northPacificCurrentCP, 9),
    },
    {
      id: 'peru-current',
      name: '秘鲁寒流',
      nameEn: 'Peru Current',
      type: 'cold',
      isSeasonal: false,
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      points: interpolatePath(peruCurrentCP, 10),
    },
    {
      id: 'benguela-current',
      name: '本格拉寒流',
      nameEn: 'Benguela Current',
      type: 'cold',
      isSeasonal: false,
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      points: interpolatePath(benguelaCurrentCP, 12),
    },
    {
      id: 'west-australian-current',
      name: '西澳大利亚寒流',
      nameEn: 'West Australian Current',
      type: 'cold',
      isSeasonal: false,
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      points: interpolatePath(westAustralianCurrentCP, 12),
    },
  ];
}

export function getSeasonalCurrents(season: Season): OceanCurrent[] {
  const somaliCurrentCP: [number, number][] = [
    [51, 12],
    [52, 8],
    [53, 4],
    [54, 0],
    [55, -4],
    [57, -8],
  ];

  const northeastMonsoonDriftCP: [number, number][] = [
    [82, 16],
    [92, 14],
    [102, 12],
    [112, 11],
    [122, 10],
  ];

  const southwestMonsoonDriftCP: [number, number][] = [
    [62, 11],
    [72, 8],
    [82, 6],
    [92, 5],
    [102, 5],
  ];

  const okhotskCurrentCP: [number, number][] = [
    [142, 56],
    [147, 53],
    [150, 50],
    [153, 47],
    [155, 44],
  ];

  const allSeasonal: OceanCurrent[] = [
    {
      id: 'somali-current',
      name: '索马里暖流',
      nameEn: 'Somali Current',
      type: 'warm',
      isSeasonal: true,
      seasons: ['summer'],
      points: interpolatePath(somaliCurrentCP, 11),
    },
    {
      id: 'northeast-monsoon-drift',
      name: '东北季风漂流',
      nameEn: 'Northeast Monsoon Drift',
      type: 'cold',
      isSeasonal: true,
      seasons: ['winter'],
      points: interpolatePath(northeastMonsoonDriftCP, 14),
    },
    {
      id: 'southwest-monsoon-drift',
      name: '西南季风漂流',
      nameEn: 'Southwest Monsoon Drift',
      type: 'warm',
      isSeasonal: true,
      seasons: ['summer'],
      points: interpolatePath(southwestMonsoonDriftCP, 14),
    },
    {
      id: 'okhotsk-current',
      name: '鄂霍次克海寒流',
      nameEn: 'Okhotsk Current',
      type: 'cold',
      isSeasonal: true,
      seasons: ['winter'],
      points: interpolatePath(okhotskCurrentCP, 13),
    },
  ];

  return allSeasonal.filter((current) => current.seasons.includes(season));
}

export function getAllCurrents(): OceanCurrent[] {
  const main = getMainCurrents();
  const summer = getSeasonalCurrents('summer');
  const winter = getSeasonalCurrents('winter');
  return [...main, ...summer.filter((s) => !main.find((m) => m.id === s.id)), ...winter.filter((w) => !main.find((m) => m.id === w.id) && !summer.find((s) => s.id === w.id))];
}

export function getAllCurrentIds(): string[] {
  return getAllCurrents().map((current) => current.id);
}
