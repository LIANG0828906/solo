import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Users, Play, Clock, Code, CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react'

interface Player {
  id: string
  username: string
  isReady: boolean
  isHost: boolean
  score: number
}

interface Problem {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit: number
}

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [problem, setProblem] = useState<Problem | null>(null)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting')
  const [isReady, setIsReady] = useState(false)
  const [code, setCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  const { send, connected } = useWebSocket({
    url: `ws://localhost:3001?roomId=${roomId}&token=${token}`,
    onMessage: (data: any) => {
      switch (data.type) {
        case 'players':
          setPlayers(data.players)
          const currentPlayer = data.players.find((p: Player) => p.id === user?.id)
          if (currentPlayer) {
            setIsReady(currentPlayer.isReady)
          }
          break
        case 'gameStart':
          setGameStatus('playing')
          setProblem(data.problem)
          setTimeLeft(data.problem.timeLimit)
          setCode('// 在此编写你的代码\n')
          break
        case 'gameEnd':
          setGameStatus('finished')
          setTimeout(() => {
            navigate(`/result/${roomId}`)
          }, 2000)
          break
        case 'timeUpdate':
          setTimeLeft(data.timeLeft)
          break
        case 'submitResult':
          setSubmitted(true)
          break
        case 'error':
          console.error('WebSocket error:', data.message)
          break
      }
    },
    onOpen: () => {
      send({ type: 'joinRoom', roomId, token })
    },
    autoReconnect: true,
  })

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setPlayers(data.players || [])
          setGameStatus(data.status || 'waiting')
          const currentPlayer = data.players?.find((p: Player) => p.id === user?.id)
          if (currentPlayer) {
            setIsReady(currentPlayer.isReady)
          }
        }
      } catch (err) {
        console.error('Failed to fetch room:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRoomData()
  }, [roomId, token, user])

  useEffect(() => {
    if (gameStatus !== 'playing' || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStatus])

  const handleReady = () => {
    send({ type: 'toggleReady', roomId })
    setIsReady(!isReady)
  }

  const handleStartGame = () => {
    send({ type: 'startGame', roomId })
  }

  const handleSubmitCode = () => {
    if (!code.trim() || submitted) return
    send({
      type: 'submitCode',
      roomId,
      code,
    })
    setSubmitted(true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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

  const isHost = players.find(p => p.id === user?.id)?.isHost
  const allReady = players.length >= 2 && players.every(p => p.isReady)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>加载房间信息...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/lobby')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>房间 {roomId}</h1>
            <div className="flex items-center gap-2 text-sm">
              <span
                className="px-2 py-0.5 rounded text-xs"
                style={{
                  backgroundColor: gameStatus === 'waiting' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                  color: gameStatus === 'waiting' ? 'var(--success)' : 'var(--accent-primary)',
                }}
              >
                {gameStatus === 'waiting' ? '等待开始' : gameStatus === 'playing' ? '进行中' : '已结束'}
              </span>
              {!connected && (
                <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
                  连接断开
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {gameStatus === 'playing' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <Clock className="w-5 h-5" style={{ color: timeLeft <= 60 ? 'var(--error)' : 'var(--warning)' }} />
              <span className={`text-xl font-mono font-bold ${timeLeft <= 60 ? 'animate-pulse' : ''}`} style={{ color: timeLeft <= 60 ? 'var(--error)' : 'var(--text-primary)' }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}

          {gameStatus === 'waiting' && (
            <>
              {isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={!allReady}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  开始游戏
                </button>
              ) : (
                <button
                  onClick={handleReady}
                  className={`btn ${isReady ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2`}
                >
                  {isReady ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      已准备
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      准备
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r p-4 overflow-y-auto" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <Users className="w-4 h-4" />
            玩家列表 ({players.length}/2)
          </h3>
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: player.id === user?.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  border: `1px solid ${player.id === user?.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {player.username}
                    {player.isHost && <span className="ml-2 text-xs" style={{ color: 'var(--warning)' }}>房主</span>}
                  </span>
                  {player.isReady ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  ) : (
                    gameStatus === 'waiting' && (
                      <XCircle className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    )
                  )}
                </div>
                {gameStatus === 'playing' && (
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    得分: {player.score}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {gameStatus === 'playing' && problem ? (
            <>
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{problem.title}</h2>
                  <span
                    className="px-3 py-1 rounded text-sm"
                    style={{ backgroundColor: `${getDifficultyColor(problem.difficulty)}20`, color: getDifficultyColor(problem.difficulty) }}
                  >
                    {getDifficultyText(problem.difficulty)}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{problem.description}</p>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  <Code className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>代码编辑器</span>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 w-full p-4 font-mono text-sm resize-none outline-none"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontFamily: "'Consolas', 'Fira Code', monospace",
                    lineHeight: '1.6',
                  }}
                  placeholder="// 在此编写你的代码..."
                  disabled={submitted}
                />
              </div>

              <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {submitted ? '✓ 代码已提交' : '完成后点击提交按钮'}
                </p>
                <button
                  onClick={handleSubmitCode}
                  disabled={!code.trim() || submitted}
                  className="btn btn-primary"
                >
                  {submitted ? '已提交' : '提交代码'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                {gameStatus === 'waiting' ? (
                  <>
                    <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>等待玩家加入</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      {isHost
                        ? allReady
                          ? '所有玩家已准备，点击开始游戏'
                          : '等待所有玩家准备就绪'
                        : isReady
                        ? '已准备，等待房主开始游戏'
                        : '点击准备按钮开始'}
                    </p>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: 'var(--accent-primary)' }} />
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>加载题目...</h2>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
