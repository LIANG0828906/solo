import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useTypographyStore, CharData } from '../store/typographyStore'
import { LayoutComposer } from '../modules/layout-composer/LayoutComposer'
import { SvgRenderer } from '../modules/svg-renderer/SvgRenderer'
import { fontManager } from '../modules/font-manager/FontManager'

export const PreviewArea: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<SvgRenderer | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const isDraggingRef = useRef(false)
  const isPanningRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const draggingCharIdRef = useRef<string | null>(null)
  const dragCharStartRef = useRef({ offsetX: 0, offsetY: 0 })

  const {
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
    textColor,
    backgroundColor,
    accentColor,
    lines,
    pathType,
    pathRadius,
    spiralTurns,
    waveAmplitude,
    selectedCharId,
    lastCharSpecial,
    zoom,
    panX,
    panY,
    setSelectedCharId,
    setZoom,
    setPan,
    updateCharPosition,
    deleteChar,
  } = useTypographyStore()

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: Math.max(rect.width, 400),
          height: Math.max(rect.height, 300),
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (svgContainerRef.current && dimensions.width > 0 && dimensions.height > 0) {
      rendererRef.current = new SvgRenderer(svgContainerRef.current)
      rendererRef.current.init(dimensions.width, dimensions.height)
    }
    return () => {
      if (rendererRef.current) {
        rendererRef.current.clear()
      }
    }
  }, [dimensions])

  const renderLayout = useCallback(() => {
    if (!rendererRef.current) return

    const fontFamilyString = fontManager.getFontFamily(fontFamily)

    const layout = LayoutComposer.computeLayout(lines, {
      fontFamily: fontFamilyString,
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      textColor,
      accentColor,
      pathType,
      pathRadius,
      spiralTurns,
      waveAmplitude,
      lastCharSpecial,
      canvasWidth: dimensions.width,
      canvasHeight: dimensions.height,
    })

    rendererRef.current.render(layout.lines, {
      fontFamily: fontFamilyString,
      backgroundColor,
      width: dimensions.width,
      height: dimensions.height,
      selectedCharId,
    })

    layout.lines.forEach(line => {
      line.chars.forEach(char => {
        const el = rendererRef.current?.getCharElement(char.id)
        if (el) {
          el.click((evt: Event) => {
            evt.stopPropagation()
            setSelectedCharId(char.id)
          })
        }
      })
    })
  }, [
    fontFamily, fontSize, fontWeight, lineHeight, letterSpacing,
    textColor, backgroundColor, accentColor, lines, pathType,
    pathRadius, spiralTurns, waveAmplitude, lastCharSpecial,
    dimensions.width, dimensions.height, selectedCharId, setSelectedCharId,
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      renderLayout()
    }, 10)
    return () => clearTimeout(timer)
  }, [renderLayout])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCharId) {
        deleteChar(selectedCharId)
      }
      if (e.key === 'Escape') {
        setSelectedCharId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCharId, deleteChar, setSelectedCharId])

  const findCharAtPoint = useCallback((clientX: number, clientY: number): CharData | null => {
    const fontFamilyString = fontManager.getFontFamily(fontFamily)
    const layout = LayoutComposer.computeLayout(lines, {
      fontFamily: fontFamilyString,
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      textColor,
      accentColor,
      pathType,
      pathRadius,
      spiralTurns,
      waveAmplitude,
      lastCharSpecial,
      canvasWidth: dimensions.width,
      canvasHeight: dimensions.height,
    })

    const svgContainer = svgContainerRef.current
    if (!svgContainer) return null

    const svg = svgContainer.querySelector('svg')
    if (!svg) return null

    const svgRect = svg.getBoundingClientRect()
    const scaleX = dimensions.width / svgRect.width
    const scaleY = dimensions.height / svgRect.height

    const x = ((clientX - svgRect.left) * scaleX - panX) / zoom
    const y = ((clientY - svgRect.top) * scaleY - panY) / zoom

    for (const line of layout.lines) {
      for (const char of line.chars) {
        const halfW = char.fontSize * 0.6
        const halfH = char.fontSize * 0.6
        if (x >= char.x - halfW && x <= char.x + halfW &&
            y >= char.y - halfH && y <= char.y + halfH) {
          return char
        }
      }
    }
    return null
  }, [
    fontFamily, fontSize, fontWeight, lineHeight, letterSpacing,
    textColor, accentColor, lines, pathType,
    pathRadius, spiralTurns, waveAmplitude, lastCharSpecial,
    dimensions.width, dimensions.height, zoom, panX, panY,
  ])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return

    const char = findCharAtPoint(e.clientX, e.clientY)

    if (char) {
      setSelectedCharId(char.id)
      isDraggingRef.current = true
      draggingCharIdRef.current = char.id
      dragCharStartRef.current = {
        offsetX: char.manualOffsetX,
        offsetY: char.manualOffsetY,
      }
      dragStartRef.current = { x: e.clientX, y: e.clientY }
    } else {
      isPanningRef.current = true
      panStartRef.current = { x: e.clientX, y: e.clientY, panX, panY }
      setSelectedCharId(null)
    }
  }, [findCharAtPoint, panX, panY, setSelectedCharId])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current && draggingCharIdRef.current) {
      const svgContainer = svgContainerRef.current
      if (!svgContainer) return
      const svg = svgContainer.querySelector('svg')
      if (!svg) return
      const svgRect = svg.getBoundingClientRect()
      const scaleX = dimensions.width / svgRect.width
      const scaleY = dimensions.height / svgRect.height

      const dx = ((e.clientX - dragStartRef.current.x) * scaleX) / zoom
      const dy = ((e.clientY - dragStartRef.current.y) * scaleY) / zoom

      const maxOffsetX = dimensions.width
      const maxOffsetY = dimensions.height

      const newOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, dragCharStartRef.current.offsetX + dx))
      const newOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, dragCharStartRef.current.offsetY + dy))

      updateCharPosition(draggingCharIdRef.current, newOffsetX, newOffsetY)
    } else if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      setPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy)
    }
  }, [dimensions.width, dimensions.height, zoom, updateCharPosition, setPan])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
    isPanningRef.current = false
    draggingCharIdRef.current = null
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(Math.max(0.5, Math.min(3, zoom + delta)))
  }, [zoom, setZoom])

  const handleExport = useCallback(() => {
    if (!rendererRef.current) return

    const fontFamilyString = fontManager.getFontFamily(fontFamily)
    const layout = LayoutComposer.computeLayout(lines, {
      fontFamily: fontFamilyString,
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      textColor,
      accentColor,
      pathType,
      pathRadius,
      spiralTurns,
      waveAmplitude,
      lastCharSpecial,
      canvasWidth: dimensions.width,
      canvasHeight: dimensions.height,
    })

    const svgContent = rendererRef.current.exportSVG(layout.lines, {
      fontFamily: fontFamilyString,
      backgroundColor,
      width: dimensions.width,
      height: dimensions.height,
      selectedCharId: null,
    })

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `poetry-${Date.now()}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [
    fontFamily, fontSize, fontWeight, lineHeight, letterSpacing,
    textColor, backgroundColor, accentColor, lines, pathType,
    pathRadius, spiralTurns, waveAmplitude, lastCharSpecial,
    dimensions.width, dimensions.height,
  ])

  const transformStyle: React.CSSProperties = {
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
    transformOrigin: 'center center',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <div
      ref={containerRef}
      className="preview-area"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ backgroundColor }}
    >
      <button className="export-btn" onClick={handleExport} title="导出 SVG">
        ⬇
      </button>
      <div style={transformStyle}>
        <div
          ref={svgContainerRef}
          className="svg-canvas"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: dimensions.width,
            maxHeight: dimensions.height,
          }}
        />
      </div>
      <div className="zoom-info">
        {(zoom * 100).toFixed(0)}%
      </div>
    </div>
  )
}
