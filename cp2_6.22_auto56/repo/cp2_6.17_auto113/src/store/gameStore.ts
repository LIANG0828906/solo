import { create } from 'zustand';
import type { GameState, Position, PlayerId } from '../types';
import {
  createInitialState,
  createLog,
  canMoveTo,
  canAttack,
  canUseSkill,
  checkWinner,
  decrementCooldowns,
  resetTurnFlags,
  findPathBFS,
} from '../engine/gameEngine';

interface GameStore extends GameState {
  moveHero: (player: PlayerId, target: Position) => boolean;
  updateDisplayPosition: (player: PlayerId, pos: Position) => void;
  attack: (attacker: PlayerId) => boolean;
  useSkill: (caster: PlayerId, skillId: string) => boolean;
  endTurn: () => void;
  selectSkill: (skillId: string | null) => void;
  setIsAnimating: (val: boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  moveHero: (player: PlayerId, target: Position) => {
    const state = get();
    if (state.phase === 'game_over') return false;
    if (state.isAnimating) return false;

    const otherId = player === 'player' ? 'ai' : 'player';
    const hero = state.heroes[player];
    const otherHeroPos = state.heroes[otherId].position;

    if (!canMoveTo(hero, target, otherHeroPos)) return false;

    const path = findPathBFS(hero.position, target, [otherHeroPos], hero.moveRange);
    if (!path) return false;

    const logMsg = `${player === 'player' ? '玩家' : 'AI'}回合：${hero.name}移动至(${target.x},${target.y})`;

    set((s) => ({
      heroes: {
        ...s.heroes,
        [player]: {
          ...s.heroes[player],
          position: { ...target },
          hasMoved: true,
        },
      },
      logs: [...s.logs, createLog(s.turn, player, logMsg)],
      isAnimating: true,
    }));

    return true;
  },

  updateDisplayPosition: (player: PlayerId, pos: Position) => {
    set((s) => ({
      heroes: {
        ...s.heroes,
        [player]: {
          ...s.heroes[player],
          displayPosition: { ...pos },
        },
      },
    }));
  },

  attack: (attacker: PlayerId) => {
    const state = get();
    if (state.phase === 'game_over') return false;
    if (state.isAnimating) return false;

    const defender = attacker === 'player' ? 'ai' : 'player';
    const atkHero = state.heroes[attacker];
    const defHero = state.heroes[defender];

    if (!canAttack(atkHero, defHero)) return false;

    const newHp = Math.max(0, defHero.currentHp - atkHero.attack);
    const logMsg = `${attacker === 'player' ? '玩家' : 'AI'}回合：${atkHero.name}对${defHero.name}发起攻击，造成${atkHero.attack}点伤害`;

    set((s) => {
      const newHeroes = {
        ...s.heroes,
        [attacker]: {
          ...s.heroes[attacker],
          hasActed: true,
        },
        [defender]: {
          ...s.heroes[defender],
          currentHp: newHp,
        },
      };
      const winner = checkWinner(newHeroes);
      return {
        heroes: newHeroes,
        logs: [...s.logs, createLog(s.turn, attacker, logMsg)],
        winner,
        phase: winner ? 'game_over' : s.phase,
      };
    });

    return true;
  },

  useSkill: (caster: PlayerId, skillId: string) => {
    const state = get();
    if (state.phase === 'game_over') return false;
    if (state.isAnimating) return false;

    const target = caster === 'player' ? 'ai' : 'player';
    const casterHero = state.heroes[caster];
    const targetHero = state.heroes[target];

    const check = canUseSkill(casterHero, targetHero, skillId);
    if (!check.valid) return false;

    const skill = casterHero.skills.find((s) => s.id === skillId)!;
    let newTargetHp = targetHero.currentHp;
    let newStun = targetHero.stunned;
    let logMsg = '';

    if (skill.type === 'damage') {
      newTargetHp = Math.max(0, targetHero.currentHp - skill.damage);
      logMsg = `${caster === 'player' ? '玩家' : 'AI'}回合：${casterHero.name}对${targetHero.name}使用${skill.name}，造成${skill.damage}点伤害`;
    } else if (skill.type === 'control') {
      newStun = targetHero.stunned + (skill.stunDuration || 1);
      logMsg = `${caster === 'player' ? '玩家' : 'AI'}回合：${casterHero.name}对${targetHero.name}使用${skill.name}，眩晕${skill.stunDuration}回合`;
    }

    set((s) => {
      const newHeroes = {
        ...s.heroes,
        [caster]: {
          ...s.heroes[caster],
          hasActed: true,
          skills: s.heroes[caster].skills.map((sk) =>
            sk.id === skillId ? { ...sk, currentCooldown: sk.cooldown } : sk
          ),
        },
        [target]: {
          ...s.heroes[target],
          currentHp: newTargetHp,
          stunned: newStun,
        },
      };
      const winner = checkWinner(newHeroes);
      return {
        heroes: newHeroes,
        logs: [...s.logs, createLog(s.turn, caster, logMsg)],
        winner,
        phase: winner ? 'game_over' : s.phase,
        selectedSkill: null,
      };
    });

    return true;
  },

  endTurn: () => {
    const state = get();
    if (state.phase === 'game_over') return;

    const nextPlayer: PlayerId = state.currentPlayer === 'player' ? 'ai' : 'player';
    const newTurn = nextPlayer === 'player' ? state.turn + 1 : state.turn;

    set((s) => {
      const updatedNext = resetTurnFlags(decrementCooldowns(s.heroes[nextPlayer]));
      return {
        heroes: {
          ...s.heroes,
          [nextPlayer]: updatedNext,
        },
        turn: newTurn,
        currentPlayer: nextPlayer,
        phase: nextPlayer === 'player' ? 'player_turn' : 'ai_turn',
        selectedSkill: null,
        isAnimating: false,
      };
    });
  },

  selectSkill: (skillId: string | null) => {
    set({ selectedSkill: skillId });
  },

  setIsAnimating: (val: boolean) => {
    set({ isAnimating: val });
  },

  resetGame: () => {
    set(createInitialState());
  },
}));
