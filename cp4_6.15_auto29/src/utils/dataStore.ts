import { create } from 'zustand';
import type { Product, ExchangeRequest, Category, ProductStatus, RequestStatus } from '@/types';

const STORAGE_KEY_PRODUCTS = 'secondhand_products';
const STORAGE_KEY_REQUESTS = 'secondhand_requests';
const CURRENT_USER_ID = 'user_me';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const createMockProducts = (): Product[] => {
  const now = Date.now();
  return [
    {
      id: 'mock_1',
      title: 'Kindle Paperwhite 电子书阅读器',
      category: 'electronics',
      condition: 8,
      description: '自用 Kindle Paperwhite 第10代，使用两年，屏幕无划痕，电池续航正常。附带原装保护套。平时看电子书比较多，现在换了新设备，所以出掉。',
      images: [
        'https://images.unsplash.com/photo-1585988981947-3744762582e2?w=600&q=80',
        'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&q=80',
      ],
      exchangePreference: '想换一套心理学书籍',
      status: 'published',
      ownerId: 'user_other_1',
      createdAt: now - 86400000 * 2,
    },
    {
      id: 'mock_2',
      title: '《人类简史》+《未来简史》套装',
      category: 'books',
      condition: 7,
      description: '尤瓦尔·赫拉利简史两部曲，书脊有轻微磨损，内页干净无笔记。看完觉得很有启发，希望能流转给更多人。',
      images: [
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80',
      ],
      exchangePreference: '不限，有趣的书都可以',
      status: 'published',
      ownerId: 'user_other_2',
      createdAt: now - 86400000 * 5,
    },
    {
      id: 'mock_3',
      title: '北欧风陶瓷花瓶',
      category: 'home',
      condition: 9,
      description: '莫兰迪色系陶瓷花瓶，高约25cm，底部直径10cm。买回家发现和家里风格不太搭，几乎全新无瑕疵。',
      images: [
        'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600&q=80',
        'https://images.unsplash.com/photo-1518893063132-36e46dbe2428?w=600&q=80',
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80',
      ],
      exchangePreference: '想换香薰蜡烛或装饰画',
      status: 'published',
      ownerId: 'user_other_1',
      createdAt: now - 86400000 * 1,
    },
    {
      id: 'mock_4',
      title: '耐克运动T恤 M码',
      category: 'clothing',
      condition: 6,
      description: '耐克速干运动T恤，黑色M码。穿了几次，略有穿着痕迹但没有破损。适合健身或日常运动穿。',
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
      ],
      exchangePreference: '想换瑜伽垫或跳绳',
      status: 'published',
      ownerId: 'user_other_3',
      createdAt: now - 86400000 * 3,
    },
    {
      id: 'mock_5',
      title: '瑜伽垫 8mm加厚',
      category: 'sports',
      condition: 7,
      description: 'TPE环保瑜伽垫，8mm加厚，长度183cm宽度61cm。有使用痕迹但防滑效果依然很好，附带收纳绑带。',
      images: [
        'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80',
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
      ],
      exchangePreference: '不限，运动相关都可以',
      status: 'published',
      ownerId: 'user_other_2',
      createdAt: now - 86400000 * 7,
    },
    {
      id: 'mock_6',
      title: '索尼 WH-1000XM4 降噪耳机',
      category: 'electronics',
      condition: 8,
      description: '索尼旗舰降噪耳机，音质出色降噪效果一流。使用一年左右，耳罩有轻微磨损，功能全部正常。配件齐全。',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80',
      ],
      exchangePreference: '想换拍立得相机',
      status: 'published',
      ownerId: 'user_other_3',
      createdAt: now - 86400000 * 4,
    },
    {
      id: 'mock_7',
      title: '复古台灯 黄铜色',
      category: 'home',
      condition: 9,
      description: '复古风格桌面台灯，黄铜金属灯臂+米白色灯罩。三档调光，USB充电。摆在家里很有氛围感，几乎全新。',
      images: [
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
      ],
      exchangePreference: '想换多肉植物盆栽',
      status: 'published',
      ownerId: 'user_other_1',
      createdAt: now - 86400000 * 6,
    },
    {
      id: 'mock_8',
      title: '《三体》全集 三本套装',
      category: 'books',
      condition: 6,
      description: '刘慈欣三体三部曲，地球往事+黑暗森林+死神永生。看完很久了，书边角有折痕，内页有少量笔记划线。',
      images: [
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80',
      ],
      exchangePreference: '想换其他科幻小说',
      status: 'published',
      ownerId: 'user_other_2',
      createdAt: now - 86400000 * 10,
    },
  ];
};

interface DataStoreState {
  products: Product[];
  requests: ExchangeRequest[];
  currentUserId: string;
  
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'ownerId' | 'status'>) => Product;
  getProduct: (id: string) => Product | undefined;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getMyProducts: () => Product[];
  getProductsByCategory: (category: Category | 'all') => Product[];
  
  addRequest: (request: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status' | 'isRead'>) => ExchangeRequest;
  getRequestsForProduct: (productId: string) => ExchangeRequest[];
  getMyReceivedRequests: () => ExchangeRequest[];
  markRequestRead: (id: string) => void;
  acceptRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const useDataStore = create<DataStoreState>((set, get) => ({
  products: [],
  requests: [],
  currentUserId: CURRENT_USER_ID,

  addProduct: (productData) => {
    const newProduct: Product = {
      ...productData,
      id: generateId(),
      createdAt: Date.now(),
      ownerId: CURRENT_USER_ID,
      status: 'published',
    };
    set((state) => ({
      products: [newProduct, ...state.products],
    }));
    get().saveToStorage();
    return newProduct;
  },

  getProduct: (id) => {
    return get().products.find((p) => p.id === id);
  },

  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
    get().saveToStorage();
  },

  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
    get().saveToStorage();
  },

  getMyProducts: () => {
    return get().products.filter((p) => p.ownerId === CURRENT_USER_ID);
  },

  getProductsByCategory: (category) => {
    const { products } = get();
    if (category === 'all') {
      return products.filter((p) => p.status === 'published');
    }
    return products.filter((p) => p.category === category && p.status === 'published');
  },

  addRequest: (requestData) => {
    const newRequest: ExchangeRequest = {
      ...requestData,
      id: generateId(),
      createdAt: Date.now(),
      status: 'pending',
      isRead: false,
    };
    set((state) => ({
      requests: [newRequest, ...state.requests],
    }));
    get().saveToStorage();
    return newRequest;
  },

  getRequestsForProduct: (productId) => {
    return get().requests.filter((r) => r.productId === productId);
  },

  getMyReceivedRequests: () => {
    const { products, requests, currentUserId } = get();
    const myProductIds = products
      .filter((p) => p.ownerId === currentUserId)
      .map((p) => p.id);
    return requests.filter((r) => myProductIds.includes(r.productId));
  },

  markRequestRead: (id) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, isRead: true } : r
      ),
    }));
    get().saveToStorage();
  },

  acceptRequest: (id) => {
    const request = get().requests.find((r) => r.id === id);
    if (request) {
      set((state) => ({
        requests: state.requests.map((r) =>
          r.id === id ? { ...r, status: 'accepted', isRead: true } : r
        ),
        products: state.products.map((p) =>
          p.id === request.productId ? { ...p, status: 'sold' } : p
        ),
      }));
      get().saveToStorage();
    }
  },

  rejectRequest: (id) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, status: 'rejected', isRead: true } : r
      ),
    }));
    get().saveToStorage();
  },

  loadFromStorage: () => {
    try {
      const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      const storedRequests = localStorage.getItem(STORAGE_KEY_REQUESTS);
      
      let products: Product[] = storedProducts ? JSON.parse(storedProducts) : [];
      let requests: ExchangeRequest[] = storedRequests ? JSON.parse(storedRequests) : [];

      if (products.length === 0) {
        products = createMockProducts();
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
      }

      set({ products, requests });
    } catch (e) {
      console.error('Failed to load from storage:', e);
      const mockProducts = createMockProducts();
      set({ products: mockProducts, requests: [] });
    }
  },

  saveToStorage: () => {
    try {
      const { products, requests } = get();
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  },
}));
