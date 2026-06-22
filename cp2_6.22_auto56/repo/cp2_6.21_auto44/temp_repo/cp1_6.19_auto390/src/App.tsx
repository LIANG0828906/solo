import { useEffect, useRef } from 'react'
import { ManaBar, SummonPanel, FormationArea, BattleField, BattleHUD, StatsPanel } from './UIComponents'
import { startBattle, updateBattleDimensions } from './BattleEngine'
import { initManaRegen } from './CallManager'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const stopBattle = startBattle(rect.width, rect.height)
    const stopManaRegen = initManaRegen()

    const handleResize = () => {
      const r = container.getBoundingClientRect()
      updateBattleDimensions(r.width, r.height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      stopBattle()
      stopManaRegen()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        background: 'radial-gradient(ellipse at 30% 30%, #1a1a2e 0%, #16213e 60%, #0d0d1a 100%)',
        overflow: 'hidden',
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <BattleField />
        <BattleHUD />

        <div
          style={{
            background: 'rgba(255,255,255,0.07)',
            borderTop: '1px solid #4a4a6a',
            borderRadius: '16px 16px 0 0',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 0',
              borderBottom: '1px solid rgba(74,74,106,0.3)',
            }}
          >
            <ManaBar />
            <SummonPanel />
          </div>
          <FormationArea />
        </div>
      </div>

      <StatsPanel />
    </div>
  )
}
