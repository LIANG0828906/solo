import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Toolbar } from './ui/Toolbar';
import { CanvasBoard } from './canvas/CanvasBoard';
import { CollabSync } from './collab/CollabSync';
import { StickyNote, Drawing, Tool } from './types';

const App: React.FC = () => {
  const [roomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || uuidv4();
  });

  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [tool, setTool] = useState<Tool>('select');
  const [noteColor, setNoteColor] = useState('#FFF8DC');
  const [sidebarColor, setSidebarColor] = useState('#888888');
  const [drawColor, setDrawColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(4);
  const [isVotingMode, setIsVotingMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState<'connected' | 'disconnected'>('connected');
  const [onlineCount, setOnlineCount] = useState(1);
  const [clientId, setClientId] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [minimapCollapsed, setMinimapCollapsed] = useState(false);

  const collabSyncRef = useRef<CollabSync | null>(null);
  const canvasBoardRef = useRef<React.ElementRef<typeof CanvasBoard> | null>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);

  const canvasStateRef = useRef({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });

  const getCanvasState = useCallback(() => {
    return canvasStateRef.current;
  }, []);

  const setCanvasState = useCallback((state: { offsetX: number; offsetY: number; scale: number }) => {
    canvasStateRef.current = state;
  }, []);

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  }, []);

  useEffect(() => {
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      setBannerType(connected ? 'connected' : 'disconnected');
      setShowBanner(true);

      if (!connected) {
        setTimeout(() => {
          setShowBanner(false);
        }, 3000);
      } else {
        setTimeout(() => {
          setShowBanner(false);
        }, 2000);
      }
    };

    const handleOnlineCountChange = (count: number) => {
      setOnlineCount(count);
    };

    collabSyncRef.current = new CollabSync(
      roomId,
      handleConnectionChange,
      handleOnlineCountChange
    );

    collabSyncRef.current.on('init', (message) => {
      setNotes(message.payload.notes || []);
      setDrawings(message.payload.drawings || []);
      setOnlineCount(message.payload.onlineCount || 1);
      if (message.clientId) {
        setClientId(message.clientId);
      }
    });

    collabSyncRef.current.on('noteAdded', (message) => {
      const note = message.payload as StickyNote;
      setNotes((prev) => [...prev, note]);

      if (canvasBoardRef.current) {
        (canvasBoardRef.current as any).handleNoteAdd?.(note.id);
      }
    });

    collabSyncRef.current.on('noteUpdated', (message) => {
      const updatedNote = message.payload as StickyNote;
      setNotes((prev) =>
        prev.map((n) => (n.id === updatedNote.id ? { ...n, ...updatedNote } : n))
      );
    });

    collabSyncRef.current.on('noteDeleted', (message) => {
      const { id } = message.payload;
      setNotes((prev) => prev.filter((n) => n.id !== id));
    });

    collabSyncRef.current.on('noteVoted', (message) => {
      const { noteId, votes } = message.payload;
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, votes } : n))
      );
    });

    collabSyncRef.current.on('drawingAdded', (message) => {
      const drawing = message.payload as Drawing;
      setDrawings((prev) => [...prev, drawing]);
    });

    collabSyncRef.current.on('drawingUndone', (message) => {
      const { id } = message.payload;
      setDrawings((prev) => prev.filter((d) => d.id !== id));
    });

    collabSyncRef.current.connect();

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('room', roomId);
    window.history.replaceState({}, '', newUrl.toString());

    return () => {
      collabSyncRef.current?.disconnect();
    };
  }, [roomId]);

  const handleAddNote = useCallback(
    (x: number, y: number) => {
      collabSyncRef.current?.addNote(x, y, noteColor, sidebarColor);
    },
    [noteColor, sidebarColor]
  );

  const handleUpdateNote = useCallback(
    (note: Partial<StickyNote> & { id: string }) => {
      collabSyncRef.current?.updateNote(note);
    },
    []
  );

  const handleDeleteNote = useCallback((id: string) => {
    collabSyncRef.current?.deleteNote(id);
  }, []);

  const handleVoteNote = useCallback((noteId: string, voterId: string) => {
    collabSyncRef.current?.voteNote(noteId, voterId);
  }, []);

  const handleAddDrawing = useCallback(
    (points: { x: number; y: number }[], color: string, lineWidth: number) => {
      collabSyncRef.current?.addDrawing(points, color, lineWidth);
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (tool === 'draw') {
      collabSyncRef.current?.undoDrawing();
    }
  }, [tool]);

  const handleExport = useCallback(() => {
    if (canvasBoardRef.current) {
      (canvasBoardRef.current as any).exportToPNG?.();
    }
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToastMessage('链接已复制到剪贴板！');
    } catch (e) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToastMessage('链接已复制到剪贴板！');
    }
  }, [showToastMessage]);

  const handleMinimapClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (canvasBoardRef.current) {
        (canvasBoardRef.current as any).handleMinimapClick?.(e);
      }
    },
    []
  );

  return (
    <div className="app">
      <div className={`status-banner ${bannerType} ${showBanner ? 'visible' : ''}`}>
        {bannerType === 'connected' ? '已连接到服务器' : '连接断开，正在重试...'}
      </div>

      <Toolbar
        tool={tool}
        setTool={setTool}
        noteColor={noteColor}
        setNoteColor={setNoteColor}
        sidebarColor={sidebarColor}
        setSidebarColor={setSidebarColor}
        drawColor={drawColor}
        setDrawColor={setDrawColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        isVotingMode={isVotingMode}
        setIsVotingMode={setIsVotingMode}
        onUndo={handleUndo}
        onExport={handleExport}
        onShare={handleShare}
        onlineCount={onlineCount}
        isConnected={isConnected}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
      />

      <CanvasBoard
        ref={canvasBoardRef}
        notes={notes}
        drawings={drawings}
        tool={tool}
        noteColor={noteColor}
        sidebarColor={sidebarColor}
        drawColor={drawColor}
        lineWidth={lineWidth}
        isVotingMode={isVotingMode}
        clientId={clientId}
        onAddNote={handleAddNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onVoteNote={handleVoteNote}
        onAddDrawing={handleAddDrawing}
        getCanvasState={getCanvasState}
        setCanvasState={setCanvasState}
        minimapRef={minimapRef}
      />

      <div className={`minimap ${minimapCollapsed ? 'collapsed' : ''}`}>
        <button
          className="minimap-toggle"
          onClick={() => setMinimapCollapsed(!minimapCollapsed)}
        >
          {minimapCollapsed ? '📌' : '✕'}
        </button>
        {!minimapCollapsed && (
          <canvas
            ref={minimapRef}
            className="minimap-canvas"
            onClick={handleMinimapClick}
            style={{ cursor: 'pointer' }}
          />
        )}
      </div>

      <div className={`toast ${showToast ? 'visible' : ''}`}>{toastMessage}</div>
    </div>
  );
};

export default App;
