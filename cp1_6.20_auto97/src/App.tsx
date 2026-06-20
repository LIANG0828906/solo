import React, { useReducer, useRef, useEffect, useState, useCallback } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import MiniMap from './components/MiniMap';
import { canvasReducer, initialState, createShape } from './reducer';
import { Shape, Point } from './types';
import { smoothAndShapeShape } from './utils/shapeSmoothing';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; shapeId: string | null } | null>(null);
  const [textValue, setTextValue] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !state.isPanning) {
        dispatch({ type: 'SET_SPACE_PRESSED', payload: true });
      }
      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (state.selectedIds.length > 0 && !textInput) {
          dispatch({ type: 'DELETE_SHAPES', payload: state.selectedIds });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        dispatch({ type: 'SET_SPACE_PRESSED', payload: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.selectedIds, state.isPanning, textInput]);

  const handleShapeAdd = useCallback((shape: Shape) => {
    let finalShape = shape;
    
    if (shape.type === 'pen' && shape.points && shape.points.length > 5) {
      finalShape = smoothAndShapeShape(shape as any) as Shape;
    }
    
    dispatch({ type: 'ADD_SHAPE', payload: { ...finalShape, id: uuidv4() } });
  }, []);

  const handleShapeUpdate = useCallback((id: string, updates: Partial<Shape>) => {
    dispatch({ type: 'UPDATE_SHAPE', payload: { id, updates } });
  }, []);

  const handleShapeDelete = useCallback((ids: string[]) => {
    dispatch({ type: 'DELETE_SHAPES', payload: ids });
  }, []);

  const handleSelectionChange = useCallback((ids: string[]) => {
    dispatch({ type: 'SET_SELECTED_IDS', payload: ids });
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom });
  }, []);

  const handleOffsetChange = useCallback((x: number, y: number) => {
    dispatch({ type: 'SET_OFFSET', payload: { x, y } });
  }, []);

  const handlePanningChange = useCallback((panning: boolean) => {
    dispatch({ type: 'SET_IS_PANNING', payload: panning });
  }, []);

  const handleToolChange = useCallback((tool: any) => {
    dispatch({ type: 'SET_TOOL', payload: tool });
    if (tool !== 'select') {
      dispatch({ type: 'SET_SELECTED_IDS', payload: [] });
    }
  }, []);

  const handleTextCreate = useCallback((x: number, y: number) => {
    setTextInput({ x, y, shapeId: null });
    setTextValue('');
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 0);
  }, []);

  const handleTextBlur = useCallback(() => {
    if (textInput && textValue.trim()) {
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      let textWidth = 100;
      if (ctx) {
        ctx.font = `${state.fontSize}px 'Kalam', cursive`;
        textWidth = ctx.measureText(textValue).width + 20;
      }
      
      const shape = createShape('text', textInput.x, textInput.y, {
        text: textValue,
        fontSize: state.fontSize,
        strokeColor: state.strokeColor,
        width: textWidth,
        height: state.fontSize + 8
      });
      dispatch({ type: 'ADD_SHAPE', payload: shape });
    }
    setTextInput(null);
    setTextValue('');
  }, [textInput, textValue, state.fontSize, state.strokeColor]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextBlur();
    }
    if (e.key === 'Escape') {
      setTextInput(null);
      setTextValue('');
    }
  };

  const handleAlign = useCallback((align: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV') => {
    dispatch({ type: 'ALIGN_SHAPES', payload: align });
  }, []);

  const handleExportSVG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || state.shapes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const shape of state.shapes) {
      minX = Math.min(minX, shape.x - 20);
      minY = Math.min(minY, shape.y - 20);
      maxX = Math.max(maxX, shape.x + shape.width + 20);
      maxY = Math.max(maxY, shape.y + shape.height + 20);
    }

    const width = maxX - minX;
    const height = maxY - minY;

    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">
        <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#F5F0E8"/>
        ${state.shapes.map(shape => shapeToSVG(shape)).join('\n')}
      </svg>
    `;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowchart.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.shapes]);

  const shapeToSVG = (shape: Shape): string => {
    const stroke = shape.strokeColor;
    const fill = shape.fillColor;
    const strokeWidth = shape.strokeWidth;

    switch (shape.type) {
      case 'rectangle':
        return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" 
          stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}" rx="2"/>`;
      case 'diamond': {
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        const points = `${cx},${shape.y} ${shape.x + shape.width},${cy} ${cx},${shape.y + shape.height} ${shape.x},${cy}`;
        return `<polygon points="${points}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}"/>`;
      }
      case 'arrow': {
        const s = shape as any;
        const angle = Math.atan2(s.endY - s.startY, s.endX - s.startX);
        const arrowSize = 10 + strokeWidth * 2;
        const x1 = s.endX - arrowSize * Math.cos(angle - Math.PI / 6);
        const y1 = s.endY - arrowSize * Math.sin(angle - Math.PI / 6);
        const x2 = s.endX - arrowSize * Math.cos(angle + Math.PI / 6);
        const y2 = s.endY - arrowSize * Math.sin(angle + Math.PI / 6);
        return `
          <line x1="${s.startX}" y1="${s.startY}" x2="${s.endX}" y2="${s.endY}" 
            stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
          <line x1="${s.endX}" y1="${s.endY}" x2="${x1}" y2="${y1}" 
            stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
          <line x1="${s.endX}" y1="${s.endY}" x2="${x2}" y2="${y2}" 
            stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
        `;
      }
      case 'text':
        return `<text x="${shape.x}" y="${shape.y + (shape.fontSize || 16)}" 
          font-family="'Kalam', cursive" font-size="${shape.fontSize || 16}" fill="${stroke}">
          ${shape.text}
        </text>`;
      case 'pen':
        if (shape.points && shape.points.length > 1) {
          const d = `M ${shape.points[0].x} ${shape.points[0].y} ` + 
            shape.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
          return `<path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" 
            fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
        return '';
      default:
        return '';
    }
  };

  const handleExportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const shape of state.shapes) {
      minX = Math.min(minX, shape.x - 20);
      minY = Math.min(minY, shape.y - 20);
      maxX = Math.max(maxX, shape.x + shape.width + 20);
      maxY = Math.max(maxY, shape.y + shape.height + 20);
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const scale = 2;

    tempCanvas.width = width * scale;
    tempCanvas.height = height * scale;
    ctx.scale(scale, scale);

    ctx.fillStyle = '#F5F0E8';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-minX, -minY);

    for (const shape of state.shapes) {
      drawShapeToContext(ctx, shape);
    }

    ctx.restore();

    const url = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowchart.png';
    a.click();
  }, [state.shapes]);

  const drawShapeToContext = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.save();
    ctx.strokeStyle = shape.strokeColor;
    ctx.fillStyle = shape.fillColor;
    ctx.lineWidth = shape.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (shape.type) {
      case 'rectangle':
        ctx.beginPath();
        ctx.rect(shape.x, shape.y, shape.width, shape.height);
        ctx.fill();
        ctx.stroke();
        break;
      case 'diamond': {
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        ctx.beginPath();
        ctx.moveTo(cx, shape.y);
        ctx.lineTo(shape.x + shape.width, cy);
        ctx.lineTo(cx, shape.y + shape.height);
        ctx.lineTo(shape.x, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'arrow': {
        const s = shape as any;
        ctx.beginPath();
        ctx.moveTo(s.startX, s.startY);
        ctx.lineTo(s.endX, s.endY);
        ctx.stroke();

        const angle = Math.atan2(s.endY - s.startY, s.endX - s.startX);
        const arrowSize = 10 + shape.strokeWidth * 2;
        
        ctx.beginPath();
        ctx.moveTo(s.endX, s.endY);
        ctx.lineTo(
          s.endX - arrowSize * Math.cos(angle - Math.PI / 6),
          s.endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(s.endX, s.endY);
        ctx.lineTo(
          s.endX - arrowSize * Math.cos(angle + Math.PI / 6),
          s.endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        break;
      }
      case 'text':
        ctx.font = `${shape.fontSize || 16}px 'Kalam', cursive`;
        ctx.fillStyle = shape.strokeColor;
        ctx.textBaseline = 'top';
        ctx.fillText(shape.text || '', shape.x, shape.y);
        break;
      case 'pen':
        if (shape.points && shape.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  };

  const textInputStyle: React.CSSProperties = textInput ? {
    left: state.offsetX + textInput.x * state.zoom,
    top: state.offsetY + textInput.y * state.zoom,
    transform: `scale(${state.zoom})`,
    transformOrigin: 'top left'
  } : {};

  return (
    <div className="app-container">
      <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
        <Canvas
          shapes={state.shapes}
          selectedIds={state.selectedIds}
          currentTool={state.currentTool}
          strokeColor={state.strokeColor}
          fillColor={state.fillColor}
          strokeWidth={state.strokeWidth}
          fontSize={state.fontSize}
          zoom={state.zoom}
          offsetX={state.offsetX}
          offsetY={state.offsetY}
          isPanning={state.isPanning}
          isSpacePressed={state.isSpacePressed}
          onShapeAdd={handleShapeAdd}
          onShapeUpdate={handleShapeUpdate}
          onShapeDelete={handleShapeDelete}
          onSelectionChange={handleSelectionChange}
          onZoomChange={handleZoomChange}
          onOffsetChange={handleOffsetChange}
          onPanningChange={handlePanningChange}
          onTextCreate={handleTextCreate}
          canvasRef={canvasRef}
        />
        
        {textInput && (
          <div className="text-input-overlay" style={textInputStyle}>
            <input
              ref={textInputRef}
              type="text"
              className="text-input"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onBlur={handleTextBlur}
              onKeyDown={handleKeyDown}
              placeholder="输入文本..."
              style={{
                fontFamily: "'Kalam', cursive",
                fontSize: state.fontSize,
                color: state.strokeColor
              }}
            />
          </div>
        )}

        <MiniMap
          shapes={state.shapes}
          zoom={state.zoom}
          offsetX={state.offsetX}
          offsetY={state.offsetY}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
        />
      </div>

      <Toolbar
        currentTool={state.currentTool}
        strokeColor={state.strokeColor}
        fillColor={state.fillColor}
        strokeWidth={state.strokeWidth}
        fontSize={state.fontSize}
        selectedCount={state.selectedIds.length}
        onToolChange={handleToolChange}
        onStrokeColorChange={(color) => dispatch({ type: 'SET_STROKE_COLOR', payload: color })}
        onFillColorChange={(color) => dispatch({ type: 'SET_FILL_COLOR', payload: color })}
        onStrokeWidthChange={(width) => dispatch({ type: 'SET_STROKE_WIDTH', payload: width })}
        onFontSizeChange={(size) => dispatch({ type: 'SET_FONT_SIZE', payload: size })}
        onAlign={handleAlign}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
      />
    </div>
  );
};

export default App;
