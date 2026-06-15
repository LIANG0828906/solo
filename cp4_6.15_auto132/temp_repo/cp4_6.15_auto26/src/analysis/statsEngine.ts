import { EmotionRecord, DailyStats, StatsResult } from '@/shared/types';
import { hexToHSL, isWarmColor } from '@/color/emotionMap';

export function computeDailyStats(records: EmotionRecord[], dateRange: string[]): DailyStats[] {
  return dateRange.map(date => {
    const dayRecords = records.filter(r => r.date === date);
    const emotions = dayRecords.map(r => r.emotion);
    const uniqueEmotions = [...new Set(emotions)];
    const avgIntensity = dayRecords.length > 0
      ? Math.round(dayRecords.reduce((sum, r) => sum + r.intensity, 0) / dayRecords.length)
      : 0;

    return {
      date,
      intensity: avgIntensity,
      diversity: uniqueEmotions.length,
      emotions: uniqueEmotions,
      records: dayRecords,
    };
  });
}

export function computeStats(records: EmotionRecord[], dateRange: string[]): StatsResult {
  const dailyStats = computeDailyStats(records, dateRange);
  const daysWithRecords = dailyStats.filter(d => d.records.length > 0);

  if (daysWithRecords.length === 0) {
    return {
      averageIntensity: 0,
      dominantEmotion: '无数据',
      emotionDistribution: {},
      diversityScore: 0,
      trendDirection: 'stable',
      warmRatio: 0,
      peakDay: '',
      peakIntensity: 0,
    };
  }

  const emotionCount: Record<string, number> = {};
  let warmCount = 0;
  let totalIntensity = 0;
  let peakIntensity = 0;
  let peakDay = '';

  daysWithRecords.forEach(d => {
    totalIntensity += d.intensity;
    if (d.intensity > peakIntensity) {
      peakIntensity = d.intensity;
      peakDay = d.date;
    }
    d.emotions.forEach(e => {
      emotionCount[e] = (emotionCount[e] || 0) + 1;
    });
  });

  records.forEach(r => {
    if (dateRange.includes(r.date) && isWarmColor(r.color)) {
      warmCount++;
    }
  });

  const dominantEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '无数据';
  const allEmotions = daysWithRecords.flatMap(d => d.emotions);
  const diversityScore = new Set(allEmotions).size;

  const firstHalf = daysWithRecords.slice(0, Math.floor(daysWithRecords.length / 2));
  const secondHalf = daysWithRecords.slice(Math.floor(daysWithRecords.length / 2));
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, d) => s + d.intensity, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, d) => s + d.intensity, 0) / secondHalf.length : 0;

  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  if (secondAvg - firstAvg > 5) trendDirection = 'up';
  else if (firstAvg - secondAvg > 5) trendDirection = 'down';

  return {
    averageIntensity: Math.round(totalIntensity / daysWithRecords.length),
    dominantEmotion,
    emotionDistribution: emotionCount,
    diversityScore,
    trendDirection,
    warmRatio: records.length > 0 ? Math.round((warmCount / records.length) * 100) : 0,
    peakDay,
    peakIntensity,
  };
}

export function movingAverage(data: number[], windowSize: number): number[] {
  return data.map((_, i) => {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
    const slice = data.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export function generateSummary(stats: StatsResult, viewMode: 'week' | 'month'): string {
  const period = viewMode === 'week' ? '本周' : '本月';
  const trendText = stats.trendDirection === 'up' ? '呈上升趋势' :
    stats.trendDirection === 'down' ? '呈下降趋势' : '相对稳定';

  let summary = `${period}你的情绪以${stats.warmRatio > 50 ? '暖色调' : '冷色调'}为主，`;
  summary += `主导情绪为"${stats.dominantEmotion}"，`;
  summary += `平均情绪强度为${stats.averageIntensity}%，`;
  summary += `整体${trendText}。`;

  if (stats.peakDay) {
    const peakDate = stats.peakDay.slice(5).replace('-', '月') + '日';
    summary += `${peakDate}情绪强度达到峰值${stats.peakIntensity}%。`;
  }

  if (stats.diversityScore >= 4) {
    summary += `情绪多样性较高，共体验了${stats.diversityScore}种不同情绪。`;
  } else if (stats.diversityScore <= 1) {
    summary += `情绪较为单一，建议尝试新事物丰富情感体验。`;
  }

  return summary;
}
