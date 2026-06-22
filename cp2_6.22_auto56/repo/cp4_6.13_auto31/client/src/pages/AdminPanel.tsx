import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { ExhibitionDetail, Exhibit, Danmaku } from '../types'
import './AdminPanel.css'

function AdminPanel() {
  const { id } = useParams<{ id: string }>()
  const [exhibition, setExhibition] = useState<ExhibitionDetail | null>(null)
  const [exhibits, setExhibits] = useState<Exhibit[]>([])
  const [selectedExhibit, setSelectedExhibit] = useState<Exhibit | null>(null)
  const [danmakuList, setDanmakuList] = useState<Danmaku[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [danmakuLoading, setDanmakuLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/exhibitions/${id}`)
      .then(res => res.json())
      .then(data => {
        setExhibition(data)
        setExhibits(data.exhibits || [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [id])

  const loadDanmaku = async (exhibitId: string) => {
    setDanmakuLoading(true)
    try {
      const res = await fetch(`/api/exhibits/${exhibitId}/danmaku/all`)
      const data = await res.json()
      setDanmakuList(data)
    } catch (error) {
      console.error('加载弹幕失败:', error)
    } finally {
      setDanmakuLoading(false)
    }
  }

  const handleSelectExhibit = (exhibit: Exhibit) => {
    setSelectedExhibit(exhibit)
    loadDanmaku(exhibit.id)
  }

  const toggleVisibility = async (danmakuId: string, currentVisible: boolean) => {
    try {
      const res = await fetch(`/api/danmaku/${danmakuId}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: !currentVisible }),
      })
      if (res.ok) {
        const updated = await res.json()
        setDanmakuList(prev => prev.map(d => d.id === danmakuId ? updated : d))
      }
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  const deleteDanmaku = async (danmakuId: string) => {
    if (!confirm('确定要删除这条弹幕吗？')) return
    try {
      await fetch(`/api/danmaku/${danmakuId}`, { method: 'DELETE' })
      setDanmakuList(prev => prev.filter(d => d.id !== danmakuId))
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  if (isLoading) {
    return <div className="admin-loading">加载中...</div>
  }

  if (!exhibition) {
    return <div className="admin-loading">展览不存在</div>
  }

  return (
    <div className="admin-panel fade-in">
      <div className="admin-header glass-panel">
        <div>
          <Link to="/" className="back-link">← 返回</Link>
          <h1 className="admin-title">管理后台 - {exhibition.name}</h1>
        </div>
        <Link to={`/edit/${id}`} className="btn-secondary">
          编辑展览
        </Link>
      </div>

      <div className="admin-content">
        <div className="exhibits-sidebar glass-panel">
          <h2 className="sidebar-title">展品列表</h2>
          {exhibits.length === 0 ? (
            <p className="empty-exhibits">暂无展品</p>
          ) : (
            <div className="exhibit-list-admin">
              {exhibits.map(exhibit => (
                <div
                  key={exhibit.id}
                  className={`exhibit-item-admin ${selectedExhibit?.id === exhibit.id ? 'active' : ''}`}
                  onClick={() => handleSelectExhibit(exhibit)}
                >
                  {exhibit.image_data ? (
                    <img src={exhibit.image_data} alt={exhibit.title} className="exhibit-thumb" />
                  ) : (
                    <div className="exhibit-thumb-placeholder">🖼️</div>
                  )}
                  <span className="exhibit-name">{exhibit.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="danmaku-panel glass-panel">
          <h2 className="panel-title">
            {selectedExhibit ? `${selectedExhibit.title} - 弹幕管理` : '选择一个展品管理弹幕'}
          </h2>

          {selectedExhibit ? (
            danmakuLoading ? (
              <div className="loading-state">加载中...</div>
            ) : danmakuList.length === 0 ? (
              <div className="empty-state">
                <p>暂无弹幕</p>
              </div>
            ) : (
              <div className="danmaku-list-admin">
                {danmakuList.map(danmaku => (
                  <div
                    key={danmaku.id}
                    className={`danmaku-item-admin ${!danmaku.is_visible ? 'hidden' : ''} ${danmaku.is_reported ? 'reported' : ''}`}
                  >
                    <div className="danmaku-info">
                      <span className="danmaku-user">{danmaku.user_name}</span>
                      <span className="danmaku-content-text">{danmaku.content}</span>
                      <span className="danmaku-likes">👍 {danmaku.likes}</span>
                      {danmaku.is_reported && <span className="report-badge">已举报</span>}
                    </div>
                    <div className="danmaku-admin-actions">
                      <button
                        className={`action-btn ${danmaku.is_visible ? 'btn-hide' : 'btn-show'}`}
                        onClick={() => toggleVisibility(danmaku.id, !!danmaku.is_visible)}
                      >
                        {danmaku.is_visible ? '隐藏' : '显示'}
                      </button>
                      <button
                        className="action-btn btn-delete"
                        onClick={() => deleteDanmaku(danmaku.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="empty-state">
              <p className="hint-text">← 从左侧选择展品</p>
            </div>
          )}
        </div>
      </div>

      <div className="stats-panel glass-panel">
        <h2 className="stats-title">数据统计</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{exhibits.length}</span>
            <span className="stat-label">展品数量</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{danmakuList.length}</span>
            <span className="stat-label">弹幕总数</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {danmakuList.filter(d => d.is_reported).length}
            </span>
            <span className="stat-label">被举报</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {danmakuList.filter(d => !d.is_visible).length}
            </span>
            <span className="stat-label">已隐藏</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
