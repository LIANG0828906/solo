import { useStore } from '../store/useStore'
import { ELEMENT_MASSES } from '../types'
import '../styles/MoleculeInfo.css'

export function MoleculeInfo() {
  const molecule = useStore((state) => state.molecule)

  const atomCount = molecule.atoms.length
  const bondCount = molecule.bonds.length

  const elementCounts: Record<string, number> = {}
  let molecularWeight = 0

  molecule.atoms.forEach((atom) => {
    elementCounts[atom.element] = (elementCounts[atom.element] || 0) + 1
    molecularWeight += ELEMENT_MASSES[atom.element] || 0
  })

  const sortedElements = Object.keys(elementCounts).sort()
  const formula = sortedElements
    .map((el) => {
      const count = elementCounts[el]
      return count === 1 ? el : `${el}${count}`
    })
    .join('')

  return (
    <div className="molecule-info">
      <div className="info-gradient-bar" />
      <div className="info-content">
        <h3 className="molecule-title">{molecule.name}</h3>

        <div className="info-row">
          <span className="info-label">原子总数</span>
          <span className="info-value">{atomCount}</span>
        </div>

        <div className="info-row">
          <span className="info-label">化学键数</span>
          <span className="info-value">{bondCount}</span>
        </div>

        <div className="info-row">
          <span className="info-label">分子式</span>
          <span className="info-value formula">{formula}</span>
        </div>

        <div className="info-row">
          <span className="info-label">分子量</span>
          <span className="info-value">{molecularWeight.toFixed(1)} Da</span>
        </div>
      </div>
    </div>
  )
}
