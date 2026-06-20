import React, { useEffect, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Toolbar } from '../components/Toolbar';
import { BrainstormBoard } from '../components/BrainstormBoard';
import { MobileNoteList } from '../components/MobileNoteList';
import { useBoardStore } from '../store/useBoardStore';
import { useUserIdentity } from '../hooks/useUserIdentity';
import {
  initSocket,
  joinRoom,
  addNote,
  updateNote,
  deleteNote,
  moveNote,
  voteNote,
  registerSocketEvents,
  disconnectSocket,
} from '../utils/socket';
import { v4 as uuidv4 } from 'uuid';
import type { Note, RoomState } from '../utils/types';

const DEFAULT_ROOM_ID = 'default-room';

export default function Home() {
  const { roomId: paramRoomId } = useParams<{ roomId: string }>();
  const { user, regenerateUser } = useUserIdentity();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    roomId,
    notes,
    users,
    colorFilter,
    viewMode,
    scale,
    setRoomId,
    setCurrentUser,
    setNotes,
    setUsers,
    addNote: addNoteToStore,
    updateNote: updateNoteInStore,
    deleteNote: deleteNoteFromStore,
    moveNote: moveNoteInStore,
    updateNoteVotes,
    addUser,
    removeUser,
    setViewMode,
    setColorFilter,
    setScale,
    setOffset,
  } = useBoardStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const id = paramRoomId || DEFAULT_ROOM_ID;
    setRoomId(id);
  }, [paramRoomId, setRoomId]);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user, setCurrentUser]);

  useEffect(() => {
    if (!user || !roomId) return;

    const socket = initSocket();

    const onConnect = () => {
      setIsSocketConnected(true);
      joinRoom(roomId, user);
    };

    const onDisconnect = () => {
      setIsSocketConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      onConnect();
    }

    const unregister = registerSocketEvents({
      onRoomState: (state: RoomState) => {
        setNotes(state.notes);
        setUsers(state.users);
      },
      onNoteAdded: ({ note }: { note: Note }) => {
        addNoteToStore(note);
      },
      onNoteUpdated: ({ noteId, updates }: { noteId: string; updates: Partial<Note> }) => {
        updateNoteInStore(noteId, updates);
      },
      onNoteDeleted: ({ noteId }: { noteId: string }) => {
        deleteNoteFromStore(noteId);
      },
      onNoteMoved: ({ noteId, x, y, group }: { noteId: string; x: number; y: number; group?: string }) => {
        const typedGroup = group as Note['group'];
        moveNoteInStore(noteId, x, y, typedGroup);
      },
      onNoteVoted: ({ noteId, votes }: { noteId: string; votes: string[]; userId: string }) => {
        updateNoteVotes(noteId, votes);
      },
      onUserJoined: ({ user: joinedUser }: { user: Note['authorId'] extends infer _ ? any : never }) => {
        addUser(joinedUser);
      },
      onUserLeft: ({ userId }: { userId: string }) => {
        removeUser(userId);
      },
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      unregister();
      disconnectSocket();
    };
  }, [user, roomId, setNotes, setUsers, addNoteToStore, updateNoteInStore, deleteNoteFromStore, moveNoteInStore, updateNoteVotes, addUser, removeUser]);

  const handleAddNote = useCallback((content?: string) => {
    if (!user) return;

    const state = useBoardStore.getState();
    const centerX = -state.offset.x / state.scale;
    const centerY = -state.offset.y / state.scale;

    const newNote: Note = {
      id: uuidv4(),
      content: content || '',
      color: 'yellow',
      x: centerX + (Math.random() - 0.5) * 300,
      y: centerY + (Math.random() - 0.5) * 200,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      votes: [],
      createdAt: Date.now(),
    };

    addNoteToStore(newNote);
    addNote(roomId, newNote);
  }, [user, roomId, addNoteToStore]);

  const handleAddNoteMobile = useCallback((color: Note['color'], content: string) => {
    if (!user) return;

    const newNote: Note = {
      id: uuidv4(),
      content,
      color,
      x: Math.random() * 1000 - 500,
      y: Math.random() * 1000 - 500,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      votes: [],
      createdAt: Date.now(),
    };

    addNoteToStore(newNote);
    addNote(roomId, newNote);
  }, [user, roomId, addNoteToStore]);

  const handleNoteUpdate = useCallback((noteId: string, updates: Partial<Note>) => {
    updateNoteInStore(noteId, updates);
    updateNote(roomId, noteId, updates);
  }, [roomId, updateNoteInStore]);

  const handleNoteDelete = useCallback((noteId: string) => {
    deleteNoteFromStore(noteId);
    deleteNote(roomId, noteId);
  }, [roomId, deleteNoteFromStore]);

  const handleNoteVote = useCallback((noteId: string) => {
    if (!user) return;
    voteNote(roomId, noteId, user.id);
  }, [user, roomId]);

  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(scale + 0.1, 2);
    setScale(newScale);
  }, [scale, setScale]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(scale - 0.1, 0.3);
    setScale(newScale);
  }, [scale, setScale]);

  const handleResetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [setScale, setOffset]);

  if (!user) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F8F5F0]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Toolbar
        currentUser={user}
        users={users}
        roomId={roomId}
        colorFilter={colorFilter}
        viewMode={viewMode}
        scale={scale}
        notes={notes}
        onColorFilterChange={setColorFilter}
        onViewModeChange={setViewMode}
        onAddNote={() => handleAddNote()}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />

      {!isSocketConnected && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg shadow-md">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            正在连接服务器...
          </p>
        </div>
      )}

      {isMobile ? (
        <MobileNoteList
          notes={notes}
          currentUser={user}
          colorFilter={colorFilter}
          onColorFilterChange={setColorFilter}
          onAddNote={handleAddNoteMobile}
          onUpdateNote={handleNoteUpdate}
          onDeleteNote={handleNoteDelete}
          onVoteNote={handleNoteVote}
        />
      ) : (
        <BrainstormBoard
          currentUser={user}
          roomId={roomId}
        />
      )}
    </div>
  );
}
