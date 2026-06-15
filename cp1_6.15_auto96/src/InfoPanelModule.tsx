import React from 'react';
import { LayerData } from './CanvasModule';

interface InfoPanelModuleProps {
  layers: LayerData[];
  onDeleteLayer: (id: string) => void;
}

const InfoPanelModule: React.FC<InfoPanelModuleProps> = ({ layers, onDeleteLayer }) => {
  const sortedLayers = [...layers].sort((a, b) => b.timestamp - a.timestamp);

  const getCenterColor = () => {
    if (layers.length === 0) return '#F5F0E6';
    return layers[layers.length - 1].colorHex;
  };

  return (
    <div style={styles.container}>
      <div style={styles.currentColorSection}>
        <div style={styles.colorPreviewLabel}>当前颜色</div>
        <div style={{ ...styles.colorPreview, backgroundColor: getCenterColor() }} />
      </div>
      <div style={styles.divider} />
      <div style={styles.layersSection}>
        <div style={styles.layersLabel}>叠色层 ({layers.length})</div>
        <div style={styles.layersList}>
          {sortedLayers.length === 0 ? (
            <span style={styles.emptyText}>暂无叠色层</span>
          ) : (
            sortedLayers.map((layer, index) => (
              <div
                key={layer.id}
                style={styles.layerItem}
                onClick={() => onDeleteLayer(layer.id)}
              >
                <div
                  style={{
                    ...styles.layerColor,
                    backgroundColor: layer.colorHex,
                    border: layer.colorHex === '#FFFFFF' ? '1px solid #D4C4A8' : 'none'
                  }}
                />
                <div style={styles.layerInfo}>
                  <span style={styles.layerBrand}>{layer.brandName}</span>
                  <span style={styles.layerName}>{layer.colorName}</span>
                </div>
                <span style={styles.layerOpacity}>{Math.round(layer.opacity * 100)}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '12px 20px',
    backgroundColor: 'rgba(255, 250, 240, 0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
    marginTop: '16px',
    maxHeight: '120px'
  },
  currentColorSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '6px'
  },
  colorPreviewLabel: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '11px',
    color: '#6B5D4D'
  },
  colorPreview: {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    border: '2px solid #FFFAF0'
  },
  divider: {
    width: '1px',
    height: '50px',
    backgroundColor: '#D4C4A8'
  },
  layersSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    minWidth: 0
  },
  layersLabel: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '11px',
    color: '#6B5D4D'
  },
  layersList: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto' as const,
    paddingBottom: '4px',
    scrollbarWidth: 'thin' as const
  },
  layerItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    padding: '8px',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '80px',
    flexShrink: 0 as const
  },
  layerColor: {
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  layerInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '2px'
  },
  layerBrand: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '9px',
    color: '#8B7355'
  },
  layerName: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '10px',
    color: '#4A3F35',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '70px'
  },
  layerOpacity: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '10px',
    color: '#6B5D4D'
  },
  emptyText: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '12px',
    color: '#A09080',
    fontStyle: 'italic'
  }
};

export default InfoPanelModule;
