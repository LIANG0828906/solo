import express from 'express';
import cors from 'cors';
import { towns, cargoTypes, risks, terrainData } from './data';
import type { CostCalculationRequest, CostCalculationResponse } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/towns', (_req, res) => {
  res.json(towns);
});

app.get('/api/cargo-types', (_req, res) => {
  res.json(cargoTypes);
});

app.get('/api/risks', (_req, res) => {
  res.json(risks);
});

const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) * 5;
};

const getTerrainAtPoint = (x: number, y: number): string => {
  if (x < 200 && y > 400) return 'desert';
  if (x > 150 && x < 400 && y > 180 && y < 350) return 'oasis';
  if (x > 450 && y < 300) return 'gobi';
  if (x > 500 && y > 350) return 'desert';
  if (x < 150 && y < 200) return 'mountain';
  return 'desert';
};

const calculateTerrainBreakdown = (
  route: Array<{ x: number; y: number }[]>
): Array<{ type: string; distance: number; percentage: number }> => {
  const terrainDistances: Record<string, number> = {};
  let totalDistance = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const start = route[i];
    const end = route[i + 1];
    const segmentDistance = calculateDistance(start.x, start.y, end.x, end.y);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const terrain = getTerrainAtPoint(midX, midY);

    terrainDistances[terrain] = (terrainDistances[terrain] || 0) + segmentDistance;
    totalDistance += segmentDistance;
  }

  return Object.entries(terrainDistances).map(([type, distance]) => ({
    type,
    distance: Math.round(distance),
    percentage: totalDistance > 0 ? (distance / totalDistance) * 100 : 0,
  }));
};

const calculateRiskImpact = (
  routePoints: Array<{ x: number; y: number }>,
  totalDistance: number
): { riskCost: number; riskIndex: number; riskAssessment: string; daysDelay: number; cargoLossPercent: number } => {
  let totalRiskCost = 0;
  let totalRiskProbability = 0;
  let totalDaysDelay = 0;
  let totalCargoLoss = 0;

  for (const risk of risks) {
    let minDistanceToRoute = Infinity;
    for (const point of routePoints) {
      const dist = Math.sqrt(
        Math.pow(point.x - risk.x, 2) + Math.pow(point.y - risk.y, 2)
      );
      minDistanceToRoute = Math.min(minDistanceToRoute, dist);
    }

    if (minDistanceToRoute < risk.radius + 50) {
      const exposureFactor = 1 - minDistanceToRoute / (risk.radius + 50);
      const effectiveProbability = risk.probability * exposureFactor;

      totalRiskCost += risk.impact.cost * effectiveProbability * 3;
      totalRiskProbability += effectiveProbability;
      totalDaysDelay += risk.impact.delay * effectiveProbability;
      totalCargoLoss += risk.impact.cargoLoss * effectiveProbability;
    }
  }

  const riskIndex = Math.min(100, Math.round(totalRiskProbability * 80 + totalDistance / 50));

  let riskAssessment = '';
  if (riskIndex < 30) {
    riskAssessment = '此路线风险较低，沿途较为安全，适合商队通行。';
  } else if (riskIndex < 60) {
    riskAssessment = '此路线存在一定风险，建议增加护卫，备好应急物资。';
  } else {
    riskAssessment = '此路线风险较高，沙暴与马贼出没频繁，需谨慎规划，最好结伴而行。';
  }

  return {
    riskCost: Math.round(totalRiskCost),
    riskIndex,
    riskAssessment,
    daysDelay: Math.ceil(totalDaysDelay),
    cargoLossPercent: Math.min(0.5, totalCargoLoss),
  };
};

app.post('/api/calculate-cost', (req, res) => {
  const { cargo, route, caravanSize } = req.body as CostCalculationRequest;

  if (!cargo || !route || route.length < 2) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  const routePoints = route
    .map((node) => {
      const town = towns.find((t) => t.id === node.townId);
      return town ? { x: town.x, y: town.y } : null;
    })
    .filter(Boolean) as Array<{ x: number; y: number }>;

  let totalDistance = 0;
  let totalDays = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    const start = routePoints[i];
    const end = routePoints[i + 1];
    const distance = calculateDistance(start.x, start.y, end.x, end.y);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const terrain = getTerrainAtPoint(midX, midY);
    const terrainDataEntry = terrainData[terrain] || terrainData.desert;
    const baseSpeed = 30;
    const adjustedSpeed = baseSpeed * terrainDataEntry.speedMultiplier;
    const days = distance / adjustedSpeed;
    totalDistance += distance;
    totalDays += days;
  }

  const terrainBreakdown = calculateTerrainBreakdown(routePoints);
  const riskImpact = calculateRiskImpact(routePoints, totalDistance);
  totalDays += riskImpact.daysDelay;

  const totalWeight = cargo.reduce((sum, c) => sum + c.weight * c.quantity, 0);
  const transportationCost = Math.round(totalDistance * 0.5 * (1 + totalWeight / 100));

  const foodCostPerPersonPerDay = 2;
  const foodCost = Math.round(totalDays * caravanSize * foodCostPerPersonPerDay);

  const laborCostPerPersonPerDay = 5;
  const laborCost = Math.round(totalDays * caravanSize * laborCostPerPersonPerDay);

  const accommodationCost = Math.round((route.length - 1) * 10 * (caravanSize / 10);

  const totalCargoValue = cargo.reduce((sum, c) => {
    const lastTown = towns.find((t) => t.id === route[route.length - 1].townId);
    const modifier = lastTown?.priceModifiers[c.id] || 1;
    return sum + c.basePrice * c.quantity * modifier;
  }, 0);

  const cargoLossAdjustment = 1 - riskImpact.cargoLossPercent;
  const expectedRevenue = Math.round(totalCargoValue * cargoLossAdjustment);

  const totalCost = transportationCost + foodCost + laborCost + accommodationCost + riskImpact.riskCost;

  const expectedProfit = expectedRevenue - totalCost;
  const profitMargin = totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0;

  const ledgerEntries = [
    { category: '收入', description: '货物销售收入', amount: expectedRevenue, type: 'income' as const },
    { category: '支出', description: '骆驼与运输费用', amount: transportationCost, type: 'expense' as const },
    { category: '支出', description: `${caravanSize}人${totalDays}天粮草费用`, amount: foodCost, type: 'expense' as const },
    { category: '支出', description: `${caravanSize}人${totalDays}天人工费用`, amount: laborCost, type: 'expense' as const },
    { category: '支出', description: `${route.length - 1}站住宿费用`, amount: accommodationCost, type: 'expense' as const },
    { category: '支出', description: '风险准备金', amount: riskImpact.riskCost, type: 'expense' as const },
  ];

  const response: CostCalculationResponse = {
    totalDistance: Math.round(totalDistance),
    totalDays: Math.ceil(totalDays),
    transportationCost,
    foodCost,
    laborCost,
    accommodationCost,
    riskCost: riskImpact.riskCost,
    totalCost,
    expectedRevenue,
    expectedProfit,
    profitMargin,
    riskIndex: riskImpact.riskIndex,
    riskAssessment: riskImpact.riskAssessment,
    terrainBreakdown,
    ledgerEntries,
  };

  res.json(response);
});

app.listen(PORT, () => {
  console.log(`黑水城商队账目后端服务已启动: http://localhost:${PORT}`);
  console.log(`API 端点:`);
  console.log(`  GET  /api/towns`);
  console.log(`  GET  /api/cargo-types`);
  console.log(`  GET  /api/risks`);
  console.log(`  POST /api/calculate-cost`);
});
