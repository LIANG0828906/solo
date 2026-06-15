import React, { useState, useEffect, useRef, useCallback } from 'react'
import ItemCard from '../components/ItemCard'
import { itemsAPI, Item } from '../api'
import { CATEGORIES } from '../utils'
import './HomePage.css'

const HomePage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [fadeKey, setFadeKey] = useState(0)
  const loaderRef = useRef<HTMLDivElement>(null)
  const initialLoadRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword)
    }, 300)
    return () => clearTimeout(timer)
  }, [keyword])

  const fetchItems = useCallback(async (reset: boolean = false) => {
    setLoading(true)
    try {
      const currentPage = reset ? 1 : page
      const result = await itemsAPI.getItems({
        keyword: debouncedKeyword,
        category: activeCategory,
        page: currentPage,
        limit: 50,
      })
      
      if (reset) {
        setItems(result.items)
        setPage(2)
      } else {
        setItems((prev) => [...prev, ...result.items])
        setPage((prev) => prev + 1)
      }
      
      setTotal(result.total)
      setHasMore(reset ? result.items.length < result.total : items.length + result.items.length < result.total)
      
      if (reset) {
        setFadeKey((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, activeCategory, page, items.length])

  useEffect(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    initialLoadRef.current = false
  }, [debouncedKeyword, activeCategory])

  useEffect(() => {
    if (!initialLoadRef.current || items.length > 0) {
      fetchItems(items.length === 0)
      initialLoadRef.current = true
    }
  }, [debouncedKeyword, activeCategory])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && items.length > 0) {
          fetchItems(false)
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, fetchItems, items.length])

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
  }

  return (
    <div className="home-page">
      <div className="container">
        <div className="hero-section">
          <h1 className="hero-title">让闲置物品重获新生</h1>
          <p className="hero-subtitle">交换你不需要的，发现你想要的</p>
        </div>

        <div className="search-container">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="搜索物品名称或描述..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {keyword && (
              <button
                className="search-clear"
                onClick={() => setKeyword('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="category-filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`category-btn ${activeCategory === cat.value ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading && items.length === 0 ? (
          <div className="loading-state">
            <div className="spinner spinner-primary" />
            <p>加载中...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state fade-in">
            <div className="empty-icon">📦</div>
            <h3>未找到相关物品</h3>
            <p>试试其他关键词或分类吧</p>
          </div>
        ) : (
          <>
            <div className="items-grid" key={fadeKey}>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="item-card-wrapper slide-up"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <ItemCard item={item} />
                </div>
              ))}
            </div>

            {hasMore && (
              <div ref={loaderRef} className="load-more">
                {loading && <div className="spinner spinner-primary" />}
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <div className="no-more">— 已经到底啦 —</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default HomePage
