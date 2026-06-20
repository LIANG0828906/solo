import React from 'react'
import { useGameStore, WindType } from '@/store/gameStore'

const HUD: React.FC = () => {
  const status = useGameStore(s => s.status)
  const energy = useGameStore(s => s.energy)
  const distance = useGameStore(s => s.distance)
  const fireflyCount = useGameStore(s => s.fireflyCount)
  const activeWind = useGameStore(s => s.activeWind)
  const highScore = useGameStore(s => s.highScore)
  const leaderboard = useGameStore(s => s.leaderboard)
  const lastTerrain = useGameStore(s => s.lastTerrain)
  const boostReady = useGameStore(s => s.boostReady)
  const unlockedTerrains = useGameStore(s => s.unlockedTerrains)
  const startGame = useGameStore(s => s.startGame)

  if (status === 'menu') {
    return <MenuScreen onStart={startGame} highScore={highScore} unlockedTerrains={unlockedTerrains} />
  }

  if (status === 'gameover') {
    return (
      <GameOverScreen
        distance={distance}
        fireflies={fireflyCount}
        highScore={highScore}
        lastTerrain={lastTerrain}
        onRestart={startGame}
      />
    )
  }

  return (
    <div className="hud-overlay">
      <EnergyBar energy={energy} />
      <WindIndicator wind={activeWind} />
      <StatsPanel distance={distance} fireflies={fireflyCount} boostReady={boostReady} />
      {status === 'paused' && <PauseOverlay />}
      <style>{cssStyles}</style>
    </div>
  )
}

const EnergyBar: React.FC<{ energy: number }> = ({ energy }) => {
  const pct = Math.max(0, Math.min(100, energy))
  const gradient = `conic-gradient(from 135deg, 
    ${pct > 50 ? '#22c55e' : pct > 25 ? '#eab308' : '#ef4444'} ${pct * 2.7}deg, 
    rgba(255,255,255,0.1) ${pct * 2.7}deg 270deg)`

  return (
    <div className={`energy-bar ${energy < 25 ? 'energy-alert' : ''}`}>
      <svg viewBox="0 0 100 100" className="energy-svg">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke={pct > 50 ? '#22c55e' : pct > 25 ? '#eab308' : '#ef4444'}
          strokeWidth="6"
          strokeDasharray={`${pct * 2.51} 251`}
          strokeLinecap="round"
          transform="rotate(135 50 50)"
          filter="url(#glow)"
          style={{ transition: 'stroke-dasharray 0.3s ease, stroke 0.3s ease' }}
        />
        <text x="50" y="55" textAnchor="middle" className="energy-text">{pct}%</text>
      </svg>
      <div className="energy-label">能量</div>
    </div>
  )
}

const WindIndicator: React.FC<{ wind: WindType }> = ({ wind }) => {
  if (!wind) return null

  const config = {
    updraft: { label: '上升气流', icon: '↗', color: '#93C5FD', bg: 'rgba(147, 197, 253, 0.2)' },
    downdraft: { label: '下降气流', icon: '↘', color: '#FB923C', bg: 'rgba(251, 146, 60, 0.2)' },
    tailwind: { label: '顺风加速', icon: '→→', color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.2)' },
  }[wind]

  return (
    <div className="wind-indicator" style={{ backgroundColor: config.bg }}>
      <span className="wind-icon" style={{ color: config.color }}>{config.icon}</span>
      <span className="wind-label" style={{ color: config.color }}>{config.label}</span>
    </div>
  )
}

const StatsPanel: React.FC<{ distance: number; fireflies: number; boostReady: boolean }> = ({ distance, fireflies, boostReady }) => (
  <div className="stats-panel">
    <div className="stat-item">
      <span className="stat-icon">✈️</span>
      <div>
        <div className="stat-value">{distance}m</div>
        <div className="stat-label">飞行距离</div>
      </div>
    </div>
    <div className={`stat-item ${boostReady ? 'boost-ready' : ''}`}>
      <span className="stat-icon firefly-icon">✨</span>
      <div>
        <div className="stat-value">{fireflies}</div>
        <div className="stat-label">{boostReady ? '冲刺就绪!' : '萤火虫'}</div>
      </div>
    </div>
  </div>
)

const MenuScreen: React.FC<{ onStart: () => void; highScore: number; unlockedTerrains: string[] }> = ({ onStart, highScore, unlockedTerrains }) => (
  <div className="screen-overlay">
    <div className="menu-container">
      <h1 className="game-title">
        <span className="title-plane">✈️</span>
        WindWalker
      </h1>
      <p className="game-subtitle">纸飞机的奇幻旅程</p>

      <div className="menu-stats">
        <div className="menu-stat">
          <span className="menu-stat-icon">🏆</span>
          <div>
            <div className="menu-stat-value">{highScore}m</div>
            <div className="menu-stat-label">最高记录</div>
          </div>
        </div>
        <div className="menu-stat">
          <span className="menu-stat-icon">🗺️</span>
          <div>
            <div className="menu-stat-value">{unlockedTerrains.length}/4</div>
            <div className="menu-stat-label">已解锁地形</div>
          </div>
        </div>
      </div>

      <div className="unlocked-list">
        {unlockedTerrains.map(t => (
          <span key={t} className="unlocked-tag">{t}</span>
        ))}
      </div>

      <button className="start-btn" onClick={onStart}>
        开始飞行
      </button>

      <div className="tips">
        <div className="tip-title">玩法提示</div>
        <div className="tip-item">🖱️ 按住鼠标或屏幕上下滑动调整仰角</div>
        <div className="tip-item">✨ 收集萤火虫补充能量和触发冲刺</div>
        <div className="tip-item">💨 借助风力飞得更远</div>
      </div>
    </div>
    <style>{cssStyles}</style>
  </div>
)

const GameOverScreen: React.FC<{
  distance: number
  fireflies: number
  highScore: number
  lastTerrain: string | null
  onRestart: () => void
}> = ({ distance, fireflies, highScore, lastTerrain, onRestart }) => {
  const isNewRecord = distance >= highScore && distance > 0

  return (
    <div className="screen-overlay">
      <div className="gameover-container">
        <h2 className="gameover-title">
          {isNewRecord ? '🎉 新纪录!' : '飞行结束'}
        </h2>

        <div className="result-stats">
          <div className="result-item big">
            <div className="result-value">{distance}<span>m</span></div>
            <div className="result-label">本次距离</div>
          </div>
          <div className="result-row">
            <div className="result-item">
              <div className="result-value">{fireflies}</div>
              <div className="result-label">萤火虫</div>
            </div>
            <div className="result-item">
              <div className="result-value">{highScore}<span>m</span></div>
              <div className="result-label">历史最高</div>
            </div>
          </div>
        </div>

        {lastTerrain && (
          <div className="terrain-unlock">
            <span className="unlock-icon">🔓</span>
            解锁新地形: <strong>{lastTerrain}</strong>
          </div>
        )}

        <button className="start-btn" onClick={onRestart}>
          再来一次
        </button>
      </div>
      <style>{cssStyles}</style>
    </div>
  )
}

const PauseOverlay: React.FC = () => (
  <div className="screen-overlay pause-overlay">
    <div className="pause-text">已暂停</div>
    <style>{cssStyles}</style>
  </div>
)

const cssStyles = `
.hud-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.energy-bar {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 80px;
  text-align: center;
}

.energy-svg {
  width: 80px;
  height: 80px;
  filter: drop-shadow(0 0 10px rgba(0,0,0,0.3));
}

.energy-text {
  font-size: 14px;
  font-weight: bold;
  fill: white;
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
}

.energy-label {
  margin-top: -6px;
  font-size: 11px;
  color: rgba(255,255,255,0.7);
}

.energy-alert .energy-svg {
  animation: pulse-alert 0.8s ease-in-out infinite;
}

@keyframes pulse-alert {
  0%, 100% { filter: drop-shadow(0 0 10px rgba(239,68,68,0.5)); }
  50% { filter: drop-shadow(0 0 20px rgba(239,68,68,0.9)); }
}

.wind-indicator {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 12px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  gap: 8px;
  animation: wind-in 0.3s ease-out;
}

@keyframes wind-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.wind-icon {
  font-size: 20px;
  font-weight: bold;
}

.wind-label {
  font-size: 13px;
  font-weight: 600;
}

.stats-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0,0,0,0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-item.boost-ready {
  background: rgba(252,211,77,0.25);
  animation: boost-glow 1s ease-in-out infinite;
}

@keyframes boost-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(252,211,77,0.3); }
  50% { box-shadow: 0 0 25px rgba(252,211,77,0.6); }
}

.stat-icon {
  font-size: 22px;
}

.firefly-icon {
  animation: twinkle 1.5s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.5) drop-shadow(0 0 6px #FEF08A); }
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 8px rgba(0,0,0,0.5);
}

.stat-label {
  font-size: 10px;
  color: rgba(255,255,255,0.7);
}

.screen-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  padding: 20px;
  animation: fade-in 0.4s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.menu-container, .gameover-container {
  background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 24px;
  padding: 36px 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.game-title {
  font-size: 42px;
  font-weight: 800;
  color: #FDE68A;
  text-shadow: 0 0 30px rgba(253,230,138,0.5);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.title-plane {
  display: inline-block;
  animation: fly 2s ease-in-out infinite;
}

@keyframes fly {
  0%, 100% { transform: rotate(-10deg) translateY(0); }
  50% { transform: rotate(10deg) translateY(-6px); }
}

.game-subtitle {
  font-size: 14px;
  color: rgba(255,255,255,0.6);
  margin-bottom: 24px;
}

.menu-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.menu-stat {
  flex: 1;
  background: rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-stat-icon {
  font-size: 28px;
}

.menu-stat-value {
  font-size: 20px;
  font-weight: bold;
  color: white;
}

.menu-stat-label {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
}

.unlocked-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 24px;
}

.unlocked-tag {
  padding: 4px 10px;
  background: rgba(74,222,128,0.2);
  color: #86efac;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.start-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: white;
  font-size: 18px;
  font-weight: 700;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.1s ease;
  box-shadow: 0 6px 20px rgba(245,158,11,0.4);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245,158,11,0.5);
}

.start-btn:active {
  transform: translateY(0) scale(0.98);
}

.tips {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
  text-align: left;
}

.tip-title {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  font-weight: 600;
  margin-bottom: 10px;
}

.tip-item {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  padding: 4px 0;
}

.gameover-title {
  font-size: 32px;
  font-weight: 800;
  color: #FDE68A;
  margin-bottom: 24px;
}

.result-stats {
  margin-bottom: 20px;
}

.result-item.big {
  background: rgba(253,230,138,0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
}

.result-item.big .result-value {
  font-size: 48px;
  color: #FDE68A;
}

.result-item.big .result-value span {
  font-size: 20px;
  opacity: 0.7;
  margin-left: 2px;
}

.result-row {
  display: flex;
  gap: 12px;
}

.result-row .result-item {
  flex: 1;
  background: rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 14px;
}

.result-value {
  font-size: 24px;
  font-weight: bold;
  color: white;
}

.result-value span {
  font-size: 14px;
  opacity: 0.6;
  margin-left: 2px;
}

.result-label {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  margin-top: 2px;
}

.terrain-unlock {
  background: rgba(74,222,128,0.15);
  border: 1px solid rgba(74,222,128,0.3);
  color: #86efac;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  animation: unlock-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes unlock-pop {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.unlock-icon {
  margin-right: 6px;
}

.pause-overlay {
  background: rgba(0,0,0,0.3);
}

.pause-text {
  font-size: 36px;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 20px rgba(0,0,0,0.5);
  animation: fade-in 0.3s ease-out;
}

@media (max-width: 640px) {
  .energy-bar {
    width: 64px;
    top: 10px;
    left: 10px;
  }
  .energy-svg {
    width: 64px;
    height: 64px;
  }
  .stats-panel {
    top: 10px;
    right: 10px;
  }
  .stat-item {
    padding: 6px 10px;
  }
  .stat-value {
    font-size: 15px;
  }
  .menu-container, .gameover-container {
    padding: 28px 24px;
  }
  .game-title {
    font-size: 32px;
  }
}
`

export default HUD
