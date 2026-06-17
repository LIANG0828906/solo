export interface Checkin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  createdAt: string;
  photo: string;
}

export interface Travelog {
  id: string;
  title: string;
  content: string;
  checkinIds: string[];
  coverPhoto: string;
  createdAt: string;
}

export interface MapState {
  checkins: Checkin[];
  userPosition: [number, number] | null;
  zoom: number;
  loading: boolean;
  fetchCheckins: () => Promise<void>;
  addCheckin: (checkin: Omit<Checkin, 'id' | 'createdAt' | 'photo'>) => Promise<void>;
  deleteCheckin: (id: string) => Promise<void>;
  setUserPosition: (pos: [number, number]) => void;
  setZoom: (zoom: number) => void;
}

export interface TravelogState {
  travelogs: Travelog[];
  favorites: string[];
  loading: boolean;
  fetchTravelogs: () => Promise<void>;
  addTravelog: (travelog: Omit<Travelog, 'id' | 'createdAt' | 'coverPhoto'>) => Promise<void>;
  toggleFavorite: (travelogId: string) => void;
}
