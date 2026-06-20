import React, { useState } from 'react';
import { InterpolatedProperties, Keyframe } from '../types';
import { getCurrentKeyframe } from '../utils/interpolation';

interface PreviewProps {
  interpolatedProps: InterpolatedProperties;
  keyframes: Keyframe[];
  currentTime: number;
  onCurrentFrameChange?: (frame: Keyframe | null) => void;
}

type ShapeType = 'square' | 'circle' | 'rounded';

export const Preview: React.FC<PreviewProps> = ({
  interpolatedProps,
  keyframes,
  currentTime,
  onCurrentFrameChange,
}) => {
  const [initialColor, setInitialColor] = useState('#e94560');
  const [shape, setShape] = useState<ShapeType>('square');

  const currentFrame = getCurrentKeyframe(keyframes, currentTime);
  
  React.useEffect(() => {
    onCurrentFrameChange?.(currentFrame);
  }, [currentFrame, onCurrentFrameChange]);

  const getBorderRadius = () => {
    switch (shape) {
      case 'circle':
        return '50%';
      case 'rounded':
        return '16px';
      default:
        return '8px';
    }
  };

  const backgroundColor = interpolatedProps.backgroundColor || initialColor;

  return (
    <div className="preview-container">
      <div className="preview-stage">
        <div
          className="preview-box"
          style={{
            transform: interpolatedProps.transform,
            opacity: interpolatedProps.opacity,
            backgroundColor,
            borderRadius: getBorderRadius(),
          }}
        />
      </div>

      <div className="preview-controls">
        <div className="color-picker-wrapper">
          <label className="form-label">初始颜色</label>
          <input
            type="color"
            className="color-input"
            value={initialColor}
            onChange={(e) => setInitialColor(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">形状</label>
          <div className="shape-selector">
            <button
              className={`shape-btn ${shape === 'square' ? 'active' : ''}`}
              onClick={() => setShape('square')}
              title="方形"
            >
              ■
            </button>
            <button
              className={`shape-btn ${shape === 'rounded' ? 'active' : ''}`}
              onClick={() => setShape('rounded')}
              title="圆角"
            >
              ▢
            </button>
            <button
              className={`shape-btn ${shape === 'circle' ? 'active' : ''}`}
              onClick={() => setShape('circle')}
              title="圆形"
            >
              ●
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
