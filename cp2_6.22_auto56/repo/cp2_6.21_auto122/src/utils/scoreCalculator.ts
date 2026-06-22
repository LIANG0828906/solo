export interface ScoreInput {
  techTags: string[];
  developmentMonths: number;
  targetUsers: number;
  initialFunding: number;
}

export interface ScoreOutput {
  marketDemand: number;
  technicalDifficulty: number;
  investmentCost: number;
  total: number;
}

const HIGH_DEMAND_TAGS = ['AI/ML', '移动端', 'Web应用'];
const HIGH_COMPLEXITY_TAGS = ['AI/ML', '区块链', 'AR/VR', '游戏开发'];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function linearMap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function calculateMarketDemand(input: ScoreInput): number {
  let score = linearMap(input.targetUsers, 100, 100000, 20, 100);

  const highDemandCount = input.techTags.filter((tag) => HIGH_DEMAND_TAGS.includes(tag)).length;
  score += highDemandCount * 5;

  return clamp(score, 0, 100);
}

function calculateTechnicalDifficulty(input: ScoreInput): number {
  let score = linearMap(input.developmentMonths, 1, 12, 100, 20);

  const complexityCount = input.techTags.filter((tag) => HIGH_COMPLEXITY_TAGS.includes(tag)).length;
  score -= complexityCount * 5;

  return clamp(score, 0, 100);
}

function calculateInvestmentCost(input: ScoreInput): number {
  const score = linearMap(input.initialFunding, 0, 500000, 100, 20);
  return clamp(score, 0, 100);
}

export function calculateScore(input: ScoreInput): ScoreOutput {
  const marketDemand = Math.round(calculateMarketDemand(input));
  const technicalDifficulty = Math.round(calculateTechnicalDifficulty(input));
  const investmentCost = Math.round(calculateInvestmentCost(input));

  const total = Math.round(
    marketDemand * 0.4 + technicalDifficulty * 0.35 + investmentCost * 0.25
  );

  return {
    marketDemand,
    technicalDifficulty,
    investmentCost,
    total,
  };
}

export function generateComment(total: number): string {
  if (total >= 85) {
    return '潜力巨大，建议优先推进';
  } else if (total >= 70) {
    return '前景良好，值得投入资源';
  } else if (total >= 50) {
    return '有一定潜力，需优化关键指标';
  } else {
    return '风险较高，建议优化成本或调整方向';
  }
}

export const TECH_TAGS = [
  'AI/ML',
  '区块链',
  '移动端',
  'Web应用',
  '桌面应用',
  '游戏开发',
  'IoT',
  'AR/VR',
  '安全',
  'DevOps',
] as const;

export type TechTag = (typeof TECH_TAGS)[number];
