import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiTrendingUp, FiMenu, FiX } from 'react-icons/fi'
import { useFoodData, FoodItem } from './hooks/useFoodData'
import FoodSearch from './components/FoodSearch'
import Timeline from './components/Timeline'
import NutritionPanel from './components/NutritionPanel'
import TrendPanel from './components/TrendPanel'

const MIN_WIDTH = 1200
const DRAWER_WIDTH = 320

const App = () => {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : MIN_WIDTH + 1
  )
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isTrendOpen, setIsTrendOpen] = useState(false)

  const {
    records,
    todayRecords,
    todayNutrition,
    suggestionText,
    trendData,
    searchFoods,
    addRecord,
    updateRecord,
    deleteRecord,
  } = useFoodData()

  const isCompact = windowWidth < MIN_WIDTH

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isCompact && isDrawerOpen) {
      setIsDrawerOpen(false)
    }
  }, [isCompact, isDrawerOpen])

  const handleAddRecord = useCallback(
    (food: FoodItem, grams: number) => {
      addRecord(food, grams)
    },
    [addRecord]
  )

  const todayDateStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F6FA',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          height: '56px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E4E7ED',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4A90D9 0%, #3A7BC8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(74,144,217,0.25)',
            }}
          >
            🥗
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#2D3436' }}>
              营养追踪
            </div>
            <div style={{ fontSize: '11px', color: '#909399' }}>{todayDateStr}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isCompact && (
            <button
              onClick={() => setIsDrawerOpen(true)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#F2F6FC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#606266',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EBEEF5'
                e.currentTarget.style.color = '#2D3436'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F2F6FC'
                e.currentTarget.style.color = '#606266'
              }}
            >
              <FiMenu size={18} />
            </button>
          )}
        </div>
      </header>

      <div
        style={{
          display: 'flex',
          height: 'calc(100vh - 56px)',
          minWidth: isCompact ? '100%' : `${MIN_WIDTH}px`,
          position: 'relative',
        }}
      >
        <aside
          style={{
            width: '320px',
            flexShrink: 0,
            background: '#FFFFFF',
            borderRight: '1px solid #E4E7ED',
            height: '100%',
            overflowY: 'auto',
          }}
        >
          <FoodSearch onSearch={searchFoods} onSelect={handleAddRecord} />
        </aside>

        <main
          style={{
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Timeline
              records={records}
              onEdit={updateRecord}
              onDelete={deleteRecord}
            />
          </div>

          <div
            style={{
              padding: '12px 20px 20px',
              display: 'flex',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsTrendOpen(true)}
              style={{
                width: '160px',
                padding: '12px 20px',
                background: '#4A90D9',
                color: '#FFFFFF',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(74,144,217,0.3)',
                transition: 'filter 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(0.95)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(74,144,217,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,144,217,0.3)'
              }}
            >
              <FiTrendingUp size={16} />
              查看趋势
            </motion.button>
          </div>
        </main>

        {!isCompact && (
          <aside
            style={{
              width: '340px',
              flexShrink: 0,
              background: '#FFFFFF',
              borderLeft: '1px solid #E4E7ED',
              height: '100%',
              overflowY: 'auto',
            }}
          >
            <NutritionPanel
              nutrition={todayNutrition}
              suggestion={suggestionText}
              todayRecords={todayRecords}
            />
          </aside>
        )}
      </div>

      <AnimatePresence>
        {isCompact && isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsDrawerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: '#00000050',
                zIndex: 200,
                top: '56px',
              }}
            />
            <motion.aside
              initial={{ x: DRAWER_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: DRAWER_WIDTH }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: '56px',
                right: 0,
                width: `${DRAWER_WIDTH}px`,
                height: 'calc(100vh - 56px)',
                background: '#FFFFFF',
                zIndex: 201,
                boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #F2F6FC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#2D3436' }}>
                  今日营养
                </span>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    color: '#606266',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F2F6FC'
                    e.currentTarget.style.color = '#2D3436'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#606266'
                  }}
                >
                  <FiX size={16} />
                </button>
              </div>
              <NutritionPanel
                nutrition={todayNutrition}
                suggestion={suggestionText}
                todayRecords={todayRecords}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <TrendPanel
        isOpen={isTrendOpen}
        onClose={() => setIsTrendOpen(false)}
        trendData={trendData}
      />

      {isTrendOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setIsTrendOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.08)',
            zIndex: 499,
            pointerEvents: 'auto',
          }}
        />
      )}
    </div>
  )
}

export default App
