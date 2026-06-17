import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react'
import { useEventStore } from './store'

const EventList = lazy(() => import('./pages/EventList'))
const EventDetail = lazy(() => import('./pages/EventDetail'))

const App: React.FC = () => {
  const { events, currentEventId, setCurrentEvent, createEvent, init } = useEventStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newEventName, setNewEventName] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventDescription, setNewEventDescription] = useState('')

  useEffect(() => {
    init()
  }, [init])

  const openCreateModal = useCallback(() => {
    setNewEventName('')
    setNewEventDate('')
    setNewEventDescription('')
    setShowCreateModal(true)
  }, [])

  const currentEvent = currentEventId ? events.find(e => e.id === currentEventId) : null

  const isFormValid = newEventName.trim().length > 0 && newEventDate.length > 0

  const handleCreateEvent = useCallback(() => {
    if (!isFormValid) return
    createEvent(newEventName.trim(), newEventDate, newEventDescription.trim())
    setNewEventName('')
    setNewEventDate('')
    setNewEventDescription('')
    setShowCreateModal(false)
  }, [isFormValid, newEventName, newEventDate, newEventDescription, createEvent])

  const sidebarStyle: React.CSSProperties = {
    width: '240px',
    backgroundColor: '#1E1E3F',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 20px',
    flexShrink: 0,
    position: 'sticky',
    top: 0
  }

  const mainStyle: React.CSSProperties = {
    backgroundColor: '#F5F5FA',
    flex: 1,
    height: '100vh',
    overflow: 'auto',
    padding: '32px'
  }

  const logoStyle: React.CSSProperties = {
    color: '#FFFFFF',
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '40px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }

  const logoDotStyle: React.CSSProperties = {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#6C63FF',
    boxShadow: '0 0 12px rgba(108, 99, 255, 0.6)'
  }

  const createBtnStyle: React.CSSProperties = {
    width: '80%',
    height: '44px',
    backgroundColor: '#6C63FF',
    borderRadius: '12px',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    margin: '0 auto 32px',
    display: 'block',
    transition: 'background-color 0.2s'
  }

  const navItemStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '14px',
    padding: '12px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s'
  }

  const navItemActiveStyle: React.CSSProperties = {
    ...navItemStyle,
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    color: '#FFFFFF'
  }

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  }

  const modalStyle: React.CSSProperties = {
    width: '440px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    padding: '32px'
  }

  const modalTitleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '24px'
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#666',
    marginBottom: '8px'
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    borderRadius: '8px',
    border: '1px solid #DDD',
    padding: '10px',
    fontSize: '14px',
    color: '#333',
    outline: 'none',
    transition: 'border-color 0.2s',
    marginBottom: '16px',
    boxSizing: 'border-box'
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    height: '80px',
    resize: 'none',
    fontFamily: 'inherit'
  }

  const modalBtnGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    justifyContent: 'flex-end'
  }

  const cancelBtnStyle: React.CSSProperties = {
    height: '40px',
    padding: '0 24px',
    borderRadius: '8px',
    backgroundColor: '#EEEEF5',
    color: '#666',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }

  const submitBtnStyle: React.CSSProperties = {
    height: '40px',
    padding: '0 24px',
    borderRadius: '8px',
    backgroundColor: '#6C63FF',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }

  const inputFocusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#6C63FF'
  }

  const inputBlurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#DDD'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={sidebarStyle}>
        <div style={logoStyle}>
          <div style={logoDotStyle}></div>
          EventPulse
        </div>

        <button
          style={createBtnStyle}
          onClick={openCreateModal}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#5A52D5')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6C63FF')}
        >
          + 新建活动
        </button>

        <nav style={{ marginTop: '8px' }}>
          <div
            style={currentEvent ? navItemStyle : navItemActiveStyle}
            onClick={() => setCurrentEvent(null)}
            onMouseOver={(e) => {
              if (currentEvent) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
            }}
            onMouseOut={(e) => {
              if (currentEvent) e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            活动列表
          </div>
          
          {events.slice(0, 5).map(event => (
            <div
              key={event.id}
              style={currentEventId === event.id ? navItemActiveStyle : navItemStyle}
              onClick={() => setCurrentEvent(event.id)}
              onMouseOver={(e) => {
                if (currentEventId !== event.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
              }}
              onMouseOut={(e) => {
                if (currentEventId !== event.id) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {event.name}
              </span>
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
            共 {events.length} 个活动
          </div>
        </div>
      </aside>

      <main style={mainStyle}>
        <Suspense fallback={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#666',
            fontSize: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '3px solid #E8E8F0', 
                borderTopColor: '#6C63FF', 
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              加载中...
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        }>
          {currentEvent ? <EventDetail /> : <EventList />}
        </Suspense>
      </main>

      {showCreateModal && (
        <div style={modalOverlayStyle} onClick={() => setShowCreateModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={modalTitleStyle}>创建新活动</h2>
            
            <label style={labelStyle}>活动名称</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="请输入活动名称"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              onFocus={inputFocusStyle}
              onBlur={inputBlurStyle}
            />

            <label style={labelStyle}>活动日期</label>
            <input
              type="date"
              style={inputStyle}
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              onFocus={inputFocusStyle}
              onBlur={inputBlurStyle}
            />

            <label style={labelStyle}>活动描述</label>
            <textarea
              style={textareaStyle}
              placeholder="请输入活动描述（可选）"
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              onFocus={inputFocusStyle}
              onBlur={inputBlurStyle}
            />

            <div style={modalBtnGroupStyle}>
              <button
                style={cancelBtnStyle}
                onClick={() => setShowCreateModal(false)}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#DDDDE5')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#EEEEF5')}
              >
                取消
              </button>
              <button
                style={{
                  ...submitBtnStyle,
                  opacity: isFormValid ? 1 : 0.5,
                  cursor: isFormValid ? 'pointer' : 'not-allowed'
                }}
                onClick={handleCreateEvent}
                onMouseOver={(e) => {
                  if (isFormValid) e.currentTarget.style.backgroundColor = '#5A52D5'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#6C63FF'
                }}
                disabled={!isFormValid}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
