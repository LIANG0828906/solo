import React from 'react';

interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const ParamSlider: React.FC<ParamSliderProps> = ({ label, value, min, max, onChange }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <label style={{
          fontSize: '14px',
          color: '#F8FAFC',
          fontWeight: 500
        }}>
          {label}
        </label>
        <span style={{
          fontSize: '14px',
          color: '#94A3B8',
          fontWeight: 600,
          fontFamily: 'monospace'
        }}>
          {value}
        </span>
      </div>
      <div style={{
        position: 'relative',
        height: '12px'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '12px',
          backgroundColor: '#334155',
          borderRadius: '6px'
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${percentage}%`,
          height: '12px',
          backgroundColor: '#6366F1',
          borderRadius: '6px',
          transition: 'width 0.1s ease-out'
        }} />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '12px',
            margin: 0,
            opacity: 0,
            cursor: 'pointer',
            zIndex: 10
          }}
        />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: `calc(${percentage}% - 10px)`,
          width: '20px',
          height: '20px',
          backgroundColor: '#F0F0F0',
          borderRadius: '50%',
          transform: 'translateY(-50%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(99, 102, 241, 0.4)',
          transition: 'left 0.1s ease-out, box-shadow 0.2s ease-out',
          pointerEvents: 'none',
          zIndex: 5
        }}
        className="slider-thumb"
        data-value={value}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 16px 8px rgba(99, 102, 241, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(99, 102, 241, 0.4)';
        }}
        />
      </div>
    </div>
  );
};

export default ParamSlider;
