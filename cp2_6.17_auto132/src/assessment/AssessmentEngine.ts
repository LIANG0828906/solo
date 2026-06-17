import EventBridge from '../EventBridge';
import type { ApplicationData, AssessmentResult } from '../types';

export function calculateScore(data: ApplicationData): number {
  let score = 300;

  if (data.name && data.name.length >= 2) {
    score += 30;
  }

  const idCardRegex = /^\d{17}[\dXx]$/;
  if (idCardRegex.test(data.idCard)) {
    score += 80;
  }

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (phoneRegex.test(data.phone)) {
    score += 60;
  }

  if (data.companyName && data.companyName.length >= 2) {
    score += 50;
  }

  const revenue = Number(data.avgRevenue);
  if (revenue >= 500000) {
    score += 200;
  } else if (revenue >= 200000) {
    score += 150;
  } else if (revenue >= 100000) {
    score += 100;
  } else if (revenue >= 50000) {
    score += 50;
  } else if (revenue >= 10000) {
    score += 20;
  }

  if (data.hasCollateral) {
    score += 180;
  }

  return Math.min(1000, Math.max(0, score));
}

export function calculateRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 700) return 'low';
  if (score >= 400) return 'medium';
  return 'high';
}

export function calculateEstimatedAmount(score: number, revenue: number, hasCollateral: boolean): number {
  let baseAmount = revenue * 0.3;

  let multiplier = 0.5;
  if (score >= 850) multiplier = 3.0;
  else if (score >= 700) multiplier = 2.0;
  else if (score >= 550) multiplier = 1.2;
  else if (score >= 400) multiplier = 0.8;

  if (hasCollateral) {
    multiplier *= 1.5;
  }

  const amount = baseAmount * multiplier;
  return Math.max(0.5, Math.round(amount / 10000 * 100) / 100);
}

EventBridge.on('application:submitted', (data) => {
  const appData = data as ApplicationData;

  setTimeout(() => {
    const score = calculateScore(appData);
    const riskLevel = calculateRiskLevel(score);
    const estimatedAmount = calculateEstimatedAmount(score, Number(appData.avgRevenue), appData.hasCollateral);

    const result: AssessmentResult = {
      applicationId: appData.id,
      score,
      estimatedAmount,
      riskLevel
    };

    EventBridge.emit('assessment:result', result);
  }, 3000);
});
