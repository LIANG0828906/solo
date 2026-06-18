export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  tempMin: number;
  tempMax: number;
  color: string;
  description: string;
}

export interface IngredientInfo {
  id: string;
  name: string;
  color: string;
  particleColor: string;
}

export const INGREDIENTS: IngredientInfo[] = [
  { id: 'fire_stone', name: '火焰石', color: '#FF4500', particleColor: '#FF6347' },
  { id: 'frost_grass', name: '冰霜草', color: '#00BFFF', particleColor: '#87CEEB' },
  { id: 'glow_dew', name: '夜光露', color: '#FFD700', particleColor: '#FFEC8B' },
  { id: 'thunder_wood', name: '雷纹木', color: '#9370DB', particleColor: '#BA55D3' },
];

export const recipes: Recipe[] = [
  { id: 'r01', name: '烬火灵液', ingredients: ['fire_stone'], tempMin: -20, tempMax: 20, color: '#FF6B35', description: '微弱余火凝成的灵液，温热入喉' },
  { id: 'r02', name: '烈焰酿造', ingredients: ['fire_stone'], tempMin: 20, tempMax: 60, color: '#FF4500', description: '炽热火焰凝聚的浓烈酿造' },
  { id: 'r03', name: '地狱火精', ingredients: ['fire_stone'], tempMin: 60, tempMax: 120, color: '#CC0000', description: '源自深渊的灼热精华' },
  { id: 'r04', name: '霜露之息', ingredients: ['frost_grass'], tempMin: -20, tempMax: 20, color: '#87CEEB', description: '极寒之地的纯净霜露' },
  { id: 'r05', name: '融冰甘露', ingredients: ['frost_grass'], tempMin: 20, tempMax: 60, color: '#4FC3F7', description: '冰消雪融时凝取的甘露' },
  { id: 'r06', name: '蒸汽精华', ingredients: ['frost_grass'], tempMin: 60, tempMax: 120, color: '#B0C4DE', description: '高温蒸腾后的精纯水汽' },
  { id: 'r07', name: '月华灵滴', ingredients: ['glow_dew'], tempMin: -20, tempMax: 20, color: '#C5E1A5', description: '月光凝结而成的灵妙水滴' },
  { id: 'r08', name: '星辉凝液', ingredients: ['glow_dew'], tempMin: 20, tempMax: 60, color: '#FFD54F', description: '星光沉淀后形成的金色凝液' },
  { id: 'r09', name: '日炎灵液', ingredients: ['glow_dew'], tempMin: 60, tempMax: 120, color: '#FFB300', description: '日光灼烧后浓缩的烈性灵液' },
  { id: 'r10', name: '静电树液', ingredients: ['thunder_wood'], tempMin: -20, tempMax: 20, color: '#9575CD', description: '低温下雷纹木渗出的带电树液' },
  { id: 'r11', name: '雷鸣甘露', ingredients: ['thunder_wood'], tempMin: 20, tempMax: 60, color: '#7E57C2', description: '温暖中雷纹木释放的轰鸣甘露' },
  { id: 'r12', name: '闪电酿造', ingredients: ['thunder_wood'], tempMin: 60, tempMax: 120, color: '#6200EA', description: '高温激发出的闪电精华' },
  { id: 'r13', name: '蒸汽迷雾', ingredients: ['fire_stone', 'frost_grass'], tempMin: -20, tempMax: 20, color: '#A8D8EA', description: '冰火交融产生的缥缈迷雾' },
  { id: 'r14', name: '热震药剂', ingredients: ['fire_stone', 'frost_grass'], tempMin: 20, tempMax: 60, color: '#E88D67', description: '冷热骤变产生的震荡药力' },
  { id: 'r15', name: '沸腾之波', ingredients: ['fire_stone', 'frost_grass'], tempMin: 60, tempMax: 120, color: '#FF7043', description: '滚烫蒸汽凝成的冲击之波' },
  { id: 'r16', name: '凤凰之泪', ingredients: ['fire_stone', 'glow_dew'], tempMin: -20, tempMax: 20, color: '#FF8A65', description: '传说中凤凰落下的温热泪珠' },
  { id: 'r17', name: '耀斑灵液', ingredients: ['fire_stone', 'glow_dew'], tempMin: 20, tempMax: 60, color: '#FF6D00', description: '如太阳耀斑般灼目的灵液' },
  { id: 'r18', name: '超新星精华', ingredients: ['fire_stone', 'glow_dew'], tempMin: 60, tempMax: 120, color: '#DD2C00', description: '星辰爆裂时释放的终极精华' },
  { id: 'r19', name: '等离子霜', ingredients: ['fire_stone', 'thunder_wood'], tempMin: -20, tempMax: 20, color: '#CE93D8', description: '雷电与火焰在极寒中的奇异产物' },
  { id: 'r20', name: '风暴之火', ingredients: ['fire_stone', 'thunder_wood'], tempMin: 20, tempMax: 60, color: '#AB47BC', description: '雷暴中燃烧的不灭之火' },
  { id: 'r21', name: '雷霆烈焰', ingredients: ['fire_stone', 'thunder_wood'], tempMin: 60, tempMax: 120, color: '#8E24AA', description: '雷霆与烈焰融合的毁灭之力' },
  { id: 'r22', name: '极光精华', ingredients: ['frost_grass', 'glow_dew'], tempMin: -20, tempMax: 20, color: '#80DEEA', description: '冰原上空极光凝成的精华' },
  { id: 'r23', name: '暮光药剂', ingredients: ['frost_grass', 'glow_dew'], tempMin: 20, tempMax: 60, color: '#4DD0E1', description: '日暮时分冰与光交织的药剂' },
  { id: 'r24', name: '晶辉灵液', ingredients: ['frost_grass', 'glow_dew'], tempMin: 60, tempMax: 120, color: '#00ACC1', description: '冰晶在强光下融化的璀璨灵液' },
  { id: 'r25', name: '暴风雪充能', ingredients: ['frost_grass', 'thunder_wood'], tempMin: -20, tempMax: 20, color: '#7986CB', description: '雷暴与暴风雪融合的充能药剂' },
  { id: 'r26', name: '冰雷之息', ingredients: ['frost_grass', 'thunder_wood'], tempMin: 20, tempMax: 60, color: '#5C6BC0', description: '冰冷雷电凝成的凛冽气息' },
  { id: 'r27', name: '碎裂风暴', ingredients: ['frost_grass', 'thunder_wood'], tempMin: 60, tempMax: 120, color: '#3949AB', description: '冰雷在高温下爆裂形成的风暴' },
  { id: 'r28', name: '霓虹霜液', ingredients: ['glow_dew', 'thunder_wood'], tempMin: -20, tempMax: 20, color: '#B39DDB', description: '电光在冰晶中折射的霓虹之液' },
  { id: 'r29', name: '火花甘露', ingredients: ['glow_dew', 'thunder_wood'], tempMin: 20, tempMax: 60, color: '#9C27B0', description: '电火花与光露交融的甘甜之饮' },
  { id: 'r30', name: '伏特光辉', ingredients: ['glow_dew', 'thunder_wood'], tempMin: 60, tempMax: 120, color: '#7B1FA2', description: '高压电弧激发的耀眼光辉' },
  { id: 'r31', name: '棱镜之冰', ingredients: ['fire_stone', 'frost_grass', 'glow_dew'], tempMin: -20, tempMax: 20, color: '#80CBC4', description: '三色交融在极寒中形成的棱镜冰晶' },
  { id: 'r32', name: '空灵之焰', ingredients: ['fire_stone', 'frost_grass', 'glow_dew'], tempMin: 20, tempMax: 60, color: '#FF8A80', description: '虚空中飘忽不定的空灵火焰' },
  { id: 'r33', name: '彩焰地狱火', ingredients: ['fire_stone', 'frost_grass', 'glow_dew'], tempMin: 60, tempMax: 120, color: '#FF5252', description: '地狱深处燃烧的万彩之焰' },
  { id: 'r34', name: '风暴严寒', ingredients: ['fire_stone', 'frost_grass', 'thunder_wood'], tempMin: -20, tempMax: 20, color: '#82B1FF', description: '雷火冰三重力量引发的极寒风暴' },
  { id: 'r35', name: '元素冲突', ingredients: ['fire_stone', 'frost_grass', 'thunder_wood'], tempMin: 20, tempMax: 60, color: '#536DFE', description: '三大元素剧烈碰撞产生的不稳定药剂' },
  { id: 'r36', name: '漩涡核心', ingredients: ['fire_stone', 'frost_grass', 'thunder_wood'], tempMin: 60, tempMax: 120, color: '#304FFE', description: '元素漩涡中心凝缩的极致核心' },
  { id: 'r37', name: '虚空火花', ingredients: ['fire_stone', 'glow_dew', 'thunder_wood'], tempMin: -20, tempMax: 20, color: '#EA80FC', description: '来自虚空裂缝中闪烁的奇异火花' },
  { id: 'r38', name: '天界之火', ingredients: ['fire_stone', 'glow_dew', 'thunder_wood'], tempMin: 20, tempMax: 60, color: '#D500F9', description: '天界降临的神圣之火' },
  { id: 'r39', name: '新星爆发', ingredients: ['fire_stone', 'glow_dew', 'thunder_wood'], tempMin: 60, tempMax: 120, color: '#AA00FF', description: '星辰诞生时爆发的璀璨能量' },
  { id: 'r40', name: '冬星灵液', ingredients: ['frost_grass', 'glow_dew', 'thunder_wood'], tempMin: -20, tempMax: 20, color: '#84FFFF', description: '冬夜星光照耀下凝成的灵液' },
  { id: 'r41', name: '风暴之光', ingredients: ['frost_grass', 'glow_dew', 'thunder_wood'], tempMin: 20, tempMax: 60, color: '#18FFFF', description: '雷暴中穿透云层的光芒' },
  { id: 'r42', name: '雷霆水晶', ingredients: ['frost_grass', 'glow_dew', 'thunder_wood'], tempMin: 60, tempMax: 120, color: '#00E5FF', description: '雷电被封入冰晶形成的雷霆水晶' },
  { id: 'r43', name: '创世之霜', ingredients: ['fire_stone', 'frost_grass', 'glow_dew', 'thunder_wood'], tempMin: -20, tempMax: 20, color: '#E0F7FA', description: '传说中创世之初的原始之霜' },
  { id: 'r44', name: '贤者药剂', ingredients: ['fire_stone', 'frost_grass', 'glow_dew', 'thunder_wood'], tempMin: 20, tempMax: 60, color: '#FFD700', description: '贤者之石溶化的传说级药剂' },
  { id: 'r45', name: '混沌灵液', ingredients: ['fire_stone', 'frost_grass', 'glow_dew', 'thunder_wood'], tempMin: 60, tempMax: 120, color: '#FF1744', description: '四元素在极端高温下产生的混沌之力' },
  { id: 'r46', name: '平衡之滴', ingredients: ['fire_stone', 'frost_grass'], tempMin: -2, tempMax: 2, color: '#A7FFEB', description: '冰火在绝对零度附近达成的完美平衡' },
  { id: 'r47', name: '全知酿造', ingredients: ['fire_stone', 'frost_grass', 'glow_dew', 'thunder_wood'], tempMin: 45, tempMax: 55, color: '#F5F5F5', description: '四元素在精确温控下揭示的终极智慧' },
  { id: 'r48', name: '龙息灵液', ingredients: ['fire_stone', 'glow_dew', 'thunder_wood'], tempMin: 95, tempMax: 105, color: '#FF3D00', description: '传说中巨龙吐息凝聚的灼热灵液' },
];

export function matchRecipe(ingredientIds: string[], temperature: number): Recipe | null {
  const sorted = [...ingredientIds].sort();
  const candidates = recipes.filter(r => {
    const rSorted = [...r.ingredients].sort();
    if (rSorted.length !== sorted.length) return false;
    if (!rSorted.every((v, i) => v === sorted[i])) return false;
    if (temperature < r.tempMin || temperature > r.tempMax) return false;
    return true;
  });
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (a.tempMax - a.tempMin) - (b.tempMax - b.tempMin));
  return candidates[0];
}
