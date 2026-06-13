import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import Editor from './Editor';
import VersionManager from './VersionManager';
import Player from './Player';
import { Score, Note, Collaborator, VersionSnapshot, ExportProgress } from './types';

const COLLAB_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
const DEFAULT_USER_NAMES = ['小明', '小红', '小刚', '小丽', '小华', '阿强', '阿美', '小芳'];

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
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [versionLoading, setVersionLoading] = useState(false);

  const scoreIdRef = useRef<string>('default-score');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        notes: prev.notes.map(n => n.id === noteId ? {
          ...n,
          position: newPosition,
          octave: Math.floor(newPitch / 12),
          pitch: newPitch % 12
        } : n),
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

  const handleCursorUpdate = useCallback((position: number | null) => {
    if (socket) {
      socket.emit('cursor-update', {
        userId,
        position,
        roomId: scoreIdRef.current
      });
    }
  }, [socket, userId]);

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
      notes: prev.notes.map(n => n.id === noteId ? {
        ...n,
        position: newPosition,
        octave: Math.floor(newPitch / 12),
        pitch: newPitch % 12
      } : n),
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

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (!version || versionLoading) return;

    setVersionLoading(true);
    setVersionTransition(true);

    await new Promise(resolve => setTimeout(resolve, 300));

    setScore({ ...version.score, updatedAt: Date.now() });

    if (socket) {
      socket.emit('restored-version', { roomId: scoreIdRef.current, score: version.score });
    }

    await new Promise(resolve => setTimeout(resolve, 50));
    setVersionTransition(false);
    setVersionLoading(false);
  }, [versions, socket, versionLoading]);

  const generateMIDIFile = useCallback((scoreData: Score): Uint8Array => {
    const noteNames = [0, 2, 4, 5, 7, 9, 11];
    const midiNotes: Array<{ note: number; time: number; duration: number }> = [];

    scoreData.notes.forEach(n => {
      const baseNote = noteNames[n.pitch % 7] || 0;
      const octaveSemitones = n.octave * 12;
      const midiPitch = Math.min(127, Math.max(0, octaveSemitones + baseNote + 12));
      midiNotes.push({
        note: midiPitch,
        time: n.position,
        duration: n.duration
      });
    });

    const microsecondsPerBeat = Math.floor(60000000 / scoreData.tempo);

    const headerChunk = [
      0x4D, 0x54, 0x68, 0x64,
      0x00, 0x00, 0x00, 0x06,
      0x00, 0x00,
      0x00, 0x01,
      0x00, 0x60
    ];

    const trackEvents: number[] = [];

    trackEvents.push(0x00);
    trackEvents.push(0xFF, 0x51, 0x03);
    trackEvents.push((microsecondsPerBeat >> 16) & 0xFF);
    trackEvents.push((microsecondsPerBeat >> 8) & 0xFF);
    trackEvents.push(microsecondsPerBeat & 0xFF);

    midiNotes.sort((a, b) => a.time - b.time);

    let lastTime = 0;
    const activeNotes: Map<number, number> = new Map();

    midiNotes.forEach(mn => {
      const ticksPerBeat = 96;
      const eventTick = Math.floor(mn.time * ticksPerBeat);
      const endTick = Math.floor((mn.time + mn.duration) * ticksPerBeat);

      pendingOff: for (const [activeNote, activeEnd] of Array.from(activeNotes.entries())) {
        if (activeEnd <= eventTick) {
          const deltaOff = Math.max(0, activeEnd - lastTime);
          const encodedOff = encodeVariableLength(deltaOff);
          trackEvents.push(...encodedOff);
          trackEvents.push(0x80, activeNote, 0x00);
          lastTime = activeEnd;
          activeNotes.delete(activeNote);
          break pendingOff;
        }
      }

      const deltaOn = Math.max(0, eventTick - lastTime);
      const encodedOn = encodeVariableLength(deltaOn);
      trackEvents.push(...encodedOn);
      trackEvents.push(0x90, mn.note, 0x60);
      lastTime = eventTick;
      activeNotes.set(mn.note, endTick);
    });

    for (const [activeNote, activeEnd] of Array.from(activeNotes.entries())) {
      const deltaOff = Math.max(0, activeEnd - lastTime);
      const encodedOff = encodeVariableLength(deltaOff);
      trackEvents.push(...encodedOff);
      trackEvents.push(0x80, activeNote, 0x00);
      lastTime = activeEnd;
    }

    trackEvents.push(0x00, 0xFF, 0x2F, 0x00);

    const trackLength = trackEvents.length;
    const trackChunk = [
      0x4D, 0x54, 0x72, 0x6B,
      (trackLength >> 24) & 0xFF,
      (trackLength >> 16) & 0xFF,
      (trackLength >> 8) & 0xFF,
      trackLength & 0xFF,
      ...trackEvents
    ];

    return new Uint8Array([...headerChunk, ...trackChunk]);

    function encodeVariableLength(value: number): number[] {
      const buffer: number[] = [];
      let v = value & 0x0FFFFFFF;
      buffer.unshift(v & 0x7F);
      v >>= 7;
      while (v > 0) {
        buffer.unshift((v & 0x7F) | 0x80);
        v >>= 7;
      }
      return buffer;
    }
  }, []);

  const generateSVGFile = useCallback((scoreData: Score): string => {
    const width = Math.max(1400, 200 + scoreData.notes.length * 90);
    const height = 500;
    const trebleStaffTop = 130;
    const bassStaffTop = 270;
    const lineSpacing = 12;
    const paddingLeft = 100;
    const beatWidth = 80;

    const noteNamesSemitones = [0, 2, 4, 5, 7, 9, 11];
    const semitoneNames = ['C', '', 'D', '', 'E', 'F', '', 'G', '', 'A', '', 'B'];

    let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fafbff;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" rx="8"/>
  <text x="${width/2}" y="45" text-anchor="middle" font-family="'Georgia', serif" font-size="26" fill="#2a2a3e" font-weight="bold">${scoreData.title || 'Untitled Score'}</text>
  <text x="${width/2}" y="72" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#888">♩=${scoreData.tempo}   ${scoreData.timeSignature.numerator}/${scoreData.timeSignature.denominator}</text>
`;

    const drawStaff = (topY: number) => {
      let s = '';
      for (let i = 0; i < 5; i++) {
        const y = topY + i * lineSpacing;
        s += `  <line x1="${paddingLeft}" y1="${y}" x2="${width - 50}" y2="${y}" stroke="#c8c8d0" stroke-width="1" stroke-linecap="round"/>\n`;
      }
      return s;
    };

    svg += drawStaff(trebleStaffTop);
    svg += drawStaff(bassStaffTop);

    svg += `  <text x="${paddingLeft - 55}" y="${trebleStaffTop + 28}" font-family="serif" font-size="56" fill="#333">𝄞</text>\n`;
    svg += `  <text x="${paddingLeft - 55}" y="${bassStaffTop + 28}" font-family="serif" font-size="42" fill="#333">𝄢</text>\n`;

    svg += `  <text x="${paddingLeft - 12}" y="${trebleStaffTop + 18}" font-family="serif" font-size="22" font-weight="bold" fill="#555" text-anchor="middle">${scoreData.timeSignature.numerator}</text>\n`;
    svg += `  <text x="${paddingLeft - 12}" y="${trebleStaffTop + 42}" font-family="serif" font-size="22" font-weight="bold" fill="#555" text-anchor="middle">${scoreData.timeSignature.denominator}</text>\n`;
    svg += `  <text x="${paddingLeft - 12}" y="${bassStaffTop + 18}" font-family="serif" font-size="22" font-weight="bold" fill="#555" text-anchor="middle">${scoreData.timeSignature.numerator}</text>\n`;
    svg += `  <text x="${paddingLeft - 12}" y="${bassStaffTop + 42}" font-family="serif" font-size="22" font-weight="bold" fill="#555" text-anchor="middle">${scoreData.timeSignature.denominator}</text>\n`;

    const totalBeats = Math.max(32, Math.ceil(Math.max(...scoreData.notes.map(n => n.position + n.duration))));
    const beatsPerBar = scoreData.timeSignature.numerator;
    const bars = Math.ceil(totalBeats / beatsPerBar);
    for (let i = 0; i <= bars; i++) {
      const x = paddingLeft + i * beatsPerBar * beatWidth;
      if (x > width - 50) break;
      svg += `  <line x1="${x}" y1="${trebleStaffTop}" x2="${x}" y2="${trebleStaffTop + 4 * lineSpacing}" stroke="#aaa" stroke-width="1.2"/>\n`;
      svg += `  <line x1="${x}" y1="${bassStaffTop}" x2="${x}" y2="${bassStaffTop + 4 * lineSpacing}" stroke="#aaa" stroke-width="1.2"/>\n`;
    }

    scoreData.notes.forEach(note => {
      const staffTop = note.staff === 'treble' ? trebleStaffTop : bassStaffTop;
      const baseSemitone = note.staff === 'treble' ? 67 : 50;
      const semitoneOffset = (note.octave * 12 + noteNamesSemitones[note.pitch % 7]) - baseSemitone;
      const staffPositions = semitoneOffset / 2;
      const y = staffTop + 4 * lineSpacing - staffPositions * (lineSpacing / 2);
      const x = paddingLeft + note.position * beatWidth;

      const ledgerCheck = semitoneOffset > 4 || semitoneOffset < -6;
      if (ledgerCheck) {
        const ledgerLines = Math.ceil(Math.abs(semitoneOffset / 2) - 2);
        for (let i = 1; i <= ledgerLines + 2; i++) {
          let ledgerY: number;
          if (semitoneOffset > 4) {
            ledgerY = staffTop - i * lineSpacing;
            if (ledgerY > y + 2) continue;
          } else {
            ledgerY = staffTop + (4 + i) * lineSpacing;
            if (ledgerY < y - 2) continue;
          }
          if (Math.abs(ledgerY - y) < lineSpacing * 0.6) {
            svg += `  <line x1="${x - 12}" y1="${ledgerY}" x2="${x + 12}" y2="${ledgerY}" stroke="#888" stroke-width="1"/>\n`;
          }
        }
      }

      const noteFill = note.duration >= 2 ? '#ffffff' : '#2a2a3e';
      const noteStroke = '#2a2a3e';
      const stemUp = y > staffTop + 2 * lineSpacing;
      const stemX = stemUp ? x - 8 : x + 8;

      svg += `  <ellipse cx="${x}" cy="${y}" rx="8" ry="6" transform="rotate(-18 ${x} ${y})" fill="${noteFill}" stroke="${noteStroke}" stroke-width="1.5"/>\n`;

      if (note.duration < 4) {
        const stemTop = stemUp ? y - 38 : y + 38;
        svg += `  <line x1="${stemX}" y1="${y}" x2="${stemX}" y2="${stemTop}" stroke="#2a2a3e" stroke-width="1.8" stroke-linecap="round"/>\n`;

        if (note.duration < 1) {
          const flags = note.duration <= 0.25 ? 2 : 1;
          for (let f = 0; f < flags; f++) {
            const flagBaseY = stemUp ? stemTop + f * 11 : stemTop - f * 11;
            const curveX1 = stemX;
            const curveY1 = flagBaseY;
            const curveX2 = stemX + (stemUp ? 16 : -16);
            const curveY2 = flagBaseY + (stemUp ? 5 : -5);
            const curveX3 = stemX + (stemUp ? 10 : -10);
            const curveY3 = flagBaseY + (stemUp ? 18 : -18);
            svg += `  <path d="M${curveX1},${curveY1} Q${curveX2},${curveY2} ${curveX3},${curveY3}" fill="none" stroke="#2a2a3e" stroke-width="1.8" stroke-linecap="round"/>\n`;
          }
        }
      }

      const noteLetter = semitoneNames[noteNamesSemitones[note.pitch % 7]];
      if (noteLetter) {
        svg += `  <text x="${x + 2}" y="${y + staffTop + 70}" font-family="sans-serif" font-size="9" fill="#bbb" text-anchor="middle">${noteLetter}${note.octave}</text>\n`;
      }
    });

    svg += `</svg>`;
    return svg;
  }, []);

  const handleExportMIDI = useCallback(() => {
    if (!score) return;
    setExportProgress({ type: 'midi', progress: 0, done: false });

    let progress = 0;
    let time = 0;
    const step = 16;
    const totalTime = 1200;

    const interval = setInterval(() => {
      time += step;
      const t = Math.min(1, time / totalTime);
      progress = Math.min(100, 100 * (1 - Math.pow(1 - t, 2.5)));

      if (progress >= 100 || time >= totalTime) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setExportProgress(prev => prev ? { ...prev, done: true, progress: 100 } : null);
          setTimeout(() => {
            const midiContent = generateMIDIFile(score);
            const blob = new Blob([midiContent], { type: 'audio/midi' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(score.title || 'score').replace(/[^\w\u4e00-\u9fa5-]/g, '_')}.mid`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setTimeout(() => setExportProgress(null), 600);
          }, 400);
        }, 200);
      }
      setExportProgress(prev => prev ? { ...prev, progress } : null);
    }, step);
  }, [score, generateMIDIFile]);

  const handleExportSVG = useCallback(() => {
    if (!score) return;
    setExportProgress({ type: 'svg', progress: 0, done: false });

    let progress = 0;
    let time = 0;
    const step = 12;
    const totalTime = 1000;

    const interval = setInterval(() => {
      time += step;
      const t = Math.min(1, time / totalTime);
      progress = Math.min(100, 100 * (1 - Math.pow(1 - t, 2)));

      if (progress >= 100 || time >= totalTime) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setExportProgress(prev => prev ? { ...prev, done: true, progress: 100 } : null);
          setTimeout(() => {
            const svgContent = generateSVGFile(score);
            const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(score.title || 'score').replace(/[^\w\u4e00-\u9fa5-]/g, '_')}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setTimeout(() => setExportProgress(null), 600);
          }, 400);
        }, 200);
      }
      setExportProgress(prev => prev ? { ...prev, progress } : null);
    }, step);
  }, [score, generateSVGFile]);

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
            {allCollaborators.slice(0, 6).map((c, idx) => (
              <div
                key={c.id}
                style={{
                  ...styles.avatar,
                  backgroundColor: c.color,
                  marginLeft: idx === 0 ? 0 : -8,
                  zIndex: 100 - idx
                }}
                title={c.name + (c.id === userId ? ' (你)' : '')}
              >
                {c.name.charAt(0)}
              </div>
            ))}
            {allCollaborators.length > 6 && (
              <div style={{ ...styles.avatar, backgroundColor: '#666', marginLeft: -8, zIndex: 1 }}>
                +{allCollaborators.length - 6}
              </div>
            )}
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            style={{
              ...styles.saveBtn,
              ...(versionLoading ? { opacity: 0.6, pointerEvents: 'none' } : {})
            }}
            onClick={() => handleSaveVersion('手动保存')}
          >
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
            transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)'
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
              onCursorUpdate={handleCursorUpdate}
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
                  { key: 'whole', label: '𝅝', name: '全音符 (4拍)' },
                  { key: 'half', label: '𝅗𝅥', name: '二分音符 (2拍)' },
                  { key: 'quarter', label: '♩', name: '四分音符 (1拍)' },
                  { key: 'eighth', label: '♪', name: '八分音符 (½拍)' },
                  { key: 'sixteenth', label: '𝅘𝅥𝅯', name: '十六分音符 (¼拍)' }
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
              <div style={styles.selectedToolLabel}>
                当前：
                <strong style={{ color: '#4a9eff' }}>
                  {({
                    whole: '全音符 (4拍)',
                    half: '二分音符 (2拍)',
                    quarter: '四分音符 (1拍)',
                    eighth: '八分音符 (½拍)',
                    sixteenth: '十六分音符 (¼拍)'
                  } as Record<string, string>)[selectedTool] || '四分音符'}
                </strong>
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
                  𝄞 高音谱
                </button>
                <button
                  style={{
                    ...styles.staffBtn,
                    ...(selectedStaff === 'bass' ? styles.staffBtnSelected : {})
                  }}
                  onClick={() => setSelectedStaff('bass')}
                >
                  𝄢 低音谱
                </button>
              </div>
            </div>

            <VersionManager
              versions={versions}
              onRestore={handleRestoreVersion}
              isLoading={versionLoading}
            />

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📤 导出</h3>
              <div style={styles.exportBtns}>
                <button style={styles.exportBtn} onClick={handleExportMIDI}>
                  <span>🎵</span>
                  <span style={{ marginLeft: 8 }}>导出 MIDI 文件</span>
                </button>
                <button style={styles.exportBtn} onClick={handleExportSVG}>
                  <span>🖼️</span>
                  <span style={{ marginLeft: 8 }}>导出 SVG 图片</span>
                </button>
              </div>
              <div style={styles.exportHint}>
                支持标准MIDI 1.0格式和矢量SVG图片
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
            <div style={{
              fontSize: 40,
              marginBottom: 16
            }}>
              {exportProgress.type === 'midi' ? '🎵' : '🖼️'}
            </div>
            <h4 style={{ color: '#fff', marginBottom: 8, fontSize: 18 }}>
              正在导出{exportProgress.type === 'midi' ? 'MIDI' : 'SVG'}文件
            </h4>
            <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24, fontSize: 13 }}>
              {exportProgress.done ? '导出完成！' : '请稍候...'}
            </div>
            <div style={styles.progressBarBg}>
              <div
                style={{
                  ...styles.progressBarFill,
                  width: `${exportProgress.progress}%`,
                  transition: 'width 40ms ease-out'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 10,
              color: 'rgba(255,255,255,0.7)',
              fontSize: 13,
              fontFamily: 'monospace'
            }}>
              <span>{Math.floor(exportProgress.progress)}%</span>
              {exportProgress.done && (
                <span style={{ color: '#4ECDC4', fontWeight: 600 }}>✓ 完成</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f0f2f5'
  },
  header: {
    height: 64,
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    zIndex: 10
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 0
  },
  logo: {
    fontSize: 30,
    flexShrink: 0
  },
  titleInput: {
    fontSize: 17,
    fontWeight: 600,
    border: 'none',
    outline: 'none',
    padding: '7px 14px',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    minWidth: 180,
    transition: 'all 0.2s ease',
    border: '1px solid transparent'
  },
  collaboratorAvatars: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    border: '2px solid #fff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0
  },
  saveBtn: {
    padding: '9px 18px',
    background: 'linear-gradient(135deg, #4a9eff, #6b8eff)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(74, 158, 255, 0.3)',
    transition: 'all 0.2s ease'
  },
  mobileToggle: {
    padding: 10,
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 20,
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
    width: 360,
    backgroundColor: '#2a2a3e',
    borderRadius: '12px 0 0 0',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)'
  },
  sidebarMobileOpen: {
    position: 'fixed',
    right: 0,
    top: 64,
    bottom: 0,
    zIndex: 100,
    width: '100%',
    maxWidth: 380,
    borderRadius: '12px 0 0 0'
  },
  sidebarContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 20px 0 20px'
  },
  section: {
    marginBottom: 28
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    letterSpacing: 0.3
  },
  noteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10
  },
  noteBtn: {
    padding: '14px 8px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '2px solid transparent',
    borderRadius: 12,
    cursor: 'pointer',
    color: '#fff',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  noteBtnSelected: {
    borderColor: '#4a9eff',
    boxShadow: '0 0 10px rgba(74, 158, 255, 0.5), inset 0 0 15px rgba(74, 158, 255, 0.15)',
    backgroundColor: 'rgba(74, 158, 255, 0.18)',
    transform: 'translateY(-1px)'
  },
  noteIcon: {
    fontSize: 28,
    lineHeight: 1
  },
  selectedToolLabel: {
    marginTop: 12,
    padding: '8px 12px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)'
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
    borderRadius: 12,
    cursor: 'pointer',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.2s ease'
  },
  staffBtnSelected: {
    borderColor: '#4a9eff',
    boxShadow: '0 0 10px rgba(74, 158, 255, 0.4)',
    backgroundColor: 'rgba(74, 158, 255, 0.15)'
  },
  exportBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  exportBtn: {
    padding: '13px 16px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    cursor: 'pointer',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center'
  },
  exportHint: {
    marginTop: 10,
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center'
  },
  mobileOverlay: {
    position: 'fixed',
    top: 64,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(2px)',
    zIndex: 99
  },
  exportProgressOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  exportProgressBox: {
    background: 'linear-gradient(160deg, #2a2a3e 0%, #3a3a54 100%)',
    padding: '40px 48px',
    borderRadius: 20,
    minWidth: 340,
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 5,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4a9eff 0%, #7c3aed 50%, #a855f7 100%)',
    borderRadius: 5
  }
};

export default App;
