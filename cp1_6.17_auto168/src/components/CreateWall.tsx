import React, { useRef, useEffect, useState, useCallback } from 'react';
import CanvasEngine, { ToolType, StencilType } from '../engine/CanvasEngine';
import { eventBus } from '../engine/EventBus';
import useStore from '../App';

const PRESET_COLORS = [
  '#FF0000', '#FF6B00', '#FFD700', '#33CC33',
  '#00BFFF', '#0066FF', '#8B00FF', '#FF1493',
  '#00CED1', '#8B4513', '#FF69B4', '#7FFF00',
  '#1E90FF', '#FFFFFF', '#808080', '#000000',
];

const TOOL_LIST: { key: ToolType; label: string; icon: string }[] = [
  { key: 'spray', label: '喷漆', icon: '🎨' },
  { key: 'brush', label: '画笔', icon: '✏️' },
  { key: 'stencil', label: '模板', icon: '🔰' },
];

const STENCIL_LIST: { key: StencilType; label: string }[] = [
  { key: 'star', label: '★ 星形' },
  { key: 'heart', label: '♥ 心形' },
  { key: 'arrow', label: '↑ 箭头' },
];

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
};

const leftPanelStyle: React.CSSProperties = {
  width: '80px',
  background: '#16213E',
  borderRight: '1px solid #2A2A4A',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '16px 0',
  gap: '8px',
  flexShrink: 0,
};

const centerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
};

const rightPanelStyle: React.CSSProperties = {
  width: '200px',
  background: '#16213E',
  borderLeft: '1px solid #2A2A4A',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  flexShrink: 0,
  overflowY: 'auto',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#888',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const toolBtnStyle = (active: boolean): React.CSSProperties => ({
  width: '56px',
  height: '56px',
  borderRadius: '12px',
  border: active ? '2px solid #E74C3C' : '2px solid transparent',
  background: active ? '#2A1A2E' : '#1A1A2E',
  color: active ? '#E74C3C' : '#AAA',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
  fontSize: '18px',
  transition: 'all 0.3s ease',
  transform: active ? 'scale(1.05)' : 'scale(1)',
});

const toolLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 600,
};

const colorGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '6px',
};

const colorBlockStyle = (active: boolean): React.CSSProperties => ({
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  border: active ? '2px solid #FFF' : '2px solid transparent',
  cursor: 'pointer',
  transition: 'border 0.2s, transform 0.2s',
  transform: active ? 'scale(1.1)' : 'scale(1)',
});

const submitBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  right: '12px',
  background: '#E74C3C',
  color: '#FFF',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 18px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.3s, transform 0.2s',
  zIndex: 10,
};

const clearBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  right: '140px',
  background: '#444',
  color: '#EEE',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 14px',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'background 0.3s',
  zIndex: 10,
};

const sliderWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  accentColor: '#E74C3C',
  cursor: 'pointer',
};

const paramSectionStyle = (visible: boolean): React.CSSProperties => ({
  maxHeight: visible ? '200px' : '0',
  opacity: visible ? 1 : 0,
  overflow: 'hidden',
  transition: 'max-height 0.3s ease, opacity 0.3s ease',
});

const stencilBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 10px',
  borderRadius: '6px',
  border: active ? '1px solid #E74C3C' : '1px solid #444',
  background: active ? '#2A1A2E' : '#1A1A2E',
  color: active ? '#E74C3C' : '#AAA',
  cursor: 'pointer',
  fontSize: '12px',
  transition: 'all 0.3s ease',
});

const titleInputStyle: React.CSSProperties = {
  width: '100%',
  background: '#1A1A2E',
  border: '1px solid #444',
  borderRadius: '6px',
  color: '#EEE',
  padding: '8px 10px',
  fontSize: '13px',
  outline: 'none',
  transition: 'border 0.2s',
};

export default function CreateWall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const [tool, setTool] = useState<ToolType>('brush');
  const [color, setColor] = useState('#FF0000');
  const [spraySize, setSpraySize] = useState(20);
  const [brushWidth, setBrushWidth] = useState(6);
  const [stencilSize, setStencilSize] = useState(20);
  const [stencilType, setStencilType] = useState<StencilType>('star');
  const [showPicker, setShowPicker] = useState(false);
  const [title, setTitle] = useState('');
  const setPage = useStore(s => s.setPage);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new CanvasEngine(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.tool = tool;
  }, [tool]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.color = color;
  }, [color]);

  useEffect(() => {
    if (!engineRef.current) return;
    if (tool === 'spray') engineRef.current.size = spraySize;
    else if (tool === 'brush') engineRef.current.size = brushWidth;
    else engineRef.current.size = stencilSize;
  }, [tool, spraySize, brushWidth, stencilSize]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.stencilTypeValue = stencilType;
  }, [stencilType]);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;
    const { x, y } = getCanvasCoords(e);
    engineRef.current.startDraw(x, y);
  }, [getCanvasCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;
    const { x, y } = getCanvasCoords(e);
    engineRef.current.draw(x, y);
  }, [getCanvasCoords]);

  const handleMouseUp = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.endDraw();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!engineRef.current) return;
    const dataURI = engineRef.current.toDataURL();
    eventBus.emit('graffiti:submit', { dataURI, title: title.trim() || '无题涂鸦' });
    engineRef.current.clear();
    setTitle('');
    setPage('gallery');
  }, [title, setPage]);

  const handleClear = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.clear();
  }, []);

  const currentSize = tool === 'spray' ? spraySize : tool === 'brush' ? brushWidth : stencilSize;
  const sizeMin = tool === 'spray' ? 10 : tool === 'brush' ? 2 : 10;
  const sizeMax = tool === 'spray' ? 40 : tool === 'brush' ? 20 : 40;
  const sizeLabel = tool === 'spray' ? '喷漆尺寸' : tool === 'brush' ? '画笔宽度' : '模板大小';

  return (
    <div style={wrapperStyle}>
      <div style={leftPanelStyle}>
        {TOOL_LIST.map(t => (
          <button
            key={t.key}
            style={toolBtnStyle(tool === t.key)}
            onClick={() => setTool(t.key)}
            onMouseEnter={e => { if (tool !== t.key) (e.currentTarget as HTMLElement).style.background = '#2A2A4A'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = tool === t.key ? '#2A1A2E' : '#1A1A2E'; }}
          >
            <span>{t.icon}</span>
            <span style={toolLabelStyle}>{t.label}</span>
          </button>
        ))}

        <div style={{ marginTop: '8px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ ...sectionTitleStyle, marginBottom: '4px' }}>模板</div>
          {STENCIL_LIST.map(s => (
            <button
              key={s.key}
              style={stencilBtnStyle(tool === 'stencil' && stencilType === s.key)}
              onClick={() => { setTool('stencil'); setStencilType(s.key); }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={centerStyle}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          style={{
            background: '#F5F5DC',
            borderRadius: '4px',
            cursor: tool === 'spray' ? 'crosshair' : tool === 'brush' ? 'crosshair' : 'pointer',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <button
          style={clearBtnStyle}
          onClick={handleClear}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = '#666'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = '#444'; }}
        >
          清空画布
        </button>
        <button
          style={submitBtnStyle}
          onClick={handleSubmit}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = '#C0392B'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = '#E74C3C'; }}
          onMouseDown={e => { (e.target as HTMLElement).style.background = '#A93226'; (e.target as HTMLElement).style.transform = 'scale(0.96)'; }}
          onMouseUp={e => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
        >
          提交到画廊
        </button>
      </div>

      <div style={rightPanelStyle}>
        <div>
          <div style={sectionTitleStyle}>作品标题</div>
          <input
            style={titleInputStyle}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="为你的涂鸦命名..."
            onFocus={e => { e.target.style.border = '1px solid #E74C3C'; }}
            onBlur={e => { e.target.style.border = '1px solid #444'; }}
          />
        </div>

        <div>
          <div style={sectionTitleStyle}>颜色</div>
          <div style={colorGridStyle}>
            {PRESET_COLORS.map(c => (
              <div
                key={c}
                style={{
                  ...colorBlockStyle(color === c),
                  background: c,
                  boxShadow: c === '#FFFFFF' || c === '#FFD700' ? 'inset 0 0 0 1px #666' : undefined,
                }}
                onClick={() => setColor(c)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = color === c ? 'scale(1.1)' : 'scale(1)'; }}
              />
            ))}
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                border: showPicker ? '2px solid #FFF' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'border 0.2s, transform 0.2s',
                transform: showPicker ? 'scale(1.1)' : 'scale(1)',
              }}
              onClick={() => setShowPicker(!showPicker)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = showPicker ? 'scale(1.1)' : 'scale(1)'; }}
            />
          </div>
          {showPicker && (
            <div style={{ marginTop: '8px' }}>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ width: '100%', height: '32px', cursor: 'pointer', borderRadius: '6px', border: 'none' }}
              />
            </div>
          )}
        </div>

        <div>
          <div style={sectionTitleStyle}>{sizeLabel}</div>
          <div style={paramSectionStyle(true)}>
            <div style={sliderWrapperStyle}>
              <input
                type="range"
                min={sizeMin}
                max={sizeMax}
                value={currentSize}
                onChange={e => {
                  const v = Number(e.target.value);
                  if (tool === 'spray') setSpraySize(v);
                  else if (tool === 'brush') setBrushWidth(v);
                  else setStencilSize(v);
                }}
                style={sliderStyle}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888' }}>
                <span>{sizeMin}px</span>
                <span style={{ color: '#EEE', fontWeight: 600 }}>{currentSize}px</span>
                <span>{sizeMax}px</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={sectionTitleStyle}>当前工具</div>
          <div style={{
            padding: '10px',
            background: '#1A1A2E',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 600,
            color: '#E74C3C',
          }}>
            {TOOL_LIST.find(t => t.key === tool)?.icon} {TOOL_LIST.find(t => t.key === tool)?.label}
          </div>
        </div>

        <div>
          <div style={sectionTitleStyle}>预览颜色</div>
          <div style={{
            width: '100%',
            height: '32px',
            borderRadius: '6px',
            background: color,
            border: '1px solid #444',
          }} />
        </div>
      </div>
    </div>
  );
}
