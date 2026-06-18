import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { FiMusic, FiUsers } from 'react-icons/fi';
import Editor from './components/Editor';
import TrackPanel from './components/TrackPanel';
import ControlBar from './components/ControlBar';
import { MidiPlayer } from './midi/player';
import { initSync, CollaborationSync } from './midi/sync';
import {
  ProjectData,
  Note,
  Track,
  OnlineUser,
  createDefaultTrack,
  AVAILABLE_INSTRUMENTS,
  InstrumentType,
  generateId,
  exportProjectJSON,
  cloneProject,
  INSTRUMENT_COLORS,
  INSTRUMENT_NAMES
} from './data/project';

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingNotes, setPlayingNotes] = useState<Set<string>>(new Set());
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [remoteNoteIds, setRemoteNoteIds] = useState<Set<string>>(new Set());
  const [showExportBtn, setShowExportBtn] = useState(false);
  const [userCountBounce, setUserCountBounce] = useState(false);
  const [showTrackDrawer, setShowTrackDrawer] = useState(false);
  const [showInstrDrawer, setShowInstrDrawer] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const playerRef = useRef<MidiPlayer | null>(null);
  const syncRef = useRef<CollaborationSync | null>(null);
  const currentUserIdRef = useRef<string>('');

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    playerRef.current = new MidiPlayer({
      onPlayheadUpdate: (pos) => setPlayhead(pos),
      onNotePlay: (trackId, noteId) => {
        const key = `${trackId}-${noteId}`;
        setPlayingNotes(prev => new Set(prev).add(key));
        setTimeout(() => {
          setPlayingNotes(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }, 200);
      },
      onPlayStop: () => {
        setIsPlaying(false);
        setPlayingNotes(new Set());
      }
    });

    const sync = initSync({
      onProjectChange: (proj) => {
        setProject(prev => {
          if (!prev) {
            setSelectedTrackId(proj.tracks[0]?.id || null);
          }
          playerRef.current?.setProject(proj);
          return proj;
        });
      },
      onUsersChange: (users) => {
        setOnlineUsers(prev => {
          if (prev.length !== users.length) {
            setUserCountBounce(true);
            setTimeout(() => setUserCountBounce(false), 300);
          }
          return users;
        });
      },
      onRemoteNoteChange: (noteIds) => {
        setRemoteNoteIds(prev => {
          const next = new Set(prev);
          noteIds.forEach(id => next.add(id));
          return next;
        });
        setTimeout(() => {
          setRemoteNoteIds(prev => {
            const next = new Set(prev);
            noteIds.forEach(id => next.delete(id));
            return next;
          });
        }, 500);
      }
    });

    syncRef.current = sync;
    currentUserIdRef.current = sync.getCurrentUser().id;

    return () => {
      sync.stop();
      playerRef.current?.cleanup();
    };
  }, []);

  useEffect(() => {
    if (project) {
      setSelectedTrackId(prev => {
        if (prev && project.tracks.find(t => t.id === prev)) return prev;
        return project.tracks[0]?.id || null;
      });
    }
  }, [project?.tracks.length]);

  const updateProject = useCallback((updater: (p: ProjectData) => ProjectData) => {
    setProject(prev => {
      if (!prev) return prev;
      const updated = updater(cloneProject(prev));
      syncRef.current?.writeSync(updated);
      playerRef.current?.setProject(updated);
      return updated;
    });
  }, []);

  const addNote = useCallback((trackId: string, pitch: number, start: number) => {
    if (!project) return;
    const userId = currentUserIdRef.current;

    const newNote: Note = {
      id: generateId(),
      pitch,
      start,
      duration: 1,
      velocity: 0.9,
      createdAt: Date.now(),
      createdBy: userId,
      isNew: true
    };

    updateProject(p => ({
      ...p,
      tracks: p.tracks.map(t =>
        t.id === trackId
          ? { ...t, notes: [...t.notes, newNote] }
          : t
      )
    }));

    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      playerRef.current?.previewNote(track.instrument, pitch, 0.25);
    }
  }, [project, updateProject]);

  const deleteNote = useCallback((trackId: string, noteId: string) => {
    updateProject(p => ({
      ...p,
      tracks: p.tracks.map(t =>
        t.id === trackId
          ? { ...t, notes: t.notes.filter(n => n.id !== noteId) }
          : t
      )
    }));
  }, [updateProject]);

  const addTrack = useCallback((instrument?: InstrumentType) => {
    updateProject(p => {
      const idx = p.tracks.length;
      const instr = instrument || AVAILABLE_INSTRUMENTS[idx % AVAILABLE_INSTRUMENTS.length];
      const newTrack = createDefaultTrack(instr, idx);
      return { ...p, tracks: [...p.tracks, newTrack] };
    });
  }, [updateProject]);

  const deleteTrack = useCallback((trackId: string) => {
    updateProject(p => ({
      ...p,
      tracks: p.tracks.filter(t => t.id !== trackId)
    }));
  }, [updateProject]);

  const reorderTracks = useCallback((fromIndex: number, toIndex: number) => {
    updateProject(p => {
      const tracks = [...p.tracks];
      const [removed] = tracks.splice(fromIndex, 1);
      tracks.splice(toIndex, 0, removed);
      return { ...p, tracks };
    });
  }, [updateProject]);

  const toggleMuteTrack = useCallback((trackId: string) => {
    updateProject(p => ({
      ...p,
      tracks: p.tracks.map(t =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      )
    }));
  }, [updateProject]);

  const play = useCallback(() => {
    if (!project) return;
    playerRef.current?.play(playhead);
    setIsPlaying(true);
  }, [project, playhead]);

  const pause = useCallback(() => {
    playerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    playerRef.current?.stop();
    setPlayhead(0);
    setIsPlaying(false);
  }, []);

  const setPlayheadPosition = useCallback((pos: number) => {
    setPlayhead(pos);
  }, []);

  const exportProject = useCallback(() => {
    if (!project) return;
    const json = exportProjectJSON(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    setShowExportBtn(true);
    toast.success('乐谱导出成功！', { duration: 2500, style: { background: '#27AE60', color: '#fff' } });

    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.meta.name || 'music-project'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => setShowExportBtn(false), 3000);
  }, [project]);

  const updateProjectName = useCallback(() => {
    if (!tempName.trim()) {
      setIsEditingName(false);
      return;
    }
    updateProject(p => ({
      ...p,
      meta: { ...p.meta, name: tempName.trim() }
    }));
    setIsEditingName(false);
  }, [tempName, updateProject]);

  const startEditName = useCallback(() => {
    if (project) {
      setTempName(project.meta.name);
      setIsEditingName(true);
    }
  }, [project]);

  if (!project) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#CDD6F4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiMusic size={32} color="#F4D03F" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  const isMobile = windowWidth < 768;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1E1E2E' }}>
      <Toaster position="top-center" />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: '#2D2D44',
        borderBottom: '1px solid #45475A',
        height: 60,
        flexShrink: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMobile && (
            <button
              onClick={() => setShowTrackDrawer(true)}
              style={{ padding: 6, borderRadius: 6, transition: 'background 0.2s ease-out' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FFFFFF20')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <FiMusic size={24} color="#F4D03F" />
          {isEditingName ? (
            <motion.input
              initial={{ boxShadow: '0 0 0 0 rgba(255,255,255,0)' }}
              animate={{ boxShadow: '0 0 8px 2px rgba(255,255,255,0.4)' }}
              transition={{ duration: 0.2 }}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={updateProjectName}
              onKeyDown={(e) => e.key === 'Enter' && updateProjectName()}
              autoFocus
              style={{
                background: 'transparent',
                border: '1px solid #6C7086',
                borderRadius: 6,
                padding: '6px 10px',
                color: '#CDD6F4',
                fontSize: 18,
                fontWeight: 600,
                outline: 'none',
                width: 200
              }}
            />
          ) : (
            <motion.h1
              onClick={startEditName}
              style={{
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: 6,
                transition: 'background 0.2s ease-out'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FFFFFF10')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {project.meta.name}
            </motion.h1>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isMobile && (
            <button
              onClick={() => setShowInstrDrawer(true)}
              style={{ padding: 6, borderRadius: 6, transition: 'background 0.2s ease-out' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FFFFFF20')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiUsers size={18} color="#CDD6F4" />
            <motion.span
              key={onlineUsers.length}
              animate={userCountBounce ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: 14,
                fontWeight: 600,
                minWidth: 20,
                textAlign: 'center'
              }}
            >
              {onlineUsers.length}/4
            </motion.span>
            <div style={{ display: 'flex', marginLeft: 4 }}>
              {onlineUsers.slice(0, 4).map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: user.color,
                    border: '2px solid #2D2D44',
                    marginLeft: i > 0 ? -8 : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    zIndex: 10 - i
                  }}
                  title={user.name}
                >
                  {user.name.charAt(0)}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {!isMobile && (
          <div style={{ width: 260, flexShrink: 0, background: '#2D2D44', borderRight: '1px solid #45475A', overflow: 'auto' }}>
            <TrackPanel
              tracks={project.tracks}
              selectedTrackId={selectedTrackId}
              onlineUsers={onlineUsers}
              onSelectTrack={setSelectedTrackId}
              onAddTrack={addTrack}
              onDeleteTrack={deleteTrack}
              onReorderTracks={reorderTracks}
              onToggleMute={toggleMuteTrack}
            />
          </div>
        )}

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
          <Editor
            tracks={project.tracks}
            selectedTrackId={selectedTrackId}
            onSelectTrack={setSelectedTrackId}
            playhead={playhead}
            isPlaying={isPlaying}
            playingNotes={playingNotes}
            remoteNoteIds={remoteNoteIds}
            onAddNote={addNote}
            onDeleteNote={deleteNote}
            onSetPlayhead={setPlayheadPosition}
            bpm={project.meta.bpm}
          />
        </div>

        {!isMobile && (
          <div style={{ width: 220, flexShrink: 0, background: '#2D2D44', borderLeft: '1px solid #45475A', overflow: 'auto', padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#A6ADC8' }}>
              乐器面板
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {AVAILABLE_INSTRUMENTS.map((instr) => (
                <motion.button
                  key={instr}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => addTrack(instr)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 10,
                    background: '#1E1E2E',
                    border: `2px solid ${INSTRUMENT_COLORS[instr]}30`,
                    textAlign: 'left',
                    transition: 'all 0.2s ease-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = INSTRUMENT_COLORS[instr];
                    e.currentTarget.style.background = '#FFFFFF08';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${INSTRUMENT_COLORS[instr]}30`;
                    e.currentTarget.style.background = '#1E1E2E';
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: INSTRUMENT_COLORS[instr],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0
                    }}
                  >
                    {instr === 'piano' && '🎹'}
                    {instr === 'guitar' && '🎸'}
                    {instr === 'drums' && '🥁'}
                    {instr === 'bass' && '🎻'}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#CDD6F4' }}>
                      {INSTRUMENT_NAMES[instr]}
                    </div>
                    <div style={{ fontSize: 11, color: '#7F849C', marginTop: 2 }}>
                      点击添加轨道
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#A6ADC8' }}>
                协作说明
              </h3>
              <div style={{
                fontSize: 12,
                lineHeight: 1.7,
                color: '#7F849C',
                background: '#1E1E2E',
                padding: 12,
                borderRadius: 8
              }}>
                <p>• 支持最多 4 人同时编辑</p>
                <p>• 每 5 秒自动同步</p>
                <p>• 新音符会高亮闪烁</p>
                <p>• 数据存储在浏览器中</p>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showTrackDrawer && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: 280,
                background: '#2D2D44',
                zIndex: 100,
                boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
                overflow: 'auto'
              }}
            >
              <div style={{ padding: 16, borderBottom: '1px solid #45475A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>轨道列表</span>
                <button
                  onClick={() => setShowTrackDrawer(false)}
                  style={{ padding: 4, borderRadius: 4 }}
                >
                  ✕
                </button>
              </div>
              <TrackPanel
                tracks={project.tracks}
                selectedTrackId={selectedTrackId}
                onlineUsers={onlineUsers}
                onSelectTrack={(id) => { setSelectedTrackId(id); setShowTrackDrawer(false); }}
                onAddTrack={addTrack}
                onDeleteTrack={(id) => { deleteTrack(id); }}
                onReorderTracks={reorderTracks}
                onToggleMute={toggleMuteTrack}
              />
            </motion.div>
          )}

          {showInstrDrawer && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: 280,
                background: '#2D2D44',
                zIndex: 100,
                boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
                overflow: 'auto',
                padding: 16
              }}
            >
              <div style={{ paddingBottom: 16, borderBottom: '1px solid #45475A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 600 }}>乐器面板</span>
                <button
                  onClick={() => setShowInstrDrawer(false)}
                  style={{ padding: 4, borderRadius: 4 }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {AVAILABLE_INSTRUMENTS.map((instr) => (
                  <button
                    key={instr}
                    onClick={() => { addTrack(instr); setShowInstrDrawer(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: 10,
                      background: '#1E1E2E',
                      border: `2px solid ${INSTRUMENT_COLORS[instr]}30`,
                      textAlign: 'left'
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: INSTRUMENT_COLORS[instr],
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                    }}>
                      {instr === 'piano' && '🎹'}
                      {instr === 'guitar' && '🎸'}
                      {instr === 'drums' && '🥁'}
                      {instr === 'bass' && '🎻'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{INSTRUMENT_NAMES[instr]}</div>
                      <div style={{ fontSize: 11, color: '#7F849C', marginTop: 2 }}>点击添加轨道</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {(showTrackDrawer || showInstrDrawer) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => { setShowTrackDrawer(false); setShowInstrDrawer(false); }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 99
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <ControlBar
        isPlaying={isPlaying}
        onPlay={play}
        onPause={pause}
        onStop={stop}
        onExport={exportProject}
        onAddTrack={() => addTrack()}
        showExportBtn={showExportBtn}
      />
    </div>
  );
};

export default App;
