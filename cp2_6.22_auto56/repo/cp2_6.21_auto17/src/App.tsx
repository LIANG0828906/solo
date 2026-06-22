import React, { useState, useEffect, useMemo, useRef } from 'react'
import { DiaryEntry, MoodType, MOOD_CONFIG, generateMockData } from './data/moodData'
import Timeline from './timeline/Timeline'
import WeekTrend from './chart/WeekTrend'

const MOOD_LIST: MoodType[] = ['happy', 'calm', 'sad', 'angry', 'anxious', 'tired']

const App: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const searchTimerRef = useRef<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEntries(generateMockData(30))
  }, [])

  useEffect(() => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current)
    }
    searchTimerRef.current = window.setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current)
      }
    }
  }, [searchQuery])

  const handleAddEntry = (entry: DiaryEntry) => {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== entry.date)
      return [entry, ...filtered]
    })
  }

  const handleMoodFilter = (mood: MoodType) => {
    setSelectedMood((prev) => (prev === mood ? null : mood))
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setDebouncedSearch('')
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (selectedMood && entry.mood !== selectedMood) {
        return false
      }
      if (debouncedSearch && debouncedSearch.trim() !== '') {
        const keyword = debouncedSearch.trim().toLowerCase()
        if (!entry.description.toLowerCase().includes(keyword)) {
          return false
        }
      }
      return true
    })
  }, [entries, selectedMood, debouncedSearch])

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>情绪日记</h1>
        <p style={styles.subtitle}>记录每一天的心情变化</p>
      </header>

      <div style={styles.filterSection}>
        <div style={styles.moodFilters}>
          {MOOD_LIST.map((mood) => (
            <button
              key={mood}
              onClick={() => handleMoodFilter(mood)}
              style={{
                ...styles.moodFilterBtn,
                ...(selectedMood === mood ? styles.moodFilterBtnActive : {}),
              }}
              title={MOOD_CONFIG[mood].label}
            >
              <span style={styles.moodFilterEmoji}>{MOOD_CONFIG[mood].emoji}</span>
            </button>
          ))}
        </div>

        <div style={styles.searchWrapper}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索日记内容..."
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={handleClearSearch} style={styles.searchClearBtn}>
              ✕
            </button>
          )}
        </div>
      </div>

      <Timeline entries={filteredEntries} onAddEntry={handleAddEntry} />

      <WeekTrend entries={entries} />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    paddingBottom: '40px',
  },
  header: {
    textAlign: 'center',
    padding: '48px 20px 24px',
  },
  title: {
    fontSize: '36px',
    color: '#4a3326',
    fontWeight: 'bold',
    marginBottom: '8px',
    letterSpacing: '2px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#7a6653',
  },
  filterSection: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '0 20px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  moodFilters: {
    display: 'flex',
    gap: '14px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  moodFilterBtn: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.75)',
    border: '1px solid #e0c9b0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.25s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  moodFilterBtnActive: {
    background: '#f5e6d3',
    border: '2px solid #c97b5d',
    transform: 'scale(1.1)',
    boxShadow: '0 4px 12px rgba(201, 123, 93, 0.2)',
  },
  moodFilterEmoji: {
    fontSize: '24px',
    lineHeight: 1,
  },
  searchWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
  },
  searchInput: {
    width: '100%',
    height: '48px',
    padding: '0 48px 0 20px',
    borderRadius: '24px',
    border: '1px solid #d4a574',
    background: 'rgba(255,255,255,0.8)',
    fontSize: '14px',
    color: '#4a3326',
    transition: 'all 0.25s ease',
  },
  searchClearBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'rgba(212, 165, 116, 0.2)',
    color: '#7a6653',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.25s ease',
  },
}

export default App
