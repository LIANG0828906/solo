import { create } from 'zustand';
import type { Exhibit, ViewMode } from './types';
import { getAllExhibits, addExhibit as dbAdd, updateExhibit as dbUpdate, deleteExhibit as dbDelete, seedSampleData } from './utils/idb';
import { v4 as uuidv4 } from 'uuid';

let isFetching = false;

interface ExhibitStore {
  exhibits: Exhibit[];
  viewMode: ViewMode;
  searchKeyword: string;
  selectedTags: string[];
  isLoading: boolean;
  selectedExhibit: Exhibit | null;
  isModalOpen: boolean;
  isFormOpen: boolean;
  editingExhibit: Exhibit | null;
  allTags: string[];
  fetchExhibits: () => Promise<void>;
  addExhibit: (data: Omit<Exhibit, 'id' | 'createdAt'>) => Promise<void>;
  updateExhibit: (id: string, data: Partial<Exhibit>) => Promise<void>;
  removeExhibit: (id: string) => Promise<void>;
  toggleViewMode: () => void;
  setSearchKeyword: (keyword: string) => void;
  toggleTag: (tag: string) => void;
  clearSelectedTags: () => void;
  openModal: (exhibit: Exhibit) => void;
  closeModal: () => void;
  openForm: (exhibit?: Exhibit) => void;
  closeForm: () => void;
}

function extractAllTags(exhibits: Exhibit[]): string[] {
  const tagSet = new Set<string>();
  exhibits.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

export const useExhibitStore = create<ExhibitStore>((set, get) => ({
  exhibits: [],
  viewMode: 'grid',
  searchKeyword: '',
  selectedTags: [],
  isLoading: true,
  selectedExhibit: null,
  isModalOpen: false,
  isFormOpen: false,
  editingExhibit: null,
  allTags: [],

  fetchExhibits: async () => {
    set({ isLoading: true });
    try {
      let exhibits = await getAllExhibits();
      if (exhibits.length === 0) {
        exhibits = generateSampleExhibits();
        await seedSampleData(exhibits);
      }
      set({ exhibits, allTags: extractAllTags(exhibits), isLoading: false });
    } catch (error) {
      console.error('Failed to fetch exhibits:', error);
      set({ isLoading: false });
    }
  },

  addExhibit: async (data) => {
    const newExhibit: Exhibit = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    await dbAdd(newExhibit);
    const exhibits = [newExhibit, ...get().exhibits];
    set({ exhibits, allTags: extractAllTags(exhibits) });
  },

  updateExhibit: async (id, data) => {
    const existing = get().exhibits.find((e) => e.id === id);
    if (!existing) return;
    const updated = { ...existing, ...data };
    await dbUpdate(updated);
    const exhibits = get().exhibits.map((e) => (e.id === id ? updated : e));
    set({ exhibits, allTags: extractAllTags(exhibits) });
  },

  removeExhibit: async (id) => {
    await dbDelete(id);
    const exhibits = get().exhibits.filter((e) => e.id !== id);
    set({ exhibits, allTags: extractAllTags(exhibits), isModalOpen: false, selectedExhibit: null });
  },

  toggleViewMode: () => {
    set((state) => ({ viewMode: state.viewMode === 'grid' ? 'list' : 'grid' }));
  },

  setSearchKeyword: (keyword) => {
    set({ searchKeyword: keyword });
  },

  toggleTag: (tag) => {
    set((state) => ({
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag],
    }));
  },

  clearSelectedTags: () => {
    set({ selectedTags: [] });
  },

  openModal: (exhibit) => {
    set({ selectedExhibit: exhibit, isModalOpen: true });
  },

  closeModal: () => {
    set({ isModalOpen: false, selectedExhibit: null });
  },

  openForm: (exhibit) => {
    set({ isFormOpen: true, editingExhibit: exhibit || null, isModalOpen: false });
  },

  closeForm: () => {
    set({ isFormOpen: false, editingExhibit: null });
  },
}));

function generateSampleExhibits(): Exhibit[] {
  const sampleTags = ['数字艺术', '3D渲染', '摄影', '插画', '概念设计', '动画', '油画', '水彩', '雕塑', '装置艺术'];
  const titles = [
    '星际漫游', '城市之光', '自然之韵', '未来都市', '梦境花园',
    '机械纪元', '深海探秘', '时空碎片', '光影诗学', '像素世界',
    '赛博朋克', '古典新解', '几何幻想', '微观宇宙', '荒原记忆',
    '数字孪生', '极简主义', '复古未来', '流动色彩', '神秘符号',
    '森林低语', '霓虹之夜', '水墨数字化', '元宇宙入口', '数据可视化',
    '量子纠缠', '生物发光', '机械心脏', '虚拟偶像', '赛博格',
    '废土美学', '蒸汽朋克', '人工智能', '基因艺术', '太阳系',
    '银河铁道', '时间胶囊', '虚拟博物馆', '数字雕塑', '光影剧场',
    '未来建筑', '赛博空间', '神经网络', '基因图谱', '宇宙尘埃',
    '数字水墨', '像素艺术', '3D打印', '全息投影', 'AR艺术',
    'VR体验', '互动装置', '生成艺术', '算法美学', '区块链艺术',
    'NFT收藏', '虚拟地产', '数字时尚', '游戏美术', '角色设计',
    '场景原画', '道具设计', 'UI设计', '图标设计', '品牌视觉',
    '海报设计', '书籍装帧', '包装设计', '字体设计', '动效设计',
    'MG动画', '二维动画', '三维动画', '定格动画', '实验影像',
    '纪录片', '短片创作', '电影海报', '游戏截图', '概念图',
    '分镜脚本', '色彩研究', '构图练习', '素描作品', '速写本',
    '写生集', '毕业作品', '个展作品', '群展精选', '获奖作品',
  ];

  const descriptions = [
    '这件作品探索了数字与现实之间的边界，通过像素化的处理手法呈现出独特的视觉语言。',
    '灵感来源于都市夜晚的霓虹灯光，展现了现代都市生活的繁华与孤独并存的状态。',
    '艺术家以自然元素为主题，用数字技术重新诠释了传统山水意境。',
    '作品融合了东方美学与西方现代主义，创造出独特的跨文化视觉体验。',
    '通过对光影的精密控制，营造出梦幻般的空间氛围，引人入胜。',
  ];

  return titles.map((title, index) => ({
    id: uuidv4(),
    title,
    description: descriptions[index % descriptions.length],
    tags: [sampleTags[index % sampleTags.length], sampleTags[(index + 3) % sampleTags.length], sampleTags[(index + 7) % sampleTags.length]],
    imageUrl: `https://picsum.photos/seed/exhibit-${index + 1}/600/400`,
    createdAt: Date.now() - index * 3600000,
  }));
}
