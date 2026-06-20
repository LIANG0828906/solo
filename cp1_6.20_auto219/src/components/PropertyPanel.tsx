import { useSceneStore } from '@/store/SceneStore'
import { X } from 'lucide-react'
import { useCallback } from 'react'

const MATERIAL_LABELS: Record<string, string> = {
  metal: '金属',
  glass: '玻璃',
  matte: '哑光',
}

export default function PropertyPanel() {
  const { geometries, selectedId, updateGeometry, removeGeometry, isMobile, mobilePropertyOpen, setMobilePropertyOpen } = useSceneStore()

  const selectedGeo = geometries.find((g) => g.id === selectedId)

  const handleChange = useCallback((field: string, value: number | string) => {
    if (!selectedGeo) return
    updateGeometry(selectedGeo.id, { [field]: value })
  }, [selectedGeo, updateGeometry])

  const handleDelete = useCallback(() => {
    if (!selectedGeo) return
    removeGeometry(selectedGeo.id)
  }, [selectedGeo, removeGeometry])

  if (!selectedGeo) return null

  const panelContent = (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ddd' }}>属性面板</h3>
        {isMobile && (
          <button onClick={() => setMobilePropertyOpen(false)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Section title="位置">
          <SliderRow label="X" value={selectedGeo.posX} min={-10} max={10} step={0.5} onChange={(v) => handleChange('posX', v)} />
          <SliderRow label="Y" value={selectedGeo.posY} min={0} max={8} step={0.1} onChange={(v) => handleChange('posY', v)} />
          <SliderRow label="Z" value={selectedGeo.posZ} min={-10} max={10} step={0.5} onChange={(v) => handleChange('posZ', v)} />
        </Section>

        <Section title="旋转">
          <SliderRow label="X" value={Math.round((selectedGeo.rotX * 180) / Math.PI)} min={-180} max={180} step={1} onChange={(v) => handleChange('rotX', (v * Math.PI) / 180)} unit="°" />
          <SliderRow label="Y" value={Math.round((selectedGeo.rotY * 180) / Math.PI)} min={-180} max={180} step={1} onChange={(v) => handleChange('rotY', (v * Math.PI) / 180)} unit="°" />
          <SliderRow label="Z" value={Math.round((selectedGeo.rotZ * 180) / Math.PI)} min={-180} max={180} step={1} onChange={(v) => handleChange('rotZ', (v * Math.PI) / 180)} unit="°" />
        </Section>

        <Section title="缩放">
          <SliderRow label="比例" value={selectedGeo.scale} min={0.2} max={5} step={0.05} onChange={(v) => handleChange('scale', v)} unit="x" />
        </Section>

        <Section title="材质">
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['metal', 'glass', 'matte'] as const).map((mat) => (
              <button
                key={mat}
                onClick={() => handleChange('material', mat)}
                className="glow-border"
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: selectedGeo.material === mat
                    ? '1px solid #00bfff'
                    : '1px solid rgba(255,255,255,0.06)',
                  background: selectedGeo.material === mat
                    ? 'rgba(0,191,255,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  color: selectedGeo.material === mat ? '#00bfff' : '#aaa',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {MATERIAL_LABELS[mat]}
              </button>
            ))}
          </div>
        </Section>

        <button
          onClick={handleDelete}
          className="glow-border"
          style={{
            marginTop: '8px',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid rgba(255,80,80,0.3)',
            background: 'rgba(255,50,50,0.1)',
            color: '#ff6666',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          删除此几何体
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    if (!mobilePropertyOpen) return null

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(20px)',
          animation: 'fadeIn 0.2s ease-out',
          overflow: 'auto',
        }}
      >
        {panelContent}
      </div>
    )
  }

  return (
    <div
      className="glass-panel"
      style={{
        width: 300,
        height: '100%',
        overflow: 'auto',
        animation: 'slideInRight 0.3s ease-out',
        flexShrink: 0,
      }}
    >
      {panelContent}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#777', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  unit?: string
}) {
  const displayValue = typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ width: 20, fontSize: '11px', color: '#888', fontFamily: 'var(--font-mono)' }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1 }}
      />
      <span style={{
        width: 48,
        fontSize: '11px',
        color: '#00bfff',
        fontFamily: 'var(--font-mono)',
        textAlign: 'right',
      }}>
        {displayValue}{unit}
      </span>
    </div>
  )
}
