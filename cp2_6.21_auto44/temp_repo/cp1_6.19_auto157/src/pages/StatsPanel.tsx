import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGlobalState } from '@/context/GlobalState';
import { EMOTIONS, EMOTION_LABELS, EMOTION_COLORS } from '@/bottle';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
};

const panelStyle: React.CSSProperties = {
  width: '360px',
  minHeight: '400px',
  backgroundColor: 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  borderRadius: '16px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.08)',
};

interface StatsPanelProps {
  onClose: () => void;
}

const RING_SIZE = 80;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function StatRing({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <svg width={RING_SIZE} height={RING_SIZE}>
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={RING_STROKE}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text
          x={RING_SIZE / 2}
          y={RING_SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="18"
          fontWeight="700"
          fontFamily="'Noto Serif SC', serif"
        >
          {value}
        </text>
      </svg>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
    </div>
  );
}

const BAR_WIDTH = 20;
const BAR_GAP = 10;

export default function StatsPanel({ onClose }: StatsPanelProps) {
  const { state } = useGlobalState();
  const { stats, bottles } = state;

  const weeklyData = useMemo(() => {
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    const today = new Date();
    const result: { day: string; emotions: Record<string, number> }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayBottles = bottles.filter(b => {
        const bKey = `${new Date(b.createdAt).getFullYear()}-${String(new Date(b.createdAt).getMonth() + 1).padStart(2, '0')}-${String(new Date(b.createdAt).getDate()).padStart(2, '0')}`;
        return bKey === key;
      });
      const emotions: Record<string, number> = {};
      EMOTIONS.forEach(e => { emotions[e] = dayBottles.filter(b => b.emotion === e).length; });
      result.push({ day: days[(d.getDay() + 6) % 7], emotions });
    }
    return result;
  }, [bottles]);

  const maxBar = useMemo(() => {
    let max = 0;
    weeklyData.forEach(d => {
      EMOTIONS.forEach(e => { if (d.emotions[e] > max) max = d.emotions[e]; });
    });
    return Math.max(max, 1);
  }, [weeklyData]);

  return (
    <motion.div
      style={overlayStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={panelStyle}
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>历史统计</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <StatRing value={stats.thrown} max={Math.max(stats.thrown, 1)} color="#FFD700" label="已投掷" />
          <StatRing value={stats.received} max={Math.max(stats.thrown, 1)} color="#4A90D9" label="已接收" />
          <StatRing value={stats.archived} max={Math.max(stats.thrown, 1)} color="#2ECC71" label="已归档" />
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>一周情绪趋势</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: `${BAR_GAP}px`, height: '180px', paddingTop: '8px' }}>
            {weeklyData.map((dayData, dayIdx) => (
              <div key={dayIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '1px' }}>
                  {EMOTIONS.map(e => {
                    const h = Math.max((dayData.emotions[e] / maxBar) * 140, dayData.emotions[e] > 0 ? 4 : 0);
                    return (
                      <motion.div
                        key={e}
                        initial={{ height: 0 }}
                        animate={{ height: h }}
                        transition={{ duration: 0.4, delay: dayIdx * 0.05 }}
                        style={{
                          width: `${BAR_WIDTH}px`,
                          height: `${h}px`,
                          backgroundColor: EMOTION_COLORS[e],
                          borderRadius: '2px',
                          position: 'relative',
                        }}
                      >
                        {dayData.emotions[e] > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: '-14px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '8px',
                            color: EMOTION_COLORS[e],
                          }}>
                            {dayData.emotions[e]}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{dayData.day}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'center' }}>
            {EMOTIONS.map(e => (
              <div key={e} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: EMOTION_COLORS[e] }} />
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>{EMOTION_LABELS[e]}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
