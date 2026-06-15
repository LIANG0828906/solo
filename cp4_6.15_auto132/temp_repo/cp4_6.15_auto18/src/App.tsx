import { useState, useEffect, useCallback } from 'react'
import InspirationPool from './InspirationPool'
import PlanGenerator from './PlanGenerator'
import type { Inspiration, GeneratedPlan, FilterTagType } from './types'
import { loadInspirations, saveInspirations } from './utils'

function App() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTagType>('all')

  useEffect(() => {
    const start = performance.now()
    const loaded = loadInspirations()
    const duration = performance.now() - start
    if (duration > 200) {
      console.warn(`数据加载耗时: ${duration.toFixed(2)}ms`)
    }
    setInspirations(loaded.sort((a, b) => a.order - b.order))
  }, [])

  useEffect(() => {
    if (inspirations.length > 0) {
      saveInspirations(inspirations)
    }
  }, [inspirations])

  const addInspiration = useCallback((inspiration: Inspiration) => {
    const start = performance.now()
    setInspirations(prev => [...prev, inspiration])
    const duration = performance.now() - start
    if (duration > 100) {
      console.warn(`添加灵感响应耗时: ${duration.toFixed(2)}ms`)
    }
  }, [])

  const removeInspiration = useCallback((id: string) => {
    const start = performance.now()
    setInspirations(prev => prev.filter(i => i.id !== id))
    setSelectedIds(prev => prev.filter(sid => sid !== id))
    const duration = performance.now() - start
    if (duration > 100) {
      console.warn(`删除灵感响应耗时: ${duration.toFixed(2)}ms`)
    }
  }, [])

  const archiveInspiration = useCallback((id: string) => {
    const start = performance.now()
    setInspirations(prev =>
      prev.map(i => (i.id === id ? { ...i, isArchived: true } : i))
    )
    const duration = performance.now() - start
    if (duration > 100) {
      console.warn(`归档灵感响应耗时: ${duration.toFixed(2)}ms`)
    }
  }, [])

  const toggleSelection = useCallback((id: string) => {
    const start = performance.now()
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(sid => sid !== id)
      }
      if (prev.length >= 5) {
        return prev
      }
      return [...prev, id]
    })
    const duration = performance.now() - start
    if (duration > 100) {
      console.warn(`选择响应耗时: ${duration.toFixed(2)}ms`)
    }
  }, [])

  const updateOrder = useCallback((newOrder: Inspiration[]) => {
    setInspirations(newOrder)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
    setGeneratedPlan(null)
  }, [])

  const handleGeneratePlan = useCallback(() => {
    setIsGenerating(true)
  }, [])

  const handlePlanGenerated = useCallback((plan: GeneratedPlan) => {
    setGeneratedPlan(plan)
    setIsGenerating(false)
  }, [])

  const handleGenerateError = useCallback(() => {
    setIsGenerating(false)
  }, [])

  const filteredInspirations = inspirations.filter(i => !i.isArchived)

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">✦ 灵感随行 ✦</h1>
        <p className="app-subtitle">捕获每一个灵感火花，生成专属创作计划</p>
      </header>

      <main className="main-content">
        <section className="section">
          <InspirationPool
            inspirations={filteredInspirations}
            selectedIds={selectedIds}
            activeFilter={activeFilter}
            onAdd={addInspiration}
            onRemove={removeInspiration}
            onArchive={archiveInspiration}
            onToggleSelect={toggleSelection}
            onOrderChange={updateOrder}
            onFilterChange={setActiveFilter}
          />
        </section>

        <section className="section">
          <PlanGenerator
            inspirations={inspirations}
            selectedIds={selectedIds}
            isGenerating={isGenerating}
            generatedPlan={generatedPlan}
            onToggleSelect={toggleSelection}
            onClearSelection={clearSelection}
            onGenerate={handleGeneratePlan}
            onPlanGenerated={handlePlanGenerated}
            onError={handleGenerateError}
          />
        </section>
      </main>
    </div>
  )
}

export default App
