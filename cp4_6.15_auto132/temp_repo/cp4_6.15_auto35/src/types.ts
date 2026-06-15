export type WineType = 'red' | 'white' | 'sparkling' | 'sweet';

export interface Wine {
  id: string;
  name: string;
  country: string;
  region: string;
  subRegion: string;
  grapeVarieties: string[];
  vintage: number;
  type: WineType;
  quantity: number;
  price: number;
  rating: number;
  imageColor: string;
}

export interface Tasting {
  id: string;
  wineId: string;
  date: string;
  color: string;
  aroma: string;
  sweetness: number;
  acidity: number;
  tannin: number;
  body: number;
  rating: number;
  summary: string;
}

export interface CurvePoint {
  year: number;
  rating: number;
}

export const WINE_TYPES: { value: WineType; label: string }[] = [
  { value: 'red', label: '红葡萄酒' },
  { value: 'white', label: '白葡萄酒' },
  { value: 'sparkling', label: '起泡酒' },
  { value: 'sweet', label: '甜酒' },
];

export const GRAPE_VARIETIES = [
  '赤霞珠', '黑皮诺', '霞多丽', '雷司令', '西拉', '梅洛',
  '长相思', '灰皮诺', '歌海娜', '内比奥罗', '桑娇维塞', '丹魄',
  '仙粉黛', '马尔贝克', '佳美', '琼瑶浆', '麝香', '维欧尼'
];

export const AROMA_WORDS = [
  '黑醋栗', '樱桃', '覆盆子', '蓝莓', '黑莓', '李子',
  '烟草', '皮革', '雪松', '香草', '橡木', '焦糖',
  '巧克力', '咖啡', '烟熏', '玫瑰', '紫罗兰', '薄荷',
  '青椒', '松露', '蜂蜜', '柑橘', '苹果', '梨',
  '杏桃', '矿物', '燧石', '面包', '酵母', '烤杏仁'
];

export const WINE_COLORS = [
  '淡宝石红', '宝石红', '石榴红', '紫红', '深红', '墨红',
  '浅金黄', '金黄', '琥珀色', '柠檬黄', '淡粉', '三文鱼粉'
];

export const REGION_DATA: Record<string, Record<string, string[]>> = {
  '法国': {
    '波尔多': ['梅多克', '圣埃美隆', '玛歌', '格拉夫', '苏玳'],
    '勃艮第': ['科多尔', '博讷', '夏布利', '马孔内'],
    '香槟': ['兰斯山', '马恩河谷', '白丘', '巴尔山坡'],
    '罗讷河谷': ['北罗讷', '南罗讷', '教皇新堡'],
    '卢瓦尔河谷': ['桑塞尔', '普伊-富美', '武弗雷', '希农']
  },
  '意大利': {
    '托斯卡纳': ['基安帝', '布鲁奈罗', '蒙塔尔奇诺', '保格利'],
    '皮埃蒙特': ['巴罗洛', '巴巴莱斯科', '阿斯蒂', '阿尔巴'],
    '威尼托': ['瓦坡里切拉', '苏瓦韦', '阿玛罗尼'],
    '西西里': ['埃特纳', '诺托']
  },
  '西班牙': {
    '里奥哈': ['上里奥哈', '下里奥哈', '阿拉维萨里奥哈'],
    '杜罗河谷': ['佩内德斯', '比埃尔索'],
    '加泰罗尼亚': ['普里奥拉托', '蒙桑特']
  },
  '智利': {
    '迈坡谷': ['上迈坡', '科尔查瓜', '卡查波阿尔'],
    '马乌莱谷': ['伊塔塔谷', '比奥比奥谷']
  },
  '美国': {
    '纳帕谷': ['鹿跃区', '奥克维尔', '卢瑟福', '圣海伦娜'],
    '索诺玛': ['俄罗斯河谷', '亚历山大谷'],
    '俄勒冈': ['威拉米特谷']
  },
  '新西兰': {
    '马尔堡': ['威劳河', '霍克斯湾', '中奥塔哥']
  },
  '德国': {
    '摩泽尔': ['贝恩卡斯特', '特拉本-特拉巴赫'],
    '莱茵高': ['吕德斯海姆', '约翰山'],
    '法尔兹': ['巴登']
  },
  '阿根廷': {
    '门多萨': ['卢汉德库约', '迈普', '乌科谷']
  }
};

export const ALL_COUNTRIES = Object.keys(REGION_DATA);
