import { create } from 'zustand';
import { get, set, del } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { ClothingItem, Outfit, DailyLogEntry, SocialPost } from '../types';

interface WardrobeStore {
  clothes: ClothingItem[];
  outfits: Outfit[];
  dailyLogs: DailyLogEntry[];
  socialPosts: SocialPost[];

  addClothing: (item: ClothingItem) => void;
  updateClothing: (id: string, partial: Partial<ClothingItem>) => void;
  removeClothing: (id: string) => void;
  addOutfit: (outfit: Outfit) => void;
  removeOutfit: (id: string) => void;
  addDailyLog: (log: DailyLogEntry) => void;
  addSocialPost: (post: SocialPost) => void;
  toggleLike: (id: string) => void;
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

const initialSocialPosts: SocialPost[] = [
  {
    id: uuidv4(),
    userId: 'user1',
    userName: 'Alice',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar%20face%20portrait&image_size=square_hd',
    outfitPhoto: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20outfit%20photo&image_size=portrait_4_3',
    likes: 12,
    liked: false,
    createdAt: Date.now() - 86400000 * 3,
    dailyLogId: uuidv4(),
  },
  {
    id: uuidv4(),
    userId: 'user2',
    userName: 'Bob',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=male%20avatar%20face&image_size=square_hd',
    outfitPhoto: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=casual%20daily%20outfit&image_size=portrait_4_3',
    likes: 8,
    liked: false,
    createdAt: Date.now() - 86400000 * 2,
    dailyLogId: uuidv4(),
  },
  {
    id: uuidv4(),
    userId: 'user3',
    userName: 'Carol',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=woman%20avatar%20face&image_size=square_hd',
    outfitPhoto: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=office%20wear%20outfit&image_size=portrait_4_3',
    likes: 17,
    liked: false,
    createdAt: Date.now() - 86400000,
    dailyLogId: uuidv4(),
  },
  {
    id: uuidv4(),
    userId: 'user4',
    userName: 'Diana',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=girl%20avatar%20face&image_size=square_hd',
    outfitPhoto: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sport%20outfit&image_size=portrait_4_3',
    likes: 5,
    liked: false,
    createdAt: Date.now(),
    dailyLogId: uuidv4(),
  },
];

export const useWardrobeStore = create<WardrobeStore>((set, get) => ({
  clothes: [],
  outfits: [],
  dailyLogs: [],
  socialPosts: initialSocialPosts,

  addClothing: (item) => {
    set((state) => ({ clothes: [...state.clothes, item] }));
    get().saveToDB();
  },

  updateClothing: (id, partial) => {
    set((state) => ({
      clothes: state.clothes.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    }));
    get().saveToDB();
  },

  removeClothing: (id) => {
    set((state) => ({
      clothes: state.clothes.filter((c) => c.id !== id),
    }));
    get().saveToDB();
  },

  addOutfit: (outfit) => {
    set((state) => ({ outfits: [...state.outfits, outfit] }));
    get().saveToDB();
  },

  removeOutfit: (id) => {
    set((state) => ({
      outfits: state.outfits.filter((o) => o.id !== id),
    }));
    get().saveToDB();
  },

  addDailyLog: (log) => {
    set((state) => ({ dailyLogs: [...state.dailyLogs, log] }));
    get().saveToDB();
  },

  addSocialPost: (post) => {
    set((state) => ({ socialPosts: [...state.socialPosts, post] }));
    get().saveToDB();
  },

  toggleLike: (id) => {
    set((state) => ({
      socialPosts: state.socialPosts.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      ),
    }));
    get().saveToDB();
  },

  loadFromDB: async () => {
    try {
      const [clothes, outfits, dailyLogs, socialPosts] = await Promise.all([
        get<ClothingItem[]>('clothes'),
        get<Outfit[]>('outfits'),
        get<DailyLogEntry[]>('dailyLogs'),
        get<SocialPost[]>('socialPosts'),
      ]);
      set({
        clothes: clothes ?? [],
        outfits: outfits ?? [],
        dailyLogs: dailyLogs ?? [],
        socialPosts: socialPosts ?? initialSocialPosts,
      });
    } catch {
      set({
        clothes: [],
        outfits: [],
        dailyLogs: [],
        socialPosts: initialSocialPosts,
      });
    }
  },

  saveToDB: async () => {
    const { clothes, outfits, dailyLogs, socialPosts } = get();
    try {
      await Promise.all([
        set('clothes', clothes),
        set('outfits', outfits),
        set('dailyLogs', dailyLogs),
        set('socialPosts', socialPosts),
      ]);
    } catch (e) {
      console.error('Failed to save to IndexedDB:', e);
    }
  },
}));
