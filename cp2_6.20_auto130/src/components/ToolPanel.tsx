import React from 'react'
import { useGameStore } from '../store/gameStore'
import type { ObjectType, TerrainTheme } from '../types'

const tools: { type: ObjectType; label: string; icon: JSX.Element }[] = [
  {
    type: 'player',
    label: '出生点',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="tool-icon">
        <circle cx="12" cy="10" r="5" />
        <path d="M7 22v-4a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    type: 'spike',
    label: '尖刺陷阱',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="tool-icon">
        <path d="M4 20 L8 8 L12 20 Z" />
        <path d="M10 20 L14 6 L18 20 Z" />
      </svg>
    ),
  },
  {
    type: 'movingPlatform',
    label: '移动平台',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="tool-icon">
        <rect x="2" y="10" width="20" height="4" rx="1" />
        <path d="M6 12 L3 9 L3 15 Z" fill="#fff" />
        <path d="M18 12 L21 9 L21 15 Z" fill="#fff" />
      </svg>
    ),
  },
  {
    type: 'coin',
    label: '金币',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="tool-icon">
        <circle cx="12" cy="12" r="8" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">
          $
        </text>
      </svg>
    ),
  },
]

const themes: { type: TerrainTheme; label: string }[] = [
  { type: 'grass', label: '草地' },
  { type: 'stone', label: '石砖' },
  { type: 'dirt', label: '泥土' },
]

const ToolPanel: React.FC = () => {
  const selectedTool = useGameStore((state) => state.selectedTool)
  const setSelectedTool = useGameStore((state) => state.setSelectedTool)
  const terrainTheme = useGameStore((state) => state.terrainTheme)
  const setTerrainTheme = useGameStore((state) => state.setTerrainTheme)
  const clearLevel = useGameStore((state) => state.clearLevel)
  const isPlaying = useGameStore((state) => state.isPlaying)

  const handleToolClick = (type: ObjectType) => {
    if (isPlaying) return
    if (selectedTool === type) {
      setSelectedTool(null)
    } else {
      setSelectedTool(type)
    }
  }

  return (
    <div className="tool-panel">
      <div className="panel-section">
        <div className="panel-title">物件工具</div>
        <div className="tool-buttons">
          {tools.map((tool) => (
            <button
              key={tool.type}
              className={`tool-button ${selectedTool === tool.type ? 'active' : ''}`}
              onClick={() => handleToolClick(tool.type)}
              disabled={isPlaying}
            >
              {tool.icon}
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">地形主题</div>
        <div className="theme-buttons">
          {themes.map((theme) => (
            <button
              key={theme.type}
              className={`theme-button ${theme.type} ${terrainTheme === theme.type ? 'active' : ''}`}
              onClick={() => setTerrainTheme(theme.type)}
              disabled={isPlaying}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">操作提示</div>
        <div className="help-text">
          • 点击格子切换地形填充<br />
          • 选择工具后点击放置物件<br />
          • 点击物件选中，再次点击移动<br />
          • 右键点击物件删除<br />
          • <strong>G键</strong>：填充整行<br />
          • <strong>D键</strong>：清空整列<br />
          • <strong>WASD/方向键</strong>：移动跳跃
        </div>
      </div>

      <div className="panel-section">
        <button
          className="action-button"
          style={{ background: '#555', width: '100%' }}
          onClick={clearLevel}
          disabled={isPlaying}
        >
          清空关卡
        </button>
      </div>
    </div>
  )
}

export default ToolPanel
