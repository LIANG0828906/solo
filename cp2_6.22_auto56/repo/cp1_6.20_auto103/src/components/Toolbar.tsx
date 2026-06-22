import { Pencil, Eraser, StickyNote, Image, ThumbsUp, MessageSquare } from 'lucide-react';
import type { ToolType } from '../types';

const COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe',
  '#00b894', '#e17055', '#74b9ff', '#6c5ce7'
];

const BRUSH_SIZES = [2, 4, 6, 8, 12];

interface ToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
}

export function Toolbar({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  brushSize,
  onBrushSizeChange
}: ToolbarProps) {
  const tools: { type: ToolType; icon: typeof Pencil; label: string }[] = [
    { type: 'brush', icon: Pencil, label: '画笔' },
    { type: 'eraser', icon: Eraser, label: '橡皮' },
    { type: 'note', icon: StickyNote, label: '便签' },
    { type: 'image', icon: Image, label: '图片' },
    { type: 'like', icon: ThumbsUp, label: '点赞' },
    { type: 'comment', icon: MessageSquare, label: '评论' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.toolsContainer}>
        {tools.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            style={{
              ...styles.toolButton,
              backgroundColor: currentTool === type ? 'rgba(100, 181, 246, 0.2)' : 'transparent',
              color: currentTool === type ? '#64b5f6' : '#e0e0e0',
              border: currentTool === type ? '2px solid #64b5f6' : '2px solid transparent'
            }}
            onClick={() => onToolChange(type)}
            title={label}
          >
            <Icon size={22} />
          </button>
        ))}
      </div>

      <div style={styles.bottomSection}>
        <div style={styles.colorPalette}>
          {COLORS.map((color) => (
            <button
              key={color}
              style={{
                ...styles.colorButton,
                backgroundColor: color,
                transform: currentColor === color ? 'scale(1.2)' : 'scale(1)',
                boxShadow: currentColor === color ? `0 0 8px ${color}` : 'none'
              }}
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>

        <div style={styles.brushSizeContainer}>
          <div style={styles.brushSizeLabel}>粗细</div>
          <input
            type="range"
            min="0"
            max="4"
            step="1"
            value={BRUSH_SIZES.indexOf(brushSize)}
            onChange={(e) => onBrushSizeChange(BRUSH_SIZES[parseInt(e.target.value)])}
            style={styles.brushSlider}
          />
          <div style={{ ...styles.brushPreview, width: brushSize, height: brushSize, backgroundColor: currentColor }} />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 60,
    height: '100%',
    backgroundColor: '#1e1e1e',
    borderRight: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 0',
    gap: 8
  },
  toolsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  toolButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 250ms ease',
    padding: 0
  },
  bottomSection: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTop: '1px solid #2a2a2a'
  },
  colorPalette: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 4,
    padding: '0 4px'
  },
  colorButton: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '1px solid #3a3a3a',
    cursor: 'pointer',
    transition: 'transform 200ms ease, box-shadow 200ms ease',
    padding: 0
  },
  brushSizeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    padding: '0 8px'
  },
  brushSizeLabel: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center'
  },
  brushSlider: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    background: '#3a3a3a',
    outline: 'none',
    cursor: 'pointer',
    accentColor: '#64b5f6'
  },
  brushPreview: {
    borderRadius: '50%'
  }
};
