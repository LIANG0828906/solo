import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Gallery, Artwork } from '../shared/types';

interface ArtworkState {
  galleries: Gallery[];
  currentGalleryId: string | null;
  setCurrentGallery: (id: string | null) => void;
  createGallery: (name: string, description: string, creatorId: string, creatorName: string, wallColor?: string, isPublic?: boolean) => Gallery;
  deleteGallery: (galleryId: string) => void;
  updateGallery: (galleryId: string, updates: Partial<Gallery>) => void;
  addArtwork: (galleryId: string, artwork: Omit<Artwork, 'id' | 'uploadedAt' | 'likes' | 'ratings' | 'averageRating' | 'commentCount' | 'position'>) => Artwork;
  deleteArtwork: (galleryId: string, artworkId: string) => void;
  getCurrentGallery: () => Gallery | undefined;
  getArtworkById: (artworkId: string) => Artwork | undefined;
  incrementArtworkLikes: (artworkId: string) => void;
  incrementCommentCount: (artworkId: string, delta: number) => void;
  updateArtworkRating: (artworkId: string, rating: number) => void;
  getPublicGalleries: () => Gallery[];
  followGallery: (galleryId: string, userId: string) => void;
  unfollowGallery: (galleryId: string, userId: string) => void;
}

const generateRandomLocation = () => {
  const cities = [
    { name: '北京', lat: 39.9042, lng: 116.4074 },
    { name: '上海', lat: 31.2304, lng: 121.4737 },
    { name: '东京', lat: 35.6762, lng: 139.6503 },
    { name: '纽约', lat: 40.7128, lng: -74.0060 },
    { name: '伦敦', lat: 51.5074, lng: -0.1278 },
    { name: '巴黎', lat: 48.8566, lng: 2.3522 },
    { name: '罗马', lat: 41.9028, lng: 12.4964 },
    { name: '悉尼', lat: -33.8688, lng: 151.2093 },
    { name: '首尔', lat: 37.5665, lng: 126.9780 },
    { name: '新加坡', lat: 1.3521, lng: 103.8198 },
    { name: '柏林', lat: 52.5200, lng: 13.4050 },
    { name: '莫斯科', lat: 55.7558, lng: 37.6173 },
  ];
  return cities[Math.floor(Math.random() * cities.length)];
};

const generateArtworkPositions = (count: number): Artwork['position'][] => {
  const positions: Artwork['position'][] = [];
  const walls: Array<'front' | 'back' | 'left' | 'right'> = ['front', 'right', 'back', 'left'];
  const perWall = Math.ceil(count / 4);
  let current = 0;
  for (const wall of walls) {
    for (let i = 0; i < perWall && current < count; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      positions.push({
        wall,
        x: (col - 1) * 3.5,
        y: 0 - row * 3,
      });
      current++;
    }
  }
  return positions.slice(0, count);
};

export const useArtworkStore = create<ArtworkState>()(
  persist(
    (set, get) => ({
      galleries: [],
      currentGalleryId: null,

      setCurrentGallery: (id) => set({ currentGalleryId: id }),

      createGallery: (name, description, creatorId, creatorName, wallColor = '#C4B7A6', isPublic = true) => {
        const location = generateRandomLocation();
        const newGallery: Gallery = {
          id: uuidv4(),
          name,
          description,
          creatorId,
          creatorName,
          wallColor,
          isPublic,
          coverImage: '',
          artworks: [],
          followers: [],
          location: { lat: location.lat, lng: location.lng, city: location.name },
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ galleries: [...state.galleries, newGallery] }));
        return newGallery;
      },

      deleteGallery: (galleryId) => {
        set((state) => ({
          galleries: state.galleries.filter((g) => g.id !== galleryId),
          currentGalleryId: state.currentGalleryId === galleryId ? null : state.currentGalleryId,
        }));
      },

      updateGallery: (galleryId, updates) => {
        set((state) => ({
          galleries: state.galleries.map((g) =>
            g.id === galleryId ? { ...g, ...updates } : g
          ),
        }));
      },

      addArtwork: (galleryId, artworkData) => {
        const newArtwork: Artwork = {
          ...artworkData,
          id: uuidv4(),
          uploadedAt: new Date().toISOString(),
          likes: 0,
          ratings: [],
          averageRating: 0,
          commentCount: 0,
          position: { wall: 'front', x: 0, y: 0 },
        };
        set((state) => {
          const gallery = state.galleries.find((g) => g.id === galleryId);
          if (!gallery) return state;
          const updatedArtworks = [...gallery.artworks, newArtwork];
          const positions = generateArtworkPositions(updatedArtworks.length);
          const positioned = updatedArtworks.map((a, i) => ({
            ...a,
            position: positions[i] || { wall: 'front', x: 0, y: 0 },
          }));
          const lastArtwork = positioned[positioned.length - 1];
          return {
            galleries: state.galleries.map((g) =>
              g.id === galleryId
                ? {
                    ...g,
                    artworks: positioned,
                    coverImage: g.coverImage || lastArtwork.thumbnailUrl,
                  }
                : g
            ),
          };
        });
        return newArtwork;
      },

      deleteArtwork: (galleryId, artworkId) => {
        set((state) => ({
          galleries: state.galleries.map((g) =>
            g.id === galleryId
              ? {
                  ...g,
                  artworks: g.artworks.filter((a) => a.id !== artworkId),
                }
              : g
          ),
        }));
      },

      getCurrentGallery: () => {
        const { galleries, currentGalleryId } = get();
        return galleries.find((g) => g.id === currentGalleryId);
      },

      getArtworkById: (artworkId) => {
        const { galleries } = get();
        for (const g of galleries) {
          const artwork = g.artworks.find((a) => a.id === artworkId);
          if (artwork) return artwork;
        }
        return undefined;
      },

      incrementArtworkLikes: (artworkId) => {
        set((state) => ({
          galleries: state.galleries.map((g) => ({
            ...g,
            artworks: g.artworks.map((a) =>
              a.id === artworkId ? { ...a, likes: a.likes + 1 } : a
            ),
          })),
        }));
      },

      incrementCommentCount: (artworkId, delta) => {
        set((state) => ({
          galleries: state.galleries.map((g) => ({
            ...g,
            artworks: g.artworks.map((a) =>
              a.id === artworkId ? { ...a, commentCount: Math.max(0, a.commentCount + delta) } : a
            ),
          })),
        }));
      },

      updateArtworkRating: (artworkId, rating) => {
        set((state) => ({
          galleries: state.galleries.map((g) => ({
            ...g,
            artworks: g.artworks.map((a) => {
              if (a.id !== artworkId) return a;
              const newRatings = [...a.ratings, rating];
              return {
                ...a,
                ratings: newRatings,
                averageRating: newRatings.reduce((s, r) => s + r, 0) / newRatings.length,
              };
            }),
          })),
        }));
      },

      getPublicGalleries: () => {
        return get().galleries.filter((g) => g.isPublic);
      },

      followGallery: (galleryId, userId) => {
        set((state) => ({
          galleries: state.galleries.map((g) => {
            if (g.id !== galleryId) return g;
            if (g.followers.includes(userId)) return g;
            return { ...g, followers: [...g.followers, userId] };
          }),
        }));
      },

      unfollowGallery: (galleryId, userId) => {
        set((state) => ({
          galleries: state.galleries.map((g) => {
            if (g.id !== galleryId) return g;
            return { ...g, followers: g.followers.filter((f) => f !== userId) };
          }),
        }));
      },
    }),
    {
      name: 'artwork-store',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);
