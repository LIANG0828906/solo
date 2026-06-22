import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { StockReport } from '../types';

interface ReportChartProps {
  report: StockReport | null;
  onGenerate: () => Promise<void>;
  isLoading: boolean;
}

interface ChartDataItem {
  name: string;
  currentStock: number;
  suggestedStock: number;
}

export const ReportChart: React.FC<ReportChartProps> = ({
  report,
  onGenerate,
  isLoading,
}) => {
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    if (report) {
      setChartKey((prev) => prev + 1);
    }
  }, [report]);

  const chartData: ChartDataItem[] = report
    ? report.items.map((item) => ({
        name: item.name,
        currentStock: item.currentStock,
        suggestedStock: item.suggestedStock,
      }))
    : [];

  const COLORS = {
    current: '#4A90D9',
    suggested: '#FF6B35',
  };

  return (
    <div className="fade-transition">
      <div className="card">
        <div className="section-header">
          <h3 className="card-title" style={{ marginBottom: 0 }}>
            补货建议报表
          </h3>
          <button
            className="btn"
            onClick={onGenerate}
            disabled={isLoading}
          >
            {isLoading ? '生成中...' : '生成补货报表'}
          </button>
        </div>

        {!report && !isLoading && (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">
              点击"生成补货报表"按钮查看补货建议
            </div>
          </div>
        )}

        {isLoading && (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-text">正在生成报表...</div>
          </div>
        )}

        {report && !isLoading && (
          <>
            <div className="stats-summary" style={{ marginTop: '20px' }}>
              <div className="stat-card">
                <div className="stat-card-value">{report.items.length}</div>
                <div className="stat-card-label">需补货商品数</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value" style={{ color: '#FF6B35' }}>
                  {report.totalSuggestedQuantity}
                </div>
                <div className="stat-card-label">建议补货总量</div>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="chart-container" style={{ height: '400px', marginTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    key={chartKey}
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#666' }}
                      axisLine={{ stroke: '#E0E0E0' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#666' }}
                      axisLine={{ stroke: '#E0E0E0' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                      labelStyle={{ fontWeight: 600, color: '#1E3A5F' }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                    />
                    <Bar
                      dataKey="currentStock"
                      name="当前库存"
                      fill={COLORS.current}
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`current-${index}`}
                          fill={COLORS.current}
                          style={{
                            transformOrigin: 'bottom',
                            animation: `growFromBottom 0.8s ease-out ${index * 0.05}s both`,
                          }}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="suggestedStock"
                      name="建议补货量"
                      fill={COLORS.suggested}
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`suggested-${index}`}
                          fill={COLORS.suggested}
                          style={{
                            transformOrigin: 'bottom',
                            animation: `growFromBottom 0.8s ease-out ${index * 0.05 + 0.2}s both`,
                          }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="report-list">
              <h4 style={{ fontSize: '15px', color: '#1E3A5F', marginBottom: '16px' }}>
                补货详情列表
              </h4>
              {report.items.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <div className="empty-state-text">暂无需要补货的商品</div>
                </div>
              ) : (
                report.items.map((item) => (
                  <div key={item.id} className="report-item">
                    <div className="report-item-info">
                      <div className="report-item-name">{item.name}</div>
                      <div className="report-item-reason">原因：{item.reason}</div>
                    </div>
                    <div className="report-item-stock">
                      <div className="report-stock-current">
                        当前库存：{item.currentStock}
                      </div>
                      <div className="report-stock-suggested">
                        建议补货：{item.suggestedStock}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportChart;
