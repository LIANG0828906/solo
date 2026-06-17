import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Ship, Asteroid } from '../game/types';

const SHIELD_COOLDOWN_DEFAULT = 10000;

export const GameHUD: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const ships = useGameStore((s) => s.ships);
  const players = useGameStore((s) => s.players);
  const asteroids = useGameStore((s) => s.asteroids);
  const canvasWidth = useGameStore((s) => s.canvasWidth);
  const canvasHeight = useGameStore((s) => s.canvasHeight);

  if (gameState !== 'playing') return null;

  const player1Ship = ships[0];
  const player2Ship = ships[1];
  const player1Data = player1Ship ? players.find((p) => p.id === player1Ship.playerId) : undefined;
  const player2Data = player2Ship ? players.find((p) => p.id === player2Ship.playerId) : undefined;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {player1Ship && (
        <PlayerPanel
          ship={player1Ship}
          player={player1Data}
          side="left"
          upgradeKey="1"
        />
      )}
      {player2Ship && (
        <PlayerPanel
          ship={player2Ship}
          player={player2Data}
          side="right"
          upgradeKey="2"
        />
      )}
      <Minimap ships={ships} asteroids={asteroids} canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
    </div>
  );
};

interface PlayerPanelProps {
  ship: Ship;
  player: { kills: number; name: string; color: string } | undefined;
  side: 'left' | 'right';
  upgradeKey: string;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({ ship, player, side, upgradeKey }) => {
  const isLeft = side === 'left';
  const healthPercent = (ship.health / ship.maxHealth) * 100;
  const mineralPercent = (ship.minerals / 1000) * 100;
  const weaponPercent = Math.max(0, 100 - (ship.weaponCooldown / ship.fireRate) * 100);

  let shieldPercent: number;
  let shieldStatus: string;
  if (ship.isShieldActive) {
    shieldPercent = (ship.shieldHealth / ship.shieldMax) * 100;
    shieldStatus = `激活 ${((ship.shieldHealth / ship.shieldMax) * 5).toFixed(1)}s`;
  } else if (ship.shieldCooldown > 0) {
    shieldPercent = Math.max(0, 100 - (ship.shieldCooldown / SHIELD_COOLDOWN_DEFAULT) * 100);
    shieldStatus = `冷却 ${(ship.shieldCooldown / 1000).toFixed(1)}s`;
  } else {
    shieldPercent = 100;
    shieldStatus = '就绪';
  }
  const shieldValueColor = ship.isShieldActive ? '#00D4FF' : ship.shieldCooldown <= 0 ? '#5DADE2' : '#8892B0';

  const borderColor = isLeft ? '#4fc3f7' : '#ef5350';
  const panelColor = isLeft ? '#4fc3f7' : '#ef5350';

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        [isLeft ? 'left' : 'right']: '16px',
        width: '250px',
        background: '#1A1D2E',
        borderRadius: '8px',
        padding: '14px 16px',
        boxShadow: '0 4px 20px #00000040, 0 0 0 1px rgba(255,255,255,0.04)',
        border: `2px solid ${borderColor}`,
        fontFamily: '"Courier New", Courier, monospace',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: `1px solid ${borderColor}50`,
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: panelColor,
            boxShadow: `0 0 10px ${panelColor}`,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: panelColor,
            letterSpacing: '2px',
          }}
        >
          {player?.name ?? (isLeft ? '玩家 1' : '玩家 2')}
        </div>
        <div
          style={{
            marginLeft: 'auto',
            fontSize: '13px',
            color: '#F1C40F',
            fontWeight: 'bold',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {ship.minerals}
        </div>
      </div>

      <StatBar
        label="生命值"
        percent={healthPercent}
        gradientStart="#2ECC71"
        gradientEnd="#E74C3C"
        value={`${Math.ceil(ship.health)}/${ship.maxHealth}`}
        valueColor="#ffffff"
        isHealth
      />

      <StatBar
        label="矿物储量"
        percent={mineralPercent}
        gradientStart="#B7950B"
        gradientEnd="#F1C40F"
        value={`${ship.minerals}`}
        valueColor="#F1C40F"
      />

      <StatBar
        label="武器冷却"
        percent={weaponPercent}
        gradientStart="#1F618D"
        gradientEnd="#3498DB"
        value={ship.weaponCooldown > 0 ? `${(ship.weaponCooldown / 1000).toFixed(1)}s` : '就绪'}
        valueColor={ship.weaponCooldown <= 0 ? '#5DADE2' : '#8892B0'}
      />

      <StatBar
        label="护盾状态"
        percent={shieldPercent}
        gradientStart="#085E7D"
        gradientEnd="#00D4FF"
        value={shieldStatus}
        valueColor={shieldValueColor}
        glow={ship.isShieldActive}
      />

      <div
        style={{
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: `1px solid ${borderColor}40`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            color: '#8892B0',
          }}
        >
          击杀数 KDA
        </div>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#F1C40F',
            textShadow: '0 0 8px rgba(241, 196, 15, 0.4)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {String(player?.kills ?? 0).padStart(2, '0')}
        </div>
      </div>

      {ship.minerals >= 50 && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 10px',
            background: 'rgba(241, 196, 15, 0.1)',
            border: '1px solid rgba(241, 196, 15, 0.4)',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#F1C40F',
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: '"Courier New", Courier, monospace',
            animation: 'upgrade-pulse 1.5s ease-in-out infinite',
          }}
        >
          💎 按 [{upgradeKey}] 升级飞船
          <style>{`
            @keyframes upgrade-pulse {
              0%, 100% { opacity: 0.7; box-shadow: 0 0 0 0 rgba(241, 196, 15, 0.4); }
              50% { opacity: 1; box-shadow: 0 0 12px 2px rgba(241, 196, 15, 0.3); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

interface StatBarProps {
  label: string;
  percent: number;
  gradientStart: string;
  gradientEnd: string;
  value: string;
  valueColor?: string;
  glow?: boolean;
  isHealth?: boolean;
}

const StatBar: React.FC<StatBarProps> = ({
  label,
  percent,
  gradientStart,
  gradientEnd,
  value,
  valueColor,
  glow,
  isHealth,
}) => {
  const safePercent = Math.max(0, Math.min(100, percent));

  let gradientStyle: React.CSSProperties;
  if (isHealth) {
    if (safePercent > 60) {
      gradientStyle = { background: 'linear-gradient(90deg, #2ECC71, #58D68D)' };
    } else if (safePercent > 30) {
      gradientStyle = { background: 'linear-gradient(90deg, #F39C12, #F1C40F)' };
    } else {
      gradientStyle = { background: 'linear-gradient(90deg, #E74C3C, #FF6B6B)' };
    }
  } else {
    gradientStyle = { background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})` };
  }

  return (
    <div style={{ marginBottom: '8px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '3px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: '#8892B0',
            letterSpacing: '1px',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 'bold',
            color: valueColor || '#D5D8DC',
            fontVariantNumeric: 'tabular-nums',
            fontFamily: '"Courier New", Courier, monospace',
          }}
        >
          {value}
        </div>
      </div>
      <div
        style={{
          width: '100%',
          height: '8px',
          background: '#0D0F1A',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            ...gradientStyle,
            height: '100%',
            width: `${safePercent}%`,
            borderRadius: '4px',
            transition: 'width 0.15s ease-out',
            position: 'relative',
            boxShadow: glow
              ? `0 0 12px ${gradientEnd}, inset 0 1px 0 rgba(255,255,255,0.3)`
              : 'inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface MinimapProps {
  ships: Ship[];
  asteroids: Asteroid[];
  canvasWidth: number;
  canvasHeight: number;
}

const Minimap: React.FC<MinimapProps> = ({ ships, asteroids, canvasWidth, canvasHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapSize = 200;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const gridCount = 5;
    for (let i = 1; i < gridCount; i++) {
      const pos = (i / gridCount) * w;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(w, pos);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    const scaleX = minimapSize / canvasWidth;
    const scaleY = minimapSize / canvasHeight;

    asteroids.forEach((a) => {
      const mx = a.position.x * scaleX;
      const my = a.position.y * scaleY;
      ctx.beginPath();
      ctx.arc(mx, my, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(150, 150, 150, 0.7)';
      ctx.fill();
    });

    ships.forEach((ship, idx) => {
      const mx = ship.position.x * scaleX;
      const my = ship.position.y * scaleY;
      const playerColor = idx === 0 ? '#4fc3f7' : '#ef5350';

      if (ship.isShieldActive) {
        ctx.beginPath();
        ctx.arc(mx, my, 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00D4FF';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(mx, my, 6, 0, Math.PI * 2);
      ctx.fillStyle = playerColor;
      ctx.shadowColor = playerColor;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const angle = ship.rotation;
      const dirLen = 10;
      const dirX = Math.cos(angle - Math.PI / 2) * dirLen;
      const dirY = Math.sin(angle - Math.PI / 2) * dirLen;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + dirX, my + dirY);
      ctx.strokeStyle = playerColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [ships, asteroids, canvasWidth, canvasHeight]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '280px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '8px',
        padding: '6px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color: '#8892B0',
          fontFamily: '"Courier New", Courier, monospace',
          textAlign: 'center',
          marginBottom: '4px',
          letterSpacing: '2px',
        }}
      >
        战术雷达
      </div>
      <canvas
        ref={canvasRef}
        width={minimapSize}
        height={minimapSize}
        style={{
          display: 'block',
          borderRadius: '4px',
        }}
      />
    </div>
  );
};
