import React from 'react';
import type { Point } from '../../types/game';

interface BuildBubbleProps {
  position: Point;
  mapWidth: number;
  cost: number;
  canAfford: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isUpgrade?: boolean;
}

const BuildBubble: React.FC<BuildBubbleProps> = ({
  position,
  mapWidth,
  cost,
  canAfford,
  onConfirm,
  onCancel,
  isUpgrade = false,
}) => {
  const bubbleWidth = 160;
  const bubbleHeight = isUpgrade ? 72 : 72;
  let left = position.x - bubbleWidth / 2;
  let top = position.y - bubbleHeight - 16;

  if (left < 8) left = 8;
  if (left + bubbleWidth > mapWidth - 8) left = mapWidth - bubbleWidth - 8;
  if (top < 8) top = position.y + 50;

  return (
    <div
      style={{
        ...styles.bubble,
        left,
        top,
        width: bubbleWidth,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={styles.title}>
        {isUpgrade ? '升级防御塔' : '建造防御塔'}
      </div>
      <div style={styles.cost}>
        消耗: <span style={{ color: canAfford ? '#FFD700' : '#FF6666' }}>{cost}</span>
      </div>
      <div style={styles.buttons}>
        <button
          onClick={onCancel}
          style={{
            ...styles.btn,
            ...styles.cancelBtn,
          }}
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          disabled={!canAfford}
          style={{
            ...styles.btn,
            ...styles.confirmBtn,
            opacity: canAfford ? 1 : 0.4,
            cursor: canAfford ? 'pointer' : 'not-allowed',
          }}
        >
          {isUpgrade ? '升级' : '建造'}
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  bubble: {
    position: 'absolute',
    zIndex: 20,
    backgroundColor: '#1A1F2E',
    borderRadius: 8,
    padding: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    border: '1px solid #2A2F3A',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
    textAlign: 'center',
  },
  cost: {
    color: '#8892A6',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  buttons: {
    display: 'flex',
    gap: 6,
  },
  btn: {
    flex: 1,
    border: 'none',
    borderRadius: 6,
    padding: '6px 0',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  cancelBtn: {
    backgroundColor: '#2A2F3A',
    color: '#CCCCCC',
  },
  confirmBtn: {
    backgroundColor: '#1E3A5F',
    color: '#FFFFFF',
  },
};

export default BuildBubble;
