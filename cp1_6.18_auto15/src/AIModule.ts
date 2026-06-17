import { useGameState } from './GameState';
import { BOARD_SIZE, type Piece, type PlayerId } from './entities';

interface AIAction {
  type: 'attack';
  attackerId: string;
  targetId: string;
}

const getChebyshevDistance = (
  ax: number,
  ay: number,
  bx: number,
  by: number
): number => Math.max(Math.abs(ax - bx), Math.abs(ay - by));

const findAllPieces = (player: PlayerId): Piece[] => {
  const state = useGameState.getState();
  const pieces: Piece[] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const p = state.board[y][x].piece;
      if (p && p.player === player) pieces.push(p);
    }
  }
  return pieces;
};

const findAttackableTargets = (
  attacker: Piece,
  enemyPlayer: PlayerId
): Piece[] => {
  const state = useGameState.getState();
  const targets: Piece[] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const p = state.board[y][x].piece;
      if (
        p &&
        p.player === enemyPlayer &&
        getChebyshevDistance(
          attacker.position.x,
          attacker.position.y,
          x,
          y
        ) <= attacker.range
      ) {
        targets.push(p);
      }
    }
  }
  return targets;
};

export const AIModule = {
  getBestAction(aiPlayer: PlayerId): AIAction | null {
    const enemyPlayer: PlayerId = aiPlayer === 1 ? 2 : 1;
    const aiPieces = findAllPieces(aiPlayer);

    if (aiPieces.length === 0) return null;

    type AttackOption = {
      attacker: Piece;
      target: Piece;
      canKill: boolean;
      targetHp: number;
    };

    const attackOptions: AttackOption[] = [];

    for (const attacker of aiPieces) {
      const targets = findAttackableTargets(attacker, enemyPlayer);
      for (const target of targets) {
        attackOptions.push({
          attacker,
          target,
          canKill: target.hp <= attacker.attack,
          targetHp: target.hp,
        });
      }
    }

    if (attackOptions.length > 0) {
      attackOptions.sort((a, b) => {
        if (a.canKill !== b.canKill) return a.canKill ? -1 : 1;
        return a.targetHp - b.targetHp;
      });

      const best = attackOptions[0];
      return {
        type: 'attack',
        attackerId: best.attacker.id,
        targetId: best.target.id,
      };
    }

    const allPieces = aiPieces.flatMap((attacker) => {
      const state = useGameState.getState();
      const allTargets: { attacker: Piece; target: Piece; dist: number }[] = [];
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          const p = state.board[y][x].piece;
          if (p && p.player === enemyPlayer) {
            allTargets.push({
              attacker,
              target: p,
              dist: getChebyshevDistance(
                attacker.position.x,
                attacker.position.y,
                x,
                y
              ),
            });
          }
        }
      }
      return allTargets;
    });

    if (allPieces.length > 0) {
      allPieces.sort((a, b) => a.dist - b.dist);
      const closest = allPieces[0];
      const targets = findAttackableTargets(closest.attacker, enemyPlayer);
      if (targets.length > 0) {
        const lowestHpTarget = targets.reduce((a, b) =>
          a.hp < b.hp ? a : b
        );
        return {
          type: 'attack',
          attackerId: closest.attacker.id,
          targetId: lowestHpTarget.id,
        };
      }
    }

    return null;
  },
};
