import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { NoteCard } from './NoteCard';
import { GroupZone } from './GroupZone';
import { usePanZoom } from '../hooks/useDrag';
import { useBoardStore } from '../store/useBoardStore';
import { GROUP_ZONES } from '../utils/types';
import type { Note, User } from '../utils/types';
import {
  addNote,
  moveNote,
  updateNote,
  deleteNote,
  voteNote,
} from '../utils/socket';

interface BrainstormBoardProps {
  currentUser: User;
  roomId: string;
}

export const BrainstormBoard: React.FC<BrainstormBoardProps> = ({ currentUser, roomId }) => {
  const {
    notes,
    colorFilter,
    viewMode,
    scale,
    offset,
    hoverGroup,
    setScale,
    setOffset,
    setDragNoteId,
    setHoverGroup,
    addNote: addNoteToStore,
    updateNote: updateNoteInStore,
    deleteNote: deleteNoteFromStore,
    moveNote: moveNoteInStore,
    updateNoteVotes,
  } = useBoardStore();

  const boardRef = useRef<HTMLDivElement>(null);
  const [newNoteColor, setNewNoteColor] = useState<Note['color']>('yellow');
  const [viewModeAnimating, setViewModeAnimating] = useState(false);
  const [prevPositions, setPrevPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [justSwitchedView, setJustSwitchedView] = useState(false);
  const groupZoneRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const {
    containerRef,
    handleWheel,
    handlePanStart,
    resetView,
  } = usePanZoom({
    onPan: setOffset,
    onZoom: setScale,
  });

  useEffect(() => {
    setScale(scale);
    setOffset(offset);
  }, []);

  useEffect(() => {
    setViewModeAnimating(true);
    setJustSwitchedView(true);
    const timer = setTimeout(() => {
      setViewModeAnimating(false);
      setJustSwitchedView(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [viewMode]);

  const groupZonePositions = useMemo(() => {
    const zones = [];
    const startY = 180;
    const zoneWidth = 360;
    const zoneHeight = 420;
    const spacing = 60;
    const totalWidth = GROUP_ZONES.length * zoneWidth + (GROUP_ZONES.length - 1) * spacing;
    const startX = -totalWidth / 2 + zoneWidth / 2;

    for (let i = 0; i < GROUP_ZONES.length; i++) {
      zones.push({
        ...GROUP_ZONES[i],
        x: startX + i * (zoneWidth + spacing),
        y: startY,
        width: zoneWidth,
        height: zoneHeight,
      });
    }
    return zones;
  }, []);

  const getGroupAtPosition = useCallback((x: number, y: number): string | undefined => {
    for (const zone of groupZonePositions) {
      const left = zone.x - zone.width / 2;
      const right = zone.x + zone.width / 2;
      const top = zone.y - zone.height / 2;
      const bottom = zone.y + zone.height / 2;

      if (x >= left && x <= right && y >= top && y <= bottom) {
        return zone.id;
      }
    }
    return undefined;
  }, [groupZonePositions]);

  const mindmapPositions = useMemo(() => {
    const positions: Map<string, { x: number; y: number }> = new Map();

    const groups: Record<string, Note[]> = {
      problem: [],
      solution: [],
      action: [],
      ungrouped: [],
    };

    notes.forEach(note => {
      const key = note.group || 'ungrouped';
      if (groups[key]) {
        groups[key].push(note);
      } else {
        groups.ungrouped.push(note);
      }
    });

    const centerX = 0;
    const centerY = 0;
    const level1Radius = 320;
    const level2Radius = 520;

    const groupConfigs = [
      { key: 'problem', angle: -Math.PI / 2 },
      { key: 'solution', angle: Math.PI / 5 },
      { key: 'action', angle: 4 * Math.PI / 5 },
    ];

    groupConfigs.forEach(({ key, angle }) => {
      const groupNotes = groups[key].sort((a, b) => a.createdAt - b.createdAt);
      const gx = centerX + level1Radius * Math.cos(angle);
      const gy = centerY + level1Radius * Math.sin(angle);

      groupNotes.forEach((note, idx) => {
        const step = 0.35;
        const offsetAngle = angle + ((idx - (groupNotes.length - 1) / 2) * step);
        const nx = gx + level2Radius * 0.6 * Math.cos(offsetAngle);
        const ny = gy + level2Radius * 0.6 * Math.sin(offsetAngle);
        positions.set(note.id, { x: nx, y: ny });
      });
    });

    groups.ungrouped.forEach((note, idx) => {
      const totalUngrouped = groups.ungrouped.length;
      const angleStep = Math.PI * 0.8 / Math.max(totalUngrouped + 1, 1);
      const startAngle = -Math.PI * 0.9;
      const angle = startAngle + (idx + 1) * angleStep;
      const radius = level2Radius * 0.5;
      const nx = centerX + radius * Math.cos(angle);
      const ny = centerY + level2Radius * 0.55 + radius * Math.sin(angle) * 0.5;
      positions.set(note.id, { x: nx, y: ny });
    });

    return positions;
  }, [notes]);

  useEffect(() => {
    const newPositions = new Map<string, { x: number; y: number }>();
    notes.forEach(note => {
      newPositions.set(note.id, { x: note.x, y: note.y });
    });
    setPrevPositions(newPositions);
  }, [notes.length]);

  const handleAddNote = useCallback((content: string = '') => {
    const centerX = -offset.x / scale;
    const centerY = -offset.y / scale;

    const newNote: Note = {
      id: uuidv4(),
      content: content || '',
      color: newNoteColor,
      x: centerX + (Math.random() - 0.5) * 200,
      y: centerY + (Math.random() - 0.5) * 200,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      votes: [],
      createdAt: Date.now(),
    };

    addNoteToStore(newNote);
    addNote(roomId, newNote);
  }, [currentUser, roomId, offset, scale, newNoteColor, addNoteToStore]);

  const handleNoteDragStart = useCallback((noteId: string) => {
    setDragNoteId(noteId);
  }, [setDragNoteId]);

  const handleNoteDrag = useCallback((noteId: string, x: number, y: number) => {
    moveNoteInStore(noteId, x, y);

    const group = getGroupAtPosition(x, y);
    setHoverGroup(group ?? null);
  }, [moveNoteInStore, getGroupAtPosition, setHoverGroup]);

  const handleNoteDragEnd = useCallback((noteId: string, x: number, y: number, group?: string) => {
    const typedGroup = group as Note['group'];
    moveNoteInStore(noteId, x, y, typedGroup);
    moveNote(roomId, noteId, x, y, typedGroup);
    setDragNoteId(null);
    setHoverGroup(null);
  }, [roomId, moveNoteInStore, setDragNoteId, setHoverGroup]);

  const handleNoteUpdate = useCallback((noteId: string, updates: Partial<Note>) => {
    updateNoteInStore(noteId, updates);
    updateNote(roomId, noteId, updates);
  }, [roomId, updateNoteInStore]);

  const handleNoteDelete = useCallback((noteId: string) => {
    deleteNoteFromStore(noteId);
    deleteNote(roomId, noteId);
  }, [roomId, deleteNoteFromStore]);

  const handleNoteVote = useCallback((noteId: string) => {
    voteNote(roomId, noteId, currentUser.id);
  }, [roomId, currentUser.id]);

  const handleBoardClick = useCallback((e: React.MouseEvent) => {
    if (e.target === boardRef.current || (e.target as HTMLElement).classList.contains('board-bg')) {
      const rect = boardRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - offset.x) / scale;
        const y = (e.clientY - rect.top - offset.y) / scale;
        const group = getGroupAtPosition(x, y);

        if (group) {
          const newNote: Note = {
            id: uuidv4(),
            content: '',
            color: group === 'problem' ? 'red' : group === 'solution' ? 'green' : 'blue',
            x,
            y,
            group: group as Note['group'],
            authorId: currentUser.id,
            authorName: currentUser.name,
            authorAvatar: currentUser.avatar,
            votes: [],
            createdAt: Date.now(),
          };
          addNoteToStore(newNote);
          addNote(roomId, newNote);
        }
      }
    }
  }, [currentUser, roomId, offset, scale, getGroupAtPosition, addNoteToStore]);

  const processedNotes = useMemo(() => {
    return notes.map(note => {
      const basePosition = { x: note.x, y: note.y };
      const mindmapPos = mindmapPositions.get(note.id);

      const targetPosition = viewMode === 'mindmap' && mindmapPos
        ? mindmapPos
        : basePosition;

      const isFiltered = colorFilter !== 'all' && note.color !== colorFilter;

      const flyStyle = justSwitchedView && prevPositions.has(note.id)
        ? {
            '--from-x': `${prevPositions.get(note.id)!.x}px`,
            '--from-y': `${prevPositions.get(note.id)!.y}px`,
            '--to-x': `${targetPosition.x}px`,
            '--to-y': `${targetPosition.y}px`,
          } as React.CSSProperties
        : {};

      return {
        note: {
          ...note,
          x: targetPosition.x,
          y: targetPosition.y,
        },
        isFiltered,
        flyStyle,
        useFlyAnimation: justSwitchedView,
      };
    });
  }, [notes, mindmapPositions, viewMode, colorFilter, prevPositions, justSwitchedView]);

  const renderMindmapConnections = () => {
    if (viewMode !== 'mindmap') return null;

    const lines: React.ReactNode[] = [];
    const centerX = 0;
    const centerY = 0;
    const level1Radius = 320;

    const groupCenters = [
      { key: 'problem', angle: -Math.PI / 2, color: '#E8A0A0', label: '❓ 问题' },
      { key: 'solution', angle: Math.PI / 5, color: '#A0D8C0', label: '💡 方案' },
      { key: 'action', angle: 4 * Math.PI / 5, color: '#A0C8E8', label: '✅ 行动' },
    ];

    groupCenters.forEach(({ key, angle, color, label }) => {
      const gx = centerX + level1Radius * Math.cos(angle);
      const gy = centerY + level1Radius * Math.sin(angle);

      lines.push(
        <line
          key={`center-${key}`}
          x1={centerX}
          y1={centerY}
          x2={gx}
          y2={gy}
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          className="mindmap-line connection-line"
          opacity={0.75}
        />
      );

      lines.push(
        <g key={`group-center-${key}`} className="mindmap-line">
          <rect
            x={gx - 50}
            y={gy - 22}
            width={100}
            height={44}
            rx={22}
            fill={color}
            fillOpacity={0.3}
            stroke={color}
            strokeWidth={2.5}
          />
          <text
            x={gx}
            y={gy + 6}
            textAnchor="middle"
            fill="#444"
            fontSize="15"
            fontWeight="600"
            fontFamily="'Noto Sans SC', sans-serif"
          >
            {label}
          </text>
        </g>
      );

      const groupNotes = notes.filter(n => n.group === key);
      groupNotes.forEach(note => {
        const pos = mindmapPositions.get(note.id);
        if (pos) {
          lines.push(
            <line
              key={`${key}-${note.id}`}
              x1={gx}
              y1={gy}
              x2={pos.x}
              y2={pos.y}
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              className="mindmap-line connection-line"
              opacity={0.55}
            />
          );
        }
      });
    });

    return (
      <svg
        className="absolute pointer-events-none"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'top left',
          width: '3000px',
          height: '3000px',
          left: '-1000px',
          top: '-1000px',
          overflow: 'visible',
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {lines}
        <g filter="url(#glow)">
          <circle cx={centerX} cy={centerY} r={75} fill="#F0E6D8" stroke="#C8B090" strokeWidth={3} />
        </g>
        <text
          x={centerX}
          y={centerY - 8}
          textAnchor="middle"
          fill="#666"
          fontSize="14"
          fontWeight="500"
          fontFamily="'Noto Serif SC', serif"
        >
          🎯
        </text>
        <text
          x={centerX}
          y={centerY + 16}
          textAnchor="middle"
          fill="#444"
          fontSize="18"
          fontWeight="700"
          fontFamily="'Noto Serif SC', serif"
        >
          头脑风暴
        </text>
      </svg>
    );
  };

  const setRefs = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      (boardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    }
  }, []);

  return (
    <div className="w-full h-full pt-16 relative overflow-hidden">
      <div
        ref={setRefs}
        className="board-bg w-full h-full gradient-mesh-bg relative cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
        onTouchStart={handlePanStart}
        onClick={handleBoardClick}
      >
        <div className="texture-overlay absolute inset-0 pointer-events-none" />

        <div
          className={`zoom-container absolute top-0 left-0 ${viewModeAnimating ? 'transition-all duration-700 ease-out' : ''}`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'top left',
            minWidth: '3000px',
            minHeight: '3000px',
            left: '-1000px',
            top: '-1000px',
          }}
        >
          {viewMode === 'free' && groupZonePositions.map((zone) => (
            <GroupZone
              key={zone.id}
              zone={zone}
              style={{
                left: zone.x - zone.width / 2,
                top: zone.y - zone.height / 2,
                width: zone.width,
                height: zone.height,
              }}
              isHovered={hoverGroup === zone.id}
              notesInZone={notes.filter(n => n.group === zone.id)}
              onMouseEnter={() => setHoverGroup(zone.id)}
              onMouseLeave={() => setHoverGroup(null)}
            />
          ))}

          {renderMindmapConnections()}

          {processedNotes.map(({ note, isFiltered, flyStyle, useFlyAnimation }) => (
            <div
              key={`wrapper-${note.id}`}
              className={useFlyAnimation ? 'note-fly' : ''}
              style={{
                position: 'absolute',
                ...flyStyle,
              }}
            >
              <NoteCard
                key={note.id}
                note={note}
                scale={scale}
                currentUserId={currentUser.id}
                isFiltered={isFiltered}
                onDragStart={handleNoteDragStart}
                onDrag={handleNoteDrag}
                onDragEnd={handleNoteDragEnd}
                onUpdate={handleNoteUpdate}
                onDelete={handleNoteDelete}
                onVote={handleNoteVote}
                getGroupAtPosition={viewMode === 'free' ? getGroupAtPosition : undefined}
                isMindmapMode={viewMode === 'mindmap'}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 hide-on-mobile z-40">
        <div className="flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/60">
          <span className="text-xs text-gray-500 text-center font-medium mb-1">🎨 便签颜色</span>
          {(['red', 'green', 'blue', 'yellow'] as const).map((color) => {
            const colorMap = { red: '#FFE0E0', green: '#E0F2E9', blue: '#E0ECF8', yellow: '#FFF4D6' };
            const borderMap = { red: '#E8A0A0', green: '#A0D8C0', blue: '#A0C8E8', yellow: '#E8D090' };
            const labels = { red: '问题', green: '方案', blue: '行动', yellow: '其他' };
            return (
              <button
                key={color}
                onClick={() => setNewNoteColor(color)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
                  newNoteColor === color ? 'scale-105 shadow-md' : 'opacity-70 hover:opacity-100 hover:scale-[1.02]'
                }`}
                style={{
                  backgroundColor: colorMap[color],
                  borderColor: newNoteColor === color ? borderMap[color] : 'transparent',
                }}
                title={`${labels[color]}便签`}
              >
                <span
                  className="w-4 h-4 rounded-full shadow-inner"
                  style={{ backgroundColor: borderMap[color] }}
                />
                <span className="text-xs font-medium text-gray-700">{labels[color]}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={resetView}
          className="px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 text-sm font-medium text-gray-600 hover:bg-white hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <span>🔄</span>
          重置视图
        </button>
      </div>

      <div className="fixed bottom-6 left-6 show-on-mobile-only z-40">
        <button
          onClick={() => handleAddNote()}
          className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center text-3xl active:scale-95 transition-transform"
        >
          +
        </button>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-gray-200/60 show-on-mobile-only z-40">
        {(['all', 'red', 'green', 'blue'] as const).map((color) => {
          const colorMap: Record<string, string> = {
            all: '#888888',
            red: '#E8A0A0',
            green: '#A0D8C0',
            blue: '#A0C8E8',
          };
          const bgMap: Record<string, string> = {
            all: '#F0F0F0',
            red: '#FFE0E0',
            green: '#E0F2E9',
            blue: '#E0ECF8',
          };
          return (
            <button
              key={color}
              onClick={() => useBoardStore.getState().setColorFilter(color)}
              className={`w-10 h-10 rounded-full transition-all duration-200 ${
                colorFilter === color
                  ? 'ring-4 ring-blue-300 scale-110 shadow-lg'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: bgMap[color],
                border: `3px solid ${colorMap[color]}`,
              }}
            />
          );
        })}
      </div>

      {viewModeAnimating && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="px-5 py-2.5 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-gray-200/60">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              {viewMode === 'mindmap' ? '✨ 正在切换到思维导图模式...' : '📋 正在切换到自由布局模式...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
