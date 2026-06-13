import React, { useCallback, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { keyframes, css } from '@emotion/react'
import { EmotionResult } from './types'

const EMOJI_OPTIONS = [
  { emoji: '😊', name: '开心' },
  { emoji: '🤩', name: '兴奋' },
  { emoji: '🥰', name: '浪漫' },
  { emoji: '😌', name: '平静' },
  { emoji: '😢', name: '悲伤' },
  { emoji: '😴', name: '疲惫' },
  { emoji: '😰', name: '焦虑' },
  { emoji: '😠', name: '愤怒' }
]

interface Props {
  onAnalyzing: (v: boolean) => void
  onResult: (data: any) => void
  currentEmotion: EmotionResult | null
}

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(0,240,255,0.3), 0 0 60px rgba(197,108,240,0.15); }
  50%      { box-shadow: 0 0 40px rgba(0,240,255,0.6), 0 0 120px rgba(197,108,240,0.35); }
`

const scanLine = keyframes`
  0%   { transform: translateY(0); opacity: 0.9; }
  50%  { opacity: 0.4; }
  100% { transform: translateY(220px); opacity: 0.9; }
`

const floatY = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
`

const Wrapper = styled.div`
  background: linear-gradient(145deg, rgba(15,20,40,0.85), rgba(8,10,24,0.9));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0,240,255,0.18);
  border-radius: 24px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute; inset: -2px;
    background: conic-gradient(from 0deg, #00f0ff33, #c56cf033, #ff475733, #00f0ff33);
    filter: blur(30px); opacity: 0.45; z-index: 0;
  }
  > * { position: relative; z-index: 1; }
`

const SectionTitle = styled.h3`
  margin: 0 0 18px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  display: flex; align-items: center; gap: 10px;
  &::before {
    content: ''; display: inline-block; width: 4px; height: 20px; border-radius: 2px;
    background: linear-gradient(180deg, #00f0ff, #c56cf0);
  }
`

const DropZone = styled.div<{ $dragging: boolean; $hasImg: boolean }>`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  max-height: 260px;
  border-radius: 18px;
  border: 2px dashed ${p => p.$dragging ? '#00f0ff' : 'rgba(255,255,255,0.15)'};
  background: ${p => p.$dragging
    ? 'radial-gradient(circle at 50% 50%, rgba(0,240,255,0.2), rgba(197,108,240,0.08))'
    : 'rgba(255,255,255,0.03)'};
  transition: all 0.3s cubic-bezier(.4,0,.2,1);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  cursor: pointer;
  animation: ${p => p.$dragging ? glowPulse : 'none'} 1.8s ease-in-out infinite;
  &:hover {
    border-color: rgba(0,240,255,0.6);
    background: radial-gradient(circle at 50% 50%, rgba(0,240,255,0.12), rgba(197,108,240,0.04));
  }
  canvas, img {
    position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  }
  ${p => p.$dragging && css`transform: scale(1.01);`}
`

const ScanOverlay = styled.div`
  position: absolute; inset: 0; pointer-events: none;
  &::after {
    content: ''; position: absolute; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, transparent, #00f0ff, transparent);
    box-shadow: 0 0 14px #00f0ff, 0 0 28px #c56cf0;
    animation: ${scanLine} 1.6s linear infinite;
  }
`

const Placeholder = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  color: rgba(255,255,255,0.55);
  padding: 20px; text-align: center;
  animation: ${floatY} 4s ease-in-out infinite;
  svg { width: 52px; height: 52px; color: #00f0ff; filter: drop-shadow(0 0 10px #00f0ffaa); }
  span { font-size: 13px; }
  strong { color: #fff; font-weight: 600; }
`

const EmojiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 20px;
  @media (max-width: 600px) { grid-template-columns: repeat(4, 1fr); gap: 8px; }
`

const EmojiBtn = styled.button<{ $active: boolean }>`
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 14px 8px;
  border-radius: 14px;
  background: ${p => p.$active
    ? 'linear-gradient(135deg, rgba(0,240,255,0.25), rgba(197,108,240,0.25))'
    : 'rgba(255,255,255,0.04)'};
  border: 1px solid ${p => p.$active ? '#00f0ffaa' : 'rgba(255,255,255,0.08)'};
  transition: all 0.25s ease;
  font-size: 26px;
  line-height: 1;
  position: relative;
  &:hover {
    transform: translateY(-3px);
    border-color: #00f0ff66;
    box-shadow: 0 8px 22px rgba(0,240,255,0.2);
  }
  ${p => p.$active && css`
    box-shadow: 0 0 20px rgba(0,240,255,0.4), inset 0 0 20px rgba(197,108,240,0.15);
  `}
  small {
    font-size: 11px;
    color: rgba(255,255,255,0.6);
    font-family: 'Noto Sans SC';
  }
`

const ActionBar = styled.div`
  display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;
  justify-content: space-between;
  @media (max-width: 500px) { flex-direction: column; }
`

const PrimaryBtn = styled.button`
  flex: 1;
  padding: 14px 22px;
  border-radius: 14px;
  background: linear-gradient(135deg, #00f0ff, #c56cf0);
  color: #05060d;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.05em;
  font-family: 'Orbitron';
  transition: all 0.25s ease;
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(0,240,255,0.45), 0 6px 18px rgba(197,108,240,0.35);
  }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`

const GhostBtn = styled.button`
  padding: 14px 22px;
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
  color: #fff;
  font-size: 14px;
  transition: all 0.2s ease;
  &:hover {
    border-color: rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.09);
  }
`

const EmotionDetector: React.FC<Props> = ({ onAnalyzing, onResult, currentEmotion }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [hasImage, setHasImage] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const currentEmotionRef = useRef<EmotionResult | null>(currentEmotion)
  currentEmotionRef.current = currentEmotion

  const extractPixelSamples = useCallback(canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return []
    const { width, height } = canvas
    const samples: Array<{ r: number; g: number; b: number; brightness: number }> = []
    const stepX = Math.max(1, Math.floor(width / 18))
    const stepY = Math.max(1, Math.floor(height / 18))
    try {
      const data = ctx.getImageData(0, 0, width, height).data
      for (let y = 0; y < height; y += stepY) {
        for (let x = 0; x < width; x += stepX) {
          const i = (y * width + x) * 4
          const r = data[i], g = data[i + 1], b = data[i + 2]
          samples.push({ r, g, b, brightness: (r + g + b) / 3 })
        }
      }
    } catch { /* ignore taint */ }
    return samples
  }, [])

  const drawImageToCanvas = useCallback((file: File) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const targetW = 480
        const ratio = img.height / img.width
        canvas.width = targetW
        canvas.height = Math.round(targetW * ratio)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          setHasImage(true)
          setSelectedEmoji(null)
        }
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    drawImageToCanvas(file)
  }, [drawImageToCanvas])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }, [handleFile])

  const analyze = useCallback(async () => {
    if (analyzing) return
    setAnalyzing(true)
    onAnalyzing(true)
    const t0 = performance.now()
    try {
      if (selectedEmoji) {
        const res = await fetch('/api/emotion/emoji', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji: selectedEmoji })
        })
        const data = await res.json()
        data.latencyMs = Math.round(performance.now() - t0)
        onResult(data)
      } else {
        const canvas = canvasRef.current
        const samples = canvas ? extractPixelSamples(canvas) : []
        const form = new FormData()
        form.append('samples', JSON.stringify(samples))
        if (fileInputRef.current?.files?.[0]) {
          form.append('image', fileInputRef.current.files[0])
        }
        const res = await fetch('/api/emotion/image', {
          method: 'POST',
          body: form
        })
        const data = await res.json()
        data.latencyMs = Math.round(performance.now() - t0)
        onResult(data)
      }
    } finally {
      setAnalyzing(false)
      onAnalyzing(false)
    }
  }, [analyzing, extractPixelSamples, onAnalyzing, onResult, selectedEmoji])

  const canAnalyze = hasImage || !!selectedEmoji

  return (
    <Wrapper>
      <SectionTitle>情绪感知</SectionTitle>
      <DropZone
        $dragging={dragging}
        $hasImg={hasImage}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <canvas ref={canvasRef} style={{ display: hasImage ? 'block' : 'none' }} />
        {analyzing && <ScanOverlay />}
        {!hasImage && (
          <Placeholder>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <circle cx="9" cy="11" r="2" />
              <path d="M21 17l-5-5-8 8" />
            </svg>
            <div>
              <strong>拖放自拍照到此处</strong>
              <span> 或点击选择图片，也可选择下方表情</span>
            </div>
          </Placeholder>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </DropZone>

      <SectionTitle style={{ marginTop: 26 }}>选择表情</SectionTitle>
      <EmojiGrid>
        {EMOJI_OPTIONS.map(({ emoji, name }) => (
          <EmojiBtn
            key={emoji}
            $active={selectedEmoji === emoji}
            onClick={() => {
              setSelectedEmoji(emoji)
              setHasImage(false)
              const c = canvasRef.current
              if (c) { const ctx = c.getContext('2d'); ctx?.clearRect(0, 0, c.width, c.height) }
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            title={name}
          >
            <span>{emoji}</span>
            <small>{name}</small>
          </EmojiBtn>
        ))}
      </EmojiGrid>

      <ActionBar>
        <GhostBtn
          onClick={() => {
            setHasImage(false); setSelectedEmoji(null)
            const c = canvasRef.current
            if (c) { const ctx = c.getContext('2d'); ctx?.clearRect(0, 0, c.width, c.height) }
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        >
          重置
        </GhostBtn>
        <PrimaryBtn disabled={!canAnalyze || analyzing} onClick={analyze}>
          {analyzing ? '分析中…' : '✨ 分析情绪并推荐'}
        </PrimaryBtn>
      </ActionBar>
    </Wrapper>
  )
}

export default EmotionDetector
