import React, { useState, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { Ship, Berth } from '../../types';
import './BerthPanel.css';

interface ShipCardProps {
  ship: Ship;
  isDragging?: boolean;
}

const ShipCard: React.FC<ShipCardProps> = ({ ship, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ship.id,
    data: { ship },
    disabled: ship.status !== 'approaching',
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const draftLevel = ship.draft > 12 ? '深吃水' : ship.draft > 9 ? '中吃水' : '浅吃水';
  const draftColor = ship.draft > 12 ? '#e74c3c' : ship.draft > 9 ? '#f39c12' : '#2ecc71';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`ship-card ${ship.status} ${isDragging ? 'dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <div className="ship-icon">
        <svg width="60" height="30" viewBox="0 0 60 30">
          <path d="M5,15 Q30,5 55,15 L50,25 L10,25 Z" fill="#3498db" />
          <rect x="20" y="8" width="20" height="10" fill="#2980b9" />
          <rect x="35" y="12" width="8" height="6" fill="#1abc9c" />
        </svg>
      </div>
      <div className="ship-info">
        <div className="ship-name">{ship.name}</div>
        <div className="ship-details">
          <span className="ship-containers">📦 {ship.containerCount}箱</span>
          <span className="ship-draft" style={{ color: draftColor }}>
            🌊 {ship.draft.toFixed(1)}m ({draftLevel})
          </span>
        </div>
      </div>
      {ship.status === 'approaching' && (
        <div className="splash-particles">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`splash splash-${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
};

interface BerthSlotProps {
  berth: Berth;
  ship?: Ship;
  onDrop: (shipId: string, berthId: string) => boolean;
}

const BerthSlot: React.FC<BerthSlotProps> = ({ berth, ship, onDrop }) => {
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: berth.id,
    data: { berth },
  });

  const handleDrop = useCallback(
    (shipId: string) => {
      const success = onDrop(shipId, berth.id);
      if (success) {
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 1500);
      } else {
        setIsError(true);
        setTimeout(() => setIsError(false), 1000);
      }
    },
    [berth.id, onDrop]
  );

  const berthColors = {
    deep: { bg: '#1a5276', border: '#2980b9', label: '深水泊位' },
    shallow: { bg: '#5dade2', border: '#85c1e9', label: '浅水泊位' },
    maintenance: { bg: '#7f8c8d', border: '#95a5a6', label: '维修泊位' },
  };

  const colors = berthColors[berth.type];

  return (
    <div
      ref={setNodeRef}
      className={`berth-slot ${berth.type} ${isOver ? 'drag-over' : ''} ${isError ? 'error' : ''} ${isSuccess ? 'success' : ''}`}
      style={{
        left: berth.position.x,
        top: berth.position.y,
        width: berth.position.width,
        height: berth.position.height,
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
      data-berth-id={berth.id}
      onDrop={(e) => {
        e.preventDefault();
        const shipId = e.dataTransfer.getData('shipId');
        if (shipId) {
          handleDrop(shipId);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="berth-label">
        <span className="berth-name">{berth.name}</span>
        <span className="berth-type">{colors.label}</span>
        <span className="berth-depth">水深 {berth.depth}m</span>
      </div>

      {ship && (
        <div className="docked-ship">
          <svg width="140" height="50" viewBox="0 0 140 50">
            <path d="M10,25 Q70,10 130,25 L120,45 L20,45 Z" fill="#3498db" />
            <rect x="50" y="12" width="45" height="18" fill="#2980b9" />
            <rect x="95" y="20" width="20" height="12" fill="#1abc9c" />
            <text x="70" y="25" textAnchor="middle" fill="white" fontSize="10">
              {ship.name}
            </text>
          </svg>
          <div className="ship-progress">
            <div
              className="progress-bar"
              style={{ width: `${(ship.loadedContainers / ship.containerCount) * 100}%` }}
            />
            <span className="progress-text">
              {ship.loadedContainers}/{ship.containerCount}
            </span>
          </div>
        </div>
      )}

      {!ship && (
        <div className="berth-empty-hint">
          {berth.type === 'maintenance' ? '维修中' : '拖拽船舶到此处'}
        </div>
      )}

      {isSuccess && <div className="success-checkmark">✓</div>}

      {isError && (
        <div className="error-tooltip">
          ⚠ 无法停靠：水深不足或泊位类型不匹配
        </div>
      )}
    </div>
  );
};

interface BerthPanelProps {
  className?: string;
}

export const BerthPanel: React.FC<BerthPanelProps> = ({ className }) => {
  const { ships, berthes, assignShipToBerth } = useSimulationStore();

  const approachingShips = ships.filter((s) => s.status === 'approaching');
  const dockedShips = ships.filter((s) => s.status === 'docked' || s.status === 'loading');

  const handleDrop = useCallback(
    (shipId: string, berthId: string) => {
      return assignShipToBerth(shipId, berthId);
    },
    [assignShipToBerth]
  );

  return (
    <div className={`berth-panel ${className || ''}`}>
      <div className="approaching-ships">
        <h3>🚢 到港船舶</h3>
        <div className="ship-list">
          {approachingShips.length === 0 ? (
            <div className="empty-hint">暂无到港船舶</div>
          ) : (
            approachingShips.map((ship) => <ShipCard key={ship.id} ship={ship} />)
          )}
        </div>
      </div>

      <div className="berth-area">
        <div className="sea-area">
          <div className="waves">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`wave wave-${i + 1}`} />
            ))}
          </div>
        </div>

        <div className="berth-container">
          {berthes.map((berth) => {
            const dockedShip = dockedShips.find((s) => s.berthId === berth.id);
            return (
              <BerthSlot
                key={berth.id}
                berth={berth}
                ship={dockedShip}
                onDrop={handleDrop}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BerthPanel;
