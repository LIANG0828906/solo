import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportApi, DailyReportType } from '../api';
import jsPDF from 'jspdf';

const CHART_COLORS = ['#E8899E', '#A8D5BA', '#FFD93D', '#B39DDB', '#80CBC4', '#FFAB91'];

function generateMockReport(): DailyReportType {
  const hours = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  const revenue = hours.map(h => ({
    hour: h,
    amount: Math.floor(Math.random() * 80) + 20,
  }));
  const costs = [
    { category: '进货成本', value: Math.floor(Math.random() * 200) + 100 },
    { category: '损耗成本', value: Math.floor(Math.random() * 50) + 10 },
    { category: '运营成本', value: Math.floor(Math.random() * 30) + 20 },
  ];
  const satisfactionTrend = hours.map(h => ({
    time: h,
    value: Math.round((Math.random() * 2 + 3) * 10) / 10,
  }));
  const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
  const totalCost = costs.reduce((s, c) => s + c.value, 0);
  return {
    date: new Date().toLocaleDateString('zh-CN'),
    revenue,
    costs,
    satisfactionTrend,
    totalRevenue,
    totalCost,
    profit: totalRevenue - totalCost,
    reputation: Math.floor(Math.random() * 20) + 80,
    suggestions: [
      '🌹 玫瑰销量最高，建议增加玫瑰进货量',
      '⚠️ 部分花卉因保质期过期而损耗，注意控制进货节奏',
      '📈 下午14:00-16:00为客流高峰，提前备好花束',
      '💡 满天星作为配花很受欢迎，可以多做混合花束',
    ],
    spoiledFlowers: Math.floor(Math.random() * 5) + 1,
    completedOrders: Math.floor(Math.random() * 15) + 5,
    failedOrders: Math.floor(Math.random() * 3),
  };
}

export default function DailyReport() {
  const [report, setReport] = useState<DailyReportType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportApi.getDaily();
      setReport(data);
    } catch {
      setReport(generateMockReport());
    }
    setLoading(false);
  };

  const exportPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.text('Flower Shop Daily Report', 20, 25);
    doc.setFontSize(12);
    doc.text(`Date: ${report.date}`, 20, 35);
    doc.text(`Total Revenue: ${report.totalRevenue} CNY`, 20, 45);
    doc.text(`Total Cost: ${report.totalCost} CNY`, 20, 55);
    doc.text(`Profit: ${report.profit} CNY`, 20, 65);
    doc.text(`Reputation: ${report.reputation}`, 20, 75);
    doc.text(`Completed Orders: ${report.completedOrders}`, 20, 85);
    doc.text(`Failed Orders: ${report.failedOrders}`, 20, 95);
    doc.text(`Spoiled Flowers: ${report.spoiledFlowers}`, 20, 105);
    doc.setFontSize(14);
    doc.text('Suggestions:', 20, 125);
    doc.setFontSize(11);
    report.suggestions.forEach((s, i) => {
      doc.text(`- ${s.replace(/[^\x00-\x7F]/g, '')}`, 20, 135 + i * 10);
    });
    doc.save(`flower-shop-report-${report.date}.pdf`);
  };

  if (loading || !report) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 100px)',
        fontSize: '16px',
        color: 'var(--color-text-light)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div>正在生成经营报告...</div>
        </div>
      </div>
    );
  }

  const isProfitable = report.profit > 0;

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 100px)', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 头部总览 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <div>
            <h2 style={{ fontSize: '24px', color: 'var(--color-pink-dark)' }}>📊 每日经营报告</h2>
            <span style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>{report.date}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={loadReport}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-white)',
                border: '2px solid var(--color-pink-dark)',
                color: 'var(--color-pink-dark)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              🔄 刷新数据
            </button>
            <button
              onClick={exportPDF}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-pink-dark), var(--color-pink))',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              📥 导出PDF
            </button>
          </div>
        </div>

        {/* 数据卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {[
            { label: '总收入', value: `¥${report.totalRevenue}`, icon: '💰', color: '#A8D5BA' },
            { label: '总成本', value: `¥${report.totalCost}`, icon: '💸', color: '#FFD93D' },
            { label: '净利润', value: `¥${report.profit}`, icon: isProfitable ? '📈' : '📉', color: isProfitable ? '#A8D5BA' : '#FF6B6B' },
            { label: '信誉分', value: `${report.reputation}`, icon: '⭐', color: '#FFD6E0' },
          ].map(card => (
            <div key={card.label} style={{
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-white)',
              padding: '20px',
              boxShadow: 'var(--shadow-soft)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{card.icon}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '4px' }}>{card.label}</div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                fontFamily: "'Noto Serif SC', serif",
                color: card.color === '#FF6B6B' ? '#FF6B6B' : 'var(--color-text)',
              }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* 订单统计 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-white)',
            padding: '16px',
            boxShadow: 'var(--shadow-soft)',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '24px' }}>✅</span>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-green-dark)' }}>
              {report.completedOrders}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>完成订单</div>
          </div>
          <div style={{
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-white)',
            padding: '16px',
            boxShadow: 'var(--shadow-soft)',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '24px' }}>❌</span>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#FF6B6B' }}>
              {report.failedOrders}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>失败订单</div>
          </div>
          <div style={{
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-white)',
            padding: '16px',
            boxShadow: 'var(--shadow-soft)',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '24px' }}>🥀</span>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#FFB300' }}>
              {report.spoiledFlowers}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>腐烂损耗</div>
          </div>
        </div>

        {/* 图表区 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '20px',
          marginBottom: '24px',
        }}>
          {/* 收入柱状图 */}
          <div style={{
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-white)',
            padding: '20px',
            boxShadow: 'var(--shadow-soft)',
          }}>
            <h4 style={{ fontSize: '16px', color: 'var(--color-text)', marginBottom: '16px' }}>💰 各时段收入</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={report.revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E6E6" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #FFD6E0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="amount" name="收入(元)" radius={[6, 6, 0, 0]}>
                  {report.revenue.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 成本饼图 */}
          <div style={{
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-white)',
            padding: '20px',
            boxShadow: 'var(--shadow-soft)',
          }}>
            <h4 style={{ fontSize: '16px', color: 'var(--color-text)', marginBottom: '16px' }}>💸 成本分布</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={report.costs}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  dataKey="value"
                  nameKey="category"
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#999' }}
                >
                  {report.costs.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 满意度趋势折线图 */}
        <div style={{
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-white)',
          padding: '20px',
          boxShadow: 'var(--shadow-soft)',
          marginBottom: '24px',
        }}>
          <h4 style={{ fontSize: '16px', color: 'var(--color-text)', marginBottom: '16px' }}>❤️ 顾客满意度趋势</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={report.satisfactionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0E6E6" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #FFD6E0',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name="满意度"
                stroke="#E8899E"
                strokeWidth={3}
                dot={{ fill: '#E8899E', r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 经营建议 */}
        <div style={{
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
          padding: '24px',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>💡</span>
            <h4 style={{ fontSize: '18px', color: 'var(--color-green-dark)' }}>经营建议</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {report.suggestions.map((s, i) => (
              <div
                key={i}
                className="fade-in"
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.7)',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: 'var(--color-text)',
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
