import { useEffect, useMemo, useCallback } from 'react';
import { Row, Col, Select, Spin, Table, Avatar, Tag } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { useStore } from '@/stores/store';
import type { TimeRange, RankItem } from '@/types';

const { Option } = Select;

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'all', label: '全部' },
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: RankItem }> }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: '1px solid #F5E6D3',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Avatar src={data.avatar} size={24} icon={<UserOutlined />} />
          <span style={{ fontWeight: 500, color: '#3D2914' }}>{data.nickname}</span>
        </div>
        <p style={{ margin: 0, color: '#8B7355' }}>
          积分：<span style={{ color: '#D4A574', fontWeight: 600 }}>{data.points}</span>
        </p>
      </div>
    );
  }
  return null;
}

function RankPage() {
  const {
    user,
    rankData,
    loading,
    timeRange,
    fetchRank,
    setTimeRange,
  } = useStore();

  useEffect(() => {
    fetchRank(timeRange);
  }, [fetchRank, timeRange]);

  const handleTimeRangeChange = useCallback((value: TimeRange) => {
    setTimeRange(value);
  }, [setTimeRange]);

  const chartData = useMemo(() => {
    if (!rankData) return [];
    return rankData.rankList.map(item => ({
      ...item,
      name: item.nickname.length > 4 ? item.nickname.slice(0, 4) + '...' : item.nickname,
    }));
  }, [rankData]);

  const tableColumns = useMemo(() => [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => {
        const colors = ['#FAAD14', '#D9D9D9', '#D48806'];
        return (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: rank <= 3 ? colors[rank - 1] : '#F5E6D3',
              color: rank <= 3 ? '#fff' : '#6B4226',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {rank <= 3 ? <TrophyOutlined /> : rank}
          </div>
        );
      },
    },
    {
      title: '用户',
      dataIndex: 'nickname',
      key: 'nickname',
      render: (nickname: string, record: RankItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <span style={{ color: '#3D2914' }}>{nickname}</span>
          {record.userId === user?.id && (
            <Tag color="gold" style={{ marginLeft: '8px' }}>
              我
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      align: 'right' as const,
      render: (points: number) => (
        <span style={{ fontWeight: 600, color: '#D4A574' }}>{points}</span>
      ),
    },
  ], [user]);

  const currentUserRow = useMemo(() => {
    if (!rankData || !user) return null;
    const userInList = rankData.rankList.find(r => r.userId === user.id);
    if (userInList) return null;
    return {
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      points: rankData.currentUserPoints,
      rank: rankData.currentUserRank,
    };
  }, [rankData, user]);

  const tableData = useMemo(() => {
    if (!rankData) return [];
    const data = [...rankData.rankList];
    if (currentUserRow && !data.find(r => r.userId === user?.id)) {
      data.push(currentUserRow);
    }
    return data;
  }, [rankData, currentUserRow, user]);

  const isLoading = loading.rank;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1 className="page-title">积分排行榜</h1>
            <p className="page-subtitle">
              查看社区用户积分排名，争做咖啡达人
            </p>
          </div>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            style={{ width: '140px' }}
            size="large"
          >
            {timeRangeOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14} className="fade-in-delay-1">
            <div className="card" style={{ height: '100%', minHeight: '450px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#3D2914', fontSize: '18px' }}>
                <TrophyOutlined style={{ color: '#FAAD14', marginRight: '8px' }} />
                前10名用户排行
              </h3>
              <div style={{ width: '100%', height: '380px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1890FF" />
                        <stop offset="100%" stopColor="#69C0FF" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#8B7355', fontSize: '12px' }}
                      axisLine={{ stroke: '#D4A574' }}
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fill: '#8B7355', fontSize: '12px' }}
                      axisLine={{ stroke: '#D4A574' }}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(212, 165, 116, 0.1)' }} />
                    <Bar dataKey="points" radius={[8, 8, 0, 0]} maxBarSize={50}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.userId === user?.id ? 'url(#colorBar)' : 'url(#colorBar)'}
                          fillOpacity={entry.userId === user?.id ? 1 : 0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Col>

          <Col xs={24} lg={10} className="fade-in-delay-2">
            <div className="card" style={{ height: '100%', minHeight: '450px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#3D2914', fontSize: '18px' }}>
                <UserOutlined style={{ color: '#D4A574', marginRight: '8px' }} />
                我的排名
              </h3>
              {rankData && user && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #FFF8F0 0%, #F5E6D3 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    textAlign: 'center',
                    border: '2px solid #D4A574',
                  }}
                >
                  <div style={{ fontSize: '48px', fontWeight: 700, color: '#D4A574', lineHeight: 1 }}>
                    #{rankData.currentUserRank}
                  </div>
                  <div style={{ marginTop: '8px', color: '#6B4226', fontSize: '15px' }}>
                    当前积分：<strong>{rankData.currentUserPoints}</strong>
                  </div>
                </div>
              )}
              <Table
                dataSource={tableData}
                columns={tableColumns}
                rowKey="userId"
                pagination={false}
                scroll={{ y: 280 }}
                rowClassName={(record) =>
                  record.userId === user?.id ? 'current-user-row' : ''
                }
                onRow={(record) => ({
                  style: record.userId === user?.id
                    ? { background: 'rgba(212, 165, 116, 0.15)', fontWeight: 500 }
                    : {},
                })}
                size="middle"
              />
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default RankPage;
