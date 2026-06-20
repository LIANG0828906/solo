import { useState } from 'react';
import { useStore } from '../store/useStore';
import { themes } from '../types';
import type { ElementType } from '../types';

const elementTypes: { type: ElementType; name: string; icon: string; description: string }[] = [
  { type: 'beatBars', name: '跳动柱体', icon: '▮▯▮', description: '低频鼓点驱动' },
  { type: 'particleGalaxy', name: '旋转粒子星系', icon: '✦✧✦', description: '中高频响应' },
  { type: 'waveSphere', name: '起伏波形球体', icon: '◉', description: '音量驱动' },
  { type: 'lightWall', name: '闪烁光墙', icon: '▦', description: '节拍闪烁' },
];

export function LeftPanel() {
  const theme = useStore((state) => state.theme);
  const addElement = useStore((state) => state.addElement);
  const themeColors = themes[theme];
  const [draggingType, setDraggingType] = useState<ElementType | null>(null);

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('elementType', type);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggingType(type);
  };

  const handleDragEnd = () => {
    setDraggingType(null);
  };

  const handleClick = (type: ElementType) => {
    addElement(type);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '20px',
        top: '80px',
        width: '280px',
        background: 'rgba(10, 10, 26, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '12px',
        padding: '20px',
        zIndex: 100,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      <h3
        style={{
          color: themeColors.secondary,
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '16px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}
      >
        可视化元素
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {elementTypes.map((el) => (
          <div
            key={el.type}
            draggable
            onDragStart={(e) => handleDragStart(e, el.type)}
            onDragEnd={handleDragEnd}
            onClick={() => handleClick(el.type)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              cursor: 'grab',
              transition: 'all 0.3s ease',
              border: '1px solid transparent',
              opacity: draggingType === el.type ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.borderColor = themeColors.primary + '60';
              e.currentTarget.style.boxShadow = `0 0 20px ${themeColors.primary}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${themeColors.primary}20, ${themeColors.secondary}20)`,
                borderRadius: '8px',
                fontSize: '20px',
                color: themeColors.primary,
                transition: 'all 0.3s ease',
              }}
            >
              {el.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '2px',
                }}
              >
                {el.name}
              </div>
              <div
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '11px',
                }}
              >
                {el.description}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '11px',
          lineHeight: 1.5,
        }}
      >
        💡 拖拽或点击添加元素到场景
      </div>
    </div>
  );
}

export default LeftPanel;
