import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { useAssetStore } from '../asset/assetStore';
import {
  calculateReturnRate,
  calculateTypeAllocation,
  formatCurrency,
  formatPercentage,
  type TypeAllocation,
} from '@/utils/calculations';

const PerformanceChart: React.FC = () => {
  const { assets } = useAssetStore();
  const navigate = useNavigate();

  const allocationData = useMemo(() => {
    return calculateTypeAllocation(assets).filter((item) => item.value > 0);
  }, [assets]);

  const returnRateData = useMemo(() => {
    return [...assets]
      .map((asset) => ({
        id: asset.id,
        name: asset.name,
        returnRate: calculateReturnRate(asset.buyPrice, asset.currentPrice),
        type: asset.type,
      }))
      .sort((a, b) => b.returnRate - a.returnRate);
  }, [assets]);

  const handleBarClick = (data: { id: string }) => {
    navigate('/asset', { state: { highlightAssetId: data.id } });
  };

  const CustomPieTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: TypeAllocation }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-3 shadow-lg">
          <p className="text-text-primary font-medium">{data.label}</p>
          <p className="text-text-secondary text-sm">市值: ¥{formatCurrency(data.value)}</p>
          <p className="text-text-secondary text-sm">占比: {data.percentage.toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: { name: string; type: string } }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = payload[0].value;
      return (
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-3 shadow-lg">
          <p className="text-text-primary font-medium">{data.name}</p>
          <p className={`text-sm ${value >= 0 ? 'text-success' : 'text-danger'}`}>
            收益率: {formatPercentage(value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (assets.length === 0) {
    return (
      <div className="chart-container text-center py-12">
        <p className="text-text-secondary">暂无资产数据，请先添加资产</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-text-primary mb-4">资产配置比例</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                animationDuration={500}
              >
                {allocationData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="none"
                    className="cursor-pointer transition-transform hover:scale-105"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend
                formatter={(value) => <span className="text-text-secondary">{value}</span>}
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-container">
        <h3 className="text-lg font-semibold text-text-primary mb-4">资产收益率排名</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={returnRateData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#3E3E5E" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#A0A0B0' }}
                axisLine={{ stroke: '#3E3E5E' }}
                tickLine={{ stroke: '#3E3E5E' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#A0A0B0', fontSize: 12 }}
                axisLine={{ stroke: '#3E3E5E' }}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey="returnRate"
                animationDuration={500}
                cursor="pointer"
                onClick={handleBarClick}
                radius={[0, 4, 4, 0]}
              >
                {returnRateData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.returnRate >= 0 ? '#50C878' : '#FF6B6B'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
