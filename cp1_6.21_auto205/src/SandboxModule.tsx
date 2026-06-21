import { useState, useRef, useEffect, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import type { ConsoleMessage } from './types'

interface SandboxModuleProps {
  html: string
  css: string
  javascript: string
  onHtmlChange: (value: string) => void
  onCssChange: (value: string) => void
  onJsChange: (value: string) => void
}

type EditorTab = 'html' | 'css' | 'javascript'

function SandboxModule({
  html,
  css,
  javascript,
  onHtmlChange,
  onCssChange,
  onJsChange,
}: SandboxModuleProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('html')
  const [leftWidth, setLeftWidth] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([])
  const [runStatus, setRunStatus] = useState<string>('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleRunCode = useCallback(() => {
    if (!iframeRef.current) return

    setRunStatus('运行中...')
    setConsoleMessages([])

    const startTime = performance.now()

    const iframe = iframeRef.current
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

    if (!iframeDoc) {
      setRunStatus('运行失败')
      return
    }

    const consoleCapture = `
      <script>
        (function() {
          const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info,
          };
          
          function sendMessage(type, args) {
            const message = args.map(arg => {
              if (typeof arg === 'object') {
                try {
                  return JSON.stringify(arg, null, 2);
                } catch (e) {
                  return String(arg);
                }
              }
              return String(arg);
            }).join(' ');
            
            window.parent.postMessage({
              type: 'console',
              data: { type, message, timestamp: Date.now() }
            }, '*');
          }
          
          console.log = function(...args) {
            originalConsole.log.apply(console, args);
            sendMessage('log', args);
          };
          
          console.error = function(...args) {
            originalConsole.error.apply(console, args);
            sendMessage('error', args);
          };
          
          console.warn = function(...args) {
            originalConsole.warn.apply(console, args);
            sendMessage('warn', args);
          };
          
          console.info = function(...args) {
            originalConsole.info.apply(console, args);
            sendMessage('info', args);
          };
          
          window.onerror = function(message, source, lineno, colno, error) {
            sendMessage('error', [message + ' (line ' + lineno + ')']);
            return true;
          };
        })();
      </script>
    `

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${css}</style>
          ${consoleCapture}
        </head>
        <body>
          ${html}
          <script>${javascript}<\/script>
        </body>
      </html>
    `

    iframe.srcdoc = fullHtml

    iframe.onload = () => {
      const endTime = performance.now()
      const renderTime = (endTime - startTime).toFixed(0)
      setRunStatus(`已运行 (${renderTime}ms)`)
      setTimeout(() => setRunStatus(''), 2000)
    }
  }, [html, css, javascript])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'console') {
        setConsoleMessages(prev => [...prev, event.data.data])
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    handleRunCode()
  }, [])

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const isMobile = window.innerWidth < 768

      if (isMobile) {
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100
        const clampedHeight = Math.max(20, Math.min(80, newHeight))
        setLeftWidth(clampedHeight)
      } else {
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100
        const clampedWidth = Math.max(20, Math.min(80, newWidth))
        setLeftWidth(clampedWidth)
      }
    }

    const handleDragEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
    }
  }, [isDragging])

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return
    switch (activeTab) {
      case 'html':
        onHtmlChange(value)
        break
      case 'css':
        onCssChange(value)
        break
      case 'javascript':
        onJsChange(value)
        break
    }
  }

  const getEditorLanguage = (): string => {
    switch (activeTab) {
      case 'html': return 'html'
      case 'css': return 'css'
      case 'javascript': return 'javascript'
    }
  }

  const getCurrentEditorValue = (): string => {
    switch (activeTab) {
      case 'html': return html
      case 'css': return css
      case 'javascript': return javascript
    }
  }

  const clearConsole = () => {
    setConsoleMessages([])
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const editorStyle: React.CSSProperties = isMobile
    ? { height: `${leftWidth}%` }
    : { width: `${leftWidth}%` }

  const previewStyle: React.CSSProperties = isMobile
    ? { height: `${100 - leftWidth}%` }
    : { width: `${100 - leftWidth - 0.5}%` }

  return (
    <div className="sandbox-container">
      <div className="toolbar">
        <div className="editor-tabs">
          <button
            className={`tab-btn ${activeTab === 'html' ? 'active' : ''}`}
            onClick={() => setActiveTab('html')}
          >
            HTML
          </button>
          <button
            className={`tab-btn ${activeTab === 'css' ? 'active' : ''}`}
            onClick={() => setActiveTab('css')}
          >
            CSS
          </button>
          <button
            className={`tab-btn ${activeTab === 'javascript' ? 'active' : ''}`}
            onClick={() => setActiveTab('javascript')}
          >
            JavaScript
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {runStatus && <span className="status-text">{runStatus}</span>}
          <button className="run-btn" onClick={handleRunCode}>
            ▶ 运行
          </button>
        </div>
      </div>

      <div className="split-container" ref={containerRef}>
        <div className="editor-pane" style={editorStyle}>
          <div className="editor-wrapper">
            <Editor
              height="100%"
              language={getEditorLanguage()}
              value={getCurrentEditorValue()}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 8, bottom: 8 },
              }}
            />
          </div>
        </div>

        <div
          className={`divider ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleDragStart}
        />

        <div className="preview-pane" style={previewStyle}>
          <div className="preview-frame-container">
            <iframe
              ref={iframeRef}
              className="preview-iframe"
              title="代码预览"
              sandbox="allow-scripts allow-modals"
            />
          </div>
          <div className="console-container">
            <div className="console-header">
              <h4>控制台输出</h4>
              <button className="clear-console-btn" onClick={clearConsole}>
                清空
              </button>
            </div>
            {consoleMessages.length === 0 ? (
              <div style={{ color: '#64748B', fontSize: '13px', padding: '8px' }}>
                暂无输出
              </div>
            ) : (
              consoleMessages.map((msg, index) => (
                <div key={index} className={`console-message ${msg.type}`}>
                  {msg.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SandboxModule
