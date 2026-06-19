import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import ChatWindow from '../components/ChatWindow'

const AVATAR_COLORS = ['#27AE60', '#2980B9', '#E67E22', '#8E44AD']

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getUserById, currentUser } = useStore()

  if (!id || !currentUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#FFF3E0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>💬</div>
          <div style={{ color: '#8D6E63', marginBottom: 16 }}>请选择一个对话</div>
          <button
            onClick={() => navigate('/chat')}
            style={{
              padding: '10px 28px',
              borderRadius: 20,
              border: 'none',
              background: '#F39C12',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            返回消息列表
          </button>
        </div>
      </div>
    )
  }

  const otherUser = getUserById(id)

  if (!otherUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#FFF3E0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>😕</div>
          <div style={{ color: '#8D6E63', marginBottom: 16 }}>找不到该用户</div>
          <button
            onClick={() => navigate('/chat')}
            style={{
              padding: '10px 28px',
              borderRadius: 20,
              border: 'none',
              background: '#F39C12',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            返回消息列表
          </button>
        </div>
      </div>
    )
  }

  const chatId = [currentUser.id, id].sort().join('-')

  return (
    <div style={{ minHeight: '100vh', background: '#FFF3E0' }}>
      <div
        style={{
          padding: '10px 16px',
          background: 'rgba(255,243,224,0.95)',
          borderBottom: '1px solid #E0C9A6',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,0.05)',
            color: '#3E2723',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#3E2723' }}>
          {otherUser.nickname}
        </span>
      </div>
      <div style={{ height: 'calc(100vh - 140px)' }}>
        <ChatWindow chatId={chatId} otherUser={otherUser} />
      </div>
    </div>
  )
}

export default ChatPage
