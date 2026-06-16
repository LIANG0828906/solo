import { useStore } from '../store/useStore'
import { ELEMENT_NAMES } from '../types'
import '../styles/AtomInspector.css'

export function AtomInspector() {
  const selectedAtomId = useStore((state) => state.selectedAtomId)
  const setSelectedAtom = useStore((state) => state.setSelectedAtom)
  const getSelectedAtom = useStore((state) => state.getSelectedAtom)
  const getConnectedAtoms = useStore((state) => state.getConnectedAtoms)

  const selectedAtom = getSelectedAtom()
  const connectedAtoms = selectedAtomId !== null ? getConnectedAtoms(selectedAtomId) : []

  if (selectedAtomId === null || !selectedAtom) {
    return null
  }

  const elementName = ELEMENT_NAMES[selectedAtom.element] || '未知'

  return (
    <div className="atom-inspector">
      <div className="inspector-header">
        <div className="element-symbol" style={{ color: getElementColor(selectedAtom.element) }}>
          {selectedAtom.element}
        </div>
        <div className="element-name">{elementName}</div>
      </div>

      <div className="inspector-section">
        <div className="section-title">三维坐标</div>
        <div className="coordinates">
          <div className="coord-item">
            <span className="coord-label">X</span>
            <span className="coord-value">{selectedAtom.x.toFixed(2)}</span>
          </div>
          <div className="coord-item">
            <span className="coord-label">Y</span>
            <span className="coord-value">{selectedAtom.y.toFixed(2)}</span>
          </div>
          <div className="coord-item">
            <span className="coord-label">Z</span>
            <span className="coord-value">{selectedAtom.z.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="inspector-section">
        <div className="section-title">连接原子 ({connectedAtoms.length})</div>
        <div className="connected-atoms">
          {connectedAtoms.length === 0 ? (
            <div className="no-bonds">无化学键连接</div>
          ) : (
            <div className="atom-list">
              {connectedAtoms.map((atom) => (
                <div
                  key={atom.id}
                  className="atom-chip"
                  style={{ borderColor: getElementColor(atom.element) }}
                  onClick={() => setSelectedAtom(atom.id)}
                >
                  <span
                    className="atom-dot"
                    style={{ backgroundColor: getElementColor(atom.element) }}
                  />
                  <span className="atom-label">{atom.element}</span>
                  <span className="atom-id">#{atom.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button className="close-button" onClick={() => setSelectedAtom(null)}>
        关闭
      </button>
    </div>
  )
}

function getElementColor(element: string): string {
  const colors: Record<string, string> = {
    C: '#808080',
    O: '#FF0D0D',
    N: '#3050F8',
    S: '#FFFF30',
    P: '#FF8000',
    H: '#FFFFFF',
  }
  return colors[element] || '#FFFFFF'
}
