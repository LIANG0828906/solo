export type TieKnotType = 'bundle' | 'stitch' | 'fold';

export type DyeColor = 'indigo' | 'madder' | 'gardenia';

export interface DyeRecipe {
  primary: DyeColor;
  secondary?: DyeColor;
  mixRatio?: number;
}

export interface DyeParams {
  soakTime: number;
  dyeRound: number;
  knotType: TieKnotType;
  recipe: DyeRecipe;
}

export interface PatternLayer {
  id: string;
  pixels: Uint8ClampedArray;
  opacity: number;
}

export type FabricState = 'idle' | 'tying' | 'dyeing' | 'draining' | 'drying' | 'done';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface DriedFabric {
  id: string;
  imageData: ImageData;
  sealChar: string;
  position: number;
}

export const DYE_COLORS: Record<DyeColor, RGB> = {
  indigo: { r: 26, g: 82, b: 118 },
  madder: { r: 169, g: 50, b: 38 },
  gardenia: { r: 244, g: 208, b: 63 },
};

export const TIE_KNOT_INFO: Record<TieKnotType, { name: string; pattern: string }> = {
  bundle: { name: '捆扎', pattern: '云纹' },
  stitch: { name: '缝扎', pattern: '鱼鳞' },
  fold: { name: '折叠扎', pattern: '螺旋' },
};

export const SEAL_CHARS = ['云', '鱼', '花', '染', '韵', '纹', '彩', '锦', '绣', '织'];
