import React, { useEffect, useState } from 'react';
import { Plot as PlotType, useGameStore, PlotStatus } from '../stores/useGameStore';
import './PlotAnimations.css';

interface PlotProps {
  plot: PlotType;
  isOccupied: boolean;
  buildingId?: string;
  onClick: () => void;
}

const PLOT_SIZE = 64;

const getStageIcon = (status: PlotStatus, matureIcon: string | undefined, cropId: string | undefined): string => {
  switch (status) {
    case 'seed':
      return '•';
    case 'sprout':
      return '🌱';
    case 'growing':
      if (cropId === 'wheat') return '🌾';
      if (cropId === 'carrot') return '🥬';
      if (cropId === 'tomato') return '🌿';
      if (cropId === 'corn') return '🌾';
      return '🌿';
    case 'mature':
      return matureIcon || '🌾';
    default:
      return '';
  }
};

const getStageSize = (status: PlotStatus): string => {
  switch (status) {
    case 'seed':
      return 'w-3 h-3 text-green-300';
    case 'sprout':
      return 'w-8 h-8';
    case 'growing':
      return 'w-10 h-10';
    case 'mature':
      return 'w-12 h-12';
    default:
      return 'w-6 h-6';
  }
};

export const Plot: React.FC<PlotProps> = ({ plot, isOccupied, buildingId, onClick }) => {
  const { getPlotStatus, getCropType, getPlotGrowthProgress, currentTime } = useGameStore();

  const [displayStatus, setDisplayStatus] = useState<PlotStatus>('empty');
  const [prevStatus, setPrevStatus] = useState<PlotStatus>('empty');
  const [isStageTransitioning, setIsStageTransitioning] = useState(false);

  const actualStatus = buildingId ? 'building' : getPlotStatus(plot);
  const cropType = plot.cropId ? getCropType(plot.cropId) : undefined;
  const progress = getPlotGrowthProgress(plot);

  useEffect(() => {
    if (actualStatus !== displayStatus) {
      setIsStageTransitioning(true);
      setPrevStatus(displayStatus);
      setTimeout(() => {
        setDisplayStatus(actualStatus);
        setTimeout(() => setIsStageTransitioning(false), 300);
      }, 200);
    }
  }, [actualStatus, displayStatus, currentTime]);

  const icon = getStageIcon(displayStatus, cropType?.matureIcon, plot.cropId);
  const isMature = displayStatus === 'mature';
  const stageSize = getStageSize(displayStatus);

  if (isOccupied) {
    return (
      <div
        className="soil-texture border border-amber-900/30"
        style={{ width: PLOT_SIZE, height: PLOT_SIZE }}
      />
    );
  }

  const isSeedStage = displayStatus === 'seed';

  return (
    <button
      onClick={onClick}
      className={`
        soil-texture border border-amber-900/30
        flex items-center justify-center
        transition-all duration-200
        hover:brightness-110 hover:scale-[1.02] hover:shadow-md
        active:scale-[0.98]
        relative overflow-hidden
        ${displayStatus === 'empty' ? 'cursor-pointer' : ''}
        ${isMature ? 'cursor-pointer hover:ring-2 hover:ring-yellow-400' : ''}
      `}
      style={{ width: PLOT_SIZE, height: PLOT_SIZE }}
    >
      {/* 空地块提示 */}
      {displayStatus === 'empty' && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-40 transition-opacity duration-200">
          <span className="text-4xl text-yellow-300">+</span>
        </div>
      )}

      {/* 生长阶段图标 */}
      {icon && (
        <div
          className={`
            relative flex items-center justify-center
            ${isStageTransitioning ? 'animate-grow-transition' : ''}
          `}
        >
          {isSeedStage ? (
            <div className="w-3 h-3 rounded-full bg-green-400 animate-seed-pulse shadow-lg shadow-green-400/50" />
          ) : (
            <span
              className={`
                ${stageSize}
                ${isMature ? 'animate-ripe-breathe drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]' : ''}
                ${displayStatus === 'sprout' ? 'animate-sprout' : ''}
                ${displayStatus === 'growing' ? 'animate-growing' : ''}
                inline-block transition-all duration-300 ease-out
                select-none
              `}
              style={{
                transformOrigin: 'bottom center',
              }}
            >
              {icon}
            </span>
          )}

          {/* 成熟光晕效果 */}
          {isMature && (
            <>
              <div className="absolute inset-0 animate-ripe-glow rounded-full bg-yellow-300/30 blur-md" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 animate-ripe-notice flex items-center justify-center">
                <span className="text-[10px]">✨</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* 生长进度条 */}
      {(displayStatus === 'sprout' || displayStatus === 'growing') && (
        <div className="absolute bottom-1.5 left-2 right-2 h-1.5 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-green-500 via-green-400 to-lime-400 transition-all duration-500 rounded-full shadow-inner"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* 成熟时的闪光环 */}
      {isMature && (
        <div className="absolute inset-1 rounded border-2 border-yellow-400/50 animate-ripe-ring pointer-events-none" />
      )}
    </button>
  );
};
