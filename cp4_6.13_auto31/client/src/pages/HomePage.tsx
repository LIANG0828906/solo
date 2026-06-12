import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Exhibition } from '../types'
import './HomePage.css'

function HomePage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/exhibitions')
      .then(res => res.json())
      .then(data => {
        setExhibitions(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="home-page fade-in">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">打造你的<span className="highlight">虚拟展览馆</span></h1>
          <p className="hero-subtitle">像策展人一样布置3D展厅，邀请朋友沉浸浏览</p>
          <Link to="/create" className="btn-primary hero-btn">
            立即创建展览
          </Link>
        </div>
      </section>

      <section className="exhibitions-section">
        <div className="section-header">
          <h2 className="section-title">精选展览</h2>
          <div className="section-divider"></div>
        </div>
        
        {loading ? (
          <div className="loading">加载中...</div>
        ) : exhibitions.length === 0 ? (
          <div className="empty-state glass-panel">
            <div className="empty-icon">🎨</div>
            <p className="empty-text">还没有展览，创建第一个吧！</p>
            <Link to="/create" className="btn-primary">创建展览</Link>
          </div>
        ) : (
          <div className="exhibition-grid">
            {exhibitions.map((exhibition, index) => (
              <Link
                to={`/view/${exhibition.id}`}
                key={exhibition.id}
                className="exhibition-card glass-panel"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-preview">
                  <span className="card-icon">🖼️</span>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{exhibition.name}</h3>
                  <p className="card-theme">{exhibition.theme || '未设置主题'}</p>
                  <p className="card-desc">{exhibition.description || '暂无简介'}</p>
                </div>
                <div className="card-footer">
                  <span className="view-btn">进入展厅 →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default HomePage
