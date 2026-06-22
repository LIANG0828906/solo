import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import type { Card, Enemy, Phase, BattleState, BattleStats, BattleActionRequest } from '@/types/game';

interface GameState {
  playerHP: number;
  playerMaxHP: number;
  playerShield: number;
  hand: Card[];
  deck: Card[];
  enemies: Enemy[];
  round: number;
  phase: Phase;
  stats: BattleStats;
}

interface SocketState {
  roomId: string | null;
  socket: Socket | null;
  isMultiplayer: boolean;
  currentPlayerId: string | null;
}

interface GameContextValue extends GameState, SocketState {
  startNewGame: () => void;
  playCard: (cardIndex: number, targetIndex: number) => void;
  endPlayerTurn: () => void;
  drawCards: (count: number) => void;
  addShield: (amount: number) => void;
  takeDamage: (amount: number) => void;
  dealDamageToEnemy: (enemyIndex: number, amount: number) => void;
  removeEnemy: (enemyIndex: number) => void;
  enemyAction: () => void;
  setPhase: (phase: Phase) => void;
  nextWave: () => void;
  updateFromServer: (battleState: BattleState) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  leaveRoom: () => void;
}

const ENEMY_TEMPLATES = {
  goblin: { name: '哥布林', hp: 50, atk: 8 },
  skeleton: { name: '骷髅兵', hp: 40, atk: 12 },
  darkMage: { name: '暗影法师', hp: 30, atk: 15, specialTimer: 3 },
} as const;

type EnemyTemplateKey = keyof typeof ENEMY_TEMPLATES;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function createCard(name: string, type: Card['type'], value: number): Card {
  const descriptions: Record<Card['type'], string> = {
    attack: `造成 ${value} 点伤害`,
    defense: `获得 ${value} 点护盾`,
    skill: `抽 ${value} 张牌`,
  };
  return { id: generateId(), name, type, value, description: descriptions[type] };
}

function generateRandomEnemies(): Enemy[] {
  const count = Math.floor(Math.random() * 4) + 1;
  const keys: EnemyTemplateKey[] = ['goblin', 'skeleton', 'darkMage'];
  const enemies: Enemy[] = [];
  for (let i = 0; i < count; i++) {
    const key = keys[Math.floor(Math.random() * keys.length)];
    const tpl = ENEMY_TEMPLATES[key];
    enemies.push({
      id: generateId(),
      name: tpl.name,
      type: key,
      hp: tpl.hp,
      maxHP: tpl.hp,
      shield: 0,
      attack: tpl.atk,
      ...(key === 'darkMage' ? { specialTimer: (tpl as typeof ENEMY_TEMPLATES.darkMage).specialTimer } : {}),
    });
  }
  return enemies;
}

function createInitialDeck(): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < 6; i++) deck.push(createCard('斩击', 'attack', 10));
  for (let i = 0; i < 4; i++) deck.push(createCard('格挡', 'defense', 15));
  for (let i = 0; i < 2; i++) deck.push(createCard('洞察', 'skill', 2));
  return deck;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const INITIAL_STATE: GameState = {
  playerHP: 100,
  playerMaxHP: 100,
  playerShield: 0,
  hand: [],
  deck: [],
  enemies: [],
  round: 1,
  phase: 'playerTurn',
  stats: { rounds: 0, totalDamage: 0, totalShield: 0, cardsDrawn: 0 },
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [socketState, setSocketState] = useState<SocketState>({
    roomId: null,
    socket: null,
    isMultiplayer: false,
    currentPlayerId: null,
  });

  const startNewGame = useCallback(() => {
    const deck = shuffleArray(createInitialDeck());
    const hand = deck.splice(0, 5);
    const enemies = generateRandomEnemies();
    setState({
      playerHP: 100,
      playerMaxHP: 100,
      playerShield: 0,
      hand,
      deck,
      enemies,
      round: 1,
      phase: 'playerTurn',
      stats: { rounds: 0, totalDamage: 0, totalShield: 0, cardsDrawn: 0 },
    });
  }, []);

  const drawCards = useCallback((count: number) => {
    setState(prev => {
      let newDeck = [...prev.deck];
      let newHand = [...prev.hand];
      const toDraw = Math.min(count, newDeck.length);
      for (let i = 0; i < toDraw; i++) {
        const card = newDeck.shift();
        if (card) newHand.push(card);
      }
      while (newHand.length > 10) {
        newHand.pop();
      }
      return { ...prev, hand: newHand, deck: newDeck, stats: { ...prev.stats, cardsDrawn: prev.stats.cardsDrawn + toDraw } };
    });
  }, []);

  const addShield = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      playerShield: prev.playerShield + amount,
      stats: { ...prev.stats, totalShield: prev.stats.totalShield + amount },
    }));
  }, []);

  const takeDamage = useCallback((amount: number) => {
    setState(prev => {
      let remaining = amount;
      let shield = prev.playerShield;
      let hp = prev.playerHP;
      if (shield >= remaining) {
        shield -= remaining;
        remaining = 0;
      } else {
        remaining -= shield;
        shield = 0;
      }
      hp = Math.max(0, hp - remaining);
      const newPhase: Phase = hp <= 0 ? 'defeat' : prev.phase;
      return { ...prev, playerHP: hp, playerShield: shield, phase: newPhase };
    });
  }, []);

  const dealDamageToEnemy = useCallback((enemyIndex: number, amount: number) => {
    setState(prev => {
      const enemies = prev.enemies.map((e, i) => {
        if (i !== enemyIndex) return e;
        const newHp = Math.max(0, e.hp - amount);
        return { ...e, hp: newHp };
      });
      return { ...prev, enemies, stats: { ...prev.stats, totalDamage: prev.stats.totalDamage + amount } };
    });
  }, []);

  const removeEnemy = useCallback((enemyIndex: number) => {
    setState(prev => {
      const enemies = prev.enemies.filter((_, i) => i !== enemyIndex);
      const newPhase: Phase = enemies.length === 0 ? 'victory' : prev.phase;
      return { ...prev, enemies, phase: newPhase };
    });
  }, []);

  const playCard = useCallback((cardIndex: number, targetIndex: number) => {
    setState(prev => {
      if (cardIndex < 0 || cardIndex >= prev.hand.length) return prev;
      const card = prev.hand[cardIndex];
      if (!card) return prev;

      const newHand = prev.hand.filter((_, i) => i !== cardIndex);
      let newState = { ...prev, hand: newHand };

      if (card.type === 'attack') {
        if (targetIndex >= 0 && targetIndex < prev.enemies.length) {
          const enemies = prev.enemies.map((e, i) => {
            if (i !== targetIndex) return e;
            return { ...e, hp: Math.max(0, e.hp - card.value) };
          });
          newState = { ...newState, enemies, stats: { ...prev.stats, totalDamage: prev.stats.totalDamage + card.value } };
          if (enemies[targetIndex].hp <= 0) {
            const filtered = enemies.filter(e => e.hp > 0);
            if (filtered.length === 0) {
              newState = { ...newState, enemies: filtered, phase: 'victory' as Phase };
            } else {
              newState = { ...newState, enemies: filtered };
            }
          }
        }
      } else if (card.type === 'defense') {
        newState = { ...newState, playerShield: prev.playerShield + card.value, stats: { ...prev.stats, totalShield: prev.stats.totalShield + card.value } };
      } else if (card.type === 'skill') {
        let newDeck = [...prev.deck];
        let handAfterDraw = [...newHand];
        const toDraw = Math.min(card.value, newDeck.length);
        for (let i = 0; i < toDraw; i++) {
          const c = newDeck.shift();
          if (c) handAfterDraw.push(c);
        }
        while (handAfterDraw.length > 10) {
          handAfterDraw.pop();
        }
        newState = { ...newState, hand: handAfterDraw, deck: newDeck, stats: { ...prev.stats, cardsDrawn: prev.stats.cardsDrawn + toDraw } };
      }

      return newState;
    });
  }, []);

  const enemyAction = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'enemyTurn') return prev;
      let hp = prev.playerHP;
      let shield = prev.playerShield;
      const newEnemies = prev.enemies.map(e => {
        let enemy = { ...e };
        if (enemy.type === 'darkMage' && enemy.specialTimer !== undefined) {
          const newTimer = enemy.specialTimer - 1;
          if (newTimer <= 0) {
            enemy.specialTimer = 3;
            return enemy;
          }
          enemy.specialTimer = newTimer;
        }
        return enemy;
      });

      let totalDamage = 0;
      for (const enemy of newEnemies) {
        let dmg = enemy.attack;
        if (enemy.type === 'darkMage' && enemy.specialTimer === 3) {
          const darkMages = newEnemies.filter(e => e.type === 'darkMage');
          if (darkMages.length > 1) {
            dmg = Math.floor(enemy.attack * darkMages.length * 0.8);
          }
        }
        totalDamage += dmg;
      }

      let remaining = totalDamage;
      if (shield >= remaining) {
        shield -= remaining;
        remaining = 0;
      } else {
        remaining -= shield;
        shield = 0;
      }
      hp = Math.max(0, hp - remaining);
      const newPhase: Phase = hp <= 0 ? 'defeat' : prev.phase;

      return {
        ...prev,
        playerHP: hp,
        playerShield: shield,
        enemies: newEnemies,
        phase: newPhase,
        stats: { ...prev.stats, totalDamage: prev.stats.totalDamage + totalDamage },
      };
    });
  }, []);

  const setPhase = useCallback((phase: Phase) => {
    setState(prev => ({ ...prev, phase }));
  }, []);

  const endPlayerTurn = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playerTurn') return prev;
      return { ...prev, phase: 'enemyTurn' as Phase, playerShield: 0 };
    });

    setTimeout(() => {
      enemyAction();

      setTimeout(() => {
        setState(prev => {
          if (prev.phase === 'defeat') return prev;
          let newDeck = [...prev.deck];
          let newHand = [...prev.hand];
          const toDraw = Math.min(5, newDeck.length);
          for (let i = 0; i < toDraw; i++) {
            const c = newDeck.shift();
            if (c) newHand.push(c);
          }
          while (newHand.length > 10) {
            newHand.pop();
          }
          return {
            ...prev,
            phase: 'playerTurn' as Phase,
            round: prev.round + 1,
            hand: newHand,
            deck: newDeck,
            stats: { ...prev.stats, rounds: prev.stats.rounds + 1, cardsDrawn: prev.stats.cardsDrawn + toDraw },
          };
        });
      }, 600);
    }, 300);

    if (socketState.isMultiplayer && socketState.socket) {
      const action: BattleActionRequest = {
        playerId: socketState.currentPlayerId || '',
        roomId: socketState.roomId || undefined,
        action: { type: 'endTurn' },
      };
      socketState.socket.emit('battle:action', action);
    }
  }, [enemyAction, socketState]);

  const nextWave = useCallback(() => {
    setState(prev => {
      const enemies = generateRandomEnemies();
      return {
        ...prev,
        enemies,
        round: 1,
        phase: 'playerTurn' as Phase,
        playerShield: 0,
        stats: { rounds: 0, totalDamage: 0, totalShield: 0, cardsDrawn: 0 },
      };
    });
  }, []);

  const updateFromServer = useCallback((battleState: BattleState) => {
    setState(prev => ({
      ...prev,
      round: battleState.round,
      playerHP: battleState.playerHP,
      playerMaxHP: battleState.playerMaxHP,
      playerShield: battleState.playerShield,
      hand: battleState.hand,
      deck: battleState.deck,
      enemies: battleState.enemies,
      phase: battleState.phase,
      stats: battleState.stats,
    }));
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    const socket = io({ transports: ['websocket'] });
    const playerId = generateId();

    socket.on('connect', () => {
      socket.emit('room:join', { roomId, playerName });
    });

    socket.on('room:joined', (data: { roomId: string; players: string[] }) => {
      setSocketState(prev => ({
        ...prev,
        roomId: data.roomId,
        isMultiplayer: true,
        currentPlayerId: playerId,
      }));
    });

    socket.on('battle:state', (battleState: BattleState) => {
      updateFromServer(battleState);
    });

    setSocketState(prev => ({ ...prev, socket, roomId, currentPlayerId: playerId }));
  }, [updateFromServer]);

  const leaveRoom = useCallback(() => {
    if (socketState.socket) {
      socketState.socket.disconnect();
    }
    setSocketState({ roomId: null, socket: null, isMultiplayer: false, currentPlayerId: null });
  }, [socketState.socket]);

  const value = useMemo<GameContextValue>(() => ({
    ...state,
    ...socketState,
    startNewGame,
    playCard,
    endPlayerTurn,
    drawCards,
    addShield,
    takeDamage,
    dealDamageToEnemy,
    removeEnemy,
    enemyAction,
    setPhase,
    nextWave,
    updateFromServer,
    joinRoom,
    leaveRoom,
  }), [state, socketState, startNewGame, playCard, endPlayerTurn, drawCards, addShield, takeDamage, dealDamageToEnemy, removeEnemy, enemyAction, setPhase, nextWave, updateFromServer, joinRoom, leaveRoom]);

  return React.createElement(GameContext.Provider, { value }, children);
}

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return ctx;
}
