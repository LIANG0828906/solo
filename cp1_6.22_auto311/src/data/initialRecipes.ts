import { v4 as uuidv4 } from 'uuid';
import type { Material, Recipe, AlchemySlot, GameState } from '../types';

export const CHAOS_MATERIAL_ID = 'chaos_core';

function createMaterial(
  id: string,
  name: string,
  emoji: string,
  elementType: Material['elementType'],
  discovered = false
): Material {
  return {
    id,
    name,
    emoji,
    elementType,
    discovered,
    synthesisCount: 0,
    discoveredAt: discovered ? Date.now() : undefined,
  };
}

export function buildInitialMaterials(): Record<string, Material> {
  const record: Record<string, Material> = {};

  const baseList: Array<[string, string, string, Material['elementType'], boolean]> = [
    [CHAOS_MATERIAL_ID, '混沌物质', '🔮', 'chaos', true],
    ['fire_stone', '火石', '🔥', 'fire', true],
    ['water_drop', '水滴', '💧', 'water', true],
    ['earth_chunk', '土块', '🪨', 'earth', true],
    ['air_puff', '风息', '💨', 'air', true],
    ['rose_petal', '玫瑰花瓣', '🌹', 'nature', true],
    ['iron_ore', '铁矿石', '⛏️', 'metal', true],
    ['moonlight', '月光精华', '🌙', 'spirit', true],
    ['sunbeam', '日光碎片', '☀️', 'fire', true],
  ];

  const derivedList: Array<[string, string, string, Material['elementType']]> = [
    ['steam', '蒸汽', '♨️', 'water'],
    ['lava', '熔岩', '🌋', 'fire'],
    ['dust', '尘埃', '🌫️', 'earth'],
    ['lightning', '闪电', '⚡', 'air'],
    ['flame_essence', '火焰精华', '✨', 'fire'],
    ['burning_rose', '燃烧的玫瑰', '🥀', 'fire'],
    ['dragon_breath', '龙息石', '🐉', 'fire'],
    ['frozen_tear', '冰冻之泪', '❄️', 'water'],
    ['holy_water', '圣水', '💎', 'spirit'],
    ['living_wood', '活木', '🌳', 'nature'],
    ['philosopher_stone', '贤者之石', '💠', 'chaos'],
    ['celestial_iron', '玄铁', '🗡️', 'metal'],
    ['spirit_lantern', '魂灯', '🏮', 'spirit'],
    ['rain_bow', '彩虹', '🌈', 'spirit'],
    ['volcanic_glass', '火山玻璃', '🔮', 'earth'],
  ];

  baseList.forEach(([id, name, emoji, el, disc]) => {
    record[id] = createMaterial(id, name, emoji, el, disc);
  });

  derivedList.forEach(([id, name, emoji, el]) => {
    record[id] = createMaterial(id, name, emoji, el, false);
  });

  return record;
}

export interface RecipeDefinition {
  input: [string, string];
  output: string;
  name: string;
  description: string;
}

export function buildRecipeDefinitions(): RecipeDefinition[] {
  return [
    {
      input: ['fire_stone', 'water_drop'],
      output: 'steam',
      name: '云蒸霞蔚',
      description: '火石+水滴→蒸汽',
    },
    {
      input: ['fire_stone', 'earth_chunk'],
      output: 'lava',
      name: '地心熔流',
      description: '火石+土块→熔岩',
    },
    {
      input: ['earth_chunk', 'air_puff'],
      output: 'dust',
      name: '尘世飞扬',
      description: '土块+风息→尘埃',
    },
    {
      input: ['fire_stone', 'air_puff'],
      output: 'lightning',
      name: '雷霆万钧',
      description: '火石+风息→闪电',
    },
    {
      input: ['fire_stone', 'sunbeam'],
      output: 'flame_essence',
      name: '火焰之息',
      description: '火石+日光碎片→火焰精华',
    },
    {
      input: ['rose_petal', 'flame_essence'],
      output: 'burning_rose',
      name: '不灭花火',
      description: '玫瑰花瓣+火焰精华→燃烧的玫瑰',
    },
    {
      input: ['burning_rose', 'flame_essence'],
      output: 'dragon_breath',
      name: '古龙吐息',
      description: '燃烧的玫瑰+火焰精华→龙息石',
    },
    {
      input: ['water_drop', 'moonlight'],
      output: 'frozen_tear',
      name: '寒月凝泪',
      description: '水滴+月光精华→冰冻之泪',
    },
    {
      input: ['water_drop', 'spirit_lantern'],
      output: 'holy_water',
      name: '洗礼之泉',
      description: '水滴+魂灯→圣水',
    },
    {
      input: ['earth_chunk', 'rose_petal'],
      output: 'living_wood',
      name: '生命之根',
      description: '土块+玫瑰花瓣→活木',
    },
    {
      input: ['iron_ore', 'lava'],
      output: 'celestial_iron',
      name: '天外玄铁',
      description: '铁矿石+熔岩→玄铁',
    },
    {
      input: ['moonlight', 'sunbeam'],
      output: 'spirit_lantern',
      name: '日月同辉',
      description: '月光精华+日光碎片→魂灯',
    },
    {
      input: ['frozen_tear', 'flame_essence'],
      output: 'rain_bow',
      name: '虹桥架天',
      description: '冰冻之泪+火焰精华→彩虹',
    },
    {
      input: ['lava', 'water_drop'],
      output: 'volcanic_glass',
      name: '火山之心',
      description: '熔岩+水滴→火山玻璃',
    },
    {
      input: ['rain_bow', 'philosopher_stone'],
      output: CHAOS_MATERIAL_ID,
      name: '万物归一',
      description: '彩虹+贤者之石→混沌物质',
    },
    {
      input: ['dragon_breath', 'holy_water'],
      output: 'philosopher_stone',
      name: '贤者之路',
      description: '龙息石+圣水→贤者之石',
    },
    {
      input: ['sunbeam', 'moonlight'],
      output: 'rain_bow',
      name: '曦月交辉',
      description: '日光碎片+月光精华→彩虹',
    },
    {
      input: ['steam', 'lightning'],
      output: 'rain_bow',
      name: '雷雾成桥',
      description: '蒸汽+闪电→彩虹',
    },
    {
      input: ['living_wood', 'iron_ore'],
      output: 'celestial_iron',
      name: '铁木成钢',
      description: '活木+铁矿石→玄铁',
    },
    {
      input: ['spirit_lantern', 'volcanic_glass'],
      output: 'philosopher_stone',
      name: '灵魂晶核',
      description: '魂灯+火山玻璃→贤者之石',
    },
  ];
}

export function buildInitialSlots(boardSize = 400): AlchemySlot[] {
  const centerX = boardSize / 2;
  const centerY = boardSize / 2;
  const radius = boardSize / 2 - 50;
  const slots: AlchemySlot[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    slots.push({
      index: i,
      materialId: null,
      position: {
        x: Math.cos(angle) * radius + centerX,
        y: Math.sin(angle) * radius + centerY,
      },
      isGlowing: false,
    });
  }
  return slots;
}

export function buildInitialGameState(): GameState {
  const materials = buildInitialMaterials();
  const allRecipeDefinitions = buildRecipeDefinitions();
  const slots = buildInitialSlots();
  const discoveredMaterialIds = Object.values(materials)
    .filter((m) => m.discovered)
    .map((m) => m.id);

  return {
    materials,
    recipes: {},
    allRecipeDefinitions,
    discoveredMaterialIds,
    discoveredRecipeIds: [],
    recipeHistory: [],
    slots,
    resultSlotMaterialId: null,
    isAnimating: false,
    failureRate: 0.2,
    consecutiveSuccess: 0,
    consecutiveFailure: 0,
    hasPassionBuff: false,
    selectedGraphNodeId: null,
    synthesisMessage: null,
    showFailureFlash: false,
    showBoardBreath: false,
  };
}

export function createDiscoveredRecipe(
  def: RecipeDefinition,
  isNewMaterial: boolean
): Recipe {
  return {
    id: uuidv4(),
    input: def.input,
    output: def.output,
    name: def.name,
    description: def.description,
    discoveredAt: Date.now(),
    isLocked: false,
    isNewDiscovery: isNewMaterial,
  };
}
