import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TeamTracker from './TeamTracker'
import { useTeamStore } from '../stores/teamStore'
import { useRouteStore } from '../stores/routeStore'

export default function MemberJoinPage() {
  const { routeCode } = useParams<{ routeCode: string }>()
  const { currentMember, joinRoute } = useTeamStore()
  const { fetchRouteByCode, currentRoute } = useRouteStore()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (routeCode) {
      fetchRouteByCode(routeCode)
    }
  }, [routeCode, fetchRouteByCode])

  const handleJoin = async () => {
    if (!name.trim() || !routeCode) return
    setLoading(true)
    try {
      const member = await joinRoute(routeCode.toUpperCase(), name.trim())
      navigate(`/tracker/${member.routeId}`)
    } catch (e) {
      alert('加入失败，请检查路线代码是否正确')
    } finally {
      setLoading(false)
    }
  }

  if (currentMember && currentRoute) {
    return <TeamTracker />
  }

  if (currentRoute) {
    return (
      <div className="welcome-screen">
        <h1 className="welcome-title" style={{ fontSize: 32 }}>
          加入路线：{currentRoute.name}
        </h1>
        <p className="welcome-subtitle">请输入你的姓名以加入此探险路线</p>
        <div style={{ minWidth: 360, marginTop: 20 }}>
          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>
              你的姓名
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="输入队员姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <button
            className="welcome-btn welcome-btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            onClick={handleJoin}
            disabled={loading || !name.trim()}
          >
            {loading ? '加入中...' : '加入探险'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="welcome-screen">
      <p className="welcome-subtitle">加载路线信息中...</p>
    </div>
  )
}
