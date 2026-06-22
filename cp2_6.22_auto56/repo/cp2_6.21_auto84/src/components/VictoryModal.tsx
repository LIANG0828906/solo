import React from 'react';
import type { Faction } from '../types';
import { getFactionName } from '../battle/BattleSystem';

interface VictoryModalProps {
  winner: Faction | null;
  onRestart: () => void;
}

const VictoryModal: React.FC<VictoryModalProps> = ({ winner, onRestart }) => {
  if (!winner) return null;

  return (
    <div className="victory-overlay">
      <div className="victory-modal">
      <h2 className="victory-title">
        {getFactionName(winner)}胜利！
      </h2>
      <p className="victory-subtitle">战斗结束，{getFactionName(winner)}取得了最终的胜利</p>
      <button className="restart-button" onClick={onRestart}>
        再来一局
      </button>
    </div>
    </div>
  );
};

export default VictoryModal;
