import React, { useState, useCallback, keyframes } from 'react';
import { ShipType } from '../game/UnitData';

interface FleetBuilderProps {
  onWarp: (fleet: { type: ShipType; slot: number }[]) => void;
}

const SHIP_INFO: Record<ShipType, {
  label: string;
  icon: string;
  shield: number;
  armor: number;
  speed: number;
  weapons: string[];
}> = {
  frigate: {
    label: '护卫舰',
    icon: '▲',
    shield: 60,
    armor: 30,
    speed: 4,
    weapons: ['脉冲炮', '激光阵列'],
  },
  cruiser: {
    label: '巡洋舰',
    icon: '◆',
    shield: 100,
    armor: 60,
    speed: 3,
    weapons: ['重型激光', '导弹发射器'],
  },
  battleship: {
    label: '战列舰',
    icon: '⬡',
    shield: 150,
    armor: 100,
    speed: 2,
    weapons: ['主炮', '鱼雷阵列'],
  },
};

const particleTrail = keyframes`
  0% { transform: translateY(0) scale(1); opacity: 0.8; }
  100% { transform: translateY(-30px) scale(0.2); opacity: 0; }
`;

const springIn = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const rippleEffect = keyframes`
  0% { transform: scale(0.3); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
`;

const breathGlow = keyframes`
  0%, 100% { box-shadow: 0 0 15px rgba(0,212,255,0.4), 0 0 30px rgba(0,212,255,0.2); }
  50% { box-shadow: 0 0 25px rgba(0,212,255,0.7), 0 0 50px rgba(0,212,255,0.4); }
`;

const warpExpand = keyframes`
  0% { transform: scale(0); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: scale(4); opacity: 0; }
`;

const starStreak = keyframes`
  0% { transform: translateX(0) translateY(0); opacity: 1; }
  100% { transform: translateX(var(--streak-x)) translateY(var(--streak-y)); opacity: 0; }
`;

const titleGlow = keyframes`
  0%, 100% { text-shadow: 0 0 10px rgba(0,212,255,0.6), 0 0 20px rgba(0,212,255,0.3); }
  50% { text-shadow: 0 0 20px rgba(0,212,255,0.9), 0 0 40px rgba(0,212,255,0.5), 0 0 60px rgba(0,212,255,0.3); }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fbParticleTrail {
    0% { transform: translateY(0) scale(1); opacity: 0.8; }
    100% { transform: translateY(-30px) scale(0.2); opacity: 0; }
  }
  @keyframes fbSpringIn {
    0% { transform: scale(0.5); opacity: 0; }
    60% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes fbRippleEffect {
    0% { transform: scale(0.3); opacity: 0.6; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  @keyframes fbBreathGlow {
    0%, 100% { box-shadow: 0 0 15px rgba(0,212,255,0.4), 0 0 30px rgba(0,212,255,0.2); }
    50% { box-shadow: 0 0 25px rgba(0,212,255,0.7), 0 0 50px rgba(0,212,255,0.4); }
  }
  @keyframes fbWarpExpand {
    0% { transform: scale(0); opacity: 0; }
    30% { opacity: 1; }
    100% { transform: scale(4); opacity: 0; }
  }
  @keyframes fbStarStreak {
    0% { transform: translateX(0) translateY(0) scaleX(1); opacity: 1; }
    100% { transform: translateX(var(--streak-x,0px)) translateY(var(--streak-y,0px)) scaleX(3); opacity: 0; }
  }
  @keyframes fbTitleGlow {
    0%, 100% { text-shadow: 0 0 10px rgba(0,212,255,0.6), 0 0 20px rgba(0,212,255,0.3); }
    50% { text-shadow: 0 0 20px rgba(0,212,255,0.9), 0 0 40px rgba(0,212,255,0.5), 0 0 60px rgba(0,212,255,0.3); }
  }
  @keyframes fbWarpRotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

const ShipCard: React.FC<{
  type: ShipType;
  onDragStart: (e: React.DragEvent) => void;
}> = ({ type, onDragStart }) => {
  const info = SHIP_INFO[type];
  const [hovered, setHovered] = useState(false);

  const particles = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: 'rgba(10,14,23,0.85)',
        border: `1.5px solid ${hovered ? '#00d4ff' : 'rgba(0,212,255,0.25)'}`,
        borderRadius: 8,
        padding: '14px 16px',
        cursor: 'grab',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        boxShadow: hovered
          ? '0 0 18px rgba(0,212,255,0.5), 0 0 36px rgba(0,212,255,0.2), inset 0 0 12px rgba(0,212,255,0.1)'
          : '0 0 6px rgba(0,212,255,0.1)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {particles.map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: 8 + i * 6,
            left: 20 + i * 18,
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: '#00d4ff',
            animation: `fbParticleTrail ${1.2 + i * 0.3}s ease-out infinite`,
            animationDelay: `${i * 0.25}s`,
            pointerEvents: 'none',
          }}
        />
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span
          style={{
            fontSize: type === 'battleship' ? 32 : type === 'cruiser' ? 28 : 24,
            color: '#00d4ff',
            filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.6))',
            lineHeight: 1,
          }}
        >
          {info.icon}
        </span>
        <div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, color: '#e0f0ff', fontWeight: 700 }}>
            {info.label}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(0,212,255,0.6)', fontFamily: "'Orbitron', sans-serif", marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
            {type}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#8ab4d0', marginBottom: 6 }}>
        <span>🛡 {info.shield}</span>
        <span>🔩 {info.armor}</span>
        <span>⚡ {info.speed}</span>
      </div>
      <div style={{ fontSize: 10, color: '#ff4d2a', letterSpacing: 0.5 }}>
        {info.weapons.join(' / ')}
      </div>
    </div>
  );
};

const FormationCell: React.FC<{
  slot: number;
  ship: ShipType | null;
  onDrop: (slot: number, type: ShipType) => void;
  onRemove: (slot: number) => void;
  isDragOver: boolean;
  onDragOverChange: (slot: number, over: boolean) => void;
}> = ({ slot, ship, onDrop, onRemove, isDragOver, onDragOverChange }) => {
  const [ripple, setRipple] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onDragOverChange(slot, false);
      const type = e.dataTransfer.getData('ship-type') as ShipType;
      if (type && !ship) {
        setRipple(true);
        setTimeout(() => setRipple(false), 600);
        onDrop(slot, type);
      }
    },
    [slot, ship, onDrop, onDragOverChange],
  );

  const info = ship ? SHIP_INFO[ship] : null;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverChange(slot, true);
      }}
      onDragLeave={() => onDragOverChange(slot, false)}
      onDrop={handleDrop}
      onContextMenu={(e) => {
        e.preventDefault();
        if (ship) onRemove(slot);
      }}
      onDoubleClick={() => {
        if (ship) onRemove(slot);
      }}
      style={{
        position: 'relative',
        width: 130,
        height: 130,
        background: isDragOver
          ? 'rgba(0,212,255,0.08)'
          : ship
          ? 'rgba(10,14,23,0.7)'
          : 'rgba(10,14,23,0.4)',
        border: `1.5px solid ${isDragOver ? 'rgba(0,212,255,0.7)' : ship ? 'rgba(0,212,255,0.35)' : 'rgba(0,212,255,0.12)'}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        boxShadow: isDragOver
          ? '0 0 20px rgba(0,212,255,0.3), inset 0 0 15px rgba(0,212,255,0.1)'
          : ship
          ? '0 0 8px rgba(0,212,255,0.15)'
          : 'none',
        cursor: ship ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      {ripple && (
        <div
          style={{
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '2px solid rgba(0,212,255,0.6)',
            animation: 'fbRippleEffect 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}
      {!ship && (
        <span
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 22,
            color: 'rgba(0,212,255,0.12)',
            fontWeight: 700,
          }}
        >
          {slot}
        </span>
      )}
      {ship && info && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'fbSpringIn 0.4s ease-out',
          }}
        >
          <span
            style={{
              fontSize: ship === 'battleship' ? 34 : ship === 'cruiser' ? 28 : 22,
              color: '#00d4ff',
              filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.7))',
              lineHeight: 1,
            }}
          >
            {info.icon}
          </span>
          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 11,
              color: '#c0dff0',
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            {info.label}
          </span>
          <div style={{ display: 'flex', gap: 8, fontSize: 9, color: '#7aa8c4', marginTop: 4 }}>
            <span>🛡{info.shield}</span>
            <span>🔩{info.armor}</span>
            <span>⚡{info.speed}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const WarpOverlay: React.FC = () => {
  const streaks = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360;
    const rad = (angle * Math.PI) / 180;
    const dist = 200 + Math.random() * 300;
    return {
      id: i,
      angle,
      tx: Math.cos(rad) * dist,
      ty: Math.sin(rad) * dist,
      delay: Math.random() * 0.3,
    };
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.8) 0%, rgba(0,100,200,0.4) 40%, transparent 70%)',
          animation: 'fbWarpExpand 1.5s ease-out forwards',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,77,42,0.3) 0%, transparent 60%)',
          animation: 'fbWarpExpand 1.5s ease-out 0.15s forwards',
        }}
      />
      {streaks.map((s) => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            width: 3,
            height: 1,
            background: 'linear-gradient(90deg, rgba(0,212,255,0.9), transparent)',
            transformOrigin: 'center',
            '--streak-x': `${s.tx}px`,
            '--streak-y': `${s.ty}px`,
            animation: `fbStarStreak 0.9s linear ${s.delay}s forwards`,
            left: '50%',
            top: '50%',
          } as React.CSSProperties}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          border: '1px solid rgba(0,212,255,0.15)',
          animation: 'fbWarpRotate 2s linear infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          border: '1px solid rgba(0,212,255,0.1)',
          animation: 'fbWarpRotate 1.5s linear infinite reverse',
        }}
      />
    </div>
  );
};

export const FleetBuilder: React.FC<FleetBuilderProps> = ({ onWarp }) => {
  const [formation, setFormation] = useState<(ShipType | null)[]>(Array(9).fill(null));
  const [isWarping, setIsWarping] = useState(false);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const shipTypes: ShipType[] = ['frigate', 'cruiser', 'battleship'];

  const handleDragStart = useCallback((type: ShipType) => (e: React.DragEvent) => {
    e.dataTransfer.setData('ship-type', type);
    e.dataTransfer.effectAllowed = 'copy';
    if (e.currentTarget instanceof HTMLElement) {
      const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
      ghost.style.opacity = '0.7';
      ghost.style.filter = 'drop-shadow(0 0 12px rgba(0,212,255,0.6))';
      ghost.style.position = 'absolute';
      ghost.style.top = '-9999px';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 60, 40);
      requestAnimationFrame(() => document.body.removeChild(ghost));
    }
  }, []);

  const handleDrop = useCallback((slot: number, type: ShipType) => {
    setFormation((prev) => {
      const next = [...prev];
      next[slot] = type;
      return next;
    });
  }, []);

  const handleRemove = useCallback((slot: number) => {
    setFormation((prev) => {
      const next = [...prev];
      next[slot] = null;
      return next;
    });
  }, []);

  const handleDragOverChange = useCallback((slot: number, over: boolean) => {
    setDragOverSlot(over ? slot : null);
  }, []);

  const hasShips = formation.some((s) => s !== null);

  const handleWarp = useCallback(() => {
    if (!hasShips || isWarping) return;
    setIsWarping(true);
    setTimeout(() => {
      const fleet = formation
        .map((type, slot) => (type ? { type, slot } : null))
        .filter(Boolean) as { type: ShipType; slot: number }[];
      onWarp(fleet);
    }, 1500);
  }, [hasShips, isWarping, formation, onWarp]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        background: 'radial-gradient(ellipse at 30% 50%, rgba(0,30,60,0.5) 0%, rgba(5,8,15,1) 70%)',
        fontFamily: "'Orbitron', sans-serif",
        color: '#c0dff0',
        overflow: 'hidden',
      }}
    >
      {isWarping && <WarpOverlay />}

      <div
        style={{
          width: '40%',
          height: '100%',
          background: 'rgba(10,14,23,0.9)',
          borderRight: '1px solid rgba(0,212,255,0.15)',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 24px',
          overflowY: 'auto',
        }}
      >
        <h2
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 20,
            color: '#00d4ff',
            marginBottom: 24,
            fontWeight: 700,
            letterSpacing: 3,
            animation: 'fbTitleGlow 3s ease-in-out infinite',
          }}
        >
          可用舰船
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {shipTypes.map((type) => (
            <ShipCard
              key={type}
              type={type}
              onDragStart={handleDragStart(type)}
            />
          ))}
        </div>
        <div style={{ marginTop: 24, fontSize: 10, color: 'rgba(0,212,255,0.35)', lineHeight: 1.6 }}>
          <div>▸ Drag ships to the formation grid</div>
          <div>▸ Right-click or double-click to remove</div>
          <div>▸ Multiple copies allowed</div>
        </div>
      </div>

      <div
        style={{
          width: '60%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 28,
          gap: 28,
        }}
      >
        <h2
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 20,
            color: '#00d4ff',
            fontWeight: 700,
            letterSpacing: 3,
            animation: 'fbTitleGlow 3s ease-in-out infinite',
          }}
        >
          编队阵型
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 130px)',
            gridTemplateRows: 'repeat(3, 130px)',
            gap: 10,
          }}
        >
          {formation.map((ship, slot) => (
            <FormationCell
              key={slot}
              slot={slot}
              ship={ship}
              onDrop={handleDrop}
              onRemove={handleRemove}
              isDragOver={dragOverSlot === slot}
              onDragOverChange={handleDragOverChange}
            />
          ))}
        </div>

        <button
          onClick={handleWarp}
          disabled={!hasShips || isWarping}
          style={{
            marginTop: 12,
            padding: '14px 48px',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 3,
            color: hasShips && !isWarping ? '#fff' : 'rgba(255,255,255,0.3)',
            background: hasShips && !isWarping
              ? 'linear-gradient(135deg, rgba(0,212,255,0.25) 0%, rgba(0,100,200,0.15) 100%)'
              : 'rgba(30,40,60,0.3)',
            border: hasShips && !isWarping
              ? '1.5px solid rgba(0,212,255,0.6)'
              : '1.5px solid rgba(0,212,255,0.15)',
            borderRadius: 8,
            cursor: hasShips && !isWarping ? 'pointer' : 'not-allowed',
            transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
            animation: hasShips && !isWarping ? 'fbBreathGlow 2s ease-in-out infinite' : 'none',
            transform: 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (hasShips && !isWarping) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          跃迁出征
        </button>
      </div>
    </div>
  );
};

export default FleetBuilder;
