import {
  EvaluationDimension,
  DimensionScore,
  EvaluationResult,
  IndicatorScore,
} from '../shared/types';

interface CalculateInput {
  taskId: string;
  cycleId: string;
  cycleName: string;
  evaluateeId: string;
  evaluateeName: string;
  dimensions: EvaluationDimension[];
  scores: Record<string, number>;
}

export function calculate(input: CalculateInput): EvaluationResult {
  const dimensionScores: DimensionScore[] = input.dimensions.map((dim) => {
    const indicatorScores: IndicatorScore[] = dim.indicators.map((ind) => ({
      indicatorId: ind.id,
      indicatorName: ind.name,
      score: input.scores[ind.id] || 0,
      weight: ind.weight,
    }));

    const totalWeight = indicatorScores.reduce((sum, i) => sum + i.weight, 0);
    const weightedSum = indicatorScores.reduce(
      (sum, i) => sum + i.score * i.weight,
      0
    );
    const averageScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      dimensionId: dim.id,
      dimensionName: dim.name,
      averageScore: Math.round(averageScore * 100) / 100,
      indicators: indicatorScores,
    };
  });

  const allIndicators = input.dimensions.flatMap((d) => d.indicators);
  const totalWeight = allIndicators.reduce((sum, i) => sum + i.weight, 0);
  const weightedSum = allIndicators.reduce(
    (sum, i) => sum + (input.scores[i.id] || 0) * i.weight,
    0
  );
  const totalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return {
    taskId: input.taskId,
    cycleId: input.cycleId,
    cycleName: input.cycleName,
    evaluateeId: input.evaluateeId,
    evaluateeName: input.evaluateeName,
    totalScore: Math.round(totalScore * 100) / 100,
    dimensions: dimensionScores,
    submittedAt: new Date().toISOString(),
  };
}
