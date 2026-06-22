import React, { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { exportLevel, importLevel, copyToClipboard } from '../utils/serializer'

interface ExportPanelProps {
  mode: 'export' | 'import'
  onClose: () => void
}

const ExportPanel: React.FC<ExportPanelProps> = ({ mode, onClose }) => {
  const grid = useGameStore((state) => state.grid)
  const objects = useGameStore((state) => state.objects)
  const terrainTheme = useGameStore((state) => state.terrainTheme)
  const loadLevel = useGameStore((state) => state.loadLevel)

  const [jsonText, setJsonText] = useState('')
  const [copied, setCopied] = useState(false)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    if (mode === 'export') {
      const json = exportLevel(grid, objects, terrainTheme)
      setJsonText(json)
    } else {
      setJsonText('')
    }
  }, [mode, grid, objects, terrainTheme])

  const handleCopy = async () => {
    const success = await copyToClipboard(jsonText)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleImport = () => {
    const result = importLevel(jsonText)
    if (result) {
      loadLevel(result)
      setImportError('')
      onClose()
    } else {
      setImportError('JSON格式无效，请检查数据')
    }
  }

  return (
    <div className="export-panel">
      <button className="close-panel" onClick={onClose}>
        ×
      </button>
      <h3>{mode === 'export' ? '导出关卡' : '导入关卡'}</h3>

      <textarea
        className="json-textarea"
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        readOnly={mode === 'export'}
        placeholder={mode === 'import' ? '在此粘贴JSON数据...' : ''}
      />

      {importError && (
        <div style={{ color: '#f44336', fontSize: '12px' }}>{importError}</div>
      )}

      {mode === 'export' ? (
        <button className="copy-button" onClick={handleCopy}>
          {copied ? '已复制!' : '复制到剪贴板'}
        </button>
      ) : (
        <button className="copy-button" onClick={handleImport} style={{ background: '#9c27b0' }}>
          导入关卡
        </button>
      )}
    </div>
  )
}

export default ExportPanel
