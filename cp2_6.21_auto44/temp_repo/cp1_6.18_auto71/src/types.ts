export interface Position {
  x: number;
  y: number;
}

export type CapsuleColor = '#6BCB77' | '#4ECDC4' | '#FFD93D' | '#FF6B6B';

export interface Capsule {
  id: string;
  position: Position;
  color: CapsuleColor;
  emoji: string;
  content: string;
  createdAt: number;
  openedAt: number | null;
  isOpened: boolean;
  isMine: boolean;
}

export interface SandParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface DigAnimation {
  id: string;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  type: 'dig' | 'open';
  particles: SandParticle[];
}

export interface LogEntry {
  id: string;
  capsuleId: string;
  summary: string;
  openedAt: number;
}

export type GameStoreState = {
  capsules: Capsule[];
  logs: LogEntry[];
  selectedCapsuleId: string | null;
  showEditor: boolean;
  editorPosition: Position | null;
  showModal: boolean;
  modalCapsule: Capsule | null;
  panelCollapsed: boolean;
  isLoading: boolean;
  focusedCapsuleId: string | null;
};

export type GameStoreActions = {
  setShowEditor: (show: boolean, position?: Position | null) => void;
  setShowModal: (show: boolean, capsule?: Capsule | null) => void;
  setSelectedCapsule: (id: string | null) => void;
  togglePanel: () => void;
  addCapsule: (data: Omit<Capsule, 'id' | 'createdAt' | 'openedAt' | 'isOpened' | 'isMine'>) => Promise<void>;
  openCapsule: (id: string) => Promise<void>;
  fetchCapsules: () => Promise<void>;
  focusCapsule: (id: string) => void;
  clearFocusedCapsule: () => void;
};
