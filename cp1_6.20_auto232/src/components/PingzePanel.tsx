import React, { useEffect, useState, useCallback, useRef } from 'react'
import type { LineInfo, CharInfo, Tone } from '@/analyzers/poemParser'

interface PingzePanelProps {
  lines: LineInfo[]
  onToneChange: (lineIdx: number, charIdx: number, newTone: Tone) => void
  animKey: number
}

const TONE_LABELS: Record<Tone, string> = {
  ping: '平',
  ze: '仄',
  unknown: '?'
}

const PingzePanel: React.FC<PingzePanelProps> = ({ lines, onToneChange, animKey }) => {
  const [flashIdx, setFlashIdx] = useState<number>(-1)
  const [totalChars, setTotalChars] = useState(0)
  const timerRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const allChars = useCallback(() => {
    const arr: { lineIdx: number; charIdx: number; char: CharInfo }[] = []
    lines.forEach((line, li) => {
      line.chars.forEach((c, ci) => {
        arr.push({ lineIdx: li, charIdx: ci, char: c })
      })
    })
    return arr
  }, [lines])

  useEffect(() => {
    const chars = allChars()
    setTotalChars(chars.length)
    setFlashIdx(-1)

    if (chars.length === 0) return

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    let idx = 0
    timerRef.current = window.setInterval(() => {
      setFlashIdx(idx)
      idx++
      if (idx >= chars.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        setTimeout(() => setFlashIdx(-1), 300)
      }
    }, 300)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [animKey, allChars])

  const handleClick = (lineIdx: number, charIdx: number, current: Tone) => {
    const cycle: Record<Tone, Tone> = { ping: 'ze', ze: 'unknown', unknown: 'ping' }
    onToneChange(lineIdx, charIdx, cycle[current])
  }

  const charList = allChars()

  const getToneStyles = (tone: Tone) => {
    switch (tone) {
      case 'ping':
        return {
          bg: '#ffffff',
          color: '#00bcd4',
          border: '1px solid #b2ebf2'
        }
      case 'ze':
        return {
          bg: '#e0e0e0',
          color: '#ff5722',
          border: '1px solid #ffccbc'
        }
      default:
        return {
          bg: '#fafafa',
          color: '#9e9e9e',
          border: '1px solid #e0e0e0'
        }
    }
  }

  return (
    <div
      ref={containerRef}
      className="fade-in-up"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        background: 'rgba(255,255,255,0.7)',
        borderRadius: '12px',
        border: '2px solid #5d4037',
        boxShadow: '2px 4px 8px rgba(0,0,0,0.15)',
        height: '100%',
        overflow: 'auto',
        animationDelay: '0.1s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="zhuanshu" style={{
          margin: 0,
          fontSize: '24px',
          color: '#5d4037',
          letterSpacing: '3px'
        }}>平仄标注</h3>
        <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#6d4c41' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              display: 'inline-block', width: '14px', height: '14px',
              background: '#fff', border: '1px solid #b2ebf2',
              color: '#00bcd4', fontSize: '10px',
              lineHeight: '12px', textAlign: 'center', borderRadius: '2px'
            }}>平</span>
            平声
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              display: 'inline-block', width: '14px', height: '14px',
              background: '#e0e0e0', border: '1px solid #ffccbc',
              color: '#ff5722', fontSize: '10px',
              lineHeight: '12px', textAlign: 'center', borderRadius: '2px'
            }}>仄</span>
            仄声
          </span>
        </div>
      </div>

      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, #8d6e63, transparent)',
        opacity: 0.5
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {lines.map((line, lineIdx) => (
          <div key={`${animKey}-${lineIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{
              fontSize: '12px',
              color: '#8d6e63',
              fontFamily: "'Ma Shan Zheng', cursive",
              letterSpacing: '2px'
            }}>
              第{lineIdx + 1}句 {lineIdx % 2 === 0 ? '(出句)' : '(对句)'}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {line.chars.map((char, charIdx) => {
                const globalIdx = charList.findIndex(
                  c => c.lineIdx === lineIdx && c.charIdx === charIdx
                )
                const isFlashing = globalIdx === flashIdx
                const styles = getToneStyles(char.tone)

                return (
                  <div
                    key={`${lineIdx}-${charIdx}-${animKey}`}
                    onClick={() => handleClick(lineIdx, charIdx, char.tone)}
                    style={{
                      width: '52px',
                      height: '64px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: styles.bg,
                      color: styles.color,
                      border: styles.border,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease, transform 0.3s ease',
                      transform: isFlashing ? 'scale(1.25)' : 'scale(1)',
                      boxShadow: isFlashing
                        ? '0 0 20px rgba(0,188,212,0.6), inset 0 0 15px rgba(255,255,255,0.5)'
                        : char.isRhyme
                          ? `0 0 0 2px ${
                              window.getComputedStyle(document.body).getPropertyValue('--rhyme-color') || '#ce93d8'
                            }, 0 2px 4px rgba(0,0,0,0.1)`
                          : '0 2px 4px rgba(0,0,0,0.06)',
                      position: 'relative',
                      animation: isFlashing ? 'pingzeFlash 0.3s ease-out' : undefined,
                      userSelect: 'none'
                    }}
                    title="点击切换平仄"
                  >
                    {char.isRhyme && (
                      <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#ba68c8',
                        border: '1.5px solid #fff',
                        boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                      }} />
                    )}
                    <span style={{
                      fontSize: '22px',
                      fontWeight: 700,
                      color: '#3e2723',
                      lineHeight: 1.2,
                      fontFamily: "'Noto Serif SC', serif"
                    }}>{char.char}</span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      marginTop: '2px',
                      letterSpacing: '1px'
                    }}>
                      {TONE_LABELS[char.tone]}
                    </span>
                  </div>
                )
              })}
            </div>
            <div style={{
              display: 'flex',
              gap: '6px',
              paddingLeft: '4px'
            }}>
              {line.chars.map((char, charIdx) => (
                <div
                  key={`p-${lineIdx}-${charIdx}`}
                  style={{
                    width: '52px',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: char.tone === 'ping' ? '#0097a7' :
                           char.tone === 'ze' ? '#e64a19' : '#bdbdbd',
                    fontFamily: "'Ma Shan Zheng', cursive",
                    opacity: 0.8
                  }}
                >
                  {char.tone === 'ping' ? '○' : char.tone === 'ze' ? '●' : '△'}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 'auto',
        paddingTop: '16px',
        borderTop: '1px dashed #bfaaa0',
        fontSize: '12px',
        color: '#8d6e63',
        fontStyle: 'italic'
      }}>
        ✨ 提示：点击每个字可以手动切换平仄标注，修改后韵律指标会实时重算
      </div>

      <style>{`
        @keyframes pingzeFlash {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.5); }
          100% { filter: brightness(1); }
        }
        .fade-in-up {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default PingzePanel
