import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import DanmakuOverlay from '../components/DanmakuOverlay'
import type { Exhibit } from '../types'
import './ExhibitDetail.css'

function ExhibitDetail() {
  const { id } = useParams<{ id: string }>()
  const [exhibit, setExhibit] = useState<Exhibit | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/exhibits/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed')
        return res.json()
      })
      .then(data => {
        setExhibit(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return <div className="detail-loading">加载中...</div>
  }

  if (!exhibit) {
    return <div className="detail-loading">展品不存在</div>
  }

  return (
    <div className="exhibit-detail fade-in">
      <Link to="/" className="back-link">← 返回首页</Link>

      <div className="detail-container glass-panel">
        <div className="detail-image-section">
          {exhibit.image_data ? (
            <img src={exhibit.image_data} alt={exhibit.title} className="detail-image" />
          ) : (
            <div className="detail-image-placeholder">🖼️</div>
          )}
        </div>

        <div className="detail-info">
          <h1 className="detail-title">{exhibit.title}</h1>
          <p className="detail-description">{exhibit.description || '暂无描述'}</p>

          <div className="detail-meta">
            <span className="meta-item">位置: ({exhibit.grid_x}, {exhibit.grid_y})</span>
          </div>
        </div>
      </div>

      <div className="danmaku-section glass-panel">
        <h2 className="section-title">弹幕互动</h2>
        <div className="danmaku-viewer">
          <DanmakuOverlay exhibit={exhibit} onClose={() => {}} />
        </div>
      </div>
    </div>
  )
}

export default ExhibitDetail
