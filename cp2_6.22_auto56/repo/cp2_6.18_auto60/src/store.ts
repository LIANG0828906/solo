import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Product, CartItem, Order } from './types';

const STORAGE_KEY = 'craft-market-data-v2';

interface StoreState {
  products: Product[];
  cart: CartItem[];
  favorites: string[];
  orders: Order[];
  isCartOpen: boolean;
  isMobileMenuOpen: boolean;
  toastMessage: string | null;
  toastExiting: boolean;
  searchQuery: string;

  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  checkout: (buyerName: string) => void;

  toggleFavorite: (productId: string) => void;

  openCart: () => void;
  closeCart: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  setSearchQuery: (query: string) => void;
  showToast: (message: string) => void;
}

const loadState = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        products: parsed.products || seedProducts,
        cart: parsed.cart || [],
        favorites: parsed.favorites || [],
        orders: parsed.orders || [],
      };
    }
  } catch {
    // ignore
  }
  return null;
};

const saveState = (state: Partial<StoreState>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      products: state.products,
      cart: state.cart,
      favorites: state.favorites,
      orders: state.orders,
    }));
  } catch {
    // ignore
  }
};

const imgBase = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=';

const seedProducts: Product[] = [
  {
    id: uuidv4(),
    name: '手工青瓷茶杯',
    price: 128,
    stock: 15,
    description: '采用传统青瓷工艺，手工拉坯烧制。釉色温润如玉，触感细腻。每只茶杯都带有独特窑变效果，是品茶赏器的佳选。',
    category: '陶瓷',
    imageUrl: imgBase + encodeURIComponent('beautiful handmade celadon tea cup ceramic pottery on warm beige background product photography soft lighting'),
    images: [
      imgBase + encodeURIComponent('beautiful handmade celadon tea cup ceramic pottery on warm beige background product photography soft lighting front view'),
      imgBase + encodeURIComponent('beautiful handmade celadon tea cup ceramic pottery on warm beige background product photography soft lighting side view'),
      imgBase + encodeURIComponent('beautiful handmade celadon tea cup ceramic pottery detail close up glaze texture macro'),
    ],
    makerName: '陈窑',
    makerAvatar: '陈',
    material: '高岭土、青釉',
    dimensions: '直径8cm 高9cm',
    productionCycle: '7天',
  },
  {
    id: uuidv4(),
    name: '纯手工编织围巾',
    price: 258,
    stock: 8,
    description: '选用优质羊毛，纯手工编织而成。纹路紧密均匀，保暖性极佳。自然原色，不染色不漂白，亲肤舒适。',
    category: '编织',
    imageUrl: imgBase + encodeURIComponent('cozy handwoven wool scarf craft on warm beige background product photography soft lighting'),
    images: [
      imgBase + encodeURIComponent('cozy handwoven wool scarf craft on warm beige background product photography soft lighting folded view'),
      imgBase + encodeURIComponent('cozy handwoven wool scarf detail weave texture close up macro'),
      imgBase + encodeURIComponent('cozy handwoven wool scarf draped over wooden chair lifestyle'),
    ],
    makerName: '林织',
    makerAvatar: '林',
    material: '纯羊毛',
    dimensions: '长180cm 宽30cm',
    productionCycle: '14天',
  },
  {
    id: uuidv4(),
    name: '樟木观音摆件',
    price: 680,
    stock: 3,
    description: '精选天然樟木，纯手工圆雕。刀法流畅，神态安详。樟木天然防虫，越盘越亮，是镇宅纳福之佳品。',
    category: '木雕',
    imageUrl: imgBase + encodeURIComponent('elegant carved camphor wood Guanyin sculpture figurine on warm beige background product photography soft lighting'),
    makerName: '周木',
    makerAvatar: '周',
    material: '天然樟木',
    dimensions: '高25cm 宽12cm',
    productionCycle: '30天',
  },
  {
    id: uuidv4(),
    name: '景德镇青花碗',
    price: 168,
    stock: 20,
    description: '景德镇传统青花工艺，手绘花鸟纹饰。釉下彩经1300度高温烧制，永不褪色。适合日常用餐，亦可作为收藏。',
    category: '陶瓷',
    imageUrl: imgBase + encodeURIComponent('traditional jingdezhen blue and white porcelain bowl on warm beige background product photography soft lighting'),
    makerName: '王陶',
    makerAvatar: '王',
    material: '高岭土、青花料',
    dimensions: '直径15cm 高7cm',
    productionCycle: '10天',
  },
  {
    id: uuidv4(),
    name: '手工藤编收纳篮',
    price: 89,
    stock: 25,
    description: '天然藤条手工编织，结构牢固耐用。简约自然风格，适合收纳杂物、水果等。每个篮子都经过精心打磨，无毛刺。',
    category: '编织',
    imageUrl: imgBase + encodeURIComponent('handwoven rattan storage basket natural on warm beige background product photography soft lighting'),
    makerName: '张编',
    makerAvatar: '张',
    material: '天然藤条',
    dimensions: '长30cm 宽20cm 高15cm',
    productionCycle: '5天',
  },
  {
    id: uuidv4(),
    name: '黑胡桃木书签',
    price: 45,
    stock: 50,
    description: '选用北美黑胡桃木，手工切割打磨。木纹自然优美，手感温润。配以手工编织流苏，是阅读好伴侣。',
    category: '木雕',
    imageUrl: imgBase + encodeURIComponent('carved walnut wood bookmark with tassel on warm beige background product photography soft lighting'),
    makerName: '李雕',
    makerAvatar: '李',
    material: '北美黑胡桃木',
    dimensions: '长12cm 宽3cm',
    productionCycle: '3天',
  },
  {
    id: uuidv4(),
    name: '窑变釉花瓶',
    price: 368,
    stock: 6,
    description: '高温窑变釉，每只花瓶呈现独一无二的色彩变幻。铜红窑变效果，或如朝霞，或似晚照。兼具观赏与实用价值。',
    category: '陶瓷',
    imageUrl: imgBase + encodeURIComponent('artistic flambe glaze vase pottery on warm beige background product photography soft lighting'),
    makerName: '陈窑',
    makerAvatar: '陈',
    material: '高岭土、窑变釉',
    dimensions: '高28cm 直径12cm',
    productionCycle: '12天',
  },
  {
    id: uuidv4(),
    name: '棉麻编织桌旗',
    price: 138,
    stock: 12,
    description: '天然棉麻混纺，手工编织纹理。素雅自然，适合搭配中式或日式茶席。耐洗耐用，越用越有质感。',
    category: '编织',
    imageUrl: imgBase + encodeURIComponent('handwoven linen table runner on warm beige background product photography soft lighting'),
    makerName: '林织',
    makerAvatar: '林',
    material: '棉麻混纺',
    dimensions: '长150cm 宽30cm',
    productionCycle: '7天',
  },
  {
    id: uuidv4(),
    name: '檀木如意挂件',
    price: 520,
    stock: 4,
    description: '选用老料檀木，精雕如意纹样。木质细腻油润，散发淡雅檀香。可作车内挂饰或随身佩件，寓意吉祥如意。',
    category: '木雕',
    imageUrl: imgBase + encodeURIComponent('carved sandalwood ruyi pendant on warm beige background product photography soft lighting'),
    makerName: '周木',
    makerAvatar: '周',
    material: '老料檀木',
    dimensions: '长8cm 宽3cm',
    productionCycle: '10天',
  },
  {
    id: uuidv4(),
    name: '冰裂纹茶壶',
    price: 298,
    stock: 10,
    description: '传统冰裂釉工艺，釉面自然开片如冰裂。壶身圆润饱满，出水流畅。配以手工制作壶盖，严丝合缝。',
    category: '陶瓷',
    imageUrl: imgBase + encodeURIComponent('crackle glaze teapot ceramic on warm beige background product photography soft lighting'),
    makerName: '王陶',
    makerAvatar: '王',
    material: '紫砂泥、冰裂釉',
    dimensions: '容量200ml 高10cm',
    productionCycle: '15天',
  },
  {
    id: uuidv4(),
    name: '手工竹编果盘',
    price: 76,
    stock: 30,
    description: '精选毛竹，手工劈丝编织。造型简洁大方，竹色清新自然。适合盛放水果、糕点，亦可作为装饰摆件。',
    category: '编织',
    imageUrl: imgBase + encodeURIComponent('bamboo woven fruit basket tray on warm beige background product photography soft lighting'),
    makerName: '张编',
    makerAvatar: '张',
    material: '天然毛竹',
    dimensions: '直径25cm 高5cm',
    productionCycle: '4天',
  },
  {
    id: uuidv4(),
    name: '沉香木手串',
    price: 880,
    stock: 5,
    description: '天然沉香木料，手工车制打磨。珠径均匀，油线清晰。佩戴时散发幽香，有安神静心之效。配精美锦盒。',
    category: '木雕',
    imageUrl: imgBase + encodeURIComponent('agarwood bead bracelet on warm beige background product photography soft lighting'),
    makerName: '李雕',
    makerAvatar: '李',
    material: '天然沉香木',
    dimensions: '珠径10mm 共18颗',
    productionCycle: '7天',
  },
];

const saved = loadState();

export const useStore = create<StoreState>((set, get) => ({
  products: saved?.products || seedProducts,
  cart: saved?.cart || [],
  favorites: saved?.favorites || [],
  orders: saved?.orders || [],
  isCartOpen: false,
  isMobileMenuOpen: false,
  toastMessage: null,
  toastExiting: false,
  searchQuery: '',

  addProduct: (product) => {
    const newProduct: Product = { ...product, id: uuidv4() };
    set((state) => {
      const products = [...state.products, newProduct];
      saveState({ ...state, products });
      return { products };
    });
  },

  updateProduct: (id, updates) => {
    set((state) => {
      const products = state.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      saveState({ ...state, products });
      return { products };
    });
  },

  deleteProduct: (id) => {
    set((state) => {
      const products = state.products.filter((p) => p.id !== id);
      const cart = state.cart.filter((c) => c.productId !== id);
      const favorites = state.favorites.filter((f) => f !== id);
      saveState({ ...state, products, cart, favorites });
      return { products, cart, favorites };
    });
  },

  addToCart: (productId) => {
    set((state) => {
      const existing = state.cart.find((c) => c.productId === productId);
      const product = state.products.find((p) => p.id === productId);
      if (!product) return state;
      const cart = existing
        ? state.cart.map((c) =>
            c.productId === productId
              ? { ...c, quantity: Math.min(c.quantity + 1, product.stock) }
              : c
          )
        : [...state.cart, { productId, quantity: 1 }];
      saveState({ ...state, cart });
      return { cart };
    });
  },

  removeFromCart: (productId) => {
    set((state) => {
      const cart = state.cart.filter((c) => c.productId !== productId);
      saveState({ ...state, cart });
      return { cart };
    });
  },

  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => {
      const product = state.products.find((p) => p.id === productId);
      const cappedQty = product ? Math.min(quantity, product.stock) : quantity;
      const cart = state.cart.map((c) =>
        c.productId === productId ? { ...c, quantity: cappedQty } : c
      );
      saveState({ ...state, cart });
      return { cart };
    });
  },

  clearCart: () => {
    set((state) => {
      saveState({ ...state, cart: [] });
      return { cart: [] };
    });
  },

  checkout: (buyerName) => {
    const state = get();
    const orders = [...state.orders];
    for (const item of state.cart) {
      const product = state.products.find((p) => p.id === item.productId);
      if (product) {
        orders.push({
          id: uuidv4(),
          productId: item.productId,
          buyerName,
          quantity: item.quantity,
          totalPrice: product.price * item.quantity,
          createdAt: new Date().toISOString(),
        });
      }
    }
    const updatedProducts = state.products.map((p) => {
      const cartItem = state.cart.find((c) => c.productId === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    });
    set((state) => {
      const newState = { products: updatedProducts, cart: [], orders, isCartOpen: false };
      saveState({ ...state, ...newState });
      return newState;
    });
    get().showToast('下单成功！感谢您的购买');
  },

  toggleFavorite: (productId) => {
    set((state) => {
      const favorites = state.favorites.includes(productId)
        ? state.favorites.filter((f) => f !== productId)
        : [...state.favorites, productId];
      saveState({ ...state, favorites });
      return { favorites };
    });
  },

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  showToast: (message) => {
    set({ toastMessage: message, toastExiting: false });
    setTimeout(() => {
      set({ toastExiting: true });
      setTimeout(() => {
        set({ toastMessage: null, toastExiting: false });
      }, 300);
    }, 2700);
  },
}));
