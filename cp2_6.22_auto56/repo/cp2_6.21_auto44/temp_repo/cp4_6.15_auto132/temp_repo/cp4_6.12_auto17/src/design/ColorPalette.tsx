import { useDesignStore, STITCH_NAMES, StitchType } from './designStore';

const STITCH_ICONS: Record<StitchType, string> = {
  0: '✕',
  1: '╱',
  2: '╲',
  3: '○',
  4: '●'
};

export default function ColorPalette() {
  const { activeStitch, activeColor, palette, setActiveStitch, setActiveColor } = useDesignStore();

  const stitches: StitchType[] = [0, 1, 2, 3, 4];

  return (
    <div className="palette-wrapper card">
      <div className="palette-section">
        <h3 className="palette-title">针法选择</h3>
        <div className="stitch-grid">
          {stitches.map(stitch => (
            <button
              key={stitch}
              className={`stitch-btn ${activeStitch === stitch ? 'active' : ''}`}
              onClick={() => setActiveStitch(stitch)}
              title={STITCH_NAMES[stitch]}
            >
              <span className="stitch-icon">{STITCH_ICONS[stitch]}</span>
              <span className="stitch-label">{STITCH_NAMES[stitch]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="palette-section">
        <h3 className="palette-title">纱线配色</h3>
        <div className="color-grid">
          {palette.map((color, index) => (
            <button
              key={index}
              className={`color-btn ${activeColor === color ? 'active' : ''}`}
              onClick={() => setActiveColor(color)}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="palette-section">
        <h3 className="palette-title">当前选择</h3>
        <div className="current-selection">
          <div className="current-color-preview" style={{ backgroundColor: activeColor }} />
          <div className="current-info">
            <div className="current-label">颜色: {activeColor}</div>
            <div className="current-label">针法: {STITCH_NAMES[activeStitch]}</div>
          </div>
        </div>
      </div>

      <style>{`
        .palette-wrapper {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .palette-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .palette-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-dark);
          margin: 0;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--border);
        }
        .stitch-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .stitch-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: white;
          transition: all 0.2s ease-out;
        }
        .stitch-btn:hover {
          border-color: var(--secondary);
          background: var(--background);
        }
        .stitch-btn.active {
          border-color: var(--primary);
          background: var(--background);
          box-shadow: 0 0 0 2px rgba(139, 115, 85, 0.2);
        }
        .stitch-icon {
          font-size: 20px;
          color: var(--primary-dark);
        }
        .stitch-label {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .color-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          justify-items: center;
        }
        .color-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid transparent;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: all 0.2s ease-out;
        }
        .color-btn:hover {
          transform: scale(1.1);
        }
        .color-btn.active {
          border-color: var(--primary-dark);
          box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.3), 0 2px 6px rgba(0,0,0,0.15);
        }
        .current-selection {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--background);
          border-radius: 8px;
        }
        .current-color-preview {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          box-shadow: inset 0 0 0 2px rgba(0,0,0,0.1);
        }
        .current-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .current-label {
          font-size: 13px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
