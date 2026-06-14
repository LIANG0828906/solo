import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type {
  Product,
  ExchangeRequest,
  AppState,
  AppAction,
  RouteState,
} from '@/types';

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
      id: 'mock_mine_1',
      title: 'iPad Air 4 64G 深空灰',
      category: 'electronics',
      condition: 8,
      description:
        '自用 iPad Air 第4代，64G WiFi版，深空灰色。购于2021年，平时看剧做笔记用，屏幕无划痕，边框有一处轻微磕碰。附带原装充电器和保护套。',
      images: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80',
        'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&q=80',
      ],
      exchangePreference: '想换一台任天堂 Switch OLED',
      status: 'published',
      ownerId: CURRENT_USER_ID,
      createdAt: now - 86400000 * 3,
    },
    {
      id: 'mock_mine_2',
      title: 'MUJI 无印良品 懒人沙发',
      category: 'home',
      condition: 7,
      description:
        'MUJI 经典款懒人沙发，米白色。买了两年多，平时放卧室很少用，面料有轻微使用痕迹，填充物依然饱满。自提优先。',
      images: [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
      ],
      exchangePreference: '想换书架或收纳柜',
      status: 'published',
      ownerId: CURRENT_USER_ID,
      createdAt: now - 86400000 * 6,
    },
    {
      id: 'mock_mine_3',
      title: '《设计心理学》全四册',
      category: 'books',
      condition: 9,
      description:
        '唐纳德·诺曼设计心理学套装，全4册。几乎全新，只翻过第一本前几页，做设计的朋友推荐必看系列。',
      images: [
        'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80',
      ],
      exchangePreference: '想换其他设计/产品相关书籍',
      status: 'published',
      ownerId: CURRENT_USER_ID,
      createdAt: now - 86400000 * 10,
    },
    {
      id: 'mock_1',
      title: 'Kindle Paperwhite 电子书阅读器',
      category: 'electronics',
      condition: 8,
      description:
        '自用 Kindle Paperwhite 第10代，使用两年，屏幕无划痕，电池续航正常。附带原装保护套。平时看电子书比较多，现在换了新设备，所以出掉。',
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
      description:
        '尤瓦尔·赫拉利简史两部曲，书脊有轻微磨损，内页干净无笔记。看完觉得很有启发，希望能流转给更多人。',
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
      description:
        '莫兰迪色系陶瓷花瓶，高约25cm，底部直径10cm。买回家发现和家里风格不太搭，几乎全新无瑕疵。',
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
      description:
        '耐克速干运动T恤，黑色M码。穿了几次，略有穿着痕迹但没有破损。适合健身或日常运动穿。',
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
      description:
        'TPE环保瑜伽垫，8mm加厚，长度183cm宽度61cm。有使用痕迹但防滑效果依然很好，附带收纳绑带。',
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
      description:
        '索尼旗舰降噪耳机，音质出色降噪效果一流。使用一年左右，耳罩有轻微磨损，功能全部正常。配件齐全。',
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
      description:
        '复古风格桌面台灯，黄铜金属灯臂+米白色灯罩。三档调光，USB充电。摆在家里很有氛围感，几乎全新。',
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
      description:
        '刘慈欣三体三部曲，地球往事+黑暗森林+死神永生。看完很久了，书边角有折痕，内页有少量笔记划线。',
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

const createMockRequests = (): ExchangeRequest[] => {
  const now = Date.now();
  return [
    {
      id: 'req_1',
      productId: 'mock_mine_1',
      offerDescription:
        '我有一台日版 Switch OLED，白色，购于2022年底，成色9成新，配件齐全，带原装底座和手柄。玩过塞尔达和马里奥，现在不太玩了想换个平板看剧。',
      contactInfo: '微信：gamer_switch_88',
      requesterId: 'user_other_1',
      status: 'pending',
      isRead: false,
      createdAt: now - 3600000 * 2,
    },
    {
      id: 'req_2',
      productId: 'mock_mine_1',
      offerDescription:
        '可以用 iPad Pro 9.7寸 32G + Apple Pencil 第一代交换，iPad 成色8成新，有贴膜带套，功能一切正常。或者补差价也可以商量。',
      contactInfo: '电话：138****5678',
      requesterId: 'user_other_2',
      status: 'pending',
      isRead: false,
      createdAt: now - 3600000 * 5,
    },
    {
      id: 'req_3',
      productId: 'mock_mine_2',
      offerDescription:
        '我有一个宜家的毕利书架，白色，80x28x202cm，买了一年多很新，因为搬家带不走想换个懒人沙发放出租屋。自提可以约在地铁站附近。',
      contactInfo: '微信：ikea_fan_2023',
      requesterId: 'user_other_3',
      status: 'pending',
      isRead: true,
      createdAt: now - 86400000 * 1,
    },
    {
      id: 'req_4',
      productId: 'mock_mine_3',
      offerDescription:
        '我有一套《写给大家看的设计书》+《点石成金》，都是设计经典，书的品相很好几乎全新。或者你有其他想看的书我也可以看看有没有。',
      contactInfo: '微信：design_book_swap',
      requesterId: 'user_other_1',
      status: 'rejected',
      isRead: true,
      createdAt: now - 86400000 * 4,
    },
    {
      id: 'req_5',
      productId: 'mock_mine_2',
      offerDescription:
        '有一个无印良品的亚克力收纳柜，5层抽屉式，放在卧室放衣物和杂物很方便，使用半年九成新。不包邮，最好同城自提。',
      contactInfo: '微信：muji_storage',
      requesterId: 'user_other_2',
      status: 'accepted',
      isRead: true,
      createdAt: now - 86400000 * 7,
    },
  ];
};

const initialState: AppState = {
  products: [],
  requests: [],
  currentUserId: CURRENT_USER_ID,
  route: { name: 'browse' },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [action.payload, ...state.products] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case 'SET_REQUESTS':
      return { ...state, requests: action.payload };
    case 'ADD_REQUEST':
      return { ...state, requests: [action.payload, ...state.requests] };
    case 'UPDATE_REQUEST':
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
        ),
      };
    case 'NAVIGATE':
      return { ...state, route: action.payload };
    default:
      return state;
  }
}

interface DataStoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  navigate: (route: RouteState) => void;
  addProduct: (
    product: Omit<Product, 'id' | 'createdAt' | 'ownerId' | 'status'>
  ) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getMyProducts: () => Product[];
  addRequest: (
    request: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status' | 'isRead'>
  ) => ExchangeRequest;
  getMyReceivedRequests: () => ExchangeRequest[];
  markRequestRead: (id: string) => void;
  acceptRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
}

const DataStoreContext = createContext<DataStoreContextValue | null>(null);

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      const storedRequests = localStorage.getItem(STORAGE_KEY_REQUESTS);

      let products: Product[] = storedProducts ? JSON.parse(storedProducts) : [];
      let requests: ExchangeRequest[] = storedRequests ? JSON.parse(storedRequests) : [];

      if (products.length === 0) {
        products = createMockProducts();
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
      }

      if (requests.length === 0) {
        requests = createMockRequests();
        localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
      }

      dispatch({ type: 'SET_PRODUCTS', payload: products });
      dispatch({ type: 'SET_REQUESTS', payload: requests });
    } catch (e) {
      console.warn('Failed to load from localStorage, using mock data:', e);
      const mockProducts = createMockProducts();
      const mockRequests = createMockRequests();
      dispatch({ type: 'SET_PRODUCTS', payload: mockProducts });
      dispatch({ type: 'SET_REQUESTS', payload: mockRequests });
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(state.products));
    } catch (e) {
      console.error('Failed to save products:', e);
    }
  }, [state.products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(state.requests));
    } catch (e) {
      console.error('Failed to save requests:', e);
    }
  }, [state.requests]);

  const navigate = (route: RouteState) => {
    dispatch({ type: 'NAVIGATE', payload: route });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addProduct: DataStoreContextValue['addProduct'] = (productData) => {
    const newProduct: Product = {
      ...productData,
      id: generateId(),
      createdAt: Date.now(),
      ownerId: CURRENT_USER_ID,
      status: 'published',
    };
    dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    dispatch({ type: 'UPDATE_PRODUCT', payload: { id, updates } });
  };

  const deleteProduct = (id: string) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
  };

  const getMyProducts = () => {
    return state.products.filter((p) => p.ownerId === CURRENT_USER_ID);
  };

  const addRequest: DataStoreContextValue['addRequest'] = (requestData) => {
    const newRequest: ExchangeRequest = {
      ...requestData,
      id: generateId(),
      createdAt: Date.now(),
      status: 'pending',
      isRead: false,
    };
    dispatch({ type: 'ADD_REQUEST', payload: newRequest });
    return newRequest;
  };

  const getMyReceivedRequests = () => {
    const myProductIds = state.products
      .filter((p) => p.ownerId === CURRENT_USER_ID)
      .map((p) => p.id);
    return state.requests.filter((r) => myProductIds.includes(r.productId));
  };

  const markRequestRead = (id: string) => {
    dispatch({ type: 'UPDATE_REQUEST', payload: { id, updates: { isRead: true } } });
  };

  const acceptRequest = (id: string) => {
    const request = state.requests.find((r) => r.id === id);
    dispatch({
      type: 'UPDATE_REQUEST',
      payload: { id, updates: { status: 'accepted', isRead: true } },
    });
    if (request) {
      dispatch({
        type: 'UPDATE_PRODUCT',
        payload: { id: request.productId, updates: { status: 'sold' } },
      });
    }
  };

  const rejectRequest = (id: string) => {
    dispatch({
      type: 'UPDATE_REQUEST',
      payload: { id, updates: { status: 'rejected', isRead: true } },
    });
  };

  return (
    <DataStoreContext.Provider
      value={{
        state,
        dispatch,
        navigate,
        addProduct,
        updateProduct,
        deleteProduct,
        getMyProducts,
        addRequest,
        getMyReceivedRequests,
        markRequestRead,
        acceptRequest,
        rejectRequest,
      }}
    >
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error('useDataStore must be used within DataStoreProvider');
  return ctx;
}
