import React, { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { useSimStore } from '../store'

type ToolMode = 'food' | 'toxin' | null

interface ControlPanelProps {
  toolMode: ToolMode
  setToolMode: (mode: ToolMode) => void
}

const getTemperatureColor = (temp: number): string => {
  if (temp < 35) return '#3498DB'
  if (temp < 65) return '#00FF88'
  return '#E74C3C'
}

const ControlPanel: React.FC<ControlPanelProps> = ({ toolMode, setToolMode }) => {
  const temperature = useSimStore((s) => s.temperature)
  const setTemperature = useSimStore((s) => s.setTemperature)
  const cells = useSimStore((s) => s.cells)
  const populationHistory = useSimStore((s) => s.populationHistory)
  const predationEvents = useSimStore((s) => s.predationEvents)
  const initializeCells = useSimStore((s) => s.initializeCells)

  const [tempInput, setTempInput] = useState(temperature)

  const stats = useMemo(() => {
    const alive = cells.filter((c) => c.health > 0)
    const total = alive.length
    const avgRadius = total > 0 ? alive.reduce((sum, c) => sum + c.radius, 0) / total : 0
    return { total, avgRadius }
  }, [cells])

  const chartData = useMemo(() => {
    return populationHistory.map((r) => ({
      time: new Date(r.time).toLocaleTimeString(),
      绿色: r.green,
      紫色: r.purple,
      橙色: r.orange
    }))
  }, [populationHistory])

  const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setTempInput(val)
    setTemperature(val)
  }

  const tempColor = getTemperatureColor(tempInput)

  const panelStyle: React.CSSProperties = {
    backgroundColor: '#16213E',
    borderRadius: '8px',
    padding: '20px',
    color: '#FFFFFF',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxSizing: 'border-box',
    overflowY: 'auto'
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#00FF88',
    margin: 0,
    textAlign: 'center'
  }

  const dividerStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: '#2D3436',
    border: 'none',
    margin: 0
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#AAAAAA',
    margin: '0 0 8px 0'
  }

  const buttonBase: React.CSSProperties = {
    borderRadius: '20px',
    padding: '10px 20px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    color: '#FFFFFF',
    flex: 1
  }

  const getButtonStyle = (mode: ToolMode, activeColor: string): React.CSSProperties => {
    const isActive = toolMode === mode
    return {
      ...buttonBase,
      backgroundColor: isActive ? activeColor : `${activeColor}33`,
      transform: isActive ? 'scale(1.05)' : 'scale(1)',
      opacity: isActive ? 1 : 0.8
    }
  }

  const resetButtonStyle: React.CSSProperties = {
    ...buttonBase,
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
    width: '100%'
  }

  const sliderContainer: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }

  const sliderStyle: React.CSSProperties = {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    background: `linear-gradient(to right, #3498DB 0%, #00FF88 50%, #E74C3C 100%)`,
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none'
  }

  const statGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  }

  const statItem: React.CSSProperties = {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '8px 12px',
    borderRadius: '6px'
  }

  const statLabel: React.CSSProperties = {
    fontSize: '11px',
    color: '#888888',
    margin: 0
  }

  const statValue: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: tempColor,
    margin: '2px 0 0 0'
  }

  const statValueDefault: React.CSSProperties = {
    ...statValue,
    color: '#FFFFFF'
  }

  return (
    <div style={panelStyle}>
      <h2 style={titleStyle}>生态控制台</h2>
      <hr style={dividerStyle} />

      <div>
        <p style={sectionTitleStyle}>操作工具</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={getButtonStyle('food', '#00FF88')}
            onClick={() => setToolMode(toolMode === 'food' ? null : 'food')}
            onMouseEnter={(e) => {
              if (toolMode !== 'food') e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              if (toolMode !== 'food') e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {toolMode === 'food' ? '✓ ' : ''}投放食物
          </button>
          <button
            style={getButtonStyle('toxin', '#9B59B6')}
            onClick={() => setToolMode(toolMode === 'toxin' ? null : 'toxin')}
            onMouseEnter={(e) => {
              if (toolMode !== 'toxin') e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              if (toolMode !== 'toxin') e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {toolMode === 'toxin' ? '✓ ' : ''}添加毒素
          </button>
        </div>
        {toolMode && (
          <p style={{ fontSize: '12px', color: '#888888', margin: '8px 0 0 0' }}>
            点击培养皿中的位置进行{toolMode === 'food' ? '食物投放' : '毒素投放'}
          </p>
        )}
      </div>

      <hr style={dividerStyle} />

      <div>
        <p style={sectionTitleStyle}>
          温度调节 <span style={{ color: tempColor }}>({tempInput}°C)</span>
        </p>
        <div style={sliderContainer}>
          <span style={{ fontSize: '12px', color: '#888888' }}>0</span>
          <input
            type="range"
            min={0}
            max={100}
            value={tempInput}
            onChange={handleTempChange}
            style={sliderStyle}
          />
          <span style={{ fontSize: '12px', color: '#888888' }}>100</span>
        </div>
        <p style={{ fontSize: '11px', color: '#666666', margin: '6px 0 0 0' }}>
          {tempInput < 15
            ? '⚠️ 低温休眠状态 - 细胞停止活动'
            : tempInput > 80
            ? '⚠️ 高温环境 - 代谢加速'
            : '✓ 适宜温度范围'}
        </p>
      </div>

      <hr style={dividerStyle} />

      <div>
        <p style={sectionTitleStyle}>种群趋势（近60秒）</p>
        <div style={{ width: '100%', height: '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3436" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#888888', fontSize: 10 }}
                axisLine={{ stroke: '#2D3436' }}
                tickLine={false}
                style={{ animation: 'fadeIn 0.3s ease' }}
              />
              <YAxis
                tick={{ fill: '#888888', fontSize: 10 }}
                axisLine={{ stroke: '#2D3436' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F0F1A',
                  border: '1px solid #2D3436',
                  borderRadius: '6px',
                  color: '#FFFFFF'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#888888' }} />
              <Line
                type="monotone"
                dataKey="绿色"
                stroke="#00FF88"
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="紫色"
                stroke="#9B59B6"
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="橙色"
                stroke="#FF8C00"
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <hr style={dividerStyle} />

      <div>
        <p style={sectionTitleStyle}>实时统计</p>
        <div style={statGrid}>
          <div style={statItem}>
            <p style={statLabel}>当前温度</p>
            <p style={{ ...statValue, color: tempColor }}>{temperature}°C</p>
          </div>
          <div style={statItem}>
            <p style={statLabel}>总细胞数</p>
            <p style={statValueDefault}>{stats.total}</p>
          </div>
          <div style={statItem}>
            <p style={statLabel}>平均半径</p>
            <p style={statValueDefault}>{stats.avgRadius.toFixed(1)}px</p>
          </div>
          <div style={statItem}>
            <p style={statLabel}>捕食事件(30s)</p>
            <p style={statValueDefault}>{predationEvents.length}</p>
          </div>
        </div>
      </div>

      <hr style={dividerStyle} />

      <button
        style={resetButtonStyle}
        onClick={() => {
          initializeCells()
          setToolMode(null)
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        🔄 重置模拟
      </button>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 0 10px ${tempColor};
          border: 2px solid ${tempColor};
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 0 10px ${tempColor};
          border: 2px solid ${tempColor};
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default ControlPanel
