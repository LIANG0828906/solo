export enum ElementType {
  Fire = 'fire',
  Ice = 'ice',
  Lightning = 'lightning',
  Shadow = 'shadow',
}

export const ELEMENT_COLORS: Record<ElementType, string> = {
  [ElementType.Fire]: '#ff4500',
  [ElementType.Ice]: '#00bfff',
  [ElementType.Lightning]: '#ffd700',
  [ElementType.Shadow]: '#9932cc',
};

export const ELEMENT_NAMES: Record<ElementType, string> = {
  [ElementType.Fire]: '火焰',
  [ElementType.Ice]: '冰霜',
  [ElementType.Lightning]: '闪电',
  [ElementType.Shadow]: '暗影',
};

export interface NodeData {
  id: number;
  x: number;
  y: number;
  element: ElementType | null;
  isCharging: boolean;
  isActivated: boolean;
}

export enum ComboSpellType {
  CrossBurst = 'cross_burst',
  IceFireDual = 'ice_fire_dual',
  ShadowVortex = 'shadow_vortex',
}

export const COMBO_SPELL_NAMES: Record<ComboSpellType, string> = {
  [ComboSpellType.CrossBurst]: '十字星爆',
  [ComboSpellType.IceFireDual]: '冰火双龙',
  [ComboSpellType.ShadowVortex]: '暗影漩涡',
};

export const COMBO_SPELL_COLORS: Record<ComboSpellType, string> = {
  [ComboSpellType.CrossBurst]: '#ffd700',
  [ComboSpellType.IceFireDual]: '#ff6699',
  [ComboSpellType.ShadowVortex]: '#8b00ff',
};

export const COMBO_PATTERNS: Record<ComboSpellType, ElementType[]> = {
  [ComboSpellType.CrossBurst]: [
    ElementType.Fire,
    ElementType.Ice,
    ElementType.Lightning,
    ElementType.Shadow,
  ],
  [ComboSpellType.IceFireDual]: [
    ElementType.Ice,
    ElementType.Fire,
    ElementType.Ice,
    ElementType.Fire,
  ],
  [ComboSpellType.ShadowVortex]: [
    ElementType.Shadow,
    ElementType.Shadow,
    ElementType.Lightning,
    ElementType.Lightning,
  ],
};

export interface ComboSpell {
  type: ComboSpellType;
  nodeIndices: number[];
  baseDamage: number;
}

export interface GameState {
  chargeLevel: number;
  spellCastCount: number;
  elementInventory: Record<ElementType, number>;
  activeCombo: ComboSpellType | null;
}

export interface EnemyTarget {
  id: number;
  x: number;
  y: number;
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  value: number;
  createdAt: number;
}

export interface Particle {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  createdAt: number;
}

export interface ShockwaveState {
  active: boolean;
  color: string;
  startedAt: number;
}

export interface ColorShakeState {
  active: boolean;
  color: string;
  startedAt: number;
}
