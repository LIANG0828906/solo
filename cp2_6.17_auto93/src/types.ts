export interface PlanetData {
  id: string;
  name: string;
  color: string;
  size: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  diameter: string;
  distanceFromSun: string;
  orbitalPeriod: string;
  atmosphere: string[];
}

export interface OrbitParams {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
}

export interface UIState {
  selectedPlanetId: string | null;
  focusedPlanetId: string | null;
  isPanelVisible: boolean;
}

export const PLANETS: PlanetData[] = [
  {
    id: 'mercury',
    name: '水星',
    color: '#A5A5A5',
    size: 0.38,
    orbitRadius: 5,
    orbitSpeed: 0.04,
    rotationSpeed: 0.004,
    diameter: '4,879 km',
    distanceFromSun: '5,790 万 km',
    orbitalPeriod: '88 天',
    atmosphere: ['O₂', 'Na', 'H₂', 'He', 'K']
  },
  {
    id: 'venus',
    name: '金星',
    color: '#E8C87A',
    size: 0.95,
    orbitRadius: 7.5,
    orbitSpeed: 0.015,
    rotationSpeed: 0.002,
    diameter: '12,104 km',
    distanceFromSun: '1.082 亿 km',
    orbitalPeriod: '225 天',
    atmosphere: ['CO₂', 'N₂', 'SO₂', 'Ar']
  },
  {
    id: 'earth',
    name: '地球',
    color: '#4A90D9',
    size: 1,
    orbitRadius: 10.5,
    orbitSpeed: 0.01,
    rotationSpeed: 0.02,
    diameter: '12,742 km',
    distanceFromSun: '1.496 亿 km',
    orbitalPeriod: '365 天',
    atmosphere: ['N₂', 'O₂', 'Ar', 'CO₂']
  },
  {
    id: 'mars',
    name: '火星',
    color: '#D14A3A',
    size: 0.53,
    orbitRadius: 14,
    orbitSpeed: 0.008,
    rotationSpeed: 0.018,
    diameter: '6,779 km',
    distanceFromSun: '2.279 亿 km',
    orbitalPeriod: '687 天',
    atmosphere: ['CO₂', 'N₂', 'Ar', 'O₂']
  },
  {
    id: 'jupiter',
    name: '木星',
    color: '#D4A574',
    size: 2.5,
    orbitRadius: 20,
    orbitSpeed: 0.002,
    rotationSpeed: 0.04,
    diameter: '139,820 km',
    distanceFromSun: '7.785 亿 km',
    orbitalPeriod: '12 年',
    atmosphere: ['H₂', 'He', 'CH₄', 'NH₃']
  },
  {
    id: 'saturn',
    name: '土星',
    color: '#C8B060',
    size: 2.1,
    orbitRadius: 26,
    orbitSpeed: 0.0009,
    rotationSpeed: 0.038,
    diameter: '116,460 km',
    distanceFromSun: '14.34 亿 km',
    orbitalPeriod: '29 年',
    atmosphere: ['H₂', 'He', 'CH₄', 'NH₃']
  },
  {
    id: 'uranus',
    name: '天王星',
    color: '#7EC8E3',
    size: 1.5,
    orbitRadius: 32,
    orbitSpeed: 0.0004,
    rotationSpeed: 0.03,
    diameter: '50,724 km',
    distanceFromSun: '28.71 亿 km',
    orbitalPeriod: '84 年',
    atmosphere: ['H₂', 'He', 'CH₄']
  },
  {
    id: 'neptune',
    name: '海王星',
    color: '#3B5EAB',
    size: 1.45,
    orbitRadius: 38,
    orbitSpeed: 0.0001,
    rotationSpeed: 0.032,
    diameter: '49,244 km',
    distanceFromSun: '44.95 亿 km',
    orbitalPeriod: '165 年',
    atmosphere: ['H₂', 'He', 'CH₄']
  }
];
