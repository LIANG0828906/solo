import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface FactorWeights {
  momentum: number;
  value: number;
  volatility: number;
}

interface Strategy {
  id: string;
  name: string;
  benchmark: string;
  targets: string[];
  factorWeights: FactorWeights;
  favorite: boolean;
  createdAt: number;
}

interface BacktestRequest {
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
}

interface BacktestResult {
  id: string;
  strategyId: string;
  strategyName: string;
  annualReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  tradeCount: number;
  totalReturn: number;
  finalCapital: number;
  history: { date: string; value: number }[];
}

const availableTargets = [
  '贵州茅台',
  '招商银行',
  '宁德时代',
  '中国平安',
  '比亚迪',
  '隆基绿能',
  '药明康德',
  '海康威视',
];

const availableBenchmarks = ['沪深300', '中证500', '创业板指', '上证50'];

const strategies: Strategy[] = [
  {
    id: uuidv4(),
    name: '价值成长混合策略',
    benchmark: '沪深300',
    targets: ['贵州茅台', '招商银行', '中国平安', '宁德时代', '比亚迪'],
    factorWeights: { momentum: 0.3, value: 0.4, volatility: 0.3 },
    favorite: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: uuidv4(),
    name: '动量先锋策略',
    benchmark: '创业板指',
    targets: ['宁德时代', '比亚迪', '隆基绿能', '药明康德', '海康威视'],
    factorWeights: { momentum: 0.6, value: 0.2, volatility: 0.2 },
    favorite: false,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: uuidv4(),
    name: '低波动稳健策略',
    benchmark: '上证50',
    targets: ['贵州茅台', '招商银行', '中国平安', '药明康德', '海康威视'],
    factorWeights: { momentum: 0.2, value: 0.3, volatility: 0.5 },
    favorite: false,
    createdAt: Date.now() - 86400000 * 1,
  },
];

const backtestResults = new Map<string, BacktestResult>();

function generateBacktestData(
  strategy: Strategy,
  startDate: string,
  endDate: string,
  initialCapital: number
): BacktestResult {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  const months = days / 30;
  const years = days / 365;

  const { momentum, value, volatility } = strategy.factorWeights;
  const baseReturn = 0.08 + momentum * 0.15 + value * 0.1 - volatility * 0.05;
  const randomFactor = (Math.random() - 0.3) * 0.05;
  const annualReturn = (baseReturn + randomFactor) * 100;

  const totalReturn = annualReturn * years;
  const finalCapital = initialCapital * (1 + totalReturn / 100);

  const maxDrawdown = (20 + volatility * 15 + Math.random() * 10) * (value > 0.5 ? 0.8 : 1);
  const sharpeRatio = (annualReturn - 3) / (15 + volatility * 10);
  const winRate = 45 + momentum * 20 + value * 10 + Math.random() * 10;
  const tradeCount = Math.floor(12 * years * (0.5 + momentum * 2));

  const history: { date: string; value: number }[] = [];
  let currentValue = initialCapital;
  const monthlyReturn = totalReturn / months;

  for (let i = 0; i <= months; i++) {
    const date = new Date(start + i * 30 * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const noise = (Math.random() - 0.5) * initialCapital * 0.05;
    currentValue = initialCapital * (1 + (monthlyReturn * i) / 100) + noise;
    history.push({ date: dateStr, value: Math.max(currentValue, initialCapital * 0.5) });
  }

  const resultId = uuidv4();
  const result: BacktestResult = {
    id: resultId,
    strategyId: strategy.id,
    strategyName: strategy.name,
    annualReturn: parseFloat(annualReturn.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    winRate: parseFloat(Math.min(winRate, 95).toFixed(2)),
    tradeCount,
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    finalCapital: parseFloat(finalCapital.toFixed(2)),
    history,
  };

  backtestResults.set(strategy.id, result);
  return result;
}

app.get('/api/strategies', (req, res) => {
  const sorted = [...strategies].sort((a, b) => {
    if (a.favorite !== b.favorite) return b.favorite ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
  res.json(sorted);
});

app.post('/api/strategies', (req, res) => {
  const { name, benchmark, targets, factorWeights } = req.body;

  if (!name || !benchmark || !targets || targets.length === 0 || !factorWeights) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const totalWeight = factorWeights.momentum + factorWeights.value + factorWeights.volatility;
  if (Math.abs(totalWeight - 1) > 0.01) {
    return res.status(400).json({ error: '因子权重之和必须为1' });
  }

  const newStrategy: Strategy = {
    id: uuidv4(),
    name,
    benchmark,
    targets,
    factorWeights,
    favorite: false,
    createdAt: Date.now(),
  };

  strategies.push(newStrategy);
  res.status(201).json(newStrategy);
});

app.put('/api/strategies/:id/favorite', (req, res) => {
  const { id } = req.params;
  const strategy = strategies.find((s) => s.id === id);

  if (!strategy) {
    return res.status(404).json({ error: '策略不存在' });
  }

  const favoriteCount = strategies.filter((s) => s.favorite).length;

  if (!strategy.favorite && favoriteCount >= 8) {
    return res.status(400).json({ error: '最多只能收藏8个策略' });
  }

  strategy.favorite = !strategy.favorite;
  res.json(strategy);
});

app.delete('/api/strategies/:id', (req, res) => {
  const { id } = req.params;
  const index = strategies.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '策略不存在' });
  }

  strategies.splice(index, 1);
  backtestResults.delete(id);
  res.status(204).send();
});

app.post('/api/backtest', (req, res) => {
  const { strategyId, startDate, endDate, initialCapital } = req.body as BacktestRequest;

  if (!strategyId || !startDate || !endDate || !initialCapital) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const strategy = strategies.find((s) => s.id === strategyId);

  if (!strategy) {
    return res.status(404).json({ error: '策略不存在' });
  }

  setTimeout(() => {
    const result = generateBacktestData(strategy, startDate, endDate, initialCapital);
    res.json(result);
  }, 200 + Math.random() * 300);
});

app.get('/api/backtest/:strategyId', (req, res) => {
  const { strategyId } = req.params;
  const result = backtestResults.get(strategyId);

  if (!result) {
    return res.status(404).json({ error: '回测结果不存在' });
  }

  res.json(result);
});

app.get('/api/targets', (req, res) => {
  res.json(availableTargets);
});

app.get('/api/benchmarks', (req, res) => {
  res.json(availableBenchmarks);
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
