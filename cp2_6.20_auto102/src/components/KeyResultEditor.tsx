import { useState } from 'react'
import { Objective, KeyResult, useOKRStore } from '../store/okrStore'

interface KeyResultEditorProps {
  objective: Objective
  onClose: () => void
}

export default function KeyResultEditor({ objective, onClose }: KeyResultEditorProps) {
  const { updateObjective, broadcastUpdate, addToast } = useOKRStore()
  const [keyResults, setKeyResults] = useState<KeyResult[]>(
    objective.keyResults.map((kr) => ({ ...kr }))
  )
  const [isSaving, setIsSaving] = useState(false)

  const handleKRChange = (index: number, field: keyof KeyResult, value: string | number) => {
    const updated = [...keyResults]
    updated[index] = { ...updated[index], [field]: value }
    setKeyResults(updated)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateObjective(objective.id, { keyResults })
      const updatedData = { ...objective, keyResults }
      const broadcastOk = broadcastUpdate('objective_updated', updatedData)
      if (!broadcastOk) {
        addToast('数据已保存，但实时广播未成功')
      }
      onClose()
    } catch (e) {
      addToast('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{objective.name} - 关键结果编辑</div>
        {keyResults.map((kr, index) => (
          <div key={kr.id} className="kr-form-row">
            <div className="kr-form-label">{kr.name}</div>
            <div className="kr-form-inputs">
              <div>
                <div className="input-label">目标值</div>
                <input
                  className="form-input"
                  type="number"
                  value={kr.targetValue}
                  onChange={(e) => handleKRChange(index, 'targetValue', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <div className="input-label">当前值</div>
                <input
                  className="form-input"
                  type="number"
                  value={kr.currentValue}
                  onChange={(e) => handleKRChange(index, 'currentValue', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <div className="input-label">权重</div>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={100}
                  value={kr.weight}
                  onChange={(e) => handleKRChange(index, 'weight', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>
        ))}
        <button className="save-btn" onClick={handleSave} disabled={isSaving} style={{ opacity: isSaving ? 0.6 : 1 }}>
          {isSaving ? '保存中...' : '保存并广播'}
        </button>
      </div>
    </div>
  )
}
