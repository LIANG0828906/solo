import { useState, useRef, useEffect, useMemo } from 'react'
import { Tabs } from 'antd'
import { Line } from '@ant-design/charts'
import dayjs from 'dayjs'
import {
  useAirStore,
  type PollutantKey,
  POLLUTANT_RANGES,
} from '@/stores/airStore'
import { airApi } from '@/api/airApi'

interface TrendPanelProps {
  open: boolean
  onClose: () => void
}

const CITY_COLORS: Record<string, string> = {
  first: '#00b4d8',
  second: '#ff6b6b',
}

export default function TrendPanel({ open, onClose }: TrendPanelProps) {
  const [activeTab, setActiveTab] = useState<PollutantKey>('pm25')
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({})
  const panelRef = useRef<HTMLDivElement>(null)

  const selectedCities = useAirStore((s) => s.selectedCities)
  const cities = useAirStore((s) => s.cities)
  const historyData = useAirStore((s) => s.historyData)
  const setHistoryData = useAirStore((s) => s.setHistoryData)

  const city1 = cities.find((c) => c.id === selectedCities[0])
  const city2 = cities.find((c) => c.id === selectedCities[1])

  useEffect(() => {
    if (open && selectedCities.length === 2) {
      selectedCities.forEach((cityId) => {
        if (!historyData[cityId] && !loadingHistory[cityId]) {
          setLoadingHistory((prev) => ({ ...prev, [cityId]: true }))
          airApi
            .getHistory(cityId)
            .then((res) => {
              setHistoryData(cityId, res.data)
            })
            .finally(() => {
              setLoadingHistory((prev) => ({ ...prev, [cityId]: false }))
            })
        }
      })
    }
  }, [open, selectedCities])

  useEffect(() => {
    if (open && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect()
      setPosition({
        x: (window.innerWidth - rect.width) / 2,
        y: (window.innerHeight - rect.height) / 2,
      })
    }
  }, [open])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect()
      setDragging(true)
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y
        const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 0)
        const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 0)
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        })
      }
    }
    const handleMouseUp = () => setDragging(false)

    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, dragOffset])

  const chartData = useMemo(() => {
    if (!city1 || !city2) return []
    const h1 = historyData[city1.id]
    const h2 = historyData[city2.id]
    if (!h1 || !h2) return []

    const result: Array<{
      time: string
      value: number
      city: string
      cityId: string
    }> = []

    h1.forEach((d) => {
      result.push({
        time: dayjs(d.time).format('MM-DD HH:mm'),
        value: d[activeTab],
        city: city1.name,
        cityId: city1.id,
      })
    })

    h2.forEach((d) => {
      result.push({
        time: dayjs(d.time).format('MM-DD HH:mm'),
        value: d[activeTab],
        city: city2.name,
        cityId: city2.id,
      })
    })

    return result
  }, [city1, city2, historyData, activeTab])

  if (!open) return null

  const config = {
    data: chartData,
    xField: 'time',
    yField: 'value',
    seriesField: 'city',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    color: [CITY_COLORS.first, CITY_COLORS.second],
    lineStyle: {
      lineWidth: 3,
      shadowColor: 'rgba(0, 180, 216, 0.5)',
      shadowBlur: 10,
    },
    point: {
      size: 4,
      shape: 'circle',
      style: {
        lineWidth: 2,
        stroke: '#ffffff',
        cursor: 'pointer',
      },
    },
    state: {
      active: {
        style: {
          lineWidth: 4,
          shadowBlur: 20,
          shadowColor: 'rgba(0, 180, 216, 0.8)',
        },
        point: {
          size: 8,
          style: {
            lineWidth: 3,
            stroke: '#ffffff',
          },
        },
      },
    },
    tooltip: {
      domStyles: {
        'g2-tooltip': {
          background: 'rgba(10, 22, 40, 0.95)',
          border: '1px solid rgba(0, 180, 216, 0.3)',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        },
        'g2-tooltip-title': {
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          marginBottom: '8px',
        },
        'g2-tooltip-list-item': {
          color: '#ffffff',
          fontSize: '13px',
        },
        'g2-tooltip-marker': {
          width: '8px',
          height: '8px',
          borderRadius: '50%',
        },
      },
    },
    legend: {
      position: 'top' as const,
      offsetY: 8,
      itemName: {
        style: {
          fill: 'rgba(255, 255, 255, 0.8)',
          fontSize: 13,
        },
      },
      marker: {
        symbol: 'circle',
        style: {
          r: 5,
        },
      },
    },
    yAxis: {
      label: {
        style: {
          fill: 'rgba(255, 255, 255, 0.5)',
          fontSize: 11,
        },
      },
      grid: {
        line: {
          style: {
            stroke: 'rgba(255, 255, 255, 0.06)',
          },
        },
      },
      title: {
        text: POLLUTANT_RANGES[activeTab].unit,
        style: {
          fill: 'rgba(255, 255, 255, 0.5)',
          fontSize: 11,
        },
      },
    },
    xAxis: {
      label: {
        style: {
          fill: 'rgba(255, 255, 255, 0.5)',
          fontSize: 11,
        },
        autoHide: true,
        autoRotate: false,
      },
      grid: {
        line: {
          style: {
            stroke: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
      tickCount: 8,
    },
  }

  const tabItems = (Object.keys(POLLUTANT_RANGES) as PollutantKey[]).map((key) => ({
    key,
    label: (
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
        {POLLUTANT_RANGES[key].label}
      </span>
    ),
  }))

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        pointerEvents: 'none',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div
        ref={panelRef}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: 900,
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 600,
          borderRadius: 24,
          background: 'rgba(15, 30, 55, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
      >
        <div
          onMouseDown={handleMouseDown}
          style={{
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: dragging ? 'grabbing' : 'grab',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>📊</span>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              趋势对比 · {city1?.name} vs {city2?.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 107, 107, 0.3)'
              e.currentTarget.style.color = '#ff6b6b'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '12px 24px 0' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as PollutantKey)}
            items={tabItems}
            size="small"
            style={{ color: '#ffffff' }}
          />
        </div>

        <div
          style={{
            flex: 1,
            padding: '12px 24px 24px',
            minHeight: 400,
          }}
        >
          <Line {...config} />
        </div>
      </div>
    </div>
  )
}
