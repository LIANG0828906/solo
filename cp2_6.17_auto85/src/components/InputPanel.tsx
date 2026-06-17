import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store'
import { CipherType } from '../types'
import './InputPanel.css'

interface InputPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function InputPanel({ canvasRef }: InputPanelProps) {
  const {
    plaintext,
    cipherType,
    cipherOptions,
    caesarShift,
    vigenereKey,
    affineA,
    affineB,
    setPlaintext,
    setCipherType,
    setCaesarShift,
    setVigenereKey,
    setAffineA,
    setAffineB,
    encrypt
  } = useAppStore()

  const [isPressed, setIsPressed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleEncrypt = () => {
    if (!plaintext.trim()) return
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)

    const canvas = canvasRef.current
    if (canvas) {
      encrypt(canvas.width, canvas.height)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleEncrypt()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [plaintext, cipherType])

  return (
    <div className="input-panel">
      <h2 className="panel-title">明文输入</h2>
      <textarea
        ref={textareaRef}
        className="text-input"
        value={plaintext}
        onChange={(e) => setPlaintext(e.target.value)}
        placeholder="输入要加密的文本..."
        rows={6}
      />

      <div className="cipher-selector">
        <label className="selector-label">加密方式</label>
        <select
          className="cipher-select"
          value={cipherType}
          onChange={(e) => setCipherType(e.target.value as CipherType)}
        >
          {cipherOptions.map((opt) => (
            <option key={opt.type} value={opt.type}>
              {opt.name} — {opt.description}
            </option>
          ))}
        </select>
      </div>

      {cipherType === CipherType.CAESAR && (
        <div className="key-input">
          <label className="key-label">位移量: {caesarShift}</label>
          <input
            type="range"
            min="1"
            max="25"
            value={caesarShift}
            onChange={(e) => setCaesarShift(parseInt(e.target.value))}
            className="key-slider"
          />
        </div>
      )}

      {cipherType === CipherType.VIGENERE && (
        <div className="key-input">
          <label className="key-label">密钥</label>
          <input
            type="text"
            value={vigenereKey}
            onChange={(e) => setVigenereKey(e.target.value)}
            className="key-text"
            placeholder="输入密钥..."
          />
        </div>
      )}

      {cipherType === CipherType.AFFINE && (
        <div className="key-input affine">
          <div className="affine-row">
            <label className="key-label">a: {affineA}</label>
            <input
              type="range"
              min="1"
              max="25"
              value={affineA}
              onChange={(e) => setAffineA(parseInt(e.target.value))}
              className="key-slider"
            />
          </div>
          <div className="affine-row">
            <label className="key-label">b: {affineB}</label>
            <input
              type="range"
              min="0"
              max="25"
              value={affineB}
              onChange={(e) => setAffineB(parseInt(e.target.value))}
              className="key-slider"
            />
          </div>
        </div>
      )}

      <button
        className={`encrypt-btn ${isPressed ? 'pressed' : ''}`}
        onClick={handleEncrypt}
      >
        加密
      </button>
    </div>
  )
}
