import React, { useEffect, useState, useMemo } from 'react'
import { useAppStore, TimeEntry } from './store'
import ProjectPanel from './ProjectPanel'
import TimerEntry from './TimerEntry'
import ReportView from './ReportView'

const App: React.FC = () => {
  const { projects, currentProjectId, generateReport, loadFromStorage } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadFromStorage()
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId),
    [projects, currentProjectId]
  )

  const weeklyMinutes = useMemo(() => {
    if (!currentProject) return 0
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - diff)
    monday.setHours(0, 0, 0, 0)

    return currentProject.entries
      .filter((e) => e.startTime >= monday.getTime())
      .reduce((sum, e) => sum + e.duration, 0)
  }, [currentProject])

  const formatWeeklyTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}小时${mins}分钟`
  }

  const entriesByDate = useMemo(() => {
    if (!currentProject) return {}
    const groups: Record<string, TimeEntry[]> = {}

    currentProject.entries.forEach((entry) => {
      const date = new Date(entry.startTime)
      const dateStr = date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
      if (!groups[dateStr]) {
        groups[dateStr] = []
      }
      groups[dateStr].push(entry)
    })

    return groups
  }, [currentProject])

  const sortedDates = useMemo(() => {
    return Object.keys(entriesByDate).sort((a, b) => {
      const dateA = new Date(a)
      const dateB = new Date(b)
      return dateB.getTime() - dateA.getTime()
    })
  }, [entriesByDate])

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleGenerateReport = () => {
    if (currentProject) {
      generateReport(currentProject.id)
    }
  }

  const appStyle: React.CSSProperties = {
    display: 'flex',
    height: '100vh',
    width: '100%',
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  }

  const mainContentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 32px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
  }

  const mobileHeaderStyle: React.CSSProperties = {
    ...headerStyle,
    padding: '16px 20px',
    position: 'relative',
  }

  const titleContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }

  const projectTitleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1E293B',
  }

  const weeklyTimeStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#6C63FF',
    fontWeight: 500,
  }

  const generateButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-out',
  }

  const contentAreaStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 32px',
  }

  const mobileContentAreaStyle: React.CSSProperties = {
    ...contentAreaStyle,
    padding: '16px 20px',
  }

  const dateGroupStyle: React.CSSProperties = {
    marginBottom: '24px',
  }

  const dateHeaderStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#64748B',
    marginBottom: '12px',
    paddingLeft: '4px',
  }

  const entryListStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  }

  const entryItemStyle: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.2s ease-out',
  }

  const entryLeftStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  }

  const entryDescriptionStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1E293B',
    marginBottom: '6px',
  }

  const entryTimeStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748B',
  }

  const entryRightStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
    marginLeft: '16px',
    flexShrink: 0,
  }

  const entryDurationStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#6C63FF',
  }

  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#E0E7FF',
    color: '#4338CA',
    fontSize: '10px',
    fontWeight: 500,
    borderRadius: '4px',
    textTransform: 'none',
  }

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94A3B8',
  }

  const emptyStateIconStyle: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  }

  const emptyStateTextStyle: React.CSSProperties = {
    fontSize: '14px',
  }

  const mobileMenuButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }

  const hamburgerIconStyle: React.CSSProperties = {
    width: '18px',
    height: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }

  const hamburgerLineStyle: React.CSSProperties = {
    height: '2px',
    backgroundColor: '#1E293B',
    borderRadius: '1px',
  }

  if (isMobile) {
    return (
      <div style={appStyle}>
        <div style={mainContentStyle}>
          <div style={mobileHeaderStyle}>
            <button
              style={mobileMenuButtonStyle}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span style={hamburgerIconStyle}>
                <span style={hamburgerLineStyle}></span>
                <span style={hamburgerLineStyle}></span>
                <span style={hamburgerLineStyle}></span>
              </span>
              <span>{currentProject?.name || '项目'}</span>
            </button>
            <button
              style={generateButtonStyle}
              onClick={handleGenerateReport}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10B981'
              }}
            >
              生成日报
            </button>
            <ProjectPanel
              isMobile={true}
              isOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>

          <div style={mobileContentAreaStyle}>
            <div style={titleContainerStyle}>
              <h1 style={projectTitleStyle}>{currentProject?.name}</h1>
              <p style={weeklyTimeStyle}>本周累计：{formatWeeklyTime(weeklyMinutes)}</p>
            </div>

            {sortedDates.length === 0 ? (
              <div style={emptyStateStyle}>
                <div style={emptyStateIconStyle}>📋</div>
                <p style={emptyStateTextStyle}>暂无工时记录</p>
                <p style={{ ...emptyStateTextStyle, fontSize: '12px', marginTop: '8px' }}>
                  点击右下角按钮开始计时
                </p>
              </div>
            ) : (
              sortedDates.map((date) => (
                <div key={date} style={dateGroupStyle}>
                  <h3 style={dateHeaderStyle}>{date}</h3>
                  <div style={entryListStyle}>
                    {entriesByDate[date].map((entry, index) => (
                      <div
                        key={entry.id}
                        style={{
                          ...entryItemStyle,
                          borderBottom:
                            index === entriesByDate[date].length - 1
                              ? 'none'
                              : '1px solid #E2E8F0',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F8FAFC'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF'
                        }}
                      >
                        <div style={entryLeftStyle}>
                          <div style={entryDescriptionStyle}>{entry.description}</div>
                          <div style={entryTimeStyle}>
                            {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                          </div>
                        </div>
                        <div style={entryRightStyle}>
                          <span style={tagStyle}>{entry.tag}</span>
                          <span style={entryDurationStyle}>{entry.duration}分钟</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            <ReportView />
          </div>
        </div>

        <TimerEntry />
      </div>
    )
  }

  return (
    <div style={appStyle}>
      <ProjectPanel />

      <div style={mainContentStyle}>
        <div style={headerStyle}>
          <div style={titleContainerStyle}>
            <h1 style={projectTitleStyle}>{currentProject?.name}</h1>
            <p style={weeklyTimeStyle}>本周累计：{formatWeeklyTime(weeklyMinutes)}</p>
          </div>
          <button
            style={generateButtonStyle}
            onClick={handleGenerateReport}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#059669'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#10B981'
            }}
          >
            生成日报
          </button>
        </div>

        <div style={contentAreaStyle}>
          {sortedDates.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyStateIconStyle}>📋</div>
              <p style={emptyStateTextStyle}>暂无工时记录</p>
              <p style={{ ...emptyStateTextStyle, fontSize: '12px', marginTop: '8px' }}>
                点击右下角按钮开始计时
              </p>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date} style={dateGroupStyle}>
                <h3 style={dateHeaderStyle}>{date}</h3>
                <div style={entryListStyle}>
                  {entriesByDate[date].map((entry, index) => (
                    <div
                      key={entry.id}
                      style={{
                        ...entryItemStyle,
                        borderBottom:
                          index === entriesByDate[date].length - 1
                            ? 'none'
                            : '1px solid #E2E8F0',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F8FAFC'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF'
                      }}
                    >
                      <div style={entryLeftStyle}>
                        <div style={entryDescriptionStyle}>{entry.description}</div>
                        <div style={entryTimeStyle}>
                          {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                        </div>
                      </div>
                      <div style={entryRightStyle}>
                        <span style={tagStyle}>{entry.tag}</span>
                        <span style={entryDurationStyle}>{entry.duration}分钟</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          <ReportView />
        </div>
      </div>

      <TimerEntry />
    </div>
  )
}

export default App
