import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  CivilizationType,
  ResourceType,
  Resources,
  CIVILIZATION_NAMES,
  RESOURCE_NAMES,
  CIVILIZATION_COLORS,
} from '../engine/types';

interface TradeChartProps {
  resourceHistory: { round: number; resources: Record<CivilizationType, Resources> }[];
}

interface ChartDataPoint {
  round: number;
  [key: string]: number | string;
}

const RESOURCE_STYLES: Record<ResourceType, { strokeDasharray: string; width: number }> = {
  wood: { strokeDasharray: '', width: 2.5 },
  ore: { strokeDasharray: '6 4', width: 2.5 },
  food: { strokeDasharray: '2 3', width: 2.5 },
  gold: { strokeDasharray: '1 2', width: 2.5 },
};

const getLineKey = (civ: CivilizationType, res: ResourceType): string => `${civ}_${res}`;

const getLineName = (civ: CivilizationType, res: ResourceType): string =>
  `${CIVILIZATION_NAMES[civ]} - ${RESOURCE_NAMES[res]}`;

const TradeChart: React.FC<TradeChartProps> = ({ resourceHistory }) => {
  const civIds: CivilizationType[] = ['elf', 'dwarf', 'human'];
  const resourceTypes: ResourceType[] = ['wood', 'ore', 'food', 'gold'];

  const chartData: ChartDataPoint[] = React.useMemo(() => {
    return resourceHistory.map((item) => {
      const dataPoint: ChartDataPoint = { round: item.round };
      civIds.forEach((civ) => {
        resourceTypes.forEach((res) => {
          dataPoint[getLineKey(civ, res)] = item.resources[civ][res];
        });
      });
      return dataPoint;
    });
  }, [resourceHistory]);

  const renderLines = React.useCallback(() => {
    const lines: React.ReactNode[] = [];
    civIds.forEach((civ) => {
      resourceTypes.forEach((res) => {
        const key = getLineKey(civ, res);
        lines.push(
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={getLineName(civ, res)}
            stroke={CIVILIZATION_COLORS[civ]}
            strokeWidth={RESOURCE_STYLES[res].width}
            strokeDasharray={RESOURCE_STYLES[res].strokeDasharray}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        );
      });
    });
    return lines;
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: '#1a2a4a',
            border: '1px solid #2a3a5a',
            borderRadius: '8px',
            padding: '12px',
            color: '#e0e0e0',
            fontSize: '12px',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#fff' }}>
            第 {label} 轮
          </p>
          {civIds.map((civId) => (
            <div key={civId} style={{ marginBottom: '6px' }}>
              <div
                style={{
                  fontWeight: 600,
                  color: CIVILIZATION_COLORS[civId],
                  marginBottom: '2px',
                }}
              >
                {CIVILIZATION_NAMES[civId]}
              </div>
              <div style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {resourceTypes.map((res) => {
                  const key = getLineKey(civId, res);
                  const entry = payload.find((p: any) => p.dataKey === key);
                  return (
                    <span key={res} style={{ color: '#b0b0c0' }}>
                      {RESOURCE_NAMES[res]}: {entry?.value ?? 0}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px 20px 4px 20px',
          fontSize: '15px',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        资源变化曲线
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: '0 8px 12px 8px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5a" />
            <XAxis
              dataKey="round"
              stroke="#e0e0e0"
              tick={{ fill: '#e0e0e0', fontSize: 11 }}
              label={{
                value: '轮次',
                fill: '#e0e0e0',
                position: 'insideBottom',
                offset: -5,
                fontSize: 12,
              }}
            />
            <YAxis
              stroke="#e0e0e0"
              tick={{ fill: '#e0e0e0', fontSize: 11 }}
              label={{
                value: '资源数量',
                fill: '#e0e0e0',
                angle: -90,
                position: 'insideLeft',
                fontSize: 12,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                color: '#e0e0e0',
                fontSize: '11px',
                paddingTop: '8px',
              }}
              formatter={(value: string) => (
                <span style={{ color: '#e0e0e0', fontSize: '11px' }}>{value}</span>
              )}
            />
            {renderLines()}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TradeChart;
