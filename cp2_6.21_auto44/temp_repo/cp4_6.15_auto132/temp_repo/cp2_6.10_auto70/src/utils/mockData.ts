import type { PawnItem, GuestType, Material, Era, Condition, Liquidity } from '../types';

const guestNames: Record<GuestType, string[]> = {
  scholar: ['李明远', '王墨轩', '张静斋', '陈秋白', '刘墨林'],
  noble: ['爱新觉罗·载澄', '富察·景寿', '钮祜禄·常安', '佟佳·庆瑞', '瓜尔佳·荣禄'],
  peddler: ['王阿福', '李狗儿', '张老实', '赵老栓', '孙小顺子']
};

const itemTemplates = [
  {
    name: '端砚',
    type: 'inkstone',
    material: 'stone' as Material,
    era: 'qing' as Era,
    description: '祖传端砚，石质细腻温润',
    flaws: ['砚台边缘有细小裂纹', '墨池略有磨损']
  },
  {
    name: '翡翠扳指',
    type: 'jade_ring',
    material: 'jade' as Material,
    era: 'qing' as Era,
    description: '冰种翡翠扳指，通体翠绿',
    flaws: ['内侧有天然沁色', '表面有轻微划痕']
  },
  {
    name: '西洋自鸣钟',
    type: 'clock',
    material: 'gold' as Material,
    era: 'qing' as Era,
    description: '英国制造鎏金自鸣钟',
    flaws: ['钟摆停摆', '外壳有氧化痕迹']
  },
  {
    name: '青花瓷瓶',
    type: 'porcelain',
    material: 'porcelain' as Material,
    era: 'ming' as Era,
    description: '明万历年间青花缠枝莲纹瓶',
    flaws: ['瓶口有小磕', '底部有窑裂']
  },
  {
    name: '紫檀木盒',
    type: 'wood_box',
    material: 'wood' as Material,
    era: 'qing' as Era,
    description: '小叶紫檀刻花首饰盒',
    flaws: ['盒盖合缝不严', '边角有磨损']
  },
  {
    name: '银质长命锁',
    type: 'silver_lock',
    material: 'silver' as Material,
    era: 'qing' as Era,
    description: '纯银錾刻长命百岁锁',
    flaws: ['银面氧化发黑', '链子有一处断开']
  },
  {
    name: '宋版古籍',
    type: 'book',
    material: 'wood' as Material,
    era: 'song' as Era,
    description: '宋刻本《论语集注》十卷',
    flaws: ['书页有虫蛀', '部分页面缺角']
  },
  {
    name: '金镶玉簪',
    type: 'hairpin',
    material: 'gold' as Material,
    era: 'ming' as Era,
    description: '累丝金镶和田玉簪',
    flaws: ['玉簪有绺裂', '金托略有变形']
  }
];

export function generateRandomGuest(): { name: string; type: GuestType } {
  const types: GuestType[] = ['scholar', 'noble', 'peddler'];
  const type = types[Math.floor(Math.random() * types.length)];
  const names = guestNames[type];
  const name = names[Math.floor(Math.random() * names.length)];
  return { name, type };
}

export function generateRandomItem(): {
  itemName: string;
  itemType: string;
  material: Material;
  era: Era;
  condition: Condition;
  liquidity: Liquidity;
  originalValue: number;
  description: string;
  flaws: string[];
  weight: number;
} {
  const template = itemTemplates[Math.floor(Math.random() * itemTemplates.length)];
  const conditions: Condition[] = ['excellent', 'good', 'poor'];
  const liquidities: Liquidity[] = ['high', 'medium', 'low'];
  
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const liquidity = liquidities[Math.floor(Math.random() * liquidities.length)];
  const weight = Math.round((0.1 + Math.random() * 5) * 100) / 100;
  const originalValue = Math.round((50 + Math.random() * 1000) * 100) / 100;

  return {
    itemName: template.name,
    itemType: template.type,
    material: template.material,
    era: template.era,
    condition,
    liquidity,
    originalValue,
    description: template.description,
    flaws: template.flaws,
    weight
  };
}

export function generateMockPawnItem(id: string): PawnItem {
  const guest = generateRandomGuest();
  const item = generateRandomItem();
  const now = new Date();
  const pawnDate = now.toISOString();
  const expireDate = new Date(now);
  expireDate.setMonth(expireDate.getMonth() + 6);

  return {
    id,
    guestName: guest.name,
    guestType: guest.type,
    ...item,
    pawnAmount: 0,
    pawnDate,
    expireDate: expireDate.toISOString(),
    status: 'active' as const,
    monthlyInterest: 0.02,
    pawnTermMonths: 6
  };
}

export const mockInitialItems: PawnItem[] = [];
