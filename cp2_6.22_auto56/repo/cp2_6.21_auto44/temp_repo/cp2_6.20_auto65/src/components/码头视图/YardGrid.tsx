import React, { useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { YardColumn, Container } from '../../types';
import './YardGrid.css';

interface ContainerInfoPopupProps {
  column: YardColumn;
  position: { x: number; y: number };
  onClose: () => void;
}

const ContainerInfoPopup: React.FC<ContainerInfoPopupProps> = ({ column, position, onClose }) => {
  const containers = column.containers.filter((c): c is Container => c !== null).reverse();

  return (
    <div
      className="container-info-popup"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="popup-header">
        <span>列详情</span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="popup-content">
        {containers.length === 0 ? (
          <div className="empty-column">该列为空</div>
        ) : (
          <div className="container-list">
            {containers.map((container, index) => (
              <div key={container.id} className="container-item">
                <div
                  className="container-color-indicator"
                  style={{ backgroundColor: container.color }}
                />
                <div className="container-details">
                  <div className="container-dest">目的港: {container.destination}</div>
                  <div className="container-meta">
                    <span>尺寸: {container.size}</span>
                    <span>重量: {(container.weight / 1000).toFixed(1)}吨</span>
                  </div>
                  <div className="container-owner">货主: {container.owner}</div>
                </div>
                <div className="container-level">第{containers.length - index}层</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface YardColumnViewProps {
  column: YardColumn;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: (columnId: string, containerId?: string) => void;
}

const YardColumnView: React.FC<YardColumnViewProps> = ({
  column,
  isSelected,
  isHighlighted,
  onSelect,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const topContainer = column.containers.find((c) => c !== null);
    onSelect(column.id, topContainer?.id);

    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPosition({
      x: rect.width + 10,
      y: 0,
    });
    setShowPopup(!showPopup);
  };

  const containerCount = column.containers.filter((c) => c !== null).length;

  return (
    <div
      className={`yard-column ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      style={{
        left: column.position.x,
        top: column.position.y,
        width: column.position.width,
      }}
      onClick={handleClick}
    >
      <div className="column-header">
        <span className="column-label">{column.id.split('-').pop()}列</span>
        <span className="column-count">{containerCount}/{column.maxHeight}</span>
      </div>

      <div className="column-stack">
        {[...Array(column.maxHeight)].map((_, index) => {
          const container = column.containers[column.maxHeight - 1 - index];
          return (
            <div
              key={index}
              className={`container-slot ${container ? 'filled' : 'empty'}`}
            >
              {container && (
                <div
                  className="container-box"
                  style={{ backgroundColor: container.color }}
                  title={`目的港: ${container.destination}`}
                >
                  <span className="container-label">
                    {container.destination.substring(0, 2)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showPopup && (
        <ContainerInfoPopup
          column={column}
          position={popupPosition}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

interface YardGridProps {
  className?: string;
}

export const YardGrid: React.FC<YardGridProps> = ({ className }) => {
  const { yardColumns, selectedColumnId, selectContainer, berthes } = useSimulationStore();

  const handleColumnSelect = (columnId: string, containerId?: string) => {
    if (selectedColumnId === columnId) {
      selectContainer(undefined, undefined);
    } else {
      selectContainer(containerId, columnId);
    }
  };

  const groupedColumns = berthes.map((berth) => ({
    berth,
    columns: yardColumns.filter((yc) => yc.berthId === berth.id),
  }));

  return (
    <div className={`yard-grid ${className || ''}`}>
      <div className="yard-header">
        <h3>📦 堆场管理</h3>
      </div>

      <div className="yard-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#e74c3c' }} />
          <span>上海/深圳</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#3498db' }} />
          <span>新加坡/东京</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#2ecc71' }} />
          <span>鹿特丹/汉堡</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f39c12' }} />
          <span>洛杉矶/釜山</span>
        </div>
      </div>

      <div className="yard-container">
        {groupedColumns.map(({ berth, columns }) => (
          <div key={berth.id} className="yard-group">
            <div className="yard-group-label">{berth.name}堆场</div>
            <div className="yard-columns-row">
              {columns.map((column) => (
                <YardColumnView
                  key={column.id}
                  column={column}
                  isSelected={selectedColumnId === column.id}
                  isHighlighted={false}
                  onSelect={handleColumnSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="yard-grid-bg" />
    </div>
  );
};

export default YardGrid;
