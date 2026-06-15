import React, { useState } from 'react';
import { usePetStore } from '../store/petStore';

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}

const ControlButton: React.FC<ControlButtonProps> = ({ onClick, disabled, icon, label }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsPressed(true);
    onClick();
    setTimeout(() => setIsPressed(false), 100);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '14px 10px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: disabled ? '#94a3b8' : '#4a90d9',
        color: '#ffffff',
        fontSize: '13px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        transform: isPressed ? 'scale(0.9)' : 'scale(1)',
        boxShadow: disabled ? 'none' : '0 2px 8px rgba(74, 144, 217, 0.3)',
        minWidth: '80px',
        flex: 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#357abd';
          e.currentTarget.style.boxShadow = '0 0 12px rgba(74, 144, 217, 0.6)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#4a90d9';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 144, 217, 0.3)';
        }
      }}
    >
      <div style={{ fontSize: '24px', lineHeight: 1 }}>{icon}</div>
      <span>{label}</span>
    </button>
  );
};

export const ControlPanel: React.FC = () => {
  const { feed, clean, play, train, startBattle, endBattle, battle, pet } = usePetStore();

  const isBattleActive = battle.isActive;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            color: '#1e293b',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          🎮 控制面板
        </h3>
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748b' }}>
          {isBattleActive ? '对战进行中...' : '照顾你的宠物，让它茁壮成长！'}
        </p>
      </div>

      {isBattleActive && battle.opponent && (
        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>对手信息</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>
                {battle.opponent.name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Lv.{battle.opponent.level} · 主人: {battle.opponent.ownerName}
              </div>
            </div>
            <button
              onClick={endBattle}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px',
                background: '#64748b',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#475569')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#64748b')}
            >
              退出对战
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
        }}
      >
        <ControlButton
          onClick={feed}
          disabled={isBattleActive}
          icon={<span>🍞</span>}
          label="喂食"
        />
        <ControlButton
          onClick={clean}
          disabled={isBattleActive}
          icon={<span>💧</span>}
          label="清洁"
        />
        <ControlButton
          onClick={play}
          disabled={isBattleActive}
          icon={<span>⚽</span>}
          label="玩耍"
        />
        <ControlButton
          onClick={train}
          disabled={isBattleActive}
          icon={<span>📖</span>}
          label="训练"
        />
      </div>

      <div style={{ paddingTop: '4px' }}>
        <ControlButton
          onClick={startBattle}
          disabled={isBattleActive || pet.energy < 20}
          icon={<span>⚔️</span>}
          label={isBattleActive ? '对战中...' : pet.energy < 20 ? '活力不足' : '开始对战'}
        />
      </div>

      <div
        style={{
          padding: '12px',
          borderRadius: '10px',
          background: 'rgba(248, 250, 252, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>
          经验值进度
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
            Lv.{pet.level}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
            Lv.{pet.level + 1}
          </span>
        </div>
        <div
          style={{
            height: '8px',
            borderRadius: '4px',
            background: '#e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(pet.exp / pet.expToNextLevel) * 100}%`,
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginTop: '4px' }}>
          {pet.exp} / {pet.expToNextLevel} EXP
        </div>
      </div>
    </div>
  );
};
