import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  marketData,
  SCENARIOS,
  TIME_PERIODS,
  type TagName,
  type Scenario,
  type TimePeriod,
} from '../data/marketData';

export interface Portfolio {
  id: number;
  tags: TagName[];
  color: string;
}

export interface RiskMetrics {
  annualizedVolatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  radarData: {
    industryConcentration: number;
    stockConcentration: number;
    volatility: number;
    drawdownDepth: number;
    liquidity: number;
    correlation: number;
  };
}

export interface PortfolioResult {
  portfolio: Portfolio;
  cumulativeReturns: { date: string; value: number }[];
  riskMetrics: RiskMetrics;
}

interface PortfolioContextType {
  portfolios: Portfolio[];
  addPortfolio: (tags: TagName[]) => boolean;
  removePortfolio: (id: number) => void;
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  timePeriod: TimePeriod;
  setTimePeriod: (t: TimePeriod) => void;
  results: PortfolioResult[];
  isLoading: boolean;
}

const PORTFOLIO_COLORS = ['#FF4D4D', '#4A90D9', '#27AE60'];

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function usePortfolioContext(): PortfolioContextType {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolioContext must be used within PortfolioProvider');
  return ctx;
}

function calculateCumulativeReturns(
  tags: TagName[],
  scenario: Scenario,
  timePeriod: TimePeriod
): { date: string; value: number }[] {
  const periodDays = TIME_PERIODS[timePeriod].days;
  const data = marketData.slice(-periodDays);
  const scenarioConfig = SCENARIOS[scenario];

  const allReturns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    let avgReturn = 0;
    for (const tag of tags) {
      avgReturn += data[i].returns[tag];
    }
    avgReturn /= tags.length;
    allReturns.push(avgReturn);
  }
  const meanReturn = allReturns.reduce((a, b) => a + b, 0) / allReturns.length;

  let value = 1000;
  const result: { date: string; value: number }[] = [{ date: data[0].date, value }];

  for (let i = 1; i < data.length; i++) {
    const dayData = data[i];
    let avgReturn = 0;
    for (const tag of tags) {
      avgReturn += dayData.returns[tag];
    }
    avgReturn /= tags.length;

    const deviation = avgReturn - meanReturn;
    const adjustedReturn =
      meanReturn * scenarioConfig.returnMultiplier +
      deviation * scenarioConfig.volatilityMultiplier;

    value = value * (1 + adjustedReturn);
    result.push({ date: dayData.date, value });
  }

  return result;
}

function calculateRiskMetrics(
  tags: TagName[],
  cumulativeReturns: { date: string; value: number }[]
): RiskMetrics {
  const values = cumulativeReturns.map((d) => d.value);
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    returns.push((values[i] - values[i - 1]) / values[i - 1]);
  }

  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + (b - meanReturn) ** 2, 0) / (returns.length - 1);
  const dailyVol = Math.sqrt(variance);
  const annualizedVolatility = dailyVol * Math.sqrt(252);

  let maxDrawdown = 0;
  let peak = values[0];
  for (const v of values) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const riskFreeDaily = Math.pow(1.02, 1 / 252) - 1;
  const excessReturns = returns.map((r) => r - riskFreeDaily);
  const meanExcess = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
  const sharpeRatio = dailyVol > 0 ? (meanExcess / dailyVol) * Math.sqrt(252) : 0;

  const volScore = Math.max(0, 100 - annualizedVolatility * 300);
  const ddScore = Math.max(0, 100 - maxDrawdown * 200);
  const sharpeScore = Math.min(100, Math.max(0, (sharpeRatio + 1) * 50));
  const riskScore = volScore * 0.3 + ddScore * 0.4 + sharpeScore * 0.3;

  const tagCount = tags.length;
  const industryConcentration = Math.max(0, 100 - (tagCount / 10) * 100);
  const stockConcentration = Math.max(0, 100 - (tagCount / 6) * 80);
  const volatility = Math.min(100, annualizedVolatility * 500);
  const drawdownDepth = Math.min(100, maxDrawdown * 200);
  const liquidity = Math.min(100, tagCount * 15 + 20);
  const correlation = Math.max(0, 60 - tagCount * 8);

  let riskLevel: 'low' | 'medium' | 'high';
  if (riskScore >= 60) riskLevel = 'low';
  else if (riskScore >= 30) riskLevel = 'medium';
  else riskLevel = 'high';

  return {
    annualizedVolatility,
    maxDrawdown,
    sharpeRatio,
    riskScore: Math.round(riskScore),
    riskLevel,
    radarData: {
      industryConcentration: Math.round(industryConcentration),
      stockConcentration: Math.round(stockConcentration),
      volatility: Math.round(volatility),
      drawdownDepth: Math.round(drawdownDepth),
      liquidity: Math.round(liquidity),
      correlation: Math.round(correlation),
    },
  };
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('3y');
  const [results, setResults] = useState<PortfolioResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsLoading(true);
    timerRef.current = setTimeout(() => {
      const newResults = portfolios.map((portfolio) => {
        const cumulativeReturns = calculateCumulativeReturns(portfolio.tags, scenario, timePeriod);
        const riskMetrics = calculateRiskMetrics(portfolio.tags, cumulativeReturns);
        return { portfolio, cumulativeReturns, riskMetrics };
      });
      setResults(newResults);
      setIsLoading(false);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [portfolios, scenario, timePeriod]);

  const addPortfolio = useCallback(
    (tags: TagName[]): boolean => {
      if (portfolios.length >= 3) return false;
      if (tags.length < 3 || tags.length > 6) return false;
      const id = Date.now();
      const color = PORTFOLIO_COLORS[portfolios.length % 3];
      setPortfolios((prev) => [...prev, { id, tags, color }]);
      return true;
    },
    [portfolios.length]
  );

  const removePortfolio = useCallback((id: number) => {
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <PortfolioContext.Provider
      value={{
        portfolios,
        addPortfolio,
        removePortfolio,
        scenario,
        setScenario,
        timePeriod,
        setTimePeriod,
        results,
        isLoading,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}
