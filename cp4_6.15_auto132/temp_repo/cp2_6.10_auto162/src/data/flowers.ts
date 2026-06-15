import type { Flower, PatternType, Rarity } from '../types/game';

const FLOWER_TEMPLATES: Array<{
  name: string;
  rarity: Rarity;
  pattern: PatternType;
  color: string;
  secondaryColor: string;
  description: string;
}> = [
  { name: '芍药', rarity: 'rare', pattern: 'petal', color: '#f06292', secondaryColor: '#f8bbd0', description: '唐代宫廷名花，花姿绰约，色香俱绝' },
  { name: '芙蓉', rarity: 'rare', pattern: 'petal', color: '#ec407a', secondaryColor: '#f48fb1', description: '拒霜之花，秋季盛开，雍容华贵' },
  { name: '萱草', rarity: 'common', pattern: 'spike', color: '#ffb74d', secondaryColor: '#ffe0b2', description: '忘忧草，花开似金，寓意美好' },
  { name: '菖蒲', rarity: 'common', pattern: 'spike', color: '#66bb6a', secondaryColor: '#c8e6c9', description: '端午时节遍插户，驱邪避秽' },
  { name: '车前子', rarity: 'common', pattern: 'spike', color: '#8bc34a', secondaryColor: '#dcedc8', description: '路边常见之草，嫩叶可食' },
  { name: '蔷薇', rarity: 'rare', pattern: 'cluster', color: '#f48fb1', secondaryColor: '#fce4ec', description: '蔓生幽香，春日盛开，朵朵娇艳' },
  { name: '牡丹', rarity: 'exotic', pattern: 'petal', color: '#e91e63', secondaryColor: '#f8bbd0', description: '国色天香，花中之王，唐代最盛' },
  { name: '菊花', rarity: 'rare', pattern: 'radiate', color: '#ffca28', secondaryColor: '#ffecb3', description: '秋之花，傲霜斗寒，隐士之象征' },
  { name: '兰花', rarity: 'exotic', pattern: 'spike', color: '#9575cd', secondaryColor: '#d1c4e9', description: '君子之花，幽香清远，雅俗共赏' },
  { name: '梅花', rarity: 'exotic', pattern: 'petal', color: '#f44336', secondaryColor: '#ffcdd2', description: '岁寒三友之首，傲雪凌霜' },
  { name: '海棠', rarity: 'rare', pattern: 'cluster', color: '#ff7043', secondaryColor: '#ffccbc', description: '春之娇娘，花开似锦，垂丝妩媚' },
  { name: '紫薇', rarity: 'common', pattern: 'spike', color: '#ba68c8', secondaryColor: '#e1bee7', description: '百日红，花期绵长，夏秋盛开' },
  { name: '栀子', rarity: 'common', pattern: 'star', color: '#ffffff', secondaryColor: '#fafafa', description: '夏日白花，芳香四溢，色如凝脂' },
  { name: '茉莉', rarity: 'rare', pattern: 'star', color: '#fafafa', secondaryColor: '#ffffff', description: '岭南名花，清香袭人，入夜更盛' },
  { name: '荷花', rarity: 'rare', pattern: 'petal', color: '#f48fb1', secondaryColor: '#fce4ec', description: '出淤泥而不染，濯清涟而不妖' },
  { name: '睡莲', rarity: 'common', pattern: 'radiate', color: '#ce93d8', secondaryColor: '#f3e5f5', description: '水中仙子，昼开夜合，清雅脱俗' },
  { name: '迎春', rarity: 'common', pattern: 'bell', color: '#ffee58', secondaryColor: '#fff9c4', description: '春之使者，黄花满枝，早报春讯' },
  { name: '连翘', rarity: 'common', pattern: 'bell', color: '#ffd54f', secondaryColor: '#fff8e1', description: '黄花满条，迎春而开，药用价值高' },
  { name: '紫荆', rarity: 'rare', pattern: 'cluster', color: '#ab47bc', secondaryColor: '#e1bee7', description: '满条红，春日紫花，团圆之象征' },
  { name: '紫藤', rarity: 'rare', pattern: 'feather', color: '#7e57c2', secondaryColor: '#d1c4e9', description: '藤本花卉，紫穗垂悬，如梦似幻' },
  { name: '凌霄', rarity: 'common', pattern: 'bell', color: '#ff7043', secondaryColor: '#ffccbc', description: '攀援而上，红花似火，志存高远' },
  { name: '凤仙', rarity: 'common', pattern: 'petal', color: '#ff5252', secondaryColor: '#ffcdd2', description: '指甲花，花瓣可染指甲，妇人所爱' },
  { name: '鸡冠', rarity: 'common', pattern: 'spike', color: '#f44336', secondaryColor: '#ffcdd2', description: '花形如鸡冠，红艳夺目，秋日盛开' },
  { name: '蜀葵', rarity: 'rare', pattern: 'petal', color: '#ef5350', secondaryColor: '#ffcdd2', description: '一丈红，高杆大花，仲夏盛放' },
  { name: '木槿', rarity: 'common', pattern: 'bell', color: '#ab47bc', secondaryColor: '#e1bee7', description: '朝开暮落，日日新花，坚韧之象征' },
  { name: '玉簪', rarity: 'rare', pattern: 'spike', color: '#ffffff', secondaryColor: '#f5f5f5', description: '月下美人，花白如玉，清香袭人' },
  { name: '铃兰', rarity: 'exotic', pattern: 'bell', color: '#fafafa', secondaryColor: '#ffffff', description: '幽谷之花，铃状白花，香气幽雅' },
  { name: '含笑', rarity: 'rare', pattern: 'star', color: '#fff59d', secondaryColor: '#fffde7', description: '含笑不语，花香如兰，温婉可人' },
  { name: '映山红', rarity: 'common', pattern: 'cluster', color: '#e53935', secondaryColor: '#ffcdd2', description: '杜鹃花，满山红遍，春日胜景' },
  { name: '金盏菊', rarity: 'common', pattern: 'radiate', color: '#ffc107', secondaryColor: '#ffecb3', description: '金黄花朵，形如金盏，药用食用皆宜' },
];

export function generateGardenFlowers(): Flower[] {
  const count = Math.floor(Math.random() * 11) + 20;
  const flowers: Flower[] = [];
  
  for (let i = 0; i < count; i++) {
    const templateIndex = Math.floor(Math.random() * FLOWER_TEMPLATES.length);
    const template = FLOWER_TEMPLATES[templateIndex];
    const adjustedRarity = adjustRarity(template.rarity);
    
    flowers.push({
      id: `flower-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      rarity: adjustedRarity,
      pattern: template.pattern,
      color: template.color,
      secondaryColor: template.secondaryColor,
      description: template.description,
    });
  }
  
  return flowers;
}

function adjustRarity(baseRarity: Rarity): Rarity {
  const rand = Math.random();
  if (baseRarity === 'exotic') {
    return rand < 0.7 ? 'exotic' : (rand < 0.9 ? 'rare' : 'common');
  }
  if (baseRarity === 'rare') {
    return rand < 0.1 ? 'exotic' : (rand < 0.7 ? 'rare' : 'common');
  }
  return rand < 0.05 ? 'exotic' : (rand < 0.25 ? 'rare' : 'common');
}

export function getRandomFlower(): Flower {
  const templateIndex = Math.floor(Math.random() * FLOWER_TEMPLATES.length);
  const template = FLOWER_TEMPLATES[templateIndex];
  return {
    id: `ai-flower-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: template.name,
    rarity: adjustRarity(template.rarity),
    pattern: template.pattern,
    color: template.color,
    secondaryColor: template.secondaryColor,
    description: template.description,
  };
}
