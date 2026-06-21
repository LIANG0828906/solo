import React from 'react';
import { GameState } from '../GameCore/gameEngine';

interface HUDProps {
  state: GameState;
}

export const HUD: React.FC<HUDProps> = ({ state }) => {
  const { score, hp, maxHp, evolutionPoints, spinAttackUnlocked, spinAttackCooldown, spinAttackMaxCooldown } = state;

  const hpBars = [];
  for (let i = 0; i < maxHp; i++) {
    hpBars.push(
      <div
        key={i}
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: i < hp
            ? 'linear-gradient(135deg, #48BB78, #38A169)'
            : 'rgba(255,255,255,0.1)',
          border: i < hp ? '1.5px solid #68D391' : '1.5px solid rgba(255,255,255,0.15)',
          transition: 'all 0.3s ease',
          boxShadow: i < hp ? '0 0 6px rgba(72, 187, 120, 0.5)' : 'none',
        }}
      />
    );
  }

  const cooldownPercent = spinAttackUnlocked
    ? Math.max(0, spinAttackCooldown / spinAttackMaxCooldown) * 100
    : 0;

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: 16,
      right: 316,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      pointerEvents: 'none',
      zIndex: 20,
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1A202C, #2D3748)',
          borderRadius: 12,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          <span style={{ color: '#A0AEC0', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>
            HP
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {hpBars}
          </div>
        </div>

        {spinAttackUnlocked && (
          <div style={{
            background: 'linear-gradient(135deg, #1A202C, #2D3748)',
            borderRadius: 12,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}>
            <span style={{ color: '#4FD1C5', fontSize: 12, fontWeight: 600 }}>
              旋转攻击
            </span>
            <div style={{
              width: 80,
              height: 6,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${100 - cooldownPercent}%`,
                height: '100%',
                borderRadius: 3,
                background: cooldownPercent > 0
                  ? 'linear-gradient(90deg, #4FD1C5, #38B2AC)'
                  : '#4FD1C5',
                transition: 'width 0.1s linear',
              }} />
            </div>
            {spinAttackCooldown > 0 && (
              <span style={{ color: '#718096', fontSize: 11 }}>
                {spinAttackCooldown.toFixed(1)}s
              </span>
            )}
            {spinAttackCooldown <= 0 && (
              <span style={{ color: '#4FD1C5', fontSize: 11, fontWeight: 600 }}>
                就绪
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: 12,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1A202C, #2D3748)',
          borderRadius: 12,
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          <span style={{ color: '#F6AD55', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>
            得分
          </span>
          <span style={{
            color: '#FBD38D',
            fontSize: 20,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
          }}>
            {score}
          </span>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1A202C, #2D3748)',
          borderRadius: 12,
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          <span style={{ color: '#4FD1C5', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>
            进化点
          </span>
          <span style={{
            color: '#81E6D9',
            fontSize: 20,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
          }}>
            {evolutionPoints}
          </span>
        </div>
      </div>
    </div>
  );
};
