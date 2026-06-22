import React, { useState } from 'react'
import { Pencil, MousePointer2, Grid3X3, Download, X } from 'lucide-react'

export type ToolMode = 'brush' | 'select'

interface ToolbarProps {
  mode: ToolMode
  onModeChange: (mode: ToolMode) => void
  brushColor: string
  onBrushColorChange: (color: string) => void
  brushThickness: number
  onBrushThicknessChange: (thickness: number) => void
  onGridAlign: () => void
  onExport: (format: 'png' | 'svg') => void
}

const PRESET_COLORS = [
  '#2c3e50',
  '#e74c3c',
  '#e67e22',
  '#f1c40f',
  '#2ecc71',
  '#3498db',
  '#9b59b6',
  '#1abc9c',
]

const Toolbar: React.FC<ToolbarProps> = ({
  mode,
  onModeChange,
  brushColor,
  onBrushColorChange,
  brushThickness,
  onBrushThicknessChange,
  onGridAlign,
  onExport,
}) => {
  const [showBrushPanel, setShowBrushPanel] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [gridActive, setGridActive] = useState(false)

  const handleBrushClick = () => {
    if (mode === 'brush') {
      setShowBrushPanel(!showBrushPanel)
    } else {
      onModeChange('brush')
      setShowBrushPanel(true)
    }
  }

  const handleSelectClick = () => {
    onModeChange('select')
    setShowBrushPanel(false)
  }

  const handleGridAlign = () => {
    setGridActive(true)
    onGridAlign()
    setTimeout(() => setGridActive(false), 600)
  }

  const handleExport = (format: 'png' | 'svg') => {
    onExport(format)
    setShowExportDialog(false)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <>
      <div style={styles.toolbar}>
        <div style={styles.toolGroup}>
          <button
            style={{
              ...styles.toolButton,
              ...(mode === 'brush' ? styles.activeButton : {}),
            }}
            onClick={handleBrushClick}
            title="画笔工具"
          >
            <Pencil size={20} color={mode === 'brush' ? '#e67e22' : '#6b5f4e'} />
          </button>

          <button
            style={{
              ...styles.toolButton,
              ...(mode === 'select' ? styles.activeButton : {}),
            }}
            onClick={handleSelectClick}
            title="选择工具"
          >
            <MousePointer2 size={20} color={mode === 'select' ? '#e67e22' : '#6b5f4e'} />
          </button>
        </div>

        <div style={styles.divider} />

        <div style={styles.toolGroup}>
          <button
            style={{
              ...styles.toolButton,
              ...(gridActive ? styles.gridActiveButton : {}),
            }}
            onClick={handleGridAlign}
            title="网格对齐"
          >
            <Grid3X3 size={20} color={gridActive ? '#e67e22' : '#6b5f4e'} />
          </button>
        </div>

        <div style={styles.divider} />

        <div style={styles.toolGroup}>
          <button
            style={styles.toolButton}
            onClick={() => setShowExportDialog(true)}
            title="导出"
          >
            <Download size={20} color="#6b5f4e" />
          </button>
        </div>

        {showBrushPanel && (
          <div style={styles.brushPanel}>
            <div style={styles.panelSection}>
              <span style={styles.panelLabel}>笔触粗细</span>
              <div style={styles.sliderContainer}>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushThickness}
                  onChange={(e) => onBrushThicknessChange(Number(e.target.value))}
                  style={styles.slider}
                />
                <span style={styles.sliderValue}>{brushThickness}px</span>
              </div>
            </div>
            <div style={styles.panelSection}>
              <span style={styles.panelLabel}>颜色</span>
              <div style={styles.colorPalette}>
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onBrushColorChange(color)}
                    style={{
                      ...styles.colorSwatch,
                      backgroundColor: color,
                      ...(brushColor === color ? styles.colorSwatchActive : {}),
                      boxShadow:
                        brushColor === color
                          ? `0 0 0 3px rgba(230, 126, 34, 0.4), 0 0 12px rgba(230, 126, 34, 0.5)`
                          : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showExportDialog && (
        <div style={styles.dialogOverlay} onClick={() => setShowExportDialog(false)}>
          <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <span style={styles.dialogTitle}>导出图片</span>
              <button
                style={styles.closeButton}
                onClick={() => setShowExportDialog(false)}
              >
                <X size={18} color="#8a7f6e" />
              </button>
            </div>
            <div style={styles.dialogContent}>
              <button style={styles.exportButton} onClick={() => handleExport('png')}>
                <div style={styles.exportIcon}>🖼️</div>
                <div style={styles.exportText}>
                  <div style={styles.exportFormat}>PNG</div>
                  <div style={styles.exportDesc}>位图格式，适合通用用途</div>
                </div>
              </button>
              <button style={styles.exportButton} onClick={() => handleExport('svg')}>
                <div style={styles.exportIcon}>📐</div>
                <div style={styles.exportText}>
                  <div style={styles.exportFormat}>SVG</div>
                  <div style={styles.exportDesc}>矢量格式，可无限缩放</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div style={styles.toast}>
          ✓ 导出成功！
        </div>
      )}
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    position: 'fixed',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 247, 240, 0.9)',
    borderRadius: 16,
    padding: '8px 10px',
    boxShadow: '0 8px 32px rgba(107, 95, 78, 0.15), 0 2px 8px rgba(107, 95, 78, 0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(212, 203, 184, 0.3)',
  },
  toolGroup: {
    display: 'flex',
    gap: 2,
  },
  toolButton: {
    width: 40,
    height: 40,
    border: 'none',
    background: 'transparent',
    borderRadius: 10,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  activeButton: {
    backgroundColor: 'rgba(230, 126, 34, 0.1)',
  },
  gridActiveButton: {
    backgroundColor: 'rgba(230, 126, 34, 0.15)',
    animation: 'gridPulse 0.6s ease',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(212, 203, 184, 0.5)',
    margin: '0 6px',
  },
  brushPanel: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 8,
    backgroundColor: 'rgba(255, 247, 240, 0.98)',
    borderRadius: 14,
    padding: 16,
    boxShadow: '0 8px 32px rgba(107, 95, 78, 0.18), 0 2px 8px rgba(107, 95, 78, 0.1)',
    minWidth: 240,
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(212, 203, 184, 0.3)',
    zIndex: 1001,
  },
  panelSection: {
    marginBottom: 14,
  },
  panelLabel: {
    display: 'block',
    fontSize: 12,
    color: '#8a7f6e',
    marginBottom: 8,
    fontWeight: 500,
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 4,
    accentColor: '#e67e22',
    cursor: 'pointer',
  },
  sliderValue: {
    fontSize: 13,
    color: '#6b5f4e',
    fontWeight: 600,
    minWidth: 36,
    textAlign: 'right',
  },
  colorPalette: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  colorSwatchActive: {
    transform: 'scale(1.2)',
  },
  dialogOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    backdropFilter: 'blur(4px)',
  },
  dialog: {
    backgroundColor: '#fff7f0',
    borderRadius: 18,
    padding: 0,
    width: 360,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 22px',
    borderBottom: '1px solid rgba(212, 203, 184, 0.4)',
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#4a3f2e',
  },
  closeButton: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 6,
    transition: 'background 0.2s',
  },
  dialogContent: {
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 18px',
    border: '1px solid rgba(212, 203, 184, 0.5)',
    borderRadius: 12,
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  exportIcon: {
    fontSize: 28,
  },
  exportText: {
    flex: 1,
  },
  exportFormat: {
    fontSize: 15,
    fontWeight: 600,
    color: '#4a3f2e',
    marginBottom: 2,
  },
  exportDesc: {
    fontSize: 12,
    color: '#8a7f6e',
  },
  toast: {
    position: 'fixed',
    top: 28,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(46, 204, 113, 0.95)',
    color: 'white',
    padding: '10px 22px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    boxShadow: '0 4px 16px rgba(46, 204, 113, 0.4)',
    zIndex: 3000,
    animation: 'toastIn 0.3s ease',
  },
}

export default Toolbar
