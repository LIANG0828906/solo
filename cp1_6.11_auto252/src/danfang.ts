export type Element = 'jin' | 'mu' | 'shui' | 'huo' | 'tu';
export type Grade = 'fan' | 'ling' | 'xian' | 'fail';

export interface Herb {
  id: string;
  name: string;
  element: Element;
  potency: number;
  description: string;
}

export interface AlchemyResult {
  success: boolean;
  grade: Grade;
  name: string;
  effect: string;
  reason?: string;
}

export interface ManualEntry {
  herbs: string[];
  temperature: number;
  tempHistory: { time: number; temp: number }[];
  result: AlchemyResult;
}

const elementNames: Record<Element, string> = {
  jin: '金',
  mu: '木',
  shui: '水',
  huo: '火',
  tu: '土'
};

const sheng: Record<Element, Element> = {
  mu: 'huo',
  huo: 'tu',
  tu: 'jin',
  jin: 'shui',
  shui: 'mu'
};

const ke: Record<Element, Element> = {
  mu: 'tu',
  tu: 'shui',
  shui: 'huo',
  huo: 'jin',
  jin: 'mu'
};

export const HERBS: Herb[] = [
  { id: 'dansha', name: '丹砂', element: 'huo', potency: 85, description: '至阳之药，聚火之精' },
  { id: 'xionghuang', name: '雄黄', element: 'tu', potency: 70, description: '辟邪解毒，土行之药' },
  { id: 'yunmu', name: '云母', element: 'jin', potency: 65, description: '清润养气，金之精华' },
  { id: 'zhusha', name: '朱砂', element: 'huo', potency: 90, description: '纯阳之精，火行极品' },
  { id: 'fuling', name: '茯苓', element: 'tu', potency: 55, description: '健脾渗湿，土行温和' },
  { id: 'chaihu', name: '柴胡', element: 'mu', potency: 60, description: '疏肝解郁，木行清灵' },
  { id: 'huanglian', name: '黄连', element: 'shui', potency: 75, description: '苦寒泻火，水行至阴' },
  { id: 'renshen', name: '人参', element: 'mu', potency: 88, description: '大补元气，木行之王' },
  { id: 'gancao', name: '甘草', element: 'tu', potency: 50, description: '调和诸药，土行中和' },
  { id: 'danggui', name: '当归', element: 'mu', potency: 72, description: '补血活血，木行滋润' },
  { id: 'huangqi', name: '黄芪', element: 'tu', potency: 68, description: '补气升阳，土行纯阳' },
  { id: 'baizhu', name: '白术', element: 'tu', potency: 62, description: '健脾益气，土行厚重' },
  { id: 'shengdi', name: '生地', element: 'shui', potency: 70, description: '清热凉血，水行养阴' },
  { id: 'shudi', name: '熟地', element: 'shui', potency: 80, description: '滋阴补肾，水行至宝' },
  { id: 'xiongqiong', name: '川芎', element: 'mu', potency: 65, description: '活血行气，木行通达' },
  { id: 'baishao', name: '白芍', element: 'jin', potency: 63, description: '养血敛阴，金行收敛' },
  { id: 'rougui', name: '肉桂', element: 'huo', potency: 82, description: '补火助阳，火行温热' },
  { id: 'ganjiang', name: '干姜', element: 'huo', potency: 78, description: '温中散寒，火行刚烈' },
  { id: 'shigao', name: '石膏', element: 'jin', potency: 73, description: '清热泻火，金行寒凉' },
  { id: 'zhimu', name: '知母', element: 'shui', potency: 66, description: '滋阴润燥，水行清润' }
];

const pillNames: Record<Grade, string[]> = {
  fan: ['百草丹', '凝神丹', '养气丹', '固元丹', '清神丹'],
  ling: ['聚灵丹', '筑基丹', '凝神丹', '辟谷丹', '淬体丹'],
  xian: ['九转金丹', '大罗仙丹', '太乙丹', '混元丹', '太极丹'],
  fail: ['废丹']
};

const pillEffects: Record<Grade, string[]> = {
  fan: [
    '服用后可强身健体，百病不侵',
    '能增进修为，稳固根基',
    '可清热解毒，延年益寿',
    '有助修行，增长气力',
    '能润养五脏，调和气血'
  ],
  ling: [
    '灵气充盈，可助突破筑基',
    '服后可辟谷一月，身轻如燕',
    '能洗髓伐脉，脱胎换骨',
    '元神凝聚，神识大增',
    '可御气飞行，日行千里'
  ],
  xian: [
    '霞举飞升，位列仙班',
    '长生不老，与天地同寿',
    '九转功成，道法自然',
    '金丹大道，成就仙缘',
    '万法归宗，超凡入圣'
  ],
  fail: ['']
};

export function getElementName(element: Element): string {
  return elementNames[element];
}

export function getElementClass(element: Element): string {
  return `element-${element}`;
}

export function calculateElementScore(herbs: Herb[]): { harmony: number; conflicts: string[] } {
  const elementCounts: Record<Element, number> = { jin: 0, mu: 0, shui: 0, huo: 0, tu: 0 };
  herbs.forEach(h => elementCounts[h.element]++);
  
  let harmony = 0;
  const conflicts: string[] = [];
  const elements: Element[] = ['jin', 'mu', 'shui', 'huo', 'tu'];
  
  elements.forEach(e => {
    if (elementCounts[e] > 0) {
      const shengTarget = sheng[e];
      if (elementCounts[shengTarget] > 0) {
        harmony += Math.min(elementCounts[e], elementCounts[shengTarget]) * 15;
      }
      
      const keTarget = ke[e];
      if (elementCounts[keTarget] > 0) {
        const conflictCount = Math.min(elementCounts[e], elementCounts[keTarget]);
        harmony -= conflictCount * 20;
        if (conflictCount > 0) {
          conflicts.push(`${elementNames[e]}克${elementNames[keTarget]}`);
        }
      }
    }
  });
  
  const uniqueElements = elements.filter(e => elementCounts[e] > 0).length;
  harmony += uniqueElements * 10;
  
  const totalPotency = herbs.reduce((sum, h) => sum + h.potency, 0);
  harmony += Math.floor(totalPotency / herbs.length / 10) * 5;
  
  return { harmony, conflicts };
}

export function calculateAlchemyResult(
  herbs: Herb[],
  temperature: number,
  avgTemperature: number
): AlchemyResult {
  if (herbs.length === 0) {
    return {
      success: false,
      grade: 'fail',
      name: '无',
      effect: '',
      reason: '未投入任何药材'
    };
  }
  
  if (herbs.length < 3) {
    return {
      success: false,
      grade: 'fail',
      name: '废丹',
      effect: '',
      reason: '药材过少，无法成丹'
    };
  }
  
  const { harmony, conflicts } = calculateElementScore(herbs);
  
  const tempInRange = temperature >= 600 && temperature <= 900;
  const avgTempInRange = avgTemperature >= 500 && avgTemperature <= 1000;
  
  let tempScore = 0;
  if (tempInRange) tempScore += 30;
  if (avgTempInRange) tempScore += 20;
  
  const tempDeviation = Math.abs(temperature - 750);
  tempScore -= Math.floor(tempDeviation / 100) * 5;
  
  let totalScore = harmony + tempScore;
  
  if (conflicts.length > 0) {
    if (temperature > 1000 || temperature < 400) {
      return {
        success: false,
        grade: 'fail',
        name: '炸炉',
        effect: '',
        reason: `丹炉炸裂，丹方失效！五行冲突：${conflicts.join('、')}，炉温${temperature > 1000 ? '过高' : '过低'}`
      };
    }
  }
  
  if (totalScore < 20) {
    return {
      success: false,
      grade: 'fail',
      name: '废丹',
      effect: '',
      reason: conflicts.length > 0 
        ? `五行冲突：${conflicts.join('、')}，药力相冲`
        : '药材配伍不当，无法凝聚丹药'
    };
  }
  
  let grade: Grade;
  if (totalScore >= 80 && tempInRange && avgTempInRange) {
    grade = 'xian';
  } else if (totalScore >= 50) {
    grade = 'ling';
  } else {
    grade = 'fan';
  }
  
  const nameIndex = Math.floor(Math.random() * pillNames[grade].length);
  const effectIndex = Math.floor(Math.random() * pillEffects[grade].length);
  
  return {
    success: true,
    grade,
    name: pillNames[grade][nameIndex],
    effect: pillEffects[grade][effectIndex]
  };
}

export function saveToLocalStorage(herbs: Herb[], temperature: number, 
  tempHistory: { time: number; temp: number }[], result: AlchemyResult): void {
  try {
    const entry: ManualEntry = {
      herbs: herbs.map(h => h.name),
      temperature,
      tempHistory,
      result
    };
    localStorage.setItem('alchemy_manual', JSON.stringify(entry));
  } catch (e) {
    console.error('Failed to save manual entry', e);
  }
}

export function loadFromLocalStorage(): ManualEntry | null {
  try {
    const data = localStorage.getItem('alchemy_manual');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load manual entry', e);
  }
  return null;
}
