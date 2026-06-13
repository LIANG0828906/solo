import {
  Pencil,
  Square,
  Circle,
  StickyNote,
  ArrowRight,
  Undo2,
  Redo2,
  Minus,
} from 'lucide-react';
import type { ToolType } from '../utils/drawEngine';

interface ToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface ToolItem {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  delay: number;
}

const tools: ToolItem[] = [
  { tool: 'pen-thin', icon: <Pencil size={18} />, label: '细画笔', delay: 0 },
  { tool: 'pen-medium', icon: <Pencil size={20} strokeWidth={2.5} />, label: '中画笔', delay: 0.05 },
  { tool: 'pen-thick', icon: <Pencil size={22} strokeWidth={3.5} />, label: '粗画笔', delay: 0.1 },
  { tool: 'rectangle', icon: <Square size={18} />, label: '矩形', delay: 0.15 },
  { tool: 'circle', icon: <Circle size={18} />, label: '圆形', delay: 0.2 },
  { tool: 'arrow', icon: <ArrowRight size={18} />, label: '箭头', delay: 0.25 },
  { tool: 'sticky', icon: <StickyNote size={18} />, label: '便签', delay: 0.3 },
];

export default function Toolbar({
  currentTool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolbarProps) {
  return (
    <div
      className="glass-toolbar"
      style={{
        position: 'fixed',
        left: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 48,
        padding: '8px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        zIndex: 100,
      }}
    >
      {tools.map((item, index) => (
        <button
          key={item.tool}
          className={`tool-btn ${currentTool === item.tool ? 'active' : ''}`}
          onClick={() => onToolChange(item.tool)}
          style={{
            animationDelay: `${item.delay}s`,
          }}
          title={item.label}
        >
          {item.icon}
          <span className="tooltip">{item.label}</span>
        </button>
      ))}

      <div
        style={{
          width: '60%',
          height: 1,
          background: 'rgba(255,255,255,0.15)',
          margin: '6px 0',
        }}
      />

      <button
        className="tool-btn"
        onClick={onUndo}
        disabled={!canUndo}
        style={{
          animationDelay: '0.35s',
          opacity: canUndo ? undefined : 0.3,
          cursor: canUndo ? 'pointer' : 'not-allowed',
        }}
        title="撤销"
      >
        <Undo2 size={18} />
        <span className="tooltip">撤销</span>
      </button>

      <button
        className="tool-btn"
        onClick={onRedo}
        disabled={!canRedo}
        style={{
          animationDelay: '0.4s',
          opacity: canRedo ? undefined : 0.3,
          cursor: canRedo ? 'pointer' : 'not-allowed',
        }}
        title="重做"
      >
        <Redo2 size={18} />
        <span className="tooltip">重做</span>
      </button>
    </div>
  );
}
