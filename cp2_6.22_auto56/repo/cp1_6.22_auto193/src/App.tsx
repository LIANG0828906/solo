import React, { useState, useEffect } from 'react'
import { Meeting, Page } from './types'
import { meetingApi } from './api/meetingApi'
import MeetingForm from './components/MeetingForm'
import MinutesDisplay from './components/MinutesDisplay'
import TodoList from './components/TodoList'

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null)
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadMeetings = async () => {
    try {
      const data = await meetingApi.getMeetings(searchQuery)
      setMeetings(data)
    } catch (error) {
      console.error('加载会议列表失败:', error)
    }
  }

  const loadMeetingDetail = async (id: string) => {
    setLoading(true)
    try {
      const data = await meetingApi.getMeeting(id)
      setCurrentMeeting(data)
    } catch (error) {
      console.error('加载会议详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMeetings()
  }, [searchQuery])

  useEffect(() => {
    if (currentMeetingId && currentPage === 'detail') {
      loadMeetingDetail(currentMeetingId)
    }
  }, [currentMeetingId, currentPage])

  const handleMeetingCreated = (meeting: Meeting) => {
    setCurrentMeetingId(meeting.id)
    setCurrentMeeting(meeting)
    setCurrentPage('detail')
  }

  const handleViewMeeting = (meeting: Meeting) => {
    setCurrentMeetingId(meeting.id)
    setCurrentMeeting(meeting)
    setCurrentPage('detail')
    setSidebarOpen(false)
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
    setCurrentMeetingId(null)
    setCurrentMeeting(null)
    loadMeetings()
  }

  const handleUpdate = () => {
    if (currentMeetingId) {
      loadMeetingDetail(currentMeetingId)
    }
    loadMeetings()
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const Sidebar = () => (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" style={{ marginLeft: '-4px' }}>
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <span style={styles.logoText}>会议纪要助手</span>
      </div>
      
      <nav style={styles.nav}>
        <div
          className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}
          onClick={handleBackToHome}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>所有会议</span>
        </div>
      </nav>

      <div style={styles.sidebarFooter}>
        <span style={styles.sidebarHint}>共 {meetings.length} 条会议记录</span>
      </div>
    </div>
  )

  const MobileHeader = () => (
    <div className="mobile-header">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hamburger-btn"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <span style={styles.mobileTitle}>会议纪要助手</span>
      <div style={{ width: '40px' }} />
    </div>
  )

  const HomePage = () => (
    <div className="content-area">
      <div style={styles.topBar}>
        <div style={styles.searchContainer}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={styles.searchIcon}>
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="搜索会议标题"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <MeetingForm onMeetingCreated={handleMeetingCreated} />

      {meetings.length > 0 && (
        <div style={styles.meetingsSection}>
          <h2 style={styles.sectionTitle}>历史会议</h2>
          <div style={styles.meetingsGrid}>
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="meeting-card"
                onClick={() => handleViewMeeting(meeting)}
              >
                <h3 style={styles.meetingCardTitle}>{meeting.title}</h3>
                <p style={styles.meetingCardDate}>
                  {formatDate(meeting.createdAt)}
                </p>
                <div style={styles.meetingCardStats}>
                  <span style={styles.statBadge}>
                    {meeting.resolutions.length} 条决议
                  </span>
                  <span style={styles.statBadge}>
                    {meeting.todos.length} 项待办
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const DetailPage = () => {
    if (loading) {
      return (
        <div className="content-area" style={styles.loadingContainer}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '16px', color: '#6B7280' }}>加载中...</p>
        </div>
      )
    }

    if (!currentMeeting) {
      return (
        <div className="content-area" style={styles.emptyState}>
          <p>会议不存在</p>
          <button onClick={handleBackToHome} className="back-button">
            返回首页
          </button>
        </div>
      )
    }

    return (
      <div className="content-area">
        <div style={styles.detailHeader}>
          <button onClick={handleBackToHome} className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            返回
          </button>
          <div className="fade-in">
            <h1 style={styles.detailTitle}>{currentMeeting.title}</h1>
            <p style={styles.detailDate}>创建于 {formatDate(currentMeeting.createdAt)}</p>
          </div>
        </div>

        <MinutesDisplay
          resolutions={currentMeeting.resolutions}
          onUpdate={handleUpdate}
        />

        <TodoList
          todos={currentMeeting.todos}
          onUpdate={handleUpdate}
        />
      </div>
    )
  }

  return (
    <div className="app-container">
      <Sidebar />
      
      <div className="main-content">
        <MobileHeader />
        {sidebarOpen && (
          <div className="overlay" onClick={() => setSidebarOpen(false)} />
        )}
        {currentPage === 'home' ? <HomePage /> : <DetailPage />}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  logo: {
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontSize: '16px',
    fontWeight: 600,
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
  },
  sidebarFooter: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  sidebarHint: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  mobileTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1E293B',
  },
  topBar: {
    marginBottom: '24px',
  },
  searchContainer: {
    position: 'relative',
    maxWidth: '400px',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  meetingsSection: {
    marginTop: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1E293B',
  },
  meetingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  meetingCardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1E293B',
    marginBottom: '8px',
    lineHeight: 1.4,
  },
  meetingCardDate: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '12px',
  },
  meetingCardStats: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  statBadge: {
    padding: '4px 10px',
    backgroundColor: '#F3F4F6',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#6B7280',
  },
  detailHeader: {
    marginBottom: '24px',
  },
  detailTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: '8px',
  },
  detailDate: {
    fontSize: '14px',
    color: '#6B7280',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px',
    color: '#6B7280',
  },
}

export default App
