import React from 'react'
import { useMapStore } from '../core/MapEngine'
import { THEMES } from '../types'
import type { ThemeName } from '../types'

const ControlPanel: React.FC = () => {
  const { theme, scale, setTheme, setScale, getNodeList, getConnectionList } = useMapStore()
  const themeData = THEMES[theme]

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as ThemeName)
  }

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseFloat(e.target.value))
  }

  const handleExport = () => {
    const nodes = getNodeList()
    const connections = getConnectionList()

    if (nodes.length === 0) {
      alert('画布为空，无法导出')
      return
    }

    const minX = Math.min(...nodes.map((n) => n.x)) - 50
    const minY = Math.min(...nodes.map((n) => n.y)) - 50
    const maxX = Math.max(...nodes.map((n) => n.x + n.width)) + 50
    const maxY = Math.max(...nodes.map((n) => n.y + n.height)) + 50

    const width = maxX - minX
    const height = maxY - minY

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = themeData.background
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = themeData.gridColor
    ctx.lineWidth = 1
    const gridSize = 20
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    ctx.strokeStyle = themeData.lineColor
    ctx.lineWidth = 2
    connections.forEach((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.fromId)
      const toNode = nodes.find((n) => n.id === conn.toId)
      if (!fromNode || !toNode) return

      const fx = fromNode.x + fromNode.width / 2 - minX
      const fy = fromNode.y + fromNode.height / 2 - minY
      const tx = toNode.x + toNode.width / 2 - minX
      const ty = toNode.y + toNode.height / 2 - minY

      const dx = tx - fx
      const controlOffset = Math.abs(dx) * 0.4

      ctx.beginPath()
      ctx.moveTo(fx, fy)
      ctx.bezierCurveTo(fx + controlOffset, fy, tx - controlOffset, ty, tx, ty)
      ctx.stroke()
    })

    nodes.forEach((node) => {
      const x = node.x - minX
      const y = node.y - minY

      ctx.fillStyle = themeData.nodeFill
      ctx.strokeStyle = 'transparent'
      ctx.lineWidth = 0
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetY = 2

      const radius = 10
      ctx.beginPath()
      ctx.roundRect(x, y, node.width, node.height, radius)
      ctx.fill()

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      ctx.fillStyle = themeData.nodeText
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.title, x + node.width / 2, y + node.height / 2)
    })

    const link = document.createElement('a')
    link.download = 'mindmap.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div
      className="left-panel"
      style={{
        backgroundColor: themeData.panelBg,
        color: themeData.panelText,
        '--line-color': themeData.lineColor,
      } as React.CSSProperties}
    >
      <div className="panel-title" style={{ color: themeData.panelText }}>
        控制面板
      </div>

      <div className="control-panel-section">
        <label className="control-label" style={{ color: themeData.panelText }}>
          主题
        </label>
        <select
          className="theme-select"
          value={theme}
          onChange={handleThemeChange}
          style={{
            backgroundColor: themeData.background,
            color: themeData.panelText,
            borderColor: themeData.gridColor,
          }}
        >
          <option value="blue">清爽蓝</option>
          <option value="orange">暖阳橙</option>
          <option value="purple">暗夜紫</option>
        </select>
      </div>

      <div className="control-panel-section">
        <label className="control-label" style={{ color: themeData.panelText }}>
          缩放
        </label>
        <input
          type="range"
          className="scale-slider"
          min="0.5"
          max="2"
          step="0.01"
          value={scale}
          onChange={handleScaleChange}
          style={{
            background: themeData.gridColor,
            accentColor: themeData.lineColor,
          }}
        />
        <div className="scale-value" style={{ color: themeData.panelText }}>
          {Math.round(scale * 100)}%
        </div>
      </div>

      <div className="control-panel-section">
        <button
          className="export-btn"
          onClick={handleExport}
          style={{ backgroundColor: themeData.lineColor }}
        >
          导出 PNG
        </button>
      </div>
    </div>
  )
}

export default ControlPanel
