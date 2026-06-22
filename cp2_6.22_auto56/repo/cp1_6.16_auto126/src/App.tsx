import React, { useState } from 'react'
import LetterEditor from '@/components/LetterEditor'
import HandwritingAnimator from '@/components/HandwritingAnimator'
import ControlPanel from '@/components/ControlPanel'

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  return (
    <div style={{
      minHeight: '100vh',
      background: '#E6DCC8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <header style={{
        width: '100%',
        height: 120,
        background: 'repeating-linear-gradient(90deg, #C9A96E 0px, #C9A96E 1px, transparent 1px, transparent 8px), repeating-linear-gradient(0deg, #B8975A 0px, #B8975A 1px, transparent 1px, transparent 8px), linear-gradient(180deg, #D4B87A 0%, #C9A96E 40%, #B8975A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 10,
      }}>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 36,
          color: '#4A3728',
          fontWeight: 700,
          letterSpacing: 6,
          textShadow: '1px 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)',
          margin: 0,
        }}>
          时光邮局
        </h1>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: 13,
          color: '#6B5B3A',
          letterSpacing: 3,
          marginTop: 6,
          opacity: 0.8,
        }}>
          手写信笺 · 动画生成器
        </p>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, transparent, #A88B5A, #C9A96E, #A88B5A, transparent)',
        }} />
      </header>

      <div style={{
        display: 'flex',
        gap: 8,
        marginTop: 20,
        padding: '4px',
        background: 'rgba(255,255,255,0.4)',
        borderRadius: 10,
        backdropFilter: 'blur(4px)',
      }}>
        <button
          onClick={() => setActiveTab('edit')}
          style={{
            padding: '8px 24px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'edit' ? 'linear-gradient(135deg, #C9A96E, #A88B5A)' : 'transparent',
            color: activeTab === 'edit' ? '#FFF' : '#4A3728',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeTab === 'edit' ? 600 : 400,
            transition: 'all 0.2s',
          }}
        >
          ✎ 编辑信笺
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          style={{
            padding: '8px 24px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'preview' ? 'linear-gradient(135deg, #C9A96E, #A88B5A)' : 'transparent',
            color: activeTab === 'preview' ? '#FFF' : '#4A3728',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeTab === 'preview' ? 600 : 400,
            transition: 'all 0.2s',
          }}
        >
          ▶ 动画预览
        </button>
      </div>

      <main style={{
        display: 'flex',
        gap: 24,
        padding: '24px',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flex: 1,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: activeTab === 'edit' ? 'block' : 'none' }}>
          <LetterEditor />
        </div>
        <div style={{ display: activeTab === 'preview' ? 'block' : 'none' }}>
          <HandwritingAnimator />
        </div>
        <ControlPanel />
      </main>

      <footer style={{
        width: '100%',
        padding: '16px',
        textAlign: 'center',
        fontSize: 12,
        color: '#8C7B6E',
        fontFamily: 'Georgia, serif',
        letterSpacing: 1,
      }}>
        © 时光邮局 · 见字如面 · 纸短情长
      </footer>
    </div>
  )
}

export default App
