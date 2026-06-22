import { useState } from 'react'
import type { PlanetData } from './StarSystem'

interface ControlsProps {
  planets: PlanetData[]
  selectedPlanetId: number | null
  isOnSurface: boolean
  onSelectPlanet: (id: number) => void
  onJump: () => void
  onReset: () => void
}

export default function Controls({
  planets,
  selectedPlanetId,
  isOnSurface,
  onSelectPlanet,
  onJump,
  onReset
}: ControlsProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        bottom: '20px',
        width: '280px',
        backgroundColor: '#1E293B',
        borderRadius: '12px',
        opacity: isHovered ? 1 : 0.9,
        transition: 'opacity 0.3s ease',
        padding: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        zIndex: 100
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          color: '#F1F5F9',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="2" />
          <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
        </svg>
        恒星系导航
      </div>

      <div
        style={{
          maxHeight: '240px',
          overflowY: 'auto',
          marginBottom: '16px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 #1E293B'
        }}
      >
        <style>{`
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #1E293B;
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb {
            background: #475569;
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #64748B;
          }
        `}</style>
        {planets.map((planet) => (
          <div
            key={planet.id}
            onClick={() => onSelectPlanet(planet.id)}
            style={{
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              backgroundColor:
                selectedPlanetId === planet.id ? '#334155' : 'transparent',
              marginBottom: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                selectedPlanetId === planet.id ? '#334155' : '#334155'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                selectedPlanetId === planet.id ? '#334155' : 'transparent'
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: planet.color,
                flexShrink: 0,
                boxShadow: `0 0 8px ${planet.color}40`
              }}
            />
            <span
              style={{
                color: '#E2E8F0',
                fontSize: '14px',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {planet.name}
            </span>
            {selectedPlanetId === planet.id && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onJump}
          disabled={selectedPlanetId === null || isOnSurface}
          style={{
            flex: 1,
            height: '36px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor:
              selectedPlanetId === null || isOnSurface
                ? 'not-allowed'
                : 'pointer',
            opacity: selectedPlanetId === null || isOnSurface ? 0.5 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            if (selectedPlanetId !== null && !isOnSurface) {
              e.currentTarget.style.backgroundColor = '#2563EB'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3B82F6'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          {isOnSurface ? '已在表面' : '跳跃前往'}
        </button>

        <button
          onClick={onReset}
          style={{
            flex: 1,
            height: '36px',
            backgroundColor: '#475569',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#64748B'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#475569'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          {isOnSurface ? '返回全景' : '重置视角'}
        </button>
      </div>

      {isOnSurface && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#334155',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#94A3B8',
            textAlign: 'center'
          }}
        >
          按 <span style={{ color: '#F1F5F9', fontWeight: 600 }}>ESC</span> 键快速返回全景
        </div>
      )}
    </div>
  )
}
