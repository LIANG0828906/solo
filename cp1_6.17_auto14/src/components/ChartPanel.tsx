import { useMemo, memo, useEffect, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
  LabelList,
  ReferenceLine,
} from 'recharts';
import { Empty } from 'antd';
import type { Question, QuestionStat, QuestionType } from '../types';

const MULTIPLE_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];

function formatPercentage(v: number, total: number) {
  if (total <= 0) return '0%';
  return `${Math.round((v / total) * 100)}%`;
}

function SingleBarChart({ stat, initial }: { stat: QuestionStat; initial: boolean }) {
  const maxVal = useMemo(() => {
    const vals = (stat.data as { label: string; value: number }[]).map((d) => d.value);
    return vals.length ? Math.max(...vals) : 0;
  }, [stat.data]);

  const data = useMemo(() => {
    return (stat.data as { label: string; value: number }[])
      .slice()
      .sort((a, b) => b.value - a.value);
  }, [stat.data]);

  return (
    <div style={{ width: '100%', height: Math.max(200, data.length * 48 + 80) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 60, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
          <XAxis type="number" domain={[0, 'auto']} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            tick={{ fontSize: 12, fill: '#555' }}
          />
          <Tooltip
            formatter={(v: number, _n: string, item: { payload: { value: number } }) => [
              <span key="v">
                {v} 票 ({formatPercentage(item.payload.value, stat.total)})
              </span>,
              '票数',
            ]}
            contentStyle={{ borderRadius: 8, border: '1px solid #EEE', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
          />
          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
            isAnimationActive={initial}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => {
              const isMax = maxVal > 0 && entry.value === maxVal;
              return (
                <Cell
                  key={index}
                  fill={isMax ? 'url(#singleGradMax)' : 'url(#singleGrad)'}
                  stroke={isMax ? '#FF5722' : 'none'}
                  strokeDasharray={isMax ? '4 2' : 'none'}
                  strokeWidth={isMax ? 2 : 0}
                />
              );
            })}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v: number) =>
                stat.total > 0 ? `${v} (${formatPercentage(v, stat.total)})` : v
              }
              style={{ fontSize: 11, fill: '#555' }}
            />
            <defs>
              <linearGradient id="singleGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FFB74D" />
                <stop offset="100%" stopColor="#FF9800" />
              </linearGradient>
              <linearGradient id="singleGradMax" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FFB74D" />
                <stop offset="100%" stopColor="#FF7043" />
              </linearGradient>
            </defs>
          </Bar>
          {maxVal > 0 && (
            <ReferenceLine x={maxVal} stroke="#FF5722" strokeDasharray="4 2" strokeWidth={1} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const SingleBarChartMemo = memo(SingleBarChart);

function MultipleStackedChart({ stat, initial }: { stat: QuestionStat; initial: boolean }) {
  const data = useMemo(() => {
    const arr = stat.data as { label: string; value: number }[];
    const row: Record<string, number | string> = { name: '选项分布' };
    arr.forEach((d, i) => {
      row[`k${i}`] = d.value;
    });
    return [row];
  }, [stat.data]);

  const legendItems = useMemo(() => {
    const arr = stat.data as { label: string; value: number }[];
    return arr.map((d, i) => ({
      key: `k${i}`,
      label: d.label,
      value: d.value,
      color: MULTIPLE_COLORS[i % MULTIPLE_COLORS.length],
    }));
  }, [stat.data]);

  if (stat.total === 0) {
    return <Empty description="暂无数据" style={{ padding: 24 }} />;
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 40, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
          <XAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis type="number" allowDecimals={false} />
          <Tooltip
            formatter={(v: number, _n: string, item: { dataKey: string }) => {
              const li = legendItems.find((l) => l.key === item.dataKey);
              const label = li?.label || item.dataKey;
              return [
                <span key="v">
                  {v} 票 ({formatPercentage(v, stat.total)})
                </span>,
                label,
              ];
            }}
            contentStyle={{ borderRadius: 8, border: '1px solid #EEE' }}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value: string) => {
              const li = legendItems.find((l) => l.key === value);
              const v = li?.value || 0;
              return (
                <span style={{ fontSize: 12, color: '#555' }}>
                  {li?.label} <span style={{ color: '#999' }}>({v})</span>
                </span>
              );
            }}
          />
          {legendItems.map((li) => (
            <Bar
              key={li.key}
              dataKey={li.key}
              stackId="a"
              fill={li.color}
              isAnimationActive={initial}
              animationDuration={1000}
              animationEasing="ease-out"
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const MultipleStackedChartMemo = memo(MultipleStackedChart);

function RatingLineChart({ stat, initial }: { stat: QuestionStat; initial: boolean }) {
  const firstAnim = useRef(true);
  const [key, setKey] = useState(0);
  const trend = stat.trend || [];

  useEffect(() => {
    if (!initial && firstAnim.current) {
      firstAnim.current = false;
      setKey((k) => k + 1);
    }
  }, [initial]);

  if (stat.total === 0) {
    return <Empty description="暂无数据" style={{ padding: 24 }} />;
  }

  const avg = typeof stat.average === 'number' ? stat.average.toFixed(2) : '0';

  return (
    <div>
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #F06292, #E91E63)',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(233,30,99,0.25)',
          }}
        >
          平均分：<span style={{ fontWeight: 700, fontSize: 16 }}>{avg}</span> / 10
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          共 {stat.total} 份评分
        </div>
      </div>
      {trend.length > 1 ? (
        <div style={{ width: '100%', height: 280 }} key={key}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis
                dataKey="index"
                type="number"
                domain={['auto', 'auto']}
                allowDecimals={false}
                label={{ value: '第N次评分', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#888' }}
              />
              <YAxis domain={[1, 10]} type="number" tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(2)} 分`, '累计平均分']}
                labelFormatter={(l) => `第 ${l} 次提交后`}
                contentStyle={{ borderRadius: 8, border: '1px solid #EEE' }}
              />
              <Line
                type="monotone"
                dataKey="average"
                name="平均分趋势"
                stroke="#E91E63"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#E91E63', stroke: '#fff', strokeWidth: 1 }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={firstAnim.current}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stat.data as any[]} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(v: number) => [
                  `${v} 票 (${formatPercentage(v, stat.total)})`,
                  '选择人数',
                ]}
                contentStyle={{ borderRadius: 8, border: '1px solid #EEE' }}
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                isAnimationActive={initial}
                animationDuration={1000}
              >
                {(stat.data as any[]).map((_e, i) => (
                  <Cell
                    key={i}
                    fill={`hsl(${330 + i * 6}, 80%, ${55 + i * 2}%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const RatingLineChartMemo = memo(RatingLineChart);

function ChartByType({
  question,
  stat,
  initial,
}: {
  question: Question;
  stat: QuestionStat | null;
  initial: boolean;
}) {
  if (!stat) return <Empty description="暂无数据" style={{ padding: 24 }} />;

  const type: QuestionType = stat.type || question.type;

  if (type === 'single') return <SingleBarChartMemo stat={stat} initial={initial} />;
  if (type === 'multiple') return <MultipleStackedChartMemo stat={stat} initial={initial} />;
  if (type === 'rating') return <RatingLineChartMemo stat={stat} initial={initial} />;

  return null;
}

export default memo(ChartByType);
