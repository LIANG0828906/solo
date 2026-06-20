import { useState, useEffect, useRef } from 'react'
import { startIsbnScanner, stopIsbnScanner, mockScanIsbn } from '../utils/isbnScanner'

interface ScanModalProps {
  onClose: () => void
  onSuccess: (isbn: string, title?: string, author?: string) => void
}

const MOCK_BOOKS: Record<string, { title: string; author: string }> = {
  '9787020024759': { title: '活着', author: '余华' },
  '9787506365437': { title: '三体', author: '刘慈欣' },
  '9787530209844': { title: '百年孤独', author: '加西亚·马尔克斯' },
  '9787544253994': { title: '解忧杂货店', author: '东野圭吾' },
}

export default function ScanModal({ onClose, onSuccess }: ScanModalProps) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [isbn, setIsbn] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [useMock, setUseMock] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const startScan = async (mock: boolean) => {
    setStatus('scanning')
    setUseMock(mock)
    setErrorMsg('')

    if (mock) {
      try {
        const result = await mockScanIsbn()
        handleScanResult(result.isbn)
      } catch (e) {
        setStatus('error')
        setErrorMsg('模拟扫描失败')
      }
      return
    }

    try {
      const result = await startIsbnScanner('scan-video')
      handleScanResult(result.isbn)
    } catch (e) {
      setStatus('error')
      setErrorMsg('无法访问摄像头，请使用模拟扫描模式')
    }
  }

  const handleScanResult = (scannedIsbn: string) => {
    setIsbn(scannedIsbn)
    const mockInfo = MOCK_BOOKS[scannedIsbn]
    if (mockInfo) {
      setTitle(mockInfo.title)
      setAuthor(mockInfo.author)
    } else {
      setTitle(`书籍-${scannedIsbn.slice(-4)}`)
      setAuthor('未知作者')
    }
    setStatus('success')
    stopIsbnScanner()
  }

  useEffect(() => {
    return () => {
      stopIsbnScanner()
    }
  }, [])

  const handleConfirm = () => {
    if (!title.trim()) {
      alert('请输入书名')
      return
    }
    onSuccess(isbn, title.trim(), author.trim() || undefined)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content scan-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">📷 扫描ISBN</div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {status === 'idle' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
              <div style={{ marginBottom: 24, color: 'var(--text-light)' }}>
                选择扫描方式开始添加书籍
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="ripple-btn" onClick={() => startScan(false)}>
                  📷 使用摄像头扫描
                </button>
                <button
                  className="action-btn secondary"
                  style={{ background: '#FFF8E7' }}
                  onClick={() => startScan(true)}
                >
                  🎲 模拟扫描
                </button>
              </div>
            </div>
          )}

          {status === 'scanning' && !useMock && (
            <>
              <div className="scan-video-container">
                <video id="scan-video" ref={videoRef} playsInline />
                <div className="scan-overlay">
                  <div className="scan-frame">
                    <div className="scan-line" />
                  </div>
                </div>
              </div>
              <div className="scan-status scanning">🔍 正在扫描ISBN条码，请对准条码...</div>
            </>
          )}

          {status === 'scanning' && useMock && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>
                ⏳
              </div>
              <div className="scan-status scanning">模拟扫描中...</div>
            </div>
          )}

          {(status === 'success' || status === 'error') && (
            <>
              {status === 'success' && (
                <div className="scan-status success" style={{ marginBottom: 16 }}>
                  ✅ ISBN识别成功！请确认或编辑书籍信息
                </div>
              )}
              {status === 'error' && (
                <div style={{ color: 'var(--danger)', textAlign: 'center', padding: '12px', marginBottom: 16, background: 'rgba(231,76,60,0.1)', borderRadius: 8 }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">ISBN</label>
                <input
                  className="form-input"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="输入ISBN"
                />
              </div>

              <div className="form-group">
                <label className="form-label">书名 *</label>
                <input
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入书名"
                />
              </div>

              <div className="form-group">
                <label className="form-label">作者</label>
                <input
                  className="form-input"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="输入作者"
                />
              </div>

              {status === 'error' && (
                <button
                  className="action-btn secondary"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
                  onClick={() => startScan(true)}
                >
                  🎲 使用模拟扫描重试
                </button>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="action-btn secondary" onClick={onClose}>
            取消
          </button>
          {(status === 'success' || status === 'error') && (
            <button className="ripple-btn" onClick={handleConfirm}>
              ✅ 添加书籍
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
