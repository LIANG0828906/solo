import { create } from 'zustand';
import type { ShipModule, BattleshipState, BattleState, GamePhase, PlayerInfo } from './types';
import {
  calculateAttributes,
  createBattleshipState,
  generateMockOpponentModules,
  canPlaceModule,
  MODULE_CATALOG,
} from './shipBuilder';
import {
  initializeBattle,
  fireBulletFromShip,
  updateBattleState,
} from './battleEngine';

interface GameState {
  gamePhase: GamePhase;
  placedModules: ShipModule[];
  playerShip: BattleshipState | null;
  opponentShip: BattleshipState | null;
  battleState: BattleState | null;
  players: PlayerInfo[];
  currentUserId: string;
  challengeNotif: { from: string; name: string } | null;
  rejectNotif: string | null;
  lastFireTime: number;

  setGamePhase: (phase: GamePhase) => void;
  addModule: (moduleType: typeof MODULE_CATALOG[number], x: number, y: number) => boolean;
  removeModule: (x: number, y: number) => void;
  buildPlayerShip: () => void;
  startBattle: () => void;
  fireTick: () => void;
  tick: (dt: number, keys: Set<string>) => void;
  resetGame: () => void;
  sendChallenge: (targetId: string) => void;
  acceptChallenge: () => void;
  rejectChallenge: () => void;
  dismissReject: () => void;
  setPlayers: (players: PlayerInfo[]) => void;
}

const mockPlayers: PlayerInfo[] = [
  { id: 'bot-1', name: '星际猎手', shipSnapshot: null, online: true },
  { id: 'bot-2', name: '暗影战隼', shipSnapshot: null, online: true },
  { id: 'bot-3', name: '银河守护者', shipSnapshot: null, online: true },
  { id: 'bot-4', name: '量子先锋', shipSnapshot: null, online: false },
];

export const useGameStore = create<GameState>((set, get) => ({
  gamePhase: 'lobby',
  placedModules: [],
  playerShip: null,
  opponentShip: null,
  battleState: null,
  players: mockPlayers,
  currentUserId: 'player-1',
  challengeNotif: null,
  rejectNotif: null,
  lastFireTime: 0,

  setGamePhase: (phase) => set({ gamePhase: phase }),

  addModule: (moduleType, x, y) => {
    const { placedModules } = get();
    if (!canPlaceModule(placedModules, x, y, moduleType)) return false;

    const newModule: ShipModule = {
      moduleId: `${moduleType.category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: moduleType,
      gridX: x,
      gridY: y,
    };
    set({ placedModules: [...placedModules, newModule] });
    return true;
  },

  removeModule: (x, y) => {
    const { placedModules } = get();
    const target = placedModules.find((m) => m.gridX === x && m.gridY === y);
    if (!target) return;

    const remaining = placedModules.filter((m) => m.gridX !== x || m.gridY !== y);
    const hasCockpit = remaining.some((m) => m.type.category === 'cockpit');
    const hasAdjacent = remaining.every((m) =>
      remaining.some(
        (o) =>
          o !== m &&
          Math.abs(o.gridX - m.gridX) + Math.abs(o.gridY - m.gridY) === 1
      )
    );

    if (remaining.length === 0 || (hasCockpit && hasAdjacent) || remaining.length === 1) {
      set({ placedModules: remaining });
    } else {
      set({ placedModules: remaining });
    }
  },

  buildPlayerShip: () => {
    const { placedModules } = get();
    const attrs = calculateAttributes(placedModules);
    if (attrs.totalWeight > attrs.thrustCap || attrs.totalEnergyCost > attrs.energyCap) {
      return;
    }
    const ship = createBattleshipState(placedModules, 'player-1', 0, 0);
    set({ playerShip: ship });
  },

  startBattle: () => {
    const { placedModules, playerShip } = get();
    if (!playerShip) {
      const ship = createBattleshipState(placedModules, 'player-1', 0, 0);
      const oppModules = generateMockOpponentModules();
      const oppShip = createBattleshipState(oppModules, 'bot-1', 0, 0);
      const battle = initializeBattle(ship, oppShip);
      set({
        playerShip: ship,
        opponentShip: oppShip,
        battleState: battle,
        gamePhase: 'battle',
        lastFireTime: 0,
      });
    } else {
      const oppModules = generateMockOpponentModules();
      const oppShip = createBattleshipState(oppModules, 'bot-1', 0, 0);
      const battle = initializeBattle(playerShip, oppShip);
      set({
        opponentShip: oppShip,
        battleState: battle,
        gamePhase: 'battle',
        lastFireTime: 0,
      });
    }
  },

  fireTick: () => {
    const { battleState, lastFireTime } = get();
    if (!battleState || battleState.phase !== 'fighting') return;

    const now = Date.now();
    if (now - lastFireTime < 500) return;

    const newBullets = [...battleState.bullets];

    if (battleState.player.totalAttack > 0 && battleState.player.alive) {
      newBullets.push(fireBulletFromShip(battleState.player, battleState.opponent));
    }
    if (battleState.opponent.totalAttack > 0 && battleState.opponent.alive) {
      newBullets.push(fireBulletFromShip(battleState.opponent, battleState.player));
    }

    set({
      battleState: { ...battleState, bullets: newBullets },
      lastFireTime: now,
    });
  },

  tick: (dt, keys) => {
    const { battleState } = get();
    if (!battleState || battleState.phase !== 'fighting') return;

    get().fireTick();
    const currentState = get().battleState;
    if (!currentState) return;

    const updated = updateBattleState(currentState, dt, keys);
    set({ battleState: updated });
  },

  resetGame: () => {
    set({
      gamePhase: 'lobby',
      placedModules: [],
      playerShip: null,
      opponentShip: null,
      battleState: null,
      lastFireTime: 0,
      challengeNotif: null,
      rejectNotif: null,
    });
  },

  sendChallenge: (targetId) => {
    const rng = Math.random();
    if (rng > 0.5) {
      get().acceptChallenge();
    } else {
      const target = get().players.find((p) => p.id === targetId);
      set({ rejectNotif: `${target?.name || '对手'}拒绝了你的挑战` });
      setTimeout(() => get().dismissReject(), 2000);
    }
  },

  acceptChallenge: () => {
    const { placedModules } = get();
    if (placedModules.length === 0) {
      set({ gamePhase: 'building' });
      return;
    }
    get().buildPlayerShip();
    get().startBattle();
  },

  rejectChallenge: () => {
    set({ challengeNotif: null });
  },

  dismissReject: () => {
    set({ rejectNotif: null });
  },

  setPlayers: (players) => set({ players }),
}));
