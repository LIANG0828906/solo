import React from 'react';
import { usePaletteStore } from '../store/paletteStore';

const MixSlider: React.FC = () => {
  const addColors = usePaletteStore((state) => state.addColors);
  const ratios = usePaletteStore((state) => state.ratios);
  const setRatio = usePaletteStore((state) => state.setRatio);
  const removeAddColor = usePaletteStore((state) => state.removeAddColor);

  if (addColors.length === 0) {
    return (
      <div>
        <div className="section-title">辅助色比例</div>
        <div style={{ color: '#BDBDBD', fontSize: '13px', padding: '8px 0' }}>
          点击上方 + 添加辅助色（最多3种）
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-title">辅助色比例</div>
      <div className="slider-list">
        {addColors.map((ac, index) => (
          <div key={ac.id} className="slider-item">
            <div
              className="slider-color-dot"
              style={{ backgroundColor: ac.color.hex }}
            />
            <div className="slider-content">
              <div className="slider-header">
                <span>{ac.color.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{ratios[index] || 0}%</span>
                  <button
                    className="slider-remove"
                    onClick={() => removeAddColor(ac.id)}
                    title="移除"
                  >
                    ×
                  </button>
                </div>
              </div>
              <input
                type="range"
                className="slider-input"
                min={0}
                max={95}
                step={5}
                value={ratios[index] || 0}
                onChange={(e) => setRatio(index, parseInt(e.target.value))}
                style={{
                  background: `linear-gradient(to right, ${ac.color.hex}33 0%, ${ac.color.hex} ${(ratios[index] || 0) / 95 * 100}%, #EFE5D5 ${(ratios[index] || 0) / 95 * 100}%, #EFE5D5 100%)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MixSlider;
