import React, { useState, useCallback, useRef, useEffect } from 'react'
import type { DragItem } from '../types'

interface DragSortableProps<T extends { id: string }> {
  items: T[]
  onOrderChange: (items: T[]) => void
  children: (props: {
    items: T[]
    getItemProps: (item: T, index: number) => DragItemProps
    draggingId: string | null
    dragOverId: string | null
  }) => React.ReactNode
  className?: string
  itemClassName?: string
  dragHandleSelector?: string
}

export interface DragItemProps {
  draggable: boolean
  'data-drag-id': string
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: (e: React.DragEvent) => void
}

export type GetItemPropsFn<T extends { id: string }> = (item: T, index: number) => DragItemProps

export interface DragSortableChildrenProps<T extends { id: string }> {
  items: T[]
  getItemProps: GetItemPropsFn<T>
  draggingId: string | null
  dragOverId: string | null
}

function DragSortable<T extends { id: string }>({
  items,
  onOrderChange,
  children,
  dragHandleSelector,
}: DragSortableProps<T>) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragItemRef = useRef<DragItem<T> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback((e: React.DragEvent, item: T, index: number) => {
    if (dragHandleSelector) {
      const target = e.target as HTMLElement
      if (!target.closest(dragHandleSelector)) {
        e.preventDefault()
        return
      }
    }

    dragItemRef.current = { id: item.id, data: item, index }
    setDraggingId(item.id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)

    if (e.dataTransfer.setDragImage && containerRef.current) {
      const dragElement = e.currentTarget as HTMLElement
      const rect = dragElement.getBoundingClientRect()
      e.dataTransfer.setDragImage(
        dragElement,
        e.clientX - rect.left,
        e.clientY - rect.top
      )
    }
  }, [dragHandleSelector])

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (draggingId && draggingId !== targetId) {
      setDragOverId(targetId)
    }
  }, [draggingId])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement

    if (!target.contains(relatedTarget)) {
      setDragOverId(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!dragItemRef.current || draggingId === targetId) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    const draggedIndex = dragItemRef.current.index
    const targetIndex = items.findIndex(item => item.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    const newItems = [...items]
    const [removed] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, removed)

    onOrderChange(newItems)

    dragItemRef.current = null
    setDraggingId(null)
    setDragOverId(null)
  }, [draggingId, items, onOrderChange])

  const handleDragEnd = useCallback(() => {
    dragItemRef.current = null
    setDraggingId(null)
    setDragOverId(null)
  }, [])

  const getItemProps = useCallback((item: T, index: number): DragItemProps => {
    return {
      draggable: true,
      'data-drag-id': item.id,
      onDragStart: (e: React.DragEvent) => handleDragStart(e, item, index),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, item.id),
      onDragLeave: handleDragLeave,
      onDrop: (e: React.DragEvent) => handleDrop(e, item.id),
      onDragEnd: handleDragEnd,
    }
  }, [handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd])

  useEffect(() => {
    const handleGlobalDragEnd = () => {
      dragItemRef.current = null
      setDraggingId(null)
      setDragOverId(null)
    }

    window.addEventListener('dragend', handleGlobalDragEnd)
    return () => window.removeEventListener('dragend', handleGlobalDragEnd)
  }, [])

  return (
    <div ref={containerRef}>
      {children({
        items,
        getItemProps,
        draggingId,
        dragOverId,
      })}
    </div>
  )
}

export default DragSortable
