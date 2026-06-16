import { create } from 'zustand';
import { Grid, Position } from '../game/Grid';
import {
  Character,
  CombatEngine,
  Team,
  DamageType,
  BattleReport,
} from '../game/CombatEngine';
import { Socket } from 'socket.io-client';

export interface FloatingDamage {
  id: string;
  x: number;
  y: number;
  damage: number;
  damageType: DamageType;
  startTime: number;
}

export interface BattleLogEntry {
  id: string;
  timestamp: number;
  type: 'attack' | 'move' | 'skill';
  message: string;
  characterId?: string;
  targetId?: string;
}

export type ActionType = 'idle' | 'move' | 'attack';

export interface GameState {
  grid: Grid;
  characters: Character[];
  selectedCharacterId: string | null;
  actionMode: ActionType;
  highlightedCells: Position[];
  floatingDamages: FloatingDamage[];
  battleLogs: BattleLogEntry[];
  actionQueue: string[];
  currentActionIndex: number;
  isAutoPlaying: boolean;
  battleReport: BattleReport | null;
  totalDamageDealt: number;
  roundCount: number;
  socket: Socket | null;
  logPanelExpanded: boolean;
  attackAnimations: Map<string, number>;
  selectedRingAngle: number;

  setSocket: (socket: Socket) => void;
  addCharacter: (character: Character, x: number, y: number) => void;
  removeCharacter: (characterId: string) => void;
  selectCharacter: (characterId: string | null) => void;
  setActionMode: (mode: ActionType) => void;
  moveCharacter: (characterId: string, x: number, y: number) => void;
  attackCharacter: (attackerId: string, targetId: string) => void;
  addFloatingDamage: (damage: FloatingDamage) => void;
  removeFloatingDamage: (id: string) => void;
  addBattleLog: (type: 'attack' | 'move' | 'skill', message: string, characterId?: string, targetId?: string) => void;
  startAutoPlay: () => void;
  stopAutoPlay: () => void;
  advanceAutoPlay: () => void;
  setBattleReport: (report: BattleReport | null) => void;
  toggleLogPanel: () => void;
  setAttackAnimation: (characterId: string, startTime: number) => void;
  removeAttackAnimation: (characterId: string) => void;
  updateSelectedRingAngle: (angle: number) => void;
  resetBattle: () => void;
  applyDamageToCharacter: (characterId: string, damage: number) => void;
  updateCharacter: (character: Character) => void;
  setHighlightedCells: (cells: Position[]) => void;
}

let logIdCounter = 0;

export const useGameStore = create<GameState>((set, get) => ({
  grid: new Grid(),
  characters: [],
  selectedCharacterId: null,
  actionMode: 'idle',
  highlightedCells: [],
  floatingDamages: [],
  battleLogs: [],
  actionQueue: [],
  currentActionIndex: 0,
  isAutoPlaying: false,
  battleReport: null,
  totalDamageDealt: 0,
  roundCount: 0,
  socket: null,
  logPanelExpanded: true,
  attackAnimations: new Map(),
  selectedRingAngle: 0,

  setSocket: (socket) => set({ socket }),

  addCharacter: (character, x, y) => {
    const state = get();
    if (state.grid.placeCharacter(character.id, x, y)) {
      const placed = { ...character, x, y };
      set({
        characters: [...state.characters, placed],
      });
      state.socket?.emit('character:place', { character: placed, x, y });
    }
  },

  removeCharacter: (characterId) => {
    const state = get();
    state.grid.removeCharacter(characterId);
    set({
      characters: state.characters.filter(c => c.id !== characterId),
      selectedCharacterId: state.selectedCharacterId === characterId ? null : state.selectedCharacterId,
    });
  },

  selectCharacter: (characterId) => {
    const state = get();
    if (!characterId) {
      set({ selectedCharacterId: null, highlightedCells: [], actionMode: 'idle' });
      return;
    }
    const character = state.characters.find(c => c.id === characterId);
    if (!character) return;
    let cells: Position[] = [];
    if (character.team === Team.Ally) {
      cells = state.grid.getMovementRange(characterId, character.moveRange);
    }
    set({
      selectedCharacterId: characterId,
      highlightedCells: cells,
      actionMode: character.team === Team.Ally ? 'move' : 'idle',
    });
  },

  setActionMode: (mode) => set({ actionMode: mode }),

  moveCharacter: (characterId, x, y) => {
    const state = get();
    const character = state.characters.find(c => c.id === characterId);
    if (!character) return;
    if (state.grid.moveCharacter(characterId, x, y)) {
      const updated = state.characters.map(c =>
        c.id === characterId ? { ...c, x, y } : c
      );
      set({
        characters: updated,
        highlightedCells: [],
        actionMode: 'idle',
      });
      state.addBattleLog('move', `${character.name} 移动到 (${x}, ${y})`, characterId);
      state.socket?.emit('character:move', { characterId, x, y });
    }
  },

  attackCharacter: (attackerId, targetId) => {
    const state = get();
    const attacker = state.characters.find(c => c.id === attackerId);
    const target = state.characters.find(c => c.id === targetId);
    if (!attacker || !target || !target.isAlive) return;

    const damageResult = CombatEngine.calculateDamage(attacker, target);
    const newTarget = CombatEngine.applyDamage(target, damageResult.damage);
    const skillEffect = CombatEngine.getSkillEffect(attacker);
    let finalTarget = newTarget;
    if (skillEffect && Math.random() < 0.3) {
      finalTarget = CombatEngine.addStatusEffect(newTarget, skillEffect);
      state.addBattleLog('skill', `${attacker.name} 对 ${target.name} 施加了${skillEffect.type === 'burn' ? '灼烧' : '中毒'}效果`, attackerId, targetId);
    }

    const floatingDamage: FloatingDamage = {
      id: `dmg-${Date.now()}-${Math.random()}`,
      x: finalTarget.x * state.grid.cellSize + state.grid.cellSize / 2,
      y: finalTarget.y * state.grid.cellSize,
      damage: damageResult.damage,
      damageType: damageResult.damageType,
      startTime: performance.now(),
    };

    const updatedCharacters = state.characters.map(c => {
      if (c.id === targetId) return finalTarget;
      return c;
    });

    set({
      characters: updatedCharacters,
      floatingDamages: [...state.floatingDamages, floatingDamage],
      totalDamageDealt: state.totalDamageDealt + damageResult.damage,
      actionMode: 'idle',
      highlightedCells: [],
      attackAnimations: new Map(state.attackAnimations).set(targetId, performance.now()),
    });

    const critText = damageResult.isCritical ? '（暴击！）' : '';
    const typeText = damageResult.damageType === DamageType.Physical ? '物理' : '魔法';
    state.addBattleLog('attack', `${attacker.name} 对 ${target.name} 造成 ${damageResult.damage} 点${typeText}伤害${critText}`, attackerId, targetId);

    state.socket?.emit('character:attack', {
      attackerId,
      targetId,
      damage: damageResult.damage,
      damageType: damageResult.damageType,
      targetHp: finalTarget.hp,
    });

    setTimeout(() => {
      get().removeFloatingDamage(floatingDamage.id);
      get().removeAttackAnimation(targetId);
    }, 800);
  },

  addFloatingDamage: (damage) => set(state => ({
    floatingDamages: [...state.floatingDamages, damage],
  })),

  removeFloatingDamage: (id) => set(state => ({
    floatingDamages: state.floatingDamages.filter(d => d.id !== id),
  })),

  addBattleLog: (type, message, characterId, targetId) => {
    const entry: BattleLogEntry = {
      id: `log-${++logIdCounter}`,
      timestamp: Date.now(),
      type,
      message,
      characterId,
      targetId,
    };
    set(state => ({
      battleLogs: [entry, ...state.battleLogs],
    }));
  },

  startAutoPlay: () => {
    const state = get();
    const alive = state.characters.filter(c => c.isAlive);
    const sorted = CombatEngine.sortCharactersBySpeed(alive);
    set({
      isAutoPlaying: true,
      actionQueue: sorted.map(c => c.id),
      currentActionIndex: 0,
      roundCount: state.roundCount + 1,
    });
  },

  stopAutoPlay: () => set({ isAutoPlaying: false, actionQueue: [], currentActionIndex: 0 }),

  advanceAutoPlay: () => {
    const state = get();
    if (!state.isAutoPlaying) return;

    const alive = state.characters.filter(c => c.isAlive);
    const allyAlive = alive.some(c => c.team === Team.Ally);
    const enemyAlive = alive.some(c => c.team === Team.Enemy);
    if (!allyAlive || !enemyAlive) {
      const report = CombatEngine.generateBattleReport(state.roundCount, state.characters, state.totalDamageDealt);
      set({ battleReport: report, isAutoPlaying: false });
      return;
    }

    if (state.currentActionIndex >= state.actionQueue.length) {
      const sorted = CombatEngine.sortCharactersBySpeed(alive);
      set({
        actionQueue: sorted.map(c => c.id),
        currentActionIndex: 0,
        roundCount: state.roundCount + 1,
      });
      return;
    }

    const currentId = state.actionQueue[state.currentActionIndex];
    const current = state.characters.find(c => c.id === currentId);
    if (!current || !current.isAlive) {
      set({ currentActionIndex: state.currentActionIndex + 1 });
      return;
    }

    const enemies = state.characters.filter(c => c.isAlive && c.team !== current.team);
    if (enemies.length === 0) {
      const report = CombatEngine.generateBattleReport(state.roundCount, state.characters, state.totalDamageDealt);
      set({ battleReport: report, isAutoPlaying: false });
      return;
    }

    let nearestEnemy = CombatEngine.findNearestEnemy(current, state.characters);
    if (!nearestEnemy) {
      set({ currentActionIndex: state.currentActionIndex + 1 });
      return;
    }

    if (CombatEngine.isInAttackRange(current, nearestEnemy)) {
      state.attackCharacter(current.id, nearestEnemy.id);
    } else {
      const path = state.grid.findShortestPath(
        { x: current.x, y: current.y },
        { x: nearestEnemy.x, y: nearestEnemy.y }
      );
      if (path.length > 0) {
        const moveSteps = path.slice(0, current.moveRange);
        const finalPos = moveSteps[moveSteps.length - 1];
        if (finalPos) {
          state.moveCharacter(current.id, finalPos.x, finalPos.y);
          if (CombatEngine.isInAttackRange({ ...current, x: finalPos.x, y: finalPos.y }, nearestEnemy)) {
            setTimeout(() => {
              const freshState = get();
              const freshTarget = freshState.characters.find(c => c.id === nearestEnemy!.id);
              const freshAttacker = freshState.characters.find(c => c.id === current.id);
              if (freshTarget && freshTarget.isAlive && freshAttacker && freshAttacker.isAlive) {
                freshState.attackCharacter(freshAttacker.id, freshTarget.id);
              }
              set({ currentActionIndex: freshState.currentActionIndex + 1 });
            }, 250);
            return;
          }
        }
      }
    }

    set({ currentActionIndex: state.currentActionIndex + 1 });
  },

  setBattleReport: (report) => set({ battleReport: report }),

  toggleLogPanel: () => set(state => ({ logPanelExpanded: !state.logPanelExpanded })),

  setAttackAnimation: (characterId, startTime) => {
    const map = new Map(get().attackAnimations);
    map.set(characterId, startTime);
    set({ attackAnimations: map });
  },

  removeAttackAnimation: (characterId) => {
    const map = new Map(get().attackAnimations);
    map.delete(characterId);
    set({ attackAnimations: map });
  },

  updateSelectedRingAngle: (angle) => set({ selectedRingAngle: angle }),

  resetBattle: () => {
    const state = get();
    state.grid.reset();
    set({
      characters: [],
      selectedCharacterId: null,
      actionMode: 'idle',
      highlightedCells: [],
      floatingDamages: [],
      battleLogs: [],
      actionQueue: [],
      currentActionIndex: 0,
      isAutoPlaying: false,
      battleReport: null,
      totalDamageDealt: 0,
      roundCount: 0,
      attackAnimations: new Map(),
      selectedRingAngle: 0,
    });
  },

  applyDamageToCharacter: (characterId, damage) => {
    set(state => ({
      characters: state.characters.map(c => {
        if (c.id === characterId) {
          return CombatEngine.applyDamage(c, damage);
        }
        return c;
      }),
    }));
  },

  updateCharacter: (character) => {
    set(state => ({
      characters: state.characters.map(c => (c.id === character.id ? character : c)),
    }));
  },

  setHighlightedCells: (cells) => set({ highlightedCells: cells }),
}));
