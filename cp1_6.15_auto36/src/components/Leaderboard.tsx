import React, { useEffect, useState, useRef } from 'react'
import { X, Trophy, Medal, Award, Sparkles } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { SpellScoring } from '../spellScoring'
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../../shared/types'
import type { ElementType } from '../../shared/types'

interface LeaderboardProps {
  isOpen: boolean
  onClose: () => void
  scoring: SpellScoring
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose, scoring }) => {
  const { leaderboardData, setLeaderboardData, nickname, highScore, currentElement } = useGameStore()
  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showNewRecordParticles, setShowNewRecordParticles] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && highScore > 0 && !hasSubmitted) {
      submitAndFetch()
    }
  }, [isOpen, highScore])

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    const data = await scoring.fetchLeaderboard()
    setLeaderboardData(data)
    setIsLoading(false)
  }

  const submitAndFetch = async () => {
    setHasSubmitted(true)
    const result = await scoring.submitLeaderboard(nickname, Math.min(100, highScore), currentElement)
    if (result.isTopTen) {
      setShowNewRecordParticles(true)
      setTimeout(() => setShowNewRecordParticles(false), 2500)
    }
    await fetchLeaderboard()
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 text-center text-sm font-bold text-white/50">{rank}</span>
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.1))',
          borderColor: 'rgba(255,215,0,0.4)',
          boxShadow: '0 0 25px rgba(255,215,0,0.2)',
        }
      case 2:
        return {
          background: 'linear-gradient(135deg, rgba(192,192,192,0.15), rgba(169,169,169,0.08))',
          borderColor: 'rgba(192,192,192,0.3)',
        }
      case 3:
        return {
          background: 'linear-gradient(135deg, rgba(205,127,50,0.15), rgba(139,69,19,0.08))',
          borderColor: 'rgba(205,127,50,0.3)',
        }
      default:
        return {
          background: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(255,255,255,0.08)',
        }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,5,16,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-md max-h-[80vh] overflow-hidden rounded-3xl border-2"
        style={{
          background: 'linear-gradient(145deg, rgba(26,10,46,0.98), rgba(10,5,16,0.98))',
          borderColor: 'rgba(179,136,255,0.3)',
          boxShadow: '0 0 60px rgba(179,136,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {showNewRecordParticles && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(40)].map((_, i) => (
              <Sparkles
                key={i}
                className="absolute animate-particle-burst"
                style={{
                  top: `${30 + Math.random() * 40}%`,
                  left: `${20 + Math.random() * 60}%`,
                  width: `${8 + Math.random() * 12}px`,
                  height: `${8 + Math.random() * 12}px`,
                  color: ['#ffd700', '#ff8c00', '#ff6b35', '#b388ff'][Math.floor(Math.random() * 4)],
                  animationDelay: `${Math.random() * 0.3}s`,
                  '--burst-angle': `${Math.random() * 360}deg`,
                  '--burst-distance': `${80 + Math.random() * 120}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}

        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                  boxShadow: '0 0 20px rgba(255,215,0,0.4)',
                }}
              >
                <Trophy className="w-6 h-6 text-[#1a0a2e]" />
              </div>
              <div>
                <h2
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: '"Cinzel Decorative", serif' }}
                >
                  魔法排行榜
                </h2>
                <p className="text-xs text-white/50">最强魔法师前十名</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/60 hover:text-white transition-all duration-200 hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {highScore > 0 && (
            <div
              className="mb-4 p-4 rounded-2xl border-2"
              style={{
                background: `linear-gradient(135deg, ${ELEMENT_COLORS[currentElement].primary}15, transparent)`,
                borderColor: `${ELEMENT_COLORS[currentElement].primary}30`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/50 mb-1">本次练习最高匹配度</div>
                  <div
                    className="text-3xl font-black"
                    style={{
                      fontFamily: '"Cinzel Decorative", serif',
                      color: ELEMENT_COLORS[currentElement].primary,
                      textShadow: `0 0 15px ${ELEMENT_COLORS[currentElement].primary}60`,
                    }}
                  >
                    {Math.min(100, highScore)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/50 mb-1">学员</div>
                  <div className="text-sm font-bold text-white/80">{nickname}</div>
                  <div className="text-xs" style={{ color: ELEMENT_COLORS[currentElement].primary }}>
                    {ELEMENT_NAMES[currentElement]}系
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 overflow-y-auto max-h-[50vh] custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-3" />
              <div className="text-sm text-white/50">正在查询排行榜...</div>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-white/20" />
              </div>
              <div className="text-white/60 mb-2">暂无排行数据</div>
              <div className="text-sm text-white/30">成为第一个上榜的魔法师吧！</div>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboardData.map((entry, index) => (
                <div
                  key={entry.rank}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 animate-stagger-in"
                  style={{
                    ...getRankStyle(entry.rank),
                    animationDelay: `${index * 80}ms`,
                  }}
                >
                  <div className="flex-shrink-0 w-8 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold truncate"
                        style={{
                          color: entry.rank <= 3 ? 'white' : 'rgba(255,255,255,0.8)',
                        }}
                      >
                        {entry.nickname}
                      </span>
                      {entry.isNewRecord && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse"
                          style={{
                            background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                            color: '#1a0a2e',
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div
                      className="text-2xl font-black"
                      style={{
                        fontFamily: '"Cinzel Decorative", serif',
                        color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : 'rgba(255,255,255,0.9)',
                        textShadow: entry.rank <= 3 ? `0 0 15px currentColor` : 'none',
                      }}
                    >
                      {entry.score}
                    </div>
                    <div className="text-[10px] text-white/30">匹配度%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="text-[11px] text-center text-white/30">
            排行榜为内存存储，服务器重启后数据将清空
          </div>
        </div>
      </div>
    </div>
  )
}
