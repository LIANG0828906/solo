/**
 * 【组件职责】纯 SVG 绘制的位置分布扇形饼图，支持悬浮高亮、中心 tooltip 与图例展示
 * 【被调用方】MatchCard（展开详情时）、MatchDetail 详情页
 * 【数据流向】父组件传入 positions:{后卫,前锋,中锋} 统计 → 内部计算各扇形弧度比例 → useState 管理 hover 索引 → SVG 渲染
 */
import { useState, useMemo } from 'react';

interface PositionPieChartProps {
  positions: {
    后卫: number;
    前锋: number;
    中锋: number;
  };
}

const POSITION_COLORS: Record<keyof PositionPieChartProps['positions'], string> = {
  后卫: '#5D4037',
  前锋: '#7CB342',
  中锋: '#F9A825',
};

const POSITION_KEYS: (keyof PositionPieChartProps['positions'])[] = [
  '后卫',
  '前锋',
  '中锋',
];

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeSector(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    cx,
    cy,
    'L',
    start.x,
    start.y,
    'A',
    r,
    r,
    0,
    largeArc,
    0,
    end.x,
    end.y,
    'Z',
  ].join(' ');
}

export function PositionPieChart({ positions }: PositionPieChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const total = useMemo(() => {
    return POSITION_KEYS.reduce((sum, key) => sum + (positions[key] || 0), 0);
  }, [positions]);

  const sectors = useMemo(() => {
    if (total === 0) {
      return POSITION_KEYS.map((key) => ({
        key,
        value: 0,
        startAngle: 0,
        endAngle: 0,
        path: '',
      }));
    }

    let currentAngle = 0;
    return POSITION_KEYS.map((key) => {
      const value = positions[key] || 0;
      const angle = (value / total) * 360;
      const startAngle = currentAngle;
      let endAngle = currentAngle + angle;
      if (value > 0 && endAngle - startAngle < 0.1) {
        endAngle = startAngle + 0.1;
      }
      const path =
        value > 0
          ? describeSector(100, 100, 70, startAngle, endAngle)
          : '';
      currentAngle = endAngle;
      return { key, value, startAngle, endAngle, path };
    });
  }, [positions, total]);

  const cx = 100;
  const cy = 100;
  const hoverOffset = 2;

  const centerLabel = useMemo(() => {
    if (hoverIdx === null) {
      return {
        line1: total.toString(),
        line2: '总人数',
      };
    }
    const s = sectors[hoverIdx];
    if (!s || s.value === 0) {
      return { line1: '0', line2: '无' };
    }
    const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
    return {
      line1: `${s.key} ${s.value}人`,
      line2: `(${pct}%)`,
    };
  }, [hoverIdx, sectors, total]);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 200 200"
        className="w-48 h-48 sm:w-52 sm:h-52"
        role="img"
        aria-label="位置分布饼图"
      >
        {total === 0 ? (
          <>
            <circle
              cx={cx}
              cy={cy}
              r={70}
              fill="#F5F5F5"
              stroke="#E0E0E0"
              strokeDasharray="4 4"
            />
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-court-brown text-lg font-bold"
              fontSize="18"
            >
              暂无
            </text>
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-court-brownLight text-xs"
              fontSize="12"
            >
              报名数据
            </text>
          </>
        ) : (
          <>
            {sectors.map((s, idx) => {
              if (s.value === 0) return null;
              const isHover = hoverIdx === idx;
              const midAngle = (s.startAngle + s.endAngle) / 2;
              const offset = isHover ? hoverOffset : 0;
              const dx =
                offset * Math.cos(((midAngle - 90) * Math.PI) / 180);
              const dy =
                offset * Math.sin(((midAngle - 90) * Math.PI) / 180);
              return (
                <path
                  key={s.key}
                  d={s.path}
                  fill={POSITION_COLORS[s.key]}
                  stroke="white"
                  strokeWidth={isHover ? 3 : 1.5}
                  transform={`translate(${dx}, ${dy})`}
                  style={{
                    cursor: 'pointer',
                    transition:
                      'transform 0.2s ease, stroke-width 0.2s ease',
                    filter: isHover
                      ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))'
                      : 'none',
                  }}
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onFocus={() => setHoverIdx(idx)}
                  onBlur={() => setHoverIdx(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${s.key}: ${s.value}人`}
                />
              );
            })}

            <circle
              cx={cx}
              cy={cy}
              r={38}
              fill="white"
              stroke="#E8E8E8"
              strokeWidth={1}
            />
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-court-brown font-bold"
              fontSize={hoverIdx !== null ? '11' : '20'}
              fontWeight={700}
            >
              {centerLabel.line1}
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-court-brownLight"
              fontSize={hoverIdx !== null ? '10' : '10'}
            >
              {centerLabel.line2}
            </text>
          </>
        )}
      </svg>

      <div className="grid grid-cols-3 gap-2 w-full max-w-[220px]">
        {POSITION_KEYS.map((key, idx) => (
          <div
            key={key}
            className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-md transition-colors ${
              hoverIdx === idx ? 'bg-gray-100' : ''
            }`}
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm shadow-sm"
                style={{ backgroundColor: POSITION_COLORS[key] }}
              />
              <span className="text-xs font-medium text-court-brown">
                {key}
              </span>
            </div>
            <span className="text-sm font-bold text-court-brownDark">
              {positions[key] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
