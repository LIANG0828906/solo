export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: Date;
}

export interface Escort {
  id: string;
  name: string;
  avatar: string;
  martialSkill: number;
  experience: number;
  completedMissions: number;
  successfulMissions: number;
}

export interface CartSelection {
  type: 'single' | 'double';
  count: number;
}

export interface Mission {
  id: string;
  userId: string;
  escorts: string[];
  carts: CartSelection[];
  route: string[];
  banditEncounters: number;
  status: 'pending' | 'in-progress' | 'success' | 'failed';
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
}

export interface MapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'town' | 'mountain' | 'river';
}

export interface BanditEvent {
  id: string;
  nodeId: string;
  active: boolean;
  strength: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type MissionStatus = 'pending' | 'in-progress' | 'success' | 'failed';

export interface SuccessRateData {
  date: string;
  rate: number;
}

export interface AppState {
  user: User | null;
  escorts: Escort[];
  missions: Mission[];
  mapNodes: MapNode[];
  currentMission: Mission | null;
  selectedEscorts: string[];
  selectedCarts: CartSelection[];
  banditEvent: BanditEvent | null;
  caravanPosition: Position;
  currentRouteIndex: number;
  toasts: ToastMessage[];
  isAnimating: boolean;
  
  setUser: (user: User | null) => void;
  setEscorts: (escorts: Escort[]) => void;
  setMissions: (missions: Mission[]) => void;
  setMapNodes: (nodes: MapNode[]) => void;
  setCurrentMission: (mission: Mission | null) => void;
  toggleEscortSelection: (escortId: string) => void;
  setSelectedCarts: (carts: CartSelection[]) => void;
  setBanditEvent: (event: BanditEvent | null) => void;
  setCaravanPosition: (pos: Position) => void;
  setCurrentRouteIndex: (index: number) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  clearSelections: () => void;
  setIsAnimating: (animating: boolean) => void;
}
