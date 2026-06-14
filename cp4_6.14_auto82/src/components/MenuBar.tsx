import { useRef } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { exportToSVG, importFromSVG } from '../core/geometryEngine';

export function MenuBar() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shapes = useCanvasStore((state) => state.shapes);
  const historyIndex = useCanvasStore((state) => state.historyIndex);
  const history = useCanvasStore((state) => state.history);

  const clearCanvas = useCanvasStore((state) => state.clearCanvas);
  const addToHistory = useCanvasStore((state) => state.addToHistory);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const importShapes = useCanvasStore((state) => state.importShapes);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleNew = () => {
    if (shapes.length > 0 && !confirm('确定要新建画布吗？当前内容将被清除。')) {
      return;
    }
    clearCanvas();
    addToHistory();
  };

  const handleSave = () => {
    const data = {
      shapes,
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geometry-drawing.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;

      if (file.name.endsWith('.svg')) {
        const result = importFromSVG(content);
        importShapes(result.shapes, result.constraints);
      } else {
        try {
          const data = JSON.parse(content);
          if (data.shapes) {
            importShapes(data.shapes, data.constraints || []);
          }
        } catch (err) {
          alert('无法解析文件');
        }
      }
      addToHistory();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportSVG = () => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const shape of shapes) {
      if (shape.type === 'point') {
        minX = Math.min(minX, shape.x);
        minY = Math.min(minY, shape.y);
        maxX = Math.max(maxX, shape.x);
        maxY = Math.max(maxY, shape.y);
      }
    }

    if (!isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 800;
      maxY = 600;
    }

    const padding = 40;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const offsetShapes = shapes.map((s) => {
      if (s.type === 'point') {
        return { ...s, x: s.x - minX + padding, y: s.y - minY + padding };
      }
      return s;
    });

    const svgContent = exportToSVG(offsetShapes, width, height);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geometry-drawing.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const buttonStyle: React.CSSProperties = {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#475569',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 150ms ease-out',
  };

  const disabledStyle: React.CSSProperties = {
    ...buttonStyle,
    color: '#cbd5e1',
    cursor: 'not-allowed',
  };

  return (
    <>
      <div
        style={{
          height: '48px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '4px',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleNew}
            style={buttonStyle}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
            title="新建画布"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            新建
          </button>

          <button
            onClick={handleSave}
            style={buttonStyle}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
            title="保存文件"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            保存
          </button>

          <button
            onClick={handleImport}
            style={buttonStyle}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
            title="导入文件"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导入
          </button>

          <button
            onClick={handleExportSVG}
            style={buttonStyle}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
            title="导出SVG"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            导出SVG
          </button>
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0', margin: '0 8px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            style={canUndo ? buttonStyle : disabledStyle}
            onMouseEnter={(e) => {
              if (canUndo) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
            title="撤销 (Ctrl+Z)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            撤销
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            style={canRedo ? buttonStyle : disabledStyle}
            onMouseEnter={(e) => {
              if (canRedo) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
            title="重做 (Ctrl+Y)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            重做
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            fontSize: '12px',
            color: '#94a3b8',
          }}
        >
          步骤 {Math.max(0, historyIndex)}/{history.length - 1}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.svg"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  );
}
