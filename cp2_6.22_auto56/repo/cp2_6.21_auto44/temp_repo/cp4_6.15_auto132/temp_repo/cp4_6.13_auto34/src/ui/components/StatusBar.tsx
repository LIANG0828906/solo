import React from 'react';
import { useGameStore } from '../../store/gameStore';

const StatusBar: React.FC = () => {
  const stamina = useGameStore((s) => s.stamina);
  const maxStamina = useGameStore((s) => s.maxStamina);
  const turn = useGameStore((s) => s.turn);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const gameView = useGameStore((s) => s.gameView);
  const collectedParts = useGameStore((s) => s.collectedParts);
  const repairSlots = useGameStore((s) => s.repairSlots);
  const depth = useGameStore((s) => s.depth);

  const staminaPct = (stamina / maxStamina) * 100;
  const repairedCount = repairSlots.filter((s) => s.filled).length;
  const totalSlots = repairSlots.length;

  const getStaminaColor = (): string => {
    if (staminaPct > 60) return '#64ffda';
    if (staminaPct > 30) return '#ecc94b';
    return '#f56565';
  };

  const getPhaseLabel = (): { text: string; color: string } => {
    switch (gamePhase) {
      case 'exploring':
        return { text: '探索中', color: '#64ffda' };
      case 'searching':
        return { text: '搜索中', color: '#ecc94b' };
      case 'repairing':
        return { text: '修复中', color: '#4299e1' };
      case 'diving':
        return { text: '下潜中', color: '#9f7aea' };
      case 'gameover':
        return { text: '任务失败', color: '#f56565' };
      case 'victory':
        return { text: '探索成功!', color: '#48bb78' };
      default:
        return { text: '探索中', color: '#64ffda' };
    }
  };

  const phaseInfo = getPhaseLabel();

  return (
    <div
      className="glass-panel glow-panel px-6 py-3"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      <StatusItem
        label="游戏阶段"
        value={phaseInfo.text}
        valueColor={phaseInfo.color}
        icon="🎯"
      />

      <StatusDivider />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 160 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#8892b0',
          }}
        >
          <span>⚡ 体力</span>
          <span style={{ fontFamily: 'monospace', color: getStaminaColor() }}>
            {stamina}/{maxStamina}
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: '#112240',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${staminaPct}%`,
              backgroundColor: getStaminaColor(),
              transition: 'all 0.3s ease',
              boxShadow: `0 0 6px ${getStaminaColor()}80`,
            }}
          />
        </div>
      </div>

      <StatusDivider />

      <StatusItem
        label="回合"
        value={`#${turn}`}
        icon="🔄"
        mono
      />

      <StatusDivider />

      <StatusItem
        label="收集部件"
        value={`${collectedParts.length}`}
        icon="🎒"
      />

      <StatusDivider />

      <StatusItem
        label="修复进度"
        value={`${repairedCount}/${totalSlots}`}
        valueColor={repairedCount === totalSlots ? '#48bb78' : '#ecc94b'}
        icon="⚙️"
      />

      {gameView === 'diving' && (
        <>
          <StatusDivider />
          <StatusItem
            label="深度"
            value={`${depth}m`}
            valueColor={depth > 50 ? '#f56565' : '#9f7aea'}
            icon="🌊"
            mono
          />
        </>
      )}
    </div>
  );
};

const StatusItem: React.FC<{
  label: string;
  value: string;
  icon?: string;
  valueColor?: string;
  mono?: boolean;
}> = ({ label, value, icon, valueColor = '#ccd6f6', mono = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: 10, color: '#5a6a85' }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: valueColor,
          fontFamily: mono ? 'monospace' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  </div>
);

const StatusDivider: React.FC = () => (
  <div
    style={{
      width: 1,
      height: 28,
      background: 'linear-gradient(180deg, transparent, rgba(100,255,218,0.2), transparent)',
    }}
  />
);

export default StatusBar;
