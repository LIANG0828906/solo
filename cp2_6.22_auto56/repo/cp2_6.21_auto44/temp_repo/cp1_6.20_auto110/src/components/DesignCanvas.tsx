import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDesignStore } from '../store/useDesignStore'
import type { Component, ComponentType } from '../types'

interface DragItemData {
  type: ComponentType
}

const generateId = () => Math.random().toString(36).slice(2, 10)

const getDefaultComponent = (type: ComponentType, x: number, y: number): Component => {
  const base = { id: generateId(), type, x, y, zIndex: 1 }
  switch (type) {
    case 'button':
      return { ...base, width: 120, height: 40, text: '按钮', variant: 'primary', size: 'md', disabled: false }
    case 'card':
      return { ...base, width: 280, height: 180, title: '卡片标题', description: '这是卡片的描述内容' }
    case 'input':
      return { ...base, width: 240, height: 56, placeholder: '请输入内容', label: '标签', variant: 'default', required: false }
    case 'navbar':
      return { ...base, width: 600, height: 56, brand: 'Brand', links: [{ label: '首页', href: '#' }, { label: '关于', href: '#' }], theme: 'light' }
    case 'badge':
      return { ...base, width: 80, height: 28, text: '徽章', variant: 'primary' }
    case 'canvas':
      return { ...base, width: 300, height: 200, backgroundColor: '#ffffff', borderRadius: 8 }
    default:
      return { ...base, width: 100, height: 100, backgroundColor: '#ffffff', borderRadius: 8 } as Component
  }
}

const renderComponentPreview = (comp: Component) => {
  switch (comp.type) {
    case 'button': {
      const variantClasses: Record<string, string> = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700',
        outline: 'border-2 border-gray-300 text-gray-700 hover:border-gray-400',
        ghost: 'text-gray-700 hover:bg-gray-100',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      }
      const sizeClasses: Record<string, string> = {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-6 py-3',
      }
      return (
        <button
          className={`w-full h-full rounded-md font-medium transition-colors ${variantClasses[comp.variant]} ${sizeClasses[comp.size]} ${comp.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={comp.disabled}
        >
          {comp.text}
        </button>
      )
    }
    case 'card':
      return (
        <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {comp.imageUrl && (
            <div className="h-24 bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url(${comp.imageUrl})` }} />
          )}
          <div className="p-3 flex-1 flex flex-col">
            <h4 className="font-semibold text-gray-900 text-sm truncate">{comp.title}</h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{comp.description}</p>
          </div>
        </div>
      )
    case 'input':
      return (
        <div className="w-full h-full flex flex-col justify-center">
          <label className="text-xs font-medium text-gray-700 mb-1">
            {comp.label}
            {comp.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <div
            className={`w-full h-9 rounded-md border px-3 text-sm flex items-center text-gray-400 ${
              comp.variant === 'filled' ? 'bg-gray-100 border-transparent' : comp.variant === 'outlined' ? 'bg-transparent border-gray-400' : 'bg-white border-gray-300'
            }`}
          >
            {comp.placeholder}
          </div>
        </div>
      )
    case 'navbar':
      return (
        <div
          className={`w-full h-full flex items-center px-4 justify-between ${
            comp.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 border-b border-gray-200'
          }`}
        >
          <span className="font-bold text-sm">{comp.brand}</span>
          <div className="flex gap-4">
            {comp.links.map((link, i) => (
              <span key={i} className="text-xs hover:opacity-70">
                {link.label}
              </span>
            ))}
          </div>
        </div>
      )
    case 'badge': {
      const variantClasses: Record<string, string> = {
        default: 'bg-gray-200 text-gray-800',
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
      }
      return (
        <div className={`w-full h-full rounded-full text-xs font-medium flex items-center justify-center ${variantClasses[comp.variant]}`}>
          {comp.text}
        </div>
      )
    }
    case 'canvas':
      return (
        <div
          className="w-full h-full border border-gray-200"
          style={{ backgroundColor: comp.backgroundColor, borderRadius: comp.borderRadius }}
        />
      )
    default:
      return null
  }
}

const DesignCanvas: React.FC = () => {
  const {
    components,
    selectedId,
    canvasScale,
    canvasOffset,
    addComponent,
    removeComponent,
    selectComponent,
    moveComponent,
    setCanvasScale,
    setCanvasOffset,
    adjustZIndex,
  } = useDesignStore()

  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDraggingComponent, setIsDraggingComponent] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [panOffsetStart, setPanOffsetStart] = useState({ x: 0, y: 0 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return {
        x: (clientX - rect.left - canvasOffset.x) / canvasScale,
        y: (clientY - rect.top - canvasOffset.y) / canvasScale,
      }
    },
    [canvasScale, canvasOffset]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      try {
        const data = e.dataTransfer.getData('application/json')
        if (!data) return
        const parsed: DragItemData = JSON.parse(data)
        const { x, y } = getCanvasCoords(e.clientX, e.clientY)
        const newComponent = getDefaultComponent(parsed.type, x - 60, y - 20)
        newComponent.zIndex = components.length > 0 ? Math.max(...components.map((c) => c.zIndex)) + 1 : 1
        addComponent(newComponent)
        selectComponent(newComponent.id)
      } catch (err) {
        console.error('Drop error:', err)
      }
    },
    [getCanvasCoords, addComponent, selectComponent, components]
  )

  const handleComponentMouseDown = useCallback(
    (e: React.MouseEvent, comp: Component) => {
      if (e.button !== 0) return
      e.stopPropagation()
      selectComponent(comp.id)
      const { x, y } = getCanvasCoords(e.clientX, e.clientY)
      setIsDraggingComponent(comp.id)
      setDragOffset({ x: x - comp.x, y: y - comp.y })
    },
    [selectComponent, getCanvasCoords]
  )

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      selectComponent(null)
      if (isSpacePressed) {
        setIsPanning(true)
        setPanStart({ x: e.clientX, y: e.clientY })
        setPanOffsetStart({ ...canvasOffset })
      }
    },
    [selectComponent, isSpacePressed, canvasOffset]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDraggingComponent) {
        const { x, y } = getCanvasCoords(e.clientX, e.clientY)
        moveComponent(isDraggingComponent, x - dragOffset.x, y - dragOffset.y)
      } else if (isPanning) {
        setCanvasOffset({
          x: panOffsetStart.x + (e.clientX - panStart.x),
          y: panOffsetStart.y + (e.clientY - pan