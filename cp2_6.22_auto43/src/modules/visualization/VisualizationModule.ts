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
  
  if (records.length === 0) {
    return [
      {
        id: uuidv4(),
        title: '开始记录心情',
        description: '记录您的第一条情绪，开启自我觉察之旅。每天只需几分钟，了解自己的情绪模式。',
        icon: '🌟',
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

  if (anxiousRatio > 0.3) {
    suggestions.push({
      id: uuidv4(),
      title: '尝试冥想放松',
      description: '您近期焦虑情绪较多，试试每天花5分钟进行深呼吸冥想。找一个安静的地方，专注于呼吸的节奏。',
      icon: '🧘',
      category: 'relaxation'
    });
  } else if (sadRatio > 0.3) {
    suggestions.push({
      id: uuidv4(),
      title: '记录感恩小事',
      description: '情绪低落时，试着写下今天发生的3件值得感恩的小事。即使是阳光、一杯热茶这样的小事也可以。',
      icon: '🙏',
      category: 'reflection'
    });
  } else if (angryRatio > 0.2) {
    suggestions.push({
      id: uuidv4(),
      title: '情绪暂停技巧',
      description: '感到愤怒时，尝试6秒暂停法：深呼吸6次，或者离开当前环境10分钟。这能帮助您从情绪脑切换到理性脑。',
      icon: '⏸️',
      category: 'relaxation'
    });
  } else if (happyRatio > 0.4) {
    suggestions.push({
      id: uuidv4(),
      title: '延续快乐时光',
      description: '您近期心情很好！尝试记录下是什么让您感到快乐，将这些积极的活动融入日常生活中。',
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
      title: '情绪日记写作',
      description: '尝试在记录情绪时多写一些细节，不仅记录感受，也记录当时的情境和您的反应。这有助于自我理解。',
      icon: '📝',
      category: 'reflection'
    });
  }

  suggestions.push({
    id: uuidv4(),
    title: '轻度运动释放',
    description: '每天进行15-30分钟的轻度运动，如散步、瑜伽或伸展。运动能有效改善情绪，释放压力激素。',
    icon: '🏃',
    category: 'activity'
  });

  suggestions.push({
    id: uuidv4(),
    title: '建立社交连接',
    description: '主动与朋友或家人交流，分享您的感受。良好的社会支持是情绪健康的重要保障。',
    icon: '👥',
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
