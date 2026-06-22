import axios from 'axios';
import type { RuneShard, RuneCasting, Order, GameEvent, EvaluationReport, FusionResult } from '@/types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 200,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getShards = async (): Promise<RuneShard[]> => {
  try {
    const response = await api.get<{ shards: RuneShard[] }>('/shards');
    return response.data.shards;
  } catch (error) {
    console.error('Failed to fetch shards:', error);
    return generateMockShards();
  }
};

export const fuseShards = async (shardIds: string[]): Promise<FusionResult> => {
  try {
    const response = await api.post<FusionResult>('/fuse', { shardIds });
    return response.data;
  } catch (error) {
    console.error('Failed to fuse shards:', error);
    return mockFuseShards(shardIds);
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    const response = await api.get<{ orders: Order[] }>('/orders');
    return response.data.orders;
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return generateMockOrders();
  }
};

export const completeOrder = async (orderId: string, castingId: string): Promise<{ success: boolean; reward: number; message: string }> => {
  try {
    const response = await api.post<{ success: boolean; reward: number; message: string }>(`/orders/${orderId}/complete`, { castingId });
    return response.data;
  } catch (error) {
    console.error('Failed to complete order:', error);
    return { success: true, reward: 100, message: '订单完成！' };
  }
};

export const triggerRandomEvent = async (): Promise<GameEvent> => {
  try {
    const response = await api.post<{ event: GameEvent }>('/events/trigger');
    return response.data.event;
  } catch (error) {
    console.error('Failed to trigger event:', error);
    return generateMockEvent();
  }
};

export const handleEvent = async (eventId: string, action: string): Promise<{ success: boolean; score: number }> => {
  try {
    const response = await api.post<{ success: boolean; score: number }>(`/events/${eventId}/handle`, { action });
    return response.data;
  } catch (error) {
    console.error('Failed to handle event:', error);
    return { success: true, score: 50 };
  }
};

export const getEvaluation = async (): Promise<EvaluationReport> => {
  try {
    const response = await api.get<{ report: EvaluationReport }>('/evaluation');
    return response.data.report;
  } catch (error) {
    console.error('Failed to get evaluation:', error);
    return generateMockEvaluation();
  }
};

export const saveEvaluation = async (report: EvaluationReport): Promise<{ success: boolean }> => {
  try {
    const response = await api.post<{ success: boolean }>('/evaluation', report);
    return response.data;
  } catch (error) {
    console.error('Failed to save evaluation:', error);
    return { success: true };
  }
};

const generateId = (): string => Math.random().toString(36).substring(2, 11);

const generateMockShards = (): RuneShard[] => {
  const elements: Array<'fire' | 'water' | 'earth' | 'wind'> = ['fire', 'water', 'earth', 'wind'];
  const shards: RuneShard[] = [];
  const count = 8 + Math.floor(Math.random() * 5);
  
  for (let i = 0; i < count; i++) {
    shards.push({
      id: generateId(),
      element: elements[Math.floor(Math.random() * elements.length)],
      x: (i % 4) * 25 + 10,
      y: Math.floor(i / 4) * 25 + 10,
      contaminated: false,
    });
  }
  return shards;
};

const mockFuseShards = (shardIds: string[]): FusionResult => {
  const elements: Array<'fire' | 'water' | 'earth' | 'wind'> = ['fire', 'water', 'earth', 'wind'];
  const shardElements = shardIds.map(() => elements[Math.floor(Math.random() * elements.length)]);
  
  const uniqueElements = [...new Set(shardElements)];
  let name = '未知符文';
  let score = 0;
  const attributes: Record<string, number> = {};

  if (uniqueElements.length === 4) {
    name = '混沌符文';
    score = 200;
    attributes['攻击力'] = 40;
    attributes['防御力'] = 40;
    attributes['生命值'] = 40;
    attributes['速度'] = 40;
  } else if (uniqueElements.length === 3) {
    name = '元素符文';
    score = 120;
    attributes['全属性'] = 20;
  } else if (shardElements.length === 2 && uniqueElements.length === 2) {
    const combo = [...uniqueElements].sort().join('+');
    const recipes: Record<string, { name: string; score: number; attr: Record<string, number> }> = {
      'fire+water': { name: '蒸汽符文', score: 80, attr: { '混合伤害': 35, '持续伤害': 8 } },
      'earth+fire': { name: '熔岩符文', score: 75, attr: { '攻击力': 30, '灼烧': 10 } },
      'fire+wind': { name: '烈焰风暴', score: 90, attr: { '范围伤害': 45, '攻速': 15 } },
      'earth+water': { name: '泥沼符文', score: 70, attr: { '控制': 40, '减速': 20 } },
      'water+wind': { name: '冰霜风暴', score: 85, attr: { '冰冻': 35, '冷却缩减': 12 } },
      'earth+wind': { name: '沙尘符文', score: 75, attr: { '视野': 25, '致盲': 15 } },
    };
    const recipe = recipes[combo] || { name: '融合符文', score: 50, attr: { '基础属性': 20 } };
    name = recipe.name;
    score = recipe.score;
    Object.assign(attributes, recipe.attr);
  } else if (shardElements.length >= 2 && uniqueElements.length === 1) {
    const element = uniqueElements[0];
    const recipes: Record<string, { name: string; score: number; attr: Record<string, number> }> = {
      fire: { name: '烈焰符文', score: 60, attr: { '攻击力': 50, '暴击率': 10 } },
      water: { name: '寒冰符文', score: 55, attr: { '防御力': 40, '生命回复': 5 } },
      earth: { name: '岩石符文', score: 65, attr: { '生命值': 80, '减伤': 15 } },
      wind: { name: '疾风符文', score: 50, attr: { '速度': 30, '闪避率': 12 } },
    };
    const recipe = recipes[element];
    name = recipe.name;
    score = recipe.score;
    Object.assign(attributes, recipe.attr);
  }

  const casting: RuneCasting = {
    id: generateId(),
    elements: shardElements,
    name,
    attributes,
    score,
  };

  return {
    casting,
    success: true,
    message: `融合成功：${name} +${score}分`,
  };
};

const generateMockOrders = (): Order[] => {
  const orders: Order[] = [
    {
      id: generateId(),
      title: '烈焰铸造',
      description: '需要至少2个火焰属性碎片',
      requirements: { minFire: 2 },
      timeLimit: 60,
      difficulty: 1,
      reward: 100,
      completed: false,
      remainingTime: 60,
    },
    {
      id: generateId(),
      title: '寒冰护盾',
      description: '需要1个水属性和1个土属性碎片',
      requirements: { minWater: 1, minEarth: 1 },
      timeLimit: 90,
      difficulty: 2,
      reward: 150,
      completed: false,
      remainingTime: 90,
    },
    {
      id: generateId(),
      title: '元素大师',
      description: '需要四种属性各至少1个碎片',
      requirements: { minFire: 1, minWater: 1, minEarth: 1, minWind: 1 },
      timeLimit: 120,
      difficulty: 3,
      reward: 300,
      completed: false,
      remainingTime: 120,
    },
  ];
  return orders;
};

const generateMockEvent = (): GameEvent => {
  const eventTypes = [
    {
      type: 'overheat' as const,
      title: '熔炉过热！',
      description: '熔炉温度过高，请等待5秒冷却，强行操作会引发爆炸！',
      duration: 5000,
    },
    {
      type: 'contamination' as const,
      title: '碎片污染！',
      description: '部分碎片被黑暗力量污染，点击刷新按钮清理污染！',
      duration: 10000,
    },
    {
      type: 'muse_silence' as const,
      title: '缪斯沉寂！',
      description: '灵感枯竭，订单生成速度减半，持续15秒！',
      duration: 15000,
    },
  ];
  
  const selected = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  return {
    id: generateId(),
    ...selected,
    startTime: Date.now(),
  };
};

const generateMockEvaluation = (): EvaluationReport => {
  const completionRate = 0.6 + Math.random() * 0.3;
  const avgAttributes = 30 + Math.random() * 30;
  const eventScore = 50 + Math.random() * 50;
  const totalScore = completionRate * 40 + avgAttributes * 0.5 + eventScore * 0.3;
  
  let starRating: 1 | 2 | 3 | 4 | 5 = 3;
  if (totalScore >= 80) starRating = 5;
  else if (totalScore >= 65) starRating = 4;
  else if (totalScore >= 50) starRating = 3;
  else if (totalScore >= 30) starRating = 2;
  else starRating = 1;

  const summaries: Record<number, string> = {
    1: '新手铸师，还需多加练习。',
    2: '初窥门径，继续努力！',
    3: '熟练铸师，手艺精湛。',
    4: '大师级铸师，令人敬佩！',
    5: '传奇铸师！你的名字将被铭刻在符文史册上！',
  };

  return {
    period: 1,
    orderCompletionRate: Math.round(completionRate * 100) / 100,
    averageCastingAttributes: Math.round(avgAttributes * 10) / 10,
    eventHandlingScore: Math.round(eventScore * 10) / 10,
    totalScore: Math.round(totalScore * 10) / 10,
    starRating,
    summary: summaries[starRating],
  };
};
