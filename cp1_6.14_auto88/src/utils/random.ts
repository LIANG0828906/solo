const namePrefixes = [
  '暗影',
  '森林',
  '机械',
  '暗夜',
  '圣光',
  '雷霆',
  '迷雾',
  '烈焰',
  '冰霜',
  '星辰',
  '月影',
  '风暴'
];

const nameSuffixes = [
  '刺客',
  '精灵',
  '工匠',
  '游侠',
  '法师',
  '战士',
  '盗贼',
  '祭司',
  '术士',
  '骑士',
  '猎人',
  '行者'
];

const appearanceColors = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c'
];

const appearanceHats = [
  '巫师帽',
  '皇冠',
  '兜帽',
  '礼帽'
];

export const pickRandom = <T>(arr: T[]): T => {
  if (arr.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  return arr[Math.floor(Math.random() * arr.length)];
};

export const generateCustomerName = (): string => {
  return `${pickRandom(namePrefixes)}${pickRandom(nameSuffixes)}`;
};

export const generateCustomerAppearance = (): { color: string; hat: string } => {
  return {
    color: pickRandom(appearanceColors),
    hat: pickRandom(appearanceHats)
  };
};

export const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};
