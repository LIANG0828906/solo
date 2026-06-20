import { useEffect, useRef, useState } from 'react'
import { useStore, type Mood } from '../store'
import { AssistantAnimator } from '../utils/assistantAnim'
import { speechManager } from '../utils/speech'
import VoiceVisualizer from './VoiceVisualizer'

export default function MirrorView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animatorRef = useRef<AssistantAnimator | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  const {
    isListening,
    currentMood,
    sourceLang,
    targetLang,
    currentText,
    translatedText,
    messages,
    audioLevel,
    setIsListening,
    setMood,
    setCurrentText,
    setTranslatedText,
    addMessage,
    setAudioLevel,
    toggleLanguages,
  } = useStore()

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (animatorRef.current) {
        animatorRef.current.setScale(mobile ? 0.67 : 1)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    const animator = new AssistantAnimator(canvasRef.current)
    animatorRef.current = animator
    animator.setScale(isMobile ? 0.67 : 1)
    animator.start()

    const handleResize = () => {
      animator.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      animator.stop()
    }
  }, [isMobile])

  useEffect(() => {
    if (animatorRef.current) {
      animatorRef.current.setMood(currentMood)
    }
  }, [currentMood])

  useEffect(() => {
    if (animatorRef.current) {
      animatorRef.current.setSpeaking(isListening)
    }
  }, [isListening])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentText, translatedText])

  const translateText = async (text: string): Promise<string> => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source: sourceLang, target: targetLang }),
      })
      const data = await res.json()
      return data.translated || text
    } catch {
      const mockTranslations: Record<string, Record<string, string>> = {
        zh: {
          '你好': 'Hello',
          '今天天气怎么样': 'How is the weather today',
          '我想练习英语': 'I want to practice English',
          '谢谢': 'Thank you',
          '再见': 'Goodbye',
        },
        en: {
          'hello': '你好',
          'how are you': '你好吗',
          'i want to practice': '我想练习',
          'thank you': '谢谢',
          'goodbye': '再见',
        },
      }
      const lower = text.toLowerCase().trim()
      const dict = mockTranslations[sourceLang] || {}
      for (const [k, v] of Object.entries(dict)) {
        if (lower.includes(k.toLowerCase())) return v
      }
      return `[${targetLang.toUpperCase()}] ${text}`
    }
  }

  const updateMoodFromText = (text: string, isFinal: boolean) => {
    if (!isFinal) return
    const t = text.toLowerCase()
    let mood: Mood = 'happy'
    if (t.includes('?') || t.includes('吗') || t.includes('怎么') || t.includes('什么')) {
      mood = 'confused'
    } else if (t.includes('嗯') || t.includes('...') || t.includes('think') || t.includes('让我')) {
      mood = 'thinking'
    } else if (t.includes('棒') || t.includes('好') || t.includes('great') || t.includes('good') || t.includes('加油')) {
      mood = 'encouraging'
    }
    setMood(mood)
    setTimeout(() => setMood('happy'), 2500)
  }

  const toggleRecording = async () => {
    if (isListening) {
      speechManager.stopListening()
      setIsListening(false)
    } else {
      setIsListening(true)
      setMood('thinking')
      await speechManager.startListening(sourceLang, {
        onResult: async (text, isFinal) => {
          setCurrentText(text)
          updateMoodFromText(text, isFinal)

          if (isFinal) {
            setMood('thinking')
            const translated = await translateText(text)
            setTranslatedText(translated)

            addMessage({
              id: Date.now().toString(),
              original: text,
              translated,
              timestamp: Date.now(),
              sourceLang,
              targetLang,
            })

            setMood('encouraging')
            speechManager.speakText(translated, targetLang)
            setTimeout(() => setMood('happy'), 3000)
          }
        },
        onAudioLevel: (level) => {
          setAudioLevel(level)
        },
        onEnd: () => {
          setIsListening(false)
          setAudioLevel(0)
        },
        onError: (e) => {
          console.warn('Speech error:', e)
        },
      })
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.mirror as React.CSSProperties}>
        <div style={styles.haloTop} />
        <div style={styles.haloBottom} />

        <div style={styles.header}>
          <div style={styles.titleRow}>
            <span style={styles.titleIcon}>✦</span>
            <span style={styles.title}>语伴魔镜</span>
          </div>
          <div style={styles.langSwitch}>
            <button
              onClick={toggleLanguages}
              style={{
                ...styles.langBtn,
                ...(sourceLang === 'zh' ? styles.langBtnActive : {}),
              }}
            >
              中文
            </button>
            <span style={styles.langArrow}>⇄</span>
            <button
              onClick={toggleLanguages}
              style={{
                ...styles.langBtn,
                ...(sourceLang === 'en' ? styles.langBtnActive : {}),
              }}
            >
              English
            </button>
          </div>
        </div>

        <div style={styles.assistantArea}>
          {messages.slice(-3).map((msg) => (
            <div key={msg.id} style={{ ...styles.bubbleWrapper, animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ ...styles.bubbleLeft, animation: 'slideInLeft 0.3s ease-out' }}>
                <span style={styles.bubbleLabel}>{msg.sourceLang === 'zh' ? '中文' : 'EN'}</span>
                <span style={styles.bubbleText}>{msg.original}</span>
              </div>
              <div style={{ ...styles.bubbleRight, animation: 'slideInRight 0.3s ease-out' }}>
                <span style={styles.bubbleLabelBlue}>{msg.targetLang === 'zh' ? '中文' : 'EN'}</span>
                <span style={styles.bubbleText}>{msg.translated}</span>
              </div>
            </div>
          ))}

          {currentText && (
            <div style={{ ...styles.bubbleWrapper, animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ ...styles.bubbleLeft, animation: 'slideInLeft 0.3s ease-out', opacity: isListening ? 0.9 : 1 }}>
                <span style={styles.bubbleLabel}>{sourceLang === 'zh' ? '中文' : 'EN'}</span>
                <span style={styles.bubbleText}>{currentText}</span>
              </div>
              {translatedText && (
                <div style={{ ...styles.bubbleRight, animation: 'slideInRight 0.3s ease-out' }}>
                  <span style={styles.bubbleLabelBlue}>{targetLang === 'zh' ? '中文' : 'EN'}</span>
                  <span style={styles.bubbleText}>{translatedText}</span>
                </div>
              )}
            </div>
          )}

          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: isMobile ? '280px' : '420px',
              display: 'block',
            }}
          />
        </div>

        <div style={styles.controlsArea}>
          <div style={styles.visualizerContainer}>
            <VoiceVisualizer audioLevel={audioLevel} isActive={isListening} />
          </div>

          <button
            onClick={toggleRecording}
            style={{
              ...styles.micBtn,
              ...(isListening ? styles.micBtnRecording : {}),
              animation: isListening ? 'pulse 0.4s ease-in-out infinite' : 'none',
            }}
          >
            {isListening ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>

          <div style={styles.hintText}>
            {isListening ? '正在聆听... 请说话' : '点击麦克风开始对话'}
          </div>
        </div>

        <div ref={messagesEndRef} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
  },
  mirror: {
    position: 'relative',
    width: '100%',
    maxWidth: '980px',
    minHeight: '680px',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '24px',
    border: '1.5px solid transparent',
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0.05)),
      linear-gradient(135deg, #C084FC, #8B5CF6)
    `,
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box',
    boxShadow: '0 0 80px rgba(139, 92, 246, 0.2), inset 0 0 60px rgba(192, 132, 252, 0.05)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  haloTop: {
    position: 'absolute',
    top: '-80px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '400px',
    height: '200px',
    background: 'radial-gradient(ellipse, rgba(192, 132, 252, 0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  haloBottom: {
    position: 'absolute',
    bottom: '-60px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '350px',
    height: '180px',
    background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    borderBottom: '1px solid rgba(192, 132, 252, 0.15)',
    position: 'relative',
    zIndex: 1,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  titleIcon: {
    fontSize: '22px',
    color: '#F0E68C',
    textShadow: '0 0 10px rgba(240, 230, 140, 0.5)',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: '2px',
    background: 'linear-gradient(135deg, #F0E68C, #C084FC)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  langSwitch: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '4px',
    borderRadius: '10px',
  },
  langBtn: {
    padding: '8px 18px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  },
  langBtnActive: {
    background: '#8B5CF6',
    color: '#FFFFFF',
    boxShadow: '0 2px 12px rgba(139, 92, 246, 0.4)',
  },
  langArrow: {
    color: '#C084FC',
    fontSize: '16px',
    margin: '0 4px',
  },
  assistantArea: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    overflow: 'hidden',
  },
  bubbleWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 24px',
    gap: '16px',
    zIndex: 2,
  },
  bubbleLeft: {
    maxWidth: '45%',
    background: '#2D1B4E',
    borderRadius: '16px',
    padding: '12px 16px',
    border: '1px solid rgba(192, 132, 252, 0.3)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  bubbleRight: {
    maxWidth: '45%',
    background: '#1E3A5F',
    borderRadius: '16px',
    padding: '12px 16px',
    border: '1px solid rgba(100, 150, 255, 0.3)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  bubbleLabel: {
    display: 'inline-block',
    fontSize: '11px',
    color: '#C084FC',
    fontWeight: 600,
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  bubbleLabelBlue: {
    display: 'inline-block',
    fontSize: '11px',
    color: '#60A5FA',
    fontWeight: 600,
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  bubbleText: {
    display: 'block',
    fontSize: '14px',
    color: '#FFFFFF',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  controlsArea: {
    position: 'relative',
    height: '140px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '24px',
  },
  visualizerContainer: {
    position: 'absolute',
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '200px',
    height: '200px',
    pointerEvents: 'none',
  },
  micBtn: {
    position: 'relative',
    zIndex: 10,
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: 'none',
    background: '#8B5CF6',
    color: '#FFFFFF',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.5)',
    transition: 'all 0.3s ease',
  },
  micBtnRecording: {
    background: '#EF4444',
    boxShadow: '0 4px 25px rgba(239, 68, 68, 0.6)',
  },
  hintText: {
    marginTop: '12px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: '0.5px',
  },
}
