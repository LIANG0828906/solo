import { useState } from 'react'
import { type Message, useStore } from '@/store'
import { getInitials } from '@/utils/storage'

interface MessageListProps {
  artistId: string
}

const containerStyle: React.CSSProperties = {
  marginTop: '32px',
  padding: '24px',
  backgroundColor: '#1E1E1E',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
}

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  color: '#EAEAEA',
  marginBottom: '20px',
}

const formStyle: React.CSSProperties = {
  marginBottom: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const inputStyle: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#2A2A2A',
  border: '1px solid #3D3D3D',
  borderRadius: '8px',
  color: '#EAEAEA',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s ease',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical',
  fontFamily: 'inherit',
}

const buttonStyle: React.CSSProperties = {
  alignSelf: 'flex-end',
  padding: '10px 24px',
  backgroundColor: '#FF6B6B',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
}

const messagesListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}

const messageItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  padding: '16px',
  backgroundColor: '#252525',
  borderRadius: '8px',
}

const avatarStyle = (color: string): React.CSSProperties => ({
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#333',
  fontSize: '16px',
  fontWeight: 600,
  flexShrink: 0,
})

const messageContentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const messageHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '6px',
}

const visitorNameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  color: '#EAEAEA',
}

const timeStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#888',
}

const messageTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#CCC',
  lineHeight: 1.5,
  wordBreak: 'break-word',
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#666',
  padding: '32px',
  fontSize: '14px',
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

export function MessageList({ artistId }: MessageListProps) {
  const { addMessage, getMessagesByArtist, currentVisitorName, setCurrentVisitorName } = useStore()
  const [name, setName] = useState(currentVisitorName)
  const [content, setContent] = useState('')
  const messages = getMessagesByArtist(artistId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    const visitorName = name.trim() || currentVisitorName
    setCurrentVisitorName(visitorName)
    addMessage({ artistId, visitorName, content: content.trim() })
    setContent('')
  }

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>留言区</h3>
      <form style={formStyle} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="你的昵称"
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
        />
        <textarea
          placeholder="写下你想说的话..."
          style={textareaStyle}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
        />
        <button type="submit" style={buttonStyle}>
          发表留言
        </button>
      </form>

      <div style={messagesListStyle}>
        {messages.length === 0 ? (
          <p style={emptyStyle}>暂无留言，来发表第一条留言吧！</p>
        ) : (
          messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))
        )}
      </div>
    </div>
  )
}

function MessageItem({ message }: { message: Message }) {
  return (
    <div style={messageItemStyle}>
      <div style={avatarStyle(message.avatarColor)}>
        {getInitials(message.visitorName)}
      </div>
      <div style={messageContentStyle}>
        <div style={messageHeaderStyle}>
          <span style={visitorNameStyle}>{message.visitorName}</span>
          <span style={timeStyle}>{formatTime(message.createdAt)}</span>
        </div>
        <p style={messageTextStyle}>{message.content}</p>
      </div>
    </div>
  )
}
