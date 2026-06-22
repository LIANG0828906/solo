import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  SimulationState,
  Ship,
  Berth,
  YardColumn,
  Crane,
  Container,
  BerthType,
  DashboardTab,
  BerthEfficiency,
  HistoryEvent,
} from '../types';

const SHIP_NAMES = ['远洋号', '蓝鲸号', '东方之星', '海鸥号', '胜利号', '巨鲸号', '致远号', '腾飞号'];
const DESTINATIONS = ['上海', '深圳', '新加坡', '鹿特丹', '洛杉矶', '东京', '釜山', '汉堡'];
const OWNERS = ['中远海运', '马士基', '地中海航运', '赫伯罗特', '达飞海运', '中远集运'];
const CONTAINER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

const generateContainers = (count: number): Container[] => {
  const containers: Container[] = [];
  for (let i = 0; i < count; i++) {
    containers.push({
      id: uuidv4(),
      color: CONTAINER_COLORS[Math.floor(Math.random() * CONTAINER_COLORS.length)],
      destination: DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)],
      weight: Math.floor(Math.random() * 20000) + 5000,
      size: Math.random() > 0.5 ? '40ft' : '20ft',
      owner: OWNERS[Math.floor(Math.random() * OWNERS.length)],
    });
  }
  return containers;
};

const createInitialBerthes = (): Berth[] => {
  const berthes: Berth[] = [];
  const berthConfigs: { name: string; type: BerthType; depth: number; y: number }[] = [
    { name: '1号泊位', type: 'deep', depth: 15, y: 80 },
    { name: '2号泊位', type: 'deep', depth: 14, y: 180 },
    { name: '3号泊位', type: 'shallow', depth: 10, y: 280 },
    { name: '4号泊位', type: 'shallow', depth: 9, y: 380 },
    { name: '5号泊位', type: 'maintenance', depth: 8, y: 480 },
  ];

  berthConfigs.forEach((config, index) => {
    const berthId = `berth-${index + 1}`;
    berthes.push({
      id: berthId,
      name: config.name,
      type: config.type,
      depth: config.depth,
      position: { x: 200, y: config.y, width: 180, height: 80 },
      cranes: [],
      yardColumnIds: [`yard-${berthId}-1`, `yard-${berthId}-2`, `yard-${berthId}-3`],
    });
  });

  return berthes;
};

const createInitialYardColumns = (berthes: Berth[]): YardColumn[] => {
  const columns: YardColumn[] = [];
  berthes.forEach((berth) => {
    berth.yardColumnIds.forEach((colId, colIndex) => {
      const containers: (Container | null)[] = [];
      const initialCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < 4; i++) {
        if (i < initialCount) {
          containers.push(generateContainers(1)[0]);
        } else {
          containers.push(null);
        }
      }
      columns.push({
        id: colId,
        berthId: berth.id,
        position: {
          x: 420 + colIndex * 70,
          y: berth.position.y + 10,
          width: 60,
        },
        containers,
        maxHeight: 4,
      });
    });
  });
  return columns;
};

const createInitialCranes = (berthes: Berth[]): Crane[] => {
  const cranes: Crane[] = [];
  let craneIndex = 1;
  berthes.slice(0, 3).forEach((berth) => {
    for (let i = 0; i < 2; i++) {
      cranes.push({
        id: `crane-${craneIndex}`,
        berthId: berth.id,
        position: { x: 250 + i * 50, y: berth.position.y + 40 },
        status: 'idle',
      });
      craneIndex++;
    }
  });
  return cranes;
};

interface SimulationStore extends SimulationState {
  setSpeed: (speed: number) => void;
  toggleRunning: () => void;
  setActiveDashboardTab: (tab: DashboardTab) => void;
  
  generateShip: () => void;
  assignShipToBerth: (shipId: string, berthId: string) => boolean;
  departShip: (shipId: string) => void;
  
  selectContainer: (containerId: string | undefined, columnId: string | undefined) => void;
  selectCrane: (craneId: string | undefined) => void;
  moveCraneToColumn: (craneId: string, columnId: string) => void;
  grabContainer: (craneId: string, columnId: string) => void;
  placeContainerOnShip: (craneId: string, shipId: string) => void;
  
  tick: (deltaTime: number) => void;
  calculateStats: () => void;
  addHistoryEvent: (type: HistoryEvent['type'], data: any) => void;
  
  assignCraneToBerth: (craneId: string, berthId: string) => void;
  setSuggestion: (suggestion: string | undefined) => void;
  generateSuggestion: () => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => {
  const initialBerthes = createInitialBerthes();
  const initialYardColumns = createInitialYardColumns(initialBerthes);
  const initialCranes = createInitialCranes(initialBerthes);

  return {
    simulationTime: 0,
    speed: 1,
    isRunning: false,
    ships: [],
    berthes: initialBerthes,
    yardColumns: initialYardColumns,
    cranes: initialCranes,
    stats: {
      shipsInPort: 0,
      usedBerthes: 0,
      totalBerthes: initialBerthes.length,
      yardOccupancy: 0,
      avgLoadingTime: 0,
      totalContainersLoaded: 0,
      totalContainers: 0,
      loadingEfficiency: 0,
    },
    berthEfficiencies: [],
    history: [],
    activeDashboardTab: 'overview',
    selectedContainerId: undefined,
    selectedCraneId: undefined,
    selectedColumnId: undefined,
    suggestion: undefined,

    setSpeed: (speed) => set({ speed }),
    toggleRunning: () => set((state) => ({ isRunning: !state.isRunning })),
    setActiveDashboardTab: (tab) => set({ activeDashboardTab: tab }),

    generateShip: () => {
      const existingShips = get().ships;
      if (existingShips.filter(s => s.status !== 'departed').length >= 5) return;
      
      const name = SHIP_NAMES[Math.floor(Math.random() * SHIP_NAMES.length)];
      const draft = Math.random() * 8 + 6;
      const ship: Ship = {
        id: uuidv4(),
        name,
        containerCount: Math.floor(Math.random() * 50) + 20,
        berthingDuration: Math.floor(Math.random() * 120) + 60,
        draft,
        status: 'approaching',
        position: { x: -100, y: 100 + Math.random() * 300 },
        loadedContainers: 0,
        arrivalTime: get().simulationTime,
      };
      
      set((state) => ({
        ships: [...state.ships, ship],
      }));
      
      get().addHistoryEvent('ship_arrival', { shipId: ship.id, shipName: ship.name });
      get().calculateStats();
    },

    assignShipToBerth: (shipId, berthId) => {
      const state = get();
      const ship = state.ships.find(s => s.id === shipId);
      const berth = state.berthes.find(b => b.id === berthId);
      
      if (!ship || !berth) return false;
      if (berth.shipId) return false;
      if (berth.type === 'maintenance') return false;
      
      const canDock = berth.depth >= ship.draft;
      
      if (!canDock) {
        return false;
      }
      
      set((state) => ({
        ships: state.ships.map(s =>
          s.id === shipId
            ? {
                ...s,
                status: 'docked' as const,
                berthId,
                position: { x: berth.position.x + 20, y: berth.position.y + 10 },
                dockedTime: state.simulationTime,
              }
            : s
        ),
        berthes: state.berthes.map(b =>
          b.id === berthId ? { ...b, shipId } : b
        ),
      }));
      
      get().calculateStats();
      return true;
    },

    departShip: (shipId) => {
      const state = get();
      const ship = state.ships.find(s => s.id === shipId);
      if (!ship || !ship.berthId) return;
      
      set((state) => ({
        ships: state.ships.map(s =>
          s.id === shipId
            ? {
                ...s,
                status: 'departed' as const,
                departureTime: state.simulationTime,
                position: { x: 1000, y: s.position.y },
              }
            : s
        ),
        berthes: state.berthes.map(b =>
          b.id === ship.berthId ? { ...b, shipId: undefined } : b
        ),
      }));
      
      get().addHistoryEvent('ship_departure', { shipId, shipName: ship.name });
      get().calculateStats();
    },

    selectContainer: (containerId, columnId) => {
      set({
        selectedContainerId: containerId,
        selectedColumnId: columnId,
      });
    },

    selectCrane: (craneId) => {
      set({ selectedCraneId: craneId });
    },

    moveCraneToColumn: (craneId, columnId) => {
      const state = get();
      const crane = state.cranes.find(c => c.id === craneId);
      const column = state.yardColumns.find(c => c.id === columnId);
      
      if (!crane || !column) return;
      
      set((state) => ({
        cranes: state.cranes.map(c =>
          c.id === craneId
            ? {
                ...c,
                status: 'moving' as const,
                targetX: column.position.x + column.position.width / 2,
                currentColumnId: columnId,
              }
            : c
        ),
      }));
    },

    grabContainer: (craneId, columnId) => {
      const state = get();
      const crane = state.cranes.find(c => c.id === craneId);
      const column = state.yardColumns.find(c => c.id === columnId);
      
      if (!crane || !column || crane.carriedContainer) return;
      if (crane.status !== 'idle') return;
      
      const topContainerIndex = column.containers.findIndex(c => c !== null);
      if (topContainerIndex === -1) return;
      
      const topContainer = column.containers[topContainerIndex];
      
      set((state) => ({
        cranes: state.cranes.map(c =>
          c.id === craneId
            ? { ...c, status: 'lowering' as const }
            : c
        ),
        yardColumns: state.yardColumns.map(yc =>
          yc.id === columnId
            ? {
                ...yc,
                containers: yc.containers.map((c, i) =>
                  i === topContainerIndex ? null : c
                ),
              }
            : yc
        ),
        selectedContainerId: undefined,
        selectedColumnId: undefined,
      }));
      
      setTimeout(() => {
        set((state) => ({
          cranes: state.cranes.map(c =>
            c.id === craneId
              ? { ...c, status: 'grabbing' as const, carriedContainer: topContainer! }
              : c
          ),
        }));
        
        setTimeout(() => {
          set((state) => ({
            cranes: state.cranes.map(c =>
              c.id === craneId ? { ...c, status: 'lifting' as const } : c
            ),
          }));
          
          setTimeout(() => {
            set((state) => ({
              cranes: state.cranes.map(c =>
                c.id === craneId ? { ...c, status: 'idle' as const } : c
              ),
            }));
          }, 500);
        }, 500);
      }, 500);
    },

    placeContainerOnShip: (craneId, shipId) => {
      const state = get();
      const crane = state.cranes.find(c => c.id === craneId);
      const ship = state.ships.find(s => s.id === shipId);
      
      if (!crane || !ship || !crane.carriedContainer) return;
      if (ship.loadedContainers >= ship.containerCount) return;
      if (crane.status !== 'idle') return;
      
      const container = crane.carriedContainer;
      
      set((state) => ({
        cranes: state.cranes.map(c =>
          c.id === craneId ? { ...c, status: 'placing' as const } : c
        ),
      }));
      
      setTimeout(() => {
        set((state) => ({
          ships: state.ships.map(s =>
            s.id === shipId
              ? { ...s, loadedContainers: s.loadedContainers + 1 }
              : s
          ),
          cranes: state.cranes.map(c =>
            c.id === craneId
              ? { ...c, status: 'idle' as const, carriedContainer: undefined }
              : c
          ),
          stats: {
            ...state.stats,
            totalContainersLoaded: state.stats.totalContainersLoaded + 1,
          },
        }));
        
        get().addHistoryEvent('container_move', {
          craneId,
          shipId,
          containerId: container.id,
        });
        
        get().calculateStats();
      }, 800);
    },

    tick: (deltaTime) => {
      const state = get();
      if (!state.isRunning) return;
      
      const scaledDelta = deltaTime * state.speed;
      
      set((state) => ({
        simulationTime: state.simulationTime + scaledDelta,
      }));
      
      set((state) => ({
        ships: state.ships.map(ship => {
          if (ship.status === 'approaching' && ship.position.x < 150) {
            return {
              ...ship,
              position: {
                ...ship.position,
                x: ship.position.x + 30 * scaledDelta / 1000,
              },
            };
          }
          return ship;
        }),
      }));
      
      set((state) => ({
        cranes: state.cranes.map(crane => {
          if (crane.status === 'moving' && crane.targetX !== undefined) {
            const dx = crane.targetX - crane.position.x;
            const speed = 100 * scaledDelta / 1000;
            if (Math.abs(dx) <= speed) {
              return {
                ...crane,
                position: { ...crane.position, x: crane.targetX },
                status: 'idle' as const,
                targetX: undefined,
              };
            }
            return {
              ...crane,
              position: {
                ...crane.position,
                x: crane.position.x + Math.sign(dx) * speed,
              },
            };
          }
          return crane;
        }),
      }));
      
      if (Math.random() < 0.002 * scaledDelta / 16) {
        get().generateShip();
      }
      
      set((state) => {
        const newShips = state.ships.map(ship => {
          if (ship.status === 'docked' && ship.dockedTime) {
            const timeDocked = state.simulationTime - ship.dockedTime;
            if (timeDocked > ship.berthingDuration * 1000 && ship.loadedContainers >= ship.containerCount * 0.8) {
              setTimeout(() => get().departShip(ship.id), 0);
            }
          }
          return ship;
        });
        return { ships: newShips };
      });
      
      if (Math.random() < 0.01) {
        get().generateSuggestion();
      }
    },

    calculateStats: () => {
      const state = get();
      const activeShips = state.ships.filter(s => s.status !== 'departed');
      const usedBerthes = state.berthes.filter(b => b.shipId).length;
      
      let totalSlots = 0;
      let usedSlots = 0;
      state.yardColumns.forEach(col => {
        totalSlots += col.maxHeight;
        usedSlots += col.containers.filter(c => c !== null).length;
      });
      
      const dockedShips = state.ships.filter(s => s.status === 'docked' || s.status === 'loading');
      const totalShipContainers = dockedShips.reduce((sum, s) => sum + s.containerCount, 0);
      const loadedContainers = dockedShips.reduce((sum, s) => sum + s.loadedContainers, 0);
      
      const efficiency = totalShipContainers > 0
        ? Math.round((loadedContainers / totalShipContainers) * 100)
        : 0;
      
      const efficiencies: BerthEfficiency[] = state.berthes.map(berth => ({
        berthId: berth.id,
        berthName: berth.name,
        workDuration: berth.shipId ? Math.floor(Math.random() * 3600) : 0,
        liftCount: berth.shipId ? Math.floor(Math.random() * 100) : 0,
      }));
      
      set({
        stats: {
          shipsInPort: activeShips.length,
          usedBerthes,
          totalBerthes: state.berthes.length,
          yardOccupancy: Math.round((usedSlots / totalSlots) * 100),
          avgLoadingTime: 45,
          totalContainersLoaded: state.stats.totalContainersLoaded,
          totalContainers: totalShipContainers,
          loadingEfficiency: efficiency,
        },
        berthEfficiencies: efficiencies,
      });
    },

    addHistoryEvent: (type, data) => {
      const event: HistoryEvent = {
        timestamp: Date.now(),
        type,
        data,
      };
      set((state) => ({
        history: [...state.history.slice(-500), event],
      }));
    },

    assignCraneToBerth: (craneId, berthId) => {
      const state = get();
      const crane = state.cranes.find(c => c.id === craneId);
      const targetBerth = state.berthes.find(b => b.id === berthId);
      
      if (!crane || !targetBerth) return;
      if (targetBerth.cranes.length >= 3) return;
      
      set((state) => ({
        berthes: state.berthes.map(b => ({
          ...b,
          cranes: b.cranes.filter(id => id !== craneId),
        })),
        cranes: state.cranes.map(c =>
          c.id === craneId
            ? {
                ...c,
                berthId,
                position: { x: targetBerth.position.x + 30, y: targetBerth.position.y + 40 },
              }
            : c
        ),
      }));
      
      set((state) => ({
        berthes: state.berthes.map(b =>
          b.id === berthId ? { ...b, cranes: [...b.cranes, craneId] } : b
        ),
      }));
    },

    setSuggestion: (suggestion) => set({ suggestion }),

    generateSuggestion: () => {
      const suggestions = [
        '建议将4号岸桥移至B堆场加快作业',
        '2号泊位装船效率较高，可优先分配船舶',
        '1号堆场集装箱堆积较多，建议加快装船',
        '注意3号泊位水深限制，大型船舶请勿停靠',
        '当前岸桥利用率偏低，可增加作业船舶',
      ];
      
      if (Math.random() > 0.5) {
        const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        set({ suggestion });
        
        setTimeout(() => {
          const currentState = get();
          if (currentState.suggestion === suggestion) {
            set({ suggestion: undefined });
          }
        }, 8000);
      }
    },
  };
});
