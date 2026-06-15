import { useState, useCallback, useRef, useEffect } from 'react'
import { CanvasIcon, Icon } from '@/types'
import { icons } from '@/data/icons'

export function useIconInteraction(canvasIcons: CanvasIcon[], setCanvasIcons: (icons: CanvasIcon[]) => void) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDraggingIcon, setIsDraggingIcon] = useState(false)
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false)
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null)
  const dragStartPos = useRef({ x: 0, y: 0, iconX: 0, iconY: 0 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const selectIcon = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const deleteSelectedIcon = useCallback(() => {
    if (selectedId) {
      setCanvasIcons((prev) => prev.filter((icon) => icon.id !== selectedId))
      setSelectedId(null)
    }
  }, [selectedId, setCanvasIcons])

  const handleIconClick = useCallback((e: React.MouseEvent, iconId: string) => {
    e.stopPropagation()
    if (selectedId === iconId) {
      setSelectedId(null)
    } else {
      setSelectedId(iconId)
    }
  }, [selectedId])

  const handleIconDoubleClick = useCallback((e: React.MouseEvent, iconId: string) => {
    e.stopPropagation()
    setReplaceTargetId(iconId)
    setReplaceDialogOpen(true)
  }, [])

  const handleIconMouseDown = useCallback((e: React.MouseEvent, iconId: string) => {
    e.stopPropagation()
    const icon = canvasIcons.find((i) => i.id === iconId)
    if (!icon) return

    setIsDraggingIcon(true)
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      iconX: icon.x,
      iconY: icon.y,
    }
    setSelectedId(iconId)
  }, [canvasIcons])

  const handleIconMouseMove = useCallback((e: MouseEvent, canvasWidth: number, canvasHeight: number) => {
    if (!isDraggingIcon || !selectedId) return

    const dx = e.clientX - dragStartPos.current.x
    const dy = e.clientY - dragStartPos.current.y

    setCanvasIcons((prev) =>
      prev.map((icon) => {
        if (icon.id !== selectedId) return icon

        let newX = dragStartPos.current.iconX + dx
        let newY = dragStartPos.current.iconY + dy

        const iconSize = 24 * icon.scale
        newX = Math.max(iconSize / 2, Math.min(canvasWidth - iconSize / 2, newX))
        newY = Math.max(iconSize / 2, Math.min(canvasHeight - iconSize / 2, newY))

        return { ...icon, x: newX, y: newY }
      })
    )
  }, [isDraggingIcon, selectedId, setCanvasIcons])

  const handleIconMouseUp = useCallback(() => {
    setIsDraggingIcon(false)
  }, [])

  const handleReplaceIcon = useCallback((newIconId: string) => {
    if (!replaceTargetId) return

    const newIcon = icons.find((i) => i.id === newIconId)
    if (!newIcon) return

    setCanvasIcons((prev) =>
      prev.map((icon) => {
        if (icon.id !== replaceTargetId) return icon
        return { ...icon, iconId: newIconId, color: { ...newIcon.color } }
      })
    )

    setReplaceDialogOpen(false)
    setReplaceTargetId(null)
  }, [replaceTargetId, setCanvasIcons])

  const closeReplaceDialog = useCallback(() => {
    setReplaceDialogOpen(false)
    setReplaceTargetId(null)
    canvasRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId && !replaceDialogOpen) {
        deleteSelectedIcon()
      }
      if (e.key === 'Escape' && replaceDialogOpen) {
        closeReplaceDialog()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, replaceDialogOpen, deleteSelectedIcon, closeReplaceDialog])

  return {
    selectedId,
    isDraggingIcon,
    replaceDialogOpen,
    replaceTargetId,
    selectIcon,
    deleteSelectedIcon,
    handleIconClick,
    handleIconDoubleClick,
    handleIconMouseDown,
    handleIconMouseMove,
    handleIconMouseUp,
    handleReplaceIcon,
    closeReplaceDialog,
    canvasRef,
  }
}
