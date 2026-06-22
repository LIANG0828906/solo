import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  NutritionValue,
  NUTRITION_KEYS,
  NUTRITION_LABELS,
  NUTRITION_UNITS,
  NUTRITION_COLORS,
  DAILY_RECOMMENDED,
  sumNutrition,
  getNutritionPercentages,
  generateWeeklyTrend,
} from './utils/nutritionDB';
import { MealEntry, MealType } from './DietLogger';

interface Props {
  entries: MealEntry[];
  autoScrollToTrend?: boolean;
}

const RING_SIZE = 72;
const RING_STROKE = 7;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

const MEAL_INFO: Record<MealType, { name: string; icon: string; color: string }> = {
  breakfast: { name: '早餐', icon: '🌅', color: '#FFD59E' },
  lunch: { name: '午餐', icon: '☀️', color: '#FFB3B3' },
  dinner: { name: '晚餐', icon: '🌙', color: '#C5DEA1' },
  snack: { name: '加餐', icon: '🍪', color: '#A5C9FF' },
};

function SmallRing({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
      <svg width={34} height={34} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={17} cy={17} r={13} fill="none" stroke="#F0E6DD" strokeWidth={4} />
        <circle
          cx={17} cy={17} r={13}
          fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * (2 * Math.PI * 13)} ${2 * Math.PI * 13}`}
        />
      </svg>
      <span style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 9, fontWeight: 700, color,
      }}>{pct}%</span>
    </div>
  );
}

function RingChart({ label, value, max, color, unit, size = RING_SIZE }: {
  label: string; value: number; max: number; color: string; unit: string; size?: number;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const ringR = (size - RING_STROKE) / 2;
  const ringC = 2 * Math.PI * ringR;
  const [shownPct, setShownPct] = useState(0);

  useEffect(() => {
    setShownPct(0);
    let start: number | null = null;
    const dur = 800;
    const from = 0;
    const to = pct;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setShownPct(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [pct]);

  return (
    <div className="ring">
      <div className="ring-name">{label}</div>
      <div className="ring-wrap" style={{ width: size, height: size }}>
        <svg className="ring-svg" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={ringR} fill="none" stroke="#F0E6DD" strokeWidth={RING_STROKE} />
          <circle
            cx={size / 2} cy={size / 2} r={ringR}
            fill="none" stroke={color} strokeWidth={RING_STROKE} strokeLinecap="round"
            strokeDasharray={`${(shownPct / 100) * ringC} ${ringC}`}
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
        </svg>
        <div className="ring-val" style={{ color, fontSize: size > 60 ? 14 : 11 }}>
          {shownPct}%
        </div>
      </div>
      <div className="ring-num">
        {value.toFixed(0)}{unit}
      </div>
    </div>
  );
}

const TrendChart: React.FC<{ data: { date: string; calories: number }[]; animKey: number; trendRef?: React.RefObject<HTMLDivElement> }> = ({ data, animKey, trendRef }) => {
  return (
    <div className="trend-wrap" key={`trend-${animKey}`} ref={trendRef}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B6B" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#FF6B6B" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0E6DD" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#636E72', fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: '#E0D4C8' }}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            tick={{ fill: '#B2BEC3', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[1000, 2800]}
            tickFormatter={(v) => `${v}`}
            width={48}
          />
          <Tooltip
            trigger={window.matchMedia('(pointer: coarse)').matches ? 'click' : 'hover'}
            contentStyle={{
              background: '#fff',
              border: '1px solid #FFD0D0',
              borderRadius: 12,
              boxShadow: '0 6px 24px rgba(255,107,107,0.22)',
              fontSize: 13,
              padding: '10px 14px',
              minWidth: 120,
            }}
            labelStyle={{
              fontWeight: 700,
              color: '#FF6B6B',
              marginBottom: 6,
              fontSize: 13,
              borderBottom: '1px dashed #FFE0E0',
              paddingBottom: 4,
            }}
            formatter={(v: number) => [
              <span style={{ color: '#2D3436', fontWeight: 600 }}>{v.toLocaleString()} kcal</span>,
              <span style={{ color: '#88B04B', fontWeight: 600 }}>🔥 总热量</span>
            ]}
            cursor={{ stroke: '#FFB3B3', strokeDasharray: '5 5', strokeWidth: 1.5 }}
            labelFormatter={(label) => `📅 ${label}`}
          />
          <Area
            type="monotone"
            dataKey="calories"
            stroke="#FF6B6B"
            strokeWidth={3}
            fill="url(#calGrad)"
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-in-out"
            isAnimationActive
            dot={{ r: 5, fill: '#fff', stroke: '#FF6B6B', strokeWidth: 2.5 }}
            activeDot={{
              r: 8,
              fill: '#FF6B6B',
              stroke: '#fff',
              strokeWidth: 3,
              onClick: () => { },
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function NutritionPanel({ entries, autoScrollToTrend }: Props) {
  const trendRef = useRef<HTMLDivElement>(null);

  const mealGroups = useMemo(() => {
    const g: Record<MealType, MealEntry[]> = {
      breakfast: [], lunch: [], dinner: [], snack: [],
    };
    for (const e of entries) g[e.meal].push(e);
    return g;
  }, [entries]);

  const mealNutritions = useMemo(() => {
    const r: Record<MealType, NutritionValue> = {} as never;
    (Object.keys(mealGroups) as MealType[]).forEach((m) => {
      r[m] = sumNutrition(mealGroups[m].map((e) => e.nutrition));
    });
    return r;
  }, [mealGroups]);

  const totalNutrition: NutritionValue = useMemo(() => {
    return sumNutrition(entries.map((e) => e.nutrition));
  }, [entries]);

  const pcts = useMemo(() => getNutritionPercentages(totalNutrition), [totalNutrition]);

  const radarData = useMemo(() => NUTRITION_KEYS.map((k) => ({
    name: NUTRITION_LABELS[k],
    value: pcts[k],
    fullMark: 100,
  })), [pcts]);

  const trendBase = useMemo(() => generateWeeklyTrend(totalNutrition.calories), []);
  const trendData = useMemo(() => {
    const arr = [...trendBase];
    arr[arr.length - 1] = { ...arr[arr.length - 1], calories: Math.round(totalNutrition.calories) || 120 };
    return arr;
  }, [trendBase, totalNutrition.calories]);

  const [animKey, setAnimKey] = useState(0);
  const [trendKey, setTrendKey] = useState(0);

  useEffect(() => {
    setAnimKey((k) => k + 1);
    setTrendKey((k) => k + 1);
  }, [totalNutrition.calories.toFixed(0)]);

  useEffect(() => {
    if (autoScrollToTrend && trendRef.current) {
      setTimeout(() => {
        trendRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
    }
  }, [autoScrollToTrend]);

  return (
    <div>
      <div className="card" style={{ padding: 20 }}>
        <div className="card-title">📊 今日营养摄入</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {(Object.keys(MEAL_INFO) as MealType[]).map((m, idx) => {
            const info = MEAL_INFO[m];
            const nu = mealNutritions[m];
            const totalCals = nu.calories;
            return (
              <div
                key={m}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: `linear-gradient(90deg, ${info.color}33, #FFFFFF)`,
                  animation: `fadeIn 0.3s ease backwards`,
                  animationDelay: `${idx * 0.05}s`,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    <span style={{ marginRight: 6 }}>{info.icon}</span>{info.name}
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--coral)',
                    background: 'white',
                    padding: '2px 10px',
                    borderRadius: 10,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}>
                    {Math.round(totalCals)} kcal
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {NUTRITION_KEYS.map((k) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }} title={`${NUTRITION_LABELS[k]}: ${nu[k].toFixed(1)}${NUTRITION_UNITS[k]} / ${DAILY_RECOMMENDED[k]}${NUTRITION_UNITS[k]}`}>
                      <SmallRing value={nu[k]} max={DAILY_RECOMMENDED[k]} color={NUTRITION_COLORS[k]} />
                      <span style={{ fontSize: 10, color: 'var(--text-light)' }}>{NUTRITION_LABELS[k]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="section-title">🎯 全天总摄入占比</div>

        <div className="rings" key={animKey} style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {NUTRITION_KEYS.map((k) => (
            <RingChart
              key={k}
              label={NUTRITION_LABELS[k]}
              value={totalNutrition[k]}
              max={DAILY_RECOMMENDED[k]}
              color={NUTRITION_COLORS[k]}
              unit={NUTRITION_UNITS[k]}
              size={72}
            />
          ))}
        </div>

        <div className="section-title">🥗 营养均衡雷达</div>

        <div className="radar-wrap" key={`radar-${animKey}`}>
          <ResponsiveContainer width="100%" height={290}>
            <RadarChart data={radarData} outerRadius="75%" cx="50%" cy="50%">
              <PolarGrid stroke="#F0E6DD" strokeWidth={1.2} />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: '#636E72', fontSize: 13, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#B2BEC3', fontSize: 10 }}
                tickCount={5}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Radar
                name="占比"
                dataKey="value"
                stroke="#FF6B6B"
                strokeWidth={2.8}
                fill="#FF6B6B"
                fillOpacity={0.34}
                animationBegin={0}
                animationDuration={900}
                animationEasing="ease-out"
                isAnimationActive
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #FFD0D0',
                  borderRadius: 10,
                  fontSize: 12,
                  padding: '8px 12px',
                  boxShadow: '0 4px 14px rgba(255,107,107,0.18)',
                }}
                formatter={(v: number) => [`${v}%`, '摄入占比']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-title">📈 7天热量趋势</div>

        <TrendChart data={trendData} animKey={trendKey} trendRef={trendRef} />

        <div style={{
          marginTop: 18,
          padding: 14,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #FFF0F0, #F5FAEC)',
          fontSize: 12,
          color: 'var(--text-light)',
          lineHeight: 1.7,
        }}>
          💡 <strong style={{ color: 'var(--coral)' }}>小提示：</strong>
          {pcts.calories < 60 && '今日热量摄入偏低，记得保证充足能量哦！可适当增加主食和蛋白质。'}
          {pcts.calories >= 60 && pcts.calories <= 100 && '营养摄入非常均衡，继续保持！✨ 建议配合30分钟运动更佳。'}
          {pcts.calories > 100 && '热量摄入已超标，可以适当运动消耗能量~ 推荐快走或慢跑。'}
        </div>
      </div>
    </div>
  );
}
