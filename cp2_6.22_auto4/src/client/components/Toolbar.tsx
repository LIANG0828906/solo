import { ToolSettings } from '../../shared/types';

interface ToolbarProps {
  toolSettings: ToolSettings;
  onToolChange: (settings: ToolSettings) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  toolSettings,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  fontSize,
  onFontSizeChange,
}) => {
  const colors = [
    '#E53935',
    '#FB8C00',
    '#FDD835',
    '#43A047',
    '#1E88E5',
    '#8E24AA',
    '#212121',
    '#FFFFFF',
  ];

  const brushSizes = [
    { label: '细', value: 2 },
    { label: '中', value: 5 },
    { label: '粗', value: 12 },
  ];

  const fontSizes = [12, 16, 20, 24, 28];

  const showTextOptions = toolSettings.type === 'text';

  return (
    <div className="toolbar-container">
      <div className="toolbar-section">
        <div className="section-label">工具</div>
        <div className="tool-buttons">
          <button
            className={`tool-btn ${toolSettings.type === 'pen' ? 'active' : ''}`}
            onClick={() => onToolChange({ ...toolSettings, type: 'pen' })}
            title="画笔"
          >
            ✏️
          </button>
          <button
            className={`tool-btn ${toolSettings.type === 'eraser' ? 'active' : ''}`}
            onClick={() => onToolChange({ ...toolSettings, type: 'eraser' })}
            title="橡皮擦"
          >
            🧹
          </button>
          <button
            className={`tool-btn ${toolSettings.type === 'text' ? 'active' : ''}`}
            onClick={() => onToolChange({ ...toolSettings, type: 'text' })}
            title="文本"
          >
            T
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <div className="section-label">颜色</div>
        <div className="color-picker">
          {colors.map((color) => (
            <button
              key={color}
              className={`color-btn ${toolSettings.color === color && (toolSettings.type === 'pen' || toolSettings.type === 'text') ? 'selected' : ''}`}
              style={{
                backgroundColor: color,
                border: color === '#FFFFFF' ? '2px solid #e0e0e0' : 'none',
              }}
              onClick={() => onToolChange({ ...toolSettings, color, type: toolSettings.type === 'eraser' ? 'pen' : toolSettings.type })}
              title={color}
            />
          ))}
        </div>
      </div>

      {showTextOptions ? (
        <div className="toolbar-section">
          <div className="section-label">字号</div>
          <div className="font-sizes">
            {fontSizes.map((size) => (
              <button
                key={size}
                className={`font-size-btn ${fontSize === size ? 'active' : ''}`}
                onClick={() => onFontSizeChange(size)}
                title={`${size}px`}
              >
                <span style={{ fontSize: size }}>A</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="toolbar-section">
          <div className="section-label">笔刷</div>
          <div className="brush-sizes">
            {brushSizes.map((size) => (
              <button
                key={size.value}
                className={`size-btn ${toolSettings.size === size.value ? 'active' : ''}`}
                onClick={() => onToolChange({ ...toolSettings, size: size.value })}
                title={size.label}
              >
                <span
                  className="size-dot"
                  style={{ width: size.value * 2, height: size.value * 2 }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="toolbar-section">
        <div className="section-label">操作</div>
        <div className="action-buttons">
          <button
            className={`action-btn ${!canUndo ? 'disabled' : ''}`}
            onClick={onUndo}
            disabled={!canUndo}
            title="撤销"
          >
            ↩️
          </button>
          <button
            className={`action-btn ${!canRedo ? 'disabled' : ''}`}
            onClick={onRedo}
            disabled={!canRedo}
            title="重做"
          >
            ↪️
          </button>
          <button className="action-btn clear-btn" onClick={onClear} title="清空画布">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
