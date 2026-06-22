export interface Diary {
  id: string;
  date: string;
  title: string;
  content: string;
  emotionColor: string;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface EmotionColor {
  hex: string;
  name: string;
}

export const EMOTION_COLORS: EmotionColor[] = [
  { hex: '#FF6B6B', name: '热情' },
  { hex: '#FF8E53', name: '活力' },
  { hex: '#FFA94D', name: '温暖' },
  { hex: '#FFD43B', name: '快乐' },
  { hex: '#FCE34D', name: '明媚' },
  { hex: '#D4F15B', name: '清新' },
  { hex: '#94D82D', name: '生机' },
  { hex: '#51CF66', name: '希望' },
  { hex: '#20C997', name: '平静' },
  { hex: '#12B886', name: '安宁' },
  { hex: '#0CA678', name: '沉稳' },
  { hex: '#15AABF', name: '清爽' },
  { hex: '#228BE6', name: '理智' },
  { hex: '#339AF0', name: '开阔' },
  { hex: '#4C6EF5', name: '深思' },
  { hex: '#5C7CFA', name: '梦幻' },
  { hex: '#7950F2', name: '神秘' },
  { hex: '#9775FA', name: '浪漫' },
  { hex: '#BE4BDB', name: '妩媚' },
  { hex: '#E64980', name: '柔情' },
  { hex: '#F06595', name: '甜蜜' },
  { hex: '#FF6B9D', name: '心动' },
  { hex: '#F03E3E', name: '激动' },
  { hex: '#FA5252', name: '热烈' },
];

export function getEmotionName(color: string): string {
  const found = EMOTION_COLORS.find(c => c.hex.toLowerCase() === color.toLowerCase());
  return found ? found.name : '未知';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 ${weekday}`;
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

export function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day;
  const monday = new Date(date);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

export function getWeekDates(weekStartStr: string): string[] {
  const dates: string[] = [];
  const weekStart = new Date(weekStartStr);
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function getWeekLabel(weekStartStr: string): string {
  const weekStart = new Date(weekStartStr);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const startMonth = weekStart.getMonth() + 1;
  const startDay = weekStart.getDate();
  const endMonth = weekEnd.getMonth() + 1;
  const endDay = weekEnd.getDate();
  return `${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`;
}

export function groupByWeek(diaries: Diary[]): Record<string, Diary[]> {
  const groups: Record<string, Diary[]> = {};
  diaries.forEach(diary => {
    const weekStart = getWeekStart(diary.date);
    if (!groups[weekStart]) {
      groups[weekStart] = [];
    }
    groups[weekStart].push(diary);
  });
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });
  return groups;
}

const positiveWords = ['开心', '快乐', '幸福', '满足', '美好', '希望', '爱', '喜欢', '感谢', '棒', '好', '愉快', '温暖', '感动', '骄傲', '自信', '成功', '顺利', '惊喜', '充实'];
const negativeWords = ['难过', '伤心', '痛苦', '失望', '焦虑', '压力', '累', '疲惫', '孤独', '害怕', '担心', '郁闷', '烦躁', '生气', '悲伤', '沮丧', '后悔', '迷茫', '空虚', '无聊'];

export function analyzeSentiment(text: string): { positive: number; negative: number; neutral: number } {
  const textLower = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    const regex = new RegExp(word, 'g');
    const matches = textLower.match(regex);
    if (matches) positiveCount += matches.length;
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(word, 'g');
    const matches = textLower.match(regex);
    if (matches) negativeCount += matches.length;
  });
  
  const total = positiveCount + negativeCount;
  if (total === 0) {
    return { positive: 0.33, negative: 0.33, neutral: 0.34 };
  }
  
  const positive = positiveCount / total;
  const negative = negativeCount / total;
  const neutral = Math.max(0, 1 - positive - negative) * 0.5;
  
  const sum = positive + negative + neutral;
  return {
    positive: positive / sum,
    negative: negative / sum,
    neutral: neutral / sum,
  };
}

export function getWeekSentiment(diaries: Diary[]): { positive: number; negative: number; neutral: number } {
  if (diaries.length === 0) {
    return { positive: 0.33, negative: 0.33, neutral: 0.34 };
  }
  
  const total = diaries.reduce((acc, d) => ({
    positive: acc.positive + d.sentiment.positive,
    negative: acc.negative + d.sentiment.negative,
    neutral: acc.neutral + d.sentiment.neutral,
  }), { positive: 0, negative: 0, neutral: 0 });
  
  return {
    positive: total.positive / diaries.length,
    negative: total.negative / diaries.length,
    neutral: total.neutral / diaries.length,
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
