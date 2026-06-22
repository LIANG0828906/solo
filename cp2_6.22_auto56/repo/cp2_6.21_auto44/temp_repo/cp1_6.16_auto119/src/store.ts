import { create } from 'zustand';
import { analyzeEmotion, EmotionResult } from './utils/emotionAnalyzer';

export interface DiaryEntry {
  id: string;
  text: string;
  date: string;
  timestamp: number;
  location: string;
  emotion: EmotionResult;
}

export interface CityEmotionData {
  city: string;
  lat: number;
  lng: number;
  avgScore: number;
  entries: DiaryEntry[];
}

interface DiaryStore {
  entries: DiaryEntry[];
  currentPageIndex: number;
  cityEmotions: Map<string, CityEmotionData>;
  currentEmotion: EmotionResult | null;
  isAnalyzing: boolean;

  setPageIndex: (index: number) => void;
  addEntry: (text: string, location: string) => void;
  updateEmotion: (text: string) => void;
}

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  '北京': { lat: 39.9042, lng: 116.4074 },
  '上海': { lat: 31.2304, lng: 121.4737 },
  '广州': { lat: 23.1291, lng: 113.2644 },
  '深圳': { lat: 22.5431, lng: 114.0579 },
  '杭州': { lat: 30.2741, lng: 120.1551 },
  '成都': { lat: 30.5728, lng: 104.0668 },
  '南京': { lat: 32.0603, lng: 118.7969 },
  '武汉': { lat: 30.5928, lng: 114.3055 },
  '西安': { lat: 34.3416, lng: 108.9398 },
  '重庆': { lat: 29.4316, lng: 106.9123 },
  '东京': { lat: 35.6762, lng: 139.6503 },
  '纽约': { lat: 40.7128, lng: -74.0060 },
  '伦敦': { lat: 51.5074, lng: -0.1278 },
  '巴黎': { lat: 48.8566, lng: 2.3522 },
  '首尔': { lat: 37.5665, lng: 126.9780 },
  '新加坡': { lat: 1.3521, lng: 103.8198 },
  '悉尼': { lat: -33.8688, lng: 151.2093 },
  '洛杉矶': { lat: 34.0522, lng: -118.2437 },
  '柏林': { lat: 52.5200, lng: 13.4050 },
  '莫斯科': { lat: 55.7558, lng: 37.6173 },
  '香港': { lat: 22.3193, lng: 114.1694 },
  '台北': { lat: 25.0330, lng: 121.5654 },
  '天津': { lat: 39.3434, lng: 117.3616 },
  '苏州': { lat: 31.2990, lng: 120.5853 },
  '长沙': { lat: 28.2282, lng: 112.9388 },
  '青岛': { lat: 36.0671, lng: 120.3826 },
  '大连': { lat: 38.9140, lng: 121.6147 },
  '厦门': { lat: 24.4798, lng: 118.0894 },
  '昆明': { lat: 25.0389, lng: 102.7183 },
  '哈尔滨': { lat: 45.8038, lng: 126.5350 },
};

function getCityCoords(cityName: string): { lat: number; lng: number } | null {
  if (cityCoordinates[cityName]) {
    return cityCoordinates[cityName];
  }
  for (const [name, coords] of Object.entries(cityCoordinates)) {
    if (cityName.includes(name) || name.includes(cityName)) {
      return coords;
    }
  }
  return null;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[date.getHours()];
  return `${year}年${month}月${day}日 ${weekday}`;
}

const sampleEntries: DiaryEntry[] = [
  {
    id: '1',
    text: '今天天气真好，和朋友们一起去公园野餐，感觉特别开心😊 阳光明媚，心情也变得很美好！',
    date: formatDate(new Date(Date.now() - 86400000 * 2)),
    timestamp: Date.now() - 86400000 * 2,
    location: '杭州',
    emotion: { score: 0.92, dominantWord: '开心', sentiment: 'positive' },
  },
  {
    id: '2',
    text: '工作压力好大，项目deadline快到了，今天加班到很晚，感觉很疲惫😔',
    date: formatDate(new Date(Date.now() - 86400000)),
    timestamp: Date.now() - 86400000,
    location: '上海',
    emotion: { score: 0.25, dominantWord: '疲惫', sentiment: 'negative' },
  },
  {
    id: '3',
    text: '收到了期待已久的包裹，是喜欢了很久的书，还有一杯暖暖的咖啡，今天是幸福的一天❤️',
    date: formatDate(new Date()),
    timestamp: Date.now(),
    location: '北京',
    emotion: { score: 0.88, dominantWord: '幸福', sentiment: 'positive' },
  },
  {
    id: '4',
    text: '周末去了海边，吹着海风，听着浪声，感觉整个人都放松下来了，真的很治愈。',
    date: formatDate(new Date(Date.now() - 86400000 * 5)),
    timestamp: Date.now() - 86400000 * 5,
    location: '青岛',
    emotion: { score: 0.8, dominantWord: '放松', sentiment: 'positive' },
  },
  {
    id: '5',
    text: '今天和同事吵架了，心情很糟糕，为什么沟通这么难呢？真是让人烦躁的一天。',
    date: formatDate(new Date(Date.now() - 86400000 * 3)),
    timestamp: Date.now() - 86400000 * 3,
    location: '深圳',
    emotion: { score: 0.18, dominantWord: '烦躁', sentiment: 'negative' },
  },
];

function initCityEmotions(entries: DiaryEntry[]): Map<string, CityEmotionData> {
  const map = new Map<string, CityEmotionData>();
  for (const entry of entries) {
    const coords = getCityCoords(entry.location);
    if (!coords) continue;
    if (!map.has(entry.location)) {
      map.set(entry.location, {
        city: entry.location,
        lat: coords.lat,
        lng: coords.lng,
        avgScore: 0,
        entries: [],
      });
    }
    const cityData = map.get(entry.location)!;
    cityData.entries.push(entry);
  }
  for (const [, cityData] of map) {
    const totalScore = cityData.entries.reduce((sum, e) => sum + e.emotion.score, 0);
    cityData.avgScore = totalScore / cityData.entries.length;
    cityData.entries.sort((a, b) => b.timestamp - a.timestamp);
  }
  return map;
}

export const useDiaryStore = create<DiaryStore>((set, get) => ({
  entries: sampleEntries,
  currentPageIndex: 0,
  cityEmotions: initCityEmotions(sampleEntries),
  currentEmotion: null,
  isAnalyzing: false,

  setPageIndex: (index: number) => set({ currentPageIndex: index }),

  addEntry: (text: string, location: string) => {
    const emotion = analyzeEmotion(text);
    const now = new Date();
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      text,
      date: formatDate(now),
      timestamp: now.getTime(),
      location: location || '未知',
      emotion,
    };

    const state = get();
    const newEntries = [newEntry, ...state.entries];
    const newCityEmotions = new Map(state.cityEmotions);
    const coords = getCityCoords(newEntry.location);

    if (coords) {
      if (!newCityEmotions.has(newEntry.location)) {
        newCityEmotions.set(newEntry.location, {
          city: newEntry.location,
          lat: coords.lat,
          lng: coords.lng,
          avgScore: 0,
          entries: [],
        });
      }
      const cityData = newCityEmotions.get(newEntry.location)!;
      cityData.entries.unshift(newEntry);
      const totalScore = cityData.entries.reduce((sum, e) => sum + e.emotion.score, 0);
      cityData.avgScore = totalScore / cityData.entries.length;
    }

    set({
      entries: newEntries,
      cityEmotions: newCityEmotions,
      currentEmotion: emotion,
    });
  },

  updateEmotion: (text: string) => {
    if (!text.trim()) {
      set({ currentEmotion: null });
      return;
    }
    set({ isAnalyzing: true });
    setTimeout(() => {
      const emotion = analyzeEmotion(text);
      set({ currentEmotion: emotion, isAnalyzing: false });
    }, 100);
  },
}));
