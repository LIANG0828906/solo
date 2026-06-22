export type HealthStatus = 'healthy' | 'normal' | 'attention';

export type SortBy = 'variety' | 'duration' | 'recent';

export type View = 'home' | 'detail' | 'add';

export interface Plant {
  id: string;
  name: string;
  variety: string;
  plantDate: string;
  coverPhoto: string;
  healthStatus: HealthStatus;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  plantId: string;
  imageUrl: string;
  date: string;
  note: string;
  mood: string;
  createdAt: string;
}

export interface AppState {
  plants: Plant[];
  photos: Photo[];
  sortBy: SortBy;
  filterStatus: HealthStatus | null;
  showDashboard: boolean;
  currentView: View;
  selectedPlantId: string | null;
}

export interface AppContextType extends AppState {
  addPlant: (plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deletePlant: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addPhoto: (photo: Omit<Photo, 'id' | 'createdAt'>) => void;
  setSortBy: (sort: SortBy) => void;
  setFilterStatus: (status: HealthStatus | null) => void;
  toggleDashboard: () => void;
  navigate: (view: View, plantId?: string) => void;
  getPlantPhotos: (plantId: string) => Photo[];
  getPlantAge: (plantDate: string) => string;
}
