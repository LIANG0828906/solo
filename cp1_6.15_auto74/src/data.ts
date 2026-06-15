export type FoodCategory = '烤串' | '奶茶' | '煎饼' | '糖葫芦' | '臭豆腐' | '炸鸡' | '凉皮' | '烤红薯';

export interface FoodStall {
  id: number;
  name: string;
  lat: number;
  lng: number;
  category: FoodCategory;
  rating: number;
  queueMinutes: number;
  priceMin: number;
  priceMax: number;
  thumbnail: string;
  description: string;
}

export interface FilterCriteria {
  categories: FoodCategory[];
  priceRange: [number, number];
  queueRanges: ('short' | 'medium' | 'long')[];
}

export const CATEGORY_CONFIG: Record<FoodCategory, { emoji: string; color: string }> = {
  '烤串': { emoji: '🔥', color: '#FF6B35' },
  '奶茶': { emoji: '🧋', color: '#9B59B6' },
  '煎饼': { emoji: '🥞', color: '#F4D03F' },
  '糖葫芦': { emoji: '🍬', color: '#E74C3C' },
  '臭豆腐': { emoji: '🧀', color: '#8B6914' },
  '炸鸡': { emoji: '🍗', color: '#E67E22' },
  '凉皮': { emoji: '🍜', color: '#27AE60' },
  '烤红薯': { emoji: '🍠', color: '#D35400' },
};

const STALL_NAMES: Record<FoodCategory, string[]> = {
  '烤串': ['老王烧烤', '夜市烤串王', '兄弟烤吧', '串串香老店', '炭火烤串铺'],
  '奶茶': ['鹿角巷', '茶百道小铺', '古法奶茶坊', '鲜奶茶摊', '黑糖珍珠站'],
  '煎饼': ['老街煎饼', '杂粮煎饼嫂', '薄脆煎饼屋', '天津煎饼摊', '手工煎饼坊'],
  '糖葫芦': ['老北京糖葫芦', '冰糖葫芦张', '果果糖串', '甜蜜糖葫芦', '传统糖葫芦铺'],
  '臭豆腐': ['长沙臭豆腐', '黑色经典', '闻着臭吃着香', '老街臭豆腐', '火宫殿小摊'],
  '炸鸡': ['正新鸡排', '韩式炸鸡摊', '脆皮炸鸡王', '爆浆鸡排', '黄金炸鸡铺'],
  '凉皮': ['秦镇凉皮', '汉中凉皮嫂', '麻辣凉皮摊', '手工凉皮坊', '陕西凉皮王'],
  '烤红薯': ['铁桶烤红薯', '老农红薯摊', '蜜薯小站', '炭火红薯王', '香甜烤薯铺'],
};

const DESCRIPTIONS: Record<FoodCategory, string[]> = {
  '烤串': ['炭火慢烤，肉香四溢', '深夜撸串首选', '秘制酱料腌制入味', '鲜嫩多汁一口上头', '十年老店匠心烤制'],
  '奶茶': ['现煮珍珠Q弹有嚼劲', '黑糖挂壁浓郁醇香', '鲜奶现泡丝滑顺口', '古法熬制甜蜜治愈', '料足味美超满足'],
  '煎饼': ['薄脆酥香层次分明', '杂粮面糊健康美味', '加蛋加肠超满足', '现摊现做热气腾腾', '老味道正宗口感'],
  '糖葫芦': ['冰糖晶莹酸甜可口', '传统手艺经典味道', '多种水果随心选', '现蘸现吃嘎嘣脆', '儿时记忆甜蜜回忆'],
  '臭豆腐': ['外焦里嫩闻臭吃香', '秘制卤水入味十足', '长沙地道风味', '配上辣酱更过瘾', '一口惊艳回甘无穷'],
  '炸鸡': ['外酥里嫩多汁爆浆', '秘制腌料香气扑鼻', '现炸现卖酥脆可口', '大块鸡肉超满足', '金黄诱人停不下'],
  '凉皮': ['筋道爽滑酸辣开胃', '秘制辣椒油鲜香', '手工洗面纯正口感', '夏日消暑必备美食', '配面筋更过瘾'],
  '烤红薯': ['软糯香甜入口即化', '铁桶慢烤焦糖飘香', '蜜薯品种甜到心里', '冬日暖心必备', '皮薄肉厚蜜汁四溢'],
};

const CENTER_LAT = 31.2304;
const CENTER_LNG = 121.4737;

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateThumbnail(category: FoodCategory): string {
  const prompts: Record<FoodCategory, string> = {
    '烤串': 'Chinese skewered BBQ meat kebabs street food night market close-up warm lighting',
    '奶茶': 'Bubble milk tea boba drink with tapioca pearls street stall warm lighting',
    '煎饼': 'Chinese jianbing crepe street food crispy with egg close-up warm lighting',
    '糖葫芦': 'Chinese candied hawthorn tanghulu sugar coated fruit sticks bright red',
    '臭豆腐': 'Chinese stinky tofu deep fried golden brown street food close-up',
    '炸鸡': 'Crispy fried chicken cutlet Chinese street food golden brown close-up',
    '凉皮': 'Chinese liangpi cold noodles street food with chili oil close-up',
    '烤红薯': 'Roasted sweet potato Chinese street food winter snack charred skin warm',
  };
  const encoded = encodeURIComponent(prompts[category]);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encoded}&image_size=square`;
}

let stallIdCounter = 0;

function generateStalls(count: number): FoodStall[] {
  const stalls: FoodStall[] = [];
  const categories = Object.keys(CATEGORY_CONFIG) as FoodCategory[];

  for (let i = 0; i < count; i++) {
    const category = pickRandom(categories);
    const names = STALL_NAMES[category];
    stallIdCounter++;
    stalls.push({
      id: stallIdCounter,
      name: names[i % names.length] || names[0],
      lat: CENTER_LAT + rand(-0.02, 0.02),
      lng: CENTER_LNG + rand(-0.03, 0.03),
      category,
      rating: Math.round(rand(2.5, 5.0) * 2) / 2,
      queueMinutes: randInt(2, 35),
      priceMin: randInt(5, 15),
      priceMax: randInt(15, 50),
      thumbnail: generateThumbnail(category),
      description: pickRandom(DESCRIPTIONS[category]),
    });
  }

  return stalls;
}

let _cachedStalls: FoodStall[] | null = null;

export function getAllStalls(): FoodStall[] {
  if (!_cachedStalls) {
    _cachedStalls = generateStalls(40);
  }
  return _cachedStalls;
}

export function filterStalls(criteria: FilterCriteria): FoodStall[] {
  const stalls = getAllStalls();
  return stalls.filter((stall) => {
    if (criteria.categories.length > 0 && !criteria.categories.includes(stall.category)) {
      return false;
    }
    if (stall.priceMax < criteria.priceRange[0] || stall.priceMin > criteria.priceRange[1]) {
      return false;
    }
    const queueCategory = stall.queueMinutes < 10 ? 'short' : stall.queueMinutes <= 20 ? 'medium' : 'long';
    if (criteria.queueRanges.length > 0 && !criteria.queueRanges.includes(queueCategory)) {
      return false;
    }
    return true;
  });
}

export function getQueueCategory(minutes: number): 'short' | 'medium' | 'long' {
  if (minutes < 10) return 'short';
  if (minutes <= 20) return 'medium';
  return 'long';
}
