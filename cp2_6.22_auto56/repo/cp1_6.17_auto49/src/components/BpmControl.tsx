import React from 'react';
import { PRIMARY_COLOR, PRIMARY_HOVER_COLOR } from '../types';

interface BpmControlProps {
  bpm: number;
  onChange: (bpm: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const BpmControl: React.FC<BpmControlProps> = ({
  bpm,
  onChange,
  min = 30,
  max = 300,
  step = 1,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange(value);
  };

  const handleDecrease = () => {
    onChange(Math.max(min, bpm - step));
  };

  const handleIncrease = () => {
    onChange(Math.min(max, bpm + step));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>BPM</span>
        <div style={styles.bpmValue}>{bpm}</div>
      </div>

      <div style={styles.sliderContainer}>
        <button style={styles.stepButton} onClick={handleDecrease}>
          -
        </button>
        <div style={styles.sliderWrapper}>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={bpm}
            onChange={handleChange}
            style={styles.slider}
          />
        </div>
        <button style={styles.stepButton} onClick={handleIncrease}>
          +
        </button>
      </div>

      <div style={styles.tempoMarks}>
        <span style={styles.markText}>{min}</span>
        <span style={styles.markText}>{max}</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  bpmValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: PRIMARY_COLOR,
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sliderWrapper: {
    flex: 1,
    position: 'relative',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
  },
  stepButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f0f0f0',
    color: '#333',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempoMarks: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
  },
  markText: {
    fontSize: '12px',
    color: '#999',
  },
};

const sliderStyle = `
  .bpm-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #ccc;
    outline: none;
    cursor: pointer;
  }

  .bpm-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3f51b5;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .bpm-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 4px 12px rgba(63, 81, 181, 0.5);
  }

  .bpm-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3f51b5;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .bpm-slider::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 4px 12px rgba(63, 81, 181, 0.5);
  }
`;

export default BpmControl;
