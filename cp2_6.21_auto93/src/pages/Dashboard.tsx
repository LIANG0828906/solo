import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import {
  useActivityStore,
  Message,
  TeamGroup,
} from '../store/activityStore'

const COLOR_PALETTE = [
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

const getColor = (seed: string | number) => {
  const str = String(seed)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length]
}

interface DragInfo {
  memberId: string
  fromTeamId: number | null
  memberName: string
}

const TeamCard = React.memo(
  ({
    teamId,
    team,
    isDragOver,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onSendMessage,
    currentSender,
  }: {
    teamId: number
    team: TeamGroup
    isDragOver: boolean
    onDragStart: (info: DragInfo) => void
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: () => void
    onDrop: (toTeamId: number) => void
    onSendMessage: (teamId: number, text: string) => void
    currentSender: string
  }) => {
    const [messageInput, setMessageInput] = useState('')
    const [showAllMessages, setShowAllMessages] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const displayMessages = useMemo(() => {
      if (showAllMessages) return team.messages
      return team.messages.slice(-3)
    }, [team.messages, showAllMessages])

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [team.messages])

    const handleSend = (e: React.FormEvent) => {
      e.preventDefault()
      const text = messageInput.trim()
      if (!text) return
      onSendMessage(teamId, text)
      setMessageInput('')
    }

    return (
      <div
        className="pop-in"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={() => onDrop(teamId)}
        style={{
          ...cardStyles.card,
          ...(isDragOver ? cardStyles.cardDragOver : {}),
        }}
      >
        <div style={cardStyles.cardHeader}>
          <span style={cardStyles.teamNumber}>#{teamId + 1}</span>
          <span style={cardStyles.memberCount}>{team.members.length} 人</span>
        </div>

        <div style={cardStyles.membersContainer}>
          {team.members.map((member) => (
            <div
              key={member.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', member.id)
                ;(e.currentTarget as HTMLElement).classList.add('dragging')
                onDragStart({
                  memberId: member.id,
                  fromTeamId: teamId,
                  memberName: member.name,
                })
              }}
              onDragEnd={(e) => {
                ;(e.currentTarget as HTMLElement).classList.remove('dragging')
              }}
              style={cardStyles.memberItem}
              className="slide-in"
            >
              <div
                style={{
                  ...cardStyles.avatar,
                  background: getColor(member.id),
                }}
              >
                {member.name.charAt(0)}
              </div>
              <span style={cardStyles.memberName}>{member.name}</span>
            </div>
          ))}
          {team.members.length === 0 && (
            <div style={cardStyles.emptyTeam}>暂无成员</div>
          )}
        </div>

        <div style={cardStyles.messageSection}>
          {team.messages.length > 3 && (
            <button
              onClick={() => setShowAllMessages(!showAllMessages)}
              style={cardStyles.toggleMessagesBtn}
            >
              {showAllMessages ? '收起' : `查看全部 ${team.messages.length} 条`}
            </button>
          )}

          <div
            style={{
              ...cardStyles.messageList,
              maxHeight: showAllMessages ? 180 : 90,
            }}
          >
            {displayMessages.length === 0 ? (
              <div style={cardStyles.emptyMessages}>暂无消息，发送第一条吧~</div>
            ) : (
              displayMessages.map((msg, idx) => (
                <div key={idx} style={cardStyles.messageBubble}>
                  <div style={cardStyles.messageHeader}>
                    <span style={cardStyles.messageSender}>{msg.sender}</span>
                    <span style={cardStyles.messageTime}>{msg.time}</span>
                  </div>
                  <div style={cardStyles.messageText}>{msg.text}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={cardStyles.messageForm}>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={`以"${currentSender}"发送消息...`}
              style={cardStyles.messageInput}
            />
            <button type="submit" style={cardStyles.sendBtn} disabled={!messageInput.trim()}>
              发送
            </button>
          </form>
        </div>
      </div>
    )
  },
)

const Dashboard: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const socketRef = useRef<Socket | null>(null)
  const dragInfoRef = useRef<DragInfo | null>(null)

  const activityName = useActivityStore((s) => s.activityName)
  const groups = useActivityStore((s) => s.groups)
  const setActivity = useActivityStore((s) => s.setActivity)
  const setParticipants = useActivityStore((s) => s.setParticipants)
  const setGroups = useActivityStore((s) => s.setGroups)
  const addMessage = useActivityStore((s) => s.addMessage)
  const moveMember = useActivityStore((s) => s.moveMember)

  const [loading, setLoading] = useState(true)
  const [wsConnected, setWsConnected] = useState(false)
  const [dragOverTeam, setDragOverTeam] = useState<number | null>(null)
  const [currentSender] = useState(() => {
    const saved = localStorage.getItem('dashboard_sender_name')
    return saved || '我'
  })

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
          const parsedGroups: Record<number, TeamGroup> = {}
          Object.entries(data.groups).forEach(([k, v]) => {
            parsedGroups[Number(k)] = v as TeamGroup
          })
          setGroups(parsedGroups)
        } else {
          navigate(`/room/${activityId}`)
          return
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
      const parsedGroups: Record<number, TeamGroup> = {}
      Object.entries(data.groups).forEach(([k, v]) => {
        parsedGroups[Number(k)] = v as TeamGroup
      })
      setGroups(parsedGroups)
    })

    socket.on('groups_updated', (data: any) => {
      const parsedGroups: Record<number, TeamGroup> = {}
      Object.entries(data.groups).forEach(([k, v]) => {
        parsedGroups[Number(k)] = v as TeamGroup
      })
      setGroups(parsedGroups)
    })

    socket.on('team_message', (data: any) => {
      const msg: Message = {
        id: data.message.id,
        sender: data.message.sender,
        text: data.message.text,
        time: data.message.time,
      }
      addMessage(Number(data.team_id), msg)
    })

    socket.on('error', (err: any) => {
      console.error('WS Error:', err)
    })

    return () => {
      socket.disconnect()
    }
  }, [activityId])

  const handleDragStart = (info: DragInfo) => {
    dragInfoRef.current = info
  }

  const handleDragOver = (e: React.DragEvent, teamId: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverTeam !== teamId) {
      setDragOverTeam(teamId)
    }
  }

  const handleDragLeave = () => {
    setDragOverTeam(null)
  }

  const handleDrop = (toTeamId: number) => {
    setDragOverTeam(null)
    const info = dragInfoRef.current
    if (!info) return
    if (info.fromTeamId === toTeamId) return

    moveMember(info.memberId, info.fromTeamId, toTeamId)

    if (socketRef.current && activityId) {
      socketRef.current.emit('manual_move', {
        activity_id: activityId,
        member_id: info.memberId,
        from_team_id: info.fromTeamId,
        to_team_id: toTeamId,
      })
    }

    dragInfoRef.current = null
  }

  const handleSendMessage = (teamId: number, text: string) => {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    const msg: Message = {
      sender: currentSender,
      text,
      time,
    }
    addMessage(teamId, msg)

    if (socketRef.current && activityId) {
      socketRef.current.emit('team_message', {
        activity_id: activityId,
        team_id: teamId,
        sender: currentSender,
        text,
      })
    }
  }

  const totalMembers = useMemo(
    () => Object.values(groups).reduce((sum, g) => sum + g.members.length, 0),
    [groups],
  )

  if (loading) {
    return (
      <div style={pageStyles.loadingWrap}>
        <div style={pageStyles.spinner} />
        <span style={{ color: '#667eea', marginTop: 16 }}>加载中...</span>
      </div>
    )
  }

  const sortedTeams = Object.entries(groups).sort(
    ([a], [b]) => Number(a) - Number(b),
  )

  return (
    <div className="dashboard-page fade-in" style={pageStyles.page}>
      <div style={pageStyles.container}>
        <header style={pageStyles.header}>
          <div>
            <h1 style={pageStyles.title}>团队协作看板</h1>
            <div style={pageStyles.metaRow}>
              <span style={pageStyles.metaItem}>
                <span style={pageStyles.metaDot} />
                {wsConnected ? '实时同步中' : '连接中...'}
              </span>
              <span style={pageStyles.metaItem}>{activityName}</span>
              <span style={pageStyles.metaItem}>
                {Object.keys(groups).length} 个团队 · {totalMembers} 位成员
              </span>
            </div>
          </div>
          <div style={pageStyles.headerActions}>
            <Link to={`/room/${activityId}`} style={pageStyles.ghostBtn}>
              ← 返回房间
            </Link>
            <Link to="/" style={pageStyles.ghostBtn}>
              新建活动
            </Link>
          </div>
        </header>

        <div style={pageStyles.tipBar}>
          <span>💡 提示：拖拽成员头像可调整分组，消息自动同步到所有在线客户端</span>
        </div>

        <div style={pageStyles.gridContainer}>
          {sortedTeams.map(([teamId, team]) => (
            <TeamCard
              key={teamId}
              teamId={Number(teamId)}
              team={team}
              isDragOver={dragOverTeam === Number(teamId)}
              onDragStart={handleDragStart}
              onDragOver={(e) => handleDragOver(e, Number(teamId))}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onSendMessage={handleSendMessage}
              currentSender={currentSender}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const pageStyles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '24px',
  },
  container: {
    maxWidth: '1400px',
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
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontSize: 26,
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
  tipBar: {
    padding: '10px 16px',
    background: 'linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.08))',
    border: '1px solid rgba(102,126,234,0.15)',
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 13,
    color: '#555',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
  },
}

const cardStyles: Record<string, React.CSSProperties> = {
  card: {
    width: '100%',
    minWidth: 280,
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    padding: 0,
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    border: '2px solid transparent',
  },
  cardDragOver: {
    border: '2px dashed #667eea',
    boxShadow: '0 8px 24px rgba(102,126,234,0.2)',
    transform: 'scale(1.01)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  teamNumber: {
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
  },
  memberCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    background: 'rgba(255,255,255,0.2)',
    padding: '3px 10px',
    borderRadius: 999,
  },
  membersContainer: {
    padding: '14px 14px 8px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    maxHeight: 260,
    overflowY: 'auto',
  },
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px 4px 4px',
    background: '#fafafa',
    borderRadius: 999,
    border: '1px solid #eee',
    cursor: 'grab',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    flexShrink: 0,
  },
  memberName: {
    fontSize: 13,
    color: '#333',
    fontWeight: 500,
  },
  emptyTeam: {
    padding: '20px',
    width: '100%',
    textAlign: 'center',
    color: '#bbb',
    fontSize: 13,
  },
  messageSection: {
    borderTop: '1px solid #f0f0f0',
    background: '#fafafa',
    padding: '12px 14px',
  },
  toggleMessagesBtn: {
    width: '100%',
    padding: '6px',
    marginBottom: 8,
    border: 'none',
    background: 'transparent',
    color: '#667eea',
    fontSize: 12,
    cursor: 'pointer',
  },
  messageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    overflowY: 'auto',
    transition: 'max-height 0.3s ease',
    marginBottom: 10,
    paddingRight: 4,
  },
  emptyMessages: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'center',
    padding: '8px 0',
  },
  messageBubble: {
    background: '#fff',
    padding: '8px 10px',
    borderRadius: 10,
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: 700,
    color: '#667eea',
  },
  messageTime: {
    fontSize: 10,
    color: '#bbb',
  },
  messageText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  messageForm: {
    display: 'flex',
    gap: 6,
  },
  messageInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
    background: '#fff',
  },
  sendBtn: {
    padding: '8px 14px',
    border: 'none',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
}

export default Dashboard
