import { useState, useEffect } from 'react'
import request from '../../utils/request'
import ProgressCircle from '../../components/ProgressCircle'
import AnimatedNumber from '../../components/AnimatedNumber'

interface Stats {
  totalCapsules: number
  unopenedCapsules: number
  openedCapsules: number
  todayOpened: number
  todayDrifted: number
  openRate: number
}

function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const data = await request.get('/capsules/stats')
      setStats(data as Stats)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="loading-spinner" />
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '48px', paddingTop: '40px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '16px', background: 'linear-gradient(135deg, #fff, #a5b4fc, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          ✨ 时间胶囊漂流瓶
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          写下此刻的心情，封存于时间胶囊，让未来的自己或某个陌生人，在某个不经意的时刻，收到你的故事
        </p>
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-value">
            <AnimatedNumber value={stats?.unopenedCapsules || 0} />
          </div>
          <div className="stat-label">未开封胶囊</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-value">
            <AnimatedNumber value={stats?.todayOpened || 0} />
          </div>
          <div className="stat-label">今日开封</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-value">
            <AnimatedNumber value={stats?.todayDrifted || 0} />
          </div>
          <div className="stat-label">今日漂流瓶</div>
        </div>

        <div className="glass-card stat-card">
          <ProgressCircle percentage={(stats?.openRate || 0) * 100} />
          <div className="stat-label">开封率</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '40px' }}>
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📝</div>
          <h3 style={{ marginBottom: '12px' }}>创建时间胶囊</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            写下一段心情或上传一张照片，设置未来的开封日期，让时间替你保管
          </p>
        </div>

        <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🌊</div>
          <h3 style={{ marginBottom: '12px' }}>漂流瓶奇遇</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            将已开封的胶囊投入漂流池，随机送达另一个陌生人的手中
          </p>
        </div>

        <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>💌</div>
          <h3 style={{ marginBottom: '12px' }}>匿名回复</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            收到漂流瓶后可以匿名回复，24小时后对方才能看到你的留言
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '60px', paddingBottom: '40px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          已有 <strong style={{ color: 'var(--text-primary)' }}>{stats?.totalCapsules || 0}</strong> 枚时间胶囊在星空中漂流
        </p>
      </div>
    </div>
  )
}

export default Home
