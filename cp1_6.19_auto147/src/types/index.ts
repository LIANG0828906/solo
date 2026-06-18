export interface Sticker {
  id: string
  type: 'preset' | 'image'
  content: string
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
  width: number
  height: number
  zIndex: number
}

export interface StickerTemplate {
  id: string
  type: 'preset' | 'image'
  content: string
  width: number
  height: number
}

export type CanvasBackground = '#FFFFFF' | '#FFF8E1' | '#E3F2FD' | '#FCE4EC'

export interface EditorContextType {
  stickers: Sticker[]
  selectedStickerId: string | null
  stickerTemplates: StickerTemplate[]
  canvasBackground: CanvasBackground
  addSticker: (template: StickerTemplate, x: number, y: number) => void
  selectSticker: (id: string | null) => void
  updateStickerProp: (id: string, prop: Partial<Sticker>) => void
  deleteSticker: (id: string) => void
  clearCanvas: () => void
  addImageSticker: (dataUrl: string, width: number, height: number) => void
  setCanvasBackground: (bg: CanvasBackground) => void
}
