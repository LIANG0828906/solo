import React, { useEffect } from 'react'
import { Tabs } from 'antd'
import {
  TrophyOutlined,
  CrownOutlined,
  StarOutlined,
} from '@ant-design/icons'
import {
  useDashboardStore,
  type RankingItem,
  type RankingType,
} from '@/stores/dashboardStore'
import './RankingTable.css'

interface RankRowProps {
  item: RankingItem
}

const RankRow: React.FC<RankRowProps> = ({ item }) => {
  const getRankIcon = () => {
    switch (item.rank) {
      case 1:
        return <CrownOutlined className="rank-icon rank-1-icon" />
      case 2:
        return <TrophyOutlined className="rank-icon rank-2-icon" />
      case 3:
        return <StarOutlined className="rank-icon rank-3-icon" />
      default:
        return <span className="rank-number">{item.rank}</span>
    }
  }

  const rankClass = `rank-row rank-${item.rank}`

  return (
    <div className={rankClass}>
      <div className="rank-position">{getRankIcon()}</div>
      <img
        src={item.avatar}
        alt={item.nickname}
        className="rank-avatar"
      />
      <div className="rank-info">
        <span className="rank-nickname">{item.nickname}</span>
      </div>
      <div className="rank-coins">
        <span className="coins-value">{item.coins.toLocaleString()}</span>
        <span className="coins-label">金币</span>
      </div>
    </div>
  )
}

const RankingTable: React.FC = () => {
  const ranking = useDashboardStore((state) => state.ranking)
  const rankingType = useDashboardStore((state) => state.rankingType)
  const setRankingType = useDashboardStore((state) => state.setRankingType)
  const fetchRanking = useDashboardStore((state) => state.fetchRanking)

  useEffect(() => {
    fetchRanking()
    const interval = setInterval(() => {
      fetchRanking()
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchRanking])

  const tabItems = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'all', label: '全部' },
  ]

  return (
    <div className="ranking-table">
      <div className="ranking-header">
        <h3 className="ranking-title">观众贡献排行榜</h3>
      </div>
      <Tabs
        activeKey={rankingType}
        onChange={(key) => setRankingType(key as RankingType)}
        items={tabItems}
        className="ranking-tabs"
        size="small"
      />
      <div className="ranking-list custom-scrollbar">
        {ranking.map((item) => (
          <RankRow key={item.userId} item={item} />
        ))}
        {ranking.length === 0 && (
          <div className="ranking-empty">暂无数据</div>
        )}
      </div>
    </div>
  )
}

export default RankingTable
