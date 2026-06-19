import { useMemo } from 'react';
import {
  ParallelCoordinates,
  ParallelAxis,
  LineSeries,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useStore } from '../store';
import { pourMethodLabels } from '../types';
import { formatBrewTime } from '../utils/qrGenerator';
import type { BrewRecord, CoffeeBean } from '../types';

interface ComparisonViewProps {
  selectedRecords: BrewRecord[];
  beans: CoffeeBean[];
}

const colors = ['#6D4C41', '#8D6E63', '#A1887F', '#BCAAA4'];

const pourMethodToNumber: Record<string, number> = {
  'single-pour': 1,
  'three-stage': 2,
  'stirred': 3,
};

export const ComparisonView = ({ selectedRecords, beans }: ComparisonViewProps) => {
  const { clearComparison } = useStore();

  const chartData = useMemo(() => {
    return selectedRecords.map((record, index) => {
      const bean = beans.find((b) => b.id === record.beanId);
      return {
        name: `#${index + 1} ${bean?.name || '未知'}`,
        coffeeAmount: record.coffeeAmount,
        waterAmount: record.waterAmount,
        waterTemp: record.waterTemp,
        grindSize: record.grindSize,
        brewTime: record.brewTime,
        pourMethod: pourMethodToNumber[record.pourMethod],
        rating: record.rating.overall,
        color: colors[index],
      };
    });
  }, [selectedRecords, beans]);

  if (selectedRecords.length === 0) {
    return (
      <div
        style={{
          padding: 48,
          textAlign: 'center',
          color: '#A1887F',
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
        }}
      >
        <p style={{ fontSize: 16, margin: '0 0 8px 0' }}>请选择 2-4 条冲煮记录进行对比</p>
        <p style={{ fontSize: 13, margin: 0 }}>在冲煮记录列表中点击"对比"按钮选择记录</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              color: '#4E342E',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            冲煮对比分析
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#8D6E63' }}>
            已选择 {selectedRecords.length} 条记录进行对比
          </p>
        </div>
        <button
          onClick={clearComparison}
          style={{
            padding: '8px 16px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid #BCAAA4',
            backgroundColor: 'transparent',
            color: '#6D4C41',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5E6CC';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          清除选择
        </button>
      </div>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: 16,
            color: '#4E342E',
            fontWeight: 600,
          }}
        >
          参数对比平行坐标图
        </h3>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ParallelCoordinates data={chartData} layout="horizontal">
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div
                        style={{
                          backgroundColor: '#4E342E',
                          color: '#FFFFFF',
                          padding: 12,
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      >
                        <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>{data.name}</p>
                        <p style={{ margin: 0 }}>咖啡粉: {data.coffeeAmount}g</p>
                        <p style={{ margin: 0 }}>水量: {data.waterAmount}ml</p>
                        <p style={{ margin: 0 }}>水温: {data.waterTemp}°C</p>
                        <p style={{ margin: 0 }}>研磨度: {data.grindSize}</p>
                        <p style={{ margin: 0 }}>时间: {formatBrewTime(data.brewTime)}</p>
                        <p style={{ margin: 0 }}>评分: ★ {data.rating}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ParallelAxis
                dataKey="coffeeAmount"
                name="咖啡粉(g)"
                domain={[12, 20]}
                tick={{ fill: '#6D4C41', fontSize: 11 }}
                axisLine={{ stroke: '#E0D5C7' }}
              />
              <ParallelAxis
                dataKey="waterAmount"
                name="水量(ml)"
                domain={[220, 300]}
                tick={{ fill: '#6D4C41', fontSize: 11 }}
                axisLine={{ stroke: '#E0D5C7' }}
              />
              <ParallelAxis
                dataKey="waterTemp"
                name="水温(°C)"
                domain={[88, 96]}
                tick={{ fill: '#6D4C41', fontSize: 11 }}
                axisLine={{ stroke: '#E0D5C7' }}
              />
              <ParallelAxis
                dataKey="grindSize"
                name="研磨度"
                domain={[2, 5]}
                tick={{ fill: '#6D4C41', fontSize: 11 }}
                axisLine={{ stroke: '#E0D5C7' }}
              />
              <ParallelAxis
                dataKey="brewTime"
                name="冲煮时间(s)"
                domain={[120, 210]}
                tick={{ fill: '#6D4C41', fontSize: 11 }}
                axisLine={{ stroke: '#E0D5C7' }}
              />
              <ParallelAxis
                dataKey="pourMethod"
                name="注水方式"
                domain={[1, 3]}
                ticks={[1, 2, 3]}
                tickFormatter={(value: number) => {
                  const map: Record<number, string> = { 1: '一刀流', 2: '三段式', 3: '搅拌法' };
                  return map[value] || '';
                }}
                tick={{ fill: '#6D4C41', fontSize: 11 }}
                axisLine={{ stroke: '#E0D5C7' }}
              />
              <ParallelAxis
                dataKey="rating"
                name="评分"
                domain={[6, 10]}
                tick={{ fill: '#6D4C41', fontSize: 11 }}
                axisLine={{ stroke: '#E0D5C7' }}
              />
              {chartData.map((entry, index) => (
                <LineSeries
                  key={index}
                  type="linear"
                  dataKey={(d: any) => d}
                  stroke={colors[index]}
                  strokeWidth={2.5}
                  dot={{ fill: colors[index], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: colors[index] }}
                />
              ))}
            </ParallelCoordinates>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${selectedRecords.length}, 1fr)`,
          gap: 16,
        }}
      >
        {selectedRecords.map((record, index) => {
          const bean = beans.find((b) => b.id === record.beanId);
          return (
            <div
              key={record.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 20,
                borderTop: `4px solid ${colors[index]}`,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: colors[index],
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {index + 1}
                </div>
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: '#4E342E',
                      fontWeight: 600,
                    }}
                  >
                    {bean?.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: 11, color: '#A1887F' }}>
                    {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  fontSize: 11,
                }}
              >
                <div>
                  <span style={{ color: '#A1887F' }}>粉水比</span>
                  <p style={{ margin: '2px 0 0 0', color: '#4E342E', fontWeight: 600 }}>
                    1:{Math.round(record.waterAmount / record.coffeeAmount)}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#A1887F' }}>水温</span>
                  <p style={{ margin: '2px 0 0 0', color: '#4E342E', fontWeight: 600 }}>
                    {record.waterTemp}°C
                  </p>
                </div>
                <div>
                  <span style={{ color: '#A1887F' }}>研磨度</span>
                  <p style={{ margin: '2px 0 0 0', color: '#4E342E', fontWeight: 600 }}>
                    {record.grindSize}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#A1887F' }}>时间</span>
                  <p style={{ margin: '2px 0 0 0', color: '#4E342E', fontWeight: 600 }}>
                    {formatBrewTime(record.brewTime)}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#A1887F' }}>注水方式</span>
                  <p style={{ margin: '2px 0 0 0', color: '#4E342E', fontWeight: 600 }}>
                    {pourMethodLabels[record.pourMethod]}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#A1887F' }}>总分</span>
                  <p style={{ margin: '2px 0 0 0', color: '#FF8F00', fontWeight: 600 }}>
                    ★ {record.rating.overall}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
