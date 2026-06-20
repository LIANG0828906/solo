import React from 'react'
import { usePomodoroStore } from '../../store/usePomodoroStore'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = usePomodoroStore()

  const handleWorkDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    updateSettings({ workDuration: value })
  }

  const handleBreakDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    updateSettings({ breakDuration: value })
  }

  const handleDailyGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    updateSettings({ dailyGoal: value })
  }

  return (
    <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
      <div className="settings-header">
        <h2>设置</h2>
        <button className="settings-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="settings-item">
        <div className="settings-label">
          <span>工作时长</span>
          <span className="settings-value">{settings.workDuration} 分钟</span>
        </div>
        <input
          type="range"
          className="settings-slider"
          min="15"
          max="45"
          step="5"
          value={settings.workDuration}
          onChange={handleWorkDurationChange}
        />
      </div>

      <div className="settings-item">
        <div className="settings-label">
          <span>休息时长</span>
          <span className="settings-value">{settings.breakDuration} 分钟</span>
        </div>
        <input
          type="range"
          className="settings-slider"
          min="3"
          max="15"
          step="1"
          value={settings.breakDuration}
          onChange={handleBreakDurationChange}
        />
      </div>

      <div className="settings-item">
        <div className="settings-label">
          <span>每日目标</span>
          <span className="settings-value">{settings.dailyGoal} 个番茄钟</span>
        </div>
        <input
          type="range"
          className="settings-slider"
          min="4"
          max="16"
          step="1"
          value={settings.dailyGoal}
          onChange={handleDailyGoalChange}
        />
      </div>
    </div>
  )
}

export default SettingsPanel
