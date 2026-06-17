import { useEffect, useRef } from 'react'
import { useStore } from './store'
import { hslToString, TOTAL_RECIPES, RECIPES } from './GameEngine'

const levelColors: Record<string, string> = {
  success: '#A5D6A7',
  error: '#EF9A9A',
  info: '#FFF9C4',
}

export default function RecipePanel() {
  const selectedMaterials = useStore((s) => s.selectedMaterials)
  const reactionLog = useStore((s) => s.reactionLog)
  const unlockedRecipes = useStore((s) => s.unlockedRecipes)
  const removeMaterial = useStore((s) => s.removeMaterial)
  const clearReaction = useStore((s) => s.clearReaction)

  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [reactionLog.length])

  return (
    <aside className="panel recipe-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="title-icon">⚗️</span>
          炼金配方
        </h2>
        <p className="panel-subtitle">尝试解锁 {TOTAL_RECIPES} 种神秘配方</p>
      </div>

      <div className="section">
        <div className="section-header">
          <h3 className="section-title">坩埚内容</h3>
          <button
            className="clear-btn"
            onClick={clearReaction}
            disabled={selectedMaterials.length === 0}
          >
            清空
          </button>
        </div>

        {selectedMaterials.length === 0 ? (
          <div className="empty-hint">
            <span className="empty-icon">🫗</span>
            <p>坩埚空空如也</p>
            <p className="empty-sub">从左侧选择材料开始炼金</p>
          </div>
        ) : (
          <ul className="selected-list">
            {selectedMaterials.map((mat, idx) => (
              <li
                key={`${mat.id}-${idx}`}
                className="selected-item"
                style={{
                  borderLeftColor: hslToString(mat.color, 1),
                }}
              >
                <span
                  className="item-icon"
                  style={{
                    background: `radial-gradient(circle, ${hslToString(mat.color, 0.35)}, transparent)`,
                  }}
                >
                  {mat.icon}
                </span>
                <span className="item-name">{mat.name}</span>
                <button
                  className="remove-btn"
                  onClick={() => removeMaterial(idx)}
                  aria-label={`移除${mat.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="section">
        <div className="section-header">
          <h3 className="section-title">反应日志</h3>
          <span className="log-count">{reactionLog.length}</span>
        </div>

        <div className="log-container">
          {reactionLog.length === 0 ? (
            <div className="log-empty">暂无反应记录...</div>
          ) : (
            <ul className="log-list">
              {reactionLog.map((entry) => (
                <li
                  key={entry.id}
                  className="log-entry"
                  style={{ color: levelColors[entry.level] }}
                >
                  <span
                    className="log-dot"
                    style={{ background: levelColors[entry.level] }}
                  />
                  <span className="log-text">{entry.text}</span>
                </li>
              ))}
            </ul>
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h3 className="section-title">已解锁配方</h3>
          <span className="unlock-count">
            {unlockedRecipes.length}/{TOTAL_RECIPES}
          </span>
        </div>

        <div className="unlocked-list">
          {RECIPES.map((recipe) => {
            const unlocked = unlockedRecipes.find((r) => r.id === recipe.id)
            return (
              <div
                key={recipe.id}
                className={`unlocked-item ${unlocked ? 'unlocked' : 'locked'}`}
              >
                <div
                  className="recipe-icon"
                  style={{
                    background: unlocked
                      ? `linear-gradient(135deg, ${hslToString(recipe.themeColor, 0.8)}, ${hslToString({ ...recipe.themeColor, l: recipe.themeColor.l + 20 }, 0.4)})`
                      : 'linear-gradient(135deg, #4E342E, #3E2723)',
                    boxShadow: unlocked
                      ? `0 0 12px ${hslToString(recipe.themeColor, 0.5)}`
                      : 'none',
                  }}
                >
                  {unlocked ? '✦' : '?'}
                </div>
                <div className="recipe-info">
                  <div className="recipe-label">
                    {unlocked ? recipe.name : '???'}
                  </div>
                  <div className="recipe-desc-small">
                    {unlocked ? recipe.description : '未解锁'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
