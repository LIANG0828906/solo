import { StarData } from '../types';

const SPECTRAL_COLORS: Record<string, string> = {
  O: '#9bb0ff',
  B: '#aabfff',
  A: '#cad7ff',
  F: '#f8f7ff',
  G: '#fff4ea',
  K: '#ffd2a1',
  M: '#ffcc6f',
};

const SPECTRAL_TEMPERATURES: Record<string, number> = {
  O: 35000,
  B: 20000,
  A: 8750,
  F: 6750,
  G: 5500,
  K: 4250,
  M: 3000,
};

const realStars = [
  { name: 'Sirius', nameCn: '天狼星', mag: -1.46, spectral: 'A1V', dist: 8.6, ra: 101.28, dec: -16.72, cons: 'Canis Major', consCn: '大犬座' },
  { name: 'Canopus', nameCn: '老人星', mag: -0.74, spectral: 'F0Ib', dist: 310, ra: 95.988, dec: -52.695, cons: 'Carina', consCn: '船底座' },
  { name: 'Rigil Kentaurus', nameCn: '南门二', mag: -0.27, spectral: 'G2V', dist: 4.37, ra: 219.9, dec: -60.83, cons: 'Centaurus', consCn: '半人马座' },
  { name: 'Arcturus', nameCn: '大角星', mag: -0.05, spectral: 'K1.5III', dist: 37, ra: 213.92, dec: 19.18, cons: 'Bootes', consCn: '牧夫座' },
  { name: 'Vega', nameCn: '织女星', mag: 0.03, spectral: 'A0V', dist: 25, ra: 279.23, dec: 38.78, cons: 'Lyra', consCn: '天琴座' },
  { name: 'Capella', nameCn: '五车二', mag: 0.08, spectral: 'G5III', dist: 42, ra: 79.17, dec: 45.99, cons: 'Auriga', consCn: '御夫座' },
  { name: 'Rigel', nameCn: '参宿七', mag: 0.13, spectral: 'B8Ia', dist: 860, ra: 78.63, dec: -8.2, cons: 'Orion', consCn: '猎户座' },
  { name: 'Procyon', nameCn: '南河三', mag: 0.34, spectral: 'F5IV-V', dist: 11.4, ra: 114.83, dec: 5.22, cons: 'Canis Minor', consCn: '小犬座' },
  { name: 'Achernar', nameCn: '水委一', mag: 0.46, spectral: 'B3V', dist: 139, ra: 24.42, dec: -57.24, cons: 'Eridanus', consCn: '波江座' },
  { name: 'Betelgeuse', nameCn: '参宿四', mag: 0.5, spectral: 'M2Iab', dist: 700, ra: 88.79, dec: 7.41, cons: 'Orion', consCn: '猎户座' },
  { name: 'Hadar', nameCn: '马腹一', mag: 0.61, spectral: 'B1III', dist: 390, ra: 210.95, dec: -59.69, cons: 'Centaurus', consCn: '半人马座' },
  { name: 'Altair', nameCn: '牵牛星', mag: 0.77, spectral: 'A7V', dist: 16.7, ra: 297.7, dec: 8.87, cons: 'Aquila', consCn: '天鹰座' },
  { name: 'Acrux', nameCn: '十字架二', mag: 0.81, spectral: 'B0.5IV', dist: 320, ra: 186.65, dec: -63.1, cons: 'Crux', consCn: '南十字座' },
  { name: 'Aldebaran', nameCn: '毕宿五', mag: 0.85, spectral: 'K5III', dist: 65, ra: 68.98, dec: 16.51, cons: 'Taurus', consCn: '金牛座' },
  { name: 'Antares', nameCn: '心宿二', mag: 0.96, spectral: 'M1.5Iab', dist: 620, ra: 247.35, dec: -26.43, cons: 'Scorpius', consCn: '天蝎座' },
  { name: 'Spica', nameCn: '角宿一', mag: 0.97, spectral: 'B1III-IV', dist: 260, ra: 201.3, dec: -11.16, cons: 'Virgo', consCn: '室女座' },
  { name: 'Pollux', nameCn: '北河三', mag: 1.14, spectral: 'K0III', dist: 34, ra: 116.33, dec: 28.03, cons: 'Gemini', consCn: '双子座' },
  { name: 'Fomalhaut', nameCn: '北落师门', mag: 1.16, spectral: 'A3V', dist: 25, ra: 344.41, dec: -29.62, cons: 'Piscis Austrinus', consCn: '南鱼座' },
  { name: 'Deneb', nameCn: '天津四', mag: 1.25, spectral: 'A2Ia', dist: 2600, ra: 310.36, dec: 45.28, cons: 'Cygnus', consCn: '天鹅座' },
  { name: 'Regulus', nameCn: '轩辕十四', mag: 1.35, spectral: 'B7V', dist: 79, ra: 152.09, dec: 11.97, cons: 'Leo', consCn: '狮子座' },
  { name: 'Castor', nameCn: '北河二', mag: 1.58, spectral: 'A1V', dist: 51, ra: 113.65, dec: 31.89, cons: 'Gemini', consCn: '双子座' },
  { name: 'Bellatrix', nameCn: '参宿五', mag: 1.64, spectral: 'B2III', dist: 250, ra: 81.28, dec: 6.35, cons: 'Orion', consCn: '猎户座' },
  { name: 'Adhara', nameCn: '弧矢七', mag: 1.5, spectral: 'B2II', dist: 405, ra: 104.63, dec: -28.97, cons: 'Canis Major', consCn: '大犬座' },
  { name: 'Shaula', nameCn: '尾宿八', mag: 1.62, spectral: 'B1.5IV', dist: 570, ra: 262.08, dec: -37.1, cons: 'Scorpius', consCn: '天蝎座' },
  { name: 'Atria', nameCn: '三角形三', mag: 1.91, spectral: 'K2IIb', dist: 420, ra: 257.29, dec: -69.03, cons: 'Triangulum Australe', consCn: '南三角座' },
  { name: 'Alnilam', nameCn: '参宿二', mag: 1.69, spectral: 'B0Ia', dist: 2000, ra: 85.19, dec: -1.2, cons: 'Orion', consCn: '猎户座' },
  { name: 'Alnitak', nameCn: '参宿一', mag: 1.74, spectral: 'O9.5Ib', dist: 1260, ra: 85.19, dec: -1.94, cons: 'Orion', consCn: '猎户座' },
  { name: 'Polaris', nameCn: '北极星', mag: 1.97, spectral: 'F7Ib', dist: 430, ra: 37.95, dec: 89.26, cons: 'Ursa Minor', consCn: '小熊座' },
  { name: 'Mirfak', nameCn: '天船三', mag: 1.79, spectral: 'F5Ib', dist: 590, ra: 48.07, dec: 49.86, cons: 'Perseus', consCn: '英仙座' },
  { name: 'Dubhe', nameCn: '天枢', mag: 1.79, spectral: 'K0III', dist: 124, ra: 165.93, dec: 61.75, cons: 'Ursa Major', consCn: '大熊座' },
  { name: 'Wezen', nameCn: '弧矢一', mag: 1.83, spectral: 'F8Ia', dist: 1790, ra: 107.2, dec: -26.39, cons: 'Canis Major', consCn: '大犬座' },
  { name: 'Sargas', nameCn: '尾宿五', mag: 1.86, spectral: 'F0II', dist: 270, ra: 268.57, dec: -42.98, cons: 'Scorpius', consCn: '天蝎座' },
  { name: 'Kaus Australis', nameCn: '箕宿三', mag: 1.85, spectral: 'B9.5III', dist: 143, ra: 281.06, dec: -34.38, cons: 'Sagittarius', consCn: '人马座' },
  { name: 'Alphard', nameCn: '星宿一', mag: 1.98, spectral: 'K3II-III', dist: 180, ra: 141.06, dec: -8.66, cons: 'Hydra', consCn: '长蛇座' },
  { name: 'Sirius B', nameCn: '天狼伴星', mag: 8.44, spectral: 'DA2', dist: 8.6, ra: 101.29, dec: -16.72, cons: 'Canis Major', consCn: '大犬座' },
  { name: 'Proxima Centauri', nameCn: '比邻星', mag: 11.13, spectral: 'M5.5Ve', dist: 4.24, ra: 217.43, dec: -62.68, cons: 'Centaurus', consCn: '半人马座' },
  { name: 'Barnard\'s Star', nameCn: '巴纳德星', mag: 9.54, spectral: 'M4.0Ve', dist: 5.96, ra: 269.45, dec: 4.668, cons: 'Ophiuchus', consCn: '蛇夫座' },
  { name: 'Mintaka', nameCn: '参宿三', mag: 2.23, spectral: 'O9.5II', dist: 1200, ra: 85.21, dec: -0.3, cons: 'Orion', consCn: '猎户座' },
  { name: 'Merak', nameCn: '天璇', mag: 2.37, spectral: 'A1V', dist: 79.7, ra: 165.47, dec: 56.38, cons: 'Ursa Major', consCn: '大熊座' },
  { name: 'Phecda', nameCn: '天玑', mag: 2.44, spectral: 'A0V', dist: 83.2, ra: 168.77, dec: 53.69, cons: 'Ursa Major', consCn: '大熊座' },
  { name: 'Megrez', nameCn: '天权', mag: 3.31, spectral: 'A3V', dist: 80.5, ra: 173.08, dec: 57.03, cons: 'Ursa Major', consCn: '大熊座' },
  { name: 'Alioth', nameCn: '玉衡', mag: 1.77, spectral: 'A0p', dist: 82.6, ra: 179.6, dec: 55.96, cons: 'Ursa Major', consCn: '大熊座' },
  { name: 'Mizar', nameCn: '开阳', mag: 2.04, spectral: 'A2V', dist: 78, ra: 183.85, dec: 54.93, cons: 'Ursa Major', consCn: '大熊座' },
  { name: 'Alkaid', nameCn: '摇光', mag: 1.86, spectral: 'B3V', dist: 104, ra: 206.89, dec: 49.31, cons: 'Ursa Major', consCn: '大熊座' },
  { name: 'Alpheratz', nameCn: '壁宿二', mag: 2.06, spectral: 'B8IVp', dist: 97, ra: 14.16, dec: 29.09, cons: 'Andromeda', consCn: '仙女座' },
  { name: 'Mirach', nameCn: '奎宿九', mag: 2.05, spectral: 'M0III', dist: 197, ra: 17.43, dec: 35.62, cons: 'Andromeda', consCn: '仙女座' },
  { name: 'Hamal', nameCn: '娄宿三', mag: 2.0, spectral: 'K1II-III', dist: 65.9, ra: 31.79, dec: 23.46, cons: 'Aries', consCn: '白羊座' },
  { name: 'Menkar', nameCn: '天囷一', mag: 2.48, spectral: 'M1.5III', dist: 249, ra: 44.96, dec: 4.09, cons: 'Cetus', consCn: '鲸鱼座' },
  { name: 'Nunki', nameCn: '斗宿四', mag: 2.05, spectral: 'B2.5V', dist: 228, ra: 286.48, dec: -26.29, cons: 'Sagittarius', consCn: '人马座' },
  { name: 'Rasalhague', nameCn: '侯', mag: 2.08, spectral: 'A5III', dist: 48.6, ra: 257.27, dec: 12.56, cons: 'Ophiuchus', consCn: '蛇夫座' },
];

function raDecToXYZ(raDeg: number, decDeg: number, distanceLy: number): { x: number; y: number; z: number } {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  const scale = 0.1;
  
  const x = distanceLy * Math.cos(dec) * Math.cos(ra) * scale;
  const y = distanceLy * Math.sin(dec) * scale;
  const z = distanceLy * Math.cos(dec) * Math.sin(ra) * scale;
  
  return { x, y, z };
}

function getSpectralClass(spectralType: string): 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' {
  const firstChar = spectralType.charAt(0).toUpperCase();
  if (['O', 'B', 'A', 'F', 'G', 'K', 'M'].includes(firstChar)) {
    return firstChar as 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';
  }
  return 'A';
}

function getSpectralColor(spectralType: string): string {
  const spectralClass = getSpectralClass(spectralType);
  return SPECTRAL_COLORS[spectralClass] || '#ffffff';
}

function getSpectralTemperature(spectralType: string): number {
  const spectralClass = getSpectralClass(spectralType);
  return SPECTRAL_TEMPERATURES[spectralClass] || 8000;
}

function generateAdditionalStars(count: number, existingStars: StarData[]): StarData[] {
  const additional: StarData[] = [];
  const constellations = [
    { name: 'Cassiopeia', cn: '仙后座' },
    { name: 'Cepheus', cn: '仙王座' },
    { name: 'Draco', cn: '天龙座' },
    { name: 'Hercules', cn: '武仙座' },
    { name: 'Aquila', cn: '天鹰座' },
    { name: 'Ophiuchus', cn: '蛇夫座' },
    { name: 'Sagittarius', cn: '人马座' },
    { name: 'Capricornus', cn: '摩羯座' },
    { name: 'Aquarius', cn: '宝瓶座' },
    { name: 'Pegasus', cn: '飞马座' },
    { name: 'Pisces', cn: '双鱼座' },
    { name: 'Aries', cn: '白羊座' },
    { name: 'Cancer', cn: '巨蟹座' },
    { name: 'Libra', cn: '天秤座' },
    { name: 'Virgo', cn: '室女座' },
    { name: 'Leo', cn: '狮子座' },
    { name: 'Canes Venatici', cn: '猎犬座' },
    { name: 'Coma Berenices', cn: '后发座' },
    { name: 'Corona Borealis', cn: '北冕座' },
    { name: 'Sagitta', cn: '天箭座' },
    { name: 'Vulpecula', cn: '狐狸座' },
    { name: 'Lacerta', cn: '蝎虎座' },
    { name: 'Cygnus', cn: '天鹅座' },
    { name: 'Lyra', cn: '天琴座' },
    { name: 'Monoceros', cn: '麒麟座' },
    { name: 'Canis Minor', cn: '小犬座' },
    { name: 'Lepus', cn: '天兔座' },
    { name: 'Columba', cn: '天鸽座' },
    { name: 'Puppis', cn: '船尾座' },
    { name: 'Vela', cn: '船帆座' },
  ];

  const spectralClasses: Array<'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M'> = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
  const spectralWeights = [0.01, 0.05, 0.15, 0.2, 0.25, 0.2, 0.14];

  for (let i = 0; i < count; i++) {
    const id = `star-gen-${i}`;
    const ra = Math.random() * 360;
    const dec = (Math.random() - 0.5) * 140;
    const distance = 50 + Math.random() * 1500;
    
    let spectralClass: 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' = 'A';
    const rand = Math.random();
    let cumWeight = 0;
    for (let j = 0; j < spectralClasses.length; j++) {
      cumWeight += spectralWeights[j];
      if (rand <= cumWeight) {
        spectralClass = spectralClasses[j];
        break;
      }
    }
    
    const apparentMag = 2 + Math.random() * 5;
    const constellation = constellations[Math.floor(Math.random() * constellations.length)];
    
    const { x, y, z } = raDecToXYZ(ra, dec, distance);
    
    const greekLetters = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'];
    const letter = greekLetters[Math.floor(Math.random() * greekLetters.length)];
    const starNum = Math.floor(Math.random() * 100) + 1;
    
    additional.push({
      id,
      name: `${letter} ${constellation.name} ${starNum}`,
      nameCn: `${constellation.cn}${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][starNum % 10]}`,
      x,
      y,
      z,
      apparentMagnitude: apparentMag,
      absoluteMagnitude: apparentMag - 5 * Math.log10(distance / 10),
      spectralType: `${spectralClass}${Math.floor(Math.random() * 9) + 1}V`,
      spectralClass,
      distance,
      temperature: SPECTRAL_TEMPERATURES[spectralClass],
      luminosity: Math.pow(10, -0.4 * (apparentMag - 4.83 + 5 * Math.log10(distance / 10))),
      constellation: constellation.name,
      constellationCn: constellation.cn,
      color: SPECTRAL_COLORS[spectralClass],
    });
  }
  
  return additional;
}

export function generateStarData(): StarData[] {
  const realStarData: StarData[] = realStars.map((star, index) => {
    const { x, y, z } = raDecToXYZ(star.ra, star.dec, star.dist);
    const spectralClass = getSpectralClass(star.spectral);
    
    return {
      id: `star-real-${index}`,
      name: star.name,
      nameCn: star.nameCn,
      x,
      y,
      z,
      apparentMagnitude: star.mag,
      absoluteMagnitude: star.mag - 5 * Math.log10(star.dist / 10),
      spectralType: star.spectral,
      spectralClass,
      distance: star.dist,
      temperature: getSpectralTemperature(star.spectral),
      constellation: star.cons,
      constellationCn: star.consCn,
      color: getSpectralColor(star.spectral),
    };
  });
  
  const additionalStars = generateAdditionalStars(200 - realStarData.length, realStarData);
  
  return [...realStarData, ...additionalStars];
}

export function searchStars(stars: StarData[], query: string): StarData[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  
  return stars.filter(star => {
    const nameMatch = star.name.toLowerCase().includes(lowerQuery);
    const nameCnMatch = star.nameCn.includes(query.trim());
    const constellationMatch = star.constellation.toLowerCase().includes(lowerQuery);
    const constellationCnMatch = star.constellationCn.includes(query.trim());
    
    return nameMatch || nameCnMatch || constellationMatch || constellationCnMatch;
  }).sort((a, b) => {
    const aNameMatch = a.name.toLowerCase().startsWith(lowerQuery) || a.nameCn.startsWith(query.trim());
    const bNameMatch = b.name.toLowerCase().startsWith(lowerQuery) || b.nameCn.startsWith(query.trim());
    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;
    return a.apparentMagnitude - b.apparentMagnitude;
  });
}

export function getNearbyBrightStars(stars: StarData[], targetStar: StarData, count: number = 5): StarData[] {
  return stars
    .filter(star => star.id !== targetStar.id)
    .map(star => {
      const dx = star.x - targetStar.x;
      const dy = star.y - targetStar.y;
      const dz = star.z - targetStar.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return { star, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(item => item.star)
    .sort((a, b) => a.apparentMagnitude - b.apparentMagnitude)
    .slice(0, count);
}

export function getStarById(stars: StarData[], id: string): StarData | undefined {
  return stars.find(star => star.id === id);
}

export { SPECTRAL_COLORS, SPECTRAL_TEMPERATURES };
