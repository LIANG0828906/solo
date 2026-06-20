import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import BadmintonCanvas from '@/components/BadmintonCanvas'
import BarrageWall from '@/components/BarrageWall'

interface SetScore {
  home: number
  away: number
  winner: string | null
}

interface ScoreState {
  homeTeam: string
  awayTeam: string
  currentSet: number
  homeScore: number
  awayScore: number
  sets: SetScore[]
  isFinished: boolean
  winner: string | null
  startTime: string
  setsWonHome: number
  setsWonAway: number
}

export default function AudiencePage() {
  const [score, setScore] = useState<ScoreState | null>(null)

  const fetchScore = useCallback(async () => {
    try {
      const res = await axios.get<ScoreState>('/api/score')
      setScore(res.data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchScore()
    const interval = setInterval(fetchScore, 2000)
    return () => clearInterval(interval)
  }, [fetchScore])

  return (
    <div className="min-h-screen bg-gradient-to-b from-deep-blue via-deep-blue-light to-deep-blue
                    flex flex-col">
      <header className="text-center py-3 border-b border-gold/10 shrink-0">
        <h1 className="text-xl md:text-2xl font-black text-gold tracking-wide">
          🏸 羽毛球直播
        </h1>
      </header>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Main area: Canvas + Barrage overlay */}
        <div className="flex-1 relative min-h-[50vh] md:min-h-0">
          <BadmintonCanvas score={score} />
          {/* Barrage overlay on top of canvas */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="h-[45%] pointer-events-auto">
              <BarrageWall />
            </div>
          </div>
        </div>

        {/* Right sidebar: Score */}
        <div className="w-full md:w-72 shrink-0 border-t md:border-t-0 md:border-l border-gold/10
                        bg-deep-blue/50">
          <div className="card-panel m-3 p-4">
            <div className="text-center mb-3">
              <span className="text-gold/50 text-xs font-medium">
                第 {score?.currentSet ?? 1} 局
                {score?.isFinished && ' · 比赛结束'}
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-center flex-1">
                <div className="text-sm font-bold text-gold mb-1 truncate px-1">
                  {score?.homeTeam ?? '主队'}
                </div>
                <div className="text-4xl font-black text-gold tabular-nums">
                  {score?.homeScore ?? 0}
                </div>
              </div>
              <div className="text-xl font-bold text-gold/20 px-2">:</div>
              <div className="text-center flex-1">
                <div className="text-sm font-bold text-gold mb-1 truncate px-1">
                  {score?.awayTeam ?? '客队'}
                </div>
                <div className="text-4xl font-black text-gold tabular-nums">
                  {score?.awayScore ?? 0}
                </div>
              </div>
            </div>

            {/* Sets detail */}
            {score && score.sets.length > 0 && (
              <div className="flex justify-center gap-2 mb-2 flex-wrap">
                {score.sets.map((set, i) => (
                  <div key={i} className="text-center set-chip">
                    <div className="text-xs text-gold/40">第{i + 1}局</div>
                    <div className="text-xs font-bold text-gold">{set.home}-{set.away}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center gap-4 text-xs text-gold/40 mt-2">
              <span>{score?.homeTeam ?? '主队'} {score?.setsWonHome ?? 0}胜</span>
              <span>{score?.awayTeam ?? '客队'} {score?.setsWonAway ?? 0}胜</span>
            </div>

            {score?.isFinished && score.winner && (
              <div className="mt-3 text-center">
                <div className="winner-badge mx-auto mb-2">
                  <span className="text-deep-blue font-black text-lg relative z-10">🏆</span>
                </div>
                <span className="text-gold font-bold text-sm">
                  {score.winner} 获胜！
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
