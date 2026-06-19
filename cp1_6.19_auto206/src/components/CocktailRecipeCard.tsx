import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RecipeCard, FlavorProfile } from '../types';
import { findClosestRecipe, useTavernStore } from '../store';

function RadarChart({ profile, size = 120 }: { profile: FlavorProfile; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 16;
  const axes: Array<{ key: keyof FlavorProfile; angle: number }> = [
    { key: 'alcohol', angle: -Math.PI / 2 },
    { key: 'sweetness', angle: 0 },
    { key: 'sourness', angle: Math.PI / 2 },
    { key: 'bitterness', angle: Math.PI },
  ];

  const dataPoints = axes.map(a => {
    const v = profile[a.key] / 100;
    return {
      x: cx + Math.cos(a.angle) * r * v,
      y: cy + Math.sin(a.angle) * r * v,
    };
  });
  const dataPath = dataPoints.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ') + ' Z';
  const gridPath = axes.map(a => {
    const x = cx + Math.cos(a.angle) * r;
    const y = cy + Math.sin(a.angle) * r;
    return `M${cx},${cy} L${x},${y}`;
  }).join(' ');

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <path d={gridPath} stroke="rgba(179,136,255,0.2)" strokeWidth={1} fill="none" />
      {[0.33, 0.66, 1].map(f => (
        <polygon
          key={f}
          points={axes.map(a => {
            const x = cx + Math.cos(a.angle) * r * f;
            const y = cy + Math.sin(a.angle) * r * f;
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(179,136,255,0.15)"
          strokeWidth={1}
        />
      ))}
      <motion.path
        d={dataPath}
        fill="rgba(179,136,255,0.25)"
        stroke="#B388FF"
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          filter: 'drop-shadow(0 0 6px rgba(179,136,255,0.6))',
        }}
        transition={{ duration: 0.5 }}
      />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#B388FF" style={{ filter: 'drop-shadow(0 0 4px #B388FF)' }} />
      ))}
      {axes.map((a, i) => {
        const lx = cx + Math.cos(a.angle) * (r + 10);
        const ly = cy + Math.sin(a.angle) * (r + 10);
        const labels: Record<keyof FlavorProfile, string> = {
          alcohol: '酒', sweetness: '甜', sourness: '酸', bitterness: '苦',
        };
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill="#6B4F9E"
            style={{ fontFamily: "'ZCOOL KuaiLe', sans-serif" }}
          >
            {labels[a.key]}
          </text>
        );
      })}
    </svg>
  );
}

function GlassIcon({ color }: { color: string }) {
  return (
    <svg width={48} height={58} viewBox="0 0 48 58">
      <defs>
        <linearGradient id={`gg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path
        d="M6 4 L42 4 L34 46 Q24 52 14 46 Z"
        fill={`url(#gg-${color})`}
        stroke="#B388FF"
        strokeWidth="1.5"
        opacity={0.9}
      />
      <path
        d="M18 48 L18 54 L30 54 L30 48"
        fill="none"
        stroke="#B388FF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="14" y="54" width="20" height="3" rx="1.5" fill="#B388FF" opacity="0.6" />
      <path
        d="M10 10 Q12 6 16 6"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function CocktailRecipeCard({ card }: { card: RecipeCard }) {
  const [expanded, setExpanded] = useState(false);
  const book = useTavernStore(s => s.recipeBook);
  const closest = useMemo(() => findClosestRecipe(card, book), [card, book]);
  const validSlots = card.slots.filter(s => s.ingredient);

  return (
    <motion.div
      layout
      whileHover={{ y: -6 }}
      style={{
        width: 220,
        height: expanded ? 'auto' : 300,
        borderRadius: 16,
        background: `linear-gradient(160deg, ${card.blendedColor}22 0%, rgba(15,2,32,0.9) 60%)`,
        border: `1px solid ${card.blendedColor}66`,
        boxShadow: `0 0 24px ${card.blendedColor}22, inset 0 1px 0 rgba(255,255,255,0.05)`,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div
        style={{
          height: 96,
          background: `linear-gradient(180deg, ${card.blendedColor}55 0%, ${card.blendedColor}00 100%)`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <GlassIcon color={card.blendedColor} />
        {card.customerMatch && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 10,
              fontSize: 9,
              padding: '3px 8px',
              borderRadius: 4,
              background: 'rgba(0,229,255,0.2)',
              color: '#00E5FF',
              border: '1px solid rgba(0,229,255,0.4)',
              letterSpacing: 1,
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            MATCH {Math.round(card.matchScore * 100)}%
          </div>
        )}
      </div>

      <div style={{ padding: '10px 14px 14px' }}>
        <div
          style={{
            fontSize: 11,
            color: '#6B4F9E',
            letterSpacing: 1.5,
            marginBottom: 4,
          }}
        >
          RECIPE · {new Date(card.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#E0C3FF',
            marginBottom: 10,
            letterSpacing: 0.5,
            fontFamily: "'Orbitron', 'ZCOOL KuaiLe', sans-serif",
          }}
        >
          {card.name}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RadarChart profile={card.profile} />
        </div>

        {closest && (
          <div
            style={{
              marginTop: 10,
              padding: '6px 8px',
              borderRadius: 6,
              background: 'rgba(179,136,255,0.08)',
              border: '1px solid rgba(179,136,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: 10, color: '#6B4F9E', letterSpacing: 1 }}>最相似风味</span>
            <span
              style={{
                fontSize: 10,
                color: '#B388FF',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 100,
              }}
            >
              → {closest.name}
            </span>
          </div>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden', marginTop: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ borderTop: '1px solid rgba(179,136,255,0.15)', paddingTop: 10 }}>
                <div style={{ fontSize: 10, color: '#6B4F9E', letterSpacing: 2, marginBottom: 8 }}>配 方 详 情</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {validSlots.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 6px',
                        borderRadius: 4,
                        background: `${s.ingredient!.color}11`,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: s.ingredient!.color,
                          boxShadow: `0 0 6px ${s.ingredient!.glowColor}`,
                        }}
                      />
                      <span style={{ flex: 1, fontSize: 11, color: '#B388FF' }}>{s.ingredient!.name}</span>
                      <span style={{ fontSize: 11, color: '#6B4F9E', fontFamily: "'Orbitron', sans-serif" }}>
                        {s.amount}ml
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          style={{
            marginTop: 10,
            textAlign: 'center',
            fontSize: 9,
            color: 'rgba(179,136,255,0.35)',
            letterSpacing: 2,
          }}
        >
          {expanded ? '▲ 收起' : '▼ 查看配方'}
        </div>
      </div>
    </motion.div>
  );
}
