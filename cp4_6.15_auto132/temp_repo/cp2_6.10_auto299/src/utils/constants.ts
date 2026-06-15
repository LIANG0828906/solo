import type { Tool, ToolType, DefectRequirement, DefectType } from '@/types';

export const INITIAL_TOOLS: Tool[] = [
  {
    id: 'tool-brush',
    type: 'brush',
    name: '毛笔',
    icon: 'brush',
    quantity: 10,
    description: '用于补字、描绘',
  },
  {
    id: 'tool-ink',
    type: 'ink',
    name: '徽墨',
    icon: 'ink',
    quantity: 10,
    description: '用于调墨、浸染',
  },
  {
    id: 'tool-paper',
    type: 'paper',
    name: '宣纸',
    icon: 'paper',
    quantity: 10,
    description: '用于补洞、托裱',
  },
  {
    id: 'tool-inkstone',
    type: 'inkstone',
    name: '端砚',
    icon: 'inkstone',
    quantity: 10,
    description: '用于研墨、调水',
  },
];

export const DEFECT_REQUIREMENTS: Record<DefectType, DefectRequirement> = {
  missing_character: {
    type: 'missing_character',
    name: '缺字',
    description: '书页文字缺失，需补写',
    requiredTools: ['brush', 'ink', 'inkstone'],
    icon: 'missing',
  },
  worm_damage: {
    type: 'worm_damage',
    name: '虫蛀',
    description: '书页遭虫蛀，需补洞',
    requiredTools: ['paper', 'brush', 'ink'],
    icon: 'bug',
  },
  water_stain: {
    type: 'water_stain',
    name: '水渍',
    description: '书页有水渍，需清洗',
    requiredTools: ['inkstone', 'paper', 'ink'],
    icon: 'droplet',
  },
  torn_edge: {
    type: 'torn_edge',
    name: '撕裂',
    description: '书页边缘撕裂，需修补',
    requiredTools: ['paper', 'brush', 'inkstone'],
    icon: 'scissors',
  },
  mold_spot: {
    type: 'mold_spot',
    name: '霉斑',
    description: '书页生霉，需去霉',
    requiredTools: ['ink', 'inkstone', 'paper'],
    icon: 'cloud',
  },
};

export const BOOK_TITLES = [
  '《道德经》',
  '《论语》',
  '《孙子兵法》',
  '《山海经》',
  '《史记》',
  '《红楼梦》',
  '《西游记》',
  '《水浒传》',
  '《三国演义》',
  '《聊斋志异》',
  '《儒林外史》',
  '《牡丹亭》',
  '《西厢记》',
  '《长恨歌》',
  '《琵琶行》',
];

export const POEMS = [
  '笔落惊风雨，诗成泣鬼神。',
  '墨香传古韵，纸寿千年春。',
  '砚池藏日月，笔底走龙蛇。',
  '纸上得来终觉浅，绝知此事要躬行。',
  '读书破万卷，下笔如有神。',
  '字字看来皆是血，十年辛苦不寻常。',
  '文章千古事，得失寸心知。',
  '笔底烟云，胸中丘壑。',
  '墨磨岁月，纸载春秋。',
  '一砚梨花雨，半窗松竹风。',
  '古墨半磨香满室，新诗初就韵盈怀。',
  '笔锋如剑斩愁绪，墨香似酒醉人心。',
  '纸田墨稼，笔耕砚耘。',
  '窗竹影摇书案上，野泉声入砚池中。',
  '万卷诗书消永日，一窗昏晓送流年。',
];

export const HONOR_TITLES = [
  '初学裱褙',
  '墨香学徒',
  '古籍工匠',
  '修书匠人',
  '传习师者',
  '古籍良工',
  '修书妙手',
  '墨韵大师',
  '古籍宗师',
  '书魂守护者',
];

export const EXPERIENCE_PER_LEVEL = 100;

export const MAX_LOGS = 5;

export const DAYS_PER_REPORT = 10;

export const TOOL_NAMES: Record<ToolType, string> = {
  brush: '毛笔',
  ink: '徽墨',
  paper: '宣纸',
  inkstone: '端砚',
};

export const COLORS = {
  primary: '#c0392b',
  secondary: '#2e86c1',
  background: '#f5e6c8',
  wood: '#8b7355',
  ink: '#2c2c2c',
  paper: '#faf8f0',
  warning: '#e74c3c',
  success: '#27ae60',
};

export const INK_COLORS = [
  '#1a1a2e',
  '#16213e',
  '#0f3460',
  '#2c2c2c',
  '#1a1a1a',
  '#2d2d44',
];
