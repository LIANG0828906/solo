import React, { memo } from 'react';
import { EnvironmentParams } from '../data/plantTypes';
import { FaSun, FaTint, FaThermometerHalf, FaWater, FaLeaf } from 'react-icons/fa';

interface EnvironmentPanelProps {
  params: EnvironmentParams;
  onParamChange: (key: keyof EnvironmentParams, value: number) => void;
  onWater: () => void;
  onFertilize: () => void;
}

const sliderConfig = {
  light: {
    label: '光照',
    icon: FaSun,
    colorStart: '#FFF3E0',
    colorEnd: '#FFB300',
    ringColor: '#FFD700',
  },
  water: {
    label: '水分',
    icon: FaTint,
    colorStart: '#E3F2FD',
    colorEnd: '#1565C0',
    ringColor: '#4FC3F7',
  },
  temperature: {
    label: '温度',
    icon: FaThermometerHalf,
    colorStart: '#FFEBEE',
    colorEnd: '#C62828',
    ringColor: '#FF7043',
  },
} as const;

const Slider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  colorStart: string;
  colorEnd: string;
  ringColor: string;
}> = ({ label, value, onChange, icon: Icon, colorStart, colorEnd, ringColor }) => {
  const percentage = value;
  const gradient = `linear-gradient(to right, ${colorStart} 0%, ${colorEnd} 100%)`;

  return (
    <div style={styles.sliderContainer}>
      <div style={styles.sliderHeader}>
        <div style={styles.sliderLabel}>
          <Icon size={18} color={ringColor} />
          <span style={styles.labelText}>{label}</span>
        </div>
        <span style={{ ...styles.valueText, color: ringColor }}>{Math.round(value)}</span>
      </div>
      <div style={styles.sliderTrack}>
        <div
          style={{
            ...styles.sliderFill,
            width: `${percentage}%`,
            background: `linear-gradient(to right, ${colorStart}, ${colorEnd})`,
          }}
        />
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            ...styles.sliderInput,
            background: gradient,
          }}
        />
      </div>
    </div>
  );
};

const EnvironmentPanel: React.FC<EnvironmentPanelProps> = memo(({ params, onParamChange, onWater, onFertilize }) => {
  return (
    <div style={styles.panel}>
      <h2 style={styles.title}>环境参数控制</h2>
      
      {(Object.keys(sliderConfig) as Array<keyof EnvironmentParams>).map((key) => {
        const config = sliderConfig[key];
        return (
          <Slider
            key={key}
            label={config.label}
            value={params[key]}
            onChange={(value) => onParamChange(key, value)}
            icon={config.icon}
            colorStart={config.colorStart}
            colorEnd={config.colorEnd}
            ringColor={config.ringColor}
          />
        );
      })}

      <div style={styles.buttonContainer}>
        <button style={styles.waterButton} onClick={onWater}>
          <FaWater size={20} />
          <span style={styles.buttonText}>浇水</span>
        </button>
        <button style={styles.fertilizeButton} onClick={onFertilize}>
          <FaLeaf size={20} />
          <span style={styles.buttonText}>施肥</span>
        </button>
      </div>
    </div>
  );
});

EnvironmentPanel.displayName = 'EnvironmentPanel';

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: 'fit-content',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#546E7A',
    textAlign: 'center',
    paddingBottom: '12px',
    borderBottom: '1px solid #ECEFF1',
  },
  sliderContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  labelText: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#546E7A',
  },
  valueText: {
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  sliderTrack: {
    position: 'relative',
    height: '6px',
    borderRadius: '3px',
    background: '#ECEFF1',
    overflow: 'visible',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: '3px',
    pointerEvents: 'none',
    transition: 'width 0.1s ease',
  },
  sliderInput: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: '100%',
    height: '24px',
    transform: 'translateY(-50%)',
    WebkitAppearance: 'none',
    appearance: 'none',
    background: 'transparent',
    cursor: 'pointer',
    opacity: 0,
  },
  buttonContainer: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  waterButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 2px 8px rgba(79, 195, 247, 0.4)',
    minHeight: '48px',
  },
  fertilizeButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #81C784 0%, #66BB6A 100%)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 2px 8px rgba(129, 199, 132, 0.4)',
    minHeight: '48px',
  },
  buttonText: {
    fontSize: '14px',
    fontWeight: 500,
  },
};

export default EnvironmentPanel;
