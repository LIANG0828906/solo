import React, { useEffect, useState } from 'react';
import { GameState, COMBO_SPELL_NAMES, ElementType, ELEMENT_NAMES, ELEMENT_COLORS } from './types';

interface StatusPanelProps {
  gameState: GameState;
}

interface AnimatedNumberProps {
  value: number;
  color?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, color = '#ffffff' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setAnimating(true);
      const diff = value - displayValue;
      const steps = 10;
      const stepValue = diff / steps;
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(value);
          clearInterval(timer);
          setAnimating(false);
        } else {
          setDisplayValue(Math.round(displayValue + stepValue * currentStep));
        }
      }, 40);
      return () => clearInterval(timer);
    }
  }, [value, displayValue]);

  return (
    <span
      style={{
        display: 'inline-block',
        minWidth: '32px',
        color,
        fontWeight: 'bold',
        fontSize: '20px',
        animation: animating ? 'numberTicker 400ms ease-in-out' : 'none',
      }}
    >
      {displayValue}
    </span>
  );
};

const StatusPanel: React.FC<StatusPanelProps> = ({ gameState }) => {
  return (
    <div
      style={{
        width: '100%',
        padding: '16px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        color: '#ffffff',
      }}
    >
      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#8888ff' }}>
        ⚔ 战斗状态
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#aaaaaa', fontSize: '14px' }}>充能层数</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  background: i < gameState.chargeLevel ? '#ffdd00' : 'rgba(255,255,255,0.1)',
                  boxShadow: i < gameState.chargeLevel ? '0 0 8px #ffdd00' : 'none',
                  transition: 'all 0.4s ease',
                }}
              />
            ))}
            <AnimatedNumber value={gameState.chargeLevel} color="#ffdd00" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#aaaaaa', fontSize: '14px' }}>释放次数</span>
          <AnimatedNumber value={gameState.spellCastCount} color="#66ff66" />
        </div>

        <div
          style={{
            marginTop: '8px',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ color: '#aaaaaa', fontSize: '12px', marginBottom: '8px' }}>元素仓库剩余</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {Object.values(ElementType).map((elem) => (
              <div
                key={elem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: ELEMENT_COLORS[elem],
                    boxShadow: `0 0 6px ${ELEMENT_COLORS[elem]}`,
                  }}
                />
                <span style={{ fontSize: '12px', color: '#cccccc' }}>{ELEMENT_NAMES[elem]}</span>
                <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: 'bold', color: ELEMENT_COLORS[elem] }}>
                  {gameState.elementInventory[elem]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: '8px',
            padding: '12px',
            borderRadius: '8px',
            background: gameState.activeCombo ? 'rgba(255,200,100,0.15)' : 'rgba(0,0,0,0.3)',
            border: gameState.activeCombo ? '1px solid rgba(255,200,100,0.3)' : 'none',
            minHeight: '50px',
          }}
        >
          <div style={{ color: '#aaaaaa', fontSize: '12px', marginBottom: '4px' }}>当前组合</div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: gameState.activeCombo ? '#ffcc66' : '#555555',
              transition: 'all 0.3s ease',
            }}
          >
            {gameState.activeCombo ? `✦ ${COMBO_SPELL_NAMES[gameState.activeCombo]}` : '无激活组合'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
