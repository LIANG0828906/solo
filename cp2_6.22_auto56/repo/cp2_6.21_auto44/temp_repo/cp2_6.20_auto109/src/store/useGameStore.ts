import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { BehaviorTree, BTNode, NodeType } from '../modules/behavior-tree';
import {
  createBehaviorTree,
  createNode,
  addChildNode,
  removeChildNode,
  deleteNode,
  updateNodePosition,
  updateNodeProps,
} from '../modules/behavior-tree';
import {
  type Unit,
  type GridCell,
  type BattleLog,
  type TerrainType,
  type UnitClass,
  type Team,
  createGrid,
  createUnit,
  executeUnitTurn,
  checkBattleEnd,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '../modules/battle-engine';

interface GameState {
  behaviorTrees: BehaviorTree[];
  currentTreeId: string | null;
  selectedNodeId: string | null;

  grid: GridCell[][];
  units: Unit[];
  selectedUnitId: string | null;

  battleLogs: BattleLog[];
  currentTurn: number;
  isSimulating: boolean;
  isPaused: boolean;
  battleResult: 'red' | 'blue' | null;

  currentTab: 'editor' | 'map';
  selectedTerrainTool: TerrainType | null;
  showSidebar: boolean;

  createTree: (name: string) => void;
  setCurrentTree: (id: string | null) => void;
  deleteTree: (id: string) => void;
  renameTree: (id: string, name: string) => void;

  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  selectNode: (id: string | null) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  connectNodes: (parentId: string, childId: string) => void;
  disconnectNodes: (parentId: string, childId: string) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, props: Partial<BTNode>) => void;
  setRootNode: (nodeId: string) => void;

  setGrid: (grid: GridCell[][]) => void;
  setCellTerrain: (x: number, y: number, terrain: TerrainType) => void;

  addUnit: (unitClass: UnitClass, team: Team, position: { x: number; y: number }, behaviorTreeId: string) => void;
  removeUnit: (id: string) => void;
  selectUnit: (id: string | null) => void;
  assignBehaviorTree: (unitId: string, treeId: string) => void;
  moveUnit: (unitId: string, position: { x: number; y: number }) => void;

  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  executeTurn: () => void;

  setCurrentTab: (tab: 'editor' | 'map') => void;
  setSelectedTerrainTool: (terrain: TerrainType | null) => void;
  setShowSidebar: (show: boolean) => void;

  exportLogs: () => string;
  clearLogs: () => void;
}

const initialGrid = createGrid();

const initialTree = (() => {
  const tree = createBehaviorTree('默认行为树');
  const root = createNode('selector', { x: 300, y: 50 });
  const seq1 = createNode('sequence', { x: 150, y: 150 });
  const seq2 = createNode('sequence', { x: 450, y: 150 });
  const cond = createNode('condition', { x: 50, y: 250 });
  const atk = createNode('action', { x: 200, y: 250 });
  const chase = createNode('action', { x: 400, y: 250 });
  const guard = createNode('action', { x: 550, y: 250 });

  tree.nodes[root.id] = root;
  tree.nodes[seq1.id] = seq1;
  tree.nodes[seq2.id] = seq2;
  tree.nodes[cond.id] = cond;
  tree.nodes[atk.id] = atk;
  tree.nodes[chase.id] = chase;
  tree.nodes[guard.id] = guard;

  tree.rootId = root.id;
  root.children = [seq1.id, seq2.id];
  seq1.children = [cond.id, atk.id];
  seq2.children = [chase.id];

  cond.condition = 'target_in_range';
  cond.name = '目标在射程内';
  atk.actionType = 'attack_target';
  atk.targetType = 'nearest_enemy';
  atk.name = '攻击目标';
  chase.actionType = 'chase_nearest_enemy';
  chase.name = '追击敌人';
  guard.actionType = 'guard';
  guard.name = '守卫';
  seq1.name = '攻击序列';
  seq2.name = '追击序列';
  root.name = 'AI选择器';

  return tree;
})();

const createInitialUnits = (treeId: string): Unit[] => {
  const units: Unit[] = [];

  units.push(createUnit('warrior', 'red', { x: 0, y: 1 }, treeId));
  units.push(createUnit('archer', 'red', { x: 0, y: 3 }, treeId));
  units.push(createUnit('mage', 'red', { x: 0, y: 5 }, treeId));

  units.push(createUnit('warrior', 'blue', { x: 5, y: 2 }, treeId));
  units.push(createUnit('archer', 'blue', { x: 5, y: 4 }, treeId));
  units.push(createUnit('mage', 'blue', { x: 5, y: 6 }, treeId));

  return units;
};

export const useGameStore = create<GameState>((set, get) => ({
  behaviorTrees: [initialTree],
  currentTreeId: initialTree.id,
  selectedNodeId: null,

  grid: initialGrid,
  units: createInitialUnits(initialTree.id),
  selectedUnitId: null,

  battleLogs: [],
  currentTurn: 1,
  isSimulating: false,
  isPaused: false,
  battleResult: null,

  currentTab: 'map',
  selectedTerrainTool: null,
  showSidebar: true,

  createTree: (name) => {
    const newTree = createBehaviorTree(name);
    set((state) => ({
      behaviorTrees: [...state.behaviorTrees, newTree],
      currentTreeId: newTree.id,
    }));
  },

  setCurrentTree: (id) => set({ currentTreeId: id, selectedNodeId: null }),

  deleteTree: (id) => {
    set((state) => {
      const newTrees = state.behaviorTrees.filter((t) => t.id !== id);
      const newCurrentId = state.currentTreeId === id
        ? (newTrees.length > 0 ? newTrees[0].id : null)
        : state.currentTreeId;
      return {
        behaviorTrees: newTrees,
        currentTreeId: newCurrentId,
        selectedNodeId: null,
      };
    });
  },

  renameTree: (id, name) => {
    set((state) => ({
      behaviorTrees: state.behaviorTrees.map((t) =>
        t.id === id ? { ...t, name } : t
      ),
    }));
  },

  addNode: (type, position) => {
    const { currentTreeId, behaviorTrees } = get();
    if (!currentTreeId) return;

    const tree = behaviorTrees.find((t) => t.id === currentTreeId);
    if (!tree) return;

    const nodeCount = Object.keys(tree.nodes).length;
    if (nodeCount >= 20) return;

    const node = createNode(type, position);
    const newTree = {
      ...tree,
      nodes: { ...tree.nodes, [node.id]: node },
    };

    if (!newTree.rootId) {
      newTree.rootId = node.id;
    }

    set((state) => ({
      behaviorTrees: state.behaviorTrees.map((t) =>
        t.id === currentTreeId ? newTree : t
      ),
      selectedNodeId: node.id,
    }));
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  moveNode: (id, position) => {
    const { currentTreeId, behaviorTrees } = get();
    if (!currentTreeId) return;

    const tree = behaviorTrees.find((t) => t.id === currentTreeId);
    if (!tree) return;

    const newTree = updateNodePosition(id, position, tree);

    set((state) => ({
      behaviorTrees: state.behaviorTrees.map((t) =>
        t.id === currentTreeId ? newTree : t
      ),
    }));
  },

  connectNodes: (parentId, childId) => {
    const { currentTreeId, behaviorTrees } = get();
    if (!currentTreeId) return;

    const tree = behaviorTrees.find((t) => t.id === currentTreeId);
    if (!tree) return;

    const newTree = addChildNode(parentId, childId, tree);

    set((state) => ({
      behaviorTrees: state.behaviorTrees.map((t) =>
        t.id === currentTreeId ? newTree : t
      ),
    }));
  },

  disconnectNodes: (parentId, childId) => {
    const { currentTreeId, behaviorTrees } = get();
    if (!currentTreeId) return;

    const tree = behaviorTrees.find((t) => t.id === currentTreeId);
    if (!tree) return;

    const newTree = removeChildNode(parentId, childId, tree);

    set((state) => ({
      behaviorTrees: state.behaviorTrees.map((t) =>
        t.id === currentTreeId ? newTree : t
      ),
    }));
  },

  removeNode: (id) => {
    const { currentTreeId, behaviorTrees } = get();
    if (!currentTreeId) return;

    const tree = behaviorTrees.find((t) => t.id === currentTreeId);
    if (!tree) return;

    const newTree = deleteNode(id, tree);

    set((state) => ({
      behaviorTrees: state.behaviorTrees.map((t) =>
        t.id === currentTreeId ? newTree : t
      ),
      selectedNodeId: null,
    }));
  },

  updateNode: (id, props) => {
    const { currentTreeId, behaviorTrees } = get();
    if (!currentTreeId) return;

    const tree = behaviorTrees.find((t) => t.id === currentTreeId);
    if (!tree) return;

    const newTree = updateNodeProps(id, props, tree);

    set((state) => ({
      behaviorTrees: state.behaviorTrees.map((t) =>
        t.id === currentTreeId ? newTree : t
      ),
    }));
  },

  setRootNode: (nodeId) => {
    const { currentTreeId, behaviorTrees } = get();
    if (!currentTreeId) return;

    set((state) => ({
      behaviorTrees: state.behaviorTrees.map((t) =>
        t.id === currentTreeId ? { ...t, rootId: nodeId } : t
      ),
    }));
  },

  setGrid: (grid) => set({ grid }),

  setCellTerrain: (x, y, terrain) => {
    set((state) => {
      const newGrid = state.grid.map((row) =>
        row.map((cell) =>
          cell.x === x && cell.y === y ? { ...cell, terrain } : cell
        )
      );
      return { grid: newGrid };
    });
  },

  addUnit: (unitClass, team, position, behaviorTreeId) => {
    const unit = createUnit(unitClass, team, position, behaviorTreeId);
    set((state) => ({ units: [...state.units, unit] }));
  },

  removeUnit: (id) => {
    set((state) => ({
      units: state.units.filter((u) => u.id !== id),
      selectedUnitId: state.selectedUnitId === id ? null : state.selectedUnitId,
    }));
  },

  selectUnit: (id) => set({ selectedUnitId: id }),

  assignBehaviorTree: (unitId, treeId) => {
    set((state) => ({
      units: state.units.map((u) =>
        u.id === unitId ? { ...u, behaviorTreeId: treeId } : u
      ),
    }));
  },

  moveUnit: (unitId, position) => {
    set((state) => ({
      units: state.units.map((u) =>
        u.id === unitId ? { ...u, position } : u
      ),
    }));
  },

  startSimulation: () => {
    const { units, grid, battleLogs } = get();
    const initialUnits = units.map((u) => ({
      ...u,
      hp: u.maxHp,
      isAlive: true,
    }));

    const startLog = {
      id: uuidv4(),
      timestamp: Date.now(),
      turn: 1,
      unitId: 'system',
      unitName: '系统',
      action: '战斗开始',
      details: {},
    };

    set({
      isSimulating: true,
      isPaused: false,
      currentTurn: 1,
      battleResult: null,
      units: initialUnits,
      battleLogs: battleLogs.length === 0 ? [startLog] : battleLogs,
    });
  },

  pauseSimulation: () => set({ isPaused: true }),

  resumeSimulation: () => set({ isPaused: false }),

  stepSimulation: () => {
    get().executeTurn();
  },

  resetSimulation: () => {
    const { behaviorTrees } = get();
    const treeId = behaviorTrees.length > 0 ? behaviorTrees[0].id : '';

    set({
      units: createInitialUnits(treeId),
      battleLogs: [],
      currentTurn: 1,
      isSimulating: false,
      isPaused: false,
      battleResult: null,
      selectedUnitId: null,
    });
  },

  executeTurn: () => {
    const state = get();
    const { units, grid, currentTurn, behaviorTrees, battleLogs } = state;

    if (state.battleResult) return;

    const aliveUnits = units.filter((u) => u.isAlive);
    if (aliveUnits.length === 0) return;

    let updatedUnits = [...units];
    const newLogs: BattleLog[] = [];

    const turnOrder = [...aliveUnits].sort((a, b) => {
      if (a.team !== b.team) return a.team === 'red' ? -1 : 1;
      return a.unitClass.localeCompare(b.unitClass);
    });

    for (const unit of turnOrder) {
      const currentUnit = updatedUnits.find((u) => u.id === unit.id);
      if (!currentUnit || !currentUnit.isAlive) continue;

      const behaviorTree = behaviorTrees.find(
        (t) => t.id === currentUnit.behaviorTreeId
      );

      if (!behaviorTree) continue;

      const result = executeUnitTurn(
        currentUnit,
        updatedUnits,
        grid,
        behaviorTree,
        currentTurn
      );

      updatedUnits = result.updatedUnits;
      newLogs.push(...result.logs);

      const battleEnd = checkBattleEnd(updatedUnits);
      if (battleEnd) break;
    }

    const battleResult = checkBattleEnd(updatedUnits);

    if (battleResult) {
      newLogs.push({
        id: uuidv4(),
        timestamp: Date.now(),
        turn: currentTurn,
        unitId: 'system',
        unitName: '系统',
        action: battleResult === 'red' ? '红方胜利' : '蓝方胜利',
        details: {},
      });
    }

    set({
      units: updatedUnits,
      battleLogs: [...battleLogs, ...newLogs],
      currentTurn: currentTurn + 1,
      battleResult,
      isSimulating: battleResult ? false : state.isSimulating,
    });
  },

  setCurrentTab: (tab) => set({ currentTab: tab }),

  setSelectedTerrainTool: (terrain) => set({ selectedTerrainTool: terrain }),

  setShowSidebar: (show) => set({ showSidebar: show }),

  exportLogs: () => {
    const { battleLogs } = get();
    return JSON.stringify(battleLogs, null, 2);
  },

  clearLogs: () => set({ battleLogs: [] }),
}));
