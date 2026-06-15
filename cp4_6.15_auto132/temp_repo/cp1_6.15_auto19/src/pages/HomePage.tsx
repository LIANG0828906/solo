import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Pet, Host } from '../types'
import PetCard from '../components/PetCard'
import MatchingList from '../components/MatchingList'
import StarRating from '../components/StarRating'

interface Stats {
  totalHosts: number
  totalPets: number
  totalBookings: number
  avgRating: string
}

const CITIES = ['全部', '北京', '上海', '广州', '深圳', '杭州']
const PET_TYPES = [
  { value: 'all', label: '全部' },
  { value: 'dog', label: '🐶 狗狗' },
  { value: 'cat', label: '🐱 猫咪' },
  { value: 'other', label: '🐹 其他' }
]

export default function HomePage() {
  const navigate = useNavigate()
  const [pets, setPets] = useState<Pet[]>([])
  const [featuredHosts, setFeaturedHosts] = useState<Host[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('recommend')
  const [searchCity, setSearchCity] = useState('')
  const [searchPetType, setSearchPetType] = useState('all')
  const [searchMinPrice, setSearchMinPrice] = useState('')
  const [searchMaxPrice, setSearchMaxPrice] = useState('')

  useEffect(() => {
    const loadPets = async () => {
      try {
        const res = await fetch('/api/pets')
        const data: Pet[] = await res.json()
        setPets(data)
      } catch (error) {
        console.error('加载宠物数据失败:', error)
      }
    }
    loadPets()
  }, [])

  useEffect(() => {
    const loadFeaturedHosts = async () => {
      try {
        const res = await fetch('/api/hosts?sortBy=rating&limit=6')
        const data = await res.json()
        setFeaturedHosts(data.data || [])
      } catch (error) {
        console.error('加载特色寄养员失败:', error)
      }
    }
    loadFeaturedHosts()
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    }
    loadStats()
  }, [])

  useEffect(() => {
    if (featuredHosts.length <= 1) return
    const timer = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % Math.min(featuredHosts.length, 3))
    }, 5000)
    return () => clearInterval(timer)
  }, [featuredHosts.length])

  const handleSearch = () => {
    navigate('/matching')
  }

  const featuredSlideHosts = featuredHosts.slice(0, 3)

  return (
    <div>
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            为您的<span className="highlight">毛孩子</span>
            <br />找到最温馨的家
          </h1>
          <p className="hero-subtitle">
            连接爱心寄养家庭与宠物主人，让每一次出行都安心无忧 🐾
          </p>

          <div className="search-box">
            <div className="search-row">
              <div className="search-item">
                <label>📍 所在城市</label>
                <select
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                >
                  {CITIES.map(city => (
                    <option key={city} value={city === '全部' ? '' : city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="search-item">
                <label>🐾 宠物类型</label>
                <select
                  value={searchPetType}
                  onChange={(e) => setSearchPetType(e.target.value)}
                >
                  {PET_TYPES.map(pt => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>
              <div className="search-item">
                <label>💰 价格范围</label>
                <div className="price-range">
                  <input
                    type="number"
                    placeholder="最低"
                    value={searchMinPrice}
                    onChange={(e) => setSearchMinPrice(e.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="最高"
                    value={searchMaxPrice}
                    onChange={(e) => setSearchMaxPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="search-item" style={{ justifyContent: 'flex-end' }}>
                <label>&nbsp;</label>
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleSearch}
                  style={{ width: '100%' }}
                >
                  🔍 搜索寄养家庭
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{stats?.totalHosts || '--'}</div>
              <div className="stat-label">🏠 认证寄养家庭</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.totalPets || '--'}</div>
              <div className="stat-label">🐾 已服务宠物</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.totalBookings || '--'}</div>
              <div className="stat-label">✅ 成功预约</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.avgRating || '--'}</div>
              <div className="stat-label">⭐ 平均评分</div>
            </div>
          </div>

          {featuredSlideHosts.length > 0 && (
            <div className="featured-carousel">
              <div
                className="featured-track"
                style={{ transform: `translateX(-${featuredIndex * 100}%)` }}
              >
                {featuredSlideHosts.map((host, idx) => (
                  <div className="featured-slide" key={host.id}>
                    <div className="featured-content">
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: 'var(--color-green)',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '16px'
                      }}>
                        🏆 特色寄养员 #{idx + 1}
                      </div>
                      <h3>{host.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <StarRating rating={host.rating} />
                        <span style={{ color: 'var(--color-text-light)' }}>
                          📍 {host.city} · {host.reviewCount}条评价
                        </span>
                      </div>
                      <p>{host.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div>
                          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-green-dark)' }}>
                            ¥{host.price}
                          </span>
                          <span style={{ color: 'var(--color-text-light)' }}> /天</span>
                        </div>
                        <button
                          className="btn btn-primary btn-large"
                          onClick={() => navigate(`/host/${host.id}`)}
                        >
                          立即预约 →
                        </button>
                      </div>
                    </div>
                    <img
                      src={host.images[0]}
                      alt={host.name}
                      className="featured-host-image"
                    />
                  </div>
                ))}
              </div>
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
                zIndex: 10
              }}>
                {featuredSlideHosts.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setFeaturedIndex(idx)}
                    style={{
                      width: featuredIndex === idx ? '24px' : '10px',
                      height: '10px',
                      borderRadius: '5px',
                      background: featuredIndex === idx ? 'var(--color-green-dark)' : 'rgba(92, 74, 50, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: '0' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">我的宠物</h2>
              <p className="section-subtitle">选择要寄养的宠物宝贝</p>
            </div>
          </div>

          {pets.length === 0 ? (
            <div className="card-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div className="skeleton" style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
                  </div>
                  <div className="skeleton skeleton-line short" style={{ margin: '0 auto 8px' }} />
                  <div className="skeleton skeleton-line" style={{ marginBottom: '12px' }} />
                  <div className="skeleton skeleton-line medium" />
                </div>
              ))}
            </div>
          ) : (
            <div className="card-grid">
              {pets.map((pet, idx) => (
                <div key={pet.id} style={{ animationDelay: `${idx * 0.1}s` }}>
                  <PetCard
                    pet={pet}
                    onSelect={() => navigate('/matching')}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: '0' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">发现寄养家庭</h2>
              <p className="section-subtitle">精选优质寄养家庭，给毛孩子最好的照顾</p>
            </div>
            <button className="section-link" onClick={() => navigate('/matching')}>
              查看全部 →
            </button>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'recommend' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommend')}
            >
              ✨ 智能推荐
            </button>
            <button
              className={`tab ${activeTab === 'top' ? 'active' : ''}`}
              onClick={() => setActiveTab('top')}
            >
              ⭐ 评分最高
            </button>
            <button
              className={`tab ${activeTab === 'cheap' ? 'active' : ''}`}
              onClick={() => setActiveTab('cheap')}
            >
              💰 价格优惠
            </button>
          </div>

          <div className="tab-content">
            <div
              className="tab-panel"
              style={{
                transform: activeTab === 'recommend' ? 'translateX(0)' : activeTab === 'top' ? 'translateX(-100%)' : 'translateX(-200%)',
                opacity: 1
              }}
            >
              <MatchingList
                showFilters={false}
                filters={{
                  sortBy: activeTab === 'top' ? 'rating' : activeTab === 'cheap' ? 'price_asc' : 'rating'
                }}
                key={activeTab}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
