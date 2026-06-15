import type { Herb, Task, GameEvent, ScoreReport, SubmitResponse, RecipeSubmitResponse, EventHandleResponse, Recipe } from '../types';

const API_BASE = '/api';

export const api = {
  async getDailyTasks(day: number): Promise<{ tasks: Task[]; herbs: Herb[] }> {
    try {
      const response = await fetch(`${API_BASE}/daily-tasks?day=${day}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return await response.json();
    } catch {
      return getMockDailyTasks(day);
    }
  },

  async submitHerb(taskId: string, herbId: string): Promise<SubmitResponse> {
    try {
      const response = await fetch(`${API_BASE}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, herbId }),
      });
      if (!response.ok) throw new Error('Failed to submit');
      return await response.json();
    } catch {
      return getMockSubmitResponse(taskId, herbId);
    }
  },

  async submitRecipe(recipe: Recipe): Promise<RecipeSubmitResponse> {
    try {
      const response = await fetch(`${API_BASE}/submit-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      });
      if (!response.ok) throw new Error('Failed to submit recipe');
      return await response.json();
    } catch {
      return getMockRecipeResponse(recipe);
    }
  },

  async getEvent(triggerCount: number): Promise<{ event: GameEvent | null }> {
    try {
      const response = await fetch(`${API_BASE}/events?triggerCount=${triggerCount}`);
      if (!response.ok) throw new Error('Failed to fetch event');
      return await response.json();
    } catch {
      return getMockEvent(triggerCount);
    }
  },

  async handleEvent(eventId: string, optionId: string): Promise<EventHandleResponse> {
    try {
      const response = await fetch(`${API_BASE}/handle-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, optionId }),
      });
      if (!response.ok) throw new Error('Failed to handle event');
      return await response.json();
    } catch {
      return getMockEventResponse(eventId, optionId);
    }
  },

  async getScore(period: number): Promise<ScoreReport> {
    try {
      const response = await fetch(`${API_BASE}/score?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch score');
      return await response.json();
    } catch {
      return getMockScoreReport(period);
    }
  },
};

export const MOCK_HERBS: Herb[] = [
  {
    id: 'chaihu',
    name: '柴胡',
    pinyin: 'chái hú',
    shape: '茎直立，叶互生，呈线状披针形，根呈圆锥形，外皮红褐色',
    odor: '气微香，味微苦辛',
    effect: '和解表里，疏肝升阳，治寒热往来',
    nature: '微寒',
    meridian: ['肝', '胆'],
    image: '🌿',
    color: '#7a9e7a',
  },
  {
    id: 'danggui',
    name: '当归',
    pinyin: 'dāng guī',
    shape: '根呈圆柱形，有支根，表面黄棕色，有纵皱纹',
    odor: '有浓郁香气，味甘辛微苦',
    effect: '补血活血，调经止痛，润肠通便',
    nature: '温',
    meridian: ['肝', '心', '脾'],
    image: '🌱',
    color: '#c19a6b',
  },
  {
    id: 'fuling',
    name: '茯苓',
    pinyin: 'fú líng',
    shape: '呈类球形或不规则团块，外皮薄而粗糙，棕褐色',
    odor: '气微，味淡，嚼之粘牙',
    effect: '利水渗湿，健脾宁心，治水肿尿少',
    nature: '平',
    meridian: ['心', '肺', '脾', '肾'],
    image: '🍄',
    color: '#d4a351',
  },
  {
    id: 'ganjiang',
    name: '干姜',
    pinyin: 'gān jiāng',
    shape: '呈扁平块状，具指状分枝，表面灰黄色或浅灰棕色',
    odor: '气香特异，味辛辣',
    effect: '温中散寒，回阳通脉，温肺化饮',
    nature: '热',
    meridian: ['脾', '胃', '肾', '心', '肺'],
    image: '🫚',
    color: '#c0392b',
  },
  {
    id: 'juhua',
    name: '菊花',
    pinyin: 'jú huā',
    shape: '呈不规则球形或扁球形，舌状花类白色或黄色',
    odor: '气清香，味甘微苦',
    effect: '疏散风热，平抑肝阳，清肝明目',
    nature: '微寒',
    meridian: ['肺', '肝'],
    image: '🌼',
    color: '#f4d03f',
  },
  {
    id: 'renshen',
    name: '人参',
    pinyin: 'rén shēn',
    shape: '主根呈纺锤形或圆柱形，上部有断续的粗横纹',
    odor: '气微香而特异，味甘微苦',
    effect: '大补元气，复脉固脱，补脾益肺',
    nature: '微温',
    meridian: ['脾', '肺', '心', '肾'],
    image: '🌾',
    color: '#8b7355',
  },
];

const MOCK_EVENTS: GameEvent[] = [
  {
    id: 'event-1',
    type: 'worm',
    title: '药方虫蛀',
    description: '存放医书的竹简被虫蛀了几卷，部分药材描述模糊不清。你需要快速做出选择！',
    options: [
      { id: 'a', text: '凭记忆补全，继续辨认', scoreEffect: 8, knowledgeEffect: 3 },
      { id: 'b', text: '禀告师父，请求指导', scoreEffect: 5, knowledgeEffect: 5 },
      { id: 'c', text: '跳过此任务，改做他事', scoreEffect: -5, knowledgeEffect: -2 },
    ],
    timeLimit: 15,
  },
  {
    id: 'event-2',
    type: 'poison',
    title: '药童中毒',
    description: '在采集中误触了毒草，手指微微发麻。此时有几株解毒草药可用，如何处理？',
    options: [
      { id: 'a', text: '立即用甘草嚼敷解毒', scoreEffect: 10, knowledgeEffect: 5 },
      { id: 'b', text: '用水冲洗，静观其变', scoreEffect: 0, knowledgeEffect: 0 },
      { id: 'c', text: '用雄黄涂敷患处', scoreEffect: -5, knowledgeEffect: -3 },
    ],
    timeLimit: 12,
  },
  {
    id: 'event-3',
    type: 'pest',
    title: '药圃虫害',
    description: '连日阴雨，药圃中发现蚜虫聚集，部分草药叶片受损。如何应对？',
    options: [
      { id: 'a', text: '用除虫菊煎水喷洒', scoreEffect: 10, knowledgeEffect: 5 },
      { id: 'b', text: '人工摘除受害叶片', scoreEffect: 5, knowledgeEffect: 2 },
      { id: 'c', text: '弃置不管，听天由命', scoreEffect: -10, knowledgeEffect: -5 },
    ],
    timeLimit: 10,
  },
  {
    id: 'event-4',
    type: 'plague',
    title: '时疫蔓延',
    description: '附近村落出现时疫症状，师父让你紧急调制预防方剂。需要迅速配齐药材！',
    options: [
      { id: 'a', text: '取苍术、白芷、雄黄熏蒸', scoreEffect: 15, knowledgeEffect: 8 },
      { id: 'b', text: '用金银花、连翘、薄荷煎服', scoreEffect: 10, knowledgeEffect: 5 },
      { id: 'c', text: '仅用艾叶焚烧驱虫', scoreEffect: 0, knowledgeEffect: 0 },
    ],
    timeLimit: 15,
  },
];

function getMockDailyTasks(day: number): { tasks: Task[]; herbs: Herb[] } {
  const shuffled = [...MOCK_HERBS].sort(() => Math.random() - 0.5);
  const target = shuffled[0];
  
  const task: Task = {
    id: `task-${day}-${Date.now()}`,
    day,
    description: {
      shape: target.shape,
      odor: target.odor,
      effect: target.effect,
    },
    targetHerbId: target.id,
    timeLimit: 60,
    status: 'active',
  };

  return {
    tasks: [task],
    herbs: shuffled,
  };
}

function getMockSubmitResponse(taskId: string, herbId: string): SubmitResponse {
  const correct = herbId.startsWith('chaihu') || Math.random() > 0.5;
  return {
    correct,
    knowledge: correct ? 55 : 47,
    message: correct ? '辨药准确，医术精进！' : '辨认失误，需多加研习。',
  };
}

function getMockRecipeResponse(recipe: Recipe): RecipeSubmitResponse {
  const hasAllSlots = recipe.monarch.length > 0 && recipe.minister.length > 0;
  return {
    valid: hasAllSlots,
    score: hasAllSlots ? 15 : 0,
    message: hasAllSlots ? '方剂配伍得当，君臣佐使分明！' : '方剂不全，请调整配伍。',
  };
}

function getMockEvent(triggerCount: number): { event: GameEvent | null } {
  if (triggerCount > 0 && triggerCount % 2 === 0 && Math.random() > 0.4) {
    const event = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
    return { event: { ...event, id: `${event.id}-${Date.now()}` } };
  }
  return { event: null };
}

function getMockEventResponse(eventId: string, optionId: string): EventHandleResponse {
  const event = MOCK_EVENTS.find(e => eventId.startsWith(e.id));
  const option = event?.options.find(o => o.id === optionId);
  return {
    scoreEffect: option?.scoreEffect ?? 0,
    knowledgeEffect: option?.knowledgeEffect ?? 0,
    message: option ? '选择已生效。' : '无效选择。',
  };
}

function getMockScoreReport(period: number): ScoreReport {
  const total = 85 + Math.floor(Math.random() * 15);
  let grade: '甲' | '乙' | '丙' | '丁' = '丁';
  if (total >= 90) grade = '甲';
  else if (total >= 80) grade = '乙';
  else if (total >= 60) grade = '丙';

  const comments: Record<string, string> = {
    '甲': '医术精湛，辨析入微，堪称当代药圣！',
    '乙': '勤勉好学，辨识有度，继续精进必成大器。',
    '丙': '根基尚浅，需勤加研习《神农本草》。',
    '丁': '谬误颇多，当从基础从头学起。',
  };

  return {
    period,
    accuracy: 80 + Math.floor(Math.random() * 20),
    recipeCompletion: 75 + Math.floor(Math.random() * 25),
    eventHandling: 70 + Math.floor(Math.random() * 30),
    totalScore: total,
    knowledge: 60 + Math.floor(Math.random() * 40),
    grade,
    comments: comments[grade],
  };
}
