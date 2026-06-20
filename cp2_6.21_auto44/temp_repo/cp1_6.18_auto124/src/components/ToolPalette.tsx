import { Square, Circle, User, Lightbulb, Music } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import type { ActiveTool } from '@/types';

interface ToolButton {
  tool: Exclude<ActiveTool, null>;
  Icon: React.ComponentType<{ size?: number | string; color?: string }>;
}

const tools: ToolButton[] = [
  { tool: 'rect', Icon: Square },
  { tool: 'circle', Icon: Circle },
  { tool: 'character', Icon: User },
  { tool: 'light', Icon: Lightbulb },
  { tool: 'sound', Icon: Music },
];

const ToolPalette: React.FC = () => {
  const activeTool = useProjectStore((state) => state.activeTool);
  const setActiveTool = useProjectStore((state) => state.setActiveTool);

  const handleClick = (tool: Exclude<ActiveTool, null>): void => {
    setActiveTool(activeTool === tool ? null : tool);
  };

  return (
    <div
      style={{
        width: 60,
        background: '#2D2D44',
        display: 'flex',
        flexDirection: 'column',
        padding: 12,
        gap: 12,
        borderRadius: 8,
      }}
    >
      {tools.map(({ tool, Icon }) => {
        const isActive = activeTool === tool;
        return (
          <button
            key={tool}
            onClick={() => handleClick(tool)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              background: isActive ? '#4A4A6A' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = '#3D3D5C';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <Icon size={20} color="#FFFFFF" />
          </button>
        );
      })}
    </div>
  );
};

export default ToolPalette;
