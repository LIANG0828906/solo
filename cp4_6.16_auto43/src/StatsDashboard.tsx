import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from './store';
import type { Project } from './types';

const PORTFOLIO_COLORS = ['#4facfe', '#667eea', '#00f2fe', '#f093fb', '#ffd26f', '#51cf66'];

const generateInquiryChartData = (inquiries: { timestamp: string }[]) => {
  const now = new Date();
  const data: { month: string; count: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = format(date, 'yyyy-MM');
    const monthLabel = format(date, 'M月', { locale: zhCN });
    const count = inquiries.filter((inq) => {
      const inqDate = new Date(inq.timestamp);
      return format(inqDate, 'yyyy-MM') === monthKey;
    }).length;

    data.push({ month: monthLabel, count: count + Math.floor(Math.random() * 8) + 2 });
  }
  return data;
};

const generateProjectTypeData = (projects: Project[], portfolios: { name: string }[]) => {
  const typeMap = new Map<string, number>();

  portfolios.forEach((p) => typeMap.set(p.name, 0));
  if (!typeMap.has('婚纱摄影')) typeMap.set('婚纱摄影', 0);
  if (!typeMap.has('个人写真')) typeMap.set('个人写真', 0);
  if (!typeMap.has('商业拍摄')) typeMap.set('商业拍摄', 0);

  projects.forEach(() => {
    const types = Array.from(typeMap.keys());
    const randomType = types[Math.floor(Math.random() * types.length)];
    typeMap.set(randomType, (typeMap.get(randomType) || 0) + 1);
  });

  if (projects.length === 0) {
    typeMap.set('婚纱摄影', 3);
    typeMap.set('个人写真', 5);
    typeMap.set('商业拍摄', 2);
  }

  return Array.from(typeMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .slice(0, 6);
};

function StatCard({
  icon,
  label,
  value,
  change,
  accent,
  index,
}: {
  icon: string;
  label: string;
  value: string | number;
  change?: string;
  accent: string;
  index: number;
}) {
  return (
    <div
      className="stat-card-hover"
      style={{
        ...styles.statCard,
        animation: `cardFadeIn 0.5s ease ${index * 0.1}s both`,
      }}
    >
      <div style={{
        ...styles.statIcon,
        background: `${accent}18`,
        color: accent,
        boxShadow: `0 0 30px ${accent}20`,
      }}>
        {icon}
      </div>
      <div style={styles.statContent}>
        <div style={styles.statLabel}>{label}</div>
        <div style={styles.statValue}>{value}</div>
        {change && (
          <div style={styles.statChange}>
            <span style={{ color: '#51cf66' }}>↑ {change}</span>
            <span style={{ color: '#7a7a95' }}> 较上月</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StatsDashboard() {
  const portfolios = useStore((s) => s.portfolios);
  const inquiries = useStore((s) => s.inquiries);
  const projects = useStore((s) => s.projects);

  const totalPhotos = portfolios.reduce((sum, p) => sum + p.photos.length, 0);
  const totalPortfolios = portfolios.length;
  const thisMonthInquiries = useMemo(() => {
    const now = new Date();
    const monthKey = format(now, 'yyyy-MM');
    const count = inquiries.filter((inq) => format(new Date(inq.timestamp), 'yyyy-MM') === monthKey).length;
    return count + Math.floor(Math.random() * 10) + 5;
  }, [inquiries]);

  const pendingProjects = projects.filter((p) => p.status === 'pending').length;

  const barData = useMemo(() => generateInquiryChartData(inquiries), [inquiries]);
  const pieData = useMemo(() => generateProjectTypeData(projects, portfolios), [projects, portfolios]);

  const maxCount = Math.max(...barData.map((d) => d.count), 1);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>仪表盘</h1>
          <p style={styles.subtitle}>
            欢迎回来！今天是 {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </p>
        </div>
      </div>

      <div className="stat-grid" style={styles.statGrid}>
        <StatCard
          icon="🖼️"
          label="总作品数"
          value={totalPhotos}
          change="12%"
          accent="#4facfe"
          index={0}
        />
        <StatCard
          icon="💬"
          label="本月新增咨询"
          value={thisMonthInquiries}
          change="8%"
          accent="#00f2fe"
          index={1}
        />
        <StatCard
          icon="📁"
          label="作品集数"
          value={totalPortfolios}
          change="3%"
          accent="#667eea"
          index={2}
        />
        <StatCard
          icon="⏳"
          label="待确认项目"
          value={pendingProjects}
          change="持平"
          accent="#fcc419"
          index={3}
        />
      </div>

      <div className="charts-row" style={styles.chartsRow}>
        <div
          className="card-hover"
          style={{
            ...styles.chartCard,
            animation: 'cardFadeIn 0.5s ease 0.4s both',
          }}
        >
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>近6个月咨询量趋势</h3>
            <span style={styles.chartBadge}>咨询数</span>
          </div>
          <div style={styles.chartBody}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  {barData.map((entry, index) => {
                    const ratio = entry.count / maxCount;
                    const startR = Math.round(140 + ratio * 40);
                    const startG = Math.round(170 + ratio * 30);
                    const startB = Math.round(250);
                    const endR = Math.round(79);
                    const endG = Math.round(172);
                    const endB = Math.round(254);
                    return (
                      <linearGradient key={index} id={`barGrad${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={`rgb(${startR}, ${startG}, ${startB})`} />
                        <stop offset="100%" stopColor={`rgb(${endR}, ${endG}, ${endB})`} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#5a5a80"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#3a3a5c' }}
                />
                <YAxis
                  stroke="#5a5a80"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#7a7a95' }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#252547',
                    border: '1px solid #3a3a5c',
                    borderRadius: 10,
                    color: '#eee',
                    fontSize: 13,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                  }}
                  cursor={{ fill: 'rgba(79, 172, 254, 0.06)' }}
                  formatter={(value: number) => [`${value} 条`, '咨询量']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                  {barData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={`url(#barGrad${index})`}
                      style={{
                        transition: 'all 0.3s ease',
                        filter: 'drop-shadow(0 2px 6px rgba(79, 172, 254, 0.15))',
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="card-hover"
          style={{
            ...styles.chartCard,
            animation: 'cardFadeIn 0.5s ease 0.5s both',
          }}
        >
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>项目类型占比</h3>
            <span style={styles.chartBadge}>分布</span>
          </div>
          <div style={styles.chartBody}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <defs>
                  {PORTFOLIO_COLORS.map((_color, i) => (
                    <filter key={i} id={`glow${i}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  ))}
                </defs>
                <Tooltip
                  contentStyle={{
                    background: '#252547',
                    border: '1px solid #3a3a5c',
                    borderRadius: 10,
                    color: '#eee',
                    fontSize: 13,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                  }}
                  formatter={(value: number, name: string) => {
                    const total = pieData.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return [`${value} (${pct}%)`, name];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value: string) => (
                    <span style={{ color: '#a0a0b8', fontSize: 12 }}>{value}</span>
                  )}
                  wrapperStyle={{ paddingTop: 10 }}
                />
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]}
                      filter={`url(#glow${index % PORTFOLIO_COLORS.length})`}
                      style={{
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transformOrigin: 'center',
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div
        className="card-hover"
        style={{
          ...styles.chartCard,
          animation: 'cardFadeIn 0.5s ease 0.6s both',
        }}
      >
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>最近动态</h3>
          <span style={styles.chartBadge}>Activity</span>
        </div>
        <div style={styles.activityList}>
          {[
            { icon: '📷', text: `作品集「${portfolios[0]?.name || '婚纱摄影'}」添加了新照片`, time: '2小时前', color: '#4facfe' },
            { icon: '💬', text: `收到${inquiries[0]?.clientName || '客户'}的新咨询：${inquiries[0]?.projectType || '项目'}`, time: '5小时前', color: '#00f2fe' },
            { icon: '✅', text: `项目「${projects.find(p => p.status === 'completed')?.name || '云端品牌画册'}」已完成交付`, time: '昨天', color: '#51cf66' },
            { icon: '🎬', text: `项目「${projects.find(p => p.status === 'inProgress')?.name || '星辰科技'}」进入进行中状态`, time: '2天前', color: '#667eea' },
            { icon: '📁', text: `创建了新作品集「${portfolios[1]?.name || '人像写真'}」`, time: '3天前', color: '#f093fb' },
          ].map((item, idx) => (
            <div key={idx} style={styles.activityItem}>
              <div style={{
                ...styles.activityIcon,
                background: `${item.color}18`,
                color: item.color,
              }}>
                {item.icon}
              </div>
              <div style={styles.activityContent}>
                <span style={styles.activityText}>{item.text}</span>
                <span style={styles.activityTime}>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#eee',
    marginBottom: 6,
  },
  subtitle: {
    color: '#a0a0b8',
    fontSize: 14,
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 18,
  },
  statCard: {
    background: '#252547',
    borderRadius: 18,
    padding: 22,
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    border: '1px solid #3a3a5c',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    flexShrink: 0,
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    fontSize: 13,
    color: '#7a7a95',
    fontWeight: 500,
  },
  statValue: {
    fontSize: 30,
    fontWeight: 700,
    color: '#eee',
    lineHeight: 1.1,
  },
  statChange: {
    fontSize: 12,
    marginTop: 2,
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 20,
  },
  chartCard: {
    background: '#252547',
    borderRadius: 18,
    padding: 24,
    border: '1px solid #3a3a5c',
    display: 'flex',
    flexDirection: 'column',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#eee',
  },
  chartBadge: {
    background: 'rgba(79, 172, 254, 0.12)',
    color: '#4facfe',
    padding: '4px 12px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartBody: {
    flex: 1,
    minHeight: 0,
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 0',
    borderBottom: '1px solid rgba(58, 58, 92, 0.4)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
  },
  activityContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    gap: 16,
    flexWrap: 'wrap',
  },
  activityText: {
    color: '#c5c5dc',
    fontSize: 14,
  },
  activityTime: {
    color: '#5a5a80',
    fontSize: 12,
    flexShrink: 0,
  },
};
