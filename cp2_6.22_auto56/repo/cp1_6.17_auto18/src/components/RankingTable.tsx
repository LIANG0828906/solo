import React, { useEffect } from 'react';
import { Tabs } from 'antd';
import { useDashboardStore, RankingPeriod } from '../stores/dashboardStore';
import { CrownOutlined, TrophyOutlined, StarOutlined } from '@ant-design/icons';
import './RankingTable.css';

const RankingTable: React.FC = () => {
  const rankingData = useDashboardStore((state) => state.rankingData);
  const rankingPeriod = useDashboardStore((state) => state.rankingPeriod);
  const setRankingPeriod = useDashboardStore((state) => state.setRankingPeriod);
  const fetchRanking = useDashboardStore((state) => state.fetchRanking);

  useEffect(() => {
    fetchRanking();
    const interval = setInterval(() => {
      fetchRanking();
    }, 5000);
    return () => clearInterval(interval);
  }, [rankingPeriod]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <CrownOutlined className="rank-icon rank-1-icon" />;
      case 1:
        return <TrophyOutlined className="rank-icon rank-2-icon" />;
      case 2:
        return <StarOutlined className="rank-icon rank-3-icon" />;
      default:
        return <span className="rank-number">{index + 1}</span>;
    }
  };

  const getRankClassName = (index: number) => {
    switch (index) {
      case 0:
        return 'ranking-row rank-1';
      case 1:
        return 'ranking-row rank-2';
      case 2:
        return 'ranking-row rank-3';
      default:
        return 'ranking-row';
    }
  };

  const tabItems = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'all', label: '全部' },
  ];

  return (
    <div className="ranking-table">
      <div className="ranking-header">
        <h3>观众贡献排行榜</h3>
        <Tabs
          activeKey={rankingPeriod}
          onChange={(key) => setRankingPeriod(key as RankingPeriod)}
          items={tabItems}
          size="small"
          className="ranking-tabs"
        />
      </div>
      <div className="ranking-list">
        {rankingData.map((item, index) => (
          <div key={item.id} className={getRankClassName(index)}>
            <div className="rank-position">
              {getRankIcon(index)}
            </div>
            <div
              className="user-avatar"
              style={{ background: `linear-gradient(135deg, #${item.avatar}, #${item.avatar}aa)` }}
            >
              {item.nickname.charAt(0)}
            </div>
            <div className="user-info">
              <div className="user-nickname">{item.nickname}</div>
              <div className="user-coins">
                <span className="coin-icon">🪙</span>
                {item.totalCoins.toLocaleString()} 金币
              </div>
            </div>
            <div className="user-contribution">
              贡献 ¥{(item.totalCoins / 100).toLocaleString()}
            </div>
          </div>
        ))}
        {rankingData.length === 0 && (
          <div className="empty-ranking">
            <p>暂无数据</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingTable;
