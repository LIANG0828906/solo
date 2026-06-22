import React, { useState, useEffect, useRef } from 'react'
import Calendar from './Calendar'
import CardModule from './CardModule'
import RecordModal from './RecordModal'
import { type SolarTerm } from './DataProvider'
import { useRecordStore, type PhenologyRecord } from './RecordStore'
import { getSolarTerms, getSolarTermByName } from './DataProvider'
import { getSeasonColor, hexToRgba } from './utils'

const CHINA_MAP_WIDTH = 700
const CHINA_MAP_HEIGHT = 520

const PhenologyMap: React.FC<{
  records: PhenologyRecord[]
  onRecordClick: (record: PhenologyRecord) => void
}> = ({ records, onRecordClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedRecord, setSelectedRecord] = useState<PhenologyRecord | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = CHINA_MAP_WIDTH * dpr
    canvas.height = CHINA_MAP_HEIGHT * dpr
    canvas.style.width = `${CHINA_MAP_WIDTH}px`
    canvas.style.height = `${CHINA_MAP_HEIGHT}px`
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, CHINA_MAP_WIDTH, CHINA_MAP_HEIGHT)
    ctx.fillStyle = '#FFFBF5'
    ctx.fillRect(0, 0, CHINA_MAP_WIDTH, CHINA_MAP_HEIGHT)

    ctx.strokeStyle = '#D7CFC0'
    ctx.lineWidth = 1.5
    ctx.fillStyle = hexToRgba('#F5EFE0', 0.6)

    ctx.beginPath()
    const mapPoints = [
      [120, 120], [180, 80], [260, 70], [340, 90], [420, 80],
      [500, 100], [570, 130], [620, 180], [640, 250], [620, 320],
      [580, 380], [540, 430], [480, 470], [420, 490], [360, 480],
      [300, 460], [240, 440], [180, 400], [140, 350], [110, 290],
      [100, 220], [110, 160]
    ]
    mapPoints.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.strokeStyle = '#E8E0D0'
    ctx.lineWidth = 0.8
    const provinceLines = [
      [[200, 150], [300, 140], [400, 160], [480, 200]],
      [[160, 250], [280, 240], [380, 260], [480, 280]],
      [[180, 340], [300, 330], [420, 350], [520, 360]],
      [[260, 120], [280, 220], [300, 320], [320, 420]],
      [[420, 140], [400, 240], [380, 340], [360, 440]]
    ]
    provinceLines.forEach(line => {
      ctx.beginPath()
      line.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    })

    records.forEach(record => {
      const solarTerm = getSolarTermByName(record.solarTermName)
      const color = solarTerm ? getSeasonColor(solarTerm.season) : '#888'

      const time = Date.now() / 1000
      const pulse = (Math.sin(time * 2 + record.createdAt * 0.001) + 1) / 2

      ctx.beginPath()
      ctx.arc(record.coords.x, record.coords.y, 14 + pulse * 4, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(color, 0.15)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(record.coords.x, record.coords.y, 10, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2.5
      ctx.stroke()

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(record.solarTermName.charAt(0), record.coords.x, record.coords.y)
    })
  }, [records])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    for (const record of records) {
      const dx = x - record.coords.x
      const dy = y - record.coords.y
      if (dx * dx + dy * dy < 14 * 14) {
        setSelectedRecord(record)
        setTooltipPos({ x: record.coords.x, y: record.coords.y })
        onRecordClick(record)
        return
      }
    }
    setSelectedRecord(null)
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ borderRadius: 12, cursor: 'pointer', display: 'block' }}
      />
      {selectedRecord && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(tooltipPos.x + 16, CHINA_MAP_WIDTH - 200),
            top: Math.max(tooltipPos.y - 60, 0),
            background: '#fff',
            borderRadius: 10,
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            maxWidth: 200,
            zIndex: 10,
            fontSize: 13
          }}
        >
          <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>
            {selectedRecord.solarTermName} · {selectedRecord.city}
          </div>
          <div style={{ color: '#666', lineHeight: 1.5, fontSize: 12 }}>
            {selectedRecord.description.slice(0, 50)}
            {selectedRecord.description.length > 50 ? '...' : ''}
          </div>
        </div>
      )}
    </div>
  )
}

const RecordList: React.FC = () => {
  const records = useRecordStore(state => state.records)
  const solarTerms = getSolarTerms()
  const [filterTerm, setFilterTerm] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredRecords = filterTerm === 'all'
    ? records
    : records.filter(r => r.solarTermName === filterTerm)

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, color: '#666' }}>筛选节气：</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterTerm('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: filterTerm === 'all' ? '#2C3E50' : '#E8E0D0',
              color: filterTerm === 'all' ? '#fff' : '#555',
              fontSize: 13,
              fontWeight: 500
            }}
          >
            全部
          </button>
          {solarTerms.map(st => (
            <button
              key={st.id}
              onClick={() => setFilterTerm(st.name)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: filterTerm === st.name ? getSeasonColor(st.season) : '#E8E0D0',
                color: filterTerm === st.name ? '#fff' : '#555',
                fontSize: 13,
                fontWeight: 500
              }}
            >
              {st.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredRecords.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: '#999',
              fontSize: 14,
              background: '#FFFBF5',
              borderRadius: 12
            }}
          >
            暂无物候记录，点击节气卡片上的「记录本地的物候」开始分享吧
          </div>
        ) : (
          filteredRecords.map(record => {
            const solarTerm = getSolarTermByName(record.solarTermName)
            const color = solarTerm ? getSeasonColor(solarTerm.season) : '#888'
            const isExpanded = expandedId === record.id

            return (
              <div
                key={record.id}
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                style={{
                  background: '#F9F9F9',
                  borderRadius: 8,
                  padding: '14px 18px',
                  borderLeft: `3px solid ${color}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      className="kaiti"
                      style={{ fontSize: 17, fontWeight: 600, color }}
                    >
                      {record.solarTermName}
                    </span>
                    <span style={{ fontSize: 13, color: '#888' }}>
                      {record.city} · {formatTime(record.createdAt)}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: '#AAA' }}>
                    {isExpanded ? '收起 ▲' : '展开 ▼'}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: '#555',
                    lineHeight: 1.7,
                    whiteSpace: isExpanded ? 'normal' : 'nowrap',
                    overflow: isExpanded ? 'visible' : 'hidden',
                    textOverflow: isExpanded ? 'clip' : 'ellipsis'
                  }}
                >
                  {record.description}
                </div>

                {isExpanded && record.imageDataUrl && (
                  <div style={{ marginTop: 12 }}>
                    <img
                      src={record.imageDataUrl}
                      alt="物候照片"
                      style={{
                        maxWidth: 300,
                        maxHeight: 220,
                        borderRadius: 8,
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const App: React.FC = () => {
  const [selectedSolarTerm, setSelectedSolarTerm] = useState<SolarTerm | null>(null)
  const [cardOrigin, setCardOrigin] = useState<{ x: number; y: number } | undefined>(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [headerOpacity, setHeaderOpacity] = useState(1)
  const [parallaxOffset, setParallaxOffset] = useState(0)
  const parallaxRef = useRef<HTMLDivElement>(null)

  const records = useRecordStore(state => state.records)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setParallaxOffset(scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSolarTermClick = (solarTerm: SolarTerm, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    setCardOrigin({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    })

    setHeaderOpacity(0)
    setTimeout(() => {
      setSelectedSolarTerm(solarTerm)
      setAnimationKey(k => k + 1)
      setHeaderOpacity(1)
    }, 400)
  }

  const handleRecordClick = () => {
    setIsModalOpen(true)
  }

  const closeCard = () => {
    setSelectedSolarTerm(null)
    setCardOrigin(undefined)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="parallax-bg" />
      <div
        className="parallax-bg-layer"
        style={{ transform: `translateY(${parallaxOffset * 0.3}px)` }}
      />

      <header
        className="page-header-transition"
        style={{
          opacity: headerOpacity,
          padding: '48px 32px 20px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2
        }}
      >
        <h1
          className="kaiti"
          style={{
            fontSize: 42,
            fontWeight: 600,
            color: '#2C3E50',
            letterSpacing: 12,
            marginBottom: 8
          }}
        >
          节气物候历
        </h1>
        <p style={{ fontSize: 15, color: '#888', letterSpacing: 2 }}>
          二十四节气 · 自然之美 · 万物有时
        </p>
      </header>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <Calendar
          selectedSolarTerm={selectedSolarTerm}
          onSolarTermClick={handleSolarTermClick}
        />
      </div>

      {selectedSolarTerm && (
        <div
          onClick={closeCard}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.15)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div onClick={e => e.stopPropagation()}>
            <CardModule
              solarTerm={selectedSolarTerm}
              originPosition={undefined}
              onRecordClick={handleRecordClick}
              animationKey={animationKey}
            />
          </div>
        </div>
      )}

      <section
        style={{
          padding: '60px 32px',
          maxWidth: 1200,
          margin: '0 auto',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div
          className="kaiti"
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#2C3E50',
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: 4
          }}
        >
          社区物候地图
        </div>
        <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 }}>
          来自全国各地的物候观察记录
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
          <PhenologyMap
            records={records}
            onRecordClick={() => {}}
          />
        </div>

        <div
          className="kaiti"
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#2C3E50',
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: 4
          }}
        >
          物候观察记录
        </div>
        <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 }}>
          浏览社区分享的物候记录，或提交你的观察
        </p>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 16,
            padding: '28px 24px',
            boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
          }}
        >
          <RecordList />
        </div>
      </section>

      <footer
        style={{
          padding: '40px 32px',
          textAlign: 'center',
          color: '#AAA',
          fontSize: 13,
          position: 'relative',
          zIndex: 2
        }}
      >
        节气物候历 · 感受四季流转的诗意
      </footer>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultSolarTerm={selectedSolarTerm}
      />
    </div>
  )
}

export default App
