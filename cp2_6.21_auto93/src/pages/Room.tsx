import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { useActivityStore, Participant } from '../store/activityStore'

const Room: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const socketRef = useRef<Socket | null>(null)

  const participants = useActivityStore((s) => s.participants)
  const groups = useActivityStore((s) => s.groups)
  const isGrouping = useActivityStore((s) => s.isGrouping)
  const activityName = useActivityStore((s) => s.activityName)
  const strategy = useActivityStore((s) => s.strategy)

  const setParticipants = useActivityStore((s) => s.setParticipants)
  const setActivity = useActivityStore((s) => s.setActivity)
  const setGroups = useActivityStore((s) => s.setGroups)
  const setIsGrouping = useActivityStore((s) => s.setIsGrouping)

  const [loading, setLoading] = useState(true)
  const [wsConnected, setWsConnected] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!activityId) return

    const loadActivity = async () => {
      try {
        const res = await fetch(`/api/activities/${activityId}`)
        if (!res.ok) throw new Error('活动不存在')
        const data = await res.json()
        setActivity(data.id, data.name, data.strategy)
        setParticipants(data.participants)
        if (data.groups && Object.keys(data.groups).length > 0) {
          const parsedGroups: Record<number, typeof groups[number]> = {}
          Object.entries(data.groups).forEach(([k, v]) => {
            parsedGroups[Number(k)] = v as any
          })
          setGroups(parsedGroups)
        }
      } catch (err) {
        console.error(err)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    loadActivity()
  }, [activityId])

  useEffect(() => {
    if (!activityId) return

    const socket = io({ transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => {
      setWsConnected(true)
      socket.emit('join_activity', { activity_id: activityId })
    })

    socket.on('disconnect', () => {
      setWsConnected(false)
    })

    socket.on('group_result', (data: any) => {
      const parsedGroups: Record<number, typeof groups[number]> = {}
      Object.entries(data.groups).forEach(([k, v]) => {
        parsedGroups[Number(k)] = v as any
      })
      setGroups(parsedGroups)
    })

    socket.on('groups_updated', (data: any) => {
      const parsedGroups: Record<number, typeof groups[number]> = {}
      Object.entries(data.groups).forEach(([k, v]) => {
        parsedGroups[Number(k)] = v as any
      })
      setGroups(parsedGroups)
    })

    socket.on('error', (err: any) => {
      console.error('WS Error:', err)
    })

    return () => {
      socket.disconnect()
    }
  }, [activityId])

  const handleStartGrouping = () => {
    if (!socketRef.current || !activityId) return
    setIsGrouping(true)
    socketRef.current.emit('start_grouping', { activity_id: activityId })
  }

  const handleCopyId = async () => {
    if (!activityId) return
    try {
      await navigator.clipboard.writeText(activityId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  const isGrouped = useMemo(() => Object.keys(groups).length > 0, [groups])

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <span style={{ color: '#667eea', marginTop: 16 }}>加载中...</span>
      </div>
    )
  }

  return (
    <div className="room-page fade-in" style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>{activityName || '活动房间'}</h1>
            <div style={styles.metaRow}>
              <span style={styles.metaItem}>
                <span style={styles.metaDot} />
                {wsConnected ? '实时连接中' : '连接中...'}
              </span>
              <span style={styles.metaItem}>
                策略：{strategy === 'balanced' ? '技能均衡' : '完全随机'}
              </span>
              <span style={styles.metaItem}>{participants.length} 位参与者</span>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button onClick={handleCopyId} style={styles.ghostBtn}>
              {copied ? '已复制 ✓' : '复制活动ID'}
            </button>
            <Link to="/" style={styles.ghostBtn}>
              返回首页
            </Link>
          </div>
        </header>

        <div style={styles.idRow}>
          <span style={styles.idLabel}>活动ID：</span>
          <code style={styles.idCode}>{activityId}</code>
        </div>

        {!isGrouped ? (
          <div style={styles.preGroupSection}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>参与者名单</h2>
              <span style={styles.sectionSubtitle}>共 {participants.length} 人</span>
            </div>

            <div style={styles.participantGrid}>
              {participants.map((p: Participant, i: number) => (
                <div
                  key={p.id}
                  className="slide-in"
                  style={{
                    ...styles.pill,
                    animationDelay: `${i * 10}ms`,
                  }}
                >
                  <div
                    style={{
                      ...styles.avatarSmall,
                      background: colorPalette[i % colorPalette.length],
                    }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span style={styles.pillName}>{p.name}</span>
                </div>
              ))}
            </div>

            <div style={styles.actionSection}>
              <button
                onClick={handleStartGrouping}
                disabled={isGrouping || !wsConnected}
                style={{
                  ...styles.startBtn,
                  ...(isGrouping ? {} : styles.pulseBtn),
                  ...(!wsConnected || isGrouping ? styles.startBtnDisabled : {}),
                }}
              >
                {isGrouping ? (
                  <>
                    <span style={styles.btnSpinner} />
                    正在智能分组中...
                  </>
                ) : (
                  '🚀 开始分组'
                )}
              </button>
              <p style={styles.hintText}>
                点击开始后，系统将使用
                {strategy === 'balanced' ? '技能均衡算法' : '完全随机算法'}进行分组
              </p>
            </div>
          </div>
        ) : (
          <div style={styles.groupedSection}>
            <div style={styles.groupPreviewHeader}>
              <h2 style={styles.sectionTitle}>分组预览</h2>
              <Link to={`/dashboard/${activityId}`} style={styles.viewBoardBtn}>
                查看团队看板 →
              </Link>
            </div>

            <div style={styles.previewGrid}>
              {Object.entries(groups).map(([teamId, team]) => (
                <div key={teamId} className="pop-in" style={styles.previewCard}>
                  <div style={styles.previewCardHeader}>
                    <span style={styles.previewTeamNum}>#{Number(teamId) + 1}</span>
                    <span style={styles.previewCount}>{team.members.length} 人</span>
                  </div>
                  <div style={styles.previewAvatars}>
                    {team.members.slice(0, 6).map((m, idx) => (
                      <div
                        key={m.id}
                        style={{
                          ...styles.previewAvatar,
                          background:
                            colorPalette[(Number(teamId) * 3 + idx) % colorPalette.length],
                          zIndex: 6 - idx,
                        }}
                        title={m.name}
                      >
                        {m.name.charAt(0)}
                      </div>
                    ))}
                    {team.members.length > 6 && (
                      <div style={styles.moreAvatar}>+{team.members.length - 6}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const colorPalette = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#f5576c',
  '#4facfe',
  '#43e97b',
  '#fa709a',
  '#fee140',
  '#30cfd0',
  '#ff9a9e',
  '#a18cd1',
  '#ffecd2',
]

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '24px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loadingWrap: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(102,126,234,0.2)',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 8,
  },
  metaRow: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#666',
  },
  metaDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#43e97b',
    boxShadow: '0 0 0 4px rgba(67,233,123,0.2)',
  },
  headerActions: {
    display: 'flex',
    gap: 10,
  },
  ghostBtn: {
    padding: '8px 16px',
    border: '1.5px solid #e0e0e0',
    borderRadius: 8,
    background: '#fff',
    color: '#555',
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  idRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    background: '#fff',
    borderRadius: 10,
    marginBottom: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  idLabel: {
    fontSize: 13,
    color: '#888',
    flexShrink: 0,
  },
  idCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#667eea',
    background: 'rgba(102,126,234,0.08)',
    padding: '4px 10px',
    borderRadius: 6,
    wordBreak: 'break-all',
  },
  preGroupSection: {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1a1a2e',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  participantGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    maxHeight: 380,
    overflowY: 'auto',
    padding: '4px 4px 12px',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px 6px 6px',
    background: 'linear-gradient(135deg, #f8f9ff, #f5f0ff)',
    borderRadius: 999,
    border: '1px solid rgba(102,126,234,0.15)',
    animationFillMode: 'both',
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  pillName: {
    fontSize: 13,
    color: '#333',
    fontWeight: 500,
  },
  actionSection: {
    marginTop: 28,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  startBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 48px',
    border: 'none',
    borderRadius: 999,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    fontSize: 17,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
    transition: 'all 0.3s',
  },
  pulseBtn: {
    animation: 'pulse 2s infinite',
  },
  startBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  btnSpinner: {
    width: 18,
    height: 18,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  hintText: {
    fontSize: 13,
    color: '#999',
  },
  groupedSection: {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  },
  groupPreviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewBoardBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    borderRadius: 10,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16,
  },
  previewCard: {
    background: 'linear-gradient(135deg, #fafbff, #f7f2ff)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid rgba(102,126,234,0.1)',
  },
  previewCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTeamNum: {
    fontSize: 18,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  previewCount: {
    fontSize: 12,
    color: '#888',
    background: '#fff',
    padding: '3px 10px',
    borderRadius: 999,
  },
  previewAvatars: {
    display: 'flex',
    paddingLeft: 4,
  },
  previewAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    border: '3px solid #fff',
    marginLeft: -8,
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
  },
  moreAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#e0e0e0',
    color: '#666',
    fontSize: 12,
    fontWeight: 600,
    border: '3px solid #fff',
    marginLeft: -8,
  },
}

export default Room
