import React from 'react';
import { useSoundStore } from '../store/useSoundStore';

const PADDING_LEFT = 40;
const PADDING_RIGHT = 10;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 25;
const CHART_WIDTH = 350;
const CHART_HEIGHT = 165;
const CHART_X_MIN = PADDING_LEFT;
const CHART_X_MAX = PADDING_LEFT + CHART_WIDTH;
const CHART_Y_MIN = PADDING_TOP;
const CHART_Y_MAX = PADDING_TOP + CHART_HEIGHT;

const mapX = (time: number) => PADDING_LEFT + (time / 2000) * CHART_WIDTH;
const mapY = (level: number) => CHART_Y_MAX - (level / 100) * CHART_HEIGHT;

const ReverbChart: React.FC = () => {
  const reflectionPaths = useSoundStore((state) => state.reflectionPaths);
  const reverbCurve = useSoundStore((state) => state.reverbCurve);

  const horizontalTicks = [0, 25, 50, 75, 100];
  const verticalTicks = [0, 500, 1000, 1500, 2000];

  const linePoints = reverbCurve
    .map((p) => `${mapX(p.time)},${mapY(p.level)}`)
    .join(' ');

  const areaPath =
    reverbCurve.length > 0
      ? `M ${mapX(reverbCurve[0].time)},${CHART_Y_MAX} ` +
        reverbCurve.map((p) => `L ${mapX(p.time)},${mapY(p.level)}`).join(' ') +
        ` L ${mapX(reverbCurve[reverbCurve.length - 1].time)},${CHART_Y_MAX} Z`
      : '';

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          backgroundColor: '#0F3460',
          borderRadius: 8,
          padding: 12,
        }}
      >
        <svg
          width="100%"
          height="200"
          viewBox="0 0 400 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
            </linearGradient>
          </defs>

          <text
            x={40}
            y={8}
            fill="#FFFFFF"
            fontSize={12}
            fontWeight="bold"
            dominantBaseline="hanging"
          >
            混响衰减曲线
          </text>

          {horizontalTicks.map((tick) => {
            const y = mapY(tick);
            return (
              <line
                key={`h-${tick}`}
                x1={CHART_X_MIN}
                y1={y}
                x2={CHART_X_MAX}
                y2={y}
                stroke="#1A1A2E"
                strokeWidth={1}
              />
            );
          })}

          {verticalTicks.map((tick) => {
            const x = mapX(tick);
            return (
              <line
                key={`v-${tick}`}
                x1={x}
                y1={CHART_Y_MIN}
                x2={x}
                y2={CHART_Y_MAX}
                stroke="#1A1A2E"
                strokeWidth={1}
              />
            );
          })}

          {horizontalTicks.map((tick) => (
            <text
              key={`hl-${tick}`}
              x={PADDING_LEFT - 6}
              y={mapY(tick)}
              fill="#A0AEC0"
              fontSize={10}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {tick}
            </text>
          ))}

          <text
            x={4}
            y={PADDING_TOP}
            fill="#A0AEC0"
            fontSize={10}
            dominantBaseline="hanging"
          >
            dB
          </text>

          {verticalTicks.map((tick) => (
            <text
              key={`vl-${tick}`}
              x={mapX(tick)}
              y={CHART_Y_MAX + 18}
              fill="#A0AEC0"
              fontSize={10}
              textAnchor="middle"
            >
              {tick}
            </text>
          ))}

          <text
            x={CHART_X_MAX}
            y={CHART_Y_MAX + 18}
            fill="#A0AEC0"
            fontSize={10}
            textAnchor="end"
          >
            ms
          </text>

          {areaPath && <path d={areaPath} fill="url(#curveGradient)" />}

          <polyline
            points={linePoints}
            fill="none"
            stroke="#00E5FF"
            strokeWidth={2}
          />

          {reflectionPaths.map((path) => {
            let level = 0;
            if (path.energy > 1e-12) {
              level = 100 + 20 * Math.log10(path.energy);
            }
            level = Math.max(0, Math.min(100, level));

            const cx = mapX(path.arrivalTime);
            const cy = mapY(level);
            const r = Math.min(8, path.energy * 8);

            if (cx < CHART_X_MIN || cx > CHART_X_MAX) return null;

            return (
              <path
                key={path.id}
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="#00E5FF"
                fillOpacity={0.7}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default ReverbChart;
