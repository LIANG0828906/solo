import { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { ToolType } from '../types';

interface ToolButtonProps {
  tool: ToolType;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolButton({ tool, label, isSelected, onClick, children }: ToolButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      title={label}
      style={{
        width: '48px',
        height: '48px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: isSelected ? '#3b82f6' : 'transparent',
        color: isSelected ? '#ffffff' : '#94a3b8',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 150ms ease-out',
        transform: isAnimating ? 'scale(0.9)' : 'scale(1)',
        transitionProperty: 'background-color, transform',
        transitionDuration: '150ms',
        transitionTimingFunction: 'ease-out',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#334155';
          (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
        }
      }}
    >
      {children}
    </button>
  );
}

const tools: { id: ToolType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'select',
    label: '选择工具 (V)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      </svg>
    ),
  },
  {
    id: 'point',
    label: '点 (P)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    id: 'segment',
    label: '线段 (L)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="4" y1="20" x2="20" y2="4" />
      </svg>
    ),
  },
  {
    id: 'circle',
    label: '圆 (C)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    id: 'line',
    label: '直线 (Shift+L)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="2" y1="22" x2="22" y2="2" />
      </svg>
    ),
  },
  {
    id: 'ray',
    label: '射线 (R)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="12" x2="22" y2="2" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'polygon',
    label: '多边形 (G)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" />
      </svg>
    ),
  },
];

const constraintTools: { id: ToolType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'parallel',
    label: '平行约束',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    ),
  },
  {
    id: 'perpendicular',
    label: '垂直约束',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="4" y1="12" x2="20" y2="12" />
      </svg>
    ),
  },
  {
    id: 'midpoint',
    label: '中点约束',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="4" y1="12" x2="20" y2="12" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'angle',
    label: '角度约束',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12,12 L20,4" />
        <path d="M12,12 L20,20" />
        <path d="M16,8 A5,5 0 0,1 16,16" />
      </svg>
    ),
  },
];

export function Toolbar() {
  const currentTool = useCanvasStore((state) => state.currentTool);
  const setCurrentTool = useCanvasStore((state) => state.setCurrentTool);

  return (
    <div
      style={{
        width: '64px',
        backgroundColor: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 0',
        gap: '4px',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          paddingBottom: '8px',
          borderBottom: '1px solid #334155',
          width: '100%',
          alignItems: 'center',
        }}
      >
        {tools.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool.id}
            label={tool.label}
            isSelected={currentTool === tool.id}
            onClick={() => setCurrentTool(tool.id)}
          >
            {tool.icon}
          </ToolButton>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          paddingTop: '8px',
          width: '100%',
          alignItems: 'center',
        }}
      >
        {constraintTools.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool.id}
            label={tool.label}
            isSelected={currentTool === tool.id}
            onClick={() => setCurrentTool(tool.id)}
          >
            {tool.icon}
          </ToolButton>
        ))}
      </div>
    </div>
  );
}
