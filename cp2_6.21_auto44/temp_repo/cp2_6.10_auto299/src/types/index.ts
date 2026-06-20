export type ToolType = 'brush' | 'ink' | 'paper' | 'inkstone';

export interface Tool {
  id: string;
  type: ToolType;
  name: string;
  icon: string;
  quantity: number;
  description: string;
}

export type DefectType = 'missing_character' | 'worm_damage' | 'water_stain' | 'torn_edge' | 'mold_spot';

export interface DefectRequirement {
  type: DefectType;
  name: string;
  description: string;
  requiredTools: ToolType[];
  icon: string;
}

export interface Order {
  id: string;
  bookTitle: string;
  pageNumber: number;
  defect: DefectRequirement;
  timeLimit: number;
  createdAt: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface RestorationLog {
  id: string;
  orderId: string;
  success: boolean;
  toolsUsed: ToolType[];
  poemGenerated?: string;
  eventTriggered?: string;
  experienceGained: number;
  timestamp: string;
}

export interface ValidateRestorationRequest {
  orderId: string;
  tools: ToolType[];
}

export interface ValidateRestorationResponse {
  valid: boolean;
  correctTools: ToolType[];
  message: string;
}

export interface CompleteRestorationRequest {
  orderId: string;
  tools: ToolType[];
  timeRemaining: number;
}

export interface CompleteRestorationResponse {
  success: boolean;
  experienceGained: number;
  poem: string;
  logId: string;
}

export interface TenDayReport {
  period: string;
  totalRestorations: number;
  successfulRestorations: number;
  successRate: number;
  totalExperience: number;
  averageTimePerRepair: number;
  successRateTrend: { day: number; rate: number }[];
  honorTitle: string;
  eventCount: { type: string; count: number }[];
}

export interface PlacedTool {
  id: string;
  type: ToolType;
  position: { x: number; y: number };
}

export interface GameState {
  currentOrder: Order | null;
  timeRemaining: number;
  experience: number;
  level: number;
  tools: Tool[];
  logs: RestorationLog[];
  dayCount: number;
  isWarning: boolean;
  isShaking: boolean;
  showReport: boolean;
  currentReport: TenDayReport | null;
  placedTools: PlacedTool[];
  isDragging: boolean;
}

export interface GameActions {
  setCurrentOrder: (order: Order | null) => void;
  setTimeRemaining: (time: number) => void;
  decrementTime: () => void;
  addExperience: (amount: number) => void;
  updateToolQuantity: (type: ToolType, delta: number) => void;
  addLog: (log: RestorationLog) => void;
  setIsWarning: (warning: boolean) => void;
  setIsShaking: (shaking: boolean) => void;
  setShowReport: (show: boolean) => void;
  setCurrentReport: (report: TenDayReport | null) => void;
  incrementDay: () => void;
  resetGame: () => void;
  addPlacedTool: (tool: PlacedTool) => void;
  removePlacedTool: (toolId: string) => void;
  clearPlacedTools: () => void;
  setIsDragging: (dragging: boolean) => void;
}

export type ParticleType = 'ink' | 'splash' | 'flow';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  type: ParticleType;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

export interface DragState {
  isDragging: boolean;
  draggedTool: Tool | null;
  dragOffset: { x: number; y: number };
}
