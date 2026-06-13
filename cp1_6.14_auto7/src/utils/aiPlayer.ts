import { PlayerState, BattleLog, AIDecision } from '@/types';
import { generateId } from './cardUtils';

export function makeAIDecision(aiState: PlayerState, playerState: PlayerState): AIDecision {
  const decisions: AIDecision = {
    cardsToPlay: [],
    attacks: [],
    endTurn: false,
  };

  let availableMana = aiState.mana;

  const playableCards = aiState.hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.cost <= availableMana)
    .sort((a, b) => b.card.cost - a.card.cost);

  for (const { card, index } of playableCards) {
    if (card.cost <= availableMana && aiState.field.length < 7) {
      decisions.cardsToPlay.push(index);
      availableMana -= card.cost;
    }
  }

  const attackers = aiState.field.filter((unit) => unit.canAttack);

  for (const attacker of attackers) {
    if (playerState.field.length > 0) {
      const weakestTarget = [...playerState.field].sort((a, b) => a.currentHealth - b.currentHealth)[0];
      if (weakestTarget) {
        decisions.attacks.push({
          attackerId: attacker.instanceId,
          targetId: weakestTarget.instanceId,
          targetType: 'minion',
        });
      }
    } else {
      decisions.attacks.push({
        attackerId: attacker.instanceId,
        targetId: 'player-hero',
        targetType: 'hero',
      });
    }
  }

  decisions.endTurn = true;

  return decisions;
}

export function createLog(type: BattleLog['type'], message: string): BattleLog {
  return {
    id: generateId(),
    timestamp: Date.now(),
    type,
    message,
  };
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const mins = date.getMinutes().toString().padStart(2, '0');
  const secs = date.getSeconds().toString().padStart(2, '0');
  return `${mins}:${secs}`;
}
