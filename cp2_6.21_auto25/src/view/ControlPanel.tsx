import { useCallback } from 'react'
import { useMoleculeStore } from '@/store/moleculeStore'
import { MOLECULE_PRESETS, getMoleculePreset } from '@/logic/MoleculeData'
import type { EnergyMode } from '@/store/moleculeStore'

const MOLECULE_ICONS: Record<string, string> = {
  methane: '🔬',
  benzene: '⬡',
  caffeine: '☕',
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        color: '#00bfff',
        marginBottom: '10px',
        fontWeight: 500,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function MoleculeSelector() {
  const { currentMoleculeId, setCurrentMolecule, setEnergyMode } = useMoleculeStore()

  const handleSelect = useCallback((id: string) => {
    setCurrentMolecule(id)
    setEnergyMode('none')
  }, [setCurrentMolecule, setEnergyMode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {MOLECULE_PRESETS.map(id => {
        const preset = getMoleculePreset(id)
        if (!preset) return null
        const isActive = currentMoleculeId === id
        return (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              border: isActive ? '1px solid #00bfff' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              background: isActive ? 'rgba(0,191,255,0.1)' : 'rgba(255,255,255,0.03)',
              color: isActive ? '#00bfff' : '#e0e0e0',
              cursor: 'pointer',
              transition: 'all 0.3s linear',
              fontSize: '13px',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.border = '0.5px solid #00bfff'
                e.currentTarget.style.background = 'rgba(0,191,255,0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              }
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <span style={{ fontSize: '18px' }}>{MOLECULE_ICONS[id]}</span>
            <div>
              <div style={{ fontWeight: 500 }}>{preset.name}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{preset.formula}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function EnergyModeSelector() {
  const { energyMode, setEnergyMode } = useMoleculeStore()

  const modes: { id: EnergyMode; label: string; icon: string }[] = [
    { id: 'thermal', label: '热激发', icon: '🔥' },
    { id: 'light', label: '光照模式', icon: '☀️' },
  ]

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {modes.map(mode => {
        const isActive = energyMode === mode.id
        return (
          <button
            key={mode.id}
            onClick={() => setEnergyMode(isActive ? 'none' : mode.id)}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: isActive ? '1px solid #00bfff' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              background: isActive ? 'rgba(0,191,255,0.15)' : 'rgba(255,255,255,0.03)',
              color: isActive ? '#00bfff' : '#e0e0e0',
              cursor: 'pointer',
              transition: 'all 0.3s linear',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.border = '0.5px solid #00bfff'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
              }
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <span>{mode.icon}</span>
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}

function TemperatureSlider() {
  const { temperature, setTemperature, energyMode } = useMoleculeStore()

  if (energyMode !== 'thermal') return null

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '6px',
        fontSize: '12px',
      }}>
        <span style={{ color: '#e0e0e0' }}>振动频率</span>
        <span style={{ color: '#00f0ff' }}>{temperature.toFixed(1)} Hz</span>
      </div>
      <input
        type="range"
        min="0.5"
        max="3"
        step="0.1"
        value={temperature}
        onChange={(e) => setTemperature(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: '4px',
          appearance: 'none',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          outline: 'none',
          cursor: 'pointer',
        }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#666',
        marginTop: '4px',
      }}>
        <span>0.5 Hz</span>
        <span>3.0 Hz</span>
      </div>
    </div>
  )
}

function HeatmapToggle() {
  const { heatmapEnabled, setHeatmapEnabled } = useMoleculeStore()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
    }}>
      <span style={{ fontSize: '13px', color: '#e0e0e0' }}>能量热力图</span>
      <button
        onClick={() => setHeatmapEnabled(!heatmapEnabled)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          border: 'none',
          background: heatmapEnabled ? '#00bfff' : 'rgba(255,255,255,0.15)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.3s linear',
        }}
      >
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: '3px',
          left: heatmapEnabled ? '23px' : '3px',
          transition: 'left 0.3s linear',
        }} />
      </button>
    </div>
  )
}

function HeatmapLegend() {
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{
        height: '6px',
        borderRadius: '3px',
        background: 'linear-gradient(to right, #0000ff, #00ff00, #ff0000)',
        marginBottom: '4px',
      }} />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#888',
      }}>
        <span>低能</span>
        <span>中能</span>
        <span>高能</span>
      </div>
    </div>
  )
}

function ScreenshotButton() {
  const { triggerScreenshot } = useMoleculeStore()

  return (
    <button
      onClick={triggerScreenshot}
      style={{
        width: '100%',
        padding: '10px',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        background: 'rgba(0,191,255,0.08)',
        color: '#e0e0e0',
        cursor: 'pointer',
        fontSize: '13px',
        transition: 'all 0.3s linear',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = '0.5px solid #00bfff'
        e.currentTarget.style.background = 'rgba(0,191,255,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
        e.currentTarget.style.background = 'rgba(0,191,255,0.08)'
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)'
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      📷 下载截图 (PNG)
    </button>
  )
}

export default function ControlPanel() {
  const { panelCollapsed, setPanelCollapsed, energyMode } = useMoleculeStore()

  if (panelCollapsed) {
    return (
      <div
        onClick={() => setPanelCollapsed(false)}
        style={{
          width: '36px',
          height: '100%',
          background: 'rgba(10,14,26,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderLeft: '1px solid #00bfff40',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s linear',
          color: '#00bfff',
          fontSize: '18px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderLeft = '1px solid #00bfff80'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderLeft = '1px solid #00bfff40'
        }}
      >
        ◀
      </div>
    )
  }

  return (
    <div style={{
      width: '280px',
      height: '100%',
      background: 'rgba(10,14,26,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderLeft: '1px solid #00bfff40',
      padding: '20px 16px',
      overflowY: 'auto',
      position: 'relative',
      transition: 'all 0.3s linear',
    }}>
      <button
        onClick={() => setPanelCollapsed(true)}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'none',
          border: 'none',
          color: '#00bfff',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '4px',
          transition: 'transform 0.3s linear',
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        ▶
      </button>

      <PanelSection title="分子载入">
        <MoleculeSelector />
      </PanelSection>

      <PanelSection title="能量模式">
        <EnergyModeSelector />
        <TemperatureSlider />
      </PanelSection>

      <PanelSection title="热力图">
        <HeatmapToggle />
        <HeatmapLegend />
      </PanelSection>

      {energyMode === 'light' && (
        <PanelSection title="光源控制">
          <div style={{
            fontSize: '12px',
            color: '#888',
            lineHeight: 1.5,
          }}>
            拖拽视口中的黄色光点以改变光照角度，分子表面反射与键能将实时更新。
          </div>
        </PanelSection>
      )}

      <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
        <ScreenshotButton />
      </div>
    </div>
  )
}
