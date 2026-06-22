import React from 'react';
import { SedimentLayer } from '../data/sedimentData';

interface ControlPanelProps {
  layers: SedimentLayer[];
  selectedLayerId: string | null;
  opacity: number;
  onLayerSelect: (id: string | null) => void;
  onOpacityChange: (opacity: number) => void;
  onResetView: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  layers,
  selectedLayerId,
  opacity,
  onLayerSelect,
  onOpacityChange,
  onResetView
}) => {
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.titleIcon}>⛰</div>
        <div>
          <h2 style={styles.title}>地质剖面控制台</h2>
          <p style={styles.subtitle}>Geological Section Control</p>
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>岩层种类选择</label>
        <select
          style={styles.select}
          value={selectedLayerId || ''}
          onChange={(e) => onLayerSelect(e.target.value || null)}
        >
          <option value="">-- 选择岩层高亮 --</option>
          {layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </div>

      {selectedLayer && (
        <div style={styles.layerInfo}>
          <div style={styles.layerInfoHeader}>
            <div
              style={{
                ...styles.colorSwatch,
                backgroundColor: selectedLayer.color
              }}
            />
            <span style={styles.layerName}>{selectedLayer.name}</span>
          </div>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>厚度</span>
              <span style={styles.infoValue}>{selectedLayer.thickness.toFixed(2)} ×10m</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>预估密度</span>
              <span style={styles.infoValue}>{selectedLayer.density.toFixed(1)} g/cm³</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>地质年代</span>
              <span style={styles.infoValue}>{selectedLayer.geologicalAge}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>深度范围</span>
              <span style={styles.infoValue}>
                {(selectedLayer.yStart * 10).toFixed(0)}-{(selectedLayer.yEnd * 10).toFixed(0)}m
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={styles.section}>
        <div style={styles.sliderHeader}>
          <label style={styles.label}>块体透明度</label>
          <span style={styles.sliderValue}>{opacity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.01"
          value={opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.sliderMarks}>
          <span>0.1</span>
          <span>0.5</span>
          <span>1.0</span>
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>操作指南</label>
        <div style={styles.tips}>
          <div style={styles.tipItem}>
            <span style={styles.tipIcon}>🖱</span>
            <span>左键拖拽: 旋转视角</span>
          </div>
          <div style={styles.tipItem}>
            <span style={styles.tipIcon}>🔄</span>
            <span>滚轮: 缩放场景</span>
          </div>
          <div style={styles.tipItem}>
            <span style={styles.tipIcon}>➡</span>
            <span>右键拖拽: 平移视角</span>
          </div>
          <div style={styles.tipItem}>
            <span style={styles.tipIcon}>✂</span>
            <span>Shift+左键拖拽块体: 添加切面</span>
          </div>
        </div>
      </div>

      <button style={styles.resetButton} onClick={onResetView}>
        <span style={styles.resetIcon}>⟲</span>
        重置视角与切面
      </button>

      <div style={styles.footer}>
        <span style={styles.footerText}>切面数量: {`最多3个`}</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 320,
    maxHeight: 'calc(100vh - 48px)',
    overflowY: 'auto',
    background: 'rgba(30, 34, 51, 0.75)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: 20,
    color: '#e8e8ed',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    zIndex: 100,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    lineHeight: 1.6,
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.2) transparent'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #4a90c4, #7a9c5d)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
    color: '#ffffff'
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    margin: 0,
    marginTop: 2,
    letterSpacing: 0.5
  },
  section: {
    marginBottom: 20
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#ffffff',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease-out'
  },
  layerInfo: {
    background: 'rgba(74, 144, 196, 0.12)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    border: '1px solid rgba(74, 144, 196, 0.3)'
  },
  layerInfoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 7,
    border: '2px solid rgba(255,255,255,0.3)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  },
  layerName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#ffffff'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  infoLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  infoValue: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 500
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sliderValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#4a90c4',
    fontFamily: 'monospace'
  },
  slider: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    background: 'rgba(255,255,255,0.1)',
    outline: 'none',
    cursor: 'pointer',
    accentColor: '#4a90c4',
    marginTop: 6
  },
  sliderMarks: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
    fontFamily: 'monospace'
  },
  tips: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  tipItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)'
  },
  tipIcon: {
    fontSize: 14,
    width: 20,
    textAlign: 'center'
  },
  resetButton: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #4a90c4, #357abd)',
    border: 'none',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s ease-out',
    marginTop: 4
  },
  resetIcon: {
    fontSize: 16
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    textAlign: 'center'
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)'
  }
};

export default ControlPanel;
