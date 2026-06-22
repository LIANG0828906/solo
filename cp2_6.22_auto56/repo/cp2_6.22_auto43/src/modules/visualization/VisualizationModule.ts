import type { 
  DailyEmotionSummary, 
  EmotionRecord, 
  EmotionType, 
  MoodTrend, 
  Suggestion 
} from '../shared/types';
import { emotionConfigs } from '../tracker/TrackerModule';
import { storageService, formatDate } from '../shared/storageService';
import { v4 as uuidv4 } from 'uuid';

function getEmotionIntensity(emotion: EmotionType): number {
  return emotionConfigs[emotion].intensity;
}

export function filterRecordsByEmotion(
  records: EmotionRecord[], 
  emotion: EmotionType | null
): EmotionRecord[] {
  if (!emotion) return records;
  return records.filter(r => r.emotion === emotion);
}

export async function getDailySummaries(
  year: number, 
  month: number
): Promise<DailyEmotionSummary[]> {
  const records = await storageService.getRecordsByMonth(year, month);
  const summariesMap = new Map<string, EmotionRecord[]>();

  records.forEach(record => {
    const existing = summariesMap.get(record.date) || [];
    existing.push(record);
    summariesMap.set(record.date, existing);
  });

  const summaries: DailyEmotionSummary[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(new Date(year, month, day));
    const dayRecords = summariesMap.get(date) || [];
    
    if (dayRecords.length > 0) {
      const totalIntensity = dayRecords.reduce(
        (sum, r) => sum + getEmotionIntensity(r.emotion), 
        0
      );
      const avgIntensity = totalIntensity / dayRecords.length;
      
      const emotionCounts = dayRecords.reduce((counts, r) => {
        counts[r.emotion] = (counts[r.emotion] || 0) + 1;
        return counts;
      }, {} as Record<EmotionType, number>);
      
      const dominantEmotion = Object.entries(emotionCounts).sort(
        (a, b) => b[1] - a[1]
      )[0][0] as EmotionType;

      summaries.push({
        date,
        avgIntensity,
        records: dayRecords,
        dominantEmotion
      });
    } else {
      summaries.push({
        date,
        avgIntensity: 0,
        records: [],
        dominantEmotion: 'calm'
      });
    }
  }

  return summaries;
}

export async function getMoodTrends(days: number): Promise<MoodTrend[]> {
  const records = await storageService.getRecentRecords(days);
  const trendsMap = new Map<string, EmotionRecord[]>();

  records.forEach(record => {
    const existing = trendsMap.get(record.date) || [];
    existing.push(record);
    trendsMap.set(record.date, existing);
  });

  const trends: MoodTrend[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const dayRecords = trendsMap.get(dateStr) || [];

    const emotionCounts: Record<EmotionType, number> = {
      happy: 0, sad: 0, angry: 0, calm: 0, anxious: 0, surprised: 0
    };

    dayRecords.forEach(r => {
      emotionCounts[r.emotion]++;
    });

    const avgIntensity = dayRecords.length > 0
      ? dayRecords.reduce((sum, r) => sum + getEmotionIntensity(r.emotion), 0) / dayRecords.length
      : 5;

    trends.push({
      date: dateStr,
      avgIntensity,
      emotionCounts
    });
  }

  return trends;
}

export function generateSuggestions(records: EmotionRecord[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  const uniqueDates = new Set(records.map(r => r.date));
  const hasEnoughData = uniqueDates.size >= 7;

  if (!hasEnoughData) {
    return [
      {
        id: uuidv4(),
        title: '记录更多情绪数据',
        description: '为了获得更个性化的建议，请继续记录您的情绪。建议连续记录7天以上，以便系统更准确地分析您的情绪模式。',
        icon: '📊',
        category: 'activity'
      },
      {
        id: uuidv4(),
        title: '建立情绪习惯',
        description: '尝试每天固定时间记录情绪，比如早晨起床后或晚上入睡前。规律的记录能带来更有价值的洞察。',
        icon: '⏰',
        category: 'reflection'
      },
      {
        id: uuidv4(),
        title: '探索情绪标签',
        description: '使用标签来分类您的情绪来源，是工作压力？家庭关系？还是健康问题？这能帮助您发现情绪触发点。',
        icon: '🏷️',
        category: 'reflection'
      }
    ];
  }

  const emotionCounts = records.reduce((counts, r) => {
    counts[r.emotion] = (counts[r.emotion] || 0) + 1;
    return counts;
  }, {} as Record<EmotionType, number>);

  const totalRecords = records.length;
  const anxiousRatio = (emotionCounts.anxious || 0) / totalRecords;
  const sadRatio = (emotionCounts.sad || 0) / totalRecords;
  const angryRatio = (emotionCounts.angry || 0) / totalRecords;
  const happyRatio = (emotionCounts.happy || 0) / totalRecords;
  const calmRatio = (emotionCounts.calm || 0) / totalRecords;
  const surprisedRatio = (emotionCounts.surprised || 0) / totalRecords;

  const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);
  const dailyIntensities = new Map<string, number[]>();
  sortedRecords.forEach(r => {
    const existing = dailyIntensities.get(r.date) || [];
    existing.push(emotionConfigs[r.emotion].intensity);
    dailyIntensities.set(r.date, existing);
  });

  const dailyAvgs = Array.from(dailyIntensities.values()).map(
    arr => arr.reduce((a, b) => a + b, 0) / arr.length
  );
  
  let fluctuationSum = 0;
  for (let i = 1; i < dailyAvgs.length; i++) {
    fluctuationSum += Math.abs(dailyAvgs[i] - dailyAvgs[i - 1]);
  }
  const fluctuation = dailyAvgs.length > 1 ? fluctuationSum / (dailyAvgs.length - 1) : 0;

  const negativeRatio = sadRatio + angryRatio + anxiousRatio;
  const lowIntensityCount = dailyAvgs.filter(avg => avg < 5).length;
  const consecutiveLow = lowIntensityCount >= 3;

  if (consecutiveLow || sadRatio > 0.35) {
    suggestions.push({
      id: uuidv4(),
      title: '建议尝试户外活动或与朋友交流',
      description: '您近期情绪持续低落，建议多到户外走走，晒晒太阳。试着联系一位好久不见的朋友聊聊天，或者参加一些轻松的社交活动。',
      icon: '🌳',
      category: 'activity'
    });
  } else if (fluctuation > 3 || surprisedRatio > 0.25) {
    suggestions.push({
      id: uuidv4(),
      title: '尝试冥想或深呼吸练习',
      description: '您的情绪波动较大，建议每天进行10分钟冥想或深呼吸练习。这有助于稳定情绪，提高情绪调节能力。',
      icon: '🧘',
      category: 'relaxation'
    });
  } else if (anxiousRatio > 0.3) {
    suggestions.push({
      id: uuidv4(),
      title: '渐进式肌肉放松',
      description: '您近期焦虑情绪较多，试试渐进式肌肉放松：从脚趾开始，依次绷紧和放松每个肌肉群，直到头部。每天练习15分钟。',
      icon: '�',
      category: 'relaxation'
    });
  } else if (angryRatio > 0.25) {
    suggestions.push({
      id: uuidv4(),
      title: '情绪日记写作',
      description: '当感到愤怒时，尝试写下来：是什么触发了情绪？身体有什么感受？想做出什么反应？书写能帮助您从情绪中抽离。',
      icon: '📝',
      category: 'reflection'
    });
  } else if (happyRatio > 0.4) {
    suggestions.push({
      id: uuidv4(),
      title: '延续快乐时光',
      description: '您近期心情很好！尝试记录下是什么让您感到快乐，将这些积极的活动融入日常生活中，与他人分享您的快乐。',
      icon: '🎉',
      category: 'activity'
    });
  } else if (calmRatio > 0.4) {
    suggestions.push({
      id: uuidv4(),
      title: '保持内心平静',
      description: '您的情绪状态很稳定！可以尝试将这种平静的状态延伸到更多生活场景，比如工作会议或家庭沟通中。',
      icon: '🌊',
      category: 'reflection'
    });
  } else {
    suggestions.push({
      id: uuidv4(),
      title: '探索情绪深层原因',
      description: '尝试在记录情绪时多写一些细节：当时发生了什么？您想到了什么？身体有什么感受？这有助于深入理解自己的情绪模式。',
      icon: '�',
      category: 'reflection'
    });
  }

  if (negativeRatio > 0.5) {
    suggestions.push({
      id: uuidv4(),
      title: '培养积极思维',
      description: '每天结束时，写下3件当天顺利或美好的事情，即使很小。积极心理学研究表明，这个练习能有效改善长期情绪状态。',
      icon: '✨',
      category: 'reflection'
    });
  } else {
    suggestions.push({
      id: uuidv4(),
      title: '保持规律作息',
      description: '规律的睡眠和饮食对情绪稳定非常重要。建议保持固定的起床和睡觉时间，均衡饮食，适量饮水。',
      icon: '😴',
      category: 'activity'
    });
  }

  suggestions.push({
    id: uuidv4(),
    title: '轻度运动释放',
    description: '每天进行15-30分钟的轻度运动，如散步、瑜伽或伸展。运动能有效改善情绪，释放压力激素。',
    icon: '🏃',
    category: 'activity'
  });

  return suggestions.slice(0, 3);
}

export const visualizationModule = {
  getDailySummaries,
  getMoodTrends,
  generateSuggestions,
  filterRecordsByEmotion
};
