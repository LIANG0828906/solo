import { PlanetData, BirthInfo, ZodiacSign, PlanetName } from './types';

const ZODIAC_SIGNS: ZodiacSign[] = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const PLANET_NAMES: PlanetName[] = ['太阳', '月亮', '水星', '金星', '火星', '木星', '土星', '天王星', '海王星', '冥王星'];

const PLANET_BASE_PERIODS: Record<string, number> = {
  '太阳': 365.25,
  '月亮': 27.32,
  '水星': 87.97,
  '金星': 224.70,
  '火星': 686.98,
  '木星': 4332.59,
  '土星': 10759.22,
  '天王星': 30688.5,
  '海王星': 60182.0,
  '冥王星': 90560.0,
};

const PLANET_BASE_DEGREES: Record<string, number> = {
  '太阳': 0,
  '月亮': 120,
  '水星': 60,
  '金星': 180,
  '火星': 270,
  '木星': 30,
  '土星': 210,
  '天王星': 300,
  '海王星': 330,
  '冥王星': 90,
};

function julianDate(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + date.getUTCHours() / 24 + date.getUTCMinutes() / 1440;
  
  const a = Math.floor((14 - m) / 12);
  const year = y + 4800 - a;
  const month = m + 12 * a - 3;
  
  return d + Math.floor((153 * month + 2) / 5) + 365 * year + Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400) - 32045;
}

function calculatePlanetLongitude(planet: string, jd: number, birthInfo: BirthInfo): number {
  const basePeriod = PLANET_BASE_PERIODS[planet];
  const baseDegree = PLANET_BASE_DEGREES[planet];
  const daysSinceEpoch = jd - 2451545.0;
  
  const meanMotion = 360 / basePeriod;
  let longitude = (baseDegree + meanMotion * daysSinceEpoch) % 360;
  
  if (longitude < 0) longitude += 360;
  
  if (planet === '月亮') {
    longitude += Math.sin(daysSinceEpoch * 0.1) * 5;
  } else if (planet === '水星') {
    longitude += Math.sin(daysSinceEpoch * 0.05) * 3;
  } else if (planet === '火星') {
    longitude += Math.sin(daysSinceEpoch * 0.02) * 2;
  }
  
  const latEffect = birthInfo.latitude * 0.01;
  longitude += latEffect;
  
  return longitude % 360;
}

function longitudeToSign(longitude: number): ZodiacSign {
  const signIndex = Math.floor(longitude / 30) % 12;
  return ZODIAC_SIGNS[signIndex];
}

function longitudeToDegree(longitude: number): number {
  return longitude % 30;
}

function calculateHouses(jd: number, birthInfo: BirthInfo): number[] {
  const houses: number[] = [];
  const ascendant = (jd % 360 + birthInfo.longitude * 0.1 + 90) % 360;
  
  for (let i = 0; i < 12; i++) {
    const houseCusp = (ascendant + i * 30 + Math.sin(i + jd * 0.001) * 2) % 360;
    houses.push(houseCusp);
  }
  
  return houses;
}

function findHouse(longitude: number, houses: number[]): number {
  for (let i = 0; i < 12; i++) {
    const current = houses[i];
    const next = houses[(i + 1) % 12];
    
    if (current < next) {
      if (longitude >= current && longitude < next) return i + 1;
    } else {
      if (longitude >= current || longitude < next) return i + 1;
    }
  }
  return 1;
}

export function calculateChart(birthInfo: BirthInfo): { planets: PlanetData[]; houses: number[] } {
  const [year, month, day] = birthInfo.date.split('-').map(Number);
  const [hours, minutes] = birthInfo.time.split(':').map(Number);
  
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const jd = julianDate(date);
  
  const houses = calculateHouses(jd, birthInfo);
  
  const planets: PlanetData[] = PLANET_NAMES.map(name => {
    const longitude = calculatePlanetLongitude(name, jd, birthInfo);
    const sign = longitudeToSign(longitude);
    const degree = longitudeToDegree(longitude);
    const house = findHouse(longitude, houses);
    
    return {
      name,
      degree: parseFloat(degree.toFixed(2)),
      sign,
      house,
      longitude: parseFloat(longitude.toFixed(4)),
    };
  });
  
  return { planets, houses };
}

export function calculateAspects(planets: PlanetData[]): Array<{ planet1: string; planet2: string; type: string; angle: number }> {
  const aspects = [];
  const aspectTypes = [
    { name: '合相', angle: 0, orb: 8 },
    { name: '六分相', angle: 60, orb: 6 },
    { name: '四分相', angle: 90, orb: 8 },
    { name: '三分相', angle: 120, orb: 8 },
    { name: '对分相', angle: 180, orb: 8 },
  ];
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      let angle = Math.abs(p1.longitude - p2.longitude);
      if (angle > 180) angle = 360 - angle;
      
      for (const type of aspectTypes) {
        if (Math.abs(angle - type.angle) <= type.orb) {
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            type: type.name,
            angle: parseFloat(angle.toFixed(2)),
          });
          break;
        }
      }
    }
  }
  
  return aspects;
}
