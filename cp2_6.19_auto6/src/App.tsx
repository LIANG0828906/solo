import { useState, useMemo, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import Timeline from './components/Timeline'
import MemoryGrid from './components/MemoryGrid'
import { Memory, sampleMemories, generateYearList } from './data/sampleData'

function App() {
  const [memories, setMemories] = useState<Memory[]>(sampleMemories)
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [newMemoryId, setNewMemoryId] = useState<string | null>(null)
  const yearListRef = useRef<number[]>([])

  const yearList = useMemo(() => {
    const list = generateYearList(memories)
    yearListRef.current = list
    return list
  }, [memories])

  const yearMemories = useMemo(() => {
    return memories
      .filter(m => m.year === selectedYear)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [memories, selectedYear])

  const getYearMemoryCount = useCallback((year: number) => {
    return memories.filter(m => m.year === year).length
  }, [memories])

  const handleAddMemory = useCallback((newMemory: Omit<Memory, 'id'>) => {
    const memory: Memory = {
      ...newMemory,
      id: crypto.randomUUID()
    }
    setMemories(prev => [...prev, memory])
    setSelectedYear(memory.year)
    setNewMemoryId(memory.id)
    
    setTimeout(() => {
      setNewMemoryId(null)
    }, 1000)
  }, [])

  const handleUpdateMemory = useCallback((id: string, updates: Partial<Memory>) => {
    setMemories(prev => prev.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ))
  }, [])

  const handleDeleteMemory = useCallback((id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id))
  }, [])

  return (
    <div className="app-container">
      <aside className="timeline-section">
        <div className="timeline-header">
          <h1 className="timeline-title">时光相册</h1>
          <p className="timeline-subtitle">滑动时间轴，翻阅你的记忆</p>
        </div>
        <Timeline
          yearList={yearList}
          selectedYear={selectedYear}
          onSelect={setSelectedYear}
          getYearMemoryCount={getYearMemoryCount}
        />
      </aside>
      <main className="memory-section">
        <AnimatePresence mode="wait">
          <MemoryGrid
            key={selectedYear}
            memories={yearMemories}
            selectedYear={selectedYear}
            onAddMemory={handleAddMemory}
            onUpdateMemory={handleUpdateMemory}
            onDeleteMemory={handleDeleteMemory}
            newMemoryId={newMemoryId}
          />
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
