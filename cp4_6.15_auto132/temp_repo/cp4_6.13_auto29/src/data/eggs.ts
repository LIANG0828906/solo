import { PetEgg, ElementType } from '../types';

const eggNames: Record<ElementType, string[]> = {
  fire: ['烈焰蛋', '炎爆蛋', '赤焰蛋'],
  water: ['海浪蛋', '冰晶蛋', '深海蛋'],
  grass: ['森林蛋', '花仙蛋', '藤蔓蛋'],
};

const petNames: Record<ElementType, string[]> = {
  fire: ['焰焰', '火爆', '炎龙', '烈风', '赤灵'],
  water: ['波波', '水灵', '海蓝', '冰晶', '泡泡'],
  grass: ['叶叶', '花花', '森林', '藤蔓', '青苔'],
};

const skills: Record<ElementType, string[]> = {
  fire: ['火焰喷射', '烈焰冲击', '燃烧'],
  water: ['水枪射击', '冰霜新星', '水之护盾'],
  grass: ['藤鞭缠绕', '光合作用', '种子炸弹'],
};

const rarityMultiplier: Record<number, number> = {
  1: 1,
  2: 1.5,
  3: 2,
};

function generateEggs(): PetEgg[] {
  const eggs: PetEgg[] = [];
  const elements: ElementType[] = ['fire', 'water', 'grass'];
  const rarities: [1, 2, 3] = [1, 2, 3];
  let id = 0;

  elements.forEach((element) => {
    rarities.forEach((rarity) => {
      const baseTime = 10000;
      const hatchTime = Math.round(baseTime * rarityMultiplier[rarity]);
      eggs.push({
        id: `egg-${id++}`,
        element,
        rarity,
        name: eggNames[element][rarity - 1],
        hatchTime,
      });
    });
  });

  return eggs;
}

export const initialEggs = generateEggs();

export function generatePetName(element: ElementType): string {
  const names = petNames[element];
  return names[Math.floor(Math.random() * names.length)];
}

export function generatePetSkill(element: ElementType): string {
  const skillList = skills[element];
  return skillList[Math.floor(Math.random() * skillList.length)];
}

export const elementColors: Record<ElementType, { from: string; to: string }> = {
  fire: { from: '#FF6B35', to: '#FFD93D' },
  water: { from: '#4ECDC4', to: '#5562E8' },
  grass: { from: '#95E47B', to: '#56AB2F' },
};

export const elementLabels: Record<ElementType, string> = {
  fire: '火',
  water: '水',
  grass: '草',
};
