import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import PlantCard from './components/PlantCard'
import ReminderBell from './components/ReminderBell'
import PlantDetail from './pages/PlantDetail'
import { fetchPlants, addPlant, type Plant } from './api/plantApi'

const LOCATIONS = ['客厅', '阳台', '卧室', '书房', '厨房', '卫生间']

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [plants, setPlants] = useState<Plant[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    purchaseDate: '',
    location: '客厅',
    waterCycle: 3,
    fertilizeCycle: 15,
    photo: null as File | null,
    photoPreview: ''
  })

  useEffect(() => {
    loadPlants()
  }, [])

  const loadPlants = async () => {
    try {
      const data = await fetchPlants()
      setPlants(data)
    } catch (error) {
      console.error('加载植物失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file,
        photoPreview: URL.createObjectURL(file)
      }))
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.species) {
      alert('请填写植物名称和品种')
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('species', formData.species)
      formDataToSend.append('purchaseDate', formData.purchaseDate || new Date().toISOString().split('T')[0])
      formDataToSend.append('location', formData.location)
      formDataToSend.append('waterCycle', String(formData.waterCycle))
      formDataToSend.append('fertilizeCycle', String(formData.fertilizeCycle))
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo)
      }

      await addPlant(formDataToSend)
      await loadPlants()
      setShowAddModal(false)
      setFormData({
        name: '',
        species: '',
        purchaseDate: '',
        location: '客厅',
        waterCycle: 3,
        fertilizeCycle: 15,
        photo: null,
        photoPreview: ''
      })
    } catch (error) {
      console.error('添加植物失败:', error)
      alert('添加植物失败，请重试')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      species: '',
      purchaseDate: '',
      location: '客厅',
      waterCycle: 3,
      fertilizeCycle: 15,
      photo: null,
      photoPreview: ''
    })
  }

  const isHomePage = location.pathname === '/'

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span>🌿</span>
          <span>植物养护管家</span>
        </div>
        <div className="navbar-actions">
          <ReminderBell />
        </div>
      </nav>

      <Routes>
        <Route path="/" element={
          <div className="page-bg">
            <div className="page-content">
              <div className="page-header">
                <div>
                  <div className="page-title">我的植物</div>
                  <div className="page-subtitle">精心养护每一盆绿植，记录它们的成长</div>
                </div>
                <button className="primary-btn" onClick={() => setShowAddModal(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  添加植物
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '64px', color: '#757575' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
                  加载中...
                </div>
              ) : plants.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🪴</div>
                  <div className="empty-state-text">还没有添加植物，点击右上角"添加植物"开始养护吧</div>
                </div>
              ) : (
                <div className="plant-grid">
                  {plants.map((plant, index) => (
                    <PlantCard key={plant.id} plant={plant} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        } />
        <Route path="/plant/:id" element={<PlantDetail />} />
      </Routes>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm() }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">添加植物</div>
              <button className="modal-close" onClick={() => { setShowAddModal(false); resetForm() }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">植物照片</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
                {formData.photoPreview ? (
                  <div>
                    <img src={formData.photoPreview} alt="预览" className="upload-preview" />
                    <button 
                      className="secondary-btn" 
                      style={{ marginTop: '12px', width: '100%' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      更换照片
                    </button>
                  </div>
                ) : (
                  <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>📷</div>
                    <div style={{ color: '#757575' }}>点击上传植物照片</div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">植物名称 *</label>
                <input
                  className="form-input"
                  placeholder="给它起个名字吧"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">品种 *</label>
                <input
                  className="form-input"
                  placeholder="如：绿萝、多肉、吊兰等"
                  value={formData.species}
                  onChange={e => setFormData(prev => ({ ...prev, species: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">购买日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.purchaseDate}
                  onChange={e => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">摆放位置</label>
                <div className="location-tags">
                  {LOCATIONS.map(loc => (
                    <button
                      key={loc}
                      className={`location-tag ${formData.location === loc ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, location: loc }))}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">浇水周期（天）</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  className="form-input"
                  value={formData.waterCycle}
                  onChange={e => setFormData(prev => ({ ...prev, waterCycle: parseInt(e.target.value) || 3 }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">施肥周期（天）</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  className="form-input"
                  value={formData.fertilizeCycle}
                  onChange={e => setFormData(prev => ({ ...prev, fertilizeCycle: parseInt(e.target.value) || 15 }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => { setShowAddModal(false); resetForm() }}>取消</button>
              <button className="primary-btn" onClick={handleSubmit}>添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
