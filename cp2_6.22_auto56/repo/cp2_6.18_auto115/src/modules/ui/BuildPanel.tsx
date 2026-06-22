import React from 'react';
import { useGameStore } from '../gameLogic/gameState';
import { TOWER_COST } from '../../utils/math';

interface BuildPanelProps {
  resources: number;
  isWaveActive: boolean;
  buildMode: boolean;
  isMobile: boolean;
}

const BuildPanel: React.FC<BuildPanelProps> = ({
  resources,
  isWaveActive,
  buildMode,
  isMobile,
}) => {
  const startWave = useGameStore((s) => s.startWave);
  const setBuildMode = useGameStore((s) => s.setBuildMode);
  const showInsufficientResource = useGameStore((s) => s.showInsufficientResource);

  const canBuild = resources >= TOWER_COST;
  const fontSize = isMobile ? 14 : 15;
  const padding = isMobile ? '10px 16px' : '12px 22px';

  const handleBuildClick = () => {
    if (!canBuild) {
      showInsufficientResource('资源不足');
      return;
    }
    setBuildMode(!buildMode);
  };

  const handleStartWave = () => {
    startWave();
  };

  return (
    <div style={{
      ...styles.container,
      right: isMobile ? 12 : 24,
      bottom: isMobile ? 12 : 24,
      gap: isMobile ? 6 : 8,
    }}>
      <button
        onClick={handleBuildClick}
        disabled={!canBuild && !buildMode}
        style={{
          ...styles.button,
          fontSize,
          padding,
          backgroundColor: buildMode ? '#2E5A8F' : '#1E3A5F',
          opacity: !canBuild && !buildMode ? 0.4 : 1,
          cursor: !canBuild && !buildMode ? 'not-allowed' : 'pointer',
        }}
      >
        {buildMode ? '建造中...' : `建造防御塔 (${TOWER_COST})`}
      </button>

      <button
        onClick={handleStartWave}
        disabled={isWaveActive}
        style={{
          ...styles.button,
          fontSize,
          padding,
          opacity: isWaveActive ? 0.4 : 1,
          cursor: isWaveActive ? 'not-allowed' : 'pointer',
          background: isWaveActive
            ? '#1E3A5F'
            : 'linear-gradient(135deg, #1E3A5F 0%, #2E5A8F 100%)',
        }}
      >
        {isWaveActive ? '波次进行中' : '开始下一波'}
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  button: {
    border: 'none',
    borderRadius: 8,
    color: '#FFFFFF',
    fontWeight: 600,
    letterSpacing: 0.5,
    transition: 'all 0.2s ease',
    outline: 'none',
    userSelect: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    borderBottom: '2px solid rgba(0,0,0,0.3)',
  },
};

export default BuildPanel;
