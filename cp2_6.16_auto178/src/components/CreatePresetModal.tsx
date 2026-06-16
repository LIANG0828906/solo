import { useState, useEffect } from 'react'
import { useAudioStore, type Preset } from '../store/audioStore'
import { type NoiseType } from '../audio/engine'
import './CreatePresetModal.css'

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (value: number) => void
}

function SliderRow({ label, value, min, max, unit, onChange }: SliderRowProps) {
  const percent = ((value - min) / (max - min)) * 100

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  return (
    <div className="modal-slider-row">
      <span className="modal-slider-label">{label}</span>
      <div className="modal-slider-wrap">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          className="modal-slider"
          style={{
            background: `linear-gradient(to right, #58A6FF 0%, #58A6FF ${percent}%, #21262d ${percent}%, #21262d 100%)`,
          }}
        />
      </div>
      <span className="modal-slider-value">{value}{unit}</span>
    </div>
  )
}

export function CreatePresetModal() {
  const { isCreateModalOpen, closeCreateModal, addPreset } = useAudioStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [leftFrequency, setLeftFrequency] = useState(200)
  const [rightFrequency, setRightFrequency] = useState(205)
  const [noiseType, setNoiseType] = useState<NoiseType>('none')
  const [reverbDepth, setReverbDepth] = useState(30)
  const [volume, setVolume] = useState(0.5)

  useEffect(() => {
    if (isCreateModalOpen) {
      setName('')
      setDescription('')
      setLeftFrequency(200)
      setRightFrequency(205)
      setNoiseType('none')
      setReverbDepth(30)
      setVolume(0.5)
    }
  }, [isCreateModalOpen])

  const handleSave = () => {
    if (!name.trim()) return

    addPreset({
      name: name.trim(),
      description: description.trim() || '自定义模式',
      leftFrequency,
      rightFrequency,
      noiseType,
      reverbDepth,
      volume,
    })

    closeCreateModal()
  }

  if (!isCreateModalOpen) return null

  const noiseOptions: { type: NoiseType; label: string; icon: string }[] = [
    { type: 'none', label: '无', icon: '🔇' },
    { type: 'rain', label: '雨声', icon: '🌧️' },
    { type: 'fan', label: '风扇', icon: '🌀' },
    { type: 'ocean', label: '海浪', icon: '🌊' },
  ]

  return (
    <div className="modal-overlay" onClick={closeCreateModal}>
      <div
        className="modal-content slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>创建新混合模式</h2>
          <button className="modal-close-btn" onClick={closeCreateModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>模式名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入模式名称"
              className="modal-input"
            />
          </div>

          <div className="form-group">
            <label>描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简短描述"
              className="modal-input"
            />
          </div>

          <div className="form-section">
            <h3>频率设置</h3>
            <SliderRow
              label="左声道"
              value={leftFrequency}
              min={20}
              max={2000}
              unit="Hz"
              onChange={setLeftFrequency}
            />
            <SliderRow
              label="右声道"
              value={rightFrequency}
              min={20}
              max={2000}
              unit="Hz"
              onChange={setRightFrequency}
            />
          </div>

          <div className="form-section">
            <h3>白噪音</h3>
            <div className="noise-options">
              {noiseOptions.map((option) => (
                <button
                  key={option.type}
                  className={`noise-option-btn ${noiseType === option.type ? 'active' : ''}`}
                  onClick={() => setNoiseType(option.type)}
                >
                  <span className="noise-option-icon">{option.icon}</span>
                  <span className="noise-option-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>混响与音量</h3>
            <SliderRow
              label="混响深度"
              value={reverbDepth}
              min={0}
              max={100}
              unit="%"
              onChange={setReverbDepth}
            />
            <SliderRow
              label="音量"
              value={Math.round(volume * 100)}
              min={0}
              max={100}
              unit="%"
              onChange={(v) => setVolume(v / 100)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={closeCreateModal}>
            取消
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
