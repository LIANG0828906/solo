import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import Editor from './Editor';
import VersionManager from './VersionManager';
import Player from './Player';
import { Score, Note, Collaborator, VersionSnapshot, ExportProgress } from './types';

const COLLAB_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
const DEFAULT_USER_NAMES = ['小明', '小红', '小刚', '小丽', '小华', '阿强', '阿美'];

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [userId] = useState<string>(() => uuidv4());
  const [userName] = useState<string>(() => DEFAULT_USER_NAMES[Math.floor(Math.random() * DEFAULT_USER_NAMES.length)]);
  const [userColor] = useState<string>(() => COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayPosition, setCurrentPlayPosition] = useState(0);
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [versionTransition, setVersionTransition] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('quarter');
  const [selectedStaff, setSelectedStaff] = useState<'treble' | 'bass'>('treble');

  const scoreIdRef = useRef<string>('default-score');
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const createDefaultScore = useCallback((): Score => ({
    id: scoreIdRef.current,
    title: '未命名乐谱',
    tempo: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    notes: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }), []);

  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-room', {
        roomId: scoreIdRef.current,
        userId,
        userName,
        userColor
      });
    });

    newSocket.on('score-loaded', (loadedScore: Score) => {
      setScore({ ...loadedScore, updatedAt: Date.now() });
    });

    newSocket.on('collaborators-updated', (collabs: Collaborator[]) => {
      setCollaborators(collabs.filter(c => c.id !== userId));
    });

    newSocket.on('note-added', (note: Note) => {
      setScore(prev => prev ? {
        ...prev,
        notes: [...prev.notes, note],
        updatedAt: Date.now()
      } : prev);
    });

    newSocket.on('note-deleted', (noteId: string) => {
      setScore(prev => prev ? {
        ...prev,
        notes: prev.notes.filter(n => n.id !== noteId),
        updatedAt: Date.now()
      } : prev);
    });

    newSocket.on('note-moved', ({ noteId, newPosition, newPitch }) => {
      setScore(prev => prev ? {
        ...prev,
        notes: prev.notes.map(n => n.id === noteId ? { ...n, position: newPosition, pitch: newPitch } : n),
        updatedAt: Date.now()
      } : prev);
    });

    newSocket.on('cursor-updated', ({ userId: uid, position }) => {
      setCollaborators(prev => prev.map(c => c.id === uid ? { ...c, cursorPosition: position } : c));
    });

    newSocket.on('versions-loaded', (vList: VersionSnapshot[]) => {
      setVersions(vList);
    });

    newSocket.on('version-created', (v: VersionSnapshot) => {
      setVersions(prev => [v, ...prev]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-room', { roomId: scoreIdRef.current, userId });
      newSocket.disconnect();
    };
  }, [userId, userName, userColor]);

  const handleAddNote = useCallback((pitch: number, octave: number, position: number) => {
    if (!socket || !score) return;

    const durationMap: Record<string, number> = {
      whole: 4,
      half: 2,
      quarter: 1,
      eighth: 0.5,
      sixteenth: 0.25
    };

    const newNote: Note = {
      id: uuidv4(),
      pitch,
      octave,
      duration: durationMap[selectedTool] || 1,
      position,
      staff: selectedStaff
    };

    socket.emit('add-note', { roomId: scoreIdRef.current, note: newNote, userId });
    setScore(prev => prev ? {
      ...prev,
      notes: [...prev.notes, newNote],
      updatedAt: Date.now()
    } : prev);
  }, [socket, score, selectedTool, selectedStaff, userId]);

  const handleDeleteNote = useCallback((noteId: string) => {
    if (!socket) return;
    socket.emit('delete-note', { roomId: scoreIdRef.current, noteId, userId });
    setScore(prev => prev ? {
      ...prev,
      notes: prev.notes.filter(n => n.id !== noteId),
      updatedAt: Date.now()
    } : prev);
  }, [socket, userId]);

  const handleMoveNote = useCallback((noteId: string, newPosition: number, newPitch: number) => {
    if (!socket) return;
    socket.emit('move-note', { roomId: scoreIdRef.current, noteId, newPosition, newPitch, userId });
    setScore(prev => prev ? {
      ...prev,
      notes: prev.notes.map(n => n.id === noteId ? { ...n, position: newPosition, pitch: newPitch } : n),
      updatedAt: Date.now()
    } : prev);
  }, [socket, userId]);

  const handleSaveVersion = useCallback((message?: string) => {
    if (!socket || !score) return;
    socket.emit('save-version', {
      roomId: scoreIdRef.current,
      score,
      userId,
      userName,
      message
    });
  }, [socket, score, userId, userName]);

  const handleRestoreVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (!version) return;

    setVersionTransition(true);
    setTimeout(() => {
      setScore({ ...version.score, updatedAt: Date.now() });
      setVersionTransition(false);
      if (socket) {
        socket.emit('restored-version', { roomId: scoreIdRef.current, score: version.score });
      }
    }, 300);
  }, [versions, socket]);

  const handleExportMIDI = useCallback(() => {
    if (!score) return;
    setExportProgress({ type: 'midi', progress: 0, done: false });

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setExportProgress(prev => prev ? { ...prev, done: true } : null);
          setTimeout(() => setExportProgress(null), 1000);

          const midiContent = generateMockMIDI(score);
          const blob = new Blob([midiContent], { type: 'audio/midi' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${score.title || 'score'}.mid`;
          a.click();
          URL.revokeObjectURL(url);
        }, 300);
      }
      setExportProgress(prev => prev ? { ...prev, progress: Math.min(progress, 100) } : null);
    }, 80);
  }, [score]);

  const handleExportSVG = useCallback(() => {
    if (!score) return;
    setExportProgress({ type: 'svg', progress: 0, done: false });

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 12 + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setExportProgress(prev => prev ? { ...prev, done: true } : null);
          setTimeout(() => setExportProgress(null), 1000);

          const svgContent = generateScoreSVG(score);
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${score.title || 'score'}.svg`;
          a.click();
          URL.revokeObjectURL(url);
        }, 300);
      }
      setExportProgress(prev => prev ? { ...prev, progress: Math.min(progress, 100) } : null);
    }, 80);
  }, [score]);

  const currentCollaborator: Collaborator = {
    id: userId,
    name: userName,
    color: userColor,
    cursorPosition: null
  };

  const allCollaborators = [currentCollaborator, ...collaborators];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>🎵</span>
          <input
            style={styles.titleInput}
            value={score?.title || ''}
            onChange={(e) => setScore(prev => prev ? { ...prev, title: e.target.value } : prev)}
            placeholder="乐谱标题..."
          />
          <div style={styles.collaboratorAvatars}>
            {allCollaborators.slice(0, 6).map(c => (
              <div
                key={c.id}
                style={{
                  ...styles.avatar,
                  backgroundColor: c.color,
                  marginLeft: c.id === userId ? 0 : -8,
                  zIndex: c.id === userId ? 10 : 1
                }}
                title={c.name}
              >
                {c.name.charAt(0)}
              </div>
            ))}
          </div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.saveBtn} onClick={() => handleSaveVersion('手动保存')}>
            💾 保存版本
          </button>
          <button
            style={styles.mobileToggle}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            ⚙️
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div
          style={{
            ...styles.editorWrapper,
            opacity: versionTransition ? 0 : 1,
            transition: 'opacity 300ms ease'
          }}
        >
          {score && (
            <Editor
              score={score}
              collaborators={collaborators}
              currentUser={currentCollaborator}
              selectedTool={selectedTool}
              selectedStaff={selectedStaff}
              highlightedNoteId={highlightedNoteId}
              currentPlayPosition={currentPlayPosition}
              isPlaying={isPlaying}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onMoveNote={handleMoveNote}
            />
          )}
        </div>

        <div
          style={{
            ...styles.sidebar,
            ...(isMobile && !isMobileMenuOpen ? { display: 'none' } : {}),
            ...(isMobileMenuOpen ? styles.sidebarMobileOpen : {})
          }}
        >
          <div style={styles.sidebarContent}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>🎹 音符选择</h3>
              <div style={styles.noteGrid}>
                {[
                  { key: 'whole', label: '𝅝', name: '全音符' },
                  { key: 'half', label: '𝅗𝅥', name: '二分音符' },
                  { key: 'quarter', label: '♩', name: '四分音符' },
                  { key: 'eighth', label: '♪', name: '八分音符' },
                  { key: 'sixteenth', label: '𝅘𝅥𝅯', name: '十六分音符' }
                ].map(note => (
                  <button
                    key={note.key}
                    style={{
                      ...styles.noteBtn,
                      ...(selectedTool === note.key ? styles.noteBtnSelected : {})
                    }}
                    onClick={() => setSelectedTool(note.key)}
                    title={note.name}
                  >
                    <span style={styles.noteIcon}>{note.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>🎼 谱表选择</h3>
              <div style={styles.staffSelector}>
                <button
                  style={{
                    ...styles.staffBtn,
                    ...(selectedStaff === 'treble' ? styles.staffBtnSelected : {})
                  }}
                  onClick={() => setSelectedStaff('treble')}
                >
                  高音谱
                </button>
                <button
                  style={{
                    ...styles.staffBtn,
                    ...(selectedStaff === 'bass' ? styles.staffBtnSelected : {})
                  }}
                  onClick={() => setSelectedStaff('bass')}
                >
                  低音谱
                </button>
              </div>
            </div>

            <VersionManager
              versions={versions}
              onRestore={handleRestoreVersion}
            />

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📤 导出</h3>
              <div style={styles.exportBtns}>
                <button style={styles.exportBtn} onClick={handleExportMIDI}>
                  🎵 导出 MIDI
                </button>
                <button style={styles.exportBtn} onClick={handleExportSVG}>
                  🖼️ 导出 SVG
                </button>
              </div>
            </div>
          </div>

          {score && (
            <Player
              score={score}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              onHighlightNote={setHighlightedNoteId}
              onPositionUpdate={setCurrentPlayPosition}
            />
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          style={styles.mobileOverlay}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {exportProgress && (
        <div style={styles.exportProgressOverlay}>
          <div style={styles.exportProgressBox}>
            <h4 style={{ color: '#fff', marginBottom: 16 }}>
              正在导出 {exportProgress.type === 'midi' ? 'MIDI' : 'SVG'}...
            </h4>
            <div style={styles.progressBarBg}>
              <div
                style={{
                  ...styles.progressBarFill,
                  width: `${exportProgress.progress}%`,
                  transition: 'width 80ms ease-out'
                }}
              />
            </div>
            <div style={{ color: '#fff', marginTop: 8, fontSize: 14 }}>
              {Math.floor(exportProgress.progress)}% {exportProgress.done ? '✓ 完成' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function generateMockMIDI(score: Score): Uint8Array {
  const header = [0x4D, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x01, 0x00, 0x60];
  const events: number[] = [];
  events.push(0x4D, 0x54, 0x72, 0x6B);
  const trackContent: number[] = [];

  score.notes.forEach(note => {
    const midiNote = note.octave * 12 + note.pitch + 12;
    const deltaTime = Math.max(0, Math.floor(note.position * 192));
    if (deltaTime > 0) {
      trackContent.push(deltaTime & 0x7F);
    }
    trackContent.push(0x90, Math.min(127, Math.max(0, midiNote)), 0x64);
    const duration = Math.floor(note.duration * 192);
    trackContent.push(duration & 0x7F);
    trackContent.push(0x80, Math.min(127, Math.max(0, midiNote)), 0x00);
  });

  trackContent.push(0x00, 0xFF, 0x2F, 0x00);

  const length = trackContent.length;
  events.push((length >> 24) & 0xFF, (length >> 16) & 0xFF, (length >> 8) & 0xFF, length & 0xFF);
  events.push(...trackContent);

  return new Uint8Array([...header, ...events]);
}

function generateScoreSVG(score: Score): string {
  const width = 1200;
  const height = 400;
  const staffTop = 80;
  const lineSpacing = 12;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="#ffffff"/>`;

  for (let i = 0; i < 5; i++) {
    const y = staffTop + i * lineSpacing;
    svg += `<line x1="50" y1="${y}" x2="${width - 50}" y2="${y}" stroke="#d0d0d0" stroke-width="1"/>`;
  }

  svg += `<text x="60" y="${staffTop + 35}" font-family="serif" font-size="40" fill="#333">𝄞</text>`;

  score.notes.forEach(note => {
    const x = 120 + note.position * 80;
    const y = staffTop + (72 - note.octave * 12 - note.pitch) * (lineSpacing / 2);
    svg += `<ellipse cx="${x}" cy="${y}" rx="8" ry="6" fill="#333"/>`;
    if (note.duration < 4) {
      svg += `<line x1="${x + 7}" y1="${y}" x2="${x + 7}" y2="${y - 35}" stroke="#333" stroke-width="2"/>`;
    }
  });

  svg += `<text x="${width / 2}" y="40" text-anchor="middle" font-size="24" fill="#333" font-weight="bold">${score.title}</text>`;
  svg += `</svg>`;
  return svg;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f0f2f5'
  },
  header: {
    height: 60,
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flex: 1
  },
  logo: {
    fontSize: 28
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 600,
    border: 'none',
    outline: 'none',
    padding: '6px 12px',
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    minWidth: 200
  },
  collaboratorAvatars: {
    display: 'flex',
    alignItems: 'center'
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    border: '2px solid #fff'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  saveBtn: {
    padding: '8px 16px',
    backgroundColor: '#4a9eff',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500
  },
  mobileToggle: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 18,
    ...(typeof window !== 'undefined' && window.innerWidth >= 768 ? { display: 'none' } : { display: 'block' })
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative'
  },
  editorWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'auto'
  },
  sidebar: {
    width: 340,
    backgroundColor: '#2a2a3e',
    borderRadius: '12px 0 0 0',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.1)'
  },
  sidebarMobileOpen: {
    position: 'fixed',
    right: 0,
    top: 60,
    bottom: 0,
    zIndex: 100,
    width: '100%',
    maxWidth: 360
  },
  sidebarContent: {
    flex: 1,
    overflowY: 'auto',
    padding: 20
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  noteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10
  },
  noteBtn: {
    padding: '16px 8px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '2px solid transparent',
    borderRadius: 10,
    cursor: 'pointer',
    color: '#fff',
    transition: 'all 0.2s ease'
  },
  noteBtnSelected: {
    borderColor: '#4a9eff',
    boxShadow: '0 0 6px #4a9eff',
    backgroundColor: 'rgba(74, 158, 255, 0.15)'
  },
  noteIcon: {
    fontSize: 28
  },
  staffSelector: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10
  },
  staffBtn: {
    padding: '12px 8px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '2px solid transparent',
    borderRadius: 10,
    cursor: 'pointer',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s ease'
  },
  staffBtnSelected: {
    borderColor: '#4a9eff',
    boxShadow: '0 0 6px #4a9eff',
    backgroundColor: 'rgba(74, 158, 255, 0.15)'
  },
  exportBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  exportBtn: {
    padding: '12px 16px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    cursor: 'pointer',
    color: '#fff',
    fontSize: 14,
    transition: 'all 0.2s ease'
  },
  mobileOverlay: {
    position: 'fixed',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 99
  },
  exportProgressOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  exportProgressBox: {
    backgroundColor: '#2a2a3e',
    padding: 32,
    borderRadius: 16,
    minWidth: 320,
    textAlign: 'center'
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4a9eff, #7c3aed)',
    borderRadius: 5
  }
};

export default App;
