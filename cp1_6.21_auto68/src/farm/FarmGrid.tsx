import React, { useState, useEffect, useCallback } from 'react';
import { CropManager, CROP_CONFIGS, type PlotData, type CropType } from './CropManager';

interface FarmGridProps {
  plots: PlotData[];
  onPlotClick: (plotId: number) => void;
  onHarvest: (plotId: number) => void;
  onKillPest: (plotId: number) => void;
  gold: number;
}

const FarmGrid: React.FC<FarmGridProps> = ({ plots, onPlotClick, onHarvest, onKillPest, gold }) => {
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [harvestParticles, setHarvestParticles] = useState<{ id: number; plotId: number; x: number; y: number }[]>([]);
  const [shakeButton, setShakeButton] = useState<CropType | null>(null);
  const [gridSize, setGridSize] = useState(60);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setGridSize(40);
      } else {
        setGridSize(60);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePlotClick = useCallback((plotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const plot = plots[plotId];

    if (plot.hasPest) {
      if (gold >= 1) {
        onKillPest(plotId);
      }
      return;
    }

    if (plot.stage === 'mature' && plot.crop) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const particles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        plotId,
        x: rect.width / 2 + (Math.random() - 0.5) * 30,
        y: rect.height / 2,
      }));
      setHarvestParticles((prev) => [...prev, ...particles]);
      setTimeout(() => {
        setHarvestParticles((prev) => prev.filter((p) => p.plotId !== plotId));
      }, 300);
      onHarvest(plotId);
      return;
    }

    if (!plot.crop) {
      setSelectedPlot(plotId);
      setShowPlantModal(true);
    }
  }, [plots, onHarvest, onKillPest, gold]);

  const handlePlant = useCallback((cropType: CropType) => {
    const config = CROP_CONFIGS[cropType];
    if (gold < config.seedPrice) {
      setShakeButton(cropType);
      setTimeout(() => setShakeButton(null), 200);
      return;
    }
    if (selectedPlot !== null) {
      onPlotClick(selectedPlot);
      fetch('/api/farm/plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plotId: selectedPlot, cropType }),
      });
    }
    setShowPlantModal(false);
    setSelectedPlot(null);
  }, [selectedPlot, onPlotClick, gold]);

  const closeModal = useCallback(() => {
    setShowPlantModal(false);
    setSelectedPlot(null);
  }, []);

  const renderPlot = (plot: PlotData) => {
    const isMature = plot.stage === 'mature' && plot.crop;
    const plotParticles = harvestParticles.filter((p) => p.plotId === plot.id);

    let plotBgColor = '#8d6e63';
    if (plot.crop) {
      if (isMature) {
        plotBgColor = '#fdd835';
      } else if (plot.hasPest) {
        plotBgColor = '#ffe0b2';
      } else {
        plotBgColor = '#c8e6c9';
      }
    }

    return (
      <div
        key={plot.id}
        onClick={(e) => handlePlotClick(plot.id, e)}
        style={{
          width: gridSize,
          height: gridSize,
          backgroundColor: plotBgColor,
          border: '1px solid #8d6e63',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: plot.crop || !plot.crop ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'visible',
          transition: 'transform 0.15s ease',
          animation: isMature ? 'pulse-glow 1s infinite ease-in-out' : undefined,
          transform: plot.plantingAnimation ? 'scale(1.2)' : 'scale(1)',
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {plot.crop && (
          <div
            style={{
              fontSize: gridSize * 0.5,
              animation: plot.plantingAnimation ? 'seed-sprout 0.5s ease-out' : undefined,
            }}
          >
            {CROP_CONFIGS[plot.crop].icon}
          </div>
        )}

        {plot.crop && plot.stage !== 'mature' && !plot.hasPest && (
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '4px',
              right: '4px',
              height: '4px',
              backgroundColor: '#e0e0e0',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${CropManager.getProgressPercentage(plot)}%`,
                backgroundColor: '#4caf50',
                transition: 'width 1s linear',
              }}
            />
          </div>
        )}

        {plot.hasPest && (
          <>
            <div
              style={{
                position: 'absolute',
                bottom: '4px',
                left: '4px',
                right: '4px',
                height: '4px',
                backgroundColor: '#e0e0e0',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${CropManager.getProgressPercentage(plot)}%`,
                  backgroundColor: '#f44336',
                }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '20px',
                height: '20px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'bug-crawl 0.5s infinite ease-in-out',
                cursor: 'pointer',
                zIndex: 10,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (gold >= 1) {
                  onKillPest(plot.id);
                }
              }}
            >
              🐛
            </div>
          </>
        )}

        {plotParticles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: particle.x,
              top: particle.y,
              fontSize: '16px',
              animation: 'coin-float 0.3s ease-out forwards',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          >
            💰
          </div>
        ))}

        {plot.growthPaused && plot.crop && plot.stage !== 'mature' && (
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              fontSize: '12px',
            }}
          >
            ⏸️
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(6, ${gridSize}px)`,
          gridTemplateRows: `repeat(6, ${gridSize}px)`,
          gap: '4px',
          padding: '12px',
          backgroundColor: '#a5d6a7',
          borderRadius: '8px',
          border: '2px solid #7cb342',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {plots.map((plot) => renderPlot(plot))}
      </div>

      {showPlantModal && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '320px',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <h3
              style={{
                textAlign: 'center',
                marginBottom: '16px',
                color: '#2d5a27',
                fontSize: '18px',
              }}
            >
              🌱 选择种子
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(Object.entries(CROP_CONFIGS) as [CropType, typeof CROP_CONFIGS[CropType]][]).map(
                ([type, config]) => {
                  const canAfford = gold >= config.seedPrice;
                  return (
                    <button
                      key={type}
                      onClick={() => handlePlant(type)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: canAfford ? '#e8f5e9' : '#f5f5f5',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        opacity: canAfford ? 1 : 0.6,
                        animation: shakeButton === type ? 'shake 0.2s ease-in-out' : undefined,
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                      onMouseDown={(e) => {
                        if (canAfford) {
                          e.currentTarget.style.transform = 'scale(0.95)';
                        }
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <div style={{ fontSize: '32px' }}>{config.icon}</div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{config.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          生长时间: {config.growthTime}秒
                        </div>
                      </div>
                      <div style={{ color: '#ff9800', fontWeight: 'bold', fontSize: '14px' }}>
                        💰{config.seedPrice}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
            <button
              onClick={closeModal}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#e0e0e0',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmGrid;
