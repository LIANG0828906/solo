import { useAppStore, GeometryType, TextureType } from './store';

const textureLabels: Record<TextureType, string> = {
  wood: '木纹',
  stone: '石材',
  metal: '金属拉丝',
  fabric: '布艺编织',
  camo: '迷彩',
};

const geometryLabels: Record<GeometryType, string> = {
  sphere: '球体',
  box: '立方体',
  cylinder: '圆柱体',
  torus: '环面',
};

export default function ControlPanel() {
  const {
    geometryType,
    materialParams,
    setGeometryType,
    setColor,
    setMetalness,
    setRoughness,
    setTextureScale,
    setTextureType,
  } = useAppStore();

  const handleColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setColor(value);
    }
  };

  return (
    <div className="control-panel" style={styles.panel}>
      <h3 style={styles.title}>材质参数</h3>

      <div style={styles.section}>
        <label style={styles.label}>几何体类型</label>
        <select
          value={geometryType}
          onChange={(e) => setGeometryType(e.target.value as GeometryType)}
          style={styles.select}
        >
          {Object.entries(geometryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>纹理类型</label>
        <select
          value={materialParams.textureType}
          onChange={(e) => setTextureType(e.target.value as TextureType)}
          style={styles.select}
        >
          {Object.entries(textureLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>颜色基调</label>
        <div style={styles.colorRow}>
          <input
            type="color"
            value={materialParams.color}
            onChange={(e) => setColor(e.target.value)}
            style={styles.colorPicker}
          />
          <input
            type="text"
            value={materialParams.color.toUpperCase()}
            onChange={handleColorInput}
            style={styles.colorInput}
            placeholder="#FFFFFF"
            maxLength={7}
          />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sliderHeader}>
          <label style={styles.label}>金属度</label>
          <span style={styles.value}>{materialParams.metalness.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={materialParams.metalness}
          onChange={(e) => setMetalness(parseFloat(e.target.value))}
          style={styles.slider}
        />
      </div>

      <div style={styles.section}>
        <div style={styles.sliderHeader}>
          <label style={styles.label}>粗糙度</label>
          <span style={styles.value}>{materialParams.roughness.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={materialParams.roughness}
          onChange={(e) => setRoughness(parseFloat(e.target.value))}
          style={styles.slider}
        />
      </div>

      <div style={styles.section}>
        <div style={styles.sliderHeader}>
          <label style={styles.label}>纹理缩放</label>
          <span style={styles.value}>{materialParams.textureScale.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={5.0}
          step={0.1}
          value={materialParams.textureScale}
          onChange={(e) => setTextureScale(parseFloat(e.target.value))}
          style={styles.slider}
        />
      </div>

      <div style={styles.infoSection}>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>当前纹理:</span>
          <span style={styles.infoValue}>{textureLabels[materialParams.textureType]}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>几何体:</span>
          <span style={styles.infoValue}>{geometryLabels[geometryType]}</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    right: 0,
    top: 0,
    width: '200px',
    height: '100%',
    background: 'rgba(30, 30, 40, 0.9)',
    backdropFilter: 'blur(10px)',
    padding: '20px 16px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    borderLeft: '1px solid rgba(100, 181, 246, 0.2)',
    zIndex: 100,
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#e0e0e0',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #64B5F6',
    fontFamily: "'Microsoft YaHei', 'Segoe UI', sans-serif",
  },
  section: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#b0b0b0',
    marginBottom: '8px',
    fontWeight: 500,
  },
  select: {
    width: '100%',
    fontSize: '13px',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  colorPicker: {
    flexShrink: 0,
  },
  colorInput: {
    flex: 1,
    fontSize: '13px',
    textTransform: 'uppercase',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  slider: {
    width: '100%',
  },
  value: {
    fontSize: '13px',
    color: '#64B5F6',
    fontWeight: 600,
    minWidth: '40px',
    textAlign: 'right',
  },
  infoSection: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(100, 181, 246, 0.2)',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '12px',
  },
  infoLabel: {
    color: '#808080',
  },
  infoValue: {
    color: '#e0e0e0',
    fontWeight: 500,
  },
};
