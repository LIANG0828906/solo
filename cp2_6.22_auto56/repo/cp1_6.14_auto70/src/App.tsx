import React, { useState } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { useGame } from './context/GameContext'

function HomePage() {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [errors, setErrors] = useState<{ playerName?: string; roomCode?: string }>({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { createGame, joinGame } = useGame()

  const validateForm = () => {
    const newErrors: { playerName?: string; roomCode?: string } = {}
    if (!playerName.trim()) {
      newErrors.playerName = '请输入玩家昵称'
    } else if (playerName.trim().length < 2) {
      newErrors.playerName = '昵称至少2个字符'
    }
    if (activeTab === 'join' && !roomCode.trim()) {
      newErrors.roomCode = '请输入房间号'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      let result
      if (activeTab === 'create') {
        result = await createGame(playerName.trim())
      } else {
        result = await joinGame(roomCode.trim().toUpperCase(), playerName.trim())
      }
      navigate(`/game/${result.roomCode}`)
    } catch (err: any) {
      const msg = err.response?.data?.message || '操作失败，请重试'
      if (activeTab === 'join') {
        setErrors({ roomCode: msg })
      } else {
        setErrors({ playerName: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-container">
      <div className="glass home-card">
        <div className="home-header">
          <h1 className="app-title">
            <span className="title-gold">🎲</span> 大富翁伴侣
          </h1>
          <p className="app-subtitle">与好友一起畅玩经典桌游</p>
        </div>

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            创建房间
          </button>
          <button
            className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            加入房间
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">玩家昵称</label>
            <input
              type="text"
              className={`form-input ${errors.playerName ? 'error' : ''}`}
              placeholder="输入你的昵称"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={12}
            />
            {errors.playerName && <span className="form-error">{errors.playerName}</span>}
          </div>

          {activeTab === 'join' && (
            <div className="form-group">
              <label className="form-label">房间号</label>
              <input
                type="text"
                className={`form-input ${errors.roomCode ? 'error' : ''}`}
                placeholder="输入6位房间号"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              {errors.roomCode && <span className="form-error">{errors.roomCode}</span>}
            </div>
          )}

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : activeTab === 'create' ? (
              '创建房间'
            ) : (
              '加入房间'
            )}
          </button>
        </form>

        <div className="home-footer">
          <p>🎯 支持2-6人在线游玩</p>
        </div>
      </div>
    </div>
  )
}

function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const { state, leaveGame } = useGame()
  const navigate = useNavigate()

  const handleLeave = () => {
    leaveGame()
    navigate('/')
  }

  return (
    <div className="game-container">
      <header className="game-header glass">
        <div className="header-left">
          <button className="btn-back" onClick={handleLeave}>
            ← 返回
          </button>
          <div className="room-info">
            <span className="room-label">房间号</span>
            <span className="room-code">{roomCode}</span>
          </div>
        </div>
        <div className="header-right">
          <span className={`phase-badge phase-${state.phase}`}>
            {state.phase === 'lobby' ? '等待中' : state.phase === 'playing' ? '游戏中' : '已结束'}
          </span>
        </div>
      </header>

      <div className="game-body">
        <div className="game-board glass">
          <div className="board-placeholder">
            <div className="board-placeholder-icon">🎲</div>
            <p>棋盘区域 (70%)</p>
            <span className="placeholder-hint">棋盘内容将在此渲染</span>
          </div>
        </div>

        <aside className="game-sidebar">
          <div className="players-panel glass">
            <h3 className="panel-title">👥 玩家列表</h3>
            <div className="players-list">
              {state.players.length === 0 ? (
                <p className="empty-state">暂无玩家</p>
              ) : (
                state.players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`player-item ${player.isCurrentTurn ? 'current-turn' : ''}`}
                  >
                    <div className="player-avatar">{player.avatar || '🧑'}</div>
                    <div className="player-info">
                      <span className="player-name">
                        {player.name}
                        {player.isCurrentTurn && <span className="turn-indicator">●</span>}
                      </span>
                      <span className="player-role">{player.role || `玩家${index + 1}`}</span>
                    </div>
                    <div className="player-coins">
                      <span className="coin-icon">💰</span>
                      <span className="coin-value">{player.coins}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="logs-panel glass">
            <h3 className="panel-title">📜 游戏日志</h3>
            <div className="logs-list">
              {state.logs.length === 0 ? (
                <p className="empty-state">暂无日志</p>
              ) : (
                state.logs.slice(0, 20).map((log) => (
                  <div key={log.id} className="log-item">
                    <span className="log-time">
                      {new Date(log.timestamp).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    {log.playerName && <span className="log-player">{log.playerName}:</span>}
                    <span className="log-action">{log.action}</span>
                    <span className="log-details">{log.details}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:roomCode" element={<GamePage />} />
      </Routes>
    </div>
  )
}
