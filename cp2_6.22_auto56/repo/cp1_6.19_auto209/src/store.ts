import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Photo,
  Story,
  StoryPageData,
  MapMarker,
  RouteSegment,
  EXIFData,
  extractEXIF,
  extractDominantColors,
  createPhotoObject,
  getImageDimensions,
  generateRouteSegments,
  exportStoryToPDF,
  generateShareLink
} from './utils';

interface AppState {
  photos: Photo[];
  selectedPhotoIds: string[];
  story: Story | null;
  markers: MapMarker[];
  routes: RouteSegment[];
  currentPage: number;
  isPreviewMode: boolean;
  isLoading: boolean;
  error: string | null;

  addPhoto: (file: File) => Promise<void>;
  addPhotos: (files: FileList) => Promise<void>;
  removePhoto: (id: string) => void;
  reorderPhotos: (ids: string[]) => void;
  updatePhotoTime: (id: string, date: Date) => void;
  updateGeoTag: (id: string, lat: number, lng: number, name?: string) => void;
  updateDescription: (photoId: string, content: string) => void;
  selectPhoto: (id: string, multi?: boolean) => void;
  deselectPhoto: (id: string) => void;
  clearSelection: () => void;
  updateStoryTitle: (title: string) => void;
  updateWeather: (weather: 'sunny' | 'cloudy' | 'rainy') => void;
  generateCover: () => void;
  setCurrentPage: (page: number) => void;
  togglePreviewMode: () => void;
  exportPDF: () => Promise<void>;
  generateShareLink: () => string;
  saveToStorage: () => void;
  loadFromStorage: (id: string) => void;
  initStory: () => void;
  updateMarkersAndRoutes: () => void;
}

const STORAGE_PREFIX = 'travel_story_';

export const useStore = create<AppState>((set, get) => ({
  photos: [],
  selectedPhotoIds: [],
  story: null,
  markers: [],
  routes: [],
  currentPage: 0,
  isPreviewMode: false,
  isLoading: false,
  error: null,

  addPhoto: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const exifData: EXIFData = await extractEXIF(file);
      const url = URL.createObjectURL(file);
      const dominantColors = await extractDominantColors(url, 2);
      const dimensions = await getImageDimensions(url);
      
      const photo: Photo = {
        ...createPhotoObject(file, exifData, dominantColors),
        width: dimensions.width,
        height: dimensions.height,
        url
      };
      
      set((state) => {
        const newPhotos = [...state.photos, photo];
        const sortedPhotos = [...newPhotos].sort(
          (a, b) => a.takenAt.getTime() - b.takenAt.getTime()
        );
        return {
          photos: sortedPhotos,
          isLoading: false
        };
      });
      
      get().updateMarkersAndRoutes();
      get().initStory();
    } catch (error) {
      set({ error: '添加照片失败', isLoading: false });
    }
  },

  addPhotos: async (files: FileList) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      await get().addPhoto(file);
    }
  },

  removePhoto: (id: string) => {
    set((state) => {
      const photo = state.photos.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.url);
      }
      
      const newPhotos = state.photos.filter(p => p.id !== id);
      const newSelectedIds = state.selectedPhotoIds.filter(pid => pid !== id);
      
      let newStory = state.story;
      if (state.story) {
        newStory = {
          ...state.story,
          pages: state.story.pages.filter(p => p.photoId !== id),
          updatedAt: new Date()
        };
      }
      
      return {
        photos: newPhotos,
        selectedPhotoIds: newSelectedIds,
        story: newStory
      };
    });
    
    get().updateMarkersAndRoutes();
  },

  reorderPhotos: (ids: string[]) => {
    set((state) => {
      const newPhotos = ids
        .map(id => state.photos.find(p => p.id === id))
        .filter((p): p is Photo => p !== undefined);
      
      return { photos: newPhotos };
    });
    
    get().updateMarkersAndRoutes();
  },

  updatePhotoTime: (id: string, date: Date) => {
    set((state) => ({
      photos: state.photos.map(p =>
        p.id === id ? { ...p, takenAt: date } : p
      )
    }));
    
    get().updateMarkersAndRoutes();
  },

  updateGeoTag: (id: string, lat: number, lng: number, name?: string) => {
    set((state) => ({
      photos: state.photos.map(p =>
        p.id === id
          ? { ...p, latitude: lat, longitude: lng, locationName: name || p.locationName }
          : p
      )
    }));
    
    get().updateMarkersAndRoutes();
  },

  updateDescription: (photoId: string, content: string) => {
    set((state) => {
      if (!state.story) return state;
      
      const existingPage = state.story.pages.find(p => p.photoId === photoId);
      
      let newPages: StoryPageData[];
      if (existingPage) {
        newPages = state.story.pages.map(p =>
          p.photoId === photoId ? { ...p, content } : p
        );
      } else {
        newPages = [
          ...state.story.pages,
          { id: uuidv4(), photoId, content }
        ];
      }
      
      return {
        story: {
          ...state.story,
          pages: newPages,
          updatedAt: new Date()
        }
      };
    });
    
    set((state) => ({
      photos: state.photos.map(p =>
        p.id === photoId ? { ...p, description: content } : p
      )
    }));
  },

  selectPhoto: (id: string, multi = false) => {
    set((state) => {
      if (multi) {
        const isSelected = state.selectedPhotoIds.includes(id);
        return {
          selectedPhotoIds: isSelected
            ? state.selectedPhotoIds.filter(pid => pid !== id)
            : [...state.selectedPhotoIds, id]
        };
      } else {
        return { selectedPhotoIds: [id] };
      }
    });
  },

  deselectPhoto: (id: string) => {
    set((state) => ({
      selectedPhotoIds: state.selectedPhotoIds.filter(pid => pid !== id)
    }));
  },

  clearSelection: () => {
    set({ selectedPhotoIds: [] });
  },

  updateStoryTitle: (title: string) => {
    set((state) => {
      if (!state.story) return state;
      return {
        story: {
          ...state.story,
          title,
          updatedAt: new Date()
        }
      };
    });
  },

  updateWeather: (weather: 'sunny' | 'cloudy' | 'rainy') => {
    set((state) => {
      if (!state.story) return state;
      return {
        story: {
          ...state.story,
          weather,
          updatedAt: new Date()
        }
      };
    });
  },

  generateCover: () => {
    set((state) => {
      if (!state.story || state.photos.length === 0) return state;
      
      const allColors = state.photos.flatMap(p => p.dominantColors);
      const coverColors: [string, string] = allColors.length >= 2
        ? [allColors[0], allColors[1]]
        : ['#FC5C65', '#FEB72B'];
      
      return {
        story: {
          ...state.story,
          coverColors,
          updatedAt: new Date()
        }
      };
    });
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
  },

  togglePreviewMode: () => {
    set((state) => ({ isPreviewMode: !state.isPreviewMode }));
  },

  exportPDF: async () => {
    const { story, photos } = get();
    if (!story || photos.length === 0) {
      set({ error: '请先添加照片并创建故事' });
      return;
    }
    
    set({ isLoading: true });
    try {
      await exportStoryToPDF(story, photos, 'story-preview-container');
      set({ isLoading: false });
    } catch (error) {
      set({ error: '导出PDF失败', isLoading: false });
    }
  },

  generateShareLink: () => {
    const { story } = get();
    if (!story) {
      set({ error: '请先创建故事' });
      return '';
    }
    
    get().saveToStorage();
    return generateShareLink(story.id);
  },

  saveToStorage: () => {
    const { photos, story } = get();
    if (!story) return;
    
    const serializablePhotos = photos.map(p => ({
      ...p,
      takenAt: p.takenAt.toISOString(),
      file: null
    }));
    
    const data = {
      photos: serializablePhotos,
      story: {
        ...story,
        createdAt: story.createdAt.toISOString(),
        updatedAt: story.updatedAt.toISOString()
      }
    };
    
    localStorage.setItem(STORAGE_PREFIX + story.id, JSON.stringify(data));
  },

  loadFromStorage: (id: string) => {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + id);
      if (!data) return;
      
      const parsed = JSON.parse(data);
      
      const photos: Photo[] = parsed.photos.map((p: Photo & { takenAt: string; file: null }) => ({
        ...p,
        takenAt: new Date(p.takenAt),
        file: null as unknown as File,
        url: p.url || ''
      }));
      
      const story: Story = {
        ...parsed.story,
        createdAt: new Date(parsed.story.createdAt),
        updatedAt: new Date(parsed.story.updatedAt)
      };
      
      set({
        photos,
        story,
        isPreviewMode: true
      });
      
      get().updateMarkersAndRoutes();
    } catch (error) {
      set({ error: '加载分享数据失败' });
    }
  },

  initStory: () => {
    set((state) => {
      if (state.story || state.photos.length === 0) return state;
      
      const sortedPhotos = [...state.photos].sort(
        (a, b) => a.takenAt.getTime() - b.takenAt.getTime()
      );
      
      const pages: StoryPageData[] = sortedPhotos.map(photo => ({
        id: uuidv4(),
        photoId: photo.id,
        content: photo.description || ''
      }));
      
      const allColors = sortedPhotos.flatMap(p => p.dominantColors);
      const coverColors: [string, string] = allColors.length >= 2
        ? [allColors[0], allColors[1]]
        : ['#FC5C65', '#FEB72B'];
      
      return {
        story: {
          id: uuidv4(),
          title: '我的旅行故事',
          weather: 'sunny',
          coverColors,
          pages,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
    });
  },

  updateMarkersAndRoutes: () => {
    set((state) => {
      const markers: MapMarker[] = state.photos
        .filter(p => p.latitude !== undefined && p.longitude !== undefined)
        .map(p => ({
          id: uuidv4(),
          photoId: p.id,
          latitude: p.latitude!,
          longitude: p.longitude!,
          locationName: p.locationName || '未知地点'
        }));
      
      const routes = generateRouteSegments(state.photos);
      
      return { markers, routes };
    });
  }
}));
