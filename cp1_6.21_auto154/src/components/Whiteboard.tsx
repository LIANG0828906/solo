import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Type,
  Image,
  CheckSquare,
  Link2,
  Download,
  ArrowLeft,
  User,
  Menu,
} from 'lucide-react';
import { useBoard } from '../context/BoardContext';
import {
  Note,
  TextNoteContent,
  ImageNoteContent,
  TodoNoteContent,
  NoteContent,
} from '../types';
import TextNote from './TextNote';
import ImageNote from './ImageNote';
import TodoNote from './TodoNote';
import ExportModal from './ExportModal';

const GRID_SIZE = 6;
const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

const Whiteboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentBoard,
    notes,
    connections,
    users,
    loading,
    loadBoard,
    addNote,
    updateNote,
    deleteNote,
    addConnection,
  } = useBoard();

  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isConnectMode, setIsConnectMode] = useState(false);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(null);
  const [connectionPreview, setConnectionPreview] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (id) {
      loadBoard(id);
    }
  }, [id, loadBoard]);

  useEffect(() => {
    drawConnections();
  }, [notes, connections, connectionPreview]);

  const drawConnections = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, rect.width, rect.height);

    const getNoteCenter = (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return null;
      return {
        x: note.x + note.width / 2,
        y: note.y + 100,
      };
    };

    const drawCurve = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      dashed: boolean = false,
      animated: boolean = false
    ) => {
      ctx.save();
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      if (dashed) {
        ctx.setLineDash([6, 4]);
      }

      const midX = (x1 + x2) / 2;
      const controlOffset = Math.abs(x2 - x1) * 0.4;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(midX - controlOffset, y1, midX + controlOffset, y2, x2, y2);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(x1, y1, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x2, y2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    connections.forEach((conn) => {
      const source = getNoteCenter(conn.sourceId);
      const target = getNoteCenter(conn.targetId);
      if (source && target) {
        drawCurve(source.x, source.y, target.x, target.y);
      }
    });

    if (connectionPreview) {
      drawCurve(
        connectionPreview.x1,
        connectionPreview.y1,
        connectionPreview.x2,
        connectionPreview.y2,
        true
      );
    }
  }, [notes, connections, connectionPreview]);

  const handleMouseDown = (e: React.MouseEvent, noteId: string) => {
    if (isConnectMode) return;
    e.preventDefault();
    const note = notes.find((n) => n.id === noteId);
    if (!note || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    setDraggingNoteId(noteId);
    setDragOffset({
      x: e.clientX - containerRect.left - note.x,
      y: e.clientY - containerRect.top - note.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    if (draggingNoteId) {
      const newX = snapToGrid(e.clientX - containerRect.left - dragOffset.x);
      const newY = snapToGrid(e.clientY - containerRect.top - dragOffset.y);
      updateNote(draggingNoteId, { x: newX, y: newY });
    }

    if (connectionSourceId && isConnectMode) {
      const sourceNote = notes.find((n) => n.id === connectionSourceId);
      if (sourceNote) {
        setConnectionPreview({
          x1: sourceNote.x + sourceNote.width / 2,
          y1: sourceNote.y + 100,
          x2: e.clientX - containerRect.left,
          y2: e.clientY - containerRect.top,
        });
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggingNoteId) {
      const note = notes.find((n) => n.id === draggingNoteId);
      if (note) {
        updateNote(draggingNoteId, { x: note.x, y: note.y });
      }
      setDraggingNoteId(null);
    }

    if (connectionSourceId && isConnectMode && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      const targetNote = notes.find((n) => {
        return (
          mouseX >= n.x &&
          mouseX <= n.x + n.width &&
          mouseY >= n.y &&
          mouseY <= n.y + 200
        );
      });

      if (targetNote && targetNote.id !== connectionSourceId) {
        addConnection(connectionSourceId, targetNote.id);
      }

      setConnectionSourceId(null);
      setConnectionPreview(null);
    }
  };

  const handleConnectionStart = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    setConnectionSourceId(noteId);
  };

  const handleNoteContentChange = (noteId: string, content: NoteContent) => {
    updateNote(noteId, { content });
  };

  const renderNote = (note: Note) => {
    const commonProps = {
      note,
      isDragging: draggingNoteId === note.id,
      isConnecting: isConnectMode,
      isConnectionSource: connectionSourceId === note.id,
      onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, note.id),
      onDelete: () => deleteNote(note.id),
      onConnectionStart: (e: React.MouseEvent) => handleConnectionStart(e, note.id),
    };

    switch (note.type) {
      case 'text':
        return (
          <TextNote
            key={note.id}
            {...commonProps}
            onContentChange={(content: TextNoteContent) =>
              handleNoteContentChange(note.id, content)
            }
          />
        );
      case 'image':
        return (
          <ImageNote
            key={note.id}
            {...commonProps}
            onContentChange={(content: ImageNoteContent) =>
              handleNoteContentChange(note.id, content)
            }
          />
        );
      case 'todo':
        return (
          <TodoNote
            key={note.id}
            {...commonProps}
            onContentChange={(content: TodoNoteContent) =>
              handleNoteContentChange(note.id, content)
            }
          />
        );
      default:
        return null;
    }
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    variant?: 'default' | 'success';
  }> = ({ onClick, icon, label, active, variant = 'default' }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: active
          ? 'rgba(59, 130, 246, 0.3)'
          : variant === 'success'
          ? '#10B981'
          : 'rgba(255, 255, 255, 0.08)',
        color: '#FFFFFF',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        transition: 'all 0.2s ease',
        boxShadow: active ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          variant === 'success'
            ? '0 0 12px rgba(16, 185, 129, 0.5)'
            : '0 0 12px rgba(59, 130, 246, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = active
          ? '0 0 12px rgba(59, 130, 246, 0.5)'
          : 'none';
      }}
    >
      {icon}
      <span className="toolbar-label">{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1A1A2E',
          color: '#94A3B8',
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1A1A2E',
      }}
    >
      <header
        style={{
          height: '60px',
          backgroundColor: '#1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1
            style={{
              color: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 'bold',
              margin: 0,
            }}
          >
            {currentBoard?.name || '墨迹协作'}
          </h1>
        </div>

        <div className="desktop-toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ToolbarButton onClick={() => addNote('text')} icon={<Type size={16} />} label="文字" />
          <ToolbarButton onClick={() => addNote('image')} icon={<Image size={16} />} label="图片" />
          <ToolbarButton
            onClick={() => addNote('todo')}
            icon={<CheckSquare size={16} />}
            label="待办"
          />
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              margin: '0 4px',
            }}
          />
          <ToolbarButton
            onClick={() => setIsConnectMode(!isConnectMode)}
            icon={<Link2 size={16} />}
            label="连接"
            active={isConnectMode}
          />
          <ToolbarButton
            onClick={() => setShowExportModal(true)}
            icon={<Download size={16} />}
            label="导出"
            variant="success"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '-4px' }}>
            {users.slice(0, 3).map((user, index) => (
              <div
                key={user.id}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: user.color,
                  border: '2px solid #1E293B',
                  marginLeft: index > 0 ? '-8px' : '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: '#FFFFFF',
                  fontWeight: 500,
                }}
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>
            ))}
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={18} color="#FFFFFF" />
          </div>
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              display: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {showMobileMenu && (
        <div
          className="mobile-toolbar"
          style={{
            display: 'none',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#1E293B',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <ToolbarButton onClick={() => { addNote('text'); setShowMobileMenu(false); }} icon={<Type size={16} />} label="文字便签" />
          <ToolbarButton onClick={() => { addNote('image'); setShowMobileMenu(false); }} icon={<Image size={16} />} label="图片便签" />
          <ToolbarButton onClick={() => { addNote('todo'); setShowMobileMenu(false); }} icon={<CheckSquare size={16} />} label="待办便签" />
          <ToolbarButton
            onClick={() => { setIsConnectMode(!isConnectMode); setShowMobileMenu(false); }}
            icon={<Link2 size={16} />}
            label={isConnectMode ? '关闭连接' : '连接模式'}
            active={isConnectMode}
          />
          <ToolbarButton
            onClick={() => { setShowExportModal(true); setShowMobileMenu(false); }}
            icon={<Download size={16} />}
            label="导出白板"
            variant="success"
          />
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          cursor: isConnectMode && connectionSourceId ? 'crosshair' : 'default',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={boardRef}
          style={{
            position: 'relative',
            width: '3000px',
            height: '2000px',
            minWidth: '100%',
            minHeight: '100%',
            backgroundColor: '#1A1A2E',
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1' d='M28 0 L56 50 L28 100 L0 50 Z'/%3E%3C/svg%3E")
            `,
            backgroundRepeat: 'repeat',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
          {notes.map(renderNote)}
        </div>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        boardRef={boardRef as React.RefObject<HTMLDivElement>}
      />

      <style>{`
        @media (max-width: 768px) {
          .desktop-toolbar {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .mobile-toolbar {
            display: flex !important;
          }
          .toolbar-label {
            display: inline !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Whiteboard;
