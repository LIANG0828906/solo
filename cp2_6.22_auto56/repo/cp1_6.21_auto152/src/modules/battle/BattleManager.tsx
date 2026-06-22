import React, { useCallback, useEffect } from 'react';
import axios from 'axios';
import { useGameContext } from '@/context/GameContext';
import type { BattleActionRequest, BattleActionResponse, Card, Enemy } from '@/types/game';

function validateCardPlay(card: Card, enemies: Enemy[], targetIndex: number): boolean {
  if (card.type === 'attack') {
    return targetIndex >= 0 && targetIndex < enemies.length && enemies[targetIndex].hp > 0;
  }
  return true;
}

function applyCardEffect(
  card: Card,
  targetIndex: number,
  playCard: (cardIndex: number, targetIndex: number) => void,
  addShield: (amount: number) => void,
  drawCards: (count: number) => void,
  dealDamageToEnemy: (enemyIndex: number, amount: number) => void,
): void {
  if (card.type === 'attack') {
    dealDamageToEnemy(targetIndex, card.value);
  } else if (card.type === 'defense') {
    addShield(card.value);
  } else if (card.type === 'skill') {
    drawCards(card.value);
  }
  playCard(-1, targetIndex);
}

export function BattleManager({ children }: { children: React.ReactNode }) {
  const {
    hand,
    enemies,
    phase,
    round,
    playCard,
    addShield,
    drawCards,
    dealDamageToEnemy,
    removeEnemy,
    enemyAction,
    endPlayerTurn,
    setPhase,
    socket,
    isMultiplayer,
    roomId,
    currentPlayerId,
  } = useGameContext();

  const sendActionToServer = useCallback(async (
    cardIndex: number,
    targetIndex: number,
  ) => {
    try {
      const req: BattleActionRequest = {
        playerId: currentPlayerId || '',
        roomId: roomId || undefined,
        action: { type: 'playCard', cardIndex, targetEnemyIndex: targetIndex },
      };
      const res = await axios.post<BattleActionResponse>('/api/battle/action', req);
      if (res.data.success) {
        // state will be synced via socket or updateFromServer
      }
    } catch {
      // fallback to local processing
    }
  }, [currentPlayerId, roomId]);

  const emitSocketAction = useCallback((cardIndex: number, targetIndex: number) => {
    if (isMultiplayer && socket) {
      socket.emit('battle:action', {
        playerId: currentPlayerId,
        roomId,
        action: { type: 'playCard', cardIndex, targetEnemyIndex: targetIndex },
      });
    }
  }, [isMultiplayer, socket, currentPlayerId, roomId]);

  const handlePlayCard = useCallback((cardIndex: number, targetIndex: number) => {
    if (phase !== 'playerTurn') return;

    const card = hand[cardIndex];
    if (!card) return;

    if (!validateCardPlay(card, enemies, targetIndex)) return;

    applyCardEffect(card, targetIndex, playCard, addShield, drawCards, dealDamageToEnemy);
    playCard(cardIndex, targetIndex);

    if (isMultiplayer) {
      sendActionToServer(cardIndex, targetIndex);
      emitSocketAction(cardIndex, targetIndex);
    }

    checkWinLose();
  }, [phase, hand, enemies, playCard, addShield, drawCards, dealDamageToEnemy, isMultiplayer, sendActionToServer, emitSocketAction]);

  const handleEndTurn = useCallback(() => {
    if (phase !== 'playerTurn') return;
    endPlayerTurn();
  }, [phase, endPlayerTurn]);

  const checkWinLose = useCallback(() => {
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) {
      setPhase('victory');
    }
  }, [enemies, setPhase]);

  useEffect(() => {
    if (phase === 'enemyTurn') {
      const timer = setTimeout(() => {
        enemyAction();
        setTimeout(() => {
          checkWinLose();
        }, 200);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, enemyAction, checkWinLose]);

  useEffect(() => {
    if (phase === 'defeat' || phase === 'victory') {
      const result = phase === 'victory';
      axios.post('/api/battle/result', { victory: result, round }).catch(() => {});
    }
  }, [phase, round]);

  return React.createElement(React.Fragment, null, children);
}
