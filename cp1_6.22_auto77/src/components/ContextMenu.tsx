import React, { useEffect } from 'react';
import { PRESET_COLORS } from '../utils/colors';
import { useMindMap } from '../context/MindMapContext';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

interface Props {
  x: number;
  y: number;
  nodeId: string;
  isRoot: boolean;
  onClose: () => void;
}

export const ContextMenu: React.FC<Props> = ({ x, y, nodeId, isRoot, onClose }) => {
  const { addNode, deleteNode, updateNode, data } = useMindMap();
  const node = data?.nodes[nodeId];
  const [showColors, setShowColors] = React.useState(false);

  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('mousedown', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    padding: 6,
    minWidth: 180,
    zIndex: 9999,
    animation: `menuFadeIn 0.15s ${EASE} both`,
    userSelect: 'none',
  };

  const itemStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: '#333',
    transition: `background 0.15s ${EASE}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  };

  return (
    <div
      style={menuStyle}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        style={itemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4f8')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onClick={() => {
          addNode(nodeId);
          onClose();
        }}
      >
        <span>＋ 添加子节点</span>
      </div>

      {!isRoot && (
        <div
          style={{ ...itemStyle, color: '#e74c3c' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          onClick={() => {
            deleteNode(nodeId);
            onClose();
          }}
        >
          <span>🗑 删除节点</span>
        </div>
      )}

      <div
        style={{ ...itemStyle, position: 'relative' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4f8')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onClick={() => setShowColors((s) => !s)}
      >
        <span>🎨 更改颜色</span>
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: node?.colorTag || '#ccc',
            border: '1px solid #ddd',
          }}
        />
      </div>

      {showColors && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            padding: '8px 10px',
            borderTop: '1px solid #f0f0f0',
            marginTop: 4,
            animation: `fadeIn 0.15s ${EASE}`,
          }}
        >
          {PRESET_COLORS.map((c) => (
            <div
              key={c}
              title={c}
              onClick={() => {
                updateNode(nodeId, { colorTag: c });
                onClose();
              }}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: c,
                cursor: 'pointer',
                border: node?.colorTag === c ? '2px solid #333' : '2px solid #fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                transition: `transform 0.15s ${EASE}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes menuFadeIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
