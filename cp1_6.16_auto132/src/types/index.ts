export type CultureRegion =
  | '东方'
  | '西方'
  | '北欧'
  | '希腊'
  | '埃及'
  | '印度'
  | '东亚'
  | '中美洲'
  | '非洲';

export type GeneType = '形态' | '颜色' | '能力' | '属性';

export type MorphologyGene =
  | '翅膀'
  | '鳞片'
  | '触须'
  | '犄角'
  | '尾巴'
  | '爪子'
  | '毛皮'
  | '甲壳'
  | '触手'
  | '尖刺';

export interface GeneFragment {
  id: string;
  name: string;
  type: GeneType;
  value: string | MorphologyGene;
  color: string;
  creatureId: string;
  creatureName: string;
}

export interface Abilities {
  strength: number;
  agility: number;
  wisdom: number;
  mystery: number;
  charm: number;
  longevity: number;
}

export interface Creature {
  id: string;
  name: string;
  region: CultureRegion;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  genes: GeneFragment[];
  abilities: Abilities;
  morphology: MorphologyGene[];
}

export type FusionSlotContent = GeneFragment | null;

export interface FusionResult {
  id: string;
  timestamp: number;
  name: string;
  description: string;
  abilities: Abilities;
  parentGenes: [GeneFragment, GeneFragment];
  parentCreatures: [string, string];
  morphology: MorphologyGene[];
  colorPalette: string[];
}

export interface CreatureStore {
  creatures: Creature[];
  loading: boolean;
  slotA: FusionSlotContent;
  slotB: FusionSlotContent;
  fusionResult: FusionResult | null;
  fusionProgress: number;
  history: FusionResult[];
  selectedCreature: Creature | null;
  selectedHistory: FusionResult | null;
  loadCreatures: () => Promise<void>;
  setSlot: (slot: 'A' | 'B', content: FusionSlotContent) => void;
  triggerFusion: () => Promise<void>;
  deleteFromHistory: (id: string) => void;
  clearHistory: () => void;
  selectCreature: (c: Creature | null) => void;
  selectHistory: (r: FusionResult | null) => void;
}
