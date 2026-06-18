import React, { useState, useEffect, useMemo } from 'react'
import eventBus from '../eventBus'
import { useGameStore } from '../game/gameManager'
import QuestionCard from './QuestionCard'
import PlayerList from './PlayerList'
import { v4 } from 'uuid'

export default function QuizRoom() {
  const {
    phase,
    players,
    currentRound,
    totalRounds,
    rankings,
    currentPlayerId,
  } = useGameStore()

  const [nickname, setNickname] = useState('')
  const [showMobileRoster, setShowMobileRoster] = useState(false)
  const [animKey] = useState(v4())

  useEffect(() => {
    setShowMobileRoster(false)
  }, [phase])

  const currentPlayer = useMemo(
    () => players.find((p) => p.id === currentPlayerId),
    [players, currentPlayerId]
  )

  const isHost = useMemo(
    () => players.length > 0 && players[0].isHost && players[0].id === currentPlayerId,
    [players, currentPlayerId]
  )

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return
    eventBus.emit('joinRoom', { nickname: nickname.trim() })
    setNickname('')
  }

  const handleStart = () => {
    eventBus.emit('startGame', {})
  }

  const handleReset = () => {
    eventBus.emit('resetGame', {})
  }

  if (phase === 'waiting') {
    const showJoinForm = players.length === 0 || !currentPlayer

    return (
      <div className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center p-4">
        <div className="glass-panel max-w-2xl w-11/12 p-8 md:p-12">
          <h1 className="neon-title text-5xl md:text-6xl font-black text-center">
            BuzzWise
          </h1>
          <p className="text-center mt-2 mb-8 text-[#A0A0A0] text-[0.9em]">
            在线知识竞技场
          </p>

          {showJoinForm ? (
            <form onSubmit={handleJoin} className="flex flex-col items-center gap-4">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="输入你的昵称"
                maxLength={12}
                className="rounded-xl px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 w-full max-w-sm outline-none focus:border-[#6C63FF] transition-colors"
              />
              <button
                type="submit"
                disabled={!nickname.trim()}
                className="btn-primary px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                加入房间
              </button>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" key={animKey}>
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="glass-panel flex flex-col items-center p-4 animate-bounceIn"
                  >
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl"
                        style={{ backgroundColor: player.avatarColor }}
                      >
                        {player.nickname.charAt(0)}
                      </div>
                      {player.isHost && (
                        <span className="absolute -top-2 -right-2 text-2xl">
                          👑
                        </span>
                      )}
                    </div>
                    <span className="font-semibold mt-2 text-sm text-white truncate max-w-full">
                      {player.nickname}
                    </span>
                  </div>
                ))}
              </div>

              {isHost && (
                <div className="flex flex-col items-center">
                  <button
                    onClick={handleStart}
                    disabled={players.length < 2}
                    className="btn-primary px-8 py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                  >
                    {players.length < 2 ? '等待更多玩家...' : '开始游戏'}
                  </button>
                </div>
              )}
            </>
          )}

          <p className="text-center opacity-60 text-xs mt-8 text-white">
            房间最多容纳 4 人
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'playing' || phase === 'roundEnd') {
    return (
      <div className="min-h-screen w-full flex flex-col lg:flex-row relative">
        <div className="lg:hidden absolute top-4 right-4 z-50">
          <button
            onClick={() => setShowMobileRoster(true)}
            className="bg-white/10 backdrop-blur rounded-full p-3 text-white hover:bg-white/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </button>
        </div>

        {showMobileRoster && (
          <div className="lg:hidden fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 pt-16">
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setShowMobileRoster(false)}
                className="absolute -top-12 right-0 text-white text-2xl hover:text-white/70 transition-colors"
              >
                ✕
              </button>
              <PlayerList />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-start pt-8 lg:pt-12 px-4 pb-4">
          <h2 className="text-center text-lg md:text-xl font-bold mb-6" style={{
            background: 'linear-gradient(90deg, #00DBDE, #FC00FF)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}>
            第 {currentRound + 1} 回合 / 共 {totalRounds} 回合
          </h2>

          <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
            <QuestionCard />
          </div>
        </div>

        <div className="lg:w-[240px] shrink-0 p-4 hidden lg:block">
          <PlayerList />
        </div>

        {phase === 'roundEnd' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-40 pointer-events-none">
            <h2 className="neon-title text-4xl md:text-5xl font-black mb-4">
              回合结束
            </h2>
            <p className="text-white/70 text-lg animate-loadingPulse">
              排名更新中...
            </p>
          </div>
        )}
      </div>
    )
  }

  if (phase === 'result') {
    const displayRankings = rankings.length > 0 ? rankings : [...players].sort((a, b) => b.score - a.score)
    const topThree = displayRankings.slice(0, 3)
    const remainingPlayers = displayRankings.slice(3)

    return (
      <div className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center p-4 py-12">
        <div className="w-full max-w-4xl flex flex-col items-center">
          <h1 className="neon-title text-4xl md:text-5xl font-black mb-10 text-center">
            🏆 最终排名
          </h1>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-end mb-10">
            {topThree.map((player, index) => {
              const avgTime = player.correctCount > 0
                ? (player.totalTime / player.correctCount).toFixed(1)
                : '0.0'
              const cardClass = index === 0 ? 'card-gold' : index === 1 ? 'card-silver' : 'card-bronze'
              const sizeClass = index === 0 ? 'px-8 py-6 scale-110' : 'px-6 py-5'
              const titleText = index === 0 ? '冠 军' : index === 1 ? '亚 军' : '季 军'
              const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
              const nameColor = index === 0 ? '#7B5B00' : index === 1 ? '#4A4A4A' : '#5C3A1A'

              return (
                <div
                  key={player.id}
                  className={`${cardClass} ${sizeClass} rounded-2xl text-center animate-bounceIn text-gray-900`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="text-5xl mb-2">{medalEmoji}</div>
                  <div className="text-2xl font-black mb-1" style={{ color: nameColor }}>
                    {player.nickname}
                  </div>
                  <div className="text-lg font-bold mb-4 opacity-80">{titleText}</div>
                  {index === 0 && (
                    <div className="space-y-1 text-sm font-semibold opacity-90">
                      <div>答对 {player.correctCount} / {totalRounds} 题</div>
                      <div>总得分: {player.score}</div>
                      <div>平均用时: {avgTime}s</div>
                    </div>
                  )}
                  {index !== 0 && (
                    <div className="text-lg font-bold">
                      {player.score} 分
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {remainingPlayers.length > 0 && (
            <div className="w-full max-w-md mb-8 space-y-2">
              {remainingPlayers.map((player, i) => {
                const rank = 3 + i + 1
                return (
                  <div
                    key={player.id}
                    className="glass-panel flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white/60 w-6 text-center">#{rank}</span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
                        style={{ backgroundColor: player.avatarColor }}
                      >
                        {player.nickname.charAt(0)}
                      </div>
                      <span className="font-semibold text-white">{player.nickname}</span>
                    </div>
                    <span className="font-bold text-white">{player.score} 分</span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="w-full max-w-2xl glass-panel p-4 md:p-6 mb-8">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-2 font-semibold opacity-70">排名</th>
                  <th className="text-left py-2 px-2 font-semibold opacity-70">玩家</th>
                  <th className="text-center py-2 px-2 font-semibold opacity-70">答对</th>
                  <th className="text-right py-2 px-2 font-semibold opacity-70">得分</th>
                </tr>
              </thead>
              <tbody>
                {displayRankings.map((player, index) => (
                  <tr key={player.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 px-2">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: index === 0 ? 'rgba(255,215,0,0.2)' : index === 1 ? 'rgba(192,192,192,0.2)' : index === 2 ? 'rgba(205,127,50,0.2)' : 'rgba(255,255,255,0.1)',
                          color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#FFFFFF',
                        }}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                          style={{ backgroundColor: player.avatarColor }}
                        >
                          {player.nickname.charAt(0)}
                        </div>
                        <span className="font-semibold truncate">{player.nickname}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-mono">
                      {player.correctCount} / {totalRounds}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {player.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-white/60 text-sm mb-6">
            本场共进行 {totalRounds} 回合答题
          </p>

          <button
            onClick={handleReset}
            className="btn-play-again px-10 py-4 font-bold text-lg mt-4 hover:brightness-110 transition-all"
          >
            再来一局
          </button>
        </div>
      </div>
    )
  }

  return null
}
