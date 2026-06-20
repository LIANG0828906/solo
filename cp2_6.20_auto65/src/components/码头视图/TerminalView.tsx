import React, { useCallback, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { Ship, Berth, YardColumn, Crane, Container } from '../../types';
import './TerminalView.css';

interface ShipCardProps {
  ship: Ship;
}

const ShipCard: React.FC<ShipCardProps> = ({ ship }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ship.id,
    data: { ship },
    disabled: ship.status !== 'approaching',
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
      }
    : undefined;

  const draftColor = ship.draft > 12 ? '#e74c3c' : ship.draft > 9 ? '#f39c12' : '#2ecc71';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`ship-card ${ship.status}`}
      {...listeners}
      {...attributes}
    >
      <svg width="70" height="35" viewBox="0 0 70 35">
      <path d="M5,17.5 Q35,6 65,17.5 L58,30 L12,30 Z" fill="#3498db" stroke="#2980b9" strokeWidth="1" />
      <rect x="25" y="10" width="25" height="12" fill="#1a5276" rx="1" />
      <rect x="48" y="14" width="10" height="7" fill="#1abc9c" rx="1" />
      <text x="37" y="18" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">
        {ship.name.substring(0, 3)}
      </text>
    </svg>
    <div className="ship-info-mini">
      <div className="ship-name-mini">{ship.name}</div>
      <div className="ship-meta">
        <span>📦 {ship.containerCount}</span>
        <span style={{ color: draftColor }}>🌊 {ship.draft.toFixed(1)}m</span>
      </div>
    </div>
    {ship.status === 'approaching' && (
      <div className="ship-splash">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`splash-drop drop-${i + 1}`} />
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
    deep: { bg: 'rgba(26, 82, 118, 0.7)', border: '#2980b9', label: '深水' },
    shallow: { bg: 'rgba(93, 173, 226, 0.6)', border: '#85c1e9', label: '浅水' },
    maintenance: { bg: 'rgba(127, 140, 141, 0.7)', border: '#95a5a6', label: '维修' },
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
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const shipId = e.dataTransfer.getData('shipId');
        if (shipId) {
          handleDrop(shipId);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      <div className="berth-info">
        <span className="berth-name">{berth.name}</span>
        <span className="berth-badge">{colors.label}</span>
        <span className="berth-depth">{berth.depth}m</span>
      </div>

      {ship && (
        <div className="docked-ship-display">
          <svg width="150" height="55" viewBox="0 0 150 55">
            <path d="M8,27.5 Q75,10 142,27.5 L130,48 L20,48 Z" fill="#3498db" stroke="#2980b9" strokeWidth="1.5" />
            <rect x="55" y="13" width="50" height="20" fill="#1a5276" rx="2" />
            <rect x="105" y="22" width="22" height="14" fill="#1abc9c" rx="1" />
            <text x="80" y="26" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
              {ship.name}
            </text>
          </svg>
          <div className="ship-progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(ship.loadedContainers / ship.containerCount) * 100}%` }}
            />
            <span className="progress-label">
              {ship.loadedContainers}/{ship.containerCount}
            </span>
          </div>
        </div>
      )}

      {!ship && (
        <div className="berth-hint">
          {berth.type === 'maintenance' ? '🔧 维修中' : '⬅ 拖船到此处'}
        </div>
      )}

      {isSuccess && <div className="success-icon">✓</div>}
      {isError && <div className="error-hint">⚠ 无法停靠</div>}
    </div>
  );
};

interface YardColumnViewProps {
  column: YardColumn;
  isSelected: boolean;
  onClick: () => void;
}

const YardColumnView: React.FC<YardColumnViewProps> = ({ column, isSelected, onClick }) => {
  const [showPopup, setShowPopup] = useState(false);

  const containers = column.containers.filter((c): c is Container => c !== null).reverse();
  const count = containers.length;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    setShowPopup(!showPopup);
  };

  return (
    <div
      className={`yard-col ${isSelected ? 'selected' : ''}`}
      style={{
        left: column.position.x - 380,
        top: column.position.y,
        width: column.position.width,
      }}
      onClick={handleClick}
    >
      <div className="col-header">
        <span>{column.id.split('-').pop()}列</span>
        <span className="col-count">{count}/{column.maxHeight}</span>
      </div>
      <div className="col-stack">
        {[...Array(column.maxHeight)].map((_, idx) => {
        const container = column.containers[column.maxHeight - 1 - idx];
        return (
          <div key={idx} className={`container-slot ${container ? 'has-container' : 'empty'}`}>
            {container && (
              <div
                className="container-box"
                style={{ backgroundColor: container.color }}
                title={`目的港: ${container.destination}`}
              >
                {container.destination.substring(0, 2)}
              </div>
            )}
          </div>
        );
      })}
      </div>

      {showPopup && (
        <div className="container-popup">
          <div className="popup-title">列详情</div>
          {containers.length === 0 ? (
            <div className="popup-empty">空列</div>
          ) : (
            <div className="popup-list">
              {containers.map((c, i) => (
              <div key={c.id} className="popup-item">
                <div className="popup-color" style={{ backgroundColor: c.color }} />
                <div className="popup-info">
                  <div className="popup-dest">{c.destination}</div>
                  <div className="popup-meta">
                    <span>{c.size}</span>
                    <span>{(c.weight / 1000).toFixed(1)}t</span>
                  </div>
                  <div className="popup-owner">{c.owner}</div>
                </div>
                <div className="popup-level">第{containers.length - i}层</div>
              </div>
            ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface CraneViewProps {
  crane: Crane;
  isSelected: boolean;
  onClick: () => void;
}

const CraneView: React.FC<CraneViewProps> = ({ crane, isSelected, onClick }) => {
  return (
    <div
      className={`crane-view ${isSelected ? 'selected' : ''} ${crane.status}`}
      style={{
        left: crane.position.x - 25,
        top: crane.position.y - 45,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="crane-body">
        <div className="crane-legs">
          <div className="crane-leg left" />
          <div className="crane-leg right" />
        </div>
        <div className="crane-girder" />
        <div className="crane-trolley">
          <div className={`spreader ${crane.status === 'grabbing' ? 'grabbing' : ''}`}>
            {crane.carriedContainer && (
              <div
                className="carried-box"
                style={{ backgroundColor: crane.carriedContainer.color }}
              >
                {crane.carriedContainer.destination.substring(0, 2)}
              </div>
            )}
            {crane.status === 'grabbing' && <div className="glow-effect" />}
          </div>
        </div>
        <div className="crane-machine" />
      </div>
      <div className="crane-tag">
        {crane.id.replace('crane-', '')}号
        <span className={`status-light ${crane.status}`} />
      </div>
    </div>
  );
};

interface TerminalViewProps {
  className?: string;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ className }) => {
  const {
    ships,
    berthes,
    yardColumns,
    cranes,
    assignShipToBerth,
    selectedColumnId,
    selectContainer,
    selectedCraneId,
    selectCrane,
    moveCraneToColumn,
    grabContainer,
    placeContainerOnShip,
    stats,
    suggestion,
  } = useSimulationStore();

  const approachingShips = ships.filter(s => s.status === 'approaching');
  const dockedShips = ships.filter(s => s.status === 'docked' || s.status === 'loading');

  const handleDrop = (shipId: string, berthId: string) => {
    return assignShipToBerth(shipId, berthId);
  };

  const handleColumnClick = (columnId: string) => {
    if (selectedColumnId === columnId) {
      selectContainer(undefined, undefined);
    } else {
      const column = yardColumns.find(yc => yc.id === columnId);
      const topContainer = column?.containers.find(c => c !== null);
      selectContainer(topContainer?.id, columnId);
      
      if (selectedCraneId) {
        moveCraneToColumn(selectedCraneId, columnId);
        setTimeout(() => {
          const state = useSimulationStore.getState();
          const crane = state.cranes.find(c => c.id === selectedCraneId);
          if (crane && crane.status === 'idle') {
            grabContainer(selectedCraneId, columnId);
          }
        }, 1000);
      }
    }
  };

  const handleCraneClick = (craneId: string) => {
    if (selectedCraneId === craneId) {
      selectCrane(undefined);
    } else {
      selectCrane(craneId);
    }
  };

  const handleShipClick = (shipId: string) => {
    if (selectedCraneId) {
      const state = useSimulationStore.getState();
      const crane = state.cranes.find(c => c.id === selectedCraneId);
      if (crane && crane.carriedContainer) {
        placeContainerOnShip(selectedCraneId, shipId);
      }
    }
  };

  const selectedCrane = cranes.find(c => c.id === selectedCraneId);

  return (
    <div className={`terminal-view-container ${className || ''}`}>
      <div className="ship-approaching">
      <div className="section-title">
        <span>🚢 到港船舶</span>
      </div>
      <div className="ship-waiting-area">
        {approachingShips.length === 0 ? (
          <div className="no-ships">暂无到港船舶</div>
        ) : (
          approachingShips.map(ship => (
            <ShipCard key={ship.id} ship={ship} />
          ))
        )}
      </div>
    </div>

    <div className="terminal-main">
      <div className="sea-section">
        <div className="waves-animation">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`wave-line wave-${i + 1}`} />
          ))}
        </div>
        <div className="sea-label">🌊 海域</div>
      </div>

      <div className="berths-section">
        {berthes.map(berth => {
          const dockedShip = dockedShips.find(s => s.berthId === berth.id);
          return (
            <BerthSlot
              key={berth.id}
              berth={berth}
              ship={dockedShip}
              onDrop={handleDrop}
            />
          );
        })}
        <div className="berth-divider" />
      </div>

      <div className="yard-section">
        <div className="yard-title">
          <span>📦 堆场</span>
        </div>
        {yardColumns.map(column => (
          <YardColumnView
            key={column.id}
            column={column}
            isSelected={selectedColumnId === column.id}
            onClick={() => handleColumnClick(column.id)}
          />
        ))}
        <div className="yard-grid-bg" />
      </div>

      <div className="cranes-layer">
        {cranes.map(crane => (
          <CraneView
            key={crane.id}
            crane={crane}
            isSelected={selectedCraneId === crane.id}
            onClick={() => handleCraneClick(crane.id)}
          />
        ))}
      </div>

      {dockedShips.map(ship => (
        <div
          key={ship.id}
          className={`ship-click-area ${selectedCrane?.carriedContainer ? 'can-place' : ''}`}
          style={{
            left: ship.position.x,
            top: ship.position.y,
          }}
          onClick={() => handleShipClick(ship.id)}
        >
          {selectedCrane?.carriedContainer && (
          <div className="place-hint">点击放置</div>
        )}
        </div>
      ))}
    </div>

    {selectedCrane && (
      <div className="crane-control-panel">
        <div className="panel-head">
          🎯 岸桥控制 - {selectedCrane.id.replace('crane-', '')}号
        </div>
        <div className="panel-body">
          <div className="status-row">
            <span>状态:</span>
            <span className={`status-badge ${selectedCrane.status}`}>
              {getStatusLabel(selectedCrane.status)}
            </span>
          </div>
          {selectedCrane.carriedContainer && (
            <div className="carried-display">
              <div className="carried-title">吊运中:</div>
              <div
                className="carried-container-display"
                style={{ backgroundColor: selectedCrane.carriedContainer.color }}
              >
                {selectedCrane.carriedContainer.destination}
              </div>
              <div className="carried-detail">
                {selectedCrane.carriedContainer.size} · 
                {(selectedCrane.carriedContainer.weight / 1000).toFixed(1)}吨
              </div>
            </div>
          )}
          <div className="hint-text">
            {!selectedCrane.carriedContainer
              ? '💡 点击堆场列抓取集装箱'
              : '💡 点击船舶放置集装箱'}
          </div>
        </div>
      </div>
    )}

    {suggestion && (
      <div className="suggestion-bubble">
        💡 {suggestion}
      </div>
    )}

    <div className="efficiency-panel-side">
      <div className="eff-title">⚡ 装船效率</div>
      <div className="eff-bar">
        <div className="eff-fill" style={{ width: `${stats.loadingEfficiency}%` }} />
      </div>
      <div className="eff-value">{stats.loadingEfficiency}%</div>
    </div>
    </div>
  );
};

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    idle: '空闲',
    moving: '移动中',
    lowering: '下降中',
    grabbing: '抓取中',
    lifting: '起升中',
    placing: '放置中',
  };
  return map[status] || status;
}

export default TerminalView;
