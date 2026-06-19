import React, { useEffect, useState, useRef } from 'react';
import { useGameStore, ResourceType, getResourceName, Industry } from './store';

const RESOURCE_ICONS: Record<ResourceType, string> = {
  money: '💰',
  wood: '🪵',
  iron: '⛓️',
  food: '🍞',
  product: '📦',
};

const RESOURCE_COLORS: Record<ResourceType, string> = {
  money: '#ffd700',
  wood: '#8B4513',
  iron: '#A9A9A9',
  food: '#F4A460',
  product: '#e94560',
};

const INDUSTRY_INFO: Record<Industry, { name: string; icon: string; desc: string }> = {
  farm: { name: '农场主', icon: '🌾', desc: '食物高产，起始食物多' },
  factory: { name: '工厂主', icon: '🏭', desc: '铁矿丰富，加工能力强' },
  tech: { name: '科技公司', icon: '🔬', desc: '资金雄厚，产品价值高' },
};

function AnimatedNumber({ value, color }: { value: number; color: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animating, setAnimating] = useState(false);
  const prevDisplayedRef = useRef(value);
  const pendingValueRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevDisplayedRef.current === value) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    pendingValueRef.current = value;

    debounceTimerRef.current = window.setTimeout(() => {
      const targetValue = pendingValueRef.current!;
      pendingValueRef.current = null;
      prevDisplayedRef.current = targetValue;

      setAnimating(true);
      const start = displayValue;
      const end = targetValue;
      const duration = 400;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.floor(start + (end - start) * eased));

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          animationFrameRef.current = null;
          setTimeout(() => setAnimating(false), 150);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [value, displayValue]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <span
      style={{
        display: 'inline-block',
        color,
        fontWeight: 'bold',
        fontSize: 18,
        minWidth: 50,
        textAlign: 'right',
        transition: 'transform 0.15s ease',
        transform: animating ? 'scale(1.25)' : 'scale(1)',
        textShadow: animating ? `0 0 12px ${color}, 0 0 20px ${color}40` : 'none',
      }}
    >
      {displayValue.toLocaleString()}
    </span>
  );
}

export default function ResourcePanel() {
  const { getCurrentPlayer, players, currentPlayerId } = useGameStore();
  const player = getCurrentPlayer();

  if (!player) {
    return (
      <div style={panelStyle}>
        <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>
          请先登录并选择行业
        </div>
      </div>
    );
  }

  const resources: ResourceType[] = ['money', 'wood', 'iron', 'food', 'product'];
  const industry = INDUSTRY_INFO[player.industry];

  const allPlayers = Object.values(players).sort((a, b) => {
    const aTotal = a.resources.money + a.resources.product * 50;
    const bTotal = b.resources.money + b.resources.product * 50;
    return bTotal - aTotal;
  });

  return (
    <div style={panelStyle}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.2), rgba(255, 215, 0, 0.1))',
        borderBottom: '1px solid rgba(233, 69, 96, 0.3)',
        borderRadius: '12px 12px 0 0',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: player.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, border: '2px solid #ffd700',
          boxShadow: `0 0 12px ${player.color}`,
        }}>
          {industry.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{player.name}</div>
          <div style={{ color: '#ffd700', fontSize: 12 }}>{industry.name} · {industry.desc}</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ color: '#aaa', fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          资源面板
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {resources.map((res) => (
            <div
              key={res}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{RESOURCE_ICONS[res]}</span>
                <span style={{ color: '#ccc', fontSize: 13 }}>{getResourceName(res)}</span>
              </div>
              <AnimatedNumber value={player.resources[res]} color={RESOURCE_COLORS[res]} />
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ color: '#aaa', fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            🏆 资产排行榜
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allPlayers.map((p, idx) => {
              const total = p.resources.money + p.resources.product * 50
                + p.resources.wood * 10 + p.resources.iron * 15 + p.resources.food * 8;
              const isCurrent = p.id === currentPlayerId;
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    background: isCurrent ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 6,
                    border: isCurrent ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid transparent',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : '#cd7f32',
                    color: '#1a1a2e', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11,
                  }}>{idx + 1}</span>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: p.color,
                    boxShadow: `0 0 6px ${p.color}`,
                  }} />
                  <span style={{ color: '#ddd', fontSize: 12, flex: 1 }}>{p.name}</span>
                  <span style={{ color: '#ffd700', fontSize: 12, fontWeight: 'bold' }}>
                    💰{total.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #1e1e3a 0%, #16162a 100%)',
  borderRadius: 12,
  border: '1px solid rgba(233, 69, 96, 0.2)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};
