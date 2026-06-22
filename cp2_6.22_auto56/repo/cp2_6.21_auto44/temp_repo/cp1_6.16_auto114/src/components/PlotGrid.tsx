import React, { memo } from 'react';
import { Sprout, Leaf, Apple } from 'lucide-react';
import { useGardenStore } from '../store/gardenStore';
import type { Plot, PlotStatus } from '../types';
import './PlotGrid.css';

const STATUS_COLORS: Record<PlotStatus, string> = {
  idle: '#D2B48C',
  planted: '#8FBC8F',
  harvestable: '#F0E68C'
};

const STATUS_ICON_BG: Record<PlotStatus, string> = {
  idle: '#C4A574',
  planted: '#6FA86F',
  harvestable: '#E6D84A'
};

interface PlotCellProps {
  plot: Plot;
  isSelected: boolean;
  onClick: () => void;
}

const PlotCell: React.FC<PlotCellProps> = memo(({ plot, isSelected, onClick }) => {
  const bgColor = STATUS_COLORS[plot.status];
  const iconBg = STATUS_ICON_BG[plot.status];

  const renderStatusIcon = () => {
    const cls = 'plot-cell__icon';
    if (plot.status === 'idle') return <Sprout className={cls} size={22} strokeWidth={2.2} color="#5D4037" />;
    if (plot.status === 'planted') return <Leaf className={cls} size={22} strokeWidth={2.2} color="#2E7D32" />;
    return <Apple className={cls} size={22} strokeWidth={2.2} color="#E65100" />;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'plot-cell',
        isSelected ? 'plot-cell--selected' : '',
        plot.highlight ? 'plot-cell--highlight' : '',
        plot.waterDrop ? 'plot-cell--water' : '',
        plot.exchangeable ? 'plot-cell--exchange' : ''
      ].join(' ')}
      style={{
        backgroundColor: bgColor,
        '--plot-icon-bg': iconBg
      } as React.CSSProperties}
      aria-label={`地块(${plot.row + 1},${plot.col + 1})`}
    >
      <div className="plot-cell__badge-top-left">{plot.row + 1},{plot.col + 1}</div>
      {plot.status !== 'idle' && (
        <div className="plot-cell__avatar" title={plot.ownerName}>
          {plot.ownerAvatar}
        </div>
      )}
      <div className="plot-cell__icon-wrap">{renderStatusIcon()}</div>
      {plot.status !== 'idle' && plot.cropName && (
        <div className="plot-cell__crop-name">{plot.cropName}</div>
      )}
      {plot.status === 'idle' && (
        <div className="plot-cell__hint">点击认领</div>
      )}
      {plot.exchangeable && (
        <div className="plot-cell__exchange-tag">可交换</div>
      )}
      {plot.waterDrop && <span className="plot-cell__water-drop" />}
    </button>
  );
});

PlotCell.displayName = 'PlotCell';

export const PlotGrid: React.FC = () => {
  const plots = useGardenStore(s => s.plots);
  const selectedPlotId = useGardenStore(s => s.selectedPlotId);
  const claimPlot = useGardenStore(s => s.claimPlot);
  const selectPlot = useGardenStore(s => s.selectPlot);
  const openExchangeModal = useGardenStore(s => s.openExchangeModal);

  const handlePlotClick = (plot: Plot) => {
    if (plot.status === 'idle') {
      claimPlot(plot.id);
    } else if (plot.exchangeable && selectedPlotId && selectedPlotId !== plot.id) {
      openExchangeModal(plot.id);
    } else {
      selectPlot(plot.id);
    }
  };

  return (
    <div className="plot-grid-wrapper">
      <div className="plot-grid-header">
        <h2>🌾 菜园地块总览 · 6 × 6</h2>
        <div className="plot-grid-legend">
          <span className="legend-item"><i style={{ background: STATUS_COLORS.idle }} />空闲</span>
          <span className="legend-item"><i style={{ background: STATUS_COLORS.planted }} />已种植</span>
          <span className="legend-item"><i style={{ background: STATUS_COLORS.harvestable }} />待收获</span>
        </div>
      </div>
      <div className="plot-grid">
        {plots.map(plot => (
          <PlotCell
            key={plot.id}
            plot={plot}
            isSelected={selectedPlotId === plot.id}
            onClick={() => handlePlotClick(plot)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlotGrid;
