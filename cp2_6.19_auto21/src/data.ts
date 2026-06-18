export type SpotCategory = '景点' | '餐厅' | '博物馆';

export interface Spot {
  id: string;
  name: string;
  category: SpotCategory;
  description: string;
  thumbnail: string;
  rating: number;
  lng: number;
  lat: number;
  visitDuration: number;
}

export interface RouteItem {
  spot: Spot;
  uid: string;
}

export const CATEGORY_COLORS: Record<SpotCategory, string> = {
  '景点': '#4a90d9',
  '餐厅': '#e67e22',
  '博物馆': '#8e44ad',
};

export const CATEGORY_THEME_COLORS: Record<SpotCategory, string> = {
  '景点': '#4a90d9',
  '餐厅': '#e67e22',
  '博物馆': '#8e44ad',
};

export const SPOTS: Spot[] = [
  { id: 's1', name: '故宫博物院', category: '博物馆', description: '中国明清两代皇家宫殿，世界文化遗产，珍藏百万件文物。', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Forbidden%20City%20Beijing%20palace%20aerial%20view%20red%20walls%20golden%20roofs&image_size=landscape_16_9', rating: 5, lng: 116.397, lat: 39.917, visitDuration: 180 },
  { id: 's2', name: '天坛公园', category: '景点', description: '明清皇帝祭天祈谷的场所，祈年殿是其标志性建筑。', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Temple%20of%20Heaven%20Beijing%20blue%20sky%20white%20marble&image_size=landscape_16_9', rating: 5, lng: 116.410, lat: 39.882, visitDuration: 120 },
  { id: 's3', name: '颐和园', category: '景点', description: '中国古典皇家园林，昆明湖与万寿山相映成趣。', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Summer%20Palace%20Beijing%20lake%20pavilion%20willow&image_size=landscape_16_9', rating: 5, lng: 116.275, lat: 39.999, visitDuration: 150 },
  { id: 's4', name: '全聚德烤鸭店', category: '餐厅', description: '百年老字号，正宗北京烤鸭，皮脆肉嫩，回味无穷。', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Peking%20roast%20duck%20restaurant%20traditional%20dining&image_size=landscape_16_9', rating: 4, lng: 116.398, lat: 39.899, visitDuration: 60 },
  { id: 's5', name: '中国国家博物馆', category: '博物馆', description: '世界最大博物馆之一，馆藏中华五千年文明瑰宝。', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=National%20Museum%20China%20grand%20hall%20columns&image_size=landscape_16_9', rating: 5, lng: 116.397, lat: 39.905, visitDuration: 180 },
  { id: 's6', name: '南锣鼓巷', category: '景点', description: '北京最古老的街区之一，胡同文化与创意小店交融。', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Nanluoguxiang%20hutong%20alley%20Beijing%20lanterns&image_size=landscape_16_9', rating: 4, lng: 116.403, lat: 39.937, visitDuration: 90 },
  { id: 's7', name: '护国寺小吃', category: '餐厅', description: '汇聚老北京传统小吃，豆汁焦圈驴打滚一应俱全。', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20Beijing%20street%20food%20snacks%20market&image_size=landscape_16_9', rating: 4, lng: 116.366, lat: 39.936, visitDuration: 45 },
  { id: 's8', name: '798艺术区', category: '景点', description: '当代艺术聚集地，旧工厂蜕变为创意画廊与工作室。', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=798%20Art%20District%20Beijing%20modern%20sculpture%20factory&image_size=landscape_16_9', rating: 4, lng: 116.494, lat: 39.984, visitDuration: 120 },
  { id: 's9', name: '首都博物馆', category: '博物馆', description: '展示北京三千余年建城史和八百年建都史。', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Capital%20Museum%20Beijing%20modern%20architecture%20bronze&image_size=landscape_16_9', rating: 4, lng: 116.339, lat: 39.906, visitDuration: 120 },
  { id: 's10', name: '什刹海', category: '景点', description: '老北京风情胜地，湖光柳影间尽享悠闲时光。', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Shichahai%20lake%20Beijing%20willow%20boats%20sunset&image_size=landscape_16_9', rating: 4, lng: 116.383, lat: 39.940, visitDuration: 90 },
  { id: 's11', name: '大董烤鸭', category: '餐厅', description: '新派烤鸭代表，酥不腻烤鸭搭配创意中式料理。', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fine%20dining%20Chinese%20restaurant%20elegant%20plating&image_size=landscape_16_9', rating: 5, lng: 116.468, lat: 39.922, visitDuration: 60 },
  { id: 's12', name: '北京天文馆', category: '博物馆', description: '中国第一座大型天文馆，探索宇宙奥秘的殿堂。', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Beijing%20Planetarium%20dome%20night%20sky%20stars&image_size=landscape_16_9', rating: 4, lng: 116.343, lat: 39.937, visitDuration: 90 },
];

export function filterSpots(spots: Spot[], keyword: string, category: SpotCategory | '全部'): Spot[] {
  return spots.filter((s) => {
    const matchCategory = category === '全部' || s.category === category;
    const matchKeyword = !keyword || s.name.includes(keyword) || s.description.includes(keyword);
    return matchCategory && matchKeyword;
  });
}

export function calcRouteDistance(items: RouteItem[]): number {
  let total = 0;
  for (let i = 1; i < items.length; i++) {
    const dx = items[i].spot.lng - items[i - 1].spot.lng;
    const dy = items[i].spot.lat - items[i - 1].spot.lat;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

export function calcTotalDuration(items: RouteItem[]): number {
  return items.reduce((sum, item) => sum + item.spot.visitDuration, 0);
}

export function calcCalories(items: RouteItem[]): number {
  const dist = calcRouteDistance(items);
  const walkingKm = dist * 85;
  return Math.round(walkingKm * 55);
}

export function getThemeColor(items: RouteItem[]): string {
  if (items.length === 0) return '#4a90d9';
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    counts[item.spot.category] = (counts[item.spot.category] || 0) + 1;
  });
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return CATEGORY_THEME_COLORS[dominant as SpotCategory];
}
