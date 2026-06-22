import type { CanvasElement, TextElement, IconElement, PriceTagElement, ChalkColor, TagColor } from '../types';
import { CHALK_COLORS, TAG_COLORS } from '../constants';

interface PropertyPanelProps {
  element: CanvasElement | null;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  isMobile?: boolean;
}

export const PropertyPanel = ({ element, onUpdate, onDelete, isMobile = false }: PropertyPanelProps) => {
  if (!element) {
    return null;
  }

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '180px',
        backgroundColor: '#1F2937',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        padding: '16px',
        zIndex: 100,
        overflowY: 'auto',
        transition: 'opacity 0.3s, transform 0.3s',
      }
    : {
        width: '240px',
        backgroundColor: '#1F2937',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        opacity: element ? 1 : 0,
        transition: 'opacity 0.3s ease',
        overflowY: 'auto',
      };

  const handleInputChange = (key: string, value: number) => {
    onUpdate(element.id, { [key]: value });
  };

  const handleColorChange = (color: string) => {
    if (element.type === 'text') {
      onUpdate(element.id, { color: color as ChalkColor });
    } else if (element.type === 'icon') {
      onUpdate(element.id, { color });
    } else if (element.type === 'priceTag') {
      onUpdate(element.id, { bgColor: color as TagColor });
    }
  };

  return (
    <div style={panelStyle}>
      <h3 style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
        属性面板
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ color: '#A0AEC0', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
            X 位置
          </label>
          <input
            type="number"
            value={Math.round(element.x)}
            onChange={(e) => handleInputChange('x', Number(e.target.value))}
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: '#374151',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '12px',
            }}
          />
        </div>
        <div>
          <label style={{ color: '#A0AEC0', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
            Y 位置
          </label>
          <input
            type="number"
            value={Math.round(element.y)}
            onChange={(e) => handleInputChange('y', Number(e.target.value))}
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: '#374151',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '12px',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ color: '#A0AEC0', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
            宽度
          </label>
          <input
            type="number"
            value={Math.round(element.width)}
            onChange={(e) => handleInputChange('width', Number(e.target.value))}
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: '#374151',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '12px',
            }}
          />
        </div>
        <div>
          <label style={{ color: '#A0AEC0', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
            高度
          </label>
          <input
            type="number"
            value={Math.round(element.height)}
            onChange={(e) => handleInputChange('height', Number(e.target.value))}
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: '#374151',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '12px',
            }}
          />
        </div>
      </div>

      <div>
        <label style={{ color: '#A0AEC0', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
          旋转角度: {Math.round(element.rotation)}°
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          value={element.rotation}
          onChange={(e) => handleInputChange('rotation', Number(e.target.value))}
          style={{ width: '100%', accentColor: '#FFE066' }}
        />
      </div>

      <div>
        <label style={{ color: '#A0AEC0', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
          透明度: {Math.round(element.opacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={element.opacity * 100}
          onChange={(e) => handleInputChange('opacity', Number(e.target.value) / 100)}
          style={{ width: '100%', accentColor: '#FFE066' }}
        />
      </div>

      {element.type === 'text' && (
        <div>
          <label style={{ color: '#A0AEC0', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
            粉笔颜色
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {CHALK_COLORS.map((color) => (
              <div
                key={color}
                onClick={() => handleColorChange(color)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: (element as TextElement).color === color ? '2px solid #FFE066' : '2px solid #4A5568',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                }}
              />
            ))}
          </div>
        </div>
      )}

      {element.type === 'icon' && (
        <div>
          <label style={{ color: '#A0AEC0', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
            图案颜色
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CHALK_COLORS.map((color) => (
              <div
                key={color}
                onClick={() => handleColorChange(color)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: (element as IconElement).color === color ? '2px solid #FFE066' : '2px solid #4A5568',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                }}
              />
            ))}
          </div>
        </div>
      )}

      {element.type === 'priceTag' && (
        <div>
          <label style={{ color: '#A0AEC0', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
            标签颜色
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {TAG_COLORS.map((color) => (
              <div
                key={color}
                onClick={() => handleColorChange(color)}
                style={{
                  width: '30px',
                  height: '20px',
                  borderRadius: '3px',
                  backgroundColor: color,
                  border: (element as PriceTagElement).bgColor === color ? '2px solid #FFE066' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                }}
              />
            ))}
          </div>
        </div>
      )}

      {element.type === 'priceTag' && (
        <div>
          <label style={{ color: '#A0AEC0', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
            价格
          </label>
          <input
            type="number"
            step="0.01"
            value={(element as PriceTagElement).price}
            onChange={(e) => onUpdate(element.id, { price: Number(e.target.value) } as Partial<PriceTagElement>)}
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: '#374151',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '12px',
            }}
          />
        </div>
      )}

      <button
        onClick={() => onDelete(element.id)}
        style={{
          marginTop: 'auto',
          padding: '8px 12px',
          backgroundColor: '#C53030',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#9B2C2C';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#C53030';
        }}
      >
        删除元素
      </button>
    </div>
  );
};
