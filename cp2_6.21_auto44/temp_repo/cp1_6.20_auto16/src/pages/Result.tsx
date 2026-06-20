import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Trophy, Medal, Clock, Code, ArrowLeft, Home, Loader2, Award, XCircle } from 'lucide-react'

interface PlayerResult {
  id: string
  username: string
  score: number
  timeUsed: number
  passedTests: number
  totalTests: number
  isWinner: boolean
}

export default function Result() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [results, setResults] = useState<PlayerResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/result`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
        }
      } catch (err) {
        console.error('Failed to fetch results:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [roomId, token])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6" style={{ color: '#fbbf24' }} />
      case 1:
        return <Medal className="w-6 h-6" style={{ color: '#9ca3af' }} />
      default:
        return <Award className="w-6 h-6" style={{ color: '#d97706' }} />
    }
  }

  const currentUserResult = results.find(r => r.id === user?.id)
  const winner = results.find(r => r.isWinner)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>加载比赛结果...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/lobby')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回大厅
          </button>
        </div>

        <div className="card p-8 mb-8 text-center">
          <div className="mb-6">
            {winner ? (
              <>
                <Trophy className="w-20 h-20 mx-auto mb-4" style={{ color: '#fbbf24' }} />
                <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  比赛结束！
                </h1>
                <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent-primary)' }}>{winner.username}</span> 获得胜利！
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-20 h-20 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  平局
                </h1>
                <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
                  两位玩家表现相当！
                </p>
              </>
            )}
          </div>

          {currentUserResult && (
            <div
              className="inline-block px-6 py-3 rounded-lg"
              style={{
                backgroundColor: currentUserResult.isWinner ? 'rgba(34, 197, 94, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                border: `1px solid ${currentUserResult.isWinner ? 'var(--success)' : 'var(--accent-primary)'}`,
              }}
            >
              <p className="text-lg font-medium" style={{ color: currentUserResult.isWinner ? 'var(--success)' : 'var(--accent-primary)' }}>
                {currentUserResult.isWinner ? '🎉 恭喜你获胜了！' : '💪 再接再厉！'}
              </p>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>比赛结果</h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {results.map((result, index) => (
              <div
                key={result.id}
                className="p-6"
                style={{
                  backgroundColor: result.id === user?.id ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      {getRankIcon(index)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {result.username}
                        </h3>
                        {result.id === user?.id && (
                          <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-primary)' }}>
                            你
                          </span>
                        )}
                        {result.isWinner && (
                          <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                            冠军
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                          <Clock className="w-4 h-4" />
                          用时: {formatTime(result.timeUsed)}
                        </span>
                        <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                          <Code className="w-4 h-4" />
                          通过: {result.passedTests}/{result.totalTests}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {result.score}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>得分</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => navigate('/lobby')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            返回大厅
          </button>
          <button
            onClick={() => navigate(`/room/${roomId}`)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            再来一局
          </button>
        </div>
      </div>
    </div>
  )
}
