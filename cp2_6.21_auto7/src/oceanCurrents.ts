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

function generatePoints(startLon: number, startLat: number, endLon: number, endLat: number, segments: number = 60): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lon = startLon + (endLon - startLon) * t + Math.sin(t * Math.PI) * 10;
    const lat = startLat + (endLat - startLat) * t + Math.sin(t * Math.PI * 2) * 5;
    points.push([lon, lat]);
  }
  return points;
}

export function getMainCurrents(): OceanCurrent[] {
  return [
    {
      id: 'gulf-stream',
      name: '墨西哥湾暖流',
      nameEn: 'Gulf Stream',
      type: 'warm',
      isSeasonal: false,
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      points: generatePoints(-80, 25, -10, 50, 70),
    },
    {
      id: 'north-atlantic-drift',
      name: '北大西洋暖流',
      nameEn: 'North Atlantic Drift',
      type: 'warm',
      isSeasonal: false,
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      points: generatePoints(-10, 50, 30, 60, 60),
    },
    {
      id: 'north-pacific-current',
      name: '北太平洋暖流',
      nameEn: 'North Pacific Current',
      type: 'warm',
      isSeasonal: false,
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      points: generatePoints(120, 35, -130, 45, 70),
    },
    {
      id: 'peru-current',
      name: '秘鲁寒流',
      nameEn: 'Peru Current',
      type: 'cold',
      isSeasonal: false,
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      points: generatePoints(-80, -10, -85, -40, 60),
    },
    {
      id: 'benguela-current',
      name: '本格拉寒流',
      nameEn: 'Benguela Current',
      type: 'cold',
      isSeasonal: false,
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      points: generatePoints(10, -20, 15, -45, 60),
    },
    {
      id: 'west-australian-current',
      name: '西澳大利亚寒流',
      nameEn: 'West Australian Current',
      type: 'cold',
      isSeasonal: false,
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      points: generatePoints(110, -20, 115, -45, 60),
    },
  ];
}

export function getSeasonalCurrents(season: Season): OceanCurrent[] {
  const allSeasonal: OceanCurrent[] = [
    {
      id: 'somali-current',
      name: '索马里暖流',
      nameEn: 'Somali Current',
      type: 'warm',
      isSeasonal: true,
      seasons: ['summer'],
      points: generatePoints(50, 10, 60, -10, 50),
    },
    {
      id: 'northeast-monsoon-drift',
      name: '东北季风漂流',
      nameEn: 'Northeast Monsoon Drift',
      type: 'cold',
      isSeasonal: true,
      seasons: ['winter'],
      points: generatePoints(80, 15, 120, 10, 55),
    },
    {
      id: 'southwest-monsoon-drift',
      name: '西南季风漂流',
      nameEn: 'Southwest Monsoon Drift',
      type: 'warm',
      isSeasonal: true,
      seasons: ['summer'],
      points: generatePoints(60, 10, 100, 5, 55),
    },
    {
      id: 'okhotsk-current',
      name: '鄂霍次克海寒流',
      nameEn: 'Okhotsk Current',
      type: 'cold',
      isSeasonal: true,
      seasons: ['winter'],
      points: generatePoints(140, 55, 155, 45, 50),
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
