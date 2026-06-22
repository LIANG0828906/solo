export type CapsuleStatus = 'locked' | 'unlocked' | 'opened' | 'archived';

export interface MediaItem {
  id: string;
  type: 'image' | 'audio';
  dataUrl: string;
  name: string;
  size: number;
}

export interface Capsule {
  id: string;
  title: string;
  content: string;
  mediaItems: MediaItem[];
  openDate: string;
  status: CapsuleStatus;
  createdAt: string;
  openedAt?: string;
}

export interface CapsuleStore {
  capsules: Capsule[];
  isLoading: boolean;
  searchQuery: string;
  filterStatus: 'all' | CapsuleStatus;
  sortBy: 'createdAt' | 'openDate';
  sortOrder: 'asc' | 'desc';
  currentTimestamp: number;

  startTimer: () => void;
  stopTimer: () => void;

  fetchCapsules: () => Promise<void>;
  addCapsule: (capsule: Omit<Capsule, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateCapsule: (id: string, updates: Partial<Capsule>) => Promise<void>;
  deleteCapsule: (id: string) => Promise<void>;
  openCapsule: (id: string) => Promise<void>;
  archiveCapsule: (id: string) => Promise<void>;
  checkExpiredCapsules: () => Promise<Capsule[]>;

  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: 'all' | CapsuleStatus) => void;
  setSortBy: (sortBy: 'createdAt' | 'openDate') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;

  getFilteredCapsules: () => Capsule[];
  getCounts: () => { total: number; locked: number; unlocked: number; opened: number; archived: number };
}
