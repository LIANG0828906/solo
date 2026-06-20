import { create } from 'zustand';

export type Platform = 'weibo' | 'zhihu' | 'baidu' | 'twitter';

export interface WordItem {
  text: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
}

export interface HeatmapDataPoint {
  time: string;
  platform: Platform;
  value: number;
  words: WordItem[];
}

export interface SentimentDataPoint {
  time: string;
  positive: number;
  negative: number;
  neutral: number;
}

export interface PlatformTrendPoint {
  time: string;
  [key: string]: number | string;
}

interface DataState {
  selectedPlatform: Platform;
  refreshInterval: number;
  wordData: WordItem[];
  heatmapData: HeatmapDataPoint[];
  sentimentData: SentimentDataPoint[];
  platformTrendData: PlatformTrendPoint[];
  selectedHeatpoint: HeatmapDataPoint | null;
  hiddenPlatforms: Platform[];
  setSelectedPlatform: (platform: Platform) => void;
  setRefreshInterval: (interval: number) => void;
  setWordData: (data: WordItem[]) => void;
  setHeatmapData: (data: HeatmapDataPoint[]) => void;
  setSentimentData: (data: SentimentDataPoint[]) => void;
  setPlatformTrendData: (data: PlatformTrendPoint[]) => void;
  setSelectedHeatpoint: (point: HeatmapDataPoint | null) => void;
  togglePlatformVisibility: (platform: Platform) => void;
}

const platforms: Platform[] = ['weibo', 'zhihu', 'baidu', 'twitter'];

const generateMockWords = (count: number = 30): WordItem[] => {
  const hotTopics = [
    '人工智能', '元宇宙', '新能源', '碳中和', '数字化转型',
    '消费升级', '科技创新', '实体经济', '高质量发展', '共同富裕',
    '直播带货', '短视频', '游戏电竞', '在线教育', '远程办公',
    '健康生活', '绿色出行', '智能家居', '国潮品牌', '文化自信',
    '航天探索', '芯片研发', '5G应用', '大数据', '云计算',
    '区块链', '自动驾驶', '生物医药', '新材料', '量子计算'
  ];
  
  const shuffled = [...hotTopics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((text, i) => {
    const rand = Math.random();
    let sentiment: 'positive' | 'negative' | 'neutral';
    let sentimentScore: number;
    if (rand < 0.4) {
      sentiment = 'positive';
      sentimentScore = 0.6 + Math.random() * 0.4;
    } else if (rand < 0.7) {
      sentiment = 'neutral';
      sentimentScore = -0.3 + Math.random() * 0.6;
    } else {
      sentiment = 'negative';
      sentimentScore = -0.6 - Math.random() * 0.4;
    }
    return {
      text,
      count: Math.floor(Math.random() * 9000) + 1000 - i * 200,
      sentiment,
      sentimentScore,
    };
  }).sort((a, b) => b.count - a.count);
};

const generateTimeLabels = (count: number = 12): string[] => {
  const labels: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000);
    labels.push(`${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`);
  }
  return labels;
};

const generateHeatmapData = (): HeatmapDataPoint[] => {
  const times = generateTimeLabels();
  const data: HeatmapDataPoint[] = [];
  platforms.forEach(platform => {
    times.forEach(time => {
      data.push({
        time,
        platform,
        value: Math.floor(Math.random() * 100),
        words: generateMockWords(5),
      });
    });
  });
  return data;
};

const generateSentimentData = (): SentimentDataPoint[] => {
  const times = generateTimeLabels();
  return times.map(time => {
    const total = 100;
    const positive = Math.floor(Math.random() * 40) + 30;
    const negative = Math.floor(Math.random() * 25) + 15;
    const neutral = total - positive - negative;
    return { time, positive, negative, neutral };
  });
};

const generatePlatformTrendData = (): PlatformTrendPoint[] => {
  const times = generateTimeLabels();
  return times.map(time => {
    const point: PlatformTrendPoint = { time };
    platforms.forEach(platform => {
      point[platform] = Math.floor(Math.random() * 500) + 200;
    });
    return point;
  });
};

export const useDataStore = create<DataState>((set) => ({
  selectedPlatform: 'weibo',
  refreshInterval: 5000,
  wordData: generateMockWords(30),
  heatmapData: generateHeatmapData(),
  sentimentData: generateSentimentData(),
  platformTrendData: generatePlatformTrendData(),
  selectedHeatpoint: null,
  hiddenPlatforms: [],
  
  setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
  setRefreshInterval: (interval) => set({ refreshInterval: interval }),
  setWordData: (data) => set({ wordData: data }),
  setHeatmapData: (data) => set({ heatmapData: data }),
  setSentimentData: (data) => set({ sentimentData: data }),
  setPlatformTrendData: (data) => set({ platformTrendData: data }),
  setSelectedHeatpoint: (point) => set({ selectedHeatpoint: point }),
  togglePlatformVisibility: (platform) => set((state) => ({
    hiddenPlatforms: state.hiddenPlatforms.includes(platform)
      ? state.hiddenPlatforms.filter(p => p !== platform)
      : [...state.hiddenPlatforms, platform]
  })),
  
  // 初始化时设置定时刷新
}));

export const platformColors: Record<Platform, string> = {
  weibo: '#e6162d',
  zhihu: '#0066ff',
  baidu: '#ff6600',
  twitter: '#1da1f2',
};

export const platformNames: Record<Platform, string> = {
  weibo: '微博',
  zhihu: '知乎',
  baidu: '百度',
  twitter: 'Twitter',
};

export const sentimentColors = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#3b82f6',
};

export { generateMockWords, generateHeatmapData, generateSentimentData, generatePlatformTrendData };
