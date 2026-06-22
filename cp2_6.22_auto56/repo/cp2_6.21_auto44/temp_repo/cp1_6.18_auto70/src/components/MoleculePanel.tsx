import { useStore } from '@/store/useStore'
import { MOLECULE_PRESETS } from '@/models/Molecule'

export default function MoleculePanel() {
  const currentMoleculeId = useStore((s) => s.currentMoleculeId)
  const setMolecule = useStore((s) => s.setMolecule)
  const isTransitioning = useStore((s) => s.isTransitioning)

  return (
    <div className="molecule-panel">
      <div className="panel-title">分子模型库</div>
      <div className="panel-grid">
        {MOLECULE_PRESETS.map((mol) => (
          <button
            key={mol.id}
            className={`mol-card ${currentMoleculeId === mol.id ? 'active' : ''}`}
            onClick={() => !isTransitioning && setMolecule(mol.id)}
            disabled={isTransitioning}
          >
            <span className="mol-icon">{mol.icon}</span>
            <span className="mol-name">{mol.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
