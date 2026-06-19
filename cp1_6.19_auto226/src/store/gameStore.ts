import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type EventStatus = 'untreated' | 'modified' | 'paradox';
export type LinkType = 'normal' | 'paradox';

export interface GameEvent {
  id: string;
  year: number;
  title: string;
  description: string;
  status: EventStatus;
  locked: boolean;
  causalFactor: string;
  causalDependencies: string[];
}

export interface Beacon {
  id: string;
  yearPlaced: number;
  targetEventId: string | null;
  applied: boolean;
}

export interface CausalNode {
  id: string;
  eventId: string;
  x: number;
  y: number;
  status: EventStatus;
}

export interface CausalLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: LinkType;
}

export interface GameState {
  timeline: { start: number; end: number };
  events: GameEvent[];
  beacons: Beacon[];
  nodes: CausalNode[];
  links: CausalLink[];
  selectedYear: number;
  isStable: boolean;
  paradoxCount: number;
  setSelectedYear: (year: number) => void;
  addBeacon: (year: number) => Beacon;
  applyBeaconToEvent: (beaconId: string, eventId: string) => void;
  removeBeacon: (beaconId: string) => void;
  checkParadox: () => string[];
  updateNodePosition: (nodeId: string, x: number, y: number) => void;
  resetTimeline: () => void;
}

const initialEvents: GameEvent[] = [
  {
    id: 'evt-1903',
    year: 1903,
    title: '莱特兄弟首飞',
    description: '威尔伯和奥维尔·莱特在北卡罗来纳州成功完成首次动力飞行，开启了航空时代。',
    status: 'untreated',
    locked: false,
    causalFactor: '航空技术起源',
    causalDependencies: [],
  },
  {
    id: 'evt-1927',
    year: 1927,
    title: '林德伯格跨大西洋飞行',
    description: '查尔斯·林德伯格完成首次单人不间断跨大西洋飞行，推动了民航业的发展。',
    status: 'untreated',
    locked: false,
    causalFactor: '航空技术成熟',
    causalDependencies: ['evt-1903'],
  },
  {
    id: 'evt-1937',
    year: 1937,
    title: '晶体管发明',
    description: '约翰·巴丁和沃尔特·布拉顿在贝尔实验室发明晶体管，奠定了现代电子学基础。',
    status: 'untreated',
    locked: false,
    causalFactor: '电子技术革命',
    causalDependencies: [],
  },
  {
    id: 'evt-1945',
    year: 1945,
    title: '原子弹爆炸',
    description: '美国在广岛和长崎投下原子弹，第二次世界大战结束，核时代开始。',
    status: 'untreated',
    locked: false,
    causalFactor: '核能应用',
    causalDependencies: ['evt-1937'],
  },
  {
    id: 'evt-1957',
    year: 1957,
    title: '斯普特尼克发射',
    description: '苏联发射第一颗人造地球卫星，开启太空时代，引发美苏太空竞赛。',
    status: 'untreated',
    locked: false,
    causalFactor: '航天技术起步',
    causalDependencies: ['evt-1945'],
  },
  {
    id: 'evt-1969',
    year: 1969,
    title: '阿波罗11号登月',
    description: '尼尔·阿姆斯特朗成为第一个踏上月球的人类，实现了肯尼迪总统的登月目标。',
    status: 'untreated',
    locked: false,
    causalFactor: '载人航天突破',
    causalDependencies: ['evt-1957', 'evt-1927'],
  },
  {
    id: 'evt-1989',
    year: 1989,
    title: '万维网诞生',
    description: '蒂姆·伯纳斯-李在欧洲核子研究中心发明万维网，互联网时代开始。',
    status: 'untreated',
    locked: false,
    causalFactor: '信息革命',
    causalDependencies: ['evt-1937'],
  },
  {
    id: 'evt-2007',
    year: 2007,
    title: 'iPhone发布',
    description: '史蒂夫·乔布斯发布第一代iPhone，智能手机时代开启，移动互联网普及。',
    status: 'untreated',
    locked: false,
    causalFactor: '移动计算革命',
    causalDependencies: ['evt-1989', 'evt-1937'],
  },
  {
    id: 'evt-2025',
    year: 2025,
    title: '通用人工智能突破',
    description: '第一个通过图灵测试的通用人工智能系统诞生，人类社会进入新纪元。',
    status: 'untreated',
    locked: false,
    causalFactor: 'AI革命',
    causalDependencies: ['evt-2007', 'evt-1989'],
  },
  {
    id: 'evt-2050',
    year: 2050,
    title: '火星殖民',
    description: '人类在火星建立第一个永久殖民地，开启多行星文明时代。',
    status: 'untreated',
    locked: false,
    causalFactor: '星际殖民',
    causalDependencies: ['evt-1969', 'evt-2025'],
  },
];

const createInitialNodes = (): CausalNode[] => {
  const nodePositions: Record<string, { x: number; y: number }> = {
    'evt-1903': { x: 100, y: 150 },
    'evt-1927': { x: 200, y: 200 },
    'evt-1937': { x: 150, y: 350 },
    'evt-1945': { x: 280, y: 320 },
    'evt-1957': { x: 380, y: 280 },
    'evt-1969': { x: 450, y: 180 },
    'evt-1989': { x: 400, y: 420 },
    'evt-2007': { x: 520, y: 350 },
    'evt-2025': { x: 600, y: 280 },
    'evt-2050': { x: 700, y: 200 },
  };

  return initialEvents.map((event) => ({
    id: `node-${event.id}`,
    eventId: event.id,
    x: nodePositions[event.id]?.x || 0,
    y: nodePositions[event.id]?.y || 0,
    status: event.status,
  }));
};

const createInitialLinks = (): CausalLink[] => {
  const links: CausalLink[] = [];
  initialEvents.forEach((event) => {
    event.causalDependencies.forEach((depId) => {
      links.push({
        id: `link-${depId}-${event.id}`,
        sourceId: `node-${depId}`,
        targetId: `node-${event.id}`,
        type: 'normal',
      });
    });
  });
  return links;
};

const hasCycle = (events: GameEvent[]): string[] => {
  const paradoxIds: string[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const eventMap = new Map(events.map((e) => [e.id, e]));

  const dfs = (eventId: string, path: string[]): boolean => {
    if (recursionStack.has(eventId)) {
      path.forEach((id) => {
        if (!paradoxIds.includes(id)) paradoxIds.push(id);
      });
      return true;
    }
    if (visited.has(eventId)) return false;

    visited.add(eventId);
    recursionStack.add(eventId);
    const event = eventMap.get(eventId);

    if (event) {
      for (const depId of event.causalDependencies) {
        if (dfs(depId, [...path, eventId])) return true;
      }
    }

    recursionStack.delete(eventId);
    return false;
  };

  events.forEach((event) => {
    if (!visited.has(event.id)) {
      dfs(event.id, []);
    }
  });

  return paradoxIds;
};

const checkTimelineInconsistencies = (events: GameEvent[]): string[] => {
  const paradoxIds: string[] = [];
  const eventMap = new Map(events.map((e) => [e.id, e]));

  events.forEach((event) => {
    event.causalDependencies.forEach((depId) => {
      const depEvent = eventMap.get(depId);
      if (depEvent && event.year < depEvent.year) {
        if (!paradoxIds.includes(event.id)) paradoxIds.push(event.id);
        if (!paradoxIds.includes(depId)) paradoxIds.push(depId);
      }
    });
  });

  return paradoxIds;
};

export const useGameStore = create<GameState>((set, get) => ({
  timeline: { start: 1900, end: 2100 },
  events: initialEvents,
  beacons: [],
  nodes: createInitialNodes(),
  links: createInitialLinks(),
  selectedYear: 1950,
  isStable: false,
  paradoxCount: 0,

  setSelectedYear: (year: number) => {
    set({ selectedYear: year });
  },

  addBeacon: (year: number) => {
    const newBeacon: Beacon = {
      id: `beacon-${uuidv4()}`,
      yearPlaced: year,
      targetEventId: null,
      applied: false,
    };
    set((state) => ({ beacons: [...state.beacons, newBeacon] }));
    return newBeacon;
  },

  applyBeaconToEvent: (beaconId: string, eventId: string) => {
    set((state) => {
      const updatedBeacons = state.beacons.map((beacon) =>
        beacon.id === beaconId
          ? { ...beacon, targetEventId: eventId, applied: true }
          : beacon
      );

      const updatedEvents = state.events.map((event) =>
        event.id === eventId && !event.locked
          ? { ...event, status: 'modified' as EventStatus }
          : event
      );

      const updatedNodes = state.nodes.map((node) => {
        const event = updatedEvents.find((e) => e.id === node.eventId);
        return event ? { ...node, status: event.status } : node;
      });

      return {
        beacons: updatedBeacons,
        events: updatedEvents,
        nodes: updatedNodes,
      };
    });

    const paradoxIds = get().checkParadox();
    set((state) => ({
      paradoxCount: paradoxIds.length,
      events: state.events.map((event) => ({
        ...event,
        status: paradoxIds.includes(event.id)
          ? ('paradox' as EventStatus)
          : event.status,
      })),
      nodes: state.nodes.map((node) => {
        const event = state.events.find((e) => e.id === node.eventId);
        return event ? { ...node, status: event.status } : node;
      }),
      links: state.links.map((link) => {
        const sourceEvent = state.events.find(
          (e) => `node-${e.id}` === link.sourceId
        );
        const targetEvent = state.events.find(
          (e) => `node-${e.id}` === link.targetId
        );
        const hasParadox =
          sourceEvent &&
          targetEvent &&
          (paradoxIds.includes(sourceEvent.id) ||
            paradoxIds.includes(targetEvent.id));
        return {
          ...link,
          type: hasParadox ? ('paradox' as LinkType) : ('normal' as LinkType),
        };
      }),
    }));

    const { events, paradoxCount } = get();
    const allModified = events.every(
      (e) => e.status === 'modified' || e.locked
    );
    set({ isStable: allModified && paradoxCount === 0 });
  },

  removeBeacon: (beaconId: string) => {
    set((state) => {
      const beacon = state.beacons.find((b) => b.id === beaconId);
      const targetEventId = beacon?.targetEventId;

      const updatedBeacons = state.beacons.filter((b) => b.id !== beaconId);

      const hasOtherBeacon = updatedBeacons.some(
        (b) => b.targetEventId === targetEventId
      );

      const updatedEvents = state.events.map((event) =>
        event.id === targetEventId && !hasOtherBeacon && !event.locked
          ? { ...event, status: 'untreated' as EventStatus }
          : event
      );

      const updatedNodes = state.nodes.map((node) => {
        const event = updatedEvents.find((e) => e.id === node.eventId);
        return event ? { ...node, status: event.status } : node;
      });

      return {
        beacons: updatedBeacons,
        events: updatedEvents,
        nodes: updatedNodes,
      };
    });

    const paradoxIds = get().checkParadox();
    set((state) => ({
      paradoxCount: paradoxIds.length,
      events: state.events.map((event) => ({
        ...event,
        status: paradoxIds.includes(event.id)
          ? ('paradox' as EventStatus)
          : event.status === 'paradox'
          ? ('untreated' as EventStatus)
          : event.status,
      })),
      nodes: state.nodes.map((node) => {
        const event = state.events.find((e) => e.id === node.eventId);
        return event ? { ...node, status: event.status } : node;
      }),
      links: state.links.map((link) => {
        const sourceEvent = state.events.find(
          (e) => `node-${e.id}` === link.sourceId
        );
        const targetEvent = state.events.find(
          (e) => `node-${e.id}` === link.targetId
        );
        const hasParadox =
          sourceEvent &&
          targetEvent &&
          (paradoxIds.includes(sourceEvent.id) ||
            paradoxIds.includes(targetEvent.id));
        return {
          ...link,
          type: hasParadox ? ('paradox' as LinkType) : ('normal' as LinkType),
        };
      }),
    }));

    const { events, paradoxCount } = get();
    const allModified = events.every(
      (e) => e.status === 'modified' || e.locked
    );
    set({ isStable: allModified && paradoxCount === 0 });
  },

  checkParadox: (): string[] => {
    const { events } = get();
    const cycleParadoxes = hasCycle(events);
    const timelineParadoxes = checkTimelineInconsistencies(events);
    const allParadoxes = [...new Set([...cycleParadoxes, ...timelineParadoxes])];
    return allParadoxes;
  },

  updateNodePosition: (nodeId: string, x: number, y: number) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, x, y } : node
      ),
    }));
  },

  resetTimeline: () => {
    set({
      events: initialEvents.map((e) => ({ ...e, status: 'untreated' as EventStatus })),
      beacons: [],
      nodes: createInitialNodes(),
      links: createInitialLinks(),
      selectedYear: 1950,
      isStable: false,
      paradoxCount: 0,
    });
  },
}));
