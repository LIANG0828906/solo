import React, { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import ColorPreview from './ColorPreview';
import { usePaletteStore } from '@/stores/usePaletteStore';
import { savePalette } from '@/utils/indexedDB';
import './ColorEditor.css';

interface ColorInputRowProps {
  index: number;
  color: string;
  onColorChange: (index: number, color: string) => void;
  onHexInput: (index: number, value: string) => void;
}

const ColorInputRow: React.FC<ColorInputRowProps> = memo(({ index, color, onColorChange, onHexInput }) => {
  return (
    <div className="color-input-row">
      <span className="color-index">{index + 1}</span>
      <div className="color-picker-wrapper">
        <input
          type="color"
          className="color-picker"
          value={color}
          onChange={(e) => onColorChange(index, e.target.value)}
        />
        <div
          className="color-preview-swatch"
          style={{ backgroundColor: color }}
        />
      </div>
      <input
        type="text"
        className="hex-input"
        value={color.toUpperCase()}
        onChange={(e) => onHexInput(index, e.target.value)}
        placeholder="#FFFFFF"
        maxLength={7}
      />
    </div>
  );
});

ColorInputRow.displayName = 'ColorInputRow';

const ColorEditor: React.FC = () => {
  const navigate = useNavigate();
  const { currentColors, setColor, setCurrentColors } = usePaletteStore(
    (state) => ({
      currentColors: state.currentColors,
      setColor: state.setColor,
      setCurrentColors: state.setCurrentColors,
    })
  );
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleColorChange = useCallback(
    (index: number, color: string) => {
      const currentColors = usePaletteStore.getState().currentColors;
      const validColor = /^#[0-9A-Fa-f]{6}$/.test(color)
        ? color
        : /^#[0-9A-Fa-f]{3}$/.test(color)
        ? color
        : currentColors[index];
      setColor(index, validColor);
    },
    [setColor]
  );

  const handleHexInput = useCallback(
    (index: number, value: string) => {
      let hex = value.trim();
      if (!hex.startsWith('#')) {
        hex = '#' + hex;
      }
      handleColorChange(index, hex);
    },
    [handleColorChange]
  );

  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const handleRandomize = useCallback(() => {
    const randomColors = Array.from({ length: 5 }, () => {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 50 + Math.floor(Math.random() * 30);
      const lightness = 45 + Math.floor(Math.random() * 20);
      return hslToHex(hue, saturation, lightness);
    });
    setCurrentColors(randomColors);
  }, [setCurrentColors]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('请输入色卡标题');
      return;
    }
    setIsSaving(true);
    try {
      const palette = await savePalette({
        title: title.trim(),
        colors: currentColors,
      });
      navigate(`/palette/${palette.id}`);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="color-editor-container">
      <div className="editor-header">
        <h1 className="editor-title">创建配色方案</h1>
        <p className="editor-subtitle">
          选择5个颜色，打造属于你的创意配色
        </p>
      </div>

      <div className="editor-content">
        <div className="editor-panel">
          <div className="title-input-wrapper">
            <label className="input-label">色卡标题</label>
            <input
              type="text"
              className="title-input"
              placeholder="给你的配色起个名字..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="color-inputs-container">
            {currentColors.map((color, index) => (
              <ColorInputRow
                key={index}
                index={index}
                color={color}
                onColorChange={handleColorChange}
                onHexInput={handleHexInput}
              />
            ))}
          </div>

          <div className="editor-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRandomize}
            >
              🎲 随机配色
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '💾 发布色卡'}
            </button>
          </div>
        </div>

        <div className="preview-panel">
          <ColorPreview colors={currentColors} />
        </div>
      </div>
    </div>
  );
};

export default ColorEditor;
