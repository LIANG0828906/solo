import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export interface TimelinePage {
  id: string
  tripId: string
  date: string
  title: string
  locationName?: string
  thumbnailUrl?: string
}

export interface TimelineProps {
  pages: TimelinePage[]
  animationProgress: number
  tripId: string
}

export default function Timeline({ pages, animationProgress, tripId }: TimelineProps) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const sortedPages = [...pages].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const currentIndex = Math.min(
    Math.floor(animationProgress * sortedPages.length),
    Math.max(sortedPages.length - 1, 0)
  )

  useEffect(() => {
    if (sortedPages.length === 0 || !containerRef.current) return
    const currentPage = sortedPages[currentIndex]
    if (!currentPage) return
    const itemEl = itemRefs.current.get(currentPage.id)
    if (itemEl) {
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const itemRect = itemEl.getBoundingClientRect()
      const scrollLeft = itemEl.offsetLeft - containerRect.width / 2 + itemRect.width / 2
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
    }
  }, [currentIndex, sortedPages])

  const handlePageClick = (page: TimelinePage) => {
    navigate(`/trip/${page.tripId}`, { state: { highlightPageId: page.id } })
  }

  return (
    <div
      ref={containerRef}
      className="flex gap-4 overflow-x-auto py-4 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      style={{ scrollbarWidth: 'thin' }}
    >
      {sortedPages.map((page, index) => {
        const isActive = index <= currentIndex
        const isCurrent = index === currentIndex
        return (
          <div
            key={page.id}
            ref={(el) => {
              if (el) itemRefs.current.set(page.id, el)
            }}
            onClick={() => handlePageClick(page)}
            className={cn(
              'flex-shrink-0 w-32 cursor-pointer transition-all duration-300 ease-in-out hover:scale-105',
              isCurrent ? 'scale-105' : ''
            )}
          >
            <div
              className={cn(
                'rounded-xl overflow-hidden border-2 transition-all duration-300',
                isCurrent ? 'border-indigo-500 shadow-lg shadow-indigo-200' : isActive ? 'border-indigo-300' : 'border-gray-200'
              )}
            >
              <div className="relative aspect-square bg-gray-100">
                {page.thumbnailUrl ? (
                  <img src={page.thumbnailUrl} alt={page.title || page.locationName || '旅程照片'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                )}
                <div
                  className={cn(
                    'absolute inset-0 transition-opacity duration-300',
                    isActive ? 'opacity-0' : 'opacity-40 bg-gray-900'
                  )}
                />
              </div>
            </div>
            <div className="mt-2 px-1">
              <p className={cn('text-xs font-medium mb-0.5', isCurrent ? 'text-indigo-600' : isActive ? 'text-gray-700' : 'text-gray-400')}>
                {format(new Date(page.date), 'MM月dd日')}
              </p>
              <p className={cn('text-xs truncate', isCurrent ? 'text-gray-900 font-medium' : 'text-gray-500')}>
                {page.title || page.locationName || '未命名'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
