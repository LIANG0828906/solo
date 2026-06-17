import { eventBridge, ApplicationData, AssessmentResult } from '../EventBridge';

class AssessmentEngine {
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    eventBridge.on('application', (appData) => {
      setTimeout(() => {
        const result = this.assess(appData);
        eventBridge.emit('result', result);
      }, 3000);
    });
  }

  private assess(data: ApplicationData): AssessmentResult {
    let score = 0;

    const maxRevenueForScoring = 500000;
    const revenueRatio = Math.min(data.avgRevenue / maxRevenueForScoring, 1);
    score += Math.round(revenueRatio * 400);

    score += data.hasCollateral ? 250 : 100;

    const identityValid =
      data.name.trim().length >= 2 &&
      /^\d{17}[\dXx]$/.test(data.idNumber.trim()) &&
      /^1\d{10}$/.test(data.phone.trim());
    score += identityValid ? 200 : 80;

    score += data.companyName.trim().length > 0 ? 150 : 50;

    score = Math.min(1000, Math.max(0, score));

    const coefficient = data.hasCollateral ? 5 : 3;
    const estimatedAmount = (score / 1000) * data.avgRevenue * coefficient;
    const amountInWan = estimatedAmount / 10000;

    const riskLevel: AssessmentResult['riskLevel'] =
      score < 400 ? 'high' : score < 700 ? 'medium' : 'low';

    return {
      score,
      estimatedAmount: Math.round(amountInWan * 100) / 100,
      riskLevel,
    };
  }
}

export const assessmentEngine = new AssessmentEngine();
