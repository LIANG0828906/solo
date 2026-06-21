import React, { useState } from 'react';
import { AtomType, ATOM_CONFIG } from '@/types';

interface ToolbarProps {
  selectedAtomType: AtomType;
  onSelectAtomType: (type: AtomType) => void;
  onDelete: () => void;
  onReset: () => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  stats: {
    atomCount: number;
    moleculeCount: number;
    bondCount: number;
    maxAtoms: number;
  };
  hasSelectedAtom: boolean;
  fps: number;
  particleCount: number;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedAtomType,
  onSelectAtomType,
  onDelete,
  onReset,
  isRunning,
  onToggleRunning,
  stats,
  hasSelectedAtom,
  fps,
  particleCount,
}) => {
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const atomTypes: AtomType[] = ['H', 'O', 'C', 'N'];

  const handleButtonPress = (buttonName: string, action: () => void) => {
    setPressedButton(buttonName);
    action();
    setTimeout(() => setPressedButton(null), 100);
  };

  const getButtonStyle = (buttonName: string) => ({
    transform: pressedButton === buttonName ? 'scale(0.95)' : 'scale(1)',
    transition: 'transform 0.1s ease',
  });

  return (
    <div style={styles.toolbar} className="toolbar">
      <div style={styles.statsPanel}>
        <div style={styles.statsTitle}>场景统计</div>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>原子</span>
            <span style={styles.statValue}>
              {stats.atomCount}/{stats.maxAtoms}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>分子</span>
            <span style={styles.statValue}>{stats.moleculeCount}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>化学键</span>
            <span style={styles.statValue}>{stats.bondCount}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>FPS</span>
            <span style={styles.statValue}>{fps}</span>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>选择原子</div>
        <div style={styles.atomButtons}>
          {atomTypes.map((type) => {
            const config = ATOM_CONFIG[type];
            const isSelected = selectedAtomType === type;
            return (
              <button
                key={type}
                onClick={() => handleButtonPress(`atom-${type}`, () => onSelectAtomType(type))}
                style={{
                  ...styles.atomButton,
                  ...getButtonStyle(`atom-${type}`),
                  border: isSelected ? '2px solid #64B4FF' : '1px solid rgba(255,255,255,0.3)',
                  boxShadow: isSelected ? '0 0 12px rgba(100,180,255,0.6)' : 'none',
                }}
                title={`${config.name} (${type}) - 直径${config.radius * 2}px`}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 30% 30%, ${lighten(config.color, 40)}, ${config.color} 70%, ${darken(config.color, 20)})`,
                    border: '1px solid rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: type === 'H' || type === 'N' ? '#1a1a1a' : 'white',
                    fontWeight: 'bold',
                    fontSize: 11,
                  }}
                >
                  {type}
                </div>
                <span style={styles.atomLabel}>{config.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>操作控制</div>
        <div style={styles.buttonColumn}>
          <button
            onClick={() => handleButtonPress('toggle', onToggleRunning)}
            style={{
              ...styles.actionButton,
              ...getButtonStyle('toggle'),
              background: isRunning
                ? 'linear-gradient(135deg, #E74C3C, #C0392B)'
                : 'linear-gradient(135deg, #27AE60, #1E8449)',
            }}
          >
            <span style={styles.buttonIcon}>{isRunning ? '⏸' : '▶'}</span>
            {isRunning ? '暂停模拟' : '运行模拟'}
          </button>

          <button
            onClick={() => handleButtonPress('delete', onDelete)}
            disabled={!hasSelectedAtom}
            style={{
              ...styles.actionButton,
              ...getButtonStyle('delete'),
              opacity: hasSelectedAtom ? 1 : 0.4,
              cursor: hasSelectedAtom ? 'pointer' : 'not-allowed',
            }}
          >
            <span style={styles.buttonIcon}>🗑</span>
            删除选中
          </button>

          <button
            onClick={() => handleButtonPress('reset', onReset)}
            style={{
              ...styles.actionButton,
              ...getButtonStyle('reset'),
              background: 'linear-gradient(135deg, #7F8C8D, #5D6D7E)',
            }}
          >
            <span style={styles.buttonIcon}>↺</span>
            重置场景
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>性能</div>
        <div style={styles.perfInfo}>
          <div style={styles.perfRow}>
            <span>3D粒子数:</span>
            <span style={{ ...styles.perfValue, color: particleCount > 180 ? '#FF6B6B' : '#87CEEB' }}>
              {particleCount}/200
            </span>
          </div>
        </div>
      </div>

      <div style={styles.helpSection}>
        <div style={styles.helpTitle}>使用提示</div>
        <ul style={styles.helpList}>
          <li>选择原子后点击画布放置</li>
          <li>点击原子选中，可拖拽移动</li>
          <li>原子碰撞满足条件自动结合</li>
        </ul>
      </div>
    </div>
  );
};

function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    width: 260,
    height: '100vh',
    background: '#2C2C2C',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    borderRight: '1px solid rgba(255,255,255,0.08)',
    overflowY: 'auto',
    flexShrink: 0,
  },
  statsPanel: {
    background: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(10px)',
    borderRadius: 10,
    padding: 14,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e0e0e0',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: 'rgba(255,255,255,0.04)',
    padding: '8px 10px',
    borderRadius: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: 500,
  },
  statValue: {
    fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
    fontSize: 16,
    fontWeight: 700,
    color: '#87CEEB',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  atomButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  atomButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '12px 8px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    color: '#ddd',
    fontSize: 11,
  } as React.CSSProperties,
  atomLabel: {
    fontSize: 11,
    fontWeight: 500,
  },
  buttonColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 16px',
    borderRadius: 8,
    border: 'none',
    color: 'white',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #5D6D7E, #4A5568)',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,
  buttonIcon: {
    fontSize: 14,
  },
  perfInfo: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: 12,
  },
  perfRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
    color: '#aaa',
  },
  perfValue: {
    fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
    fontWeight: 600,
  },
  helpSection: {
    marginTop: 'auto',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 12,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  helpTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#777',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helpList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
};

export default Toolbar;
