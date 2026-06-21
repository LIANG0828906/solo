import React from 'react';
import { GrowthParams } from '../utils/plantGrowth';

interface ControlPanelProps {
  params: GrowthParams;
  onParamsChange: (key: keyof GrowthParams, value: number) => void;
  onReset: () => void;
  isResetting: boolean;
}

interface SliderConfig {
  key: keyof GrowthParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  emoji: string;
}

const SLIDER_CONFIGS: SliderConfig[] = [
  { key: 'light', label: '光照强度', min: 0, max: 100, step: 1, unit: '%', emoji: '☀️' },
  { key: 'water', label: '水分含量', min: 0, max: 100, step: 1, unit: '%', emoji: '💧' },
  { key: 'soil',  label: '土壤肥沃度', min: 0, max: 100, step: 1, unit: '%', emoji: '🌱' }
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onParamsChange,
  onReset,
  isResetting
}) => {
  return (
    <div style={styles.container}>
      {SLIDER_CONFIGS.map(config => (
        <div key={config.key} style={styles.sliderGroup}>
          <div style={styles.sliderLabelRow}>
            <span style={styles.sliderEmoji}>{config.emoji}</span>
            <span style={styles.sliderLabel}>{config.label}</span>
          </div>
          <input
            type="range"
            min={config.min}
            max={config.max}
            step={config.step}
            value={params[config.key]}
            onChange={(e) => onParamsChange(config.key, Number(e.target.value))}
            style={styles.slider}
          />
          <div style={styles.valueDisplay}>
            <span style={styles.valueNumber}>{params[config.key]}</span>
            <span style={styles.valueUnit}>{config.unit}</span>
          </div>
        </div>
      ))}

      <button
        onClick={onReset}
        disabled={isResetting}
        style={{
          ...styles.resetButton,
          ...(isResetting ? styles.resetButtonDisabled : {})
        }}
        onMouseEnter={(e) => {
          if (!isResetting) {
            e.currentTarget.style.backgroundColor = '#E55555';
          }
        }}
        onMouseLeave={(e) => {
          if (!isResetting) {
            e.currentTarget.style.backgroundColor = '#FF6B6B';
          }
        }}
        onMouseDown={(e) => {
          if (!isResetting) {
            e.currentTarget.style.backgroundColor = '#CC4444';
          }
        }}
        onMouseUp={(e) => {
          if (!isResetting) {
            e.currentTarget.style.backgroundColor = '#E55555';
          }
        }}
      >
        {isResetting ? '重置中...' : '重置生长'}
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flexShrink: 0
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  sliderLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  sliderEmoji: {
    fontSize: '18px',
    lineHeight: 1
  },
  sliderLabel: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: 600
  },
  slider: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: '#E0E0E0',
    outline: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none' as const,
    appearance: 'none',
    padding: 0
  },
  valueDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    justifyContent: 'flex-end'
  },
  valueNumber: {
    fontSize: '16px',
    color: '#1A1A2E',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums'
  },
  valueUnit: {
    fontSize: '12px',
    color: '#6B7280'
  },
  resetButton: {
    width: '100%',
    height: '40px',
    borderRadius: '6px',
    backgroundColor: '#FF6B6B',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)',
    marginTop: '8px'
  },
  resetButtonDisabled: {
    backgroundColor: '#CCCCCC',
    cursor: 'not-allowed',
    boxShadow: 'none'
  }
};

export default React.memo(ControlPanel);
