import { useEditorStore, type ToolMode } from '../stores/editorStore';
import { PRESET_COLORS } from '../utils/colorPalette';
import { undoManager } from '../utils/undoManager';
import { socketClient } from '../utils/socketClient';

type ToolIconProps = {
  mode: ToolMode;
  active: boolean;
  onClick: () => void;
  title: string;
};

function ToolIcon({ mode, active, onClick, title }: ToolIconProps) {
  const icons: Record<ToolMode, string> = {
    pencil: '✏️',
    fill: '🪣',
    picker: '💧',
    move: '✋',
  };

  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 48,
        height: 48,
        background: active ? 'rgba(0, 191, 165, 0.2)' : 'transparent',
        border: active ? '2px solid #00BFA5' : '2px solid transparent',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        color: active ? '#00BFA5' : '#E0E0E0',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = active
          ? 'rgba(0, 191, 165, 0.2)'
          : 'transparent';
      }}
    >
      {icons[mode]}
    </button>
  );
}

export function Toolbar() {
  const {
    toolMode,
    setToolMode,
    brushColor,
    setBrushColor,
    pixels,
    setPixels,
  } = useEditorStore();

  const handleUndo = () => {
    const result = undoManager.undo(pixels);
    if (result) {
      setPixels(result);
      socketClient.setPixels(result);
    }
  };

  const handleRedo = () => {
    const result = undoManager.redo(pixels);
    if (result) {
      setPixels(result);
      socketClient.setPixels(result);
    }
  };

  const canUndo = undoManager.canUndo();
  const canRedo = undoManager.canRedo();

  const tools: { mode: ToolMode; title: string }[] = [
    { mode: 'pencil', title: '铅笔 (P)' },
    { mode: 'fill', title: '填充 (F)' },
    { mode: 'picker', title: '取色 (I)' },
    { mode: 'move', title: '移动 (V)' },
  ];

  return (
    <div
      style={{
        width: 80,
        background: '#2C2C2C',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        gap: 12,
        borderRight: '1px solid #333333',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        {tools.map((t) => (
          <ToolIcon
            key={t.mode}
            mode={t.mode}
            active={toolMode === t.mode}
            onClick={() => setToolMode(t.mode)}
            title={t.title}
          />
        ))}
      </div>

      <div style={{ height: 1, width: 48, background: '#333333', margin: '8px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title="撤销 (Ctrl+Z)"
          style={{
            width: 48,
            height: 48,
            background: 'transparent',
            border: '2px solid transparent',
            borderRadius: 8,
            cursor: canUndo ? 'pointer' : 'not-allowed',
            opacity: canUndo ? 1 : 0.3,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#E0E0E0',
            outline: 'none',
          }}
        >
          ↶
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title="重做 (Ctrl+Y)"
          style={{
            width: 48,
            height: 48,
            background: 'transparent',
            border: '2px solid transparent',
            borderRadius: 8,
            cursor: canRedo ? 'pointer' : 'not-allowed',
            opacity: canRedo ? 1 : 0.3,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#E0E0E0',
            outline: 'none',
          }}
        >
          ↷
        </button>
      </div>

      <div style={{ height: 1, width: 48, background: '#333333', margin: '8px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div
          title={`当前颜色: ${brushColor}`}
          style={{
            width: 44,
            height: 44,
            background: brushColor,
            border: '2px solid #555555',
            borderRadius: 6,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        />
        <label style={{ width: 48, height: 32, cursor: 'pointer', position: 'relative' }}>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#1A1A1A',
              border: '1px solid #555555',
              borderRadius: 6,
              color: '#E0E0E0',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            自定义
          </div>
        </label>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 4,
          }}
        >
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setBrushColor(color)}
              title={color}
              style={{
                width: 20,
                height: 20,
                background: color,
                border: brushColor === color ? '2px solid #00BFA5' : '1px solid #555555',
                borderRadius: 3,
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 0.15s',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
