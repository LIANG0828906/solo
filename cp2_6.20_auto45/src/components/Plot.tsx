import React from 'react';
import { Plot as PlotType, useGameStore } from '../stores/useGameStore';

interface PlotProps {
  plot: PlotType;
  isOccupied: boolean;
  buildingId?: string;
  onClick: () => void;
}

const PLOT_SIZE = 64;

export const Plot: React.FC<PlotProps> = ({ plot, isOccupied, buildingId, onClick }) => {
  const { getPlotStatus, getCropType, getPlotGrowthProgress } = useGameStore();

  const status = buildingId ? 'building' : getPlotStatus(plot);
  const cropType = plot.cropId ? getCropType(plot.cropId) : undefined;
  const progress = getPlotGrowthProgress(plot);

  const getPlotIcon = (): string => {
    if (isOccupied) return '';
    switch (status) {
      case 'seed':
        return '•';
      case 'sprout':
        return '🌱';
      case 'growing':
        return '🌿';
      case 'mature':
        return cropType?.matureIcon || '🌾';
      default:
        return '';
    }
  };

  const getIconSize = (): string => {
    switch (status) {
      case 'seed':
        return 'text-2xl';
      case 'sprout':
        return 'text-2xl';
      case 'growing':
        return 'text-3xl';
      case 'mature':
        return 'text-4xl';
      default:
        return 'text-xl';
    }
  };

  const icon = getPlotIcon();
  const isMature = status === 'mature';

  if (isOccupied) {
    return (
      <div
        className="soil-texture border border-amber-900/30"
        style={{ width: PLOT_SIZE, height: PLOT_SIZE }}
      />
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        soil-texture border border-amber-900/30
        flex items-center justify-center
        transition-all duration-200
        hover:brightness-110 hover:scale-[1.02]
        active:scale-[0.98]
        relative
        ${status === 'empty' ? 'cursor-pointer' : ''}
        ${isMature ? 'cursor-pointer' : ''}
      `}
      style={{ width: PLOT_SIZE, height: PLOT_SIZE }}
    >
      {icon && (
        <span
          className={`
            ${getIconSize()}
            ${status === 'seed' ? 'text-green-300 font-bold' : ''}
            ${isMature ? 'animate-breathe drop-shadow-lg' : ''}
            transition-all duration-300
            animate-scale-pop
          `}
          style={{ animationDelay: `${(plot.x + plot.y) * 20}ms` }}
        >
          {icon}
        </span>
      )}

      {(status === 'growing' || status === 'sprout') && (
        <div className="absolute bottom-1 left-1 right-1 h-1 bg-black/30 rounded-full overflow-hidden">
          <div
            className="h-full order-progress-gradient transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {isMature && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75" />
      )}
    </button>
  );
};
