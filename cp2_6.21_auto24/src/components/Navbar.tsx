import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRecipeStore } from '../store/useRecipeStore'
import LoginModal from './LoginModal'

const Navbar = () => {
  const { user, logout, setSearchKeyword, setFilters, fetchRecipes } = useRecipeStore()
  const [showLogin, setShowLogin] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => setAvailableTags(data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchKeyword(searchValue)
      setFilters({ q: searchValue })
      if (searchValue) {
        fetchRecipes()
        navigate('/')
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setShowMobileMenu(false)
  }

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#5d4037',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🍳</span>
          <span style={{ fontSize: '20px', fontWeight: 600, color: '#fff' }}>美味食谱</span>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flex: 1,
            maxWidth: '500px',
            margin: '0 40px',
          }}
          ref={searchRef}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
            }}
          >
            <input
              type="text"
              placeholder="搜索食材、菜系或食谱..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 16px 0 40px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '14px',
                transition: 'background-color 0.3s',
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.25)'
                setShowFilters(true)
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '16px',
              }}
            >
              🔍
            </span>

            {showFilters && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  padding: '20px',
                  color: '#3e2723',
                  zIndex: 100,
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                    按标签筛选
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setFilters({ tag })
                          fetchRecipes()
                          navigate('/')
                          setShowFilters(false)
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '16px',
                          backgroundColor: '#f5f0e1',
                          color: '#5d4037',
                          fontSize: '12px',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#d7ccc8'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f0e1'
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                    预估时长
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { value: 'fast', label: '<15分钟' },
                      { value: 'medium', label: '15-30分钟' },
                      { value: 'slow', label: '>30分钟' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => {
                          setFilters({ cook_time: item.value })
                          fetchRecipes()
                          navigate('/')
                          setShowFilters(false)
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '16px',
                          backgroundColor: '#f5f0e1',
                          color: '#5d4037',
                          fontSize: '12px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#d7ccc8'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f0e1'
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFilters({ q: '', tag: '', cook_time: '', author: '' })
                    setSearchValue('')
                    fetchRecipes()
                    setShowFilters(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#8d6e63',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                >
                  清除筛选
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
          className="desktop-nav"
        >
          <Link
            to="/create"
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              backgroundColor: '#ff7043',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f4511e'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ff7043'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            + 发布食谱
          </Link>

          {user ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
              }}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#ffab91',
                  color: '#5d4037',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                {getInitial(user.username)}
              </div>
              <span style={{ fontSize: '14px', color: '#fff' }}>{user.username}</span>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                backgroundColor: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.5)',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              登录
            </button>
          )}
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
          }}
        >
          ☰
        </button>
      </nav>

      {showMobileMenu && (
        <div
          className={`mobile-menu ${showMobileMenu ? 'active' : ''}`}
          style={{
            display: 'none',
            position: 'fixed',
            top: '60px',
            left: 0,
            right: 0,
            backgroundColor: '#5d4037',
            padding: '16px',
            zIndex: 999,
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <Link
            to="/create"
            onClick={() => setShowMobileMenu(false)}
            style={{
              padding: '12px',
              textAlign: 'center',
              backgroundColor: '#ff7043',
              color: '#fff',
              borderRadius: '8px',
            }}
          >
            + 发布食谱
          </Link>
          {user ? (
            <button
              onClick={handleLogout}
              style={{
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: '8px',
              }}
            >
              退出登录
            </button>
          ) : (
            <button
              onClick={() => {
                setShowLogin(true)
                setShowMobileMenu(false)
              }}
              style={{
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: '8px',
              }}
            >
              登录
            </button>
          )}
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-menu.active {
            display: flex !important;
          }
          nav > div:nth-child(2) {
            display: none !important;
          }
          nav {
            padding: 0 16px !important;
          }
        }
      `}</style>
    </>
  )
}

export default Navbar
