import { useRef } from 'react'
import { useEditorStore, MaterialType } from '@/store/editorStore'
import { downloadSnapshot, readSnapshotFromFile } from '@/utils/snapshot'

const materialTypes: { value: MaterialType; label: string }[] = [
  { value: 'diffuse', label: '漫反射' },
  { value: 'metal', label: '金属' },
  { value: 'glossy', label: '光泽' },
  { value: 'transparent', label: '半透明' },
]

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step: number
  onChange: (v: number) => void
}) {
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startValue = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startValue.current = value
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
    const handleMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      const delta = (ev.clientX - startX.current) * step
      let newValue = startValue.current + delta
      if (min !== undefined) newValue = Math.max(min, newValue)
      if (max !== undefined) newValue = Math.min(max, newValue)
      onChange(Math.round(newValue * 100) / 100)
    }
    const handleUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
        <label
          style={{ color: '#aaa', fontSize: 11, cursor: 'ew-resize' }}
          onMouseDown={handleMouseDown}
        >
          {label}
        </label>
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            let v = parseFloat(e.target.value)
            if (isNaN(v)) v = 0
            if (min !== undefined) v = Math.max(min, v)
            if (max !== undefined) v = Math.min(max, v)
            onChange(v)
          }}
          style={{
            width: 72,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#ddd',
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: 'monospace',
            textAlign: 'right',
          }}
        />
      </div>
    </div>
  )
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ color: '#aaa', fontSize: 11 }}>{label}</label>
        <span style={{ color: '#888', fontSize: 11, fontFamily: 'monospace' }}>
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#6c63ff' }}
      />
    </div>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ color: '#aaa', fontSize: 11 }}>{label}</label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 40,
            height: 28,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#ddd',
            padding: '5px 10px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: 'monospace',
          }}
        />
      </div>
    </div>
  )
}

const PropertyPanel = () => {
  const selectedId = useEditorStore((s) => s.selectedId)
  const geometryList = useEditorStore((s) => s.geometryList)
  const updateTransform = useEditorStore((s) => s.updateTransform)
  const updateMaterial = useEditorStore((s) => s.updateMaterial)
  const setMaterialType = useEditorStore((s) => s.setMaterialType)
  const saveSnapshot = useEditorStore((s) => s.saveSnapshot)
  const loadSnapshot = useEditorStore((s) => s.loadSnapshot)
  const removeGeometry = useEditorStore((s) => s.removeGeometry)
  const transformMode = useEditorStore((s) => s.transformMode)
  const setTransformMode = useEditorStore((s) => s.setTransformMode)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selected = geometryList.find((g) => g.id === selectedId)

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 280,
    background: 'rgba(30,30,50,0.9)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderLeft: '1px solid #2a2a4a',
    padding: '20px 20px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  }

  const handleExport = () => {
    const snapshot = saveSnapshot()
    downloadSnapshot(snapshot)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const snapshot = await readSnapshotFromFile(file)
        loadSnapshot(snapshot)
      } catch (err) {
        alert('导入失败：' + (err as Error).message)
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          属性面板
        </h2>
        <p style={{ color: '#666', fontSize: 11, margin: 0 }}>
          调整选中物体的参数
        </p>
      </div>

      {!selected ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#555', fontSize: 13, textAlign: 'center' }}>
            请在场景中选择一个物体
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>
                  {selected.name}
                </h3>
                <p style={{ color: '#888', fontSize: 11, margin: '4px 0 0' }}>
                  类型：{selected.type}
                </p>
              </div>
              <button
                onClick={() => removeGeometry(selected.id)}
                style={{
                    background: 'rgba(255,80,80,0.2)',
                    color: '#ff6b6b',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: 5,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
              >
                删除
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 8, display: 'flex', gap: 6 }}>
            {(['translate', 'rotate'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTransformMode(mode)}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  background: transformMode === mode ? '#6c63ff' : 'rgba(255,255,255,0.06)',
                  color: transformMode === mode ? '#fff' : '#aaa',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {mode === 'translate' ? '平移 (T)' : '旋转 (R)'}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ color: '#ddd', fontSize: 12, fontWeight: 600, margin: '16px 0 10px', letterSpacing: 0.3 }}>
              变换
            </h4>

            <div style={{ marginBottom: 12 }}>
              <p style={{ color: '#777', fontSize: 10, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Position
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(['x', 'y', 'z'] as const).map((axis, i) => (
                  <NumberInput
                    key={axis}
                    label={axis.toUpperCase()}
                    value={selected.position[i]}
                    min={-10}
                    max={10}
                    step={0.1}
                    onChange={(v) => {
                      const newPos = [...selected.position] as [number, number, number]
                      newPos[i] = v
                      updateTransform(selected.id, { position: newPos })
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <p style={{ color: '#777', fontSize: 10, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Rotation (°)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(['x', 'y', 'z'] as const).map((axis, i) => (
                  <NumberInput
                    key={axis}
                    label={axis.toUpperCase()}
                    value={selected.rotation[i]}
                    min={-180}
                    max={180}
                    step={0.1}
                    onChange={(v) => {
                      const newRot = [...selected.rotation] as [number, number, number]
                      newRot[i] = v
                      updateTransform(selected.id, { rotation: newRot })
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <p style={{ color: '#777', fontSize: 10, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Scale
              </p>
              <NumberInput
                label="XYZ"
                value={selected.scale}
                min={0.2}
                max={5}
                step={0.1}
                onChange={(v) => updateTransform(selected.id, { scale: v })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ color: '#ddd', fontSize: 12, fontWeight: 600, margin: '0 0 10px', letterSpacing: 0.3 }}>
              材质
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 16 }}>
              {materialTypes.map((mt) => (
                <button
                  key={mt.value}
                  onClick={() => setMaterialType(selected.id, mt.value)}
                  style={{
                    padding: '8px 0',
                    background: selected.material.type === mt.value ? '#6c63ff' : 'rgba(255,255,255,0.06)',
                    color: selected.material.type === mt.value ? '#fff' : '#aaa',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {mt.label}
                </button>
              ))}
            </div>

            <ColorPicker
              label="颜色"
              value={selected.material.color}
              onChange={(v) => updateMaterial(selected.id, { color: v })}
            />

            <SliderInput
              label="环境反射强度"
              value={selected.material.envIntensity}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updateMaterial(selected.id, { envIntensity: v })}
            />

            {selected.material.type === 'metal' && (
              <>
                <SliderInput
                  label="金属度"
                  value={selected.material.metalness ?? 0.8}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateMaterial(selected.id, { metalness: v })}
                />
                <SliderInput
                  label="粗糙度"
                  value={selected.material.roughness ?? 0.3}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateMaterial(selected.id, { roughness: v })}
                />
              </>
            )}

            {selected.material.type === 'glossy' && (
              <>
                <SliderInput
                  label="高光强度"
                  value={selected.material.specularIntensity ?? 1}
                  min={0}
                  max={2}
                  step={0.01}
                  onChange={(v) => updateMaterial(selected.id, { specularIntensity: v })}
                />
                <SliderInput
                  label="高光锐度"
                  value={selected.material.specularSharpness ?? 0.5}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateMaterial(selected.id, { specularSharpness: v })}
                />
              </>
            )}

            {selected.material.type === 'transparent' && (
              <>
                <SliderInput
                  label="透明度"
                  value={selected.material.opacity ?? 0.7}
                  min={0.2}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateMaterial(selected.id, { opacity: v })}
                />
                <SliderInput
                  label="折射率"
                  value={selected.material.ior ?? 1.5}
                  min={1}
                  max={2}
                  step={0.01}
                  onChange={(v) => updateMaterial(selected.id, { ior: v })}
                />
              </>
            )}
          </div>
        </>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleExport}
            style={{
              flex: 1,
              padding: '10px 0',
              background: '#6c63ff',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5a52e0'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#6c63ff'
            }}
          >
            导出快照
          </button>
          <button
            onClick={handleImportClick}
            style={{
              flex: 1,
              padding: '10px 0',
              background: '#6c63ff',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5a52e0'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#6c63ff'
            }}
          >
            导入快照
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}

export default PropertyPanel
