import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { resetCurrentPoem, setTheme } from '@/store/poemStore'
import { applyTheme } from '@/core/themeEngine'
import PoemEditor from '@/components/PoemEditor'
import PoemPreview from '@/components/PoemPreview'

const PoemEditorPage: React.FC = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(resetCurrentPoem())
    dispatch(setTheme('default'))
    applyTheme('default')
  }, [dispatch])

  return (
    <div className="layout">
      <div className="layout-left">
        <div style={navStyle}>
          <Link to="/" style={linkStyle}>
            ← 返回浏览
          </Link>
          <h1 style={logoStyle}>PoemCanvas</h1>
          <div style={{ width: 80 }} />
        </div>
        <PoemEditor />
      </div>
      <div className="layout-right">
        <PoemPreview />
      </div>
    </div>
  )
}

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 24px',
  borderBottom: '1px solid var(--border)',
  backgroundColor: 'var(--bg-secondary)',
}

const logoStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--accent)',
}

const linkStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  transition: 'color 0.2s ease',
}

export default PoemEditorPage
