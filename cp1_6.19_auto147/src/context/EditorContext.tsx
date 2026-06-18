import React, { createContext, useContext, useState, useCallback } from 'react'
import type { Sticker, StickerTemplate, CanvasBackground, EditorContextType } from '@/types'

const PRESET_STICKERS: StickerTemplate[] = [
  { id: 's1', type: 'preset', content: '🌸', width: 80, height: 80 },
  { id: 's2', type: 'preset', content: '🌺', width: 80, height: 80 },
  { id: 's3', type: 'preset', content: '🌻', width: 80, height: 80 },
  { id: 's4', type: 'preset', content: '🌷', width: 80, height: 80 },
  { id: 's5', type: 'preset', content: '🌹', width: 80, height: 80 },
  { id: 's6', type: 'preset', content: '🍀', width: 80, height: 80 },
  { id: 's7', type: 'preset', content: '🌿', width: 80, height: 80 },
  { id: 's8', type: 'preset', content: '🍃', width: 80, height: 80 },
  { id: 's9', type: 'preset', content: '🦋', width: 80, height: 80 },
  { id: 's10', type: 'preset', content: '🐝', width: 80, height: 80 },
  { id: 's11', type: 'preset', content: '⭐', width: 80, height: 80 },
  { id: 's12', type: 'preset', content: '✨', width: 80, height: 80 },
  { id: 's13', type: 'preset', content: '💖', width: 80, height: 80 },
  { id: 's14', type: 'preset', content: '💕', width: 80, height: 80 },
  { id: 's15', type: 'preset', content: '🎀', width: 80, height: 80 },
  { id: 's16', type: 'preset', content: '📷', width: 80, height: 80 },
  { id: 's17', type: 'preset', content: '📝', width: 80, height: 80 },
  { id: 's18', type: 'preset', content: '🎨', width: 80, height: 80 },
  { id: 's19', type: 'preset', content: '🌈', width: 80, height: 80 },
  { id: 's20', type: 'preset', content: '☁️', width: 80, height: 80 },
]

const EditorContext = createContext<EditorContextType | null>(null)

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)
  const [stickerTemplates, setStickerTemplates] = useState<StickerTemplate[]>(PRESET_STICKERS)
  const [canvasBackground, setCanvasBackground] = useState<CanvasBackground>('#FFFFFF')
  const [maxZIndex, setMaxZIndex] = useState(0)

  const addSticker = useCallback((template: StickerTemplate, x: number, y: number) => {
    const newZ = maxZIndex + 1
    setMaxZIndex(newZ)
    const newSticker: Sticker = {
      id: `${template.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: template.type,
      content: template.content,
      x,
      y,
      scale: 1,
      rotation: 0,
      opacity: 1,
      width: template.width,
      height: template.height,
      zIndex: newZ,
    }
    setStickers(prev => [...prev, newSticker])
    setSelectedStickerId(newSticker.id)
  }, [maxZIndex])

  const selectSticker = useCallback((id: string | null) => {
    setSelectedStickerId(id)
    if (id) {
      setStickers(prev => {
        const sticker = prev.find(s => s.id === id)
        if (!sticker) return prev
        const newZ = Math.max(...prev.map(s => s.zIndex), maxZIndex) + 1
        setMaxZIndex(newZ)
        return prev.map(s => (s.id === id ? { ...s, zIndex: newZ } : s))
      })
    }
  }, [maxZIndex])

  const updateStickerProp = useCallback((id: string, prop: Partial<Sticker>) => {
    setStickers(prev => prev.map(s => (s.id === id ? { ...s, ...prop } : s)))
  }, [])

  const deleteSticker = useCallback((id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id))
    if (selectedStickerId === id) {
      setSelectedStickerId(null)
    }
  }, [selectedStickerId])

  const clearCanvas = useCallback(() => {
    setStickers([])
    setSelectedStickerId(null)
  }, [])

  const addImageSticker = useCallback((dataUrl: string, width: number, height: number) => {
    const maxSize = 200
    let w = width
    let h = height
    if (w > maxSize || h > maxSize) {
      const ratio = Math.min(maxSize / w, maxSize / h)
      w = Math.round(w * ratio)
      h = Math.round(h * ratio)
    }
    const newTemplate: StickerTemplate = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'image',
      content: dataUrl,
      width: w,
      height: h,
    }
    setStickerTemplates(prev => [...prev, newTemplate])
  }, [])

  const value: EditorContextType = {
    stickers,
    selectedStickerId,
    stickerTemplates,
    canvasBackground,
    addSticker,
    selectSticker,
    updateStickerProp,
    deleteSticker,
    clearCanvas,
    addImageSticker,
    setCanvasBackground,
  }

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

export const useEditor = (): EditorContextType => {
  const ctx = useContext(EditorContext)
  if (!ctx) {
    throw new Error('useEditor must be used within EditorProvider')
  }
  return ctx
}
