import { memo } from 'react'
import { useGameStore } from '../store/game-store'
import { Skull, Coins, Heart } from 'lucide-react'

export const WaveStatsPanel = memo(function WaveStatsPanel() {
  const { showWaveStats, waveStats, wave, closeWaveStats, lives } = useGameStore()

  if (!showWaveStats || !waveStats) return null

  const startWave = waveStats.startWave
  const endWave = waveStats.endWave

  return (
    <div className="wave-stats-overlay">
      <div className="wave-stats-modal-wrapper">
        <div className="wave-stats-modal">
          <h2 className="wave-stats-title">第 {startWave}-{endWave} 波统计</h2>

          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon kill-icon">
                <Skull size={28} />
              </div>
              <div className="stat-info">
                <span className="stat-label">消灭敌人</span>
                <span className="stat-value">{waveStats.enemiesKilled}</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon gold-stat-icon">
                <Coins size={28} />
              </div>
              <div className="stat-info">
                <span className="stat-label">金币收入</span>
                <span className="stat-value gold-text">+{waveStats.goldEarned}</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon lives-stat-icon">
                <Heart size={28} fill="#e53935" />
              </div>
              <div className="stat-info">
                <span className="stat-label">剩余生命</span>
                <span className="stat-value lives-text">{lives}</span>
              </div>
            </div>
          </div>

          <button className="continue-btn" onClick={closeWaveStats}>
            继续游戏
          </button>
        </div>
      </div>
    </div>
  )
})
