import { v4 as uuidv4 } from 'uuid';

export type MoodType = 'happy' | 'calm' | 'irritated' | 'sad' | 'anxious' | 'tired';

export interface DiaryEntry {
  id: string;
  date: string;
  mood: MoodType;
  content: string;
  timestamp: string;
}

export interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  entries: DiaryEntry[];
  avgMoodScore: number;
}

export const MOOD_COLORS: Record<MoodType, string> = {
  happy: '#FFD700',
  calm: '#87CEEB',
  irritated: '#FF6347',
  sad: '#4A90D9',
  anxious: '#9370DB',
  tired: '#708090',
};

export const MOOD_NAMES: Record<MoodType, string> = {
  happy: '开心',
  calm: '平静',
  irritated: '烦躁',
  sad: '悲伤',
  anxious: '焦虑',
  tired: '疲惫',
};

export const MOOD_EMOJIS: Record<MoodType, string> = {
  happy: '😊',
  calm: '😌',
  irritated: '😤',
  sad: '😢',
  anxious: '😰',
  tired: '😴',
};

export const MOOD_SCORES: Record<MoodType, number> = {
  happy: 10,
  calm: 7,
  irritated: 4,
  sad: 2,
  anxious: 3,
  tired: 5,
};

const DIARY_SAMPLES: Record<MoodType, string[]> = {
  happy: [
    '今天阳光很好，出门散步心情特别棒',
    '和朋友一起吃了顿美味的火锅',
    '项目顺利上线，成就感满满',
    '收到了期待已久的礼物',
    '学了一首新歌，弹得还不错',
  ],
  calm: [
    '在家看了一下午书，很惬意',
    '泡了杯茶，听着雨声发呆',
    '整理了房间，心情也跟着清爽了',
    '早起做了瑜伽，身体很舒服',
    '慢慢品味一杯咖啡的香醇',
  ],
  irritated: [
    '开会的时候有人一直打断我',
    '等了半小时的外卖居然送错了',
    '电脑突然蓝屏，写的东西都没了',
    '路上堵车堵了快一个小时',
    '计划好的事情又被打乱了',
  ],
  sad: [
    '想起了以前的朋友，有点怀念',
    '看了一部很感人的电影',
    '今天下雨了，心情有点低落',
    '和朋友吵架了，心里很难受',
    '想念远方的家人',
  ],
  anxious: [
    '明天的演讲有点紧张',
    '还有好多工作没做完，压力好大',
    '不知道未来会怎样，有点迷茫',
    '晚上翻来覆去睡不着',
    '总感觉有什么事情忘记了',
  ],
  tired: [
    '加了一周的班，好累啊',
    '今天跑了五公里，腿都软了',
    '连续熬夜，感觉身体被掏空',
    '忙了一整天，只想躺平',
    '周末也在工作，完全没休息好',
  ],
};

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getWeekDates(weekOffset: number): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1 + weekOffset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
}

function generateWeekEntries(weekOffset: number): DiaryEntry[] {
  const entries: DiaryEntry[] = [];
  const { start } = getWeekDates(weekOffset);

  const moods: MoodType[] = ['happy', 'calm', 'irritated', 'sad', 'anxious', 'tired'];

  for (let day = 0; day < 7; day++) {
    const date = new Date(start);
    date.setDate(start.getDate() + day);

    const numEntries = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numEntries; i++) {
      const mood = getRandomItem(moods);
      const hour = 9 + Math.floor(Math.random() * 12);
      const minute = Math.floor(Math.random() * 60);
      const entryDate = new Date(date);
      entryDate.setHours(hour, minute, 0, 0);

      entries.push({
        id: uuidv4(),
        date: formatDate(entryDate),
        mood,
        content: getRandomItem(DIARY_SAMPLES[mood]),
        timestamp: formatTime(entryDate),
      });
    }
  }

  return entries.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.timestamp.localeCompare(b.timestamp);
  });
}

function calculateAvgScore(entries: DiaryEntry[]): number {
  if (entries.length === 0) return 5;
  const total = entries.reduce((sum, entry) => sum + MOOD_SCORES[entry.mood], 0);
  return total / entries.length;
}

const weeksCache = new Map<number, WeekData>();

export function getWeekData(weekNumber: number): WeekData {
  if (weeksCache.has(weekNumber)) {
    return weeksCache.get(weekNumber)!;
  }

  const weekOffset = weekNumber - getCurrentWeekNumber();
  const { start, end } = getWeekDates(weekOffset);
  const entries = generateWeekEntries(weekOffset);
  const avgScore = calculateAvgScore(entries);

  const weekData: WeekData = {
    weekNumber,
    startDate: formatDate(start),
    endDate: formatDate(end),
    entries,
    avgMoodScore: avgScore,
  };

  weeksCache.set(weekNumber, weekData);
  return weekData;
}

export function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
  return weekNumber;
}

export function getEntriesByDate(entries: DiaryEntry[], date: string): DiaryEntry[] {
  return entries.filter((e) => e.date === date).slice(0, 5);
}

export function getDominantMood(entries: DiaryEntry[]): MoodType {
  if (entries.length === 0) return 'calm';
  const moodCounts: Record<MoodType, number> = {
    happy: 0, calm: 0, irritated: 0, sad: 0, anxious: 0, tired: 0,
  };
  entries.forEach((e) => {
    moodCounts[e.mood]++;
  });
  let maxMood: MoodType = 'calm';
  let maxCount = 0;
  (Object.keys(moodCounts) as MoodType[]).forEach((mood) => {
    if (moodCounts[mood] > maxCount) {
      maxCount = moodCounts[mood];
      maxMood = mood;
    }
  });
  return maxMood;
}
