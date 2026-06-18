import React, { useEffect } from 'react'
import { useWeekStore, TEMPLATES } from './store/weekStore'
import WeekForm from './components/WeekForm'
import WeekPreview from './components/WeekPreview'

const App: React.FC = () => {
  const { initWeek, template, getCurrentWeek } = useWeekStore()
  const currentWeek = getCurrentWeek()
  const { colors } = TEMPLATES[template]

  useEffect(() => {
    initWeek()
  }, [initWeek])

  return (
    <div className="app">
      <header className="app-header" style={{ borderBottomColor: colors.accent }}>
        <div className="header-content">
          <h1 className="app-title" style={{ color: colors.title }}>
            📋 WeekReporter
          </h1>
          {currentWeek && (
            <div className="header-week-info" style={{ color: colors.body }}>
              {currentWeek.year} 年第 {currentWeek.weekNumber} 周
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <section className="editor-panel">
          <WeekForm />
        </section>
        <section className="preview-panel">
          <WeekPreview />
        </section>
      </main>
    </div>
  )
}

export default App
