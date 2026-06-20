import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type TravelMode = 'train' | 'ferry';

export interface Schedule {
  id: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  priceMin: number;
  priceMax: number;
  cabinType: string;
}

export interface TripSegment {
  id: string;
  from: string;
  to: string;
  mode: TravelMode;
  selectedSchedule: Schedule;
  scenery: string;
}

export interface LogEntry {
  segmentId: string;
  date: string;
  notes: string;
  photos: string[];
}

export interface City {
  id: string;
  name: string;
  x: number;
  y: number;
}

export const CITIES: City[] = [
  { id: 'paris', name: '巴黎', x: 200, y: 220 },
  { id: 'berlin', name: '柏林', x: 380, y: 160 },
  { id: 'rome', name: '罗马', x: 420, y: 360 },
  { id: 'madrid', name: '马德里', x: 120, y: 380 },
  { id: 'london', name: '伦敦', x: 160, y: 120 },
  { id: 'amsterdam', name: '阿姆斯特丹', x: 290, y: 140 },
  { id: 'prague', name: '布拉格', x: 440, y: 220 },
  { id: 'vienna', name: '维也纳', x: 500, y: 280 },
  { id: 'barcelona', name: '巴塞罗那', x: 180, y: 360 },
  { id: 'milan', name: '米兰', x: 360, y: 300 }
];

const SCENERY_LIBRARY: Record<string, string[]> = {
  paris_london: ['穿越英吉利海峡的海底隧道，感受科技与自然的交融', '从浪漫之都到雾都，窗外是无尽的金色麦田'],
  paris_berlin: ['沿着莱茵河谷疾驰，两岸古堡如童话般错落有致', '跨越德法边境，森林与河流织就的诗画长廊'],
  paris_rome: ['翻越阿尔卑斯山脉，雪峰与云海在车窗外流转', '从塞纳河畔到台伯河，文明的印记在光影中穿梭'],
  paris_madrid: ['穿越比利牛斯山脉，地中海的微风随列车南行', '从卢瓦尔河谷到西班牙高原，色彩斑斓的乡野画卷'],
  paris_amsterdam: ['平坦的低地国家，风车与郁金香交织的梦幻之旅', '穿越佛兰德斯平原，艺术与自然的完美交融'],
  paris_milan: ['沿着蔚蓝海岸前行，地中海的波光在阳光下闪耀', '从时尚之都到设计之城，窗外是连绵的葡萄园'],
  berlin_prague: ['易北河畔的山丘与森林，中世纪小镇如珍珠般散落', '从现代都市到童话王国，波西米亚风情扑面而来'],
  berlin_vienna: ['穿越波美拉尼亚湖区，蓝湖与绿野相伴全程', '从普鲁士的庄严到哈布斯堡的优雅，历史在车窗外流淌'],
  rome_milan: ['穿越托斯卡纳，起伏的丘陵上矗立着古老的石塔', '沿亚平宁山脉北行，橄榄园与葡萄园绵延不绝'],
  madrid_barcelona: ['穿越梅塞塔高原，西班牙的阳光洒满大地', '从内陆高原到地中海沿岸，风景如弗拉明戈般热烈'],
  london_amsterdam: ['北海之滨的湿地草原，海鸟在车窗外自由翱翔', '从泰晤士河到阿姆斯特尔河，水城之间的浪漫连线'],
  prague_vienna: ['沿摩拉瓦河谷穿行，波西米亚森林的低语一路相伴', '从查理大桥到美泉宫，巴洛克建筑的流动盛宴'],
  milan_vienna: ['穿越卡尔尼克阿尔卑斯山脉，雪峰与湖泊交相辉映', '沿多瑙河前行，蓝色的河流如丝带般蜿蜒'],
  barcelona_milan: ['沿地中海海岸线飞驰，蔚蓝的海水与金色沙滩相伴', '从高迪的奇幻世界到达芬奇的科学殿堂，艺术之旅'],
  amsterdam_berlin: ['穿越北德平原，风车与发电塔构成现代与传统的对话', '从运河之城到施普雷河畔，文化的碰撞与融合']
};

const CABIN_TYPES = ['一等座', '二等座', '卧铺包厢', '商务舱', '豪华卧铺'];

function generateSchedules(from: string, to: string, mode: TravelMode): Schedule[] {
  const schedules: Schedule[] = [];
  const basePrice = mode === 'train' ? 60 : 80;
  const variance = Math.floor(Math.random() * 50) + 30;
  
  for (let i = 0; i < 3; i++) {
    const hour = 6 + i * 4 + Math.floor(Math.random() * 2);
    const durationHours = 2 + Math.floor(Math.random() * 6);
    const durationMins = Math.floor(Math.random() * 60);
    const arrivalHour = (hour + durationHours) % 24;
    
    schedules.push({
      id: uuidv4(),
      departureTime: `${hour.toString().padStart(2, '0')}:${(Math.floor(Math.random() * 60)).toString().padStart(2, '0')}`,
      arrivalTime: `${arrivalHour.toString().padStart(2, '0')}:${durationMins.toString().padStart(2, '0')}`,
      duration: `${durationHours}h${durationMins}m`,
      priceMin: basePrice + i * variance,
      priceMax: basePrice + i * variance + variance,
      cabinType: CABIN_TYPES[Math.floor(Math.random() * CABIN_TYPES.length)]
    });
  }
  return schedules;
}

function getScenery(from: string, to: string): string {
  const key1 = `${from}_${to}`;
  const key2 = `${to}_${from}`;
  const library = SCENERY_LIBRARY[key1] || SCENERY_LIBRARY[key2];
  if (library) {
    return library[Math.floor(Math.random() * library.length)];
  }
  return '窗外风景如画，每一站都是新的邂逅';
}

interface StoreState {
  segments: TripSegment[];
  totalBudget: number;
  selectedNode: string | null;
  secondSelectedNode: string | null;
  logEntries: LogEntry[];
  isLogPanelOpen: boolean;
  schedulePopup: {
    from: string;
    to: string;
    schedules: Schedule[];
    mode: TravelMode;
  } | null;
  draggingSegmentIndex: number | null;
  warnings: string[];
  
  setTotalBudget: (budget: number) => void;
  selectNode: (nodeId: string | null) => void;
  addSegment: (from: string, to: string, schedule: Schedule, mode: TravelMode) => void;
  removeSegment: (segmentId: string) => void;
  reorderSegments: (fromIndex: number, toIndex: number) => void;
  setDraggingSegmentIndex: (index: number | null) => void;
  openSchedulePopup: (from: string, to: string, mode: TravelMode) => void;
  closeSchedulePopup: () => void;
  openLogPanel: () => void;
  closeLogPanel: () => void;
  updateLogEntry: (segmentId: string, updates: Partial<LogEntry>) => void;
  addPhotoToLog: (segmentId: string, photoUrl: string) => void;
  removePhotoFromLog: (segmentId: string, photoIndex: number) => void;
  getOptimizationSuggestions: () => string[];
}

export const useStore = create<StoreState>((set, get) => ({
  segments: [],
  totalBudget: 500,
  selectedNode: null,
  secondSelectedNode: null,
  logEntries: [],
  isLogPanelOpen: false,
  schedulePopup: null,
  draggingSegmentIndex: null,
  warnings: [],

  setTotalBudget: (budget: number) => set({ totalBudget: budget }),

  selectNode: (nodeId: string | null) => {
    const state = get();
    if (!nodeId) {
      set({ selectedNode: null, secondSelectedNode: null });
      return;
    }
    if (!state.selectedNode) {
      set({ selectedNode: nodeId });
    } else if (state.selectedNode === nodeId) {
      set({ selectedNode: null });
    } else if (state.selectedNode && !state.secondSelectedNode) {
      set({ secondSelectedNode: nodeId });
      const fromCity = CITIES.find(c => c.id === state.selectedNode);
      const toCity = CITIES.find(c => c.id === nodeId);
      if (fromCity && toCity) {
        const isFerry = (state.selectedNode === 'london' && nodeId === 'paris') ||
                        (state.selectedNode === 'paris' && nodeId === 'london') ||
                        (state.selectedNode === 'barcelona' && nodeId === 'rome') ||
                        (state.selectedNode === 'rome' && nodeId === 'barcelona');
        const mode: TravelMode = isFerry ? 'ferry' : 'train';
        get().openSchedulePopup(state.selectedNode, nodeId, mode);
      }
    }
  },

  addSegment: (from: string, to: string, schedule: Schedule, mode: TravelMode) => {
    const state = get();
    const segment: TripSegment = {
      id: uuidv4(),
      from,
      to,
      mode,
      selectedSchedule: schedule,
      scenery: getScenery(from, to)
    };
    const logEntry: LogEntry = {
      segmentId: segment.id,
      date: new Date(Date.now() + state.segments.length * 86400000).toLocaleDateString('zh-CN'),
      notes: segment.scenery,
      photos: []
    };
    set({
      segments: [...state.segments, segment],
      logEntries: [...state.logEntries, logEntry],
      selectedNode: null,
      secondSelectedNode: null,
      schedulePopup: null
    });
  },

  removeSegment: (segmentId: string) => {
    const state = get();
    set({
      segments: state.segments.filter(s => s.id !== segmentId),
      logEntries: state.logEntries.filter(l => l.segmentId !== segmentId)
    });
  },

  reorderSegments: (fromIndex: number, toIndex: number) => {
    const state = get();
    const newSegments = [...state.segments];
    const newLogs = [...state.logEntries];
    const [movedSegment] = newSegments.splice(fromIndex, 1);
    const [movedLog] = newLogs.splice(fromIndex, 1);
    newSegments.splice(toIndex, 0, movedSegment);
    newLogs.splice(toIndex, 0, movedLog);
    set({ segments: newSegments, logEntries: newLogs });
  },

  setDraggingSegmentIndex: (index: number | null) => set({ draggingSegmentIndex: index }),

  openSchedulePopup: (from: string, to: string, mode: TravelMode) => {
    set({
      schedulePopup: {
        from,
        to,
        schedules: generateSchedules(from, to, mode),
        mode
      }
    });
  },

  closeSchedulePopup: () => set({
    schedulePopup: null,
    selectedNode: null,
    secondSelectedNode: null
  }),

  openLogPanel: () => set({ isLogPanelOpen: true }),
  closeLogPanel: () => set({ isLogPanelOpen: false }),

  updateLogEntry: (segmentId: string, updates: Partial<LogEntry>) => {
    const state = get();
    set({
      logEntries: state.logEntries.map(entry =>
        entry.segmentId === segmentId ? { ...entry, ...updates } : entry
      )
    });
  },

  addPhotoToLog: (segmentId: string, photoUrl: string) => {
    const state = get();
    set({
      logEntries: state.logEntries.map(entry =>
        entry.segmentId === segmentId
          ? { ...entry, photos: [...entry.photos, photoUrl] }
          : entry
      )
    });
  },

  removePhotoFromLog: (segmentId: string, photoIndex: number) => {
    const state = get();
    set({
      logEntries: state.logEntries.map(entry =>
        entry.segmentId === segmentId
          ? { ...entry, photos: entry.photos.filter((_, i) => i !== photoIndex) }
          : entry
      )
    });
  },

  getOptimizationSuggestions: () => {
    const state = get();
    const totalCost = state.segments.reduce((sum, s) => sum + s.selectedSchedule.priceMax, 0);
    const suggestions: string[] = [];
    
    if (totalCost > state.totalBudget * 0.9) {
      state.segments.forEach((segment, index) => {
        if (segment.mode === 'train' && segment.selectedSchedule.priceMax > 80) {
          const saving = Math.floor(segment.selectedSchedule.priceMax * 0.4);
          const fromCity = CITIES.find(c => c.id === segment.from)?.name || segment.from;
          const toCity = CITIES.find(c => c.id === segment.to)?.name || segment.to;
          if (index % 2 === 0) {
            suggestions.push(`将第${index + 1}段【${fromCity} → ${toCity}】换为夜大巴可节省约${saving}欧元`);
          }
        }
      });
    }
    return suggestions;
  }
}));
