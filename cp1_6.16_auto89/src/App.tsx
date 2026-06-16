import React, { useState, useEffect, useCallback } from 'react';
import Scene from './components/Scene';
import Panel from './components/Panel';
import {
  OrganelleData,
  OrganelleType,
  ViewPreset,
  organelles,
  initialVisibleOrganelles,
  viewPresets,
} from './data/cellOrganelles';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [selectedOrganelle, setSelectedOrganelle] = useState<OrganelleData | null>(null);
  const [selectedType, setSelectedType] = useState<OrganelleType | null>(null);
  const [opacity, setOpacity] = useState(0.9);
  const [visibleOrganelles, setVisibleOrganelles] = useState<Record<OrganelleType, boolean>>(
    initialVisibleOrganelles
  );
  const [hoveredOrganelle, setHoveredOrganelle] = useState<OrganelleType | null>(null);
  const [viewPreset, setViewPreset] = useState<ViewPreset | null>(null);
  const [activeViewPreset, setActiveViewPreset] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleOrganelleClick = useCallback((organelle: OrganelleData | null) => {
    if (organelle) {
      setSelectedOrganelle(organelle);
      setSelectedType(organelle.type);
    } else {
      setSelectedOrganelle(null);
      setSelectedType(null);
    }
  }, []);

  const handleVisibilityChange = useCallback(
    (type: OrganelleType, visible: boolean) => {
      setVisibleOrganelles((prev) => ({
        ...prev,
        [type]: visible,
      }));
      if (!visible && selectedType === type) {
        setSelectedOrganelle(null);
        setSelectedType(null);
      }
    },
    [selectedType]
  );

  const handleOpacityChange = useCallback((value: number) => {
    setOpacity(value);
  }, []);

  const handleViewPreset = useCallback((preset: ViewPreset) => {
    setViewPreset(preset);
    setActiveViewPreset(preset.name);
    setTimeout(() => {
      setViewPreset(null);
    }, 1200);
  }, []);

  const handleResetView = useCallback(() => {
    const defaultPreset = viewPresets[0];
    setViewPreset(defaultPreset);
    setActiveViewPreset(defaultPreset.name);
    setTimeout(() => {
      setViewPreset(null);
    }, 1200);
  }, []);

  const handleHover = useCallback((type: OrganelleType | null) => {
    setHoveredOrganelle(type);
  }, []);

  const handleCloseInfoPanel = () => {
    setSelectedOrganelle(null);
    setSelectedType(null);
  };

  return (
    <div className="app-container">
      {loading && (
        <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && (
        <>
          <div className="canvas-container">
            <Scene
              onOrganelleClick={handleOrganelleClick}
              opacity={opacity}
              visibleOrganelles={visibleOrganelles}
              hoveredOrganelle={hoveredOrganelle}
              selectedOrganelle={selectedType}
              viewPreset={viewPreset}
            />
          </div>

          <Panel
            organelles={organelles}
            visibleOrganelles={visibleOrganelles}
            opacity={opacity}
            activeViewPreset={activeViewPreset}
            onVisibilityChange={handleVisibilityChange}
            onOpacityChange={handleOpacityChange}
            onViewPreset={handleViewPreset}
            onResetView={handleResetView}
            onHover={handleHover}
          />

          {selectedOrganelle && (
            <div
              className="info-panel"
              style={{ borderColor: selectedOrganelle.color }}
            >
              <button className="close-btn" onClick={handleCloseInfoPanel}>
                ×
              </button>
              <h3>{selectedOrganelle.name}</h3>
              <p className="english-name">{selectedOrganelle.englishName}</p>
              <p className="size-info">尺寸: {selectedOrganelle.sizeRange}</p>
              <p className="description">{selectedOrganelle.description}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
