import React, { useState, useEffect, useRef } from 'react';
import { CloudParams, CloudStatus, PresetMode, PRESET_VALUES, DEFAULT_PARAMS } from '../types';

interface ParameterPanelProps {
  params: CloudParams;
  onParamsChange: (params: CloudParams) => void;
  status: CloudStatus;
  rainProbability: number;
}

const statusText: Record<CloudStatus, string> = {
  generating: '生成中',
  active: '活跃',
  raining: '降水',
};

const presetLabels: Record<PresetMode, string> = {
  storm: '暴雨',
  cloudy: '多云',
  clear: '晴朗',
};

const presets: PresetMode[] = ['storm', 'cloudy', 'clear'];

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  params,
  onParamsChange,
  status,
  rainProbability,
}) => {
  const [currentPreset, setCurrentPreset] = useState<PresetMode | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const animationRef = useRef<number | null>(null);
  const animationStartRef = useRef<CloudParams | null>(null);
  const animationTargetRef = useRef<CloudParams | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSliderChange = (key: keyof CloudParams, value: number) => {
    setCurrentPreset(null);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    onParamsChange({ ...params, [key]: value });
  };

  const handleReset = () => {
    setCurrentPreset(null);
    animateToParams(DEFAULT_PARAMS);
  };

  const handlePreset = () => {
    const currentIndex = currentPreset ? presets.indexOf(currentPreset) : -1;
    const nextIndex = (currentIndex + 1) % presets.length;
    const nextPreset = presets[nextIndex];
    setCurrentPreset(nextPreset);
    animateToParams(PRESET_VALUES[nextPreset]);
  };

  const animateToParams = (target: CloudParams) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationStartRef.current = { ...params };
    animationTargetRef.current = { ...target };
    setIsAnimating(true);

    const duration = 3000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(progress);

      if (animationStartRef.current && animationTargetRef.current) {
        const interpolated: CloudParams = {
          humidity: lerp(animationStartRef.current.humidity, animationTargetRef.current.humidity, eased),
          temperature: lerp(animationStartRef.current.temperature, animationTargetRef.current.temperature, eased),
          updraft: lerp(animationStartRef.current.updraft, animationTargetRef.current.updraft, eased),
        };
        onParamsChange(interpolated);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const getStatusColor = (s: CloudStatus): string => {
    switch (s) {
      case 'raining':
        return '#4fc3f7';
      case 'active':
        return '#ffb74d';
      default:
        return '#81c784';
    }
  };

  return (
    <div
      className="parameter-panel"
      style={{
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      }}
    >
      <div className="status-section">
        <div className="status-row">
          <span className="status-label">云层状态</span>
          <span
            className="status-value"
            style={{ color: getStatusColor(status) }}
          >
            {statusText[status]}
          </span>
        </div>
        <div className="status-row">
          <span className="status-label">降水概率</span>
          <span className="status-value">{rainProbability}%</span>
        </div>
      </div>

      <div className="slider-section">
        <div className="slider-container">
          <div className="slider-label">
            <span>湿度</span>
            <span className="slider-value">{Math.round(params.humidity)}%</span>
          </div>
          <div className="custom-slider">
            <input
              type="range"
              min="30"
              max="90"
              step="1"
              value={params.humidity}
              onChange={(e) => handleSliderChange('humidity', Number(e.target.value))}
              className="range-input"
            />
          </div>
        </div>

        <div className="slider-container">
          <div className="slider-label">
            <span>温度</span>
            <span className="slider-value">{Math.round(params.temperature)}°C</span>
          </div>
          <div className="custom-slider">
            <input
              type="range"
              min="-10"
              max="30"
              step="1"
              value={params.temperature}
              onChange={(e) => handleSliderChange('temperature', Number(e.target.value))}
              className="range-input"
            />
          </div>
        </div>

        <div className="slider-container">
          <div className="slider-label">
            <span>上升气流强度</span>
            <span className="slider-value">{Math.round(params.updraft)}</span>
          </div>
          <div className="custom-slider">
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={params.updraft}
              onChange={(e) => handleSliderChange('updraft', Number(e.target.value))}
              className="range-input"
            />
          </div>
        </div>
      </div>

      <div className="button-section">
        <button
          className="btn btn-reset"
          onClick={handleReset}
          disabled={isAnimating}
        >
          重置
        </button>
        <button
          className="btn btn-preset"
          onClick={handlePreset}
          disabled={isAnimating}
        >
          {currentPreset ? presetLabels[currentPreset] : '暴雨/多云/晴朗'}
        </button>
      </div>
    </div>
  );
};
