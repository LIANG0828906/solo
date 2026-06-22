import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { useMagazineStore } from './store';
import { FONTS, CANVAS_ASPECT, MAX_PAGES } from './types';
import type { MagazineElement } from './types';

const ELEMENT_ADD = 'ELEMENT_ADD';
const PAGE_REORDER = 'PAGE_REORDER';

interface DragItem {
  type: string;
  elementType?: 'text' | 'image' | 'rect';
  fromIndex?: number;
}

function ResizeHandle({
  position,
  onDragStart,
}: {
  position: string;
  onDragStart: (pos: string, e: React.MouseEvent) => void;
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#3498db',
    cursor: position.includes('n') && position.includes('w')
      ? 'nw-resize'
      : position.includes('n') && position.includes('e')
      ? 'ne-resize'
      : position.includes('s') && position.includes('w')
      ? 'sw-resize'
      : 'se-resize',
    zIndex: 10001,
    ...(position.includes('n') ? { top: -4 } : {}),
    ...(position.includes('s') ? { bottom: -4 } : {}),
    ...(position.includes('w') ? { left: -4 } : {}),
    ...(position.includes('e') ? { right: -4 } : {}),
  };
  return <div style={style} onMouseDown={(e) => { e.stopPropagation(); onDragStart(position, e); }} />;
}

function CanvasElement({
  element,
  isSelected,
  onSelect,
  onDragStart,
  onResizeStart,
  onRotateStart,
  containerRef,
}: {
  element: MagazineElement;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (pos: string, e: React.MouseEvent) => void;
  onRotateStart: (e: React.MouseEvent) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const updateElement = useMagazineStore((s) => s.updateElement);
  const removeElement = useMagazineStore((s) => s.removeElement);
  const currentPageId = useMagazineStore((s) => s.currentPageId);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    transform: `rotate(${element.rotation}deg)`,
    zIndex: element.zIndex + 1,
    cursor: 'move',
    border: isSelected ? '1.5px dashed #3498db' : '1px solid transparent',
    boxSizing: 'border-box',
    transition: 'opacity 0.3s ease',
  };

  const handleDoubleClick = () => {
    if (element.type === 'text') {
      const newContent = window.prompt('编辑文字内容', element.content || '');
      if (newContent !== null && currentPageId) {
        updateElement(currentPageId, element.id, { content: newContent });
      }
    } else if (element.type === 'image') {
      const newSrc = window.prompt('输入图片URL', element.src || '');
      if (newSrc !== null && currentPageId) {
        updateElement(currentPageId, element.id, { src: newSrc });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' && isSelected && currentPageId) {
      removeElement(currentPageId, element.id);
    }
  };

  let inner: React.ReactNode = null;
  if (element.type === 'text') {
    inner = (
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          fontFamily: element.fontFamily || 'Noto Serif SC',
          fontSize: element.fontSize || 16,
          color: element.color || '#000000',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          userSelect: 'none',
          padding: 2,
        }}
      >
        {element.content || '双击编辑文字'}
      </div>
    );
  } else if (element.type === 'image') {
    inner = element.src ? (
      <img
        src={element.src}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
        draggable={false}
      />
    ) : (
      <div style={{
        width: '100%',
        height: '100%',
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: 12,
      }}>
        双击设置图片URL
      </div>
    );
  } else if (element.type === 'rect') {
    inner = (
      <div style={{ width: '100%', height: '100%', background: element.fillColor || '#e67e22', borderRadius: 2 }} />
    );
  }

  return (
    <div
      style={style}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
        onDragStart(e);
      }}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {inner}
      {isSelected && (
        <>
          <ResizeHandle position="nw" onDragStart={onResizeStart} />
          <ResizeHandle position="ne" onDragStart={onResizeStart} />
          <ResizeHandle position="sw" onDragStart={onResizeStart} />
          <ResizeHandle position="se" onDragStart={onResizeStart} />
          <div
            style={{
              position: 'absolute',
              top: -28,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#3498db',
              cursor: 'grab',
              zIndex: 10001,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onRotateStart(e);
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -14,
              left: '50%',
              width: 1,
              height: 14,
              background: '#3498db',
              transform: 'translateX(-50%)',
            }}
          />
        </>
      )}
    </div>
  );
}

function PageCard({
  page,
  index,
  isSelected,
  isCover,
  onClick,
}: {
  page: { id: string; order: number; title: string; elements: MagazineElement[]; isToc: boolean };
  index: number;
  isSelected: boolean;
  isCover: boolean;
  onClick: () => void;
}) {
  const movePage = useMagazineStore((s) => s.movePage);
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop<DragItem>({
    accept: PAGE_REORDER,
    hover: (item) => {
      if (item.fromIndex === undefined) return;
      const fromIndex = item.fromIndex;
      if (fromIndex !== index) {
        movePage(fromIndex, index);
        item.fromIndex = index;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: PAGE_REORDER,
    item: { type: PAGE_REORDER, fromIndex: index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  const hasContent = page.elements.length > 0;

  return (
    <div
      ref={ref}
      onClick={onClick}
      style={{
        opacity: isDragging ? 0.4 : 1,
        background: isSelected ? '#fff8f0' : '#ffffff',
        border: isSelected ? '2px solid #e67e22' : '1px solid #e8e4df',
        borderRadius: 8,
        padding: 8,
        cursor: 'pointer',
        marginBottom: 8,
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28,
          height: Math.round(28 * CANVAS_ASPECT * 0.5),
          background: '#f0ece7',
          borderRadius: 3,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          color: isSelected ? '#e67e22' : '#999',
          border: hasContent ? 'none' : '1px dashed #ccc',
        }}>
          {page.order}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: isSelected ? 600 : 400,
            color: '#2c3e50',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {page.isToc ? '📑 目录' : page.title}
          </div>
          {isCover && (
            <span style={{ fontSize: 10, color: '#e67e22', fontWeight: 600 }}>封面</span>
          )}
        </div>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: isSelected ? '#e67e22' : '#d5d0ca',
          color: '#fff',
          fontSize: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {page.order}
        </div>
      </div>
    </div>
  );
}

function PropertyPanel() {
  const selectedElementId = useMagazineStore((s) => s.selectedElementId);
  const currentPageId = useMagazineStore((s) => s.currentPageId);
  const magazine = useMagazineStore((s) => s.magazine);
  const updateElement = useMagazineStore((s) => s.updateElement);
  const removeElement = useMagazineStore((s) => s.removeElement);
  const bringForward = useMagazineStore((s) => s.bringForward);
  const sendBackward = useMagazineStore((s) => s.sendBackward);

  if (!selectedElementId || !currentPageId) return null;

  const page = magazine.pages.find((p) => p.id === currentPageId);
  const element = page?.elements.find((e) => e.id === selectedElementId);
  if (!element) return null;

  const handleUpdate = (updates: Partial<MagazineElement>) => {
    updateElement(currentPageId, element.id, updates);
  };

  return (
    <div style={{
      position: 'absolute',
      right: 16,
      top: 70,
      width: 220,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(8px)',
      borderRadius: 10,
      padding: 14,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      zIndex: 200,
      fontSize: 12,
      color: '#2c3e50',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13 }}>
        {element.type === 'text' ? '📝 文字属性' : element.type === 'image' ? '🖼️ 图片属性' : '⬛ 色块属性'}
      </div>

      {element.type === 'text' && (
        <>
          <label style={{ display: 'block', marginBottom: 4, color: '#666' }}>字体</label>
          <select
            value={element.fontFamily || 'Noto Serif SC'}
            onChange={(e) => handleUpdate({ fontFamily: e.target.value })}
            style={{ width: '100%', marginBottom: 8, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd', fontSize: 12 }}
          >
            {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>

          <label style={{ display: 'block', marginBottom: 4, color: '#666' }}>字号</label>
          <input
            type="range"
            min={12}
            max={72}
            value={element.fontSize || 16}
            onChange={(e) => handleUpdate({ fontSize: Number(e.target.value) })}
            style={{ width: '100%', marginBottom: 2 }}
          />
          <div style={{ textAlign: 'center', marginBottom: 8, color: '#999' }}>{element.fontSize || 16}px</div>

          <label style={{ display: 'block', marginBottom: 4, color: '#666' }}>颜色</label>
          <input
            type="color"
            value={element.color || '#000000'}
            onChange={(e) => handleUpdate({ color: e.target.value })}
            style={{ width: '100%', height: 28, border: '1px solid #ddd', borderRadius: 4, marginBottom: 8 }}
          />
        </>
      )}

      {element.type === 'image' && (
        <>
          <label style={{ display: 'block', marginBottom: 4, color: '#666' }}>图片URL</label>
          <input
            type="text"
            value={element.src || ''}
            onChange={(e) => handleUpdate({ src: e.target.value })}
            placeholder="输入图片URL"
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd', fontSize: 11, marginBottom: 8, boxSizing: 'border-box' }}
          />
        </>
      )}

      {element.type === 'rect' && (
        <>
          <label style={{ display: 'block', marginBottom: 4, color: '#666' }}>填充颜色</label>
          <input
            type="color"
            value={element.fillColor || '#e67e22'}
            onChange={(e) => handleUpdate({ fillColor: e.target.value })}
            style={{ width: '100%', height: 28, border: '1px solid #ddd', borderRadius: 4, marginBottom: 8 }}
          />
        </>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          onClick={() => bringForward(currentPageId, element.id)}
          style={{
            flex: 1,
            padding: '4px 0',
            borderRadius: 4,
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 11,
            color: '#2c3e50',
          }}
        >
          上移层级
        </button>
        <button
          onClick={() => sendBackward(currentPageId, element.id)}
          style={{
            flex: 1,
            padding: '4px 0',
            borderRadius: 4,
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 11,
            color: '#2c3e50',
          }}
        >
          下移层级
        </button>
      </div>

      <button
        onClick={() => removeElement(currentPageId, element.id)}
        style={{
          width: '100%',
          marginTop: 8,
          padding: '6px 0',
          borderRadius: 4,
          border: 'none',
          background: '#e74c3c',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        删除元素
      </button>
    </div>
  );
}

export default function EditorCanvas() {
  const magazine = useMagazineStore((s) => s.magazine);
  const currentPageId = useMagazineStore((s) => s.currentPageId);
  const selectedElementId = useMagazineStore((s) => s.selectedElementId);
  const setCurrentPage = useMagazineStore((s) => s.setCurrentPage);
  const selectElement = useMagazineStore((s) => s.selectElement);
  const addElement = useMagazineStore((s) => s.addElement);
  const updateElement = useMagazineStore((s) => s.updateElement);
  const removePage = useMagazineStore((s) => s.removePage);
  const setCoverPage = useMagazineStore((s) => s.setCoverPage);
  const addPage = useMagazineStore((s) => s.addPage);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize' | 'rotate';
    elementId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    origR: number;
    handlePos?: string;
  } | null>(null);

  const currentPage = magazine.pages.find((p) => p.id === currentPageId);
  const sortedElements = currentPage
    ? [...currentPage.elements].sort((a, b) => a.zIndex - b.zIndex)
    : [];

  const handleCanvasDrop = useCallback(
    (item: DragItem, dropX: number, dropY: number) => {
      if (!currentPageId || !item.elementType) return;
      const el: MagazineElement = {
        id: uuidv4(),
        type: item.elementType,
        x: Math.max(0, dropX - 60),
        y: Math.max(0, dropY - 30),
        width: item.elementType === 'text' ? 200 : item.elementType === 'image' ? 200 : 120,
        height: item.elementType === 'text' ? 60 : item.elementType === 'image' ? 150 : 80,
        rotation: 0,
        zIndex: currentPage ? currentPage.elements.length + 1 : 1,
        ...(item.elementType === 'text'
          ? { content: '请输入文字', fontFamily: 'Noto Serif SC', fontSize: 20, color: '#2c3e50' }
          : item.elementType === 'rect'
          ? { fillColor: '#e67e22' }
          : {}),
      };
      addElement(currentPageId, el);
    },
    [currentPageId, currentPage, addElement]
  );

  const [, dropCanvas] = useDrop<DragItem>({
    accept: ELEMENT_ADD,
    drop: (item, monitor) => {
      const offset = monitor.getSourceClientOffset();
      if (offset && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        handleCanvasDrop(item, offset.x - rect.left, offset.y - rect.top);
      }
    },
  });

  dropCanvas(canvasRef);

  const getCanvasCoords = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!currentPageId || !currentPage) return;
      const el = currentPage.elements.find((e) => e.id === dragState.elementId);
      if (!el) return;

      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      if (dragState.type === 'move') {
        updateElement(currentPageId, dragState.elementId, {
          x: Math.max(0, dragState.origX + dx),
          y: Math.max(0, dragState.origY + dy),
        });
      } else if (dragState.type === 'resize' && dragState.handlePos) {
        let newW = dragState.origW;
        let newH = dragState.origH;
        let newX = dragState.origX;
        let newY = dragState.origY;

        if (dragState.handlePos.includes('e')) newW = Math.max(20, dragState.origW + dx);
        if (dragState.handlePos.includes('w')) {
          newW = Math.max(20, dragState.origW - dx);
          newX = dragState.origX + dx;
        }
        if (dragState.handlePos.includes('s')) newH = Math.max(20, dragState.origH + dy);
        if (dragState.handlePos.includes('n')) {
          newH = Math.max(20, dragState.origH - dy);
          newY = dragState.origY + dy;
        }

        updateElement(currentPageId, dragState.elementId, {
          x: newX,
          y: newY,
          width: newW,
          height: newH,
        });
      } else if (dragState.type === 'rotate') {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const cx = dragState.origX + dragState.origW / 2 + rect.left;
        const cy = dragState.origY + dragState.origH / 2 + rect.top;
        const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;
        const snapped = Math.round(angle);
        updateElement(currentPageId, dragState.elementId, {
          rotation: snapped,
        });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, currentPageId, currentPage, updateElement]);

  const handleElementDragStart = useCallback(
    (elementId: string, e: React.MouseEvent) => {
      if (!currentPage) return;
      const el = currentPage.elements.find((el) => el.id === elementId);
      if (!el) return;
      setDragState({
        type: 'move',
        elementId,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        origW: el.width,
        origH: el.height,
        origR: el.rotation,
      });
    },
    [currentPage]
  );

  const handleResizeStart = useCallback(
    (elementId: string, pos: string, e: React.MouseEvent) => {
      if (!currentPage) return;
      const el = currentPage.elements.find((el) => el.id === elementId);
      if (!el) return;
      setDragState({
        type: 'resize',
        elementId,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        origW: el.width,
        origH: el.height,
        origR: el.rotation,
        handlePos: pos,
      });
    },
    [currentPage]
  );

  const handleRotateStart = useCallback(
    (elementId: string, e: React.MouseEvent) => {
      if (!currentPage) return;
      const el = currentPage.elements.find((el) => el.id === elementId);
      if (!el) return;
      setDragState({
        type: 'rotate',
        elementId,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        origW: el.width,
        origH: el.height,
        origR: el.rotation,
      });
    },
    [currentPage]
  );

  const handleImageUpload = () => {
    if (!currentPageId) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const el: MagazineElement = {
          id: uuidv4(),
          type: 'image',
          x: 40,
          y: 40,
          width: 200,
          height: 150,
          rotation: 0,
          zIndex: (currentPage?.elements.length ?? 0) + 1,
          src,
        };
        addElement(currentPageId, el);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleAddText = () => {
    if (!currentPageId) return;
    const el: MagazineElement = {
      id: uuidv4(),
      type: 'text',
      x: 40,
      y: 40,
      width: 200,
      height: 60,
      rotation: 0,
      zIndex: (currentPage?.elements.length ?? 0) + 1,
      content: '请输入文字',
      fontFamily: 'Noto Serif SC',
      fontSize: 20,
      color: '#2c3e50',
    };
    addElement(currentPageId, el);
  };

  const handleAddRect = () => {
    if (!currentPageId) return;
    const el: MagazineElement = {
      id: uuidv4(),
      type: 'rect',
      x: 40,
      y: 40,
      width: 120,
      height: 80,
      rotation: 0,
      zIndex: (currentPage?.elements.length ?? 0) + 1,
      fillColor: '#e67e22',
    };
    addElement(currentPageId, el);
  };

  const handleAddImage = () => {
    if (!currentPageId) return;
    const url = window.prompt('输入图片URL');
    if (!url) return;
    const el: MagazineElement = {
      id: uuidv4(),
      type: 'image',
      x: 40,
      y: 40,
      width: 200,
      height: 150,
      rotation: 0,
      zIndex: (currentPage?.elements.length ?? 0) + 1,
      src: url,
    };
    addElement(currentPageId, el);
  };

  const [panelOpen, setPanelOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const coverPage = magazine.pages.find((p) => p.id === magazine.coverPageId);
  const isCurrentCover = currentPageId === magazine.coverPageId;

  const renderCoverOverlay = () => {
    if (!isCurrentCover) return null;
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '30%',
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        pointerEvents: 'none',
      }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 28, fontFamily: 'Noto Serif SC' }}>
          {magazine.name}
        </div>
        <div style={{ color: '#fff', fontSize: 16, fontFamily: 'Noto Serif SC', marginTop: 8 }}>
          {magazine.author}
        </div>
      </div>
    );
  };

  const sidebar = (
    <div style={{
      width: 320,
      minWidth: 320,
      background: '#ffffff',
      borderRight: '1px solid #e8e4df',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid #f0ece7' }}>
        <input
          type="text"
          value={magazine.name}
          onChange={(e) => useMagazineStore.getState().updateMagazineInfo(e.target.value, magazine.author)}
          style={{
            width: '100%',
            border: 'none',
            fontSize: 16,
            fontWeight: 700,
            color: '#2c3e50',
            outline: 'none',
            background: 'transparent',
            marginBottom: 6,
          }}
          placeholder="杂志名称"
        />
        <input
          type="text"
          value={magazine.author}
          onChange={(e) => useMagazineStore.getState().updateMagazineInfo(magazine.name, e.target.value)}
          style={{
            width: '100%',
            border: 'none',
            fontSize: 13,
            color: '#888',
            outline: 'none',
            background: 'transparent',
          }}
          placeholder="作者名"
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        <div style={{ fontSize: 11, color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          页面列表 ({magazine.pages.length}/{MAX_PAGES})
        </div>
        {magazine.pages.map((page, index) => (
          <PageCard
            key={page.id}
            page={page}
            index={index}
            isSelected={page.id === currentPageId}
            isCover={page.id === magazine.coverPageId}
            onClick={() => setCurrentPage(page.id)}
          />
        ))}
      </div>

      <div style={{ padding: 12, borderTop: '1px solid #f0ece7' }}>
        <button
          onClick={addPage}
          disabled={magazine.pages.length >= MAX_PAGES}
          style={{
            width: '100%',
            padding: '8px 0',
            borderRadius: 8,
            border: '1.5px dashed #d5d0ca',
            background: 'transparent',
            color: '#2c3e50',
            cursor: magazine.pages.length >= MAX_PAGES ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 500,
            opacity: magazine.pages.length >= MAX_PAGES ? 0.4 : 1,
          }}
        >
          + 添加页面
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f8f5f0' }}>
      {isMobile ? (
        <>
          <div
            onClick={() => setPanelOpen(!panelOpen)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: 44,
              background: '#fff',
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #e8e4df',
              fontSize: 13,
              color: '#2c3e50',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {panelOpen ? '▼ 收起页面面板' : '▶ 展开页面面板'}
          </div>
          {panelOpen && (
            <div style={{
              position: 'fixed',
              top: 44,
              left: 0,
              right: 0,
              maxHeight: '50vh',
              overflowY: 'auto',
              background: '#fff',
              zIndex: 250,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              {sidebar}
            </div>
          )}
        </>
      ) : (
        sidebar
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          height: 52,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 8,
          flexShrink: 0,
          zIndex: 100,
          flexWrap: 'wrap',
        }}>
          <button
            onClick={handleAddText}
            className="toolbar-btn"
          >
            📝 文字
          </button>
          <button
            onClick={handleAddImage}
            className="toolbar-btn"
          >
            🖼️ 图片URL
          </button>
          <button
            onClick={handleImageUpload}
            className="toolbar-btn"
          >
            📷 上传图片
          </button>
          <button
            onClick={handleAddRect}
            className="toolbar-btn"
          >
            ⬛ 色块
          </button>

          <div style={{ width: 1, height: 24, background: '#e0dcd7', margin: '0 4px' }} />

          <button
            onClick={() => {
              if (currentPageId) {
                const isCurrentlyCover = currentPageId === magazine.coverPageId;
                setCoverPage(isCurrentlyCover ? null : currentPageId);
              }
            }}
            className="toolbar-btn"
            style={{ background: isCurrentCover ? '#e67e22' : undefined, color: isCurrentCover ? '#fff' : undefined }}
          >
            {isCurrentCover ? '★ 取消封面' : '☆ 设为封面'}
          </button>

          <button onClick={() => useMagazineStore.getState().generateToc()} className="toolbar-btn">
            📑 生成目录
          </button>

          <div style={{ width: 1, height: 24, background: '#e0dcd7', margin: '0 4px' }} />

          <button
            onClick={() => {
              if (currentPageId && confirm('确定删除当前页面？')) {
                removePage(currentPageId);
              }
            }}
            className="toolbar-btn"
            style={{ color: '#e74c3c' }}
          >
            🗑 删除页
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            padding: 24,
            paddingTop: isMobile ? 56 : 24,
            position: 'relative',
          }}
          onClick={() => selectElement(null)}
        >
          {currentPage ? (
            <div
              ref={canvasRef}
              style={{
                width: 595,
                height: Math.round(595 * CANVAS_ASPECT),
                background: '#ffffff',
                borderRadius: 4,
                boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
              }}
              onClick={(e) => {
                if (e.target === canvasRef.current) {
                  selectElement(null);
                }
              }}
            >
              {renderCoverOverlay()}
              {sortedElements.map((el) => (
                <CanvasElement
                  key={el.id}
                  element={el}
                  isSelected={el.id === selectedElementId}
                  onSelect={() => selectElement(el.id)}
                  onDragStart={(e) => handleElementDragStart(el.id, e)}
                  onResizeStart={(pos, e) => handleResizeStart(el.id, pos, e)}
                  onRotateStart={(e) => handleRotateStart(el.id, e)}
                  containerRef={canvasRef}
                />
              ))}
            </div>
          ) : (
            <div style={{ color: '#bbb', fontSize: 16 }}>请选择一个页面进行编辑</div>
          )}
          <PropertyPanel />
        </div>
      </div>
    </div>
  );
}
