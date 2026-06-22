import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { analyze, SentimentResult } from '../engine/sentimentEngine';

export interface Snapshot {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  timestamp: string;
  positionZ: number;
  wall: 'left' | 'right';
  sentimentLabel: 'positive' | 'negative' | 'neutral';
  sentimentStrength: number;
  comment: string;
}

interface SnapshotState {
  snapshots: Snapshot[];
  searchKeyword: string;
  selectedTag: 'positive' | 'negative' | 'neutral' | null;
  addSnapshot: (snapshot: Omit<Snapshot, 'id' | 'sentimentLabel' | 'sentimentStrength' | 'comment'>) => void;
  filterSnapshots: () => Snapshot[];
  setSearchKeyword: (keyword: string) => void;
  setSelectedTag: (tag: 'positive' | 'negative' | 'neutral' | null) => void;
}

const mockSnapshotsData = [
  { title: 'AI人工智能技术突破', description: '最新AI模型在多模态理解领域取得重大创新突破', positionZ: 0, wall: 'left' as const },
  { title: '周末家庭温馨时光', description: '与家人共度的美好周末，温暖的日常点滴', positionZ: 0, wall: 'right' as const },
  { title: '量子计算科学进展', description: '量子芯片研究数据显示性能提升显著', positionZ: 2.5, wall: 'left' as const },
  { title: '春日旅行美好回忆', description: '江南水乡的温暖时光，生活中的小确幸', positionZ: 2.5, wall: 'right' as const },
  { title: '芯片技术自主创新', description: '国产高性能芯片实现技术突破，效率提升明显', positionZ: 5, wall: 'left' as const },
  { title: '系统故障处理报告', description: '生产环境出现严重故障，需要紧急处理风险', positionZ: 5, wall: 'right' as const },
  { title: '智慧城市建设方案', description: '高效的城市管理系统，技术赋能美好生活', positionZ: 7.5, wall: 'left' as const },
  { title: '金融市场风险分析', description: '全球经济危机预警，投资面临不确定性问题', positionZ: 7.5, wall: 'right' as const },
  { title: '宇宙探索最新发现', description: '韦伯望远镜观测到遥远星系的科学数据', positionZ: 10, wall: 'left' as const },
  { title: '生日派对幸福时刻', description: '朋友们的祝福让这个生日格外美好温暖', positionZ: 10, wall: 'right' as const },
  { title: '算法性能优化研究', description: '神经网络压缩技术研究，实现高效边缘计算', positionZ: 12.5, wall: 'left' as const },
  { title: '项目延期遗憾记录', description: '关键里程碑未能达成，团队感到遗憾和失望', positionZ: 12.5, wall: 'right' as const },
  { title: '新能源技术创新', description: '动力电池能量密度突破，电动车续航创新高', positionZ: 15, wall: 'left' as const },
  { title: '日常通勤生活记录', description: '地铁上的阅读时光，平淡但充实的一天', positionZ: 15, wall: 'right' as const },
  { title: '数据中心能效优化', description: '液冷技术实现高效散热，PUE降至优秀水平', positionZ: 17.5, wall: 'left' as const },
  { title: '产品质量问题反馈', description: '用户投诉集中，危机公关需要快速响应', positionZ: 17.5, wall: 'right' as const },
  { title: '元宇宙技术展望', description: 'VR/AR技术融合创新，打造沉浸式数字世界', positionZ: 20, wall: 'left' as const },
  { title: '美食探店vlog', description: '街角小店的治愈系美食，生活里的小确幸', positionZ: 20, wall: 'right' as const },
  { title: '区块链技术应用', description: '去中心化金融研究，技术中立客观分析', positionZ: 22.5, wall: 'left' as const },
  { title: '科技新闻月度汇总', description: '本月行业动态回顾，客观呈现技术发展趋势', positionZ: 22.5, wall: 'right' as const },
];

function createImageUrl(seed: string, width: number, height: number): string {
  const encodedSeed = encodeURIComponent(seed);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodedSeed}&image_size=landscape_16_9`;
}

function createThumbnailUrl(seed: string): string {
  const encodedSeed = encodeURIComponent(seed);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodedSeed}&image_size=square`;
}

function formatDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

const initialSnapshots: Snapshot[] = mockSnapshotsData.map((data, index) => {
  const sentiment: SentimentResult = analyze(data.title, data.description);
  return {
    id: uuidv4(),
    title: data.title,
    description: data.description,
    imageUrl: createImageUrl(data.title, 800, 600),
    thumbnailUrl: createThumbnailUrl(data.title),
    timestamp: formatDate(index),
    positionZ: data.positionZ,
    wall: data.wall,
    sentimentLabel: sentiment.label,
    sentimentStrength: sentiment.strength,
    comment: sentiment.comment,
  };
});

export const useSnapshotStore = create<SnapshotState>((set, get) => ({
  snapshots: initialSnapshots,
  searchKeyword: '',
  selectedTag: null,

  addSnapshot: (snapshotData) => {
    const sentiment = analyze(snapshotData.title, snapshotData.description);
    const newSnapshot: Snapshot = {
      ...snapshotData,
      id: uuidv4(),
      sentimentLabel: sentiment.label,
      sentimentStrength: sentiment.strength,
      comment: sentiment.comment,
    };
    set((state) => ({
      snapshots: [...state.snapshots, newSnapshot],
    }));
  },

  filterSnapshots: () => {
    const { snapshots, searchKeyword, selectedTag } = get();
    return snapshots.filter((s) => {
      const matchesKeyword =
        searchKeyword === '' ||
        s.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        s.description.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchesTag = selectedTag === null || s.sentimentLabel === selectedTag;
      return matchesKeyword && matchesTag;
    });
  },

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setSelectedTag: (tag) => set({ selectedTag: tag }),
}));
