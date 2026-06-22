import { create } from 'zustand';
import type { Unit, HexCoord, GamePhase, Skill, DamagePopup, GameResult } from '../types';
import { GridEngine } from '../engine/GridEngine';
import { CombatEngine, type AnimationEvent, type AttackResult } from '../engine/CombatEngine';
import { AIEngine, type AIAction } from '../engine/AIEngine';
import { createHeroes, createEnemies } from '../data/units';

interface GameState {
  heroes: Unit[];
  enemies: Unit[];
  turn: number;
  currentTeam: 'player' | 'enemy';
  phase: GamePhase;
  selectedHeroId: string | null;
  selectedSkill: Skill | null;
  reachableCells: HexCoord[];
  attackableCells: HexCoord[];
  attackableEnemyIds: Set<string>;
  animations: AnimationEvent[];
  corpses: HexCoord[];
  aiThinkingEnemyId: string | null;
  gameResult: GameResult;

  gridEngine: GridEngine;
  combatEngine: CombatEngine;
  aiEngine: AIEngine;

  selectHero: (heroId: string | null) => void;
  moveHero: (target: HexCoord) => void;
  selectSkill: (skill: Skill | null) => void;
  attackEnemy: (enemyId: string) => void;
  endPlayerTurn: () => void;
  executeEnemyTurn: () => void;
  resetGame: () => void;
  cleanupAnimations: () => void;
}

function getBlockedCoords(heroes: Unit[], enemies: Unit[]): Set<string> {
  const grid = new GridEngine();
  const blocked = new Set<string>();
  for (const u of [...heroes, ...enemies]) {
    if (!u.isDead) blocked.add(grid.hexKey(u.position));
  }
  return blocked;
}

export const useGameStore = create<GameState>((set, get) => {
  const gridEngine = new GridEngine();
  const combatEngine = new CombatEngine();
  const aiEngine = new AIEngine(gridEngine);

  return {
    heroes: createHeroes(),
    enemies: createEnemies(),
    turn: 1,
    currentTeam: 'player',
    phase: 'select',
    selectedHeroId: null,
    selectedSkill: null,
    reachableCells: [],
    attackableCells: [],
    attackableEnemyIds: new Set(),
    animations: [],
    corpses: [],
    aiThinkingEnemyId: null,
    gameResult: null,

    gridEngine,
    combatEngine,
    aiEngine,

    selectHero: (heroId) => {
      const state = get();
      if (state.currentTeam !== 'player' || state.phase === 'animating') return;

      if (heroId === null) {
        set({
          selectedHeroId: null,
          selectedSkill: null,
          reachableCells: [],
          attackableCells: [],
          attackableEnemyIds: new Set(),
          phase: 'select',
        });
        return;
      }

      const hero = state.heroes.find(h => h.id === heroId);
      if (!hero || hero.isDead) return;

      const blocked = getBlockedCoords(state.heroes, state.enemies);
      const reachable = hero.hasMoved ? [] : gridEngine.getReachableCells(hero.position, hero.move, blocked);
      const attackable: HexCoord[] = [];
      const attackableIds = new Set<string>();

      const maxSkillRange = hero.skills.reduce((max, s) => Math.max(max, s.range), 0);
      const attackRange = gridEngine.getAttackRange(hero.position, maxSkillRange);
      for (const cell of attackRange) {
        for (const enemy of state.enemies) {
          if (!enemy.isDead && gridEngine.hexKey(enemy.position) === gridEngine.hexKey(cell)) {
            attackable.push(cell);
            attackableIds.add(enemy.id);
            break;
          }
        }
      }

      set({
        selectedHeroId: heroId,
        selectedSkill: null,
        reachableCells: reachable,
        attackableCells: attackable,
        attackableEnemyIds: attackableIds,
        phase: hero.hasActed ? 'select' : hero.hasMoved ? 'attack' : 'move',
      });
    },

    moveHero: (target) => {
      const state = get();
      if (!state.selectedHeroId || state.phase !== 'move' || state.currentTeam !== 'player') return;

      const hero = state.heroes.find(h => h.id === state.selectedHeroId);
      if (!hero || hero.hasMoved) return;

      const isReachable = state.reachableCells.some(c =>
        gridEngine.hexKey(c) === gridEngine.hexKey(target)
      );
      if (!isReachable) return;

      const newHeroes = state.heroes.map(h =>
        h.id === hero.id ? { ...h, position: { ...target }, hasMoved: true } : h
      );
      const movedHero = newHeroes.find(h => h.id === hero.id)!;

      const attackable: HexCoord[] = [];
      const attackableIds = new Set<string>();
      const maxSkillRange = movedHero.skills.reduce((max, s) => Math.max(max, s.range), 0);
      const attackRange = gridEngine.getAttackRange(movedHero.position, maxSkillRange);
      for (const cell of attackRange) {
        for (const enemy of state.enemies) {
          if (!enemy.isDead && gridEngine.hexKey(enemy.position) === gridEngine.hexKey(cell)) {
            attackable.push(cell);
            attackableIds.add(enemy.id);
            break;
          }
        }
      }

      set({
        heroes: newHeroes,
        reachableCells: [],
        attackableCells: attackable,
        attackableEnemyIds: attackableIds,
        phase: movedHero.hasActed ? 'select' : (attackableIds.size > 0 ? 'attack' : 'select'),
      });
    },

    selectSkill: (skill) => {
      const state = get();
      if (!state.selectedHeroId || state.currentTeam !== 'player') return;

      if (skill && skill.currentCooldown > 0) return;

      const hero = state.heroes.find(h => h.id === state.selectedHeroId);
      if (!hero || hero.hasActed) return;

      if (!skill) {
        set({ selectedSkill: null });
        return;
      }

      const attackable: HexCoord[] = [];
      const attackableIds = new Set<string>();
      const attackRange = gridEngine.getAttackRange(hero.position, skill.range);
      for (const cell of attackRange) {
        for (const enemy of state.enemies) {
          if (!enemy.isDead && gridEngine.hexKey(enemy.position) === gridEngine.hexKey(cell)) {
            attackable.push(cell);
            attackableIds.add(enemy.id);
            break;
          }
        }
      }

      set({
        selectedSkill: skill,
        attackableCells: attackable,
        attackableEnemyIds: attackableIds,
        phase: 'attack',
      });
    },

    attackEnemy: (enemyId) => {
      const state = get();
      if (!state.selectedHeroId || state.currentTeam !== 'player') return;
      if (state.phase !== 'attack') return;
      if (!state.attackableEnemyIds.has(enemyId)) return;

      const hero = state.heroes.find(h => h.id === state.selectedHeroId);
      const enemy = state.enemies.find(e => e.id === enemyId);
      if (!hero || !enemy || hero.hasActed || enemy.isDead) return;

      const skill = state.selectedSkill || hero.skills.find(s => s.currentCooldown === 0) || hero.skills[0];
      if (!skill) return;

      const heroCopy = JSON.parse(JSON.stringify(hero)) as Unit;
      const enemyCopy = JSON.parse(JSON.stringify(enemy)) as Unit;
      const skillCopy = heroCopy.skills.find(s => s.id === skill.id) || heroCopy.skills[0];

      const result: AttackResult = combatEngine.executeSkill(heroCopy, enemyCopy, skillCopy);
      const animEvents = combatEngine.generateAnimationEvents(result, enemyCopy.position);

      const newHeroes = state.heroes.map(h =>
        h.id === hero.id
          ? { ...heroCopy, hasActed: true, hasMoved: true }
          : h
      );

      let newCorpses = [...state.corpses];
      if (result.targetDied) {
        newCorpses.push({ ...enemyCopy.position });
      }

      const newEnemies = state.enemies.map(e =>
        e.id === enemy.id ? { ...enemyCopy } : e
      );

      let gameResult: GameResult = null;
      if (newEnemies.every(e => e.isDead)) {
        gameResult = 'victory';
      }

      set({
        heroes: newHeroes,
        enemies: newEnemies,
        animations: [...state.animations, ...animEvents],
        corpses: newCorpses,
        selectedSkill: null,
        attackableCells: [],
        attackableEnemyIds: new Set(),
        phase: 'select',
        gameResult,
      });
    },

    endPlayerTurn: () => {
      const state = get();
      if (state.currentTeam !== 'player' || state.phase === 'animating') return;

      const resetHeroes = state.heroes.map(h => ({
        ...h,
        hasMoved: false,
        hasActed: false,
      }));

      for (const h of resetHeroes) {
        combatEngine.processStatusEffects(h);
        combatEngine.decrementCooldowns(h);
      }

      set({
        heroes: resetHeroes,
        currentTeam: 'enemy',
        phase: 'enemy',
        selectedHeroId: null,
        selectedSkill: null,
        reachableCells: [],
        attackableCells: [],
        attackableEnemyIds: new Set(),
      });

      setTimeout(() => get().executeEnemyTurn(), 500);
    },

    executeEnemyTurn: () => {
      const state = get();
      if (state.currentTeam !== 'enemy') return;

      const aliveEnemies = state.enemies.filter(e => !e.isDead);
      if (aliveEnemies.length === 0) {
        const nextTurn = state.turn + 1;
        set({
          currentTeam: 'player',
          turn: nextTurn,
          phase: 'select',
        });
        return;
      }

      const actions = aiEngine.decideAllActions(state.enemies, state.heroes, [...state.heroes, ...state.enemies]);

      let delay = 0;
      const updatedState = { ...state };

      for (const action of actions) {
        setTimeout(() => {
          const s = get();
          const enemy = s.enemies.find(e => e.id === action.enemyId);
          if (!enemy || enemy.isDead) return;

          set({ aiThinkingEnemyId: action.enemyId });

          setTimeout(() => {
            const s2 = get();
            let currentEnemy = s2.enemies.find(e => e.id === action.enemyId);
            if (!currentEnemy || currentEnemy.isDead) {
              set({ aiThinkingEnemyId: null });
              return;
            }

            let newEnemies = [...s2.enemies];
            let newHeroes = [...s2.heroes];
            let newAnimations = [...s2.animations];
            let newCorpses = [...s2.corpses];

            if (action.moveTarget) {
              newEnemies = newEnemies.map(e =>
                e.id === action.enemyId ? { ...e, position: { ...action.moveTarget! } } : e
              );
              currentEnemy = newEnemies.find(e => e.id === action.enemyId)!;
            }

            if (action.attackTargetId) {
              const target = newHeroes.find(h => h.id === action.attackTargetId);
              if (target && !target.isDead) {
                const skill = action.skillId
                  ? currentEnemy.skills.find(sk => sk.id === action.skillId) || currentEnemy.skills[0]
                  : currentEnemy.skills[0];

                const enemyCopy = JSON.parse(JSON.stringify(currentEnemy)) as Unit;
                const targetCopy = JSON.parse(JSON.stringify(target)) as Unit;
                const skillCopy = enemyCopy.skills.find(sk => sk.id === skill.id) || enemyCopy.skills[0];

                const result = combatEngine.executeSkill(enemyCopy, targetCopy, skillCopy);
                const animEvents = combatEngine.generateAnimationEvents(result, targetCopy.position);

                newEnemies = newEnemies.map(e => e.id === action.enemyId ? enemyCopy : e);
                newHeroes = newHeroes.map(h => h.id === target.id ? targetCopy : h);
                newAnimations = [...newAnimations, ...animEvents];

                if (result.targetDied) {
                  newCorpses.push({ ...targetCopy.position });
                }
              }
            }

            let gameResult: GameResult = null;
            if (newHeroes.every(h => h.isDead)) {
              gameResult = 'defeat';
            }

            set({
              enemies: newEnemies,
              heroes: newHeroes,
              animations: newAnimations,
              corpses: newCorpses,
              aiThinkingEnemyId: null,
              gameResult,
            });
          }, 500);
        }, delay);

        delay += 1200;
      }

      setTimeout(() => {
        const s = get();

        const resetEnemies = s.enemies.map(e => ({ ...e, hasMoved: false, hasActed: false }));
        for (const e of resetEnemies) {
          combatEngine.processStatusEffects(e);
          combatEngine.decrementCooldowns(e);
        }

        const nextTurn = s.turn + 1;
        set({
          enemies: resetEnemies,
          currentTeam: 'player',
          turn: nextTurn,
          phase: 'select',
          aiThinkingEnemyId: null,
        });
      }, delay + 800);
    },

    resetGame: () => {
      set({
        heroes: createHeroes(),
        enemies: createEnemies(),
        turn: 1,
        currentTeam: 'player',
        phase: 'select',
        selectedHeroId: null,
        selectedSkill: null,
        reachableCells: [],
        attackableCells: [],
        attackableEnemyIds: new Set(),
        animations: [],
        corpses: [],
        aiThinkingEnemyId: null,
        gameResult: null,
      });
    },

    cleanupAnimations: () => {
      const state = get();
      const now = Date.now();
      const active = state.animations.filter(a => {
        const age = now - a.timestamp;
        return age < a.duration;
      });
      if (active.length !== state.animations.length) {
        set({ animations: active });
      }
    },
  };
});
