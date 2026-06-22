import React, { useState, useEffect } from 'react'
import IssueList from './components/IssueList'
import IssueDetail from './components/IssueDetail'
import CreateIssueModal from './components/CreateIssueModal'
import {
  fetchUsers,
  fetchIssues,
  fetchIssueDetail,
  createIssue,
  User,
  IssueListItem,
  IssueDetail as IssueDetailType
} from './api'

const AVATAR_COLORS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'
]

const getAvatarColor = (userId: string): string => {
  const index = parseInt(userId, 10) % AVATAR_COLORS.length
  return AVATAR_COLORS[index] || AVATAR_COLORS[0]
}

const getInitial = (name: string): string => {
  return name.charAt(0)
}

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [issues, setIssues] = useState<IssueListItem[]>([])
  const [selectedIssue, setSelectedIssue] = useState<IssueDetailType | null>(null)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileTab, setMobileTab] = useState<'list' | 'detail'>('list')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const loadData = async () => {
    try {
      const [usersData, issuesData] = await Promise.all([
        fetchUsers(),
        fetchIssues()
      ])
      setUsers(usersData)
      setIssues(issuesData)
      if (usersData.length > 0) {
        setCurrentUser(prev => prev || usersData[0])
      }
      if (issuesData.length > 0 && !selectedIssueId) {
        setSelectedIssueId(issuesData[0].id)
      }
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedIssueId) {
      fetchIssueDetail(selectedIssueId).then(data => {
        setSelectedIssue(data)
      }).catch(() => {
        setSelectedIssue(null)
      })
    }
  }, [selectedIssueId])

  const refreshDetail = async () => {
    if (selectedIssueId) {
      const [detailData, issuesData] = await Promise.all([
        fetchIssueDetail(selectedIssueId),
        fetchIssues()
      ])
      setSelectedIssue(detailData)
      setIssues(issuesData)
    }
  }

  const handleSelectIssue = (id: string) => {
    setSelectedIssueId(id)
    if (isMobile) setMobileTab('detail')
  }

  const handleCreateIssue = async (data: {
    title: string
    description: string
    options: { name: string; emoji: string }[]
    deadline: number
  }) => {
    try {
      const newIssue = await createIssue(data)
      setShowCreateModal(false)
      await loadData()
      setSelectedIssueId(newIssue.id)
      if (isMobile) setMobileTab('detail')
    } catch {
      alert('创建失败')
    }
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>加载中...</p>
      </div>
    )
  }

  const renderSidebar = () => (
    <div style={{
      ...styles.sidebar,
      ...(isMobile && mobileTab !== 'list' ? { display: 'none' } : {})
    }}>
      <IssueList
        issues={issues}
        selectedId={selectedIssueId}
        onSelect={handleSelectIssue}
        onCreateNew={() => setShowCreateModal(true)}
      />
    </div>
  )

  const renderDetail = () => (
    <div style={{
      ...styles.detailArea,
      ...(isMobile && mobileTab !== 'detail' ? { display: 'none' } : {})
    }}>
      {selectedIssue && currentUser ? (
        <IssueDetail
          issue={selectedIssue}
          currentUser={currentUser}
          onUpdate={refreshDetail}
        />
      ) : (
        <div style={styles.emptyDetail}>
          <div style={styles.emptyIcon}>📊</div>
          <p style={styles.emptyText}>
            {isMobile ? '请切换到"议题列表"选择一个议题' : '请从左侧选择一个议题'}
          </p>
        </div>
      )}
    </div>
  )

  const renderUserPanel = () => (
    !isMobile && (
      <div style={styles.userPanel}>
        <h3 style={styles.userPanelTitle}>团队成员</h3>
        <div style={styles.userList}>
          {users.map(user => (
            <div
              key={user.id}
              style={{
                ...styles.userItem,
                ...(currentUser?.id === user.id ? styles.userItemActive : {})
              }}
              onClick={() => setCurrentUser(user)}
            >
              <div style={{
                ...styles.userItemAvatar,
                background: getAvatarColor(user.id),
              }}>
                {getInitial(user.name)}
              </div>
              <span style={styles.userItemName}>{user.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  )

  return (
    <div style={styles.app}>
      <nav style={styles.navbar}>
        <div style={styles.navbarContent}>
          <div style={styles.logoContainer}>
            <span style={styles.logoIcon}>📋</span>
            <h1 style={styles.logoText}>团队决策记录仪</h1>
          </div>
          {currentUser && (
            <div style={styles.userSection}>
              {!isMobile && <span style={styles.userLabel}>当前身份:</span>}
              <select
                style={styles.userSelect}
                value={currentUser.id}
                onChange={e => {
                  const user = users.find(u => u.id === e.target.value)
                  if (user) setCurrentUser(user)
                }}
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              <div style={{
                ...styles.userAvatar,
                background: getAvatarColor(currentUser.id),
              }}>
                {getInitial(currentUser.name)}
              </div>
            </div>
          )}
        </div>
      </nav>

      {isMobile && (
        <div style={styles.mobileTabs}>
          <button
            onClick={() => setMobileTab('list')}
            style={{
              ...styles.mobileTab,
              ...(mobileTab === 'list' ? styles.mobileTabActive : {})
            }}
          >
            议题列表
          </button>
          <button
            onClick={() => setMobileTab('detail')}
            style={{
              ...styles.mobileTab,
              ...(mobileTab === 'detail' ? styles.mobileTabActive : {})
            }}
          >
            议题详情
          </button>
        </div>
      )}

      <div style={{
        ...styles.mainLayout,
        ...(isMobile ? styles.mainLayoutMobile : {})
      }}>
        {renderSidebar()}
        {renderDetail()}
        {renderUserPanel()}
      </div>

      {showCreateModal && (
        <CreateIssueModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateIssue}
        />
      )}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #E5E7EB',
    borderTopColor: '#6366F1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: '14px',
  },
  navbar: {
    height: '64px',
    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexShrink: 0,
  },
  navbarContent: {
    height: '100%',
    maxWidth: '100%',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    animation: 'pulse 2s ease-in-out infinite',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#FFFFFF',
    whiteSpace: 'nowrap',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userLabel: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
  },
  userSelect: {
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.15)',
    color: '#FFFFFF',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
  },
  userAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    border: '2px solid rgba(255,255,255,0.5)',
  },
  mobileTabs: {
    display: 'flex',
    background: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    flexShrink: 0,
  },
  mobileTab: {
    flex: 1,
    padding: '12px',
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    fontWeight: 500,
    color: '#6B7280',
    cursor: 'pointer',
  },
  mobileTabActive: {
    color: '#6366F1',
    borderBottom: '2px solid #6366F1',
    marginBottom: '-1px',
  },
  mainLayout: {
    flex: 1,
    display: 'flex',
    minHeight: 'calc(100vh - 64px)',
    overflow: 'hidden',
  },
  mainLayoutMobile: {
    flexDirection: 'column',
    minHeight: 'calc(100vh - 64px - 48px)',
  },
  sidebar: {
    width: '360px',
    minWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)',
    overflow: 'hidden',
  },
  detailArea: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
  },
  emptyDetail: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '20px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '64px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '15px',
    color: '#9CA3AF',
  },
  userPanel: {
    width: '240px',
    minWidth: '240px',
    background: '#FFFFFF',
    borderLeft: '1px solid #E5E7EB',
    padding: '20px 16px',
    overflowY: 'auto',
    height: 'calc(100vh - 64px)',
  },
  userPanelTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: '16px',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  userItemActive: {
    background: '#F5F3FF',
  },
  userItemAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
  },
  userItemName: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: 500,
  },
}

const extraStyles = document.createElement('style')
extraStyles.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @media (max-width: 768px) {
    [data-role="sidebar"] {
      width: 100% !important;
      min-width: 100% !important;
      height: calc(100vh - 64px - 48px) !important;
    }
    [data-role="detailArea"] {
      height: calc(100vh - 64px - 48px) !important;
    }
  }
`
document.head.appendChild(extraStyles)

export default App
