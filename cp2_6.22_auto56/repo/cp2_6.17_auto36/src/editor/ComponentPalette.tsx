import { useDrag } from 'react-dnd';
import type { ComponentType } from '../store/editorStore';

interface PaletteItemProps {
  type: ComponentType;
  label: string;
  icon: string;
}

function PaletteItem({ type, label, icon }: PaletteItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PALETTE_COMPONENT',
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [type]);

  return (
    <div
      ref={drag}
      style={{
        padding: '14px 16px',
        marginBottom: 8,
        backgroundColor: '#fff',
        borderRadius: 6,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transition: 'all 0.2s ease',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 14, color: '#2C3E50', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

export default function ComponentPalette() {
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 56,
        bottom: 0,
        width: 200,
        backgroundColor: '#ECF0F1',
        padding: '16px 12px',
        overflowY: 'auto',
        borderRight: '1px solid #BDC3C7',
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#7F8C8D',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        组件库
      </div>
      <PaletteItem type="title" label="标题组件" icon="📝" />
      <PaletteItem type="image" label="图片组件" icon="🖼️" />
      <PaletteItem type="textCard" label="文本卡片" icon="📄" />
    </div>
  );
}
