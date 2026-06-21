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

const RESOURCE_STYLES: Record<ResourceType, { strokeDasharray: string }> = {
  wood: { strokeDasharray: '' },
  ore: { strokeDasharray: '5 5' },
  food: { strokeDasharray: '3 3' },
  gold: { strokeDasharray: '1 1' },
};

const getLineKey = (civ: CivilizationType, res: ResourceType): string => `${civ}-${res}`;

const getLineName = (civ: CivilizationType, res: ResourceType): string =>
  `${CIVILIZATION_NAMES[civ]} - ${RESOURCE_NAMES[res]}`;

const TradeChart: React.FC<TradeChartProps> = ({ resourceHistory }) => {
  const chartData: ChartDataPoint[] = resourceHistory.map((item) => {
    const dataPoint: ChartDataPoint = { round: item.round };
    (Object.keys(CIVILIZATION_NAMES) as CivilizationType[]).forEach((civ) => {
      (Object.keys(RESOURCE_NAMES) as ResourceType[]).forEach((res) => {
        dataPoint[getLineKey(civ, res)] = item.resources[civ][res];
      });
    });
    return dataPoint;
  });

  const renderLines = () => {
    const lines: React.ReactNode[] = [];
    (Object.keys(CIVILIZATION_NAMES) as CivilizationType[]).forEach((civ) => {
      (Object.keys(RESOURCE_NAMES) as ResourceType[]).forEach((res) => {
        const key = getLineKey(civ, res);
        lines.push(
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={getLineName(civ, res)}
            stroke={CIVILIZATION_COLORS[civ]}
            strokeWidth={2}
            strokeDasharray={RESOURCE_STYLES[res].strokeDasharray}
            dot={false}
            activeDot={{ r: 4 }}
          />
        );
      });
    });
    return lines;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#16213e',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5a" />
          <XAxis
            dataKey="round"
            stroke="#e0e0e0"
            tick={{ fill: '#e0e0e0' }}
            label={{ value: '轮次', fill: '#e0e0e0', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            stroke="#e0e0e0"
            tick={{ fill: '#e0e0e0' }}
            label={{ value: '资源数量', fill: '#e0e0e0', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a2a4a',
              border: '1px solid #2a3a5a',
              borderRadius: '4px',
              color: '#e0e0e0',
            }}
            itemStyle={{ color: '#e0e0e0' }}
            labelStyle={{ color: '#e0e0e0', fontWeight: 'bold' }}
          />
          <Legend
            wrapperStyle={{ color: '#e0e0e0' }}
            formatter={(value: string) => <span style={{ color: '#e0e0e0' }}>{value}</span>}
          />
          {renderLines()}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradeChart;
