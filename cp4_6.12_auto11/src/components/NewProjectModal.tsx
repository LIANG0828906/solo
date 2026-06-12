import React, { useState } from 'react';

interface NewProjectModalProps {
  onClose: () => void;
  onSubmit: (data: { name: string; widthCm: number; heightCm: number; gridCols: number; gridRows: number }) => void;
}

const PRESET_SIZES = [
  { name: '小型抱枕', w: 40, h: 40 },
  { name: '桌旗', w: 100, h: 35 },
  { name: '中型挂毯', w: 60, h: 80 },
  { name: '标准被面', w: 150, h: 200 },
  { name: '大型壁饰', w: 120, h: 150 },
];

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('我的拼布作品');
  const [widthCm, setWidthCm] = useState(50);
  const [heightCm, setHeightCm] = useState(60);
  const [gridCols, setGridCols] = useState(10);
  const [gridRows, setGridRows] = useState(12);

  const handlePreset = (preset: typeof PRESET_SIZES[0]) => {
    setName(preset.name);
    setWidthCm(preset.w);
    setHeightCm(preset.h);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      widthCm: Math.max(10, widthCm),
      heightCm: Math.max(10, heightCm),
      gridCols: Math.min(20, Math.max(5, gridCols)),
      gridRows: Math.min(20, Math.max(5, gridRows)),
    });
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>✨ 创建新项目</div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.field}>
            <label style={styles.label}>项目名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              maxLength={50}
            />
          </div>

          <div style={styles.presetLabel}>快速选择：</div>
          <div style={styles.presets}>
            {PRESET_SIZES.map((p) => (
              <button
                key={p.name}
                onClick={() => handlePreset(p)}
                style={{
                  ...styles.presetBtn,
                  background: name === p.name ? 'linear-gradient(135deg, #B87333, #A6622A)' : '#F5F0E8',
                  color: name === p.name ? '#FFFAF4' : '#5D4037',
                }}
              >
                {p.name}
                <span style={styles.presetSize}>{p.w}×{p.h}cm</span>
              </button>
            ))}
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>成品宽度 (cm)</label>
              <input
                type="number"
                min={10}
                value={widthCm}
                onChange={(e) => setWidthCm(Number(e.target.value))}
                style={styles.input}
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>成品高度 (cm)</label>
              <input
                type="number"
                min={10}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>横向网格数 (最大20)</label>
              <input
                type="number"
                min={5}
                max={20}
                value={gridCols}
                onChange={(e) => setGridCols(Number(e.target.value))}
                style={styles.input}
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>纵向网格数 (最大20)</label>
              <input
                type="number"
                min={5}
                max={20}
                value={gridRows}
                onChange={(e) => setGridRows(Number(e.target.value))}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.preview}>
            <div style={styles.previewLabel}>预览：约 {gridCols}×{gridRows} = {gridCols * gridRows} 格</div>
            <div
              style={{
                ...styles.previewBox,
                aspectRatio: `${widthCm} / ${heightCm}`,
              }}
            >
              <div
                style={{
                  ...styles.previewGrid,
                  gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                  gridTemplateRows: `repeat(${gridRows}, 1fr)`,
                }}
              >
                {Array.from({ length: gridCols * gridRows }).map((_, i) => (
                  <div key={i} style={styles.previewCell} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.cancelBtn}>取消</button>
          <button onClick={handleSubmit} style={styles.submitBtn}>创建项目</button>
        </div>
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    zIndex: 400,
    animation: 'fadeIn 0.3s ease',
  },
  modal: {
    position: 'fixed',
    left: '50%',
    bottom: 0,
    transform: 'translateX(-50%)',
    width: 560,
    maxWidth: '95vw',
    maxHeight: '85vh',
    background: '#FFFAF4',
    borderRadius: '20px 20px 0 0',
    boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.2)',
    zIndex: 401,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideUp 0.35s ease',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid #E8DDD0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#5D4037',
  },
  closeBtn: {
    border: 'none',
    background: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: '#8D6E63',
    padding: 4,
  },
  modalBody: {
    padding: 24,
    overflowY: 'auto',
    flex: 1,
  },
  field: {
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#5D4037',
  },
  input: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #D7C4A1',
    background: '#FFFAF4',
    fontSize: 14,
    color: '#5D4037',
    outline: 'none',
    fontFamily: 'inherit',
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#8D6E63',
    marginBottom: 8,
  },
  presets: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetBtn: {
    padding: '8px 14px',
    borderRadius: 16,
    border: 'none',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  presetSize: {
    fontSize: 10,
    opacity: 0.8,
  },
  row: {
    display: 'flex',
    gap: 12,
  },
  preview: {
    marginTop: 8,
    background: '#F5F0E8',
    padding: 16,
    borderRadius: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#5D4037',
    marginBottom: 12,
  },
  previewBox: {
    width: '100%',
    maxHeight: 200,
    background: '#FFFAF4',
    borderRadius: 8,
    border: '1px solid #D7C4A1',
    padding: 4,
    overflow: 'hidden',
  },
  previewGrid: {
    display: 'grid',
    gap: 1,
    background: '#8D6E63',
    width: '100%',
    height: '100%',
  },
  previewCell: {
    background: '#F5F0E8',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '16px 24px',
    borderTop: '1px solid #E8DDD0',
    background: '#FFFAF4',
  },
  cancelBtn: {
    padding: '10px 24px',
    borderRadius: 10,
    border: '1px solid #D7C4A1',
    background: 'transparent',
    color: '#5D4037',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  submitBtn: {
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #B87333 0%, #A6622A 100%)',
    color: '#FFFAF4',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(184, 115, 51, 0.3)',
    fontFamily: 'inherit',
  },
};

export default NewProjectModal;
