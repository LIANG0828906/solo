const TAGS = ['科技', '消费', '新能源', '医疗', '金融', '地产', '军工', '农业', '通信', '传媒'] as const;

export type TagName = (typeof TAGS)[number];

const TAG_PARAMS: Record<TagName, { mean: number; std: number }> = {
  '科技': { mean: 0.0008, std: 0.018 },
  '消费': { mean: 0.0004, std: 0.012 },
  '新能源': { mean: 0.0006, std: 0.022 },
  '医疗': { mean: 0.0003, std: 0.014 },
  '金融': { mean: 0.0002, std: 0.013 },
  '地产': { mean: -0.0001, std: 0.016 },
  '军工': { mean: 0.0003, std: 0.015 },
  '农业': { mean: 0.0001, std: 0.011 },
  '通信': { mean: 0.0002, std: 0.013 },
  '传媒': { mean: 0.0001, std: 0.020 },
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function normalRandom(rand: () => number): () => number {
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    const u1 = rand();
    const u2 = rand();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    spare = z1;
    return z0;
  };
}

export interface DailyReturn {
  date: string;
  returns: Record<TagName, number>;
}

const TRADING_DAYS = 750;

function generateMarketData(): DailyReturn[] {
  const rand = seededRandom(42);
  const normal = normalRandom(rand);
  const data: DailyReturn[] = [];
  const startDate = new Date('2023-06-19');
  startDate.setDate(startDate.getDate() - Math.ceil(TRADING_DAYS * 1.5));

  let currentDate = new Date(startDate);

  for (let i = 0; i < TRADING_DAYS; i++) {
    while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const marketFactor = normal() * 0.006;

    const returns: Partial<Record<TagName, number>> = {};
    for (const tag of TAGS) {
      const params = TAG_PARAMS[tag];
      const idiosyncratic = normal() * params.std;
      const correlation = 0.4;
      const dailyReturn =
        params.mean +
        correlation * marketFactor +
        Math.sqrt(1 - correlation * correlation) * idiosyncratic;
      returns[tag] = dailyReturn;
    }

    data.push({
      date: currentDate.toISOString().split('T')[0],
      returns: returns as Record<TagName, number>,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return data;
}

export const marketData = generateMarketData();

export const TAG_NAMES: TagName[] = [...TAGS];

export const TAG_COLORS: Record<TagName, string> = {
  '科技': '#6C63FF',
  '消费': '#FF6584',
  '新能源': '#00C9A7',
  '医疗': '#4ECDC4',
  '金融': '#FFD93D',
  '地产': '#C4A35A',
  '军工': '#7B68EE',
  '农业': '#5DADE2',
  '通信': '#BB8FCE',
  '传媒': '#F1948A',
};

export type Scenario = 'normal' | 'bull' | 'bear' | 'blackswan';

export interface ScenarioConfig {
  label: string;
  returnMultiplier: number;
  volatilityMultiplier: number;
}

export const SCENARIOS: Record<Scenario, ScenarioConfig> = {
  normal: { label: '正常市场', returnMultiplier: 1.0, volatilityMultiplier: 1.0 },
  bull: { label: '平稳上涨', returnMultiplier: 2.5, volatilityMultiplier: 0.7 },
  bear: { label: '震荡下跌', returnMultiplier: -1.5, volatilityMultiplier: 1.8 },
  blackswan: { label: '黑天鹅暴跌', returnMultiplier: -3.0, volatilityMultiplier: 3.5 },
};

export type TimePeriod = '1y' | '2y' | '3y';

export const TIME_PERIODS: Record<TimePeriod, { label: string; days: number }> = {
  '1y': { label: '近1年', days: 250 },
  '2y': { label: '近2年', days: 500 },
  '3y': { label: '近3年', days: 750 },
};
