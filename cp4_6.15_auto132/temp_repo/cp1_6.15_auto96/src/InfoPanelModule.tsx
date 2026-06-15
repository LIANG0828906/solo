import React, { useState } from 'react';
import { LayerData } from './CanvasModule';

interface InfoPanelModuleProps {
  layers: LayerData[];
  onDeleteLayer: (id: string) => void;
}

const InfoPanelModule: React.FC<InfoPanelModuleProps> = ({ layers, onDeleteLayer }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const sortedLayers = [...layers].sort((a, b) => b.timestamp - a.timestamp);

  const getCenterColor = () => {
    if (layers.length === 0) return '#F5F0E6';
    return layers[layers.length - 1].colorHex;
  };

  const handleDelete = (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    onDeleteLayer(id);
    setTimeout(() => {
      setDeletingId(null);
    }, 300);
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
            <span style={styles.emptyText}>暂无叠色层，从左侧拖拽颜色到画布</span>
          ) : (
            sortedLayers.map((layer, index) => (
              <div
                key={layer.id}
                onClick={() => handleDelete(layer.id)}
                style={{
                  ...styles.layerItem,
                  ...(deletingId === layer.id ? styles.layerItemDeleting : {}),
                  opacity: deletingId === layer.id ? 0 : 1,
                  transform: deletingId === layer.id ? 'scale(0.8)' : 'scale(1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={styles.layerColorWrapper}>
                  <div
                    style={{
                      ...styles.layerColor,
                      backgroundColor: layer.colorHex,
                      border: layer.colorHex === '#FFFFFF' ? '1px solid #D4C4A8' : 'none'
                    }}
                  />
                  {deletingId === layer.id && (
                    <div style={styles.deleteRing}>
                      <div style={styles.deleteRingInner} />
                    </div>
                  )}
                </div>
                <div style={styles.layerInfo}>
                  <span style={styles.layerBrand}>{layer.brandName}</span>
                  <span style={styles.layerName}>{layer.colorName}</span>
                </div>
                <span style={styles.layerOpacity}>{Math.round(layer.opacity * 100)}%</span>
                <div style={styles.deleteHint}>
                  <span style={styles.deleteHintText}>点击删除</span>
                </div>
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
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '8px',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
    marginTop: '16px',
    maxHeight: '120px',
    minHeight: '80px'
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
    position: 'relative' as const,
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
  layerItemDeleting: {
    opacity: 0,
    transform: 'scale(0.8)',
    transition: 'all 0.3s ease'
  },
  layerColorWrapper: {
    position: 'relative' as const,
    width: '28px',
    height: '28px'
  },
  layerColor: {
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  deleteRing: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '28px',
    height: '28px',
    pointerEvents: 'none' as const
  },
  deleteRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '2px solid #E63946',
    animation: 'ringExpand 0.3s ease-out forwards'
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
  deleteHint: {
    position: 'absolute' as const,
    top: '2px',
    right: '2px',
    opacity: 0,
    transition: 'opacity 0.2s ease'
  },
  deleteHintText: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '8px',
    color: '#E63946'
  },
  emptyText: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '12px',
    color: '#A09080',
    fontStyle: 'italic',
    padding: '10px 0'
  }
};

export default InfoPanelModule;
