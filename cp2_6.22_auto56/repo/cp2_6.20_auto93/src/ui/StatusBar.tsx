import React from 'react'

export type ToolMode = 'brush' | 'select' | 'grid'

interface StatusBarProps {
  mode: ToolMode
  selectedCount: number
  mouseX: number
  mouseY: number
  zoom: number
}

const StatusBar: React.FC<StatusBarProps> = ({
  mode,
  selectedCount,
  mouseX,
  mouseY,
  zoom,
}) => {
  const modeText: Record<ToolMode, string> = {
    brush: '画笔模式',
    select: '选择模式',
    grid: '网格对齐',
  }

  return (
    <div style={styles.container}>
      <div style={styles.leftSection}>
        <span style={styles.text}>{modeText[mode]}</span>
        <span style={styles.divider}>|</span>
        <span style={styles.text}>
          选中对象: <strong style={styles.bold}>{selectedCount}</strong>
        </span>
      </div>
      <div style={styles.rightSection}>
        <span style={styles.text}>
          X:<strong style={styles.bold}>{Math.round(mouseX)}</strong>
        </span>
        <span style={styles.text}>
          Y:<strong style={styles.bold}>{Math.round(mouseY)}</strong>
        </span>
        <span style={styles.divider}>|</span>
        <span style={styles.zoomText}>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#f0e8d8',
    borderTop: '1px solid #d4cbb8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    zIndex: 100,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontSize: 12,
    color: '#8a7f6e',
    cursor: 'default',
    transition: 'font-weight 0.2s',
  },
  zoomText: {
    fontSize: 13,
    color: '#8a7f6e',
    fontWeight: 600,
    cursor: 'default',
  },
  bold: {
    fontWeight: 600,
    color: '#6b5f4e',
  },
  divider: {
    color: '#c4b9a6',
    fontSize: 12,
  },
}

export default StatusBar
