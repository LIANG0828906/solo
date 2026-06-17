import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type MarkerCategory = 'food' | 'attraction' | 'hotel' | 'shopping';

export interface Marker {
  id: string;
  name: string;
  category: MarkerCategory;
  note: string;
  lat: number;
  lng: number;
  order: number;
}

export interface Collection {
  id: string;
  title: string;
  thumbnail: string;
  markers: Marker[];
  center: [number, number];
  zoom: number;
  createdAt: number;
}

interface MapState {
  markers: Marker[];
  routeOrder: string[];
  collections: Collection[];
  selectedMarkerId: string | null;
  showSidebar: boolean;
  mapCenter: [number, number];
  mapZoom: number;
  pendingMarkerPosition: { lat: number; lng: number } | null;
  showMarkerForm: boolean;

  addMarker: (marker: Omit<Marker, 'id' | 'order'>) => void;
  updateMarker: (id: string, updates: Partial<Marker>) => void;
  deleteMarker: (id: string) => void;
  reorderMarkers: (order: string[]) => void;
  selectMarker: (id: string | null) => void;
  toggleSidebar: () => void;
  setMapView: (center: [number, number], zoom: number) => void;
  _lastSetViewTime: number;
  openMarkerForm: (lat: number, lng: number) => void;
  closeMarkerForm: () => void;
  addCollection: (collection: Omit<Collection, 'id' | 'createdAt'>) => void;
  loadCollection: (id: string) => void;
  deleteCollection: (id: string) => void;
}

export const CATEGORY_COLORS: Record<MarkerCategory, string> = {
  food: '#E74C3C',
  attraction: '#3498DB',
  hotel: '#2ECC71',
  shopping: '#F39C12',
};

export const CATEGORY_ICONS: Record<MarkerCategory, string> = {
  food: '★',
  attraction: '◆',
  hotel: '●',
  shopping: '■',
};

export const CATEGORY_LABELS: Record<MarkerCategory, string> = {
  food: '美食',
  attraction: '景点',
  hotel: '住宿',
  shopping: '购物',
};

const sampleCollections: Collection[] = [
  {
    id: uuidv4(),
    title: '北京三日游攻略',
    thumbnail: '',
    markers: [
      { id: uuidv4(), name: '故宫博物院', category: 'attraction', note: '建议游玩半天，提前预约门票', lat: 39.9163, lng: 116.3972, order: 0 },
      { id: uuidv4(), name: '王府井小吃街', category: 'food', note: '各种北京特色小吃', lat: 39.9147, lng: 116.4104, order: 1 },
      { id: uuidv4(), name: '北京饭店', category: 'hotel', note: '市中心位置便利', lat: 39.9075, lng: 116.4108, order: 2 },
    ],
    center: [39.9042, 116.4074],
    zoom: 12,
    createdAt: Date.now() - 86400000,
  },
  {
    id: uuidv4(),
    title: '上海周末之旅',
    thumbnail: '',
    markers: [
      { id: uuidv4(), name: '外滩', category: 'attraction', note: '夜景必看', lat: 31.2304, lng: 121.4737, order: 0 },
      { id: uuidv4(), name: '南京路步行街', category: 'shopping', note: '购物天堂', lat: 31.2335, lng: 121.4725, order: 1 },
    ],
    center: [31.2304, 121.4737],
    zoom: 12,
    createdAt: Date.now() - 172800000,
  },
];

export const useMapStore = create<MapState>((set, get) => ({
  markers: [],
  routeOrder: [],
  collections: sampleCollections,
  selectedMarkerId: null,
  showSidebar: false,
  mapCenter: [35.8617, 104.1954],
  mapZoom: 5,
  pendingMarkerPosition: null,
  showMarkerForm: false,
  _lastSetViewTime: 0,

  addMarker: (markerData) => {
    const newMarker: Marker = {
      ...markerData,
      id: uuidv4(),
      order: get().markers.length,
    };
    set((state) => ({
      markers: [...state.markers, newMarker],
      routeOrder: [...state.routeOrder, newMarker.id],
    }));
  },

  updateMarker: (id, updates) => {
    set((state) => ({
      markers: state.markers.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  },

  deleteMarker: (id) => {
    set((state) => {
      const newMarkers = state.markers.filter((m) => m.id !== id);
      const newRouteOrder = state.routeOrder.filter((oid) => oid !== id);
      return {
        markers: newMarkers,
        routeOrder: newRouteOrder,
        selectedMarkerId: state.selectedMarkerId === id ? null : state.selectedMarkerId,
      };
    });
  },

  reorderMarkers: (order) => {
    set((state) => {
      const updatedMarkers = state.markers.map((m, index) => ({
        ...m,
        order: order.indexOf(m.id),
      }));
      return {
        markers: updatedMarkers.sort((a, b) => a.order - b.order),
        routeOrder: order,
      };
    });
  },

  selectMarker: (id) => {
    set({ selectedMarkerId: id });
  },

  toggleSidebar: () => {
    set((state) => ({ showSidebar: !state.showSidebar }));
  },

  setMapView: (center, zoom) => {
    const state = get();
    const lastCenter = state.mapCenter;
    const lastZoom = state.mapZoom;

    if (
      Math.abs(center[0] - lastCenter[0]) <= 0.0001 &&
      Math.abs(center[1] - lastCenter[1]) <= 0.0001 &&
      Math.abs(zoom - lastZoom) <= 0.01
    ) {
      return;
    }

    set({ mapCenter: center, mapZoom: zoom });
  },

  openMarkerForm: (lat, lng) => {
    set({
      pendingMarkerPosition: { lat, lng },
      showMarkerForm: true,
    });
  },

  closeMarkerForm: () => {
    set({
      pendingMarkerPosition: null,
      showMarkerForm: false,
    });
  },

  addCollection: (collectionData) => {
    const newCollection: Collection = {
      ...collectionData,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    set((state) => ({
      collections: [...state.collections, newCollection],
    }));
  },

  loadCollection: (id) => {
    const collection = get().collections.find((c) => c.id === id);
    if (collection) {
      set({
        markers: collection.markers,
        routeOrder: collection.markers.map((m) => m.id),
        mapCenter: collection.center,
        mapZoom: collection.zoom,
        showSidebar: false,
        selectedMarkerId: null,
      });
    }
  },

  deleteCollection: (id) => {
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    }));
  },
}));
