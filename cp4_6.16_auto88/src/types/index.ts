export interface GeoPoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  province: string;
}

export interface Restaurant {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  tags: string[];
  signatureDishes: string[];
  city: string;
}

export interface Route {
  id: string;
  origin: GeoPoint;
  destination: GeoPoint;
  path: GeoPoint[];
  distance: number;
  restaurants: Restaurant[];
  createdAt: number;
  shareCode?: string;
}

export interface AppState {
  currentRoute: Route | null;
  savedRoutes: Route[];
  favoriteRestaurants: Restaurant[];
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  isPlanning: boolean;
  toast: ToastMessage | null;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface RouteActions {
  setOrigin: (point: GeoPoint | null) => void;
  setDestination: (point: GeoPoint | null) => void;
  setCurrentRoute: (route: Route | null) => void;
  addRoute: (route: Route) => void;
  removeRoute: (routeId: string) => void;
  toggleFavorite: (restaurant: Restaurant) => void;
  setIsPlanning: (planning: boolean) => void;
  showToast: (message: Omit<ToastMessage, 'id'>) => void;
  hideToast: () => void;
  generateShareCode: (routeId: string) => string;
  loadFromStorage: () => Promise<void>;
}
