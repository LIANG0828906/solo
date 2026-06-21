import React from 'react';

interface ControlPanelProps {
  modelName: string;
  onModelChange: (name: string) => void;
  onForward: () => void;
  isInferencing: boolean;
  trueLabel: number;
  prediction: number | null;
  confidence: number | null;
  hasRun: boolean;
}

const layerInfoList = [
  { name: 'Conv1', type: 'conv', dim: '6×24×24', act: 'ReLU' },
  { name: 'MaxPool1', type: 'pool', dim: '6×12×12', act: '—' },
  { name: 'Conv2', type: 'conv', dim: '16×8×8', act: 'ReLU' },
  { name: 'MaxPool2', type: 'pool', dim: '16×4×4', act: '—' }
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  modelName,
  onModelChange,
  onForward,
  isInferencing,
  trueLabel,
  prediction,
  confidence,
  hasRun
}) => {
  const predLabel = prediction ?? '-';
  const confPct = confidence !== null ? (confidence * 100).toFixed(1) : '-';
  const isCorrect = hasRun && prediction !== null && prediction === trueLabel;

  return (
    <aside style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.5px' }}>
          <span style={{ color: '#E94560' }}>Feature</span>
          <span style={{ color: '#E0E0E0' }}>Viz Pro</span>
        </div>
        <div style={{ fontSize: '11px', color: '#8080A0', marginTop: '2px', fontFamily: "'JetBrains Mono', monospace" }}>
          CNN Feature Map Visualizer
        </div>
      </div>

      <div style={sectionDivider} />

      <div style={sectionStyle}>
        <label style={labelStyle}>模型选择</label>
        <select
          value={modelName}
          onChange={(e) => onModelChange(e.target.value)}
          style={selectStyle}
        >
          <option value="lenet5">LeNet-5 简化版</option>
        </select>
      </div>

      <div style={sectionStyle}>
        <button
          onClick={onForward}
          disabled={isInferencing}
          style={{
            ...forwardBtnStyle,
            background: isInferencing ? '#2A2A4E' : '#0F3460',
            cursor: isInferencing ? 'not-allowed' : 'pointer',
            opacity: isInferencing ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!isInferencing) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E94560';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#2A2A4E';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
          }}
          onMouseDown={(e) => {
            if (!isInferencing) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
            }
          }}
          onMouseUp={(e) => {
            if (!isInferencing) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }
          }}
        >
          <span style={{ marginRight: '6px', display: 'inline-block' }}>
            {isInferencing ? '⟳' : '▶'}
          </span>
          {isInferencing ? '推理计算中...' : '前向传播'}
        </button>
      </div>

      <div style={sectionDivider} />

      <div style={sectionStyle}>
        <div style={subHeaderStyle}>当前图片信息</div>
        <div style={infoCardStyle}>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>真实标签</span>
            <span style={{
              ...infoValueStyle,
              color: '#4FC3F7',
              fontSize: '24px',
              fontWeight: 700
            }}>
              {trueLabel}
            </span>
          </div>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>预测结果</span>
            <span style={{
              ...infoValueStyle,
              color: hasRun ? (isCorrect ? '#4CAF50' : '#E94560') : '#606080',
              fontSize: '24px',
              fontWeight: 700
            }}>
              {predLabel}{hasRun && (isCorrect ? ' ✓' : prediction !== null ? ' ✗' : '')}
            </span>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>置信度</span>
              <span style={{
                ...infoValueStyle,
                fontFamily: "'JetBrains Mono', monospace",
                color: confidence !== null ? '#FFD54F' : '#606080'
              }}>
                {confPct}%
              </span>
            </div>
            <div style={progressBarBgStyle}>
              <div
                style={{
                  ...progressBarFillStyle,
                  width: confidence !== null ? `${Math.max(4, confidence * 100)}%` : '0%',
                  background: isCorrect
                    ? 'linear-gradient(90deg, #0F3460, #4CAF50)'
                    : prediction !== null
                    ? 'linear-gradient(90deg, #0F3460, #E94560)'
                    : '#2A2A4E',
                  transition: 'width 0.5s ease-out, background 0.3s'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={sectionDivider} />

      <div style={sectionStyle}>
        <div style={subHeaderStyle}>网络结构</div>
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {layerInfoList.map((l, i) => (
            <div key={l.name} style={layerRowStyle}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: l.type === 'conv' ? '#0F3460' : '#3A2A4E',
                border: `1.5px solid ${l.type === 'conv' ? '#4FC3F7' : '#E94560'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: '#E0E0E0',
                flexShrink: 0
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, marginLeft: '10px', minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#E0E0E0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {l.name}
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    background: l.type === 'conv' ? 'rgba(79, 195, 247, 0.15)' : 'rgba(233, 69, 96, 0.15)',
                    color: l.type === 'conv' ? '#4FC3F7' : '#E94560',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {l.type}
                  </span>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#8080A0',
                  marginTop: '2px',
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {l.dim} · {l.act}
                </div>
              </div>
            </div>
          ))}
          <div style={layerRowStyle}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2E4A2E',
              border: '1.5px solid #4CAF50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: '#E0E0E0',
              flexShrink: 0
            }}>
              5
            </div>
            <div style={{ flex: 1, marginLeft: '10px', minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#E0E0E0' }}>
                FC + Softmax
              </div>
              <div style={{
                fontSize: '11px',
                color: '#8080A0',
                marginTop: '2px',
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                256 → 10 · 输出分类
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const panelStyle: React.CSSProperties = {
  width: '300px',
  minWidth: '300px',
  height: '100%',
  background: '#16213E',
  borderRight: '2px solid #2A2A4E',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px 18px',
  boxSizing: 'border-box',
  boxShadow: 'inset -2px 0 8px rgba(0,0,0,0.2)',
  color: '#E0E0E0',
  fontFamily: "'Segoe UI', 'JetBrains Mono', sans-serif",
  overflow: 'hidden'
};

const headerStyle: React.CSSProperties = {
  padding: '4px 0 8px 0'
};

const sectionDivider: React.CSSProperties = {
  height: '2px',
  background: '#2A2A4E',
  margin: '14px -18px',
  boxShadow: '0 1px 0 rgba(255,255,255,0.02)'
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '4px'
};

const subHeaderStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#8080A0',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '10px',
  paddingLeft: '2px'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#8080A0',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '13px',
  background: '#0F1A30',
  color: '#E0E0E0',
  border: '1.5px solid #2A2A4E',
  borderRadius: '4px',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: "'Segoe UI', sans-serif",
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
};

const forwardBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#E0E0E0',
  border: '1.5px solid #2A2A4E',
  borderRadius: '4px',
  fontFamily: "'Segoe UI', sans-serif",
  transition: 'all 0.15s ease-out',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  letterSpacing: '0.5px'
};

const infoCardStyle: React.CSSProperties = {
  background: '#0F1A30',
  border: '1px solid #2A2A4E',
  borderRadius: '6px',
  padding: '14px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#8080A0',
  textTransform: 'uppercase',
  letterSpacing: '0.8px'
};

const infoValueStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace"
};

const progressBarBgStyle: React.CSSProperties = {
  marginTop: '6px',
  height: '6px',
  background: '#0A1225',
  borderRadius: '3px',
  overflow: 'hidden',
  border: '1px solid #2A2A4E'
};

const progressBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.5s ease-out'
};

const layerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '9px 10px',
  background: '#0F1A30',
  border: '1px solid #2A2A4E',
  borderRadius: '5px',
  marginBottom: '8px',
  transition: 'border-color 0.2s'
};

export default ControlPanel;
