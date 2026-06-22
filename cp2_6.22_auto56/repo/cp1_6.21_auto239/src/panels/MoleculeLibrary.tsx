import { molecules } from '@/utils/moleculeData'
import type { Molecule } from '@/utils/moleculeData'

interface MoleculeLibraryProps {
  selectedMoleculeId: string | null
  onSelectMolecule: (molecule: Molecule) => void
}

const elementColorsForThumb: Record<string, string> = {
  C: '#444444',
  H: '#FFFFFF',
  O: '#FF0D0D',
  N: '#3050F8',
  S: '#FFFF30',
}

function MoleculeThumbnail({ molecule }: { molecule: Molecule }) {
  const svgSize = 104
  const centerX = svgSize / 2
  const centerY = svgSize / 2
  const scale = 12

  const atoms = molecule.atoms.slice(0, 12)

  const projected = atoms.map((atom) => {
    const projX = centerX + (atom.x - atom.z * 0.3) * scale
    const projY = centerY - (atom.y + atom.z * 0.3) * scale
    const radius = atom.element === 'H' ? 4 : 6
    const color = elementColorsForThumb[atom.element] || '#888888'
    return { x: projX, y: projY, r: radius, color, z: atom.z }
  })

  const bondsToShow = molecule.bonds.filter(
    (b) =>
      projected.some((p) => molecule.atoms.find((a) => a.id === b.atom1Id)?.id === b.atom1Id) &&
      projected.some((p) => molecule.atoms.find((a) => a.id === b.atom2Id)?.id === b.atom2Id)
  ).slice(0, 15)

  const sortedAtoms = [...projected].sort((a, b) => a.z - b.z)

  return (
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
      {bondsToShow.map((bond, i) => {
        const atom1 = molecule.atoms.find((a) => a.id === bond.atom1Id)
        const atom2 = molecule.atoms.find((a) => a.id === bond.atom2Id)
        if (!atom1 || !atom2) return null
        const x1 = centerX + (atom1.x - atom1.z * 0.3) * scale
        const y1 = centerY - (atom1.y + atom1.z * 0.3) * scale
        const x2 = centerX + (atom2.x - atom2.z * 0.3) * scale
        const y2 = centerY - (atom2.y + atom2.z * 0.3) * scale
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#6B7280"
            strokeWidth="1.5"
            opacity={0.7}
          />
        )
      })}
      {sortedAtoms.map((atom, i) => (
        <circle key={i} cx={atom.x} cy={atom.y} r={atom.r} fill={atom.color} stroke="#374151" strokeWidth="0.5" />
      ))}
    </svg>
  )
}

export default function MoleculeLibrary({ selectedMoleculeId, onSelectMolecule }: MoleculeLibraryProps) {
  return (
    <div
      style={{
        width: '300px',
        height: '100%',
        backgroundColor: '#0F172A',
        borderRight: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #1E293B',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#E2E8F0',
          }}
        >
          分子库
        </h2>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '12px',
            color: '#64748B',
          }}
        >
          选择分子加载到场景中
        </p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {molecules.map((molecule) => (
          <div
            key={molecule.id}
            onClick={() => onSelectMolecule(molecule)}
            style={{
              width: '120px',
              backgroundColor: '#1E293B',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
              border: selectedMoleculeId === molecule.id ? '2px solid #6366F1' : '2px solid transparent',
              boxShadow: selectedMoleculeId === molecule.id ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transform: 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = selectedMoleculeId === molecule.id
                ? '0 6px 16px rgba(99, 102, 241, 0.4)'
                : '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = selectedMoleculeId === molecule.id
                ? '0 4px 12px rgba(99, 102, 241, 0.3)'
                : 'none'
            }}
          >
            <div
              style={{
                width: '104px',
                height: '104px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0F172A',
                borderRadius: '6px',
              }}
            >
              <MoleculeThumbnail molecule={molecule} />
            </div>
            <div
              style={{
                textAlign: 'center',
                width: '100%',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#E2E8F0',
                  marginBottom: '2px',
                }}
              >
                {molecule.name}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748B',
                }}
              >
                {molecule.formula}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
