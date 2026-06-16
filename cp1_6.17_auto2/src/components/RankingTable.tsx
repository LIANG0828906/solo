import React from 'react';
import { Tabs, Spin } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { useDashboardStore } from '../stores/dashboardStore';
import type { RankingItem, RankingPeriod } from '../types';

const getRankBackground = (index: number): string => {
  switch (index) {
    case 0:
      return '#FFF8E1';
    case 1:
      return '#F5F5F5';
    case 2:
      return '#FFECB3';
    default:
      return 'transparent';
  }
};

const getRankIcon = (index: number): React.ReactNode => {
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  if (index < 3) {
    return (
      <TrophyOutlined
        style={{
          color: colors[index],
          fontSize: 20,
        }}
      />
    );
  }
  return (
    <span
      style={{
        color: '#666',
        fontSize: 16,
        fontWeight: 500,
        width: 24,
        textAlign: 'center',
        display: 'inline-block',
      }}
    >
      {index + 1}
    </span>
  );
};

const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN');
};

const RankingTable: React.FC = () => {
  const { ranking, rankingPeriod, setRankingPeriod, loading } = useDashboardStore();

  const items = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'all', label: '全部' },
  ];

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: '#2D2D44',
        borderRadius: 12,
        padding: 20,
        height: 'calc(100vh - 100px)',
        maxHeight: 600,
        display: 'flex',
        flexDirection: 'column',
      }}
      className="card-hover"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ color: '#E0E0E0', margin: 0, fontSize: 18 }}>观众贡献排行</h3>
        <Tabs
          activeKey={rankingPeriod}
          onChange={(key) => setRankingPeriod(key as RankingPeriod)}
          items={items}
          size="small"
          style={{ margin: 0 }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ranking.map((item: RankingItem, index: number) => (
              <div
                key={item.userId}
                style={{
                  background: getRankBackground(index),
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.2s ease',
                }}
                className="card-hover"
              >
                <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                  {getRankIcon(index)}
                </div>
                <img
                  src={item.avatar}
                  alt={item.nickname}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: '#ddd',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: index < 3 ? '#1E1E2E' : '#E0E0E0',
                      fontWeight: 500,
                      fontSize: 15,
                    }}
                  >
                    {item.nickname}
                  </div>
                </div>
                <div
                  style={{
                    color: '#FF6B00',
                    fontWeight: 600,
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {formatNumber(item.contribution)}
                  <span style={{ fontSize: 12, marginLeft: 4 }}>金币</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingTable;
