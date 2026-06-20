import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRouteStore } from '../stores/routeStore'
import { useTeamStore } from '../stores/teamStore'
import { generateId, generateRouteCode } from '../utils'
import type { RoutePoint } from '../types'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { createRoute } = useRouteStore()
  const { joinRoute } = useTeamStore()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [routeName, setRouteName] = useState('')
  const [routeDesc, setRouteDesc] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [memberName, setMemberName] = useState('')
  const [memberNameForJoin, setMemberNameForJoin] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleCreate = () => setShowCreate(true)
    const handleJoin = () => setShowJoin(true)
    window.addEventListener('openCreateModal', handleCreate)
    window.addEventListener('openJoinModal', handleJoin)
    return () => {
      window.removeEventListener('openCreateModal', handleCreate)
      window.removeEventListener('openJoinModal', handleJoin)
    }
  }, [])

  const handleCreate = async () => {
    if (!routeName.trim()) return
    setLoading(true)
    try {
      const route = await createRoute({
        name: routeName,
        description: routeDesc,
        points: [],
      })
      navigate(`/planner/${route.id}`)
    } catch (e) {
      alert('创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim() || !memberName.trim()) return
    setLoading(true)
    try {
      const member = await joinRoute(joinCode.toUpperCase(), memberName)
      navigate(`/tracker/${member.routeId}`)
    } catch (e) {
      alert('加入失败，请检查路线代码是否正确')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="welcome-screen">
      <h1 className="welcome-title">户外探险路线规划与队伍追踪</h1>
      <p className="welcome-subtitle">
        规划你的探险路线，标注补给点与营地，实时追踪全队位置和进度，
        让每一次户外出行都安全有序。
      </p>
      <div className="welcome-buttons">
        <button
          className="welcome-btn welcome-btn-primary"
          onClick={() => setShowCreate(true)}
        >
          创建新路线
        </button>
        <button
          className="welcome-btn welcome-btn-secondary"
          onClick={() => setShowJoin(true)}
        >
          加入已有路线
        </button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => !loading && setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">创建探险路线</h2>
            <div className="form-group">
              <label className="form-label">路线名称</label>
              <input
                type="text"
                className="form-input"
                placeholder="例如：珠穆朗玛峰东坡穿越"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">路线描述（可选）</label>
              <textarea
                className="form-input"
                placeholder="描述路线特点、难度等..."
                rows={3}
                value={routeDesc}
                onChange={(e) => setRouteDesc(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowCreate(false)}
                disabled={loading}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleCreate}
                disabled={loading || !routeName.trim()}
              >
                {loading ? '创建中...' : '创建路线'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="modal-overlay" onClick={() => !loading && setShowJoin(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">加入探险路线</h2>
            <div className="form-group">
              <label className="form-label">你的姓名</label>
              <input
                type="text"
                className="form-input"
                placeholder="输入队员姓名"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">6位路线代码</label>
              <input
                type="text"
                className="form-input"
                placeholder="例如：ABC123"
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'monospace' }}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowJoin(false)}
                disabled={loading}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleJoin}
                disabled={loading || !joinCode.trim() || !memberName.trim()}
              >
                {loading ? '加入中...' : '加入路线'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
