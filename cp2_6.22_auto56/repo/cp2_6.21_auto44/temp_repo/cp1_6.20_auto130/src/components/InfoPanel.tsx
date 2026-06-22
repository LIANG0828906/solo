import { useState, useEffect, useRef } from 'react';
import { Building } from '../modules/BuildingGenerator';
import { CityStats } from '../modules/StatsCalculator';

interface InfoPanelProps {
  stats: CityStats | null;
  selectedBuilding: Building | null;
  showModal: boolean;
  onCloseModal: () => void;
  onHeightChange: (id: string, height: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function AnimatedNumber({ value, duration = 300 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  const animStartTime = useRef(Date.now());

  useEffect(() => {
    prevValue.current = displayValue;
    animStartTime.current = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - animStartTime.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = prevValue.current + (value - prevValue.current) * eased;
      setDisplayValue(current);
      
      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue.toFixed(1)}</>;
}

function BuildingModal({
  building,
  onClose,
  onHeightChange,
}: {
  building: Building;
  onClose: () => void;
  onHeightChange: (id: string, height: number) => void;
}) {
  const [newHeight, setNewHeight] = useState(building.height.toString());
  const [isEditing, setIsEditing] = useState(false);

  const volume = building.width * building.depth * building.height;
  const footprint = building.width * building.depth;

  const handleSave = () => {
    const height = parseFloat(newHeight);
    if (!isNaN(height) && height >= 10 && height <= 100) {
      onHeightChange(building.id, height);
      setIsEditing(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">建筑详情</h3>
        <div className="modal-stats">
          <div className="modal-stat-row">
            <span className="modal-stat-label">坐标</span>
            <span className="modal-stat-value">
              ({building.x.toFixed(1)}, {building.z.toFixed(1)})
            </span>
          </div>
          <div className="modal-stat-row">
            <span className="modal-stat-label">高度</span>
            <span className="modal-stat-value">{building.height.toFixed(1)} m</span>
          </div>
          <div className="modal-stat-row">
            <span className="modal-stat-label">体积</span>
            <span className="modal-stat-value">{volume.toFixed(0)} m³</span>
          </div>
          <div className="modal-stat-row">
            <span className="modal-stat-label">占地面积</span>
            <span className="modal-stat-value">{footprint.toFixed(1)} m²</span>
          </div>
          <div className="modal-stat-row">
            <span className="modal-stat-label">宽度 × 深度</span>
            <span className="modal-stat-value">
              {building.width.toFixed(1)} × {building.depth.toFixed(1)} m
            </span>
          </div>
        </div>

        {isEditing ? (
          <>
            <div className="modal-input-group">
              <label>修改高度 (10-100米)</label>
              <input
                type="number"
                min={10}
                max={100}
                value={newHeight}
                onChange={(e) => setNewHeight(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-buttons">
              <button className="modal-btn secondary" onClick={() => setIsEditing(false)}>
                取消
              </button>
              <button className="modal-btn primary" onClick={handleSave}>
                保存
              </button>
            </div>
          </>
        ) : (
          <div className="modal-buttons">
            <button className="modal-btn secondary" onClick={onClose}>
              关闭
            </button>
            <button className="modal-btn primary" onClick={() => setIsEditing(true)}>
              修改高度
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoPanel({
  stats,
  selectedBuilding,
  showModal,
  onCloseModal,
  onHeightChange,
  collapsed,
  onToggleCollapse,
}: InfoPanelProps) {
  const displayStats = stats || {
    totalBuildings: 0,
    maxHeight: 0,
    avgHeight: 0,
    floorAreaRatio: 0,
    shadowCoverage: 0,
  };

  return (
    <>
      <div className={`side-panel right ${collapsed ? 'collapsed' : ''}`}>
        <div className="panel-header">
          <h3>城市数据</h3>
          <button className="toggle-btn" onClick={onToggleCollapse}>
            {collapsed ? (
              <svg viewBox="0 0 24 24">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M9 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </div>
        <div className="panel-content">
          <div className="stats-list">
            <div className="stat-item">
              <span className="stat-label">建筑总数</span>
              <span className="stat-value">
                <AnimatedNumber value={displayStats.totalBuildings} />
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">最高高度</span>
              <span className="stat-value highlight">
                <AnimatedNumber value={displayStats.maxHeight} />
                <span className="stat-unit"> m</span>
              </span>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{ width: `${(displayStats.maxHeight / 100) * 100}%` }}
                />
              </div>
            </div>

            <div className="stat-item">
              <span className="stat-label">平均高度</span>
              <span className="stat-value">
                <AnimatedNumber value={displayStats.avgHeight} />
                <span className="stat-unit"> m</span>
              </span>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{ width: `${(displayStats.avgHeight / 100) * 100}%` }}
                />
              </div>
            </div>

            <div className="stat-item">
              <span className="stat-label">容积率</span>
              <span className="stat-value">
                <AnimatedNumber value={displayStats.floorAreaRatio} />
              </span>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{ width: `${Math.min(displayStats.floorAreaRatio * 20, 100)}%` }}
                />
              </div>
            </div>

            <div className="stat-item">
              <span className="stat-label">阴影覆盖率</span>
              <span className="stat-value">
                <AnimatedNumber value={displayStats.shadowCoverage} />
                <span className="stat-unit"> %</span>
              </span>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{ width: `${displayStats.shadowCoverage}%` }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(233, 69, 96, 0.2)' }}>
            <h4 style={{ fontSize: '12px', color: '#e94560', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              操作提示
            </h4>
            <div style={{ fontSize: '11px', color: '#b0b0c0', lineHeight: '1.8' }}>
              <div>🖱️ 左键拖拽：旋转视角</div>
              <div>🖱️ 滚轮：缩放</div>
              <div>🖱️ 右键拖拽：平移</div>
              <div>🖱️ 双击建筑：查看详情</div>
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedBuilding && (
        <BuildingModal
          building={selectedBuilding}
          onClose={onCloseModal}
          onHeightChange={onHeightChange}
        />
      )}
    </>
  );
}

export default InfoPanel;
