import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePromotionStore } from '../store';
import ProgressRing from './ProgressRing';
import RippleButton from './RippleButton';
import type { ABTest, HistoryData } from '../types';
import { exportStats } from '../api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

const mockABTests: ABTest[] = [
  {
    id: 'test-1',
    name: '618大促策略对比测试',
    description: '测试满减vs折扣哪个转化率更高',
    status: 'RUNNING',
    groups: [
      { id: 'a', name: 'A组 - 满减策略', weight: 50, config: { type: 'FULL_REDUCTION' } },
      { id: 'b', name: 'B组 - 折扣策略', weight: 50, config: { type: 'DISCOUNT' } },
    ],
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'test-2',
    name: '新用户首单优惠测试',
    description: '测试赠品vs折扣对新用户的吸引力',
    status: 'RUNNING',
    groups: [
      { id: 'a', name: 'A组 - 赠品策略', weight: 50, config: { type: 'GIFT' } },
      { id: 'b', name: 'B组 - 8折优惠', weight: 50, config: { type: 'DISCOUNT' } },
    ],
    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const generateMockRealtimeStats = () => ({
  timestamp: new Date().toISOString(),
  groups: [
    {
      groupId: 'a',
      groupName: 'A组',
      impressions: Math.floor(Math.random() * 5000 + 10000),
      clicks: Math.floor(Math.random() * 1000 + 2000),
      conversions: Math.floor(Math.random() * 200 + 500),
      revenue: Math.floor(Math.random() * 50000 + 80000),
      clickRate: Math.random() * 0.1 + 0.15,
      conversionRate: Math.random() * 0.05 + 0.08,
    },
    {
      groupId: 'b',
      groupName: 'B组',
      impressions: Math.floor(Math.random() * 5000 + 10000),
      clicks: Math.floor(Math.random() * 1000 + 2000),
      conversions: Math.floor(Math.random() * 200 + 400),
      revenue: Math.floor(Math.random() * 50000 + 70000),
      clickRate: Math.random() * 0.1 + 0.12,
      conversionRate: Math.random() * 0.05 + 0.06,
    },
  ],
});

const generateMockHistoryData = (): HistoryData[] => {
  const data: HistoryData[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toISOString(),
      groups: [
        {
          groupId: 'a',
          groupName: 'A组',
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          clickRate: 0,
          conversionRate: Math.random() * 0.04 + 0.07,
        },
        {
          groupId: 'b',
          groupName: 'B组',
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          clickRate: 0,
          conversionRate: Math.random() * 0.04 + 0.05,
        },
      ],
    });
  }
  return data;
};

const COLOR_A = '#00c853';
const COLOR_A_LIGHT = '#00e676';
const COLOR_B = '#2962ff';
const COLOR_B_LIGHT = '#448aff';

const TestDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { abTests, setCurrentPromotion } = usePromotionStore();

  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [polling, setPolling] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const allTests = useMemo(() => {
    return abTests.length > 0 ? abTests : mockABTests;
  }, [abTests]);

  useEffect(() => {
    if (id && allTests.length > 0) {
      const test = allTests.find(t => t.id === id);
      if (test) {
        setSelectedTest(test);
      }
    } else if (allTests.length > 0 && !selectedTest) {
      setSelectedTest(allTests[0]);
    }
  }, [id, allTests, selectedTest]);

  useEffect(() => {
    setRealtimeStats(generateMockRealtimeStats());
    setHistoryData(generateMockHistoryData());
  }, [selectedTest]);

  useEffect(() => {
    if (!polling || !selectedTest) return;

    const interval = setInterval(() => {
      setRealtimeStats(generateMockRealtimeStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [polling, selectedTest]);

  const handleTestSelect = useCallback((testId: string) => {
    const test = allTests.find(t => t.id === testId);
    if (test) {
      setSelectedTest(test);
      navigate(`/dashboard/${testId}`);
      setRealtimeStats(generateMockRealtimeStats());
      setHistoryData(generateMockHistoryData());
    }
  }, [allTests, navigate]);

  const handleExport = useCallback(async () => {
    if (!selectedTest) return;
    setIsExporting(true);
    try {
      await exportStats(selectedTest.id);
    } catch (e) {
      const csvContent = [
        '日期,组名,转化率,参与人数,客单价',
        ...historyData.map(d => {
          const date = format(new Date(d.date), 'yyyy-MM-dd');
          return d.groups.map((g: any) =>
            `${date},${g.groupName},${(g.conversionRate * 100).toFixed(2)}%,${g.impressions},${g.impressions > 0 ? (g.revenue / g.impressions).toFixed(2) : 0}`
          ).join('\n');
        }),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ab-test-${selectedTest.id}-${format(new Date(), 'yyyyMMdd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [selectedTest, historyData]);

  const groupAStats = realtimeStats?.groups?.[0];
  const groupBStats = realtimeStats?.groups?.[1];

  const conversionRateA = groupAStats ? groupAStats.conversionRate * 100 : 0;
  const conversionRateB = groupBStats ? groupBStats.conversionRate * 100 : 0;

  const avgOrderValueA = groupAStats && groupAStats.conversions > 0
    ? groupAStats.revenue / groupAStats.conversions
    : 0;
  const avgOrderValueB = groupBStats && groupBStats.conversions > 0
    ? groupBStats.revenue / groupBStats.conversions
    : 0;

  const barChartData = [
    { name: 'A组', value: Number(avgOrderValueA.toFixed(2)), fill: COLOR_A },
    { name: 'B组', value: Number(avgOrderValueB.toFixed(2)), fill: COLOR_B },
  ];

  const lineChartData = historyData.map(d => {
    const groupA = d.groups?.[0];
    const groupB = d.groups?.[1];
    const rateA = groupA ? groupA.conversionRate * 100 : 0;
    const rateB = groupB ? groupB.conversionRate * 100 : 0;
    return {
      date: format(new Date(d.date), 'MM-dd'),
      rateA: Number(rateA.toFixed(2)),
      rateB: Number(rateB.toFixed(2)),
      rateALower: Number((rateA - Math.random() * 1.5).toFixed(2)),
      rateAUpper: Number((rateA + Math.random() * 1.5).toFixed(2)),
      rateBLower: Number((rateB - Math.random() * 1.5).toFixed(2)),
      rateBUpper: Number((rateB + Math.random() * 1.5).toFixed(2)),
    };
  });

  if (!selectedTest) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📊</div>
          <h2 style={styles.emptyTitle}>暂无A/B测试数据</h2>
          <p style={styles.emptyText}>请先创建一个A/B测试后再查看仪表盘</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.backButton} onClick={() => navigate('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>返回列表</span>
          </div>
          <div>
            <h1 style={styles.pageTitle}>{selectedTest.name}</h1>
            <p style={styles.pageDesc}>{selectedTest.description || 'A/B测试效果分析'}</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <RippleButton
            variant={polling ? 'secondary' : 'outline'}
            onClick={() => setPolling(!polling)}
          >
            {polling ? '⏸ 暂停轮询' : '▶ 开始轮询'}
          </RippleButton>
          <RippleButton
            variant="primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? '导出中...' : '📥 导出CSV'}
          </RippleButton>
        </div>
      </div>

      <div style={styles.testSelector}>
        <span style={styles.selectorLabel}>选择测试：</span>
        <div style={styles.testTabs}>
          {allTests.map((test) => (
            <div
              key={test.id}
              onClick={() => handleTestSelect(test.id)}
              style={{
                ...styles.testTab,
                ...(selectedTest.id === test.id ? styles.testTabActive : {}),
              }}
            >
              <span style={styles.testTabName}>{test.name}</span>
              <span style={{
                ...styles.testTabStatus,
                ...(test.status === 'RUNNING' ? styles.statusRunning : styles.statusEnded),
              }}>
                {test.status === 'RUNNING' ? '进行中' : '已结束'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <ProgressRing
            percentage={conversionRateA}
            size={140}
            strokeWidth={12}
            colorStart={COLOR_A}
            colorEnd={COLOR_A_LIGHT}
            label="A组转化率"
            group="A"
          />
          <div style={styles.statDetails}>
            <div style={styles.statItem}>
              <span style={styles.statItemLabel}>参与人数</span>
              <span style={{ ...styles.statItemValue, color: COLOR_A }}>
                {groupAStats?.impressions?.toLocaleString() || 0}
              </span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statItemLabel}>转化人数</span>
              <span style={styles.statItemValue}>
                {groupAStats?.conversions?.toLocaleString() || 0}
              </span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statItemLabel}>总收入</span>
              <span style={styles.statItemValue}>
                ¥{groupAStats?.revenue?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <ProgressRing
            percentage={conversionRateB}
            size={140}
            strokeWidth={12}
            colorStart={COLOR_B}
            colorEnd={COLOR_B_LIGHT}
            label="B组转化率"
            group="B"
          />
          <div style={styles.statDetails}>
            <div style={styles.statItem}>
              <span style={styles.statItemLabel}>参与人数</span>
              <span style={{ ...styles.statItemValue, color: COLOR_B }}>
                {groupBStats?.impressions?.toLocaleString() || 0}
              </span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statItemLabel}>转化人数</span>
              <span style={styles.statItemValue}>
                {groupBStats?.conversions?.toLocaleString() || 0}
              </span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statItemLabel}>总收入</span>
              <span style={styles.statItemValue}>
                ¥{groupBStats?.revenue?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>客单价对比</h3>
          <span style={styles.chartHint}>单位：元（¥）</span>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 14 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(22, 33, 62, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                }}
                formatter={(value: number) => [`¥${value}`, '客单价']}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
                {barChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.barLabels}>
          {barChartData.map((item, idx) => (
            <div key={idx} style={{
              ...styles.barLabel,
              color: item.fill,
            }}>
              <span style={styles.barLabelName}>{item.name}</span>
              <span style={styles.barLabelValue}>¥{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>转化率趋势分析</h3>
          <div style={styles.legendRow}>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: COLOR_A }} />
              <span style={styles.legendText}>A组转化率</span>
            </div>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: COLOR_B }} />
              <span style={styles.legendText}>B组转化率</span>
            </div>
            <div style={styles.legendItem}>
              <span style={styles.legendDashed} />
              <span style={styles.legendText}>置信度区间</span>
            </div>
          </div>
        </div>
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(22, 33, 62, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    rateA: 'A组转化率',
                    rateB: 'B组转化率',
                    rateALower: 'A组下限',
                    rateAUpper: 'A组上限',
                    rateBLower: 'B组下限',
                    rateBUpper: 'B组上限',
                  };
                  return [`${value.toFixed(2)}%`, labels[name] || name];
                }}
                labelFormatter={(label) => `日期: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="rateALower"
                stroke={COLOR_A}
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
                opacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="rateAUpper"
                stroke={COLOR_A}
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
                opacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="rateBLower"
                stroke={COLOR_B}
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
                opacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="rateBUpper"
                stroke={COLOR_B}
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
                opacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="rateA"
                name="A组转化率"
                stroke={COLOR_A}
                strokeWidth={3}
                dot={{ r: 5, fill: COLOR_A, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="rateB"
                name="B组转化率"
                stroke={COLOR_B}
                strokeWidth={3}
                dot={{ r: 5, fill: COLOR_B, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.infoCard}>
        <h3 style={styles.infoTitle}>测试配置信息</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoBlock}>
            <span style={styles.infoBlockLabel}>A组配置</span>
            <span style={styles.infoBlockValue}>
              {selectedTest.groups?.[0]?.name || '满减策略'}
            </span>
            <span style={styles.infoBlockSub}>
              流量占比: {selectedTest.groups?.[0]?.weight || 50}%
            </span>
          </div>
          <div style={styles.infoBlock}>
            <span style={styles.infoBlockLabel}>B组配置</span>
            <span style={styles.infoBlockValue}>
              {selectedTest.groups?.[1]?.name || '折扣策略'}
            </span>
            <span style={styles.infoBlockSub}>
              流量占比: {selectedTest.groups?.[1]?.weight || 50}%
            </span>
          </div>
          <div style={styles.infoBlock}>
            <span style={styles.infoBlockLabel}>开始时间</span>
            <span style={styles.infoBlockValue}>
              {format(new Date(selectedTest.startTime), 'yyyy-MM-dd HH:mm')}
            </span>
          </div>
          <div style={styles.infoBlock}>
            <span style={styles.infoBlockLabel}>最后更新</span>
            <span style={styles.infoBlockValue}>
              {realtimeStats?.timestamp
                ? format(new Date(realtimeStats.timestamp), 'yyyy-MM-dd HH:mm:ss')
                : '-'}
            </span>
            {polling && (
              <span style={styles.infoBlockSub}>
                <span style={styles.pulseDot} /> 实时更新中（5秒/次）
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px 20px 60px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
  },
  pageDesc: {
    margin: 0,
    marginTop: '4px',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  testSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  selectorLabel: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 500,
  },
  testTabs: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  testTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  testTabActive: {
    backgroundColor: 'rgba(226, 183, 20, 0.15)',
    borderColor: '#e2b714',
  },
  testTabName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
  },
  testTabStatus: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  statusRunning: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
  },
  statusEnded: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    color: '#9ca3af',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '28px',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'slideUp 0.4s ease-out',
  },
  statDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItemLabel: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statItemValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
  },
  chartCard: {
    padding: '28px',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '24px',
    animation: 'slideUp 0.5s ease-out',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  chartTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
  },
  chartHint: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  legendRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  legendDashed: {
    width: '16px',
    height: '2px',
    borderTop: '2px dashed rgba(255, 255, 255, 0.5)',
  },
  legendText: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  barLabels: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '8px',
  },
  barLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  barLabelName: {
    fontSize: '13px',
    fontWeight: 600,
  },
  barLabelValue: {
    fontSize: '20px',
    fontWeight: 700,
  },
  infoCard: {
    padding: '28px',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'slideUp 0.6s ease-out',
  },
  infoTitle: {
    margin: 0,
    marginBottom: '20px',
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  infoBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '16px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  infoBlockLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  infoBlockValue: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
  },
  infoBlockSub: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  pulseDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    marginRight: '6px',
    animation: 'pulse 1.5s infinite',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px',
    gap: '16px',
  },
  emptyIcon: {
    fontSize: '64px',
  },
  emptyTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: '#fff',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
};

export default TestDashboard;
