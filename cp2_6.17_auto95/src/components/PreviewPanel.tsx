import { memo } from 'react';
import type { Palette } from '../types';
import { Eye } from 'lucide-react';

interface PreviewPanelProps {
  palette: Palette | null;
}

function areEqual(prev: PreviewPanelProps, next: PreviewPanelProps) {
  if (prev.palette === next.palette) return true;
  if (!prev.palette || !next.palette) return false;
  if (prev.palette.id !== next.palette.id) return false;
  if (prev.palette.colors.length !== next.palette.colors.length) return false;
  return prev.palette.colors.every(
    (c, i) => c.hex === next.palette!.colors[i].hex
  );
}

const PreviewPanelInner = ({ palette }: PreviewPanelProps) => {
  if (!palette || palette.colors.length === 0) {
    return (
      <div className="preview-panel empty">
        <div className="empty-state">
          <Eye size={48} className="empty-icon" />
          <p>选择一个色板开始预览</p>
          <span className="empty-hint">添加颜色后会实时显示效果</span>
        </div>
      </div>
    );
  }

  const primaryColor = palette.colors[0]?.hex || '#4A90D9';
  const textColor = palette.colors[2]?.hex || '#333333';
  const gradientColors = palette.colors.slice(0, 2);
  const gradient =
    gradientColors.length >= 2
      ? `linear-gradient(to right, ${gradientColors[0].hex}, ${gradientColors[1].hex})`
      : gradientColors.length === 1
      ? gradientColors[0].hex
      : '#4A90D9';

  return (
    <div className="preview-panel">
      <h3 className="preview-title">主题预览</h3>

      <div className="preview-section">
        <label className="preview-label">按钮 Button</label>
        <button className="preview-button" style={{ backgroundColor: primaryColor }}>
          主要操作
        </button>
      </div>

      <div className="preview-section">
        <label className="preview-label">标题 Heading</label>
        <h2 className="preview-heading" style={{ color: primaryColor }}>
          这是一段标题文字
        </h2>
      </div>

      <div className="preview-section">
        <label className="preview-label">正文 Body Text</label>
        <p className="preview-body" style={{ color: textColor }}>
          这是一段示例正文文字，用于展示颜色在实际文本中的显示效果。配色方案的选择直接影响用户的阅读体验。
        </p>
      </div>

      <div className="preview-section">
        <label className="preview-label">渐变背景 Gradient</label>
        <div
          className="preview-gradient"
          style={{ background: gradient }}
        />
      </div>

      <div className="preview-colors-list">
        {palette.colors.map((color) => (
          <div key={color.id} className="preview-color-item">
            <div
              className="preview-color-swatch"
              style={{ backgroundColor: color.hex }}
            />
            <div className="preview-color-info">
              <span className="preview-color-hex">{color.hex}</span>
              {color.label && <span className="preview-color-label">{color.label}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PreviewPanel = memo(PreviewPanelInner, areEqual);
