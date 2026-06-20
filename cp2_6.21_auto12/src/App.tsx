// ============================================================
// App.tsx - 根组件 / 主布局容器
// 调用关系 & 数据流向:
//   ┌─ useStore(layers, palette, selectedLayerId, activeColor) ─┐
//   │                                                            ↓
//   ├─→ CanvasRenderer.render(canvas, layers, palette, selectedId) [脏区域重绘]
//   ├─→ LayerPanel → 显示图层列表 / 拖拽排序 / 混合模式+不透明度
//   ├─→ SwatchPalette (absolute bottom) → 调色板 + 选色
//   ├─→ PropertyPanel → 选中图层属性编辑
//   └─→ Toolbar → 顶部工具栏 + 导出SVG
//
// 交互数据流:
//   画布mousedown → 命中检测(isPointInPath+逆矩阵) → selectLayer(id)
//   画布mousemove(拖拽中) → 标记脏区域 → updateLayer(id, {x,y})
//   属性面板滑块 → 标记脏区域 → updateLayer(id, {...})
//   Store状态变化 → useEffect → CanvasRenderer.render(requestAnimationFrame节流)
// ============================================================
import { useState, useEffect, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
import LayerPanel from '@/components/LayerPanel';
import SwatchPalette from '@/components/SwatchPalette';
import PropertyPanel from '@/components/PropertyPanel';
import * as CanvasRenderer from '@/components/CanvasRenderer';
import { useStore } from '@/shared/store';
import type { Layer } from '@/shared/store';
import { getLayerPath2D, getLayerBounds } from '@/components/CanvasRenderer';

export default function App() {
  const layers = useStore((s) => s.layers);
  const palette = useStore((s) => s.palette);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const activeColor = useStore((s) => s.activeColor);
  const selectLayer = useStore((s) => s.selectLayer);
  const updateLayer = useStore((s) => s.updateLayer);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 1024);
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(false);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(false);
  const draggingRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const prevLayersRef = useRef<Map<string, Layer>>(new Map());
  const lastMovePosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setLeftPanelOpen(false);
        setRightPanelOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const prev = prevLayersRef.current;
      let needsFullRender = layers.length !== prev.size;
      if (!needsFullRender) {
        for (const layer of layers) {
          const old = prev.get(layer.id);
          if (!old) { needsFullRender = true; break; }
          const bOld = getLayerBounds(old);
          const bNew = getLayerBounds(layer);
          CanvasRenderer.markDirty(bOld);
          CanvasRenderer.markDirty(bNew);
          if (old.blendMode !== layer.blendMode || old.opacity !== layer.opacity ||
              old.colorIndex !== layer.colorIndex || old.customColor !== layer.customColor ||
              old.scale !== layer.scale || old.rotation !== layer.rotation || old.type !== layer.type) {
            needsFullRender = true;
            break;
          }
        }
      }
      if (needsFullRender) {
        CanvasRenderer.markDirty({ x: 0, y: 0, w: 800, h: 600 });
      }
      CanvasRenderer.render(canvasRef.current, layers, palette, selectedLayerId);
      prevLayersRef.current = new Map(layers.map(l => [l.id, { ...l }]));
    }
  }, [layers, palette, selectedLayerId]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const s = layer.scale / 100;
      const rad = (layer.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = mx - layer.x;
      const dy = my - layer.y;
      const a = (dx * cos + dy * sin) / s;
      const b = (-dx * sin + dy * cos) / s;
      const lx = a + 50;
      const ly = b + 50;

      const ctx = canvas.getContext('2d')!;
      const path = getLayerPath2D(layer.type);
      if (ctx.isPointInPath(path, lx, ly)) {
        selectLayer(layer.id);
        draggingRef.current = {
          id: layer.id,
          offsetX: mx - layer.x,
          offsetY: my - layer.y
        };
        lastMovePosRef.current = { x: layer.x, y: layer.y };
        return;
      }
    }
    selectLayer(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const { id, offsetX, offsetY } = draggingRef.current;
    const newX = Math.round(mx - offsetX);
    const newY = Math.round(my - offsetY);

    const layer = layers.find(l => l.id === id);
    if (layer && lastMovePosRef.current) {
      const oldLayer = { ...layer, x: lastMovePosRef.current.x, y: lastMovePosRef.current.y };
      const newLayer = { ...layer, x: newX, y: newY };
      const bOld = getLayerBounds(oldLayer);
      const bNew = getLayerBounds(newLayer);
      CanvasRenderer.markDirty(bOld);
      CanvasRenderer.markDirty(bNew);
      lastMovePosRef.current = { x: newX, y: newY };
    }

    updateLayer(id, { x: newX, y: newY });
  };

  const handleCanvasMouseUp = () => {
    draggingRef.current = null;
    lastMovePosRef.current = null;
  };

  const leftPanelStyle: React.CSSProperties = isDesktop
    ? { width: '280px', flexShrink: 0, background: '#1e1e2e', position: 'relative', height: 'calc(100vh - 56px)', overflow: 'hidden' }
    : {
        position: 'fixed',
        top: '56px',
        left: 0,
        width: '320px',
        height: 'calc(100vh - 56px)',
        background: '#1e1e2e',
        zIndex: 90,
        transform: leftPanelOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-out',
        overflow: 'hidden'
      };

  const rightPanelStyle: React.CSSProperties = isDesktop
    ? { width: '240px', flexShrink: 0, background: '#1e1e2e', height: 'calc(100vh - 56px)', overflow: 'auto' }
    : {
        position: 'fixed',
        top: '56px',
        right: 0,
        width: '320px',
        height: 'calc(100vh - 56px)',
        background: '#1e1e2e',
        zIndex: 90,
        transform: rightPanelOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-out',
        overflow: 'auto'
      };

  const maskStyle: React.CSSProperties = {
    position: 'fixed',
    top: '56px',
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 85
  };

  return (
    <div style={{ paddingTop: '56px' }}>
      <Toolbar leftPanelOpen={leftPanelOpen} setLeftPanelOpen={setLeftPanelOpen} />

      {!isDesktop && (leftPanelOpen || rightPanelOpen) && (
        <div style={maskStyle} onClick={() => { setLeftPanelOpen(false); setRightPanelOpen(false); }} />
      )}

      <div style={{ display: 'flex' }}>
        <div style={leftPanelStyle}>
          <LayerPanel />
          <SwatchPalette />
        </div>

        <div style={{
          flex: 1,
          background: '#2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          minHeight: 'calc(100vh - 56px)',
          boxSizing: 'border-box'
        }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            style={{
              background: '#2a2a2a',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              borderRadius: '8px',
              maxWidth: '100%',
              height: 'auto'
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
        </div>

        <div style={rightPanelStyle}>
          <PropertyPanel />
        </div>
      </div>
    </div>
  );
}
