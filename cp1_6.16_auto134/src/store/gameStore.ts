import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { generateMaze, checkAllValvesOpen, movePlayer, updateValveAngle, checkValveOpen, MazeData, PlayerState, Direction8, Valve, Position } from '../game/engine';
import { Particle, GameRenderer } from '../game/renderer';

export interface InventoryItem { id:string; name:string; icon:string; description:string; dropAnim?:number; }
export interface GuideEntry { id:string; name:string; category:'creature'|'mechanism'; discovered:boolean; frontText:string; backText:string; }
export interface Achievement { id:string; name:string; description:string; completed:boolean; level:number; completedAt?:number; }

const TILE_SIZE = 32;

function isAdjacent(a: Position, b: Position): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx <= 1 && dy <= 1;
}

const initialGuideEntries: GuideEntry[] = [
  { id:'ge-creature-1', name:'蒸汽甲虫', category:'creature', discovered:false, frontText:'🪲', backText:'以蒸汽为能源的机械昆虫，常出没于高温管道区域，外壳由黄铜锻造，遇到危险会喷出高温蒸汽。' },
  { id:'ge-creature-2', name:'齿轮蜘蛛', category:'creature', discovered:false, frontText:'🕷️', backText:'八条腿由精密齿轮组成的机械蜘蛛，擅长在墙壁和天花板上爬行，会用丝线缠住入侵者。' },
  { id:'ge-creature-3', name:'黄铜哨兵', category:'creature', discovered:false, frontText:'🤖', backText:'古代文明遗留的守卫机械人，装备有蒸汽动力炮，对入侵者毫不留情，核心是一颗永恒能量水晶。' },
  { id:'ge-mechanism-1', name:'压力阀', category:'mechanism', discovered:false, frontText:'🔧', backText:'控制蒸汽流向的关键阀门，需要旋转到特定角度才能开启，每次转动都会发出清晰的咔嗒声。' },
  { id:'ge-mechanism-2', name:'齿轮锁', category:'mechanism', discovered:false, frontText:'⚙️', backText:'由多层齿轮咬合组成的精密锁具，只有当所有压力阀都开启后，齿轮锁才会转动解锁铁门。' },
  { id:'ge-mechanism-3', name:'蒸汽管道', category:'mechanism', discovered:false, frontText:'🛤️', backText:'贯穿整个迷宫的黄铜管道网络，阀门开启后管道会发出翠绿色的荧光，表示蒸汽正在流通。' },
  { id:'ge-mechanism-4', name:'能量核心', category:'mechanism', discovered:false, frontText:'💎', backText:'深埋在迷宫最底层的神秘能量源，据说是古代文明维持整个地下城运转的根本所在。' },
  { id:'ge-mechanism-5', name:'传送门', category:'mechanism', discovered:false, frontText:'🌀', backText:'连接不同层级的空间装置，由齿轮锁控制激活，通过时身体会经历短暂的蒸汽雾化过程。' },
];

const initialAchievements: Achievement[] = [
  { id:'ach-1', name:'初入迷宫', description:'通关第1层迷宫', completed:false, level:1 },
  { id:'ach-2', name:'深入险境', description:'通关第3层迷宫', completed:false, level:2 },
  { id:'ach-3', name:'机械大师', description:'全开阀门后通关一层', completed:false, level:3 },
  { id:'ach-4', name:'收藏家', description:'收集3件物品', completed:false, level:4 },
  { id:'ach-5', name:'学者', description:'发现5种图鉴', completed:false, level:5 },
];

function createInitialPlayer(startPos: Position): PlayerState {
  return {
    pos: { ...startPos },
    targetPos: { ...startPos },
    moveProgress: 0,
    direction: 2,
    stamina: 100,
    maxStamina: 100,
    gearRotation: 0,
  };
}

interface GameStore {
  currentLevel:number;
  maxLevel:number;
  maze:MazeData|null;
  doorAnimation:number;
  particles:Particle[];
  player:PlayerState;
  inventory:(InventoryItem|null)[];
  justPickedId:string|null;
  guideEntries:GuideEntry[];
  achievements:Achievement[];
  showGuidebook:boolean;
  showAchievements:boolean;
  isMobile:boolean;
  panelDrawerOpen:boolean;
  hoverValveId:string|null;
  draggingValve:{id:string;startAngle:number;lastDelta:number}|null;
  generateNewLevel:()=>void;
  tickFrame:(dtMs:number)=>void;
  movePlayerAction:(dir:Direction8)=>void;
  rotateValve:(valveId:string, deltaDeg:number)=>void;
  setValveDragging:(v:{id:string;startAngle:number;lastDelta:number}|null)=>void;
  setHoverValveId:(id:string|null)=>void;
  pickupItem:(item:Omit<InventoryItem,'id'>)=>boolean;
  reorderInventory:(fromIdx:number, toIdx:number)=>void;
  consumeStamina:(amount:number)=>void;
  discoverGuideEntry:(id:string)=>void;
  completeLevelAchievement:()=>void;
  toggleGuidebook:()=>void;
  toggleAchievements:()=>void;
  setIsMobile:(v:boolean)=>void;
  togglePanelDrawer:()=>void;
  resetGame:()=>void;
  addParticles:(ps:Particle[])=>void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentLevel: 1,
  maxLevel: 5,
  maze: null,
  doorAnimation: 0,
  particles: [],
  player: createInitialPlayer({ x: 0, y: 0 }),
  inventory: [null, null, null, null, null],
  justPickedId: null,
  guideEntries: initialGuideEntries.map(e => ({ ...e })),
  achievements: initialAchievements.map(a => ({ ...a })),
  showGuidebook: false,
  showAchievements: false,
  isMobile: false,
  panelDrawerOpen: false,
  hoverValveId: null,
  draggingValve: null,

  generateNewLevel: () => {
    const { currentLevel } = get();
    const maze = generateMaze(currentLevel);
    const player = createInitialPlayer(maze.startPos);
    if (currentLevel === 1) {
      set({
        maze,
        doorAnimation: 0,
        particles: [],
        player,
        guideEntries: initialGuideEntries.map(e => ({ ...e })),
        achievements: initialAchievements.map(a => ({ ...a })),
        inventory: [null, null, null, null, null],
        justPickedId: null,
      });
    } else {
      set({
        maze,
        doorAnimation: 0,
        particles: [],
        player,
      });
    }
  },

  tickFrame: (dtMs: number) => {
    const state = get();
    const { maze, particles, doorAnimation, player, currentLevel, maxLevel } = state;

    const updatedParticles = particles
      .map(p => ({
        ...p,
        x: p.x + (p.vx * dtMs) / 1000,
        y: p.y + (p.vy * dtMs) / 1000,
        vy: p.vy + (80 * dtMs) / 1000,
        life: p.life + dtMs,
      }))
      .filter(p => p.life < p.maxLife);

    let newDoorAnimation = doorAnimation;
    let shouldAdvance = false;
    let allValvesOpen = false;

    if (maze) {
      allValvesOpen = checkAllValvesOpen(maze.valves);
      if (allValvesOpen && newDoorAnimation < 1) {
        newDoorAnimation = Math.min(1, newDoorAnimation + dtMs / 800);
      }
      if (newDoorAnimation >= 1) {
        const atDoor = (player.pos.x === maze.doorPos.x && player.pos.y === maze.doorPos.y) ||
                       isAdjacent(player.pos, maze.doorPos);
        if (atDoor && currentLevel <= maxLevel) {
          shouldAdvance = true;
        }
      }
    }

    if (shouldAdvance) {
      get().completeLevelAchievement();
      const nextLevel = get().currentLevel + 1;
      if (nextLevel <= maxLevel) {
        set({ currentLevel: nextLevel });
        get().generateNewLevel();
      }
    } else {
      set(state => ({
        ...state,
        particles: updatedParticles,
        doorAnimation: newDoorAnimation,
        maze: maze && allValvesOpen ? { ...maze, doorOpen: true } : maze,
      }));
    }
  },

  movePlayerAction: (dir: Direction8) => {
    const state = get();
    if (!state.maze) return;
    const result = movePlayer(state.player, state.maze, dir, 16);
    if (result.moved) {
      set({ player: result.player });
    }
  },

  rotateValve: (valveId: string, deltaDeg: number) => {
    const state = get();
    if (!state.maze) return;
    let newParticles: Particle[] = [];
    const updatedValves = state.maze.valves.map(v => {
      if (v.id !== valveId) return v;
      const wasOpen = v.isOpen;
      let updated = updateValveAngle(v, deltaDeg);
      const nowOpen = checkValveOpen(updated);
      if (!wasOpen && nowOpen) {
        updated = { ...updated, isOpen: true };
        newParticles = GameRenderer.spawnSteamParticles(updated.pos, TILE_SIZE);
      } else if (wasOpen && !nowOpen) {
        updated = { ...updated, isOpen: false };
      }
      return updated;
    });
    const updatedPipes = state.maze.pipes.map(p => {
      const valve = updatedValves.find(v => v.id === p.connectedValveId);
      if (valve && valve.isOpen) {
        return { ...p, lit: true };
      }
      return p;
    });
    const allOpen = checkAllValvesOpen(updatedValves);
    set(state => ({
      maze: state.maze ? {
        ...state.maze,
        valves: updatedValves,
        pipes: updatedPipes,
        doorOpen: allOpen,
      } : null,
      particles: [...state.particles, ...newParticles],
    }));
  },

  setValveDragging: (v) => set({ draggingValve: v }),
  setHoverValveId: (id) => set({ hoverValveId: id }),

  pickupItem: (item: Omit<InventoryItem, 'id'>): boolean => {
    const state = get();
    const emptyIdx = state.inventory.findIndex(slot => slot === null);
    if (emptyIdx === -1) return false;
    const newItem: InventoryItem = { ...item, id: uuidv4(), dropAnim: 0 };
    const newInventory = [...state.inventory];
    newInventory[emptyIdx] = newItem;
    set({ inventory: newInventory, justPickedId: newItem.id });
    setTimeout(() => {
      set(s => ({
        inventory: s.inventory.map(it => it && it.id === newItem.id ? { ...it, dropAnim: undefined } : it),
        justPickedId: null,
      }));
    }, 300);
    const totalItems = newInventory.filter(s => s !== null).length;
    if (totalItems >= 3) {
      set(s => ({
        achievements: s.achievements.map(a =>
          a.id === 'ach-4' && !a.completed ? { ...a, completed: true, completedAt: Date.now() } : a
        ),
      }));
    }
    return true;
  },

  reorderInventory: (fromIdx: number, toIdx: number) => {
    set(state => {
      if (fromIdx < 0 || fromIdx >= 5 || toIdx < 0 || toIdx >= 5) return state;
      const newInv = [...state.inventory];
      const temp = newInv[fromIdx];
      newInv[fromIdx] = newInv[toIdx];
      newInv[toIdx] = temp;
      return { inventory: newInv };
    });
  },

  consumeStamina: (amount: number) => {
    set(state => ({
      player: {
        ...state.player,
        stamina: Math.max(0, state.player.stamina - amount),
      },
    }));
  },

  discoverGuideEntry: (id: string) => {
    set(state => {
      const updated = state.guideEntries.map(e =>
        e.id === id && !e.discovered ? { ...e, discovered: true } : e
      );
      const discoveredCount = updated.filter(e => e.discovered).length;
      let achievements = state.achievements;
      if (discoveredCount >= 5) {
        achievements = achievements.map(a =>
          a.id === 'ach-5' && !a.completed ? { ...a, completed: true, completedAt: Date.now() } : a
        );
      }
      return { guideEntries: updated, achievements };
    });
  },

  completeLevelAchievement: () => {
    set(state => {
      const { currentLevel, maze } = state;
      let achievements = state.achievements.map(a => {
        if (a.id === 'ach-1' && !a.completed && currentLevel >= 1) {
          return { ...a, completed: true, completedAt: Date.now() };
        }
        if (a.id === 'ach-2' && !a.completed && currentLevel >= 3) {
          return { ...a, completed: true, completedAt: Date.now() };
        }
        return a;
      });
      if (maze && maze.valves.length > 0) {
        const allOpen = maze.valves.every(v => v.isOpen);
        if (allOpen) {
          achievements = achievements.map(a =>
            a.id === 'ach-3' && !a.completed ? { ...a, completed: true, completedAt: Date.now() } : a
          );
        }
      }
      return { achievements };
    });
  },

  toggleGuidebook: () => set(state => ({ showGuidebook: !state.showGuidebook })),
  toggleAchievements: () => set(state => ({ showAchievements: !state.showAchievements })),
  setIsMobile: (v) => set({ isMobile: v }),
  togglePanelDrawer: () => set(state => ({ panelDrawerOpen: !state.panelDrawerOpen })),

  resetGame: () => {
    set({
      currentLevel: 1,
      achievements: initialAchievements.map(a => ({ ...a })),
      inventory: [null, null, null, null, null],
      justPickedId: null,
      guideEntries: initialGuideEntries.map(e => ({ ...e })),
      doorAnimation: 0,
      particles: [],
    });
    get().generateNewLevel();
  },

  addParticles: (ps: Particle[]) => {
    set(state => ({ particles: [...state.particles, ...ps] }));
  },
}));
