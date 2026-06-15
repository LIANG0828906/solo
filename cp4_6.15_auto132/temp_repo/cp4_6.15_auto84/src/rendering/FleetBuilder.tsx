import React, { useState, useCallback, useRef, useEffect } from 'react';
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

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fbParticleTrail {
    0% { transform: translateY(0) scale(1); opacity: 0.8; }
    100% { transform: translateY(-30px) scale(0.2); opacity: 0; }
  }
  @keyframes fbSpringIn {
    0% { transform: scale(0.5); opacity: 0; }
    45% { transform: scale(1.12); opacity: 1; }
    70% { transform: scale(0.96); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes fbRippleEffect {
    0% { transform: scale(0.3); opacity: 0.7; }
    100% { transform: scale(2.8); opacity: 0; }
  }
  @keyframes fbRippleEffect2 {
    0% { transform: scale(0.2); opacity: 0.5; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes fbRippleEffect3 {
    0% { transform: scale(0.1); opacity: 0.3; }
    100% { transform: scale(2); opacity: 0; }
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
  @keyframes fbGhostPulse {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.15); opacity: 0.3; }
  }
  @keyframes fbGhostPulse2 {
    0%, 100% { transform: scale(0.85); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 0.5; }
  }
  @keyframes fbTrailParticle {
    0% { transform: translate(0, 0) scale(1); opacity: 0.9; }
    100% { transform: translate(var(--tx), var(--ty)) scale(0.1); opacity: 0; }
  }
  @keyframes fbBurstParticle {
    0% { transform: translate(0, 0) scale(1); opacity: 1; }
    100% { transform: translate(var(--bx), var(--by)) scale(0); opacity: 0; }
  }
  @keyframes fbGlowFlash {
    0% { opacity: 1; transform: scale(0.5); }
    100% { opacity: 0; transform: scale(2); }
  }
  @keyframes fbCrosshairPulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.08); }
  }
  @keyframes fbCellGlowPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(0,212,255,0.4), inset 0 0 20px rgba(0,212,255,0.15); }
    50% { box-shadow: 0 0 40px rgba(0,212,255,0.7), inset 0 0 30px rgba(0,212,255,0.25); }
  }
  @keyframes fbEngineParticle {
    0% { transform: translateY(0) scale(1); opacity: 0.7; }
    100% { transform: translateY(20px) scale(0.2); opacity: 0; }
  }
`;
document.head.appendChild(styleSheet);

const ShipCard: React.FC<{
  type: ShipType;
  onMouseDown: (e: React.MouseEvent, type: ShipType) => void;
}> = ({ type, onMouseDown }) => {
  const info = SHIP_INFO[type];
  const [hovered, setHovered] = useState(false);

  const particles = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, type)}
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
            bottom: 8 + i * 5,
            left: 18 + i * 20,
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

interface FormationCellProps {
  slot: number;
  ship: ShipType | null;
  onRemove: (slot: number) => void;
  isDragOver: boolean;
  cellRef: (el: HTMLDivElement | null) => void;
  dropKey: number;
}

const FormationCell: React.FC<FormationCellProps> = ({ slot, ship, onRemove, isDragOver, cellRef, dropKey }) => {
  const info = ship ? SHIP_INFO[ship] : null;
  const engineParticles = Array.from({ length: 4 }, (_, i) => i);

  const burstParticles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const dist = 40 + Math.random() * 30;
    return {
      id: i,
      bx: Math.cos(angle) * dist,
      by: Math.sin(angle) * dist,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 0.1,
    };
  });

  return (
    <div
      ref={cellRef}
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
          ? 'rgba(0,212,255,0.1)'
          : ship
          ? 'rgba(10,14,23,0.7)'
          : 'rgba(10,14,23,0.4)',
        border: `1.5px solid ${isDragOver ? 'rgba(0,212,255,0.8)' : ship ? 'rgba(0,212,255,0.35)' : 'rgba(0,212,255,0.12)'}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        boxShadow: isDragOver
          ? '0 0 30px rgba(0,212,255,0.5), inset 0 0 25px rgba(0,212,255,0.2)'
          : ship
          ? '0 0 8px rgba(0,212,255,0.15)'
          : 'none',
        cursor: ship ? 'pointer' : 'default',
        overflow: 'hidden',
        animation: isDragOver ? 'fbCellGlowPulse 1s ease-in-out infinite' : 'none',
      }}
    >
      {isDragOver && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 10,
              border: '1px dashed rgba(0,212,255,0.5)',
              borderRadius: 4,
              animation: 'fbCrosshairPulse 1.2s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 10,
              right: 10,
              height: 1,
              background: 'rgba(0,212,255,0.4)',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 10,
              bottom: 10,
              width: 1,
              background: 'rgba(0,212,255,0.4)',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 20,
              height: 20,
              border: '1px solid rgba(0,212,255,0.6)',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'fbCrosshairPulse 1s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {dropKey > 0 && ship && (
        <>
          <div
            key={`ripple1-${dropKey}`}
            style={{
              position: 'absolute',
              width: 50,
              height: 50,
              borderRadius: '50%',
              border: '2px solid rgba(0,212,255,0.8)',
              animation: 'fbRippleEffect 0.7s ease-out forwards',
              pointerEvents: 'none',
              left: '50%',
              top: '50%',
              marginLeft: -25,
              marginTop: -25,
            }}
          />
          <div
            key={`ripple2-${dropKey}`}
            style={{
              position: 'absolute',
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '2px solid rgba(100,200,255,0.5)',
              animation: 'fbRippleEffect2 0.7s ease-out 0.1s forwards',
              pointerEvents: 'none',
              left: '50%',
              top: '50%',
              marginLeft: -20,
              marginTop: -20,
            }}
          />
          <div
            key={`ripple3-${dropKey}`}
            style={{
              position: 'absolute',
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '1px solid rgba(180,220,255,0.3)',
              animation: 'fbRippleEffect3 0.7s ease-out 0.2s forwards',
              pointerEvents: 'none',
              left: '50%',
              top: '50%',
              marginLeft: -15,
              marginTop: -15,
            }}
          />
          <div
            key={`flash-${dropKey}`}
            style={{
              position: 'absolute',
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,212,255,0.8) 0%, transparent 70%)',
              animation: 'fbGlowFlash 0.5s ease-out forwards',
              pointerEvents: 'none',
              left: '50%',
              top: '50%',
              marginLeft: -30,
              marginTop: -30,
            }}
          />
          {burstParticles.map((p) => (
            <div
              key={`burst-${dropKey}-${p.id}`}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: '#00d4ff',
                left: '50%',
                top: '50%',
                '--bx': `${p.bx}px`,
                '--by': `${p.by}px`,
                animation: `fbBurstParticle 0.6s ease-out ${p.delay}s forwards`,
                pointerEvents: 'none',
                boxShadow: '0 0 6px rgba(0,212,255,0.8)',
              } as React.CSSProperties}
            />
          ))}
        </>
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
          key={`ship-${dropKey}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'fbSpringIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            position: 'relative',
          }}
        >
          {engineParticles.map((i) => (
            <div
              key={`eng-${i}`}
              style={{
                position: 'absolute',
                bottom: -8 - i * 4,
                left: '50%',
                marginLeft: -2 + (i % 2 === 0 ? -4 : 4),
                width: 2 + (i % 2),
                height: 2 + (i % 2),
                borderRadius: '50%',
                background: i % 2 === 0 ? '#00d4ff' : '#ff6b35',
                animation: `fbEngineParticle ${0.9 + i * 0.2}s ease-out infinite`,
                animationDelay: `${i * 0.15}s`,
                pointerEvents: 'none',
                boxShadow: '0 0 4px rgba(0,212,255,0.6)',
              }}
            />
          ))}
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

const DragGhost: React.FC<{
  type: ShipType;
  dragPosRef: React.MutableRefObject<{ x: number; y: number }>;
  isDraggingRef: React.MutableRefObject<boolean>;
}> = ({ type, dragPosRef, isDraggingRef }) => {
  const info = SHIP_INFO[type];
  const ghostElRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const updatePosition = () => {
      if (ghostElRef.current && isDraggingRef.current) {
        ghostElRef.current.style.left = `${dragPosRef.current.x}px`;
        ghostElRef.current.style.top = `${dragPosRef.current.y}px`;
      }
      if (isDraggingRef.current) {
        rafRef.current = requestAnimationFrame(updatePosition);
      }
    };
    rafRef.current = requestAnimationFrame(updatePosition);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [dragPosRef, isDraggingRef]);

  const trailParticles = Array.from({ length: 18 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 15 + Math.random() * 25;
    return {
      id: i,
      size: 2 + Math.random() * 3,
      tx: -Math.cos(angle) * dist - 20,
      ty: -Math.sin(angle) * dist * 0.5 + 10,
      delay: Math.random() * 0.3,
      duration: 0.4 + Math.random() * 0.3,
    };
  });

  return (
    <div
      ref={ghostElRef}
      style={{
        position: 'fixed',
        left: dragPosRef.current.x,
        top: dragPosRef.current.y,
        transform: 'translate(-50%, -50%) scale(0.8)',
        pointerEvents: 'none',
        zIndex: 10000,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          animation: 'fbGhostPulse 1.5s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.5) 0%, transparent 60%)',
          transform: 'translate(-50%, -50%)',
          animation: 'fbGhostPulse2 1.2s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: '1px solid rgba(0,212,255,0.6)',
          transform: 'translate(-50%, -50%)',
          animation: 'fbGhostPulse 2s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      {trailParticles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: '#00d4ff',
            boxShadow: '0 0 6px rgba(0,212,255,0.9)',
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            animation: `fbTrailParticle ${p.duration}s ease-out ${p.delay}s infinite`,
            pointerEvents: 'none',
          } as React.CSSProperties}
        />
      ))}
      <div
        style={{
          position: 'relative',
          background: 'rgba(10,14,23,0.95)',
          border: '2px solid rgba(0,212,255,0.8)',
          borderRadius: 10,
          padding: '14px 18px',
          minWidth: 140,
          boxShadow: '0 0 30px rgba(0,212,255,0.6), 0 0 60px rgba(0,212,255,0.3), inset 0 0 20px rgba(0,212,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontSize: type === 'battleship' ? 36 : type === 'cruiser' ? 30 : 26,
              color: '#00d4ff',
              filter: 'drop-shadow(0 0 10px rgba(0,212,255,0.8))',
              lineHeight: 1,
            }}
          >
            {info.icon}
          </span>
          <div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, color: '#e0f0ff', fontWeight: 700 }}>
              {info.label}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(0,212,255,0.7)', fontFamily: "'Orbitron', sans-serif", marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
              {type}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FleetBuilder: React.FC<FleetBuilderProps> = ({ onWarp }) => {
  const [formation, setFormation] = useState<(ShipType | null)[]>(Array(9).fill(null));
  const [isWarping, setIsWarping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<ShipType | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dropKeys, setDropKeys] = useState<number[]>(Array(9).fill(0));
  const [slotHoverStates, setSlotHoverStates] = useState<boolean[]>(Array(9).fill(false));

  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragPosRef = useRef({ x: 0, y: 0 });
  const dragTypeRef = useRef<ShipType | null>(null);
  const isDraggingRef = useRef(false);
  const hoverSlotRef = useRef<number | null>(null);

  const shipTypes: ShipType[] = ['frigate', 'cruiser', 'battleship'];

  const handleMouseDown = useCallback((e: React.MouseEvent, type: ShipType) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragPos({ x: e.clientX, y: e.clientY });
    dragPosRef.current = { x: e.clientX, y: e.clientY };
    dragTypeRef.current = type;
    isDraggingRef.current = true;
    hoverSlotRef.current = null;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      dragPosRef.current = { x: e.clientX, y: e.clientY };

      let foundSlot: number | null = null;
      for (let i = 0; i < cellRefs.current.length; i++) {
        const cell = cellRefs.current[i];
        if (!cell) continue;
        const rect = cell.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          foundSlot = i;
          break;
        }
      }

      if (hoverSlotRef.current !== foundSlot) {
        const prevSlot = hoverSlotRef.current;
        hoverSlotRef.current = foundSlot;
        setSlotHoverStates((prev) => {
          const next = [...prev];
          if (prevSlot !== null) next[prevSlot] = false;
          if (foundSlot !== null) next[foundSlot] = true;
          return next;
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const type = dragTypeRef.current;
      if (type) {
        for (let i = 0; i < cellRefs.current.length; i++) {
          const cell = cellRefs.current[i];
          if (!cell) continue;
          const rect = cell.getBoundingClientRect();
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            if (!formation[i]) {
              setFormation((prev) => {
                const next = [...prev];
                next[i] = type;
                return next;
              });
              setDropKeys((prev) => {
                const next = [...prev];
                next[i] = next[i] + 1;
                return next;
              });
            }
            break;
          }
        }
      }

      const prevHoverSlot = hoverSlotRef.current;
      hoverSlotRef.current = null;
      if (prevHoverSlot !== null) {
        setSlotHoverStates((prev) => {
          const next = [...prev];
          next[prevHoverSlot] = false;
          return next;
        });
      }

      setIsDragging(false);
      setDragType(null);
      isDraggingRef.current = false;
      dragTypeRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [formation]);

  const handleRemove = useCallback((slot: number) => {
    setFormation((prev) => {
      const next = [...prev];
      next[slot] = null;
      return next;
    });
  }, []);

  const setCellRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    cellRefs.current[index] = el;
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
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {isWarping && <WarpOverlay />}

      {isDragging && dragType && (
        <DragGhost type={dragType} dragPosRef={dragPosRef} isDraggingRef={isDraggingRef} />
      )}

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
              onMouseDown={handleMouseDown}
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
              onRemove={handleRemove}
              isDragOver={slotHoverStates[slot]}
              cellRef={setCellRef(slot)}
              dropKey={dropKeys[slot]}
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
