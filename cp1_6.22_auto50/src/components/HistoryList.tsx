import { useEffect, useRef, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import type { HistoryRecord } from '@/types'

interface HistoryListProps {
  records: HistoryRecord[]
}

const itemHeight = 60

export default function HistoryList({ records }: HistoryListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const prevFirstIdRef = useRef<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateHeight = () => {
      setContainerHeight(el.clientHeight)
    }

    updateHeight()

    const ro = new ResizeObserver(updateHeight)
    ro.observe(el)

    return () => {
      ro.disconnect()
    }
  }, [])

  const useVirtual = records.length > 100

  const startIdx = useVirtual ? Math.floor(scrollTop / itemHeight) : 0
  const endIdx = useVirtual
    ? Math.min(records.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + 3)
    : records.length

  const visibleRecords = useVirtual
    ? records.slice(startIdx, endIdx)
    : records

  const totalHeight = useVirtual ? records.length * itemHeight : undefined
  const offsetY = useVirtual ? startIdx * itemHeight : 0

  const currentFirstId = records.length > 0 ? records[0].id : null
  const shouldAnimateNew =
    !useVirtual &&
    currentFirstId !== null &&
    prevFirstIdRef.current !== null &&
    currentFirstId !== prevFirstIdRef.current

  useEffect(() => {
    prevFirstIdRef.current = currentFirstId
  }, [currentFirstId])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          提交历史
        </span>
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            opacity: 0.7,
          }}
        >
          共{records.length}条
        </span>
      </div>

      <div
        ref={containerRef}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: useVirtual ? `translateY(${offsetY}px)` : undefined,
            }}
          >
            {visibleRecords.map((record, visIdx) => {
              const realIdx = useVirtual ? startIdx + visIdx : visIdx
              const isNewRecord = shouldAnimateNew && realIdx === 0

              return (
                <div
                  key={record.id}
                  className={isNewRecord ? 'slide-up' : undefined}
                  style={{
                    height: itemHeight,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {record.status === 'success' ? (
                    <CheckCircle size={18} color="#10b981" />
                  ) : (
                    <XCircle size={18} color="#ef4444" />
                  )}

                  <div
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {record.code.replace(/\s+/g, ' ').slice(0, 20) || '(空代码)'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        marginTop: 2,
                      }}
                    >
                      {formatTime(record.timestamp)}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color:
                        record.status === 'success'
                          ? '#10b981'
                          : '#ef4444',
                    }}
                  >
                    {record.status === 'success' ? '成功' : '错误'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {records.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              fontSize: 13,
            }}
          >
            暂无提交记录
          </div>
        )}
      </div>
    </div>
  )
}
