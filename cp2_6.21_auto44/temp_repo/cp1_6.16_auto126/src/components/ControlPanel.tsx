import React, { useState, useCallback, useRef } from 'react'
import { useLetterStore, PAPER_STYLES, SIGNATURE_PRESETS } from '@/store/useLetterStore'

const ControlPanel: React.FC = () => {
  const paperStyle = useLetterStore((s) => s.paperStyle)
  const showDateStamp = useLetterStore((s) => s.showDateStamp)
  const signature = useLetterStore((s) => s.signature)
  const signaturePreset = useLetterStore((s) => s.signaturePreset)
  const isExporting = useLetterStore((s) => s.isExporting)
  const exportProgress = useLetterStore((s) => s.exportProgress)
  const exportType = useLetterStore((s) => s.exportType)
  const setPaperStyle = useLetterStore((s) => s.setPaperStyle)
  const setShowDateStamp = useLetterStore((s) => s.setShowDateStamp)
  const setSignature = useLetterStore((s) => s.setSignature)
  const setSignaturePreset = useLetterStore((s) => s.setSignaturePreset)
  const setExportProgress = useLetterStore((s) => s.setExportProgress)
  const setIsExporting = useLetterStore((s) => s.setIsExporting)
  const setExportType = useLetterStore((s) => s.setExportType)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const paperEntries = Object.entries(PAPER_STYLES) as Array<[keyof typeof PAPER_STYLES, typeof PAPER_STYLES[keyof typeof PAPER_STYLES]]>

  const renderPaperThumb = (style: keyof typeof PAPER_STYLES) => {
    const colorMap: Record<string, string[]> = {
      kraft: ['#F5E6CA', '#E8D8C8'],
      watermark: ['#E6E1D5', '#DBD6CA'],
      floral: ['#F0EAD6', '#E5DFD0'],
    }
    const c = colorMap[style]
    return (
      <div
        onClick={() => setPaperStyle(style)}
        style={{
          width: 44,
          height: 56,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${c[0]} 0%, ${c[1]} 100%)`,
          border: paperStyle === style ? '2px solid #C9A96E' : '1px solid #D5C4A1',
          cursor: 'pointer',
          transition: 'border-color 0.2s, transform 0.2s',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {style === 'watermark' && (
          <svg style={{ width: '100%', height: '100%', opacity: 0.15 }}>
            <line x1="0" y1="20" x2="44" y2="20" stroke="#8B7355" strokeWidth="0.5" />
            <line x1="0" y1="36" x2="44" y2="36" stroke="#8B7355" strokeWidth="0.5" />
          </svg>
        )}
        {style === 'floral' && (
          <svg style={{ width: '100%', height: '100%', opacity: 0.12 }}>
            <path d="M22 5 Q25 15 22 25" fill="none" stroke="#6B5B3A" strokeWidth="0.5" />
            <path d="M15 30 Q18 40 15 50" fill="none" stroke="#6B5B3A" strokeWidth="0.5" />
          </svg>
        )}
      </div>
    )
  }

  const exportGif = useCallback(async () => {
    setExportType('gif')
    setIsExporting(true)
    setExportProgress(0)

    try {
      const GIF = (await import('gif.js')).default
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 800
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const store = useLetterStore.getState()
      const { text, fontFamily: ff, fontSize: fs, fontColor: fc, lineSpacing: ls, paperStyle: ps, showDateStamp: sds, dateStamp: ds, signature: sig, signaturePreset: sp } = store

      const getFontStack = (font: string) => {
        if (font === 'xingshu') return "'LXGW WenKai TC', '楷体', 'KaiTi', cursive"
        return "'Dancing Script', 'Georgia', 'Times New Roman', cursive"
      }
      const paper = PAPER_STYLES[ps]

      const totalChars = text.replace(/\n/g, '').length
      const fps = 12
      const charInterval = 0.6
      const framesPerChar = Math.ceil(fps * charInterval)
      const totalFrames = totalChars * framesPerChar

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: 600,
        height: 800,
        workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js',
      })

      const drawPaperBg = () => {
        const gradient = ctx.createLinearGradient(0, 0, 600, 800)
        if (ps === 'kraft') {
          gradient.addColorStop(0, '#F5E6CA')
          gradient.addColorStop(1, '#E8D8C8')
        } else if (ps === 'watermark') {
          gradient.addColorStop(0, '#E6E1D5')
          gradient.addColorStop(1, '#DBD6CA')
        } else {
          gradient.addColorStop(0, '#F0EAD6')
          gradient.addColorStop(1, '#E5DFD0')
        }
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 600, 800)

        ctx.strokeStyle = paper.lineColor
        ctx.lineWidth = 0.5
        ctx.globalAlpha = 0.6
        for (let i = 0; i < Math.floor(720 / ls); i++) {
          const y = 60 + i * ls
          ctx.beginPath()
          ctx.moveTo(48, y)
          ctx.lineTo(552, y)
          ctx.stroke()
        }
        ctx.globalAlpha = 1

        if (sds) {
          ctx.font = '12px Georgia, serif'
          ctx.fillStyle = '#8C7B6E'
          ctx.textAlign = 'right'
          ctx.fillText(ds, 552, 36)
          ctx.textAlign = 'left'
        }
      }

      const drawText = (visibleChars: number) => {
        ctx.font = `${fs}px ${getFontStack(ff)}`
        ctx.fillStyle = fc
        const lines = text.split('\n')
        let drawnCount = 0
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          const line = lines[lineIdx]
          let x = 48
          const y = 60 + fs + lineIdx * ls
          for (let charIdx = 0; charIdx < line.length; charIdx++) {
            if (drawnCount >= visibleChars) break
            const char = line[charIdx]
            ctx.fillText(char, x, y)
            x += ctx.measureText(char).width
            drawnCount++
          }
          if (drawnCount < visibleChars && lineIdx < lines.length - 1) drawnCount++
          if (drawnCount >= visibleChars) break
        }

        const sigText = sig || sp
        if (sigText && visibleChars >= totalChars) {
          ctx.font = `${fs - 2}px ${getFontStack(ff)}`
          ctx.textAlign = 'right'
          ctx.fillText(`— ${sigText}`, 552, 760)
          ctx.textAlign = 'left'
        }
      }

      const batchSize = 5
      for (let frame = 0; frame < totalFrames; frame += batchSize) {
        for (let b = 0; b < batchSize && frame + b < totalFrames; b++) {
          const currentFrame = frame + b
          const visibleChars = Math.floor(currentFrame / framesPerChar) + 1
          drawPaperBg()
          drawText(Math.min(visibleChars, totalChars))
          gif.addFrame(ctx, { copy: true, delay: Math.round(1000 / fps) })
        }
        setExportProgress(Math.round(((frame + batchSize) / totalFrames) * 100))
        await new Promise((r) => setTimeout(r, 0))
      }

      drawPaperBg()
      drawText(totalChars)
      gif.addFrame(ctx, { copy: true, delay: 2000 })

      gif.on('finished', (blob: Blob) => {
        const { saveAs } = require('file-saver')
        saveAs(blob, '时光邮局.gif')
        setIsExporting(false)
        setExportType(null)
        setExportProgress(0)
      })

      gif.render()
    } catch {
      setIsExporting(false)
      setExportType(null)
      setExportProgress(0)
    }
  }, [])

  const exportVideo = useCallback(async () => {
    setExportType('video')
    setIsExporting(true)
    setExportProgress(0)

    try {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 800
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const stream = canvas.captureStream(30)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000,
      })
      mediaRecorderRef.current = mediaRecorder

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      const store = useLetterStore.getState()
      const { text, fontFamily: ff, fontSize: fs, fontColor: fc, lineSpacing: ls, paperStyle: ps, showDateStamp: sds, dateStamp: ds, signature: sig, signaturePreset: sp } = store

      const getFontStack = (font: string) => {
        if (font === 'xingshu') return "'LXGW WenKai TC', '楷体', 'KaiTi', cursive"
        return "'Dancing Script', 'Georgia', 'Times New Roman', cursive"
      }
      const paper = PAPER_STYLES[ps]

      const totalChars = text.replace(/\n/g, '').length
      const charDuration = 600
      const totalDuration = totalChars * charDuration

      const drawFrame = (visibleChars: number) => {
        const gradient = ctx.createLinearGradient(0, 0, 600, 800)
        if (ps === 'kraft') {
          gradient.addColorStop(0, '#F5E6CA')
          gradient.addColorStop(1, '#E8D8C8')
        } else if (ps === 'watermark') {
          gradient.addColorStop(0, '#E6E1D5')
          gradient.addColorStop(1, '#DBD6CA')
        } else {
          gradient.addColorStop(0, '#F0EAD6')
          gradient.addColorStop(1, '#E5DFD0')
        }
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 600, 800)

        ctx.strokeStyle = paper.lineColor
        ctx.lineWidth = 0.5
        ctx.globalAlpha = 0.6
        for (let i = 0; i < Math.floor(720 / ls); i++) {
          const y = 60 + i * ls
          ctx.beginPath()
          ctx.moveTo(48, y)
          ctx.lineTo(552, y)
          ctx.stroke()
        }
        ctx.globalAlpha = 1

        if (sds) {
          ctx.font = '12px Georgia, serif'
          ctx.fillStyle = '#8C7B6E'
          ctx.textAlign = 'right'
          ctx.fillText(ds, 552, 36)
          ctx.textAlign = 'left'
        }

        ctx.font = `${fs}px ${getFontStack(ff)}`
        ctx.fillStyle = fc
        const lines = text.split('\n')
        let drawnCount = 0
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          const line = lines[lineIdx]
          let x = 48
          const y = 60 + fs + lineIdx * ls
          for (let charIdx = 0; charIdx < line.length; charIdx++) {
            if (drawnCount >= visibleChars) break
            const char = line[charIdx]
            ctx.fillText(char, x, y)
            x += ctx.measureText(char).width
            drawnCount++
          }
          if (drawnCount < visibleChars && lineIdx < lines.length - 1) drawnCount++
          if (drawnCount >= visibleChars) break
        }

        const sigText = sig || sp
        if (sigText && visibleChars >= totalChars) {
          ctx.font = `${fs - 2}px ${getFontStack(ff)}`
          ctx.textAlign = 'right'
          ctx.fillText(`— ${sigText}`, 552, 760)
          ctx.textAlign = 'left'
        }
      }

      mediaRecorder.start()

      const startTime = performance.now()
      const renderLoop = () => {
        const elapsed = performance.now() - startTime
        const visibleChars = Math.min(Math.floor(elapsed / charDuration) + 1, totalChars)
        drawFrame(visibleChars)

        const progress = Math.min((elapsed / totalDuration) * 100, 100)
        setExportProgress(Math.round(progress))

        if (elapsed < totalDuration + 1000) {
          requestAnimationFrame(renderLoop)
        } else {
          mediaRecorder.stop()
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = '时光邮局.webm'
        a.click()
        URL.revokeObjectURL(url)
        setIsExporting(false)
        setExportType(null)
        setExportProgress(0)
      }

      renderLoop()
    } catch {
      setIsExporting(false)
      setExportType(null)
      setExportProgress(0)
    }
  }, [])

  const panelContent = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: '16px 20px',
      background: 'rgba(255,255,255,0.65)',
      borderRadius: 12,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      width: 280,
    }}>
      <div>
        <div style={{ fontSize: 13, color: '#8C7B6E', marginBottom: 8, fontWeight: 600 }}>信纸样式</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          {paperEntries.map(([key, val]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {renderPaperThumb(key)}
              <span style={{ fontSize: 10, color: paperStyle === key ? '#C9A96E' : '#8C7B6E' }}>{val.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#4A3728' }}>
          <input
            type="checkbox"
            checked={showDateStamp}
            onChange={(e) => setShowDateStamp(e.target.checked)}
            style={{ accentColor: '#C9A96E' }}
          />
          显示日期戳
        </label>
      </div>

      <div>
        <div style={{ fontSize: 13, color: '#8C7B6E', marginBottom: 6, fontWeight: 600 }}>签名</div>
        <input
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="输入自定义签名..."
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #D5C4A1',
            background: 'rgba(245,230,202,0.3)',
            fontSize: 13,
            color: '#4A3728',
            outline: 'none',
            marginBottom: 6,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#C9A96E' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#D5C4A1' }}
        />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {SIGNATURE_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setSignaturePreset(p)}
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                border: signaturePreset === p ? '1px solid #C9A96E' : '1px solid #D5C4A1',
                background: signaturePreset === p ? '#C9A96E' : '#F5E6CA',
                color: signaturePreset === p ? '#FFF' : '#4A3728',
                cursor: 'pointer',
                fontSize: 11,
                transition: 'all 0.2s',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #E8D8C8', paddingTop: 12 }}>
        <div style={{ fontSize: 13, color: '#8C7B6E', marginBottom: 8, fontWeight: 600 }}>导出</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={exportGif}
            disabled={isExporting}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: isExporting && exportType === 'gif' ? '#B8A070' : 'linear-gradient(135deg, #C9A96E, #A88B5A)',
              color: '#FFF',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'box-shadow 0.2s, transform 0.2s',
              boxShadow: '0 2px 6px rgba(201,169,110,0.3)',
            }}
            onMouseEnter={(e) => { if (!isExporting) { e.currentTarget.style.boxShadow = '0 4px 12px rgba(201,169,110,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(201,169,110,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {isExporting && exportType === 'gif' ? `生成中...${exportProgress}%` : '导出 GIF'}
          </button>
          <button
            onClick={exportVideo}
            disabled={isExporting}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: isExporting && exportType === 'video' ? '#B8A070' : 'linear-gradient(135deg, #4A3728, #2C2C2C)',
              color: '#FFF',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'box-shadow 0.2s, transform 0.2s',
              boxShadow: '0 2px 6px rgba(74,55,40,0.3)',
            }}
            onMouseEnter={(e) => { if (!isExporting) { e.currentTarget.style.boxShadow = '0 4px 12px rgba(74,55,40,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(74,55,40,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {isExporting && exportType === 'video' ? `录制中...${exportProgress}%` : '导出视频'}
          </button>
        </div>

        {isExporting && (
          <div style={{ marginTop: 8 }}>
            <div style={{
              width: '100%',
              height: 4,
              borderRadius: 2,
              background: '#E8D8C8',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${exportProgress}%`,
                height: '100%',
                borderRadius: 2,
                background: 'linear-gradient(90deg, #C9A96E, #A88B5A)',
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <div className="control-panel-desktop" style={{ display: 'block' }}>
        {panelContent}
      </div>

      <div className="control-panel-mobile" style={{ display: 'none' }}>
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #C9A96E, #A88B5A)',
            color: '#FFF',
            fontSize: 20,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(201,169,110,0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ☰
        </button>
        {drawerOpen && (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 999,
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            {panelContent}
          </div>
        )}
      </div>
    </>
  )
}

export default ControlPanel
