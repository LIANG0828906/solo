import React, { useState, useEffect } from 'react'
import DiaryCard from './components/DiaryCard'
import Calendar from './components/Calendar'
import { useAppStore } from './store'

const App: React.FC = () => {
  const { viewMode, setViewMode, toggleMobileCalendar, mobileCalendarOpen } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#F5F5F0',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <button
        onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          background: 'none',
          border: 'none',
          color: '#333333',
          fontWeight: 300,
          fontSize: '14px',
          cursor: 'pointer',
          padding: '4px 0',
          overflow: 'hidden',
          zIndex: 100,
        }}
        onMouseEnter={(e) => {
          const underline = e.currentTarget.querySelector('.btn-underline') as HTMLElement
          if (underline) {
            underline.style.transform = 'scaleX(1)'
          }
        }}
        onMouseLeave={(e) => {
          const underline = e.currentTarget.querySelector('.btn-underline') as HTMLElement
          if (underline) {
            underline.style.transform = 'scaleX(0)'
          }
        }}
      >
        年度色温画卷
        <span
          className="btn-underline"
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            width: '100%',
            height: '1px',
            backgroundColor: '#333333',
            transform: 'translateX(-50%) scaleX(0)',
            transformOrigin: 'center',
            transition: 'transform 0.3s ease',
          }}
        />
      </button>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          gap: '48px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ animation: 'fadeIn 0.6s ease' }}>
          <DiaryCard />
        </div>

        {!isMobile && (
          <div style={{ animation: 'fadeIn 0.6s ease 0.2s both' }}>
            <Calendar />
          </div>
        )}
      </div>

      {isMobile && (
        <>
          <button
            onClick={toggleMobileCalendar}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#333333',
              color: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              padding: '10px 28px',
              fontSize: '14px',
              fontWeight: 300,
              cursor: 'pointer',
              zIndex: 90,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
            }}
          >
            {mobileCalendarOpen ? '收起日历' : '查看日历'}
          </button>

          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '70vh',
              backgroundColor: '#FAFAFA',
              borderRadius: '16px 16px 0 0',
              padding: '20px 16px',
              zIndex: 80,
              transform: mobileCalendarOpen ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s ease',
              overflowY: 'auto',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Calendar />
          </div>

          {mobileCalendarOpen && (
            <div
              onClick={toggleMobileCalendar}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                zIndex: 70,
                animation: 'fadeIn 0.3s ease',
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

export default App
