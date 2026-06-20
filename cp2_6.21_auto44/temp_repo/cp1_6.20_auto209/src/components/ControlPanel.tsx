import React from 'react';

interface ControlPanelProps {
  frequency: number;
  duration: number;
  isRunning: boolean;
  onFrequencyChange: (value: number) => void;
  onDurationChange: (value: number) => void;
  onStart: () => void;
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  frequency,
  duration,
  isRunning,
  onFrequencyChange,
  onDurationChange,
  onStart,
  onReset
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>控制面板</h2>
        <p style={styles.subtitle}>神经突触模拟参数</p>
      </div>

      <div style={styles.section}>
        <div style={styles.labelRow}>
          <span style={styles.label}>刺激频率</span>
          <span style={styles.value}>{frequency} Hz</span>
        </div>
        <input
          type="range"
          min={80}
          max={200}
          step={1}
          value={frequency}
          onChange={(e) => onFrequencyChange(Number(e.target.value))}
          disabled={isRunning}
          style={styles.slider}
        />
        <div style={styles.rangeLabels}>
          <span style={styles.rangeLabel}>80Hz</span>
          <span style={styles.rangeLabel}>200Hz</span>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.labelRow}>
          <span style={styles.label}>持续时间</span>
          <span style={styles.value}>{duration} s</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={duration}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          disabled={isRunning}
          style={styles.slider}
        />
        <div style={styles.rangeLabels}>
          <span style={styles.rangeLabel}>1s</span>
          <span style={styles.rangeLabel}>10s</span>
        </div>
      </div>

      <div style={styles.statusSection}>
        <div style={styles.statusRow}>
          <div style={{ ...styles.statusDot, background: isRunning ? '#00ff88' : '#ff6b6b' }} />
          <span style={styles.statusText}>
            {isRunning ? '模拟运行中...' : '等待启动'}
          </span>
        </div>
      </div>

      <div style={styles.buttonGroup}>
        <button
          onClick={onStart}
          disabled={isRunning}
          style={{
            ...styles.startButton,
            ...(isRunning ? styles.buttonDisabled : {})
          }}
          onMouseEnter={(e) => {
            if (!isRunning) {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(74, 140, 255, 0.6), 0 0 40px rgba(0, 212, 255, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isRunning ? '运行中' : '启动刺激'}
        </button>

        <button
          onClick={onReset}
          style={styles.resetButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(220, 20, 60, 0.5), 0 0 40px rgba(255, 107, 107, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          重置网络
        </button>
      </div>

      <div style={styles.helpSection}>
        <h3 style={styles.helpTitle}>参数说明</h3>
        <div style={styles.helpItem}>
          <span style={styles.helpDot} />
          <span style={styles.helpText}>{'>140Hz 诱导 LTP (突触增强)'}</span>
        </div>
        <div style={styles.helpItem}>
          <span style={{ ...styles.helpDot, background: '#DC143C' }} />
          <span style={styles.helpText}>{'<100Hz 诱导 LTD (突触抑制)'}</span>
        </div>
        <div style={styles.helpItem}>
          <span style={{ ...styles.helpDot, background: '#FFD700' }} />
          <span style={styles.helpText}>粒子流代表信号传递</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    padding: '24px 20px',
    background: 'rgba(15, 15, 35, 0.75)',
    backdropFilter: 'blur(8px)',
    borderRight: '1px solid rgba(74, 140, 255, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    overflowY: 'auto',
    transition: 'all 0.3s ease-out'
  },
  header: {
    borderBottom: '1px solid rgba(74, 140, 255, 0.15)',
    paddingBottom: '16px'
  },
  title: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#e0e0f0',
    margin: 0,
    letterSpacing: '1px'
  },
  subtitle: {
    fontSize: '12px',
    color: '#6a6a8a',
    margin: '6px 0 0 0'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: '14px',
    color: '#a0a0c0',
    fontWeight: 500
  },
  value: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#00d4ff',
    fontVariantNumeric: 'tabular-nums'
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(42, 42, 74, 0.8)',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none'
  },
  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#5a5a7a'
  },
  rangeLabel: {
    fontVariantNumeric: 'tabular-nums'
  },
  statusSection: {
    padding: '12px 16px',
    background: 'rgba(42, 42, 74, 0.5)',
    borderRadius: '8px',
    border: '1px solid rgba(74, 140, 255, 0.1)'
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    boxShadow: '0 0 10px currentColor'
  },
  statusText: {
    fontSize: '13px',
    color: '#c0c0e0',
    fontWeight: 500
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  startButton: {
    width: '100%',
    padding: '14px 20px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
    background: 'linear-gradient(135deg, #4a8cff 0%, #00d4ff 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'all 0.3s ease-out'
  },
  resetButton: {
    width: '100%',
    padding: '14px 20px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#e0e0f0',
    background: 'transparent',
    border: '1px solid rgba(220, 20, 60, 0.5)',
    borderRadius: '12px',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'all 0.3s ease-out'
  },
  buttonDisabled: {
    background: 'rgba(100, 100, 130, 0.4)',
    cursor: 'not-allowed',
    opacity: 0.7
  },
  helpSection: {
    marginTop: 'auto',
    padding: '16px',
    background: 'rgba(42, 42, 74, 0.3)',
    borderRadius: '10px',
    border: '1px solid rgba(74, 140, 255, 0.1)'
  },
  helpTitle: {
    fontSize: '13px',
    color: '#8a8aaa',
    margin: '0 0 12px 0',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  helpItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  },
  helpDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4169E1',
    flexShrink: 0
  },
  helpText: {
    fontSize: '12px',
    color: '#9090b0'
  }
};

export default ControlPanel;
