import { useDesignStore, BORDER_STYLES, TEXTURES } from '@/store/useDesignStore'

export default function DecorPanel() {
  const { borderStyle, backgroundTexture, setBorderStyle, setBackgroundTexture } = useDesignStore()

  return (
    <div className="flex items-start gap-6 px-4 py-3">
      <div className="flex-1">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-badge-accent mb-2">
          边框样式
        </h4>
        <div className="flex gap-2">
          {BORDER_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setBorderStyle(style.id)}
              className={`
                px-3 py-1.5 rounded-md text-xs transition-all duration-200
                ${borderStyle === style.id
                  ? 'bg-badge-accent text-white shadow-md shadow-badge-accent/30'
                  : 'bg-badge-card text-gray-300 hover:bg-badge-secondary/60'
                }
              `}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-12 bg-badge-secondary/50 self-center" />

      <div className="flex-1">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-badge-accent mb-2">
          背景纹理
        </h4>
        <div className="flex gap-2">
          {TEXTURES.map((texture) => (
            <button
              key={texture.id}
              onClick={() => setBackgroundTexture(texture.id)}
              className={`
                px-3 py-1.5 rounded-md text-xs transition-all duration-200
                ${backgroundTexture === texture.id
                  ? 'bg-badge-accent text-white shadow-md shadow-badge-accent/30'
                  : 'bg-badge-card text-gray-300 hover:bg-badge-secondary/60'
                }
              `}
            >
              {texture.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
