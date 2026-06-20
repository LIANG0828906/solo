import React from 'react';
import { TowerType } from '../game/types';

interface TowerPanelProps {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  playerEnergy: number;
  onSelectTower: (type: TowerType) => void;
  onClose: () => void;
}

const TOWER_CONFIG: { type: TowerType; name: string; cost: number; color: string; description: string }[] = [
  {
    type: 'red',
    name: '红色攻击塔',
    cost: 50,
    color: '#ff4444',
    description: '散射光束，伤害中等',
  },
  {
    type: 'blue',
    name: '蓝色减速塔',
    cost: 60,
    color: '#4488ff',
    description: '光束附带减速效果',
  },
  {
    type: 'yellow',
    name: '黄色增幅塔',
    cost: 70,
    color: '#ffdd44',
    description: '增幅经过的友方光束',
  },
];

export const TowerPanel: React.FC<TowerPanelProps> = ({
  isOpen,
  position,
  playerEnergy,
  onSelectTower,
  onClose,
}) => {
  if (!isOpen || !position) return null;

  return (
    <div
      style={{
        ...styles.panel,
        left: position.x,
        top: position.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={styles.header}>
        <span style={styles.title}>选择能量塔</span>
        <button style={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>

      <div style={styles.towerList}>
        {TOWER_CONFIG.map((tower, index) => {
          const canAfford = playerEnergy >= tower.cost;
          return (
            <div
              key={tower.type}
              style={{
                ...styles.towerItem,
                opacity: canAfford ? 1 : 0.5,
                cursor: canAfford ? 'pointer' : 'not-allowed',
                animationDelay: `${index * 0.05}s`,
              }}
              onClick={() => canAfford && onSelectTower(tower.type)}
            >
              <div
                style={{
                  ...styles.towerIcon,
                  backgroundColor: tower.color,
                  boxShadow: `0 0 20px ${tower.color}50`,
                }}
              >
                <span style={styles.hotkey}>{index + 1}</span>
              </div>

              <div style={styles.towerInfo}>
                <div style={styles.towerName}>{tower.name}</div>
                <div style={styles.towerDesc}>{tower.description}</div>
              </div>

              <div style={styles.towerCost}>
                <span style={styles.costIcon}>◆</span>
                <span style={{ ...styles.costValue, color: canAfford ? '#42a5f5' : '#666' }}>
                  {tower.cost}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.hint}>
        快捷键: 1/2/3 选择，ESC 关闭
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    transform: 'translate(-50%, -100%) translateY(-10px)',
    width: 280,
    padding: 16,
    background: 'rgba(26, 26, 46, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 24,
    cursor: 'pointer',
    padding: '0 8px',
    lineHeight: 1,
  },
  towerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  towerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    transition: 'all 0.2s ease',
    animation: 'breathe 2s ease-in-out infinite',
  },
  towerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hotkey: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  towerInfo: {
    flex: 1,
  },
  towerName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  towerDesc: {
    fontSize: 11,
    color: '#888',
  },
  towerCost: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  costIcon: {
    color: '#42a5f5',
    fontSize: 12,
  },
  costValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
};

export default TowerPanel;
