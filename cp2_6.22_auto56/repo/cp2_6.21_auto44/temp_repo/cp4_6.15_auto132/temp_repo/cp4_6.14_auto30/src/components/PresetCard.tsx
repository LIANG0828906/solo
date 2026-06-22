import { useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import type { LightPreset } from '../utils/sceneHelpers'

interface PresetCardProps {
  preset: LightPreset
  index: number
  isActive?: boolean
  onApply: (preset: LightPreset) => void
  onDelete: (id: string) => void
  onDragStart?: (index: number, e: React.MouseEvent) => void
}

export default function PresetCard({
  preset,
  index,
  isActive = false,
  onApply,
  onDelete,
  onDragStart,
}: PresetCardProps) {
  const lightCount = 1 + preset.pointLights.length
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!preset.thumbnail && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const w = canvas.width
        const h = canvas.height
        const ambientColor = preset.ambient.color
        const directionalColor = preset.directional.color
        const grad = ctx.createRadialGradient(
          w * 0.6,
          h * 0.3,
          0,
          w * 0.5,
          h * 0.5,
          w
        )
        grad.addColorStop(0, directionalColor)
        grad.addColorStop(0.6, ambientColor)
        grad.addColorStop(1, '#0a0f1e')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)

        ctx.globalAlpha = 0.3
        for (let i = 0; i < 12; i++) {
          const x = Math.random() * w
          const y = Math.random() * h
          const r = 2 + Math.random() * 3
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.fill()
        }
        ctx.globalAlpha = 1

        ctx.strokeStyle = 'rgba(255,255,255,0.15)'
        ctx.lineWidth = 1
        ctx.strokeRect(0, 0, w, h)
      }
    }
  }, [preset])

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(preset.id)
  }

  return (
    <div
      data-card-index={index}
      className="preset-card-wrapper"
      style={{
        ...styles.card,
        borderColor: isActive
          ? 'rgba(79,195,247,0.55)'
          : 'rgba(255,255,255,0.08)',
        background: isActive
          ? 'linear-gradient(135deg, rgba(79,195,247,0.12), rgba(22,33,62,0.6))'
          : 'rgba(22,33,62,0.5)',
        boxShadow: isActive
          ? '0 0 0 1px rgba(79,195,247,0.3), 0 6px 20px rgba(79,195,247,0.12)'
          : '0 2px 8px rgba(0,0,0,0.2)',
      }}
      onClick={() => onApply(preset)}
      onMouseDown={(e) => {
        if (e.button === 0 && onDragStart) {
          onDragStart(index, e)
        }
      }}
    >
      <div style={styles.thumbnailWrap}>
        {preset.thumbnail ? (
          <img
            src={preset.thumbnail}
            alt={preset.name}
            style={styles.thumbnailImg}
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={64}
            height={64}
            style={styles.thumbnailCanvas}
          />
        )}
      </div>

      <div style={styles.info}>
        <div style={styles.nameRow}>
          <span
            style={{
              ...styles.name,
              color: isActive ? 'var(--accent-blue)' : 'var(--text-primary)',
            }}
          >
            {preset.name}
          </span>
        </div>
        <div style={styles.metaRow}>
          <span style={styles.metaLight}>
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: preset.directional.color,
                marginRight: 6,
                boxShadow: `0 0 4px ${preset.directional.color}`,
              }}
            />
            {lightCount} 个光源
          </span>
          <span style={styles.metaAmbient}>
            环境光 {(preset.ambient.intensity).toFixed(1)}
          </span>
        </div>
        {isActive && (
          <div style={styles.activeBadge}>
            <span />
            当前应用
          </div>
        )}
      </div>

      <button
        className="preset-card-delete"
        style={styles.deleteBtn}
        onClick={handleDeleteClick}
        title="删除预设"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: 'relative',
    height: 92,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    border: '1px solid',
    cursor: 'pointer',
    userSelect: 'none',
    transition:
      'transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease',
    overflow: 'hidden',
  },
  thumbnailWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
    background: '#0a0f1e',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  thumbnailCanvas: {
    width: 64,
    height: 64,
    display: 'block',
  },
  info: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 11,
    color: 'var(--text-secondary)',
    flexWrap: 'wrap',
  },
  metaLight: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  metaAmbient: {
    opacity: 0.7,
  },
  activeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 10,
    color: 'var(--accent-blue)',
    fontWeight: 600,
    marginTop: 2,
  },
  deleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    background: 'transparent',
    border: 'none',
    borderRadius: 6,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'all 0.18s ease',
    zIndex: 2,
  },
}

const hoverStyles = document.createElement('style')
hoverStyles.textContent = `
  .preset-card-wrapper:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(79,195,247,0.25) !important;
    border-color: rgba(79,195,247,0.35) !important;
  }
  .preset-card-wrapper:hover .preset-card-delete {
    opacity: 1;
  }
  .preset-card-delete:hover {
    background: rgba(239,83,80,0.15) !important;
    color: var(--danger) !important;
  }
  .preset-card-wrapper.is-dragging {
    opacity: 0.5;
    transform: scale(0.98) rotate(-0.5deg);
  }
  .preset-card-wrapper.drag-over {
    border-color: var(--accent-amber) !important;
    box-shadow: 0 0 0 2px rgba(255,183,77,0.35) !important;
  }
  [data-active-badge] > span:first-child {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-blue);
    box-shadow: 0 0 6px var(--accent-blue);
    animation: activePulse 1.8s ease-in-out infinite;
  }
  @keyframes activePulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }
`
if (!document.querySelector('style[data-presetcard-hover]')) {
  hoverStyles.setAttribute('data-presetcard-hover', 'true')
  document.head.appendChild(hoverStyles)
}
