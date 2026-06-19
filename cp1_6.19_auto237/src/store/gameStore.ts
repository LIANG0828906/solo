import { create } from 'zustand';

export type EventType = 'major' | 'minor' | 'turning';

export interface HistoryEvent {
  id: string;
  title: string;
  year: number;
  type: EventType;
  description: string;
  causalAfter?: string[];
  causalBefore?: string[];
}

export interface Beacon {
  id: string;
  createdAt: number;
  color: string;
  x: number;
  y: number;
  isDragging: boolean;
  isDelivered: boolean;
  deliveredTo?: string;
}

export interface GraphNode {
  id: string;
  eventId: string;
  title: string;
  type: EventType;
  x: number;
  y: number;
  deliveredYear: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  isCorrect: boolean;
}

export interface DeliveryRecord {
  id: string;
  beaconId: string;
  eventId: string;
  year: number;
  timestamp: number;
}

interface DeliveryAnimation {
  id: string;
  x: number;
  y: number;
  color: string;
}

interface GameState {
  events: HistoryEvent[];
  beacons: Beacon[];
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  deliveries: DeliveryRecord[];
  deliveredEventIds: Set<string>;
  isCausallyClosed: boolean;
  animations: DeliveryAnimation[];

  createBeacon: (year: number, x: number, y: number) => Beacon | null;
  updateBeaconPosition: (id: string, x: number, y: number, isDragging: boolean) => void;
  deliverBeacon: (beaconId: string, eventId: string, animX?: number, animY?: number) => void;
  setNodeFixed: (id: string, fx: number | null, fy: number | null) => void;
  updateGraphLayout: (updates: Array<{ id: string; x: number; y: number }>) => void;
  clearAnimation: (id: string) => void;
  resetGame: () => void;
}

const BEACON_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D'];

const DEFAULT_EVENTS: HistoryEvent[] = [
  { id: 'e1', title: '爱因斯坦发表相对论', year: 1905, type: 'major', description: '改变物理学根基的论文', causalBefore: ['e3', 'e4'] },
  { id: 'e2', title: '贝尔德发明电视机', year: 1925, type: 'minor', description: '首次公开演示机械电视', causalBefore: ['e5'] },
  { id: 'e3', title: '曼哈顿计划启动', year: 1942, type: 'turning', description: '核能与武器的十字路口', causalAfter: ['e1'], causalBefore: ['e6'] },
  { id: 'e4', title: '图灵破解恩尼格玛', year: 1943, type: 'turning', description: '计算机科学的黎明', causalAfter: ['e1'], causalBefore: ['e7', 'e10'] },
  { id: 'e5', title: '阿波罗11号登月', year: 1969, type: 'major', description: '人类踏上月球表面', causalAfter: ['e2'], causalBefore: ['e8'] },
  { id: 'e6', title: '冷战和平协议签署', year: 1989, type: 'turning', description: '两极格局走向终结', causalAfter: ['e3'], causalBefore: ['e9'] },
  { id: 'e7', title: '万维网向公众开放', year: 1991, type: 'major', description: '信息时代的真正起点', causalAfter: ['e4'], causalBefore: ['e9', 'e10'] },
  { id: 'e8', title: '国际空间站建成', year: 1998, type: 'minor', description: '多国协作的轨道实验室', causalAfter: ['e5'], causalBefore: ['e11'] },
  { id: 'e9', title: '全球气候协定达成', year: 2015, type: 'turning', description: '碳排放的历史转折点', causalAfter: ['e6', 'e7'], causalBefore: ['e12'] },
  { id: 'e10', title: '通用人工智能觉醒', year: 2048, type: 'major', description: 'AI跨越自我意识边界', causalAfter: ['e4', 'e7'], causalBefore: ['e11', 'e12'] },
  { id: 'e11', title: '火星殖民地自给', year: 2071, type: 'minor', description: '红色星球的第一座闭环城', causalAfter: ['e8', 'e10'], causalBefore: ['e12'] },
  { id: 'e12', title: '时间管理局成立', year: 2090, type: 'turning', description: '守护历史免于悖论侵蚀', causalAfter: ['e9', 'e10', 'e11'] },
];

const makeId = () => Math.random().toString(36).slice(2, 10);
const pickColor = () => BEACON_COLORS[Math.floor(Math.random() * BEACON_COLORS.length)];

function recomputeEdges(
  events: HistoryEvent[],
  deliveries: DeliveryRecord[]
): { edges: GraphEdge[]; closed: boolean } {
  const eventIdsInGraph = new Set(deliveries.map((d) => d.eventId));
  const edges: GraphEdge[] = [];
  let correctCount = 0;
  let totalCount = 0;

  deliveries.forEach((d) => {
    const ev = events.find((e) => e.id === d.eventId);
    if (!ev) return;
    const causalBefore = ev.causalBefore || [];
    const causalAfter = ev.causalAfter || [];

    causalBefore.forEach((targetId) => {
      if (!eventIdsInGraph.has(targetId)) return;
      totalCount++;
      const targetDelivery = deliveries.find((dd) => dd.eventId === targetId);
      const isCorrect = !!targetDelivery && targetDelivery.year >= d.year;
      if (isCorrect) correctCount++;
      edges.push({
        id: `${d.eventId}->${targetId}`,
        source: d.eventId,
        target: targetId,
        isCorrect,
      });
    });

    causalAfter.forEach((sourceId) => {
      if (!eventIdsInGraph.has(sourceId)) return;
      const key = `${sourceId}->${d.eventId}`;
      if (edges.some((e) => e.id === key)) return;
      totalCount++;
      const sourceDelivery = deliveries.find((dd) => dd.eventId === sourceId);
      const isCorrect = !!sourceDelivery && sourceDelivery.year <= d.year;
      if (isCorrect) correctCount++;
      edges.push({
        id: key,
        source: sourceId,
        target: d.eventId,
        isCorrect,
      });
    });
  });

  const uniqueEdges: GraphEdge[] = [];
  const seen = new Set<string>();
  edges.forEach((e) => {
    if (!seen.has(e.id)) {
      seen.add(e.id);
      uniqueEdges.push(e);
    }
  });

  const hasParadox = uniqueEdges.length > 0 && uniqueEdges.some((e) => !e.isCorrect);
  const closed = !hasParadox && uniqueEdges.length >= 3 && correctCount === uniqueEdges.length;

  return { edges: uniqueEdges, closed };
}

export const useGameStore = create<GameState>((set, get) => ({
  events: DEFAULT_EVENTS,
  beacons: [],
  graphNodes: [],
  graphEdges: [],
  deliveries: [],
  deliveredEventIds: new Set(),
  isCausallyClosed: false,
  animations: [],

  createBeacon: (year, x, y) => {
    const existingInYear = get().beacons.find(
      (b) => b.createdAt === year && !b.isDelivered
    );
    if (existingInYear) return null;
    const beacon: Beacon = {
      id: makeId(),
      createdAt: year,
      color: pickColor(),
      x,
      y,
      isDragging: false,
      isDelivered: false,
    };
    set((s) => ({ beacons: [...s.beacons, beacon] }));
    return beacon;
  },

  updateBeaconPosition: (id, x, y, isDragging) => {
    set((s) => ({
      beacons: s.beacons.map((b) =>
        b.id === id ? { ...b, x, y, isDragging } : b
      ),
    }));
  },

  deliverBeacon: (beaconId, eventId, animX, animY) => {
    const state = get();
    if (state.deliveredEventIds.has(eventId)) return;
    const beacon = state.beacons.find((b) => b.id === beaconId);
    const ev = state.events.find((e) => e.id === eventId);
    if (!beacon || !ev) return;

    const delivery: DeliveryRecord = {
      id: makeId(),
      beaconId,
      eventId,
      year: beacon.createdAt,
      timestamp: Date.now(),
    };

    const newDeliveries = [...state.deliveries, delivery];
    const { edges, closed } = recomputeEdges(state.events, newDeliveries);

    const existingNodes = state.graphNodes.length;
    const node: GraphNode = {
      id: makeId(),
      eventId,
      title: ev.title,
      type: ev.type,
      deliveredYear: beacon.createdAt,
      x: 200 + (existingNodes % 4) * 70 - 110,
      y: 180 + Math.floor(existingNodes / 4) * 70 - 100,
    };

    const animationId = makeId();
    const animation: DeliveryAnimation = {
      id: animationId,
      x: animX ?? beacon.x,
      y: animY ?? beacon.y,
      color: beacon.color,
    };

    const newDeliveredSet = new Set(state.deliveredEventIds);
    newDeliveredSet.add(eventId);

    set((s) => ({
      beacons: s.beacons.map((b) =>
        b.id === beaconId
          ? { ...b, isDelivered: true, deliveredTo: eventId, isDragging: false }
          : b
      ),
      deliveries: newDeliveries,
      deliveredEventIds: newDeliveredSet,
      graphNodes: [...s.graphNodes, node],
      graphEdges: edges,
      isCausallyClosed: closed,
      animations: [...s.animations, animation],
    }));

    setTimeout(() => {
      get().clearAnimation(animationId);
    }, 650);
  },

  setNodeFixed: (id, fx, fy) => {
    set((s) => ({
      graphNodes: s.graphNodes.map((n) =>
        n.id === id ? { ...n, fx, fy } : n
      ),
    }));
  },

  updateGraphLayout: (updates) => {
    const map = new Map(updates.map((u) => [u.id, u]));
    set((s) => ({
      graphNodes: s.graphNodes.map((n) => {
        const u = map.get(n.id);
        if (!u) return n;
        return { ...n, x: u.x, y: u.y };
      }),
    }));
  },

  clearAnimation: (id) => {
    set((s) => ({ animations: s.animations.filter((a) => a.id !== id) }));
  },

  resetGame: () => {
    set({
      beacons: [],
      graphNodes: [],
      graphEdges: [],
      deliveries: [],
      deliveredEventIds: new Set(),
      isCausallyClosed: false,
      animations: [],
    });
  },
}));
