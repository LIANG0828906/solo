import React, { useState } from 'react'
import { useStore, MaterialType, MATERIAL_INFO, DiseaseType, DISEASE_COLORS } from '../store'

const RepairPanel: React.FC = () => {
  const { repairParams, diseases, highlightedDiseaseId } = useStore()
  const { setRepairParams } = useStore((state) => state.actions)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const highlightedDisease = diseases.find(d => d.id === highlightedDiseaseId)
  const activeType: DiseaseType = highlightedDisease?.type || 'crack'
  const diseaseColor = DISEASE_COLORS[activeType]

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRepairParams({ material: e.target.value as MaterialType })
  }

  const handleFillLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.round(Number(e.target.value) / 5) * 5
    setRepairParams({ fillLevel: value })
  }

  const materialOptions: MaterialType[] = ['epoxy', 'acrylate', 'nanoCalcium']
  const currentMaterialInfo = MATERIAL_INFO[repairParams.material]

  return (
    <div className={`repair-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="panel-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h2>修复方案参数</h2>
        <span className="collapse-icon">{isCollapsed ? '▼' : '▲'}</span>
      </div>

      {!isCollapsed && (
        <div className="panel-content">
          <div className="form-group">
            <label htmlFor="material-select">修复材料</label>
            <select
              id="material-select"
              value={repairParams.material}
              onChange={handleMaterialChange}
              className="form-select"
            >
              {materialOptions.map((type) => (
                <option key={type} value={type}>
                  {MATERIAL_INFO[type].name}
                </option>
              ))}
            </select>

            <div className="material-preview">
              <div className="material-preview-label">材料底色预览</div>
              <div className="material-preview-row">
                <div
                  className="material-color-preview"
                  style={{ backgroundColor: currentMaterialInfo.baseColor }}
                />
                <div className="material-info">
                  <span className="material-name">{currentMaterialInfo.name}</span>
                  <span className="dry-time">干燥时间: {currentMaterialInfo.dryTime}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="slider-header">
              <label htmlFor="fill-level">填充程度</label>
              <span className="slider-value">{repairParams.fillLevel}%</span>
            </div>
            <div className="slider-container">
              <input
                id="fill-level"
                type="range"
                min="0"
                max="100"
                step="5"
                value={repairParams.fillLevel}
                onChange={handleFillLevelChange}
                className="form-slider"
                style={{
                  background: `linear-gradient(to right, ${diseaseColor} 0%, #FFD700 ${repairParams.fillLevel}%, #3d2817 ${repairParams.fillLevel}%, #3d2817 100%)`
                }}
              />
              <div className="slider-marks">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {highlightedDisease && (
            <div className="highlighted-info">
              <h4>当前选中: {highlightedDisease.name}</h4>
              <p>推荐修复: {highlightedDisease.repairMethod}</p>
            </div>
          )}

          <div className="repair-summary">
            <h4>修复方案摘要</h4>
            <div className="summary-row">
              <span>材料:</span>
              <span>{currentMaterialInfo.name}</span>
            </div>
            <div className="summary-row">
              <span>填充度:</span>
              <span>{repairParams.fillLevel}%</span>
            </div>
            <div className="summary-row">
              <span>预计干燥:</span>
              <span>{currentMaterialInfo.dryTime}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RepairPanel
