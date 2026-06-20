export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type DangerLevel = 'toxic' | 'corrosive' | 'flammable' | 'none';

export interface Reagent {
  id: string;
  name: string;
  formula: string;
  molarMass: number;
  density: number;
  concentration: string;
  dangerLevel: DangerLevel;
  color: string;
  colorRGBA: RGBA;
  type: 'acid' | 'base' | 'salt' | 'indicator' | 'other';
}

export type PhenomenonType = 'color_change' | 'bubbling' | 'precipitate' | 'heat';

export interface Phenomenon {
  type: PhenomenonType;
  description: string;
}

export interface Reaction {
  id: string;
  reagents: string[];
  equation: string;
  phenomena: Phenomenon[];
  heatProduced: number;
  resultColor: RGBA;
}

export interface BeakerReagent {
  reagentId: string;
  amount: number;
}

export interface RecipeStep {
  id: number;
  reagentId: string;
  amount: number;
}

export interface Recipe {
  id: string;
  name: string;
  steps: RecipeStep[];
  coverImage: string;
  tags: string[];
  createdAt: string;
  reactionTime: number;
  notes: string;
}

export interface ReactionRecord {
  id: string;
  reagents: string[];
  equation: string;
  phenomenaEmoji: string[];
  resultColor: RGBA;
  timestamp: string;
  description: string;
  beakerReagents: BeakerReagent[];
}

export const ELEMENT_COLORS: Record<string, string> = {
  H: '#ff4444',
  O: '#4488ff',
  N: '#44aa44',
  C: '#888888',
  S: '#ffaa00',
  Cl: '#44cc44',
  Na: '#aa44ff',
  Cu: '#44aaff',
  Fe: '#cc8844',
  Ag: '#999999',
  K: '#cc44cc',
  I: '#bb4444',
  Ca: '#44ccaa',
  Mg: '#66cc66',
  Zn: '#88aacc',
  Al: '#aaaacc',
};

export const DANGER_COLORS: Record<DangerLevel, { bg: string; border: string; gradient: string }> = {
  toxic: { bg: '#ff4444', border: '#ff4444', gradient: 'linear-gradient(135deg, #ff4444, #8b0000)' },
  corrosive: { bg: '#f5c542', border: '#f5c542', gradient: 'linear-gradient(135deg, #f5c542, #b8860b)' },
  flammable: { bg: '#ff8c00', border: '#ff8c00', gradient: 'linear-gradient(135deg, #ff8c00, #cc4400)' },
  none: { bg: '#88cc88', border: '#88cc88', gradient: 'linear-gradient(135deg, #88cc88, #448844)' },
};

export const REAGENT_LIST: Reagent[] = [
  {
    id: 'hcl',
    name: '盐酸',
    formula: 'HCl',
    molarMass: 36.46,
    density: 1.19,
    concentration: '37%',
    dangerLevel: 'corrosive',
    color: '#a8d8ea',
    colorRGBA: { r: 168, g: 216, b: 234, a: 0.7 },
    type: 'acid',
  },
  {
    id: 'naoh',
    name: '氢氧化钠',
    formula: 'NaOH',
    molarMass: 40.00,
    density: 2.13,
    concentration: '6mol/L',
    dangerLevel: 'corrosive',
    color: '#1a5276',
    colorRGBA: { r: 26, g: 82, b: 118, a: 0.8 },
    type: 'base',
  },
  {
    id: 'cuso4',
    name: '硫酸铜',
    formula: 'CuSO₄',
    molarMass: 159.61,
    density: 2.28,
    concentration: '1mol/L',
    dangerLevel: 'none',
    color: '#48c9b0',
    colorRGBA: { r: 72, g: 201, b: 176, a: 0.75 },
    type: 'salt',
  },
  {
    id: 'phenolphthalein',
    name: '酚酞指示剂',
    formula: 'C₂₀H₁₄O₄',
    molarMass: 318.33,
    density: 1.00,
    concentration: '0.5%',
    dangerLevel: 'none',
    color: 'rgba(255,255,255,0.15)',
    colorRGBA: { r: 255, g: 255, b: 255, a: 0.15 },
    type: 'indicator',
  },
  {
    id: 'fecl3',
    name: '氯化铁',
    formula: 'FeCl₃',
    molarMass: 162.20,
    density: 2.90,
    concentration: '1mol/L',
    dangerLevel: 'corrosive',
    color: '#c0783c',
    colorRGBA: { r: 192, g: 120, b: 60, a: 0.8 },
    type: 'salt',
  },
  {
    id: 'na2co3',
    name: '碳酸钠',
    formula: 'Na₂CO₃',
    molarMass: 105.99,
    density: 2.54,
    concentration: '1mol/L',
    dangerLevel: 'none',
    color: '#d5dbdb',
    colorRGBA: { r: 213, g: 219, b: 219, a: 0.6 },
    type: 'salt',
  },
  {
    id: 'agno3',
    name: '硝酸银',
    formula: 'AgNO₃',
    molarMass: 169.87,
    density: 4.35,
    concentration: '0.1mol/L',
    dangerLevel: 'corrosive',
    color: '#aab7b8',
    colorRGBA: { r: 170, g: 183, b: 184, a: 0.7 },
    type: 'salt',
  },
  {
    id: 'ki',
    name: '碘化钾',
    formula: 'KI',
    molarMass: 166.00,
    density: 3.13,
    concentration: '0.1mol/L',
    dangerLevel: 'none',
    color: '#f0e6c8',
    colorRGBA: { r: 240, g: 230, b: 200, a: 0.55 },
    type: 'salt',
  },
];

export const REACTION_DATABASE: Reaction[] = [
  {
    id: 'hcl-naoh',
    reagents: ['hcl', 'naoh'],
    equation: 'HCl + NaOH → NaCl + H₂O',
    phenomena: [{ type: 'heat', description: '溶液温度升高' }, { type: 'color_change', description: '溶液变为无色透明' }],
    heatProduced: 45,
    resultColor: { r: 220, g: 230, b: 240, a: 0.3 },
  },
  {
    id: 'hcl-na2co3',
    reagents: ['hcl', 'na2co3'],
    equation: '2HCl + Na₂CO₃ → 2NaCl + H₂O + CO₂↑',
    phenomena: [{ type: 'bubbling', description: '产生大量气泡' }, { type: 'color_change', description: '溶液变无色' }],
    heatProduced: 10,
    resultColor: { r: 230, g: 240, b: 250, a: 0.2 },
  },
  {
    id: 'naoh-cuso4',
    reagents: ['naoh', 'cuso4'],
    equation: '2NaOH + CuSO₄ → Cu(OH)₂↓ + Na₂SO₄',
    phenomena: [{ type: 'precipitate', description: '生成蓝色沉淀' }, { type: 'color_change', description: '溶液变为蓝色絮状' }],
    heatProduced: 15,
    resultColor: { r: 60, g: 140, b: 220, a: 0.85 },
  },
  {
    id: 'naoh-fecl3',
    reagents: ['naoh', 'fecl3'],
    equation: '3NaOH + FeCl₃ → Fe(OH)₃↓ + 3NaCl',
    phenomena: [{ type: 'precipitate', description: '生成红棕色沉淀' }, { type: 'color_change', description: '溶液变为红棕色' }],
    heatProduced: 12,
    resultColor: { r: 180, g: 80, b: 30, a: 0.85 },
  },
  {
    id: 'agno3-hcl',
    reagents: ['agno3', 'hcl'],
    equation: 'AgNO₃ + HCl → AgCl↓ + HNO₃',
    phenomena: [{ type: 'precipitate', description: '生成白色沉淀' }, { type: 'color_change', description: '出现白色浑浊' }],
    heatProduced: 5,
    resultColor: { r: 240, g: 240, b: 245, a: 0.7 },
  },
  {
    id: 'agno3-ki',
    reagents: ['agno3', 'ki'],
    equation: 'AgNO₃ + KI → AgI↓ + KNO₃',
    phenomena: [{ type: 'precipitate', description: '生成黄色沉淀' }, { type: 'color_change', description: '出现黄色浑浊' }],
    heatProduced: 5,
    resultColor: { r: 240, g: 220, b: 60, a: 0.75 },
  },
  {
    id: 'naoh-phenolphthalein',
    reagents: ['naoh', 'phenolphthalein'],
    equation: 'NaOH + 酚酞 → 变玫瑰红',
    phenomena: [{ type: 'color_change', description: '溶液变为玫瑰红色' }],
    heatProduced: 0,
    resultColor: { r: 220, g: 50, b: 120, a: 0.65 },
  },
  {
    id: 'hcl-phenolphthalein',
    reagents: ['hcl', 'phenolphthalein'],
    equation: 'HCl + 酚酞 → 无色（酸性环境）',
    phenomena: [{ type: 'color_change', description: '溶液保持无色' }],
    heatProduced: 0,
    resultColor: { r: 250, g: 250, b: 255, a: 0.15 },
  },
  {
    id: 'fecl3-naoh-excess',
    reagents: ['fecl3', 'naoh'],
    equation: '3NaOH + FeCl₃ → Fe(OH)₃↓ + 3NaCl',
    phenomena: [{ type: 'precipitate', description: '生成红棕色沉淀' }],
    heatProduced: 12,
    resultColor: { r: 180, g: 80, b: 30, a: 0.85 },
  },
  {
    id: 'cuso4-naoh',
    reagents: ['cuso4', 'naoh'],
    equation: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
    phenomena: [{ type: 'precipitate', description: '生成蓝色沉淀' }, { type: 'color_change', description: '出现蓝色絮状沉淀' }],
    heatProduced: 15,
    resultColor: { r: 60, g: 140, b: 220, a: 0.85 },
  },
];

export function parseEquationTokens(equation: string): Array<{ text: string; color?: string }> {
  const tokens: Array<{ text: string; color?: string }> = [];
  let i = 0;
  while (i < equation.length) {
    if (equation[i] === ' ' || equation[i] === '+' || equation[i] === '→' || equation[i] === '↑' || equation[i] === '↓') {
      tokens.push({ text: equation[i] });
      i++;
    } else if (equation[i] === '₂' || equation[i] === '₃' || equation[i] === '₄') {
      tokens.push({ text: equation[i] });
      i++;
    } else {
      let matched = false;
      for (const symbol of Object.keys(ELEMENT_COLORS).sort((a, b) => b.length - a.length)) {
        if (equation.substring(i, i + symbol.length) === symbol) {
          tokens.push({ text: symbol, color: ELEMENT_COLORS[symbol] });
          i += symbol.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        if (equation.substring(i, i + 3) === '(OH') {
          tokens.push({ text: '(OH', color: ELEMENT_COLORS['O'] });
          i += 3;
        } else if (equation[i] === ')') {
          tokens.push({ text: ')' });
          i++;
        } else if (equation[i] === 'H' && equation[i + 1] === '₂') {
          tokens.push({ text: 'H', color: ELEMENT_COLORS['H'] });
          tokens.push({ text: '₂' });
          i += 2;
        } else if (equation[i] === 'C' && equation[i + 1] === 'O') {
          tokens.push({ text: 'C', color: ELEMENT_COLORS['C'] });
          tokens.push({ text: 'O', color: ELEMENT_COLORS['O'] });
          i += 2;
        } else if (equation[i] === '酚' || equation[i] === '酞' || equation[i] === '变' || equation[i] === '无' || equation[i] === '色' || equation[i] === '酸' || equation[i] === '性' || equation[i] === '环' || equation[i] === '境' || equation[i] === '玫' || equation[i] === '瑰' || equation[i] === '红') {
          tokens.push({ text: equation[i], color: '#1e2a38' });
          i++;
        } else {
          tokens.push({ text: equation[i] });
          i++;
        }
      }
    }
  }
  return tokens;
}

export function mixColors(colors: RGBA[]): RGBA {
  if (colors.length === 0) return { r: 220, g: 235, b: 245, a: 0.2 };
  if (colors.length === 1) return { ...colors[0] };
  let r = 0, g = 0, b = 0, a = 0;
  for (const c of colors) {
    r += c.r * c.a;
    g += c.g * c.a;
    b += c.b * c.a;
    a += c.a;
  }
  a = Math.min(1, a / colors.length * 1.2);
  if (a > 0) {
    r = Math.round(r / (a || 1));
    g = Math.round(g / (a || 1));
    b = Math.round(b / (a || 1));
  }
  return { r: Math.min(255, r), g: Math.min(255, g), b: Math.min(255, b), a: Math.min(1, a) };
}

export function rgbaToString(c: RGBA): string {
  return `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${c.a.toFixed(2)})`;
}
