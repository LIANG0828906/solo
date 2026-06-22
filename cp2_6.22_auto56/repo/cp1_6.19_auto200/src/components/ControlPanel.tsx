import { useCityStore } from '@/stores/useCityStore'
import { motion } from 'framer-motion'
import { Leaf, TreeDeciduous, Droplets, RotateCcw, Undo2, Sliders } from 'lucide-react'

export default function ControlPanel() {
  const buildingDensity = useCityStore((state) => state.buildingDensity)
  const vegetationCoverage = useCityStore((state) => state.vegetationCoverage)
  const materialAlbedo = useCityStore((state) => state.materialAlbedo)
  const mitigations = useCityStore((state) => state.mitigations)
  const stats = useCityStore((state) => state.stats)
  const setBuildingDensity = useCityStore((state) => state.setBuildingDensity)
  const setVegetationCoverage = useCityStore((state) => state.setVegetationCoverage)
  const setMaterialAlbedo = useCityStore((state) => state.setMaterialAlbedo)
  const toggleMitigation = useCityStore((state) => state.toggleMitigation)
  const reset = useCityStore((state) => state.reset)
  const undo = useCityStore((state) => state.undo)
  const history = useCityStore((state) => state.history)
  const selectedZoneId = useCityStore((state) => state.selectedZoneId)

  const sliderStyle: React.CSSProperties = {
    width: '200px',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#444',
    outline: 'none',
    WebkitAppearance: 'none' as const,
    appearance: 'none',
    cursor: 'pointer',
  }

  const sliderThumbStyle = `
    .control-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #FFFFFF;
      border: 1px solid #666;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .control-slider::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }
    .control-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #FFFFFF;
      border: 1px solid #666;
      cursor: pointer;
      transition: all 0.2s ease;
    }
  `

  const mitigationButtons = [
    {
      key: 'greenRoof' as const,
      label: '绿色屋顶',
      icon: Leaf,
      desc: '屋顶绿化降温',
    },
    {
      key: 'verticalGreening' as const,
      label: '垂直绿化',
      icon: TreeDeciduous,
      desc: '墙面植被降温',
    },
    {
      key: 'permeablePavement' as const,
      label: '透水路面',
      icon: Droplets,
      desc: '透水地面降温',
    },
  ]

  return (
    <div
      style={{
        width: '260px',
        backgroundColor: '#2C2C2C',
        borderRadius: '8px',
        padding: '16px',
        boxSizing: 'border-box',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: 'fit-content',
      }}
    >
      <style>{sliderThumbStyle}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sliders size={18} color="#00BFFF" />
        <span style={{ fontSize: '16px', fontWeight: 600 }}>参数控制</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#ccc' }}>建筑密度</span>
            <span style={{ color: '#00BFFF', fontFamily: 'monospace' }}>{buildingDensity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={buildingDensity}
            onChange={(e) => setBuildingDensity(Number(e.target.value))}
            className="control-slider"
            style={sliderStyle}
            disabled={!selectedZoneId}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#ccc' }}>植被覆盖率</span>
            <span style={{ color: '#4CAF50', fontFamily: 'monospace' }}>{vegetationCoverage}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={vegetationCoverage}
            onChange={(e) => setVegetationCoverage(Number(e.target.value))}
            className="control-slider"
            style={sliderStyle}
            disabled={!selectedZoneId}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#ccc' }}>材料反射率</span>
            <span style={{ color: '#FFD700', fontFamily: 'monospace' }}>{materialAlbedo.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.1"
            value={materialAlbedo}
            onChange={(e) => setMaterialAlbedo(Number(e.target.value))}
            className="control-slider"
            style={sliderStyle}
            disabled={!selectedZoneId}
          />
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: '#444', margin: '4px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#ddd' }}>缓解措施</span>
        {mitigationButtons.map((btn) => {
          const isActive = mitigations[btn.key]
          const Icon = btn.icon
          return (
            <motion.button
              key={btn.key}
              onClick={() => toggleMitigation(btn.key)}
              disabled={!selectedZoneId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: selectedZoneId ? 'pointer' : 'not-allowed',
                backgroundColor: isActive ? '#2E7D32' : '#3A3A3A',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                width: '100%',
                opacity: selectedZoneId ? 1 : 0.5,
              }}
              whileHover={selectedZoneId ? { backgroundColor: isActive ? '#1B5E20' : '#444' } : {}}
              whileTap={selectedZoneId ? { scale: 0.98 } : {}}
            >
              <Icon size={18} color={isActive ? '#00E676' : '#888'} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span>{btn.label}</span>
                <span style={{ fontSize: '11px', color: isActive ? '#00E676' : '#888' }}>
                  {btn.desc}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {(mitigations.greenRoof || mitigations.verticalGreening || mitigations.permeablePavement) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '10px',
            backgroundColor: 'rgba(76, 175, 80, 0.15)',
            borderRadius: '6px',
            border: '1px solid rgba(76, 175, 80, 0.3)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>平均温度降低</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#4CAF50', fontFamily: 'monospace' }}>
            {stats.tempReduction > 0 ? `-${stats.tempReduction.toFixed(1)}°C` : '0.0°C'}
          </div>
        </motion.div>
      )}

      <div style={{ height: '1px', backgroundColor: '#444' }} />

      <div style={{ display: 'flex', gap: '8px' }}>
        <motion.button
          onClick={undo}
          disabled={!selectedZoneId || history.length === 0}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #555',
            backgroundColor: '#3A3A3A',
            color: '#ddd',
            fontSize: '12px',
            cursor: selectedZoneId && history.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            opacity: selectedZoneId && history.length > 0 ? 1 : 0.5,
          }}
          whileHover={selectedZoneId && history.length > 0 ? { backgroundColor: '#444' } : {}}
          whileTap={selectedZoneId && history.length > 0 ? { scale: 0.98 } : {}}
        >
          <Undo2 size={14} />
          撤销
        </motion.button>

        <motion.button
          onClick={reset}
          disabled={!selectedZoneId}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #555',
            backgroundColor: '#3A3A3A',
            color: '#ddd',
            fontSize: '12px',
            cursor: selectedZoneId ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            opacity: selectedZoneId ? 1 : 0.5,
          }}
          whileHover={selectedZoneId ? { backgroundColor: '#444' } : {}}
          whileTap={selectedZoneId ? { scale: 0.98 } : {}}
        >
          <RotateCcw size={14} />
          重置
        </motion.button>
      </div>
    </div>
  )
}
