import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  AreaChart, Area
} from 'recharts';
import type {
  Activity, ActivityCategory, TransportType, DietType, EnergyType,
  CarbonResult, CategoryBreakdown, PageType
} from './types';
import {
  calculateTotal, calculateEmission, getMonthlyData,
  generateActivityId, getFactor, getCategoryName,
  exportToCSV, downloadCSV, getUnitBySubType
} from './carbonCalculator';
import {
  transformToPieData, transformToBarData, transformToLineData,
  transformToStackedAreaData, PIE_COLORS, BAR_COLORS, STACKED_COLORS,
  exportChartAsImage, PieChartData, BarChartData
} from './chartRenderer';

const STORAGE_KEY = 'carbon_footprint_activities';

const CATEGORY_OPTIONS: { label: string; value: ActivityCategory }[] = [
  { label: '🚗 交通出行', value: 'transport' },
  { label: '🍽️ 饮食消费', value: 'diet' },
  { label: '⚡ 能源使用', value: 'energy' }
];

const SUBTYPE_OPTIONS: Record<ActivityCategory, { label: string; value: string }[]> = {
  transport: [
    { label: '🚶 步行', value: 'walk' },
    { label: '🚇 地铁', value: 'subway' },
    { label: '🚌 公交', value: 'bus' },
    { label: '🚗 自驾', value: 'car' },
    { label: '✈️ 飞行', value: 'flight' }
  ],
  diet: [
    { label: '🥩 肉类', value: 'meat' },
    { label: '🥬 蔬菜', value: 'vegetable' },
    { label: '🌾 谷物', value: 'grain' }
  ],
  energy: [
    { label: '💡 电力', value: 'electricity' },
    { label: '🔥 天然气', value: 'gas' }
  ]
};

const generateSampleData = (): Activity[] => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const samples: Activity[] = [
    { id: generateActivityId(), category: 'transport', subType: 'car', amount: 45, unit: 'km', date: new Date(now - 2 * day).toISOString(), timestamp: now - 2 * day },
    { id: generateActivityId(), category: 'transport', subType: 'subway', amount: 12, unit: 'km', date: new Date(now - 1 * day).toISOString(), timestamp: now - 1 * day },
    { id: generateActivityId(), category: 'diet', subType: 'meat', amount: 0.5, unit: 'kg', date: new Date(now - 1 * day).toISOString(), timestamp: now - 1 * day },
    { id: generateActivityId(), category: 'diet', subType: 'vegetable', amount: 1.2, unit: 'kg', date: new Date(now).toISOString(), timestamp: now },
    { id: generateActivityId(), category: 'energy', subType: 'electricity', amount: 30, unit: 'kWh', date: new Date(now - 5 * day).toISOString(), timestamp: now - 5 * day },
    { id: generateActivityId(), category: 'transport', subType: 'bus', amount: 8, unit: 'km', date: new Date(now - 8 * day).toISOString(), timestamp: now - 8 * day },
    { id: generateActivityId(), category: 'diet', subType: 'grain', amount: 2, unit: 'kg', date: new Date(now - 10 * day).toISOString(), timestamp: now - 10 * day },
    { id: generateActivityId(), category: 'energy', subType: 'gas', amount: 5, unit: 'm³', date: new Date(now - 15 * day).toISOString(), timestamp: now - 15 * day },
    { id: generateActivityId(), category: 'transport', subType: 'flight', amount: 1200, unit: 'km', date: new Date(now - 25 * day).toISOString(), timestamp: now - 25 * day },
    { id: generateActivityId(), category: 'diet', subType: 'meat', amount: 0.8, unit: 'kg', date: new Date(now - 35 * day).toISOString(), timestamp: now - 35 * day },
    { id: generateActivityId(), category: 'energy', subType: 'electricity', amount: 45, unit: 'kWh', date: new Date(now - 40 * day).toISOString(), timestamp: now - 40 * day },
    { id: generateActivityId(), category: 'transport', subType: 'walk', amount: 5, unit: 'km', date: new Date(now - 45 * day).toISOString(), timestamp: now - 45 * day }
  ];
  return samples;
};

export default function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentPage, setCurrentPage] = useState<PageType>('input');
  const [category, setCategory] = useState<ActivityCategory>('transport');
  const [subType, setSubType] = useState<string>('car');
  const [amount, setAmount] = useState<string>('');
  const [selectedPieCategory, setSelectedPieCategory] = useState<string | null>(null);
  const [selectedBarItem, setSelectedBarItem] = useState<BarChartData | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const historyContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setActivities(JSON.parse(saved));
      } catch {
        setActivities(generateSampleData());
      }
    } else {
      setActivities(generateSampleData());
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    }
  }, [activities, isLoaded]);

  useEffect(() => {
    const options = SUBTYPE_OPTIONS[category];
    if (options && options.length > 0) {
      setSubType(options[0].value);
    }
  }, [category]);

  const carbonResult: CarbonResult = useMemo(() => {
    const start = performance.now();
    const result = calculateTotal(activities);
    const elapsed = performance.now() - start;
    if (elapsed > 50) {
      console.warn(`计算耗时 ${elapsed.toFixed(2)}ms，超过50ms阈值`);
    }
    return result;
  }, [activities]);

  const monthlyData = useMemo(() => getMonthlyData(activities), [activities]);
  const pieData = useMemo(() => transformToPieData(carbonResult.breakdown), [carbonResult]);
  const lineData = useMemo(() => transformToLineData(monthlyData), [monthlyData]);
  const stackedData = useMemo(() => transformToStackedAreaData(monthlyData), [monthlyData]);

  const selectedBreakdown: CategoryBreakdown | undefined = useMemo(() => {
    if (!selectedPieCategory) return undefined;
    return carbonResult.breakdown.find(b => b.category === selectedPieCategory);
  }, [selectedPieCategory, carbonResult]);

  const barData: BarChartData[] = useMemo(() => {
    if (!selectedBreakdown) return [];
    return transformToBarData(selectedBreakdown.subItems);
  }, [selectedBreakdown]);

  const sortedActivities = useMemo(() =>
    [...activities].sort((a, b) => b.timestamp - a.timestamp),
    [activities]
  );

  const visibleActivities = useMemo(() =>
    sortedActivities.slice(0, visibleCount),
    [sortedActivities, visibleCount]
  );

  const handleScroll = useCallback(() => {
    const container = historyContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setVisibleCount(prev => Math.min(prev + 10, sortedActivities.length));
    }
  }, [sortedActivities.length]);

  useEffect(() => {
    setVisibleCount(10);
  }, [currentPage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('请输入有效的数量');
      return;
    }
    const unit = getUnitBySubType(subType as TransportType | DietType | EnergyType);
    const now = Date.now();
    const newActivity: Activity = {
      id: generateActivityId(),
      category,
      subType: subType as TransportType | DietType | EnergyType,
      amount: numAmount,
      unit,
      date: new Date(now).toISOString(),
      timestamp: now
    };
    setActivities(prev => [newActivity, ...prev]);
    setAmount('');
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      setActivities(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleExportCSV = () => {
    if (activities.length === 0) {
      alert('没有数据可以导出');
      return;
    }
    const csvContent = exportToCSV(activities);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `碳足迹记录_${dateStr}.csv`);
  };

  const handlePieClick = (data: PieChartData) => {
    setSelectedPieCategory(prev => prev === data.category ? null : data.category);
    setSelectedBarItem(null);
  };

  const handleBarClick = (data: BarChartData) => {
    setSelectedBarItem(prev => prev?.subType === data.subType ? null : data);
  };

  const getActivitySummary = (activity: Activity): string => {
    const factor = getFactor(activity.category, activity.subType);
    return `${getCategoryName(activity.category)} - ${factor?.name || activity.subType} ${activity.amount}${activity.unit}`;
  };

  const CATEGORY_EMOJI: Record<ActivityCategory, string> = {
    transport: '🚗', diet: '🍽️', energy: '⚡'
  };

  return (
    <div style={styles.app}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .fade-in { animation: fadeIn 0.5s ease-out; }
        .pulse-in { animation: pulseIn 0.3s ease-out; }
        input:focus, select:focus { outline: none; border-color: #2d6a4f !important; transition: border-color 0.3s ease; }
        button:active { transform: scale(0.95); transition: transform 0.1s ease; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f0faf5; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #52b788; border-radius: 3px; }
        @media (max-width: 768px) {
          .two-column-layout { flex-direction: column !important; }
          .form-panel { width: 100% !important; margin-right: 0 !important; margin-bottom: 16px !important; }
          .chart-panel { width: 100% !important; }
          .nav-item { padding: 8px 12px !important; font-size: 13px !important; }
          .page-title { font-size: 20px !important; }
        }
        .recharts-pie-sector { cursor: pointer; transition: transform 0.2s ease; }
        .recharts-pie-sector:hover { transform: scale(1.03); }
        .recharts-bar-rectangle { cursor: pointer; transition: opacity 0.2s ease; }
        .recharts-bar-rectangle:hover { opacity: 0.85; }
      `}</style>

      <nav style={styles.navbar}>
        <div style={styles.navbarInner}>
          <div style={styles.logo}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>🌱</span>
            <span style={styles.logoText}>碳足迹追踪器</span>
          </div>
          <div style={styles.navLinks}>
            {[
              { key: 'input', label: '📝 记录' },
              { key: 'history', label: '📋 历史' },
              { key: 'monthly', label: '📊 月度' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setCurrentPage(item.key as PageType)}
                className="nav-item"
                style={{
                  ...styles.navItem,
                  ...(currentPage === item.key ? styles.navItemActive : {})
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main style={styles.main}>
        {currentPage === 'input' && (
          <div>
            <h1 className="page-title" style={styles.pageTitle}>记录活动碳足迹</h1>
            <div style={styles.totalCard} className="fade-in">
              <div>
                <div style={styles.totalLabel}>累计总碳排放量</div>
                <div style={styles.totalValue}>{carbonResult.totalEmission.toFixed(2)} <span style={styles.totalUnit}>kg CO₂e</span></div>
              </div>
              <div style={styles.statsRow}>
                {carbonResult.breakdown.map(b => (
                  <div key={b.category} style={styles.statItem}>
                    <div style={{ ...styles.statDot, backgroundColor: PIE_COLORS[carbonResult.breakdown.indexOf(b) % PIE_COLORS.length] }} />
                    <span style={styles.statLabel}>{b.categoryName}</span>
                    <span style={styles.statValue}>{b.total.toFixed(1)} kg</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="two-column-layout" style={styles.twoColumnLayout}>
              <div className="form-panel" style={styles.formPanel}>
                <form onSubmit={handleSubmit} style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>活动分类</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as ActivityCategory)}
                      style={styles.select}
                    >
                      {CATEGORY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>具体类型</label>
                    <select
                      value={subType}
                      onChange={e => setSubType(e.target.value)}
                      style={styles.select}
                    >
                      {SUBTYPE_OPTIONS[category].map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      用量 ({getUnitBySubType(subType as TransportType | DietType | EnergyType)})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="请输入数量"
                      style={styles.input}
                    />
                  </div>

                  {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                    <div style={styles.previewBox} className="pulse-in">
                      <div style={styles.previewLabel}>预计碳排放</div>
                      <div style={styles.previewValue}>
                        {(parseFloat(amount) * (getFactor(category, subType)?.factor || 0)).toFixed(4)} kg CO₂e
                      </div>
                      <div style={styles.previewDesc}>
                        {getFactor(category, subType)?.description || ''}
                      </div>
                    </div>
                  )}

                  <button type="submit" style={styles.submitButton}>
                    ✓ 添加记录
                  </button>
                </form>
              </div>

              <div className="chart-panel" style={styles.chartPanel}>
                <div style={styles.chartCard} className="fade-in" id="pie-chart-container">
                  <div style={styles.chartHeader}>
                    <h3 style={styles.chartTitle}>🥧 分类排放占比</h3>
                    <button
                      onClick={() => exportChartAsImage('pie-chart-container', '分类占比饼图.png')}
                      style={styles.exportBtn}
                    >
                      📷 导出
                    </button>
                  </div>
                  {pieData.length > 0 ? (
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={55}
                            dataKey="value"
                            onClick={handlePieClick}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                            labelLine={{ stroke: '#95d5b2' }}
                          >
                            {pieData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                stroke={selectedPieCategory === pieData[index].category ? '#1b4332' : '#fff'}
                                strokeWidth={selectedPieCategory === pieData[index].category ? 3 : 2}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [`${value.toFixed(2)} kg CO₂e`, '碳排放量']}
                            contentStyle={styles.tooltipStyle}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={styles.emptyState}>暂无数据，请添加活动记录</div>
                  )}
                  {selectedPieCategory && (
                    <div style={styles.drillHint}>
                      💡 {getCategoryName(selectedPieCategory as ActivityCategory)} 已选中，查看下方明细
                    </div>
                  )}
                </div>

                <div style={styles.chartCard} className="fade-in" id="bar-chart-container">
                  <div style={styles.chartHeader}>
                    <h3 style={styles.chartTitle}>
                      📊 {selectedBreakdown ? `${selectedBreakdown.categoryName} 明细` : '子类明细柱状图'}
                    </h3>
                    <button
                      onClick={() => exportChartAsImage('bar-chart-container', '子类明细柱状图.png')}
                      style={styles.exportBtn}
                    >
                      📷 导出
                    </button>
                  </div>
                  {barData.length > 0 ? (
                    <>
                      <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#d8f3dc" />
                            <XAxis dataKey="name" angle={-35} textAnchor="end" height={60} tick={{ fill: '#2d6a4f', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#2d6a4f', fontSize: 12 }} label={{ value: 'kg CO₂e', angle: -90, position: 'insideLeft', fill: '#52b788' }} />
                            <Tooltip
                              formatter={(value: number) => [`${value.toFixed(2)} kg CO₂e`, '碳排放量']}
                              contentStyle={styles.tooltipStyle}
                              cursor={{ fill: 'rgba(82, 183, 136, 0.1)' }}
                            />
                            <Bar
                              dataKey="emission"
                              onClick={handleBarClick}
                              radius={[6, 6, 0, 0]}
                            >
                              {barData.map((entry, index) => (
                                <Cell
                                  key={`bar-${index}`}
                                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                                  stroke={selectedBarItem?.subType === entry.subType ? '#1b4332' : 'none'}
                                  strokeWidth={selectedBarItem?.subType === entry.subType ? 2 : 0}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {selectedBarItem && (
                        <div style={styles.barDetailPopup} className="pulse-in">
                          <div style={styles.barDetailTitle}>📌 {selectedBarItem.name} 详细说明</div>
                          <div style={styles.barDetailRow}>
                            <span style={styles.barDetailLabel}>碳排放量:</span>
                            <span style={styles.barDetailValue}>{selectedBarItem.emission.toFixed(2)} kg CO₂e</span>
                          </div>
                          <div style={styles.barDetailRow}>
                            <span style={styles.barDetailLabel}>说明:</span>
                            <span style={styles.barDetailDesc}>{selectedBarItem.description}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={styles.emptyState}>
                      {selectedPieCategory
                        ? '该分类暂无记录'
                        : '点击上方饼图的某个分类，即可查看子类明细'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'history' && (
          <div>
            <div style={styles.historyHeader}>
              <h1 className="page-title" style={styles.pageTitle}>历史记录时间线</h1>
              <div style={styles.historyActions}>
                <span style={styles.recordCount}>共 {activities.length} 条记录</span>
                <button onClick={handleExportCSV} style={styles.exportCsvBtn}>
                  📥 导出 CSV
                </button>
              </div>
            </div>

            <div
              ref={historyContainerRef}
              onScroll={handleScroll}
              style={styles.timelineContainer}
              className="custom-scrollbar fade-in"
            >
              {visibleActivities.map((activity, index) => {
                const emission = calculateEmission(activity);
                const date = new Date(activity.timestamp);
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                const isLastDay = index === 0 ||
                  new Date(sortedActivities[index - 1].timestamp).toDateString() !== date.toDateString();

                return (
                  <React.Fragment key={activity.id}>
                    {isLastDay && (
                      <div style={styles.dateMarker}>
                        <span style={styles.dateMarkerText}>{dateStr}</span>
                      </div>
                    )}
                    <div style={styles.timelineItem} className="pulse-in">
                      <div style={styles.timelineDot}>
                        {CATEGORY_EMOJI[activity.category]}
                      </div>
                      <div style={styles.timelineLine} />
                      <div style={styles.activityCard}>
                        <div style={styles.cardHeader}>
                          <div style={styles.cardTime}>{timeStr}</div>
                          <span style={{
                            ...styles.categoryBadge,
                            backgroundColor: activity.category === 'transport' ? '#e8f5ee' :
                              activity.category === 'diet' ? '#fff5e6' : '#eef7ff',
                            color: activity.category === 'transport' ? '#2d6a4f' :
                              activity.category === 'diet' ? '#b45309' : '#1e40af'
                          }}>
                            {getCategoryName(activity.category)}
                          </span>
                        </div>
                        <div style={styles.cardBody}>
                          <div style={styles.cardSummary}>
                            {getActivitySummary(activity)}
                          </div>
                          <div style={styles.cardEmission}>
                            {emission.toFixed(4)} <span style={styles.cardEmissionUnit}>kg CO₂e</span>
                          </div>
                        </div>
                        <div style={styles.cardFooter}>
                          <div style={styles.cardDesc}>
                            {getFactor(activity.category, activity.subType)?.description || ''}
                          </div>
                          <button
                            onClick={() => handleDelete(activity.id)}
                            style={styles.deleteBtn}
                          >
                            🗑️ 删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {visibleCount < sortedActivities.length && (
                <div style={styles.loadMoreIndicator}>
                  <div style={styles.spinner} />
                  <span>滚动加载更多...</span>
                </div>
              )}

              {sortedActivities.length === 0 && (
                <div style={styles.emptyState}>暂无历史记录，去"记录"页面添加第一条吧！</div>
              )}
            </div>
          </div>
        )}

        {currentPage === 'monthly' && (
          <div>
            <h1 className="page-title" style={styles.pageTitle}>月度统计分析</h1>

            <div style={styles.monthlyCards} className="fade-in">
              {monthlyData.slice(-3).reverse().map((m, idx) => (
                <div key={m.month} style={{ ...styles.monthCard, animationDelay: `${idx * 0.1}s` }} className="fade-in">
                  <div style={styles.monthCardTitle}>{m.month}</div>
                  <div style={styles.monthCardValue}>{m.total.toFixed(1)} <span style={styles.monthCardUnit}>kg</span></div>
                  <div style={styles.monthCardBreakdown}>
                    <span title="交通出行" style={{ ...styles.monthDot, backgroundColor: STACKED_COLORS['交通出行'] }} />{m.transport.toFixed(0)}
                    <span title="饮食消费" style={{ ...styles.monthDot, backgroundColor: STACKED_COLORS['饮食消费'], marginLeft: 12 }} />{m.diet.toFixed(0)}
                    <span title="能源使用" style={{ ...styles.monthDot, backgroundColor: STACKED_COLORS['能源使用'], marginLeft: 12 }} />{m.energy.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.chartCard} className="fade-in" id="line-chart-container">
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>📈 月度总碳量趋势</h3>
                <button
                  onClick={() => exportChartAsImage('line-chart-container', '月度趋势折线图.png')}
                  style={styles.exportBtn}
                >
                  📷 导出
                </button>
              </div>
              {lineData.length > 0 ? (
                <div style={{ height: '320px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d8f3dc" />
                      <XAxis dataKey="month" tick={{ fill: '#2d6a4f', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#2d6a4f', fontSize: 12 }} label={{ value: 'kg CO₂e', angle: -90, position: 'insideLeft', fill: '#52b788' }} />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(2)} kg CO₂e`, '总碳排放量']}
                        contentStyle={styles.tooltipStyle}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="月度总量"
                        stroke="#2d6a4f"
                        strokeWidth={3}
                        dot={{ r: 6, fill: '#2d6a4f', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 9, fill: '#52b788', stroke: '#2d6a4f', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={styles.emptyState}>暂无月度数据</div>
              )}
            </div>

            <div style={styles.chartCard} className="fade-in" id="area-chart-container">
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>🗓️ 月度各分类占比堆叠面积图</h3>
                <button
                  onClick={() => exportChartAsImage('area-chart-container', '月度堆叠面积图.png')}
                  style={styles.exportBtn}
                >
                  📷 导出
                </button>
              </div>
              {stackedData.length > 0 ? (
                <div style={{ height: '360px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stackedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d8f3dc" />
                      <XAxis dataKey="month" tick={{ fill: '#2d6a4f', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#2d6a4f', fontSize: 12 }} label={{ value: 'kg CO₂e', angle: -90, position: 'insideLeft', fill: '#52b788' }} />
                      <Tooltip contentStyle={styles.tooltipStyle} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="交通出行"
                        stackId="1"
                        stroke={STACKED_COLORS['交通出行']}
                        fill={STACKED_COLORS['交通出行']}
                        fillOpacity={0.7}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="饮食消费"
                        stackId="1"
                        stroke={STACKED_COLORS['饮食消费']}
                        fill={STACKED_COLORS['饮食消费']}
                        fillOpacity={0.7}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="能源使用"
                        stackId="1"
                        stroke={STACKED_COLORS['能源使用']}
                        fill={STACKED_COLORS['能源使用']}
                        fillOpacity={0.7}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={styles.emptyState}>暂无月度分类数据</div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        🌿 绿色生活，从记录每一次碳足迹开始
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f0faf5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    color: '#1b4332'
  },
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(82, 183, 136, 0.2)',
    padding: '16px 0'
  },
  navbarInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    display: 'flex',
    alignItems: 'center'
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#2d6a4f',
    letterSpacing: '0.5px'
  },
  navLinks: {
    display: 'flex',
    gap: '8px'
  },
  navItem: {
    border: 'none',
    background: 'transparent',
    padding: '10px 18px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#52b788',
    transition: 'all 0.2s ease'
  },
  navItemActive: {
    background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(45, 106, 79, 0.3)'
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px 80px'
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#2d6a4f',
    margin: '0 0 24px 0'
  },
  twoColumnLayout: {
    display: 'flex',
    gap: '24px'
  },
  formPanel: {
    flex: '0 0 380px',
    width: '380px',
    marginRight: '0'
  },
  chartPanel: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  totalCard: {
    background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 50%, #52b788 100%)',
    borderRadius: '16px',
    padding: '28px 32px',
    marginBottom: '24px',
    boxShadow: '0 8px 24px rgba(45, 106, 79, 0.2)',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  totalLabel: {
    fontSize: '14px',
    opacity: 0.85,
    marginBottom: '6px'
  },
  totalValue: {
    fontSize: '38px',
    fontWeight: 800,
    lineHeight: 1.1
  },
  totalUnit: {
    fontSize: '16px',
    fontWeight: 500,
    opacity: 0.9
  },
  statsRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    boxShadow: '0 0 0 2px rgba(255,255,255,0.3)'
  },
  statLabel: {
    fontSize: '13px',
    opacity: 0.9
  },
  statValue: {
    fontSize: '14px',
    fontWeight: 600
  },
  formCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(45, 106, 79, 0.08)'
  },
  formPanelInner: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(45, 106, 79, 0.08)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2d6a4f'
  },
  select: {
    padding: '12px 14px',
    border: '2px solid #d8f3dc',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1b4332',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'border-color 0.3s ease'
  },
  input: {
    padding: '12px 14px',
    border: '2px solid #d8f3dc',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1b4332',
    transition: 'border-color 0.3s ease'
  },
  previewBox: {
    background: 'linear-gradient(135deg, #f0faf5, #d8f3dc)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #b7e4c7'
  },
  previewLabel: {
    fontSize: '12px',
    color: '#52b788',
    marginBottom: '4px'
  },
  previewValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#2d6a4f',
    marginBottom: '6px'
  },
  previewDesc: {
    fontSize: '12px',
    color: '#40916c',
    lineHeight: 1.5
  },
  submitButton: {
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(45, 106, 79, 0.25)',
    transition: 'all 0.2s ease'
  },
  chartCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(45, 106, 79, 0.08)'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#2d6a4f',
    margin: 0
  },
  exportBtn: {
    padding: '8px 14px',
    fontSize: '12px',
    border: '1px solid #52b788',
    background: '#fff',
    color: '#2d6a4f',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease'
  },
  drillHint: {
    marginTop: '12px',
    padding: '10px 14px',
    background: '#f0faf5',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#40916c',
    borderLeft: '3px solid #52b788'
  },
  emptyState: {
    padding: '48px 24px',
    textAlign: 'center',
    color: '#95d5b2',
    fontSize: '14px'
  },
  barDetailPopup: {
    marginTop: '16px',
    padding: '16px 18px',
    background: 'linear-gradient(135deg, #f0faf5, #d8f3dc)',
    borderRadius: '12px',
    border: '1px solid #95d5b2'
  },
  barDetailTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#2d6a4f',
    marginBottom: '10px'
  },
  barDetailRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    marginBottom: '6px'
  },
  barDetailLabel: {
    color: '#40916c',
    minWidth: '80px',
    fontWeight: 500
  },
  barDetailValue: {
    color: '#2d6a4f',
    fontWeight: 700
  },
  barDetailDesc: {
    color: '#1b4332',
    flex: 1,
    lineHeight: 1.5
  },
  tooltipStyle: {
    background: '#fff',
    border: '1px solid #b7e4c7',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(45, 106, 79, 0.15)',
    fontSize: '13px',
    padding: '10px 14px'
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  historyActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  recordCount: {
    fontSize: '14px',
    color: '#52b788',
    fontWeight: 500
  },
  exportCsvBtn: {
    padding: '10px 18px',
    background: '#fff',
    border: '2px solid #52b788',
    color: '#2d6a4f',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  timelineContainer: {
    maxHeight: 'calc(100vh - 280px)',
    overflowY: 'auto',
    padding: '8px 0 8px 4px',
    position: 'relative'
  },
  dateMarker: {
    position: 'relative',
    padding: '12px 0 8px 56px',
    margin: '8px 0'
  },
  dateMarkerText: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#2d6a4f',
    background: '#d8f3dc',
    padding: '4px 12px',
    borderRadius: '12px'
  },
  timelineItem: {
    position: 'relative',
    padding: '0 0 20px 56px',
    minHeight: '80px'
  },
  timelineDot: {
    position: 'absolute',
    left: '24px',
    top: '8px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #d8f3dc, #b7e4c7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    boxShadow: '0 2px 8px rgba(45, 106, 79, 0.15)',
    zIndex: 2
  },
  timelineLine: {
    position: 'absolute',
    left: '43px',
    top: '48px',
    bottom: 0,
    width: '2px',
    background: 'linear-gradient(to bottom, #b7e4c7, transparent)'
  },
  activityCard: {
    background: '#fff',
    borderRadius: '14px',
    padding: '16px 18px',
    boxShadow: '0 3px 12px rgba(45, 106, 79, 0.08)',
    border: '1px solid #f0faf5'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  cardTime: {
    fontSize: '12px',
    color: '#95d5b2',
    fontWeight: 500
  },
  categoryBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '8px'
  },
  cardBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  cardSummary: {
    fontSize: '14px',
    color: '#1b4332',
    fontWeight: 500,
    flex: 1,
    marginRight: '12px'
  },
  cardEmission: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#2d6a4f',
    whiteSpace: 'nowrap'
  },
  cardEmissionUnit: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#52b788'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    paddingTop: '10px',
    borderTop: '1px solid #f0faf5'
  },
  cardDesc: {
    fontSize: '12px',
    color: '#74c69d',
    lineHeight: 1.5,
    flex: 1
  },
  deleteBtn: {
    padding: '6px 12px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  loadMoreIndicator: {
    padding: '20px',
    textAlign: 'center',
    color: '#95d5b2',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #d8f3dc',
    borderTopColor: '#52b788',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  monthlyCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  monthCard: {
    background: '#fff',
    borderRadius: '14px',
    padding: '20px 22px',
    boxShadow: '0 4px 16px rgba(45, 106, 79, 0.08)',
    border: '1px solid #f0faf5'
  },
  monthCardTitle: {
    fontSize: '14px',
    color: '#52b788',
    fontWeight: 600,
    marginBottom: '8px'
  },
  monthCardValue: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#2d6a4f',
    marginBottom: '10px'
  },
  monthCardUnit: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#74c69d'
  },
  monthCardBreakdown: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#40916c'
  },
  monthDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  footer: {
    textAlign: 'center',
    padding: '24px',
    color: '#95d5b2',
    fontSize: '13px',
    borderTop: '1px solid rgba(82, 183, 136, 0.1)'
  }
};
