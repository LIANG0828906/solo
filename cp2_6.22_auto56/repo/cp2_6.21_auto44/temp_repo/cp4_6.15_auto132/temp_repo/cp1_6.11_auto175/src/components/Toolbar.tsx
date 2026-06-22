import { useDrag } from 'react-dnd';
import type { ChalkColor, FontFamily, IconType, TagColor, ElementType } from '../types';
import { CHALK_COLORS, FONT_FAMILIES, ICON_TYPES, TAG_COLORS } from '../constants';
import { Icon } from './Icon';

interface ToolbarProps {
  onAddText: () => void;
  onAddIcon: (iconType: IconType) => void;
  onAddPriceTag: () => void;
}

interface DraggableItemProps {
  type: string;
  itemData: Record<string, unknown>;
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const DraggableItem = ({ type, itemData, children, label, onClick }: DraggableItemProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: itemData,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      onClick={onClick}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '8px',
        borderRadius: '6px',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
      }}
    >
      {children}
      <span style={{ fontSize: '11px', color: '#A0AEC0', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
};

export const Toolbar = ({ onAddText, onAddIcon, onAddPriceTag }: ToolbarProps) => {
  return (
    <div
      style={{
        width: '200px',
        backgroundColor: '#1F2937',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        overflowY: 'auto',
      }}
    >
      <div>
        <h3 style={{ color: '#E2E8F0', fontSize: '14px', marginBottom: '12px', fontWeight: 600 }}>
          添加元素
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <DraggableItem
            type="NEW_TEXT"
            itemData={{ elementType: 'text' as ElementType }}
            label="文字块"
            onClick={onAddText}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#374151',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontFamily: 'Caveat, cursive',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              Aa
            </div>
          </DraggableItem>

          <DraggableItem
            type="NEW_PRICE_TAG"
            itemData={{ elementType: 'priceTag' as ElementType }}
            label="价格标签"
            onClick={onAddPriceTag}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#374151',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '22px',
                  backgroundColor: '#FF6B6B',
                  borderRadius: '2px',
                  color: '#1a1a1a',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ￥9.99
              </div>
            </div>
          </DraggableItem>
        </div>
      </div>

      <div>
        <h3 style={{ color: '#E2E8F0', fontSize: '14px', marginBottom: '12px', fontWeight: 600 }}>
          装饰图案
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {ICON_TYPES.map(({ type, label }) => (
            <DraggableItem
              key={type}
              type="NEW_ICON"
              itemData={{ elementType: 'icon' as ElementType, iconType: type }}
              label={label}
              onClick={() => onAddIcon(type)}
            >
              <div
                style={{
                  width: '45px',
                  height: '45px',
                  backgroundColor: '#374151',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon type={type} color="#FFFFFF" size={30} />
              </div>
            </DraggableItem>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ color: '#E2E8F0', fontSize: '14px', marginBottom: '12px', fontWeight: 600 }}>
          粉笔颜色
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CHALK_COLORS.map((color) => (
            <div
              key={color}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: color,
                border: '2px solid #4A5568',
                cursor: 'pointer',
              }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ color: '#E2E8F0', fontSize: '14px', marginBottom: '12px', fontWeight: 600 }}>
          字体样式
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {FONT_FAMILIES.map(({ name, label }) => (
            <div
              key={name}
              style={{
                padding: '6px 10px',
                backgroundColor: '#374151',
                borderRadius: '4px',
                color: '#FFFFFF',
                fontFamily: `"${name}", cursive`,
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#4B5563';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#374151';
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
