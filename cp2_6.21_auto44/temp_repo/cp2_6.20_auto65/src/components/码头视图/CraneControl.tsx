import React, { useEffect } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { Crane, Ship } from '../../types';
import './CraneControl.css';

interface CraneViewProps {
  crane: Crane;
  isSelected: boolean;
  onClick: () => void;
}

const CraneView: React.FC<CraneViewProps> = ({ crane, isSelected, onClick }) => {
  const hasContainer = !!crane.carriedContainer;

  return (
    <div
      className={`crane-container ${isSelected ? 'selected' : ''} ${crane.status}`}
      style={{
        left: crane.position.x - 30,
        top: crane.position.y - 50,
      }}
      onClick={onClick}
    >
      <div className="crane-structure">
        <div className="crane-leg left" />
        <div className="crane-leg right" />
        <div className="crane-beam" />
        <div className="crane-trolley">
          <div className={`spreader ${crane.status === 'grabbing' ? 'grabbing' : ''}`}>
            {hasContainer && (
              <div
                className="carried-container"
                style={{ backgroundColor: crane.carriedContainer?.color }}
              >
                {crane.carriedContainer?.destination.substring(0, 2)}
              </div>
            )}
            {crane.status === 'grabbing' && <div className="grab-effect" />}
          </div>
          <div className="trolley-cables" />
        </div>
        <div className="crane-machinery" />
      </div>

      <div className="crane-label">
        {crane.id.replace('crane-', '')}号岸桥
        <span className={`status-dot ${crane.status}`} />
      </div>
    </div>
  );
};

interface ShipLoadingAreaProps {
  ship: Ship;
  onPlaceContainer: (shipId: string) => void;
  canPlace: boolean;
}

const ShipLoadingArea: React.FC<ShipLoadingAreaProps> = ({ ship, onPlaceContainer, canPlace }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canPlace) {
      onPlaceContainer(ship.id);
    }
  };

  return (
    <div
      className={`ship-loading-area ${canPlace ? 'can-place' : ''}`}
      style={{
        left: ship.position.x,
        top: ship.position.y,
      }}
      onClick={handleClick}
    >
      <div className="loading-hint">
        {canPlace ? '点击放置集装箱' : ''}
      </div>
    </div>
  );
};

interface CraneControlProps {
  className?: string;
}

export const CraneControl: React.FC<CraneControlProps> = ({ className }) => {
  const {
    cranes,
    ships,
    yardColumns,
    selectedCraneId,
    selectedColumnId,
    selectCrane,
    moveCraneToColumn,
    grabContainer,
    placeContainerOnShip,
  } = useSimulationStore();

  const selectedCrane = cranes.find((c) => c.id === selectedCraneId);
  const selectedColumn = yardColumns.find((yc) => yc.id === selectedColumnId);
  const dockedShips = ships.filter(
    (s) => s.status === 'docked' || s.status === 'loading'
  );

  const handleCraneClick = (craneId: string) => {
    if (selectedCraneId === craneId) {
      selectCrane(undefined);
    } else {
      selectCrane(craneId);
    }
  };

  const handleGrabContainer = () => {
    if (selectedCraneId && selectedColumnId && selectedCrane?.status === 'idle') {
      const craneColumn = yardColumns.find(
        (yc) => yc.id === selectedCrane.currentColumnId
      );
      if (craneColumn && craneColumn.id === selectedColumnId) {
        grabContainer(selectedCraneId, selectedColumnId);
      }
    }
  };

  const handlePlaceOnShip = (shipId: string) => {
    if (selectedCraneId && selectedCrane?.carriedContainer) {
      placeContainerOnShip(selectedCraneId, shipId);
    }
  };

  const canGrab =
    selectedCrane?.status === 'idle' &&
    selectedColumnId &&
    selectedCrane?.currentColumnId === selectedColumnId &&
    !selectedCrane?.carriedContainer &&
    selectedColumn?.containers.some((c) => c !== null);

  const hasCarriedContainer = !!selectedCrane?.carriedContainer;

  useEffect(() => {
    if (selectedColumnId && selectedCrane?.status === 'idle' && !selectedCrane.carriedContainer) {
      const column = yardColumns.find((yc) => yc.id === selectedColumnId);
      if (column && selectedCrane.currentColumnId !== selectedColumnId) {
        setTimeout(() => {
          moveCraneToColumn(selectedCraneId!, selectedColumnId);
        }, 300);
      }
    }
  }, [selectedColumnId, selectedCrane?.status]);

  return (
    <div className={`crane-control ${className || ''}`}>
      <div className="crane-layer">
        {cranes.map((crane) => (
          <CraneView
            key={crane.id}
            crane={crane}
            isSelected={selectedCraneId === crane.id}
            onClick={() => handleCraneClick(crane.id)}
          />
        ))}
      </div>

      {dockedShips.map((ship) => (
        <ShipLoadingArea
          key={ship.id}
          ship={ship}
          onPlaceContainer={handlePlaceOnShip}
          canPlace={hasCarriedContainer && selectedCrane?.berthId === ship.berthId}
        />
      ))}

      {selectedCrane && (
        <div className="crane-control-panel">
          <div className="panel-header">
            <span>🎯 岸桥控制 - {selectedCrane.id.replace('crane-', '')}号</span>
          </div>
          <div className="panel-body">
            <div className="control-status">
              <span className="status-label">状态:</span>
              <span className={`status-value ${selectedCrane.status}`}>
                {getStatusText(selectedCrane.status)}
              </span>
            </div>

            {selectedCrane.carriedContainer && (
              <div className="carried-info">
                <div className="info-title">吊运中集装箱:</div>
                <div
                  className="carried-box"
                  style={{ backgroundColor: selectedCrane.carriedContainer.color }}
                >
                  <span>{selectedCrane.carriedContainer.destination}</span>
                </div>
                <div className="carried-details">
                  <span>尺寸: {selectedCrane.carriedContainer.size}</span>
                  <span>重量: {(selectedCrane.carriedContainer.weight / 1000).toFixed(1)}t</span>
                </div>
              </div>
            )}

            <div className="control-actions">
              <button
                className="action-btn grab-btn"
                disabled={!canGrab}
                onClick={handleGrabContainer}
              >
                📦 抓取集装箱
              </button>
            </div>

            <div className="control-hint">
              {!selectedCrane.carriedContainer
                ? '💡 点击堆场列选中集装箱'
                : '💡 点击船舶放置集装箱'}
            </div>
          </div>
        </div>
      )}

      <div className="efficiency-panel">
        <div className="efficiency-header">⚡ 装船效率</div>
        <div className="efficiency-content">
          <div className="efficiency-bar">
            <div
              className="efficiency-fill"
              style={{
                width: `${calculateEfficiency(ships)}%`,
              }}
            />
          </div>
          <div className="efficiency-value">
            {calculateEfficiency(ships)}%
          </div>
        </div>
      </div>
    </div>
  );
};

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    idle: '空闲',
    moving: '移动中',
    lowering: '下降中',
    grabbing: '抓取中',
    lifting: '起升中',
    placing: '放置中',
  };
  return statusMap[status] || status;
}

function calculateEfficiency(ships: Ship[]): number {
  const dockedShips = ships.filter((s) => s.status === 'docked' || s.status === 'loading');
  if (dockedShips.length === 0) return 0;

  const total = dockedShips.reduce((sum, s) => sum + s.containerCount, 0);
  const loaded = dockedShips.reduce((sum, s) => sum + s.loadedContainers, 0);

  return total > 0 ? Math.round((loaded / total) * 100) : 0;
}

export default CraneControl;
