import { useState } from 'react';
import { CYBER_COLORS } from '../types';

interface ControlPanelProps {
  onAddNode: () => void;
  entanglementStrength: number;
  onStrengthChange: (value: number) => void;
  onResetCamera: () => void;
  nodeCount: number;
  connectionCount: number;
}

export default function ControlPanel({
  onAddNode,
  entanglementStrength,
  onStrengthChange,
  onResetCamera,
  nodeCount,
  connectionCount,
}: ControlPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddNode = () => {
    setIsGenerating(true);
    onAddNode();
    setTimeout(() => setIsGenerating(false), 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: '24px',
        bottom: '24px',
        width: '320px',
        padding: '24px',
        background: CYBER_COLORS.panelBg,
        border: `1px solid ${CYBER_COLORS.borderColor}`,
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 0 30px ${CYBER_COLORS.neonPurple}30, 0 0 60px ${CYBER_COLORS.neonCyan}10`,
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: CYBER_COLORS.neonCyan,
          marginBottom: '20px',
          textShadow: `0 0 10px ${CYBER_COLORS.neonCyan}80`,
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '24px' }}>⚛</span>
        量子控制面板
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            border: `1px solid ${CYBER_COLORS.neonPurple}40`,
          }}
        >
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
            节点数量
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: CYBER_COLORS.neonPurple,
              textShadow: `0 0 10px ${CYBER_COLORS.neonPurple}80`,
            }}
          >
            {nodeCount}
          </div>
        </div>
        <div
          style={{
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            border: `1px solid ${CYBER_COLORS.neonCyan}40`,
          }}
        >
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
            纠缠连接
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: CYBER_COLORS.neonCyan,
              textShadow: `0 0 10px ${CYBER_COLORS.neonCyan}80`,
            }}
          >
            {connectionCount}
          </div>
        </div>
      </div>

      <button
        onClick={handleAddNode}
        disabled={isGenerating}
        style={{
          width: '100%',
          padding: '14px 20px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#fff',
          background: `linear-gradient(135deg, ${CYBER_COLORS.neonPurple}, ${CYBER_COLORS.neonCyan})`,
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          letterSpacing: '1px',
          transition: 'all 0.3s ease',
          boxShadow: `0 0 20px ${CYBER_COLORS.neonPurple}60`,
          opacity: isGenerating ? 0.7 : 1,
          transform: isGenerating ? 'scale(0.98)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = `0 0 30px ${CYBER_COLORS.neonPurple}90`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 0 20px ${CYBER_COLORS.neonPurple}60`;
        }}
      >
        ⚡ 生成量子节点
      </button>

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              color: '#ccc',
              fontWeight: '500',
            }}
          >
            🔗 纠缠强度
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: CYBER_COLORS.neonCyan,
              textShadow: `0 0 8px ${CYBER_COLORS.neonCyan}80`,
            }}
          >
            {(entanglementStrength * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={entanglementStrength}
          onChange={(e) => onStrengthChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: `linear-gradient(90deg, ${CYBER_COLORS.neonPurple}, ${CYBER_COLORS.neonCyan})`,
            outline: 'none',
            WebkitAppearance: 'none',
            appearance: 'none',
            cursor: 'pointer',
          }}
        />
        <style>
          {`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: ${CYBER_COLORS.neonCyan};
              cursor: pointer;
              box-shadow: 0 0 15px ${CYBER_COLORS.neonCyan};
              border: 2px solid #fff;
            }
            input[type="range"]::-moz-range-thumb {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: ${CYBER_COLORS.neonCyan};
              cursor: pointer;
              box-shadow: 0 0 15px ${CYBER_COLORS.neonCyan};
              border: 2px solid #fff;
            }
          `}
        </style>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '6px',
            fontSize: '10px',
            color: '#666',
          }}
        >
          <span>弱</span>
          <span>强</span>
        </div>
      </div>

      <button
        onClick={onResetCamera}
        style={{
          width: '100%',
          padding: '12px 20px',
          fontSize: '13px',
          color: CYBER_COLORS.neonCyan,
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${CYBER_COLORS.neonCyan}60`,
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${CYBER_COLORS.neonCyan}20`;
          e.currentTarget.style.boxShadow = `0 0 15px ${CYBER_COLORS.neonCyan}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        🎯 重置视角
      </button>

      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#666',
          lineHeight: '1.6',
        }}
      >
        <div style={{ color: CYBER_COLORS.neonPurple, marginBottom: '6px', fontWeight: 'bold' }}>
          💡 操作提示
        </div>
        <div>• 点击按钮生成量子节点</div>
        <div>• 拖拽节点可移动位置</div>
        <div>• 先点击一个节点，再点击另一个节点建立连接</div>
        <div>• 直接点击节点触发坍缩效果</div>
        <div>• 鼠标滚轮/右键拖动控制视角</div>
      </div>
    </div>
  );
}
