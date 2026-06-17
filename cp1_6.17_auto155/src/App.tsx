import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useGameStore } from './store'
import LanternScene from './LanternScene'
import RiddleCard from './RiddleCard'

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getRandomNickname = (): string => {
  const adjectives = ['快乐', '聪明', '勇敢', '可爱', '神秘', '幸运']
  const nouns = ['小灯笼', '猜谜王', '灯谜手', '夜游者', '寻宝人', '智者']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return (adj + noun).slice(0, 6)
}

const App = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { player, lanterns, leaderboard, celebration, actions } = useGameStore()
  const [nicknameInput, setNicknameInput] = useState('')
  const [showCelebrationModal, setShowCelebrationModal] = useState(false)

  useEffect(() => {
    if (celebration) {
      setShowCelebrationModal(true)
    }
  }, [celebration])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (player.nickname && player.startTime) {
      interval = setInterval(() => {
        actions.updateTimer()
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [player.nickname, player.startTime, actions])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (location.pathname === '/leaderboard') {
      actions.fetchLeaderboard()
      interval = setInterval(() => {
        actions.fetchLeaderboard()
      }, 10000)
    }
    return () => clearInterval(interval)
  }, [location.pathname, actions])

  const litCount = lanterns.filter((l) => l.isLit).length

  const handleStartGame = () => {
    const nickname = nicknameInput.trim() || getRandomNickname()
    actions.initGame(nickname.slice(0, 6))
    navigate('/game')
  }

  const handleSaveScore = async () => {
    await actions.saveScore()
    setShowCelebrationModal(false)
    actions.setCelebration(false)
    navigate('/leaderboard')
  }

  if (!player.nickname && location.pathname !== '/leaderboard') {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#FDF5E6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '320px',
            margin: '0 auto',
            backgroundColor: '#FFF8E7',
            padding: '32px',
            borderRadius: '12px',
            border: '2px solid #B8860B',
            boxShadow: '0 8px 24px rgba(139, 69, 19, 0.2)',
          }}
          className="card-enter"
        >
          <h1
            style={{
              textAlign: 'center',
              color: '#D35400',
              marginBottom: '24px',
              fontSize: '28px',
            }}
          >
            🏮 街角巷尾灯笼谜会 🏮
          </h1>
          <p
            style={{
              textAlign: 'center',
              color: '#8B4513',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            点亮所有灯笼，猜中全部灯谜！
          </p>
          <input
            type="text"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value.slice(0, 6))}
            placeholder="输入昵称（限6字符）或随机"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #D4A373',
              fontSize: '14px',
              marginBottom: '16px',
              backgroundColor: '#FFFAF0',
              color: '#5C4033',
              outline: 'none',
            }}
            maxLength={6}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleStartGame()
              }
            }}
          />
          <button
            onClick={handleStartGame}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#D35400',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '12px',
              cursor: 'pointer',
            }}
          >
            开始游戏
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#8B4513',
              color: '#FFFFFF',
              fontSize: '14px',
            }}
          >
            查看排行榜
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FDF5E6',
        position: 'relative',
      }}
    >
      {showCelebrationModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div className="celebration-banner">
            <h2
              style={{
                color: '#FFFFFF',
                fontSize: '36px',
                marginBottom: '16px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              🎉 恭喜通关！🎉
            </h2>
            <p
              style={{
                color: '#FFFFFF',
                fontSize: '20px',
                marginBottom: '8px',
              }}
            >
              全部灯笼已点亮！
            </p>
            <p
              style={{
                color: '#FFFFFF',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '24px',
                fontFamily: 'monospace',
              }}
            >
              总用时：{formatTime(player.timeUsed)}
            </p>
            <button
              onClick={handleSaveScore}
              style={{
                padding: '14px 40px',
                backgroundColor: '#FFFFFF',
                color: '#D35400',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              查看排行榜
            </button>
          </div>
        </div>
      )}

      <div className="app-container">
        <div
          className="sidebar"
          style={{
            backgroundColor: '#FFF8E7',
            borderRight: '3px solid #8B4513',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div>
            <h3
              style={{
                color: '#8B4513',
                fontSize: '14px',
                marginBottom: '4px',
              }}
            >
              玩家昵称
            </h3>
            <p
              style={{
                color: '#D35400',
                fontSize: '18px',
                fontWeight: 'bold',
              }}
            >
              {player.nickname}
            </p>
          </div>
          <div>
            <h3
              style={{
                color: '#8B4513',
                fontSize: '14px',
                marginBottom: '4px',
              }}
            >
              点亮数
            </h3>
            <p
              style={{
                color: '#D35400',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              {litCount} / 6
            </p>
          </div>
          <div>
            <h3
              style={{
                color: '#8B4513',
                fontSize: '14px',
                marginBottom: '4px',
              }}
            >
              总用时
            </h3>
            <p
              style={{
                color: '#D35400',
                fontSize: '18px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
              }}
            >
              {formatTime(player.timeUsed)}
            </p>
          </div>
          <div
            className="sidebar-buttons"
            style={{
              marginTop: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <button
              onClick={() => navigate('/game')}
              style={{
                padding: '10px',
                backgroundColor: location.pathname === '/game' ? '#D35400' : '#8B4513',
                color: '#FFFFFF',
                fontSize: '14px',
              }}
            >
              游戏场景
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              style={{
                padding: '10px',
                backgroundColor: location.pathname === '/leaderboard' ? '#D35400' : '#8B4513',
                color: '#FFFFFF',
                fontSize: '14px',
              }}
            >
              排行榜
            </button>
            {litCount === 6 && !showCelebrationModal && (
              <button
                onClick={handleSaveScore}
                style={{
                  padding: '10px',
                  backgroundColor: '#228B22',
                  color: '#FFFFFF',
                  fontSize: '14px',
                }}
              >
                保存成绩
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: '20px',
            overflow: 'auto',
          }}
        >
          <Routes>
            <Route
              path="/game"
              element={
                <div className="mobile-container">
                  <div className="game-scene-container">
                    <LanternScene />
                    <RiddleCard />
                  </div>
                </div>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <div
                  style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                  }}
                  className="card-enter"
                >
                  <h2
                    style={{
                      color: '#D35400',
                      textAlign: 'center',
                      marginBottom: '24px',
                      fontSize: '28px',
                    }}
                  >
                    🏆 排行榜 🏆
                  </h2>
                  <div
                    style={{
                      backgroundColor: '#FFF8E7',
                      borderRadius: '12px',
                      border: '2px solid #B8860B',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        backgroundColor: '#8B4513',
                        color: '#FFFFFF',
                        padding: '12px 16px',
                        fontWeight: 'bold',
                        height: '50px',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ width: '60px' }}>排名</div>
                      <div style={{ flex: 1 }}>玩家</div>
                      <div style={{ width: '100px', textAlign: 'center' }}>点亮数</div>
                      <div style={{ width: '100px', textAlign: 'right' }}>用时</div>
                    </div>
                    {leaderboard.length === 0 ? (
                      <p
                        style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#8B4513',
                        }}
                      >
                        暂无记录，快来成为第一名吧！
                      </p>
                    ) : (
                      leaderboard.map((entry, index) => (
                        <div
                          key={entry.id}
                          className="leaderboard-row"
                          style={{
                            display: 'flex',
                            padding: '0 16px',
                            alignItems: 'center',
                            borderBottom: '1px solid #D4A373',
                            backgroundColor: index % 2 === 0 ? '#FDF2E9' : '#FAEBD7',
                            animationDelay: `${index * 0.2}s`,
                          }}
                        >
                          <div
                            style={{
                              width: '60px',
                              color: index < 3 ? '#D35400' : '#8B4513',
                              fontWeight: 'bold',
                              fontSize: index < 3 ? '20px' : '16px',
                            }}
                          >
                            {index === 0 && '🏆'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index >= 3 && index + 1}
                          </div>
                          <div
                            style={{
                              flex: 1,
                              color: '#5C4033',
                              fontWeight: index === 0 ? 'bold' : 'normal',
                            }}
                          >
                            {entry.nickname}
                          </div>
                          <div
                            style={{
                              width: '100px',
                              textAlign: 'center',
                              color: '#228B22',
                              fontWeight: 'bold',
                            }}
                          >
                            {entry.litCount} / 6
                          </div>
                          <div
                            style={{
                              width: '100px',
                              textAlign: 'right',
                              color: '#8B4513',
                              fontFamily: 'monospace',
                            }}
                          >
                            {formatTime(entry.timeUsed)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              }
            />
            <Route
              path="*"
              element={
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                  }}
                >
                  <p
                    style={{
                      color: '#8B4513',
                      fontSize: '18px',
                    }}
                  >
                    请先开始游戏
                  </p>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App
