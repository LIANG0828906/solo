import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipBack, Volume2, VolumeX, Share2, Plus, Minus,
  Music, ChevronLeft, ChevronRight, Trash2, Save, X
} from 'lucide-react';
import { useEditorStore, STAFF_CONSTANTS } from './EditorCore';
import { syncClient } from '../sync/SyncClient';
import { versionClient } from '../version/VersionClient';
import type { Note, NoteType, Track, User, VersionSnapshot } from '@/types';
import { NOTE_COLORS, NOTE_DURATIONS } from '@/types';

const { MEASURE_WIDTH, STAFF_LINE_HEIGHT, STAFF_TOP_PADDING } = STAFF_CONSTANTS;

const NOTE_TYPES: { type: NoteType; label: string; symbol: string }[] = [
  { type: 'whole', label: '全音符', symbol: '𝅝' },
  { type: 'half', label: '二分音符', symbol: '𝅗𝅥' },
  { type: 'quarter', label: '四分音符', symbol: '♩' },
  { type: 'eighth', label: '八分音符', symbol: '♪' },
];

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toTimeString().slice(0, 8);
};

const generateId = () => Math.random().toString(36).substring(2, 15);

const renderNoteSymbol = (type: NoteType): string => {
  switch (type) {
    case 'whole': return '𝅝';
    case 'half': return '𝅗𝅥';
    case 'quarter': return '♩';
    case 'eighth': return '♪';
  }
};

export function EditorUI() {
  const {
    roomId, currentUser, users, notes, tracks, bpm, isPlaying, playhead,
    selectedNoteType, selectedNoteId,
    setNotes, addNote, moveNote, deleteNote,
    setSelectedNoteType, setSelectedNoteId, setDraggingNoteId,
    setUsers, addUser, removeUser, updateUserCursor,
    setTracks, updateTrack, setBpm, initUser, setRoomId,
    togglePlay, setPlayhead, stopPlay,
    handleCanvasClick, handleCanvasMouseMove, resetAnimationFlags,
  } = useEditorStore();

  const [trackPanelCollapsed, setTrackPanelCollapsed] = useState(false);
  const [showVersionPreview, setShowVersionPreview] = useState<VersionSnapshot | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<VersionSnapshot | null>(null);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTrackName, setEditingTrackName] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const playAnimationRef = useRef<number | null>(null);
  const dragState = useRef<{ noteId: string; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('room');
    if (urlRoomId) {
      setRoomId(urlRoomId);
    }
    initUser();
  }, [initUser, setRoomId]);

  useEffect(() => {
    if (!currentUser) return;

    syncClient.on({
      onRoomState: (data) => {
        setNotes(data.notes);
        setUsers(data.users);
        setTracks(data.tracks);
        setBpm(data.bpm, true);
      },
      onUserJoined: (user) => {
        addUser(user);
      },
      onUserLeft: (userId) => {
        removeUser(userId);
      },
      onCursorUpdate: (data) => {
        updateUserCursor(data.userId, data.x, data.y);
      },
      onNoteAdded: (data) => {
        addNote(data.note, true);
      },
      onNoteMoved: (data) => {
        moveNote(data.noteId, data.x, data.y, true);
      },
      onNoteDeleted: (data) => {
        deleteNote(data.noteId, true);
      },
      onTrackUpdated: (data) => {
        updateTrack(data.track, true);
      },
      onBpmUpdated: (data) => {
        setBpm(data.bpm, true);
      },
      onVersionRestored: (data) => {
        setNotes(data.notes);
        setTracks(data.tracks);
        setBpm(data.bpm, true);
        showToast('版本已恢复');
      },
    });

    syncClient.connect(roomId, currentUser.id, currentUser.name);

    return () => {
      syncClient.disconnect();
    };
  }, [currentUser, roomId, setNotes, setUsers, setTracks, setBpm, addUser, removeUser, updateUserCursor, addNote, moveNote, deleteNote, updateTrack, showToast]);

  useEffect(() => {
    if (tracks.length === 0) {
      const defaultTrack: Track = {
        id: 'track-1',
        name: '主旋律',
        volume: 0,
        muted: false,
        color: '#6C63FF',
      };
      updateTrack(defaultTrack, true);
    }
  }, [tracks.length, updateTrack]);

  useEffect(() => {
    versionClient.getVersions(roomId).then(setVersions).catch(() => {});
  }, [roomId]);

  useEffect(() => {
    if (!isPlaying) {
      if (playAnimationRef.current) {
        cancelAnimationFrame(playAnimationRef.current);
      }
      return;
    }

    const beatDuration = 60000 / bpm;
    const pixelsPerBeat = MEASURE_WIDTH / 4;
    const pixelsPerMs = pixelsPerBeat / beatDuration;
    let lastTime = performance.now();
    let currentPlayhead = 0;

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      currentPlayhead += delta * pixelsPerMs;

      const maxX = Math.max(0, ...notes.map(n => n.x + 50), MEASURE_WIDTH * 8);
      if (currentPlayhead > maxX) {
        stopPlay();
        return;
      }

      setPlayhead(currentPlayhead);
      playAnimationRef.current = requestAnimationFrame(animate);
    };

    playAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (playAnimationRef.current) {
        cancelAnimationFrame(playAnimationRef.current);
      }
    };
  }, [isPlaying, bpm, notes, setPlayhead, stopPlay]);

  useEffect(() => {
    const timer = setTimeout(() => {
      resetAnimationFlags();
    }, 300);
    return () => clearTimeout(timer);
  }, [notes, resetAnimationFlags]);

  useEffect(() => {
    const handleResize = () => {
      setTrackPanelCollapsed(window.innerWidth < 1200);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleShareRoom = async () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('房间链接已复制到剪贴板');
    } catch {
      showToast('复制失败，请手动复制');
    }
  };

  const handleSaveVersion = async () => {
    if (!currentUser) return;
    try {
      const version = await versionClient.createVersion(roomId, currentUser.id, currentUser.name, {
        notes,
        tracks,
        bpm,
      });
      setVersions(prev => [version, ...prev].slice(0, 10));
      showToast('版本已保存');
    } catch {
      showToast('保存失败');
    }
  };

  const handleRestoreVersion = async (version: VersionSnapshot) => {
    try {
      const data = await versionClient.restoreVersion(version.id, roomId);
      setNotes(data.notes);
      setTracks(data.tracks);
      setBpm(data.bpm, true);
      setShowRestoreConfirm(null);
      setShowVersionPreview(null);
      showToast('版本已恢复');
    } catch {
      showToast('恢复失败');
    }
  };

  const getCanvasCoords = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    const clickedNote = notes.find(n => {
      const dx = Math.abs(n.x - x);
      const dy = Math.abs(n.y - y);
      return dx < 20 && dy < 20;
    });

    if (clickedNote) {
      dragState.current = {
        noteId: clickedNote.id,
        startX: x,
        startY: y,
        offsetX: x - clickedNote.x,
        offsetY: y - clickedNote.y,
      };
      setDraggingNoteId(clickedNote.id);
      setSelectedNoteId(clickedNote.id);
    }
  };

  const handleCanvasMouseMoveCapture = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    handleCanvasMouseMove(x, y);

    if (dragState.current) {
      const newX = x - dragState.current.offsetX;
      const newY = y - dragState.current.offsetY;
      moveNote(dragState.current.noteId, Math.round(newX / 10) * 10, Math.round(newY / STAFF_LINE_HEIGHT) * STAFF_LINE_HEIGHT);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (dragState.current) {
      const { x, y } = getCanvasCoords(e);
      const dx = Math.abs(x - dragState.current.startX);
      const dy = Math.abs(y - dragState.current.startY);

      if (dx < 5 && dy < 5) {
        handleCanvasClick(x, y, tracks[0]?.id || 'track-1');
      }
      dragState.current = null;
      setDraggingNoteId(null);
    } else {
      const { x, y } = getCanvasCoords(e);
      handleCanvasClick(x, y, tracks[0]?.id || 'track-1');
    }
  };

  const handleBpmChange = (delta: number) => {
    const newBpm = Math.max(60, Math.min(180, bpm + delta));
    setBpm(newBpm);
  };

  const handleAddTrack = () => {
    const colors = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFD93D', '#96CEB4'];
    const newTrack: Track = {
      id: generateId(),
      name: `音轨 ${tracks.length + 1}`,
      volume: 0,
      muted: false,
      color: colors[tracks.length % colors.length],
    };
    updateTrack(newTrack);
  };

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack({ ...track, volume });
    }
  };

  const handleTrackMuteToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack({ ...track, muted: !track.muted });
    }
  };

  const handleTrackNameEdit = (track: Track) => {
    setEditingTrackId(track.id);
    setEditingTrackName(track.name);
  };

  const handleTrackNameSave = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track && editingTrackName.trim()) {
      updateTrack({ ...track, name: editingTrackName.trim() });
    }
    setEditingTrackId(null);
  };

  const renderStaffLines = () => {
    const lines = [];
    for (let i = 0; i < 5; i++) {
      lines.push(
        <line
          key={i}
          x1={0}
          y1={STAFF_TOP_PADDING + i * STAFF_LINE_HEIGHT}
          x2="100%"
          y2={STAFF_TOP_PADDING + i * STAFF_LINE_HEIGHT}
          stroke="#4A4A5A"
          strokeWidth={1}
        />
      );
    }
    for (let i = 0; i < 16; i++) {
      lines.push(
        <line
          key={`bar-${i}`}
          x1={i * MEASURE_WIDTH}
          y1={STAFF_TOP_PADDING - 10}
          x2={i * MEASURE_WIDTH}
          y2={STAFF_TOP_PADDING + 4 * STAFF_LINE_HEIGHT + 10}
          stroke="#4A4A5A"
          strokeWidth={i % 4 === 0 ? 2 : 1}
        />
      );
    }
    return lines;
  };

  const renderNote = (note: Note, isPreview = false) => {
    const color = NOTE_COLORS[note.type];
    const isSelected = selectedNoteId === note.id && !isPreview;

    return (
      <g
        key={note.id}
        style={{
          transform: `translate(${note.x}px, ${note.y}px)`,
          animation: note.animate && !isPreview ? 'noteFadeIn 300ms ease-out' : undefined,
        }}
      >
        {isSelected && (
          <circle cx={0} cy={0} r={18} fill="none" stroke="#FFD93D" strokeWidth={2} strokeDasharray="4 2" />
        )}
        <circle
          cx={0}
          cy={0}
          r={note.type === 'whole' ? 10 : 8}
          fill={note.type === 'whole' || note.type === 'half' ? 'transparent' : color}
          stroke={color}
          strokeWidth={2}
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
        {(note.type === 'half' || note.type === 'quarter' || note.type === 'eighth') && (
          <line
            x1={note.type === 'half' || note.type === 'quarter' ? 7 : 7}
            y1={0}
            x2={7}
            y2={-28}
            stroke={color}
            strokeWidth={2}
          />
        )}
        {note.type === 'eighth' && (
          <path
            d={`M 7 -28 Q 15 -20 10 -14`}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
        )}
      </g>
    );
  };

  const renderUserCursor = (user: User) => {
    if (!user.cursor || user.id === currentUser?.id) return null;
    return (
      <div
        key={user.id}
        style={{
          position: 'absolute',
          left: user.cursor.x,
          top: user.cursor.y,
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          zIndex: 50,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: user.color,
            boxShadow: `0 0 0 5px ${user.color}40`,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: user.color,
            color: '#fff',
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {user.name}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#1E1E2E', color: '#E0E0E0' }}>
      <style>{`
        @keyframes noteFadeIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        * { transition: all 0.2s ease; }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 4px;
          background: #3A3A4A;
          border-radius: 2px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          margin-top: -4px;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #6C63FF;
          transition: background 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          background: #7B73FF;
        }
      `}</style>

      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #3D3D5C' }}>
        <div className="flex items-center gap-3">
          <Music size={24} style={{ color: '#6C63FF' }} />
          <h1 className="text-lg font-semibold">协作音乐工作室</h1>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="px-4 py-2 text-[16px]"
            style={{ backgroundColor: '#2A2A3E', borderRadius: 6, color: '#fff' }}
          >
            {roomId}
          </div>

          <div className="flex items-center -space-x-2">
            {users.slice(0, 5).map((user: User) => (
              <div
                key={user.id}
                title={user.name}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: user.color,
                  border: '2px solid #1E1E2E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>

          <button
            onClick={handleShareRoom}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#3D3D5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6C63FF')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3D3D5C')}
          >
            <Share2 size={18} color="#fff" />
          </button>

          <button
            onClick={handleSaveVersion}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              backgroundColor: '#6C63FF',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7B73FF')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6C63FF')}
          >
            <Save size={16} />
            保存版本
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          style={{
            width: trackPanelCollapsed ? 50 : 240,
            backgroundColor: '#2A2A3E',
            borderRadius: 8,
            margin: 12,
            marginRight: 0,
            borderTop: '2px solid #3D3D5C',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid #3D3D5C' }}>
            {!trackPanelCollapsed && (
              <span className="text-sm font-medium" style={{ color: '#E0E0E0' }}>音轨</span>
            )}
            <div className="flex items-center gap-2">
              {!trackPanelCollapsed && (
                <button
                  onClick={handleAddTrack}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#3D3D5C',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6C63FF')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3D3D5C')}
                >
                  <Plus size={14} color="#fff" />
                </button>
              )}
              <button
                onClick={() => setTrackPanelCollapsed(!trackPanelCollapsed)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {trackPanelCollapsed ? <ChevronRight size={16} color="#8A8A9A" /> : <ChevronLeft size={16} color="#8A8A9A" />}
              </button>
            </div>
          </div>

          {!trackPanelCollapsed && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {tracks.map((track: Track) => (
                <div
                  key={track.id}
                  className="p-3"
                  style={{
                    backgroundColor: '#1E1E2E',
                    borderRadius: 6,
                    borderLeft: `3px solid ${track.color}`,
                  }}
                >
                  {editingTrackId === track.id ? (
                    <input
                      type="text"
                      value={editingTrackName}
                      onChange={(e) => setEditingTrackName(e.target.value)}
                      onBlur={() => handleTrackNameSave(track.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTrackNameSave(track.id)}
                      autoFocus
                      style={{
                        width: '100%',
                        backgroundColor: '#3D3D5C',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 8px',
                        color: '#E0E0E0',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <div
                      className="cursor-pointer text-sm font-medium mb-2"
                      style={{ color: '#E0E0E0' }}
                      onClick={() => handleTrackNameEdit(track)}
                    >
                      {track.name}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTrackMuteToggle(track.id)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: track.muted ? '#4A4A5A' : '#6C63FF',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      {track.muted ? <VolumeX size={12} color="#fff" /> : <Volume2 size={12} color="#fff" />}
                      {track.muted && (
                        <div style={{
                          position: 'absolute',
                          width: 20,
                          height: 2,
                          backgroundColor: '#fff',
                          transform: 'rotate(-45deg)',
                        }} />
                      )}
                    </button>

                    <input
                      type="range"
                      min={-24}
                      max={6}
                      step={1}
                      value={track.volume}
                      onChange={(e) => handleTrackVolumeChange(track.id, parseFloat(e.target.value))}
                      style={{ width: 120 }}
                    />

                    <span className="text-xs" style={{ color: '#8A8A9A', minWidth: 36 }}>
                      {track.volume > 0 ? `+${track.volume}` : track.volume}dB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {trackPanelCollapsed && (
            <div className="flex-1 flex flex-col items-center py-3 gap-3">
              {tracks.map((track: Track) => (
                <div
                  key={track.id}
                  title={track.name}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#3D3D5C',
                    borderLeft: `3px solid ${track.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 10,
                    color: '#E0E0E0',
                  }}
                >
                  {track.name.charAt(0)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
          <div
            className="flex items-center gap-3 p-3"
            style={{ backgroundColor: '#2A2A3E', borderRadius: 8 }}
          >
            <span className="text-sm font-medium" style={{ color: '#8A8A9A' }}>音符：</span>
            {NOTE_TYPES.map(({ type, label, symbol }) => (
              <button
                key={type}
                onClick={() => setSelectedNoteType(type)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: selectedNoteType === type ? `2px solid ${NOTE_COLORS[type]}` : '2px solid transparent',
                  backgroundColor: selectedNoteType === type ? '#3D3D5C' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: '#E0E0E0',
                }}
              >
                <span style={{ color: NOTE_COLORS[type], fontSize: 18 }}>{symbol}</span>
                <span style={{ color: '#8A8A9A' }}>{label}</span>
              </button>
            ))}

            {selectedNoteId && (
              <button
                onClick={() => deleteNote(selectedNoteId)}
                style={{
                  marginLeft: 'auto',
                  padding: '6px 12px',
                  borderRadius: 6,
                  backgroundColor: '#4A4A5A',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#fff',
                  fontSize: 13,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FF6B6B')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4A4A5A')}
              >
                <Trash2 size={14} />
                删除选中
              </button>
            )}
          </div>

          <div
            ref={canvasRef}
            className="flex-1 relative overflow-auto"
            style={{
              backgroundColor: '#1E1E2E',
              borderRadius: 8,
              fontFamily: "'Fira Code', monospace",
              fontSize: 14,
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMoveCapture}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={() => { dragState.current = null; setDraggingNoteId(null); }}
          >
            <svg
              width={MEASURE_WIDTH * 16}
              height={300}
              style={{ display: 'block', position: 'relative' }}
            >
              {renderStaffLines()}
              {notes.map((note) => renderNote(note))}

              {isPlaying && (
                <line
                  x1={playhead}
                  y1={STAFF_TOP_PADDING - 20}
                  x2={playhead}
                  y2={STAFF_TOP_PADDING + 4 * STAFF_LINE_HEIGHT + 20}
                  stroke="#FFD93D"
                  strokeWidth={2}
                  style={{ filter: 'drop-shadow(0 0 8px #FFD93D)' }}
                />
              )}
            </svg>

            {users.map((user) => renderUserCursor(user))}

            <div className="absolute bottom-3 left-3 text-xs" style={{ color: '#8A8A9A' }}>
              点击添加音符 · 拖拽移动音符 · 再次点击选中的音符删除
            </div>
          </div>

          <div
            className="flex items-center justify-center gap-6 p-4"
            style={{ backgroundColor: '#2A2A3E', borderRadius: 8 }}
          >
            <button
              onClick={stopPlay}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: '#3D3D5C',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4A4A5A')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3D3D5C')}
            >
              <SkipBack size={14} color="#E0E0E0" />
            </button>

            <button
              onClick={togglePlay}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6C63FF 0%, #7B73FF 100%)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(108, 99, 255, 0.4)',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isPlaying ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" style={{ marginLeft: 2 }} />}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: '#8A8A9A', minWidth: 50, textAlign: 'right' }}>
                BPM: <span style={{ color: '#E0E0E0', fontWeight: 600 }}>{bpm}</span>
              </span>
              <div className="flex flex-col">
                <button
                  onClick={() => handleBpmChange(5)}
                  style={{
                    width: 24,
                    height: 16,
                    backgroundColor: '#3D3D5C',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6C63FF')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3D3D5C')}
                >
                  <Plus size={10} color="#E0E0E0" />
                </button>
                <button
                  onClick={() => handleBpmChange(-5)}
                  style={{
                    width: 24,
                    height: 16,
                    backgroundColor: '#3D3D5C',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '0 0 4px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6C63FF')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3D3D5C')}
                >
                  <Minus size={10} color="#E0E0E0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="p-4"
        style={{ borderTop: '1px solid #3D3D5C', backgroundColor: '#1E1E2E' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-medium" style={{ color: '#E0E0E0' }}>版本历史</span>
          <span className="text-xs" style={{ color: '#8A8A9A' }}>最近 10 个快照</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {versions.length === 0 && (
            <div className="text-sm py-8" style={{ color: '#8A8A9A' }}>
              暂无版本记录，点击右上角「保存版本」创建快照
            </div>
          )}
          {versions.map((version) => (
            <div
              key={version.id}
              onClick={() => setShowVersionPreview(version)}
              style={{
                width: 160,
                height: 80,
                minWidth: 160,
                backgroundColor: '#2A2A3E',
                borderRadius: 8,
                borderLeft: '4px solid #6C63FF',
                padding: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3D3D5C')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2A2A3E')}
            >
              <div className="text-lg font-mono" style={{ color: '#FFD93D' }}>
                {formatTime(version.createdAt)}
              </div>
              <div className="text-xs" style={{ color: '#8A8A9A' }}>
                {version.userName} 保存
              </div>
            </div>
          ))}
        </div>
      </div>

      {showVersionPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#00000080',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            animation: 'fadeIn 200ms ease-out',
          }}
          onClick={() => setShowVersionPreview(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1E1E2E',
              borderRadius: 12,
              padding: 24,
              maxWidth: 900,
              width: '90%',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: '#E0E0E0' }}>
                  版本预览 - {formatTime(showVersionPreview.createdAt)}
                </h3>
                <p className="text-sm mt-1" style={{ color: '#8A8A9A' }}>
                  由 {showVersionPreview.userName} 保存 · BPM: {showVersionPreview.snapshot.bpm}
                </p>
              </div>
              <button
                onClick={() => setShowVersionPreview(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} color="#8A8A9A" />
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#1E1E2E',
                borderRadius: 8,
                overflow: 'auto',
                maxHeight: 400,
                border: '1px solid #3D3D5C',
              }}
            >
              <svg width={MEASURE_WIDTH * 8} height={300} style={{ display: 'block' }}>
                {(() => {
                  const lines = [];
                  for (let i = 0; i < 5; i++) {
                    lines.push(
                      <line
                        key={i}
                        x1={0}
                        y1={STAFF_TOP_PADDING + i * STAFF_LINE_HEIGHT}
                        x2="100%"
                        y2={STAFF_TOP_PADDING + i * STAFF_LINE_HEIGHT}
                        stroke="#4A4A5A"
                        strokeWidth={1}
                      />
                    );
                  }
                  for (let i = 0; i < 9; i++) {
                    lines.push(
                      <line
                        key={`bar-${i}`}
                        x1={i * MEASURE_WIDTH}
                        y1={STAFF_TOP_PADDING - 10}
                        x2={i * MEASURE_WIDTH}
                        y2={STAFF_TOP_PADDING + 4 * STAFF_LINE_HEIGHT + 10}
                        stroke="#4A4A5A"
                        strokeWidth={i % 4 === 0 ? 2 : 1}
                      />
                    );
                  }
                  return lines;
                })()}
                {showVersionPreview.snapshot.notes.map((note) => renderNote(note, true))}
              </svg>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowVersionPreview(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  backgroundColor: '#4A4A5A',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#E0E0E0',
                  fontSize: 14,
                }}
              >
                关闭
              </button>
              <button
                onClick={() => setShowRestoreConfirm(showVersionPreview)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  backgroundColor: '#6C63FF',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7B73FF')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6C63FF')}
              >
                恢复此版本
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestoreConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#00000080',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            animation: 'fadeIn 200ms ease-out',
          }}
        >
          <div
            style={{
              backgroundColor: '#1E1E2E',
              borderRadius: 12,
              width: 400,
              padding: 32,
              textAlign: 'center',
            }}
          >
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#E0E0E0' }}>
              确认恢复版本？
            </h3>
            <p className="text-sm mb-6" style={{ color: '#8A8A9A' }}>
              将恢复到 {formatTime(showRestoreConfirm.createdAt)} 的版本，此操作将同步给所有在线用户。
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowRestoreConfirm(null)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 6,
                  backgroundColor: '#4A4A5A',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#E0E0E0',
                  fontSize: 14,
                }}
              >
                取消
              </button>
              <button
                onClick={() => handleRestoreVersion(showRestoreConfirm)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 6,
                  backgroundColor: '#6C63FF',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7B73FF')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6C63FF')}
              >
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 200,
            backgroundColor: '#1E1E2E',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            textAlign: 'center',
            fontSize: 14,
            zIndex: 300,
            animation: 'slideUp 300ms ease-out',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default EditorUI;
