import React, { useState, useRef, useEffect, useCallback } from 'react';
import rough from 'roughjs';
import { v4 as uuidv4 } from 'uuid';
import type { RoomElement, RoomLayout, Puzzle, ElementType } from './types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 40;

const ELEMENT_COLORS: Record<ElementType, string> = {
  wall: '#3a3a5a',
  item: '#cd853f',
  clue: '#9370db',
  exit: '#4a7c23',
};

const ELEMENT_ICONS: Record<ElementType, string> = {
  wall: '▓',
  item: '📦',
  clue: '📜',
  exit: '🚪',
};

const DEFAULT_LAYOUT: RoomLayout = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  name: '未命名密室',
  elements: [
    { id: 'w1', type: 'wall', x: 0, y: 0, width: 800, height: 20 },
    { id: 'w2', type: 'wall', x: 0, y: 580, width: 800, height: 20 },
    { id: 'w3', type: 'wall', x: 0, y: 0, width: 20, height: 600 },
    { id: 'w4', type: 'wall', x: 780, y: 0, width: 20, height: 600 },
    { id: 'item1', type: 'item', x: 200, y: 200, width: 50, height: 50, label: '宝箱',
      interaction: { type: 'click_text', content: '这是一个古老的宝箱，上面刻着神秘的符文。' } },
    { id: 'item2', type: 'item', x: 400, y: 300, width: 50, height: 50, label: '烛台',
      interaction: { type: 'sequence_trigger', triggerId: 'seq1' } },
    { id: 'item3', type: 'item', x: 550, y: 150, width: 50, height: 50, label: '画像',
      interaction: { type: 'sequence_trigger', triggerId: 'seq1' } },
    { id: 'clue1', type: 'clue', x: 150, y: 400, width: 40, height: 40, label: '纸条',
      interaction: { type: 'click_text', content: '线索：先点亮烛台，再凝视画像...' } },
    { id: 'exit1', type: 'exit', x: 720, y: 280, width: 40, height: 60, label: '出口' },
  ],
  puzzles: [
    { id: 'puz1', level: 1, type: 'sequence', solution: ['item2', 'item3'],
      hint: '按正确顺序点亮机关', unlocksExit: true }
  ],
  startPosition: { x: 100, y: 300 },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export default function EditorPage({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<RoomLayout>(() => {
    const saved = localStorage.getItem('room_layout_draft');
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });
  const [selectedTool, setSelectedTool] = useState<ElementType | null>(null);
  const [selectedElement, setSelectedElement] = useState<RoomElement | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showCrack, setShowCrack] = useState(false);
  const [versions, setVersions] = useState<Array<{ name: string; layout: RoomLayout }>>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<RoomElement | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  const triggerParticles = useCallback((x: number, y: number) => {
    const colors = ['#daa520', '#cd853f', '#b8860b', '#ffd700'];
    for (let i = 0; i < 25; i++) {
      const angle = (Math.PI * 2 * i) / 25;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 40 + Math.random() * 20,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }, []);

  const triggerErrorFlash = useCallback(() => {
    setShowCrack(true);
    setTimeout(() => setShowCrack(false), 500);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rc = rough.canvas(canvas);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(205, 133, 63, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    rc.rectangle(5, 5, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10, {
      stroke: '#cd853f',
      strokeWidth: 2,
      roughness: 2,
      fill: 'transparent',
    });

    layout.elements.forEach(elem => {
      const isSelected = selectedElement?.id === elem.id;
      const color = ELEMENT_COLORS[elem.type];

      if (elem.type === 'wall') {
        rc.rectangle(elem.x, elem.y, elem.width, elem.height, {
          fill: color,
          fillStyle: 'solid',
          stroke: isSelected ? '#ffd700' : 'rgba(205, 133, 63, 0.5)',
          strokeWidth: isSelected ? 3 : 1.5,
          roughness: 1.5,
        });
      } else {
        rc.rectangle(elem.x, elem.y, elem.width, elem.height, {
          fill: color,
          fillStyle: 'zigzag',
          fillWeight: 2,
          stroke: isSelected ? '#ffd700' : 'rgba(205, 133, 63, 0.7)',
          strokeWidth: isSelected ? 3 : 2,
          roughness: 2,
          hachureGap: 5,
        });

        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ELEMENT_ICONS[elem.type], elem.x + elem.width / 2, elem.y + elem.height / 2);

        if (elem.label) {
          ctx.font = '11px "Noto Serif SC"';
          ctx.fillStyle = '#e8e6e3';
          ctx.fillText(elem.label, elem.x + elem.width / 2, elem.y + elem.height + 12);
        }
      }

      if (isSelected) {
        ctx.strokeStyle = '#ffd700';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.strokeRect(elem.x - 4, elem.y - 4, elem.width + 8, elem.height + 8);
        ctx.setLineDash([]);
      }

      if (elem.interaction) {
        rc.circle(elem.x + elem.width - 6, elem.y + 6, 12, {
          fill: '#9370db',
          fillStyle: 'solid',
          stroke: '#daa520',
          strokeWidth: 1,
        });
        ctx.font = 'bold 10px serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚙', elem.x + elem.width - 6, elem.y + 6);
      }
    });

    rc.circle(layout.startPosition.x, layout.startPosition.y, 20, {
      fill: 'rgba(205, 133, 63, 0.3)',
      fillStyle: 'solid',
      stroke: '#daa520',
      strokeWidth: 2,
      roughness: 2,
    });
    ctx.font = '10px serif';
    ctx.fillStyle = '#daa520';
    ctx.textAlign = 'center';
    ctx.fillText('起点', layout.startPosition.x, layout.startPosition.y + 18);
  }, [layout, selectedElement]);

  useEffect(() => {
    const pCanvas = particleCanvasRef.current;
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return;

    const animate = () => {
      pCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) return false;

        pCtx.globalAlpha = p.life;
        pCtx.fillStyle = p.color;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        pCtx.fill();

        pCtx.globalAlpha = p.life * 0.5;
        pCtx.shadowColor = p.color;
        pCtx.shadowBlur = 10;
        pCtx.fill();
        pCtx.shadowBlur = 0;
        pCtx.globalAlpha = 1;

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(CANVAS_WIDTH, Math.floor(e.clientX - rect.left))),
      y: Math.max(0, Math.min(CANVAS_HEIGHT, Math.floor(e.clientY - rect.top))),
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setMousePos(coords);

    if (draggedElement) {
      setLayout(prev => ({
        ...prev,
        elements: prev.elements.map(el =>
          el.id === draggedElement.id
            ? { ...el, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
            : el
        ),
      }));
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    if (selectedTool) {
      const newElement: RoomElement = {
        id: uuidv4(),
        type: selectedTool,
        x: coords.x - 25,
        y: coords.y - 25,
        width: selectedTool === 'wall' ? 100 : 50,
        height: selectedTool === 'wall' ? 20 : 50,
        label: selectedTool === 'item' ? '道具' : selectedTool === 'clue' ? '线索' : selectedTool === 'exit' ? '出口' : '墙',
      };
      setLayout(prev => ({ ...prev, elements: [...prev.elements, newElement] }));
      triggerParticles(coords.x, coords.y);
      setSelectedTool(null);
      return;
    }

    let found: RoomElement | null = null;
    for (let i = layout.elements.length - 1; i >= 0; i--) {
      const el = layout.elements[i];
      if (coords.x >= el.x && coords.x <= el.x + el.width &&
          coords.y >= el.y && coords.y <= el.y + el.height) {
        found = el;
        break;
      }
    }

    setSelectedElement(found);
    if (found) {
      triggerParticles(found.x + found.width / 2, found.y + found.height / 2);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    for (let i = layout.elements.length - 1; i >= 0; i--) {
      const el = layout.elements[i];
      if (coords.x >= el.x && coords.x <= el.x + el.width &&
          coords.y >= el.y && coords.y <= el.y + el.height) {
        setDraggedElement(el);
        setDragOffset({ x: coords.x - el.x, y: coords.y - el.y });
        break;
      }
    }
  };

  const handleMouseUp = () => {
    if (draggedElement) {
      localStorage.setItem('room_layout_draft', JSON.stringify(layout));
    }
    setDraggedElement(null);
  };

  const updateSelectedElement = (updates: Partial<RoomElement>) => {
    if (!selectedElement) return;
    setLayout(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === selectedElement.id ? { ...el, ...updates } : el
      ),
    }));
    setSelectedElement(prev => prev ? { ...prev, ...updates } : null);
  };

  const deleteSelectedElement = () => {
    if (!selectedElement) return;
    setLayout(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== selectedElement.id),
    }));
    setSelectedElement(null);
    triggerErrorFlash();
  };

  const saveVersion = () => {
    const versionName = prompt('输入版本名称：', `版本 ${versions.length + 1}`);
    if (versionName) {
      setVersions(prev => [...prev, { name: versionName, layout: JSON.parse(JSON.stringify(layout)) }]);
      localStorage.setItem('room_versions', JSON.stringify([...versions, { name: versionName, layout }]));
    }
  };

  const loadVersion = (v: { name: string; layout: RoomLayout }) => {
    setLayout(JSON.parse(JSON.stringify(v.layout)));
    setSelectedElement(null);
  };

  const saveAndPublish = async () => {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout, name: layout.name }),
      });
      const data = await res.json();
      if (data.shareUrl) {
        setShareUrl(data.shareUrl);
        localStorage.setItem('room_layout_draft', JSON.stringify(layout));
      }
    } catch (e) {
      console.error('Save failed:', e);
      setShareUrl(`${window.location.origin}/#/room/demo`);
    }
  };

  useEffect(() => {
    const savedVersions = localStorage.getItem('room_versions');
    if (savedVersions) {
      try {
        setVersions(JSON.parse(savedVersions));
      } catch (e) {}
    }
  }, []);

  const tools: { type: ElementType; label: string; color: string }[] = [
    { type: 'wall', label: '墙壁', color: '#3a3a5a' },
    { type: 'item', label: '道具', color: '#cd853f' },
    { type: 'clue', label: '线索', color: '#9370db' },
    { type: 'exit', label: '出口', color: '#4a7c23' },
  ];

  return (
    <div className="editor-container">
      {showCrack && <div className="crack-overlay" />}

      <div className="editor-sidebar">
        <div className="glass-panel" style={{ marginBottom: '16px', padding: '16px' }}>
          <button className="btn-ghost" style={{ width: '100%', marginBottom: '12px' }} onClick={onBack}>
            ← 返回首页
          </button>
          <h2 className="copper-text" style={{ fontSize: '18px', marginBottom: '16px' }}>元素工具</h2>
          <div className="element-toolbar" style={{ padding: 0 }}>
            {tools.map(tool => (
              <div
                key={tool.type}
                className={`tool-item ${selectedTool === tool.type ? 'active' : ''}`}
                draggable
                onClick={() => setSelectedTool(tool.type)}
                onDragStart={(e) => {
                  setSelectedTool(tool.type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
              >
                <div className="tool-icon" style={{ background: tool.color }}>
                  {ELEMENT_ICONS[tool.type]}
                </div>
                <div style={{ fontSize: '12px' }}>{tool.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 className="copper-text" style={{ fontSize: '14px', marginBottom: '12px' }}>版本管理</h3>
          <button className="btn-copper" style={{ width: '100%', marginBottom: '12px', fontSize: '13px', padding: '8px' }} onClick={saveVersion}>
            + 保存新版本
          </button>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {versions.map((v, i) => (
              <div
                key={i}
                style={{
                  padding: '8px',
                  marginBottom: '4px',
                  background: 'rgba(205, 133, 63, 0.1)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
                onClick={() => loadVersion(v)}
              >
                {v.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="editor-main">
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', marginRight: '8px' }}>密室名称：</label>
            <input
              value={layout.name}
              onChange={e => setLayout(prev => ({ ...prev, name: e.target.value }))}
              style={{ width: '300px', fontSize: '16px', fontWeight: 600 }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-ghost" onClick={() => { setLayout(DEFAULT_LAYOUT); triggerErrorFlash(); }}>
              重置
            </button>
            <button className="btn-copper" onClick={saveAndPublish}>
              ◆ 发布密室
            </button>
          </div>
        </div>

        {shareUrl && (
          <div className="glass-panel fade-in" style={{ padding: '16px', background: 'rgba(74, 124, 35, 0.2)', borderColor: '#4a7c23' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#4a7c23' }}>✓ 发布成功！分享链接：</span>
              <button className="btn-ghost" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => navigator.clipboard?.writeText(shareUrl)}>
                复制
              </button>
            </div>
            <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent-copper-mid)' }}>
              {shareUrl}
            </div>
          </div>
        )}

        <div className="canvas-container glass-panel" style={{ padding: '12px', alignSelf: 'center' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ display: 'block', borderRadius: '4px' }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { setMousePos(null); setDraggedElement(null); }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const coords = getCanvasCoords(e as any);
              if (selectedTool) {
                handleCanvasClick({ ...e, clientX: e.clientX, clientY: e.clientY } as any);
              }
            }}
          />
          <canvas
            ref={particleCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="particle-canvas"
            style={{ left: '12px', top: '12px' }}
          />
          {mousePos && (
            <div
              className="coord-tooltip"
              style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}
            >
              ({mousePos.x}, {mousePos.y})
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
          <span>📏 画布尺寸: {CANVAS_WIDTH} × {CANVAS_HEIGHT}</span>
          <span>|</span>
          <span>🔲 网格尺寸: {GRID_SIZE}px</span>
          <span>|</span>
          <span>📦 元素数量: {layout.elements.length}</span>
        </div>
      </div>

      <div className="editor-properties">
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h2 className="copper-text" style={{ fontSize: '18px', marginBottom: '16px' }}>属性面板</h2>

          {!selectedElement ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
              选中画布上的元素<br/>以编辑其属性
            </p>
          ) : (
            <>
              <div className="property-group">
                <label>元素类型</label>
                <div className="copper-text" style={{ fontSize: '16px', fontWeight: 600 }}>
                  {ELEMENT_ICONS[selectedElement.type]} {selectedElement.type === 'wall' ? '墙壁' : selectedElement.type === 'item' ? '道具' : selectedElement.type === 'clue' ? '线索' : '出口'}
                </div>
              </div>

              <div className="property-group">
                <label>名称</label>
                <input
                  value={selectedElement.label || ''}
                  onChange={e => updateSelectedElement({ label: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="property-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label>X 坐标</label>
                  <input
                    type="number"
                    value={selectedElement.x}
                    onChange={e => updateSelectedElement({ x: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label>Y 坐标</label>
                  <input
                    type="number"
                    value={selectedElement.y}
                    onChange={e => updateSelectedElement({ y: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="property-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label>宽度</label>
                  <input
                    type="number"
                    value={selectedElement.width}
                    onChange={e => updateSelectedElement({ width: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label>高度</label>
                  <input
                    type="number"
                    value={selectedElement.height}
                    onChange={e => updateSelectedElement({ height: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="property-group">
                <label>交互类型</label>
                <select
                  value={selectedElement.interaction?.type || ''}
                  onChange={e => {
                    const type = e.target.value as any;
                    if (type) {
                      updateSelectedElement({ interaction: { type, content: '' } });
                    } else {
                      updateSelectedElement({ interaction: undefined });
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="">无交互</option>
                  <option value="click_text">点击显示文字</option>
                  <option value="password">输入密码</option>
                  <option value="sequence_trigger">顺序触发</option>
                  <option value="drag_target">拖拽目标</option>
                </select>
              </div>

              {selectedElement.interaction?.type === 'click_text' && (
                <div className="property-group">
                  <label>显示内容</label>
                  <textarea
                    value={selectedElement.interaction.content || ''}
                    onChange={e => updateSelectedElement({
                      interaction: { ...selectedElement.interaction!, content: e.target.value }
                    })}
                    style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                  />
                </div>
              )}

              {selectedElement.interaction?.type === 'password' && (
                <div className="property-group">
                  <label>正确密码</label>
                  <input
                    value={selectedElement.interaction.password || ''}
                    onChange={e => updateSelectedElement({
                      interaction: { ...selectedElement.interaction!, password: e.target.value }
                    })}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {selectedElement.interaction?.type === 'sequence_trigger' && (
                <div className="property-group">
                  <label>触发组 ID</label>
                  <input
                    value={selectedElement.interaction.triggerId || ''}
                    onChange={e => updateSelectedElement({
                      interaction: { ...selectedElement.interaction!, triggerId: e.target.value }
                    })}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <button
                className="btn-ghost"
                style={{ width: '100%', marginTop: '16px', borderColor: '#8b0000', color: '#dc143c' }}
                onClick={deleteSelectedElement}
              >
                ✕ 删除元素
              </button>
            </>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '16px', marginTop: '16px' }}>
          <h3 className="copper-text" style={{ fontSize: '14px', marginBottom: '12px' }}>谜题配置</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '12px' }}>
            {layout.puzzles.map((p, i) => (
              <div key={p.id} style={{ padding: '10px', marginBottom: '8px', background: 'rgba(205, 133, 63, 0.05)', borderRadius: '4px' }}>
                <div style={{ color: 'var(--accent-copper-mid)', marginBottom: '4px' }}>
                  关卡 {p.level}: {p.type === 'sequence' ? '顺序解谜' : p.type === 'password' ? '密码解谜' : '位置组合'}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                  提示: {p.hint}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
                  {p.unlocksExit ? '🔓 解锁出口' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
