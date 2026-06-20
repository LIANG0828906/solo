import React, { useState, useCallback, useRef } from 'react'
import UrlInput from './components/UrlInput'
import PreviewCard, { CardData } from './components/PreviewCard'

const DEFAULT_CARDS: CardData[] = [
  {
    id: '1',
    url: 'https://github.com',
    domain: 'github.com',
    title: 'GitHub: Let\'s build from here',
    description: 'GitHub is where over 100 million developers shape the future of software, together.',
    favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
  },
  {
    id: '2',
    url: 'https://developer.mozilla.org',
    domain: 'developer.mozilla.org',
    title: 'MDN Web Docs',
    description: 'Resources for developers, by developers. Documenting web technologies since 2005.',
    favicon: 'https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=64',
  },
  {
    id: '3',
    url: 'https://stackoverflow.com',
    domain: 'stackoverflow.com',
    title: 'Stack Overflow - Where Developers Learn, Share',
    description: 'A public platform building the definitive collection of coding questions & answers.',
    favicon: 'https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=64',
  },
  {
    id: '4',
    url: 'https://react.dev',
    domain: 'react.dev',
    title: 'React - The library for web and native user interfaces',
    description: 'Build user interfaces out of individual pieces called components written in JavaScript.',
    favicon: 'https://www.google.com/s2/favicons?domain=react.dev&sz=64',
  },
]

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

async function fetchPageMeta(url: string): Promise<{ title: string; description: string }> {
  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
    if (!response.ok) throw new Error('Failed to fetch')
    const data = await response.json()
    const html = data.contents
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const title = doc.querySelector('title')?.textContent?.trim() || ''
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || ''
    return { title, description }
  } catch {
    return { title: '', description: '' }
  }
}

const App: React.FC = () => {
  const [cards, setCards] = useState<CardData[]>(DEFAULT_CARDS)
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [exportSuccess, setExportSuccess] = useState(false)
  const newCardIds = useRef<Set<string>>(new Set())

  const handleAdd = useCallback(async (url: string) => {
    const domain = extractDomain(url)
    if (!domain) return
    const id = generateId()
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    const newCard: CardData = {
      id,
      url,
      domain,
      title: '',
      description: '',
      favicon,
      isNew: true,
    }
    newCardIds.current.add(id)
    setCards((prev) => [...prev, newCard])
    setTimeout(() => {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isNew: false } : c))
      )
    }, 600)
    const meta = await fetchPageMeta(url)
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, title: meta.title || '未知站点', description: meta.description }
          : c
      )
    )
  }, [])

  const handleDelete = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback((_index: number) => {
  }, [])

  const handleDrop = useCallback(
    (index: number) => {
      if (draggedIndex === null || draggedIndex === index) return
      setCards((prev) => {
        const result = [...prev]
        const [draggedItem] = result.splice(draggedIndex, 1)
        result.splice(index, 0, draggedItem)
        return result
      })
      setDraggedIndex(null)
    },
    [draggedIndex]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
  }, [])

  const handleExport = useCallback(async () => {
    const urlList = cards.map((c) => c.url).join('\n')
    try {
      await navigator.clipboard.writeText(urlList)
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }, [cards])

  const isFiltered = (card: CardData): boolean => {
    if (!searchQuery.trim()) return false
    const query = searchQuery.toLowerCase()
    return (
      !card.title.toLowerCase().includes(query) &&
      !card.description.toLowerCase().includes(query)
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
        padding: '48px 32px 80px',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <h1
          style={{
            color: '#fff',
            fontSize: 36,
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: '-0.5px',
          }}
        >
          站点预览快照墙
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 15,
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          可视化管理你的书签收藏
        </p>

        <div style={{ marginBottom: 48 }}>
          <UrlInput onAdd={handleAdd} />
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            maxWidth: 720,
            margin: '0 auto 32px',
          }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索站点名称或描述..."
              style={{
                width: '100%',
                height: 48,
                padding: '0 20px 0 44px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 12,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.25s ease',
                boxShadow: '0 0 8px rgba(100,149,237,0.3)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(100,149,237,0.9)'
                e.currentTarget.style.boxShadow = '0 0 14px rgba(100,149,237,0.7)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
                e.currentTarget.style.boxShadow = '0 0 8px rgba(100,149,237,0.3)'
              }}
            />
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <button
            onClick={handleExport}
            style={{
              height: 48,
              padding: '0 24px',
              backgroundColor: exportSuccess
                ? 'rgba(34, 197, 94, 0.85)'
                : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.3s ease',
              minWidth: 120,
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (!exportSuccess) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.16)'
              }
            }}
            onMouseLeave={(e) => {
              if (!exportSuccess) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {exportSuccess ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                已复制
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                导出书签
              </>
            )}
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {cards.map((card, index) => (
            <PreviewCard
              key={card.id}
              card={card}
              index={index}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
              filtered={isFiltered(card)}
            />
          ))}
        </div>

        {cards.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ margin: '0 auto 16px', opacity: 0.5 }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <div style={{ fontSize: 16 }}>还没有添加任何站点</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>在上方输入框粘贴 URL 开始使用</div>
          </div>
        )}
      </div>

      <style>{`
        input::placeholder {
          color: rgba(255,255,255,0.35);
        }
      `}</style>
    </div>
  )
}

export default App
