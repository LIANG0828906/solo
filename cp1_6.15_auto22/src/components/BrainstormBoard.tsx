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

  const groupZonePositions = useMemo(() => {
    const zones = [];
    const startY = 150;
    const zoneWidth = 350;
    const zoneHeight = 400;
    const spacing = 80;
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
    const level1Radius = 300;
    const level2Radius = 450;

    const groupConfigs = [
      { key: 'problem', angle: -Math.PI / 2 },
      { key: 'solution', angle: Math.PI / 6 },
      { key: 'action', angle: 5 * Math.PI / 6 },
    ];

    groupConfigs.forEach(({ key, angle }) => {
      const groupNotes = groups[key].sort((a, b) => a.createdAt - b.createdAt);
      const gx = centerX + level1Radius * Math.cos(angle);
      const gy = centerY + level1Radius * Math.sin(angle);

      groupNotes.forEach((note, idx) => {
        const offsetAngle = angle + ((idx - (groupNotes.length - 1) / 2) * 0.3);
        const nx = centerX + level2Radius * Math.cos(offsetAngle);
        const ny = centerY + level2Radius * Math.sin(offsetAngle);
        positions.set(note.id, { x: nx, y: ny });
      });
    });

    groups.ungrouped.forEach((note, idx) => {
      const angle = -Math.PI / 2 + (idx + 1) * (Math.PI / (groups.ungrouped.length + 1));
      const nx = centerX + level2Radius * Math.cos(angle);
      const ny = centerY + level2Radius * Math.sin(angle);
      positions.set(note.id, { x: nx, y: ny });
    });

    return positions;
  }, [notes]);

  const handleAddNote = useCallback((content: string = '') => {
    const centerX = -offset.x / scale;
    const centerY = -offset.y / scale;

    const newNote: Note = {
      id: uuidv4(),
      content: content || '新便签',
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
    setHoverGroup(group);
  }, [moveNoteInStore, getGroupAtPosition, setHoverGroup]);

  const handleNoteDragEnd = useCallback((noteId: string, x: number, y: number, group?: string) => {
    moveNoteInStore(noteId, x, y, group);
    moveNote(roomId, noteId, x, y, group);
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

  const filteredNotes = useMemo(() => {
    return notes.map(note => ({
      note,
      isFiltered: colorFilter !== 'all' && note.color !== colorFilter,
    }));
  }, [notes, colorFilter]);

  const renderMindmapConnections = () => {
    if (viewMode !== 'mindmap') return null;

    const lines = [];
    const centerX = 0;
    const centerY = 0;
    const level1Radius = 300;

    const groupCenters = [
      { key: 'problem', angle: -Math.PI / 2, color: '#E8A0A0' },
      { key: 'solution', angle: Math.PI / 6, color: '#A0D8C0' },
      { key: 'action', angle: 5 * Math.PI / 6, color: '#A0C8E8' },
    ];

    groupCenters.forEach(({ key, angle, color }) => {
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
          strokeWidth={3}
          strokeDasharray="8,4"
          opacity={0.6}
        />
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
              strokeWidth={2}
              strokeDasharray="4,2"
              opacity={0.4}
            />
          );
        }
      });
    });

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'top left',
          width: '100%',
          height: '100%',
        }}
      >
        {lines}
        <circle cx={centerX} cy={centerY} r={60} fill="#F0E6D8" stroke="#D4C4A8" strokeWidth={2} />
        <text x={centerX} y={centerY + 6} textAnchor="middle" className="fill-gray-700 font-serif-sc font-semibold">
          💡 头脑风暴
        </text>
      </svg>
    );
  };

  return (
    <div className="w-full h-full pt-16 relative overflow-hidden">
      <div
        ref={(el) => {
          if (el) {
            boardRef.current = el;
            containerRef.current = el;
          }
        }}
        className="board-bg w-full h-full gradient-mesh-bg relative cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
        onTouchStart={handlePanStart}
        onClick={handleBoardClick}
      >
        <div className="texture-overlay absolute inset-0 pointer-events-none" />

        <div
          className="zoom-container absolute top-0 left-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'top left',
            minWidth: '2000px',
            minHeight: '2000px',
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

          {filteredNotes.map(({ note, isFiltered }) => (
            <NoteCard
              key={note.id}
              note={viewMode === 'mindmap' && mindmapPositions.has(note.id)
                ? { ...note, x: mindmapPositions.get(note.id)!.x, y: mindmapPositions.get(note.id)!.y }
                : note
              }
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
          ))}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-2 hide-on-mobile">
        <div className="flex flex-col gap-1 p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50">
          <span className="text-xs text-gray-500 text-center mb-1">新建便签颜色</span>
          {(['red', 'green', 'blue', 'yellow'] as const).map((color) => {
            const colorMap = { red: '#FFE0E0', green: '#E0F2E9', blue: '#E0ECF8', yellow: '#FFF4D6' };
            const borderMap = { red: '#E8A0A0', green: '#A0D8C0', blue: '#A0C8E8', yellow: '#E8D090' };
            return (
              <button
                key={color}
                onClick={() => setNewNoteColor(color)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                  newNoteColor === color ? 'scale-110 shadow-md' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: colorMap[color],
                  borderColor: newNoteColor === color ? borderMap[color] : 'transparent',
                }}
              />
            );
          })}
        </div>
        <button
          onClick={resetView}
          className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 text-sm text-gray-600 hover:bg-white transition-colors"
        >
          重置视图
        </button>
      </div>

      <div className="fixed bottom-6 left-6 show-on-mobile-only">
        <button
          onClick={() => handleAddNote()}
          className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl"
        >
          +
        </button>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-200/50 show-on-mobile-only">
        {(['all', 'red', 'green', 'blue'] as const).map((color) => {
          const colorMap: Record<string, string> = { all: '#CCCCCC', red: '#FFE0E0', green: '#E0F2E9', blue: '#E0ECF8' };
          return (
            <button
              key={color}
              onClick={() => useBoardStore.getState().setColorFilter(color)}
              className={`w-8 h-8 rounded-full ${colorFilter === color ? 'ring-2 ring-blue-500' : ''}`}
              style={{ backgroundColor: colorMap[color] }}
            />
          );
        })}
      </div>
    </div>
  );
};
