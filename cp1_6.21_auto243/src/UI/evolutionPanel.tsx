import React from 'react';
import { GameState } from '../GameCore/gameEngine';

interface EvolutionPanelProps {
  state: GameState;
  onPurchase: (id: string) => void;
}

export const EvolutionPanel: React.FC<EvolutionPanelProps> = ({ state, onPurchase }) => {
  const { evolutionPoints, upgrades } = state;

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      width: 300,
      maxHeight: 'calc(100vh - 32px)',
      overflowY: 'auto',
      background: 'rgba(26, 32, 44, 0.92)',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      animation: 'panelSlideIn 0.3s ease-out',
      zIndex: 15,
    }}>
      <style>{`
        @keyframes panelSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 10,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{
          color: '#E2E8F0',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 1,
        }}>
          进化面板
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#4FD1C5',
            boxShadow: '0 0 6px rgba(79, 209, 197, 0.6)',
          }} />
          <span style={{
            color: '#81E6D9',
            fontSize: 18,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {evolutionPoints}
          </span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {upgrades.map((upgrade) => {
          const disabled = upgrade.purchased || !upgrade.canAfford;
          return (
            <UpgradeCard
              key={upgrade.id}
              upgrade={upgrade}
              disabled={disabled}
              onPurchase={() => onPurchase(upgrade.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

interface UpgradeCardProps {
  upgrade: {
    id: string;
    name: string;
    description: string;
    cost: number;
    purchased: boolean;
    canAfford: boolean;
  };
  disabled: boolean;
  onPurchase: () => void;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({ upgrade, disabled, onPurchase }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !disabled && onPurchase()}
      style={{
        background: upgrade.purchased
          ? 'rgba(79, 209, 197, 0.1)'
          : disabled
            ? '#1A202C'
            : '#2D3748',
        borderRadius: 8,
        padding: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !upgrade.purchased ? 0.5 : 1,
        transform: hovered && !disabled ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered && !disabled
          ? '0 6px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(79, 209, 197, 0.2)'
          : '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'all 0.2s ease',
        border: upgrade.purchased
          ? '1px solid rgba(79, 209, 197, 0.3)'
          : '1px solid transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {upgrade.purchased && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#4FD1C5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          color: '#1A202C',
          fontWeight: 700,
        }}>
          ✓
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
      }}>
        <span style={{
          color: upgrade.purchased ? '#4FD1C5' : '#E2E8F0',
          fontSize: 14,
          fontWeight: 600,
        }}>
          {upgrade.name}
        </span>
        <span style={{
          color: upgrade.purchased ? '#4FD1C5' : '#F6AD55',
          fontSize: 12,
          fontWeight: 600,
          background: upgrade.purchased
            ? 'rgba(79, 209, 197, 0.15)'
            : 'rgba(246, 173, 85, 0.1)',
          padding: '2px 8px',
          borderRadius: 10,
          whiteSpace: 'nowrap',
        }}>
          {upgrade.purchased ? '已解锁' : `${upgrade.cost} 点`}
        </span>
      </div>

      <span style={{
        color: '#A0AEC0',
        fontSize: 12,
        lineHeight: 1.4,
      }}>
        {upgrade.description}
      </span>
    </div>
  );
};
