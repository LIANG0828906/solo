import { useRef, useState, useCallback } from 'react'
import { toPng, toSvg } from 'html-to-image'
import {
  Star, Shield, Flame, Leaf, Crown,
  Zap, Heart, Gem, Sun, Moon,
  Mountain, Feather, Target, Compass, Trophy,
  RotateCcw, Download, Link2, Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useDesignStore, type IconType, BORDER_STYLES, TEXTURES } from '@/store/useDesignStore'

const ICON_MAP: Record<IconType, LucideIcon> = {
  Star, Shield, Flame, Leaf, Crown,
  Zap, Heart, Gem, Sun, Moon,
  Mountain, Feather, Target, Compass, Trophy,
}

export default function Canvas() {
  const {
    text, fontFamily, textColor, placedIcons,
    borderStyle, backgroundTexture, selectedIconId,
    isFontFading, decorAnimating,
    setText, setTextColor, addIcon, updateIcon, removeIcon,
    setSelectedIconId, resetDesign,
  } = useDesignStore()

  const badgeRef = useRef<HTMLDivElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [shimmerActive, setShimmerActive] = useState<'svg' | 'png' | null>(null)

  const borderClass = BORDER_STYLES.find((b) => b.id === borderStyle)?.className ?? ''
  const textureClass = TEXTURES.find((t) => t.id === backgroundTexture)?.className ?? ''

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDraggingOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const iconType = e.dataTransfer.getData('iconType') as IconType
    if (!iconType || !ICON_MAP[iconType]) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    addIcon({
      id: `icon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      iconType,
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
      size: 36,
      rotation: 0,
    })
  }, [addIcon])

  const handleBadgeClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.placed-icon')) return
    setSelectedIconId(null)
  }, [setSelectedIconId])

  const handleIconClick = useCallback((e: React.MouseEvent, iconId: string) => {
    e.stopPropagation()
    setSelectedIconId(selectedIconId === iconId ? null : iconId)
  }, [selectedIconId, setSelectedIconId])

  const exportImage = useCallback(async (format: 'png' | 'svg') => {
    if (!badgeRef.current) return
    setShimmerActive(format)
    try {
      const dataUrl = format === 'png'
        ? await toPng(badgeRef.current, { pixelRatio: 2 })
        : await toSvg(badgeRef.current)

      const link = document.createElement('a')
      link.download = `badge.${format}`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    }
    setTimeout(() => setShimmerActive(null), 500)
  }, [])

  const handleShare = useCallback(async () => {
    if (!badgeRef.current) return
    try {
      const dataUrl = await toPng(badgeRef.current, { pixelRatio: 2 })
      if (navigator.share) {
        await navigator.share({
          title: '我的徽章设计',
          text: '看看我设计的徽章！',
          url: dataUrl,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
      }
    } catch {
      await navigator.clipboard.writeText(window.location.href)
    }
  }, [])

  const selectedIcon = placedIcons.find((i) => i.id === selectedIconId)

  return (
    <div className="flex-1 flex flex-col items-center h-full min-w-0">
      <div className="w-full flex items-center gap-3 mb-3 px-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入徽章文字..."
          className="
            flex-1 bg-badge-card rounded-lg px-4 py-2 text-sm text-white
            border border-badge-secondary/50 focus:border-badge-accent/60
            outline-none transition-colors duration-200
            placeholder:text-gray-500
          "
        />
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-8 h-8 rounded-md cursor-pointer"
          />
          <input
            type="text"
            value={textColor}
            onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setTextColor(e.target.value)}
            className="w-20 bg-badge-card rounded-md px-2 py-1.5 text-xs text-white border border-badge-secondary/50 outline-none focus:border-badge-accent/60 transition-colors"
          />
        </div>
      </div>

      <div
        className={`
          relative w-full max-w-[560px] aspect-square rounded-2xl
          bg-badge-card badge-inner-shadow
          transition-all duration-200
          ${isDraggingOver ? 'ring-2 ring-badge-accent/50 ring-offset-2 ring-offset-badge-bg' : ''}
          ${decorAnimating ? 'animate-elastic-scale' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBadgeClick}
      >
        <div
          ref={badgeRef}
          className={`
            absolute inset-6 rounded-xl bg-badge-bg overflow-hidden
            flex items-center justify-center
            ${borderClass} ${textureClass}
          `}
        >
          <span
            className={`
              text-4xl font-bold text-center px-8 select-none
              transition-opacity duration-300
              ${isFontFading ? 'opacity-0' : 'opacity-100'}
            `}
            style={{
              fontFamily,
              color: textColor,
            }}
          >
            {text || 'BADGE'}
          </span>

          {placedIcons.map((icon) => {
            const IconComponent = ICON_MAP[icon.iconType as IconType]
            if (!IconComponent) return null

            return (
              <div
                key={icon.id}
                className={`
                  placed-icon absolute
                  ${selectedIconId === icon.id ? 'ring-2 ring-badge-accent rounded' : ''}
                `}
                style={{
                  left: `${icon.x}%`,
                  top: `${icon.y}%`,
                  transform: `translate(-50%, -50%) rotate(${icon.rotation}deg)`,
                }}
                onClick={(e) => handleIconClick(e, icon.id)}
              >
                <IconComponent
                  size={icon.size}
                  strokeWidth={1.5}
                  style={{ color: textColor }}
                />
              </div>
            )
          })}

          {isDraggingOver && (
            <div className="absolute inset-0 bg-badge-accent/5 border-2 border-dashed border-badge-accent/40 rounded-xl flex items-center justify-center pointer-events-none">
              <span className="text-badge-accent/60 text-sm">释放以放置图标</span>
            </div>
          )}
        </div>

        {selectedIcon && (
          <div
            className="
              absolute z-20 bg-badge-card/95 backdrop-blur-sm
              rounded-lg shadow-xl border border-badge-secondary/60
              p-3 min-w-[180px]
            "
            style={{
              left: `${Math.min(selectedIcon.x, 70)}%`,
              top: `${Math.min(selectedIcon.y + 8, 80)}%`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-badge-accent font-bold uppercase tracking-wider">
                {selectedIcon.iconType}
              </span>
              <button
                onClick={() => removeIcon(selectedIcon.id)}
                className="text-gray-400 hover:text-badge-accent transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <label className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-gray-400 w-8">大小</span>
              <input
                type="range"
                min="16"
                max="80"
                value={selectedIcon.size}
                onChange={(e) => updateIcon(selectedIcon.id, { size: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-[10px] text-gray-400 w-6 text-right">{selectedIcon.size}</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-8">旋转</span>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedIcon.rotation}
                onChange={(e) => updateIcon(selectedIcon.id, { rotation: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-[10px] text-gray-400 w-6 text-right">{selectedIcon.rotation}°</span>
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={resetDesign}
          className="
            flex items-center gap-1.5 px-4 py-2 rounded-lg
            bg-badge-card text-gray-300 text-xs
            hover:bg-badge-secondary/60 transition-all duration-200
          "
        >
          <RotateCcw size={14} />
          重置
        </button>
        <button
          onClick={() => exportImage('svg')}
          className={`
            flex items-center gap-1.5 px-4 py-2 rounded-lg
            bg-badge-secondary text-white text-xs
            hover:bg-badge-secondary/80 transition-all duration-200
            ${shimmerActive === 'svg' ? 'animate-glow export-shimmer' : ''}
          `}
        >
          <Download size={14} />
          导出SVG
        </button>
        <button
          onClick={() => exportImage('png')}
          className={`
            flex items-center gap-1.5 px-4 py-2 rounded-lg
            bg-badge-accent text-white text-xs
            hover:bg-badge-accent/80 transition-all duration-200
            ${shimmerActive === 'png' ? 'animate-glow export-shimmer' : ''}
          `}
        >
          <Download size={14} />
          导出PNG
        </button>
        <button
          onClick={handleShare}
          className="
            flex items-center gap-1.5 px-4 py-2 rounded-lg
            bg-badge-card text-gray-300 text-xs
            hover:bg-badge-secondary/60 transition-all duration-200
          "
        >
          <Link2 size={14} />
          分享链接
        </button>
      </div>
    </div>
  )
}
