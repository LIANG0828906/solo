import type { Item, Area, InteractionPoint, CombinationRule, Slot } from '../types';

const AREAS: Area[] = [
  {
    id: 'study',
    name: '书房',
    unlocked: true,
    bgIllustration: 'study',
    interactionPoints: ['desk', 'bookshelf', 'fireplace'],
  },
  {
    id: 'laboratory',
    name: '实验室',
    unlocked: false,
    bgIllustration: 'laboratory',
    interactionPoints: ['experiment-table', 'microscope', 'cabinet'],
  },
  {
    id: 'attic',
    name: '阁楼',
    unlocked: false,
    bgIllustration: 'attic',
    interactionPoints: ['old-chest', 'dusty-painting', 'broken-clock'],
  },
  {
    id: 'secret-room',
    name: '密室',
    unlocked: false,
    bgIllustration: 'secret-room',
    interactionPoints: ['final-puzzle', 'stone-tablet', 'ancient-door'],
  },
];

const INTERACTION_POINTS: InteractionPoint[] = [
  { id: 'desk', label: '书桌', posX: 30, posY: 55, explored: false, areaId: 'study', items: ['rusty-key'] },
  { id: 'bookshelf', label: '书架', posX: 70, posY: 35, explored: false, areaId: 'study', items: ['old-photo'] },
  { id: 'fireplace', label: '壁炉', posX: 50, posY: 65, explored: false, areaId: 'study', items: ['cipher-box'] },
  { id: 'experiment-table', label: '实验台', posX: 40, posY: 45, explored: false, areaId: 'laboratory', items: ['blue-potion'] },
  { id: 'microscope', label: '显微镜', posX: 65, posY: 35, explored: false, areaId: 'laboratory', items: ['formula-note'] },
  { id: 'cabinet', label: '储物柜', posX: 25, posY: 55, explored: false, areaId: 'laboratory', items: ['empty-flask'] },
  { id: 'old-chest', label: '旧箱子', posX: 35, posY: 50, explored: false, areaId: 'attic', items: ['brass-gear'] },
  { id: 'dusty-painting', label: '蒙尘画作', posX: 60, posY: 30, explored: false, areaId: 'attic', items: ['map-fragment'] },
  { id: 'broken-clock', label: '破旧时钟', posX: 75, posY: 55, explored: false, areaId: 'attic', items: ['silver-key'] },
  { id: 'final-puzzle', label: '终极谜题', posX: 50, posY: 40, explored: false, areaId: 'secret-room', items: ['ancient-seal'] },
  { id: 'stone-tablet', label: '石碑', posX: 30, posY: 60, explored: false, areaId: 'secret-room', items: ['rune-stone'] },
  { id: 'ancient-door', label: '古老大门', posX: 70, posY: 50, explored: false, areaId: 'secret-room', items: ['door-handle'] },
];

const ITEMS: Item[] = [
  {
    id: 'rusty-key', name: '生锈的钥匙', description: '一把锈迹斑斑的旧钥匙，似乎能打开某个盒子',
    hint: '也许可以和密码盒组合？', iconEmoji: '🗝️',
    picked: false, pickedBy: null, areaId: 'study', interactionPointId: 'desk',
    combinableWith: ['cipher-box'], combinationResult: 'open-cipher-box',
  },
  {
    id: 'old-photo', name: '旧照片', description: '一张泛黄的照片，背面写着"1847"',
    hint: '照片上的数字也许暗含玄机', iconEmoji: '📷',
    picked: false, pickedBy: null, areaId: 'study', interactionPointId: 'bookshelf',
    combinableWith: [], combinationResult: null,
  },
  {
    id: 'cipher-box', name: '密码盒', description: '一个精致的密码盒，需要钥匙才能打开',
    hint: '找一把钥匙来打开它', iconEmoji: '📦',
    picked: false, pickedBy: null, areaId: 'study', interactionPointId: 'fireplace',
    combinableWith: ['rusty-key'], combinationResult: 'open-cipher-box',
  },
  {
    id: 'open-cipher-box', name: '打开的密码盒', description: '密码盒被打开了，里面有一张纸条写着"磷与铜的配方"',
    hint: '这个配方也许是实验室的线索', iconEmoji: '📋',
    picked: false, pickedBy: null, areaId: 'study', interactionPointId: 'fireplace',
    combinableWith: [], combinationResult: null,
  },
  {
    id: 'blue-potion', name: '蓝色药剂', description: '一瓶发出幽蓝光芒的药剂',
    hint: '需要容器来调配', iconEmoji: '🧪',
    picked: false, pickedBy: null, areaId: 'laboratory', interactionPointId: 'experiment-table',
    combinableWith: ['empty-flask'], combinationResult: 'mixed-potion',
  },
  {
    id: 'formula-note', name: '配方纸条', description: '写着神秘配方的纸条，提到"时间与机械的力量"',
    hint: '也许和阁楼的什么东西有关', iconEmoji: '📝',
    picked: false, pickedBy: null, areaId: 'laboratory', interactionPointId: 'microscope',
    combinableWith: ['map-fragment'], combinationResult: 'escape-code',
  },
  {
    id: 'empty-flask', name: '空烧瓶', description: '一个干净的玻璃烧瓶，可以用来调配药剂',
    hint: '把药剂倒进来试试', iconEmoji: '🫙',
    picked: false, pickedBy: null, areaId: 'laboratory', interactionPointId: 'cabinet',
    combinableWith: ['blue-potion'], combinationResult: 'mixed-potion',
  },
  {
    id: 'mixed-potion', name: '混合药剂', description: '蓝色药剂与烧瓶融合后产生的神奇液体，散发着微光',
    hint: '药剂散发的光芒似乎指向了上方', iconEmoji: '✨',
    picked: false, pickedBy: null, areaId: 'laboratory', interactionPointId: 'experiment-table',
    combinableWith: [], combinationResult: null,
  },
  {
    id: 'brass-gear', name: '铜齿轮', description: '一个精密的铜制齿轮，上面刻着古老的纹路',
    hint: '这个齿轮也许能和什么装置组合', iconEmoji: '⚙️',
    picked: false, pickedBy: null, areaId: 'attic', interactionPointId: 'old-chest',
    combinableWith: ['silver-key'], combinationResult: 'clockwork-key',
  },
  {
    id: 'map-fragment', name: '地图碎片', description: '一张残缺的地图碎片，描绘着密室的通道',
    hint: '碎片上还有配方相关的标记', iconEmoji: '🗺️',
    picked: false, pickedBy: null, areaId: 'attic', interactionPointId: 'dusty-painting',
    combinableWith: ['formula-note'], combinationResult: 'escape-code',
  },
  {
    id: 'silver-key', name: '银钥匙', description: '一把闪着银光的钥匙，上面有齿轮状的装饰',
    hint: '和铜齿轮似乎是配套的', iconEmoji: '🔑',
    picked: false, pickedBy: null, areaId: 'attic', interactionPointId: 'broken-clock',
    combinableWith: ['brass-gear'], combinationResult: 'clockwork-key',
  },
  {
    id: 'clockwork-key', name: '发条钥匙', description: '银钥匙与铜齿轮完美结合后的机械钥匙，散发着古老的魔力',
    hint: '这把钥匙似乎能打开最深处的大门', iconEmoji: '🔩',
    picked: false, pickedBy: null, areaId: 'attic', interactionPointId: 'broken-clock',
    combinableWith: [], combinationResult: null,
  },
  {
    id: 'ancient-seal', name: '古老封印', description: '密室中央的石台上的封印记号',
    hint: '需要特定的物品来解除封印', iconEmoji: '🔱',
    picked: false, pickedBy: null, areaId: 'secret-room', interactionPointId: 'final-puzzle',
    combinableWith: ['rune-stone'], combinationResult: 'broken-seal',
  },
  {
    id: 'rune-stone', name: '符文石', description: '一块刻满古代符文的石头，散发着神秘力量',
    hint: '与封印似乎有共鸣', iconEmoji: '🪨',
    picked: false, pickedBy: null, areaId: 'secret-room', interactionPointId: 'stone-tablet',
    combinableWith: ['ancient-seal'], combinationResult: 'broken-seal',
  },
  {
    id: 'door-handle', name: '门把手', description: '一个沉重的金属门把手',
    hint: '需要发条钥匙才能启动', iconEmoji: '🚪',
    picked: false, pickedBy: null, areaId: 'secret-room', interactionPointId: 'ancient-door',
    combinableWith: ['clockwork-key'], combinationResult: 'open-door',
  },
  {
    id: 'broken-seal', name: '破碎的封印', description: '封印被解除了，密室深处传来古老的力量波动',
    hint: '大门即将开启……', iconEmoji: '💫',
    picked: false, pickedBy: null, areaId: 'secret-room', interactionPointId: 'final-puzzle',
    combinableWith: [], combinationResult: null,
  },
  {
    id: 'open-door', name: '开启的大门', description: '大门缓缓打开了！外面是自由的天空！',
    hint: '恭喜你找到了出路！', iconEmoji: '🌟',
    picked: false, pickedBy: null, areaId: 'secret-room', interactionPointId: 'ancient-door',
    combinableWith: [], combinationResult: null,
  },
  {
    id: 'escape-code', name: '逃脱密码', description: '配方纸条和地图碎片组合揭示了最终的逃脱密码！',
    hint: '通往自由的线索已经出现', iconEmoji: '🔐',
    picked: false, pickedBy: null, areaId: 'attic', interactionPointId: 'dusty-painting',
    combinableWith: [], combinationResult: null,
  },
];

const COMBINATION_RULES: CombinationRule[] = [
  {
    itemA: 'rusty-key', itemB: 'cipher-box',
    resultItemId: 'open-cipher-box', resultItemName: '打开的密码盒',
    resultItemDescription: '密码盒被打开了，里面有一张纸条写着"磷与铜的配方"',
    resultItemHint: '这个配方也许是实验室的线索', resultItemIconEmoji: '📋',
    unlockAreaId: 'laboratory', revealMessage: '密码盒打开了！一张纸条上写着神秘的配方，实验室的门似乎被激活了……',
  },
  {
    itemA: 'blue-potion', itemB: 'empty-flask',
    resultItemId: 'mixed-potion', resultItemName: '混合药剂',
    resultItemDescription: '蓝色药剂与烧瓶融合后产生的神奇液体，散发着微光',
    resultItemHint: '药剂散发的光芒似乎指向了上方', resultItemIconEmoji: '✨',
    unlockAreaId: 'attic', revealMessage: '药剂混合后散发出神奇的光芒，阁楼的门被照亮了……',
  },
  {
    itemA: 'silver-key', itemB: 'brass-gear',
    resultItemId: 'clockwork-key', resultItemName: '发条钥匙',
    resultItemDescription: '银钥匙与铜齿轮完美结合后的机械钥匙，散发着古老的魔力',
    resultItemHint: '这把钥匙似乎能打开最深处的大门', resultItemIconEmoji: '🔩',
    unlockAreaId: 'secret-room', revealMessage: '齿轮与钥匙完美融合，一柄发条钥匙诞生了！密室的大门正在颤抖……',
  },
  {
    itemA: 'formula-note', itemB: 'map-fragment',
    resultItemId: 'escape-code', resultItemName: '逃脱密码',
    resultItemDescription: '配方纸条和地图碎片组合揭示了最终的逃脱密码！',
    resultItemHint: '通往自由的线索已经出现', resultItemIconEmoji: '🔐',
    unlockAreaId: null, revealMessage: '配方和地图拼合在一起，逃脱密码浮现了！',
  },
  {
    itemA: 'ancient-seal', itemB: 'rune-stone',
    resultItemId: 'broken-seal', resultItemName: '破碎的封印',
    resultItemDescription: '封印被解除了，密室深处传来古老的力量波动',
    resultItemHint: '大门即将开启……', resultItemIconEmoji: '💫',
    unlockAreaId: null, revealMessage: '封印破碎了！密室中回荡着古老的回声……',
  },
  {
    itemA: 'door-handle', itemB: 'clockwork-key',
    resultItemId: 'open-door', resultItemName: '开启的大门',
    resultItemDescription: '大门缓缓打开了！外面是自由的天空！',
    resultItemHint: '恭喜你找到了出路！', resultItemIconEmoji: '🌟',
    unlockAreaId: null, revealMessage: '🏆 恭喜！大门打开了，你们成功逃脱了密室！',
  },
];

export function getInitialAreas(): Area[] {
  return JSON.parse(JSON.stringify(AREAS));
}

export function getInitialInteractionPoints(): InteractionPoint[] {
  return JSON.parse(JSON.stringify(INTERACTION_POINTS));
}

export function getInitialItems(): Item[] {
  return JSON.parse(JSON.stringify(ITEMS));
}

export function getInitialSlots(): Slot[] {
  return Array.from({ length: 8 }, (_, i) => ({
    index: i,
    itemId: null,
    placedBy: null,
  }));
}

export function findCombinationRule(itemIdA: string, itemIdB: string): CombinationRule | null {
  return COMBINATION_RULES.find(
    (r) =>
      (r.itemA === itemIdA && r.itemB === itemIdB) ||
      (r.itemA === itemIdB && r.itemB === itemIdA)
  ) ?? null;
}

export function checkAdjacentCombination(slots: Slot[]): { slotA: number; slotB: number; rule: CombinationRule } | null {
  for (let i = 0; i < slots.length - 1; i++) {
    const a = slots[i];
    const b = slots[i + 1];
    if (!a.itemId || !b.itemId) continue;
    const rule = findCombinationRule(a.itemId, b.itemId);
    if (rule) {
      return { slotA: i, slotB: i + 1, rule };
    }
  }
  return null;
}

export function applyCombination(
  items: Item[],
  slots: Slot[],
  areas: Area[],
  slotA: number,
  slotB: number,
  rule: CombinationRule
): { items: Item[]; slots: Slot[]; areas: Area[]; gameComplete: boolean } {
  const newItems = items.map((item) => ({
    ...item,
    picked: item.id === rule.itemA || item.id === rule.itemB ? false : item.picked,
    pickedBy: item.id === rule.itemA || item.id === rule.itemB ? null : item.pickedBy,
  }));

  const resultItem: Item = {
    id: rule.resultItemId,
    name: rule.resultItemName,
    description: rule.resultItemDescription,
    hint: rule.resultItemHint,
    iconEmoji: rule.resultItemIconEmoji,
    picked: true,
    pickedBy: null,
    areaId: areas.find((a) => a.interactionPoints.includes(slots[slotA].itemId?.replace(/-.*/, '') ?? ''))?.id ?? 'study',
    interactionPointId: '',
    combinableWith: [],
    combinationResult: null,
  };
  newItems.push(resultItem);

  const newSlots = slots.map((s, i) => {
    if (i === slotA || i === slotB) {
      return { ...s, itemId: null, placedBy: null };
    }
    return { ...s };
  });

  const newAreas = areas.map((a) => {
    if (a.id === rule.unlockAreaId) {
      return { ...a, unlocked: true };
    }
    return { ...a };
  });

  const gameComplete = rule.resultItemId === 'open-door';

  return { items: newItems, slots: newSlots, areas: newAreas, gameComplete };
}
