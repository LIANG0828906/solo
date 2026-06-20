import { useState } from 'react'
import { useDesignStore, FONT_LIST } from '@/store/useDesignStore'

export default function TextPanel() {
  const { fontFamilyName, setFontFamily } = useDesignStore()
  const [hoveredFont, setHoveredFont] = useState<string | null>(null)

  return (
    <div className="w-56 flex-shrink-0 h-full overflow-y-auto pr-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-badge-accent mb-3 px-1">
        字体库
      </h3>
      <div className="space-y-2">
        {FONT_LIST.map((font) => {
          const isActive = fontFamilyName === font.name
          const isHovered = hoveredFont === font.name

          return (
            <div
              key={font.name}
              className={`
                relative rounded-lg px-3 py-2.5 cursor-pointer
                transition-all duration-200 group
                ${isActive
                  ? 'bg-badge-accent/20 ring-1 ring-badge-accent/50'
                  : 'bg-badge-card hover:bg-badge-card/80'
                }
              `}
              style={{
                filter: isHovered && !isActive ? 'brightness(1.3)' : 'none',
              }}
              onMouseEnter={() => setHoveredFont(font.name)}
              onMouseLeave={() => setHoveredFont(null)}
              onClick={() => setFontFamily(font.family, font.name)}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm truncate max-w-[120px]"
                  style={{ fontFamily: font.family }}
                >
                  {font.name}
                </span>
                {(isHovered || isActive) && (
                  <button
                    className={`
                      text-[10px] px-2 py-0.5 rounded-full
                      transition-all duration-200
                      ${isActive
                        ? 'bg-badge-accent text-white'
                        : 'bg-badge-secondary/60 text-gray-300 hover:bg-badge-accent hover:text-white'
                      }
                    `}
                    onClick={(e) => {
                      e.stopPropagation()
                      setFontFamily(font.family, font.name)
                    }}
                  >
                    {isActive ? '已应用' : '应用'}
                  </button>
                )}
              </div>
              <p
                className="text-xl mt-1 truncate leading-tight"
                style={{ fontFamily: font.family }}
              >
                Badge Aa
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
