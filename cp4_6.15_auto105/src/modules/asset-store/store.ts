import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Asset, FilterOptions, SortOption, TimeRange, SearchResult } from './types';
import { TAG_STYLES } from './types';

interface AssetStore {
  assets: Asset[];
  currentAssetId: string | null;
  filterOptions: FilterOptions;
  isLoading: boolean;

  setCurrentAsset: (id: string | null) => void;
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => Asset;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addTag: (assetId: string, tag: string) => void;
  removeTag: (assetId: string, tag: string) => void;
  updateThumbnail: (assetId: string, thumbnail: string) => void;

  setSearch: (search: string) => void;
  toggleTagFilter: (tag: string) => void;
  toggleStyleFilter: (style: string) => void;
  setTimeRange: (timeRange: TimeRange | null) => void;
  setSortBy: (sortBy: SortOption) => void;
  clearFilters: () => void;

  searchAssets: (query: string, limit?: number, offset?: number) => SearchResult;
  filterByTag: (tags: string[]) => Asset[];
  filterByStyle: (styles: string[]) => Asset[];
  filterByTime: (timeRange: TimeRange) => Asset[];
  getFilteredAssets: () => Asset[];
  getCurrentAsset: () => Asset | undefined;
  getAllStyles: () => string[];

  applySort: (assets: Asset[]) => Asset[];

  initMockData: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getTimeRangeDate = (timeRange: TimeRange): Date => {
  const now = new Date();
  switch (timeRange) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return new Date(0);
  }
};

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  currentAssetId: null,
  filterOptions: {
    search: '',
    tags: [],
    styles: [],
    timeRange: null,
    sortBy: 'newest',
  },
  isLoading: false,

  setCurrentAsset: (id) => set({ currentAssetId: id }),

  addAsset: (asset) => {
    const newAsset: Asset = {
      ...asset,
      id: uuidv4(),
      createdAt: new Date(),
    };
    set((state) => ({ assets: [newAsset, ...state.assets] }));
    return newAsset;
  },

  updateAsset: (id, updates) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  deleteAsset: (id) =>
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
      currentAssetId: state.currentAssetId === id ? null : state.currentAssetId,
    })),

  addTag: (assetId, tag) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        a.id === assetId && !a.tags.includes(tag)
          ? { ...a, tags: [...a.tags, tag] }
          : a
      ),
    })),

  removeTag: (assetId, tag) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        a.id === assetId
          ? { ...a, tags: a.tags.filter((t) => t !== tag) }
          : a
      ),
    })),

  updateThumbnail: (assetId, thumbnail) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        a.id === assetId ? { ...a, thumbnail } : a
      ),
    })),

  setSearch: (search) =>
    set((state) => ({
      filterOptions: { ...state.filterOptions, search },
    })),

  toggleTagFilter: (tag) =>
    set((state) => {
      const tags = state.filterOptions.tags.includes(tag)
        ? state.filterOptions.tags.filter((t) => t !== tag)
        : [...state.filterOptions.tags, tag];
      return { filterOptions: { ...state.filterOptions, tags } };
    }),

  toggleStyleFilter: (style) =>
    set((state) => {
      const styles = state.filterOptions.styles.includes(style)
        ? state.filterOptions.styles.filter((s) => s !== style)
        : [...state.filterOptions.styles, style];
      return { filterOptions: { ...state.filterOptions, styles } };
    }),

  setTimeRange: (timeRange) =>
    set((state) => ({
      filterOptions: { ...state.filterOptions, timeRange },
    })),

  setSortBy: (sortBy) =>
    set((state) => ({
      filterOptions: { ...state.filterOptions, sortBy },
    })),

  clearFilters: () =>
    set(() => ({
      filterOptions: {
        search: '',
        tags: [],
        styles: [],
        timeRange: null,
        sortBy: 'newest',
      },
    })),

  searchAssets: (query, limit = 20, offset = 0) => {
    const { assets } = get();
    const queryLower = query.toLowerCase().trim();

    let results = assets.filter((asset) => {
      if (!queryLower) return true;
      const matchesName = asset.name.toLowerCase().includes(queryLower);
      const matchesTags = asset.tags.some((t) =>
        t.toLowerCase().includes(queryLower)
      );
      const matchesDescription = asset.description
        ?.toLowerCase()
        .includes(queryLower);
      return matchesName || matchesTags || matchesDescription;
    });

    results = get().applySort(results);

    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    return {
      assets: paginated,
      total,
      hasMore: offset + limit < total,
    };
  },

  filterByTag: (tags) => {
    if (tags.length === 0) return get().assets;
    return get().assets.filter((asset) =>
      tags.some((tag) => asset.tags.includes(tag))
    );
  },

  filterByStyle: (styles) => {
    if (styles.length === 0) return get().assets;
    return get().assets.filter((asset) =>
      styles.some((style) => asset.tags.includes(style))
    );
  },

  filterByTime: (timeRange) => {
    const fromDate = getTimeRangeDate(timeRange);
    return get().assets.filter(
      (asset) => new Date(asset.createdAt) >= fromDate
    );
  },

  getFilteredAssets: () => {
    const { assets, filterOptions } = get();
    let filtered = [...assets];

    if (filterOptions.search) {
      const searchLower = filterOptions.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(searchLower) ||
          a.tags.some((t) => t.toLowerCase().includes(searchLower)) ||
          a.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filterOptions.tags.length > 0) {
      filtered = filtered.filter((a) =>
        filterOptions.tags.some((t) => a.tags.includes(t))
      );
    }

    if (filterOptions.styles.length > 0) {
      filtered = filtered.filter((a) =>
        filterOptions.styles.some((s) => a.tags.includes(s))
      );
    }

    if (filterOptions.timeRange && filterOptions.timeRange !== 'all') {
      const fromDate = getTimeRangeDate(filterOptions.timeRange);
      filtered = filtered.filter(
        (a) => new Date(a.createdAt) >= fromDate
      );
    }

    filtered = get().applySort(filtered);

    return filtered;
  },

  getCurrentAsset: () => {
    const { assets, currentAssetId } = get();
    return assets.find((a) => a.id === currentAssetId);
  },

  getAllStyles: () => {
    const { assets } = get();
    const styleSet = new Set<string>();
    assets.forEach((asset) => {
      asset.tags.forEach((tag) => {
        if (TAG_STYLES.includes(tag as typeof TAG_STYLES[number])) {
          styleSet.add(tag);
        }
      });
    });
    return Array.from(styleSet).sort();
  },

  applySort: (assets: Asset[]) => {
    const { filterOptions } = get();
    const sorted = [...assets];

    switch (filterOptions.sortBy) {
      case 'newest':
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'oldest':
        sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
    }

    return sorted;
  },

  initMockData: () => {
    const mockAssets: Asset[] = [
      {
        id: uuidv4(),
        name: '科幻飞船模型',
        modelUrl: '',
        thumbnail: '',
        format: 'glb',
        faceCount: 12500,
        size: '中型',
        fileSize: 2.5 * 1024 * 1024,
        tags: ['科幻', '交通工具', '游戏'],
        createdAt: new Date('2024-01-15'),
        rating: 4.5,
        description: '一款精美的科幻风格宇宙飞船模型，包含详细的内部结构和多种材质。',
      },
      {
        id: uuidv4(),
        name: '低多边形森林套装',
        modelUrl: '',
        thumbnail: '',
        format: 'gltf',
        faceCount: 3200,
        size: '大型',
        fileSize: 1.8 * 1024 * 1024,
        tags: ['低多边形', '植物', '场景'],
        createdAt: new Date('2024-02-20'),
        rating: 4.2,
        description: '低多边形风格的森林场景，包含多种树木和植物。',
      },
      {
        id: uuidv4(),
        name: '卡通角色 - 小狐狸',
        modelUrl: '',
        thumbnail: '',
        format: 'glb',
        faceCount: 5800,
        size: '小型',
        fileSize: 3.2 * 1024 * 1024,
        tags: ['卡通', '角色', '游戏', '动物'],
        createdAt: new Date('2024-03-10'),
        rating: 4.8,
        description: '可爱的卡通小狐狸角色，带有绑定和基础动画。',
      },
      {
        id: uuidv4(),
        name: '现代建筑办公楼',
        modelUrl: '',
        thumbnail: '',
        format: 'obj',
        faceCount: 28000,
        size: '大型',
        fileSize: 8.5 * 1024 * 1024,
        tags: ['现代', '建筑', '场景'],
        createdAt: new Date('2024-01-05'),
        rating: 4.0,
        description: '现代风格办公楼建筑模型，包含周边环境。',
      },
      {
        id: uuidv4(),
        name: '蒸汽朋克机械臂',
        modelUrl: '',
        thumbnail: '',
        format: 'glb',
        faceCount: 15600,
        size: '中型',
        fileSize: 4.7 * 1024 * 1024,
        tags: ['蒸汽朋克', '道具', '游戏'],
        createdAt: new Date('2024-02-28'),
        rating: 4.6,
        description: '精致的蒸汽朋克风格机械臂，带有齿轮和管道细节。',
      },
      {
        id: uuidv4(),
        name: '赛博朋克城市街道',
        modelUrl: '',
        thumbnail: '',
        format: 'gltf',
        faceCount: 45000,
        size: '大型',
        fileSize: 12.3 * 1024 * 1024,
        tags: ['赛博朋克', '场景', '建筑'],
        createdAt: new Date('2024-03-01'),
        rating: 4.9,
        description: '赛博朋克风格的城市街道场景，霓虹灯效果丰富。',
      },
      {
        id: uuidv4(),
        name: '奇幻武器 - 魔法剑',
        modelUrl: '',
        thumbnail: '',
        format: 'glb',
        faceCount: 8900,
        size: '小型',
        fileSize: 2.1 * 1024 * 1024,
        tags: ['奇幻', '道具', '游戏'],
        createdAt: new Date('2024-03-12'),
        rating: 4.3,
        description: '带有魔法光芒效果的奇幻武器模型。',
      },
      {
        id: uuidv4(),
        name: '像素风游戏角色',
        modelUrl: '',
        thumbnail: '',
        format: 'obj',
        faceCount: 1200,
        size: '小型',
        fileSize: 0.5 * 1024 * 1024,
        tags: ['像素风', '角色', '游戏'],
        createdAt: new Date('2024-02-15'),
        rating: 4.1,
        description: '像素风格的3D游戏角色模型。',
      },
      {
        id: uuidv4(),
        name: '古风庭院场景',
        modelUrl: '',
        thumbnail: '',
        format: 'gltf',
        faceCount: 32000,
        size: '大型',
        fileSize: 6.8 * 1024 * 1024,
        tags: ['古风', '场景', '建筑'],
        createdAt: new Date('2024-01-25'),
        rating: 4.7,
        description: '中国古典风格的庭院建筑场景。',
      },
      {
        id: uuidv4(),
        name: '写实产品 - 智能手表',
        modelUrl: '',
        thumbnail: '',
        format: 'glb',
        faceCount: 18500,
        size: '小型',
        fileSize: 5.2 * 1024 * 1024,
        tags: ['写实', '产品', '现代'],
        createdAt: new Date('2024-03-08'),
        rating: 4.4,
        description: '高度写实的智能手表产品模型，包含材质细节。',
      },
    ];

    mockAssets.forEach((a) => {
      a.size = formatFileSize(a.fileSize);
    });

    set({ assets: mockAssets });
  },
}));
