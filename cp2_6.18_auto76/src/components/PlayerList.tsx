import React, { useState, useEffect } from 'react'
import { useGameStore } from '../game/gameManager'
import eventBus from '../eventBus'

export default function PlayerList() {
  const [, setTick] = useState(0)
  const { rankings, players, currentPlayerId, currentRound, totalRounds } = useGameStore()

  useEffect(() => {
    const handler = () => {
      setTick((t) => t + 1)
    }
    eventBus.on('rankUpdate', handler)
    return () => {
      eventBus.off('rankUpdate', handler)
    }
  }, [])

  const displayList = rankings.length > 0 ? rankings : [...players].sort((a, b) => b.score - a.score)

  const getScoreColor = (index: number) => {
    if (index === 0) return '#FFD700'
    if (index === 1) return '#C0C0C0'
    if (index === 2) return '#CD7F32'
    return '#FFFFFF'
  }

  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="w-full">
      <div className="lg:hidden mb-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full player-card rounded-2xl p-4 flex items-center justify-between text-white font-bold"
        >
          <span style={{ color: 'rgba(255,255,255,0.95)' }}>🎯 积分榜</span>
          <span className="text-sm opacity-70">{mobileOpen ? '收起' : '展开'}</span>
        </button>
      </div>

      <div className={`${mobileOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="player-card rounded-2xl p-4 w-full">
          <div className="font-bold text-lg mb-3" style={{ color: 'rgba(255,255,255,0.95)' }}>
            🎯 积分榜
          </div>

          {displayList.length === 0 ? (
            <div className="text-center py-8 opacity-60 text-white text-sm">
              等待玩家加入...
            </div>
          ) : (
            displayList.map((player, index) => (
              <div
                key={player.id}
                className={`h-[60px] flex items-center px-3 rounded-xl mb-2 transition-all duration-400 ease transform ${
                  player.id === currentPlayerId ? 'player-highlight' : ''
                }`}
              >
                <div className="flex items-center justify-center w-8">
                  {index === 0 ? (
                    <span className="text-xl">👑</span>
                  ) : (
                    <span className="text-xs opacity-60 text-white font-bold w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                      {index + 1}
                    </span>
                  )}
                </div>

                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base flex-shrink-0"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {player.nickname.charAt(0)}
                </div>

                <div className="flex-1 ml-3 min-w-0">
                  <div className="font-semibold text-white truncate">
                    {player.nickname}
                  </div>
                  <div className="text-xs opacity-70 text-white">
                    答对{player.correctCount}题
                  </div>
                </div>

                <div
                  className="font-bold text-xl flex-shrink-0 ml-2"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    color: getScoreColor(index),
                  }}
                >
                  {player.score}
                </div>
              </div>
            ))
          )}

          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>回合进度</span>
              <span className="font-mono">
                {currentRound + 1} / {totalRounds}
              </span>
            </div>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentRound + 1) / totalRounds) * 100}%`,
                  background: 'linear-gradient(90deg, #8B5CF6, #EC4899)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
