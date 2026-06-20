import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useWritingStore } from '@/store/writingStore'
import { remark } from 'remark'
import remarkHtml from 'remark-html'

const TARGET_WORDS = 500

export default function WritingEditor() {
  const today = useWritingStore((s) => s.getTodayWriting())
  const saveTodayWriting = useWritingStore((s) => s.saveTodayWriting)
  const isLoaded = useWritingStore((s) => s.isLoaded)

  const [content, setContent] = useState('')
  const [displayedCount, setDisplayedCount] = useState(0)
  const [showParticles, setShowParticles] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastWasUnderTarget = useRef(true)

  const wordCount = content.replace(/\s/g, '').length
  const percentage = Math.min((wordCount / TARGET_WORDS) * 100, 100)
  const isMet = wordCount >= TARGET_WORDS

  useEffect(() => {
    if (isLoaded && today) {
      setContent(today.content)
      setDisplayedCount(today.wordCount)
    }
  }, [isLoaded, today])

  useEffect(() => {
    if (isMet && lastWasUnderTarget.current && wordCount > 0) {
      setShowParticles(true)
      const timer = setTimeout(() => setShowParticles(false), 3000)
      lastWasUnderTarget.current = false
      return () => clearTimeout(timer)
    }
    if (!isMet) {
      lastWasUnderTarget.current = true
    }
  }, [isMet, wordCount])

  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

    const animate = () => {
      setDisplayedCount((prev) => {
        if (prev === wordCount) return prev
        const diff = wordCount - prev
        const step = Math.max(1, Math.ceil(Math.abs(diff) / 8))
        return prev + (diff > 0 ? step : -step)
      })
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [wordCount])

  useEffect(() => {
    let active = true
    remark()
      .use(remarkHtml)
      .process(content)
      .then((file) => {
        if (active) setPreviewHtml(String(file))
      })
    return () => {
      active = false
    }
  }, [content])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    saveTodayWriting(newContent)
  }, [saveTodayWriting])

  const circumference = 2 * Math.PI * 42
  const offset = circumference - (percentage / 100) * circumference

  const particles = showParticles
    ? Array.from({ length: 30 }, (_, i) => {
        const angle = (i / 30) * Math.PI * 2
        const distance = 80 + Math.random() * 60
        return {
          id: i,
          tx: Math.cos(angle) * distance + 'px',
          ty: Math.sin(angle) * distance + 'px',
          color: ['#27AE60', '#F39C12', '#FF6B6B', '#4ECDC4', '#667eea'][i % 5],
          delay: Math.random() * 0.2 + 's',
        }
      })
    : []

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#E0DACD]">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold" style={{ color: '#2C3E50' }}>
            今日写作
          </h2>
          <span className="text-xs text-gray-500">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(false)}
            className="px-3 py-1.5 text-sm transition-colors"
            style={{
              backgroundColor: !showPreview ? '#FFE0B2' : 'transparent',
              color: '#2C3E50',
              fontWeight: !showPreview ? 600 : 400,
            }}
          >
            编辑
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="px-3 py-1.5 text-sm transition-colors"
            style={{
              backgroundColor: showPreview ? '#FFE0B2' : 'transparent',
              color: '#2C3E50',
              fontWeight: showPreview ? 600 : 400,
            }}
          >
            预览
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {!showPreview ? (
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              placeholder="开始写作吧...&#10;&#10;支持 Markdown 语法：&#10;# 标题&#10;**粗体**&#10;- 列表&#10;```代码块```"
              className="w-full h-full p-6 resize-none outline-none bg-transparent text-base leading-relaxed"
              style={{
                color: '#2C3E50',
                minHeight: '400px',
                fontFamily: "'Merriweather', Georgia, serif",
              }}
            />
          </div>
        ) : (
          <div
            className="flex-1 p-6 overflow-auto markdown-preview"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}

        <div className="w-32 flex flex-col items-center justify-start pt-8 border-l border-[#E0DACD] bg-[#FFFBF2]">
          <div className="relative w-24 h-24">
            <svg width="96" height="96" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#BDC3C7"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={isMet ? '#27AE60' : `hsl(${145 - percentage * 1.45}, 60%, 50%)`}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 50 50)"
                style={{
                  transition: 'stroke-dashoffset 1.2s ease, stroke 0.5s ease',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: '#2C3E50' }}>
                {Math.round(percentage)}%
              </span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="text-3xl font-bold tabular-nums" style={{ color: '#2C3E50' }}>
              {displayedCount}
            </div>
            <div className="text-xs text-gray-500 mt-1">字</div>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            目标 {TARGET_WORDS} 字
          </div>

          {showParticles && (
            <div className="absolute top-1/3 left-1/2 pointer-events-none">
              {particles.map((p) => (
                <span
                  key={p.id}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: p.color,
                    // @ts-expect-error css custom property
                    '--tx': p.tx,
                    '--ty': p.ty,
                    animation: `particleBurst 1.5s ease-out ${p.delay} forwards`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="py-3 px-6 text-center text-sm font-medium transition-all duration-300"
        style={{
          backgroundColor: isMet ? 'rgba(39, 174, 96, 0.12)' : 'rgba(231, 76, 60, 0.1)',
          color: isMet ? '#27AE60' : '#E74C3C',
        }}
      >
        {isMet
          ? `🎉 +${wordCount - TARGET_WORDS} 字超出目标！继续保持~`
          : `离今天目标还差 ${TARGET_WORDS - wordCount} 字，加油！`}
      </div>
    </div>
  )
}
