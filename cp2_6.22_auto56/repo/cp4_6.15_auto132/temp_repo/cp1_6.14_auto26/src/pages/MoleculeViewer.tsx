import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MoleculeScene from '@/components/MoleculeScene';
import ControlPanel from '@/components/ControlPanel';
import { parseMoleculeData, getBondsForAtom } from '@/utils/parseMolecule';
import { ELEMENT_INFO, DEFAULT_ELEMENT } from '@/constants/elements';
import type { MoleculeData, ParsedMolecule, DisplayMode } from '@/types';
import { useRipple } from '@/hooks/useRipple';

interface SelectedAtom {
  id: string;
  element: string;
  position: [number, number, number];
  bondsCount: number;
}

export default function MoleculeViewer() {
  const navigate = useNavigate();
  const createRipple = useRipple();
  const [moleculeData, setMoleculeData] = useState<MoleculeData | null>(null);
  const [parsedMolecule, setParsedMolecule] = useState<ParsedMolecule | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('ball-stick');
  const [highlightedAtomIds, setHighlightedAtomIds] = useState<Set<string>>(new Set());
  const [selectedAtom, setSelectedAtom] = useState<SelectedAtom | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('moleculeData');
    if (stored) {
      try {
        const data: MoleculeData = JSON.parse(stored);
        setMoleculeData(data);
        setParsedMolecule(parseMoleculeData(data));
      } catch {
        navigate('/');
      }
    } else {
      navigate('/');
    }
    setTimeout(() => setLoading(false), 500);
  }, [navigate]);

  const handleAtomClick = useCallback(
    (atomId: string) => {
      if (!parsedMolecule) return;

      const atom = parsedMolecule.atoms.find((a) => a.id === atomId);
      if (!atom) return;

      setHighlightedAtomIds((prev) => {
        const next = new Set(prev);
        if (next.has(atomId)) {
          next.delete(atomId);
          if (selectedAtom?.id === atomId) {
            setSelectedAtom(null);
          }
        } else {
          next.add(atomId);
          const bondsCount = getBondsForAtom(parsedMolecule.bonds, atomId);
          setSelectedAtom({
            id: atomId,
            element: atom.element,
            position: atom.position,
            bondsCount,
          });
        }
        return next;
      });
    },
    [parsedMolecule, selectedAtom]
  );

  const handleClearHighlights = useCallback(() => {
    setHighlightedAtomIds(new Set());
    setSelectedAtom(null);
  }, []);

  const handleRemoveHighlight = useCallback((atomId: string) => {
    setHighlightedAtomIds((prev) => {
      const next = new Set(prev);
      next.delete(atomId);
      return next;
    });
    setSelectedAtom((prev) => (prev?.id === atomId ? null : prev));
  }, []);

  const highlightedAtomsList = useMemo(() => {
    if (!parsedMolecule) return [];
    return Array.from(highlightedAtomIds)
      .map((id) => parsedMolecule.atoms.find((a) => a.id === id))
      .filter(Boolean) as ParsedMolecule['atoms'];
  }, [highlightedAtomIds, parsedMolecule]);

  const elementInfo = selectedAtom
    ? ELEMENT_INFO[selectedAtom.element] || DEFAULT_ELEMENT
    : null;

  return (
    <div className="viewer-page">
      <div className="viewer-header">
        <h1 className="viewer-title">
          {moleculeData?.name || '分子结构查看器'}
        </h1>
        <button
          className="back-btn ripple-btn"
          onClick={(e) => {
            createRipple(e);
            navigate('/');
          }}
        >
          ← 返回上传
        </button>
      </div>

      {parsedMolecule && (
        <>
          <div className="canvas-container">
            <MoleculeScene
              molecule={parsedMolecule}
              displayMode={displayMode}
              highlightedAtomIds={highlightedAtomIds}
              onAtomClick={handleAtomClick}
              autoRotate={autoRotate}
              rotationSpeed={rotationSpeed}
            />
          </div>

          {showInfoPanel && highlightedAtomsList.length > 0 && (
            <div className="atom-info-panel">
              <div className="info-panel-header">
                <span className="info-panel-title">原子信息</span>
                <button
                  className="info-panel-close"
                  onClick={() => setShowInfoPanel(false)}
                >
                  ×
                </button>
              </div>
              <div className="info-panel-content">
                {selectedAtom && elementInfo && (
                  <>
                    <div className="atom-info-item">
                      <span className="atom-info-label">元素符号</span>
                      <span className="atom-info-value">{selectedAtom.element}</span>
                    </div>
                    <div className="atom-info-item">
                      <span className="atom-info-label">元素名称</span>
                      <span className="atom-info-value">{elementInfo.displayName}</span>
                    </div>
                    <div className="atom-info-item">
                      <span className="atom-info-label">X 坐标</span>
                      <span className="atom-info-value">
                        {selectedAtom.position[0].toFixed(3)}
                      </span>
                    </div>
                    <div className="atom-info-item">
                      <span className="atom-info-label">Y 坐标</span>
                      <span className="atom-info-value">
                        {selectedAtom.position[1].toFixed(3)}
                      </span>
                    </div>
                    <div className="atom-info-item">
                      <span className="atom-info-label">Z 坐标</span>
                      <span className="atom-info-value">
                        {selectedAtom.position[2].toFixed(3)}
                      </span>
                    </div>
                    <div className="atom-info-item">
                      <span className="atom-info-label">连接原子数</span>
                      <span className="atom-info-value">{selectedAtom.bondsCount}</span>
                    </div>
                  </>
                )}
                <div style={{ marginTop: '8px' }}>
                  <div className="control-label">已高亮原子</div>
                  <div className="highlighted-atoms-list">
                    {highlightedAtomsList.length === 0 ? (
                      <div className="empty-highlight">暂无高亮原子</div>
                    ) : (
                      highlightedAtomsList.map((atom) => (
                        <div key={atom.id} className="highlighted-atom-item">
                          <span>
                            <span
                              style={{
                                display: 'inline-block',
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                marginRight: 8,
                                backgroundColor:
                                  ELEMENT_INFO[atom.element]?.color ||
                                  DEFAULT_ELEMENT.color,
                              }}
                            />
                            {atom.element} ({atom.id.slice(0, 8)})
                          </span>
                          <button
                            className="highlighted-atom-remove"
                            onClick={() => handleRemoveHighlight(atom.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showInfoPanel && highlightedAtomsList.length > 0 && (
            <button
              className="action-btn"
              style={{
                position: 'absolute',
                top: 80,
                right: 24,
                width: 'auto',
                zIndex: 10,
                padding: '8px 16px',
              }}
              onClick={() => setShowInfoPanel(true)}
            >
              📋 显示信息面板 ({highlightedAtomsList.length})
            </button>
          )}

          <ControlPanel
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            onClearHighlights={handleClearHighlights}
            autoRotate={autoRotate}
            onAutoRotateChange={setAutoRotate}
            rotationSpeed={rotationSpeed}
            onRotationSpeedChange={setRotationSpeed}
            highlightedCount={highlightedAtomIds.size}
          />

          {parsedMolecule && (
            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-label">原子数:</span>
                <span className="stat-value">{parsedMolecule.atoms.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">化学键:</span>
                <span className="stat-value">{parsedMolecule.bonds.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">已高亮:</span>
                <span className="stat-value">{highlightedAtomIds.size}</span>
              </div>
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-text">正在加载分子结构...</div>
        </div>
      )}
    </div>
  );
}
