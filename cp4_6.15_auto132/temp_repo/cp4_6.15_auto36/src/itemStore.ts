import { create } from 'zustand';
import type { Item, Comment } from './types';

interface ItemStore {
  items: Item[];
  comments: Comment[];
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'status'>) => Item;
  getItemById: (id: string) => Item | undefined;
  getItemsByCategory: (category: string) => Item[];
  getItemsByUser: (userId: string) => Item[];
  updateItemStatus: (id: string, status: Item['status']) => void;
  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  getCommentsByItem: (itemId: string) => Comment[];
  getFilteredItems: (filters: {
    category?: string;
    minCondition?: number;
    maxCondition?: number;
  }) => Item[];
}

const generateMockItems = (): Item[] => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: 'item_1',
      userId: 'user_2',
      title: '小王子绘本',
      description: '孩子小时候很喜欢的绘本，保存完好，页面没有破损，希望能找到喜欢它的小朋友。',
      images: [
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=childrens%20picture%20book%20little%20prince%20colorful%20illustration&image_size=square',
      ],
      condition: 8,
      categories: ['书籍', '玩具'],
      createdAt: now - 2 * day,
      status: 'active',
    },
    {
      id: 'item_2',
      userId: 'user_3',
      title: '复古咖啡机',
      description: '用了一年的意式咖啡机，功能完好，因搬家闲置。附赠两包咖啡豆。',
      images: [
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20espresso%20coffee%20machine%20retro%20style&image_size=square',
      ],
      condition: 7,
      categories: ['家居', '电子'],
      createdAt: now - 5 * day,
      status: 'active',
    },
    {
      id: 'item_3',
      userId: 'user_4',
      title: '乐高积木城市系列',
      description: '孩子长大了不玩了，完整套装，说明书还在，颗粒齐全。',
      images: [
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lego%20city%20building%20blocks%20colorful%20toy%20set&image_size=square',
      ],
      condition: 9,
      categories: ['玩具'],
      createdAt: now - 1 * day,
      status: 'active',
    },
    {
      id: 'item_4',
      userId: 'user_5',
      title: '瑜伽垫+拉力带套装',
      description: '健身装备全套，瑜伽垫加厚款，拉力带三种阻力。买回来只用过两次。',
      images: [
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=yoga%20mat%20resistance%20bands%20fitness%20set%20pastel%20colors&image_size=square',
      ],
      condition: 9,
      categories: ['运动'],
      createdAt: now - 10 * day,
      status: 'active',
    },
    {
      id: 'item_5',
      userId: 'user_6',
      title: '多肉植物组合盆栽',
      description: '自己养的多肉，品种丰富，连盆一起送。适合新手入门。',
      images: [
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=succulent%20plants%20arrangement%20cute%20pots%20green&image_size=square',
      ],
      condition: 10,
      categories: ['家居', '其他'],
      createdAt: now - 3 * day,
      status: 'active',
    },
    {
      id: 'item_6',
      userId: 'user_2',
      title: 'Kindle Paperwhite',
      description: '电子阅读器，墨水屏不伤眼，32G大容量，待机时间长。',
      images: [
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kindle%20e-reader%20paperwhite%20ebook%20device%20minimal&image_size=square',
      ],
      condition: 8,
      categories: ['电子', '书籍'],
      createdAt: now - 7 * day,
      status: 'active',
    },
    {
      id: 'item_7',
      userId: 'user_3',
      title: '手工编织毛线帽',
      description: '妈妈织的毛线帽，温暖厚实，冬天戴很舒服。',
      images: [
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20knitted%20wool%20hat%20cozy%20warm%20winter&image_size=square',
      ],
      condition: 10,
      categories: ['其他'],
      createdAt: now - 15 * day,
      status: 'active',
    },
    {
      id: 'item_8',
      userId: 'user_4',
      title: '《三体》全集套装',
      description: '刘慈欣科幻小说三部曲，书脊有轻微磨损，内页完好。',
      images: [
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=three%20body%20problem%20book%20set%20science%20fiction%20novel&image_size=square',
      ],
      condition: 7,
      categories: ['书籍'],
      createdAt: now - 20 * day,
      status: 'active',
    },
  ];
};

export const useItemStore = create<ItemStore>((set, get) => ({
  items: generateMockItems(),
  comments: [
    {
      id: 'comment_1',
      itemId: 'item_1',
      userId: 'user_3',
      content: '请问适合几岁的小朋友看呀？',
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'comment_2',
      itemId: 'item_1',
      userId: 'user_2',
      content: '3-6岁都可以哦，画面很精美~',
      createdAt: Date.now() - 1800000,
    },
  ],

  addItem: (item) => {
    const newItem: Item = {
      ...item,
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      createdAt: Date.now(),
      status: 'active',
    };
    set((state) => ({
      items: [newItem, ...state.items],
    }));
    return newItem;
  },

  getItemById: (id) => {
    return get().items.find((item) => item.id === id);
  },

  getItemsByCategory: (category) => {
    if (category === '全部') return get().items;
    return get().items.filter((item) => item.categories.includes(category));
  },

  getItemsByUser: (userId) => {
    return get().items.filter((item) => item.userId === userId);
  },

  updateItemStatus: (id, status) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    }));
  },

  addComment: (comment) => {
    const newComment: Comment = {
      ...comment,
      id: 'comment_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      createdAt: Date.now(),
    };
    set((state) => ({
      comments: [...state.comments, newComment],
    }));
  },

  getCommentsByItem: (itemId) => {
    return get()
      .comments.filter((c) => c.itemId === itemId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getFilteredItems: ({ category, minCondition, maxCondition }) => {
    let items = get().items.filter((item) => item.status === 'active');
    if (category && category !== '全部') {
      items = items.filter((item) => item.categories.includes(category));
    }
    if (minCondition !== undefined) {
      items = items.filter((item) => item.condition >= minCondition);
    }
    if (maxCondition !== undefined) {
      items = items.filter((item) => item.condition <= maxCondition);
    }
    return items;
  },
}));
