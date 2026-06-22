import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Emotion } from '../utils/emotionColors';

export interface LogEntry {
  id: string;
  date: string;
  emotion: Emotion;
  text: string;
  userId: string;
}

interface AppState {
  logs: LogEntry[];
  emotionFilter: Emotion | null;
  sortOrder: 'newest' | 'oldest';
  successMessage: string;
  selectedLog: LogEntry | null;
  addLog: (emotion: Emotion, text: string) => void;
  setEmotionFilter: (emotion: Emotion | null) => void;
  setSortOrder: (order: 'newest' | 'oldest') => void;
  setSuccessMessage: (msg: string) => void;
  setSelectedLog: (log: LogEntry | null) => void;
}

function createMockLogs(): LogEntry[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const entries: Array<{ day: number; emotion: Emotion; text: string; userId: string }> = [
    { day: 1, emotion: 'happy', text: '新的一月开始，充满了期待和希望，阳光温暖地照在身上。', userId: 'user-1' },
    { day: 2, emotion: 'calm', text: '在公园散步，微风拂面，感受到自然的宁静与美好。', userId: 'user-1' },
    { day: 3, emotion: 'anxious', text: '项目截止日期临近，还有好多工作没有完成，压力很大。', userId: 'user-1' },
    { day: 5, emotion: 'happy', text: '收到了好久不见的朋友寄来的明信片，太惊喜了！', userId: 'user-1' },
    { day: 6, emotion: 'sad', text: '看了一部关于离别的电影，眼泪止不住地流。', userId: 'user-1' },
    { day: 7, emotion: 'angry', text: '今天遇到了非常不公平的对待，心里很不舒服。', userId: 'user-1' },
    { day: 8, emotion: 'calm', text: '早起冥想了二十分钟，整个人都平静了下来。', userId: 'user-1' },
    { day: 9, emotion: 'happy', text: '完成了一个重要的项目里程碑，团队一起庆祝！', userId: 'user-1' },
    { day: 10, emotion: 'anxious', text: '明天有一场重要的演讲，准备了很久但还是紧张。', userId: 'user-1' },
    { day: 11, emotion: 'calm', text: '读了一本关于正念的书，学到了很多让内心安宁的方法。', userId: 'user-1' },
    { day: 12, emotion: 'happy', text: '和家人一起做了丰盛的晚餐，笑声充满了整个屋子。', userId: 'user-1' },
    { day: 13, emotion: 'sad', text: '下雨天独自在家，有点想念远方的朋友。', userId: 'user-1' },
    { day: 14, emotion: 'angry', text: '交通堵塞了整整一个小时，太让人烦躁了。', userId: 'user-1' },
    { day: 15, emotion: 'happy', text: '今天阳光明媚，和同事一起去了郊外野餐！', userId: 'user-1' },
    { day: 16, emotion: 'calm', text: '在咖啡馆安静地坐了一个下午，听雨声看书。', userId: 'user-1' },
    { day: 2, emotion: 'happy', text: '今天做了一顿很好吃的早餐，开启元气满满的一天！', userId: 'user-2' },
    { day: 4, emotion: 'calm', text: '清晨的瑜伽课让身心都得到了放松。', userId: 'user-2' },
    { day: 6, emotion: 'anxious', text: '考试倒计时三天，需要更加专注地复习。', userId: 'user-2' },
    { day: 9, emotion: 'happy', text: '终于学会了弹一首完整的吉他曲，太有成就感了！', userId: 'user-2' },
    { day: 11, emotion: 'sad', text: '宠物生病了，很担心它的健康。', userId: 'user-2' },
    { day: 14, emotion: 'happy', text: '收到了理想公司的面试邀请，非常开心！', userId: 'user-2' },
    { day: 3, emotion: 'angry', text: '快递送错了地址，折腾了好久才解决。', userId: 'user-3' },
    { day: 7, emotion: 'calm', text: '在湖边写生，画了一幅很满意的风景画。', userId: 'user-3' },
    { day: 10, emotion: 'happy', text: '参加了一个有趣的手工工坊，认识了新朋友。', userId: 'user-3' },
    { day: 13, emotion: 'anxious', text: '等待体检结果的日子里总是有些忐忑。', userId: 'user-3' },
  ];

  return entries
    .filter((e) => e.day <= today)
    .map((e) => ({
      id: uuidv4(),
      date: new Date(year, month, e.day, 8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60)).toISOString(),
      emotion: e.emotion,
      text: e.text,
      userId: e.userId,
    }));
}

export const useAppStore = create<AppState>((set) => ({
  logs: createMockLogs(),
  emotionFilter: null,
  sortOrder: 'newest',
  successMessage: '',
  selectedLog: null,
  addLog: (emotion, text) => {
    const newLog: LogEntry = {
      id: uuidv4(),
      date: new Date().toISOString(),
      emotion,
      text,
      userId: 'user-1',
    };
    set((state) => ({
      logs: [newLog, ...state.logs],
      successMessage: '日志记录成功！',
    }));
    setTimeout(() => {
      set({ successMessage: '' });
    }, 2000);
  },
  setEmotionFilter: (emotion) => set({ emotionFilter: emotion }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setSuccessMessage: (msg) => set({ successMessage: msg }),
  setSelectedLog: (log) => set({ selectedLog: log }),
}));
