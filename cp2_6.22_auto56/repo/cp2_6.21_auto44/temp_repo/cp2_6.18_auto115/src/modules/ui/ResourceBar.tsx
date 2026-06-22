import React from 'react';

interface ResourceBarProps {
  hp: number;
  maxHp: number;
  hpPercent: number;
  resources: number;
  currentWave: number;
  isMobile: boolean;
}

const ResourceBar: React.FC<ResourceBarProps> = ({
  hp,
  maxHp,
  hpPercent,
  resources,
  currentWave,
  isMobile,
}) => {
  const barWidth = isMobile ? 150 : 200;
  const barHeight = isMobile ? 16 : 20;
  const fontSize = isMobile ? 13 : 16;
  const labelSize = isMobile ? 11 : 13;

  return (
    <div style={{
      ...styles.container,
      left: isMobile ? 12 : 24,
      top: isMobile ? 60 : 80,
    }}>
      <div style={styles.item}>
        <span style={{ ...styles.label, fontSize: labelSize }}>核心生命</span>
        <div style={{
          ...styles.hpBarOuter,
          width: barWidth,
          height: barHeight,
        }}>
          <div
            style={{
              ...styles.hpBarInner,
              width: `${Math.max(0, hpPercent)}%`,
              height: '100%',
              backgroundColor: '#FF3333',
              transition: 'width 0.5s ease',
            }}
          />
          <span style={{
            ...styles.hpText,
            fontSize: labelSize,
          }}>
            {hp}/{maxHp}
          </span>
        </div>
      </div>

      <div style={styles.item}>
        <span style={{ ...styles.label, fontSize: labelSize }}>资源</span>
        <span style={{
          ...styles.resources,
          fontSize: fontSize + 2,
        }}>
          {resources}
        </span>
      </div>

      <div style={styles.item}>
        <span style={{ ...styles.label, fontSize: labelSize }}>当前波次</span>
        <span style={{
          ...styles.wave,
          fontSize: fontSize,
        }}>
          第 {currentWave} 波
        </span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(26, 31, 46, 0.85)',
    borderRadius: 8,
    border: '1px solid rgba(30, 58, 95, 0.6)',
    backdropFilter: 'blur(4px)',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    color: '#8892A6',
    minWidth: 60,
    fontWeight: 500,
  },
  hpBarOuter: {
    position: 'relative',
    backgroundColor: '#1A1F2E',
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid #2A2F3A',
  },
  hpBarInner: {
    borderRadius: 4,
    background: 'linear-gradient(90deg, #CC0000, #FF3333, #FF6666)',
  },
  hpText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#FFFFFF',
    fontWeight: 700,
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  },
  resources: {
    color: '#FFD700',
    fontWeight: 700,
    textShadow: '0 0 8px rgba(255, 215, 0, 0.4)',
    minWidth: 60,
  },
  wave: {
    color: '#FFFFFF',
    fontWeight: 600,
  },
};

export default ResourceBar;
