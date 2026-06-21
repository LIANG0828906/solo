import React, { useState, useEffect, useRef } from 'react';
import { Character, Item } from '../types';

interface StatusPanelProps {
  characters: Character[];
}

const StatusPanel: React.FC<StatusPanelProps> = ({ characters }) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const prevValuesRef = useRef<Map<string, { hunger: number; health: number; equipment: number }>>(new Map());

  useEffect(() => {
    characters.forEach(char => {
      const prev = prevValuesRef.current.get(char.id);
      if (prev) {
        setTimeout(() => {
          prevValuesRef.current.set(char.id, {
            hunger: char.hunger,
            health: char.health,
            equipment: char.equipment,
          });
        }, 300);
      } else {
        prevValuesRef.current.set(char.id, {
          hunger: char.hunger,
          health: char.health,
          equipment: char.equipment,
        });
      }
    });
  }, [characters]);

  const getValueChangeClass = (charId: string, currentValue: number, type: 'hunger' | 'health' | 'equipment') => {
    const prev = prevValuesRef.current.get(charId);
    if (!prev) return '';
    const prevValue = prev[type];
    if (currentValue > prevValue) return 'value-increase';
    if (currentValue < prevValue) return 'value-decrease';
    return '';
  };

  const getEquipmentStatus = (equipment: number): 'normal' | 'warning' | 'broken' => {
    if (equipment <= 10) return 'broken';
    if (equipment <= 30) return 'warning';
    return 'normal';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="status-panel">
      <h2 className="panel-title">团队状态</h2>
      <div className="character-list">
        {characters.map(char => {
          const equipStatus = getEquipmentStatus(char.equipment);
          return (
            <div
              key={char.id}
              className={`character-card ${char.isDead ? 'dead' : ''}`}
              onClick={() => !char.isDead && setSelectedCharacter(char)}
            >
              <div className="character-avatar-wrapper">
                <div className={`character-avatar ${char.isDead ? 'dead-avatar' : ''}`}>
                  {char.avatar}
                </div>
                {char.isDead && <div className="death-mark">✕</div>}
                {char.griefTurns > 0 && !char.isDead && (
                  <div className="grief-indicator" title={`悲痛中：剩余${char.griefTurns}回合`}>
                    💔
                  </div>
                )}
              </div>
              <div className="character-info">
                <div className="character-name">{char.name}</div>

                <div className="stat-row">
                  <span className="stat-label">饥饿</span>
                  <div className="progress-bar hunger-bar">
                    <div
                      className={`progress-fill ${getValueChangeClass(char.id, char.hunger, 'hunger')}`}
                      style={{ width: `${char.hunger}%` }}
                    />
                  </div>
                  <span className="stat-value">{Math.round(char.hunger)}</span>
                </div>

                <div className="stat-row">
                  <span className="stat-label">健康</span>
                  <div className="progress-bar health-bar">
                    <div
                      className={`progress-fill ${getValueChangeClass(char.id, char.health, 'health')}`}
                      style={{ width: `${char.health}%` }}
                    />
                  </div>
                  <span className="stat-value">{Math.round(char.health)}</span>
                </div>

                <div className="stat-row">
                  <span className="stat-label">装备</span>
                  <div className="progress-bar equipment-bar">
                    <div
                      className={`progress-fill ${equipStatus === 'warning' ? 'crackle-warning' : ''} ${equipStatus === 'broken' ? 'crackle-broken' : ''} ${getValueChangeClass(char.id, char.equipment, 'equipment')}`}
                      style={{ width: `${char.equipment}%` }}
                    />
                  </div>
                  <span className="stat-value">{Math.round(char.equipment)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedCharacter && (
        <div className="modal-overlay" onClick={() => setSelectedCharacter(null)}>
          <div className="character-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-avatar">{selectedCharacter.avatar}</div>
              <h3>{selectedCharacter.name}</h3>
              <button className="close-btn" onClick={() => setSelectedCharacter(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <h4>携带物品</h4>
              <div className="item-list">
                {selectedCharacter.items.map((item: Item) => (
                  <div key={item.id} className="item-card">
                    <span className="item-icon">{item.icon}</span>
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">×{item.quantity}</span>
                  </div>
                ))}
              </div>
              {selectedCharacter.griefTurns > 0 && (
                <div className="grief-info">
                  💔 悲痛状态：剩余 {selectedCharacter.griefTurns} 回合
                </div>
              )}
              {getEquipmentStatus(selectedCharacter.equipment) === 'broken' && (
                <div className="equipment-warning broken">
                  ⚠️ 装备已损坏！攻击力/防御力减半
                </div>
              )}
              {getEquipmentStatus(selectedCharacter.equipment) === 'warning' && (
                <div className="equipment-warning warning">
                  ⚠️ 装备耐久不足！
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .status-panel {
          width: 30%;
          background-color: #2c1e16;
          border: 2px solid #5d4037;
          border-radius: 6px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-title {
          font-size: 20px;
          color: #ffb300;
          margin-bottom: 16px;
          text-align: center;
          border-bottom: 1px solid #5d4037;
          padding-bottom: 8px;
        }

        .character-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          flex: 1;
        }

        .character-card {
          display: flex;
          gap: 12px;
          padding: 12px;
          background-color: rgba(93, 64, 55, 0.3);
          border: 1px solid #5d4037;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .character-card:hover:not(.dead) {
          background-color: rgba(93, 64, 55, 0.5);
          border-color: #ffb300;
        }

        .character-card.dead {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .character-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .character-avatar {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          background-color: #5d4037;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          border: 2px solid #7b5b4e;
        }

        .character-avatar.dead-avatar {
          filter: grayscale(100%);
          background-color: #666;
          border-color: #444;
        }

        .death-mark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 48px;
          color: #e74c3c;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        }

        .grief-indicator {
          position: absolute;
          top: -8px;
          right: -8px;
          font-size: 20px;
        }

        .character-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .character-name {
          font-size: 14px;
          font-weight: bold;
          color: #f5deb3;
          margin-bottom: 4px;
        }

        .stat-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stat-label {
          font-size: 11px;
          color: #a89078;
          width: 30px;
          flex-shrink: 0;
        }

        .progress-bar {
          flex: 1;
          height: 12px;
          background-color: #1a1a1a;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #3e2723;
        }

        .progress-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.3s ease, background-color 0.3s ease;
        }

        .hunger-bar .progress-fill {
          background-color: #e74c3c;
        }

        .health-bar .progress-fill {
          background-color: #27ae60;
        }

        .equipment-bar .progress-fill {
          background-color: #2980b9;
        }

        .crackle-warning {
          animation: crackle 0.5s infinite;
        }

        .crackle-broken {
          animation: crackle 0.3s infinite;
          background-color: #7f8c8d !important;
        }

        .value-increase {
          animation: valueGlowGreen 0.3s ease;
        }

        .value-decrease {
          animation: valueGlowRed 0.3s ease;
        }

        @keyframes valueGlowGreen {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.5) drop-shadow(0 0 4px #27ae60); }
        }

        @keyframes valueGlowRed {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.5) drop-shadow(0 0 4px #e74c3c); }
        }

        .stat-value {
          font-size: 12px;
          color: #f5deb3;
          width: 28px;
          text-align: right;
          flex-shrink: 0;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .character-detail-modal {
          background-color: #2c1e16;
          border: 2px solid #5d4037;
          border-radius: 8px;
          width: 360px;
          max-width: 90vw;
          animation: bounce-in 0.3s ease;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background-color: #3e2723;
          border-bottom: 2px solid #5d4037;
          position: relative;
        }

        .detail-avatar {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          background-color: #5d4037;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          border: 2px solid #7b5b4e;
        }

        .modal-header h3 {
          flex: 1;
          color: #ffb300;
          font-size: 18px;
        }

        .close-btn {
          background: none;
          border: none;
          color: #f5deb3;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .close-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .modal-body {
          padding: 16px;
        }

        .modal-body h4 {
          color: #ffb300;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .item-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .item-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background-color: rgba(93, 64, 55, 0.3);
          border: 1px solid #5d4037;
          border-radius: 6px;
        }

        .item-icon {
          font-size: 24px;
        }

        .item-name {
          flex: 1;
          color: #f5deb3;
          font-size: 14px;
        }

        .item-quantity {
          color: #ffb300;
          font-size: 14px;
          font-weight: bold;
        }

        .grief-info {
          margin-top: 12px;
          padding: 10px;
          background-color: rgba(231, 76, 60, 0.2);
          border: 1px solid #e74c3c;
          border-radius: 6px;
          color: #e74c3c;
          font-size: 13px;
        }

        .equipment-warning {
          margin-top: 12px;
          padding: 10px;
          border-radius: 6px;
          font-size: 13px;
        }

        .equipment-warning.warning {
          background-color: rgba(255, 179, 0, 0.2);
          border: 1px solid #ffb300;
          color: #ffb300;
        }

        .equipment-warning.broken {
          background-color: rgba(231, 76, 60, 0.2);
          border: 1px solid #e74c3c;
          color: #e74c3c;
        }
      `}</style>
    </div>
  );
};

export default StatusPanel;
