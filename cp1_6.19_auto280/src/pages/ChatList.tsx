import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

const AVATAR_COLORS = ['#27AE60', '#2980B9', '#E67E22', '#8E44AD']

const ChatList: React.FC = () => {
  const navigate = useNavigate()
  const { chatMessages, getUserById } = useStore()

  const chatSummaries = Object.entries(chatMessages).map(([chatId, messages]) => {
    const otherUserId = chatId
    const otherUser = getUserById(otherUserId)
    const lastMsg = messages[messages.length - 1]
    const unreadCount = messages.filter(
      (m) => m.sender_id !== 'current' && !m.is_read
    ).length
    return { chatId, otherUser, lastMsg, unreadCount }
  }).filter((c) => c.otherUser && c.lastMsg)

  return (
    <div style={{ minHeight: '100vh', background: '#FFF3E0', paddingBottom: 80 }}>
      <div
        style={{
          padding: '16px 16px 8px',
          background: 'rgba(255,243,224,0.95)',
          borderBottom: '1px solid #E0C9A6',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#3E2723', margin: 0 }}>
          💬 消息
        </h1>
      </div>

      {chatSummaries.length === 0 ? (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            margin: '24px 16px',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
          <div style={{ color: '#8D6E63', fontSize: '0.95rem' }}>暂无消息</div>
          <div style={{ color: '#bbb', fontSize: '0.8rem', marginTop: 4 }}>
            去食材广场看看有什么好食材吧
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 4 }}>
          {chatSummaries.map((chat) => {
            const user = chat.otherUser!
            const time = new Date(chat.lastMsg!.created_at)
            const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
            return (
              <div
                key={chat.chatId}
                onClick={() => navigate(`/chat/${chat.chatId}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  borderBottom: '1px solid rgba(224,201,166,0.4)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(243,156,18,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      background: user.avatar_color || AVATAR_COLORS[0],
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      flexShrink: 0,
                    }}
                  >
                    {user.nickname.charAt(0)}
                  </div>
                  {(user.trust_count ?? 0) > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: -1,
                        right: -4,
                        fontSize: '0.85rem',
                      }}
                    >
                      🛡️
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#3E2723' }}>
                      {user.nickname}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#bbb' }}>{timeStr}</span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#8D6E63',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {chat.lastMsg!.content}
                  </div>
                </div>
                {chat.unreadCount > 0 && (
                  <span
                    style={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      background: '#F39C12',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                      flexShrink: 0,
                    }}
                  >
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ChatList
