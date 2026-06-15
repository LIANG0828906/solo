import { useState, useEffect } from 'react'
import GameBoard from './GameBoard'
import { GameSettings, loadSettings, saveSettings, DEFAULT_SETTINGS } from './setup'
import { resetUsedPoetry } from './PoetryBank'
import Fireworks from './components/Fireworks'

type Screen = 'menu' | 'game' | 'settings' | 'result'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [finalScores, setFinalScores] = useState<[number, number]>([0, 0])

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const handleStartGame = () => {
    resetUsedPoetry()
    setScreen('game')
  }

  const handleGameEnd = (scores: [number, number]) => {
    setFinalScores(scores)
    setScreen('result')
  }

  const handleBackToMenu = () => {
    setScreen('menu')
  }

  const handleSettingsChange = (newSettings: GameSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
  }

  return (
    <div className="app-container">
      {screen === 'menu' && (
        <MenuScreen
          onStartGame={handleStartGame}
          onSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'game' && (
        <GameBoard
          settings={settings}
          onGameEnd={handleGameEnd}
          onBackToMenu={handleBackToMenu}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onChange={handleSettingsChange}
          onBack={handleBackToMenu}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          scores={finalScores}
          onPlayAgain={handleStartGame}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  )
}

function MenuScreen({
  onStartGame,
  onSettings,
}: {
  onStartGame: () => void
  onSettings: () => void
}) {
  return (
    <div className="menu-screen">
      <div className="menu-decoration-top">
        <div className="ink-blob blob-1" />
        <div className="ink-blob blob-2" />
      </div>

      <h1 className="game-title">
        <span className="title-char">双</span>
        <span className="title-char">人</span>
        <span className="title-char">诗</span>
        <span className="title-char">词</span>
        <span className="title-char">对</span>
        <span className="title-char">决</span>
      </h1>

      <div className="subtitle-container">
        <div className="subtitle-line" />
        <p className="game-subtitle">唐诗宋词 · 双人比拼</p>
        <div className="subtitle-line" />
      </div>

      <div className="menu-buttons">
        <button className="menu-btn primary" onClick={onStartGame}>
          开始对决
        </button>
        <button className="menu-btn secondary" onClick={onSettings}>
          游戏设置
        </button>
      </div>

      <div className="menu-decoration-bottom">
        <p className="menu-hint">两人同机轮流答题，比拼诗词积累与反应速度</p>
      </div>
    </div>
  )
}

function SettingsScreen({
  settings,
  onChange,
  onBack,
}: {
  settings: GameSettings
  onChange: (s: GameSettings) => void
  onBack: () => void
}) {
  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>
          返回
        </button>
        <h2 className="settings-title">游戏设置</h2>
        <div style={{ width: 60 }} />
      </div>

      <div className="settings-content">
        <div className="setting-item">
          <label className="setting-label">每轮时长</label>
          <div className="setting-options">
            {[60, 90, 120].map((duration) => (
              <button
                key={duration}
                className={`setting-option ${settings.roundDuration === duration ? 'active' : ''}`}
                onClick={() => onChange({ ...settings, roundDuration: duration as 60 | 90 | 120 })}
              >
                {duration} 秒
              </button>
            ))}
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">总轮数</label>
          <div className="setting-options">
            {[2, 4, 6].map((rounds) => (
              <button
                key={rounds}
                className={`setting-option ${settings.totalRounds === rounds ? 'active' : ''}`}
                onClick={() => onChange({ ...settings, totalRounds: rounds as 2 | 4 | 6 })}
              >
                {rounds} 轮
              </button>
            ))}
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">音效反馈</label>
          <div className="setting-options">
            <button
              className={`setting-option ${settings.soundEnabled ? 'active' : ''}`}
              onClick={() => onChange({ ...settings, soundEnabled: true })}
            >
              开启
            </button>
            <button
              className={`setting-option ${!settings.soundEnabled ? 'active' : ''}`}
              onClick={() => onChange({ ...settings, soundEnabled: false })}
            >
              关闭
            </button>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <p className="settings-note">设置将自动保存，下次启动时恢复</p>
      </div>
    </div>
  )
}

function ResultScreen({
  scores,
  onPlayAgain,
  onBackToMenu,
}: {
  scores: [number, number]
  onPlayAgain: () => void
  onBackToMenu: () => void
}) {
  const [score1, score2] = scores
  const winner = score1 > score2 ? 0 : score2 > score1 ? 1 : -1
  const [showFireworks, setShowFireworks] = useState(true)

  return (
    <div className="result-screen">
      <Fireworks active={showFireworks} duration={2500} onComplete={() => setShowFireworks(false)} />
      <div className="result-decoration">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              ['--left' as string]: `${5 + (i * 6.2)}%`,
              ['--delay' as string]: `${(i % 5) * 0.4}s`,
              ['--speed' as string]: `${2.5 + (i % 3) * 0.8}s`,
              ['--color' as string]: ['#8b0000', '#b8860b', '#2c1810', '#a52a2a', '#daa520'][i % 5],
              ['--drift' as string]: `${(i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 15)}px`,
              ['--size-w' as string]: `${8 + (i % 4) * 3}px`,
              ['--size-h' as string]: `${10 + (i % 5) * 4}px`,
              ['--rotate-x' as string]: `${(i % 4) * 90}deg`,
              ['--rotate-y' as string]: `${(i % 6) * 60}deg`,
              ['--rotate-z' as string]: `${(i % 8) * 45}deg`,
              borderRadius: i % 3 === 0 ? '50%' : i % 4 === 0 ? '2px' : '0',
            } as React.CSSProperties}
          />
        ))}
      </div>

      <h1 className="result-title">
        {winner === -1 ? '平分秋色！' : `玩家${winner === 0 ? '一' : '二'}获胜！`}
      </h1>

      {winner !== -1 && (
        <div className="winner-badge">
          <span className="winner-text">
            {winner === 0 ? '玩家一' : '玩家二'}
          </span>
          <span className="winner-label"> 胜</span>
        </div>
      )}

      <div className="score-comparison">
        <div className="score-card player1">
          <div className="score-card-label">玩家一</div>
          <div className="score-card-value">{score1}</div>
          <div className="score-card-unit">分</div>
        </div>
        <div className="score-divider">
          <span className="score-vs">VS</span>
        </div>
        <div className="score-card player2">
          <div className="score-card-label">玩家二</div>
          <div className="score-card-value">{score2}</div>
          <div className="score-card-unit">分</div>
        </div>
      </div>

      <div className="score-detail-table">
        <div className="detail-row header">
          <span>玩家</span>
          <span>得分</span>
          <span>评级</span>
        </div>
        <div className="detail-row">
          <span>玩家一</span>
          <span>{score1}</span>
          <span>{getRating(score1)}</span>
        </div>
        <div className="detail-row">
          <span>玩家二</span>
          <span>{score2}</span>
          <span>{getRating(score2)}</span>
        </div>
      </div>

      <div className="result-buttons">
        <button className="menu-btn primary" onClick={onPlayAgain}>
          再来一局
        </button>
        <button className="menu-btn secondary" onClick={onBackToMenu}>
          返回主页
        </button>
      </div>
    </div>
  )
}

function getRating(score: number): string {
  if (score >= 100) return '诗词大家'
  if (score >= 70) return '才华横溢'
  if (score >= 50) return '小有所成'
  if (score >= 30) return '初窥门径'
  return '继续努力'
}
