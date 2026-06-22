import { useMoleculeContext } from '../utils/context'
import { MOLECULES } from '../data/molecules'

export default function InfoPanel() {
  const {
    currentMolecule, mode,
    selectedAtoms, measuredAtoms,
    setCurrentMolecule, setMeasuredAtoms,
  } = useMoleculeContext()

  const atomsMap = (() => {
    const map: Record<string, { element: string; mass: number; position: [number, number, number] }> = {}
    currentMolecule.atoms.forEach(a => {
      map[a.id] = { element: a.element, mass: a.mass, position: a.position }
    })
    return map
  })()

  const measuredDistance = (() => {
    if (measuredAtoms.length < 2) return null
    const a1 = atomsMap[measuredAtoms[0]]
    const a2 = atomsMap[measuredAtoms[1]]
    if (!a1 || !a2) return null
    const dx = a1.position[0] - a2.position[0]
    const dy = a1.position[1] - a2.position[1]
    const dz = a1.position[2] - a2.position[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz) * 100
  })()

  const selectedAtom = selectedAtoms.length > 0 ? atomsMap[selectedAtoms[0]] : null

  return (
    <div style={{
      position: 'absolute',
      right: 16,
      top: 16,
      width: 320,
      background: '#1E293B',
      borderRadius: 12,
      padding: 20,
      color: '#E2E8F0',
      zIndex: 10,
      maxHeight: 'calc(100vh - 180px)',
      overflowY: 'auto',
      boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0', color: '#F8FAFC' }}>
        {currentMolecule.name}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <InfoRow label="分子式" value={currentMolecule.formula} />
        <InfoRow label="分子量" value={`${currentMolecule.molecularWeight} g/mol`} />
        <InfoRow label="几何构型" value={currentMolecule.geometry} />
        <div>
          <span style={{ color: '#94A3B8', fontSize: 12 }}>键角</span>
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {currentMolecule.bondAngles.map((angle, i) => (
              <span key={i} style={{ fontSize: 13, color: '#CBD5E1' }}>{angle}</span>
            ))}
          </div>
        </div>
      </div>

      {mode === 'select' && selectedAtom && (
        <div style={{
          marginTop: 16,
          padding: 12,
          background: '#0F172A',
          borderRadius: 8,
          borderLeft: '3px solid #3B82F6',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#3B82F6', marginBottom: 8 }}>原子信息</div>
          <InfoRow label="元素" value={selectedAtom.element} />
          <InfoRow label="原子量" value={`${selectedAtom.mass} u`} />
          <InfoRow label="坐标" value={`(${selectedAtom.position.map(v => v.toFixed(2)).join(', ')})`} />
        </div>
      )}

      {mode === 'measure' && measuredDistance !== null && (
        <div style={{
          marginTop: 16,
          padding: 12,
          background: '#0F172A',
          borderRadius: 8,
          borderLeft: '3px solid #10B981',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#10B981', marginBottom: 8 }}>距离测量</div>
          <InfoRow label="原子1" value={measuredAtoms[0]} />
          <InfoRow label="原子2" value={measuredAtoms[1]} />
          <InfoRow label="距离" value={`${measuredDistance.toFixed(1)} pm`} />
        </div>
      )}

      {mode === 'measure' && measuredAtoms.length < 2 && (
        <div style={{
          marginTop: 16,
          padding: 12,
          background: '#0F172A',
          borderRadius: 8,
          borderLeft: '3px solid #10B981',
        }}>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>
            {measuredAtoms.length === 0 ? '请点击第一个原子' : '请点击第二个原子'}
          </span>
        </div>
      )}

      {mode === 'disassemble' && (
        <div style={{
          marginTop: 16,
          padding: 12,
          background: '#0F172A',
          borderRadius: 8,
          borderLeft: '3px solid #F59E0B',
        }}>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>
            点击原子可拆解观察，再次点击恢复
          </span>
        </div>
      )}

      <div style={{ marginTop: 20, borderTop: '1px solid #334155', paddingTop: 16 }}>
        <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 8 }}>
          载入分子
        </label>
        <select
          value={currentMolecule.id}
          onChange={e => {
            const mol = MOLECULES[e.target.value]
            if (mol) setCurrentMolecule(mol)
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #475569',
            background: '#0F172A',
            color: '#E2E8F0',
            fontSize: 14,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
          }}
        >
          {Object.values(MOLECULES).map(m => (
            <option key={m.id} value={m.id} style={{ background: '#0F172A', color: '#E2E8F0' }}>
              {m.name} {m.formula}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#94A3B8', fontSize: 12 }}>{label}</span>
      <span style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  )
}
