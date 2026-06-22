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
import styles from './App.module.css'

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
    <div className={styles.planPage}>
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
    <div className={styles.reviewPage}>
      <div className={styles.reviewTimelineContainer}>
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
    <div className={styles.dateNav}>
      <button
        onClick={goPrev}
        className={styles.navBtn}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={goToday}
        className={styles.todayBtn}
      >
        {currentDate}
      </button>
      <button
        onClick={goNext}
        className={styles.navBtn}
      >
        <ChevronRight size={18} />
      </button>
      {currentDate === format(new Date(), 'yyyy-MM-dd') && (
        <span className={styles.todayLabel}>今天</span>
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
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logoSection}>
          <div className={styles.logo}>T</div>
          <h1 className={styles.appTitle}>
            TimeBlock Planner
          </h1>
        </div>

        <DateNavigator />

        <nav className={styles.desktopNav}>
          <NavLink
            to="/plan"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <CalendarDays size={15} /> 计划
          </NavLink>
          <NavLink
            to="/review"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <BarChart3 size={15} /> 回顾
          </NavLink>
        </nav>
      </header>

      <main className={styles.mainContent}>
        <Routes>
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="*" element={<Navigate to="/plan" replace />} />
        </Routes>
      </main>

      <footer className={styles.mobileNav}>
        <div className={styles.mobileNavInner}>
          <NavLink to="/plan" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`}>
            <CalendarDays size={20} /> 计划
          </NavLink>
          <NavLink to="/review" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`}>
            <BarChart3 size={20} /> 回顾
          </NavLink>
        </div>
      </footer>
    </div>
  )
}
