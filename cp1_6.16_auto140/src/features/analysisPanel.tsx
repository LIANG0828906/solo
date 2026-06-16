import React from 'react'
import { useStore, Disease, DiseaseType, DISEASE_NAMES } from '../store'

interface GroupedDiseases {
  [key: string]: Disease[]
}

const AnalysisPanel: React.FC = () => {
  const { diseases, highlightedDiseaseId } = useStore()
  const { setHighlighted } = useStore((state) => state.actions)

  const groupedDiseases = diseases.reduce<GroupedDiseases>((acc, disease) => {
    if (!acc[disease.type]) {
      acc[disease.type] = []
    }
    acc[disease.type].push(disease)
    return acc
  }, {})

  const handleDiseaseClick = (diseaseId: string) => {
    if (highlightedDiseaseId === diseaseId) {
      setHighlighted(null)
    } else {
      setHighlighted(diseaseId)
    }
  }

  const diseaseTypeOrder: DiseaseType[] = ['crack', 'rust', 'peeling', 'contamination']

  return (
    <div className="analysis-panel">
      <div className="panel-header">
        <h2>病害分析报告</h2>
        <div className="detection-badge">
          检测到 {diseases.length} 处病害
        </div>
      </div>

      <div className="disease-groups">
        {diseaseTypeOrder.map((type) => {
          const groupDiseases = groupedDiseases[type]
          if (!groupDiseases || groupDiseases.length === 0) return null

          return (
            <div key={type} className="disease-group">
              <h3 className="group-title">
                <span
                  className="group-dot"
                  style={{ backgroundColor: groupDiseases[0].color }}
                />
                {DISEASE_NAMES[type]}
                <span className="group-count">{groupDiseases.length}</span>
              </h3>

              <div className="disease-list">
                {groupDiseases.map((disease) => (
                  <div
                    key={disease.id}
                    className={`disease-item ${highlightedDiseaseId === disease.id ? 'highlighted' : ''}`}
                    onClick={() => handleDiseaseClick(disease.id)}
                  >
                    <span
                      className="disease-dot"
                      style={{ backgroundColor: disease.color }}
                    />
                    <span className="disease-name">{disease.name}</span>
                    <span className="disease-area">{disease.area} cm²</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {diseases.length === 0 && (
        <div className="empty-state">
          <p>请上传古董照片进行病害分析</p>
        </div>
      )}
    </div>
  )
}

export default AnalysisPanel
