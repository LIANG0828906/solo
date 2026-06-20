import { useAppStore } from '../store/useAppStore';

const moduleTypeLabels: Record<string, string> = {
  util: '工具函数',
  business: '业务逻辑',
  ui: 'UI组件',
};

const moduleTypeColors: Record<string, string> = {
  util: '#6BCB77',
  business: '#4ECDC4',
  ui: '#FFD93D',
};

const nodeTypeLabels: Record<string, string> = {
  function: '函数',
  class: '类',
  module: '模块',
};

export function InfoCard() {
  const { selectedNode, setSelectedNode } = useAppStore();

  if (!selectedNode) return null;

  const handleClose = () => {
    setSelectedNode(null);
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={titleContainerStyle}>
            <span
              style={{
                ...typeBadgeStyle,
                backgroundColor: moduleTypeColors[selectedNode.moduleType] + '20',
                color: moduleTypeColors[selectedNode.moduleType],
              }}
            >
              {moduleTypeLabels[selectedNode.moduleType]}
            </span>
            <span style={nameStyle}>{selectedNode.name}</span>
          </div>
          <button style={closeButtonStyle} onClick={handleClose}>
            ×
          </button>
        </div>

        <div style={metaStyle}>
          <div style={metaItemStyle}>
            <span style={metaLabelStyle}>类型</span>
            <span style={metaValueStyle}>{nodeTypeLabels[selectedNode.type]}</span>
          </div>
          <div style={metaItemStyle}>
            <span style={metaLabelStyle}>调用次数</span>
            <span style={metaValueStyle}>{selectedNode.callCount}</span>
          </div>
        </div>

        <div style={codeSectionStyle}>
          <div style={codeHeaderStyle}>
            <span style={codeTitleStyle}>代码片段</span>
          </div>
          <div style={codeContainerStyle}>
            <pre style={codeStyle}>
              <code>{selectedNode.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  right: 20,
  top: 20,
  width: 420,
  zIndex: 100,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(26, 26, 46, 0.95)',
  borderRadius: 12,
  border: '1px solid #2A2A44',
  overflow: 'hidden',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid #2A2A44',
};

const titleContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flex: 1,
  minWidth: 0,
};

const typeBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  flexShrink: 0,
};

const nameStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#ffffff',
  fontFamily: 'monospace',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const closeButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  backgroundColor: 'transparent',
  border: 'none',
  color: '#A0A0B0',
  fontSize: 20,
  cursor: 'pointer',
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  marginLeft: 8,
  flexShrink: 0,
};

const metaStyle: React.CSSProperties = {
  display: 'flex',
  gap: 20,
  padding: '12px 20px',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
};

const metaItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#606080',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const metaValueStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#E0E0E0',
  fontWeight: 500,
};

const codeSectionStyle: React.CSSProperties = {
  maxHeight: 380,
  display: 'flex',
  flexDirection: 'column',
};

const codeHeaderStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  borderBottom: '1px solid #2A2A44',
};

const codeTitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#A0A0B0',
  fontWeight: 500,
};

const codeContainerStyle: React.CSSProperties = {
  maxHeight: 340,
  overflowY: 'auto',
  padding: 16,
};

const codeStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.6,
  color: '#C0C0D0',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
};
