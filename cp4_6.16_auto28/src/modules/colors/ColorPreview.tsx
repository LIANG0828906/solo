import React, { memo } from 'react';
import './ColorPreview.css';

interface ColorPreviewProps {
  colors: string[];
}

const ColorPreview: React.FC<ColorPreviewProps> = memo(({ colors }) => {
  return (
    <div className="color-preview">
      <h3 className="preview-title">实时预览</h3>
      <div className="preview-colors">
        {colors.map((color, index) => (
          <div
            key={index}
            className="preview-color-item"
            style={{
              backgroundColor: color,
              transitionDelay: `${index * 30}ms`,
            }}
          >
            <span className="color-label">{color.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

ColorPreview.displayName = 'ColorPreview';

export default ColorPreview;
