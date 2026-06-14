import type { TextStyle, Sticker } from '@/types';
import { FONT_OPTIONS, EMOJI_STICKERS, SHAPE_STICKERS } from '@/types';

interface ToolBarProps {
  topText: TextStyle;
  bottomText: TextStyle;
  selectedTextType: 'top' | 'bottom' | null;
  onTopTextChange: (style: Partial<TextStyle>) => void;
  onBottomTextChange: (style: Partial<TextStyle>) => void;
  onAddSticker: (type: 'emoji' | 'shape', content: string) => void;
  selectedSticker: Sticker | null;
  onUpdateSticker: (id: string, updates: Partial<Sticker>) => void;
  onDeleteSticker: (id: string) => void;
  onMoveStickerLayer: (id: string, direction: 'up' | 'down') => void;
  stickers: Sticker[];
}

export default function ToolBar({
  topText,
  bottomText,
  selectedTextType,
  onTopTextChange,
  onBottomTextChange,
  onAddSticker,
  selectedSticker,
  onUpdateSticker,
  onDeleteSticker,
  onMoveStickerLayer,
  stickers,
}: ToolBarProps) {
  const activeText = selectedTextType === 'top' ? topText : bottomText;
  const onActiveTextChange = selectedTextType === 'top' ? onTopTextChange : onBottomTextChange;

  const selectedIndex = stickers.findIndex(s => s.id === selectedSticker?.id);
  const canMoveUp = selectedIndex >= 0 && selectedIndex < stickers.length - 1;
  const canMoveDown = selectedIndex > 0;

  return (
    <div>
      <div className="section-title">文字编辑</div>
      
      <div className="toolbar-section">
        <label>选择文字位置</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`text-input`}
            style={{
              flex: 1,
              cursor: 'pointer',
              background: selectedTextType === 'top' 
                ? 'rgba(0, 212, 170, 0.15)' 
                : 'rgba(255, 255, 255, 0.05)',
              borderColor: selectedTextType === 'top' 
                ? 'var(--color-accent)' 
                : 'var(--color-border)',
              color: selectedTextType === 'top' 
                ? 'var(--color-accent)' 
                : 'var(--color-text-primary)',
              fontWeight: 500,
            }}
            onClick={() => onTopTextChange({})}
          >
            顶部文字
          </button>
          <button
            className={`text-input`}
            style={{
              flex: 1,
              cursor: 'pointer',
              background: selectedTextType === 'bottom' 
                ? 'rgba(0, 212, 170, 0.15)' 
                : 'rgba(255, 255, 255, 0.05)',
              borderColor: selectedTextType === 'bottom' 
                ? 'var(--color-accent)' 
                : 'var(--color-border)',
              color: selectedTextType === 'bottom' 
                ? 'var(--color-accent)' 
                : 'var(--color-text-primary)',
              fontWeight: 500,
            }}
            onClick={() => onBottomTextChange({})}
          >
            底部文字
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <label>文字内容</label>
        <input
          type="text"
          className="text-input"
          placeholder="输入文字..."
          value={activeText.text}
          onChange={(e) => onActiveTextChange({ text: e.target.value })}
        />
      </div>

      <div className="toolbar-section">
        <label>字体</label>
        <select
          className="font-select"
          value={activeText.fontFamily}
          onChange={(e) => onActiveTextChange({ fontFamily: e.target.value })}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-section">
        <label>字号: {activeText.fontSize}px</label>
        <div className="slider-container">
          <input
            type="range"
            className="slider"
            min="12"
            max="72"
            value={activeText.fontSize}
            onChange={(e) => onActiveTextChange({ fontSize: Number(e.target.value) })}
          />
          <span className="slider-value">{activeText.fontSize}px</span>
        </div>
      </div>

      <div className="toolbar-section">
        <label>文字颜色</label>
        <div className="color-picker-row">
          <div className="color-input-wrapper">
            <input
              type="color"
              value={activeText.color}
              onChange={(e) => onActiveTextChange({ color: e.target.value })}
            />
          </div>
          <input
            type="text"
            className="hex-input"
            value={activeText.color}
            onChange={(e) => onActiveTextChange({ color: e.target.value })}
          />
        </div>
      </div>

      <div className="toolbar-section">
        <label>描边颜色</label>
        <div className="color-picker-row">
          <div className="color-input-wrapper">
            <input
              type="color"
              value={activeText.strokeColor}
              onChange={(e) => onActiveTextChange({ strokeColor: e.target.value })}
            />
          </div>
          <input
            type="text"
            className="hex-input"
            value={activeText.strokeColor}
            onChange={(e) => onActiveTextChange({ strokeColor: e.target.value })}
          />
        </div>
      </div>

      <div className="toolbar-section">
        <label>描边粗细: {activeText.strokeWidth}px</label>
        <div className="slider-container">
          <input
            type="range"
            className="slider"
            min="0"
            max="10"
            step="0.5"
            value={activeText.strokeWidth}
            onChange={(e) => onActiveTextChange({ strokeWidth: Number(e.target.value) })}
          />
          <span className="slider-value">{activeText.strokeWidth}px</span>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: '24px' }}>贴纸</div>
      
      <div className="toolbar-section">
        <label>Emoji 贴纸</label>
        <div className="sticker-grid">
          {EMOJI_STICKERS.map((emoji, index) => (
            <div
              key={`emoji-${index}`}
              className="sticker-item"
              onClick={() => onAddSticker('emoji', emoji)}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <label>图形贴纸</label>
        <div className="sticker-grid">
          {SHAPE_STICKERS.map((shape, index) => (
            <div
              key={`shape-${index}`}
              className="sticker-item"
              onClick={() => onAddSticker('shape', shape)}
            >
              {shape}
            </div>
          ))}
        </div>
      </div>

      {selectedSticker && (
        <div className="toolbar-section" style={{ marginTop: '24px' }}>
          <div className="section-title">选中的贴纸</div>
          
          <div className="toolbar-section">
            <label>缩放: {Math.round(selectedSticker.scale * 100)}%</label>
            <div className="slider-container">
              <input
                type="range"
                className="slider"
                min="20"
                max="300"
                value={selectedSticker.scale * 100}
                onChange={(e) => onUpdateSticker(selectedSticker.id, { 
                  scale: Number(e.target.value) / 100 
                })}
              />
              <span className="slider-value">{Math.round(selectedSticker.scale * 100)}%</span>
            </div>
          </div>

          <div className="toolbar-section">
            <label>旋转: {Math.round(selectedSticker.rotation)}°</label>
            <div className="slider-container">
              <input
                type="range"
                className="slider"
                min="-180"
                max="180"
                value={selectedSticker.rotation}
                onChange={(e) => onUpdateSticker(selectedSticker.id, { 
                  rotation: Number(e.target.value) 
                })}
              />
              <span className="slider-value">{Math.round(selectedSticker.rotation)}°</span>
            </div>
          </div>

          <div className="layer-controls">
            <button
              className="layer-btn"
              onClick={() => onMoveStickerLayer(selectedSticker.id, 'up')}
              disabled={!canMoveUp}
            >
              ↑ 上移
            </button>
            <button
              className="layer-btn"
              onClick={() => onMoveStickerLayer(selectedSticker.id, 'down')}
              disabled={!canMoveDown}
            >
              ↓ 下移
            </button>
            <button
              className="layer-btn"
              style={{ color: '#ff6b6b' }}
              onClick={() => onDeleteSticker(selectedSticker.id)}
            >
              🗑 删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
