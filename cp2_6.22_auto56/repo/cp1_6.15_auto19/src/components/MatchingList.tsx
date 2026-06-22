import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Host, HostListResponse, SearchFilters } from '../types'
import StarRating from './StarRating'

interface MatchingListProps {
  filters?: Partial<SearchFilters>
  showFilters?: boolean
}

const petTypeLabels: Record<string, string> = {
  dog: '🐶 狗狗',
  cat: '🐱 猫咪',
  other: '🐹 其他'
}

const CITIES = ['全部', '北京', '上海', '广州', '深圳', '杭州']
const PET_TYPES = [
  { value: 'all', label: '全部宠物' },
  { value: 'dog', label: '🐶 狗狗' },
  { value: 'cat', label: '🐱 猫咪' },
  { value: 'other', label: '🐹 其他' }
]
const SORT_OPTIONS = [
  { value: 'rating', label: '评分最高' },
  { value: 'reviews', label: '评价最多' },
  { value: 'price_asc', label: '价格从低到高' },
  { value: 'price_desc', label: '价格从高到低' }
]

export default function MatchingList({ filters: externalFilters, showFilters = true }: MatchingListProps) {
  const navigate = useNavigate()
  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [animationKey, setAnimationKey] = useState(0)

  const [localFilters, setLocalFilters] = useState<SearchFilters>({
    city: externalFilters?.city || '',
    petType: externalFilters?.petType || 'all',
    minPrice: externalFilters?.minPrice || '',
    maxPrice: externalFilters?.maxPrice || '',
    sortBy: externalFilters?.sortBy || 'rating'
  })

  const fetchHosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (localFilters.city && localFilters.city !== '全部') {
        params.append('city', localFilters.city)
      }
      if (localFilters.petType) {
        params.append('petType', localFilters.petType)
      }
      if (localFilters.minPrice) {
        params.append('minPrice', localFilters.minPrice)
      }
      if (localFilters.maxPrice) {
        params.append('maxPrice', localFilters.maxPrice)
      }
      if (localFilters.sortBy) {
        params.append('sortBy', localFilters.sortBy)
      }
      params.append('page', String(page))
      params.append('limit', '9')

      const res = await fetch(`/api/hosts?${params}`)
      const data: HostListResponse = await res.json()
      setHosts(data.data)
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setAnimationKey(prev => prev + 1)
    } catch (error) {
      console.error('获取寄养家庭失败:', error)
    } finally {
      setLoading(false)
    }
  }, [localFilters, page])

  useEffect(() => {
    fetchHosts()
  }, [fetchHosts])

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  return (
    <div>
      {showFilters && (
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">城市：</span>
            <select
              className="filter-select"
              value={localFilters.city || '全部'}
              onChange={(e) => handleFilterChange('city', e.target.value === '全部' ? '' : e.target.value)}
            >
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <span className="filter-label" style={{ marginLeft: '12px' }}>宠物类型：</span>
            <select
              className="filter-select"
              value={localFilters.petType}
              onChange={(e) => handleFilterChange('petType', e.target.value)}
            >
              {PET_TYPES.map(pt => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>

            <span className="filter-label" style={{ marginLeft: '12px' }}>价格：</span>
            <div className="price-range" style={{ gap: '6px' }}>
              <input
                type="number"
                placeholder="最低"
                className="filter-select"
                style={{ width: '80px' }}
                value={localFilters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="最高"
                className="filter-select"
                style={{ width: '80px' }}
                value={localFilters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>

          <div className="sort-tabs">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`sort-tab ${localFilters.sortBy === opt.value ? 'active' : ''}`}
                onClick={() => handleFilterChange('sortBy', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && total > 0 && (
        <p style={{ color: 'var(--color-text-light)', marginBottom: '16px', fontSize: '14px' }}>
          共找到 <strong style={{ color: 'var(--color-green-dark)' }}>{total}</strong> 个寄养家庭
        </p>
      )}

      {loading ? (
        <div className="card-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-image" />
              <div className="skeleton-body">
                <div className="skeleton skeleton-line short" />
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line medium" />
                <div className="skeleton skeleton-line" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {hosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-text">没有找到符合条件的寄养家庭</div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setLocalFilters({
                    city: '',
                    petType: 'all',
                    minPrice: '',
                    maxPrice: '',
                    sortBy: 'rating'
                  })
                  setPage(1)
                }}
              >
                清除筛选条件
              </button>
            </div>
          ) : (
            <div className="card-grid" key={animationKey}>
              {hosts.map((host, index) => (
                <div
                  key={host.id}
                  className="card"
                  style={{ animationDelay: `${index * 0.08}s` }}
                  onClick={() => navigate(`/host/${host.id}`)}
                >
                  <img
                    src={host.images[0]}
                    alt={host.name}
                    className="card-image"
                  />
                  <div className="card-body">
                    <div className="card-header">
                      <div>
                        <div className="card-title">{host.name}</div>
                        <div className="card-location">
                          📍 {host.city}
                        </div>
                      </div>
                      <img
                        src={host.avatar}
                        alt={host.name}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '3px solid var(--color-cream)'
                        }}
                      />
                    </div>

                    <StarRating rating={host.rating} />
                    <span style={{ fontSize: '13px', color: 'var(--color-text-light)', marginLeft: '8px' }}>
                      ({host.reviewCount}条评价)
                    </span>

                    <div className="pet-tags" style={{ marginTop: '12px' }}>
                      {host.petTypes.map(pt => (
                        <span key={pt} className={`pet-tag ${pt}`}>
                          {petTypeLabels[pt]}
                        </span>
                      ))}
                    </div>

                    <p className="card-description" style={{ marginTop: '12px' }}>
                      {host.description}
                    </p>

                    <div className="card-footer">
                      <div>
                        <span className="price">¥{host.price}</span>
                        <span className="price-unit"> /天</span>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/host/${host.id}`)
                        }}
                      >
                        查看详情 →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`page-btn ${page === p ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
