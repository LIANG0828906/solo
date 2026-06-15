import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { LightingMode, DisplayMode, Artifact, AnnotationPoint } from './types';
import { ARTIFACTS, LIGHTING_PRESETS, PEDESTAL_POSITIONS, CATEGORY_NAMES } from './data/artifacts';
import Scene from './Scene';
import UIDrawer from './UIDrawer';

const App: React.FC = () => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [lightingMode, setLightingMode] = useState<LightingMode>(LightingMode.MUSEUM);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.SINGLE);
  const [isRoamingPaused, setIsRoamingPaused] = useState(false);
  const [weatheringSlider, setWeatheringSlider] = useState(0);
  const [hoveredArtifactId, setHoveredArtifactId] = useState<string | null>(null);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedArtifact = useMemo<Artifact | undefined>(
    () => ARTIFACTS.find(a => a.id === selectedArtifactId),
    [selectedArtifactId]
  );

  const compareArtifacts = useMemo<Artifact[]>(
    () => selectedForCompare.map(id => ARTIFACTS.find(a => a.id === id)!).filter(Boolean),
    [selectedForCompare]
  );

  const activeAnnotation = useMemo<AnnotationPoint | undefined>(() => {
    if (!selectedArtifact || !activeAnnotationId) return undefined;
    return selectedArtifact.annotations.find(a => a.id === activeAnnotationId);
  }, [selectedArtifact, activeAnnotationId]);

  const handleArtifactClick = useCallback((id: string) => {
    if (isCompareMode) {
      setSelectedForCompare(prev => {
        if (prev.includes(id)) return prev.filter(i => i !== id);
        if (prev.length >= 2) return [prev[1], id];
        return [...prev, id];
      });
    } else {
      setSelectedArtifactId(prev => prev === id ? null : id);
      setActiveAnnotationId(null);
    }
  }, [isCompareMode]);

  const handleArtifactHover = useCallback((id: string | null) => {
    setHoveredArtifactId(id);
  }, []);

  const handleAnnotationClick = useCallback((id: string) => {
    setActiveAnnotationId(prev => prev === id ? null : id);
  }, []);

  const handleStartCompare = useCallback(() => {
    setIsCompareMode(true);
    setSelectedArtifactId(null);
    setActiveAnnotationId(null);
  }, []);

  const handleExitCompare = useCallback(() => {
    setIsCompareMode(false);
    setSelectedForCompare([]);
    setWeatheringSlider(0);
  }, []);

  const handleExecuteCompare = useCallback(() => {
    if (compareArtifacts.length === 2) {
      setIsCompareMode(true);
    }
  }, [compareArtifacts.length]);

  const handleResetView = useCallback(() => {
    setSelectedArtifactId(null);
    setIsCompareMode(false);
    setSelectedForCompare([]);
    setActiveAnnotationId(null);
    setWeatheringSlider(0);
  }, []);

  const hoveredArtifact = useMemo<Artifact | undefined>(
    () => ARTIFACTS.find(a => a.id === hoveredArtifactId),
    [hoveredArtifactId]
  );

  const lightingPreset = LIGHTING_PRESETS.find(p => p.mode === lightingMode)!;

  const groupedArtifacts = useMemo(() => {
    const groups: Record<number, Artifact[]> = { 0: [], 1: [], 2: [] };
    ARTIFACTS.forEach(a => {
      groups[a.pedestalIndex].push(a);
    });
    return groups;
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: lightingPreset.background,
        transition: 'background-color 1000ms cubic-bezier(0.645, 0.045, 0.355, 1)',
        overflow: 'hidden',
      }}
    >
      <Scene
        artifacts={ARTIFACTS}
        groupedArtifacts={groupedArtifacts}
        pedestalPositions={PEDESTAL_POSITIONS}
        lightingPreset={lightingPreset}
        displayMode={displayMode}
        isRoamingPaused={isRoamingPaused}
        selectedArtifactId={selectedArtifactId}
        selectedForCompare={selectedForCompare}
        isCompareMode={isCompareMode}
        weatheringSlider={weatheringSlider}
        hoveredArtifactId={hoveredArtifactId}
        activeAnnotationId={activeAnnotationId}
        onArtifactClick={handleArtifactClick}
        onArtifactHover={handleArtifactHover}
        onAnnotationClick={handleAnnotationClick}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '20px 24px',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #d4af37 0%, #b8962e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#d4af37',
                  letterSpacing: 1,
                  margin: 0,
                }}
              >
                虚拟文物3D陈列室
              </h1>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                Virtual Artifact Gallery
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 20,
              background: 'rgba(26, 26, 46, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              pointerEvents: 'auto',
            }}
          >
            {Object.entries(CATEGORY_NAMES).map(([key, name]) => {
              const count = ARTIFACTS.filter(a => a.category === key).length;
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <span style={{ color: '#d4af37', fontWeight: 600 }}>{count}</span>
                  <span>{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {hoveredArtifact && !selectedArtifact && !isCompareMode && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 100,
            transform: 'translateX(-50%)',
            zIndex: 50,
            pointerEvents: 'none',
            animation: 'fadeInUp 300ms cubic-bezier(0.645, 0.045, 0.355, 1)',
          }}
        >
          <div
            style={{
              background: 'rgba(26, 26, 46, 0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              borderRadius: 12,
              padding: '16px 24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212, 175, 55, 0.1)',
              minWidth: 260,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(212, 175, 55, 0.15)',
                  color: '#d4af37',
                }}
              >
                {CATEGORY_NAMES[hoveredArtifact.category]}
              </span>
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#d4af37',
                margin: 0,
                marginBottom: 4,
              }}
            >
              {hoveredArtifact.name}
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                fontSize: 12,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <span>📅 {hoveredArtifact.era}</span>
              <span>📦 {hoveredArtifact.material}</span>
            </div>
          </div>
        </div>
      )}

      {selectedArtifact && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: 'blur(8px)',
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 40,
            pointerEvents: 'none',
            transition: 'all 600ms cubic-bezier(0.645, 0.045, 0.355, 1)',
          }}
        />
      )}

      {selectedArtifact && activeAnnotation && (
        <div
          style={{
            position: 'fixed',
            right: 300,
            top: '50%',
            transform: 'translateY(-50%)',
            maxWidth: 320,
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.6)',
            borderRadius: 16,
            padding: 20,
            zIndex: 60,
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
            animation: 'slideInRight 600ms cubic-bezier(0.645, 0.045, 0.355, 1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: activeAnnotation.type === 'inscription'
                    ? '#d4af37'
                    : activeAnnotation.type === 'repair'
                    ? '#5dade2'
                    : activeAnnotation.type === 'crack'
                    ? '#e74c3c'
                    : '#58d68d',
                  boxShadow: `0 0 12px ${activeAnnotation.type === 'inscription'
                    ? 'rgba(212,175,55,0.8)'
                    : activeAnnotation.type === 'repair'
                    ? 'rgba(93,173,226,0.8)'
                    : activeAnnotation.type === 'crack'
                    ? 'rgba(231,76,60,0.8)'
                    : 'rgba(88,214,141,0.8)'}`,
                }}
              />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {activeAnnotation.type === 'inscription' ? '铭文' : activeAnnotation.type === 'repair' ? '修复' : activeAnnotation.type === 'crack' ? '痕迹' : '纹理'}
              </span>
            </div>
            <button
              onClick={() => setActiveAnnotationId(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: '#d4af37', margin: 0, marginBottom: 8 }}>
            {activeAnnotation.title}
          </h4>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: 0 }}>
            {activeAnnotation.description}
          </p>
        </div>
      )}

      {selectedArtifact && (
        <div
          style={{
            position: 'fixed',
            left: 24,
            bottom: 24,
            maxWidth: 380,
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: 'rgba(26, 26, 46, 0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 10px',
                    borderRadius: 4,
                    background: 'rgba(212, 175, 55, 0.15)',
                    color: '#d4af37',
                    letterSpacing: 1,
                  }}
                >
                  {CATEGORY_NAMES[selectedArtifact.category]}
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#d4af37', margin: '10px 0 4px' }}>
                  {selectedArtifact.name}
                </h2>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
                  <span>📅 {selectedArtifact.era}</span>
                  <span>📦 {selectedArtifact.material}</span>
                  <span>🏷️ {selectedArtifact.annotations.length}处标注</span>
                </div>
              </div>
              <button
                onClick={handleResetView}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 300ms',
                }}
              >
                ×
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: 0 }}>
              {selectedArtifact.description}
            </p>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                操作提示：拖拽旋转 · 滚轮缩放 · 点击金色标注点查看细节
              </div>
            </div>
          </div>
        </div>
      )}

      <UIDrawer
        isMobile={isMobile}
        panelOpen={panelOpen}
        setPanelOpen={setPanelOpen}
        menuExpanded={menuExpanded}
        setMenuExpanded={setMenuExpanded}
        lightingMode={lightingMode}
        setLightingMode={setLightingMode}
        displayMode={displayMode}
        setDisplayMode={(mode) => {
          setDisplayMode(mode);
          if (mode === DisplayMode.ROAMING) {
            setSelectedArtifactId(null);
            setIsCompareMode(false);
          }
        }}
        isRoamingPaused={isRoamingPaused}
        setIsRoamingPaused={setIsRoamingPaused}
        isCompareMode={isCompareMode}
        selectedForCompare={selectedForCompare}
        compareArtifacts={compareArtifacts}
        weatheringSlider={weatheringSlider}
        setWeatheringSlider={setWeatheringSlider}
        onStartCompare={handleStartCompare}
        onExitCompare={handleExitCompare}
        onExecuteCompare={handleExecuteCompare}
        onResetView={handleResetView}
        hasSelectedArtifact={!!selectedArtifact}
      />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translate(30px, -50%); }
          to { opacity: 1; transform: translate(0, -50%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
};

export default App;
