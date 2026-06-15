import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import ScoreBoard from '@/components/ScoreBoard'
import { generatePoster, downloadPoster } from '@/utils/posters'

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

export default function RefereePage() {
  const [score, setScore] = useState<ScoreState | null>(null)
  const [showPoster, setShowPoster] = useState(false)
  const posterRef = useRef<HTMLDivElement>(null)

  const fetchScore = useCallback(async () => {
    try {
      const res = await axios.get<ScoreState>('/api/score')
      const prev = score
      setScore(res.data)
      if (!prev?.isFinished && res.data.isFinished) {
        setTimeout(() => setShowPoster(true), 800)
      }
    } catch {}
  }, [score])

  useEffect(() => {
    fetchScore()
    const interval = setInterval(fetchScore, 2000)
    return () => clearInterval(interval)
  }, [fetchScore])

  const handleDownload = useCallback(async () => {
    if (!posterRef.current) return
    await downloadPoster(posterRef.current, 'badminton-match-poster.png')
  }, [])

  const handleClosePoster = useCallback(() => {
    setShowPoster(false)
  }, [])

  const matchDuration = useCallback((startTime: string) => {
    const start = new Date(startTime).getTime()
    const end = Date.now()
    const diff = Math.floor((end - start) / 1000)
    const mins = Math.floor(diff / 60)
    const secs = diff % 60
    return `${mins}分${secs}秒`
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-deep-blue via-deep-blue-light to-deep-blue
                    flex flex-col items-center justify-start pt-8 pb-16 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gold tracking-wide">
          🏸 羽毛球比赛计分
        </h1>
        <p className="text-gold/40 text-sm mt-2">裁判控制面板 · 三局两胜制</p>
      </header>

      <ScoreBoard />

      <div className="mt-8 text-center">
        <a
          href="/audience"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 rounded-xl bg-gold/10 border border-gold/30
                     text-gold font-medium hover:bg-gold/20 transition-all text-sm"
        >
          🎬 打开观众直播页 →
        </a>
      </div>

      {showPoster && score && (
        <div className="poster-overlay" onClick={handleClosePoster}>
          <div className="poster-card" onClick={(e) => e.stopPropagation()}>
            <div ref={posterRef} className="text-center">
              <div className="winner-badge mx-auto mb-4">
                <span className="text-deep-blue font-black text-xl relative z-10">🏆</span>
              </div>
              <h2 className="text-2xl font-black text-gold mb-2">比赛结束</h2>
              <div className="text-gold/70 text-sm mb-6">
                {score.winner} 获胜！
              </div>

              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-gold mb-1">{score.homeTeam}</div>
                  <div className="text-4xl font-black text-gold">{score.setsWonHome}</div>
                </div>
                <div className="text-2xl font-bold text-gold/30">:</div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gold mb-1">{score.awayTeam}</div>
                  <div className="text-4xl font-black text-gold">{score.setsWonAway}</div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {score.sets.map((set, i) => (
                  <div key={i} className="flex justify-center items-center gap-4 text-sm">
                    <span className="text-gold/50">第{i + 1}局</span>
                    <span className="text-gold font-bold">
                      {set.home} : {set.away}
                    </span>
                    <span className="text-gold/40 text-xs">
                      ({set.winner === 'home' ? score.homeTeam : score.awayTeam}胜)
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-gold/40 text-xs">
                比赛时长：{matchDuration(score.startTime)}
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-center">
              <button
                className="px-6 py-2.5 rounded-xl bg-bright-yellow text-deep-blue font-bold
                           hover:bg-bright-yellow-dark transition-colors"
                onClick={handleDownload}
              >
                📥 下载海报
              </button>
              <button
                className="px-6 py-2.5 rounded-xl bg-white/10 text-gold/70 font-medium
                           hover:bg-white/20 transition-colors"
                onClick={handleClosePoster}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
