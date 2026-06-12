import React, { useState } from 'react'
import TimerManager from './modules/timer/TimerManager'
import StatsPanel from './modules/stats/StatsPanel'
import SettingsPanel from './modules/settings/SettingsPanel'
import { usePomodoroStore } from './store/usePomodoroStore'

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false)
  const { tags, currentTagId, setCurrentTag, addTag } = usePomodoroStore()
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState('#ff6b6b')

  const colorOptions = [
    '#ff6b6b',
    '#4ecdc4',
    '#a29bfe',
    '#fdcb6e',
    '#00b894',
    '#e17055',
  ]

  const handleAddTag = () => {
    if (newTagName.trim() && tags.length < 6) {
      addTag(newTagName.trim(), selectedColor)
      setNewTagName('')
      setShowAddTag(false)
    }
  }

  const handleCancelAdd = () => {
    setNewTagName('')
    setShowAddTag(false)
  }

  const maxChars = 10
  const remainingChars = maxChars - newTagName.length

  return (
    <div className="app-container">
      <div className="app-header">
        <button
          className="settings-btn"
          onClick={() => setShowSettings(true)}
          title="设置"
        >
          ⚙️
        </button>
      </div>

      <div className="main-content">
        <div className="timer-section">
          <TimerManager />
        </div>

        <div className="tag-section">
          <div className="tag-section-title">任务标签</div>
          {tags.map((tag) => (
            <div
              key={tag.id}
              className={`tag-card ${currentTagId === tag.id ? 'active' : ''}`}
              onClick={() => setCurrentTag(tag.id)}
            >
              <div
                className="tag-card-sidebar"
                style={{ backgroundColor: tag.color }}
              />
              <span className="tag-card-name">{tag.name}</span>
            </div>
          ))}

          {showAddTag ? (
            <div className="tag-input-container">
              <input
                type="text"
                className="tag-input"
                placeholder="输入标签名称"
                value={newTagName}
                onChange={(e) => {
                  if (e.target.value.length <= maxChars) {
                    setNewTagName(e.target.value)
                  }
                }}
                autoFocus
                maxLength={maxChars}
              />
              <div className="color-picker">
                {colorOptions.map((color) => (
                  <div
                    key={color}
                    className={`color-dot ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
              <div className="tag-input-footer">
                <span className="char-count">剩余 {remainingChars} 字</span>
                <div className="tag-input-actions">
                  <button className="cancel-btn" onClick={handleCancelAdd}>
                    取消
                  </button>
                  <button
                    className="confirm-btn"
                    onClick={handleAddTag}
                    disabled={!newTagName.trim()}
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          ) : (
            tags.length < 6 && (
              <button
                className="add-tag-btn"
                onClick={() => setShowAddTag(true)}
              >
                <span>+</span> 添加标签
              </button>
            )
          )}
        </div>
      </div>

      <StatsPanel />

      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {showSettings && (
        <div
          className="modal-overlay"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default App
