import React, { useMemo, useState, useEffect } from 'react';
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
import { MealEntry } from './DietLogger';

interface Props {
  entries: MealEntry[];
}

const RING_SIZE = 80;
const RING_STROKE = 8;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

function RingChart({ label, value, max, color, unit }: {
  label: string; value: number; max: number; color: string; unit: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const dash = (pct / 100) * RING_C;
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
      <div className="ring-wrap">
        <svg className="ring-svg" width={RING_SIZE} height={RING_SIZE}>
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R}
            fill="none"
            stroke="#F0E6DD"
            strokeWidth={RING_STROKE}
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R}
            fill="none"
            stroke={color}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={`${(shownPct / 100) * RING_C} ${RING_C}`}
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
        </svg>
        <div className="ring-val" style={{ color }}>
          {shownPct}%
        </div>
      </div>
      <div className="ring-num">
        {value.toFixed(0)}{unit}
      </div>
    </div>
  );
}

export default function NutritionPanel({ entries }: Props) {
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
    arr[arr.length - 1] = { ...arr[arr.length - 1], calories: Math.round(totalNutrition.calories) || 100 };
    return arr;
  }, [trendBase, totalNutrition.calories]);

  const [animKey, setAnimKey] = useState(0);
  const [trendKey, setTrendKey] = useState(0);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [totalNutrition.calories.toFixed(0)]);

  useEffect(() => {
    setTrendKey((k) => k + 1);
  }, [totalNutrition.calories.toFixed(0)]);

  return (
    <div>
      <div className="card" style={{ padding: 20 }}>
        <div className="card-title">📊 今日营养摄入</div>

        <div className="rings" key={animKey}>
          {NUTRITION_KEYS.map((k) => (
            <RingChart
              key={k}
              label={NUTRITION_LABELS[k]}
              value={totalNutrition[k]}
              max={DAILY_RECOMMENDED[k]}
              color={NUTRITION_COLORS[k]}
              unit={NUTRITION_UNITS[k]}
            />
          ))}
        </div>

        <div className="section-title">🥗 营养均衡雷达</div>

        <div className="radar-wrap" key={`radar-${animKey}`}>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} outerRadius="72%" cx="50%" cy="50%">
              <PolarGrid stroke="#F0E6DD" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: '#636E72', fontSize: 12, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#B2BEC3', fontSize: 9 }}
                tickCount={5}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Radar
                name="占比"
                dataKey="value"
                stroke="#FF6B6B"
                strokeWidth={2.5}
                fill="#FF6B6B"
                fillOpacity={0.32}
                animationBegin={0}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-title">📈 7天热量趋势</div>

        <div className="trend-wrap" key={`trend-${trendKey}`}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B6B" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#FF6B6B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0E6DD" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#636E72', fontSize: 11 }}
                axisLine={{ stroke: '#F0E6DD' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#B2BEC3', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[1000, 2800]}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #F0E6DD',
                  borderRadius: 10,
                  boxShadow: '0 4px 16px rgba(255,107,107,0.15)',
                  fontSize: 12,
                  padding: '8px 12px',
                }}
                labelStyle={{ fontWeight: 600, color: '#2D3436', marginBottom: 4 }}
                formatter={(v: number) => [`${v} kcal`, '总热量']}
                cursor={{ stroke: '#FFB3B3', strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="calories"
                stroke="#FF6B6B"
                strokeWidth={2.5}
                fill="url(#calGrad)"
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-in-out"
                dot={{ r: 4, fill: '#fff', stroke: '#FF6B6B', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#FF6B6B', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

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
          {pcts.calories < 60 && '今日热量摄入偏低，记得保证充足能量哦！'}
          {pcts.calories >= 60 && pcts.calories <= 100 && '营养摄入非常均衡，继续保持！✨'}
          {pcts.calories > 100 && '热量摄入已超标，可以适当运动消耗能量~'}
        </div>
      </div>
    </div>
  );
}
