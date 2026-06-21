import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface PlanetBasic {
  id: string;
  name: string;
  nameCn: string;
  color: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  tilt: number;
  description: string;
}

interface PlanetDetail extends PlanetBasic {
  equatorialRadius: number;
  averageOrbitSpeed: number;
  rotationPeriod: number;
  orbitalPeriod: number;
  knownMoons: number;
  mass: number;
  density: number;
  surfaceGravity: number;
  averageTemperature: number;
  atmosphere: string;
  discovery: string;
  detailedDescription: string;
}

const planetsData: PlanetDetail[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    nameCn: '水星',
    color: '#B5B5B5',
    radius: 0.38,
    orbitRadius: 12,
    orbitSpeed: 4.15,
    rotationSpeed: 0.017,
    tilt: 0.03,
    description: '太阳系中最小的行星，也是距离太阳最近的行星。',
    equatorialRadius: 2439.7,
    averageOrbitSpeed: 47.87,
    rotationPeriod: 58.646,
    orbitalPeriod: 87.969,
    knownMoons: 0,
    mass: 0.055,
    density: 5.427,
    surfaceGravity: 3.7,
    averageTemperature: 167,
    atmosphere: '极稀薄，主要含氦、钠、氧',
    discovery: '古代已知，公元前3000年左右被苏美尔人记录',
    detailedDescription: '水星是太阳系八大行星中最小的一颗，也是距离太阳最近的行星。它的表面布满陨石坑，外观类似月球，没有大气层保护，昼夜温差极大。水星的公转周期约为88个地球日，是太阳系中公转最快的行星。'
  },
  {
    id: 'venus',
    name: 'Venus',
    nameCn: '金星',
    color: '#E6C87A',
    radius: 0.95,
    orbitRadius: 18,
    orbitSpeed: 1.62,
    rotationSpeed: -0.004,
    tilt: 177.4,
    description: '太阳系中最热的行星，被浓厚的二氧化碳大气层包裹。',
    equatorialRadius: 6051.8,
    averageOrbitSpeed: 35.02,
    rotationPeriod: -243.018,
    orbitalPeriod: 224.701,
    knownMoons: 0,
    mass: 0.815,
    density: 5.243,
    surfaceGravity: 8.87,
    averageTemperature: 464,
    atmosphere: '96%二氧化碳，3%氮',
    discovery: '古代已知，是天空中除日月外最亮的天体',
    detailedDescription: '金星是太阳系中第二颗行星，也是最热的行星。它被浓厚的二氧化碳大气层包裹，产生极端的温室效应，表面温度高达464°C。金星的自转方向与大多数行星相反，被称为逆向自转。由于其亮度极高，金星又被称为"启明星"或"长庚星"。'
  },
  {
    id: 'earth',
    name: 'Earth',
    nameCn: '地球',
    color: '#6B93D6',
    radius: 1,
    orbitRadius: 26,
    orbitSpeed: 1,
    rotationSpeed: 1,
    tilt: 23.44,
    description: '我们的家园，目前已知唯一存在生命的星球。',
    equatorialRadius: 6378.1,
    averageOrbitSpeed: 29.78,
    rotationPeriod: 0.997,
    orbitalPeriod: 365.256,
    knownMoons: 1,
    mass: 1,
    density: 5.515,
    surfaceGravity: 9.807,
    averageTemperature: 15,
    atmosphere: '78%氮，21%氧，1%其他气体',
    discovery: '—',
    detailedDescription: '地球是太阳系中第三颗行星，也是目前已知唯一存在生命的星球。它拥有液态水、适宜的大气层和磁场保护。地球的直径约12742公里，有一颗天然卫星——月球。地球的自转轴倾斜23.44度，这是产生四季变化的原因。'
  },
  {
    id: 'mars',
    name: 'Mars',
    nameCn: '火星',
    color: '#C1440E',
    radius: 0.53,
    orbitRadius: 36,
    orbitSpeed: 0.53,
    rotationSpeed: 0.97,
    tilt: 25.19,
    description: '红色星球，人类探索的下一个目标。',
    equatorialRadius: 3396.2,
    averageOrbitSpeed: 24.077,
    rotationPeriod: 1.026,
    orbitalPeriod: 686.971,
    knownMoons: 2,
    mass: 0.107,
    density: 3.933,
    surfaceGravity: 3.72,
    averageTemperature: -65,
    atmosphere: '95%二氧化碳，3%氮',
    discovery: '古代已知，肉眼可见',
    detailedDescription: '火星是太阳系中第四颗行星，因其表面富含氧化铁而呈现红色，被称为"红色星球"。火星有两颗小卫星——火卫一和火卫二。火星的一天约24.6小时，与地球相近。火星上有太阳系最高的山（奥林帕斯山）和最深的峡谷（水手谷），是人类殖民探索的重要目标。'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    nameCn: '木星',
    color: '#D8CA9D',
    radius: 3.5,
    orbitRadius: 55,
    orbitSpeed: 0.08,
    rotationSpeed: 2.4,
    tilt: 3.13,
    description: '太阳系中最大的行星，著名的气态巨行星。',
    equatorialRadius: 71492,
    averageOrbitSpeed: 13.07,
    rotationPeriod: 0.414,
    orbitalPeriod: 4332.59,
    knownMoons: 95,
    mass: 317.8,
    density: 1.326,
    surfaceGravity: 24.79,
    averageTemperature: -110,
    atmosphere: '90%氢，10%氦',
    discovery: '古代已知，伽利略1610年发现其四大卫星',
    detailedDescription: '木星是太阳系中最大的行星，质量是其他七颗行星总和的2.5倍。它是一颗气态巨行星，主要由氢和氦组成。木星最著名的特征是大红斑——一个持续了数百年的巨型风暴。木星拥有至少95颗卫星，其中木卫二、木卫三、木卫四和木卫一被称为伽利略卫星。'
  },
  {
    id: 'saturn',
    name: 'Saturn',
    nameCn: '土星',
    color: '#F4D59E',
    radius: 2.9,
    orbitRadius: 75,
    orbitSpeed: 0.03,
    rotationSpeed: 2.2,
    tilt: 26.73,
    description: '拥有壮观光环的气态巨行星，以其美丽的环系统闻名。',
    equatorialRadius: 60268,
    averageOrbitSpeed: 9.69,
    rotationPeriod: 0.444,
    orbitalPeriod: 10759.22,
    knownMoons: 146,
    mass: 95.2,
    density: 0.687,
    surfaceGravity: 10.44,
    averageTemperature: -140,
    atmosphere: '96%氢，3%氦',
    discovery: '古代已知，1610年伽利略首次观测到光环',
    detailedDescription: '土星是太阳系中第二大行星，以其壮观的环系统闻名于世。土星的环主要由冰粒和岩石碎片组成，宽度达28万公里。土星的密度非常低，如果有足够大的海洋，土星可以漂浮在水面上。土星拥有146颗已知卫星，其中土卫六是太阳系中唯一拥有浓厚大气层的卫星。'
  },
  {
    id: 'uranus',
    name: 'Uranus',
    nameCn: '天王星',
    color: '#D1E7E7',
    radius: 2,
    orbitRadius: 95,
    orbitSpeed: 0.01,
    rotationSpeed: -1.4,
    tilt: 97.77,
    description: '侧躺着公转的冰巨星，呈现独特的蓝绿色。',
    equatorialRadius: 25559,
    averageOrbitSpeed: 6.81,
    rotationPeriod: -0.718,
    orbitalPeriod: 30688.5,
    knownMoons: 27,
    mass: 14.5,
    density: 1.27,
    surfaceGravity: 8.87,
    averageTemperature: -195,
    atmosphere: '83%氢，15%氦，2%甲烷',
    discovery: '1781年由威廉·赫歇尔发现',
    detailedDescription: '天王星是太阳系中第七颗行星，是一颗冰巨星。它最独特的地方是自转轴几乎与公转轨道平面平行，倾斜角度达97.77度，几乎是"躺着"公转。天王星的大气中含有甲烷，使其呈现出淡蓝绿色。天王星拥有27颗已知卫星，都以莎士比亚作品中的角色命名。'
  },
  {
    id: 'neptune',
    name: 'Neptune',
    nameCn: '海王星',
    color: '#5B5DDF',
    radius: 1.9,
    orbitRadius: 115,
    orbitSpeed: 0.006,
    rotationSpeed: 1.5,
    tilt: 28.32,
    description: '距离太阳最远的行星，深蓝色的冰巨星。',
    equatorialRadius: 24764,
    averageOrbitSpeed: 5.43,
    rotationPeriod: 0.671,
    orbitalPeriod: 60182,
    knownMoons: 16,
    mass: 17.1,
    density: 1.638,
    surfaceGravity: 11.15,
    averageTemperature: -200,
    atmosphere: '80%氢，19%氦，1%甲烷',
    discovery: '1846年由约翰·伽勒发现（通过数学预测）',
    detailedDescription: '海王星是太阳系中最远的行星，也是四颗气态巨行星中最小的一颗。它呈现深蓝色，这是由于大气中的甲烷吸收红光所致。海王星拥有太阳系中最强的风暴，风速可达每小时2100公里。海王星有16颗已知卫星，其中海卫一是最大的卫星，它是一颗逆向运行的捕获卫星。'
  }
];

const planetCache = new Map<string, PlanetDetail>();
planetsData.forEach(p => planetCache.set(p.id, p));

app.get('/api/planets', (_req, res) => {
  const basicPlanets: PlanetBasic[] = planetsData.map(({
    id, name, nameCn, color, radius, orbitRadius, orbitSpeed, rotationSpeed, tilt, description
  }) => ({
    id, name, nameCn, color, radius, orbitRadius, orbitSpeed, rotationSpeed, tilt, description
  }));
  
  res.json({
    success: true,
    data: basicPlanets
  });
});

app.get('/api/planets/:id', (req, res) => {
  const planetId = req.params.id;
  const planet = planetCache.get(planetId);
  
  if (!planet) {
    res.status(404).json({
      success: false,
      message: `Planet with id "${planetId}" not found`
    });
    return;
  }
  
  res.json({
    success: true,
    data: planet
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Solar System API server running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET /api/planets    - List all planets`);
  console.log(`  GET /api/planets/:id - Get planet details`);
  console.log(`  GET /api/health     - Health check`);
});

export default app;
