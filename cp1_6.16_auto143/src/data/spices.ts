import type { Culture } from '../types';

export const cultures: Culture[] = [
  {
    id: 'india',
    name: '印度',
    nameEn: 'India',
    lat: 20.5937,
    lng: 78.9629,
    color: '#FF9933',
    spices: [
      {
        id: 'turmeric',
        name: '姜黄',
        nameEn: 'Turmeric',
        color: '#FFC107',
        flavor: { spicy: 30, aromatic: 60, warm: 80, pungent: 40, sweet: 20 },
        description: '温暖的泥土芳香，带轻微苦味和柑橘调',
        typicalRatio: '1-2茶匙/菜'
      },
      {
        id: 'cumin-india',
        name: '孜然',
        nameEn: 'Cumin',
        color: '#8D6E63',
        flavor: { spicy: 50, aromatic: 70, warm: 75, pungent: 45, sweet: 15 },
        description: '浓烈的泥土香气，带坚果和温暖气息',
        typicalRatio: '1-3茶匙/菜'
      },
      {
        id: 'coriander-india',
        name: '芫荽籽',
        nameEn: 'Coriander Seeds',
        color: '#A1887F',
        flavor: { spicy: 20, aromatic: 80, warm: 50, pungent: 25, sweet: 45 },
        description: '清新的柑橘花香，带柔和的坚果底味',
        typicalRatio: '1-2茶匙/菜'
      },
      {
        id: 'cardamom',
        name: '小豆蔻',
        nameEn: 'Cardamom',
        color: '#66BB6A',
        flavor: { spicy: 35, aromatic: 95, warm: 60, pungent: 30, sweet: 55 },
        description: '浓郁的花香与柠檬草香气，甜而温暖',
        typicalRatio: '3-5颗/菜'
      },
      {
        id: 'fenugreek',
        name: '葫芦巴',
        nameEn: 'Fenugreek',
        color: '#FFB74D',
        flavor: { spicy: 25, aromatic: 65, warm: 55, pungent: 35, sweet: 30 },
        description: '微苦的枫糖浆香气，带芹菜气息',
        typicalRatio: '1/2茶匙/菜'
      },
      {
        id: 'mustard-seeds',
        name: '芥末籽',
        nameEn: 'Mustard Seeds',
        color: '#FFF176',
        flavor: { spicy: 70, aromatic: 50, warm: 40, pungent: 85, sweet: 10 },
        description: '爆裂时释放刺激的芥子气香气',
        typicalRatio: '1茶匙/菜'
      }
    ]
  },
  {
    id: 'mexico',
    name: '墨西哥',
    nameEn: 'Mexico',
    lat: 23.6345,
    lng: -102.5528,
    color: '#CE1126',
    spices: [
      {
        id: 'chili-powder',
        name: '辣椒粉',
        nameEn: 'Chili Powder',
        color: '#E53935',
        flavor: { spicy: 95, aromatic: 50, warm: 85, pungent: 70, sweet: 20 },
        description: '强烈的辣感，带烟熏和泥土气息',
        typicalRatio: '1-2汤匙/菜'
      },
      {
        id: 'cumin-mexico',
        name: '孜然',
        nameEn: 'Cumin',
        color: '#8D6E63',
        flavor: { spicy: 50, aromatic: 70, warm: 75, pungent: 45, sweet: 15 },
        description: '浓烈的泥土香气，带坚果和温暖气息',
        typicalRatio: '1-2茶匙/菜'
      },
      {
        id: 'oregano',
        name: '墨西哥牛至',
        nameEn: 'Mexican Oregano',
        color: '#4CAF50',
        flavor: { spicy: 30, aromatic: 85, warm: 45, pungent: 40, sweet: 20 },
        description: '比地中海牛至更浓烈，带柑橘和甘草气息',
        typicalRatio: '1茶匙/菜'
      },
      {
        id: 'cinnamon-mexico',
        name: '锡兰肉桂',
        nameEn: 'Ceylon Cinnamon',
        color: '#A1887F',
        flavor: { spicy: 25, aromatic: 90, warm: 80, pungent: 20, sweet: 70 },
        description: '柔和甜美的香气，带花香和柑橘调',
        typicalRatio: '1-2根/菜'
      },
      {
        id: 'coriander-mexico',
        name: '芫荽籽',
        nameEn: 'Coriander Seeds',
        color: '#A1887F',
        flavor: { spicy: 20, aromatic: 80, warm: 50, pungent: 25, sweet: 45 },
        description: '清新的柑橘花香，带柔和的坚果底味',
        typicalRatio: '1茶匙/菜'
      }
    ]
  },
  {
    id: 'china',
    name: '中国',
    nameEn: 'China',
    lat: 35.8617,
    lng: 104.1954,
    color: '#DE2910',
    spices: [
      {
        id: 'star-anise',
        name: '八角',
        nameEn: 'Star Anise',
        color: '#795548',
        flavor: { spicy: 20, aromatic: 95, warm: 70, pungent: 35, sweet: 60 },
        description: '浓郁的甘草甜香，带温暖的木质气息',
        typicalRatio: '2-3颗/菜'
      },
      {
        id: 'sichuan-pepper',
        name: '花椒',
        nameEn: 'Sichuan Pepper',
        color: '#8D6E63',
        flavor: { spicy: 60, aromatic: 85, warm: 75, pungent: 90, sweet: 15 },
        description: '独特的麻感，带柠檬和柑橘香气',
        typicalRatio: '1-2茶匙/菜'
      },
      {
        id: 'cassia',
        name: '桂皮',
        nameEn: 'Cassia Cinnamon',
        color: '#6D4C41',
        flavor: { spicy: 40, aromatic: 85, warm: 90, pungent: 50, sweet: 65 },
        description: '比肉桂更浓烈，带辛辣和甜香',
        typicalRatio: '1-2小块/菜'
      },
      {
        id: 'clove',
        name: '丁香',
        nameEn: 'Cloves',
        color: '#5D4037',
        flavor: { spicy: 55, aromatic: 95, warm: 80, pungent: 70, sweet: 45 },
        description: '强烈的温暖辛香，带苦涩甜底味',
        typicalRatio: '3-5颗/菜'
      },
      {
        id: 'fennel-seed',
        name: '茴香',
        nameEn: 'Fennel Seeds',
        color: '#81C784',
        flavor: { spicy: 15, aromatic: 75, warm: 45, pungent: 20, sweet: 55 },
        description: '甜润的甘草和茴香香气，带清新感',
        typicalRatio: '1茶匙/菜'
      },
      {
        id: 'ginger',
        name: '干姜',
        nameEn: 'Dried Ginger',
        color: '#FFB74D',
        flavor: { spicy: 70, aromatic: 70, warm: 90, pungent: 60, sweet: 30 },
        description: '温暖的辛香，带柠檬和泥土气息',
        typicalRatio: '1/2-1茶匙/菜'
      }
    ]
  },
  {
    id: 'morocco',
    name: '摩洛哥',
    nameEn: 'Morocco',
    lat: 31.6295,
    lng: -7.9811,
    color: '#006233',
    spices: [
      {
        id: 'ras-el-hanout-component1',
        name: '肉豆蔻',
        nameEn: 'Nutmeg',
        color: '#A1887F',
        flavor: { spicy: 30, aromatic: 90, warm: 75, pungent: 35, sweet: 60 },
        description: '温暖甜美的木质香气，带坚果和花香',
        typicalRatio: '1/4茶匙/菜'
      },
      {
        id: 'ginger-morocco',
        name: '干姜',
        nameEn: 'Dried Ginger',
        color: '#FFB74D',
        flavor: { spicy: 70, aromatic: 70, warm: 90, pungent: 60, sweet: 30 },
        description: '温暖的辛香，带柠檬和泥土气息',
        typicalRatio: '1/2茶匙/菜'
      },
      {
        id: 'turmeric-morocco',
        name: '姜黄',
        nameEn: 'Turmeric',
        color: '#FFC107',
        flavor: { spicy: 30, aromatic: 60, warm: 80, pungent: 40, sweet: 20 },
        description: '温暖的泥土芳香，带轻微苦味和柑橘调',
        typicalRatio: '1茶匙/菜'
      },
      {
        id: 'cinnamon-morocco',
        name: '肉桂',
        nameEn: 'Cinnamon',
        color: '#8D6E63',
        flavor: { spicy: 35, aromatic: 88, warm: 85, pungent: 30, sweet: 72 },
        description: '温暖甜美的香料皇后，带木质和花香',
        typicalRatio: '1-2根/菜'
      },
      {
        id: 'cardamom-morocco',
        name: '小豆蔻',
        nameEn: 'Cardamom',
        color: '#66BB6A',
        flavor: { spicy: 35, aromatic: 95, warm: 60, pungent: 30, sweet: 55 },
        description: '浓郁的花香与柠檬草香气，甜而温暖',
        typicalRatio: '4-6颗/菜'
      },
      {
        id: 'cumin-morocco',
        name: '孜然',
        nameEn: 'Cumin',
        color: '#8D6E63',
        flavor: { spicy: 50, aromatic: 70, warm: 75, pungent: 45, sweet: 15 },
        description: '浓烈的泥土香气，带坚果和温暖气息',
        typicalRatio: '1-2茶匙/菜'
      }
    ]
  },
  {
    id: 'thailand',
    name: '泰国',
    nameEn: 'Thailand',
    lat: 15.8700,
    lng: 100.9925,
    color: '#A51931',
    spices: [
      {
        id: 'galangal',
        name: '南姜',
        nameEn: 'Galangal',
        color: '#FFAB91',
        flavor: { spicy: 65, aromatic: 80, warm: 70, pungent: 55, sweet: 25 },
        description: '比生姜更辛辣，带柑橘和松脂香气',
        typicalRatio: '2-3片/菜'
      },
      {
        id: 'lemongrass',
        name: '香茅',
        nameEn: 'Lemongrass',
        color: '#AED581',
        flavor: { spicy: 15, aromatic: 95, warm: 40, pungent: 25, sweet: 35 },
        description: '明亮的柠檬香气，带草本清新感',
        typicalRatio: '1-2茎/菜'
      },
      {
        id: 'kaffir-lime-leaf',
        name: '卡菲尔酸橙叶',
        nameEn: 'Kaffir Lime Leaf',
        color: '#689F38',
        flavor: { spicy: 10, aromatic: 95, warm: 20, pungent: 30, sweet: 20 },
        description: '极其浓郁的柑橘花香，清新独特',
        typicalRatio: '3-5片/菜'
      },
      {
        id: 'thai-chili',
        name: '鸟眼辣椒',
        nameEn: 'Bird\'s Eye Chili',
        color: '#F44336',
        flavor: { spicy: 100, aromatic: 40, warm: 95, pungent: 80, sweet: 5 },
        description: '小巧但极辣，带清新的辣椒香气',
        typicalRatio: '2-5个/菜'
      },
      {
        id: 'coriander-thai',
        name: '芫荽籽',
        nameEn: 'Coriander Seeds',
        color: '#A1887F',
        flavor: { spicy: 20, aromatic: 80, warm: 50, pungent: 25, sweet: 45 },
        description: '清新的柑橘花香，带柔和的坚果底味',
        typicalRatio: '1茶匙/菜'
      }
    ]
  },
  {
    id: 'italy',
    name: '意大利',
    nameEn: 'Italy',
    lat: 41.8719,
    lng: 12.5674,
    color: '#009246',
    spices: [
      {
        id: 'basil',
        name: '罗勒',
        nameEn: 'Basil',
        color: '#4CAF50',
        flavor: { spicy: 10, aromatic: 90, warm: 20, pungent: 15, sweet: 40 },
        description: '甜美的丁香和甘草香气，带草本清新',
        typicalRatio: '1小束/菜'
      },
      {
        id: 'oregano-italy',
        name: '牛至',
        nameEn: 'Oregano',
        color: '#689F38',
        flavor: { spicy: 25, aromatic: 80, warm: 40, pungent: 30, sweet: 15 },
        description: '温暖的草本香气，带微苦和泥土气息',
        typicalRatio: '1茶匙/菜'
      },
      {
        id: 'rosemary',
        name: '迷迭香',
        nameEn: 'Rosemary',
        color: '#388E3C',
        flavor: { spicy: 20, aromatic: 95, warm: 55, pungent: 50, sweet: 20 },
        description: '松木般的清新香气，带樟脑气息',
        typicalRatio: '2-3枝/菜'
      },
      {
        id: 'thyme',
        name: '百里香',
        nameEn: 'Thyme',
        color: '#7CB342',
        flavor: { spicy: 15, aromatic: 85, warm: 45, pungent: 35, sweet: 25 },
        description: '温和的草本香气，带花香和泥土气息',
        typicalRatio: '3-4枝/菜'
      },
      {
        id: 'sage',
        name: '鼠尾草',
        nameEn: 'Sage',
        color: '#9CCC65',
        flavor: { spicy: 25, aromatic: 80, warm: 50, pungent: 40, sweet: 20 },
        description: '温暖的松木和樟脑香气，带轻微苦味',
        typicalRatio: '8-10片/菜'
      }
    ]
  },
  {
    id: 'ethiopia',
    name: '埃塞俄比亚',
    nameEn: 'Ethiopia',
    lat: 9.1450,
    lng: 40.4897,
    color: '#0DA01A',
    spices: [
      {
        id: 'berbere-component1',
        name: '红辣椒',
        nameEn: 'Red Chili Pepper',
        color: '#E53935',
        flavor: { spicy: 90, aromatic: 45, warm: 80, pungent: 65, sweet: 15 },
        description: '明亮的辣感，带新鲜辣椒的果香',
        typicalRatio: '2-3汤匙/菜'
      },
      {
        id: 'fenugreek-ethiopia',
        name: '葫芦巴',
        nameEn: 'Fenugreek',
        color: '#FFB74D',
        flavor: { spicy: 25, aromatic: 65, warm: 55, pungent: 35, sweet: 30 },
        description: '微苦的枫糖浆香气，带芹菜气息',
        typicalRatio: '1茶匙/菜'
      },
      {
        id: 'cardamom-ethiopia',
        name: '小豆蔻',
        nameEn: 'Cardamom',
        color: '#66BB6A',
        flavor: { spicy: 35, aromatic: 95, warm: 60, pungent: 30, sweet: 55 },
        description: '浓郁的花香与柠檬草香气，甜而温暖',
        typicalRatio: '5-7颗/菜'
      },
      {
        id: 'clove-ethiopia',
        name: '丁香',
        nameEn: 'Cloves',
        color: '#5D4037',
        flavor: { spicy: 55, aromatic: 95, warm: 80, pungent: 70, sweet: 45 },
        description: '强烈的温暖辛香，带苦涩甜底味',
        typicalRatio: '3-4颗/菜'
      },
      {
        id: 'cumin-ethiopia',
        name: '孜然',
        nameEn: 'Cumin',
        color: '#8D6E63',
        flavor: { spicy: 50, aromatic: 70, warm: 75, pungent: 45, sweet: 15 },
        description: '浓烈的泥土香气，带坚果和温暖气息',
        typicalRatio: '1茶匙/菜'
      },
      {
        id: 'nigella',
        name: '黑种草籽',
        nameEn: 'Nigella Seeds',
        color: '#37474F',
        flavor: { spicy: 35, aromatic: 75, warm: 50, pungent: 45, sweet: 15 },
        description: '辛辣的坚果香气，带轻微的洋葱气息',
        typicalRatio: '1/2茶匙/菜'
      }
    ]
  },
  {
    id: 'japan',
    name: '日本',
    nameEn: 'Japan',
    lat: 36.2048,
    lng: 138.2529,
    color: '#BC002D',
    spices: [
      {
        id: 'sansho',
        name: '山椒',
        nameEn: 'Japanese Pepper',
        color: '#689F38',
        flavor: { spicy: 50, aromatic: 90, warm: 55, pungent: 80, sweet: 20 },
        description: '清新的柑橘麻感，带柠檬和香叶香气',
        typicalRatio: '1/2茶匙/菜'
      },
      {
        id: 'wasabi',
        name: '山葵',
        nameEn: 'Wasabi',
        color: '#8BC34A',
        flavor: { spicy: 85, aromatic: 75, warm: 30, pungent: 95, sweet: 5 },
        description: '强烈的刺激感，迅速消散，带青草香气',
        typicalRatio: '1-2茶匙/菜'
      },
      {
        id: 'shiso',
        name: '紫苏',
        nameEn: 'Shiso',
        color: '#7B1FA2',
        flavor: { spicy: 25, aromatic: 80, warm: 30, pungent: 35, sweet: 30 },
        description: '独特的薄荷肉桂香气，带香草和甘草味',
        typicalRatio: '5-10片/菜'
      },
      {
        id: 'yuzu',
        name: '柚子皮',
        nameEn: 'Yuzu Peel',
        color: '#FFEB3B',
        flavor: { spicy: 10, aromatic: 95, warm: 20, pungent: 25, sweet: 45 },
        description: '浓郁的柑橘香气，混合柚子、柠檬和橙花',
        typicalRatio: '1茶匙皮屑/菜'
      },
      {
        id: 'togarashi',
        name: '七味唐辛子',
        nameEn: 'Shichimi Togarashi',
        color: '#D32F2F',
        flavor: { spicy: 75, aromatic: 65, warm: 70, pungent: 55, sweet: 20 },
        description: '混合辣感、芝麻香和柑橘调的复合香料',
        typicalRatio: '少许撒用'
      }
    ]
  }
];
