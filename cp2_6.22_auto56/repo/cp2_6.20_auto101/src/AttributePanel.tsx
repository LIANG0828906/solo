import React, { useState } from 'react'
import { useAppStore } from './store'
import { Talent } from './types'

const TalentCard: React.FC<{
  talent: Talent
  isSelected: boolean
  isPlaying: boolean
  onToggle: () => void
}> = ({ talent, isSelected, isPlaying, onToggle }) => {
  return (
    <div
      onClick={() => !isPlaying && onToggle()}
      style={{
        padding: 12,
        backgroundColor: isSelected ? 'rgba(233, 69, 96, 0.2)' : 'rgba(15, 52, 96, 0.6)',
        borderRadius: 4,
        border: `1px solid ${isSelected ? '#e94560' : 'rgba(233, 69, 96, 0.3)'}`,
        cursor: isPlaying ? 'not-allowed' : 'pointer',
        opacity: isPlaying ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!isPlaying) {
          e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.3)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isPlaying) {
          e.currentTarget.style.backgroundColor = isSelected
            ? 'rgba(233, 69, 96, 0.2)'
            : 'rgba(15, 52, 96, 0.6)'
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 20 }}>{talent.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{talent.name}</span>
      </div>
      <p style={{ fontSize: 11, color: '#aaa', lineHeight: 1.4 }}>{talent.description}</p>
    </div>
  )
}

const AttributePanel: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const {
    talents,
    selectedTalents,
    playback: { isPlaying },
    toggleTalent,
  } = useAppStore()

  return (
    <>
      <button
        className="mobile-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#e94560',
          color: 'white',
          border: 'none',
          fontSize: 24,
          cursor: 'pointer',
          zIndex: 100,
          boxShadow: '0 4px 20px rgba(233, 69, 96, 0.5)',
        }}
      >
        ⚡
      </button>

      <div
        className={`attribute-panel ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: 200,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          border: '0.5px solid #e94560',
          padding: 16,
          color: '#1a1a2e',
          flexShrink: 0,
        }}
      >
        <div
          className="talent-tabs"
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 16,
            borderBottom: '1px solid rgba(26, 26, 46, 0.1)',
          }}
        >
          <div
            className="tab active"
            style={{
              padding: '8px 12px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              borderBottom: '3px solid #e94560',
              color: '#e94560',
            }}
          >
            <span>⚡</span>
            <span>天赋</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {talents.map((talent) => (
            <TalentCard
              key={talent.id}
              talent={talent}
              isSelected={selectedTalents.includes(talent.id)}
              isPlaying={isPlaying}
              onToggle={() => toggleTalent(talent.id)}
            />
          ))}
        </div>

        {selectedTalents.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(26, 26, 46, 0.1)' }}>
            <p style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>已激活天赋:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {selectedTalents.map((id) => {
                const t = talents.find((x) => x.id === id)
                return t ? (
                  <span
                    key={id}
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      backgroundColor: '#e94560',
                      color: 'white',
                      borderRadius: 10,
                    }}
                  >
                    {t.icon} {t.name}
                  </span>
                ) : null
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .attribute-panel {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-height: 50vh !important;
            transform: translateY(100%) !important;
            transition: transform 0.3s ease !important;
            z-index: 99 !important;
            border-radius: 16px 16px 0 0 !important;
            overflow-y: auto !important;
          }
          .attribute-panel.mobile-open {
            transform: translateY(0) !important;
          }
          .mobile-toggle {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </>
  )
}

export default AttributePanel
