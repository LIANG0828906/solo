export interface StarData {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  apparentMagnitude: number;
  absoluteMagnitude: number;
  bvColorIndex: number;
  spectralType: string;
  constellation: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface ConstellationData {
  id: string;
  name: string;
  chineseName: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  stars: StarData[];
  connections: [number, number][];
}

const famousStars: Record<string, StarData> = {
  dubhe: {
    id: 'dubhe',
    name: 'Dubhe (α UMa)',
    x: 35,
    y: 65,
    z: 12,
    apparentMagnitude: 1.79,
    absoluteMagnitude: -1.09,
    bvColorIndex: 1.03,
    spectralType: 'K0III',
    constellation: '大熊座',
    season: 'spring'
  },
  merak: {
    id: 'merak',
    name: 'Merak (β UMa)',
    x: 28,
    y: 58,
    z: 10,
    apparentMagnitude: 2.37,
    absoluteMagnitude: 0.52,
    bvColorIndex: 0.00,
    spectralType: 'A1V',
    constellation: '大熊座',
    season: 'spring'
  },
  phecda: {
    id: 'phecda',
    name: 'Phecda (γ UMa)',
    x: 32,
    y: 52,
    z: 18,
    apparentMagnitude: 2.44,
    absoluteMagnitude: 0.28,
    bvColorIndex: 0.00,
    spectralType: 'A0V',
    constellation: '大熊座',
    season: 'spring'
  },
  megrez: {
    id: 'megrez',
    name: 'Megrez (δ UMa)',
    x: 40,
    y: 55,
    z: 15,
    apparentMagnitude: 3.31,
    absoluteMagnitude: 1.40,
    bvColorIndex: 0.12,
    spectralType: 'A5V',
    constellation: '大熊座',
    season: 'spring'
  },
  alioth: {
    id: 'alioth',
    name: 'Alioth (ε UMa)',
    x: 50,
    y: 58,
    z: 12,
    apparentMagnitude: 1.77,
    absoluteMagnitude: -0.21,
    bvColorIndex: 0.07,
    spectralType: 'A0p',
    constellation: '大熊座',
    season: 'spring'
  },
  mizar: {
    id: 'mizar',
    name: 'Mizar (ζ UMa)',
    x: 58,
    y: 62,
    z: 10,
    apparentMagnitude: 2.27,
    absoluteMagnitude: 0.32,
    bvColorIndex: 0.01,
    spectralType: 'A2V',
    constellation: '大熊座',
    season: 'spring'
  },
  alkaid: {
    id: 'alkaid',
    name: 'Alkaid (η UMa)',
    x: 65,
    y: 68,
    z: 8,
    apparentMagnitude: 1.86,
    absoluteMagnitude: -0.60,
    bvColorIndex: -0.07,
    spectralType: 'B3V',
    constellation: '大熊座',
    season: 'spring'
  },
  polaris: {
    id: 'polaris',
    name: 'Polaris (α UMi)',
    x: 0,
    y: 85,
    z: 0,
    apparentMagnitude: 1.98,
    absoluteMagnitude: -3.6,
    bvColorIndex: 0.60,
    spectralType: 'F7Ib',
    constellation: '小熊座',
    season: 'spring'
  },
  kochab: {
    id: 'kochab',
    name: 'Kochab (β UMi)',
    x: -8,
    y: 72,
    z: 15,
    apparentMagnitude: 2.08,
    absoluteMagnitude: -0.87,
    bvColorIndex: 1.17,
    spectralType: 'K4III',
    constellation: '小熊座',
    season: 'spring'
  },
  vega: {
    id: 'vega',
    name: 'Vega (α Lyr)',
    x: -20,
    y: 20,
    z: 75,
    apparentMagnitude: 0.03,
    absoluteMagnitude: 0.58,
    bvColorIndex: 0.00,
    spectralType: 'A0V',
    constellation: '天琴座',
    season: 'summer'
  },
  deneb: {
    id: 'deneb',
    name: 'Deneb (α Cyg)',
    x: -45,
    y: 35,
    z: 55,
    apparentMagnitude: 1.25,
    absoluteMagnitude: -8.38,
    bvColorIndex: 0.69,
    spectralType: 'A2Ia',
    constellation: '天鹅座',
    season: 'summer'
  },
  altair: {
    id: 'altair',
    name: 'Altair (α Aql)',
    x: -30,
    y: -5,
    z: 70,
    apparentMagnitude: 0.77,
    absoluteMagnitude: 2.21,
    bvColorIndex: 0.22,
    spectralType: 'A7V',
    constellation: '天鹰座',
    season: 'summer'
  },
  antares: {
    id: 'antares',
    name: 'Antares (α Sco)',
    x: 60,
    y: -25,
    z: 45,
    apparentMagnitude: 0.96,
    absoluteMagnitude: -5.28,
    bvColorIndex: 1.83,
    spectralType: 'M1.5Iab',
    constellation: '天蝎座',
    season: 'summer'
  },
  arcturus: {
    id: 'arcturus',
    name: 'Arcturus (α Boo)',
    x: 45,
    y: 45,
    z: -45,
    apparentMagnitude: -0.05,
    absoluteMagnitude: -0.31,
    bvColorIndex: 1.23,
    spectralType: 'K1.5III',
    constellation: '牧夫座',
    season: 'spring'
  },
  spica: {
    id: 'spica',
    name: 'Spica (α Vir)',
    x: 55,
    y: -15,
    z: -55,
    apparentMagnitude: 0.97,
    absoluteMagnitude: -3.55,
    bvColorIndex: -0.23,
    spectralType: 'B1V',
    constellation: '室女座',
    season: 'spring'
  },
  regulus: {
    id: 'regulus',
    name: 'Regulus (α Leo)',
    x: 50,
    y: 25,
    z: -50,
    apparentMagnitude: 1.40,
    absoluteMagnitude: -0.52,
    bvColorIndex: -0.07,
    spectralType: 'B8IV',
    constellation: '狮子座',
    season: 'spring'
  },
  betelgeuse: {
    id: 'betelgeuse',
    name: 'Betelgeuse (α Ori)',
    x: -55,
    y: 30,
    z: -55,
    apparentMagnitude: 0.42,
    absoluteMagnitude: -5.85,
    bvColorIndex: 1.85,
    spectralType: 'M2Iab',
    constellation: '猎户座',
    season: 'winter'
  },
  rigel: {
    id: 'rigel',
    name: 'Rigel (β Ori)',
    x: -60,
    y: 20,
    z: -60,
    apparentMagnitude: 0.18,
    absoluteMagnitude: -7.84,
    bvColorIndex: -0.06,
    spectralType: 'B8Ia',
    constellation: '猎户座',
    season: 'winter'
  },
  bellatrix: {
    id: 'bellatrix',
    name: 'Bellatrix (γ Ori)',
    x: -50,
    y: 35,
    z: -52,
    apparentMagnitude: 1.64,
    absoluteMagnitude: -2.78,
    bvColorIndex: -0.22,
    spectralType: 'B2III',
    constellation: '猎户座',
    season: 'winter'
  },
  mintaka: {
    id: 'mintaka',
    name: 'Mintaka (δ Ori)',
    x: -52,
    y: 28,
    z: -58,
    apparentMagnitude: 2.23,
    absoluteMagnitude: -5.8,
    bvColorIndex: -0.16,
    spectralType: 'O9.5II',
    constellation: '猎户座',
    season: 'winter'
  },
  alnilam: {
    id: 'alnilam',
    name: 'Alnilam (ε Ori)',
    x: -55,
    y: 25,
    z: -57,
    apparentMagnitude: 1.70,
    absoluteMagnitude: -6.38,
    bvColorIndex: -0.19,
    spectralType: 'B0Ia',
    constellation: '猎户座',
    season: 'winter'
  },
  alnitak: {
    id: 'alnitak',
    name: 'Alnitak (ζ Ori)',
    x: -58,
    y: 22,
    z: -56,
    apparentMagnitude: 1.77,
    absoluteMagnitude: -5.96,
    bvColorIndex: -0.19,
    spectralType: 'O9.5Ib',
    constellation: '猎户座',
    season: 'winter'
  },
  saiph: {
    id: 'saiph',
    name: 'Saiph (κ Ori)',
    x: -62,
    y: 18,
    z: -54,
    apparentMagnitude: 2.06,
    absoluteMagnitude: -4.65,
    bvColorIndex: -0.23,
    spectralType: 'B0.5Ia',
    constellation: '猎户座',
    season: 'winter'
  },
  sirius: {
    id: 'sirius',
    name: 'Sirius (α CMa)',
    x: -70,
    y: -10,
    z: -50,
    apparentMagnitude: -1.46,
    absoluteMagnitude: 1.42,
    bvColorIndex: 0.00,
    spectralType: 'A1V',
    constellation: '大犬座',
    season: 'winter'
  },
  procyon: {
    id: 'procyon',
    name: 'Procyon (α CMi)',
    x: -40,
    y: -5,
    z: -65,
    apparentMagnitude: 0.34,
    absoluteMagnitude: 2.66,
    bvColorIndex: 0.42,
    spectralType: 'F5IV-V',
    constellation: '小犬座',
    season: 'winter'
  },
  aldebaran: {
    id: 'aldebaran',
    name: 'Aldebaran (α Tau)',
    x: -25,
    y: 28,
    z: -70,
    apparentMagnitude: 0.85,
    absoluteMagnitude: -0.64,
    bvColorIndex: 1.53,
    spectralType: 'K5III',
    constellation: '金牛座',
    season: 'winter'
  },
  capella: {
    id: 'capella',
    name: 'Capella (α Aur)',
    x: 10,
    y: 45,
    z: -70,
    apparentMagnitude: 0.08,
    absoluteMagnitude: -0.49,
    bvColorIndex: 0.79,
    spectralType: 'G5III',
    constellation: '御夫座',
    season: 'winter'
  },
  castor: {
    id: 'castor',
    name: 'Castor (α Gem)',
    x: 20,
    y: 20,
    z: -72,
    apparentMagnitude: 1.58,
    absoluteMagnitude: 0.50,
    bvColorIndex: -0.03,
    spectralType: 'A1V',
    constellation: '双子座',
    season: 'winter'
  },
  pollux: {
    id: 'pollux',
    name: 'Pollux (β Gem)',
    x: 25,
    y: 15,
    z: -70,
    apparentMagnitude: 1.14,
    absoluteMagnitude: 1.09,
    bvColorIndex: 0.99,
    spectralType: 'K0III',
    constellation: '双子座',
    season: 'winter'
  },
  fomalhaut: {
    id: 'fomalhaut',
    name: 'Fomalhaut (α PsA)',
    x: -15,
    y: -45,
    z: 50,
    apparentMagnitude: 1.16,
    absoluteMagnitude: 1.74,
    bvColorIndex: 0.09,
    spectralType: 'A3V',
    constellation: '南鱼座',
    season: 'autumn'
  },
  hamal: {
    id: 'hamal',
    name: 'Hamal (α Ari)',
    x: 35,
    y: 15,
    z: -65,
    apparentMagnitude: 2.01,
    absoluteMagnitude: 0.42,
    bvColorIndex: 1.15,
    spectralType: 'K2III',
    constellation: '白羊座',
    season: 'autumn'
  },
  algol: {
    id: 'algol',
    name: 'Algol (β Per)',
    x: -5,
    y: 35,
    z: -75,
    apparentMagnitude: 2.12,
    absoluteMagnitude: -0.45,
    bvColorIndex: -0.05,
    spectralType: 'B8V',
    constellation: '英仙座',
    season: 'autumn'
  },
  mirfak: {
    id: 'mirfak',
    name: 'Mirfak (α Per)',
    x: -10,
    y: 40,
    z: -72,
    apparentMagnitude: 1.79,
    absoluteMagnitude: -4.23,
    bvColorIndex: 0.51,
    spectralType: 'F5Ib',
    constellation: '英仙座',
    season: 'autumn'
  },
  markab: {
    id: 'markab',
    name: 'Markab (α Peg)',
    x: 15,
    y: 5,
    z: 65,
    apparentMagnitude: 2.49,
    absoluteMagnitude: -0.68,
    bvColorIndex: -0.04,
    spectralType: 'B9III',
    constellation: '飞马座',
    season: 'autumn'
  },
  scheat: {
    id: 'scheat',
    name: 'Scheat (β Peg)',
    x: 5,
    y: 10,
    z: 70,
    apparentMagnitude: 2.42,
    absoluteMagnitude: -1.51,
    bvColorIndex: 1.52,
    spectralType: 'M2.5II-III',
    constellation: '飞马座',
    season: 'autumn'
  },
  algenib: {
    id: 'algenib',
    name: 'Algenib (γ Peg)',
    x: 20,
    y: -2,
    z: 68,
    apparentMagnitude: 2.83,
    absoluteMagnitude: -2.28,
    bvColorIndex: -0.13,
    spectralType: 'B2IV',
    constellation: '飞马座',
    season: 'autumn'
  }
};

export const constellations: ConstellationData[] = [
  {
    id: 'ursa-major',
    name: 'Ursa Major',
    chineseName: '大熊座',
    season: 'spring',
    stars: [
      famousStars.dubhe,
      famousStars.merak,
      famousStars.phecda,
      famousStars.megrez,
      famousStars.alioth,
      famousStars.mizar,
      famousStars.alkaid
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [3, 4], [4, 5], [5, 6]
    ]
  },
  {
    id: 'ursa-minor',
    name: 'Ursa Minor',
    chineseName: '小熊座',
    season: 'spring',
    stars: [
      famousStars.polaris,
      famousStars.kochab
    ],
    connections: [
      [0, 1]
    ]
  },
  {
    id: 'lyra',
    name: 'Lyra',
    chineseName: '天琴座',
    season: 'summer',
    stars: [famousStars.vega],
    connections: []
  },
  {
    id: 'cygnus',
    name: 'Cygnus',
    chineseName: '天鹅座',
    season: 'summer',
    stars: [famousStars.deneb],
    connections: []
  },
  {
    id: 'aquila',
    name: 'Aquila',
    chineseName: '天鹰座',
    season: 'summer',
    stars: [famousStars.altair],
    connections: []
  },
  {
    id: 'scorpius',
    name: 'Scorpius',
    chineseName: '天蝎座',
    season: 'summer',
    stars: [famousStars.antares],
    connections: []
  },
  {
    id: 'bootes',
    name: 'Boötes',
    chineseName: '牧夫座',
    season: 'spring',
    stars: [famousStars.arcturus],
    connections: []
  },
  {
    id: 'virgo',
    name: 'Virgo',
    chineseName: '室女座',
    season: 'spring',
    stars: [famousStars.spica],
    connections: []
  },
  {
    id: 'leo',
    name: 'Leo',
    chineseName: '狮子座',
    season: 'spring',
    stars: [famousStars.regulus],
    connections: []
  },
  {
    id: 'orion',
    name: 'Orion',
    chineseName: '猎户座',
    season: 'winter',
    stars: [
      famousStars.betelgeuse,
      famousStars.rigel,
      famousStars.bellatrix,
      famousStars.mintaka,
      famousStars.alnilam,
      famousStars.alnitak,
      famousStars.saiph
    ],
    connections: [
      [0, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1],
      [2, 5], [0, 3], [1, 4]
    ]
  },
  {
    id: 'canis-major',
    name: 'Canis Major',
    chineseName: '大犬座',
    season: 'winter',
    stars: [famousStars.sirius],
    connections: []
  },
  {
    id: 'canis-minor',
    name: 'Canis Minor',
    chineseName: '小犬座',
    season: 'winter',
    stars: [famousStars.procyon],
    connections: []
  },
  {
    id: 'taurus',
    name: 'Taurus',
    chineseName: '金牛座',
    season: 'winter',
    stars: [famousStars.aldebaran],
    connections: []
  },
  {
    id: 'auriga',
    name: 'Auriga',
    chineseName: '御夫座',
    season: 'winter',
    stars: [famousStars.capella],
    connections: []
  },
  {
    id: 'gemini',
    name: 'Gemini',
    chineseName: '双子座',
    season: 'winter',
    stars: [
      famousStars.castor,
      famousStars.pollux
    ],
    connections: [[0, 1]]
  },
  {
    id: 'pisces-austrinus',
    name: 'Piscis Austrinus',
    chineseName: '南鱼座',
    season: 'autumn',
    stars: [famousStars.fomalhaut],
    connections: []
  },
  {
    id: 'aries',
    name: 'Aries',
    chineseName: '白羊座',
    season: 'autumn',
    stars: [famousStars.hamal],
    connections: []
  },
  {
    id: 'perseus',
    name: 'Perseus',
    chineseName: '英仙座',
    season: 'autumn',
    stars: [
      famousStars.algol,
      famousStars.mirfak
    ],
    connections: [[0, 1]]
  },
  {
    id: 'pegasus',
    name: 'Pegasus',
    chineseName: '飞马座',
    season: 'autumn',
    stars: [
      famousStars.markab,
      famousStars.scheat,
      famousStars.algenib
    ],
    connections: [
      [0, 1], [1, 2], [2, 0]
    ]
  }
];

export const famousConstellationIds = [
  'ursa-major',
  'orion',
  'lyra',
  'cygnus',
  'scorpius',
  'bootes',
  'leo',
  'canis-major',
  'taurus',
  'gemini',
  'perseus',
  'pegasus'
];

export const seasonAngles: Record<string, { x: number; y: number; z: number }> = {
  spring: { x: 0.2, y: 0.5, z: 0 },
  summer: { x: 0.3, y: 1.2, z: 0 },
  autumn: { x: 0.25, y: 2.0, z: 0 },
  winter: { x: 0.15, y: 2.8, z: 0 }
};

export function getAllStars(): StarData[] {
  return constellations.flatMap(c => c.stars);
}

export function getStarsBySeason(season: string): StarData[] {
  return constellations
    .filter(c => c.season === season)
    .flatMap(c => c.stars);
}

export function getConstellationById(id: string): ConstellationData | undefined {
  return constellations.find(c => c.id === id);
}

export function getStarById(id: string): StarData | undefined {
  return getAllStars().find(s => s.id === id);
}

export function bvToColor(bv: number): number {
  let r = 0, g = 0, b = 0;
  
  if (bv < -0.4) {
    r = 0.6; g = 0.7; b = 1.0;
  } else if (bv < 0.0) {
    const t = (bv + 0.4) / 0.4;
    r = 0.6 + t * 0.4;
    g = 0.7 + t * 0.3;
    b = 1.0;
  } else if (bv < 0.5) {
    const t = bv / 0.5;
    r = 1.0;
    g = 1.0 - t * 0.1;
    b = 1.0 - t * 0.3;
  } else if (bv < 1.0) {
    const t = (bv - 0.5) / 0.5;
    r = 1.0;
    g = 0.9 - t * 0.3;
    b = 0.7 - t * 0.5;
  } else {
    const t = Math.min((bv - 1.0) / 1.0, 1.0);
    r = 1.0;
    g = 0.6 - t * 0.3;
    b = 0.2 + t * 0.1;
  }
  
  return Math.floor(r * 255) * 0x10000 + Math.floor(g * 255) * 0x100 + Math.floor(b * 255);
}
