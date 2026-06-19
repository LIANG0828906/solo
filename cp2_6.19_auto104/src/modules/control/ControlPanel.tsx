import React, { useState, useEffect, useRef, useMemo } from 'react'
import { format } from 'date-fns'
import { Photo, FilterState } from '@/types'
import { exportToGeoJSON } from '@/utils/geoJsonExporter'

interface ControlPanelProps {
  photos: Photo[]
  filterState: FilterState
  onFilterChange: (state: Partial<FilterState>) => void
}

function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: T) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const ControlPanel: React.FC<ControlPanelProps> = ({ photos, filterState, onFilterChange }) => {
  const [keywordInput, setKeywordInput] = useState(filterState.keyword)
  const debouncedRef = useRef<(kw: string) => void>()

  const { minTime, maxTime, minTimeStr, maxTimeStr } = useMemo(() => {
    if (photos.length === 0) {
      const now = Date.now()
      return {
        minTime: now - 86400000,
        maxTime: now,
        minTimeStr: format(now - 86400000, 'MM-dd'),
        maxTimeStr: format(now, 'MM-dd')
      }
    }
    const times = photos.map((p) => new Date(p.takenAt).getTime())
    const min = Math.min(...times)
    const max = Math.max(...times)
    return {
      minTime: min,
      maxTime: max,
      minTimeStr: format(min, 'MM-dd'),
      maxTimeStr: format(max, 'MM-dd')
    }
  }, [photos])

  const [startTimeMs, setStartTimeMs] = useState(minTime)
  const [endTimeMs, setEndTimeMs] = useState(maxTime)

  useEffect(() => {
    setStartTimeMs(minTime)
    setEndTimeMs(maxTime)
  }, [minTime, maxTime])

  useEffect(() => {
    debouncedRef.current = debounce((kw: string) => {
      onFilterChange({ keyword: kw })
    }, 300)
  }, [onFilterChange])

  useEffect(() => {
    setKeywordInput(filterState.keyword)
  }, [filterState.keyword])

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setKeywordInput(v)
    debouncedRef.current?.(v)
  }

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10)
    const clamped = Math.min(v, endTimeMs)
    setStartTimeMs(clamped)
    onFilterChange({ startTime: new Date(clamped) })
  }

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10)
    const clamped = Math.max(v, startTimeMs)
    setEndTimeMs(clamped)
    onFilterChange({ endTime: new Date(clamped) })
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ startDate: e.target.value })
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ endDate: e.target.value })
  }

  const handleExport = () => {
    if (photos.length === 0) return
    exportToGeoJSON(photos)
  }

  const filteredPhotos = useMemo(() => {
    let list = photos
    if (filterState.keyword) {
      const kw = filterState.keyword.toLowerCase()
      list = list.filter(
        (p) =>
          p.fileName.toLowerCase().includes(kw) ||
          p.cameraModel.toLowerCase().includes(kw)
      )
    }
    if (filterState.startDate) {
      const start = new Date(filterState.startDate + 'T00:00:00').getTime()
      list = list.filter((p) => new Date(p.takenAt).getTime() >= start)
    }
    if (filterState.endDate) {
      const end = new Date(filterState.endDate + 'T23:59:59').getTime()
      list = list.filter((p) => new Date(p.takenAt).getTime() <= end)
    }
    return list.slice(0, 50)
  }, [photos, filterState])

  return (
    <div className="right-panel">
      <div className="panel-header">控制面板</div>

      <div className="control-section">
        <label className="control-label">时间轴</label>
        <div>
          <label style={{ fontSize: 11, color: '#999', display: 'block', marginBottom: 4 }}>
            起始时间
          </label>
          <input
            type="range"
            className="timeline-slider"
            min={minTime}
            max={maxTime}
            value={startTimeMs}
            onChange={handleStartChange}
            disabled={photos.length === 0}
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={{ fontSize: 11, color: '#999', display: 'block', marginBottom: 4 }}>
            结束时间
          </label>
          <input
            type="range"
            className="timeline-slider"
            min={minTime}
            max={maxTime}
            value={endTimeMs}
            onChange={handleEndChange}
            disabled={photos.length === 0}
          />
        </div>
        <div className="timeline-range">
          <span>{minTimeStr}</span>
          <span>{maxTimeStr}</span>
        </div>
      </div>

      <div className="control-section">
        <label className="control-label">日期范围筛选</label>
        <div className="date-inputs">
          <div>
            <label>开始日期</label>
            <input
              type="date"
              value={filterState.startDate}
              onChange={handleStartDateChange}
            />
          </div>
          <div>
            <label>结束日期</label>
            <input
              type="date"
              value={filterState.endDate}
              onChange={handleEndDateChange}
            />
          </div>
        </div>
      </div>

      <div className="control-section">
        <label className="control-label">关键词搜索</label>
        <input
          type="text"
          className="keyword-input"
          placeholder="搜索文件名或相机型号..."
          value={keywordInput}
          onChange={handleKeywordChange}
        />
        {filterState.keyword && (
          <div style={{ marginTop: 10, maxHeight: 140, overflowY: 'auto' }}>
            {filteredPhotos.length === 0 ? (
              <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: 12 }}>
                无匹配结果
              </div>
            ) : (
              filteredPhotos.map((p) => (
                <div
                  key={p.id}
                  style={{
                    fontSize: 12,
                    padding: '6px 8px',
                    borderRadius: 4,
                    color: '#555',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: p.dominantColor,
                      flexShrink: 0
                    }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.fileName}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="control-section">
        <button
          className="export-btn"
          onClick={handleExport}
          disabled={photos.length === 0}
        >
          导出 GeoJSON
        </button>
        <div style={{ fontSize: 11, color: '#999', marginTop: 8, textAlign: 'center' }}>
          共 {photos.length} 张照片
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
