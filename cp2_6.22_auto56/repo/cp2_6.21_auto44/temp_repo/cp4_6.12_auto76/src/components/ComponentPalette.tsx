import { useDraggable } from '@dnd-kit/core';
import type { ComponentType } from '../types';

const components: { type: ComponentType; label: string; icon: string; description: string }[] = [
  { type: 'banner', label: '横幅', icon: '🖼️', description: '展示广告图片' },
  { type: 'product-grid', label: '商品网格', icon: '🛍️', description: '展示商品列表' },
  { type: 'coupon', label: '优惠券', icon: '🎫', description: '展示优惠券' },
];

interface DraggableItemProps {
  type: ComponentType;
  label: string;
  icon: string;
  description: string;
}

function DraggableItem({ type, label, icon, description }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        width: 80,
        height: 60,
        borderRadius: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        backgroundColor: '#ffffff',
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        userSelect: 'none',
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
      title={description}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{label}</span>
    </div>
  );
}

export function ComponentPalette() {
  return (
    <div
      style={{
        width: 240,
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid #e0e0e0',
        padding: 16,
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 16 }}>
        组件面板
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {components.map((comp) => (
          <DraggableItem
            key={comp.type}
            type={comp.type}
            label={comp.label}
            icon={comp.icon}
            description={comp.description}
          />
        ))}
      </div>
      <div
        style={{
          marginTop: 24,
          padding: 12,
          backgroundColor: '#e8f0fe',
          borderRadius: 8,
          fontSize: 12,
          color: '#3a7bd5',
          lineHeight: 1.6,
        }}
      >
        💡 提示：拖拽组件到中间画布即可添加，点击组件可编辑属性
      </div>
    </div>
  );
}
