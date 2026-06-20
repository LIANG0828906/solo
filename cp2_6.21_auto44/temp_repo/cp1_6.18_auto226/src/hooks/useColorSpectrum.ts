export type MoodType = 'happy' | 'sad' | 'angry' | 'calm' | 'anxious' | 'surprised';

export interface MoodColor {
  primary: string;
  complement: string;
  hsl: { h: number; s: number; l: number };
  hslComplement: { h: number; s: number; l: number };
}

export interface MoodRecord {
  id: string;
  mood: MoodType;
  time: string;
  content: string;
  title: string;
  starred: boolean;
}

export interface DayData {
  date: string;
  dayLabel: string;
  records: MoodRecord[];
  avgColor: string;
  dominantMood: MoodType;
}

const MOOD_COLORS: Record<MoodType, MoodColor> = {
  happy: {
    primary: '#FFD93D',
    complement: '#FFE88A',
    hsl: { h: 47, s: 100, l: 62 },
    hslComplement: { h: 47, s: 100, l: 76 },
  },
  sad: {
    primary: '#4A90D9',
    complement: '#7AB3EF',
    hsl: { h: 213, s: 64, l: 57 },
    hslComplement: { h: 213, s: 76, l: 71 },
  },
  angry: {
    primary: '#FF6B6B',
    complement: '#FF9E9E',
    hsl: { h: 0, s: 100, l: 71 },
    hslComplement: { h: 0, s: 100, l: 81 },
  },
  calm: {
    primary: '#6BCB77',
    complement: '#9DE0A6',
    hsl: { h: 128, s: 50, l: 61 },
    hslComplement: { h: 128, s: 56, l: 75 },
  },
  anxious: {
    primary: '#A66CFF',
    complement: '#C9A4FF',
    hsl: { h: 267, s: 100, l: 71 },
    hslComplement: { h: 267, s: 100, l: 82 },
  },
  surprised: {
    primary: '#F4A460',
    complement: '#F7C08A',
    hsl: { h: 27, s: 87, l: 67 },
    hslComplement: { h: 27, s: 87, l: 75 },
  },
};

const MOOD_LABELS: Record<MoodType, string> = {
  happy: '快乐',
  sad: '悲伤',
  angry: '愤怒',
  calm: '平静',
  anxious: '焦虑',
  surprised: '惊讶',
};

const SAMPLE_CONTENTS: string[] = [
  '今天阳光正好，心情不错',
  '和朋友聊了很久，感觉轻松了许多',
  '工作压力有点大，需要好好休息',
  '读了一本好书，收获满满',
  '下雨天窝在家里，特别安静',
  '遇到了一些挫折，但还在坚持',
  '尝试了新的餐厅，味道惊喜',
  '运动后出了一身汗，很舒服',
  '看了一部感人的电影，眼眶湿润',
  '今天效率很高，完成了所有任务',
  '和家人的视频通话，温暖又安心',
  '失眠了，翻来覆去睡不着',
  '收到了意外的好消息，开心',
  '交通堵塞让人烦躁不堪',
  '在公园散步，感受自然的宁静',
  '做了一个有趣的梦，醒来还在笑',
  '考试结果不太理想，有点失落',
  '学了一项新技能，很有成就感',
  '今天什么都提不起劲来',
  '突如其来的暴雨打乱了计划',
];

const SAMPLE_TITLES: string[] = [
  '阳光灿烂',
  '友情时光',
  '压力山大',
  '阅读收获',
  '雨中静谧',
  '坚持前行',
  '美食探索',
  '运动畅快',
  '光影感动',
  '高效一日',
  '家人关怀',
  '辗转难眠',
  '意外之喜',
  '堵车烦恼',
  '自然漫步',
  '奇妙梦境',
  '成绩失落',
  '技能解锁',
  '低沉时刻',
  '计划打乱',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const MOOD_TYPES: MoodType[] = ['happy', 'sad', 'angry', 'calm', 'anxious', 'surprised'];

function generateWeekData(): DayData[] {
  const rand = seededRandom(20240618);
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const weekData: DayData[] = [];

  for (let i = 0; i < 7; i++) {
    const recordCount = Math.floor(rand() * 4) + 3;
    const records: MoodRecord[] = [];
    const moodCounts: Record<MoodType, number> = {
      happy: 0, sad: 0, angry: 0, calm: 0, anxious: 0, surprised: 0,
    };

    const usedHours = new Set<number>();
    for (let j = 0; j < recordCount; j++) {
      const mood = MOOD_TYPES[Math.floor(rand() * MOOD_TYPES.length)];
      moodCounts[mood]++;

      let hour: number;
      do {
        hour = Math.floor(rand() * 16) + 6;
      } while (usedHours.has(hour));
      usedHours.add(hour);

      const minute = Math.floor(rand() * 4) * 15;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const contentIdx = Math.floor(rand() * SAMPLE_CONTENTS.length);
      const titleIdx = Math.floor(rand() * SAMPLE_TITLES.length);

      records.push({
        id: `day${i}-rec${j}`,
        mood,
        time: timeStr,
        content: SAMPLE_CONTENTS[contentIdx],
        title: SAMPLE_TITLES[titleIdx],
        starred: false,
      });
    }

    records.sort((a, b) => a.time.localeCompare(b.time));

    const dominantMood = (Object.entries(moodCounts) as [MoodType, number][])
      .sort(([, a], [, b]) => b - a)[0][0];

    const avgColor = computeAverageColor(records);

    const month = 6;
    const day = 10 + i;
    weekData.push({
      date: `6月${day}日`,
      dayLabel: days[i],
      records,
      avgColor,
      dominantMood,
    });
  }

  return weekData;
}

function computeAverageColor(records: MoodRecord[]): string {
  const moodCounts: Record<MoodType, number> = {
    happy: 0, sad: 0, angry: 0, calm: 0, anxious: 0, surprised: 0,
  };
  records.forEach(r => { moodCounts[r.mood]++; });

  let totalH = 0, totalS = 0, totalL = 0, total = 0;
  (Object.entries(moodCounts) as [MoodType, number][]).forEach(([mood, count]) => {
    if (count > 0) {
      const mc = MOOD_COLORS[mood];
      totalH += mc.hsl.h * count;
      totalS += mc.hsl.s * count;
      totalL += mc.hsl.l * count;
      totalH += mc.hslComplement.h * count * 0.3;
      totalS += mc.hslComplement.s * count * 0.3;
      totalL += mc.hslComplement.l * count * 0.3;
      total += count * 1.3;
    }
  });

  if (total === 0) return '#6BCB77';
  return `hsl(${Math.round(totalH / total)}, ${Math.round(totalS / total)}%, ${Math.round(totalL / total)}%)`;
}

export function getColor(mood: MoodType): MoodColor {
  return MOOD_COLORS[mood];
}

export function getMoodLabel(mood: MoodType): string {
  return MOOD_LABELS[mood];
}

export function getWeekGradientColors(data: DayData[]): string[] {
  return data.map(d => d.avgColor);
}

export { MOOD_COLORS, MOOD_LABELS, generateWeekData };
