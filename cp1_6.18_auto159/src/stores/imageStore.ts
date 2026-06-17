import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { FilterType } from '@/engine/filterEngine';

export interface ImageItem {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  width: number;
  height: number;
  currentFilter: FilterType;
  processedDataUrl?: string;
  albumId?: string;
  order: number;
}

export interface Album {
  id: string;
  name: string;
  imageIds: string[];
  expanded: boolean;
}

interface ImageStoreState {
  images: ImageItem[];
  albums: Album[];
  selectedImageId: string | null;
  carouselOpen: boolean;
  carouselIndex: number;
  carouselAlbumId: string | null;
}

interface ImageStoreActions {
  addImages: (files: Array<{ file: File; dataUrl: string; width: number; height: number }>) => void;
  removeImage: (id: string) => void;
  selectImage: (id: string | null) => void;
  applyFilter: (imageId: string, filter: FilterType, processedDataUrl: string) => void;
  addAlbum: (name: string) => void;
  removeAlbum: (id: string) => void;
  toggleAlbum: (id: string) => void;
  addImageToAlbum: (imageId: string, albumId: string, index?: number) => void;
  removeImageFromAlbum: (imageId: string, albumId: string) => void;
  reorderAlbumImages: (albumId: string, fromIndex: number, toIndex: number) => void;
  openCarousel: (albumId: string, startIndex: number) => void;
  closeCarousel: () => void;
  setCarouselIndex: (index: number) => void;
}

export type ImageStore = ImageStoreState & ImageStoreActions;

const MAX_IMAGES = 10;

const defaultAlbums: Album[] = [
  { id: uuidv4(), name: '风景', imageIds: [], expanded: true },
  { id: uuidv4(), name: '人像', imageIds: [], expanded: true },
  { id: uuidv4(), name: '抽象', imageIds: [], expanded: true },
];

export const useImageStore = create<ImageStore>((set, get) => ({
  images: [],
  albums: defaultAlbums,
  selectedImageId: null,
  carouselOpen: false,
  carouselIndex: 0,
  carouselAlbumId: null,

  addImages: (fileDataList) => {
    const state = get();
    const availableSlots = MAX_IMAGES - state.images.length;
    if (availableSlots <= 0) return;
    const toAdd = fileDataList.slice(0, availableSlots);

    const newImages: ImageItem[] = toAdd.map((fd, idx) => ({
      id: uuidv4(),
      name: fd.file.name,
      size: fd.file.size,
      dataUrl: fd.dataUrl,
      width: fd.width,
      height: fd.height,
      currentFilter: 'none' as FilterType,
      order: state.images.length + idx,
    }));

    set((state) => ({
      images: [...state.images, ...newImages],
      selectedImageId: state.selectedImageId ?? newImages[0]?.id ?? null,
    }));
  },

  removeImage: (id) => {
    set((state) => {
      const images = state.images.filter((img) => img.id !== id);
      const albums = state.albums.map((album) => ({
        ...album,
        imageIds: album.imageIds.filter((iid) => iid !== id),
      }));
      const selectedImageId = state.selectedImageId === id
        ? images[0]?.id ?? null
        : state.selectedImageId;
      return { images, albums, selectedImageId };
    });
  },

  selectImage: (id) => {
    set({ selectedImageId: id });
  },

  applyFilter: (imageId, filter, processedDataUrl) => {
    set((state) => ({
      images: state.images.map((img) =>
        img.id === imageId
          ? { ...img, currentFilter: filter, processedDataUrl }
          : img
      ),
    }));
  },

  addAlbum: (name) => {
    set((state) => ({
      albums: [...state.albums, { id: uuidv4(), name, imageIds: [], expanded: true }],
    }));
  },

  removeAlbum: (id) => {
    set((state) => ({
      albums: state.albums.filter((a) => a.id !== id),
      images: state.images.map((img) =>
        img.albumId === id ? { ...img, albumId: undefined } : img
      ),
    }));
  },

  toggleAlbum: (id) => {
    set((state) => ({
      albums: state.albums.map((a) =>
        a.id === id ? { ...a, expanded: !a.expanded } : a
      ),
    }));
  },

  addImageToAlbum: (imageId, albumId, index) => {
    set((state) => {
      const albums = state.albums.map((a) => {
        if (a.id !== albumId) return a;
        const ids = a.imageIds.filter((i) => i !== imageId);
        if (index !== undefined && index >= 0 && index <= ids.length) {
          ids.splice(index, 0, imageId);
        } else {
          ids.push(imageId);
        }
        return { ...a, imageIds: ids };
      });
      const images = state.images.map((img) =>
        img.id === imageId ? { ...img, albumId } : img
      );
      return { albums, images };
    });
  },

  removeImageFromAlbum: (imageId, albumId) => {
    set((state) => ({
      albums: state.albums.map((a) =>
        a.id === albumId
          ? { ...a, imageIds: a.imageIds.filter((i) => i !== imageId) }
          : a
      ),
      images: state.images.map((img) =>
        img.id === imageId && img.albumId === albumId
          ? { ...img, albumId: undefined }
          : img
      ),
    }));
  },

  reorderAlbumImages: (albumId, fromIndex, toIndex) => {
    set((state) => ({
      albums: state.albums.map((a) => {
        if (a.id !== albumId) return a;
        const ids = [...a.imageIds];
        const [moved] = ids.splice(fromIndex, 1);
        ids.splice(toIndex, 0, moved);
        return { ...a, imageIds: ids };
      }),
    }));
  },

  openCarousel: (albumId, startIndex) => {
    set({
      carouselOpen: true,
      carouselAlbumId: albumId,
      carouselIndex: startIndex,
    });
  },

  closeCarousel: () => {
    set({ carouselOpen: false });
  },

  setCarouselIndex: (index) => {
    const state = get();
    const album = state.albums.find((a) => a.id === state.carouselAlbumId);
    if (!album) return;
    const total = album.imageIds.length;
    if (total === 0) return;
    let newIndex = index % total;
    if (newIndex < 0) newIndex += total;
    set({ carouselIndex: newIndex });
  },
}));

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};
