import React, { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { ORGANELLE_DATA } from '@/utils/organelleData'
import { X, ExternalLink } from 'lucide-react'

export default function InfoPanel() {
  const { selectedOrganelle, selectOrganelle, isCapturing } = useAppStore()
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedOrganelle) {
      setMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true)
        })
      })
    } else {
      setVisible(false)
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [selectedOrganelle])

  if (!mounted || isCapturing) return null

  const info = selectedOrganelle ? ORGANELLE_DATA[selectedOrganelle] : null
  if (!info) return null

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: '50%',
        right: visible ? '24px' : '-400px',
        transform: 'translateY(-50%)',
        width: '360px',
        maxWidth: 'calc(100vw - 48px)',
        background: 'rgba(255, 255, 255, 0.92)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        padding: '28px',
        transition: 'right 0.3s ease-out',
        zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}
    >
      <button
        onClick={() => selectOrganelle(null)}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '32px',
          height: '32px',
          border: 'none',
          background: 'rgba(0, 0, 0, 0.06)',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          ;(e.target as HTMLElement).style.background = 'rgba(0, 0, 0, 0.12)'
        }}
        onMouseLeave={(e) => {
          ;(e.target as HTMLElement).style.background = 'rgba(0, 0, 0, 0.06)'
        }}
      >
        <X size={18} />
      </button>

      <div style={{ fontSize: '36px', marginBottom: '12px' }}>{info.icon}</div>
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#1a1a2e',
          marginBottom: '4px',
          lineHeight: 1.3,
        }}
      >
        {info.nameZh}
      </h2>
      <p
        style={{
          fontSize: '13px',
          color: '#888',
          marginBottom: '16px',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {info.name}
      </p>
      <p
        style={{
          fontSize: '16px',
          lineHeight: 1.7,
          color: '#333',
          marginBottom: '20px',
        }}
      >
        {info.description}
      </p>
      <a
        href={info.detailUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 20px',
          background: '#2a2f52',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.background = '#3a3f62'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.background = '#2a2f52'
        }}
      >
        详情链接
        <ExternalLink size={14} />
      </a>
    </div>
  )
}
