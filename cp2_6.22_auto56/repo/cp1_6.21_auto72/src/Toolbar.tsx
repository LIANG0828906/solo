import React from 'react';

export type ToolType = 'brush' | 'eraser';
export type SymmetryType = 'none' | 'horizontal' | 'vertical' | 'center';

const PRESET_COLORS = [
  '#ff0000',
  '#ff8800',
  '#ffdd00',
  '#00cc44',
  '#0066ff',
  '#8800ff',
  '#ffffff',
  '#000000',
];

interface ToolbarProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  selectedTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  symmetry: SymmetryType;
  onSymmetryChange: (symmetry: SymmetryType) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedColor,
  onColorChange,
  selectedTool,
  onToolChange,
  symmetry,
  onSymmetryChange,
}) => {
  const toolbarStyle: React.CSSProperties = {
    width: '20%',
    minWidth: 240,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#aaaaaa',
    marginBottom: 4,
  };

  const buttonBaseStyle: React.CSSProperties = {
    height: 36,
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 500,
    transition: 'background-color 0.2s ease',
    backgroundColor: '#3a3a3a',
  };

  const toolButtonsContainer: React.CSSProperties = {
    display: 'flex',
    gap: 8,
  };

  const getToolButtonStyle = (isActive: boolean): React.CSSProperties => ({
    ...buttonBaseStyle,
    flex: 1,
    backgroundColor: isActive ? '#333333' : '#3a3a3a',
    color: isActive ? '#ffffff' : '#cccccc',
  });

  const colorsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 2,
  };

  const getColorBlockStyle = (color: string, isSelected: boolean): React.CSSProperties => ({
    height: 36,
    borderRadius: 4,
    backgroundColor: color,
    cursor: 'pointer',
    border: isSelected ? `2px solid #ffffff` : '2px solid transparent',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  });

  const customColorInputStyle: React.CSSProperties = {
    width: '100%',
    height: 36,
    borderRadius: 4,
    border: '1px solid #444444',
    backgroundColor: '#3a3a3a',
    cursor: 'pointer',
    padding: 0,
  };

  const symmetryButtonsContainer: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const getSymmetryButtonStyle = (value: SymmetryType): React.CSSProperties => {
    const isActive = symmetry === value;
    return {
      ...buttonBaseStyle,
      textAlign: 'left',
      padding: '0 12px',
      backgroundColor: isActive ? '#333333' : '#3a3a3a',
      color: isActive ? '#ffffff' : '#cccccc',
    };
  };

  const handleHover = (e: React.MouseEvent<HTMLButtonElement>, enter: boolean) => {
    const target = e.currentTarget;
    if (!target.style.backgroundColor.includes('#333333')) {
      target.style.backgroundColor = enter ? '#2a2a2a' : '#3a3a3a';
    }
  };

  return (
    <div style={toolbarStyle}>
      <div style={sectionStyle}>
        <div style={labelStyle}>工具</div>
        <div style={toolButtonsContainer}>
          <button
            style={getToolButtonStyle(selectedTool === 'brush')}
            onClick={() => onToolChange('brush')}
            onMouseEnter={(e) => handleHover(e, true)}
            onMouseLeave={(e) => handleHover(e, false)}
          >
            🖌 画笔
          </button>
          <button
            style={getToolButtonStyle(selectedTool === 'eraser')}
            onClick={() => onToolChange('eraser')}
            onMouseEnter={(e) => handleHover(e, true)}
            onMouseLeave={(e) => handleHover(e, false)}
          >
            🧽 橡皮
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>颜色选择</div>
        <div style={colorsGridStyle}>
          {PRESET_COLORS.map((color) => (
            <div
              key={color}
              style={getColorBlockStyle(color, selectedColor === color)}
              onClick={() => onColorChange(color)}
              title={color}
            />
          ))}
        </div>
        <label style={{ ...labelStyle, marginTop: 4 }}>自定义颜色</label>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          style={customColorInputStyle}
        />
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>对称模式</div>
        <div style={symmetryButtonsContainer}>
          {[
            { value: 'none' as SymmetryType, label: '关闭' },
            { value: 'horizontal' as SymmetryType, label: '水平对称' },
            { value: 'vertical' as SymmetryType, label: '垂直对称' },
            { value: 'center' as SymmetryType, label: '中心对称' },
          ].map(({ value, label }) => (
            <button
              key={value}
              style={getSymmetryButtonStyle(value)}
              onClick={() => onSymmetryChange(value)}
              onMouseEnter={(e) => handleHover(e, true)}
              onMouseLeave={(e) => handleHover(e, false)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
