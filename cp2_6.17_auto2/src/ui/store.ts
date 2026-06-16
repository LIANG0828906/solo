import { create } from 'zustand';
import { GameState, Rune, AttackResult, Position, ELEMENT_COLORS, RuneElement } from '../game/types';
import {
  createInitialState,
  moveRune,
  autoAttack,
  selectRune,
  endTurn,
  resetGame,
  getRuneById
} from '../game/engine';

interface AnimationState {
  attackAnimations: AttackAnimation[];
  damageNumbers: DamageNumber[];
  shatterEffects: ShatterEffect[];
  movingRunes: MovingRune[];
}

export interface AttackAnimation {
  id: string;
  attackerId: string;
  targetId: string;
  color: string;
  startTime: number;
  duration: number;
}

export interface DamageNumber {
  id: string;
  targetId: string;
  damage: number;
  isCritical: boolean;
  startTime: number;
  duration: number;
}

export interface ShatterEffect {
  id: string;
  runeId: string;
  element: string;
  position: Position;
  startTime: number;
  duration: number;
  pieces: Array<{ x: number; y: number; vx: number; vy: number; size: number }>;
}

export interface MovingRune {
  runeId: string;
  fromPos: Position;
  toPos: Position;
  startTime: number;
  duration: number;
}

interface GameStore extends AnimationState {
  gameState: GameState;
  selectedRune: Rune | null;
  hoveredCell: Position | null;
  isDragging: boolean;
  dragStartPos: Position | null;
  dragCurrentPos: Position | null;
  
  initGame: () => void;
  handleCellClick: (pos: Position) => void;
  handleRuneClick: (runeId: string) => void;
  handleDragStart: (runeId: string, startPos: Position) => void;
  handleDragMove: (currentPos: Position) => void;
  handleDragEnd: (targetPos: Position) => void;
  setHoveredCell: (pos: Position | null) => void;
  doEndTurn: () => void;
  doResetGame: () => void;
  
  addAttackAnimation: (anim: Omit<AttackAnimation, 'id' | 'startTime'>) => void;
  addDamageNumber: (dn: Omit<DamageNumber, 'id' | 'startTime'>) => void;
  addShatterEffect: (effect: Omit<ShatterEffect, 'id' | 'startTime' | 'pieces'> & { pieces?: ShatterEffect['pieces'] }) => void;
  cleanupAnimations: (currentTime: number) => void;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: createInitialState(),
  selectedRune: null,
  hoveredCell: null,
  isDragging: false,
  dragStartPos: null,
  dragCurrentPos: null,
  
  attackAnimations: [],
  damageNumbers: [],
  shatterEffects: [],
  movingRunes: [],
  
  initGame: () => {
    set({ gameState: createInitialState() });
  },
  
  handleCellClick: (pos: Position) => {
    const { gameState, selectedRune } = get();
    if (!selectedRune) return;
    
    const state = get();
    if (state.isDragging) return;
    
    const rune = getRuneById(gameState, selectedRune.id);
    if (!rune) return;
  },
  
  handleRuneClick: (runeId: string) => {
    const { gameState, isDragging } = get();
    if (isDragging) return;
    
    const rune = getRuneById(gameState, runeId);
    if (!rune) return;
    
    if (rune.owner !== gameState.currentTurn) return;
    
    const newState = selectRune(gameState, runeId);
    set({
      gameState: newState,
      selectedRune: rune
    });
  },
  
  handleDragStart: (runeId: string, startPos: Position) => {
    const { gameState } = get();
    const rune = getRuneById(gameState, runeId);
    if (!rune || rune.owner !== gameState.currentTurn) return;
    
    set({
      isDragging: true,
      dragStartPos: startPos,
      dragCurrentPos: startPos,
      selectedRune: rune,
      gameState: selectRune(gameState, runeId)
    });
  },
  
  handleDragMove: (currentPos: Position) => {
    const { isDragging } = get();
    if (!isDragging) return;
    set({ dragCurrentPos: currentPos });
  },
  
  handleDragEnd: (targetPos: Position) => {
    const { gameState, selectedRune, isDragging } = get();
    if (!isDragging || !selectedRune) {
      set({ isDragging: false, dragStartPos: null, dragCurrentPos: null });
      return;
    }
    
    const rune = getRuneById(gameState, selectedRune.id);
    if (!rune) {
      set({ isDragging: false, dragStartPos: null, dragCurrentPos: null });
      return;
    }
    
    const canMove = (() => {
      if (rune.hasMoved) return false;
      if (targetPos.x < 0 || targetPos.x >= gameState.boardSize) return false;
      if (targetPos.y < 0 || targetPos.y >= gameState.boardSize) return false;
      
      const cell = gameState.cells[targetPos.y][targetPos.x];
      if (cell.type === 'obstacle') return false;
      
      for (const playerId of ['player1', 'player2'] as const) {
        const existing = gameState.players[playerId].runes.find(
          r => r.position.x === targetPos.x && r.position.y === targetPos.y && r.currentHp > 0
        );
        if (existing) return false;
      }
      
      const distance = Math.abs(rune.position.x - targetPos.x) + Math.abs(rune.position.y - targetPos.y);
      return distance > 0 && distance <= 3;
    })();
    
    if (canMove) {
      const fromPos = { ...rune.position };
      const toPos = { ...targetPos };
      
      const newState = moveRune(gameState, rune.id, targetPos);
      
      const movingRune: MovingRune = {
        runeId: rune.id,
        fromPos,
        toPos,
        startTime: performance.now(),
        duration: 400
      };
      
      set({
        movingRunes: [...get().movingRunes, movingRune],
        isDragging: false,
        dragStartPos: null,
        dragCurrentPos: null
      });
      
      setTimeout(() => {
        const currentState = get().gameState;
        const movedRune = getRuneById(currentState, rune.id);
        if (!movedRune) return;
        
        const { state: afterAttackState, results } = autoAttack(currentState, rune.id);
        
        const now = performance.now();
        
        for (const result of results) {
          const attacker = getRuneById(afterAttackState, result.attackerId);
          if (attacker) {
            const attackAnim: Omit<AttackAnimation, 'id' | 'startTime'> = {
              attackerId: result.attackerId,
              targetId: result.targetId,
              color: ELEMENT_COLORS[attacker.element].primary,
              duration: 200
            };
            get().addAttackAnimation(attackAnim);
            
            const dmgNum: Omit<DamageNumber, 'id' | 'startTime'> = {
              targetId: result.targetId,
              damage: result.damage,
              isCritical: result.isCritical,
              duration: 600
            };
            get().addDamageNumber(dmgNum);
            
            if (result.targetKilled) {
              const target = getRuneById(afterAttackState, result.targetId);
              if (target) {
                const pieces = Array.from({ length: 8 }, () => ({
                  x: 0,
                  y: 0,
                  vx: (Math.random() - 0.5) * 100,
                  vy: (Math.random() - 0.5) * 100 - 50,
                  size: 2 + Math.random() * 2
                }));
                
                get().addShatterEffect({
                  runeId: result.targetId,
                  element: target.element,
                  position: { ...target.position },
                  duration: 400,
                  pieces
                });
              }
            }
          }
        }
        
        set({ gameState: afterAttackState });
        
        set(state => ({
          selectedRune: getRuneById(afterAttackState, rune.id) || null
        }));
      }, 400);
      
      set({ gameState: newState });
    } else {
      set({
        isDragging: false,
        dragStartPos: null,
        dragCurrentPos: null
      });
    }
  },
  
  setHoveredCell: (pos: Position | null) => {
    set({ hoveredCell: pos });
  },
  
  doEndTurn: () => {
    const { gameState } = get();
    const newState = endTurn(gameState);
    set({
      gameState: newState,
      selectedRune: null
    });
  },
  
  doResetGame: () => {
    set({
      gameState: resetGame(),
      selectedRune: null,
      attackAnimations: [],
      damageNumbers: [],
      shatterEffects: [],
      movingRunes: [],
      isDragging: false,
      dragStartPos: null,
      dragCurrentPos: null
    });
  },
  
  addAttackAnimation: (anim) => {
    set(state => ({
      attackAnimations: [...state.attackAnimations, {
        ...anim,
        id: generateId(),
        startTime: performance.now()
      }]
    }));
  },
  
  addDamageNumber: (dn) => {
    set(state => ({
      damageNumbers: [...state.damageNumbers, {
        ...dn,
        id: generateId(),
        startTime: performance.now()
      }]
    }));
  },
  
  addShatterEffect: (effect) => {
    set(state => ({
      shatterEffects: [...state.shatterEffects, {
        ...effect,
        id: generateId(),
        startTime: performance.now(),
        pieces: effect.pieces || []
      }]
    }));
  },
  
  cleanupAnimations: (currentTime: number) => {
    set(state => ({
      attackAnimations: state.attackAnimations.filter(
        a => currentTime - a.startTime < a.duration
      ),
      damageNumbers: state.damageNumbers.filter(
        d => currentTime - d.startTime < d.duration
      ),
      shatterEffects: state.shatterEffects.filter(
        s => currentTime - s.startTime < s.duration
      ),
      movingRunes: state.movingRunes.filter(
        m => currentTime - m.startTime < m.duration
      )
    }));
  }
}));
