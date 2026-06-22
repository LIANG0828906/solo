import React from 'react';
import { TowerType } from '../game/types';

interface StatusBarProps {
  energy: number;
  monstersKilled: number;
  currentWave: number;
  totalWaves: number;
  isPlaying: boolean;
  isPaused: boolean;
  speedMultiplier: number;
  onStartWave: () => void;
  onTogglePause: () => void;
  onSpeedChange: (speed: number) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  energy,
  monstersKilled,
  currentWave,
  totalWaves,
  isPlaying,
  isPaused,
  speedMultiplier,
  onStartWave,
  onTogglePause,
  onSpeedChange,
}) => {
  const waveProgress = (currentWave / totalWaves) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>能量</span>
          <span style={{ ...styles.statValue, color: '#42a5f5' }}>
            {Math.floor(energy)}
          </span>
        </div>

        <div style={styles.statItem}>
          <span style={styles.statLabel}>已消灭</span>
          <span style={{ ...styles.statValue, color: '#fff' }}>
            {monstersKilled}
          </span>
        </div>
      </div>

      <div style={styles.waveSection}>
        <div style={styles.waveHeader}>
          <span style={styles.waveLabel}>波次进度</span>
          <span style={styles.waveNumber}>
            {currentWave} / {totalWaves}
          </span>
        </div>
        <div style={styles.progressBarContainer}>
          <div
            style={{
              ...styles.progressBar,
              width: `${waveProgress}%`,
              background: `linear-gradient(90deg, #ff9800 0%, #4caf50 100%)`,
            }}
          />
        </div>
      </div>

      <div style={styles.buttonRow}>
        {!isPlaying ? (
          <button style={styles.startButton} onClick={onStartWave}>
            开始战斗
          </button>
        ) : (
          <>
            <button
              style={styles.speedButton}
              onClick={() => onSpeedChange(speedMultiplier === 1 ? 1.5 : 1)}
            >
              {speedMultiplier}x 速度
            </button>
            <button
              style={styles.pauseButton}
              onClick={onTogglePause}
            >
              {isPaused ? '继续' : '暂停'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 200,
    padding: 16,
    background: 'rgba(26, 26, 46, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: 16,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    zIndex: 100,
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  waveSection: {
    marginBottom: 16,
  },
  waveHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  waveLabel: {
    fontSize: 12,
    color: '#888',
  },
  waveNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  progressBarContainer: {
    height: 8,
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
  },
  startButton: {
    flex: 1,
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  speedButton: {
    flex: 1,
    padding: '10px 8px',
    background: 'rgba(66, 165, 245, 0.2)',
    border: '1px solid #42a5f5',
    borderRadius: 8,
    color: '#42a5f5',
    fontSize: 12,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  pauseButton: {
    flex: 1,
    padding: '10px 8px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default StatusBar;
