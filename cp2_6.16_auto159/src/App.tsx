import React, { useState, useEffect, useRef } from 'react'
import { Lightbulb, Download, BarChart2, X } from 'lucide-react'
import { useWritingStore } from '@/store/writingStore'
import WritingEditor from '@/components/WritingEditor'
import IdeaSidebar from '@/components/IdeaSidebar'
import StatsPanel from '@/components/StatsPanel'

export default function App() {
  const loadData = useWritingStore((s) => s.loadData)
  const exportAllWritings = useWritingStore((s) => s.exportAllWritings)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statsDrawerOpen, setStatsDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    loadData()
  }, [loadData])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const md = await exportAllWritings()
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `写作记录_${new Date().toISOString().slice(0, 10)}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('📥 导出成功')
    } catch (e) {
      showToast('❌ 导出失败')
    } finally {
      setTimeout(() => setIsExporting(false), 500)
    }
  }

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: '#FFF8E7' }}>
      <nav
        className="flex items-center justify-between px-4 border-b border-[#E0DACD] shrink-0 z-40 relative"
        style={{ height: '56px', backgroundColor: '#2C3E50' }}
      >
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Lightbulb size={20} color="#F39C12" />
            </button>
          )}
          <h1 className="text-lg font-bold" style={{ color: '#FFF8E7' }}>
            ✒️ 墨拾 · 每日写作
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isMobile && (
            <button
              onClick={() => setStatsDrawerOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <BarChart2 size={20} color="#F39C12" />
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all"
            style={{
              backgroundColor: isExporting ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
              color: '#FFF8E7',
            }}
            onMouseEnter={(e) => {
              if (!isExporting) e.currentTarget.style.backgroundColor = '#FFE0B2'
              if (!isExporting) e.currentTarget.style.color = '#2C3E50'
            }}
            onMouseLeave={(e) => {
              if (!isExporting) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
              if (!isExporting) e.currentTarget.style.color = '#FFF8E7'
            }}
          >
            {isExporting ? (
              <span
                className="w-4 h-4 rounded-full border-2 border-t-transparent"
                style={{
                  borderColor: '#FFF8E7',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.5s linear infinite',
                }}
              />
            ) : (
              <Download size={16} />
            )}
            导出
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <IdeaSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <WritingEditor />
        </main>

        {!isMobile && <StatsPanel />}
      </div>

      {isMobile && statsDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 fade-in"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setStatsDrawerOpen(false)}
          />
          <div
            className="fixed top-14 left-0 right-0 bottom-0 z-50 overflow-hidden fade-in"
            style={{ animation: 'slideDown 0.3s ease' }}
          >
            <div className="h-full w-full max-w-sm mx-auto relative">
              <button
                onClick={() => setStatsDrawerOpen(false)}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full z-10"
                style={{ backgroundColor: 'rgba(44,62,80,0.8)' }}
              >
                <X size={16} color="#fff" />
              </button>
              <StatsPanel />
            </div>
          </div>
        </>
      )}

      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl text-sm text-white z-50 shadow-xl fade-in"
          style={{ backgroundColor: 'rgba(44,62,80,0.95)' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
