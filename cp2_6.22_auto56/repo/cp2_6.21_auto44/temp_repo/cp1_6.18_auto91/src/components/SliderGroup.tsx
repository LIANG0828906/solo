import React, { useCallback } from 'react';
import {
  FlavorDimension,
  DIMENSION_ORDER,
  DIMENSION_LABELS,
  SCORE_MIN,
  SCORE_MAX,
  SCORE_STEP,
  FlavorProfile,
} from '@/shared/types';
import { useFlavorStore } from '@/store/useFlavorStore';

interface SliderGroupProps {
  profile: FlavorProfile;
}

export const SliderGroup: React.FC<SliderGroupProps> = ({ profile }) => {
  const updateScore = useFlavorStore((s) => s.updateScore);

  const handleChange = useCallback(
    (dim: FlavorDimension, value: number) => {
      updateScore(profile.id, dim, value);
    },
    [profile.id, updateScore],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {DIMENSION_ORDER.map((dim) => (
        <div
          key={dim}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <label
              style={{
                fontSize: '13px',
                color: '#8E8EB2',
                fontWeight: 500,
              }}
            >
              {DIMENSION_LABELS[dim]}
            </label>
            <span
              style={{
                fontSize: '13px',
                color: profile.color,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                minWidth: '20px',
                textAlign: 'right',
              }}
            >
              {profile.scores[dim]}
            </span>
          </div>
          <FlavorSlider
            dimension={dim}
            value={profile.scores[dim]}
            color={profile.color}
            onChange={handleChange}
          />
        </div>
      ))}
    </div>
  );
};

interface FlavorSliderProps {
  dimension: FlavorDimension;
  value: number;
  color: string;
  onChange: (dim: FlavorDimension, value: number) => void;
}

const FlavorSlider: React.FC<FlavorSliderProps> = ({ dimension, value, color, onChange }) => {
  const percentage = ((value - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;

  return (
    <div
      style={{
        position: 'relative',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '4px',
          borderRadius: '2px',
          backgroundColor: '#3D3D5C',
        }}
      />
      <div
        style={{
          position: 'absolute',
          height: '4px',
          borderRadius: '2px',
          backgroundColor: color,
          width: `${percentage}%`,
          transition: 'width 0.15s ease-out, background-color 0.2s ease-in-out',
        }}
      />
      <input
        type="range"
        min={SCORE_MIN}
        max={SCORE_MAX}
        step={SCORE_STEP}
        value={value}
        onChange={(e) => onChange(dimension, Number(e.target.value))}
        aria-label={DIMENSION_LABELS[dimension]}
        style={{
          position: 'absolute',
          width: '100%',
          height: '20px',
          margin: 0,
          opacity: 0,
          cursor: 'pointer',
        }}
      />
      <div
        className="slider-thumb"
        style={{
          position: 'absolute',
          left: `calc(${percentage}% - 8px)`,
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: `2px solid ${color}`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
          transition: 'left 0.15s ease-out, width 0.2s ease-in-out, height 0.2s ease-in-out',
        }}
      />
    </div>
  );
};
