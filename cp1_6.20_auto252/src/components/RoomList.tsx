import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface RoomInfo {
  id: string
  name: string
  onlineCount: number
  createdAt: string
}

export default function RoomList() {
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [nickname, setNickname] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/rooms')
      .then(r => r.json())
      .then(setRooms)
      .catch(() => {})
  }, [])

  const handleJoin = async (roomId: string) => {
    const nick = nickname.trim() || `学员${Math.floor(Math.random() * 9000 + 1000)}`
    const userId = localStorage.getItem('study_user_id') || crypto.randomUUID()
    localStorage.setItem('study_user_id', userId)
    localStorage.setItem('study_nickname', nick)

    const res = await fetch(`/api/rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, nickname: nick }),
    })
    const data = await res.json()
    localStorage.setItem('study_user_id', data.userId || userId)
    navigate(`/rooms/${roomId}`)
  }

  return (
    <div className="room-list-page">
      <header className="page-header">
        <h1>📚 在线自习室</h1>
        <p>专注学习，一起进步</p>
      </header>

      <div className="nickname-input-bar">
        <input
          type="text"
          placeholder="输入你的昵称（可选）"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          className="nickname-input"
          maxLength={12}
        />
      </div>

      <div className="room-grid">
        {rooms.map(room => (
          <div
            key={room.id}
            className="room-card"
            onClick={() => handleJoin(room.id)}
          >
            <h2 className="room-card-name">{room.name}</h2>
            <div className="room-card-info">
              <span className="online-badge">{room.onlineCount} 在线</span>
              <span className="room-time">
                {new Date(room.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
