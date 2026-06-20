import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Star } from 'lucide-react'
import { useAppStore, type GroomingStyle } from '@/store'
import { mockStyles } from '@/services/api'

export default function GalleryPanel() {
  const { setSelectedStyle, setShowPreview } = useAppStore()
  const [styles, setStyles] = useState<GroomingStyle[]>([])
  const [searchText, setSearchText] = useState('')
  const [breedFilter, setBreedFilter] = useState('全部')
  const [styleFilter, setStyleFilter] = useState('全部')

  useEffect(() => {
    setStyles(mockStyles)
  }, [])

  const breeds = useMemo(() => {
    const set = new Set(styles.map((s) => s.breed))
    return ['全部', ...Array.from(set)]
  }, [styles])

  const styleTags = useMemo(() => {
    const set = new Set(styles.map((s) => s.styleTag))
    return ['全部', ...Array.from(set)]
  }, [styles])

  const filtered = useMemo(() => {
    return styles.filter((s) => {
      const matchSearch =
        !searchText ||
        s.name.toLowerCase().includes(searchText.toLowerCase()) ||
        s.breed.toLowerCase().includes(searchText.toLowerCase())
      const matchBreed = breedFilter === '全部' || s.breed === breedFilter
      const matchStyle = styleFilter === '全部' || s.styleTag === styleFilter
      return matchSearch && matchBreed && matchStyle
    })
  }, [styles, searchText, breedFilter, styleFilter])

  const handleCardClick = (style: GroomingStyle) => {
    setSelectedStyle(style)
    setShowPreview(true)
  }

  return (
    <div
      style={{
        width: 380,
        background: '#ffffff',
        borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Noto Sans SC', sans-serif",
      }}
    >
      <div style={{ padding: '20px 20px 0' }}>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: '#2c3e50',
            marginBottom: 16,
          }}
        >
          造型灵感库
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#fff7e6',
            borderRadius: 12,
            padding: '8px 14px',
            marginBottom: 12,
            border: '1px solid #f5e6cc',
          }}
        >
          <Search size={16} color="#e67e22" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="搜索造型名称或品种..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 13,
              marginLeft: 8,
              color: '#2c3e50',
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: '#fff7e6',
              borderRadius: 10,
              padding: '6px 10px',
              border: '1px solid #f5e6cc',
            }}
          >
            <Filter size={14} color="#e67e22" style={{ flexShrink: 0 }} />
            <select
              value={breedFilter}
              onChange={(e) => setBreedFilter(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 12,
                marginLeft: 6,
                color: '#2c3e50',
                cursor: 'pointer',
                fontFamily: "'Noto Sans SC', sans-serif",
                appearance: 'none',
              }}
            >
              {breeds.map((b) => (
                <option key={b} value={b}>
                  {b === '全部' ? '品种' : b}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: '#fff7e6',
              borderRadius: 10,
              padding: '6px 10px',
              border: '1px solid #f5e6cc',
            }}
          >
            <Filter size={14} color="#f39c12" style={{ flexShrink: 0 }} />
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 12,
                marginLeft: 6,
                color: '#2c3e50',
                cursor: 'pointer',
                fontFamily: "'Noto Sans SC', sans-serif",
                appearance: 'none',
              }}
            >
              {styleTags.map((t) => (
                <option key={t} value={t}>
                  {t === '全部' ? '风格' : t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px 20px',
        }}
      >
        <div
          style={{
            columns: 2,
            columnGap: 12,
          }}
        >
          {filtered.map((style) => (
            <div
              key={style.id}
              onClick={() => handleCardClick(style)}
              style={{
                breakInside: 'avoid',
                marginBottom: 12,
                background: '#fffdf8',
                borderRadius: 14,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                border: '1px solid #f5e6cc',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)'
                e.currentTarget.style.boxShadow =
                  '0 6px 20px rgba(230,126,34,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <img
                src={style.imageUrl}
                alt={style.name}
                style={{
                  width: '100%',
                  display: 'block',
                  borderRadius: 12,
                  objectFit: 'cover',
                }}
              />
              <div style={{ padding: '8px 10px 10px' }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#2c3e50',
                    marginBottom: 4,
                  }}
                >
                  {style.breed}
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#fff',
                    background: `linear-gradient(135deg, #e67e22, #f39c12)`,
                    padding: '2px 10px',
                    borderRadius: 20,
                    marginBottom: 6,
                  }}
                >
                  {style.styleTag}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={12}
                      fill={i < Math.round(style.groomerRating) ? '#f39c12' : 'none'}
                      color={
                        i < Math.round(style.groomerRating) ? '#f39c12' : '#ddd'
                      }
                    />
                  ))}
                  <span
                    style={{
                      fontSize: 11,
                      color: '#999',
                      marginLeft: 4,
                    }}
                  >
                    {style.groomerRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#bbb',
              fontSize: 14,
              padding: '40px 0',
            }}
          >
            没有找到匹配的造型
          </div>
        )}
      </div>
    </div>
  )
}
