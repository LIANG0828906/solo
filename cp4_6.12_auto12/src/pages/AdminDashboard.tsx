import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { InventoryItem } from '../types';

const CHART_COLORS = ['#D32F2F', '#F9A825', '#7B1FA2', '#1976D2', '#558B2F'];

export const AdminDashboard: React.FC = () => {
  const { inventory, fetchInventory, fetchPurchaseSuggestions } = useStore();
  const [trendData, setTrendData] = useState<any[]>([]);
  const [popularFormulas, setPopularFormulas] = useState<any[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<InventoryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [blinkingRows, setBlinkingRows] = useState<number[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const lowStockItems = inventory.filter(item => item.currentStock < item.safeThreshold);
    if (lowStockItems.length > 0) {
      setBlinkingRows(lowStockItems.map(item => item.id));
      setTimeout(() => setBlinkingRows([]), 2000);
    }
  }, [inventory]);

  const loadDashboardData = async () => {
    await fetchInventory();
    
    try {
      const [trend, formulas, status, purchaseSuggestions] = await Promise.all([
        fetch('/api/dashboard/orders-trend').then(r => r.json()),
        fetch('/api/dashboard/popular-formulas').then(r => r.json()),
        fetch('/api/dashboard/orders-by-status').then(r => r.json()),
        fetchPurchaseSuggestions()
      ]);
      
      setTrendData(trend);
      setPopularFormulas(formulas);
      setOrdersByStatus(status);
      
      if (purchaseSuggestions.length > 0) {
        setSuggestions(purchaseSuggestions);
        setShowSuggestions(true);
        setTimeout(() => setShowSuggestions(false), 5000);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, height, value, payload } = props;
    return (
      <g>
        <foreignObject x={x - 40} y={y - 36} width={80} height={30}>
          <div className="bar-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span 
              className="color-block" 
              style={{ 
                width: '16px', 
                height: '16px',
                background: `linear-gradient(135deg, ${payload.colorFrom}, ${payload.colorTo})` 
              }}
            ></span>
            <span style={{ fontSize: '12px', fontWeight: '500' }}>{payload.name}</span>
          </div>
        </foreignObject>
        <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#3E2723" fontSize={14} fontWeight={600}>
          {value}
        </text>
      </g>
    );
  };

  return (
    <div>
      <h1 className="page-title">📊 数据仪表盘</h1>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>📈 上月订单完成趋势</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#8D6E63"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#8D6E63" tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={formatDate}
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="完成订单数" 
                  stroke="#3E2723" 
                  strokeWidth={3}
                  dot={{ fill: '#3E2723', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, fill: '#8D6E63' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>🥧 订单状态分布</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#8D6E63' }}
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={['#9E9E9E', '#2196F3', '#00BCD4', '#9C27B0', '#F44336', '#FF9800', '#4CAF50', '#795548', '#4CAF50'][index % 9]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
          <h3>🏆 热门染料配方使用频次</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularFormulas} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#8D6E63"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  hide
                />
                <YAxis stroke="#8D6E63" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="usageCount" 
                  name="使用次数"
                  radius={[8, 8, 0, 0]}
                  label={renderCustomBarLabel}
                  barSize={60}
                >
                  {popularFormulas.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={`url(#colorGradient-${index})`}
                    />
                  ))}
                  <defs>
                    {popularFormulas.map((entry, index) => (
                      <linearGradient 
                        key={`gradient-${index}`} 
                        id={`colorGradient-${index}`}
                        x1="0%" y1="0%" x2="0%" y2="100%"
                      >
                        <stop offset="0%" stopColor={entry.colorFrom || CHART_COLORS[index]} />
                        <stop offset="100%" stopColor={entry.colorTo || CHART_COLORS[index]} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h2 className="page-title" style={{ marginTop: '48px', fontSize: '24px' }}>
        📦 原料库存管理
      </h2>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>原料名称</th>
              <th>来源产地</th>
              <th>当前库存</th>
              <th>库存上限</th>
              <th>安全阈值</th>
              <th>库存状态</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              const isLow = item.currentStock < item.safeThreshold;
              const percentage = getStockPercentage(item.currentStock, item.maxStock);
              const isBlinking = blinkingRows.includes(item.id);

              return (
                <tr 
                  key={item.id} 
                  className={isBlinking ? 'low-stock' : ''}
                  style={{ 
                    background: isLow && !isBlinking ? 'rgba(211, 47, 47, 0.08)' : undefined 
                  }}
                >
                  <td style={{ fontWeight: '500' }}>{item.name}</td>
                  <td>{item.origin}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: '600', color: isLow ? '#D32F2F' : '#3E2723' }}>
                        {item.currentStock} {item.unit}
                      </span>
                      <div style={{ flex: 1, maxWidth: '120px' }}>
                        <div className="stock-bar">
                          <div 
                            className={`stock-bar-fill ${isLow ? 'low' : ''}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{item.maxStock} {item.unit}</td>
                  <td style={{ color: '#D32F2F', fontWeight: '500' }}>
                    {item.safeThreshold} {item.unit}
                  </td>
                  <td>
                    <span 
                      style={{ 
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: isLow ? '#FFCDD2' : '#C8E6C9',
                        color: isLow ? '#C62828' : '#2E7D32'
                      }}
                    >
                      {isLow ? '⚠️ 库存不足' : '✓ 正常'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestion-container">
          <div className="suggestion-card">
            <h4 className="suggestion-title">⚠️ 采购建议</h4>
            {suggestions.map((item, index) => (
              <div key={item.id} className="suggestion-item">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    background: '#D32F2F',
                    color: 'white',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ fontWeight: '500' }}>{item.name}</span>
                </span>
                <span style={{ color: '#D32F2F', fontWeight: '600' }}>
                  仅剩 {item.currentStock} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
