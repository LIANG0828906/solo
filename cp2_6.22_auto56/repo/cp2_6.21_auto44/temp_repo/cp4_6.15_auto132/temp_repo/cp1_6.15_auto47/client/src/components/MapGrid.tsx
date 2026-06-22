import type { Plot, PlotStatus } from '../types';

interface MapGridProps {
  plots: Plot[];
  onPlotClick: (plotId: string) => void;
}

const statusColors: Record<PlotStatus, string> = {
  idle: '#66BB6A',
  claimed: '#FF9800',
  harvest: '#E53935',
};

const statusLabels: Record<PlotStatus, string> = {
  idle: '空闲',
  claimed: '已认领',
  harvest: '收获中',
};

export default function MapGrid({ plots, onPlotClick }: MapGridProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🌱 社区菜园总览地图</h2>
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, backgroundColor: statusColors.idle }} />
            <span style={styles.legendText}>空闲</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, backgroundColor: statusColors.claimed }} />
            <span style={styles.legendText}>已认领</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, backgroundColor: statusColors.harvest }} />
            <span style={styles.legendText}>收获中</span>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {plots.map((plot) => (
          <div
            key={plot.id}
            onClick={() => onPlotClick(plot.id)}
            style={{
              ...styles.plotCell,
              backgroundColor: statusColors[plot.status],
              borderLeft: plot.status === 'idle' ? '1px solid rgba(255,255,255,0.3)' : 'none',
              borderTop: plot.status === 'idle' ? '1px solid rgba(255,255,255,0.3)' : 'none',
            }}
          >
            <div style={styles.plotNumber}>{plot.plotNumber}</div>
            <div style={styles.plotStatus}>{statusLabels[plot.status]}</div>
            {plot.status !== 'idle' && plot.crop && (
              <div style={styles.plotCrop}>{plot.crop}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    backgroundColor: '#fff',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '22px',
    color: '#333',
    margin: 0,
  },
  legend: {
    display: 'flex',
    gap: '20px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendDot: {
    width: '14px',
    height: '14px',
    borderRadius: '3px',
  },
  legendText: {
    fontSize: '14px',
    color: '#666',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '8px',
  },
  plotCell: {
    aspectRatio: '1',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '8px',
    userSelect: 'none',
  },
  plotNumber: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
  },
  plotStatus: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.9)',
    marginTop: '2px',
  },
  plotCrop: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.85)',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
};
