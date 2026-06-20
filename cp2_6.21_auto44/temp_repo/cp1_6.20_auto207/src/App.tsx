import { useState, useCallback, useMemo } from 'react'
import { Card } from './types'
import CanvasArea from './components/CanvasArea'
import PreviewPanel from './components/PreviewPanel'
import CardEditor from './components/CardEditor'

function App() {
  const [cards, setCards] = useState<Card[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editorId, setEditorId] = useState<string | null>(null)
  const [bounds, setBounds] = useState({ width: 0, height: 0 })

  const handleAddCard = useCallback((card: Card) => {
    setCards((prev) => [...prev, card])
  }, [])

  const handleUpdateCard = useCallback((id: string, patch: Partial<Card>) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    )
  }, [])

  const handleBoundsChange = useCallback((w: number, h: number) => {
    setBounds((b) => (b.width === w && b.height === h ? b : { width: w, height: h }))
  }, [])

  const handleOpenEditor = useCallback((id: string) => {
    setEditorId(id)
  }, [])

  const handleEditorUpdate = useCallback(
    (patch: Partial<Card>) => {
      if (!editorId) return
      handleUpdateCard(editorId, patch)
    },
    [editorId, handleUpdateCard],
  )

  const editorCard = useMemo(
    () => cards.find((c) => c.id === editorId) ?? null,
    [cards, editorId],
  )

  return (
    <div className="app">
      <CanvasArea
        cards={cards}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAddCard={handleAddCard}
        onUpdateCard={handleUpdateCard}
        onOpenEditor={handleOpenEditor}
        onBoundsChange={handleBoundsChange}
      />
      <PreviewPanel cards={cards} canvasBounds={bounds} />
      {editorCard && (
        <CardEditor
          card={editorCard}
          onClose={() => setEditorId(null)}
          onUpdate={handleEditorUpdate}
        />
      )}
    </div>
  )
}

export default App
