import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import type { InvitationTheme } from '@/types'

interface ThemeConfig {
  name: string
  gradient: string
  borderColor: string
  textColor: string
  accentColor: string
  description: string
}

const themes: Record<InvitationTheme, ThemeConfig> = {
  garden: {
    name: '花园清新',
    gradient: 'linear-gradient(180deg, #FADADD 0%, #C8E6C9 100%)',
    borderColor: 'rgba(139, 195, 74, 0.4)',
    textColor: '#4A5D4A',
    accentColor: '#E8A8B8',
    description: '粉绿渐变·花朵装饰',
  },
  classic: {
    name: '经典浪漫',
    gradient: 'linear-gradient(180deg, #F7E7CE 0%, #FFFFFF 100%)',
    borderColor: 'rgba(212, 175, 55, 0.6)',
    textColor: '#6B5B4E',
    accentColor: '#D4AF37',
    description: '金白搭配·金色花纹',
  },
  modern: {
    name: '简约现代',
    gradient: 'linear-gradient(180deg, #D4C9C0 0%, #FADADD 100%)',
    borderColor: 'rgba(155, 139, 133, 0.5)',
    textColor: '#5C504B',
    accentColor: '#9B8B85',
    description: '灰粉结合·几何线条',
  },
}

function GardenDecorations() {
  return (
    <>
      <svg style={{ position: 'absolute', top: 10, left: 15, width: 60, height: 60 }} viewBox="0 0 100 100">
        <g fill="#E8A8B8" opacity="0.7">
          <circle cx="50" cy="25" r="8" />
          <circle cx="30" cy="40" r="7" />
          <circle cx="70" cy="40" r="7" />
          <circle cx="38" cy="60" r="6" />
          <circle cx="62" cy="60" r="6" />
          <circle cx="50" cy="45" r="10" fill="#FFD54F" />
        </g>
        <path d="M50 75 Q45 90 40 95 M50 75 Q55 90 60 95" stroke="#81C784" strokeWidth="2" fill="none" />
        <ellipse cx="35" cy="88" rx="8" ry="4" fill="#81C784" transform="rotate(-20 35 88)" />
        <ellipse cx="65" cy="88" rx="8" ry="4" fill="#81C784" transform="rotate(20 65 88)" />
      </svg>
      <svg style={{ position: 'absolute', top: 20, right: 20, width: 50, height: 50 }} viewBox="0 0 100 100">
        <g fill="#CE93D8" opacity="0.6">
          <circle cx="50" cy="30" r="7" />
          <circle cx="32" cy="45" r="6" />
          <circle cx="68" cy="45" r="6" />
          <circle cx="40" cy="62" r="5" />
          <circle cx="60" cy="62" r="5" />
          <circle cx="50" cy="48" r="8" fill="#FFE082" />
        </g>
      </svg>
      <svg style={{ position: 'absolute', bottom: 15, left: 25, width: 55, height: 55 }} viewBox="0 0 100 100">
        <g fill="#81C784" opacity="0.6">
          <path d="M50 20 Q30 50 50 85 Q70 50 50 20" />
        </g>
        <g fill="#F48FB1" opacity="0.7">
          <circle cx="50" cy="45" r="6" />
          <circle cx="42" cy="55" r="5" />
          <circle cx="58" cy="55" r="5" />
          <circle cx="50" cy="62" r="5" />
          <circle cx="50" cy="55" r="7" fill="#FFD54F" />
        </g>
      </svg>
      <svg style={{ position: 'absolute', bottom: 30, right: 15, width: 65, height: 65 }} viewBox="0 0 100 100">
        <g fill="#F8BBD0" opacity="0.65">
          <circle cx="50" cy="30" r="10" />
          <circle cx="28" cy="48" r="9" />
          <circle cx="72" cy="48" r="9" />
          <circle cx="35" cy="72" r="8" />
          <circle cx="65" cy="72" r="8" />
          <circle cx="50" cy="52" r="12" fill="#FFF176" />
        </g>
      </svg>
      <svg style={{ position: 'absolute', top: '45%', left: 8, width: 35, height: 35 }} viewBox="0 0 100 100" opacity="0.5">
        <path d="M50 88 L50 50 M50 50 Q30 30 20 40 M50 50 Q70 30 80 40" stroke="#81C784" strokeWidth="3" fill="none" />
        <ellipse cx="22" cy="38" rx="10" ry="6" fill="#A5D6A7" transform="rotate(-30 22 38)" />
        <ellipse cx="78" cy="38" rx="10" ry="6" fill="#A5D6A7" transform="rotate(30 78 38)" />
      </svg>
      <svg style={{ position: 'absolute', top: '48%', right: 8, width: 35, height: 35 }} viewBox="0 0 100 100" opacity="0.5">
        <path d="M50 88 L50 50 M50 50 Q30 30 20 40 M50 50 Q70 30 80 40" stroke="#81C784" strokeWidth="3" fill="none" />
        <ellipse cx="22" cy="38" rx="10" ry="6" fill="#A5D6A7" transform="rotate(-30 22 38)" />
        <ellipse cx="78" cy="38" rx="10" ry="6" fill="#A5D6A7" transform="rotate(30 78 38)" />
      </svg>
    </>
  )
}

function ClassicDecorations() {
  return (
    <>
      <svg style={{ position: 'absolute', top: 12, left: 0, right: 0, width: '100%', height: 40 }} viewBox="0 0 360 40" preserveAspectRatio="none">
        <path d="M0 30 Q90 5 180 30 Q270 55 360 30" stroke="#D4AF37" strokeWidth="1.5" fill="none" opacity="0.7" />
        <path d="M0 33 Q90 8 180 33 Q270 58 360 33" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.5" />
        <g fill="#D4AF37" opacity="0.8">
          <circle cx="30" cy="28" r="3" />
          <circle cx="60" cy="22" r="2.5" />
          <circle cx="90" cy="18" r="3" />
          <circle cx="120" cy="20" r="2.5" />
          <circle cx="180" cy="30" r="4" />
          <circle cx="240" cy="20" r="2.5" />
          <circle cx="270" cy="18" r="3" />
          <circle cx="300" cy="22" r="2.5" />
          <circle cx="330" cy="28" r="3" />
        </g>
      </svg>
      <svg style={{ position: 'absolute', bottom: 12, left: 0, right: 0, width: '100%', height: 40 }} viewBox="0 0 360 40" preserveAspectRatio="none">
        <path d="M0 10 Q90 35 180 10 Q270 -15 360 10" stroke="#D4AF37" strokeWidth="1.5" fill="none" opacity="0.7" />
        <path d="M0 7 Q90 32 180 7 Q270 -18 360 7" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.5" />
        <g fill="#D4AF37" opacity="0.8">
          <circle cx="30" cy="12" r="3" />
          <circle cx="60" cy="18" r="2.5" />
          <circle cx="90" cy="22" r="3" />
          <circle cx="120" cy="20" r="2.5" />
          <circle cx="180" cy="10" r="4" />
          <circle cx="240" cy="20" r="2.5" />
          <circle cx="270" cy="22" r="3" />
          <circle cx="300" cy="18" r="2.5" />
          <circle cx="330" cy="12" r="3" />
        </g>
      </svg>
      <svg style={{ position: 'absolute', top: 60, left: 20, width: 45, height: 70 }} viewBox="0 0 50 80">
        <path d="M25 80 L25 50 M25 50 Q10 40 8 25 M25 50 Q40 40 42 25 M25 50 Q18 30 15 15 M25 50 Q32 30 35 15" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.75" />
        <g fill="#D4AF37" opacity="0.85">
          <circle cx="8" cy="25" r="4" />
          <circle cx="42" cy="25" r="4" />
          <circle cx="15" cy="15" r="3.5" />
          <circle cx="35" cy="15" r="3.5" />
          <circle cx="25" cy="10" r="4.5" />
        </g>
      </svg>
      <svg style={{ position: 'absolute', top: 60, right: 20, width: 45, height: 70 }} viewBox="0 0 50 80">
        <path d="M25 80 L25 50 M25 50 Q10 40 8 25 M25 50 Q40 40 42 25 M25 50 Q18 30 15 15 M25 50 Q32 30 35 15" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.75" />
        <g fill="#D4AF37" opacity="0.85">
          <circle cx="8" cy="25" r="4" />
          <circle cx="42" cy="25" r="4" />
          <circle cx="15" cy="15" r="3.5" />
          <circle cx="35" cy="15" r="3.5" />
          <circle cx="25" cy="10" r="4.5" />
        </g>
      </svg>
      <svg style={{ position: 'absolute', bottom: 60, left: 28, width: 40, height: 40 }} viewBox="0 0 50 50" opacity="0.7">
        <polygon points="25,2 30,18 47,20 34,32 38,48 25,40 12,48 16,32 3,20 20,18" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
        <polygon points="25,10 28,20 38,21 30,28 33,38 25,33 17,38 20,28 12,21 22,20" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
      </svg>
      <svg style={{ position: 'absolute', bottom: 60, right: 28, width: 40, height: 40 }} viewBox="0 0 50 50" opacity="0.7">
        <polygon points="25,2 30,18 47,20 34,32 38,48 25,40 12,48 16,32 3,20 20,18" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
        <polygon points="25,10 28,20 38,21 30,28 33,38 25,33 17,38 20,28 12,21 22,20" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
      </svg>
      <svg style={{ position: 'absolute', left: 22, top: 145, bottom: 145, width: 3 }} viewBox="0 0 3 200" preserveAspectRatio="none">
        <line x1="1.5" y1="0" x2="1.5" y2="200" stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="6,4" opacity="0.5" />
      </svg>
      <svg style={{ position: 'absolute', right: 22, top: 145, bottom: 145, width: 3 }} viewBox="0 0 3 200" preserveAspectRatio="none">
        <line x1="1.5" y1="0" x2="1.5" y2="200" stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="6,4" opacity="0.5" />
      </svg>
    </>
  )
}

function ModernDecorations() {
  return (
    <>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: 140, height: 140 }} viewBox="0 0 140 140">
        <path d="M0 0 L140 0 L0 140 Z" fill="rgba(155, 139, 133, 0.15)" />
        <circle cx="20" cy="20" r="1.5" fill="#9B8B85" opacity="0.6" />
        <circle cx="50" cy="12" r="1.5" fill="#9B8B85" opacity="0.6" />
        <circle cx="12" cy="50" r="1.5" fill="#9B8B85" opacity="0.6" />
      </svg>
      <svg style={{ position: 'absolute', top: 0, right: 0, width: 140, height: 140 }} viewBox="0 0 140 140">
        <path d="M140 0 L0 0 L140 140 Z" fill="rgba(232, 168, 184, 0.12)" />
        <circle cx="120" cy="20" r="1.5" fill="#9B8B85" opacity="0.6" />
        <circle cx="90" cy="12" r="1.5" fill="#9B8B85" opacity="0.6" />
        <circle cx="128" cy="50" r="1.5" fill="#9B8B85" opacity="0.6" />
      </svg>
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: 140, height: 140 }} viewBox="0 0 140 140">
        <path d="M0 140 L0 0 L140 140 Z" fill="rgba(232, 168, 184, 0.12)" />
        <circle cx="20" cy="120" r="1.5" fill="#9B8B85" opacity="0.6" />
        <circle cx="50" cy="128" r="1.5" fill="#9B8B85" opacity="0.6" />
        <circle cx="12" cy="90" r="1.5" fill="#9B8B85" opacity="0.6" />
      </svg>
      <svg style={{ position: 'absolute', bottom: 0, right: 0, width: 140, height: 140 }} viewBox="0 0 140 140">
        <path d="M140 140 L0 140 L140 0 Z" fill="rgba(155, 139, 133, 0.15)" />
        <circle cx="120" cy="120" r="1.5" fill="#9B8B85" opacity="0.6" />
        <circle cx="90" cy="128" r="1.5" fill="#9B8B85" opacity="0.6" />
        <circle cx="128" cy="90" r="1.5" fill="#9B8B85" opacity="0.6" />
      </svg>
      <svg style={{ position: 'absolute', top: 65, left: '50%', transform: 'translateX(-50%)', width: 55, height: 28 }} viewBox="0 0 60 30">
        <line x1="0" y1="15" x2="22" y2="15" stroke="#9B8B85" strokeWidth="1" opacity="0.5" />
        <line x1="38" y1="15" x2="60" y2="15" stroke="#9B8B85" strokeWidth="1" opacity="0.5" />
        <polygon points="30,3 36,15 30,27 24,15" fill="none" stroke="#9B8B85" strokeWidth="1.2" opacity="0.7" />
      </svg>
      <svg style={{ position: 'absolute', bottom: 65, left: '50%', transform: 'translateX(-50%)', width: 55, height: 28 }} viewBox="0 0 60 30">
        <line x1="0" y1="15" x2="22" y2="15" stroke="#9B8B85" strokeWidth="1" opacity="0.5" />
        <line x1="38" y1="15" x2="60" y2="15" stroke="#9B8B85" strokeWidth="1" opacity="0.5" />
        <polygon points="30,3 36,15 30,27 24,15" fill="none" stroke="#9B8B85" strokeWidth="1.2" opacity="0.7" />
      </svg>
      <svg style={{ position: 'absolute', top: '48%', left: 32, width: 22, height: 22 }} viewBox="0 0 30 30" opacity="0.5">
        <rect x="3" y="3" width="24" height="24" fill="none" stroke="#9B8B85" strokeWidth="1.2" transform="rotate(45 15 15)" />
      </svg>
      <svg style={{ position: 'absolute', top: '48%', right: 32, width: 22, height: 22 }} viewBox="0 0 30 30" opacity="0.5">
        <rect x="3" y="3" width="24" height="24" fill="none" stroke="#9B8B85" strokeWidth="1.2" transform="rotate(45 15 15)" />
      </svg>
      <svg style={{ position: 'absolute', top: 100, left: 55, width: 18, height: 18 }} viewBox="0 0 20 20" opacity="0.45">
        <circle cx="10" cy="10" r="8" fill="none" stroke="#E8A8B8" strokeWidth="1" />
        <circle cx="10" cy="10" r="3" fill="#E8A8B8" />
      </svg>
      <svg style={{ position: 'absolute', top: 100, right: 55, width: 18, height: 18 }} viewBox="0 0 20 20" opacity="0.45">
        <circle cx="10" cy="10" r="8" fill="none" stroke="#E8A8B8" strokeWidth="1" />
        <circle cx="10" cy="10" r="3" fill="#E8A8B8" />
      </svg>
    </>
  )
}

function InvitationPreview({
  theme,
  groomName,
  brideName,
  weddingDate,
  venue,
  message,
}: {
  theme: InvitationTheme
  groomName: string
  brideName: string
  weddingDate: string
  venue: string
  message: string
}) {
  const config = themes[theme]

  const renderMessage = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, idx) => {
      const parts: React.ReactNode[] = []
      let remaining = line
      let key = 0
      const processFormatting = (str: string): React.ReactNode[] => {
        const nodes: React.ReactNode[] = []
        let buffer = ''
        let i = 0
        while (i < str.length) {
          if (str.substring(i, i + 2) === '**' && str.substring(i + 2).includes('**')) {
            if (buffer) {
              nodes.push(<span key={`n-${key++}`}>{buffer}</span>)
              buffer = ''
            }
            const endIdx = str.indexOf('**', i + 2)
            const boldText = str.substring(i + 2, endIdx)
            nodes.push(<strong key={`b-${key++}`}>{boldText}</strong>)
            i = endIdx + 2
          } else if (str[i] === '*' && i + 1 < str.length && str[i + 1] !== '*') {
            const nextStar = str.indexOf('*', i + 1)
            if (nextStar !== -1 && nextStar > i + 1) {
              if (buffer) {
                nodes.push(<span key={`n-${key++}`}>{buffer}</span>)
                buffer = ''
              }
              const italicText = str.substring(i + 1, nextStar)
              nodes.push(<em key={`i-${key++}`}>{italicText}</em>)
              i = nextStar + 1
            } else {
              buffer += str[i]
              i++
            }
          } else {
            buffer += str[i]
            i++
          }
        }
        if (buffer) nodes.push(<span key={`n-${key++}`}>{buffer}</span>)
        return nodes
      }
      return (
        <div key={idx} style={{ marginBottom: idx < lines.length - 1 ? 6 : 0 }}>
          {processFormatting(remaining) || '\u00A0'}
        </div>
      )
    })
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '选择日期'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
    } catch {
      return dateStr
    }
  }

  const formatTime = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ''
      const h = d.getHours().toString().padStart(2, '0')
      const m = d.getMinutes().toString().padStart(2, '0')
      return `${h}:${m}`
    } catch {
      return ''
    }
  }

  return (
    <div
      style={{
        width: 360,
        height: 520,
        borderRadius: 20,
        background: config.gradient,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `
          0 25px 50px -12px rgba(107, 91, 85, 0.25),
          0 12px 24px -8px rgba(107, 91, 85, 0.15),
          0 4px 12px rgba(107, 91, 85, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.6)
        `,
        border: theme === 'classic' ? `2px solid ${config.borderColor}` : '1px solid rgba(255,255,255,0.4)',
      }}
    >
      {theme === 'garden' && <GardenDecorations />}
      {theme === 'classic' && <ClassicDecorations />}
      {theme === 'modern' && <ModernDecorations />}

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: 36,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 6,
            color: config.textColor,
            opacity: 0.7,
            marginBottom: 18,
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          WEDDING INVITATION
        </div>

        <div
          style={{
            fontSize: 13,
            color: config.textColor,
            opacity: 0.85,
            marginBottom: 16,
            letterSpacing: 1,
          }}
        >
          诚挚邀请您参加
        </div>

        <div
          style={{
            fontFamily: '"Brush Script MT", "Segoe Script", "Snell Roundhand", cursive',
            fontSize: 46,
            fontWeight: 600,
            color: config.textColor,
            lineHeight: 1.1,
            marginBottom: 4,
            textShadow: '0 2px 4px rgba(0,0,0,0.06)',
          }}
        >
          {groomName || '新郎'}
        </div>

        <div
          style={{
            fontSize: 28,
            color: config.accentColor,
            margin: '4px 0',
            fontWeight: 300,
            fontFamily: 'Georgia, serif',
          }}
        >
          &amp;
        </div>

        <div
          style={{
            fontFamily: '"Brush Script MT", "Segoe Script", "Snell Roundhand", cursive',
            fontSize: 46,
            fontWeight: 600,
            color: config.textColor,
            lineHeight: 1.1,
            marginBottom: 20,
            textShadow: '0 2px 4px rgba(0,0,0,0.06)',
          }}
        >
          {brideName || '新娘'}
        </div>

        <div
          style={{
            width: 60,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${config.accentColor}, transparent)`,
            marginBottom: 20,
          }}
        />

        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: config.textColor,
            marginBottom: 4,
            letterSpacing: 0.5,
          }}
        >
          {formatDate(weddingDate)}
        </div>

        {formatTime(weddingDate) && (
          <div
            style={{
              fontSize: 14,
              color: config.textColor,
              opacity: 0.85,
              marginBottom: 16,
              letterSpacing: 2,
            }}
          >
            {formatTime(weddingDate)} 举行
          </div>
        )}

        {!formatTime(weddingDate) && <div style={{ marginBottom: 16 }} />}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: config.textColor,
            opacity: 0.9,
            marginBottom: 20,
            maxWidth: '100%',
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontSize: 15 }}>📍</span>
          <span style={{ flex: 1 }}>{venue || '添加婚礼地点'}</span>
        </div>

        <div
          style={{
            width: '100%',
            fontSize: 13,
            lineHeight: 1.7,
            color: config.textColor,
            opacity: 0.9,
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.35)',
            borderRadius: 12,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxHeight: 130,
            overflow: 'hidden',
          }}
        >
          {message ? renderMessage(message) : (
            <span style={{ opacity: 0.5, fontStyle: 'italic' }}>
              写下您想对宾客说的话...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ThemeThumbnail({ theme, selected, onClick }: {
  theme: InvitationTheme
  selected: boolean
  onClick: () => void
}) {
  const config = themes[theme]

  return (
    <div
      onClick={onClick}
      style={{
        width: 100,
        height: 140,
        borderRadius: 12,
        background: config.gradient,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        border: selected ? '3px solid #D4AF37' : '2px solid rgba(255,255,255,0.6)',
        transform: selected ? 'scale(1.03)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: selected
          ? '0 8px 24px rgba(212, 175, 55, 0.35), 0 4px 12px rgba(0,0,0,0.08)'
          : '0 4px 12px rgba(0,0,0,0.08)',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
      }}>
        <div style={{
          fontFamily: '"Brush Script MT", cursive',
          fontSize: 15,
          color: config.textColor,
          fontWeight: 600,
          opacity: 0.9,
        }}>
          G &amp; B
        </div>
        <div style={{
          width: 22,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${config.accentColor}, transparent)`,
          margin: '4px 0 6px',
        }} />
        <div style={{
          fontSize: 8,
          color: config.textColor,
          opacity: 0.7,
          letterSpacing: 1,
          textAlign: 'center',
          lineHeight: 1.4,
        }}>
          {config.name}
        </div>
      </div>

      {selected && (
        <div style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#D4AF37',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          boxShadow: '0 2px 6px rgba(212, 175, 55, 0.5)',
        }}>
          ✓
        </div>
      )}
    </div>
  )
}

interface ToastState {
  id: number
  message: string
  type: 'success' | 'info' | 'error'
}

export default function Invitation() {
  const { wedding, invitation, updateInvitation, updateWedding } = useApp()

  const [theme, setTheme] = useState<InvitationTheme>('garden')
  const [groomName, setGroomName] = useState('')
  const [brideName, setBrideName] = useState('')
  const [weddingDate, setWeddingDate] = useState('')
  const [venue, setVenue] = useState('')
  const [message, setMessage] = useState('')
  const [textAreaExpanded, setTextAreaExpanded] = useState(false)
  const [showDownloadOverlay, setShowDownloadOverlay] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [toasts, setToasts] = useState<ToastState[]>([])
  const [messageStyle, setMessageStyle] = useState({ bold: false, italic: false, underline: false })

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const toastIdRef = useRef(0)

  useEffect(() => {
    if (invitation