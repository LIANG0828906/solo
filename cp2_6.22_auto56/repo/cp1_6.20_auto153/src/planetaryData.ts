export interface PlanetData {
  name: string;
  englishName: string;
  color: string;
  orbitRadius: number;
  orbitalPeriod: number;
  rotationPeriod: number;
  inclination: number;
  equatorialRadius: string;
  mass: string;
  temperature: string;
  isGasGiant: boolean;
  sizeScale: number;
  description: string;
}

export const planets: PlanetData[] = [
  {
    name: "水星",
    englishName: "Mercury",
    color: "#8C7853",
    orbitRadius: 5,
    orbitalPeriod: 0.24,
    rotationPeriod: 58.6,
    inclination: 0.034,
    equatorialRadius: "2,440 km",
    mass: "3.30×10²³ kg",
    temperature: "167°C",
    isGasGiant: false,
    sizeScale: 0.3,
    description: "太阳系中最小的行星，也是距离太阳最近的行星"
  },
  {
    name: "金星",
    englishName: "Venus",
    color: "#FFC649",
    orbitRadius: 8,
    orbitalPeriod: 0.62,
    rotationPeriod: -243,
    inclination: 0.048,
    equatorialRadius: "6,052 km",
    mass: "4.87×10²⁴ kg",
    temperature: "464°C",
    isGasGiant: false,
    sizeScale: 0.9,
    description: "太阳系中最热的行星，被浓厚的二氧化碳大气层笼罩"
  },
  {
    name: "地球",
    englishName: "Earth",
    color: "#4B9CD3",
    orbitRadius: 12,
    orbitalPeriod: 1.0,
    rotationPeriod: 1.0,
    inclination: 0.0,
    equatorialRadius: "6,371 km",
    mass: "5.97×10²⁴ kg",
    temperature: "15°C",
    isGasGiant: false,
    sizeScale: 1.0,
    description: "我们的家园，太阳系中唯一已知存在生命的行星"
  },
  {
    name: "火星",
    englishName: "Mars",
    color: "#CD5C5C",
    orbitRadius: 16,
    orbitalPeriod: 1.88,
    rotationPeriod: 1.03,
    inclination: 0.032,
    equatorialRadius: "3,390 km",
    mass: "6.42×10²³ kg",
    temperature: "-65°C",
    isGasGiant: false,
    sizeScale: 0.5,
    description: "红色行星，表面富含氧化铁，可能存在液态水的痕迹"
  },
  {
    name: "木星",
    englishName: "Jupiter",
    color: "#E8B87D",
    orbitRadius: 24,
    orbitalPeriod: 11.86,
    rotationPeriod: 0.41,
    inclination: 0.023,
    equatorialRadius: "69,911 km",
    mass: "1.90×10²⁷ kg",
    temperature: "-110°C",
    isGasGiant: true,
    sizeScale: 2.2,
    description: "太阳系中最大的行星，著名的大红斑是一个持续数百年的巨大风暴"
  },
  {
    name: "土星",
    englishName: "Saturn",
    color: "#FAD5A5",
    orbitRadius: 30,
    orbitalPeriod: 29.46,
    rotationPeriod: 0.44,
    inclination: 0.043,
    equatorialRadius: "58,232 km",
    mass: "5.68×10²⁶ kg",
    temperature: "-140°C",
    isGasGiant: true,
    sizeScale: 1.9,
    description: "以其壮观的环系统而闻名，主要由冰和岩石碎片组成"
  },
  {
    name: "天王星",
    englishName: "Uranus",
    color: "#7EC8E3",
    orbitRadius: 36,
    orbitalPeriod: 84.01,
    rotationPeriod: -0.72,
    inclination: 0.077,
    equatorialRadius: "25,362 km",
    mass: "8.68×10²⁵ kg",
    temperature: "-195°C",
    isGasGiant: true,
    sizeScale: 1.3,
    description: "侧躺着自转的冰巨星，呈淡青蓝色，大气中含有甲烷"
  },
  {
    name: "海王星",
    englishName: "Neptune",
    color: "#4169E1",
    orbitRadius: 42,
    orbitalPeriod: 164.8,
    rotationPeriod: 0.67,
    inclination: 0.06,
    equatorialRadius: "24,622 km",
    mass: "1.02×10²⁶ kg",
    temperature: "-200°C",
    isGasGiant: true,
    sizeScale: 1.25,
    description: "太阳系最外层的行星，深蓝色的大气中有太阳系最强的风暴"
  }
];
