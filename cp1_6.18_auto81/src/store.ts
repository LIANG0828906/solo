import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  GameState,
  StarNode,
  Fleet,
  Ship,
  ShipType,
  Owner,
  NodeType,
  ParticleFlow,
} from './types';
import { SHIP_CONFIGS, NODE_RADIUS } from './types';
import { calculateCombat, formatCombatLog, getFleetPower } from './combat/combatEngine';
import { makeAIDecision } from './ai/aiDecision';

function createShip(type: ShipType): Ship {
  const config = SHIP_CONFIGS[type];
  return {
    id: uuidv4(),
    ...config,
  };
}

function createFleet(owner: Owner, ships: Ship[], nodeId: string): Fleet {
  return {
    id: uuidv4(),
    owner,
    ships,
    nodeId,
  };
}

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

function generateStarMap(): { nodes: StarNode[]; playerStartNodeId: string; aiStartNodeId: string; playerSecondaryNodeId: string; aiSecondaryNodeId: string } {
  const nodeCount = 6 + Math.floor(Math.random() * 3);
  const nodes: StarNode[] = [];

  const padding = 80;
  const minDistance = 140;

  let attempts = 0;
  while (nodes.length < nodeCount && attempts < 500) {
    attempts++;
    const x = padding + Math.random() * (MAP_WIDTH - padding * 2);
    const y = padding + Math.random() * (MAP_HEIGHT - padding * 2);

    let tooClose = false;
    for (const node of nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      nodes.push({
        id: uuidv4(),
        x,
        y,
        type: 'normal',
        connections: [],
      });
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const distances: { idx: number; dist: number }[] = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i !== j) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        distances.push({ idx: j, dist: Math.sqrt(dx * dx + dy * dy) });
      }
    }
    distances.sort((a, b) => a.dist - b.dist);

    const connectCount = 2 + Math.floor(Math.random() * 2);
    for (let k = 0; k < Math.min(connectCount, distances.length); k++) {
      const j = distances[k].idx;
      if (!nodes[i].connections.includes(nodes[j].id)) {
        nodes[i].connections.push(nodes[j].id);
      }
      if (!nodes[j].connections.includes(nodes[i].id)) {
        nodes[j].connections.push(nodes[i].id);
      }
    }
  }

  let leftmostIdx = 0;
  let rightmostIdx = 0;
  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i].x < nodes[leftmostIdx].x) leftmostIdx = i;
    if (nodes[i].x > nodes[rightmostIdx].x) rightmostIdx = i;
  }

  nodes[leftmostIdx].type = 'mothership_player';
  nodes[rightmostIdx].type = 'mothership_ai';

  const otherIndices = nodes
    .map((_, i) => i)
    .filter((i) => i !== leftmostIdx && i !== rightmostIdx);
  const shuffled = otherIndices.sort(() => Math.random() - 0.5);

  if (shuffled.length >= 2) {
    nodes[shuffled[0]].type = 'resource';
    nodes[shuffled[1]].type = 'resource';
  }

  const playerNode = nodes[leftmostIdx];
  const aiNode = nodes[rightmostIdx];

  let playerSecondaryNodeId = playerNode.id;
  if (playerNode.connections.length > 0) {
    const connIndex = Math.floor(Math.random() * playerNode.connections.length);
    playerSecondaryNodeId = playerNode.connections[connIndex];
  }

  let aiSecondaryNodeId = aiNode.id;
  if (aiNode.connections.length > 0) {
    const connIndex = Math.floor(Math.random() * aiNode.connections.length);
    aiSecondaryNodeId = aiNode.connections[connIndex];
  }

  return {
    nodes,
    playerStartNodeId: playerNode.id,
    aiStartNodeId: aiNode.id,
    playerSecondaryNodeId,
    aiSecondaryNodeId,
  };
}

function createInitialFleets(
  playerMainNodeId: string,
  playerSecondaryNodeId: string,
  aiMainNodeId: string,
  aiSecondaryNodeId: string
): { playerFleets: Fleet[]; aiFleets: Fleet[] } {
  const playerMothership = createFleet('player', [createShip('mothership')], playerMainNodeId);

  const playerCruiserFleet = createFleet(
    'player',
    [createShip('cruiser'), createShip('frigate')],
    playerMainNodeId
  );

  const playerFrigateFleet = createFleet(
    'player',
    [createShip('frigate')],
    playerSecondaryNodeId
  );

  const aiMothership = createFleet('ai', [createShip('mothership')], aiMainNodeId);

  const aiCruiserFleet = createFleet(
    'ai',
    [createShip('cruiser'), createShip('frigate')],
    aiMainNodeId
  );

  const aiFrigateFleet = createFleet(
    'ai',
    [createShip('frigate')],
    aiSecondaryNodeId
  );

  return {
    playerFleets: [playerCruiserFleet, playerFrigateFleet, playerMothership],
    aiFleets: [aiCruiserFleet, aiFrigateFleet, aiMothership],
  };
}

function getNodeById(nodes: StarNode[], id: string): StarNode | undefined {
  return nodes.find((n) => n.id === id);
}

function isNodeInRange(
  nodes: StarNode[],
  fromNodeId: string,
  toNodeId: string,
  range: number
): boolean {
  const visited = new Set<string>();
  const queue: { nodeId: string; steps: number }[] = [{ nodeId: fromNodeId, steps: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    const currentNode = getNodeById(nodes, current.nodeId);
    if (!currentNode) continue;

    if (current.nodeId === toNodeId && current.steps <= range) {
      return true;
    }

    if (current.steps < range) {
      for (const connId of currentNode.connections) {
        if (!visited.has(connId)) {
          queue.push({ nodeId: connId, steps: current.steps + 1 });
        }
      }
    }
  }
  return false;
}

function getFleetMoveRange(fleet: Fleet): number {
  if (fleet.ships.length === 0) return 0;
  return Math.min(...fleet.ships.map((s) => s.move));
}

interface GameStore extends GameState {
  initGame: () => void;
  selectNode: (nodeId: string | null) => void;
  selectFleet: (fleetId: string | null) => void;
  moveFleet: (fleetId: string, targetNodeId: string) => void;
  endPlayerTurn: () => void;
  executeAITurn: () => void;
  addParticleFlow: (flow: Omit<ParticleFlow, 'id' | 'startTime'>) => void;
  removeExpiredParticles: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  nodes: [],
  fleets: [],
  turn: 1,
  currentPhase: 'player',
  selectedNodeId: null,
  selectedFleetId: null,
  combatLogs: [],
  winner: null,
  particleFlows: [],

  initGame: () => {
    const { nodes, playerStartNodeId, aiStartNodeId, playerSecondaryNodeId, aiSecondaryNodeId } = generateStarMap();
    const { playerFleets, aiFleets } = createInitialFleets(
      playerStartNodeId,
      playerSecondaryNodeId,
      aiStartNodeId,
      aiSecondaryNodeId
    );

    set({
      nodes,
      fleets: [...playerFleets, ...aiFleets],
      turn: 1,
      currentPhase: 'player',
      selectedNodeId: null,
      selectedFleetId: null,
      combatLogs: ['游戏开始！第1回合，玩家行动。'],
      winner: null,
      particleFlows: [],
    });
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId, selectedFleetId: null });
  },

  selectFleet: (fleetId) => {
    const state = get();
    const fleet = state.fleets.find((f) => f.id === fleetId);
    if (fleet) {
      set({ selectedFleetId: fleetId, selectedNodeId: fleet.nodeId });
    }
  },

  moveFleet: (fleetId, targetNodeId) => {
    const state = get();
    const fleet = state.fleets.find((f) => f.id === fleetId);
    if (!fleet || fleet.owner !== 'player' || state.currentPhase !== 'player') return;

    const moveRange = getFleetMoveRange(fleet);
    if (!isNodeInRange(state.nodes, fleet.nodeId, targetNodeId, moveRange)) return;

    const targetNode = getNodeById(state.nodes, targetNodeId);
    if (!targetNode) return;

    set((state) => ({
      fleets: state.fleets.map((f) =>
        f.id === fleetId ? { ...f, nodeId: targetNodeId } : f
      ),
      selectedNodeId: targetNodeId,
    }));

    set((state) => {
      const newFlow: ParticleFlow = {
        id: uuidv4(),
        fromNodeId: fleet.nodeId,
        toNodeId: targetNodeId,
        color: '#6BCB77',
        startTime: Date.now(),
        duration: 300,
      };
      return { particleFlows: [...state.particleFlows, newFlow] };
    });

    const updatedState = get();
    const enemyFleetsAtTarget = updatedState.fleets.filter(
      (f) => f.nodeId === targetNodeId && f.owner === 'ai' && f.ships.length > 0
    );

    if (enemyFleetsAtTarget.length > 0) {
      const attackerFleet = updatedState.fleets.find((f) => f.id === fleetId);
      if (!attackerFleet) return;

      const defenderFleet = enemyFleetsAtTarget[0];
      const result = calculateCombat(attackerFleet, defenderFleet, targetNode);

      const newLogs = result.logs.map(formatCombatLog);

      set((state) => ({
        fleets: state.fleets
          .map((f) => {
            if (f.id === attackerFleet.id) {
              return { ...f, ships: result.attackerShipsRemaining };
            }
            if (f.id === defenderFleet.id) {
              return { ...f, ships: result.defenderShipsRemaining };
            }
            return f;
          })
          .filter((f) => f.ships.length > 0),
        combatLogs: [...state.combatLogs, '--- 战斗 ---', ...newLogs],
      }));

      const afterCombatState = get();
      const remainingPlayerFleets = afterCombatState.fleets.filter(
        (f) => f.owner === 'player' && f.ships.length > 0 && f.ships.some((s) => s.type !== 'mothership')
      );
      const remainingAIFleets = afterCombatState.fleets.filter(
        (f) => f.owner === 'ai' && f.ships.length > 0
      );
      const aiMothershipAlive = afterCombatState.fleets.some(
        (f) => f.owner === 'ai' && f.ships.some((s) => s.type === 'mothership')
      );
      const playerMothershipAlive = afterCombatState.fleets.some(
        (f) => f.owner === 'player' && f.ships.some((s) => s.type === 'mothership')
      );

      if (!aiMothershipAlive || remainingAIFleets.length === 0) {
        set((state) => ({
          winner: 'player',
          currentPhase: 'ended',
          combatLogs: [...state.combatLogs, '🎉 胜利！敌方已被消灭！'],
        }));
      } else if (!playerMothershipAlive || remainingPlayerFleets.length === 0) {
        set((state) => ({
          winner: 'ai',
          currentPhase: 'ended',
          combatLogs: [...state.combatLogs, '💀 失败...你的舰队已全军覆没。'],
        }));
      }
    }
  },

  endPlayerTurn: () => {
    const state = get();
    if (state.currentPhase !== 'player' || state.winner) return;

    set({
      currentPhase: 'ai',
      selectedNodeId: null,
      selectedFleetId: null,
      combatLogs: [...state.combatLogs, `--- AI回合 ---`],
    });

    setTimeout(() => {
      get().executeAITurn();
    }, 500);
  },

  executeAITurn: () => {
    const state = get();
    if (state.currentPhase !== 'ai' || state.winner) return;

    const aiFleets = state.fleets.filter(
      (f) => f.owner === 'ai' && f.ships.length > 0 && f.ships.some((s) => s.type !== 'mothership')
    );

    if (aiFleets.length === 0) {
      set((state) => ({
        turn: state.turn + 1,
        currentPhase: 'player',
        combatLogs: [...state.combatLogs, `第${state.turn + 1}回合，玩家行动。`],
      }));
      return;
    }

    let currentState = { ...state };
    let actionsLeft = aiFleets.length;
    let actionIndex = 0;

    function executeNextAction() {
      const s = get();
      if (s.winner || s.currentPhase !== 'ai') return;

      const currentAiFleets = s.fleets.filter(
        (f) => f.owner === 'ai' && f.ships.length > 0 && f.ships.some((ship) => ship.type !== 'mothership')
      );

      if (actionIndex >= currentAiFleets.length) {
        set((st) => ({
          turn: st.turn + 1,
          currentPhase: 'player',
          combatLogs: [...st.combatLogs, `第${st.turn + 1}回合，玩家行动。`],
        }));
        return;
      }

      const aiFleet = currentAiFleets[actionIndex];
      const decision = makeAIDecision(s.nodes, s.fleets, aiFleet);

      if (decision) {
        const fromNodeId = aiFleet.nodeId;

        set((st) => ({
          fleets: st.fleets.map((f) =>
            f.id === aiFleet.id ? { ...f, nodeId: decision.targetNodeId } : f
          ),
        }));

        set((st) => {
          const newFlow: ParticleFlow = {
            id: uuidv4(),
            fromNodeId,
            toNodeId: decision.targetNodeId,
            color: '#FF6B6B',
            startTime: Date.now(),
            duration: 300,
          };
          return { particleFlows: [...st.particleFlows, newFlow] };
        });

        const s2 = get();
        const targetNode = getNodeById(s2.nodes, decision.targetNodeId);
        const playerFleetsAtTarget = s2.fleets.filter(
          (f) => f.nodeId === decision.targetNodeId && f.owner === 'player' && f.ships.length > 0
        );

        if (playerFleetsAtTarget.length > 0 && targetNode) {
          const updatedAiFleet = s2.fleets.find((f) => f.id === aiFleet.id);
          if (updatedAiFleet) {
            const defenderFleet = playerFleetsAtTarget[0];
            const result = calculateCombat(updatedAiFleet, defenderFleet, targetNode);
            const newLogs = result.logs.map(formatCombatLog);

            set((st) => ({
              fleets: st.fleets
                .map((f) => {
                  if (f.id === updatedAiFleet.id) {
                    return { ...f, ships: result.attackerShipsRemaining };
                  }
                  if (f.id === defenderFleet.id) {
                    return { ...f, ships: result.defenderShipsRemaining };
                  }
                  return f;
                })
                .filter((f) => f.ships.length > 0),
              combatLogs: [...st.combatLogs, '--- 战斗 ---', ...newLogs],
            }));

            const s3 = get();
            const aiMothershipAlive = s3.fleets.some(
              (f) => f.owner === 'ai' && f.ships.some((ship) => ship.type === 'mothership')
            );
            const playerMothershipAlive = s3.fleets.some(
              (f) => f.owner === 'player' && f.ships.some((ship) => ship.type === 'mothership')
            );
            const remainingPlayerFleets = s3.fleets.filter(
              (f) => f.owner === 'player' && f.ships.length > 0
            );
            const remainingAIFleets = s3.fleets.filter(
              (f) => f.owner === 'ai' && f.ships.length > 0
            );

            if (!playerMothershipAlive || remainingPlayerFleets.length === 0) {
              set((st) => ({
                winner: 'ai',
                currentPhase: 'ended',
                combatLogs: [...st.combatLogs, '💀 失败...你的舰队已全军覆没。'],
              }));
              return;
            }
            if (!aiMothershipAlive || remainingAIFleets.length === 0) {
              set((st) => ({
                winner: 'player',
                currentPhase: 'ended',
                combatLogs: [...st.combatLogs, '🎉 胜利！敌方已被消灭！'],
              }));
              return;
            }
          }
        }
      }

      actionIndex++;
      setTimeout(executeNextAction, 400);
    }

    executeNextAction();
  },

  addParticleFlow: (flow) => {
    set((state) => ({
      particleFlows: [...state.particleFlows, { ...flow, id: uuidv4(), startTime: Date.now() }],
    }));
  },

  removeExpiredParticles: () => {
    const now = Date.now();
    set((state) => ({
      particleFlows: state.particleFlows.filter((p) => now - p.startTime < p.duration + 100),
    }));
  },
}));

export function useNodesInRange(nodeId: string | null, range: number): string[] {
  const nodes = useGameStore((state) => state.nodes);

  if (!nodeId) return [];

  const result: string[] = [];
  const visited = new Set<string>();
  const queue: { nodeId: string; steps: number }[] = [{ nodeId, steps: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    const currentNode = nodes.find((n) => n.id === current.nodeId);
    if (!currentNode) continue;

    if (current.steps > 0 && current.steps <= range) {
      result.push(current.nodeId);
    }

    if (current.steps < range) {
      for (const connId of currentNode.connections) {
        if (!visited.has(connId)) {
          queue.push({ nodeId: connId, steps: current.steps + 1 });
        }
      }
    }
  }

  return result;
}
