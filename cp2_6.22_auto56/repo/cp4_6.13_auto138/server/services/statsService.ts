import { feedbackRepository } from '../repositories/feedbackRepository.js';
import { surveyRepository } from '../repositories/surveyRepository.js';
import type { SurveyStats } from '../types.js';

function generateHourBuckets(hours: number): Array<{ hour: string; count: number }> {
  const buckets: Array<{ hour: string; count: number }> = [];
  const now = new Date();

  for (let i = hours - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000);
    date.setMinutes(0, 0, 0);
    const hourStr = date.toISOString().replace('T', ' ').substring(0, 19);
    buckets.push({ hour: hourStr, count: 0 });
  }

  return buckets;
}

export const statsService = {
  getSurveyStats(surveyId: string): SurveyStats {
    const survey = surveyRepository.findById(surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    const totalFeedbacks = feedbackRepository.countBySurveyId(surveyId);
    const averageRating = feedbackRepository.getAverageScoreBySurveyId(surveyId);
    const hourlyCounts = feedbackRepository.getHourlyCounts(surveyId, 24);

    const hourlyData = generateHourBuckets(24);
    const countMap = new Map<string, number>();

    for (const hc of hourlyCounts) {
      const key = hc.hour.substring(0, 13) + ':00:00';
      countMap.set(key, hc.count);
    }

    for (const bucket of hourlyData) {
      const key = bucket.hour.substring(0, 13) + ':00:00';
      if (countMap.has(key)) {
        bucket.count = countMap.get(key)!;
      }
    }

    return {
      totalFeedbacks,
      averageRating: Math.round(averageRating * 100) / 100,
      hourlyData,
    };
  },
};
