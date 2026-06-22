import { useState, useEffect } from 'react'
import { useMoodStore, createMoodRecord, getMonthRecords } from '../store'
import MoodPicker from '../components/MoodPicker'
import MosaicCalendar from '../components/MosaicCalendar'
import MosaicGenerator from '../components/MosaicGenerator'
import type { MoodType } from '../types'
import './Home.css'

function Home() {
  const { records, addRecord, getRecordByDate } = useMoodStore()
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [moodText, setMoodText] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [isSaving, setIsSaving] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]
  const todayRecord = getRecordByDate(todayStr)

  useEffect(() => {
    if (todayRecord) {
      setSelectedMood(todayRecord.moodType)
      setMoodText(todayRecord.text)
    }
  }, [todayRecord])

  const handleMoodSelect = (moodType: MoodType) => {
    setSelectedMood(moodType)
    setShowTextInput(true)
  }

  const handleSubmit = async () => {
    if (!selectedMood || isSaving) return
    
    setIsSaving(true)
    const record = createMoodRecord(todayStr, selectedMood, moodText.trim())
    await addRecord(record)
    setIsSaving(false)
    
    setTimeout(() => {
      setShowTextInput(false)
    }, 300)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    if (text.length <= 140) {
      setMoodText(text)
    }
  }

  const monthRecords = getMonthRecords(records, currentYear, currentMonth)

  return (
    <div className="home-page">
      <section className="section mood-section">
        <h2 className="section-title">今天感觉怎么样？</h2>
        <p className="section-subtitle">选择一个代表你今天心情的颜色</p>
        
        <MoodPicker 
          selectedMood={selectedMood ?? undefined}
          onSelect={handleMoodSelect}
        />

        <div className={`text-input-wrapper ${showTextInput ? 'visible' : ''}`}>
          <div className="text-input-container">
            <textarea
              className="mood-textarea"
              placeholder="记录一下今天的心情吧...（最多140字）"
              value={moodText}
              onChange={handleTextChange}
              maxLength={140}
              rows={3}
            />
            <div className="textarea-footer">
              <span className="char-count">{moodText.length}/140</span>
              <button 
                className="submit-btn"
                onClick={handleSubmit}
                disabled={!selectedMood || isSaving}
              >
                {isSaving ? '保存中...' : todayRecord ? '更新记录' : '保存记录'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section calendar-section">
        <h2 className="section-title">色彩日历</h2>
        <p className="section-subtitle">用颜色记录每一天的心情</p>
        
        <MosaicCalendar 
          records={records}
          year={currentYear}
          month={currentMonth}
          onMonthChange={(year, month) => {
            setCurrentYear(year)
            setCurrentMonth(month)
          }}
        />
      </section>

      <section className="section mosaic-section">
        <h2 className="section-title">本月色彩拼图</h2>
        <p className="section-subtitle">你这个月的情绪调色盘</p>
        
        <MosaicGenerator records={monthRecords} />
      </section>
    </div>
  )
}

export default Home
