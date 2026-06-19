import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Gamepad2, Users, Zap, Plus, Loader2 } from 'lucide-react'

interface Room {
  id: string
  name: string
  players: number
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  difficulty: 'easy' | 'medium' | 'hard'
}

export default function Lobby() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingRoom, setCreatingRoom] = useState(false)
  const navigate = useNavigate()
  const { token } = useAuth()

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms || [])
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    setCreatingRoom(true)
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: '新房间', maxPlayers: 2 }),
      })
      if (response.ok) {
        const data = await response.json()
        navigate(`/room/${data.roomId}`)
      }
    } catch (err) {
      console.error('Failed to create room:', err)
    } finally {
      setCreatingRoom(false)
    }
  }

  const handleJoinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'var(--success)'
      case 'medium':
        return 'var(--warning)'
      case 'hard':
        return 'var(--error)'
      default:
        return 'var(--text-secondary)'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '简单'
      case 'medium':
        return '中等'
      case 'hard':
        return '困难'
      default:
        return difficulty
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return '等待中'
      case 'playing':
        return '进行中'
      case 'finished':
        return '已结束'
      default:
        return status
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            游戏大厅
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            选择一个房间加入，或创建新的对战房间
          </p>
        </div>
        <button
          onClick={handleCreateRoom}
          disabled={creatingRoom}
          className="btn btn-primary flex items-center gap-2"
        >
          {creatingRoom ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          创建房间
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
            <Gamepad2 className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{rooms.length}</p>
            <p style={{ color: 'var(--text-secondary)' }}>可用房间</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 211, 238, 0.1)' }}>
            <Users className="w-8 h-8" style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {rooms.reduce((sum, r) => sum + r.players, 0)}
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>在线玩家</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <Zap className="w-8 h-8" style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {rooms.filter(r => r.status === 'playing').length}
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>进行中的对战</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>房间列表</h2>
        </div>
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center">
            <Gamepad2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>暂无可用房间</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>点击上方按钮创建第一个房间</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-4 flex items-center justify-between hover:bg-opacity-10 transition-colors"
                style={{ backgroundColor: 'var(--bg-card)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <Gamepad2 className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>{room.name}</h3>
                    <div className="flex items-center gap-3 text-sm mt-1">
                      <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <Users className="w-3.5 h-3.5" />
                        {room.players}/{room.maxPlayers}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: `${getDifficultyColor(room.difficulty)}20`, color: getDifficultyColor(room.difficulty) }}
                      >
                        {getDifficultyText(room.difficulty)}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: room.status === 'waiting' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                          color: room.status === 'waiting' ? 'var(--success)' : 'var(--accent-primary)',
                        }}
                      >
                        {getStatusText(room.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={room.status !== 'waiting' || room.players >= room.maxPlayers}
                  className="btn btn-primary"
                >
                  加入
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
