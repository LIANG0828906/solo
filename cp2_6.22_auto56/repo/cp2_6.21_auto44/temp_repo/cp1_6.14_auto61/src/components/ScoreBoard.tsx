import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import clsx from 'clsx'

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

const POINTS_TO_WIN_SET = 21
const SETS_TO_WIN_MATCH = 2

const defaultScore: ScoreState = {
  homeTeam: '主队',
  awayTeam: '客队',
  currentSet: 1,
  homeScore: 0,
  awayScore: 0,
  sets: [],
  isFinished: false,
  winner: null,
  startTime: new Date().toISOString(),
  setsWonHome: 0,
  setsWonAway: 0,
}

export default function ScoreBoard() {
  const [score, setScore] = useState<ScoreState>(defaultScore)
  const [homeBounce, setHomeBounce] = useState(false)
  const [awayBounce, setAwayBounce] = useState(false)
  const [homeShake, setHomeShake] = useState(false)
  const [awayShake, setAwayShake] = useState(false)
  const [homeScoreBounce, setHomeScoreBounce] = useState(false)
  const [awayScoreBounce, setAwayScoreBounce] = useState(false)
  const [setTransition, setSetTransition] = useState(false)
  const localUpdateRef = useRef(false)

  const fetchScore = useCallback(async () => {
    if (localUpdateRef.current) {
      localUpdateRef.current = false
      return
    }
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

  const updateScore = useCallback(async (newScore: ScoreState) => {
    localUpdateRef.current = true
    setScore(newScore)
    try {
      await axios.post('/api/score', newScore)
    } catch {}
  }, [])

  const checkSetWin = useCallback((s: ScoreState): ScoreState => {
    const { homeScore, awayScore } = s
    const diff = Math.abs(homeScore - awayScore)
    const maxScore = Math.max(homeScore, awayScore)

    if (maxScore >= POINTS_TO_WIN_SET && diff >= 2) {
      const setWinner = homeScore > awayScore ? 'home' : 'away'
      const completedSet: SetScore = { home: homeScore, away: awayScore, winner: setWinner }
      const newSetsWonHome = s.setsWonHome + (setWinner === 'home' ? 1 : 0)
      const newSetsWonAway = s.setsWonAway + (setWinner === 'away' ? 1 : 0)

      if (newSetsWonHome >= SETS_TO_WIN_MATCH || newSetsWonAway >= SETS_TO_WIN_MATCH) {
        const matchWinner = newSetsWonHome >= SETS_TO_WIN_MATCH ? s.homeTeam : s.awayTeam
        return {
          ...s,
          sets: [...s.sets, completedSet],
          isFinished: true,
          winner: matchWinner,
          setsWonHome: newSetsWonHome,
          setsWonAway: newSetsWonAway,
        }
      }

      setSetTransition(true)
      setTimeout(() => setSetTransition(false), 600)

      return {
        ...s,
        currentSet: s.currentSet + 1,
        homeScore: 0,
        awayScore: 0,
        sets: [...s.sets, completedSet],
        setsWonHome: newSetsWonHome,
        setsWonAway: newSetsWonAway,
      }
    }

    if (maxScore >= 30) {
      const setWinner = homeScore > awayScore ? 'home' : 'away'
      const completedSet: SetScore = { home: homeScore, away: awayScore, winner: setWinner }
      const newSetsWonHome = s.setsWonHome + (setWinner === 'home' ? 1 : 0)
      const newSetsWonAway = s.setsWonAway + (setWinner === 'away' ? 1 : 0)

      if (newSetsWonHome >= SETS_TO_WIN_MATCH || newSetsWonAway >= SETS_TO_WIN_MATCH) {
        const matchWinner = newSetsWonHome >= SETS_TO_WIN_MATCH ? s.homeTeam : s.awayTeam
        return {
          ...s,
          sets: [...s.sets, completedSet],
          isFinished: true,
          winner: matchWinner,
          setsWonHome: newSetsWonHome,
          setsWonAway: newSetsWonAway,
        }
      }

      setSetTransition(true)
      setTimeout(() => setSetTransition(false), 600)

      return {
        ...s,
        currentSet: s.currentSet + 1,
        homeScore: 0,
        awayScore: 0,
        sets: [...s.sets, completedSet],
        setsWonHome: newSetsWonHome,
        setsWonAway: newSetsWonAway,
      }
    }

    return s
  }, [])

  const handleIncrement = useCallback((side: 'home' | 'away') => {
    if (score.isFinished) return
    const newScore = { ...score }
    if (side === 'home') {
      newScore.homeScore += 1
      setHomeBounce(true)
      setHomeScoreBounce(true)
      setTimeout(() => { setHomeBounce(false); setHomeScoreBounce(false) }, 500)
    } else {
      newScore.awayScore += 1
      setAwayBounce(true)
      setAwayScoreBounce(true)
      setTimeout(() => { setAwayBounce(false); setAwayScoreBounce(false) }, 500)
    }
    const result = checkSetWin(newScore)
    updateScore(result)
  }, [score, checkSetWin, updateScore])

  const handleDecrement = useCallback((side: 'home' | 'away') => {
    if (score.isFinished) return
    if (side === 'home' && score.homeScore <= 0) {
      setHomeShake(true)
      setTimeout(() => setHomeShake(false), 400)
      return
    }
    if (side === 'away' && score.awayScore <= 0) {
      setAwayShake(true)
      setTimeout(() => setAwayShake(false), 400)
      return
    }
    const newScore = { ...score }
    if (side === 'home') {
      newScore.homeScore -= 1
      setHomeShake(true)
      setHomeScoreBounce(true)
      setTimeout(() => { setHomeShake(false); setHomeScoreBounce(false) }, 400)
    } else {
      newScore.awayScore -= 1
      setAwayShake(true)
      setAwayScoreBounce(true)
      setTimeout(() => { setAwayShake(false); setAwayScoreBounce(false) }, 400)
    }
    updateScore(newScore)
  }, [score, updateScore])

  const handleTeamNameChange = useCallback((side: 'home' | 'away', name: string) => {
    const newScore = { ...score }
    if (side === 'home') newScore.homeTeam = name
    else newScore.awayTeam = name
    updateScore(newScore)
  }, [score, updateScore])

  const handleReset = useCallback(async () => {
    const newScore: ScoreState = {
      ...defaultScore,
      startTime: new Date().toISOString(),
    }
    await updateScore(newScore)
    await axios.post('/api/reset')
  }, [updateScore])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={clsx(
          'card-panel p-6 md:p-8',
          !score.isFinished && 'animate-pulse-glow'
        )}
      >
        <div className="text-center mb-4">
          <span className="text-gold/70 text-sm font-medium">
            第 {score.currentSet} 局
            {score.isFinished && ' · 比赛结束'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 md:gap-6">
          {/* Home */}
          <div className="flex-1 text-center">
            <input
              className="w-full bg-transparent text-center text-gold font-bold text-lg md:text-xl
                         border-b border-gold/30 focus:border-gold/60 outline-none pb-1 mb-4
                         placeholder:text-gold/40"
              value={score.homeTeam}
              onChange={(e) => handleTeamNameChange('home', e.target.value)}
              placeholder="主队名称"
              maxLength={10}
            />
            <div
              className={clsx(
                'score-num text-gold inline-block',
                homeScoreBounce && 'animate-score-bounce'
              )}
            >
              {score.homeScore}
            </div>
            <div className="flex justify-center gap-3 mt-4">
              <button
                className={clsx('btn-plus', homeBounce && 'animate-elastic-bounce')}
                onClick={() => handleIncrement('home')}
              >
                +
              </button>
              <button
                className={clsx('btn-minus', homeShake && 'animate-red-shake')}
                onClick={() => handleDecrement('home')}
              >
                −
              </button>
            </div>
          </div>

          {/* VS + Set info */}
          <div className="flex flex-col items-center gap-3 px-2 md:px-6">
            <span className="text-3xl md:text-4xl font-black text-gold/40">VS</span>
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    i < score.currentSet ? 'set-chip-active' : 'set-chip',
                    setTransition && i === score.currentSet - 1 && 'animate-fade-flip'
                  )}
                >
                  {i < score.sets.length ? (
                    <span className="text-xs">
                      {score.sets[i].home}-{score.sets[i].away}
                    </span>
                  ) : i === score.currentSet - 1 ? (
                    <span className="text-xs text-gold">●</span>
                  ) : (
                    <span className="text-xs text-white/30">—</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-4 text-xs text-gold/50 mt-1">
              <span>{score.setsWonHome}胜</span>
              <span>{score.setsWonAway}胜</span>
            </div>
          </div>

          {/* Away */}
          <div className="flex-1 text-center">
            <input
              className="w-full bg-transparent text-center text-gold font-bold text-lg md:text-xl
                         border-b border-gold/30 focus:border-gold/60 outline-none pb-1 mb-4
                         placeholder:text-gold/40"
              value={score.awayTeam}
              onChange={(e) => handleTeamNameChange('away', e.target.value)}
              placeholder="客队名称"
              maxLength={10}
            />
            <div
              className={clsx(
                'score-num text-gold inline-block',
                awayScoreBounce && 'animate-score-bounce'
              )}
            >
              {score.awayScore}
            </div>
            <div className="flex justify-center gap-3 mt-4">
              <button
                className={clsx('btn-plus', awayBounce && 'animate-elastic-bounce')}
                onClick={() => handleIncrement('away')}
              >
                +
              </button>
              <button
                className={clsx('btn-minus', awayShake && 'animate-red-shake')}
                onClick={() => handleDecrement('away')}
              >
                −
              </button>
            </div>
          </div>
        </div>

        {/* Set detail */}
        {score.sets.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gold/10">
            <div className="text-center text-xs text-gold/50 mb-2">各局比分</div>
            <div className="flex justify-center gap-4">
              {score.sets.map((set, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs text-gold/40 mb-1">第{i + 1}局</div>
                  <div className="text-sm font-bold text-gold">
                    {set.home} : {set.away}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset */}
        <div className="mt-6 text-center">
          <button
            className="px-4 py-2 rounded-lg text-sm text-gold/60 border border-gold/20
                       hover:bg-gold/10 hover:text-gold transition-all"
            onClick={handleReset}
          >
            重置比赛
          </button>
        </div>
      </div>
    </div>
  )
}
