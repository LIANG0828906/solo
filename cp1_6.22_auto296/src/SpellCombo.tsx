import { NodeData, ComboSpell, COMBO_PATTERNS, ComboSpellType } from './types';

export interface ComboResult {
  comboSpell: ComboSpell | null;
  activatedNodeIndices: number[];
}

export const detectComboSpell = (nodes: NodeData[]): ComboResult => {
  const sortedNodes = [...nodes].sort((a, b) => a.id - b.id);
  const elements = sortedNodes.map((n) => n.element);

  for (const comboType of Object.values(ComboSpellType)) {
    const pattern = COMBO_PATTERNS[comboType];
    const patternLength = pattern.length;

    for (let startIdx = 0; startIdx <= elements.length - patternLength; startIdx++) {
      let match = true;
      const matchedIndices: number[] = [];

      for (let p = 0; p < patternLength; p++) {
        const elem = elements[startIdx + p];
        if (elem !== pattern[p]) {
          match = false;
          break;
        }
        matchedIndices.push(startIdx + p);
      }

      if (match) {
        return {
          comboSpell: {
            type: comboType,
            nodeIndices: matchedIndices,
            baseDamage: getBaseDamage(comboType),
          },
          activatedNodeIndices: matchedIndices,
        };
      }
    }
  }

  return {
    comboSpell: null,
    activatedNodeIndices: [],
  };
};

const getBaseDamage = (comboType: ComboSpellType): number => {
  switch (comboType) {
    case ComboSpellType.CrossBurst:
      return 80;
    case ComboSpellType.IceFireDual:
      return 60;
    case ComboSpellType.ShadowVortex:
      return 70;
    default:
      return 50;
  }
};

export const calculateDamage = (baseDamage: number, chargeLevel: number): number => {
  return Math.floor(baseDamage + chargeLevel * baseDamage * 0.5);
};
