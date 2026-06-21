import { useState, useCallback, useRef, useEffect } from 'react'
import { parseColorsAsync } from '../utils/parser'
import type { ColorItem } from '../utils/parser'
import './ColorInput.css'

interface ColorInputProps {
  onColorsParsed: (colors: ColorItem[]) => void
}

export default function ColorInput({ onColorsParsed }: ColorInputProps) {
  const [cssText, setCssText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [colorCount, setColorCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleParse = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        onColorsParsed([])
        setColorCount(0)
        return
      }

      setIsParsing(true)
      try {
        const colors = await parseColorsAsync(text)
        onColorsParsed(colors)
        setColorCount(colors.length)
      } catch (e) {
        console.error('Parse error:', e)
        onColorsParsed([])
        setColorCount(0)
      } finally {
        setIsParsing(false)
      }
    },
    [onColorsParsed]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      handleParse(cssText)
    }, 300)
    return () => clearTimeout(timer)
  }, [cssText, handleParse])

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCssText(e.target.value)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        const file = files[0]
        if (file.type === 'text/plain' || file.name.endsWith('.css') || file.name.endsWith('.txt')) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const text = event.target?.result as string
            setCssText(text)
          }
          reader.readAsText(file)
        }
      }
    },
    []
  )

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setCssText(text)
      }
      reader.readAsText(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleClear = useCallback(() => {
    setCssText('')
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleLoadSample = useCallback(() => {
    const sampleCSS = `:root {
  --primary-color: #3B82F6;
  --secondary-color: #10B981;
  --accent-color: #F59E0B;
  --background: #F8FAFC;
  --surface: #FFFFFF;
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --border-color: #E2E8F0;
  --success: rgb(34, 197, 94);
  --warning: hsl(38, 92%, 50%);
  --error: rgba(239, 68, 68, 1);
  --info: hsla(217, 91%, 60%, 0.8);
}

.button {
  background-color: #3B82F6;
  color: white;
  border: 2px solid #2563EB;
  border-radius: 8px;
}

.button:hover {
  background-color: #2563EB;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  padding: 24px;
  border-radius: 12px;
}

.nav {
  background-color: #1E293B;
  color: #CBD5E1;
}

.nav-link {
  color: #94A3B8;
}

.nav-link:hover {
  color: #F1F5F9;
  background-color: #334155;
}

.alert-success {
  background-color: #D1FAE5;
  color: #065F46;
  border-left: 4px solid #10B981;
}

.alert-error {
  background-color: #FEE2E2;
  color: #991B1B;
  border-left: 4px solid #EF4444;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 9999px;
  background-color: #E0E7FF;
  color: #3730A3;
}
`
    setCssText(sampleCSS)
  }, [])

  return (
    <div className="color-input-container">
      <div className="color-input-header">
        <h2 className="color-input-title">CSS 输入</h2>
        <div className="color-input-actions">
          <button className="action-btn secondary" onClick={handleLoadSample} title="加载示例">
            示例
          </button>
          <button className="action-btn secondary" onClick={handleClear} disabled={!cssText}>
            清空
          </button>
        </div>
      </div>

      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileClick}
      >
        <div className="drop-zone-content">
          <div className="drop-icon">📁</div>
          <p className="drop-text">拖放CSS文件或粘贴代码</p>
          <p className="drop-hint">支持 .css 和 .txt 格式</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".css,.txt,text/plain"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div className="textarea-wrapper">
        <textarea
          ref={textareaRef}
          className="css-textarea"
          value={cssText}
          onChange={handleTextChange}
          placeholder="在此粘贴 CSS 代码..."
          spellCheck={false}
        />
      </div>

      <div className="input-footer">
        <div className="parse-status">
          {isParsing ? (
            <span className="parsing">解析中...</span>
          ) : (
            <span className="parsed-count">
              已解析 <strong>{colorCount}</strong> 个颜色
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
