import React, { useMemo } from 'react';
import { useCanvasStore } from './store';
import { generateColorSchemes, pickTextColor } from '../utils/colorAnalysis';

const ColorPicker: React.FC = () => {
  const covers = useCanvasStore(s => s.covers);
  const backgroundColor = useCanvasStore(s => s.backgroundColor);
  const setBackgroundColor = useCanvasStore(s => s.setBackgroundColor);

  const schemes = useMemo(() => {
    const baseColors = covers.map(c => c.album.primaryColor);
    if (baseColors.length === 0) baseColors.push('#3E2723');
    return generateColorSchemes(baseColors);
  }, [covers]);

  return (
    <div className="color-picker">
      <div className="color-picker-title">
        <span className="dot" />
        <span>智能配色方案</span>
      </div>
      <div className="color-schemes">
        {schemes.map(scheme => (
          <div key={scheme.id} className="scheme-group">
            <div className="scheme-label">{scheme.name}</div>
            <div className="scheme-swatches">
              {scheme.colors.map((color, idx) => {
                const active = color.toLowerCase() === backgroundColor.toLowerCase();
                return (
                  <button
                    key={idx}
                    className={`swatch ${active ? 'active' : ''}`}
                    style={{ backgroundColor: color, color: pickTextColor(color) }}
                    onClick={() => setBackgroundColor(color)}
                    title={`应用背景色: ${color}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
