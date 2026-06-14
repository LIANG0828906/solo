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

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#2E7D32'
    if (score >= 60) return '#F57C00'
    return '#D32F2F'
  }

  const getScoreGradient = (score: number) => {
    const r = Math.min(255, Math.round(255 * (1 - score / 100) * 2))
    const g = Math.min(255, Math.round(255 * (score / 50)))
    return `rgb(${r}, ${g}, 46)`
  }

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

  const dateRecords = calendarDays.find(d => d.date === selectedDate)?.records || []

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
