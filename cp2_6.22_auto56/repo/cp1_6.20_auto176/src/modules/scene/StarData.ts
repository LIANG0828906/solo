export interface Star {
  id: string;
  name: string;
  magnitude: number;
  spectralType: SpectralType;
  position: [number, number, number];
}

export type SpectralType = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';

export const SPECTRAL_COLORS: Record<SpectralType, string> = {
  O: '#9bb0ff',
  B: '#aabfff',
  A: '#ffffff',
  F: '#fff4ea',
  G: '#ffd2a1',
  K: '#ffa770',
  M: '#ff6b6b',
};

const SPECTRAL_RATIOS: Record<SpectralType, number> = {
  O: 0.003,
  B: 0.13,
  A: 0.6,
  F: 3.0,
  G: 7.6,
  K: 12.1,
  M: 76.6,
};

function generateStarName(): string {
  const prefix = 'HD';
  const number = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}-${number}`;
}

function generateSpectralType(): SpectralType {
  const total = Object.values(SPECTRAL_RATIOS).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  
  for (const [type, ratio] of Object.entries(SPECTRAL_RATIOS)) {
    random -= ratio;
    if (random <= 0) {
      return type as SpectralType;
    }
  }
  return 'M';
}

function generateMagnitude(): number {
  const u = Math.random();
  const magnitude = 0 + (10 - 0) * Math.pow(u, 1.5);
  return Math.round(magnitude * 100) / 100;
}

function generatePosition(radius: number): [number, number, number] {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = radius * Math.cbrt(Math.random());
  
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  
  return [x, y, z];
}

export function generateStars(count: number = 200, radius: number = 50): Star[] {
  const stars: Star[] = [];
  const usedNames = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = generateStarName();
    } while (usedNames.has(name));
    
    usedNames.add(name);
    
    stars.push({
      id: `star-${i}`,
      name,
      magnitude: generateMagnitude(),
      spectralType: generateSpectralType(),
      position: generatePosition(radius),
    });
  }
  
  return stars;
}

export const PREDEFINED_STARS: Star[] = generateStars(200, 50);
