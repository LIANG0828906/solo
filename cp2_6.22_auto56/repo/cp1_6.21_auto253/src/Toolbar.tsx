import { Eraser, PaintBucket, Pipette, Trash2 } from 'lucide-react';
import { useVoxelStore, PRESET_COLORS, ToolType } from './voxelStore';

interface ToolbarProps {
  isMobile?: boolean;
}

export default function Toolbar({ isMobile = false }: ToolbarProps) {
  const { currentColor, currentTool, setColor, setTool, clearAll } = useVoxelStore();

  const tools: { type: ToolType; icon: typeof Eraser; label: string }[] = [
    { type: 'eraser', icon: Eraser, label: '橡皮擦' },
    { type: 'fill', icon: PaintBucket, label: '填充' },
    { type: 'eyedropper', icon: Pipette, label: '吸色管' },
    { type: 'brush', icon: Trash2, label: '清空' },
  ];

  const handleToolClick = (tool: ToolType) => {
    if (tool === 'brush') {
      clearAll();
    } else {
      setTool(tool);
    }
  };

  const containerStyle: React.CSSProperties = isMobile
    ? {
        width: '100%',
        padding: '16px',
        background: '#1E293B',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowX: 'auto',
      }
    : {
        width: '240px',
        height: '320px',
        padding: '20px',
        background: '#1E293B',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        flexShrink: 0,
      };

  return (
    <div style={containerStyle}>
      <div>
        <h3
          style={{
            color: '#F8FAFC',
            fontWeight: 'bold',
            fontSize: '14px',
            margin: '0 0 12px 0',
          }}
        >
          调色板
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}
        >
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => {
                setColor(color);
                setTool('brush');
              }}
              style={{
                width: '48px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: color,
                border: currentColor === color && currentTool === 'brush'
                  ? '2px solid #F8FAFC'
                  : '2px solid transparent',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                transform: currentColor === color && currentTool === 'brush' ? 'scale(1.1)' : 'scale(1)',
                boxShadow: currentColor === color && currentTool === 'brush'
                  ? `0 0 12px ${color}80`
                  : 'none',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = currentColor === color && currentTool === 'brush'
                  ? 'scale(1.1)'
                  : 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = currentColor === color && currentTool === 'brush'
                  ? 'scale(1.1)'
                  : 'scale(1)';
              }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div>
        <h3
          style={{
            color: '#F8FAFC',
            fontWeight: 'bold',
            fontSize: '14px',
            margin: '0 0 12px 0',
          }}
        >
          工具
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
          }}
        >
          {tools.map(({ type, icon: Icon, label }) => {
            const isActive = type !== 'brush' && currentTool === type;
            return (
              <button
                key={type}
                onClick={() => handleToolClick(type)}
                style={{
                  width: '100px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#3B82F6' : '#334155',
                  color: '#E2E8F0',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#475569';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#334155';
                  }
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3
          style={{
            color: '#F8FAFC',
            fontWeight: 'bold',
            fontSize: '14px',
            margin: '0 0 8px 0',
          }}
        >
          当前颜色
        </h3>
        <div
          style={{
            width: '100%',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: currentColor,
            border: '1px solid #334155',
          }}
        />
      </div>
    </div>
  );
}
