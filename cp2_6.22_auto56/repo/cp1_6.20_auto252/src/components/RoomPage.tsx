import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Timer from './Timer'
import Leaderboard from './Leaderboard'

export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [roomName, setRoomName] = useState('')
  const [onlineCount, setOnlineCount] = useState(0)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const uid = localStorage.getItem('study_user_id') || ''
    setUserId(uid)

    fetch(`/api/rooms/${roomId}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.name) setRoomName(data.name)
      })
      .catch(() => {})
  }, [roomId])

  const fetchOnline = useCallback(() => {
    fetch(`/api/rooms/${roomId}/online`)
      .then(r => r.json())
      .then(data => data && setOnlineCount(data.onlineCount))
      .catch(() => {})
  }, [roomId])

  useEffect(() => {
    fetchOnline()
    const interval = setInterval(fetchOnline, 10000)
    return () => clearInterval(interval)
  }, [fetchOnline])

  const handleLeave = async () => {
    const uid = localStorage.getItem('study_user_id') || ''
    await fetch(`/api/rooms/${roomId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: uid }),
    })
    navigate('/')
  }

  return (
    <div className="room-page">
      <header className="room-header">
        <h1 className="room-title">
          {roomName || '自习室'}
          <span className="online-count-badge">{onlineCount}</span>
        </h1>
      </header>

      <div className="room-content">
        <div className="room-left">
          <Timer roomId={roomId!} userId={userId} onLeave={handleLeave} />
        </div>
        <div className="room-right">
          <Leaderboard roomId={roomId!} />
        </div>
      </div>
    </div>
  )
}
