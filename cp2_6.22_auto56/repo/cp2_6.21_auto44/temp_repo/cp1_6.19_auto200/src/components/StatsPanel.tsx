import { useCityStore } from '@/stores/useCityStore'
import { motion } from 'framer-motion'
import { Thermometer, TrendingUp, TrendingDown, Activity } from 'lucide-react'

export default function StatsPanel() {
  const stats = useCityStore((state) => state.stats)
  const selectedZoneId = useCityStore((state) => state.selectedZoneId)
  const selectedZoneData = useCityStore((state) => state.selectedZoneData)
  const mitigations = useCityStore((state) => state.mitigations)

  if (!selectedZoneId) {
    return null
  }

  const hasMitigation = mitigations.greenRoof || mitigations.verticalGreening || mitigations.permeablePavement

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        width: '220px',
        backgroundColor: 'rgba(26, 26, 26, 0.8)',
        backdropFilter: 'blur(8px)',
        borderRadius: '10px',
        padding: '12px',
        boxSizing: 'border-box',
        color: '#fff',
        zIndex: 10,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <Activity size={14} color="#00BFFF" />
        <span style={{ fontSize: '13px', fontWeight: 500 }}>{selectedZoneData?.name || '区域'}热力数据</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 8px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Thermometer size={12} color="#FF6B6B" />
            <span style={{ fontSize: '12px', color: '#aaa' }}>平均温度</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 600 }}>
            {stats.avgTemp.toFixed(1)}°C
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 8px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={12} color="#F44336" />
            <span style={{ fontSize: '12px', color: '#aaa' }}>最高温度</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 600, color: '#F44336' }}>
            {stats.maxTemp.toFixed(1)}°C
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 8px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={12} color="#4CAF50" />
            <span style={{ fontSize: '12px', color: '#aaa' }}>最低温度</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 600, color: '#4CAF50' }}>
            {stats.minTemp.toFixed(1)}°C
          </span>
        </div>

        {hasMitigation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              marginTop: '4px',
              padding: '8px',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(76, 175, 80, 0.2)',
            }}
          >
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
              缓解措施效果
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#aaa' }}>温差对比</span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: stats.tempReduction >= 0 ? '#4CAF50' : '#F44336',
                }}
              >
                {stats.tempReduction >= 0 ? '-' : '+'}{Math.abs(stats.tempReduction).toFixed(1)}°C
              </span>
            </div>
          </motion.div>
        )}
      </div>

      <div
        style={{
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '10px',
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>25°C</span>
        <div
          style={{
            flex: 1,
            height: '6px',
            margin: '0 8px',
            background: 'linear-gradient(to right, #0000FF, #00FFFF, #FFFF00, #FF8000, #FF0000)',
            borderRadius: '3px',
          }}
        />
        <span>45°C</span>
      </div>
    </motion.div>
  )
}
