import React from 'react'
import { RuneColor, SkillState, GameStateSnapshot } from './GameBoard'

const RUNE_COLORS: Record<RuneColor, string> = {
  red: '#ff4757',
  blue: '#1e90ff',
  green: '#2ed573',
  yellow: '#ffa502',
  purple: '#a55eea',
}

interface GameUIProps {
  state: GameStateSnapshot
  onUseSkill: (skillId: string) => void
  onRestart: () => void
  children?: React.ReactNode
}

function getStarRating(score: number): number {
  if (score >= 5000) return 3
  if (score >= 2000) return 2
  if (score >= 500) return 1
  return 0
}

const GameUI: React.FC<GameUIProps> = ({ state, onUseSkill, onRestart, children }) => {
  const { score, combo, nextRune, skills, gameOver, totalCleared } = state
  const stars = getStarRating(score)

  return (
    <>
      <div className="top-bar">
        <div className="game-title">✨ 魔法符文熔炉 ✨</div>
        <div className="next-preview">
          <div className="next-preview-label">下一块</div>
          <div className="next-rune-container">
            <div
              className="next-rune"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${RUNE_COLORS[nextRune]}, ${shadeColor(RUNE_COLORS[nextRune], -30)})`,
                boxShadow: `0 0 15px ${RUNE_COLORS[nextRune]}80`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="game-content">
        <div className="side-panel">
          <div className="panel-section">
            <div className="panel-label">分数</div>
            <div className={`score-value ${score > 0 ? 'pop' : ''}`} key={score}>
              {score.toLocaleString()}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">连击</div>
            <div className={`combo-value ${combo >= 3 ? 'highlight' : ''}`} key={combo}>
              x{combo}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">技能</div>
            <div className="skills-container">
              {skills.map(skill => {
                const isReady = skill.fragments >= skill.maxFragments
                const progress = (skill.fragments / skill.maxFragments) * 100
                return (
                  <div
                    key={skill.id}
                    className={`skill-slot ${isReady ? 'ready' : ''} ${!isReady ? 'disabled' : ''}`}
                    onClick={() => isReady && onUseSkill(skill.id)}
                  >
                    <div
                      className="skill-icon"
                      style={{
                        background: `linear-gradient(135deg, ${skill.color}40, ${skill.color}20)`,
                        border: `1px solid ${skill.color}60`,
                      }}
                    >
                      {skill.icon}
                    </div>
                    <div className="skill-info">
                      <div className="skill-name">{skill.name}</div>
                      <div className="skill-progress">
                        <div
                          className="skill-progress-fill"
                          style={{
                            width: `${progress}%`,
                            background: isReady
                              ? `linear-gradient(90deg, ${skill.color}, #ffd700)`
                              : skill.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        {children}
      </div>

      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-panel">
            <div className="game-over-title">🏆 游戏结束 🏆</div>
            <div className="stars-container">
              {[1, 2, 3].map(i => (
                <span key={i} className={`star ${stars >= i ? 'earned' : ''}`} style={{ animationDelay: `${i * 0.2}s` }}>
                  ★
                </span>
              ))}
            </div>
            <div className="game-over-stats">
              <div className="stat-row">
                <span className="stat-label">最终分数</span>
                <span className="stat-value">{score.toLocaleString()}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">消除符文</span>
                <span className="stat-value">{totalCleared} 个</span>
              </div>
            </div>
            <button className="restart-btn" onClick={onRestart}>
              再来一局
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = ((num >> 8) & 0x00ff) + amt
  const B = (num & 0x0000ff) + amt
  return (
    '#' +
    (0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255))
      .toString(16)
      .slice(1)
  )
}

export default GameUI
