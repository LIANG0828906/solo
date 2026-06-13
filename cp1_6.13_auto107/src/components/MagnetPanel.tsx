import { useState, useEffect, useCallback } from 'react';
import { eventBus } from '../utils/EventBus';
import './MagnetPanel.css';

export interface Magnet {
  id: string;
  polarity: 'N' | 'S';
  strength: number;
  position: { x: number; y: number; z: number };
}

const MAX_MAGNETS = 6;

function MagnetPanel() {
  const [magnets, setMagnets] = useState<Magnet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [nextPolarity, setNextPolarity] = useState<'N' | 'S'>('N');
  const [nextStrength, setNextStrength] = useState(5);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleGroundClick = (position: { x: number; y: number; z: number }) => {
      if (magnets.length >= MAX_MAGNETS) return;

      const newMagnet: Magnet = {
        id: `magnet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        polarity: nextPolarity,
        strength: nextStrength,
        position,
      };

      setMagnets((prev) => [...prev, newMagnet]);
      eventBus.emit('magnet:added', newMagnet);
    };

    eventBus.on('ground:clicked', handleGroundClick);
    return () => {
      eventBus.off('ground:clicked', handleGroundClick);
    };
  }, [magnets.length, nextPolarity, nextStrength]);

  useEffect(() => {
    const handleSelected = (id: string | null) => {
      setSelectedId(id);
    };

    eventBus.on('magnet:selected', handleSelected);
    return () => {
      eventBus.off('magnet:selected', handleSelected);
    };
  }, []);

  const addMagnet = useCallback(() => {
    if (magnets.length >= MAX_MAGNETS) return;

    const angle = (magnets.length / MAX_MAGNETS) * Math.PI * 2;
    const radius = 4;
    const newMagnet: Magnet = {
      id: `magnet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      polarity: nextPolarity,
      strength: nextStrength,
      position: {
        x: Math.cos(angle) * radius,
        y: 0.5,
        z: Math.sin(angle) * radius,
      },
    };

    setMagnets((prev) => [...prev, newMagnet]);
    eventBus.emit('magnet:added', newMagnet);
  }, [magnets.length, nextPolarity, nextStrength]);

  const removeMagnet = useCallback((id: string) => {
    setMagnets((prev) => prev.filter((m) => m.id !== id));
    eventBus.emit('magnet:removed', id);
    if (selectedId === id) {
      setSelectedId(null);
      eventBus.emit('magnet:selected', null);
    }
  }, [selectedId]);

  const togglePolarity = useCallback((id: string) => {
    setMagnets((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, polarity: m.polarity === 'N' ? 'S' : 'N' }
          : m
      )
    );
    const magnet = magnets.find((m) => m.id === id);
    if (magnet) {
      eventBus.emit('magnet:updated', {
        ...magnet,
        polarity: magnet.polarity === 'N' ? 'S' : 'N',
      });
    }
  }, [magnets]);

  const updateStrength = useCallback((id: string, strength: number) => {
    setMagnets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, strength } : m))
    );
    const magnet = magnets.find((m) => m.id === id);
    if (magnet) {
      eventBus.emit('magnet:updated', { ...magnet, strength });
    }
  }, [magnets]);

  const selectMagnet = useCallback((id: string) => {
    const newSelected = selectedId === id ? null : id;
    setSelectedId(newSelected);
    eventBus.emit('magnet:selected', newSelected);
  }, [selectedId]);

  const resetScene = useCallback(() => {
    setMagnets([]);
    setSelectedId(null);
    eventBus.emit('scene:reset');
  }, []);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.className = 'ripple';

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  };

  return (
    <div className={`magnet-panel ${isMobile ? 'mobile' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {isMobile && (
        <div
          className="panel-drag-handle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="drag-bar" />
        </div>
      )}

      <div className="panel-content">
        <div className="panel-header">
          <h2 className="panel-title">FluxFlow</h2>
          <p className="panel-subtitle">三维磁场可视化</p>
        </div>

        <div className="panel-section">
          <h3 className="section-title">添加磁铁</h3>

          <div className="polarity-selector">
            <button
              className={`polarity-btn n-pole ${nextPolarity === 'N' ? 'active' : ''}`}
              onClick={(e) => {
                createRipple(e);
                setNextPolarity('N');
              }}
            >
              N极
            </button>
            <button
              className={`polarity-btn s-pole ${nextPolarity === 'S' ? 'active' : ''}`}
              onClick={(e) => {
                createRipple(e);
                setNextPolarity('S');
              }}
            >
              S极
            </button>
          </div>

          <div className="strength-control">
            <label className="control-label">
              强度: <span className="strength-value">{nextStrength}</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={nextStrength}
              onChange={(e) => setNextStrength(Number(e.target.value))}
              className="strength-slider"
            />
            <div className="slider-labels">
              <span>弱</span>
              <span>强</span>
            </div>
          </div>

          <button
            className={`add-btn ${magnets.length >= MAX_MAGNETS ? 'disabled' : ''}`}
            onClick={(e) => {
              createRipple(e);
              addMagnet();
            }}
            disabled={magnets.length >= MAX_MAGNETS}
          >
            {magnets.length >= MAX_MAGNETS ? '已达上限' : '+ 添加磁铁'}
          </button>

          <p className="hint-text">
            或点击场景地面放置磁铁
          </p>
        </div>

        <div className="panel-section magnets-list-section">
          <h3 className="section-title">
            磁铁列表 <span className="count-badge">{magnets.length}/{MAX_MAGNETS}</span>
          </h3>

          <div className="magnets-list">
            {magnets.map((magnet, index) => (
              <div
                key={magnet.id}
                className={`magnet-item ${selectedId === magnet.id ? 'selected' : ''}`}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
                onClick={() => selectMagnet(magnet.id)}
              >
                <div className={`magnet-indicator ${magnet.polarity === 'N' ? 'n-pole' : 's-pole'}`}>
                  {magnet.polarity}
                </div>

                <div className="magnet-info">
                  <div className="magnet-name">磁铁 {index + 1}</div>
                  <div className="magnet-strength">
                    强度 {magnet.strength}
                    <div className="mini-strength-bar">
                      <div
                        className="mini-strength-fill"
                        style={{ width: `${magnet.strength * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  className="polarity-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePolarity(magnet.id);
                  }}
                  title="切换极性"
                >
                  ⇄
                </button>

                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMagnet(magnet.id);
                  }}
                  title="移除磁铁"
                >
                  ×
                </button>
              </div>
            ))}

            {magnets.length === 0 && (
              <div className="empty-state">
                <p>暂无磁铁</p>
                <p className="empty-hint">点击上方按钮添加</p>
              </div>
            )}
          </div>

          {selectedId && (
            <div className="selected-magnet-controls">
              <h4 className="sub-section-title">调整选中磁铁</h4>

              <div className="strength-control">
                <label className="control-label">
                  强度: <span className="strength-value">{magnets.find(m => m.id === selectedId)?.strength || 5}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={magnets.find(m => m.id === selectedId)?.strength || 5}
                  onChange={(e) => updateStrength(selectedId, Number(e.target.value))}
                  className="strength-slider"
                />
              </div>
            </div>
          )}
        </div>

        <div className="panel-section">
          <button
            className="reset-btn"
            onClick={(e) => {
              createRipple(e);
              resetScene();
            }}
          >
            ↻ 重置场景
          </button>
        </div>

        <div className="panel-footer">
          <p className="footer-hint">操作提示</p>
          <ul className="tips-list">
            <li>左键拖拽旋转视角</li>
            <li>滚轮缩放场景</li>
            <li>右键平移视角</li>
            <li>点击地面放置磁铁</li>
            <li>拖拽磁铁移动位置</li>
            <li>点击磁铁高亮磁感线</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MagnetPanel;
