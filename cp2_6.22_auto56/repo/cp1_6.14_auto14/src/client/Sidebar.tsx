import React, { useRef } from 'react';
import { CanvasElement, ColorSwatch, ImageElement, TextElement, DrawingElement } from '../shared/types';

interface SidebarProps {
  colorPalette: ColorSwatch[];
  selectedElement: CanvasElement | null;
  selectedElementId: string | null;
  onApplyColor: (color: string) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onImagesUpload: (files: FileList) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  colorPalette,
  selectedElement,
  selectedElementId,
  onApplyColor,
  onUpdateElement,
  onImagesUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImagesUpload(e.target.files);
      e.target.value = '';
    }
  };

  const handleSwatchClick = (hex: string) => {
    setSelectedColor(hex);
    if (selectedElementId) {
      onApplyColor(hex);
    }
  };

  const fontFamilies = [
    { value: 'sans-serif', label: '无衬线体' },
    { value: 'serif', label: '衬线体' },
    { value: 'monospace', label: '等宽字体' },
    { value: 'cursive', label: '手写体' }
  ];

  return (
    <div className="sidebar-content">
      <div className="section">
        <h3 className="section-title">上传素材</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="file-input"
          onChange={handleFileChange}
        />
        <button
          className="primary-btn"
          style={{ width: '100%' }}
          onClick={() => fileInputRef.current?.click()}
        >
          📷 上传图片 (最多20张)
        </button>
      </div>

      <div className="section">
        <h3 className="section-title">色板提取</h3>
        {colorPalette.length > 0 ? (
          <div className="swatch-grid">
            {colorPalette.map((color, index) => (
              <div
                key={`${color.hex}-${index}`}
                className={`swatch ${selectedColor === color.hex ? 'selected' : ''}`}
                style={{ backgroundColor: color.hex }}
                onClick={() => handleSwatchClick(color.hex)}
                title={`点击应用颜色 ${color.hex}`}
              >
                <span className="swatch-hex">{color.hex}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: '#a0aec0',
            fontSize: '13px',
            background: '#f7fafc',
            borderRadius: '8px'
          }}>
            双击画布上的图片<br />自动提取主色调
          </div>
        )}
        {selectedElement && selectedElement.type !== 'text' && colorPalette.length > 0 && (
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#718096',
            textAlign: 'center'
          }}>
            💡 先选中文字标签再点击色块应用颜色
          </div>
        )}
      </div>

      {selectedElement && (
        <div className="section">
          <h3 className="section-title">元素属性</h3>

          <div className="form-group">
            <label>名称</label>
            <input
              type="text"
              value={selectedElement.name}
              onChange={e => onUpdateElement(selectedElement.id, { name: e.target.value } as Partial<CanvasElement>)}
            />
          </div>

          <div className="form-group">
            <label>备注</label>
            <textarea
              rows={3}
              value={(selectedElement as any).note || ''}
              onChange={e => onUpdateElement(selectedElement.id, { note: e.target.value } as Partial<CanvasElement>)}
            />
          </div>

          {selectedElement.type === 'text' && (
            <>
              <div className="form-group">
                <label>文字内容</label>
                <textarea
                  rows={2}
                  value={(selectedElement as TextElement).text}
                  onChange={e => onUpdateElement(selectedElement.id, { text: e.target.value } as Partial<CanvasElement>)}
                />
              </div>

              <div className="form-group">
                <label>字号: {(selectedElement as TextElement).fontSize}px</label>
                <input
                  type="range"
                  min="10"
                  max="72"
                  value={(selectedElement as TextElement).fontSize}
                  onChange={e => onUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) } as Partial<CanvasElement>)}
                />
              </div>

              <div className="form-group">
                <label>字体</label>
                <select
                  value={(selectedElement as TextElement).fontFamily}
                  onChange={e => onUpdateElement(selectedElement.id, { fontFamily: e.target.value } as Partial<CanvasElement>)}
                >
                  {fontFamilies.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>文字颜色</label>
                <input
                  type="color"
                  value={(selectedElement as TextElement).color}
                  onChange={e => onUpdateElement(selectedElement.id, { color: e.target.value } as Partial<CanvasElement>)}
                  style={{ width: '100%', height: '36px', cursor: 'pointer', borderRadius: '6px' }}
                />
              </div>
            </>
          )}

          {selectedElement.type === 'image' && (
            <>
              <div className="form-group">
                <label>宽度: {Math.round((selectedElement as ImageElement).width)}px</label>
                <input
                  type="range"
                  min="50"
                  max="800"
                  value={(selectedElement as ImageElement).width}
                  onChange={e => {
                    const newWidth = Number(e.target.value);
                    const ratio = newWidth / (selectedElement as ImageElement).width;
                    onUpdateElement(selectedElement.id, {
                      width: newWidth,
                      height: (selectedElement as ImageElement).height * ratio
                    } as Partial<CanvasElement>);
                  }}
                />
              </div>

              <div className="form-group">
                <label>旋转: {Math.round((selectedElement as ImageElement).rotation || 0)}°</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={(selectedElement as ImageElement).rotation || 0}
                  onChange={e => onUpdateElement(selectedElement.id, { rotation: Number(e.target.value) } as Partial<CanvasElement>)}
                />
              </div>

              <button
                className="secondary-btn"
                style={{ width: '100%', marginTop: '8px' }}
                onClick={() => {
                  // 触发色板提取，通过 doubleClick 的方式
                  const event = new MouseEvent('dblclick', { bubbles: true });
                  const el = document.querySelector(`[data-element-id="${selectedElement.id}"]`);
                  if (el) el.dispatchEvent(event);
                }}
              >
                🎨 提取此图片色板
              </button>
            </>
          )}

          {selectedElement.type === 'drawing' && (
            <div className="form-group">
              <label>宽度: {Math.round((selectedElement as DrawingElement).width)}px</label>
              <input
                type="range"
                min="50"
                max="800"
                value={(selectedElement as DrawingElement).width}
                onChange={e => {
                  const newWidth = Number(e.target.value);
                  const ratio = newWidth / (selectedElement as DrawingElement).width;
                  onUpdateElement(selectedElement.id, {
                    width: newWidth,
                    height: (selectedElement as DrawingElement).height * ratio
                  } as Partial<CanvasElement>);
                }}
              />
            </div>
          )}

          <button
            className="secondary-btn"
            style={{
              width: '100%',
              marginTop: '16px',
              color: '#e53e3e',
              borderColor: '#fed7d7',
              background: '#fff5f5'
            }}
            onClick={() => {
              // 通过父组件删除，这里用自定义事件或者直接调用
              window.dispatchEvent(new CustomEvent('delete-element', { detail: selectedElement.id }));
            }}
          >
            🗑️ 删除此元素
          </button>
        </div>
      )}

      {!selectedElement && (
        <div className="section">
          <h3 className="section-title">操作提示</h3>
          <div style={{
            padding: '16px',
            background: '#f7fafc',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#4a5568',
            lineHeight: '1.8'
          }}>
            <p>👆 <strong>选择工具</strong>: 拖拽移动元素</p>
            <p>🖱️ <strong>缩放</strong>: 拖动四角控制点</p>
            <p>🔄 <strong>旋转</strong>: 拖动顶部旋转按钮</p>
            <p>T <strong>文字</strong>: 点击画布添加文字</p>
            <p>✏️ <strong>画笔</strong>: 直接在画布上绘制</p>
            <p>🧽 <strong>橡皮</strong>: 擦除绘制内容</p>
            <p style={{ marginTop: '12px', color: '#718096', fontSize: '12px' }}>
              按 <kbd style={{ padding: '2px 6px', background: 'white', borderRadius: '3px', border: '1px solid #e2e8f0' }}>空格</kbd> 切换预览模式
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
