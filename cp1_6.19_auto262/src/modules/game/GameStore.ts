import { create } from 'zustand';
import type { ElementType, HexCoord, Terrain, WeatherType } from '../board/hexUtils';
import { BOARD_SIZE, generateTerrainBoard, getRandomWeather, isInBoard } from '../board/hexUtils';
import type { Skill, SpiritStats } from '../entities/spiritData';
import { getSpiritTemplate, createSkillsFromTemplate } from '../entities/spiritData';
import {
  calculateDamage,
  applyTerrainEffect,
  canMoveTo,
  canAttack,
  findComboSpirits,
  calculateComboDamage,
  getSpiritAtPosition,
  isGameOver
} from './battleEngine';

export interface SpiritBuffs {
  attack: number;
  defense: number;
  speed: number;
  dodge: number;
  shield: number;
}

export interface SpiritOnBoard {
  id: string;
  name: string;
  element: ElementType;
  stats: SpiritStats;
  position: HexCoord | null;
  passiveSkill: string;
  passiveDescription: string;
  activeSkills: Skill[];
  canAct: boolean;
  hasMoved: boolean;
  hasAttacked: boolean;
  owner: 'player' | 'enemy';
  buffs: SpiritBuffs;
  level: number;
  experience: number;
}

export interface ActionLog {
  id: string;
  turn: number;
  actor: string;
  action: string;
  message: string;
  timestamp: number;
}

export interface GameState {
  board: Terrain[][];
  spirits: SpiritOnBoard[];
  currentTurn: number;
  currentPlayer: 'player' | 'enemy';
  weather: WeatherType;
  actionLog: ActionLog[];
  selectedSpirit: string | null;
  selectedSkill: string | null;
  gamePhase: 'summon' | 'action' | 'battle' | 'end';
  gameOver: boolean;
  winner: 'player' | 'enemy' | null;
  summonPoints: number;
  animating: boolean;

  initGame: () => void;
  summonSpirit: (element: ElementType, position: HexCoord, owner?: 'player' | 'enemy') => boolean;
  moveSpirit: (spiritId: string, target: HexCoord) => boolean;
  attackSpirit: (attackerId: string, targetId: string) => boolean;
  useSkill: (spiritId: string, skillId: string, target: HexCoord) => boolean;
  endTurn: () => void;
  selectSpirit: (spiritId: string | null) => void;
  selectSkill: (skillId: string | null) => void;
  applyAllTerrainEffects: () => void;
  addLog: (actor: string, action: string, message: string) => void;
  setAnimating: (animating: boolean) => void;
  getTerrainAt: (position: HexCoord) => Terrain | undefined;
}

let spiritIdCounter = 0;

function generateSpiritId(): string {
  return `spirit_${Date.now()}_${spiritIdCounter++}`;
}

function createSpirit(element: ElementType, owner: 'player' | 'enemy'): SpiritOnBoard {
  const template = getSpiritTemplate(element);
  return {
    id: generateSpiritId(),
    name: template.name,
    element: template.element,
    stats: { ...template.baseStats },
    position: null,
    passiveSkill: template.passiveSkill,
    passiveDescription: template.passiveDescription,
    activeSkills: createSkillsFromTemplate(template),
    canAct: true,
    hasMoved: false,
    hasAttacked: false,
    owner,
    buffs: {
      attack: 0,
      defense: 0,
      speed: 0,
      dodge: 0,
      shield: 0
    },
    level: 1,
    experience: 0
  };
}

function initEnemySpirits(): SpiritOnBoard[] {
  const elements: ElementType[] = ['fire', 'water', 'wind', 'earth', 'light', 'dark'];
  const positions: HexCoord[] = [
    { q: 0, r: 0 },
    { q: 1, r: 0 },
    { q: 0, r: 1 }
  ];
  
  return positions.map((pos, i) => {
    const spirit = createSpirit(elements[i % elements.length], 'enemy');
    spirit.position = pos;
    spirit.canAct = false;
    return spirit;
  });
}

export const useGameStore = create<GameState>((set, get) => ({
  board: [],
  spirits: [],
  currentTurn: 1,
  currentPlayer: 'player',
  weather: 'sunny',
  actionLog: [],
  selectedSpirit: null,
  selectedSkill: null,
  gamePhase: 'action',
  gameOver: false,
  winner: null,
  summonPoints: 3,
  animating: false,

  initGame: () => {
    spiritIdCounter = 0;
    const board = generateTerrainBoard(BOARD_SIZE);
    const enemySpirits = initEnemySpirits();
    
    set({
      board,
      spirits: enemySpirits,
      currentTurn: 1,
      currentPlayer: 'player',
      weather: getRandomWeather(),
      actionLog: [],
      selectedSpirit: null,
      selectedSkill: null,
      gamePhase: 'action',
      gameOver: false,
      winner: null,
      summonPoints: 3,
      animating: false
    });
    
    get().addLog('系统', '游戏开始', '欢迎来到幻灵棋！召唤你的灵体开始战斗吧！');
  },

  summonSpirit: (element: ElementType, position: HexCoord, owner: 'player' | 'enemy' = 'player') => {
    const state = get();
    if (state.gameOver) return false;
    if (state.currentPlayer !== owner) return false;
    if (owner === 'player' && state.summonPoints <= 0) return false;
    if (!isInBoard(position, BOARD_SIZE)) return false;
    
    const occupied = state.spirits.some(
      s => s.position && s.position.q === position.q && s.position.r === position.r
    );
    if (occupied) return false;
    
    const spirit = createSpirit(element, owner);
    spirit.position = position;
    
    set(state => ({
      spirits: [...state.spirits, spirit],
      summonPoints: owner === 'player' ? state.summonPoints - 1 : state.summonPoints
    }));
    
    get().addLog(
      owner === 'player' ? '玩家' : '敌方',
      '召唤',
      `${owner === 'player' ? '玩家' : '敌方'}召唤了${spirit.name}到(${position.q}, ${position.r})`
    );
    
    return true;
  },

  moveSpirit: (spiritId: string, target: HexCoord) => {
    const state = get();
    if (state.gameOver || state.animating) return false;
    
    const spirit = state.spirits.find(s => s.id === spiritId);
    if (!spirit || !spirit.canAct || spirit.hasMoved) return false;
    if (spirit.owner !== state.currentPlayer) return false;
    
    if (!canMoveTo(spirit, target, state.spirits, BOARD_SIZE)) return false;
    
    set(state => ({
      spirits: state.spirits.map(s =>
        s.id === spiritId
          ? { ...s, position: target, hasMoved: true }
          : s
      ),
      selectedSpirit: null
    }));
    
    get().addLog(
      spirit.name,
      '移动',
      `${spirit.name}移动到(${target.q}, ${target.r})`
    );
    
    return true;
  },

  attackSpirit: (attackerId: string, targetId: string) => {
    const state = get();
    if (state.gameOver || state.animating) return false;
    
    const attacker = state.spirits.find(s => s.id === attackerId);
    const target = state.spirits.find(s => s.id === targetId);
    
    if (!attacker || !target) return false;
    if (!attacker.canAct || attacker.hasAttacked) return false;
    if (attacker.owner !== state.currentPlayer) return false;
    
    if (!canAttack(attacker, target)) return false;
    
    const terrain = state.getTerrainAt(target.position!);
    const result = calculateDamage(attacker, target, terrain, state.weather);
    
    const comboSpirits = findComboSpirits(attacker, state.spirits);
    const finalDamage = comboSpirits.length > 0
      ? calculateComboDamage(result.damage, comboSpirits.length)
      : result.damage;
    
    let actualDamage = finalDamage;
    let newShield = target.buffs.shield;
    
    if (newShield > 0) {
      if (newShield >= actualDamage) {
        newShield -= actualDamage;
        actualDamage = 0;
      } else {
        actualDamage -= newShield;
        newShield = 0;
      }
    }
    
    const newHp = Math.max(0, target.stats.hp - actualDamage);
    
    set(state => ({
      spirits: state.spirits.map(s => {
        if (s.id === attackerId) {
          return { ...s, hasAttacked: true };
        }
        if (s.id === targetId) {
          return {
            ...s,
            stats: { ...s.stats, hp: newHp },
            buffs: { ...s.buffs, shield: newShield }
          };
        }
        return s;
      }).filter(s => s.stats.hp > 0),
      selectedSpirit: null
    }));
    
    const comboMessage = comboSpirits.length > 0
      ? `（${comboSpirits.length}连携！伤害提升${comboSpirits.length * 20}%）`
      : '';
    
    get().addLog(
      attacker.name,
      '攻击',
      `${result.message}${comboMessage}${newHp <= 0 ? `，${target.name}被击败！` : ''}`
    );
    
    const gameResult = isGameOver(get().spirits);
    if (gameResult.over) {
      set({
        gameOver: true,
        winner: gameResult.winner,
        gamePhase: 'end'
      });
      get().addLog(
        '系统',
        '游戏结束',
        gameResult.winner === 'player' ? '恭喜你获得胜利！' : '很遗憾，你输了...'
      );
    }
    
    return true;
  },

  useSkill: (spiritId: string, skillId: string, target: HexCoord) => {
    const state = get();
    if (state.gameOver || state.animating) return false;
    
    const spirit = state.spirits.find(s => s.id === spiritId);
    if (!spirit || !spirit.canAct || spirit.hasAttacked) return false;
    if (spirit.owner !== state.currentPlayer) return false;
    
    const skill = spirit.activeSkills.find(s => s.id === skillId);
    if (!skill || skill.currentCooldown > 0) return false;
    
    const targetSpirit = getSpiritAtPosition(target, state.spirits);
    
    if (skill.damage > 0) {
      if (!targetSpirit || targetSpirit.owner === spirit.owner) return false;
      
      const terrain = state.getTerrainAt(target);
      const result = calculateDamage(spirit, targetSpirit, terrain, state.weather, skill.damage);
      
      const newHp = Math.max(0, targetSpirit.stats.hp - result.damage);
      
      set(state => ({
        spirits: state.spirits.map(s => {
          if (s.id === spiritId) {
            return {
              ...s,
              hasAttacked: true,
              activeSkills: s.activeSkills.map(sk =>
                sk.id === skillId ? { ...sk, currentCooldown: sk.cooldown } : sk
              )
            };
          }
          if (s.id === targetSpirit.id) {
            return { ...s, stats: { ...s.stats, hp: newHp } };
          }
          return s;
        }).filter(s => s.stats.hp > 0),
        selectedSpirit: null,
        selectedSkill: null
      }));
      
      get().addLog(
        spirit.name,
        '技能',
        `${spirit.name}使用${skill.name}！${result.message}${newHp <= 0 ? `，${targetSpirit.name}被击败！` : ''}`
      );
    } else if (skill.damage < 0) {
      const healAmount = Math.abs(skill.damage);
      
      set(state => ({
        spirits: state.spirits.map(s => {
          if (s.id === spiritId) {
            return {
              ...s,
              hasAttacked: true,
              activeSkills: s.activeSkills.map(sk =>
                sk.id === skillId ? { ...sk, currentCooldown: sk.cooldown } : sk
              )
            };
          }
          if (s.position && targetSpirit && s.id === targetSpirit.id) {
            return {
              ...s,
              stats: {
                ...s.stats,
                hp: Math.min(s.stats.maxHp, s.stats.hp + healAmount)
              }
            };
          }
          return s;
        }),
        selectedSpirit: null,
        selectedSkill: null
      }));
      
      get().addLog(
        spirit.name,
        '技能',
        `${spirit.name}使用${skill.name}，恢复了${healAmount}点生命！`
      );
    }
    
    const gameResult = isGameOver(get().spirits);
    if (gameResult.over) {
      set({
        gameOver: true,
        winner: gameResult.winner,
        gamePhase: 'end'
      });
    }
    
    return true;
  },

  endTurn: () => {
    const state = get();
    if (state.gameOver) return;
    
    get().applyAllTerrainEffects();
    
    set(state => {
      const nextPlayer = state.currentPlayer === 'player' ? 'enemy' : 'player';
      const newTurn = nextPlayer === 'player' ? state.currentTurn + 1 : state.currentTurn;
      const newWeather = newTurn % 3 === 0 ? getRandomWeather() : state.weather;
      
      return {
        currentTurn: newTurn,
        currentPlayer: nextPlayer,
        weather: newWeather,
        selectedSpirit: null,
        selectedSkill: null,
        summonPoints: nextPlayer === 'player' ? Math.min(5, state.summonPoints + 1) : state.summonPoints,
        spirits: state.spirits.map(s => ({
          ...s,
          canAct: s.owner === nextPlayer,
          hasMoved: false,
          hasAttacked: false,
          activeSkills: s.activeSkills.map(sk => ({
            ...sk,
            currentCooldown: Math.max(0, sk.currentCooldown - 1)
          }))
        }))
      };
    });
    
    if (get().weather !== state.weather) {
      get().addLog(
        '系统',
        '天气变化',
        `天气变为${state.weather === 'sunny' ? '晴朗' : state.weather === 'rainy' ? '阴雨' : state.weather === 'stormy' ? '风暴' : '平静'}`
      );
    }
    
    get().addLog(
      '系统',
      '回合结束',
      `第${state.currentTurn}回合结束，现在是${get().currentPlayer === 'player' ? '玩家' : '敌方'}回合`
    );
  },

  selectSpirit: (spiritId: string | null) => {
    set({ selectedSpirit: spiritId, selectedSkill: null });
  },

  selectSkill: (skillId: string | null) => {
    set({ selectedSkill: skillId });
  },

  applyAllTerrainEffects: () => {
    const state = get();
    
    state.spirits.forEach(spirit => {
      if (!spirit.position) return;
      
      const terrain = state.getTerrainAt(spirit.position);
      const result = applyTerrainEffect(spirit, terrain, state.weather);
      
      if (result.damage > 0 || result.heal > 0) {
        set(state => ({
          spirits: state.spirits.map(s => {
            if (s.id === spirit.id) {
              const newHp = Math.min(
                s.stats.maxHp,
                Math.max(0, s.stats.hp - result.damage + result.heal)
              );
              return { ...s, stats: { ...s.stats, hp: newHp } };
            }
            return s;
          }).filter(s => s.stats.hp > 0)
        }));
        
        if (result.message) {
          get().addLog(spirit.name, '地形效果', result.message);
        }
      }
    });
  },

  addLog: (actor: string, action: string, message: string) => {
    const log: ActionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      turn: get().currentTurn,
      actor,
      action,
      message,
      timestamp: Date.now()
    };
    
    set(state => ({
      actionLog: [...state.actionLog.slice(-49), log]
    }));
  },

  setAnimating: (animating: boolean) => {
    set({ animating });
  },

  getTerrainAt: (position: HexCoord): Terrain | undefined => {
    const state = get();
    if (!isInBoard(position, BOARD_SIZE)) return undefined;
    return state.board[position.q]?.[position.r];
  }
}));
