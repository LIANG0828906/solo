import { API_BASE_URL } from './constants';
import { CombineRequest, CombineResponse, RatingRequest, RatingResponse } from '@/types';

export async function combineCalculi(request: CombineRequest): Promise<CombineResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/calculus-combine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error('Failed to combine calculi');
    }
    return response.json();
  } catch (error) {
    console.warn('API unavailable, using fallback calculation');
    return fallbackCombineCalculi(request);
  }
}

export async function getRating(request: RatingRequest): Promise<RatingResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error('Failed to get rating');
    }
    return response.json();
  } catch (error) {
    console.warn('API unavailable, using fallback rating');
    return fallbackGetRating(request);
  }
}

function fallbackCombineCalculi(request: CombineRequest): CombineResponse {
  const { calculi } = request;
  
  if (calculi.length === 0) {
    return {
      artifactType: 'unknown',
      artifactName: '未成之物',
      attributes: { solidity: 0, sharpness: 0, temperament: 0, durability: 0, balance: 0 },
      relations: [],
      bonusEffects: [],
    };
  }

  const elements = calculi.map(c => c.element);
  const elementCounts = elements.reduce((acc, el) => {
    acc[el] = (acc[el] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const relations = detectRelations(elements);

  const attributes = calculateAttributes(calculi, relations);
  const artifactType = determineArtifactType(elementCounts, attributes);
  const artifactName = generateArtifactName(artifactType, elements);
  const bonusEffects = generateBonusEffects(relations);

  return { artifactType, artifactName, attributes, relations, bonusEffects };
}

function detectRelations(elements: string[]) {
  const GENERATION: Record<string, string> = {
    wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
  };
  const OVERCOMING: Record<string, string> = {
    wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
  };

  const relations = [];
  const uniqueElements = [...new Set(elements)];

  for (let i = 0; i < uniqueElements.length; i++) {
    for (let j = 0; j < uniqueElements.length; j++) {
      if (i === j) continue;
      const from = uniqueElements[i] as 'wood' | 'metal' | 'fire' | 'water' | 'earth';
      const to = uniqueElements[j] as 'wood' | 'metal' | 'fire' | 'water' | 'earth';
      
      if (GENERATION[from] === to) {
        relations.push({ type: 'generates' as const, from, to, effect: 10 + Math.floor(Math.random() * 10) });
      }
      if (OVERCOMING[from] === to) {
        relations.push({ type: 'overcomes' as const, from, to, effect: 5 + Math.floor(Math.random() * 10) });
      }
    }
  }
  return relations;
}

function calculateAttributes(calculi: any[], relations: any[]) {
  let solidity = 0, sharpness = 0, temperament = 0, durability = 0, flexibility = 0;
  
  calculi.forEach(c => {
    solidity += c.attributes.hardness * 0.5 + c.attributes.durability * 0.3;
    sharpness += c.attributes.sharpness;
    temperament += c.attributes.resonance;
    durability += c.attributes.durability;
    flexibility += c.attributes.flexibility;
  });

  relations.forEach(r => {
    if (r.type === 'generates') {
      solidity += r.effect;
      sharpness += r.effect * 0.5;
      durability += r.effect * 0.3;
    }
  });

  const count = Math.max(calculi.length, 1);
  const balance = 100 - Math.abs(flexibility - solidity / count) * 0.5;

  return {
    solidity: Math.min(100, Math.round(solidity / count)),
    sharpness: Math.min(100, Math.round(sharpness / count)),
    temperament: Math.min(100, Math.round(temperament / count)),
    durability: Math.min(100, Math.round(durability / count)),
    balance: Math.min(100, Math.max(0, Math.round(balance))),
  };
}

function determineArtifactType(counts: Record<string, number>, attrs: any) {
  const max = Math.max(...Object.values(counts));
  const dominant = Object.keys(counts).find(k => counts[k] === max);
  
  if (dominant === 'metal' && attrs.sharpness > 60) return 'weapon';
  if (dominant === 'wood' && attrs.solidity > 50) return 'chariot';
  if (dominant === 'earth') return 'vessel';
  if (dominant === 'water' || attrs.temperament > 60) return 'instrument';
  if (dominant === 'fire' || attrs.sharpness > 70) return 'weapon';
  if (attrs.balance > 70 && attrs.solidity > 50) return 'farm';
  return 'unknown';
}

function generateArtifactName(type: string, elements: string[]) {
  const prefixes = ['四象', '五行', '三才', '两仪', '太极', '七星', '八卦', '九宫'];
  const suffixes = {
    chariot: ['战车', '辚辚车', '雷霆车', '风火轮'],
    farm: ['耒耜', '锄犁', '耕耘器', '百谷铲'],
    instrument: ['琴瑟', '笙箫', '鼓磬', '天籁'],
    weapon: ['宝剑', '利刃', '长矛', '破甲'],
    vessel: ['鼎彝', '尊壶', '聚宝盆', '乾坤瓶'],
    unknown: ['玄器', '妙物', '天工造', '神机关'],
  };
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffixList = suffixes[type as keyof typeof suffixes] || suffixes.unknown;
  const suffix = suffixList[Math.floor(Math.random() * suffixList.length)];
  
  return `${prefix}${suffix}`;
}

function generateBonusEffects(relations: any[]) {
  const effects: Record<string, string> = {
    'wood-fire': '木火通明', 'fire-earth': '火土相生',
    'earth-metal': '土生金气', 'metal-water': '金水相涵',
    'water-wood': '水木清华', 'wood-earth': '木克土虚',
    'earth-water': '土克水浊', 'water-fire': '水克火熄',
    'fire-metal': '火克金熔', 'metal-wood': '金克木伤',
  };
  
  return relations.map(r => effects[`${r.from}-${r.to}`] || '').filter(Boolean);
}

function fallbackGetRating(request: RatingRequest): RatingResponse {
  const { artifact, calculiCount, buildTime } = request;
  const attrs = artifact.attributes;
  
  const attributeScore = Math.round((attrs.solidity + attrs.sharpness + attrs.temperament + attrs.durability + attrs.balance) / 5);
  
  const generateCount = artifact.relations.filter(r => r.type === 'generates').length;
  const overcomeCount = artifact.relations.filter(r => r.type === 'overcomes').length;
  const harmonyScore = Math.min(100, Math.round(60 + generateCount * 15 - overcomeCount * 5));
  
  const creativityScore = Math.min(100, Math.round(50 + calculiCount * 8 + artifact.bonusEffects.length * 5));
  
  const efficiencyScore = Math.max(0, Math.min(100, Math.round(100 - buildTime / 10)));
  
  const totalScore = Math.round(attributeScore * 0.4 + harmonyScore * 0.3 + creativityScore * 0.2 + efficiencyScore * 0.1);
  
  let rank: 'S' | 'A' | 'B' | 'C' | 'D';
  if (totalScore >= 90) rank = 'S';
  else if (totalScore >= 80) rank = 'A';
  else if (totalScore >= 70) rank = 'B';
  else if (totalScore >= 60) rank = 'C';
  else rank = 'D';

  return {
    totalScore,
    rank,
    breakdown: { attributeScore, harmonyScore, creativityScore, efficiencyScore },
    record: {
      id: `rec_${Date.now()}`,
      timestamp: Date.now(),
      artifactName: artifact.artifactName,
      artifactType: artifact.artifactType,
      attributes: artifact.attributes,
      totalScore,
      rank,
    },
  };
}
