export interface PlanetData {
  id: string;
  name: string;
  nameCN: string;
  abbreviation: string;
  mass: number;
  radius: number;
  visualRadius: number;
  orbitRadius: number;
  orbitPeriod: number;
  rotationPeriod: number;
  rotationSpeed: number;
  surfaceColor: string;
  nameColor: string;
  description: string;
  images: [string, string, string];
}

export const PLANETS: PlanetData[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    nameCN: '水星',
    abbreviation: 'Me',
    mass: 0.055,
    radius: 0.383,
    visualRadius: 0.5,
    orbitRadius: 4,
    orbitPeriod: 88,
    rotationPeriod: 1407.6,
    rotationSpeed: 0.5,
    surfaceColor: '#B0B0B0',
    nameColor: '#B0B0B0',
    description: '水星是太阳系中最小的行星，也是距离太阳最近的行星。它的表面布满了陨石坑，没有大气层保护，昼夜温差极大，白天可达427°C，夜晚降至-173°C。水星的一年只有88个地球日，但一天却长达176个地球日。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mercury%20planet%20surface%20close-up%20cratered%20gray%20landscape%20NASA%20style&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mercury%20planet%20in%20space%20small%20gray%20sphere%20with%20Sun%20background&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mercury%20surface%20topology%20caloris%20basin%20scientific%20visualization&image_size=landscape_4_3',
    ],
  },
  {
    id: 'venus',
    name: 'Venus',
    nameCN: '金星',
    abbreviation: 'Ve',
    mass: 0.815,
    radius: 0.949,
    visualRadius: 0.8,
    orbitRadius: 7,
    orbitPeriod: 225,
    rotationPeriod: 5832.5,
    rotationSpeed: 0.4,
    surfaceColor: '#E8D5B7',
    nameColor: '#E8D5B7',
    description: '金星是太阳系中最热的行星，厚重的二氧化碳大气层造成了极端的温室效应，表面温度高达465°C。金星的自转方向与其他行星相反，太阳从西方升起。它的大小和质量与地球相似，常被称为地球的"姊妹星"。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Venus%20planet%20atmosphere%20thick%20yellowish%20clouds%20NASA%20style&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Venus%20in%20space%20bright%20yellowish%20sphere%20with%20cloud%20patterns&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Venus%20surface%20radar%20map%20volcanic%20terrain%20scientific&image_size=landscape_4_3',
    ],
  },
  {
    id: 'earth',
    name: 'Earth',
    nameCN: '地球',
    abbreviation: 'Ea',
    mass: 1.0,
    radius: 1.0,
    visualRadius: 0.9,
    orbitRadius: 10,
    orbitPeriod: 365.25,
    rotationPeriod: 24,
    rotationSpeed: 1.5,
    surfaceColor: '#4A90D9',
    nameColor: '#4A90D9',
    description: '地球是太阳系中唯一已知存在生命的行星。它拥有液态水、适宜的大气层和强大的磁场，为生命提供了理想的栖息环境。地球的70%表面被海洋覆盖，拥有四季变化和多样的气候带。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Earth%20from%20space%20blue%20oceans%20green%20continents%20NASA%20photograph&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Earth%20atmosphere%20blue%20marble%20view%20from%20orbit&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Earth%20surface%20beautiful%20landscape%20from%20orbit%20cloud%20patterns&image_size=landscape_4_3',
    ],
  },
  {
    id: 'mars',
    name: 'Mars',
    nameCN: '火星',
    abbreviation: 'Ma',
    mass: 0.107,
    radius: 0.532,
    visualRadius: 0.6,
    orbitRadius: 13,
    orbitPeriod: 687,
    rotationPeriod: 24.6,
    rotationSpeed: 1.4,
    surfaceColor: '#D35400',
    nameColor: '#D35400',
    description: '火星被称为"红色星球"，其表面富含氧化铁使其呈现独特的橙红色。火星拥有太阳系最高的火山——奥林匹斯山（高度约21.9公里），以及最大的峡谷——水手号峡谷。科学家已在火星上发现水冰存在的证据。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mars%20surface%20red%20desert%20landscape%20dust%20NASA%20rover%20photograph&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mars%20planet%20in%20space%20red%20orange%20sphere%20polar%20caps&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mars%20Olympus%20Mons%20volcano%20scientific%20visualization&image_size=landscape_4_3',
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    nameCN: '木星',
    abbreviation: 'Ju',
    mass: 317.8,
    radius: 11.21,
    visualRadius: 2.5,
    orbitRadius: 25,
    orbitPeriod: 4333,
    rotationPeriod: 9.9,
    rotationSpeed: 3.5,
    surfaceColor: '#D4A574',
    nameColor: '#D4A574',
    description: '木星是太阳系中最大的行星，其质量是其他所有行星总和的2.5倍。它标志性的大红斑是一个持续了数百年的巨大风暴，比地球还大。木星拥有79颗已知卫星，其中伽利略卫星（木卫一至四）最为著名。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Jupiter%20planet%20great%20red%20spot%20cloud%20bands%20NASA%20photograph&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Jupiter%20in%20space%20large%20orange%20brown%20sphere%20stripes&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Jupiter%20storm%20systems%20swirling%20cloud%20patterns%20scientific&image_size=landscape_4_3',
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    nameCN: '土星',
    abbreviation: 'Sa',
    mass: 95.2,
    radius: 9.45,
    visualRadius: 2.2,
    orbitRadius: 33,
    orbitPeriod: 10759,
    rotationPeriod: 10.7,
    rotationSpeed: 3.2,
    surfaceColor: '#E5C07B',
    nameColor: '#E5C07B',
    description: '土星以其壮观的环系统闻名，这些环主要由冰和岩石碎片组成，宽度达28万公里但厚度仅约10米。土星是太阳系密度最低的行星，如果有足够大的水池，土星会漂浮在水面上。它拥有82颗已知卫星。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Saturn%20with%20rings%20golden%20sphere%20NASA%20Cassini%20photograph&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Saturn%20ring%20system%20close-up%20icy%20particles%20scientific&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Saturn%20atmosphere%20hexagonal%20storm%20at%20pole%20scientific&image_size=landscape_4_3',
    ],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    nameCN: '天王星',
    abbreviation: 'Ur',
    mass: 14.5,
    radius: 4.01,
    visualRadius: 1.5,
    orbitRadius: 45,
    orbitPeriod: 30687,
    rotationPeriod: 17.2,
    rotationSpeed: 2.0,
    surfaceColor: '#87CEEB',
    nameColor: '#87CEEB',
    description: '天王星是太阳系中最"躺平"的行星，其自转轴倾斜约98度，几乎是侧躺着绕太阳运行。这可能是远古时期一次巨大碰撞的结果。天王星呈现独特的淡青色，这是大气中甲烷吸收红光所致。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Uranus%20planet%20pale%20cyan%20blue%20sphere%20NASA%20Voyager%20photograph&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Uranus%20with%20tilted%20rings%20ice%20giant%20in%20space&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Uranus%20atmosphere%20blue%20green%20methane%20clouds%20scientific&image_size=landscape_4_3',
    ],
  },
  {
    id: 'neptune',
    name: 'Neptune',
    nameCN: '海王星',
    abbreviation: 'Ne',
    mass: 17.1,
    radius: 3.88,
    visualRadius: 1.4,
    orbitRadius: 55,
    orbitPeriod: 60190,
    rotationPeriod: 16.1,
    rotationSpeed: 2.2,
    surfaceColor: '#4169E1',
    nameColor: '#4169E1',
    description: '海王星是太阳系中距离太阳最远的行星，也是风速最快的行星，大气中的风速可达2100公里/小时。它呈现深邃的蓝色，同样由大气中的甲烷造成。海王星是第一颗通过数学计算而非直接观测发现的行星。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Neptune%20planet%20deep%20blue%20sphere%20dark%20spot%20NASA%20Voyager&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Neptune%20in%20space%20vivid%20blue%20ice%20giant%20realistic&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Neptune%20atmosphere%20fastest%20winds%20solar%20system%20scientific&image_size=landscape_4_3',
    ],
  },
];

export const TIME_SCALE = 12.0;
