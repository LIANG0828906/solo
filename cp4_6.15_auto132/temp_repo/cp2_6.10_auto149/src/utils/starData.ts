export type FourSymbols = '青龙' | '白虎' | '朱雀' | '玄武';
export type Element = '木' | '金' | '火' | '水' | '土';

export interface Constellation28 {
  name: string;
  chineseName: string;
  rightAscension: number;
  declination: number;
  brightness: number;
  symbol: FourSymbols;
  element: Element;
  story: string;
  stars: Array<{ x: number; y: number; z: number; rightAscension: number; declination: number; brightness: number }>;
}

export interface BigDipperStar {
  name: string;
  chineseName: string;
  rightAscension: number;
  declination: number;
  x: number;
  y: number;
  z: number;
  story: string;
}

export interface RandomStar {
  rightAscension: number;
  declination: number;
  brightness: number;
}

const SKY_RADIUS = 50;

function sphericalToCartesian(rightAscension: number, declination: number, radius: number = SKY_RADIUS): { x: number; y: number; z: number } {
  const ra = (rightAscension * Math.PI) / 180;
  const dec = (declination * Math.PI) / 180;
  return {
    x: radius * Math.cos(dec) * Math.cos(ra),
    y: radius * Math.sin(dec),
    z: radius * Math.cos(dec) * Math.sin(ra),
  };
}

export const symbolColors: Record<FourSymbols, string> = {
  '青龙': '#4ade80',
  '白虎': '#f87171',
  '朱雀': '#fbbf24',
  '玄武': '#60a5fa',
};

const createConstellationStars = (ra: number, dec: number, count: number = 3) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const starRa = ra + i * 3;
    const starDec = dec + (i - 1) * 2;
    const pos = sphericalToCartesian(starRa, starDec);
    stars.push({
      ...pos,
      rightAscension: starRa,
      declination: starDec,
      brightness: 2 + Math.random() * 2,
    });
  }
  return stars;
};

export const CONSTELLATIONS_28: Constellation28[] = [
  {
    name: '角',
    chineseName: '角宿',
    rightAscension: 195,
    declination: -5,
    brightness: 1.2,
    symbol: '青龙',
    element: '木',
    story: '角宿为青龙之角，主造化万物，为东方七宿之首。传说角宿主兴兵，动众事，其星明则王道行。',
    stars: createConstellationStars(195, -5, 2),
  },
  {
    name: '亢',
    chineseName: '亢宿',
    rightAscension: 205,
    declination: -10,
    brightness: 2.6,
    symbol: '青龙',
    element: '金',
    story: '亢宿为青龙之颈，主疾病、灾祸。亢宿为天府，又称"天庭"，主天子之正位。',
    stars: createConstellationStars(205, -10, 4),
  },
  {
    name: '氐',
    chineseName: '氐宿',
    rightAscension: 220,
    declination: -15,
    brightness: 2.8,
    symbol: '青龙',
    element: '土',
    story: '氐宿为青龙之前胸，主根柢、根基。氐宿为天根，王者立宫室必顺之，否则国有大疫。',
    stars: createConstellationStars(220, -15, 4),
  },
  {
    name: '房',
    chineseName: '房宿',
    rightAscension: 235,
    declination: -25,
    brightness: 2.0,
    symbol: '青龙',
    element: '火',
    story: '房宿为青龙之腹，主政教、明堂。房为四表，为天驷，主王者开库藏，赏群臣。',
    stars: createConstellationStars(235, -25, 4),
  },
  {
    name: '心',
    chineseName: '心宿',
    rightAscension: 245,
    declination: -30,
    brightness: 1.6,
    symbol: '青龙',
    element: '火',
    story: '心宿为青龙之心，主心脑、君臣之位。心宿三星，中央为天王，前后为太子、庶子。',
    stars: createConstellationStars(245, -30, 3),
  },
  {
    name: '尾',
    chineseName: '尾宿',
    rightAscension: 260,
    declination: -35,
    brightness: 2.4,
    symbol: '青龙',
    element: '火',
    story: '尾宿为青龙之尾，主后宫、子孙。尾九星为后宫之场，妃嫔之府，子孙昌盛之兆。',
    stars: createConstellationStars(260, -35, 4),
  },
  {
    name: '箕',
    chineseName: '箕宿',
    rightAscension: 270,
    declination: -30,
    brightness: 3.2,
    symbol: '青龙',
    element: '水',
    story: '箕宿为青龙之尾尖，主口舌、蛮夷。箕宿四星，主风伯之位，动则有风。',
    stars: createConstellationStars(270, -30, 4),
  },
  {
    name: '斗',
    chineseName: '斗宿',
    rightAscension: 280,
    declination: -25,
    brightness: 2.2,
    symbol: '玄武',
    element: '水',
    story: '斗宿为玄武之首，主宰相、俸禄。斗六星，又称"南斗"，主天子寿命，亦主宰相爵禄。',
    stars: createConstellationStars(280, -25, 6),
  },
  {
    name: '牛',
    chineseName: '牛宿',
    rightAscension: 295,
    declination: -15,
    brightness: 3.4,
    symbol: '玄武',
    element: '金',
    story: '牛宿为玄武之颈，主牺牲、祭祀。牛宿六星，主耕田、畜牧，亦主桥梁道路。',
    stars: createConstellationStars(295, -15, 6),
  },
  {
    name: '女',
    chineseName: '女宿',
    rightAscension: 310,
    declination: -5,
    brightness: 3.6,
    symbol: '玄武',
    element: '土',
    story: '女宿为玄武之胸，主女工、嫁娶。女宿四星，主后宫、妇女事，亦主布帛珍宝。',
    stars: createConstellationStars(310, -5, 4),
  },
  {
    name: '虚',
    chineseName: '虚宿',
    rightAscension: 325,
    declination: 5,
    brightness: 3.8,
    symbol: '玄武',
    element: '火',
    story: '虚宿为玄武之腹，主哭泣、丧事。虚宿二星，主冢宰、北陆，为北方之宿，主邑居庙堂。',
    stars: createConstellationStars(325, 5, 2),
  },
  {
    name: '危',
    chineseName: '危宿',
    rightAscension: 340,
    declination: 10,
    brightness: 3.5,
    symbol: '玄武',
    element: '土',
    story: '危宿为玄武之背，主危险、宗庙。危宿三星，主天子宗庙，又主架屋、受藏。',
    stars: createConstellationStars(340, 10, 3),
  },
  {
    name: '室',
    chineseName: '室宿',
    rightAscension: 355,
    declination: 15,
    brightness: 3.3,
    symbol: '玄武',
    element: '火',
    story: '室宿为玄武之后背，主营建、军粮。室宿二星，为玄宫，主离宫别馆，又主军粮之府。',
    stars: createConstellationStars(355, 15, 2),
  },
  {
    name: '壁',
    chineseName: '壁宿',
    rightAscension: 15,
    declination: 20,
    brightness: 3.1,
    symbol: '玄武',
    element: '水',
    story: '壁宿为玄武之尾，主文章、图书。壁宿二星，主天下文章图书之府，又名"东壁"。',
    stars: createConstellationStars(15, 20, 2),
  },
  {
    name: '奎',
    chineseName: '奎宿',
    rightAscension: 30,
    declination: 25,
    brightness: 2.9,
    symbol: '白虎',
    element: '木',
    story: '奎宿为白虎之首，主武库、兵事。奎宿十六星，为封豕，主天下兵事，又主沟渎。',
    stars: createConstellationStars(30, 25, 6),
  },
  {
    name: '娄',
    chineseName: '娄宿',
    rightAscension: 45,
    declination: 25,
    brightness: 2.7,
    symbol: '白虎',
    element: '金',
    story: '娄宿为白虎之颈，主苑牧、牺牲。娄宿三星，为聚众，主兴兵聚众，又主郊祀天庙。',
    stars: createConstellationStars(45, 25, 3),
  },
  {
    name: '胃',
    chineseName: '胃宿',
    rightAscension: 60,
    declination: 20,
    brightness: 3.0,
    symbol: '白虎',
    element: '土',
    story: '胃宿为白虎之胸，主仓廪、五谷。胃宿三星，为天厨，主藏储五谷，又主饮食之事。',
    stars: createConstellationStars(60, 20, 3),
  },
  {
    name: '昴',
    chineseName: '昴宿',
    rightAscension: 75,
    declination: 20,
    brightness: 1.8,
    symbol: '白虎',
    element: '火',
    story: '昴宿为白虎之腹，主西方、胡人。昴宿七星，为旄头，主胡兵，又主丧狱之事。',
    stars: createConstellationStars(75, 20, 7),
  },
  {
    name: '毕',
    chineseName: '毕宿',
    rightAscension: 90,
    declination: 15,
    brightness: 2.1,
    symbol: '白虎',
    element: '水',
    story: '毕宿为白虎之肋，主弋猎、边兵。毕宿八星，为罕车，主弋猎，又主边兵，动则有兵起。',
    stars: createConstellationStars(90, 15, 5),
  },
  {
    name: '觜',
    chineseName: '觜宿',
    rightAscension: 105,
    declination: 10,
    brightness: 3.7,
    symbol: '白虎',
    element: '火',
    story: '觜宿为白虎之肩，主收敛、万物。觜宿三星，为虎首，主万物收敛，又主军旅之粮。',
    stars: createConstellationStars(105, 10, 3),
  },
  {
    name: '参',
    chineseName: '参宿',
    rightAscension: 120,
    declination: 0,
    brightness: 0.4,
    symbol: '白虎',
    element: '水',
    story: '参宿为白虎之前胸，主将军、征战。参宿七星，中央三将，前后左右四将，为虎之威。',
    stars: createConstellationStars(120, 0, 7),
  },
  {
    name: '井',
    chineseName: '井宿',
    rightAscension: 135,
    declination: -5,
    brightness: 2.3,
    symbol: '朱雀',
    element: '木',
    story: '井宿为朱雀之首，主水泉、宾客。井宿八星，为水事，主水泉灌概，又主宾客酒食。',
    stars: createConstellationStars(135, -5, 8),
  },
  {
    name: '鬼',
    chineseName: '鬼宿',
    rightAscension: 145,
    declination: -15,
    brightness: 4.5,
    symbol: '朱雀',
    element: '火',
    story: '鬼宿为朱雀之颈，主祠祀、死丧。鬼宿四星，为天目，主祠祀鬼神，又主疾病死丧。',
    stars: createConstellationStars(145, -15, 4),
  },
  {
    name: '柳',
    chineseName: '柳宿',
    rightAscension: 160,
    declination: -20,
    brightness: 3.9,
    symbol: '朱雀',
    element: '木',
    story: '柳宿为朱雀之喙，主木、草木。柳宿八星，为天厨，主饮食滋味，又主草木生长。',
    stars: createConstellationStars(160, -20, 8),
  },
  {
    name: '星',
    chineseName: '星宿',
    rightAscension: 175,
    declination: -25,
    brightness: 2.5,
    symbol: '朱雀',
    element: '火',
    story: '星宿为朱雀之颈，主衣裳、文绣。星宿七星，为员官，主急事，又主衣裳文绣。',
    stars: createConstellationStars(175, -25, 4),
  },
  {
    name: '张',
    chineseName: '张宿',
    rightAscension: 190,
    declination: -30,
    brightness: 3.2,
    symbol: '朱雀',
    element: '火',
    story: '张宿为朱雀之喙，主珍宝、宗庙。张宿六星，为天厨，主天子宫庙，又主赏赐珍宝。',
    stars: createConstellationStars(190, -30, 6),
  },
  {
    name: '翼',
    chineseName: '翼宿',
    rightAscension: 205,
    declination: -35,
    brightness: 4.0,
    symbol: '朱雀',
    element: '火',
    story: '翼宿为朱雀之翼，主夷狄、远客。翼宿二十二星，为天乐府，主夷狄远客，又主娱乐。',
    stars: createConstellationStars(205, -35, 6),
  },
  {
    name: '轸',
    chineseName: '轸宿',
    rightAscension: 220,
    declination: -30,
    brightness: 2.8,
    symbol: '朱雀',
    element: '水',
    story: '轸宿为朱雀之尾，主车骑、风伯。轸宿四星，为车骑，主载任有生，又主风伯之位。',
    stars: createConstellationStars(220, -30, 4),
  },
];

export const BIG_DIPPER: BigDipperStar[] = [
  {
    name: '天枢',
    chineseName: '天枢',
    rightAscension: 165,
    declination: 62,
    ...sphericalToCartesian(165, 62),
    story: '天枢为北斗七星之首，又称"贪狼星"。主天子之命，为七星之枢纽，掌天下万物之始。',
  },
  {
    name: '天璇',
    chineseName: '天璇',
    rightAscension: 170,
    declination: 57,
    ...sphericalToCartesian(170, 57),
    story: '天璇为北斗第二星，又称"巨门星"。主地之道，掌天下万物之生长，为北斗之旋机。',
  },
  {
    name: '天玑',
    chineseName: '天玑',
    rightAscension: 178,
    declination: 55,
    ...sphericalToCartesian(178, 55),
    story: '天玑为北斗第三星，又称"禄存星"。主人之道，掌天下万物之化成，主禄秩、寿命。',
  },
  {
    name: '天权',
    chineseName: '天权',
    rightAscension: 188,
    declination: 57,
    ...sphericalToCartesian(188, 57),
    story: '天权为北斗第四星，又称"文曲星"。主天子权衡，掌天下文运，为北斗之平衡点。',
  },
  {
    name: '玉衡',
    chineseName: '玉衡',
    rightAscension: 198,
    declination: 56,
    ...sphericalToCartesian(198, 56),
    story: '玉衡为北斗第五星，又称"廉贞星"。主中央之政，掌天下节度，为北斗之核心。',
  },
  {
    name: '开阳',
    chineseName: '开阳',
    rightAscension: 210,
    declination: 54,
    ...sphericalToCartesian(210, 54),
    story: '开阳为北斗第六星，又称"武曲星"。主开阳布气，掌天下武运，主辅相之位。',
  },
  {
    name: '摇光',
    chineseName: '摇光',
    rightAscension: 225,
    declination: 49,
    ...sphericalToCartesian(225, 49),
    story: '摇光为北斗第七星，又称"破军星"。主摇荡光明，掌天下兵事，为北斗之尾，主杀伐。',
  },
];

export function generateRandomStars(count: number = 2000): RandomStar[] {
  const stars: RandomStar[] = [];
  
  for (let i = 0; i < count; i++) {
    const rightAscension = Math.random() * 360;
    const declination = Math.asin(2 * Math.random() - 1) * (180 / Math.PI);
    const brightness = Math.random() * 5 + 1;
    
    stars.push({
      rightAscension: Number(rightAscension.toFixed(2)),
      declination: Number(declination.toFixed(2)),
      brightness: Number(brightness.toFixed(2))
    });
  }
  
  return stars;
}

export type SolarTerm = 
  | '立春' | '雨水' | '惊蛰' | '春分' | '清明' | '谷雨'
  | '立夏' | '小满' | '芒种' | '夏至' | '小暑' | '大暑'
  | '立秋' | '处暑' | '白露' | '秋分' | '寒露' | '霜降'
  | '立冬' | '小雪' | '大雪' | '冬至' | '小寒' | '大寒';

export const SOLAR_TERMS: SolarTerm[] = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
];

export function getSkyOffsetByMonth(month: number): number {
  const clampedMonth = Math.max(1, Math.min(12, month));
  return (clampedMonth - 1) * 30;
}

export function getSkyOffsetBySolarTerm(term: SolarTerm): number {
  const index = SOLAR_TERMS.indexOf(term);
  if (index === -1) {
    return 0;
  }
  return index * 15;
}

export function getSkyOffsetByDate(date: Date): number {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const monthOffset = (month - 1) * 30;
  const dayOffset = (day - 1) * (30 / 30);
  
  return monthOffset + dayOffset;
}

export function getCurrentSkyOffset(): number {
  return getSkyOffsetByDate(new Date());
}

export interface Constellation {
  name: string;
  chineseName: string;
  element: Element;
  story: string;
  stars: Array<{ x: number; y: number; z: number }>;
}

export const elementColors: Record<Element, string> = {
  '木': '#4ade80',
  '火': '#f87171',
  '土': '#fbbf24',
  '金': '#94a3b8',
  '水': '#60a5fa',
};

export const bigDipperStars = BIG_DIPPER.map(star => ({
  name: star.name,
  x: star.x,
  y: star.y,
  z: star.z,
}));

export const bigDipperStory = '北斗七星位于紫微垣，为天帝之车，载帝而行于天中央。北斗七星分别为天枢、天璇、天玑、天权、玉衡、开阳、摇光，主天子寿命、宰相爵禄、天下文运武事。古人云："斗为帝车，运于中央，临制四乡。分阴阳，建四时，均五行，移节度，定诸纪，皆系于斗。"';

export const twentyEightMansions: Constellation[] = CONSTELLATIONS_28.map(c => ({
  name: c.name,
  chineseName: c.chineseName,
  element: c.element,
  story: c.story,
  stars: c.stars.map(s => ({ x: s.x, y: s.y, z: s.z })),
}));
