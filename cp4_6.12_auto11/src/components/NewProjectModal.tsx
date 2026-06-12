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

        <div