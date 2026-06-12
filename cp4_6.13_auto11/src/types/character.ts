export type Race = 'human' | 'elf' | 'orc';

export type CharacterClass = 'warrior' | 'mage' | 'rogue';

export type ColorPart = 'skin' | 'clothes' | 'hair' | 'weapon' | 'accessory';

export interface CharacterColors {
  skin: string;
  clothes: string;
  hair: string;
  weapon: string;
  accessory: string;
}

export interface CharacterState {
  race: Race;
  characterClass: CharacterClass;
  colors: CharacterColors;
}

export type RenderLayer = 'body' | 'clothes' | 'weapon' | 'hair' | 'accessory';

export interface LayerVisibility {
  body: number;
  clothes: number;
  weapon: number;
  hair: number;
  accessory: number;
}

export interface PixelTemplate {
  width: number;
  height: number;
  data: number[][];
}

export interface RaceTemplates {
  body: PixelTemplate;
  hair: PixelTemplate[];
  defaultHairIndex: number;
}

export interface ClassTemplates {
  clothes: PixelTemplate;
  weapon: PixelTemplate;
  accessory: PixelTemplate;
}

export interface WorkerExportRequest {
  type: 'export';
  imageData: ImageData;
  targetSize: number;
}

export interface WorkerExportResponse {
  type: 'export-complete';
  blob?: Blob;
  error?: string;
}

export const RACE_OPTIONS: { value: Race; label: string; emoji: string }[] = [
  { value: 'human', label: '人类', emoji: '🧑' },
  { value: 'elf', label: '精灵', emoji: '🧝' },
  { value: 'orc', label: '兽人', emoji: '👹' },
];

export const CLASS_OPTIONS: { value: CharacterClass; label: string; emoji: string }[] = [
  { value: 'warrior', label: '战士', emoji: '⚔️' },
  { value: 'mage', label: '法师', emoji: '🔮' },
  { value: 'rogue', label: '盗贼', emoji: '🗡️' },
];

export const COLOR_PART_LABELS: Record<ColorPart, string> = {
  skin: '皮肤',
  clothes: '衣服',
  hair: '头发',
  weapon: '武器',
  accessory: '装饰',
};

export const PRESET_COLORS: string[] = [
  '#f5d0c5', '#e8b89d', '#c68863', '#8d5524',
  '#ff6b6b', '#e94560', '#ffa502', '#ffd93d',
  '#6bcb77', '#4d96ff', '#0f3460', '#9b59b6',
];

export const DEFAULT_COLORS: Record<Race, CharacterColors> = {
  human: {
    skin: '#f5d0c5',
    clothes: '#4d96ff',
    hair: '#8d5524',
    weapon: '#c0c0c0',
    accessory: '#ffd93d',
  },
  elf: {
    skin: '#e8d5f0',
    clothes: '#6bcb77',
    hair: '#ffd93d',
    weapon: '#a0d2db',
    accessory: '#9b59b6',
  },
  orc: {
    skin: '#6bcb77',
    clothes: '#8b4513',
    hair: '#2c1810',
    weapon: '#696969',
    accessory: '#e94560',
  },
};
