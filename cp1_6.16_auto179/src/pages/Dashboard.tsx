import React from 'react';
import { Row, Col, Card, Avatar, Spin } from 'antd';
import {
  WalletOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import AnimatedNumber from '../components/AnimatedNumber';
import { useAppStore } from '../store/useAppStore';

const Dashboard: React.FC = () => {
  const { currentUser, balance, monthlySummary, trendData, budgets, loading } =
    useAppStore();

  if (!currentUser) return null;

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalUsed = budgets.reduce((s, b) => s + (b.used || 0), 0);
  const budgetPercent = totalBudget > 0 ? Math.min((totalUsed / totalBudget) * 100, 100) : 0;

  const pieData = budgets.map((b) => ({
    name: b.category,
    value: b.used || 0,
  }));

  const COLORS = [
    '#5470C6',
    '#91CC75',
    '#FAC858',
    '#EE6666',
    '#73C0DE',
    '#3BA272',
    '#FC8452',
    '#9A60B4',
  ];

  const hasTrendData = trendData.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div>
      <div className="welcome-header">
        <Avatar src={currentUser.avatar} size={56} className="user-avatar" />
        <div className="welcome-text">
          <h2>欢迎回来，{currentUser.name}</h2>
          <p>今天是 {new Date().toLocaleDateString('zh-CN')}，祝您记账愉快！</p>
        </div>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <div
              className="stat-card"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <div className="label">总余额</div>
              <div className="value">
                <AnimatedNumber value={balance} prefix="¥ " duration={1500} />
              </div>
              <WalletOutlined className="card-icon" />
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div
              className="stat-card"
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              }}
            >
              <div className="label">本月收入</div>
              <div className="value">
                <AnimatedNumber value={monthlySummary.income} prefix="¥ " duration={1500} />
              </div>
              <ArrowUpOutlined className="card-icon" />
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div
              className="stat-card"
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              }}
            >
              <div className="label">本月支出</div>
              <div className="value">
                <AnimatedNumber value={monthlySummary.expense} prefix="¥ " duration={1500} />
              </div>
              <ArrowDownOutlined className="card-icon" />
            </div>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              title="近6个月收支趋势"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
            >
              {hasTrendData ? (
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#52C41A" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#52C41A" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F5222D" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F5222D" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Line
                        type="monotone"
                        dataKey="income"
                        name="收入"
                        stroke="#52C41A"
                        strokeWidth={2}
                        fill="url(#colorIncome)"
                        animationDuration={1500}
                        dot={{ r: 4, fill: '#52C41A' }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        name="支出"
                        stroke="#F5222D"
                        strokeWidth={2}
                        fill="url(#colorExpense)"
                        animationDuration={1500}
                        dot={{ r: 4, fill: '#F5222D' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-chart">暂无数据</div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title="预算执行情况"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
            >
              {pieData.some((d) => d.value > 0) ? (
                <div style={{ height: 320, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        animationDuration={1500}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={{ stroke: '#999' }}
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#999' }}>当月总预算</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: '#1890ff' }}>
                      {budgetPercent.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-chart">暂无数据</div>
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;
