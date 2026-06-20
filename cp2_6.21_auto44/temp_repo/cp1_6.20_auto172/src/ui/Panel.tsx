import React from 'react'
import { FieldType } from '../utils/physics'
import { Preset } from '../App'

interface PanelProps {
  fieldType: FieldType
  strength: number
  direction: { x: number; y: number; z: number }
  trailLength: number
  presets: Preset[]
  onFieldTypeChange: (type: FieldType) => void
  onStrengthChange: (value: number) => void
  onDirectionChange: (axis: 'x' | 'y' | 'z', value: number) => void
  onTrailLengthChange: (value: number) => void
  onReset: () => void
  onSavePreset: () => void
  onLoadPreset: (id: string) => void
  onDeletePreset: (id: string) => void
}

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: '4px',
  appearance: 'none',
  background: 'rgba(74, 158, 255, 0.2)',
  borderRadius: '2px',
  outline: 'none',
  cursor: 'pointer',
}

const Panel: React.FC<PanelProps> = ({
  fieldType,
  strength,
  direction,
  trailLength,
  presets,
  onFieldTypeChange,
  onStrengthChange,
  onDirectionChange,
  onTrailLengthChange,
  onReset,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}) => {
  const fieldTypeLabels: Record<FieldType, string> = {
    gravity: '重力场',
    magnetic: '均匀磁场',
    electric: '点电荷电场',
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div style={panelStyle}>
      <h2 style={titleStyle}>粒子场模拟器</h2>

      <div style={sectionStyle}>
        <label style={labelStyle}>场类型</label>
        <select
          value={fieldType}
          onChange={(e) => onFieldTypeChange(e.target.value as FieldType)}
          style={selectStyle}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#4a9eff')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.3)')}
        >
          <option value="gravity">{fieldTypeLabels.gravity}</option>
          <option value="magnetic">{fieldTypeLabels.magnetic}</option>
          <option value="electric">{fieldTypeLabels.electric}</option>
        </select>
      </div>

      <div style={sectionStyle}>
        <div style={labelRowStyle}>
          <label style={labelStyle}>场强度</label>
          <span style={valueStyle}>{strength}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={strength}
          onChange={(e) => onStrengthChange(Number(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>场方向</label>

        <div style={sliderGroupStyle}>
          <div style={sliderRowStyle}>
            <span style={{ ...axisLabelStyle, color: '#ff6b6b' }}>X</span>
            <input
              type="range"
              min={-100}
              max={100}
              value={direction.x}
              onChange={(e) => onDirectionChange('x', Number(e.target.value))}
              style={{ ...sliderStyle, flex: 1 }}
            />
            <span style={valueStyle}>{direction.x}</span>
          </div>

          <div style={sliderRowStyle}>
            <span style={{ ...axisLabelStyle, color: '#51cf66' }}>Y</span>
            <input
              type="range"
              min={-100}
              max={100}
              value={direction.y}
              onChange={(e) => onDirectionChange('y', Number(e.target.value))}
              style={{ ...sliderStyle, flex: 1 }}
            />
            <span style={valueStyle}>{direction.y}</span>
          </div>

          <div style={sliderRowStyle}>
            <span style={{ ...axisLabelStyle, color: '#4dabf7' }}>Z</span>
            <input
              type="range"
              min={-100}
              max={100}
              value={direction.z}
              onChange={(e) => onDirectionChange('z', Number(e.target.value))}
              style={{ ...sliderStyle, flex: 1 }}
            />
            <span style={valueStyle}>{direction.z}</span>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelRowStyle}>
          <label style={labelStyle}>尾迹长度</label>
          <span style={valueStyle}>{trailLength}帧</span>
        </div>
        <input
          type="range"
          min={10}
          max={50}
          value={trailLength}
          onChange={(e) => onTrailLengthChange(Number(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={buttonGroupStyle}>
        <button onClick={onReset} style={primaryButtonStyle}>
          重置粒子
        </button>
        <button onClick={onSavePreset} style={primaryButtonStyle}>
          保存预设
        </button>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>已保存预设 ({presets.length}/3)</label>
        <div style={presetListStyle}>
          {presets.length === 0 && (
            <div style={emptyPresetStyle}>暂无保存的预设</div>
          )}
          {presets.map((preset) => (
            <div key={preset.id} style={presetItemStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={presetNameStyle}>{preset.name}</div>
                <div style={presetMetaStyle}>
                  {fieldTypeLabels[preset.fieldType]} · 强度{preset.strength} ·{' '}
                  {formatTime(preset.timestamp)}
                </div>
              </div>
              <div style={presetActionsStyle}>
                <button
                  onClick={() => onLoadPreset(preset.id)}
                  style={smallButtonStyle}
                >
                  加载
                </button>
                <button
                  onClick={() => onDeletePreset(preset.id)}
                  style={{ ...smallButtonStyle, background: 'rgba(255, 77, 79, 0.3)' }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={tipStyle}>
        提示：拖拽旋转视角，滚轮缩放，点击粒子查看速度向量和坐标
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 20,
  right: 20,
  width: 320,
  maxHeight: 'calc(100vh - 40px)',
  padding: '20px',
  background: 'rgba(20, 25, 40, 0.75)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  borderRadius: '12px',
  border: '1px solid rgba(74, 158, 255, 0.2)',
  color: '#fff',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  overflowY: 'auto',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  zIndex: 10,
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  fontSize: '18px',
  fontWeight: 600,
  background: 'linear-gradient(135deg, #4a9eff, #7b2ff7)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'rgba(255, 255, 255, 0.85)',
}

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const valueStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#4a9eff',
  fontFamily: "'Courier New', monospace",
  fontWeight: 600,
  minWidth: '40px',
  textAlign: 'right',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(15, 20, 35, 0.8)',
  color: '#fff',
  border: '1px solid rgba(74, 158, 255, 0.3)',
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'pointer',
  outline: 'none',
  transition: 'border-color 200ms ease',
}

const sliderGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const sliderRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

const axisLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  width: '16px',
}

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '16px',
}

const primaryButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  background: 'linear-gradient(135deg, #4a9eff, #7b2ff7)',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 200ms ease',
  boxShadow: '0 0 0 rgba(74, 158, 255, 0)',
}

const presetListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const emptyPresetStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'center',
  color: 'rgba(255, 255, 255, 0.4)',
  fontSize: '12px',
  border: '1px dashed rgba(255, 255, 255, 0.1)',
  borderRadius: '6px',
}

const presetItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  background: 'rgba(15, 20, 35, 0.6)',
  border: '1px solid rgba(74, 158, 255, 0.15)',
  borderRadius: '6px',
  transition: 'border-color 200ms ease',
}

const presetNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#fff',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const presetMetaStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(255, 255, 255, 0.5)',
  marginTop: '2px',
}

const presetActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexShrink: 0,
}

const smallButtonStyle: React.CSSProperties = {
  padding: '5px 10px',
  background: 'rgba(74, 158, 255, 0.25)',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '11px',
  cursor: 'pointer',
  transition: 'background 200ms ease',
}

const tipStyle: React.CSSProperties = {
  marginTop: '8px',
  padding: '10px 12px',
  fontSize: '11px',
  color: 'rgba(255, 255, 255, 0.4)',
  lineHeight: 1.5,
  borderLeft: '2px solid rgba(74, 158, 255, 0.4)',
}

const responsiveStyle = document.createElement('style')
responsiveStyle.textContent = `
  @media (max-width: 768px) {
    [data-panel] {
      top: auto !important;
      right: 0 !important;
      bottom: 0 !important;
      left: 0 !important;
      width: 100% !important;
      max-height: 30vh !important;
      border-radius: 12px 12px 0 0 !important;
    }
    [data-scene-container] {
      height: 70% !important;
    }
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background: linear-gradient(135deg, #4a9eff, #7b2ff7);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(74, 158, 255, 0.6);
  }
  input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: linear-gradient(135deg, #4a9eff, #7b2ff7);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 8px rgba(74, 158, 255, 0.6);
  }
  button:hover {
    box-shadow: 0 0 12px rgba(74, 158, 255, 0.5) !important;
    transform: translateY(-1px);
  }
  button:active {
    transform: translateY(0);
  }
  select:focus {
    border-color: #4a9eff !important;
    box-shadow: 0 0 8px rgba(74, 158, 255, 0.3);
  }
`
document.head.appendChild(responsiveStyle)

export default Panel
