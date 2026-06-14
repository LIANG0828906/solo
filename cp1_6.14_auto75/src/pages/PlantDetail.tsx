import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import {
  getPlant,
  getCareRecords,
  addCareRecord,
  getPhotos,
  addPhoto,
  checkHealth,
  type Plant,
  type CareRecord,
  type Photo,
  type HealthReport
} from '../api/plantApi'

const TABS = [
  { id: 'calendar', label: '养护日历', icon: '📅' },
  { id: 'records', label: '浇水施肥记录', icon: '💧' },
  { id: 'album', label: '成长相册', icon: '📷' },
  { id: 'health', label: '健康检测报告', icon: '💚' }
] as const

type TabId = typeof TABS[number]['id']

const RECORD_TYPES: { id: CareRecord['type']; label: string; icon: string }[] = [
  { id: 'water', label: '浇水', icon: '💧' },
  { id: 'fertilize', label: '施肥', icon: '🌱' },
  { id: 'prune', label: '修剪', icon: '✂️' },
  { id: 'repot', label: '换盆', icon: '🪴' },
  { id: 'observation', label: '观察', icon: '👁️' }
]

const HEALTH_QUESTIONS = [
  {
    question: '叶片状态如何？',
    subtitle: '观察植物叶片的整体情况',
    options: [
      { text: '翠绿饱满，非常健康', score: 25 },
      { text: '有些发黄，但不严重', score: 18 },
      { text: '有枯斑或卷曲', score: 10 },
      { text: '大量脱落或枯萎', score: 3 }
    ]
  },
  {
    question: '土壤干湿情况？',
    subtitle: '感受一下花盆中土壤的湿度',
    options: [
      { text: '湿度适中，手感舒适', score: 25 },
      { text: '略干或略湿', score: 18 },
      { text: '非常干燥或过于潮湿', score: 10 },
      { text: '干裂或积水严重', score: 3 }
    ]
  },
  {
    question: '近期生长情况？',
    subtitle: '对比观察植物的生长趋势',
    options: [
      { text: '长势良好，有新芽', score: 25 },
      { text: '生长缓慢，但还算稳定', score: 18 },
      { text: '几乎停止生长', score: 10 },
      { text: '状态明显变差', score: 3 }
    ]
  },
  {
    question: '光照条件如何？',
    subtitle: '评估植物摆放位置的光照情况',
    options: [
      { text: '光照充足，位置合适', score: 25 },
      { text: '偶尔能晒到太阳', score: 18 },
      { text: '光线较暗', score: 10 },
      { text: '完全晒不到太阳或暴晒', score: 3 }
    ]
  }
]

const PlantDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [plant, setPlant] = useState<Plant | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('calendar')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  const [loading, setLoading] = useState(true)

  const [careRecords, setCareRecords] = useState<CareRecord[]>([])
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [showDateSheet, setShowDateSheet] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [newRecord, setNewRecord] = useState({
    type: 'water' as CareRecord['type'],
    note: ''
  })

  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectMode, setSelectMode] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [healthState, setHealthState] = useState<
    'start' | 'progress' | 'question' | 'result'
  >('start')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null)
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (id) {
      loadPlantData()
    }
  }, [id])

  const loadPlantData = async () => {
    if (!id) return
    try {
      const [plantData, recordsData, photosData] = await Promise.all([
        getPlant(id),
        getCareRecords(id),
        getPhotos(id)
      ])
      setPlant(plantData)
      setCareRecords(recordsData)
      setPhotos(photosData)
    } catch (error) {
      console.error('加载植物详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tabId: TabId) => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab)
    const newIndex = TABS.findIndex(t => t.id === tabId)
    setSlideDirection(newIndex > currentIndex ? 'right' : 'left')
    setActiveTab(tabId)
  }

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const recordsByDate: Record<string, CareRecord[]> = {}
    careRecords.forEach(record => {
      if (!recordsByDate[record.date]) recordsByDate[record.date] = []
      recordsByDate[record.date].push(record)
    })

    const days: Array<{
      day: number
      date: string
      isToday: boolean
      hasRecord: boolean
      records: CareRecord[]
      empty: boolean
    }> = []

    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, date: '', isToday: false, hasRecord: false, records: [], empty: true })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dateObj = new Date(year, month, d)
      days.push({
        day: d,
        date: dateStr,
        isToday: dateObj.getTime() === today.getTime(),
        hasRecord: !!recordsByDate[dateStr],
        records: recordsByDate[dateStr] || [],
        empty: false
      })
    }

    return days
  }, [calendarDate, careRecords])

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    setShowDateSheet(true)
  }

  const handleAddRecord = async () => {
    if (!id) return
    try {
      const now = new Date()
      const record = await addCareRecord(id, {
        type: newRecord.type,
        note: newRecord.note,
        date: selectedDate || new Date().toISOString().split('T')[0],
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      })
      setCareRecords(prev => [record, ...prev])
      setShowAddRecord(false)
      setNewRecord({ type: 'water', note: '' })
    } catch (error) {
      console.error('添加记录失败:', error)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id) return
    const files = e.target.files
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData()
      formData.append('photo', files[i])
      try {
        const photo = await addPhoto(id, formData)
        setPhotos(prev => [photo, ...prev])
      } catch (error) {
        console.error('上传照片失败:', error)
      }
    }
  }

  const handleDownloadSelected = async () => {
    if (selectedPhotos.length === 0 || !plant) return

    try {
      const zip = new JSZip()
      const selectedPhotoData = photos.filter(p => selectedPhotos.includes(p.id))

      for (const photo of selectedPhotoData) {
        const response = await fetch(photo.url)
        const blob = await response.blob()
        const fileName = `${plant.name}_${photo.date}.jpg`
        zip.file(fileName, blob)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `${plant.name}_成长相册.zip`)
      setSelectMode(false)
      setSelectedPhotos([])
    } catch (error) {
      console.error('下载失败:', error)
    }
  }

  const timelinePhotos = useMemo(() => {
    const byMonth: Record<string, Photo> = {}
    const sorted = [...photos].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    sorted.forEach(photo => {
      const month = photo.date.substring(0, 7)
      if (!byMonth[month]) {
        byMonth[month] = photo
      }
    })
    return Object.entries(byMonth).map(([month, photo]) => ({ month, photo })).reverse()
  }, [photos])

  const togglePhotoSelect = (photoId: string) => {
    setSelectedPhotos(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    )
  }

  const startHealthCheck = () => {
    setHealthState('progress')
    setTimeout(() => {
      setHealthState('question')
      setCurrentQuestion(0)
      setAnswers([])
    }, 3000)
  }

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex]
    setAnswers(newAnswers)

    if (currentQuestion < HEALTH_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      submitHealthCheck(newAnswers)
    }
  }

  const submitHealthCheck = async (finalAnswers: number[]) => {
    if (!id) return
    try {
      const report = await checkHealth(id, finalAnswers)
      setHealthReport(report)
      setHealthState('result')
      
      setTimeout(() => {
        animateScore(report.score)
      }, 500)
    } catch (error) {
      console.error('健康检测失败:', error)
    }
  }

  const animateScore = (targetScore: number) => {
    const duration = 1000
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(targetScore * easeProgress))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return '#2E7D32'
    if (score >= 60) return '#F57C00'
    return '#D32F2F'
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    return `${year}年${parseInt(month)}月`
  }

  const getRecordIcon = (type: string) => {
    return RECORD_TYPES.find(t => t.id === type)?.icon || '📝'
  }

  const getRecordLabel = (type: string) => {
    return RECORD_TYPES.find(t => t.id === type)?.label || type
  }

  const dateRecords = calendarDays.find(d => d.date === selectedDate)?.records || []
  const waterFertilizeRecords = careRecords.filter(r => r.type === 'water' || r.type === 'fertilize')

  if (loading) {
    return (
      <div className="page-white">
        <div style={{ textAlign: 'center', padding: '64px', color: '#757575' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
          加载中...
        </div>
      </div>
    )
  }

  if (!plant) {
    return (
      <div className="page-white">
        <div style={{ textAlign: 'center', padding: '64px', color: '#757575' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😢</div>
          未找到该植物
        </div>
      </div>
    )
  }

  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  return (
    <div className="page-white">
      <div className="page-content" style={{ paddingTop: '24px' }}>
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          返回首页
        </button>
      </div>

      <div className="detail-header">
        <img src={plant.photo || ''} alt={plant.name} className="detail-image" />
        <div className="detail-info">
          <div className="detail-name">{plant.name}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="tag">{plant.species}</span>
            <span className="tag">{plant.location}</span>
          </div>
          <div className="detail-meta">
            <div className="detail-meta-item">
              📅 购买日期：{plant.purchaseDate || '未知'}
            </div>
            <div className="detail-meta-item">
              💧 浇水周期：每{plant.waterCycle}天
            </div>
            <div className="detail-meta-item">
              🌱 施肥周期：每{plant.fertilizeCycle}天
            </div>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        {TABS.map(tab => (
          <div
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.icon} {tab.label}
          </div>
        ))}
      </div>

      <div className={`tab-content ${slideDirection === 'left' ? 'slide-left' : ''}`} key={activeTab}>
        {activeTab === 'calendar' && (
          <div>
            <div className="calendar-container">
              <div className="calendar-header">
                <button 
                  className="calendar-nav-btn"
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <div className="calendar-title">
                  {calendarDate.getFullYear()}年{calendarDate.getMonth() + 1}月
                </div>
                <button 
                  className="calendar-nav-btn"
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>

              <div className="calendar-grid">
                {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                  <div key={day} className="calendar-weekday">{day}</div>
                ))}
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`calendar-day ${day.empty ? 'empty' : ''} ${day.isToday ? 'today' : ''}`}
                    onClick={() => !day.empty && handleDateClick(day.date)}
                  >
                    {!day.empty && (
                      <>
                        <span className="calendar-day-number">{day.day}</span>
                        {day.hasRecord && <span className="calendar-day-dot" />}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>浇水施肥记录</h3>
              <button 
                className="primary-btn" 
                onClick={() => {
                  setSelectedDate(new Date().toISOString().split('T')[0])
                  setShowAddRecord(true)
                }}
              >
                + 添加记录
              </button>
            </div>

            {waterFertilizeRecords.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💧</div>
                <div className="empty-state-text">还没有浇水施肥记录</div>
              </div>
            ) : (
              <div className="records-list">
                {waterFertilizeRecords.map(record => (
                  <div key={record.id} className="record-item-full">
                    <div className="record-date">{record.date}</div>
                    <div className={`record-icon ${record.type}`}>
                      {getRecordIcon(record.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{getRecordLabel(record.type)}</div>
                      {record.note && <div style={{ fontSize: '13px', color: '#757575', marginTop: '4px' }}>{record.note}</div>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#757575' }}>{record.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'album' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>成长相册</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
                <button className="secondary-btn" onClick={() => photoInputRef.current?.click()}>
                  + 上传照片
                </button>
              </div>
            </div>

            {photos.length > 0 && (
              <div className="batch-actions">
                {!selectMode ? (
                  <button className="select-mode-btn" onClick={() => setSelectMode(true)}>
                    批量选择
                  </button>
                ) : (
                  <>
                    <button className="select-mode-btn" onClick={() => {
                      setSelectMode(false)
                      setSelectedPhotos([])
                    }}>
                      取消选择
                    </button>
                    {selectedPhotos.length > 0 && (
                      <>
                        <span className="selected-count">已选择 {selectedPhotos.length} 张</span>
                        <button className="download-btn" onClick={handleDownloadSelected}>
                          下载压缩包
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {timelinePhotos.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>成长时间线</h4>
                <div className="timeline-container">
                  {timelinePhotos.map(({ month, photo }) => (
                    <div key={month} className="timeline-item">
                      <div className="timeline-date">{formatMonth(month)}</div>
                      <img 
                        src={photo.url} 
                        alt={formatMonth(month)}
                        className="timeline-thumb"
                        onClick={() => setLightboxPhoto(photo.url)}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {photos.length > 0 && (
              <div style={{ marginTop: '48px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>全部照片</h4>
                <div className="gallery-grid">
                  {photos.map(photo => (
                    <div
                      key={photo.id}
                      className={`gallery-item ${selectedPhotos.includes(photo.id) ? 'selected' : ''}`}
                      onClick={() => {
                        if (selectMode) {
                          togglePhotoSelect(photo.id)
                        } else {
                          setLightboxPhoto(photo.url)
                        }
                      }}
                    >
                      <img src={photo.url} alt={photo.date} loading="lazy" />
                      {selectMode && selectedPhotos.includes(photo.id) && (
                        <div className="gallery-select-icon">✓</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {photos.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📷</div>
                <div className="empty-state-text">还没有上传照片，记录植物的成长吧</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'health' && (
          <div>
            {healthState === 'start' && (
              <div className="health-card">
                <div className="health-start">
                  <div className="health-start-icon">💚</div>
                  <div className="health-start-text">通过简单的问卷评估植物健康状况</div>
                  <button className="primary-btn" onClick={startHealthCheck}>
                    开始检测
                  </button>
                </div>
              </div>
            )}

            {healthState === 'progress' && (
              <div className="health-card">
                <div className="health-start">
                  <div className="health-start-icon">🔍</div>
                  <div className="health-start-text">正在分析植物健康状态...</div>
                  <button className="primary-btn progress-btn" disabled>
                    <div className="progress-bar" />
                    检测中...
                  </button>
                </div>
              </div>
            )}

            {healthState === 'question' && (
              <div className="question-card">
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#757575', marginBottom: '8px' }}>
                    问题 {currentQuestion + 1} / {HEALTH_QUESTIONS.length}
                  </div>
                  <div style={{ height: '4px', background: '#E0E0E0', borderRadius: '2px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        background: '#2E7D32', 
                        width: `${((currentQuestion + 1) / HEALTH_QUESTIONS.length) * 100}%`,
                        transition: 'width 0.3s ease'
                      }} 
                    />
                  </div>
                </div>

                <div className="question-title">{HEALTH_QUESTIONS[currentQuestion].question}</div>
                <div className="question-subtitle">{HEALTH_QUESTIONS[currentQuestion].subtitle}</div>

                <div className="question-options">
                  {HEALTH_QUESTIONS[currentQuestion].options.map((option, idx) => (
                    <button
                      key={idx}
                      className={`question-option ${answers.includes(idx) ? 'selected' : ''}`}
                      onClick={() => handleAnswer(idx)}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {healthState === 'result' && healthReport && (
              <div className="health-card">
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>健康检测报告</h3>
                  <div style={{ fontSize: '14px', color: '#757575' }}>
                    检测时间：{healthReport.date}
                  </div>
                </div>

                <div className="result-score-container">
                  <div className="score-ring">
                    <svg width="180" height="180">
                      <circle cx="90" cy="90" r="70" className="score-ring-bg" />
                      <circle
                        cx="90"
                        cy="90"
                        r="70"
                        className="score-ring-fill"
                        stroke={getScoreGradient(healthReport.score)}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <div className="score-text">
                      <span className="score-number" style={{ color: getScoreGradient(healthReport.score) }}>
                        {animatedScore}
                      </span>
                      <span className="score-label">健康评分</span>
                    </div>
                  </div>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>养护建议</h4>
                <ul className="suggestions-list">
                  {healthReport.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="suggestion-item">
                      <span className="suggestion-icon">💡</span>
                      <span className="suggestion-text">{suggestion}</span>
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                  <button 
                    className="primary-btn" 
                    onClick={() => {
                      setHealthState('start')
                      setHealthReport(null)
                      setAnimatedScore(0)
                    }}
                  >
                    重新检测
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showDateSheet && (
        <>
          <div className="sheet-overlay" onClick={() => setShowDateSheet(false)} />
          <div className="sheet-content">
            <div className="sheet-handle" />
            <div className="sheet-title">
              {selectedDate} 养护记录
            </div>

            {showAddRecord ? (
              <div>
                <div className="form-group">
                  <label className="form-label">操作类型</label>
                  <div className="location-tags">
                    {RECORD_TYPES.map(rt => (
                      <button
                        key={rt.id}
                        className={`location-tag ${newRecord.type === rt.id ? 'active' : ''}`}
                        onClick={() => setNewRecord(prev => ({ ...prev, type: rt.id }))}
                      >
                        {rt.icon} {rt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">备注</label>
                  <textarea
                    className="form-textarea"
                    placeholder="记录一下今天的养护情况..."
                    value={newRecord.note}
                    onChange={e => setNewRecord(prev => ({ ...prev, note: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button className="secondary-btn" onClick={() => setShowAddRecord(false)}>取消</button>
                  <button className="primary-btn" onClick={handleAddRecord}>保存</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ color: '#757575' }}>共 {dateRecords.length} 条记录</span>
                  <button className="primary-btn" onClick={() => setShowAddRecord(true)}>
                    + 添加记录
                  </button>
                </div>
                {dateRecords.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#757575' }}>
                    今天还没有养护记录
                  </div>
                ) : (
                  dateRecords.map(record => (
                    <div key={record.id} className="record-item">
                      <div className={`record-icon ${record.type}`}>
                        {getRecordIcon(record.type)}
                      </div>
                      <div className="record-content">
                        <div className="record-type">{getRecordLabel(record.type)}</div>
                        {record.note && <div className="record-note">{record.note}</div>}
                      </div>
                      <div className="record-time">{record.time}</div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </>
      )}

      {lightboxPhoto && (
        <div className="lightbox-overlay" onClick={() => setLightboxPhoto(null)}>
          <button className="lightbox-close" onClick={() => setLightboxPhoto(null)}>×</button>
          <img src={lightboxPhoto} alt="预览" className="lightbox-image" />
        </div>
      )}
    </div>
  )
}

export default PlantDetail
