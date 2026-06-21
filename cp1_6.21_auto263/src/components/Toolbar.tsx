import React, { useState } from 'react';

interface ToolbarProps {
  onAddRootNode: () => void;
  onDeleteSelected: () => void;
  onSave: () => void;
  onLoad: () => void;
  onExportPNG: () => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  hasSelection: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddRootNode,
  onDeleteSelected,
  onSave,
  onLoad,
  onExportPNG,
  scale,
  onScaleChange,
  hasSelection
}) => {
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const handleMouseDown = (buttonName: string) => {
    setPressedButton(buttonName);
  };

  const handleMouseUp = () => {
    setPressedButton(null);
  };

  const buttonStyle = (buttonName: string): React.CSSProperties => ({
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#3B82F6',
    color: '#F8FAFC',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    transform: pressedButton === buttonName ? 'scale(0.95)' : 'scale(1)',
    transitionDuration: pressedButton === buttonName ? '0.1s' : '0.2s'
  });

  const buttonHoverStyle: React.CSSProperties = {
    backgroundColor: '#2563EB'
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px'
  };

  return (
    <div style={{
      width: '25%',
      minWidth: '280px',
      backgroundColor: '#1E293B',
      borderRadius: '16px',
      padding: '24px',
      margin: '16px',
      marginLeft: '0',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
      overflowY: 'auto'
    }}>
      <div>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#F8FAFC',
          marginBottom: '4px'
        }}>
          思维导图
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#64748B'
        }}>
          创建、编辑和分享你的想法
        </p>
      </div>

      <div>
        <div style={sectionTitleStyle}>节点操作</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onAddRootNode}
            onMouseDown={() => handleMouseDown('addRoot')}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => {
              handleMouseUp();
              e.currentTarget.style.backgroundColor = '#3B82F6';
            }}
            style={buttonStyle('addRoot')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563EB';
            }}
          >
            + 添加根节点
          </button>
          <button
            onClick={onDeleteSelected}
            onMouseDown={() => handleMouseDown('delete')}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => {
              handleMouseUp();
              e.currentTarget.style.backgroundColor = hasSelection ? '#EF4444' : '#475569';
            }}
            style={{
              ...buttonStyle('delete'),
              backgroundColor: hasSelection ? '#EF4444' : '#475569',
              cursor: hasSelection ? 'pointer' : 'not-allowed',
              opacity: hasSelection ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (hasSelection) {
                e.currentTarget.style.backgroundColor = '#DC2626';
              }
            }}
            disabled={!hasSelection}
          >
            删除选中节点
          </button>
        </div>
      </div>

      <div>
        <div style={sectionTitleStyle}>视图控制</div>
        <div style={{
          backgroundColor: '#0F172A',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>缩放比例</span>
            <span style={{ fontSize: '13px', color: '#3B82F6', fontWeight: 600 }}>
              {Math.round(scale * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={scale}
            onChange={(e) => onScaleChange(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#475569',
              outline: 'none',
              WebkitAppearance: 'none',
              appearance: 'none',
              cursor: 'pointer'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '11px',
            color: '#64748B'
          }}>
            <span>50%</span>
            <span>200%</span>
          </div>
        </div>
      </div>

      <div>
        <div style={sectionTitleStyle}>保存分享</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onSave}
            onMouseDown={() => handleMouseDown('save')}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => {
              handleMouseUp();
              e.currentTarget.style.backgroundColor = '#3B82F6';
            }}
            style={buttonStyle('save')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563EB';
            }}
          >
            💾 保存
          </button>
          <button
            onClick={onLoad}
            onMouseDown={() => handleMouseDown('load')}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => {
              handleMouseUp();
              e.currentTarget.style.backgroundColor = '#3B82F6';
            }}
            style={buttonStyle('load')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563EB';
            }}
          >
            📂 加载
          </button>
          <button
            onClick={onExportPNG}
            onMouseDown={() => handleMouseDown('export')}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => {
              handleMouseUp();
              e.currentTarget.style.backgroundColor = '#3B82F6';
            }}
            style={buttonStyle('export')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563EB';
            }}
          >
            🖼️ 导出 PNG
          </button>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #334155' }}>
        <p style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.6 }}>
          💡 提示：双击节点编辑文字<br/>
          从节点边缘拖拽创建子节点<br/>
          滚轮缩放，右键拖拽平移
        </p>
      </div>
    </div>
  );
};

export default Toolbar;
