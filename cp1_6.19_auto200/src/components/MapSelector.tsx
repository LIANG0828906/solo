import { useCityStore } from '@/stores/useCityStore'
import { ZONES } from '@/utils/heatCalculation'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

export default function MapSelector() {
  const selectedZoneId = useCityStore((state) => state.selectedZoneId)
  const selectZone = useCityStore((state) => state.selectZone)

  const gridCols = 3
  const gridRows = 3

  const getDensityColor = (density: number) => {
    const t = density / 100
    const gray = Math.floor(51 + t * 51)
    return `rgb(${gray}, ${gray}, ${gray})`
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#2A2A2A',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          color: '#fff',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <MapPin size={18} color="#00BFFF" />
        城市区域选择
      </div>

      <div
        style={{
          width: '400px',
          height: '400px',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          gap: '2px',
          backgroundColor: '#1A1A1A',
          padding: '2px',
          boxSizing: 'border-box',
        }}
      >
        {ZONES.map((zone, index) => {
          const isSelected = selectedZoneId === zone.id
          const bgColor = getDensityColor(zone.density)

          return (
            <motion.div
              key={zone.id}
              onClick={() => selectZone(zone.id)}
              style={{
                backgroundColor: bgColor,
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                border: isSelected ? '2px solid #00BFFF' : '1px solid #333',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.96 }}
            >
              <span
                style={{
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  zIndex: 2,
                }}
              >
                {zone.name}
              </span>
              <span
                style={{
                  color: '#aaa',
                  fontSize: '11px',
                  marginTop: '4px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  zIndex: 2,
                }}
              >
                密度 {zone.density}%
              </span>

              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${zone.vegetation}%`,
                  background: 'linear-gradient(to top, rgba(0,230,118,0.3), transparent)',
                  pointerEvents: 'none',
                }}
              />
            </motion.div>
          )
        })}
      </div>

      <div
        style={{
          marginTop: '12px',
          display: 'flex',
          gap: '12px',
          fontSize: '12px',
          color: '#888',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#333' }} />
          <span>低密度</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#666' }} />
          <span>高密度</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(0,230,118,0.5)' }} />
          <span>植被</span>
        </div>
      </div>
    </div>
  )
}
