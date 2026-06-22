import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Photo, PhotoStoreState } from '../types';
import { generateThumbnail } from '../utils/thumbnail';

const defaultPhotos: Photo[] = [
  {
    id: uuidv4(),
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    thumbnail: '',
    takenAt: '2024-03-15',
    location: '瑞士·阿尔卑斯山',
    note: '清晨的第一缕阳光洒在雪山顶上，整个世界都变得柔软起来。',
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 10
  },
  {
    id: uuidv4(),
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
    thumbnail: '',
    takenAt: '2024-04-22',
    location: '日本·京都',
    note: '樱花盛开的季节，走在哲学之道上，空气里都是温柔的粉色。',
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 8
  },
  {
    id: uuidv4(),
    url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80',
    thumbnail: '',
    takenAt: '2024-05-10',
    location: '挪威·峡湾',
    note: '森林深处的静谧，只有风声和自己的心跳。',
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 6
  },
  {
    id: uuidv4(),
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    thumbnail: '',
    takenAt: '2024-06-05',
    location: '新西兰·皇后镇',
    note: '湖光山色之间，时间仿佛凝固成了一幅油画。',
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: uuidv4(),
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    thumbnail: '',
    takenAt: '2024-07-18',
    location: '冰岛·黑沙滩',
    note: '晨雾中的山峦像是披上了一层薄纱，神秘而梦幻。',
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: uuidv4(),
    url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80',
    thumbnail: '',
    takenAt: '2024-08-30',
    location: '法国·普罗旺斯',
    note: '金色的麦浪在夕阳下翻滚，那是夏天最温柔的告别。',
    isFavorite: false,
    createdAt: Date.now() - 86400000
  }
];

async function initializeThumbnails(photos: Photo[]): Promise<Photo[]> {
  return Promise.all(
    photos.map(async (photo) => {
      if (photo.thumbnail) return photo;
      try {
        const thumbnail = await generateThumbnail(photo.url, 200);
        return { ...photo, thumbnail };
      } catch {
        return photo;
      }
    })
  );
}

export const usePhotoStore = create<PhotoStoreState>((set, get) => ({
  photos: defaultPhotos,
  currentPage: 0,
  favoriteCount: defaultPhotos.filter((p) => p.isFavorite).length,
  isFlipping: false,
  isCoverOpen: false,

  addPhoto: async (photoData) => {
    const id = uuidv4();
    const newPhoto: Photo = {
      ...photoData,
      id,
      thumbnail: '',
      isFavorite: false,
      createdAt: Date.now()
    };

    try {
      newPhoto.thumbnail = await generateThumbnail(photoData.url, 200);
    } catch {
      newPhoto.thumbnail = photoData.url;
    }

    set((state) => ({
      photos: [...state.photos, newPhoto]
    }));
  },

  toggleFavorite: (id) => {
    set((state) => {
      const photos = state.photos.map((p) =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
      );
      const favoriteCount = photos.filter((p) => p.isFavorite).length;
      return { photos, favoriteCount };
    });
  },

  updateNote: (id, note) => {
    set((state) => ({
      photos: state.photos.map((p) => (p.id === id ? { ...p, note } : p))
    }));
  },

  goToNextPage: () => {
    const { currentPage, photos, isFlipping } = get();
    if (isFlipping) return;
    const maxPage = Math.max(0, photos.length - 1);
    if (currentPage < maxPage) {
      set({ isFlipping: true });
      setTimeout(() => {
        set((state) => ({
          currentPage: Math.min(state.currentPage + 1, maxPage),
          isFlipping: false
        }));
      }, 400);
    }
  },

  goToPrevPage: () => {
    const { currentPage, isFlipping } = get();
    if (isFlipping) return;
    if (currentPage > 0) {
      set({ isFlipping: true });
      setTimeout(() => {
        set((state) => ({
          currentPage: Math.max(state.currentPage - 1, 0),
          isFlipping: false
        }));
      }, 400);
    }
  },

  setCurrentPage: (page) => {
    const { photos } = get();
    const maxPage = Math.max(0, photos.length - 1);
    set({ currentPage: Math.max(0, Math.min(page, maxPage)) });
  },

  setIsFlipping: (flipping) => set({ isFlipping: flipping }),

  openCover: () => set({ isCoverOpen: true }),
  closeCover: () => set({ isCoverOpen: false })
}));

export async function preloadDefaultThumbnails() {
  const state = usePhotoStore.getState();
  const photosWithThumbnails = await initializeThumbnails(state.photos);
  usePhotoStore.setState({ photos: photosWithThumbnails });
}
