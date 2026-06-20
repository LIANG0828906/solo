import { TechDebtItem, HealthScore, SeverityLevel } from '@/types';

const severityWeights: Record<SeverityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function calculateHealthScore(items: TechDebtItem[]): HealthScore {
  const activeItems = items.filter((item) => item.status !== 'completed');

  const breakdown = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  let totalPenalty = 0;

  activeItems.forEach((item) => {
    breakdown[item.severity]++;
    const weight = severityWeights[item.severity];
    const normalizedHours = item.estimatedHours / 40;
    totalPenalty += weight * normalizedHours;
  });

  const score = Math.max(0, Math.min(100, 100 - totalPenalty));
  const roundedScore = Math.round(score);

  let comment: string;
  if (roundedScore >= 90) {
    comment = '项目状态良好，技术债务可控';
  } else if (roundedScore >= 70) {
    comment = '存在少量技术债务，建议关注';
  } else if (roundedScore >= 40) {
    comment = '技术债务较多，建议制定清理计划';
  } else {
    comment = '债务风险高，需本周复盘';
  }

  return {
    score: roundedScore,
    comment,
    breakdown,
  };
}
