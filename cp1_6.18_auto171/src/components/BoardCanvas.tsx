import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useBoardStore } from '@/stores/boardStore';
import { BoardEngine } from '@/engine/boardEngine';
import { CollaborationEngine } from '@/engine/collaborationEngine';
import type { BoardElement, PathPoint } from '@/data/boardData';

export default function BoardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BoardEngine | null>(null);
  const collabRef = useRef<CollaborationEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editingStickyRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    roomId, tool, penColor, penWidth, elements, selectedElementId,
    undoStack, redoStack, snapshots,
    isDrawing, currentPath, isDragging, dragStartPos, dragElementStartPos,
    setElements, addElement, updateElement, deleteElement, selectElement,
    setSnapshots, addSnapshot, markSnapshotsExpired,
    pushUndo, undo, redo,
    setIsDrawing, addPathPoint, clearCurrentPath,
    setIsDragging, setDragStartPos, setDragElementStartPos,
    setShowClearConfirm, showClearConfirm, showRollbackConfirm, setShowRollbackConfirm,
  } = useBoardStore();

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new BoardEngine();
    engine.init(canvasRef.current);
    engineRef.current = engine;

    const collab = new CollaborationEngine();
    collabRef.current = collab;

    collab.onRemoteAction((action) => {
      switch (action.type) {
        case 'state':
          setElements(action.elements!);
          setSnapshots(action.snapshots!);
          break;
        case 'element:add':
          addElement(action.element!);
          break;
        case 'element:update':
          updateElement(action.element!.id, action.element!);
          break;
        case 'element:delete':
          deleteElement(action.elementId!);
          break;
        case 'clear':
          useBoardStore.getState().clearElements();
          break;
        case 'snapshot':
          addSnapshot(action.snapshot!);
          break;
        case 'rollback':
          setElements(action.elements!);
          markSnapshotsExpired(action.expiredSnapshotIds!);
          break;
      }
    });

    if (roomId) {
      collab.connect(roomId);
    }

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
      collab.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.render(elements, selectedElementId);
  }, [elements, selectedElementId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        redo();
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && !(e.target instanceof HTMLTextAreaElement)) {
          const el = elements.find(e => e.id === selectedElementId);
          if (el) {
            pushUndo({ type: 'delete', element: el });
            deleteElement(selectedElementId);
            collabRef.current?.sendElementDelete(selectedElementId);
          }
        }
      } else if (e.key === 'Escape') {
        selectElement(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements, undoStack, redoStack]);

  const getCanvasPos = useCallback((e: React.MouseEvent): PathPoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    const state = useBoardStore.getState();

    if (state.tool === 'select') {
      const hit = engineRef.current?.hitTest(pos.x, pos.y, state.elements);
      if (hit) {
        selectElement(hit.id);
        setIsDragging(true);
        setDragStartPos(pos);
        setDragElementStartPos({ x: hit.x, y: hit.y });
      } else {
        selectElement(null);
      }
    } else if (state.tool === 'pen') {
      setIsDrawing(true);
      clearCurrentPath();
      addPathPoint(pos);
    } else if (state.tool === 'eraser') {
      const hit = engineRef.current?.hitTest(pos.x, pos.y, state.elements);
      if (hit) {
        pushUndo({ type: 'delete', element: hit });
        deleteElement(hit.id);
        collabRef.current?.sendElementDelete(hit.id);
      }
    } else if (state.tool === 'sticky') {
      const newSticky: BoardElement = {
        id: uuidv4(),
        type: 'sticky',
        x: pos.x - 75,
        y: pos.y - 50,
        width: 150,
        height: 100,
        text: '',
        opacity: 1,
        zIndex: state.elements.length + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      pushUndo({ type: 'add', element: newSticky });
      addElement(newSticky);
      collabRef.current?.sendElementAdd(newSticky);
    }
  }, [getCanvasPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    const state = useBoardStore.getState();

    if (state.isDrawing && state.tool === 'pen') {
      addPathPoint(pos);
      const engine = engineRef.current;
      if (engine && state.currentPath.length >= 2) {
        const tempElement: BoardElement = {
          id: '__drawing__',
          type: 'path',
          x: 0, y: 0, width: 0, height: 0,
          color: state.penColor,
          strokeWidth: state.penWidth,
          points: state.currentPath,
          opacity: 1,
          zIndex: 9999,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const allElements = [...state.elements, tempElement];
        engine.render(allElements, state.selectedElementId);
      }
    } else if (state.isDragging && state.selectedElementId && state.dragStartPos && state.dragElementStartPos) {
      const dx = pos.x - state.dragStartPos.x;
      const dy = pos.y - state.dragStartPos.y;
      const el = state.elements.find(el => el.id === state.selectedElementId);
      if (el) {
        const updated = { ...el, x: state.dragElementStartPos.x + dx, y: state.dragElementStartPos.y + dy, opacity: 0.8 };
        updateElement(el.id, updated);
      }
    }
  }, [getCanvasPos]);

  const handleMouseUp = useCallback(() => {
    const state = useBoardStore.getState();

    if (state.isDrawing && state.tool === 'pen' && state.currentPath.length >= 2) {
      const newPath: BoardElement = {
        id: uuidv4(),
        type: 'path',
        x: 0, y: 0, width: 0, height: 0,
        color: state.penColor,
        strokeWidth: state.penWidth,
        points: [...state.currentPath],
        opacity: 1,
        zIndex: state.elements.length + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      pushUndo({ type: 'add', element: newPath });
      addElement(newPath);
      collabRef.current?.sendElementAdd(newPath);
    }
    setIsDrawing(false);
    clearCurrentPath();

    if (state.isDragging && state.selectedElementId) {
      const el = state.elements.find(el => el.id === state.selectedElementId);
      if (el) {
        const previousElement = { ...el, opacity: 1 };
        updateElement(el.id, { opacity: 1 });
        const currentEl = useBoardStore.getState().elements.find(e => e.id === state.selectedElementId);
        if (currentEl) {
          pushUndo({ type: 'update', element: currentEl, previousElement });
          collabRef.current?.sendElementUpdate(currentEl);
        }
      }
    }
    setIsDragging(false);
    setDragStartPos(null);
    setDragElementStartPos(null);
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    const state = useBoardStore.getState();
    const hit = engineRef.current?.hitTest(pos.x, pos.y, state.elements);
    if (hit && hit.type === 'sticky') {
      selectElement(hit.id);
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const textarea = document.createElement('textarea');
      textarea.value = hit.text || '';
      textarea.style.position = 'absolute';
      textarea.style.left = `${rect.left + hit.x + 10}px`;
      textarea.style.top = `${rect.top + hit.y + 10}px`;
      textarea.style.width = `${hit.width - 20}px`;
      textarea.style.height = `${hit.height - 20}px`;
      textarea.style.border = 'none';
      textarea.style.background = 'transparent';
      textarea.style.font = '14px sans-serif';
      textarea.style.color = '#333333';
      textarea.style.resize = 'none';
      textarea.style.outline = 'none';
      textarea.style.zIndex = '9999';
      document.body.appendChild(textarea);
      textarea.focus();
      editingStickyRef.current = textarea;

      const finishEdit = () => {
        const newText = textarea.value;
        const previousEl = { ...hit };
        const updatedEl = { ...hit, text: newText, updatedAt: Date.now() };
        pushUndo({ type: 'update', element: updatedEl, previousElement: previousEl });
        updateElement(hit.id, { text: newText });
        collabRef.current?.sendElementUpdate(updatedEl);
        textarea.remove();
        editingStickyRef.current = null;
      };

      textarea.addEventListener('blur', finishEdit);
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          textarea.removeEventListener('blur', finishEdit);
          textarea.remove();
          editingStickyRef.current = null;
        }
      });
    }
  }, [getCanvasPos]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) return;
    if (file.size > 2 * 1024 * 1024) return;

    const pos = getCanvasPos(e as any);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const state = useBoardStore.getState();
        const newImage: BoardElement = {
          id: uuidv4(),
          type: 'image',
          x: pos.x - img.width / 2,
          y: pos.y - img.height / 2,
          width: Math.min(img.width, 400),
          height: Math.min(img.height, 400),
          dataUrl,
          opacity: 1,
          zIndex: state.elements.length + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        if (img.width > 400 || img.height > 400) {
          const scale = Math.min(400 / img.width, 400 / img.height);
          newImage.width = img.width * scale;
          newImage.height = img.height * scale;
        }
        pushUndo({ type: 'add', element: newImage });
        addElement(newImage);
        collabRef.current?.sendElementAdd(newImage);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [getCanvasPos]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleExport = useCallback(() => {
    if (!engineRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const dataUrl = engineRef.current.exportToImage(elements, canvas.width, canvas.height);
    const link = document.createElement('a');
    link.download = `灵感黑板_${new Date().toISOString().slice(0,10)}.png`;
    link.href = dataUrl;
    link.click();
  }, [elements]);

  useEffect(() => {
    (window as any).__boardExport = handleExport;
    return () => { delete (window as any).__boardExport; };
  }, [handleExport]);

  useEffect(() => {
    (window as any).__boardClear = () => {
      const state = useBoardStore.getState();
      if (state.elements.length > 0) {
        pushUndo({ type: 'clear', clearedElements: [...state.elements] });
      }
      useBoardStore.getState().clearElements();
      collabRef.current?.sendClear();
      setShowClearConfirm(false);
    };
    return () => { delete (window as any).__boardClear; };
  }, []);

  useEffect(() => {
    (window as any).__boardRollback = (snapshotId: string) => {
      collabRef.current?.sendRollback(snapshotId);
      setShowRollbackConfirm(null);
    };
    return () => { delete (window as any).__boardRollback; };
  }, []);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      />
    </div>
  );
}
