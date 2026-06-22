import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TeamTracker from './TeamTracker'
import { useTeamStore } from '../stores/teamStore'
import { useRouteStore } from '../stores/routeStore'
import { useToast } from '../components/Toast'

export default function MemberJoinPage() {
  const { routeCode } = useParams<{ routeCode: string }>()
  const { currentMember, joinRoute } = useTeamStore()
  const { fetchRouteByCode, currentRoute } = useRouteStore()
  const toast = useToast()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoAvailable, setGeoAvailable] = useState<boolean | null>(null)
  const navigate = useNavigate()
  const hasRequestedGeoRef = useRef(false)

  useEffect(() => {
    if (routeCode) {
      fetchRouteByCode(routeCode)
    }
  }, [routeCode, fetchRouteByCode])

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoAvailable(false)
      setGeoError('当前浏览器不支持地理定位')
      return
    }
    setGeoAvailable(true)

    if (hasRequestedGeoRef.current) return
    hasRequestedGeoRef.current = true

    const id: number = navigator.geolocation.getCurrentPosition(
      () => {
        setGeoError(null)
        toast.showInfo('位置权限已授予，加入后将自动同步位置')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('位置权限被拒绝，加入后可能无法上报位置')
          toast.showWarning(
            '位置权限被拒绝。请允许位置访问以参与队伍追踪。',
            6000,
          )
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError('暂时无法获取位置信息')
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    ) as unknown as number
    return () => {
      try {
        navigator.geolocation.clearWatch(id)
      } catch {}
    }
  }, [toast])

  const handleJoin = async () => {
    if (!name.trim() || !routeCode) return
    setLoading(true)
    try {
      const member = await joinRoute(routeCode.toUpperCase(), name.trim())
      toast.showSuccess(`已成功加入路线：${currentRoute?.name || routeCode}`)
      navigate(`/tracker/${member.routeId}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加入失败'
      toast.showError(`${msg}，请检查路线代码是否正确`)
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
        <p className="welcome-subtitle">
          请输入你的姓名。加入后系统将通过浏览器定位实时同步你的位置。
        </p>
        <div style={{ minWidth: 360, marginTop: 20 }}>
          <div className="form-group">
            <label
              className="form-label"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              你的姓名
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="输入队员姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoin()
              }}
            />
          </div>

          {geoError && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(231, 76, 60, 0.2)',
                border: '1px solid rgba(231, 76, 60, 0.4)',
                borderRadius: 8,
                fontSize: 13,
                color: '#ff6b6b',
                marginBottom: 12,
              }}
            >
              ⚠️ {geoError}
            </div>
          )}
          {geoAvailable && !geoError && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(46, 204, 113, 0.15)',
                border: '1px solid rgba(46, 204, 113, 0.3)',
                borderRadius: 8,
                fontSize: 13,
                color: '#7bed9f',
                marginBottom: 12,
              }}
            >
              📍 位置定位已就绪，加入后每 10 秒自动同步一次位置
            </div>
          )}

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
