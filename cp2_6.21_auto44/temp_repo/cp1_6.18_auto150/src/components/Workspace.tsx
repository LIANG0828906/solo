import React, { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MAX_PARTS } from '../types';
import type { PlacedPart } from '../types';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useOrderStore } from '../stores/orderStore';
import { getTemplateById } from '../data/partData';
import { placePart, recomputeHighlights } from '../engine/assemblyEngine';
import {
  renderAll,
  renderDragPreview,
  renderPart,
  renderBlinkingPart,
  exportToPNG,
} from '../renderer/workspaceRenderer';

interface Props {
  snapshotRef: React.MutableRefObject<((nickname: string) => void) | null>;
}

export const Workspace: React.FC<Props> = ({ snapshotRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const parts = useWorkspaceStore((s) => s.parts);
  const drag = useWorkspaceStore((s) => s.drag);
  const blinkingInstanceId = useWorkspaceStore((s) => s.blinkingInstanceId);
  const bouncingInstanceId = useWorkspaceStore((s) => s.bouncingInstanceId);
  const addPart = useWorkspaceStore((s) => s.addPart);
  const removePart = useWorkspaceStore((s) => s.removePart);
  const updatePart = useWorkspaceStore((s) => s.updatePart);
  const applyHighlightUpdates = useWorkspaceStore((s) => s.applyHighlightUpdates);
  const setBlinking = useWorkspaceStore((s) => s.setBlinking);
  const setBouncing = useWorkspaceStore((s) => s.setBouncing);
  const setDrag = useWorkspaceStore((s) => s.setDrag);
  const resetDrag = useWorkspaceStore((s) => s.resetDrag);
  const syncFromParts = useOrderStore((s) => s.syncFromParts);

  const blinkAnimRef = useRef<number | null>(null);
  const bounceAnimRef = useRef<number | null>(null);
  const bounceStartTimeRef = useRef<number>(0);
  const bounceInstanceIdRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const renderTickRef = useRef(0);

  useEffect(() => {
    syncFromParts(parts);
  }, [parts, syncFromParts]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderAll(ctx, parts, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (bounceInstanceIdRef.current) {
      const p = parts.find((x) => x.instanceId === bounceInstanceIdRef.current);
      if (p) {
        const elapsed = performance.now() - bounceStartTimeRef.current;
        const t = Math.min(1, elapsed / 200);
        const progress = t < 0.5 ? t * 2 : (1 - t) * 2;
        const offset = 3 * progress * (1 - t);
        renderPart(ctx, p, { bounceOffset: offset });
      }
    }

    if (blinkingInstanceId) {
      const p = parts.find((x) => x.instanceId === blinkingInstanceId);
      if (p) {
        const t = (performance.now() % 300) / 300;
        const intensity = Math.sin(t * Math.PI);
        renderBlinkingPart(ctx, p, intensity);
      }
    }

    if (drag.isDragging && drag.templateId) {
      const tpl = getTemplateById(drag.templateId);
      if (tpl && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const localX = drag.mouseX - rect.left;
        const localY = drag.mouseY - rect.top;
        if (localX >= 0 && localX <= CANVAS_WIDTH && localY >= 0 && localY <= CANVAS_HEIGHT) {
          renderDragPreview(ctx, tpl, localX, localY);
        }
      }
    }
  }, [parts, drag, blinkingInstanceId]);

  useEffect(() => {
    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!drag.isDragging) return;
      setDrag({ mouseX: e.clientX, mouseY: e.clientY });
    },
    [drag.isDragging, setDrag]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!drag.isDragging) return;
      const t = e.touches[0];
      if (t) {
        e.preventDefault();
        setDrag({ mouseX: t.clientX, mouseY: t.clientY });
      }
    },
    [drag.isDragging, setDrag]
  );

  const doCollisionBlink = useCallback(
    (templateId: string, x: number, y: number) => {
      const tempId = uuidv4();
      const tpl = getTemplateById(templateId);
      if (!tpl) return;
      const fakePart: PlacedPart = {
        instanceId: tempId,
        templateId,
        x,
        y,
        rotation: 0,
        isHighlighted: false,
      };
      addPart(fakePart);
      setBlinking(tempId);
      if (blinkAnimRef.current) clearTimeout(blinkAnimRef.current);
      blinkAnimRef.current = window.setTimeout(() => {
        removePart(tempId);
        setBlinking(null);
      }, 300);
    },
    [addPart, removePart, setBlinking]
  );

  const triggerBounce = useCallback(
    (instanceId: string) => {
      bounceInstanceIdRef.current = instanceId;
      bounceStartTimeRef.current = performance.now();
      setBouncing(instanceId);
      if (bounceAnimRef.current) clearTimeout(bounceAnimRef.current);
      bounceAnimRef.current = window.setTimeout(() => {
        bounceInstanceIdRef.current = null;
        setBouncing(null);
      }, 220);
    },
    [setBouncing]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!drag.isDragging || !drag.templateId) {
        resetDrag();
        return;
      }
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      if (x < 0 || x > CANVAS_WIDTH || y < 0 || y > CANVAS_HEIGHT) {
        resetDrag();
        return;
      }

      const tpl = getTemplateById(drag.templateId);
      if (!tpl) {
        resetDrag();
        return;
      }

      if (drag.source === 'panel' && parts.length >= MAX_PARTS) {
        resetDrag();
        return;
      }

      const existingForMove = drag.source === 'workspace' ? drag.instanceId : undefined;
      if (drag.source === 'workspace' && existingForMove) {
        const currentPart = parts.find((p) => p.instanceId === existingForMove);
        const remaining = parts.filter((p) => p.instanceId !== existingForMove);
        if (currentPart) {
          const result = placePart(drag.templateId, x, y, remaining, existingForMove);
          if (result.success && result.placedPart) {
            updatePart(existingForMove, {
              x: result.placedPart.x,
              y: result.placedPart.y,
            });
            if (result.highlightUpdates.length > 0) applyHighlightUpdates(result.highlightUpdates);
            const recomputed = recomputeHighlights([...remaining, result.placedPart]);
            if (recomputed.length > 0) applyHighlightUpdates(recomputed);
            triggerBounce(existingForMove);
          } else if (result.collision) {
            doCollisionBlink(drag.templateId, currentPart.x, currentPart.y);
          }
        }
      } else {
        const result = placePart(drag.templateId, x, y, parts);
        if (result.success && result.placedPart) {
          addPart(result.placedPart);
          if (result.highlightUpdates.length > 0) applyHighlightUpdates(result.highlightUpdates);
          triggerBounce(result.placedPart.instanceId);
        } else if (result.collision) {
          const tplData = getTemplateById(drag.templateId);
          if (tplData) {
            const cx = Math.max(0, Math.min(CANVAS_WIDTH - tplData.width, x - tplData.width / 2));
            const cy = Math.max(0, Math.min(CANVAS_HEIGHT - tplData.height, y - tplData.height / 2));
            doCollisionBlink(drag.templateId, cx, cy);
          }
        }
      }
      resetDrag();
    },
    [
      drag,
      parts,
      getCanvasCoords,
      resetDrag,
      addPart,
      updatePart,
      applyHighlightUpdates,
      doCollisionBlink,
      triggerBounce,
    ]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!drag.isDragging || !drag.templateId) {
        resetDrag();
        return;
      }
      const t = e.changedTouches[0];
      if (!t) {
        resetDrag();
        return;
      }
      const fakeEvent = { clientX: t.clientX, clientY: t.clientY } as MouseEvent;
      handleMouseUp(fakeEvent);
    },
    [drag, resetDrag, handleMouseUp]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        const tpl = getTemplateById(p.templateId);
        if (!tpl) continue;
        if (x >= p.x && x <= p.x + tpl.width && y >= p.y && y <= p.y + tpl.height) {
          e.preventDefault();
          setDrag({
            isDragging: true,
            templateId: p.templateId,
            instanceId: p.instanceId,
            mouseX: e.clientX,
            mouseY: e.clientY,
            source: 'workspace',
          });
          return;
        }
      }
    },
    [parts, getCanvasCoords, setDrag]
  );

  const handleCanvasTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const { x, y } = getCanvasCoords(t.clientX, t.clientY);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        const tpl = getTemplateById(p.templateId);
        if (!tpl) continue;
        if (x >= p.x && x <= p.x + tpl.width && y >= p.y && y <= p.y + tpl.height) {
          setDrag({
            isDragging: true,
            templateId: p.templateId,
            instanceId: p.instanceId,
            mouseX: t.clientX,
            mouseY: t.clientY,
            source: 'workspace',
          });
          return;
        }
      }
    },
    [parts, getCanvasCoords, setDrag]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleSnapshot = useCallback(
    (nickname: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = exportToPNG(canvas, 2);
      try {
        const key = 'partWorkshop_snapshots';
        const raw = localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift({
          nickname,
          timestamp: Date.now(),
          dataUrl,
        });
        localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
      } catch {
        /* ignore */
      }
      const win = window.open();
      if (win) {
        win.document.write(
          `<html><head><title>${nickname} 的手作作品 - 零件拼搭工坊</title></head><body style="margin:0;background:#FAFAF0;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;"><h2 style="color:#5C4033;margin:0;">${nickname} 的手作作品</h2><img src="${dataUrl}" style="max-width:90%;max-height:80vh;border-radius:12px;box-shadow:0 8px 24px rgba(92,64,51,0.2);" /><a href="${dataUrl}" download="手作作品.png" style="padding:10px 20px;background:#D4A373;color:#FFFBF5;border-radius:8px;text-decoration:none;font-weight:600;">下载图片</a></body></html>`
        );
      }
    },
    []
  );

  useEffect(() => {
    snapshotRef.current = handleSnapshot;
  }, [snapshotRef, handleSnapshot]);

  return (
    <div
      ref={containerRef}
      style={{
        background: '#FFFBF5',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 4px 20px rgba(92,64,51,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: '#8B5E3C',
        }}
      >
        <span>工作区：{CANVAS_WIDTH} × {CANVAS_HEIGHT}</span>
        <span>已放置 {parts.length} / {MAX_PARTS} 个零件</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleCanvasMouseDown}
        onTouchStart={handleCanvasTouchStart}
        style={{
          display: 'block',
          borderRadius: 8,
          cursor: drag.isDragging ? 'grabbing' : 'default',
          boxShadow: 'inset 0 0 0 1px rgba(191,140,111,0.3)',
          maxWidth: '100%',
          height: 'auto',
          touchAction: 'none',
        }}
      />
      <div style={{ fontSize: 11, color: '#8B5E3C', opacity: 0.7 }}>
        💡 提示：从左侧拖拽零件到画布；点击画布上的零件可再次拖动调整位置
      </div>
    </div>
  );
};
