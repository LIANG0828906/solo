import React, { useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProjectStore } from '../../store/projectStore'

export const useScrollFadeIn = () => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    const children = el.querySelectorAll('.scroll-fade-in')
    children.forEach((child) => observer.observe(child))
    if (el.classList.contains('scroll-fade-in')) {
      observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  return ref
}

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarRef = useRef<HTMLElement>(null)

  const handleNavClick = useCallback(
    (path: string) => {
      navigate(path)
      onClose()
    },
    [navigate, onClose]
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        const hamburger = document.querySelector('.hamburger-btn')
        if (hamburger && hamburger.contains(e.target as Node)) return
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  return (
    <>
      <div
        className={`mobile-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      <nav ref={sidebarRef} className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>SoundFlow</h1>
          <span>Studio</span>
        </div>
        <div className="sidebar-nav">
          <div
            className={`sidebar-nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => handleNavClick('/')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            项目列表
          </div>
          <div
            className={`sidebar-nav-item ${location.pathname.startsWith('/project/') ? 'active' : ''}`}
            onClick={() => {
              const selectedId = useProjectStore.getState().selectedProjectId
              if (selectedId) handleNavClick(`/project/${selectedId}`)
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            当前项目
          </div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">陈</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">陈默</div>
            <div className="sidebar-user-role">制作人</div>
          </div>
        </div>
      </nav>
    </>
  )
}
