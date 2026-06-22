import React, { useMemo } from 'react'
import { userStats } from '../data/mockData'

const ProfileStats: React.FC = () => {
  const formatNumber = (num: number): string => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }

  const warmGradientStyle = useMemo(() => {
    const intensity = Math.min(userStats.streakDays / 100, 1)
    const hue1 = 0 + intensity * 15
    const hue2 = 45 + intensity * 10
    return {
      background: `linear-gradient(135deg, hsl(${hue1}, 100%, ${65 - intensity * 10}%), hsl(${hue2}, 100%, ${60 - intensity * 10}%))`,
    }
  }, [userStats.streakDays])

  const coolGradientStyle = useMemo(() => {
    return {
      background: 'var(--bg-card)',
    }
  }, [])

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">我的创作</h1>
        <p className="page-subtitle">记录每一次灵感迸发的瞬间</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card warm" style={warmGradientStyle}>
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{userStats.streakDays}</div>
          <div className="stat-label">连续创作天数</div>
        </div>

        <div className="stat-card cool">
          <div className="stat-icon">✍️</div>
          <div className="stat-value">{formatNumber(userStats.totalWords)}</div>
          <div className="stat-label">累计写作字数</div>
        </div>

        <div className="stat-card cool">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{userStats.totalWorks}</div>
          <div className="stat-label">完成作品数量</div>
        </div>

        <div className="stat-card cool">
          <div className="stat-icon">📏</div>
          <div className="stat-value">{userStats.averageWordsPerWork}</div>
          <div className="stat-label">单篇平均字数</div>
        </div>

        <div className="stat-card cool">
          <div className="stat-icon">🏆</div>
          <div className="stat-value" style={{ fontSize: '32px', lineHeight: 1.2 }}>
            {formatNumber(userStats.mostApplaudedWork.applauds)}
          </div>
          <div className="stat-label">
            最多鼓掌作品 · {userStats.mostApplaudedWork.title}
          </div>
        </div>

        <div className="stat-card cool">
          <div className="stat-icon">🏷️</div>
          <div className="stat-value" style={{ fontSize: '32px', lineHeight: 1.2 }}>
            {userStats.mostPopularTags.slice(0, 3).join(' · ')}
          </div>
          <div className="stat-label">最受欢迎标签</div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '16px',
          }}
        >
          我的标签云
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {userStats.mostPopularTags.map((tag, index) => (
            <span
              key={tag}
              className="feed-tag"
              style={{
                fontSize: `${14 + (userStats.mostPopularTags.length - index) * 2}px`,
                padding: '8px 16px',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '16px',
          }}
        >
          创作里程碑
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: 'rgba(233, 69, 96, 0.1)',
              borderRadius: '8px',
              borderLeft: '3px solid var(--accent)',
            }}
          >
            <span style={{ fontSize: '24px' }}>🎯</span>
            <div>
              <div style={{ fontWeight: '600' }}>首次创作</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {userStats.totalWorks} 天前，你写下了第一篇故事
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: 'rgba(233, 69, 96, 0.1)',
              borderRadius: '8px',
              borderLeft: '3px solid var(--accent)',
            }}
          >
            <span style={{ fontSize: '24px' }}>💯</span>
            <div>
              <div style={{ fontWeight: '600' }}>十万字成就</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                你已经累计创作了 {formatNumber(userStats.totalWords)} 字，相当于一本长篇小说
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: 'rgba(233, 69, 96, 0.1)',
              borderRadius: '8px',
              borderLeft: '3px solid var(--accent)',
            }}
          >
            <span style={{ fontSize: '24px' }}>🔥</span>
            <div>
              <div style={{ fontWeight: '600' }}>坚持达人</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                连续 {userStats.streakDays} 天不间断创作，超越了 95% 的用户
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileStats
