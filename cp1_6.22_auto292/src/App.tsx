import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SceneRenderer, type LabelInfo } from './scene/SceneRenderer';
import {
  getCelestialData,
  getCelestialById,
  getTypeLabel,
  getTypeColor,
  type CelestialObject,
  type CelestialType,
} from './data/CelestialDataModel';
import ControlsPanel from './components/ControlsPanel';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SceneRenderer | null>(null);

  const [selectedView, setSelectedView] = useState('overview');
  const [selectedType, setSelectedType] = useState<CelestialType | 'all'>('all');
  const [cameraDistance, setCameraDistance] = useState(25);
  const [autoRotate, setAutoRotate] = useState(true);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [hoveredObject, setHoveredObject] = useState<CelestialObject | null>(null);
  const [labels, setLabels] = useState<LabelInfo[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cameraInfo, setCameraInfo] = useState({ x: 0, y: 25, z: 60, azimuth: 0, polar: 90 });

  const celestialData = useRef(getCelestialData());

  const handleLabelUpdate = useCallback((newLabels: LabelInfo[]) => {
    setLabels(newLabels);
  }, []);

  const handleHoverChange = useCallback((id: string | null) => {
    if (id) {
      const obj = getCelestialById(id);
      setHoveredObject(obj || null);
    } else {
      setHoveredObject(null);
    }
  }, []);

  const handleClickCelestial = useCallback((id: string) => {
    setSelectedCardId(id);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new SceneRenderer(containerRef.current);
    rendererRef.current = renderer;

    renderer.setCallbacks({
      onLabelUpdate: handleLabelUpdate,
      onHoverChange: handleHoverChange,
      onClickCelestial: handleClickCelestial,
    });

    renderer.init(celestialData.current);

    const infoInterval = setInterval(() => {
      if (rendererRef.current) {
        const info = rendererRef.current.getCameraInfo();
        setCameraInfo({
          x: info.position.x,
          y: info.position.y,
          z: info.position.z,
          azimuth: info.azimuth,
          polar: info.polar,
        });
      }
    }, 500);

    return () => {
      clearInterval(infoInterval);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [handleLabelUpdate, handleHoverChange, handleClickCelestial]);

  const handleViewChange = useCallback((view: string) => {
    setSelectedView(view);
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (view === 'overview') {
      renderer.resetToOverview();
    } else {
      renderer.focusOnObject(view);
    }
  }, []);

  const handleTypeChange = useCallback((type: CelestialType | 'all') => {
    setSelectedType(type);
    rendererRef.current?.filterByType(type);
  }, []);

  const handleDistanceChange = useCallback((distance: number) => {
    setCameraDistance(distance);
    rendererRef.current?.updateCamera(distance);
  }, []);

  const handleAutoRotateChange = useCallback((enabled: boolean) => {
    setAutoRotate(enabled);
    rendererRef.current?.setAutoRotate(enabled);
  }, []);

  const handleCloseCard = useCallback(() => {
    setSelectedCardId(null);
  }, []);

  const selectedCardObject = selectedCardId ? getCelestialById(selectedCardId) : null;

  const cardStyle: React.CSSProperties = selectedCardObject
    ? {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }
    : {};

  return (
    <div className="app-container">
      <div ref={containerRef} className="canvas-container" />

      {labels.map((label) => (
        <div
          key={label.id}
          className={`celestial-label ${label.isHighlighted ? 'highlighted' : ''}`}
          style={{
            left: `${label.screenX}px`,
            top: `${label.screenY}px`,
          }}
        >
          <div className="label-content">
            <div className="label-name">{label.name}</div>
            <div className="label-type">{label.type}</div>
          </div>
        </div>
      ))}

      {selectedCardObject && (
        <div className="info-card-overlay" onClick={handleCloseCard}>
          <div
            className="info-card"
            style={cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="info-card-bar"
              style={{ background: getTypeColor(selectedCardObject.type) }}
            />
            <button className="info-card-close" onClick={handleCloseCard}>
              ✕
            </button>
            <div className="info-card-content">
              <div className="info-card-title">{selectedCardObject.name}</div>
              <span
                className="info-card-type"
                style={{
                  color: getTypeColor(selectedCardObject.type),
                  background: `${getTypeColor(selectedCardObject.type)}22`,
                }}
              >
                {getTypeLabel(selectedCardObject.type)}
              </span>
              <div className="info-card-row">
                <span className="info-card-row-label">距离</span>
                <span className="info-card-row-value">
                  {selectedCardObject.observationData.distance.toLocaleString()} 光年
                </span>
              </div>
              <div className="info-card-row">
                <span className="info-card-row-label">视星等</span>
                <span className="info-card-row-value">
                  {selectedCardObject.observationData.apparentMagnitude}
                </span>
              </div>
              <div className="info-card-row">
                <span className="info-card-row-label">发现者</span>
                <span className="info-card-row-value">
                  {selectedCardObject.observationData.discoverer}
                </span>
              </div>
              <div className="info-card-row">
                <span className="info-card-row-label">年龄</span>
                <span className="info-card-row-value">
                  {selectedCardObject.observationData.age}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <ControlsPanel
        celestialData={celestialData.current}
        selectedView={selectedView}
        selectedType={selectedType}
        cameraDistance={cameraDistance}
        autoRotate={autoRotate}
        panelCollapsed={panelCollapsed}
        hoveredObject={hoveredObject}
        onViewChange={handleViewChange}
        onTypeChange={handleTypeChange}
        onDistanceChange={handleDistanceChange}
        onAutoRotateChange={handleAutoRotateChange}
        onTogglePanel={() => setPanelCollapsed(!panelCollapsed)}
      />

      <div className="camera-info">
        POS ({cameraInfo.x.toFixed(1)}, {cameraInfo.y.toFixed(1)}, {cameraInfo.z.toFixed(1)})
        <br />
        AZ {cameraInfo.azimuth.toFixed(1)}° / EL {cameraInfo.polar.toFixed(1)}°
      </div>
    </div>
  );
};

export default App;
