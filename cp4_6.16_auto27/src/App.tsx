import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { format, addDays, subDays } from 'date-fns'
import { CalendarDays, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { usePlanStore } from '@/store/usePlanStore'
import PlanTimeline from '@/modules/plan/components/PlanTimeline'
import PlanEditor from '@/modules/plan/components/PlanEditor'
import ReviewTimeline from '@/modules/review/components/ReviewTimeline'
import ReviewStats from '@/modules/review/components/ReviewStats'
import type { TimeBlock } from '@/types'

function PlanPage() {
  const [editorVisible, setEditorVisible] = useState(false)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  const [newBlockTimes, setNewBlockTimes] = useState({ startTime: 540, endTime: 600 })
  const addBlock = usePlanStore(s => s.addBlock)

  const handleCreateBlock = (startTime: number, endTime: number) => {
    setNewBlockTimes({ startTime, endTime })
    setEditingBlock(null)
    setEditorVisible(true)
  }

  const handleBlockClick = (block: TimeBlock) => {
    setEditingBlock(block)
    setEditorVisible(true)
  }

  const handleSave = (data: Partial<TimeBlock> & { startTime: number; endTime: number }) => {
    if (editingBlock) {
      const { updateBlock } = usePlanStore.getState()
      updateBlock(editingBlock.id, data)
    } else {
      addBlock({
        title: data.title || '新任务',
        startTime: data.startTime,
        endTime: data.endTime,
        color: data.color || '#e94560',
        type: data.type || 'other',
        note: data.note || '',
        lane: data.lane ?? 0,
      })
    }
    setEditorVisible(false)
    setEditingBlock(null)
  }

  const handleDelete = (id: string) => {
    const { deleteBlock } = usePlanStore.getState()
    deleteBlock(id)
    setEditorVisible(false)
    setEditingBlock(null)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PlanTimeline
        onCreateBlock={handleCreateBlock}
        onBlockClick={handleBlockClick}
      />
      <PlanEditor
        visible={editorVisible}
        block={editingBlock}
        startTime={newBlockTimes.startTime}
        endTime={newBlockTimes.endTime}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => { setEditorVisible(false); setEditingBlock(null) }}
      />
    </div>
  )
}

function ReviewPage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: 16 }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ReviewTimeline />
      </div>
      <ReviewStats />
    </div>
  )
}

function DateNavigator() {
  const currentDate = usePlanStore(s => s.currentDate)
  const setCurrentDate = usePlanStore(s => s.setCurrentDate)

  const goPrev = useCallback(() => {
    const d = subDays(new Date(currentDate), 1)
    setCurrentDate(format(d, 'yyyy-MM-dd'))
  }, [currentDate, setCurrentDate])

  const goNext = useCallback(() => {
    const d = addDays(new Date(currentDate), 1)
    setCurrentDate(format(d, 'yyyy-MM-dd'))
  }, [currentDate, setCurrentDate])

  const goToday = useCallback(() => {
    setCurrentDate(format(new Date(), 'yyyy-MM-dd'))
  }, [setCurrentDate])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={goPrev}
        style={{
          background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer',
          padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center',
        }}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={goToday}
        style={{
          background: '#0f3460', border: 'none', color: '#fff', cursor: 'pointer',
          padding: '4px 12px', borderRadius: 4, fontSize: 13, fontWeight: 600,
          fontFamily: 'monospace',
        }}
      >
        {currentDate}
      </button>
      <button
        onClick={goNext}
        style={{
          background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer',
          padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center',
        }}
      >
        <ChevronRight size={18} />
      </button>
      {currentDate === format(new Date(), 'yyyy-MM-dd') && (
        <span style={{ fontSize: 11, color: '#e94560', fontWeight: 600, marginLeft: 4 }}>今天</span>
      )}
    </div>
  )
}

export default function App() {
  const loadFromDB = usePlanStore(s => s.loadFromDB)
  const currentDate = usePlanStore(s => s.currentDate)

  useEffect(() => {
    loadFromDB(currentDate)
  }, [currentDate, loadFromDB])

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#1a1a2e', color: '#e0e0e0', overflow: 'hidden',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', background: '#16213e',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(6px)', zIndex: 100, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #e94560, #0f3460)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 16, color: '#fff',
          }}>T</div>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>
            TimeBlock Planner
          </h1>
        </div>

        <DateNavigator />

        <nav style={{ display: 'flex', gap: 4 }}>
          <NavLink
            to="/plan"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              color: isActive ? '#fff' : '#888',
              background: isActive ? '#e94560' : 'transparent',
              textDecoration: 'none', transition: 'all 0.2s',
            })}
          >
            <CalendarDays size={15} /> 计划
          </NavLink>
          <NavLink
            to="/review"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              color: isActive ? '#fff' : '#888',
              background: isActive ? '#e94560' : 'transparent',
              textDecoration: 'none', transition: 'all 0.2s',
            })}
          >
            <BarChart3 size={15} /> 回顾
          </NavLink>
        </nav>
      </header>

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="*" element={<Navigate to="/plan" replace />} />
        </Routes>
      </main>

      <footer style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#16213e', borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '6px 0', zIndex: 100,
      }} className="mobile-nav">
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <NavLink to="/plan" style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: isActive ? '#e94560' : '#666', textDecoration: 'none', fontSize: 11,
          })}>
            <CalendarDays size={20} /> 计划
          </NavLink>
          <NavLink to="/review" style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: isActive ? '#e94560' : '#666', textDecoration: 'none', fontSize: 11,
          })}>
            <BarChart3 size={20} /> 回顾
          </NavLink>
        </div>
      </footer>
    </div>
  )
}
