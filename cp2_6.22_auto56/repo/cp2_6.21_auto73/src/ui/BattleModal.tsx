import { useState, useEffect } from 'react';
import type { BattleResult } from '../game/types';
import './BattleModal.css';

interface BattleModalProps {
  result: BattleResult | null;
  show: boolean;
  onClose?: () => void;
  player1Name: string;
  player2Name: string;
  attackerId: string;
}

export function BattleModal({
  result,
  show,
  onClose,
  player1Name,
  player2Name,
  attackerId,
}: BattleModalProps) {
  const [phase, setPhase] = useState<'rolling' | 'result'>('rolling');
  const [displayRoll1, setDisplayRoll1] = useState(1);
  const [displayRoll2, setDisplayRoll2] = useState(1);

  useEffect(() => {
    if (show) {
      setPhase('rolling');

      const rollInterval = setInterval(() => {
        setDisplayRoll1(Math.floor(Math.random() * 6) + 1);
        setDisplayRoll2(Math.floor(Math.random() * 6) + 1);
      }, 80);

      const rollTimeout = setTimeout(() => {
        clearInterval(rollInterval);
        if (result) {
          setDisplayRoll1(result.attackerRoll);
          setDisplayRoll2(result.defenderRoll);
        }
        setPhase('result');

        if (onClose) {
          setTimeout(onClose, 1500);
        }
      }, 1500);

      return () => {
        clearInterval(rollInterval);
        clearTimeout(rollTimeout);
      };
    }
  }, [show, result, onClose]);

  if (!show) return null;

  const attackerName = attackerId === 'player1' ? player1Name : player2Name;
  const defenderName = attackerId === 'player1' ? player2Name : player1Name;
  const winnerName = result?.winnerId === 'player1' ? player1Name : player2Name;

  const getDiceFace = (num: number): string => {
    const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return faces[num - 1] || '⚀';
  };

  return (
    <div className="battle-modal-overlay">
      <div className="battle-modal">
        <h2 className="battle-title">⚔️ 对战!</h2>

        <div className="battle-players">
          <div className="battle-player attacker">
            <div className="battle-player-label">攻方</div>
            <div className="battle-player-name">{attackerName}</div>
            <div className={`dice dice-3d ${phase === 'rolling' ? 'dice-rolling' : ''}`}>
              <span className="dice-face">{getDiceFace(displayRoll1)}</span>
            </div>
            <div className="dice-number">{displayRoll1}</div>
          </div>

          <div className="battle-vs">VS</div>

          <div className="battle-player defender">
            <div className="battle-player-label">守方</div>
            <div className="battle-player-name">{defenderName}</div>
            <div className={`dice dice-3d ${phase === 'rolling' ? 'dice-rolling' : ''}`} style={{ animationDelay: '0.1s' }}>
              <span className="dice-face">{getDiceFace(displayRoll2)}</span>
            </div>
            <div className="dice-number">{displayRoll2}</div>
          </div>
        </div>

        {phase === 'result' && result && (
          <div className="battle-result">
            <div className="winner-announce">
              <span className="winner-name">{winnerName}</span>
              <span className="winner-text"> 获胜!</span>
            </div>
            <div className="battle-detail">
              {result.attackerRoll > result.defenderRoll
                ? '攻方成功占领格子'
                : '守方成功防守，攻方棋子退回基地'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
