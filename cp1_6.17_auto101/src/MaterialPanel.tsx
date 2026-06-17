import { useStore } from './store'
import { MATERIALS, hslToString } from './GameEngine'

export default function MaterialPanel() {
  const selectedMaterialIds = useStore((s) => s.selectedMaterialIds)
  const addMaterial = useStore((s) => s.addMaterial)
  const toggleMaterialSelection = useStore((s) => s.toggleMaterialSelection)

  const handleClick = (id: string) => {
    toggleMaterialSelection(id)
    addMaterial(id)
  }

  return (
    <aside className="panel material-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="title-icon">📜</span>
          材料典籍
        </h2>
        <p className="panel-subtitle">点击材料加入坩埚</p>
      </div>

      <div className="material-grid">
        {MATERIALS.map((material) => {
          const isSelected = selectedMaterialIds.has(material.id)
          return (
            <div
              key={material.id}
              className={`material-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleClick(material.id)}
            >
              <div
                className="material-icon-wrap"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${hslToString(material.color, 0.4)}, ${hslToString(material.color, 0.1)})`,
                  borderColor: hslToString(material.color, 0.6),
                }}
              >
                <span className="material-icon">{material.icon}</span>
              </div>
              <span className="material-name">{material.name}</span>

              <div className="material-tooltip">
                <div className="tooltip-header">
                  <span>{material.icon}</span>
                  <strong>{material.name}</strong>
                </div>
                <div
                  className="tooltip-color"
                  style={{
                    background: hslToString(material.color, 1),
                  }}
                />
                <p className="tooltip-property">{material.property}</p>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
