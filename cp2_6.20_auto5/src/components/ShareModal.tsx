import React, { useState } from 'react'
import type { ColorScheme } from '../types'

interface ShareModalProps {
  scheme: ColorScheme | null
  onClose: () => void
  onToast: (message: string) => void
}

type ExportType = 'css' | 'svg' | 'url'

const ShareModal: React.FC<ShareModalProps> = ({ scheme, onClose, onToast }) => {
  const [exportType, setExportType] = useState<ExportType>('css')

  if (!scheme) return null

  const generateCSS = () => {
    return `:root {
  --color-primary: ${scheme.colors[0]?.hex || '#000000'};
  --color-secondary: ${scheme.colors[1]?.hex || '#000000'};
  --color-accent: ${scheme.colors[2]?.hex || '#000000'};
  --color-muted: ${scheme.colors[3]?.hex || '#000000'};
  --color-highlight: ${scheme.colors[4]?.hex || '#000000'};
}`
  }

  const generateSVG = () => {
    const colors = scheme.colors.slice(0, 5)
    const width = 400
    const height = 120
    const swatchWidth = width / colors.length

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  ${colors
    .map(
      (c, i) => `
  <rect x="${i * swatchWidth}" y="0" width="${swatchWidth}" height="${height}" fill="${c.hex}"/>
  <text x="${i * swatchWidth + swatchWidth / 2}" y="${height - 15}" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="12" font-weight="bold" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5)">${c.hex}</text>`
    )
    .join('')}
  <text x="${width / 2}" y="20" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="14" font-weight="bold" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5)">${scheme.name}</text>
</svg>`
  }

  const generateShareURL = () => {
    const data = btoa(
      JSON.stringify({
        name: scheme.name,
        colors: scheme.colors.map((c) => c.hex),
        tags: scheme.tags
      })
    )
    return `${window.location.origin}${window.location.pathname}?share=${data}`
  }

  const getExportContent = () => {
    switch (exportType) {
      case 'css':
        return generateCSS()
      case 'svg':
        return generateSVG()
      case 'url':
        return generateShareURL()
    }
  }

  const copyToClipboard = async () => {
    const content = getExportContent()
    try {
      await navigator.clipboard.writeText(content)
      onToast('已复制到剪贴板！')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      onToast('已复制到剪贴板！')
    }
  }

  const downloadFile = () => {
    const content = getExportContent()
    let filename = scheme.name
    let mimeType = 'text/plain'

    if (exportType === 'css') {
      filename += '.css'
      mimeType = 'text/css'
    } else if (exportType === 'svg') {
      filename += '.svg'
      mimeType = 'image/svg+xml'
    } else {
      filename += '-share-link.txt'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onToast('文件已下载！')
  }

  return (
    <div className="export-modal" onClick={onClose}>
      <div className="glass export-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h3>分享 / 导出 - {scheme.name}</h3>
        <div className="export-options">
          <button
            className={`btn ${exportType === 'css' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setExportType('css')}
          >
            CSS 变量
          </button>
          <button
            className={`btn ${exportType === 'svg' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setExportType('svg')}
          >
            SVG 色板
          </button>
          <button
            className={`btn ${exportType === 'url' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setExportType('url')}
          >
            分享链接
          </button>
        </div>
        <pre className="export-preview">{getExportContent()}</pre>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={copyToClipboard}>
            复制到剪贴板
          </button>
          <button className="btn btn-success" onClick={downloadFile}>
            下载文件
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
