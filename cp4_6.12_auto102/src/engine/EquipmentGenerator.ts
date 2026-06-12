import {
  Equipment,
  EquipmentType,
  Rarity,
  EquipmentStats,
  StatKey,
  STAT_KEYS,
} from '../types';

const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5,
};

const RARITY_STAT_MULTIPLIER: Record<Rarity, number> = {
  common: 0.6,
  rare: 0.8,
  epic: 1.0,
  legendary: 1.3,
};

const WEAPON_NAMES: Record<Rarity, string[]> = {
  common: ['铁管步枪', '旧式手枪', '锈蚀匕首', '标准电棍'],
  rare: ['等离子步枪', '脉冲手枪', '高频振动刃', '电磁霰弹枪'],
  epic: ['量子裂隙炮', '相位投射器', '暗物质长刀', '中子鞭'],
  legendary: ['天启之枪', '虚空撕裂者', '弑神者之刃', '终焉发射器'],
};

const ARMOR_NAMES: Record<Rarity, string[]> = {
  common: ['旧皮甲', '铁片护胸', '简易防弹衣', '回收护具'],
  rare: ['纳米护甲', '能量护盾背心', '碳纤维战衣', '磁暴装甲'],
  epic: ['量子偏转甲', '相位迷彩服', '暗物质护盾', '中子壁障'],
  legendary: ['永生之铠', '虚空行者斗篷', '弑神者战甲', '终焉壁垒'],
};

const CYBERWARE_NAMES: Record<Rarity, string[]> = {
  common: ['基础义眼', '简易臂刃', '反射导线', '皮下护板'],
  rare: ['鹰眼义眼', '螳螂刀臂', '加速导线', '纳米皮肤'],
  epic: ['量子义眼', '单分子刃臂', '时间膨胀器', '相位皮肤'],
  legendary: ['全视之眼', '弑神者之臂', '永恒加速器', '虚空之躯'],
};

const FLAVOR_TEXTS = [
  '"Firmware update required. Or not. Your call."',
  '"It hums at a frequency only dogs can hear. Or maybe AIs."',
  '"Previous owner? Let\'s just say they won\'t need it anymore."',
  '"Smells like burnt ozone and regret."',
  '"The serial number has been scratched off. Twice."',
  '"Powered by dreams and volatile isotopes."',
  '"Legal in three sectors. Don\'t ask about the other seven."',
  '"If it glows, it\'s probably fine. Probably."',
  '"Comes with a lifetime warranty. Lifetime not included."',
  '"Debug log reads: ERROR_EVERYTHING_IS_FINE."',
  '"It was once part of something greater. Now it\'s yours."',
  '"The specs say Class-III. The vibe says Class-A threat."',
  '"Certified pre-owned by a corpo black ops team."',
  '"Nobody makes these anymore. For good reason."',
  '"It pulses when you look at it. It knows."',
];

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `eq_${Date.now()}_${idCounter}_${Math.random().toString(36).substring(2, 8)}`;
}

function pickRarity(): Rarity {
  const roll = Math.random() * 100;
  let cumulative = 0;
  const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
  for (const r of rarities) {
    cumulative += RARITY_WEIGHTS[r];
    if (roll < cumulative) return r;
  }
  return 'common';
}

function generateStats(rarity: Rarity): EquipmentStats {
  const mult = RARITY_STAT_MULTIPLIER[rarity];
  const base = () => Math.floor((Math.random() * 101 + 20) * mult);
  return {
    firepower: Math.min(120, base()),
    armor: Math.min(120, base()),
    charge: Math.min(120, base()),
    durability: Math.min(120, base()),
  };
}

function pickFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(type: EquipmentType, rarity: Rarity): string {
  const nameMap: Record<EquipmentType, Record<Rarity, string[]>> = {
    weapon: WEAPON_NAMES,
    armor: ARMOR_NAMES,
    cyberware: CYBERWARE_NAMES,
  };
  return pickFrom(nameMap[type][rarity]);
}

function generateFlavorText(): string {
  return pickFrom(FLAVOR_TEXTS);
}

export interface GenerateConfig {
  type?: EquipmentType;
  mode: 'synth' | 'draw';
}

export function generateEquipment(config: GenerateConfig): Equipment {
  const type = config.type ?? pickFrom<EquipmentType>(['weapon', 'armor', 'cyberware']);
  const rarity = pickRarity();
  return {
    id: generateId(),
    itemName: generateName(type, rarity),
    type,
    rarity,
    stats: generateStats(rarity),
    flavorText: generateFlavorText(),
    createdAt: Date.now(),
  };
}

export function generateDrawEquipment(): Equipment {
  return generateEquipment({ mode: 'draw' });
}

export function generateSynthEquipment(fragments: string[]): Equipment {
  const typeMap: Record<string, EquipmentType> = {
    quantum: 'weapon',
    nano: 'armor',
    plasma: 'weapon',
    bio: 'cyberware',
    dark: 'cyberware',
  };
  const dominant = fragments.reduce<Record<string, number>>((acc, f) => {
    acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {});
  const dominantType = Object.entries(dominant).sort((a, b) => b[1] - a[1])[0][0];
  const equipmentType = typeMap[dominantType] || 'weapon';
  return generateEquipment({ mode: 'synth', type: equipmentType });
}
