import type { PetTemplate, Skill, ElementType } from './types';

export const SKILLS: Record<string, Skill> = {
  tackle: {
    id: 'tackle',
    name: '撞击',
    element: 'normal',
    power: 35,
    accuracy: 100,
    description: '用身体撞击对手，造成普通伤害。',
  },
  ember: {
    id: 'ember',
    name: '火花',
    element: 'fire',
    power: 40,
    accuracy: 100,
    description: '喷出小火焰攻击对手，有几率造成灼伤。',
  },
  flamethrower: {
    id: 'flamethrower',
    name: '火焰喷射',
    element: 'fire',
    power: 65,
    accuracy: 95,
    description: '喷射强力火焰攻击对手。',
  },
  watergun: {
    id: 'watergun',
    name: '水枪',
    element: 'water',
    power: 40,
    accuracy: 100,
    description: '喷出水流攻击对手。',
  },
  hydroPump: {
    id: 'hydroPump',
    name: '水炮',
    element: 'water',
    power: 70,
    accuracy: 85,
    description: '发射高压水柱造成巨大伤害。',
  },
  vineWhip: {
    id: 'vineWhip',
    name: '藤鞭',
    element: 'grass',
    power: 40,
    accuracy: 100,
    description: '用藤蔓抽打对手。',
  },
  solarBeam: {
    id: 'solarBeam',
    name: '阳光烈焰',
    element: 'grass',
    power: 75,
    accuracy: 90,
    description: '聚集阳光能量发射强力光束。',
  },
  quickAttack: {
    id: 'quickAttack',
    name: '电光一闪',
    element: 'normal',
    power: 30,
    accuracy: 100,
    description: '以极快速度攻击对手，必定先制。',
  },
};

const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#e74c3c',
  water: '#3498db',
  grass: '#27ae60',
  normal: '#95a5a6',
};

function createSpriteData(baseColor: string, accentColor: string, shape: string): number[][] {
  const pixels: number[][] = [];
  const colors = ['transparent', baseColor, accentColor, '#ffffff', '#000000'];
  
  for (let i = 0; i < 16; i++) {
    pixels[i] = [];
    for (let j = 0; j < 16; j++) {
      pixels[i][j] = 0;
    }
  }
  
  if (shape === 'blob') {
    for (let y = 4; y < 12; y++) {
      for (let x = 3; x < 13; x++) {
        const dist = Math.sqrt(Math.pow(x - 8, 2) + Math.pow(y - 8, 2));
        if (dist < 5) {
          pixels[y][x] = 1;
        }
      }
    }
    pixels[6][6] = 4;
    pixels[6][10] = 4;
    pixels[7][6] = 3;
    pixels[7][10] = 3;
    pixels[10][7] = 4;
    pixels[10][8] = 4;
    pixels[10][9] = 4;
    for (let y = 2; y < 5; y++) {
      for (let x = 6; x < 10; x++) {
        const dist = Math.sqrt(Math.pow(x - 8, 2) + Math.pow(y - 3.5, 2));
        if (dist < 2.5) {
          pixels[y][x] = 2;
        }
      }
    }
  } else if (shape === 'serpent') {
    for (let y = 5; y < 11; y++) {
      for (let x = 4; x < 12; x++) {
        const dist = Math.sqrt(Math.pow(x - 8, 2) + Math.pow(y - 8, 2));
        if (dist < 4.5) {
          pixels[y][x] = 1;
        }
      }
    }
    for (let y = 2; y < 6; y++) {
      for (let x = 6; x < 10; x++) {
        const dist = Math.sqrt(Math.pow(x - 8, 2) + Math.pow(y - 3.5, 2));
        if (dist < 2.5) {
          pixels[y][x] = 2;
        }
      }
    }
    pixels[4][7] = 4;
    pixels[4][9] = 4;
    pixels[5][7] = 3;
    pixels[5][9] = 3;
    pixels[9][6] = 4;
    pixels[9][10] = 4;
    for (let y = 10; y < 14; y++) {
      if (y % 2 === 0) {
        pixels[y][5] = 1;
        pixels[y][11] = 1;
      } else {
        pixels[y][6] = 1;
        pixels[y][10] = 1;
      }
    }
  } else if (shape === 'dino') {
    for (let y = 4; y < 12; y++) {
      for (let x = 4; x < 12; x++) {
        if (x >= 5 && x <= 10 && y >= 5 && y <= 10) {
          pixels[y][x] = 1;
        }
      }
    }
    for (let y = 2; y < 6; y++) {
      for (let x = 5; x < 11; x++) {
        const dist = Math.sqrt(Math.pow(x - 8, 2) + Math.pow(y - 4, 2));
        if (dist < 3) {
          pixels[y][x] = 1;
        }
      }
    }
    pixels[3][6] = 4;
    pixels[3][9] = 4;
    pixels[4][6] = 3;
    pixels[4][9] = 3;
    pixels[6][10] = 4;
    pixels[7][11] = 4;
    pixels[8][10] = 4;
    for (let i = 3; i < 8; i++) {
      pixels[i][7] = 2;
      pixels[i][8] = 2;
    }
    pixels[12][5] = 1;
    pixels[12][6] = 1;
    pixels[12][9] = 1;
    pixels[12][10] = 1;
    pixels[13][5] = 1;
    pixels[13][6] = 1;
    pixels[13][9] = 1;
    pixels[13][10] = 1;
  } else if (shape === 'turtle') {
    for (let y = 5; y < 12; y++) {
      for (let x = 3; x < 13; x++) {
        const dist = Math.sqrt(Math.pow(x - 8, 2) + Math.pow(y - 8.5, 2));
        if (dist < 5) {
          pixels[y][x] = 2;
        }
      }
    }
    for (let y = 6; y < 11; y++) {
      for (let x = 5; x < 11; x++) {
        const dist = Math.sqrt(Math.pow(x - 8, 2) + Math.pow(y - 8.5, 2));
        if (dist < 3.5) {
          pixels[y][x] = 1;
        }
      }
    }
    for (let y = 3; y < 7; y++) {
      for (let x = 6; x < 10; x++) {
        const dist = Math.sqrt(Math.pow(x - 8, 2) + Math.pow(y - 5, 2));
        if (dist < 2.5) {
          pixels[y][x] = 1;
        }
      }
    }
    pixels[4][7] = 4;
    pixels[4][9] = 4;
    pixels[5][7] = 3;
    pixels[5][9] = 3;
    pixels[12][4] = 1;
    pixels[12][5] = 1;
    pixels[12][10] = 1;
    pixels[12][11] = 1;
    pixels[13][4] = 1;
    pixels[13][5] = 1;
    pixels[13][10] = 1;
    pixels[13][11] = 1;
    pixels[7][8] = 2;
    pixels[8][7] = 2;
    pixels[8][9] = 2;
    pixels[9][8] = 2;
  } else if (shape === 'flower') {
    for (let y = 6; y < 13; y++) {
      for (let x = 5; x < 11; x++) {
        const dist = Math.sqrt(Math.pow(x - 8, 2) + Math.pow(y - 9, 2));
        if (dist < 4) {
          pixels[y][x] = 1;
        }
      }
    }
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const px = Math.floor(8 + Math.cos(angle) * 3.5);
      const py = Math.floor(5 + Math.sin(angle) * 2.5);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx >= 0 && nx < 16 && ny >= 0 && ny < 16) {
            if (Math.sqrt(dx * dx + dy * dy) <= 1.5) {
              pixels[ny][nx] = 2;
            }
          }
        }
      }
    }
    pixels[5][7] = 1;
    pixels[5][8] = 1;
    pixels[4][8] = 4;
    pixels[8][6] = 4;
    pixels[8][10] = 4;
    pixels[9][6] = 3;
    pixels[9][10] = 3;
    pixels[11][7] = 4;
    pixels[11][9] = 4;
  } else if (shape === 'mouse') {
    for (let y = 5; y < 12; y++) {
      for (let x = 4; x < 12; x++) {
        const dist = Math.sqrt(Math.pow(x - 8, 2) + Math.pow(y - 8.5, 2));
        if (dist < 4.5) {
          pixels[y][x] = 1;
        }
      }
    }
    pixels[3][5] = 2;
    pixels[3][6] = 2;
    pixels[4][5] = 2;
    pixels[4][6] = 2;
    pixels[3][10] = 2;
    pixels[3][11] = 2;
    pixels[4][10] = 2;
    pixels[4][11] = 2;
    pixels[6][6] = 4;
    pixels[6][9] = 4;
    pixels[7][6] = 3;
    pixels[7][9] = 3;
    pixels[9][7] = 4;
    pixels[9][8] = 4;
    pixels[9][9] = 4;
    pixels[10][7] = 2;
    pixels[10][9] = 2;
    for (let x = 11; x < 15; x++) {
      pixels[8][x] = 2;
    }
    pixels[12][5] = 1;
    pixels[12][6] = 1;
    pixels[12][9] = 1;
    pixels[12][10] = 1;
  }
  
  return pixels.map(row => row.map(idx => colors[idx] || 'transparent'));
}

export const PET_TEMPLATES: Record<string, PetTemplate> = {
  flamey: {
    id: 'flamey',
    name: '小焰兽',
    element: 'fire',
    baseStats: { hp: 45, maxHp: 45, attack: 49, defense: 49, speed: 45 },
    skills: ['tackle', 'ember'],
    evolution: {
      to: 'infernome',
      condition: { level: 10 },
    },
    color: ELEMENT_COLORS.fire,
    spriteData: createSpriteData(ELEMENT_COLORS.fire, '#ff6b35', 'blob'),
  },
  infernome: {
    id: 'infernome',
    name: '烈焰兽',
    element: 'fire',
    baseStats: { hp: 78, maxHp: 78, attack: 84, defense: 78, speed: 70 },
    skills: ['tackle', 'ember', 'flamethrower', 'quickAttack'],
    color: ELEMENT_COLORS.fire,
    spriteData: createSpriteData('#c0392b', '#e74c3c', 'dino'),
  },
  bubbly: {
    id: 'bubbly',
    name: '泡泡龟',
    element: 'water',
    baseStats: { hp: 50, maxHp: 50, attack: 42, defense: 55, speed: 40 },
    skills: ['tackle', 'watergun'],
    evolution: {
      to: 'aquatortoise',
      condition: { level: 10 },
    },
    color: ELEMENT_COLORS.water,
    spriteData: createSpriteData(ELEMENT_COLORS.water, '#2980b9', 'turtle'),
  },
  aquatortoise: {
    id: 'aquatortoise',
    name: '海霸龟',
    element: 'water',
    baseStats: { hp: 90, maxHp: 90, attack: 70, defense: 100, speed: 55 },
    skills: ['tackle', 'watergun', 'hydroPump', 'quickAttack'],
    color: ELEMENT_COLORS.water,
    spriteData: createSpriteData('#1a5276', '#2980b9', 'turtle'),
  },
  leafy: {
    id: 'leafy',
    name: '草叶精',
    element: 'grass',
    baseStats: { hp: 48, maxHp: 48, attack: 45, defense: 49, speed: 45 },
    skills: ['tackle', 'vineWhip'],
    evolution: {
      to: 'floraking',
      condition: { level: 10 },
    },
    color: ELEMENT_COLORS.grass,
    spriteData: createSpriteData(ELEMENT_COLORS.grass, '#2ecc71', 'flower'),
  },
  floraking: {
    id: 'floraking',
    name: '花王兽',
    element: 'grass',
    baseStats: { hp: 85, maxHp: 85, attack: 80, defense: 82, speed: 68 },
    skills: ['tackle', 'vineWhip', 'solarBeam', 'quickAttack'],
    color: ELEMENT_COLORS.grass,
    spriteData: createSpriteData('#1e8449', '#27ae60', 'flower'),
  },
  rattie: {
    id: 'rattie',
    name: '电光鼠',
    element: 'normal',
    baseStats: { hp: 35, maxHp: 35, attack: 38, defense: 35, speed: 58 },
    skills: ['tackle', 'quickAttack'],
    color: ELEMENT_COLORS.normal,
    spriteData: createSpriteData(ELEMENT_COLORS.normal, '#7f8c8d', 'mouse'),
  },
  snakeling: {
    id: 'snakeling',
    name: '小绿蛇',
    element: 'grass',
    baseStats: { hp: 40, maxHp: 40, attack: 48, defense: 40, speed: 50 },
    skills: ['tackle', 'vineWhip'],
    color: ELEMENT_COLORS.grass,
    spriteData: createSpriteData('#2ecc71', '#27ae60', 'serpent'),
  },
};

export const WILD_PET_POOL = ['flamey', 'bubbly', 'leafy', 'rattie', 'snakeling'];

export function getPetTemplate(id: string): PetTemplate | undefined {
  return PET_TEMPLATES[id];
}

export function getSkill(id: string): Skill | undefined {
  return SKILLS[id];
}

export function getElementColor(element: ElementType): string {
  return ELEMENT_COLORS[element];
}

export function getTypeEffectiveness(attackType: ElementType, defenseType: ElementType): number {
  const chart: Record<ElementType, Record<ElementType, number>> = {
    fire: { fire: 0.5, water: 0.5, grass: 2, normal: 1 },
    water: { fire: 2, water: 0.5, grass: 0.5, normal: 1 },
    grass: { fire: 0.5, water: 2, grass: 0.5, normal: 1 },
    normal: { fire: 1, water: 1, grass: 1, normal: 1 },
  };
  return chart[attackType][defenseType];
}
