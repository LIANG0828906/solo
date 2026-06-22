import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import './OutputPanel.css'

interface OutputPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function OutputPanel({ canvasRef }: OutputPanelProps) {
  const { ciphertext, direction, decrypt } = useAppStore()
  const [displayText, setDisplayText] = useState('')
  const [showCopied, setShowCopied] = useState(false)
  const [isDecryptPressed, setIsDecryptPressed] = useState(false)
  const typewriterRef = useRef<number | null>(null)
  const prevCiphertextRef = useRef('')

  useEffect(() => {
    if (direction === 'encrypt' && ciphertext !== prevCiphertextRef.current) {
      prevCiphertextRef.current = ciphertext
      setDisplayText('')
      let index = 0

      if (typewriterRef.current) {
        clearInterval(typewriterRef.current)
      }

      typewriterRef.current = window.setInterval(() => {
        if (index < ciphertext.length) {
          setDisplayText(ciphertext.slice(0, index + 1))
          index++
        } else {
          if (typewriterRef.current) {
            clearInterval(typewriterRef.current)
            typewriterRef.current = null
          }
        }
      }, 50)
    } else if (direction === 'decrypt') {
      setDisplayText(ciphertext)
    }

    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current)
        typewriterRef.current = null
      }
    }
  }, [ciphertext, direction])

  useEffect(() => {
    if (direction === 'decrypt' && ciphertext) {
      setDisplayText(ciphertext)
    }
  }, [direction, ciphertext])

  const handleCopy = async () => {
    if (!ciphertext) return
    try {
      await navigator.clipboard.writeText(ciphertext)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 500)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleDecrypt = () => {
    if (!ciphertext.trim()) return
    setIsDecryptPressed(true)
    setTimeout(() => setIsDecryptPressed(false), 150)

    const canvas = canvasRef.current
    if (canvas) {
      decrypt(canvas.width, canvas.height)
    }
  }

  return (
    <div className="output-panel">
      <h2 className="panel-title">密文输出</h2>

      <div className="ciphertext-display">
        <pre className="ciphertext-text">
          {direction === 'encrypt' ? displayText : ciphertext}
          <span className="cursor">|</span>
        </pre>
      </div>

      <div className="output-info">
        <span className="info-label">字符数:</span>
        <span className="info-value">{ciphertext.length}</span>
      </div>

      <div className="output-buttons">
        <button
          className="copy-btn"
          onClick={handleCopy}
          disabled={!ciphertext}
        >
          复制
          {showCopied && <span className="copied-toast">已复制</span>}
        </button>

        <button
          className={`decrypt-btn ${isDecryptPressed ? 'pressed' : ''}`}
          onClick={handleDecrypt}
          disabled={!ciphertext}
        >
          解密
        </button>
      </div>
    </div>
  )
}
