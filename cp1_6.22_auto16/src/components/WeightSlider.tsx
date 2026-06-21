import React, { useState } from 'react';
import type { Dimension, WeightMultipliers } from '../types';
import '../styles/WeightSlider.css';

interface WeightSliderProps {
  dimensions: Dimension[];
  multipliers: WeightMultipliers;
  onChange: (dimensionId: string, value: number) => void;
}

const WeightSlider: React.FC<WeightSliderProps> = ({
  dimensions,
  multipliers,
  onChange,
}) => {
  const [activeSlider, setActiveSlider] = useState<string | null>(null);

  return (
    <div className="weight-slider-panel">
      <h3 className="weight-slider__title">权重调整</h3>
      <p className="weight-slider__subtitle">调整各维度权重倍率 (0.5x - 2x)</p>

      <div className="weight-slider-list">
        {dimensions.map((dim, index) => {
          const value = multipliers[dim.id] ?? 1;
          const percentage = ((value - 0.5) / 1.5) * 100;

          return (
            <div
              key={dim.id}
              className="weight-slider-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="weight-slider-label">
                <span className="weight-dim-name">{dim.name}</span>
                <span className="weight-base">基础: {dim.weight}</span>
              </div>

              <div className="weight-slider-wrapper">
                <span
                  className={`weight-value-bubble ${
                    activeSlider === dim.id ? 'weight-value-bubble--active' : ''
                  }`}
                  style={{ left: `${percentage}%` }}
                >
                  {value.toFixed(1)}x
                </span>

                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={value}
                  onChange={(e) => onChange(dim.id, parseFloat(e.target.value))}
                  onMouseDown={() => setActiveSlider(dim.id)}
                  onMouseUp={() => setActiveSlider(null)}
                  onTouchStart={() => setActiveSlider(dim.id)}
                  onTouchEnd={() => setActiveSlider(null)}
                  className="weight-range-slider"
                  style={{
                    background: `linear-gradient(
                      to right,
                      #10b981 0%,
                      #34d399 ${percentage}%,
                      rgba(255, 255, 255, 0.15) ${percentage}%,
                      rgba(255, 255, 255, 0.15) 100%
                    )`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="weight-reset-btn" onClick={() => {
        dimensions.forEach(dim => onChange(dim.id, 1));
      }}>
        重置权重
      </div>
    </div>
  );
};

export default WeightSlider;
