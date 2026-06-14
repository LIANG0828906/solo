import { v4 as uuidv4 } from 'uuid';
import type { Equipment, Mission, ExpeditionResult, EquipmentType, Difficulty } from './types';

export const EQUIPMENT_DICTIONARY: Equipment[] = [
  { id: 'rope-1', name: '登山绳索', type: 'tool', weight: 3.5, durability: 100, icon: '🧵', description: '高强度尼龙绳索，用于攀爬和下降' },
  { id: 'pickaxe-1', name: '登山镐', type: 'tool', weight: 2.8, durability: 100, icon: '⛏️', description: '冰岩两用登山镐，应对复杂地形' },
  { id: 'flashlight-1', name: '头灯', type: 'tool', weight: 0.3, durability: 80, icon: '🔦', description: '强光LED头灯，续航12小时' },
  { id: 'compass-1', name: '指南针', type: 'tool', weight: 0.1, durability: 100, icon: '🧭', description: '专业级指南针，防止迷路' },
  { id: 'knife-1', name: '多功能刀', type: 'tool', weight: 0.2, durability: 90, icon: '🔪', description: '瑞士军刀，多种工具集成' },
  { id: 'tent-1', name: '便携帐篷', type: 'tool', weight: 4.5, durability: 85, icon: '⛺', description: '单人轻量化帐篷，防风防雨' },
  { id: 'water-filter-1', name: '净水器', type: 'tool', weight: 0.5, durability: 70, icon: '💧', description: '便携式净水装置，保障饮水安全' },
  
  { id: 'first-aid-1', name: '急救包', type: 'medical', weight: 1.2, durability: 95, icon: '🩹', description: '基础医疗用品，处理常见伤病' },
  { id: 'medkit-1', name: '高级医疗包', type: 'medical', weight: 2.5, durability: 90, icon: '💊', description: '包含处方药和高级止血设备' },
  { id: 'antidote-1', name: '解毒剂', type: 'medical', weight: 0.2, durability: 80, icon: '🧪', description: '广谱蛇虫解毒剂' },
  { id: 'splint-1', name: '骨折固定夹板', type: 'medical', weight: 0.8, durability: 100, icon: '🦴', description: '轻量化骨折固定装置' },
  
  { id: 'energy-bar-1', name: '能量棒', type: 'food', weight: 0.1, durability: 90, icon: '🍫', description: '高能量营养棒，快速补充体力' },
  { id: 'dried-meat-1', name: '风干肉', type: 'food', weight: 0.3, durability: 85, icon: '🥩', description: '高蛋白风干肉，耐储存' },
  { id: 'water-bottle-1', name: '水壶', type: 'food', weight: 1.0, durability: 95, icon: '🫗', description: '1升容量保温水壶' },
  { id: 'trail-mix-1', name: '坚果混合包', type: 'food', weight: 0.2, durability: 88, icon: '🥜', description: '多种坚果和果干，均衡营养' },
  
  { id: 'radio-1', name: '对讲机', type: 'communication', weight: 0.4, durability: 75, icon: '📻', description: '短波对讲机，山区通讯' },
  { id: 'gps-1', name: 'GPS定位器', type: 'communication', weight: 0.3, durability: 80, icon: '📡', description: '卫星GPS，精确定位' },
  { id: 'flare-1', name: '信号弹', type: 'communication', weight: 0.2, durability: 90, icon: '🎆', description: '紧急救援信号弹' },
  { id: 'whistle-1', name: '求生哨', type: 'communication', weight: 0.05, durability: 100, icon: '📢', description: '高频求生哨，传播距离远' },
];

const MISSION_TEMPLATES: Omit<Mission, 'id'>[] = [
  { name: '丛林深处的失落神庙', difficulty: 3, requiredTypes: ['tool', 'medical', 'food'], description: '探险队要深入未知丛林寻找传说中的神庙，路途艰险', terrain: '丛林' },
  { name: '雪山峰登顶挑战', difficulty: 3, requiredTypes: ['tool', 'medical'], description: '攀登海拔5000米的雪峰，低温和缺氧是最大敌人', terrain: '雪山' },
  { name: '河谷穿越探险', difficulty: 2, requiredTypes: ['tool', 'food'], description: '沿河谷徒步前进，需要涉水和攀岩', terrain: '河谷' },
  { name: '洞穴探索任务', difficulty: 2, requiredTypes: ['tool', 'communication'], description: '探索地下溶洞系统，容易迷路', terrain: '洞穴' },
  { name: '森林边缘勘测', difficulty: 1, requiredTypes: ['tool'], description: '相对安全的森林边缘勘测任务', terrain: '森林' },
  { name: '野生动物追踪', difficulty: 2, requiredTypes: ['tool', 'medical', 'communication'], description: '追踪珍稀野生动物，可能遭遇危险', terrain: '草原' },
  { name: '失事飞机搜救', difficulty: 3, requiredTypes: ['medical', 'communication', 'tool'], description: '在山区搜救失事飞机幸存者，时间紧迫', terrain: '山地' },
  { name: '溪流采集任务', difficulty: 1, requiredTypes: ['food', 'tool'], description: '沿溪流采集植物样本，路程较轻松', terrain: '溪流' },
  { name: '夜间侦察任务', difficulty: 2, requiredTypes: ['tool', 'communication'], description: '夜间进行地形侦察，需要良好照明', terrain: '丘陵' },
  { name: '急救补给运送', difficulty: 1, requiredTypes: ['medical', 'food'], description: '向前哨基地运送医疗和食物补给', terrain: '平原' },
];

const RANDOM_EVENTS = {
  positive: [
    '发现了一处隐蔽的温泉',
    '遇到了友好的当地向导',
    '找到了前人留下的补给',
    '天气异常晴朗，视野极佳',
    '发现了珍稀植物标本',
    '沿途找到了可食用的野果',
  ],
  negative: [
    '遭遇了突如其来的暴雨',
    '被毒虫叮咬',
    '遇到了山体滑坡',
    '迷失了方向',
    '装备意外损坏',
    '遭遇野生动物袭击',
    '队员出现高原反应',
    '食物被野生动物偷走',
    '过河时水流湍急',
    '浓雾弥漫，能见度极低',
  ],
};

const REWARD_ITEMS = [
  '古代金币',
  '稀有矿石',
  '神秘地图碎片',
  '珍稀草药',
  '远古化石',
  '宝石原石',
  '失落文明的文物',
  '稀有昆虫标本',
];

export function generateMission(): Mission {
  const template = MISSION_TEMPLATES[Math.floor(Math.random() * MISSION_TEMPLATES.length)];
  return {
    ...template,
    id: uuidv4(),
  };
}

export function generateInitialMissions(count: number = 3): Mission[] {
  const missions: Mission[] = [];
  for (let i = 0; i < count; i++) {
    missions.push(generateMission());
  }
  return missions;
}

export function calculateSurvivalRate(
  pack: Equipment[],
  mission: Mission
): { rate: number; breakdown: Record<EquipmentType, number> } {
  const breakdown: Record<EquipmentType, number> = {
    tool: 0,
    medical: 0,
    food: 0,
    communication: 0,
  };

  let baseRate = 30;

  const typeCounts: Record<EquipmentType, number> = {
    tool: 0,
    medical: 0,
    food: 0,
    communication: 0,
  };

  const totalDurability: Record<EquipmentType, number> = {
    tool: 0,
    medical: 0,
    food: 0,
    communication: 0,
  };

  for (const item of pack) {
    typeCounts[item.type]++;
    totalDurability[item.type] += item.durability;
  }

  for (const type of Object.keys(typeCounts) as EquipmentType[]) {
    const count = typeCounts[type];
    const avgDurability = count > 0 ? totalDurability[type] / count : 0;
    const typeBonus = Math.min(count * 15, 30) * (avgDurability / 100);
    breakdown[type] = Math.round(typeBonus);
    baseRate += typeBonus;
  }

  const requiredCount = mission.requiredTypes.filter(type => typeCounts[type] > 0).length;
  const requiredBonus = requiredCount * 10;
  baseRate += requiredBonus;

  const difficultyPenalty = (mission.difficulty - 1) * 15;
  baseRate -= difficultyPenalty;

  baseRate = Math.max(5, Math.min(95, baseRate));

  return { rate: Math.round(baseRate), breakdown };
}

export function simulateExpedition(
  pack: Equipment[],
  mission: Mission
): ExpeditionResult {
  const { rate, breakdown } = calculateSurvivalRate(pack, mission);

  const events: string[] = [];
  const rewards: string[] = [];
  const losses: string[] = [];

  const eventCount = Math.floor(Math.random() * 2) + 1;
  const positiveChance = rate / 100;

  for (let i = 0; i < eventCount; i++) {
    if (Math.random() < positiveChance) {
      events.push(RANDOM_EVENTS.positive[Math.floor(Math.random() * RANDOM_EVENTS.positive.length)]);
    } else {
      events.push(RANDOM_EVENTS.negative[Math.floor(Math.random() * RANDOM_EVENTS.negative.length)]);
    }
  }

  const roll = Math.random() * 100;
  const success = roll <= rate;

  if (success) {
    const rewardCount = Math.floor(Math.random() * mission.difficulty) + 1;
    for (let i = 0; i < rewardCount; i++) {
      const reward = REWARD_ITEMS[Math.floor(Math.random() * REWARD_ITEMS.length)];
      if (!rewards.includes(reward)) {
        rewards.push(reward);
      }
    }
  } else {
    if (pack.length > 0 && Math.random() < 0.5) {
      const lostItem = pack[Math.floor(Math.random() * pack.length)];
      losses.push(`${lostItem.name} 已损坏`);
    }
  }

  let message = '';
  if (success) {
    if (mission.difficulty === 1) {
      message = '探险队顺利完成了任务，平安归来！';
    } else if (mission.difficulty === 2) {
      message = '虽然路途坎坷，但探险队成功完成了任务！';
    } else {
      message = '历经千辛万苦，探险队奇迹般地完成了高难度任务！';
    }
  } else {
    if (rate < 30) {
      message = '装备准备不足，探险队遭遇了严重困难，被迫撤退。';
    } else if (rate < 60) {
      message = '探险队遇到了意外状况，任务未能完成，但队员安全返回。';
    } else {
      message = '差一点就成功了！探险队在最后关头遭遇不测，任务失败。';
    }
  }

  return {
    success,
    message,
    rewards,
    losses,
    survivalRate: rate,
    events,
  };
}

export function simulateExpeditionAsync(
  pack: Equipment[],
  mission: Mission,
  callback: (result: ExpeditionResult) => void
): () => void {
  const duration = 3000 + Math.random() * 2000;
  const timeoutId = setTimeout(() => {
    const result = simulateExpedition(pack, mission);
    callback(result);
  }, duration);

  return () => clearTimeout(timeoutId);
}
