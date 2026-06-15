import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'
import { downloadPNG, downloadSVG, exportToSVG } from '../utils/exportUtils'

const ExportPanel: React.FC = () => {
  const { board, moveHistory } = useGameStore()
  const [exporting, setExporting] = useState<'png' | 'svg' | null>(null)

  const handleExportPNG = async () => {
    if (moveHistory.length === 0) return
    setExporting('png')
    try {
      const timestamp = new Date().toISOString().slice(0, 10)
      await downloadPNG(board, moveHistory, `墨染棋谱_${timestamp}.png`)
    } catch (error) {
      console.error('导出PNG失败:', error)
      alert('导出失败，请重试')
    } finally {
      setExporting(null)
    }
  }

  const handleExportSVG = () => {
    if (moveHistory.length === 0) return
    setExporting('svg')
    try {
      const svgContent = exportToSVG(board, moveHistory)
      const timestamp = new Date().toISOString().slice(0, 10)
      downloadSVG(svgContent, `墨染棋谱_${timestamp}.svg`)
    } catch (error) {
      console.error('导出SVG失败:', error)
      alert('导出失败，请重试')
    } finally {
      setExporting(null)
    }
  }

  return (
    <motion.div
      className="export-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'linear-gradient(180deg, #faf7f0 0%, #f5f0e6 100%)',
        border: '1px solid #d4c8b8',
        borderRadius: '8px',
        padding: '20px',
        minWidth: '220px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}
    >
      <h2
        style={{
          fontSize: '1.4rem',
          color: '#2c2c2c',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid #c0392b',
          fontFamily: "'Noto Serif SC', 'SimSun', serif",
          fontWeight: 600,
          letterSpacing: '2px'
        }}
      >
        棋谱导出
      </h2>

      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          background: 'rgba(44, 44, 44, 0.03)',
          borderRadius: '6px',
          border: '1px dashed #d4c8b8'
        }}
      >
        <div style={{ fontSize: '0.85rem', color: '#7a7a7a', marginBottom: '8px' }}>
          当前棋局信息
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '6px'
        }}>
          <span style={{ color: '#5a5a5a' }}>总手数</span>
          <span style={{ 
            fontWeight: 'bold', 
            color: '#c0392b',
            fontFamily: 'monospace'
          }}>
            {moveHistory.length} 手
          </span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between'
        }}>
          <span style={{ color: '#5a5a5a' }}>黑子数量</span>
          <span style={{ 
            fontWeight: 'bold', 
            color: '#2c2c2c',
            fontFamily: 'monospace'
          }}>
            {Math.ceil(moveHistory.length / 2)} 子
          </span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between'
        }}>
          <span style={{ color: '#5a5a5a' }}>白子数量</span>
          <span style={{ 
            fontWeight: 'bold', 
            color: '#8b8b8b',
            fontFamily: 'monospace'
          }}>
            {Math.floor(moveHistory.length / 2)} 子
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <motion.button
          whileHover={{ scale: moveHistory.length > 0 ? 1.02 : 1 }}
          whileTap={{ scale: moveHistory.length > 0 ? 0.98 : 1 }}
          onClick={handleExportPNG}
          disabled={moveHistory.length === 0 || exporting === 'png'}
          style={{
            padding: '14px 20px',
            background: moveHistory.length === 0 || exporting === 'png'
              ? '#e0e0e0'
              : 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: moveHistory.length === 0 || exporting === 'png' 
              ? 'not-allowed' 
              : 'pointer',
            fontFamily: "'Noto Serif SC', serif",
            fontSize: '1rem',
            fontWeight: 500,
            opacity: moveHistory.length === 0 ? 0.5 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🖼️</span>
          {exporting === 'png' ? '导出中...' : '导出为图片'}
        </motion.button>

        <motion.button
          whileHover={{ scale: moveHistory.length > 0 ? 1.02 : 1 }}
          whileTap={{ scale: moveHistory.length > 0 ? 0.98 : 1 }}
          onClick={handleExportSVG}
          disabled={moveHistory.length === 0 || exporting === 'svg'}
          style={{
            padding: '14px 20px',
            background: moveHistory.length === 0 || exporting === 'svg'
              ? '#e0e0e0'
              : 'linear-gradient(135deg, #8b7355 0%, #6b5344 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: moveHistory.length === 0 || exporting === 'svg' 
              ? 'not-allowed' 
              : 'pointer',
            fontFamily: "'Noto Serif SC', serif",
            fontSize: '1rem',
            fontWeight: 500,
            opacity: moveHistory.length === 0 ? 0.5 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>📐</span>
          {exporting === 'svg' ? '导出中...' : '导出为SVG'}
        </motion.button>
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '12px',
          background: 'rgba(192, 57, 43, 0.05)',
          borderRadius: '6px',
          fontSize: '0.8rem',
          color: '#7a7a7a',
          lineHeight: 1.6
        }}
      >
        <div style={{ 
          color: '#c0392b', 
          fontWeight: 600, 
          marginBottom: '6px',
          fontFamily: "'Noto Serif SC', serif"
        }}>
          💡 小贴士
        </div>
        PNG格式适合分享和打印，SVG格式为矢量图，可无损放大用于印刷出版。
      </div>

      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #d4c8b8',
          textAlign: 'center'
        }}
      >
        <div style={{
          fontSize: '0.75rem',
          color: '#9a9a9a',
          fontFamily: "'Noto Serif SC', serif",
          letterSpacing: '1px'
        }}>
          墨 染 棋 谱
        </div>
        <div style={{
          fontSize: '0.7rem',
          color: '#bababa',
          marginTop: '4px'
        }}>
          · 水墨丹青 · 落子有声 ·
        </div>
      </div>
    </motion.div>
  )
}

export default ExportPanel
