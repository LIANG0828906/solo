import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Undo2,
  Redo2,
  RotateCcw,
  Shuffle,
  Download,
  Plus,
  Circle,
  Square,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { useStore, getUnassignedPeople } from './store';
import TableCard from './components/TableCard';
import PersonCard from './components/PersonCard';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const tables = useStore((state) => state.tables);
  const people = useStore((state) => state.people);
  const canvasScale = useStore((state) => state.canvasScale);
  const canvasOffset = useStore((state) => state.canvasOffset);
  const isShuffling = useStore((state) => state.isShuffling);
  const past = useStore((state) => state.past);
  const future = useStore((state) => state.future);
  const draggingTableId = useStore((state) => state.draggingTableId);
  const draggingPersonId = useStore((state) => state.draggingPersonId);

  const setCanvasScale = useStore((state) => state.setCanvasScale);
  const setCanvasOffset = useStore((state) => state.setCanvasOffset);
  const updateTablePosition = useStore((state) => state.updateTablePosition);
  const setDraggingTableId = useStore((state) => state.setDraggingTableId);
  const setDraggingPersonId = useStore((state) => state.setDraggingPersonId);
  const assignPersonToSeat = useStore((state) => state.assignPersonToSeat);
  const removePersonFromSeat = useStore((state) => state.removePersonFromSeat);
  const addTable = useStore((state) => state.addTable);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const reset = useStore((state) => state.reset);
  const shuffle = useStore((state) => state.shuffle);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, tableX: 0, tableY: 0 });
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);

  const unassignedPeople = getUnassignedPeople({ tables, people });

  const handleCanvasWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(canvasScale * delta, 0.3), 3);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleRatio = newScale / canvasScale;
        const newOffsetX = mouseX - (mouseX - canvasOffset.x) * scaleRatio;
        const newOffsetY = mouseY - (mouseY - canvasOffset.y) * scaleRatio;

        setCanvasScale(newScale);
        setCanvasOffset({ x: newOffsetX, y: newOffsetY });
      }
    },
    [canvasScale, canvasOffset, setCanvasScale, setCanvasOffset]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('canvas-bg')) {
        return;
      }
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
    },
    [canvasOffset]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        setCanvasOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }

      if (draggingTableId) {
        const dx = (e.clientX - dragStart.x) / canvasScale;
        const dy = (e.clientY - dragStart.y) / canvasScale;
        updateTablePosition(draggingTableId, dragStart.tableX + dx, dragStart.tableY + dy);
      }

      if (draggingPersonId) {
        setGhostPosition({ x: e.clientX, y: e.clientY });
      }
    },
    [isPanning, panStart, draggingTableId, dragStart, canvasScale, updateTablePosition, draggingPersonId]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggingTableId) {
      setDraggingTableId(null);
    }
    if (draggingPersonId) {
      setDraggingPersonId(null);
      setGhostPosition(null);
    }
  }, [isPanning, draggingTableId, draggingPersonId, setDraggingTableId, setDraggingPersonId]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleTableDragStart = useCallback(
    (e: React.MouseEvent, tableId: string) => {
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;
      setDraggingTableId(tableId);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        tableX: table.x,
        tableY: table.y,
      });
    },
    [tables, setDraggingTableId]
  );

  const handlePersonDragStart = useCallback(
    (e: React.MouseEvent, personId: string) => {
      e.preventDefault();
      setDraggingPersonId(personId);
      setGhostPosition({ x: e.clientX, y: e.clientY });
    },
    [setDraggingPersonId]
  );

  const handleSeatDrop = useCallback(
    (tableId: string, seatId: string) => {
      if (draggingPersonId) {
        assignPersonToSeat(draggingPersonId, tableId, seatId);
      }
    },
    [draggingPersonId, assignPersonToSeat]
  );

  const handlePersonRemove = useCallback(
    (tableId: string, seatId: string) => {
      removePersonFromSeat(tableId, seatId);
    },
    [removePersonFromSeat]
  );

  const handleAddTable = useCallback(
    (shape: 'round' | 'rectangle') => {
      const centerX = 200 + Math.random() * 300;
      const centerY = 150 + Math.random() * 200;
      addTable(shape, centerX, centerY);
      setShowAddMenu(false);
    },
    [addTable]
  );

  const handleExportPng = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#faf3e0',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `座位安排_${new Date().toLocaleDateString()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('导出失败:', error);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    setCanvasScale(1);
    setCanvasOffset({ x: 0, y: 0 });
  }, [setCanvasScale, setCanvasOffset]);

  const handleZoomIn = useCallback(() => {
    setCanvasScale(Math.min(canvasScale * 1.2, 3));
  }, [canvasScale, setCanvasScale]);

  const handleZoomOut = useCallback(() => {
    setCanvasScale(Math.max(canvasScale / 1.2, 0.3));
  }, [canvasScale, setCanvasScale]);

  const draggingPerson = people.find((p) => p.id === draggingPersonId);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#faf3e0',
      }}
    >
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          backgroundColor: '#faf3e0',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#5a4a3a' }}>座位安排</h2>
          <div style={{ width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.1)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ToolButton
              icon={<Undo2 size={18} />}
              title="撤销"
              onClick={undo}
              disabled={past.length === 0 || isShuffling}
            />
            <ToolButton
              icon={<Redo2 size={18} />}
              title="重做"
              onClick={redo}
              disabled={future.length === 0 || isShuffling}
            />
            <ToolButton
              icon={<RotateCcw size={18} />}
              title="重置"
              onClick={reset}
              disabled={isShuffling}
            />
          </div>

          <div style={{ width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.1)' }} />

          <div style={{ position: 'relative' }}>
            <ToolButton
              icon={<Plus size={18} />}
              title="添加桌位"
              onClick={() => setShowAddMenu(!showAddMenu)}
              disabled={isShuffling}
            />
            {showAddMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  backgroundColor: 'white',
                  borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  padding: 4,
                  zIndex: 20,
                  animation: 'fadeIn 0.15s ease-out',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <MenuItem
                  icon={<Circle size={16} />}
                  label="圆形桌"
                  onClick={() => handleAddTable('round')}
                />
                <MenuItem
                  icon={<Square size={16} />}
                  label="矩形桌"
                  onClick={() => handleAddTable('rectangle')}
                />
              </div>
            )}
          </div>

          <ToolButton
            icon={<Shuffle size={18} />}
            title="一键洗牌"
            onClick={shuffle}
            disabled={isShuffling || unassignedPeople.length === 0}
            highlight
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ToolButton icon={<ZoomOut size={18} />} title="缩小" onClick={handleZoomOut} />
          <div
            style={{
              minWidth: 50,
              textAlign: 'center',
              fontSize: 12,
              color: '#666',
              padding: '0 8px',
            }}
          >
            {Math.round(canvasScale * 100)}%
          </div>
          <ToolButton icon={<ZoomIn size={18} />} title="放大" onClick={handleZoomIn} />
          <ToolButton icon={<Maximize2 size={18} />} title="重置视图" onClick={handleResetZoom} />

          <div style={{ width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.1)', margin: '0 8px' }} />

          <ToolButton
            icon={<Download size={18} />}
            title="导出 PNG"
            onClick={handleExportPng}
            disabled={isShuffling}
            primary
          />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div
          style={{
            width: 240,
            borderRight: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fdfaf2',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              fontSize: 13,
              fontWeight: 600,
              color: '#5a4a3a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>座位池</span>
            <span style={{ fontSize: 12, color: '#999', fontWeight: 400 }}>
              {unassignedPeople.length} 人
            </span>
          </div>
          <div
            className="scrollbar-thin"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}
            >
              {unassignedPeople.map((person) => (
                <div key={person.id} style={{ display: 'flex', justifyContent: 'center' }}>
                  <PersonCard
                    person={person}
                    size="medium"
                    onDragStart={handlePersonDragStart}
                  />
                </div>
              ))}
            </div>
            {unassignedPeople.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  fontSize: 13,
                  color: '#aaa',
                }}
              >
                所有人员已安排座位
              </div>
            )}
          </div>
        </div>

        <div
          ref={containerRef}
          className="canvas-container"
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            cursor: isPanning ? 'grabbing' : 'grab',
          }}
          onWheel={handleCanvasWheel}
          onMouseDown={handleCanvasMouseDown}
          onClick={() => setShowAddMenu(false)}
        >
          <div
            ref={canvasRef}
            className="canvas-bg"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
              transformOrigin: '0 0',
              backgroundImage:
                'radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                people={people}
                isDragging={draggingTableId === table.id}
                onTableDragStart={handleTableDragStart}
                onSeatDrop={handleSeatDrop}
                onPersonRemove={handlePersonRemove}
              />
            ))}
          </div>

          {isShuffling && (
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 20px',
                backgroundColor: 'rgba(142,202,230,0.9)',
                color: '#2d5a7b',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                zIndex: 50,
              }}
            >
              正在随机分配座位...
            </div>
          )}
        </div>
      </div>

      {ghostPosition && draggingPerson && (
        <div
          className="drag-ghost"
          style={{
            left: ghostPosition.x - 28,
            top: ghostPosition.y - 28,
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: draggingPerson.avatar,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 500,
            color: '#555',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          {draggingPerson.name.charAt(0)}
        </div>
      )}
    </div>
  );
};

const ToolButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
  primary?: boolean;
}> = ({ icon, title, onClick, disabled, highlight, primary }) => (
  <button
    title={title}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: 8,
      backgroundColor: primary ? '#8ecae6' : highlight ? 'rgba(142,202,230,0.2)' : 'transparent',
      color: primary ? 'white' : highlight ? '#2d5a7b' : '#5a4a3a',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.15s ease',
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.backgroundColor = primary
          ? '#7bb8d4'
          : highlight
          ? 'rgba(142,202,230,0.35)'
          : 'rgba(0,0,0,0.06)';
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = primary
        ? '#8ecae6'
        : highlight
        ? 'rgba(142,202,230,0.2)'
        : 'transparent';
    }}
  >
    {icon}
  </button>
);

const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px',
      border: 'none',
      backgroundColor: 'transparent',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 13,
      color: '#333',
      transition: 'background-color 0.15s',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#f0f0f0';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
  >
    {icon}
    {label}
  </button>
);

export default App;
