import { useState, useEffect, useCallback } from 'react'
import { useWorkStore } from '@/stores/useWorkStore'
import SearchFilter from '@/components/SearchFilter'
import WorkCard from '@/components/WorkCard'
import DetailModal from '@/components/DetailModal'
import EmptyState from '@/components/EmptyState'
import type { Work, SearchParams } from '@/types'

function useColumnCount() {
  const [count, setCount] = useState(() =>
    window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1
  )
  useEffect(() => {
    const onResize = () =>
      setCount(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return count
}

function distributeToColumns(works: Work[], count: number) {
  const cols: { work: Work; index: number }[][] = Array.from({ length: count }, () => [])
  works.forEach((work, i) => cols[i % count].push({ work, index: i }))
  return cols
}

export default function GalleryPage() {
  const { works, loading, searchParams, loadWorks, setSearchParams } = useWorkStore()
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const columnCount = useColumnCount()

  useEffect(() => {
    loadWorks()
  }, [searchParams, loadWorks])

  const handleSearch = useCallback(
    (params: SearchParams) => setSearchParams({ status: 'published', ...params }),
    [setSearchParams]
  )

  const columns = distributeToColumns(works, columnCount)

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-10">
      <SearchFilter onSearch={handleSearch} />

      <div className="mt-6">
        {loading ? (
          <div className="masonry-grid">
            {Array.from({ length: columnCount }).map((_, colIdx) => (
              <div key={colIdx} className="masonry-grid-column flex-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="masonry-item">
                    <div
                      className="animate-pulse rounded-card bg-surface-lighter"
                      style={{ height: `${120 + i * 40}px` }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : works.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="masonry-grid">
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="masonry-grid-column flex-1">
                {col.map(({ work, index }) => (
                  <div key={work.id} className="masonry-item">
                    <WorkCard work={work} onClick={() => setSelectedWork(work)} index={index} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <DetailModal work={selectedWork} onClose={() => setSelectedWork(null)} />
    </div>
  )
}
