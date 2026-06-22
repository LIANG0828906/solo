export interface PlantFeature {
  mainColors: [number, number, number][];
  textureType: string;
}

export interface PlantGrowthStage {
  name: string;
  duration: string;
  order: number;
}

export interface Plant {
  id: string;
  name: string;
  varieties: string[];
  features: PlantFeature;
  careTips: {
    light: string;
    watering: string;
    fertilizing: string;
  };
  growthCycle: PlantGrowthStage[];
  imagePrompt: string;
}

export const plantDatabase: Plant[] = [
  {
    id: 'monstera-deliciosa',
    name: '龟背竹',
    varieties: ['迷你龟背竹', '斑叶龟背竹', '穿孔龟背竹', '泰国龟背竹'],
    features: {
      mainColors: [[34, 120, 50], [28, 100, 40], [45, 140, 60]],
      textureType: 'large-lobed',
    },
    careTips: {
      light: '喜明亮散射光，避免直射阳光。室内可放置在朝东或朝北的窗边，每天需4-6小时间接光照。光照不足会导致叶片变小、不开裂。',
      watering: '保持土壤微湿但不积水。春夏季每5-7天浇一次水，秋冬季每10-14天浇一次。浇水前检查土壤表层2cm是否干燥，避免过度浇水导致根腐。',
      fertilizing: '生长季（4-9月）每月施一次稀薄的液态氮肥，促进叶片生长。秋冬季停止施肥。可使用通用型室内植物肥，浓度稀释至推荐量的一半。',
    },
    growthCycle: [
      { name: '发芽期', duration: '7-14天', order: 1 },
      { name: '幼苗期', duration: '30-60天', order: 2 },
      { name: '展叶期', duration: '60-90天', order: 3 },
      { name: '成熟期', duration: '1-2年', order: 4 },
      { name: '开花期', duration: '3-5年后', order: 5 },
    ],
    imagePrompt: 'monstera deliciosa plant with large split leaves',
  },
  {
    id: 'sansevieria-trifasciata',
    name: '虎皮兰',
    varieties: ['金边虎皮兰', '短叶虎皮兰', '银纹虎皮兰', '圆柱虎皮兰'],
    features: {
      mainColors: [[60, 130, 50], [180, 190, 60], [40, 90, 35]],
      textureType: 'striped-upright',
    },
    careTips: {
      light: '适应性极强，从弱光到强光均可生长。最佳为明亮散射光，也能在较暗环境存活。避免长时间暴晒，否则叶片会发白变软。',
      watering: '极其耐旱，宁干勿湿。春夏季每2-3周浇一次，秋冬季每月一次即可。浇水时避免水流入叶心，防止腐烂。',
      fertilizing: '生长季每2个月施一次稀薄液肥即可。使用通用型室内植物肥，浓度稀释至推荐量的三分之一。冬季无需施肥。',
    },
    growthCycle: [
      { name: '发芽期', duration: '14-21天', order: 1 },
      { name: '幼苗期', duration: '60-90天', order: 2 },
      { name: '生长期', duration: '90-180天', order: 3 },
      { name: '成熟期', duration: '1-3年', order: 4 },
      { name: '花期', duration: '5年以上', order: 5 },
    ],
    imagePrompt: 'sansevieria snake plant with tall striped leaves',
  },
  {
    id: 'ficus-lyrata',
    name: '琴叶榕',
    varieties: ['矮生琴叶榕', '斑叶琴叶榕', '小叶琴叶榕'],
    features: {
      mainColors: [[35, 100, 40], [50, 120, 50], [25, 80, 30]],
      textureType: 'broad-veined',
    },
    careTips: {
      light: '需要明亮的间接光照，每天至少6小时。朝南或朝东的窗边最佳。光照不足会导致叶片脱落和新叶变小。避免突然改变光照条件。',
      watering: '保持土壤均匀湿润，不要让土壤完全干燥。春夏季每周浇一次，秋冬季每10天浇一次。使用室温水，避免冷水刺激根系。',
      fertilizing: '生长季每月施一次高氮液肥，促进叶片发育。秋冬季减少至每6周一次。注意施肥后要浇透水，避免烧根。',
    },
    growthCycle: [
      { name: '发芽期', duration: '10-20天', order: 1 },
      { name: '幼苗期', duration: '45-75天', order: 2 },
      { name: '展叶期', duration: '90-150天', order: 3 },
      { name: '成熟期', duration: '2-4年', order: 4 },
    ],
    imagePrompt: 'fiddle leaf fig tree with large violin shaped leaves',
  },
  {
    id: 'succulent-echeveria',
    name: '石莲花',
    varieties: ['吉娃莲', '黑法师', '玉蝶', '白牡丹', '花月夜'],
    features: {
      mainColors: [[140, 180, 130], [200, 170, 160], [120, 160, 120]],
      textureType: 'rosette-fleshy',
    },
    careTips: {
      light: '需要充足光照，每天至少6小时直射阳光。光照不足会导致徒长、株型松散。夏季高温时需适当遮荫，防止晒伤。',
      watering: '严格控水，遵循"干透浇透"原则。春秋季每2周浇一次，夏季和冬季每月一次。浇水时避免叶片积水，沿盆边浇灌。',
      fertilizing: '生长季每2个月施一次稀薄的多肉专用肥。浓度控制在推荐量的四分之一。休眠期（极端夏冬）停止施肥。',
    },
    growthCycle: [
      { name: '发根期', duration: '7-14天', order: 1 },
      { name: '幼苗期', duration: '30-60天', order: 2 },
      { name: '成株期', duration: '90-180天', order: 3 },
      { name: '开花期', duration: '1-2年后', order: 4 },
    ],
    imagePrompt: 'echeveria succulent rosette plant with fleshy leaves',
  },
  {
    id: 'philodendron',
    name: '蔓绿绒',
    varieties: ['心叶蔓绿绒', '红柄蔓绿绒', '羽裂蔓绿绒', '银叶蔓绿绒'],
    features: {
      mainColors: [[30, 110, 45], [40, 130, 55], [25, 95, 38]],
      textureType: 'heart-shaped-glossy',
    },
    careTips: {
      light: '喜半阴环境，适合室内明亮散射光。避免强烈直射光，否则叶片会焦边。耐阴性较好，但长期缺光会导致节间变长、叶色变淡。',
      watering: '喜湿润环境，春夏季每4-6天浇一次，秋冬季每7-10天浇一次。经常向叶面喷水增加湿度，有助于叶片保持光泽。',
      fertilizing: '生长旺盛期每月施一次复合液肥，氮磷钾比例1:1:1为宜。冬季生长缓慢时停止施肥。施肥时避免肥料接触叶片。',
    },
    growthCycle: [
      { name: '发芽期', duration: '7-14天', order: 1 },
      { name: '幼苗期', duration: '30-45天', order: 2 },
      { name: '攀爬期', duration: '60-120天', order: 3 },
      { name: '成熟期', duration: '1-2年', order: 4 },
    ],
    imagePrompt: 'philodendron plant with heart shaped glossy green leaves',
  },
  {
    id: 'aloe-vera',
    name: '芦荟',
    varieties: ['库拉索芦荟', '木立芦荟', '不夜城芦荟', '珍珠芦荟'],
    features: {
      mainColors: [[70, 135, 65], [90, 150, 80], [55, 115, 50]],
      textureType: 'spiky-succulent',
    },
    careTips: {
      light: '喜阳光充足的环境，每天至少4-6小时直射光。也能耐半阴，但长期缺光会导致叶片变细长、颜色变暗。夏季正午需适当遮荫。',
      watering: '耐旱怕涝，浇水原则为"不干不浇，浇则浇透"。春夏季每2周浇一次，秋冬季每月一次。冬季低温时要控水，防止冻害。',
      fertilizing: '生长季每3个月施一次有机肥或复合肥。浓度宜淡不宜浓。可使用腐熟的饼肥水或市售多肉专用肥，冬季停止施肥。',
    },
    growthCycle: [
      { name: '发根期', duration: '10-20天', order: 1 },
      { name: '幼苗期', duration: '60-90天', order: 2 },
      { name: '成株期', duration: '180-365天', order: 3 },
      { name: '分蘖期', duration: '1-2年', order: 4 },
      { name: '开花期', duration: '3-4年后', order: 5 },
    ],
    imagePrompt: 'aloe vera plant with thick spiky succulent leaves',
  },
  {
    id: 'pothos',
    name: '绿萝',
    varieties: ['金葛', '银葛', '大理石皇后', '霓虹绿萝'],
    features: {
      mainColors: [[40, 130, 50], [160, 180, 50], [30, 110, 42]],
      textureType: 'trailing-variegated',
    },
    careTips: {
      light: '耐阴性极强，适合室内各种光线条件。最喜明亮散射光，也能在较暗环境生长。金葛品种需要更多光照才能保持金色斑纹鲜艳。',
      watering: '保持土壤微湿即可，春夏季每5-7天浇一次，秋冬季每10-14天浇一次。叶片发软下垂是缺水信号。经常喷叶面水有助生长。',
      fertilizing: '生长季每月施一次氮肥为主的液肥，促进枝叶繁茂。秋冬季减少至每2月一次。也可用水培营养液，按说明稀释使用。',
    },
    growthCycle: [
      { name: '发芽期', duration: '7-10天', order: 1 },
      { name: '幼苗期', duration: '20-40天', order: 2 },
      { name: '攀爬期', duration: '60-120天', order: 3 },
      { name: '成熟期', duration: '6-12个月', order: 4 },
    ],
    imagePrompt: 'pothos golden devils ivy with trailing variegated leaves',
  },
  {
    id: 'cactus',
    name: '仙人掌',
    varieties: ['金琥', '绯牡丹', '星兜', '白檀', '银手指'],
    features: {
      mainColors: [[50, 120, 45], [60, 130, 50], [35, 100, 38]],
      textureType: 'spiny-columnar',
    },
    careTips: {
      light: '需要充足阳光，每天至少6小时直射光照。朝南窗台最佳。光照不足会导致徒长变形。夏季高温期部分品种需适当遮荫。',
      watering: '极耐干旱，浇水频率很低。生长季每3-4周浇一次，休眠期每月一次或不浇。浇水务必浇透，确保排水良好，积水必死。',
      fertilizing: '生长季每月施一次低氮高磷钾肥，促进开花。休眠期完全停肥。仙人掌专用肥最佳，避免使用高氮肥导致徒长。',
    },
    growthCycle: [
      { name: '发芽期', duration: '14-30天', order: 1 },
      { name: '幼苗期', duration: '90-180天', order: 2 },
      { name: '生长期', duration: '1-3年', order: 3 },
      { name: '成熟期', duration: '3-10年', order: 4 },
      { name: '开花期', duration: '5-15年后', order: 5 },
    ],
    imagePrompt: 'cactus plant with spiny green columnar body',
  },
];

export function euclideanDistance(
  a: [number, number, number],
  b: [number, number, number]
): number {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)
  );
}

export function matchPlant(
  mainColors: [number, number, number][],
  textureType: string
): Plant | null {
  let bestMatch: Plant | null = null;
  let bestScore = Infinity;

  for (const plant of plantDatabase) {
    let colorDist = 0;
    const maxComparisons = Math.min(mainColors.length, plant.features.mainColors.length);
    for (let i = 0; i < maxComparisons; i++) {
      colorDist += euclideanDistance(mainColors[i], plant.features.mainColors[i]);
    }
    colorDist /= maxComparisons;

    const textureMatch = plant.features.textureType === textureType ? 0 : 100;

    const totalScore = colorDist * 0.7 + textureMatch * 0.3;

    if (totalScore < bestScore) {
      bestScore = totalScore;
      bestMatch = plant;
    }
  }

  return bestMatch;
}
