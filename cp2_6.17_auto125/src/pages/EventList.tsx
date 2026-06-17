import React, { useState } from 'react'
import { useEventStore, Event } from '../store'

const EventList: React.FC = () => {
  const { events, setCurrentEvent, deleteEvent } = useEventStore()
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)
  const [animatingDelete, setAnimatingDelete] = useState<string | null>(null)

  const handleDeleteClick = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation()
    setDeleteTarget(event)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setAnimatingDelete(deleteTarget.id)
    setTimeout(() => {
      deleteEvent(deleteTarget.id)
      setAnimatingDelete(null)
      setDeleteTarget(null)
    }, 300)
  }

  const pageHeaderStyle: React.CSSProperties = {
    marginBottom: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }

  const pageTitleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#333'
  }

  const pageSubtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#888',
    marginTop: '6px'
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px'
  }

  const cardStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    position: 'relative',
    overflow: 'hidden'
  }

  const cardDeleteAnimStyle: React.CSSProperties = {
    ...cardStyle,
    animation: 'slideOutLeft 0.3s ease-out forwards'
  }

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '16px'
  }

  const eventNameStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#333',
    lineHeight: 1.4,
    flex: 1,
    marginRight: '12px'
  }

  const dateBadgeStyle: React.CSSProperties = {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    color: '#6C63FF',
    fontSize: '12px',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
    flexShrink: 0
  }

  const descStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '20px',
    height: '44px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  }

  const statsRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #F0F0F5'
  }

  const statItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  }

  const statValueStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#333'
  }

  const statLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#999'
  }

  const btnGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px'
  }

  const btnStyle: React.CSSProperties = {
    flex: 1,
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#6C63FF',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  }

  const deleteBtnStyle: React.CSSProperties = {
    ...btnStyle,
    backgroundColor: '#E74C3C'
  }

  const emptyStateStyle: React.CSSProperties = {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '80px 24px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px'
  }

  const emptyIconStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  }

  const emptyTitleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '8px'
  }

  const emptyDescStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#888'
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

  const confirmDialogStyle: React.CSSProperties = {
    width: '360px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    padding: '28px'
  }

  const confirmTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '12px'
  }

  const confirmDescStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '24px'
  }

  const confirmBtnGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  }

  const cancelBtnStyle: React.CSSProperties = {
    width: '120px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#EEEEF5',
    color: '#666',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }

  const confirmDeleteBtnStyle: React.CSSProperties = {
    width: '120px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#E74C3C',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }

  const signedInCount = (event: Event) => event.participants.filter(p => p.signedIn).length

  return (
    <>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>活动列表</h1>
          <p style={pageSubtitleStyle}>管理您的所有活动，查看签到情况</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            backgroundColor: '#FFFFFF', 
            padding: '10px 16px', 
            borderRadius: '10px',
            fontSize: '13px',
            color: '#666',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
          }}>
            共 <strong style={{ color: '#6C63FF', fontSize: '16px' }}>{events.length}</strong> 个活动
          </div>
        </div>
      </div>

      <div style={gridStyle}>
        {events.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 style={emptyTitleStyle}>暂无活动</h3>
            <p style={emptyDescStyle}>点击左侧「新建活动」按钮创建您的第一个活动</p>
          </div>
        ) : (
          events.map(event => {
            const isDeleting = animatingDelete === event.id
            const signedIn = signedInCount(event)
            const total = event.participants.length
            return (
              <div
                key={event.id}
                style={isDeleting ? cardDeleteAnimStyle : cardStyle}
                onClick={() => !isDeleting && setCurrentEvent(event.id)}
                onMouseOver={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
                  }
                }}
                onMouseOut={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                  }
                }}
              >
                <div style={cardHeaderStyle}>
                  <h3 style={eventNameStyle}>{event.name}</h3>
                  <span style={dateBadgeStyle}>
                    {event.date}
                  </span>
                </div>

                <p style={descStyle}>
                  {event.description || '暂无活动描述'}
                </p>

                <div style={statsRowStyle}>
                  <div style={statItemStyle}>
                    <span style={statValueStyle}>{total}</span>
                    <span style={statLabelStyle}>参与者</span>
                  </div>
                  <div style={statItemStyle}>
                    <span style={{ ...statValueStyle, color: '#4CAF50' }}>{signedIn}</span>
                    <span style={statLabelStyle}>已签到</span>
                  </div>
                  <div style={statItemStyle}>
                    <span style={{ ...statValueStyle, color: total > 0 ? '#6C63FF' : '#999' }}>
                      {total > 0 ? Math.round((signedIn / total) * 100) : 0}%
                    </span>
                    <span style={statLabelStyle}>签到率</span>
                  </div>
                </div>

                <div style={btnGroupStyle}>
                  <button
                    style={btnStyle}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentEvent(event.id)
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#5A52D5')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6C63FF')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    查看详情
                  </button>
                  <button
                    style={deleteBtnStyle}
                    onClick={(e) => handleDeleteClick(e, event)}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#C0392B')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#E74C3C')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    删除
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <style>{`
        @keyframes slideOutLeft {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-80px) scale(0);
          }
        }
      `}</style>

      {deleteTarget && (
        <div style={modalOverlayStyle} onClick={() => !animatingDelete && setDeleteTarget(null)}>
          <div style={confirmDialogStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={confirmTitleStyle}>确认删除</h3>
            <p style={confirmDescStyle}>
              确定要删除活动「<strong style={{ color: '#E74C3C' }}>{deleteTarget.name}</strong>」吗？此操作不可撤销。
            </p>
            <div style={confirmBtnGroupStyle}>
              <button
                style={cancelBtnStyle}
                onClick={() => setDeleteTarget(null)}
                disabled={!!animatingDelete}
                onMouseOver={(e) => !animatingDelete && (e.currentTarget.style.backgroundColor = '#DDDDE5')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#EEEEF5')}
              >
                取消
              </button>
              <button
                style={confirmDeleteBtnStyle}
                onClick={confirmDelete}
                disabled={!!animatingDelete}
                onMouseOver={(e) => !animatingDelete && (e.currentTarget.style.backgroundColor = '#C0392B')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#E74C3C')}
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EventList
