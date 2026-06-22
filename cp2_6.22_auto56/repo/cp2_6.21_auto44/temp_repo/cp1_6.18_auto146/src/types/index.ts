export interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  takenAt: string;
  location: string;
  note: string;
  isFavorite: boolean;
  createdAt: number;
}

export interface PhotoStoreState {
  photos: Photo[];
  currentPage: number;
  favoriteCount: number;
  isFlipping: boolean;
  isCoverOpen: boolean;
  addPhoto: (photo: Omit<Photo, 'id' | 'createdAt' | 'thumbnail' | 'isFavorite'>) => void;
  toggleFavorite: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  setCurrentPage: (page: number) => void;
  setIsFlipping: (flipping: boolean) => void;
  openCover: () => void;
  closeCover: () => void;
}

export interface FlipTransform {
  transform: string;
  boxShadow: string;
  opacity: number;
  zIndex: number;
  filter: string;
}

export interface FlipEngineOptions {
  duration?: number;
  pageWidth: number;
  pageHeight: number;
}

export type FlipDirection = 'next' | 'prev';
