/*
 * ============================================================
 * 模块调用关系与数据流向
 * ============================================================
 *
 * 职责：
 *   - 渲染左侧浮动控制面板
 *   - 提供心跳速度滑块、暂停/继续按钮、电传导可视化开关
 *   - 监听用户输入并更新 Zustand store
 *
 * 数据流入：
 *   - 从 useHeartStore 读取 heartRate, isPaused, conductionVisible
 *   - 用于同步 UI 控件状态
 *
 * 内部处理：
 *   1. 滑块 onChange -> setHeartRate() 更新 store
 *   2. 按钮 onClick -> togglePause() 切换暂停状态
 *   3. 复选框 onChange -> toggleConduction() 切换传导可视化
 *   4. 按钮按下时 scale(0.95) 缩放反馈，悬停时 opacity 过渡
 *
 * 数据流出：
 *   - 通过 useHeartStore.setHeartRate / togglePause / toggleConduction
 *     更新全局状态
 *   - store 变化触发 simulation.ts 中的订阅回调
 *     进而通过 postMessage 通知 Web Worker
 *
 * 调用方：
 *   - App.tsx 渲染 <Controls /> 组件
 * ============================================================
 */

import { useHeartStore } from '../store/useHeartStore'
import { useState, useCallback } from 'react'

export default function Controls() {
  const { heartRate, isPaused, conductionVisible, setHeartRate, togglePause, toggleConduction } = useHeartStore()
  const [buttonPressed, setButtonPressed] = useState(false)

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setHeartRate(value)
  }, [setHeartRate])

  const handleButtonMouseDown = useCallback(() => {
    setButtonPressed(true)
  }, [])

  const handleButtonMouseUp = useCallback(() => {
    setButtonPressed(false)
  }, [])

  const handleButtonClick = useCallback(() => {
    togglePause()
    setButtonPressed(false)
  }, [togglePause])

  const handleConductionChange = useCallback(() => {
    toggleConduction()
  }, [toggleConduction])

  return (
    <div style={styles.panel}>
      <div style={styles.title}>心脏模拟控制</div>

      <div style={styles.controlGroup}>
        <label style={styles.label}>
          心跳速度: {heartRate.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={heartRate}
          onChange={handleSliderChange}
          style={styles.slider}
        />
        <div style={styles.sliderLabels}>
          <span>0.5x</span>
          <span>3.0x</span>
        </div>
      </div>

      <div style={styles.controlGroup}>
        <button
          onClick={handleButtonClick}
          onMouseDown={handleButtonMouseDown}
          onMouseUp={handleButtonMouseUp}
          onMouseLeave={handleButtonMouseUp}
          style={{
            ...styles.button,
            ...(isPaused ? styles.playButton : styles.pauseButton),
            transform: buttonPressed ? 'scale(0.95)' : 'scale(1)',
          }}
        >
          <span style={styles.buttonIcon}>{isPaused ? '▶' : '⏸'}</span>
          <span>{isPaused ? '继续' : '暂停'}</span>
        </button>
      </div>

      <div style={styles.controlGroup}>
        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={conductionVisible}
            onChange={handleConductionChange}
            style={styles.checkbox}
          />
          <span style={styles.toggleText}>电传导可视化</span>
        </label>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    width: '280px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '20px',
    zIndex: 100,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    opacity: 0.95,
    transition: 'opacity 0.2s ease',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#f8fafc',
    marginBottom: '16px',
    textAlign: 'center',
    borderBottom: '1px solid #334155',
    paddingBottom: '12px',
  },
  controlGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#f8fafc',
    marginBottom: '8px',
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#334155',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '4px',
  },
  button: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 0.1s ease, opacity 0.2s ease',
  },
  pauseButton: {
    backgroundColor: '#475569',
  },
  playButton: {
    backgroundColor: '#3b82f6',
  },
  buttonIcon: {
    fontSize: '16px',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#f8fafc',
    userSelect: 'none',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#3b82f6',
  },
  toggleText: {
    userSelect: 'none',
  },
}
