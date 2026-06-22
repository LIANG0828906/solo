import axios, { AxiosInstance, Canceler } from 'axios';

export interface Furniture {
  id: string;
  name: string;
  category: string;
  price: number;
  icon: string;
  width: number;
  height: number;
}

export interface Style {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  colorScheme: string[];
}

export interface DesignSaveData {
  name: string;
  description?: string;
  canvasWidth: number;
  canvasHeight: number;
  items: Array<{
    furnitureId: string;
    x: number;
    y: number;
    rotation: number;
    scale: number;
  }>;
  styleId?: string;
}

export interface DesignResponse {
  id: string;
  success: boolean;
  message: string;
  createdAt: string;
}

export interface DesignListItem {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: number;
}

export interface DesignFullData {
  id: string;
  name: string;
  description: string;
  canvasWidth: number;
  canvasHeight: number;
  items: Array<{
    furnitureId: string;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    furniture: Furniture;
  }>;
  styleId?: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: number;
}

interface LoadingState {
  [key: string]: boolean;
}

const STORAGE_KEY_DESIGNS = 'furniture_designs';
const CACHE_KEY_FURNITURE = 'furniture_cache';
const CACHE_DURATION = 5 * 60 * 1000;

const cancelTokens: Map<string, Canceler> = new Map();
const loadingState: LoadingState = {};
const loadingListeners: Array<(state: LoadingState) => void> = [];

let furnitureCache: { data: Furniture[]; timestamp: number } | null = null;

const mockFurniture: Furniture[] = [
  { id: 'sofa-1', name: '北欧简约三人沙发', category: '沙发', price: 3299, icon: '🛋️', width: 220, height: 90 },
  { id: 'sofa-2', name: '现代布艺沙发', category: '沙发', price: 4599, icon: '🛋️', width: 240, height: 95 },
  { id: 'sofa-3', name: '美式复古皮沙发', category: '沙发', price: 6899, icon: '🛋️', width: 230, height: 100 },
  { id: 'sofa-4', name: '日式原木沙发', category: '沙发', price: 2799, icon: '🛋️', width: 200, height: 85 },
  { id: 'sofa-5', name: '轻奢丝绒沙发', category: '沙发', price: 5299, icon: '🛋️', width: 250, height: 98 },
  { id: 'table-1', name: '实木餐桌', category: '桌子', price: 1899, icon: '🪑', width: 160, height: 80 },
  { id: 'table-2', name: '岩板茶几', category: '桌子', price: 1299, icon: '🪑', width: 120, height: 60 },
  { id: 'table-3', name: '简约书桌', category: '桌子', price: 899, icon: '🪑', width: 140, height: 70 },
  { id: 'table-4', name: '大理石边桌', category: '桌子', price: 699, icon: '🪑', width: 50, height: 50 },
  { id: 'table-5', name: '可折叠餐桌', category: '桌子', price: 1599, icon: '🪑', width: 140, height: 80 },
  { id: 'chair-1', name: '人体工学办公椅', category: '椅子', price: 1299, icon: '🪑', width: 60, height: 60 },
  { id: 'chair-2', name: '北欧餐椅', category: '椅子', price: 399, icon: '🪑', width: 45, height: 45 },
  { id: 'chair-3', name: '休闲躺椅', category: '椅子', price: 899, icon: '🪑', width: 70, height: 80 },
  { id: 'chair-4', name: '吧台椅', category: '椅子', price: 599, icon: '🪑', width: 40, height: 40 },
  { id: 'chair-5', name: '儿童学习椅', category: '椅子', price: 499, icon: '🪑', width: 45, height: 45 },
  { id: 'lamp-1', name: '北欧落地灯', category: '灯具', price: 499, icon: '💡', width: 40, height: 160 },
  { id: 'lamp-2', name: '现代简约台灯', category: '灯具', price: 299, icon: '💡', width: 30, height: 50 },
  { id: 'lamp-3', name: '轻奢水晶吊灯', category: '灯具', price: 1599, icon: '💡', width: 60, height: 80 },
  { id: 'lamp-4', name: '工业风壁灯', category: '灯具', price: 399, icon: '💡', width: 25, height: 35 },
  { id: 'lamp-5', name: '智能吸顶灯', category: '灯具', price: 799, icon: '💡', width: 80, height: 15 },
  { id: 'carpet-1', name: '羊毛手工地毯', category: '地毯', price: 2299, icon: '🟫', width: 200, height: 300 },
  { id: 'carpet-2', name: '几何图案地毯', category: '地毯', price: 899, icon: '🟫', width: 160, height: 230 },
  { id: 'carpet-3', name: '北欧简约地毯', category: '地毯', price: 599, icon: '🟫', width: 140, height: 200 },
  { id: 'carpet-4', name: '轻奢丝绒地毯', category: '地毯', price: 1599, icon: '🟫', width: 180, height: 280 },
  { id: 'carpet-5', name: '天然剑麻地毯', category: '地毯', price: 799, icon: '🟫', width: 150, height: 220 },
  { id: 'art-1', name: '抽象艺术画', category: '装饰画', price: 399, icon: '🖼️', width: 80, height: 100 },
  { id: 'art-2', name: '风景摄影画', category: '装饰画', price: 299, icon: '🖼️', width: 70, height: 100 },
  { id: 'art-3', name: '现代三联画', category: '装饰画', price: 899, icon: '🖼️', width: 120, height: 80 },
  { id: 'art-4', name: '手绘油画', category: '装饰画', price: 1599, icon: '🖼️', width: 90, height: 120 },
  { id: 'art-5', name: '北欧简约装饰画', category: '装饰画', price: 199, icon: '🖼️', width: 60, height: 80 },
];

const mockStyles: Style[] = [
  { id: 'style-1', name: '北欧风格', description: '简洁自然，崇尚原木韵味', thumbnail: '🏠', colorScheme: ['#F5F5DC', '#8B7355', '#6B8E23', '#CD853F'] },
  { id: 'style-2', name: '现代简约', description: '少即是多，注重功能与形式', thumbnail: '🏢', colorScheme: ['#FFFFFF', '#808080', '#000000', '#4A90A4'] },
  { id: 'style-3', name: '美式乡村', description: '回归自然，舒适温馨', thumbnail: '🏡', colorScheme: ['#FFF8DC', '#8B4513', '#556B2F', '#D2691E'] },
  { id: 'style-4', name: '轻奢风格', description: '精致优雅，低调奢华', thumbnail: '✨', colorScheme: ['#FAF0E6', '#B8860B', '#2F4F4F', '#DAA520'] },
  { id: 'style-5', name: '日式禅意', description: '空灵静谧，禅意十足', thumbnail: '🎋', colorScheme: ['#F5F5F5', '#A9A9A9', '#696969', '#BC8F8F'] },
];

const setLoading = (key: string, value: boolean) => {
  loadingState[key] = value;
  loadingListeners.forEach(listener => listener({ ...loadingState }));
};

export const subscribeLoading = (listener: (state: LoadingState) => void) => {
  loadingListeners.push(listener);
  return () => {
    const index = loadingListeners.indexOf(listener);
    if (index > -1) loadingListeners.splice(index, 1);
  };
};

export const getLoadingState = () => ({ ...loadingState });

const axiosInstance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const requestId = config.url || Math.random().toString();
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    cancelTokens.set(requestId, source.cancel);
    setLoading(requestId, true);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    const requestId = response.config.url || '';
    cancelTokens.delete(requestId);
    setLoading(requestId, false);
    return response;
  },
  (error) => {
    const requestId = error.config?.url || '';
    cancelTokens.delete(requestId);
    setLoading(requestId, false);
    
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message);
    } else {
      console.error('API Error:', error.response?.data?.message || error.message);
    }
    
    return Promise.reject(error);
  }
);

export const cancelRequest = (requestId: string) => {
  const canceler = cancelTokens.get(requestId);
  if (canceler) {
    canceler('Request canceled by user');
    cancelTokens.delete(requestId);
    setLoading(requestId, false);
  }
};

export const cancelAllRequests = () => {
  cancelTokens.forEach((canceler, requestId) => {
    canceler('All requests canceled');
    setLoading(requestId, false);
  });
  cancelTokens.clear();
};

const simulateDelay = <T>(data: T, delay: number = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const getFurnitureList = async (): Promise<Furniture[]> => {
  const now = Date.now();
  
  if (furnitureCache && now - furnitureCache.timestamp < CACHE_DURATION) {
    return simulateDelay([...furnitureCache.data], 200);
  }
  
  try {
    const cached = localStorage.getItem(CACHE_KEY_FURNITURE);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (now - parsed.timestamp < CACHE_DURATION) {
        furnitureCache = parsed;
        return simulateDelay([...parsed.data], 200);
      }
    }
  } catch (e) {
    console.warn('Failed to read furniture cache:', e);
  }
  
  const data = await simulateDelay([...mockFurniture], 600);
  
  furnitureCache = { data, timestamp: now };
  try {
    localStorage.setItem(CACHE_KEY_FURNITURE, JSON.stringify(furnitureCache));
  } catch (e) {
    console.warn('Failed to cache furniture data:', e);
  }
  
  return data;
};

export const getStyleTemplates = async (): Promise<Style[]> => {
  return simulateDelay([...mockStyles], 400);
};

const generateId = () => `design-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const readDesigns = (): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DESIGNS);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to read designs from localStorage:', e);
    return [];
  }
};

const writeDesigns = (designs: any[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_DESIGNS, JSON.stringify(designs));
  } catch (e) {
    console.error('Failed to write designs to localStorage:', e);
    throw new Error('保存失败，请检查存储空间');
  }
};

const calculateTotalPrice = (items: DesignSaveData['items'], furnitureMap: Map<string, number>): number => {
  return items.reduce((total, item) => {
    return total + (furnitureMap.get(item.furnitureId) || 0) * item.scale;
  }, 0);
};

export const saveDesign = async (design: DesignSaveData): Promise<DesignResponse> => {
  if (!design.name?.trim()) {
    throw new Error('设计方案名称不能为空');
  }
  
  if (!design.items || design.items.length === 0) {
    throw new Error('设计方案不能为空，请添加家具');
  }
  
  const furnitureList = await getFurnitureList();
  const furnitureMap = new Map(furnitureList.map(f => [f.id, f.price]));
  
  const totalPrice = calculateTotalPrice(design.items, furnitureMap);
  
  const now = new Date().toISOString();
  const newDesign = {
    id: generateId(),
    ...design,
    totalPrice,
    createdAt: now,
    updatedAt: now,
    thumbnail: design.items.length > 0 ? '🏠' : '📄',
  };
  
  const designs = readDesigns();
  designs.unshift(newDesign);
  writeDesigns(designs);
  
  return simulateDelay({
    id: newDesign.id,
    success: true,
    message: '设计方案保存成功',
    createdAt: now,
  }, 800);
};

export const getDesigns = async (): Promise<DesignListItem[]> => {
  const designs = readDesigns();
  
  const listItems: DesignListItem[] = designs.map(d => ({
    id: d.id,
    name: d.name,
    description: d.description || '',
    thumbnail: d.thumbnail || '📄',
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    totalPrice: d.totalPrice || 0,
  }));
  
  return simulateDelay(listItems, 400);
};

export const getDesign = async (id: string): Promise<DesignFullData> => {
  const designs = readDesigns();
  const design = designs.find(d => d.id === id);
  
  if (!design) {
    throw new Error('设计方案不存在');
  }
  
  const furnitureList = await getFurnitureList();
  const furnitureMap = new Map(furnitureList.map(f => [f.id, f]));
  
  const itemsWithFurniture = design.items.map((item: any) => ({
    ...item,
    furniture: furnitureMap.get(item.furnitureId) || null,
  })).filter((item: any) => item.furniture !== null);
  
  return simulateDelay({
    id: design.id,
    name: design.name,
    description: design.description || '',
    canvasWidth: design.canvasWidth,
    canvasHeight: design.canvasHeight,
    items: itemsWithFurniture,
    styleId: design.styleId,
    createdAt: design.createdAt,
    updatedAt: design.updatedAt,
    totalPrice: design.totalPrice || 0,
  }, 500);
};

export const getFurniturePrices = async (ids: string[]): Promise<{ [id: string]: number }> => {
  if (!ids || ids.length === 0) {
    return {};
  }
  
  const furnitureList = await getFurnitureList();
  const prices: { [id: string]: number } = {};
  
  ids.forEach(id => {
    const furniture = furnitureList.find(f => f.id === id);
    if (furniture) {
      prices[id] = furniture.price;
    }
  });
  
  return simulateDelay(prices, 300);
};

export const clearFurnitureCache = () => {
  furnitureCache = null;
  localStorage.removeItem(CACHE_KEY_FURNITURE);
};

export default {
  getFurnitureList,
  getStyleTemplates,
  saveDesign,
  getDesigns,
  getDesign,
  getFurniturePrices,
  cancelRequest,
  cancelAllRequests,
  subscribeLoading,
  getLoadingState,
  clearFurnitureCache,
};
