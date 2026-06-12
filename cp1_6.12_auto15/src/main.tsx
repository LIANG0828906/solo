import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import ArticleReader from './components/ArticleReader'
import SidePanel from './components/SidePanel'

export interface Highlight {
  id: string
  text: string
  startOffset: number
  endOffset: number
  paragraphIndex: number
}

export interface Note {
  id: string
  content: string
  paragraphIndex: number
  timestamp: number
}

type Theme = 'light' | 'dark'

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light')
  const [progress, setProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [articleText, setArticleText] = useState('')
  const [paragraphs, setParagraphs] = useState<{ id: number; text: string }[]>([])

  useEffect(() => {
    fetch('/api/article')
      .then(res => res.json())
      .then(data => {
        setArticleText(data.content)
        setParagraphs(data.paragraphs)
      })
      .catch(err => console.error('Failed to load article:', err))

    fetch('/api/notes')
      .then(res => res.json())
      .then(data => {
        setNotes(data.notes)
      })
      .catch(err => console.error('Failed to load notes:', err))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const addHighlight = useCallback((highlight: Highlight) => {
    setHighlights(prev => {
      const exists = prev.find(h => h.text === highlight.text)
      if (exists) return prev
      return [...prev, highlight]
    })
  }, []

  const removeHighlight = useCallback((id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id))
  }, [])

  const addNote = useCallback((content: string, paragraphIndex: number) => {
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      paragraphIndex,
      timestamp: Date.now(),
    }
    setNotes(prev => [...prev, newNote])
    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNote),
    }).catch(err => console.error('Failed to save note:', err))
  }, [])

  const removeNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    fetch(`/api/notes/${id}`, { method: 'DELETE' })
      .catch(err => console.error('Failed to delete note:', err))
  }, [])

  const scrollToParagraph = useCallback((paragraphIndex: number) => {
    const element = document.getElementById(`paragraph-${paragraphIndex}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const scrollToHighlight = useCallback((startOffset: number, paragraphIndex: number) => {
    const element = document.getElementById(`paragraph-${paragraphIndex}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const getCurrentParagraph = useCallback((): number => {
    let currentIdx = 0
    for (let i = 0; i < paragraphs.length; i++) {
      const el = document.getElementById(`paragraph-${i}`)
      if (el) {
        const rect = el.getBoundingClientRect()
        if (rect.top <= window.innerHeight / 2) {
          currentIdx = i
        }
      }
    }
    return currentIdx
  }, [paragraphs])

  const themeColors = {
    light: {
      bg: '#F5F3EF',
      text: '#4A5568',
      accent: '#8FA89B',
      card: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(143, 168, 155, 0.2)',
      progress: '#8FA89B',
    },
    dark: {
      bg: '#2D3748',
      text: '#E2E8F0',
      accent: '#B8C5B0',
      card: 'rgba(45, 55, 72, 0.7)',
      border: 'rgba(184, 197, 176, 0.2)',
      progress: '#B8C5B0',
    },
  }

  const colors = themeColors[theme]

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        color: colors.text,
        transition: 'background-color 0.5s ease, color 0.5s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: 'rgba(128, 128, 128, 0.2)',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: colors.progress,
            transition: 'width 0.3s ease, background-color 0.5s ease',
          }}
        />
      </div>

      <header
        style={{
          position: 'fixed',
          top: '12px',
          right: '16px',
          zIndex: 999,
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <button
          onClick={toggleTheme}
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.card,
            color: colors.text,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {theme === 'light' ? '🌙 暗色' : '☀️ 亮色'}
        </button>
      </header>

      <div
        style={{
          display: 'flex',
          paddingTop: '60px',
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            flex: 1,
            maxWidth: '100%',
            padding: '0 16px 0 24px',
            paddingRight: window.innerWidth >= 768 ? '420px' : '16px',
          }}
        >
          <ArticleReader
            paragraphs={paragraphs}
            highlights={highlights}
            onProgressChange={setProgress}
            onEstimatedTimeChange={setEstimatedTime}
            onAddHighlight={addHighlight}
          />
        </div>

        {window.innerWidth >= 768 ? (
          <SidePanel
            theme={theme}
            progress={progress}
            estimatedTime={estimatedTime}
            highlights={highlights}
            notes={notes}
            colors={colors}
            onRemoveHighlight={removeHighlight}
            onAddNote={(content) => addNote(content, getCurrentParagraph())}
            onRemoveNote={removeNote}
            onScrollToParagraph={scrollToParagraph}
            onScrollToHighlight={scrollToHighlight}
          />
        ) : (
          <>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: colors.accent,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                fontSize: '24px',
                zIndex: 998,
              }}
            >
              📝
            </button>
            {sidebarOpen && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  zIndex: 999,
                  display: sidebarOpen ? 'block' : 'none',
                }}
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '85vh',
                transform: sidebarOpen ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.3s ease',
                zIndex: 1000,
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
              }}
            >
              <SidePanel
                theme={theme}
                progress={progress}
                estimatedTime={estimatedTime}
                highlights={highlights}
                notes={notes}
                colors={colors}
                onRemoveHighlight={removeHighlight}
                onAddNote={(content) => addNote(content, getCurrentParagraph())}
                onRemoveNote={removeNote}
                onScrollToParagraph={scrollToParagraph}
                onScrollToHighlight={scrollToHighlight}
                mobile
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
